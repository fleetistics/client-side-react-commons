import type { Middleware, MiddlewareAPI, UnknownAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { apiSlice, notifyAuthLost } from '../core/apiSlice';
import {
  getOfflineMutation,
  type ArgsOf,
  type MutationEndpointLike,
  type OptimisticRecipe,
  type OutboxDispatch,
  type RegisteredOfflineMutation,
  type ResultOf,
} from './offlineMutation';
import { outboxHydrated, outboxItemsSet, type OutboxState } from './outboxSlice';
import type { OutboxItem, OutboxPlatform } from './outboxTypes';

const STORAGE_KEY = 'outbox.v1';
const RETRY_BASE_MS = 5_000;
const RETRY_MAX_MS = 120_000;
// A 5xx is retried this many times (so 1 + 4 sends), then the item is dropped and logged.
const MAX_SERVER_ERROR_RETRIES = 4;
// After a 401 (session gone) the item is left alone this long; see the 'auth' case in sendPass.
const AUTH_PARK_MS = 30_000;

type OutboxStoreApi = MiddlewareAPI<OutboxDispatch, { outbox: OutboxState }>;

// How a failed send is treated (offline mode resends until the server decides):
//  network   - no response at all (offline, DNS, timeout): keep pending, stop this pass (every
//              other item would fail the same way), resend endlessly - with backoff, or at the
//              next sign of connectivity.
//  transient - the server can't take it right now (408, 429): keep pending, hold back its
//              entityKeys, resend endlessly with backoff.
//  server    - 5xx: keep pending and back off, but only MAX_SERVER_ERROR_RETRIES times; then the
//              item is dropped from the queue (and logged), since the server keeps failing on it.
//  auth      - 401 (apiSlice already tried a token refresh): the session is gone, so call
//              notifyAuthLost() - the handler registered with setOnAuthLost sends the UI to login.
//              Nothing waits for "the same user" to return: logging in clears the queue
//              (clearOutbox). The item just stays queued, parked so it isn't hammered, and the
//              pass stops; if the session turns out to be fine, a later successful request resends it.
//  permanent - any other answer (4xx, unparsable response): mark failed, keep for the UI.
type FailureKind = 'network' | 'transient' | 'server' | 'auth' | 'permanent';

function classifyError(error: unknown): FailureKind {
  const status = (error as { status?: unknown } | undefined)?.status;
  if (status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR') return 'network';
  if (typeof status === 'number') {
    if (status === 401) return 'auth';
    if (status >= 500) return 'server';
    return status === 408 || status === 429 ? 'transient' : 'permanent';
  }
  return 'permanent';
}

function describeError(error: unknown): string {
  const e = error as { status?: unknown; error?: unknown; data?: unknown; message?: unknown } | undefined;
  if (e?.status !== undefined) return `${String(e.status)}${e.error ? `: ${String(e.error)}` : ''}`;
  return e?.message ? String(e.message) : String(error);
}

/**
 * RTK reports a 2xx whose body isn't JSON (plain "OK", say) as PARSING_ERROR. The server did
 * accept the call, so it counts as a success - with no result to hand on.
 */
function isAcceptedButUnparsable(error: unknown): boolean {
  const e = error as { status?: unknown; originalStatus?: unknown } | undefined;
  return (
    e?.status === 'PARSING_ERROR' &&
    typeof e.originalStatus === 'number' &&
    e.originalStatus >= 200 &&
    e.originalStatus < 300
  );
}

async function unwrapAccepted(request: { unwrap(): Promise<unknown> }): Promise<unknown> {
  try {
    return await request.unwrap();
  } catch (error) {
    if (isAcceptedButUnparsable(error)) return undefined;
    throw error;
  }
}

const sameKeys = (a: string[], b: string[]) => a.length === b.length && a.every((k) => b.includes(k));
const sameQueryArgs = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** "UserLocationPrivacy:ME" -> { type: 'UserLocationPrivacy', id: 'ME' }; "User:42" -> id 42. */
function entityKeyToTag(key: string) {
  const idx = key.indexOf(':');
  if (idx < 0) return key;
  const id = key.slice(idx + 1);
  return { type: key.slice(0, idx), id: /^\d+$/.test(id) ? Number(id) : id };
}

/**
 * The offline-first queue ("outbox") for one Redux store. Offline-first calls are persisted
 * before anything else happens, shown immediately through their optimistic recipes, and then
 * replayed through the normal RTK Query mutation - so auth refresh, retry and tracing all apply.
 */
export class Outbox {
  readonly middleware: Middleware;

  constructor() {
    // Resolves once the saved queue is loaded (or at once in online mode). Everything that
    // reads or writes the item list waits for it, so nothing overwrites the saved queue
    // before it has been read.
    this.hydration = this.chain = new Promise<void>((resolve) => (this.markLoaded = resolve));
    this.middleware = ((api: OutboxStoreApi) => {
      this.store = api;
      return (next) => (action) => {
        const result = next(action);
        this.onAction(action as UnknownAction);
        return result;
      };
    }) as Middleware;
  }

  /**
   * Hands the Outbox its platform. Call once at app startup. It loads and sends nothing yet:
   * the saved queue belongs to the logged-in user, so that waits for startSending().
   */
  start(platform: OutboxPlatform): void {
    if (this.platform) return;
    this.platform = platform;
    startedOutboxes.add(this);
    this.isOfflineMode = platform.isOfflineMode ?? true;
    if (!this.isOfflineMode) {
      // Nothing to load or send; still mark hydrated so code waiting for it (useOutboxHydrated) proceeds.
      this.dispatch(outboxHydrated([]));
      this.markLoaded();
      return;
    }
    this.unsubscribeForeground = platform.onForeground?.(() => {
      this.clearNetworkBackoff();
      void this.flush();
    });
    this.beginLoad();
  }

  /**
   * Loads the saved queue and starts sending it. Call once the user session is created or
   * checked (UserSessionProvider does). Safe in any order with start(), and safe to repeat.
   * Until it has run, offline-mode enqueue() calls wait. Resolves once the queue is loaded.
   */
  startSending(): Promise<void> {
    this.loadRequested = true;
    this.beginLoad();
    return this.hydration;
  }

  /** Stops timers and listeners (tests, or tearing the store down). The queue stays persisted. */
  stop(): void {
    this.stopped = true;
    startedOutboxes.delete(this);
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
    this.unsubscribeForeground?.();
    this.unsubscribeForeground = undefined;
  }

  get currentUserId(): number | undefined {
    return this.platform?.getUserId();
  }

  /**
   * Offline mode (default): queues a call to a registered endpoint. The optimistic change is
   * applied before this returns its promise; the promise resolves (with nothing) once the item
   * is persisted - not when the server has it.
   *
   * Online mode (platform.isOfflineMode === false): calls the endpoint at once, bypassing the
   * queue and the optimistic recipes. Resolves with the server's result; rejects with the
   * standard RTK Query error (FetchBaseQueryError | SerializedError - see core/apiError.ts).
   */
  async enqueue<E extends MutationEndpointLike>(endpoint: E, args: ArgsOf<E>): Promise<ResultOf<E> | void> {
    const registered = getOfflineMutation(endpoint.name);
    if (!registered) {
      throw new Error(`Outbox.enqueue: '${endpoint.name}' is not registered with registerOfflineMutation().`);
    }
    if (!this.platform) throw new Error('Outbox.enqueue: called before outbox.start().');

    if (!this.isOfflineMode) {
      const request = this.dispatch(registered.endpoint.initiate(args));
      try {
        const result = await unwrapAccepted(request);
        this.reconcile(registered, result, args);
        return result as ResultOf<E>;
      } finally {
        request.reset?.();
      }
    }

    if (this.platform.getUserId() == null) throw new Error('Outbox.enqueue: no logged-in user.');

    const { def } = registered;
    const item: OutboxItem = {
      operationId: uuidv4(),
      endpointName: endpoint.name,
      args,
      entityKeys: def.entityKeys(args),
      createdAt: Date.now(),
      status: 'pending',
      attempts: 0,
    };

    // Show the change synchronously, before the storage write: code reading the cache right
    // after this call (a second tap in the same frame, say) must already see it. It's applied
    // again once the item is in the queue, in case a refetch lands in between and replaces
    // the cache entry before the queue knows about the item - recipes are safe to repeat.
    this.applyOptimistic(item);
    await this.mutate((items) => {
      const kept =
        def.coalesce === 'replace'
          ? items.filter(
              (i) =>
                !(
                  i.endpointName === item.endpointName &&
                  i.status !== 'sending' &&
                  sameKeys(i.entityKeys, item.entityKeys)
                )
            )
          : items;
      return [...kept, item];
    });
    this.applyOptimistic(item);
    void this.flush();
  }

  /** Sends whatever is due. Safe to call any time; concurrent calls fold into one pass. */
  async flush(): Promise<void> {
    if (!this.platform || this.stopped) return;
    await this.hydration;
    if (this.flushing) {
      this.rerunRequested = true;
      return this.flushing;
    }
    this.flushing = (async () => {
      try {
        do {
          this.rerunRequested = false;
          await this.sendPass();
        } while (this.rerunRequested && !this.stopped);
      } finally {
        this.flushing = undefined;
      }
    })();
    return this.flushing;
  }

  /** Sends failed items for `entityKey` again (e.g. from a "retry" button). */
  async retryFailed(entityKey?: string): Promise<void> {
    await this.mutate((items) =>
      items.map((i) =>
        i.status === 'failed' && (!entityKey || i.entityKeys.includes(entityKey))
          ? { ...i, status: 'pending', lastError: undefined }
          : i
      )
    );
    void this.flush();
  }

  /** Drops a queued item without sending it, and refetches what it touched. */
  async discard(operationId: string): Promise<void> {
    const item = this.items().find((i) => i.operationId === operationId);
    if (!item || item.status === 'sending') return;
    await this.mutate((items) => items.filter((i) => i.operationId !== operationId));
    this.backoff.delete(operationId);
    this.invalidate(item.entityKeys);
  }

  /**
   * Drops everything queued - pending, in flight and failed - from memory and from storage,
   * and refetches what it touched. For when the saved data no longer belongs to the app's
   * user (login, logout). A send already on the wire may still reach the server. Await it
   * before the new session is checked, so startSending() can't load the old queue.
   */
  async clear(): Promise<void> {
    this.backoff.clear();
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
    if (!this.platform) return;
    if (!this.loadStarted) {
      // Not loaded yet (no session so far): there is nothing in memory, only the stored copy.
      try {
        await this.platform.storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items: [] }));
      } catch (error) {
        console.warn('[Outbox] could not clear the saved queue', error);
      }
      return;
    }
    await this.hydration;
    const dropped = this.items();
    await this.mutate(() => []);
    this.invalidate([...new Set(dropped.flatMap((i) => i.entityKeys))]);
  }

  // ---- internals ----

  private store?: OutboxStoreApi;
  private platform?: OutboxPlatform;
  private hydration: Promise<void>;
  private markLoaded!: () => void;
  private loadRequested = false;
  private loadStarted = false;
  // Serializes every change to the item list (read state -> persist -> dispatch), so two
  // enqueues racing through their `await persist` can't each drop the other's item.
  private chain: Promise<void>;
  private flushing?: Promise<void>;
  private rerunRequested = false;
  private stopped = false;
  private isOfflineMode = true;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private backoff = new Map<string, { at: number; kind: FailureKind; failedAt: number }>();
  private unsubscribeForeground?: () => void;

  private get dispatch(): OutboxDispatch {
    if (!this.store) throw new Error('Outbox: middleware is not installed in a store.');
    return this.store.dispatch;
  }

  private items(): OutboxItem[] {
    return this.store?.getState().outbox.items ?? [];
  }

  /** Loads once both start() (the platform) and startSending() (a session) have happened. */
  private beginLoad(): void {
    if (!this.platform || !this.isOfflineMode || !this.loadRequested || this.loadStarted) return;
    this.loadStarted = true;
    void this.hydrate();
  }

  private async hydrate(): Promise<void> {
    try {
      let items: OutboxItem[] = [];
      try {
        const raw = await this.platform!.storage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed?.items)) {
          items = (parsed.items as OutboxItem[]).map((i) => (i.status === 'sending' ? { ...i, status: 'pending' } : i));
        }
      } catch (error) {
        console.warn('[Outbox] could not load the persisted queue - starting empty', error);
      }
      this.dispatch(outboxHydrated(items));
      // Queries that loaded before hydration finished don't have these changes applied yet.
      for (const item of this.items()) if (item.status !== 'failed') this.applyOptimistic(item);
    } catch (error) {
      console.error('[Outbox] loading the saved queue failed', error);
    } finally {
      this.markLoaded();
    }
    void this.flush();
  }

  private mutate(
    update: (items: OutboxItem[]) => OutboxItem[],
    options: { persist?: boolean } = {}
  ): Promise<void> {
    const run = this.chain.then(async () => {
      const next = update(this.items());
      if (options.persist !== false) {
        try {
          const durable = next.map((i) => (i.status === 'sending' ? { ...i, status: 'pending' as const } : i));
          await this.platform!.storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items: durable }));
        } catch (error) {
          // Keep working in memory rather than dropping the user's change; it just won't
          // survive an app restart until the next successful write.
          console.warn('[Outbox] could not persist the queue', error);
        }
      }
      this.dispatch(outboxItemsSet(next));
    });
    this.chain = run.catch(() => {});
    return run;
  }

  private patchItem(operationId: string, patch: Partial<OutboxItem>, persist = true): Promise<void> {
    return this.mutate(
      (items) => items.map((i) => (i.operationId === operationId ? { ...i, ...patch } : i)),
      { persist }
    );
  }

  private applyOptimistic(item: OutboxItem, onlyFor?: { endpointName: string; queryArgs: unknown }): void {
    const def = getOfflineMutation(item.endpointName)?.def;
    // The recipes are the app's code and run on stored data (possibly from an older app version),
    // inside the store's middleware: one that throws is logged and skipped, never allowed to
    // break loading the queue or the dispatch of a query's own result.
    let recipes: OptimisticRecipe[] = [];
    try {
      recipes = def?.optimistic?.(item.args) ?? [];
    } catch (error) {
      console.error(`[Outbox] optimistic recipes for ${item.endpointName} threw`, error);
      return;
    }
    for (const recipe of recipes) {
      if (onlyFor && (recipe.endpointName !== onlyFor.endpointName || !sameQueryArgs(recipe.queryArgs, onlyFor.queryArgs))) {
        continue;
      }
      try {
        // No-op when that query has no cache entry yet; the recipe is re-applied when it loads.
        this.dispatch(
          (apiSlice.util.updateQueryData as any)(recipe.endpointName, recipe.queryArgs, recipe.apply)
        );
      } catch (error) {
        console.error(`[Outbox] optimistic recipe for ${item.endpointName} threw`, error);
      }
    }
  }

  /** Runs the app's callback; a throw is logged so it can't abort the send pass. */
  private async guarded(what: string, call: () => unknown): Promise<void> {
    try {
      await call();
    } catch (error) {
      console.error(`[Outbox] ${what} threw`, error);
    }
  }

  /**
   * Runs def.reconcile for a call the server already accepted. It is the caller's code, so a
   * throw is logged and swallowed: it must not turn a successful send into a failed one
   * (onPermanentFailure, a rejected enqueue).
   */
  private reconcile(registered: RegisteredOfflineMutation, result: unknown, args: unknown): void {
    try {
      registered.def.reconcile?.(result, args, this.dispatch);
    } catch (error) {
      console.error('[Outbox] reconcile threw after the server accepted the call', error);
    }
  }

  private invalidate(entityKeys: string[]): void {
    this.dispatch(apiSlice.util.invalidateTags(entityKeys.map(entityKeyToTag) as any));
  }

  private onAction(action: UnknownAction): void {
    if (!this.store || !this.platform) return;
    const type = action.type;
    const prefix = `${apiSlice.reducerPath}/`;
    if (!type.startsWith(prefix)) return;

    if (type === `${prefix}executeQuery/fulfilled`) {
      // Fresh server data doesn't contain unsent changes - put them back on top.
      const arg = (action as any).meta?.arg;
      if (arg?.endpointName) {
        for (const item of this.items()) {
          if (item.status !== 'failed') {
            this.applyOptimistic(item, { endpointName: arg.endpointName, queryArgs: arg.originalArgs });
          }
        }
      }
    }

    // Any successful request (other than our own replays) suggests the server is reachable:
    // retry network-failed items instead of waiting out a long backoff - but never sooner than
    // RETRY_BASE_MS after the item's last failure. A failed replay still invalidates the
    // mutation's tags, so its own refetch succeeds right after; without the gap that success
    // would retry the item at once, and a server that answers GETs but not the PATCH would be
    // hit in a tight PATCH/GET loop.
    if (
      !this.flushing &&
      (type === `${prefix}executeQuery/fulfilled` || type === `${prefix}executeMutation/fulfilled`) &&
      this.items().some((i) => i.status === 'pending')
    ) {
      this.clearNetworkBackoff(RETRY_BASE_MS);
      void this.flush();
    }
  }

  /** Still in the queue - an item that was in flight when clear() emptied it is not. */
  private isQueued(item: OutboxItem): boolean {
    return this.items().some((i) => i.operationId === item.operationId);
  }

  /** A newer item for the same endpoint and entities was queued after `item`. */
  private isSuperseded(item: OutboxItem): boolean {
    const items = this.items();
    const index = items.findIndex((i) => i.operationId === item.operationId);
    return items
      .slice(index + 1)
      .some(
        (i) =>
          i.endpointName === item.endpointName &&
          i.status !== 'failed' &&
          sameKeys(i.entityKeys, item.entityKeys)
      );
  }

  /** Lifts the backoff of network-failed items whose last failure is at least `minAgeMs` old. */
  private clearNetworkBackoff(minAgeMs = 0): void {
    const now = Date.now();
    for (const [operationId, entry] of this.backoff) {
      if (entry.kind === 'network' && now - entry.failedAt >= minAgeMs) this.backoff.delete(operationId);
    }
  }

  private scheduleRetry(item: OutboxItem, kind: FailureKind): void {
    const now = Date.now();
    const delay = Math.min(RETRY_BASE_MS * 2 ** Math.max(0, item.attempts - 1), RETRY_MAX_MS);
    this.backoff.set(item.operationId, { at: now + delay, kind, failedAt: now });
    this.armRetryTimer();
  }

  private armRetryTimer(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
    // Parked ('auth') items wait for an outside trigger, not a timer.
    const timed = [...this.backoff.values()].filter((b) => b.kind !== 'auth');
    if (this.stopped || timed.length === 0) return;
    const earliest = Math.min(...timed.map((b) => b.at));
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined;
      void this.flush();
    }, Math.max(0, earliest - Date.now()));
  }

  private async sendPass(): Promise<void> {
    if (this.currentUserId == null) return;
    const blocked = new Set<string>();
    for (const i of this.items()) if (i.status === 'failed') i.entityKeys.forEach((k) => blocked.add(k));

    // The item list is kept in enqueue order (and persisted that way), so iterate it as-is -
    // createdAt can tie within a millisecond.
    const candidates = this.items();
    for (const candidate of candidates) {
      if (this.stopped) return;
      // Re-read: an earlier await may have coalesced, discarded or failed this item.
      const item = this.items().find((i) => i.operationId === candidate.operationId);
      if (!item || item.status !== 'pending') continue;
      if (item.entityKeys.some((k) => blocked.has(k))) continue;

      const backoff = this.backoff.get(item.operationId);
      if (backoff && backoff.at > Date.now()) {
        item.entityKeys.forEach((k) => blocked.add(k)); // keep per-entity order while it waits
        continue;
      }

      const registered = getOfflineMutation(item.endpointName);
      if (!registered) {
        await this.patchItem(item.operationId, { status: 'failed', lastError: 'No offline definition registered' });
        item.entityKeys.forEach((k) => blocked.add(k));
        continue;
      }

      await this.patchItem(item.operationId, { status: 'sending' }, false);
      const request = this.dispatch(registered.endpoint.initiate(item.args));
      try {
        const result = await unwrapAccepted(request);
        // clear() ran while this was on the wire: the item is gone and so is its owner's queue.
        if (!this.isQueued(item)) continue;
        this.backoff.delete(item.operationId);
        await this.mutate((items) => items.filter((i) => i.operationId !== item.operationId));
        this.reconcile(registered, result, item.args);
      } catch (error) {
        // Same: a cleared item gets no retry timer, no backoff entry and no onPermanentFailure.
        if (!this.isQueued(item)) continue;
        const kind = classifyError(error);
        const lastError = describeError(error);
        const attempts = item.attempts + 1;
        if (registered.def.coalesce === 'replace' && this.isSuperseded(item)) {
          // Enqueue never drops an in-flight item; now that this one didn't go through, the
          // newer value queued behind it makes it pointless to send (or to keep as failed, which
          // would block that newer value). It is next in this pass, so it gets its own attempt.
          this.backoff.delete(item.operationId);
          await this.mutate((items) => items.filter((i) => i.operationId !== item.operationId));
          if (kind === 'auth') await this.guarded('notifyAuthLost', () => notifyAuthLost());
          continue;
        }
        if (kind === 'permanent') {
          this.backoff.delete(item.operationId);
          await this.patchItem(item.operationId, { status: 'failed', attempts, lastError });
          item.entityKeys.forEach((k) => blocked.add(k));
          console.warn(`[Outbox] ${item.endpointName} rejected (${lastError}) - kept as failed`);
          this.invalidate(item.entityKeys);
          await this.guarded('onPermanentFailure', () => registered.def.onPermanentFailure?.(item.args, this.dispatch));
          continue;
        }
        if (kind === 'server') {
          const serverErrors = (item.serverErrors ?? 0) + 1;
          if (serverErrors > MAX_SERVER_ERROR_RETRIES) {
            this.backoff.delete(item.operationId);
            await this.mutate((items) => items.filter((i) => i.operationId !== item.operationId));
            console.error(
              `[Outbox] ${item.endpointName} dropped after ${serverErrors} server errors (${lastError}); args: ${JSON.stringify(item.args)}`
            );
            this.invalidate(item.entityKeys);
            await this.guarded('onPermanentFailure', () => registered.def.onPermanentFailure?.(item.args, this.dispatch));
            continue;
          }
          await this.patchItem(item.operationId, { status: 'pending', attempts, serverErrors, lastError });
          this.scheduleRetry({ ...item, attempts }, kind);
          item.entityKeys.forEach((k) => blocked.add(k));
          continue;
        }
        if (kind === 'auth') {
          await this.patchItem(item.operationId, { status: 'pending', attempts, serverErrors: 0, lastError });
          const now = Date.now();
          this.backoff.set(item.operationId, { at: now + AUTH_PARK_MS, kind, failedAt: now });
          console.warn(`[Outbox] ${item.endpointName} not authorized - session lost`);
          await this.guarded('notifyAuthLost', () => notifyAuthLost());
          this.armRetryTimer();
          return;
        }
        // Not a 5xx: the "consecutive server errors" count starts over.
        await this.patchItem(item.operationId, { status: 'pending', attempts, serverErrors: 0, lastError });
        this.scheduleRetry({ ...item, attempts }, kind);
        item.entityKeys.forEach((k) => blocked.add(k));
        if (kind === 'network') return;
      } finally {
        request.reset?.();
      }
    }
    this.armRetryTimer();
  }
}

const outboxes = new WeakMap<object, Outbox>();
const startedOutboxes = new Set<Outbox>();

/**
 * Empties the saved queue of every started Outbox - callable from anywhere (e.g. the login
 * flow), no store needed. Offline-first data saved by one user must not be sent as another.
 */
export async function clearOutbox(): Promise<void> {
  await Promise.all([...startedOutboxes].map((outbox) => outbox.clear()));
}

/** Associates an Outbox with the store its middleware was installed in (see makeStore). */
export function registerOutboxForStore(store: object, outbox: Outbox): void {
  outboxes.set(store, outbox);
}

export function getOutbox(store: object): Outbox {
  const outbox = outboxes.get(store);
  if (!outbox) throw new Error('getOutbox: this store was not created by makeStore().');
  return outbox;
}

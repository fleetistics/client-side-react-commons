import type { Middleware, MiddlewareAPI, UnknownAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { apiSlice } from '../core/apiSlice';
import { getOfflineMutation, type ArgsOf, type MutationEndpointLike, type OutboxDispatch } from './offlineMutation';
import { outboxHydrated, outboxItemsSet, type OutboxState } from './outboxSlice';
import type { OutboxItem, OutboxPlatform } from './outboxTypes';

const STORAGE_KEY = 'outbox.v1';
const RETRY_BASE_MS = 5_000;
const RETRY_MAX_MS = 120_000;

type OutboxStoreApi = MiddlewareAPI<OutboxDispatch, { outbox: OutboxState }>;

// How a failed send is treated:
//  network   - no response at all (offline, DNS, timeout): keep pending, stop this pass (every
//              other item would fail the same way), retry with backoff or on the next sign of
//              connectivity.
//  transient - the server answered but can't take it now (5xx, 408, 429, and 401: apiSlice has
//              already tried a token refresh, so the session is gone - the item waits for the
//              same user to log back in). Keep pending, hold back its entityKeys, back off.
//  permanent - any other answer (4xx, unparsable response): mark failed, keep for the UI.
type FailureKind = 'network' | 'transient' | 'permanent';

function classifyError(error: unknown): FailureKind {
  const status = (error as { status?: unknown } | undefined)?.status;
  if (status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR') return 'network';
  if (typeof status === 'number') {
    return status >= 500 || status === 401 || status === 408 || status === 429 ? 'transient' : 'permanent';
  }
  return 'permanent';
}

function describeError(error: unknown): string {
  const e = error as { status?: unknown; error?: unknown; data?: unknown; message?: unknown } | undefined;
  if (e?.status !== undefined) return `${String(e.status)}${e.error ? `: ${String(e.error)}` : ''}`;
  return e?.message ? String(e.message) : String(error);
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
    this.middleware = ((api: OutboxStoreApi) => {
      this.store = api;
      return (next) => (action) => {
        const result = next(action);
        this.onAction(action as UnknownAction);
        return result;
      };
    }) as Middleware;
  }

  /** Loads the persisted queue and starts sending. Call once at app startup. */
  start(platform: OutboxPlatform): Promise<void> {
    if (this.platform) return this.hydration;
    this.platform = platform;
    this.hydration = this.chain = this.hydrate();
    this.unsubscribeForeground = platform.onForeground?.(() => {
      this.clearNetworkBackoff();
      void this.flush();
    });
    return this.hydration;
  }

  /** Stops timers and listeners (tests, or tearing the store down). The queue stays persisted. */
  stop(): void {
    this.stopped = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
    this.unsubscribeForeground?.();
    this.unsubscribeForeground = undefined;
  }

  get currentUserId(): number | undefined {
    return this.platform?.getUserId();
  }

  /**
   * Queues an offline-first call to a registered endpoint. The optimistic change is applied
   * before this returns its promise; the promise resolves once the item is persisted - not
   * when the server has it.
   */
  async enqueue<E extends MutationEndpointLike>(endpoint: E, args: ArgsOf<E>): Promise<void> {
    const registered = getOfflineMutation(endpoint.name);
    if (!registered) {
      throw new Error(`Outbox.enqueue: '${endpoint.name}' is not registered with registerOfflineMutation().`);
    }
    if (!this.platform) throw new Error('Outbox.enqueue: called before outbox.start().');
    const userId = this.platform.getUserId();
    if (userId == null) throw new Error('Outbox.enqueue: no logged-in user.');

    const { def } = registered;
    const item: OutboxItem = {
      operationId: uuidv4(),
      endpointName: endpoint.name,
      args,
      entityKeys: def.entityKeys(args),
      userId,
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
                  i.userId === userId &&
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

  // ---- internals ----

  private store?: OutboxStoreApi;
  private platform?: OutboxPlatform;
  private hydration: Promise<void> = Promise.resolve();
  // Serializes every change to the item list (read state -> persist -> dispatch), so two
  // enqueues racing through their `await persist` can't each drop the other's item.
  private chain: Promise<void> = Promise.resolve();
  private flushing?: Promise<void>;
  private rerunRequested = false;
  private stopped = false;
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

  private myItems(): OutboxItem[] {
    const userId = this.currentUserId;
    return userId == null ? [] : this.items().filter((i) => i.userId === userId);
  }

  private async hydrate(): Promise<void> {
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
    for (const item of this.myItems()) if (item.status !== 'failed') this.applyOptimistic(item);
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
    for (const recipe of def?.optimistic?.(item.args) ?? []) {
      if (onlyFor && (recipe.endpointName !== onlyFor.endpointName || !sameQueryArgs(recipe.queryArgs, onlyFor.queryArgs))) {
        continue;
      }
      // No-op when that query has no cache entry yet; the recipe is re-applied when it loads.
      this.dispatch(
        (apiSlice.util.updateQueryData as any)(recipe.endpointName, recipe.queryArgs, recipe.apply)
      );
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
        for (const item of this.myItems()) {
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
      this.myItems().some((i) => i.status === 'pending')
    ) {
      this.clearNetworkBackoff(RETRY_BASE_MS);
      void this.flush();
    }
  }

  /** A newer item for the same endpoint and entities was queued after `item`. */
  private isSuperseded(item: OutboxItem): boolean {
    const items = this.items();
    const index = items.findIndex((i) => i.operationId === item.operationId);
    return items
      .slice(index + 1)
      .some(
        (i) =>
          i.userId === item.userId &&
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
    if (this.stopped || this.backoff.size === 0) return;
    const earliest = Math.min(...[...this.backoff.values()].map((b) => b.at));
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined;
      void this.flush();
    }, Math.max(0, earliest - Date.now()));
  }

  private async sendPass(): Promise<void> {
    if (this.currentUserId == null) return;
    const blocked = new Set<string>();
    for (const i of this.myItems()) if (i.status === 'failed') i.entityKeys.forEach((k) => blocked.add(k));

    // The item list is kept in enqueue order (and persisted that way), so iterate it as-is -
    // createdAt can tie within a millisecond.
    const candidates = this.myItems();
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
        const result = await request.unwrap();
        this.backoff.delete(item.operationId);
        await this.mutate((items) => items.filter((i) => i.operationId !== item.operationId));
        registered.def.reconcile?.(result, item.args, this.dispatch);
      } catch (error) {
        const kind = classifyError(error);
        const lastError = describeError(error);
        const attempts = item.attempts + 1;
        if (kind === 'permanent') {
          this.backoff.delete(item.operationId);
          await this.patchItem(item.operationId, { status: 'failed', attempts, lastError });
          item.entityKeys.forEach((k) => blocked.add(k));
          console.warn(`[Outbox] ${item.endpointName} rejected (${lastError}) - kept as failed`);
          this.invalidate(item.entityKeys);
          await registered.def.onPermanentFailure?.(item.args, this.dispatch);
          continue;
        }
        if (registered.def.coalesce === 'replace' && this.isSuperseded(item)) {
          // Enqueue never drops an in-flight item; now that this one didn't go through, the
          // newer value queued behind it makes it pointless to send.
          this.backoff.delete(item.operationId);
          await this.mutate((items) => items.filter((i) => i.operationId !== item.operationId));
          if (kind === 'network') return;
          continue;
        }
        await this.patchItem(item.operationId, { status: 'pending', attempts, lastError });
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

/** Associates an Outbox with the store its middleware was installed in (see makeStore). */
export function registerOutboxForStore(store: object, outbox: Outbox): void {
  outboxes.set(store, outbox);
}

export function getOutbox(store: object): Outbox {
  const outbox = outboxes.get(store);
  if (!outbox) throw new Error('getOutbox: this store was not created by makeStore().');
  return outbox;
}

/**
 * One queued offline-first mutation call. Persisted as-is (except that 'sending' is
 * written back as 'pending' - an item that was in flight when the app died is simply
 * sent again, which is why offline-first endpoints must be safe to replay).
 */
export type OutboxItemStatus = 'pending' | 'sending' | 'failed';

export interface OutboxItem {
  /** Client-generated uuid - identifies the item, and is what an Idempotency-Key would carry. */
  operationId: string;
  /** RTK Query endpoint name, resolved against the offline-mutation registry when sent. */
  endpointName: string;
  /** The mutation's argument, exactly as the call site passed it. */
  args: unknown;
  /**
   * The server-side records this call changes, as "TagType:id" (the same shape as the
   * endpoints' providesTags). Items sharing a key are sent strictly in creation order; a
   * failed item holds back later items for its keys, but never items for other keys.
   */
  entityKeys: string[];
  createdAt: number;
  status: OutboxItemStatus;
  attempts: number;
  /** Consecutive sends that failed with a 5xx (reset by any other failure); dropped once over the retry limit. */
  serverErrors?: number;
  lastError?: string;
}

/**
 * Persistence seam - the only thing that differs between web (localStorage/IndexedDB) and
 * React Native (AsyncStorage), same idea as i18n's I18nStorageAdapter.
 */
export interface OutboxStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface OutboxPlatform {
  storage: OutboxStorageAdapter;
  /**
   * System-wide, read once by Outbox.start(). true (default): enqueue() queues the call and
   * resolves once it is persisted (React Native: the device may be offline at any moment).
   * false: nothing is queued or persisted - enqueue() calls the server at once, resolves with
   * the result and rejects with the RTK Query error (web: the server is expected to be there).
   */
  isOfflineMode?: boolean;
  /**
   * Current logged-in user, or undefined before a session exists - the gate for enqueuing and
   * sending. The queue itself is not per user: whatever is in it was queued by the current user
   * (clearOutbox() empties it when the session changes).
   */
  getUserId(): number | undefined;
  /** Optional send trigger: called when the app returns to the foreground. Returns an unsubscribe. */
  onForeground?(listener: () => void): () => void;
}

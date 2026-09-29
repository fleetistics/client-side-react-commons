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
  /** Who enqueued it. Items are only ever sent, or shown, for the same logged-in user. */
  userId: number;
  createdAt: number;
  status: OutboxItemStatus;
  attempts: number;
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
  /** Current logged-in user, or undefined before a session exists (nothing is sent then). */
  getUserId(): number | undefined;
  /** Optional send trigger: called when the app returns to the foreground. Returns an unsubscribe. */
  onForeground?(listener: () => void): () => void;
}

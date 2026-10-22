import { useCallback } from 'react';
import { shallowEqual, useSelector, useStore } from 'react-redux';
import type { ArgsOf, MutationEndpointLike } from './offlineMutation';
import { getOutbox } from './outbox';
import { selectLatestPendingArgs, selectOutboxHydrated, selectOutboxItems, type OutboxState } from './outboxSlice';
import type { OutboxItem } from './outboxTypes';

type WithOutbox = { outbox: OutboxState };

/**
 * Offline-first counterpart of useXMutation(): returns a function that queues the call and
 * returns immediately. The endpoint must be registered with registerOfflineMutation().
 */
export function useOfflineMutation<E extends MutationEndpointLike>(endpoint: E) {
  const store = useStore();
  return useCallback((args: ArgsOf<E>) => getOutbox(store).enqueue(endpoint, args), [store, endpoint]);
}

export interface OutboxEntityStatus {
  /** Something for this entity hasn't reached the server yet (pending or in flight). */
  isPending: boolean;
  isSending: boolean;
  /** The server rejected a change to this entity; it stays until retried or discarded. */
  failed?: OutboxItem;
}

/** Sync state of one entity key (e.g. "UserLocationPrivacy:ME"). */
export function useOutboxStatus(entityKey: string): OutboxEntityStatus {
  return useSelector((state: WithOutbox) => {
    const items = selectOutboxItems(state).filter((i) => i.entityKeys.includes(entityKey));
    return {
      isPending: items.some((i) => i.status !== 'failed'),
      isSending: items.some((i) => i.status === 'sending'),
      failed: items.find((i) => i.status === 'failed'),
    };
  }, shallowEqual);
}

/** The latest not-yet-confirmed args queued for `endpoint`, or undefined. */
export function useLatestPendingArgs<E extends MutationEndpointLike>(endpoint: E): ArgsOf<E> | undefined {
  return useSelector((state: WithOutbox) => selectLatestPendingArgs<ArgsOf<E>>(state, endpoint.name));
}

/** True once the persisted queue has been loaded (see Outbox.start). */
export function useOutboxHydrated(): boolean {
  return useSelector(selectOutboxHydrated);
}

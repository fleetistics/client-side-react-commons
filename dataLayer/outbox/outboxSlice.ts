import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { OutboxItem } from './outboxTypes';

// The in-memory, UI-facing reflection of the persisted queue. The Outbox service is the only
// writer: it computes the next item list, persists it, then dispatches itemsSet - so the
// durable copy is never behind what the UI shows.
export interface OutboxState {
  items: OutboxItem[];
  hydrated: boolean;
}

const initialState: OutboxState = { items: [], hydrated: false };

const outboxSlice = createSlice({
  name: 'outbox',
  initialState,
  reducers: {
    outboxHydrated(state, action: PayloadAction<OutboxItem[]>) {
      state.items = action.payload;
      state.hydrated = true;
    },
    outboxItemsSet(state, action: PayloadAction<OutboxItem[]>) {
      state.items = action.payload;
    },
  },
});

export const { outboxHydrated, outboxItemsSet } = outboxSlice.actions;
export default outboxSlice.reducer;

type WithOutbox = { outbox: OutboxState };

export const selectOutboxHydrated = (state: WithOutbox) => state.outbox.hydrated;

/** All queued items, oldest first. */
export const selectOutboxItems = (state: WithOutbox) => state.outbox.items;

/**
 * Args of the newest not-failed item for `endpointName` - i.e. the value the user last chose
 * that the server hasn't confirmed yet. Undefined when nothing is pending.
 */
export function selectLatestPendingArgs<Args>(
  state: WithOutbox,
  endpointName: string
): Args | undefined {
  const items = selectOutboxItems(state).filter(
    (i) => i.endpointName === endpointName && i.status !== 'failed'
  );
  return items.length > 0 ? (items[items.length - 1].args as Args) : undefined;
}

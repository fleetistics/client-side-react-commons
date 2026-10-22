import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { apiSlice } from './apiSlice';
import { ExtraStoreProvider } from '@/client-side.Impl/bootstrap/extra-store-provider';
import outboxReducer from '../outbox/outboxSlice';
import { Outbox, registerOutboxForStore } from '../outbox/outbox';

// Factory rather than a bare singleton: tests create a fresh store per render so the
// RTK Query cache never leaks between test cases. The app still uses the one below.
//
// autoBatch defaults on (RTK's default) and schedules its notify via requestAnimationFrame.
// Tests can pass autoBatch: false — a store that outlives its test would otherwise leave a
// pending rAF-driven timer that fires after Jest tears the test environment down.
//
// Each store gets its own Outbox (the offline-first queue), reachable via getOutbox(store);
// it stays idle until outbox.start(platform) is called at app startup.
export const makeStore = (options?: { autoBatch?: boolean }) => {
  const outbox = new Outbox();
  const created = configureStore({
    reducer: {
      ...ExtraStoreProvider.GetReducers(),
      outbox: outboxReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware, outbox.middleware),
    enhancers: (getDefaultEnhancers) =>
      getDefaultEnhancers({ autoBatch: options?.autoBatch ?? true }),
  });
  registerOutboxForStore(created, outbox);
  return created;
};

export const store = makeStore();

// Enables refetchOnFocus / refetchOnReconnect for endpoints that opt in.
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

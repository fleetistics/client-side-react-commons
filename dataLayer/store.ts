import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { apiSlice } from './apiSlice';
import locationStateReducer from '@/app.Commons/dataLayer/hooks/locationApi';

// Factory rather than a bare singleton: tests create a fresh store per render so the
// RTK Query cache never leaks between test cases. The app still uses the one below.
//
// autoBatch defaults on (RTK's default) and schedules its notify via requestAnimationFrame.
// Tests can pass autoBatch: false — a store that outlives its test would otherwise leave a
// pending rAF-driven timer that fires after Jest tears the test environment down.
export const makeStore = (options?: { autoBatch?: boolean }) =>
  configureStore({
    reducer: {
      locationState: locationStateReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
    enhancers: (getDefaultEnhancers) =>
      getDefaultEnhancers({ autoBatch: options?.autoBatch ?? true }),
  });

export const store = makeStore();

// Enables refetchOnFocus / refetchOnReconnect for endpoints that opt in.
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

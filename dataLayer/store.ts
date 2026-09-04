import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { apiSlice } from './apiSlice';

// Factory rather than a bare singleton: tests create a fresh store per render so the
// RTK Query cache never leaks between test cases. The app still uses the one below.
export const makeStore = () =>
  configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
  });

export const store = makeStore();

// Enables refetchOnFocus / refetchOnReconnect for endpoints that opt in.
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

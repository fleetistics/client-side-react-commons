import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

/** Read-side shape for a hook built on top of a generated `useXQuery`. */
export type QueryState<T> = {
  data?: T;
  error?: FetchBaseQueryError | SerializedError;
  isLoading: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
  refetch: () => void;
};

/** Write-side shape for a hook built on top of a generated `useXMutation`. */
export type MutationState<TArg, TResult> = {
  trigger: (arg: TArg) => Promise<{ data: TResult } | { error: FetchBaseQueryError | SerializedError }>;
  originalArgs?: TArg;
  data?: TResult;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error?: FetchBaseQueryError | SerializedError;
};

/** Spreads alongside `url` in a `query`/`baseQuery` call to POST a plain JSON body. */
export const addPostFormObj = (body: Record<string, unknown>) => ({
  method: 'POST' as const,
  body,
});

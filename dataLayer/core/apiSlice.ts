import {
  type BaseQueryFn,
  createApi,
  type FetchArgs,
  fetchBaseQuery,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
  retry,
} from '@reduxjs/toolkit/query/react';

import { newTraceContext, recordTrace } from './traceContext';
import { USER_ACCOUNT_CONSTS, USER_SESSION_CONSTS } from '@/client-side.Impl/config/userSession-consts';
import { APP_CONFIG } from '@/client-side.Impl/config/app-config';

// Session endpoints (userSessionApi + token refresh) authenticate with the session
// cookie / session key, never the bearer token, so no Authorization header is sent.
const NO_BEARER_URIS: string[] = [
  USER_SESSION_CONSTS.CHECK_SESSION_URL,
  USER_SESSION_CONSTS.REFRESH_TOKEN_URL,
  USER_SESSION_CONSTS.LOGIN_URL,
  USER_ACCOUNT_CONSTS.RESET_PASSWORD_URL,
  USER_ACCOUNT_CONSTS.REQUEST_PASSWORD_RESET_URL
  
];

// A 401 from the session check is a normal "not signed in" answer, not an expired
// access token, so do not attempt a refresh or emit an auth-lost notification.
const SESSION_ESTABLISHING_URIS: string[] = [
  USER_SESSION_CONSTS.CHECK_SESSION_URL,
];
  
/**
 * In-memory holder for the .NET bearer token.
 *
 * Deliberately NOT persisted to localStorage/sessionStorage: a module variable is
 * unreachable to injected script in a way storage is not, and it cannot leak across
 * tabs. The cost is that a page reload starts with no token — which is fine, because
 * the httpOnly refresh cookie lets USER_SESSION_CONSTS.REFRESH_TOKEN_URL mint a new one on the first 401.
 */
export class AuthToken {
  private static jwtToken: string | undefined = undefined;

  public static get(): string | undefined {
    return AuthToken.jwtToken;
  }

  public static set(token: string | undefined) {
    AuthToken.jwtToken = token;
  }

  public static clear() {
    AuthToken.jwtToken = undefined;
  }
}

/**
 * Fires when the session is unrecoverable: refresh failed, or a retry with a freshly
 * minted token still came back 401. Wire this to your logout/redirect-to-login path.
 */
type AuthLostHandler = () => void;
let authLostHandler: AuthLostHandler | null = null;
export const setOnAuthLost = (handler: AuthLostHandler | null) => {
  authLostHandler = handler;
};

export const notifyAuthLost = () => {
  AuthToken.clear();
  authLostHandler?.();
};

let rawBaseQuery:
  | BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, {}, FetchBaseQueryMeta>
  | undefined;

// Built lazily so tests can stub the environment before the first request reads
// AppConfig.BASE_URL.
// Diagnostic wrapper: logs every network call's start, duration and outcome. A rejected
// fetch ("FAILED") is a network-level error (refused / DNS / TLS / offline); an abort that
// lands at ~REQUEST_TIMEOUT_MS is the base query's own timeout.
const REQUEST_TIMEOUT_MS = 10000;
let fetchSeq = 0;
const loggingFetch: typeof fetch = async (input, init) => {
  const id = ++fetchSeq;
  const url = typeof input === 'string' ? input : (input as Request).url ?? String(input);
  const method = init?.method ?? (typeof input === 'object' ? (input as Request).method : undefined) ?? 'GET';
  const t0 = Date.now();
  console.log(`[net #${id}] -> ${method} ${url}`);
  try {
    const res = await fetch(input, init);
    console.log(`[net #${id}] <- ${res.status} ${url} in ${Date.now() - t0}ms`);
    return res;
  } catch (e) {
    const err = e as { name?: string; message?: string };
    const ms = Date.now() - t0;
    console.warn(
      `[net #${id}] !! FAILED ${url} after ${ms}ms${ms >= REQUEST_TIMEOUT_MS - 500 ? ' (looks like TIMEOUT)' : ''}` +
        ` - ${err?.name}: ${err?.message}`
    );
    throw e;
  }
};

const prepareApiHeaders = (
  headers: Headers,
  { endpoint, arg }: { endpoint: string; arg: string | FetchArgs }
) => {
  if (AuthToken.get() && !NO_BEARER_URIS.includes(urlOf(arg))) {
    headers.set('Authorization', `Bearer ${AuthToken.get()}`);
  }
  // W3C Trace Context: the server continues this trace, making the browser the
  // trace root. The id is also logged to the flight recorder for correlation.
  const { traceparent, traceId } = newTraceContext();
  headers.set('traceparent', traceparent);
  recordTrace(endpoint, traceId);
  return headers;
};

export const getRawBaseQuery = () => {
  rawBaseQuery ??= fetchBaseQuery({
    baseUrl: APP_CONFIG.BASE_API_URL,
    // Cookies are off by default; only session requests (see userSessionApi) opt in.
    credentials: 'omit',
    timeout: REQUEST_TIMEOUT_MS,
    fetchFn: loggingFetch,
    prepareHeaders: prepareApiHeaders,
  });
  return rawBaseQuery;
};

/**
 * fetch used by the token-refresh request only. Defaults to the same logging fetch as every other
 * request; an app whose refresh must complete while backgrounded registers a timer-free one
 * (React Native's fetch only resolves from a JS timer, which doesn't run in the background).
 */
let refreshFetchFn: typeof fetch | undefined;
export const setRefreshFetchFn = (fn?: typeof fetch) => {
  refreshFetchFn = fn;
};

let refreshBaseQuery:
  | BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, {}, FetchBaseQueryMeta>
  | undefined;

/** Same configuration as getRawBaseQuery, but its fetch is the one registered with setRefreshFetchFn. */
export const getRefreshBaseQuery = () => {
  refreshBaseQuery ??= fetchBaseQuery({
    baseUrl: APP_CONFIG.BASE_API_URL,
    credentials: 'omit',
    timeout: REQUEST_TIMEOUT_MS,
    // Resolved per call, so a registration after this is built still applies.
    fetchFn: (input, init) => (refreshFetchFn ?? loggingFetch)(input, init),
    prepareHeaders: prepareApiHeaders,
  });
  return refreshBaseQuery;
};

const urlOf = (args: string | FetchArgs) => (typeof args === 'string' ? args : args.url);

export type RefreshApi = Parameters<
  BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, {}, FetchBaseQueryMeta>
>[1];

/**
 * Mints a new access token (stores it in AuthToken) and reports whether it succeeded.
 * The implementation lives in userSessionApi, which registers it here on load; apiSlice
 * cannot import it because userSessionApi imports apiSlice.
 */
export type SessionRefresher = (api: RefreshApi, extraOptions: {}) => Promise<boolean>;
let sessionRefresher: SessionRefresher | null = null;
export const setSessionRefresher = (refresher: SessionRefresher | null) => {
  sessionRefresher = refresher;
};

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  {},
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  const result = await getRawBaseQuery()(args, api, extraOptions);

  if (result.error?.status !== 401) {
    return result;
  }

  // A 401 from the refresh endpoint itself means the cookie is gone or expired.
  // Refreshing again would recurse; there is nothing left to recover from.
  if (urlOf(args) === USER_SESSION_CONSTS.REFRESH_TOKEN_URL) {
    notifyAuthLost();
    return result;
  }

  if (SESSION_ESTABLISHING_URIS.includes(urlOf(args))) {
    return result;
  }

  const refreshed = sessionRefresher ? await sessionRefresher(api, extraOptions) : false;
  if (!refreshed) {
    notifyAuthLost();
    return result;
  }

  // prepareHeaders re-reads AuthToken.jwtToken, so this retry carries the new token.
  const retried = await getRawBaseQuery()(args, api, extraOptions);
  if (retried.error?.status === 401) {
    notifyAuthLost();
  }
  return retried;
};

// Retries only transient failures (network errors, timeouts, 5xx) with no added delay
// between attempts. This gates foreground UI (e.g. the session check), so it favors
// reaching a decision quickly over exponential backoff's server-friendliness — the
// user is watching a spinner, not a background sync, and can hit the UI's own retry
// button. 1 initial request + 2 retries (attempt <= 2), each still bounded by the
// base query's own 30s timeout — a fully unreachable server is ~90s worst case, not
// unbounded, but instant retries at least remove the old 1s-per-retry backoff on top.
// Definitive errors (4xx, including a 401 that survives baseQueryWithReauth's own refresh
// attempt) are never transient, so retrying them would just delay the same failure.
const baseQueryWithRetry: typeof baseQueryWithReauth = retry(baseQueryWithReauth, {
  backoff: () => Promise.resolve(),
  retryCondition: (error, args, { attempt }) => {
    const status = (error as FetchBaseQueryError).status;
    const detail = (error as { error?: string }).error;
    const willRetry = attempt <= 2 && (typeof status !== 'number' || status >= 500);
    console.warn(
      `[apiSlice] ${new Date().toISOString()} request to ${urlOf(args)} failed (status: ${status}${detail ? `, ${detail}` : ''}), attempt ${attempt}` +
        (willRetry ? ' — retrying...' : ' — giving up.')
    );
    return willRetry;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRetry,
  // Every tag type must be declared here — injectEndpoints() cannot add new ones later.
  tagTypes: ['User', 'UserLocationPrivacy', 'UserEmergencyAlert', 'MessageTemplate', 'Role', 'Join', 'Contacts', 'Activities'],
  endpoints: () => ({}),
});

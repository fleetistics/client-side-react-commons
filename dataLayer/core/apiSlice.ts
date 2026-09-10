import {
  BaseQueryFn,
  createApi,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  retry,
} from '@reduxjs/toolkit/query/react';

import { newTraceContext, recordTrace } from './traceContext';
import { USER_SESSION_CONSTS } from '@/app.Impl/configs/userSession-consts';
import { APP_CONFIG } from '@/app.Impl/configs/app-config';
import { ClientSideInfoProvider } from '@/app.Impl/userSession/ClientSideInfoProvider';

// Session-establishing endpoints: a 401 from these is a normal answer ("not signed
// in" / "wrong credentials"), not an expired access token — so no refresh attempt
// and no auth-lost notification for them.
const SESSION_ESTABLISHING_URIS: string[] = [USER_SESSION_CONSTS.CHECK_SESSION_URL, USER_SESSION_CONSTS.LOGIN_URL];
  
/**
 * In-memory holder for the .NET bearer token.
 *
 * Deliberately NOT persisted to localStorage/sessionStorage: a module variable is
 * unreachable to injected script in a way storage is not, and it cannot leak across
 * tabs. The cost is that a page reload starts with no token — which is fine, because
 * the httpOnly refresh cookie lets USER_SESSION_CONSTS.REFRESH_TOKEN_URL mint a new one on the first 401.
 */
export class AuthToken {
  static jwtToken: string | null = null;

  static get(): string | null {
    return AuthToken.jwtToken;
  }

  static set(token: string | null) {
    AuthToken.jwtToken = token;
  }

  static clear() {
    AuthToken.jwtToken = null;
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
const getRawBaseQuery = () => {
  rawBaseQuery ??= fetchBaseQuery({
    baseUrl: APP_CONFIG.BASE_API_URL,
    credentials: 'include',
    timeout: 30000,
    prepareHeaders: (headers, { endpoint }) => {
      if (AuthToken.jwtToken) {
        headers.set('Authorization', `Bearer ${AuthToken.jwtToken}`);
      }
      // W3C Trace Context: the server continues this trace, making the browser the
      // trace root. The id is also logged to the flight recorder for correlation.
      const { traceparent, traceId } = newTraceContext();
      headers.set('traceparent', traceparent);
      recordTrace(endpoint, traceId);
      return headers;
    },
  });
  return rawBaseQuery;
};

const urlOf = (args: string | FetchArgs) => (typeof args === 'string' ? args : args.url);

export type RefreshApi = Parameters<
  BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, {}, FetchBaseQueryMeta>
>[1];

/**
 * Minimal BaseQueryApi stand-in for callers outside RTK Query (e.g. the native media
 * upload path) that still need to drive refreshAccessToken()'s single-flight latch.
 * Sharing that latch matters: it's what stops a query and an upload racing to refresh
 * at the same moment from each invalidating the other's refresh cookie (see above).
 */
export const createStandaloneRefreshApi = (endpoint: string): RefreshApi => ({
  signal: new AbortController().signal,
  abort: () => {},
  dispatch: (() => {}) as RefreshApi['dispatch'],
  getState: () => undefined,
  extra: undefined,
  endpoint,
  type: 'mutation',
});

const doRefresh = async (api: RefreshApi, extraOptions: {}): Promise<boolean> => {
  const result = await getRawBaseQuery()(
    {
      url: USER_SESSION_CONSTS.REFRESH_TOKEN_URL,
      method: 'POST',
      body: await ClientSideInfoProvider.GetInstance().GetInfo(),
    },
    api,
    extraOptions
  );

  if (!result.data || typeof result.data !== 'string') {
    AuthToken.clear();
    return false;
  }

  AuthToken.set(result.data);
  return true;
};

/**
 * Single-flight latch. Without it, N queries in flight when the token expires would
 * each fire their own refresh — the server invalidates the old refresh cookie on the
 * first one, so the rest fail and log the user out spuriously.
 */
let refreshInFlight: Promise<boolean> | null = null;

export const refreshAccessToken = (api: RefreshApi, extraOptions: {}): Promise<boolean> => {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh(api, extraOptions);
    // Release the latch once settled so a later expiry can refresh again.
    void refreshInFlight.finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
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

  const refreshed = await refreshAccessToken(api, extraOptions);
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
    const willRetry = attempt <= 2 && (typeof status !== 'number' || status >= 500);
    console.warn(
      `[apiSlice] request to ${urlOf(args)} failed (status: ${status}), attempt ${attempt}` +
        (willRetry ? ' — retrying...' : ' — giving up.')
    );
    return willRetry;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRetry,
  // Every tag type must be declared here — injectEndpoints() cannot add new ones later.
  tagTypes: ['User', 'UserLocationPrivacy', 'UserEmergencyAlert'],
  endpoints: () => ({}),
});

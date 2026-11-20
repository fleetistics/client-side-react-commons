/**
 * Turns an RTK Query error (FetchBaseQueryError | SerializedError | unknown) into
 * something a user can read. The server answers errors in two shapes — plain
 * `{ message }` from explicit controller responses (400/404/401), and RFC 7807
 * ProblemDetails from the global exception handler and model validation — this
 * covers both, plus RTK's own network/timeout/parsing failure shapes.
 */

interface HttpErrorLike {
  status?: unknown;
  data?: unknown;
  error?: string;
}

const isHttpErrorLike = (error: unknown): error is HttpErrorLike =>
  typeof error === 'object' && error !== null && 'status' in error;

/** HTTP status code, or undefined for network/timeout/parsing failures. */
export const getErrorStatus = (error: unknown): number | undefined => {
  const status = isHttpErrorLike(error) ? error.status : undefined;
  return typeof status === 'number' ? status : undefined;
};

/** The traceId a ProblemDetails response carries, for a "support code" display. */
export const getErrorTraceId = (error: unknown): string | undefined => {
  const data = isHttpErrorLike(error) ? error.data : undefined;
  const traceId = (data as { traceId?: unknown } | undefined)?.traceId;
  return typeof traceId === 'string' ? traceId : undefined;
};

export type ErrorCategory = 401 | 'FETCH_ERROR' | 'SERVER_ERROR' | 'OTHER_ERROR';

/**
 * Buckets a raw RTK Query error into the categories the UI reasons about. 401 is its
 * own category since callers branch on it before ever calling getErrorMessage (e.g.
 * to show a sign-in screen instead of an error message) — see [[getErrorStatus]].
 */
export const getErrorCategory = (error: unknown): ErrorCategory => {
  const status = isHttpErrorLike(error) ? error.status : undefined;
  if (status === 401) {
    return 401;
  }
  if (status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR') {
    return 'FETCH_ERROR';
  }
  if (status === 500) {
    return 'SERVER_ERROR';
  }
  return 'OTHER_ERROR';
};

/**
 * Per-field explanations from a model-validation answer (`errors: { Field: [messages] }`),
 * every message kept — [[getErrorMessage]] only returns the first. Empty when the error
 * carries none. Field names are the server's (PascalCase).
 */
export const getFieldErrors = (error: unknown): Record<string, string[]> => {
  const data = isHttpErrorLike(error) ? error.data : undefined;
  const errors = (data as { errors?: unknown } | undefined)?.errors;
  if (typeof errors !== 'object' || errors === null) {
    return {};
  }
  const result: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(errors)) {
    if (Array.isArray(messages)) {
      const strings = messages.filter((m): m is string => typeof m === 'string' && m !== '');
      if (strings.length > 0) {
        result[field] = strings;
      }
    }
  }
  return result;
};

/**
 * User-readable reason for a no-response failure, chosen from the original error text that
 * fetch rejected with (RTK puts it in `error.error`, e.g. "TypeError: Network request failed",
 * "AbortError: Aborted", "javax.net.ssl.SSLHandshakeException ..."). React Native reports
 * most network failures with the same generic text, so the specific branches only fire when
 * the platform actually names the cause; the last branch is the honest generic answer.
 */
const describeNoResponse = (status: unknown, original: string | undefined): string => {
  const text = (original ?? '').toLowerCase();

  // Our own timeout: RTK labels it TIMEOUT_ERROR, React Native surfaces it as an abort.
  if (status === 'TIMEOUT_ERROR' || /abort|timeout|timed out/.test(text)) {
    return 'The server did not respond in time. Check your connection and try again.';
  }
  if (/ssl|tls|certificate|handshake|trust anchor|cert_/.test(text)) {
    return "A secure connection to the server could not be established (certificate problem).";
  }
  if (/cleartext/.test(text)) {
    return 'The device blocked an insecure (http) connection to the server.';
  }
  if (/refused|econnrefused/.test(text)) {
    return 'The server is not accepting connections. It may be down or restarting.';
  }
  if (/unable to resolve host|enotfound|dns|unknown host|name not resolved/.test(text)) {
    return 'The server address could not be found. Check your connection and the server address.';
  }
  if (/reset|broken pipe|connection closed|econnreset|eof/.test(text)) {
    return 'The connection to the server was interrupted. Please try again.';
  }
  if (/offline|no internet|network is unreachable|enetunreach/.test(text)) {
    return 'No network connection. Check your internet connection and try again.';
  }
  return 'Cannot reach the server. Check your connection and try again.';
};

export const getErrorMessage = (error: unknown, fallback = 'Unknown error'): string => {
  if (!isHttpErrorLike(error)) {
    // SerializedError (e.g. from a rejected mutation thunk) or a plain Error.
    const message = (error as { message?: unknown })?.message;
    return typeof message === 'string' && message ? message : fallback;
  }

  if (getErrorCategory(error) === 'FETCH_ERROR') {
    return describeNoResponse(error.status, error.error);
  }

  if (error.status === 'PARSING_ERROR') {
    return 'The server sent a response the app could not read. Please try again.';
  }

  // 401 and SERVER_ERROR/OTHER_ERROR all read whatever message the server sent.
  const data = error.data as
    | { message?: unknown; detail?: unknown; title?: unknown; errors?: Record<string, string[]> }
    | undefined;

  if (typeof data?.message === 'string' && data.message) {
    return data.message;
  }
  if (typeof data?.detail === 'string' && data.detail) {
    return data.detail;
  }
  if (data?.errors) {
    const firstField = Object.values(data.errors)[0];
    if (firstField?.[0]) {
      return firstField[0];
    }
  }
  if (typeof data?.title === 'string' && data.title) {
    return data.title;
  }

  // The server answered but sent no readable message: a gateway / availability status is
  // more useful to the user than the caller's generic fallback.
  if (error.status === 502 || error.status === 503 || error.status === 504) {
    return 'The server is temporarily unavailable. Please try again in a moment.';
  }

  return fallback;
};

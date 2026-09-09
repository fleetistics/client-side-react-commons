/**
 * W3C Trace Context (traceparent) generation for outgoing API requests.
 *
 * Each request gets fresh ids and carries them in the `traceparent` header; the
 * server's OpenTelemetry instrumentation continues that trace instead of starting
 * its own, so the browser action becomes the root of the server trace. The traceId
 * is also handed to the flight recorder (via setTraceRecorder), which makes a
 * "Report a problem" upload contain the exact trace ids of the user's recent
 * requests — one paste away from the server-side trace in the telemetry backend.
 */

const hex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

const randomHex = (byteLength: number): string => {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  // The spec forbids all-zero ids. A zero draw is astronomically unlikely, but the
  // guard costs one byte.
  if (bytes.every((b) => b === 0)) {
    bytes[0] = 1;
  }
  return hex(bytes);
};

export interface TraceContext {
  /** Full header value: 00-{traceId}-{spanId}-01 */
  traceparent: string;
  /** 32 hex chars — the id to look the trace up by in the telemetry backend. */
  traceId: string;
}

export const newTraceContext = (): TraceContext => {
  const traceId = randomHex(16);
  const spanId = randomHex(8);
  return { traceId, traceparent: `00-${traceId}-${spanId}-01` };
};

/**
 * Hook for the flight recorder. Registered from initFlightRecorder() rather than
 * imported here: the recorder's uploader imports apiSlice (for the auth token), so
 * importing the recorder from the data layer would be a module cycle.
 */
type TraceRecorder = (endpoint: string, traceId: string) => void;

let traceRecorder: TraceRecorder | null = null;

export const setTraceRecorder = (recorder: TraceRecorder | null): void => {
  traceRecorder = recorder;
};

export const recordTrace = (endpoint: string, traceId: string): void => {
  try {
    traceRecorder?.(endpoint, traceId);
  } catch {
    // Recording is diagnostics; it must never break the request that triggered it.
  }
};

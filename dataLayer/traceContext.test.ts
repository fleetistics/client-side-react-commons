import { newTraceContext, recordTrace, setTraceRecorder } from './traceContext';

describe('newTraceContext', () => {
  const TRACEPARENT_RE = /^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/;

  it('produces a spec-valid traceparent header', () => {
    const ctx = newTraceContext();
    expect(ctx.traceparent).toMatch(TRACEPARENT_RE);
    expect(ctx.traceparent).toContain(ctx.traceId);
  });

  it('never produces all-zero ids', () => {
    const ctx = newTraceContext();
    expect(ctx.traceId).not.toBe('0'.repeat(32));
  });

  it('produces unique ids per call', () => {
    const ids = new Set(Array.from({ length: 50 }, () => newTraceContext().traceId));
    expect(ids.size).toBe(50);
  });
});

describe('recordTrace', () => {
  afterEach(() => {
    setTraceRecorder(null);
  });

  it('invokes the registered recorder', () => {
    const recorder = vi.fn();
    setTraceRecorder(recorder);
    recordTrace('getUsers', 'abc123');
    expect(recorder).toHaveBeenCalledWith('getUsers', 'abc123');
  });

  it('is a no-op without a recorder', () => {
    expect(() => recordTrace('getUsers', 'abc123')).not.toThrow();
  });

  it('swallows recorder failures', () => {
    setTraceRecorder(() => {
      throw new Error('recorder broke');
    });
    expect(() => recordTrace('getUsers', 'abc123')).not.toThrow();
  });
});

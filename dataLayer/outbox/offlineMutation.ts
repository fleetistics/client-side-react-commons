import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

export type OutboxDispatch = ThunkDispatch<any, any, UnknownAction>;

/**
 * How a queued call looks locally before the server has it: which query cache entry to
 * patch, and an Immer recipe that patches it (or returns a replacement value when the
 * entry's data is null/primitive).
 *
 * Recipes are re-run - after every refetch of the target query (fresh server data does not
 * contain unsent changes yet) and after an app restart - so they must depend only on the
 * item's args and be safe to apply twice: "set these fields", never "increment"/"push".
 */
export interface OptimisticRecipe {
  endpointName: string;
  queryArgs: unknown;
  apply: (draft: any) => any;
}

export interface OfflineMutationDef<Args, Result> {
  entityKeys: (args: Args) => string[];
  optimistic?: (args: Args) => OptimisticRecipe[];
  /**
   * Called once the server accepted the call. Optional: the endpoint's own invalidatesTags
   * already fire on the replay (it goes through the normal mutation), which refetches.
   */
  reconcile?: (result: Result, args: Args, dispatch: OutboxDispatch) => void;
  /**
   * Called when the server rejects the call for good (4xx other than 401/408/429). The
   * outbox has already invalidated the item's entityKeys (so queries refetch the server's
   * truth); use this for side effects outside the cache that the optimistic path set.
   */
  onPermanentFailure?: (args: Args, dispatch: OutboxDispatch) => void | Promise<void>;
  /**
   * 'replace': enqueuing drops older not-yet-sent items of the same endpoint and entityKeys
   * - only the latest value matters (e.g. an absolute "set PrivacyMode = X").
   * 'append' (default): every call is kept and sent in order.
   */
  coalesce?: 'replace' | 'append';
}

/** The parts of an RTK Query mutation endpoint (api.endpoints.x) the outbox uses. */
export interface MutationEndpointLike {
  name: string;
  initiate: (arg: any) => any;
  Types?: { QueryArg?: unknown; ResultType?: unknown };
}

export type ArgsOf<E> = E extends { Types: { QueryArg: infer A } } ? A : never;
export type ResultOf<E> = E extends { Types: { ResultType: infer R } } ? R : never;

export interface RegisteredOfflineMutation {
  endpoint: MutationEndpointLike;
  def: OfflineMutationDef<any, any>;
}

const registry = new Map<string, RegisteredOfflineMutation>();

/**
 * Declares an existing RTK Query mutation as offline-first. Call once, next to the endpoint
 * (definitions are static, so this registry is module-level and shared by every store).
 * Server-first calls to the same endpoint (useXMutation) keep working unchanged.
 */
export function registerOfflineMutation<E extends MutationEndpointLike>(
  endpoint: E,
  def: OfflineMutationDef<ArgsOf<E>, ResultOf<E>>
): void {
  registry.set(endpoint.name, { endpoint, def });
}

export function getOfflineMutation(endpointName: string): RegisteredOfflineMutation | undefined {
  return registry.get(endpointName);
}

export function getRegisteredOfflineMutations(): RegisteredOfflineMutation[] {
  return [...registry.values()];
}

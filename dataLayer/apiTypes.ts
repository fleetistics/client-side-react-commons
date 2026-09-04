/**
 * Helpers for deriving app-facing DTO types from the generated OpenAPI schema
 * (`apiSchema.d.ts`, refreshed via `yarn generate:api`). The schema marks every
 * property optional/nullable — System.Text.Json's schema exporter doesn't encode
 * C# non-nullability — so these narrow specific fields back to what an endpoint
 * actually always returns, while still sourcing the field *names* from the
 * schema: a server-side rename or removal fails the client typecheck instead of
 * silently drifting (see e.g. `user/userDto.ts`).
 */

/** Drops `null` from a schema property's type. */
export type NonNull<T> = T extends null ? never : T;

/** Picks the given keys from a schema type and makes each one required and non-null. */
export type Concrete<T, K extends keyof T> = { [P in K]-?: NonNull<T[P]> };

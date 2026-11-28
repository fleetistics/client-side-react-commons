import type { UserPatchDto } from '@/client-side.Commons/dataLayer/open-api';

// Unlike User, this one doesn't need Concrete<>'s null-narrowing — the
// server's Optional<T> schema transformer faithfully encodes each field's real
// nullability (see UserPatchDto.cs / OptionalPropertySchemaTransformer.cs), so
// the generated type is already accurate. InsertMedias is the exception: its
// schema item type leaves every field optional, so we swap in the already-
// narrowed InboundUploadedMediaDto (see uploadedMediaDto.ts) instead.
export type UserPatch = Pick<
  UserPatchDto,
  'DisplayName' | 'FirstName' | 'LastName' | 'Phone' | 'Email' | 'RemoveMediaIds' | 'InsertMedias'
> & {
  // Not in the generated UserPatchDto until open-api is regenerated from a server that has it.
  IsMfaEnabled?: boolean;
};

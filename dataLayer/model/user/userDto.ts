import type { UserDto as UserDtoSchema } from '@/client-side.Commons/dataLayer/open-api';
import type { Concrete } from '@/client-side.Commons/dataLayer/core/apiTypes';

// UserController always populates these for an existing user.
// Medias is handled separately from Concrete<>: the schema's own array item
// type leaves every field optional/nullable, so narrowing just the array
// wouldn't narrow its items — UploadedMediaDto (see uploadedMediaDto.ts) does
// that narrowing already, so we swap it in directly.
export type User = Concrete<
  UserDtoSchema,
  'Id' | 'DisplayName' | 'UserName' | 'FullName' | 'Phone' | 'Email' | 'AvatarImage' | 'GovIDImage'>;

// export type NewUser = Concrete<
//   UserDtoSchema,
//   'UserName' | 'DisplayName' | 'FullName' | 'Phone' | 'Email'
// >;

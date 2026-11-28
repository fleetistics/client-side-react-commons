import type { UserDto } from '@/client-side.Commons/dataLayer/open-api/models/UserDto';

/** Placeholder to use when a UserDto cannot be found by id (deleted user, not loaded yet, etc.). Frozen: never mutate it. */
export const UnknownUser: Readonly<UserDto> = Object.freeze({
  Id: 0,
  DisplayName: 'Unknown user',
  UserName: 'Unknown',
  FirstName: 'Unknown user',
  Phone: '',
  Email: '',
});

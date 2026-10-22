import type {
  UserLocationPrivacyDto as UserLocationPrivacyDtoSchema,
  UserLocationPrivacyPatchDto,
} from '@/client-side.Commons/dataLayer/open-api';
import type { Concrete } from '@/client-side.Commons/dataLayer/core/apiTypes';

// UserController returns 200 with both fields populated when a record exists, and 404
// (not 200-with-empty-body) when the current user has none yet — see myUserLocationPrivacyApi.ts's
// getUserLocationPrivacy, which turns that 404 into a `null` result rather than an error.
export type UserLocationPrivacyDto = Concrete<
  UserLocationPrivacyDtoSchema,
  'PrivacyMode' | 'LatestUpdate'
>;

// The only field this PATCH accepts, so unlike UserPatch's partial-update fields, there's
// no reason to leave it optional — every call is setting it.
export type UserLocationPrivacyPatch = {
  PrivacyMode: NonNullable<UserLocationPrivacyPatchDto['PrivacyMode']>;
};

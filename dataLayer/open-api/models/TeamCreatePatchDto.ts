/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TeamDetailsPatchDto } from './TeamDetailsPatchDto';
import type { TeamMemberUserPatchDto } from './TeamMemberUserPatchDto';
import type { TeamPatchDto } from './TeamPatchDto';
import type { UserPatchDto } from './UserPatchDto';
export type TeamCreatePatchDto = {
    Team?: TeamPatchDto;
    TeamDetails?: TeamDetailsPatchDto;
    CreatorUser?: UserPatchDto;
    CreatorTeamMemberUser?: TeamMemberUserPatchDto;
};


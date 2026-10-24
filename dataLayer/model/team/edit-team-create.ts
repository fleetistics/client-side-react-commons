import type { TeamCreateDto } from "../../open-api"
import type { EditUser } from "../user/edit-user";


export type EditTeamCreate = TeamCreateDto & {
    CreatorUser?: EditUser;
}
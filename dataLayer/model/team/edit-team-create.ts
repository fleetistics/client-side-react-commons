import { TeamCreateDto } from "../../open-api"
import { EditUser } from "../user/edit-user";


export type EditTeamCreate = TeamCreateDto & {
    CreatorUser?: EditUser;
}
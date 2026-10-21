import { EditorUploadedMedia } from "@/client-side.Commons/dataLayer/model/uploaded-media";
import { UserDto } from "../../open-api";



export type EditUser = UserDto & {
    Medias: EditorUploadedMedia[]
}

export enum EditUserGroupKey {
    Avatar = 1,
    GovID = 2
}

export class EditUserHelper {
    public static PrepareMediasToEdit(userToEdit: EditUser): void {
        userToEdit.Medias = [];
        if (userToEdit.AvatarImage) {
            userToEdit.Medias.push({...userToEdit.AvatarImage, GroupKey: EditUserGroupKey.Avatar }as EditorUploadedMedia);
        }
        if (userToEdit.GovIDImage) {
            userToEdit.Medias.push({...userToEdit.GovIDImage, GroupKey: EditUserGroupKey.GovID }as EditorUploadedMedia);
        }
    }
}
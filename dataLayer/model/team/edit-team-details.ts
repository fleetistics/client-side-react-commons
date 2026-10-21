import type { TeamDetailsDto } from '../../open-api';
import type { EditorUploadedMedia } from '@/client-side.Commons/dataLayer/model/uploaded-media';
import { TeamMediaGroupKey } from './team-const';

/** TeamDetailsDto for editing: Medias is the flat list MediaSelector and BuildFormPatchValue work with. */
export type EditTeamDetails = Omit<TeamDetailsDto, 'Medias'> & {
    Medias: EditorUploadedMedia[];
};

export type EditTeamDetailsForm = {
    TeamDetails: EditTeamDetails;
};

export class EditTeamDetailsHelper {
    public static PrepareToEdit(details?: TeamDetailsDto): EditTeamDetails {
        const { Medias, ...rest } = details ?? {};
        const medias: EditorUploadedMedia[] = [];
        for (const teamMedia of Medias ?? []) {
            const media = teamMedia.Media;
            if (!media) continue;
            medias.push({
                Id: teamMedia.UploadedMediaId ?? media.Id,
                GroupKey: teamMedia.GroupKey ?? TeamMediaGroupKey.CommonDetails,
                MediaType: media.MediaType ?? 0,
                Url: media.Url ?? '',
                PreviewUrl: media.PreviewUrl ?? media.Url ?? '',
                Guid: '', // only media picked on this device has a client-side guid
            });
        }
        return { ...rest, Medias: medias };
    }
}

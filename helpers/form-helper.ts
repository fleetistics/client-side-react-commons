import { InboundUploadedMediaDto, UploadedMediaDto } from "@/app.DataLayer/other/uploadedMediaDto";
import { MediaUploadService } from "@/app.Commons/services/media-uploader/mediaUploadService";

export function StartMediaUpload(patch: any) {
    if (patch.InsertMedias && Array.isArray(patch.InsertMedias)) {
        MediaUploadService.Enqueue(patch.InsertMedias);
    }
}

export function BuildPatchValue<TPatch extends Record<string, unknown>>(
    values: Record<string, unknown>,
    dirtyFields: Record<string, unknown>
): TPatch | null {
    const { Medias: mediasDirty, ...fieldDirtyFields } = dirtyFields;
    const patch = {} as TPatch;
    const patchRecord = patch as Record<string, unknown>;
    for (const field of Object.keys(fieldDirtyFields)) {
        patchRecord[field] = values[field];
    }
    if (mediasDirty && Array.isArray(values['Medias']) && values['Medias'].length > 0) {
        values['Medias'].forEach((media: UploadedMediaDto) => {
            if (media.PreviewUrl == '**Deleted**') {
                if (!patchRecord['RemoveMediaIds']) {
                    patchRecord['RemoveMediaIds'] = [];
                }
                (patchRecord['RemoveMediaIds'] as number[]).push(media.Id);
            }
            else if (media.Id == null) {
                if (!patchRecord['InsertMedias']) {
                    patchRecord['InsertMedias'] = [];
                }
                (patchRecord['InsertMedias'] as InboundUploadedMediaDto[]).push({
                    Guid: media.Guid,
                    Url: media.Url,
                    MediaType: media.MediaType,
                    GroupKey: media.GroupKey
                });
            }
        });
    }
    if (Object.keys(patch).length === 0) return null;
    else return patch;
}
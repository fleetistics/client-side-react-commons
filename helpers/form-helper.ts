import type { EditorUploadedMedia, ServerInboundUploadedMedia } from "../dataLayer/model/uploaded-media";

export function BuildFormPatchValue<TPatch extends Record<string, unknown>>(
    values: Record<string, unknown> | null | undefined,
    dirtyFields: Record<string, unknown> | null | undefined
): TPatch | undefined {
    // An absent entity (optional section of a form) has nothing to patch.
    if (!values) return undefined;
    const patch = {} as TPatch;
    const patchRecord = patch as Record<string, unknown>;
    let wasPatched = false;
    // No dirty fields (react-hook-form leaves the section out until something changes) - only medias can still patch.
    for (const field of Object.keys(dirtyFields ?? {})) {
        if (field === 'Medias') continue; // Skip the Medias field, handled separately below
        patchRecord[field] = values[field];
        wasPatched = true;
    }

    if (Array.isArray(values['Medias']) && values['Medias'].length > 0) {
        values['Medias'].forEach((media: EditorUploadedMedia) => {
            if (media.PreviewUrl == '**Deleted**') {
                if (media.Id) {
                    if (!patchRecord['RemoveMediaIds']) {
                        patchRecord['RemoveMediaIds'] = [];
                    }
                    (patchRecord['RemoveMediaIds'] as number[]).push(media.Id);
                    wasPatched = true;
                }
            }
            else if (media.Id == null) {
                if (!patchRecord['InsertMedias']) {
                    patchRecord['InsertMedias'] = [];
                }
                (patchRecord['InsertMedias'] as ServerInboundUploadedMedia[]).push({
                    Guid: media.Guid,
                    Url: media.Url,
                    MediaType: media.MediaType,
                    GroupKey: media.GroupKey
                });
                wasPatched = true;
            }
        });
    }
    if (!wasPatched) return undefined;  
    else return patch;
}
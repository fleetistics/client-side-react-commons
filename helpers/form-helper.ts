import type { FieldValues, UseFormSetError } from "react-hook-form";
import { getErrorMessage } from "../dataLayer/core/apiError";
import type { EditorUploadedMedia, ServerInboundUploadedMedia } from "../dataLayer/model/uploaded-media";

// Shows a failed submit as one form-level message (read it with <FormError>); react-hook-form clears it on the next submit.
// The server's own message wins; the title is the fallback when the error carries none.
export function ParseFormException<TFieldValues extends FieldValues>(
    setError: UseFormSetError<TFieldValues>,
    error: unknown,
    title: string
): void {
    setError("root.server", { type: "server", message: getErrorMessage(error, title) });
}

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

// The medias picked from local disk that still have to be uploaded: new (no Id), not removed again, holding their file.
// Once uploaded, set Url on the media with the matching Guid so BuildFormPatchValue sends it as InsertMedias.
export function BuildMediasToUpload(values: Record<string, unknown> | null | undefined): EditorUploadedMedia[] {
    const medias = values?.['Medias'];
    if (!Array.isArray(medias)) return [];
    return (medias as EditorUploadedMedia[]).filter(media =>
        media.Id == null && media.PreviewUrl != '**Deleted**' && media.FileObject != null && media.UploadedStatusId !== 1);
}

export function ResetForm(values: any | null | undefined, getValues: () => Record<string, unknown>, reset: (values: Record<string, unknown>, options?: { keepErrors?: boolean, keepDirty?: boolean, keepDirtyValues?: boolean }) => void): void {
    if (!values) return;
    const baseline = { ...values };
    for (const field of Object.keys(getValues())) if (!(field in baseline)) baseline[field] = undefined;
    reset(baseline, { keepErrors: false, keepDirty: false, keepDirtyValues: false });
}

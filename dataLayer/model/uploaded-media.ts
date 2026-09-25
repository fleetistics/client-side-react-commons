export type ServerInboundUploadedMedia = {
    GroupKey?: number,
    MediaType: number,
    Url: string,
    Guid: string
}
export type UploadedMedia = {
    Id?: number,
    GroupKey?: number,
    MediaType: number,
    Url: string,
    PreviewUrl: string
}
export type EditorUploadedMedia = UploadedMedia & {
    // **********************
    Guid: string // added in client side for just selected media
    // **********************
}
export type EditorUploadedMediasPack = {
    RemoveMediaIds?: number[],
    InsertMedias: ServerInboundUploadedMedia[]
}
import { apiSlice } from '@/client-side.Commons/dataLayer/core/apiSlice';
import { APP_URLS } from '@/client-side.Impl/config/app-urls';

// Hand-written contract of api-server's admin message-templates controller (base /api/admin/message-templates).
// Admin login required; errors are ProblemDetails { title, detail } - 422 means the template is invalid.
// Deliberately not part of the generated open-api client (that one is produced from a running server).

export type TemplateVariableType = 'string' | 'number' | 'boolean' | 'datetime' | 'list';

export interface TemplateVariable {
  /** Path as templates write it, named like the model's properties (PascalCase, case-sensitive), e.g. "Case.User.DisplayName"; list item leaves look like "Items[].Name". */
  path: string;
  type: TemplateVariableType;
  optional: boolean;
}

export interface TemplateModel {
  key: string;
  variables: TemplateVariable[];
  /** Sample values, shaped like the model. */
  sample: Record<string, unknown>;
}

export interface TemplateLanguageSummary {
  language: string;
  activeVersion: number | null;
  versions: number;
}

export interface TemplateSummary {
  key: string;
  /** False when the key has stored rows but no model class in code. */
  hasModel: boolean;
  languages: TemplateLanguageSummary[];
}

export interface TemplateVersion {
  id: number;
  language: string;
  version: number;
  isActive: boolean;
  subject: string;
  text: string | null;
  html: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface TemplateDraftBody {
  subject: string;
  text?: string;
  html?: string;
}

export interface CreateTemplateVersionArgs extends TemplateDraftBody {
  key: string;
  language: string;
}

export interface PreviewTemplateArgs extends TemplateDraftBody {
  key: string;
  language?: string;
  /** Overrides the model's sample data. */
  model?: Record<string, unknown>;
}

export interface TemplatePreview {
  subject: string;
  text: string;
  html: string;
}

const base = APP_URLS.BASE_MESSAGE_TEMPLATES_URL;
const enc = encodeURIComponent;

const LIST_TAG = { type: 'MessageTemplate', id: 'LIST' } as const;
export const versionsTag = (key: string, language: string) =>
  ({ type: 'MessageTemplate', id: `${key}|${language}` }) as const;

export const messageTemplatesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /models - the variables and sample data of every template model in code.
    getMessageTemplateModels: builder.query<TemplateModel[], void>({
      query: () => base + '/models',
    }),

    // GET / - every key (models in code and stored rows) with its languages and active versions.
    getMessageTemplates: builder.query<TemplateSummary[], void>({
      query: () => base,
      providesTags: [LIST_TAG],
    }),

    // GET /{key}/versions?language=xx - newest first.
    getMessageTemplateVersions: builder.query<TemplateVersion[], { key: string; language: string }>({
      query: ({ key, language }) => `${base}/${enc(key)}/versions?language=${enc(language)}`,
      providesTags: (_r, _e, { key, language }) => [versionsTag(key, language)],
    }),

    // POST /{key}/versions - always creates a NEW inactive version (versions are immutable). 201.
    createMessageTemplateVersion: builder.mutation<TemplateVersion, CreateTemplateVersionArgs>({
      query: ({ key, ...body }) => ({ url: `${base}/${enc(key)}/versions`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { key, language }) => [LIST_TAG, versionsTag(key, language)],
    }),

    // POST /versions/{id}/activate - 204. key/language are only used to refresh the right caches.
    activateMessageTemplateVersion: builder.mutation<void, { id: number; key: string; language: string }>({
      query: ({ id }) => ({ url: `${base}/versions/${id}/activate`, method: 'POST' }),
      invalidatesTags: (_r, _e, { key, language }) => [LIST_TAG, versionsTag(key, language)],
    }),

    // POST /{key}/preview - renders the draft strings with the model's sample (or `model`).
    previewMessageTemplate: builder.mutation<TemplatePreview, PreviewTemplateArgs>({
      query: ({ key, ...body }) => ({ url: `${base}/${enc(key)}/preview`, method: 'POST', body }),
    }),
  }),
});

export const {
  useGetMessageTemplateModelsQuery,
  useGetMessageTemplatesQuery,
  useGetMessageTemplateVersionsQuery,
  useCreateMessageTemplateVersionMutation,
  useActivateMessageTemplateVersionMutation,
  usePreviewMessageTemplateMutation,
} = messageTemplatesApi;

import { apiSlice } from '@/client-side.Commons/dataLayer/core/apiSlice';
import type { ContactCompanyDto } from '@/client-side.Commons/dataLayer/open-api/models/ContactCompanyDto';
import type { ContactCompanyRowDto } from '@/client-side.Commons/dataLayer/open-api/models/ContactCompanyRowDto';
import type { ContactLookupsDto } from '@/client-side.Commons/dataLayer/open-api/models/ContactLookupsDto';
import type { ContactPersonDto } from '@/client-side.Commons/dataLayer/open-api/models/ContactPersonDto';
import type { ContactPersonRowDto } from '@/client-side.Commons/dataLayer/open-api/models/ContactPersonRowDto';
import type { SaveContactCompanyDto } from '@/client-side.Commons/dataLayer/open-api/models/SaveContactCompanyDto';
import type { SaveContactPersonDto } from '@/client-side.Commons/dataLayer/open-api/models/SaveContactPersonDto';
import { APP_CONFIG } from '@/client-side.Impl/config/app-config';

// api-server's ContactsController (/api/contacts): the companies and people the caller's company keeps as contacts, plus its own company
// and colleagues. Types are generated from the OpenAPI. Not restricted by role yet.
// Errors are ProblemDetails { title, detail }: 400 bad input, 403 a rule says no (for example only the owner user can share a private
// contact), 404 not found (or private to another user).
const contacts = APP_CONFIG.BASE_API_URL + 'contacts';

// The lists are small and everything is linked (a new person changes a company's contact count and primary contact), so every
// mutation refetches every list and detail. Lookups are stable and never invalidated.
const ALL_TAG = { type: 'Contacts', id: 'ALL' } as const;
const LOOKUPS_TAG = { type: 'Contacts', id: 'LOOKUPS' } as const;

export const contactsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Types, lead sources, payment terms, and the members of the caller's company (account managers).
    getContactLookups: builder.query<ContactLookupsDto, void>({
      query: () => `${contacts}/lookups`,
      providesTags: [LOOKUPS_TAG],
    }),

    // The caller's own company and the company contacts they can see.
    getContactCompanies: builder.query<ContactCompanyRowDto[], void>({
      query: () => `${contacts}/companies`,
      providesTags: [ALL_TAG],
    }),

    getContactCompany: builder.query<ContactCompanyDto, number>({
      query: (id) => `${contacts}/companies/${id}`,
      providesTags: [ALL_TAG],
    }),

    // 201 with the new company. 400 for bad input.
    createContactCompany: builder.mutation<ContactCompanyDto, SaveContactCompanyDto>({
      query: (body) => ({ url: `${contacts}/companies`, method: 'POST', body }),
      invalidatesTags: [ALL_TAG],
    }),

    // Replaces the company's info: the whole form is sent (a field left out is cleared).
    updateContactCompany: builder.mutation<ContactCompanyDto, { id: number; body: SaveContactCompanyDto }>({
      query: ({ id, body }) => ({ url: `${contacts}/companies/${id}`, method: 'PUT', body }),
      invalidatesTags: [ALL_TAG],
    }),

    // Colleagues (members of the caller's company) and the contact people they can see, archived ones included (IsArchived).
    getContactPeople: builder.query<ContactPersonRowDto[], void>({
      query: () => `${contacts}/people`,
      providesTags: [ALL_TAG],
    }),

    getContactPerson: builder.query<ContactPersonDto, number>({
      query: (id) => `${contacts}/people/${id}`,
      providesTags: [ALL_TAG],
    }),

    // 201 with the new person. With NewCompany the company is made first.
    createContactPerson: builder.mutation<ContactPersonDto, SaveContactPersonDto>({
      query: (body) => ({ url: `${contacts}/people`, method: 'POST', body }),
      invalidatesTags: [ALL_TAG],
    }),

    // Replaces the person's info (whole form). 404 for a colleague: they are managed in User Management.
    updateContactPerson: builder.mutation<ContactPersonDto, { id: number; body: SaveContactPersonDto }>({
      query: ({ id, body }) => ({ url: `${contacts}/people/${id}`, method: 'PUT', body }),
      invalidatesTags: [ALL_TAG],
    }),

    archiveContactPerson: builder.mutation<ContactPersonDto, number>({
      query: (id) => ({ url: `${contacts}/people/${id}/archive`, method: 'POST' }),
      invalidatesTags: [ALL_TAG],
    }),

    unarchiveContactPerson: builder.mutation<ContactPersonDto, number>({
      query: (id) => ({ url: `${contacts}/people/${id}/unarchive`, method: 'POST' }),
      invalidatesTags: [ALL_TAG],
    }),
  }),
});

export const {
  useGetContactLookupsQuery,
  useGetContactCompaniesQuery,
  useGetContactCompanyQuery,
  useCreateContactCompanyMutation,
  useUpdateContactCompanyMutation,
  useGetContactPeopleQuery,
  useGetContactPersonQuery,
  useCreateContactPersonMutation,
  useUpdateContactPersonMutation,
  useArchiveContactPersonMutation,
  useUnarchiveContactPersonMutation,
} = contactsApi;

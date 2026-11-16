/** Mirrors db_model.Companies.User2CompanyStatus on the server. Keep in sync with the C# constants. */
export const User2CompanyStatus = {
  Active: 1,
  Suspended: 2,
  Deleted: 3,
  /** Still active for this company but for now switched by the user to the other company. Company admin can suspend. */
  WithOtherCompany: 4,
  /** Left by the user, company admin can suspend. */
  Left: 5,
  /** Suspended by the site admin (done with Suspend for User), not editable. */
  SuspendedBySiteAdmin: 13,
  DeletedBySiteAdmin: 14,
} as const

export type User2CompanyStatusId = (typeof User2CompanyStatus)[keyof typeof User2CompanyStatus]

export type User2CompanyStatusItem = { id: User2CompanyStatusId; name: string }

const items: readonly User2CompanyStatusItem[] = [
  { id: User2CompanyStatus.Active, name: "Active" },
  { id: User2CompanyStatus.Suspended, name: "Suspended" },
  { id: User2CompanyStatus.Deleted, name: "Deleted" },
  { id: User2CompanyStatus.WithOtherCompany, name: "With other company" },
  { id: User2CompanyStatus.Left, name: "Left" },
  { id: User2CompanyStatus.SuspendedBySiteAdmin, name: "Suspended by site admin" },
  { id: User2CompanyStatus.DeletedBySiteAdmin, name: "Deleted by site admin" },
]

const namesById = new Map<number, string>(items.map((x) => [x.id, x.name]))

export const User2CompanyStatus_refs = {
  /** All statuses as id, name pairs. */
  getList: (): readonly User2CompanyStatusItem[] => items,

  /** Status name by id, or undefined when the id is unknown. */
  getName: (statusId: number | null | undefined): string | undefined => (statusId == null ? undefined : namesById.get(statusId)),
}

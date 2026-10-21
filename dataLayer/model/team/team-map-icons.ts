// Map icons a member can pick for themselves (TeamMemberUser.IconKey). 0 / unset = Default.
// Values are stored on the server, so never renumber - only append.
export enum TeamMemberMapIcon {
  Default = 0,
  Atv = 1,
  Bearcat = 2,
  Bike = 3,
  Boat = 4,
  Cruiser = 5,
  Foot = 6,
  Helicopter = 7,
  K9 = 8,
  Motorcycle = 9,
  Segway = 10,
  Swat = 11,
}

export const TEAM_MEMBER_MAP_ICON_LABELS: Record<TeamMemberMapIcon, string> = {
  [TeamMemberMapIcon.Default]: 'Default',
  [TeamMemberMapIcon.Atv]: 'ATV',
  [TeamMemberMapIcon.Bearcat]: 'Bearcat',
  [TeamMemberMapIcon.Bike]: 'Bike',
  [TeamMemberMapIcon.Boat]: 'Boat',
  [TeamMemberMapIcon.Cruiser]: 'Cruiser',
  [TeamMemberMapIcon.Foot]: 'Foot',
  [TeamMemberMapIcon.Helicopter]: 'Helicopter',
  [TeamMemberMapIcon.K9]: 'K-9',
  [TeamMemberMapIcon.Motorcycle]: 'Motorcycle',
  [TeamMemberMapIcon.Segway]: 'Segway',
  [TeamMemberMapIcon.Swat]: 'SWAT',
};

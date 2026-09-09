export type UserSessionCheckResponse = {
  AccessToken: string;
  UserId: number;
  SessionId: number;
};

export type CheckSessionResult = {
  clientInfo: ClientSideInfo;
  serverSessionInfo: UserSessionCheckResponse;
};

export type LoginData = {
  UserName: string;
  Password: string;
  RememberMe: boolean;
};
export type ClientSideInfo = {
  AppUID: string;
  AppVersion: string;
  DeviceUID: string;
  CodeVersion: string;
  PlatformName: string;
  PlatformId: number;
  FCMToken: string;
};

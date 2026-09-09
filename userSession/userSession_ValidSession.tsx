import React from 'react';


export type UserSessionInfo = {
  UserId: number;
  SessionId: number;
  ClientAppId: number;
  PlatformId: number;
};

export const ReactUserSessionContext = React.createContext<UserSessionInfo>({
  UserId: -1,
  SessionId: -1,
  ClientAppId: 1,
  PlatformId: 1,
});
export function UserSession_ValidSession(props: {
  UserId: number;
  SessionId: number;
  ClientAppId: number;
  PlatformId: number;
  children: React.ReactNode;
}) {
  return (
    <ReactUserSessionContext.Provider
      value={{
        UserId: props.UserId,
        SessionId: props.SessionId,
        ClientAppId: props.ClientAppId,
        PlatformId: props.PlatformId,
      }}
    >
      {props.children}
    </ReactUserSessionContext.Provider>
  );
}
export const useUserSession = () => React.useContext(ReactUserSessionContext);

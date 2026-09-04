import React from 'react';

export type UserSessionInfo = {
  UserId: number;
  SessionId: number;
};

export const UserSessionContext = React.createContext<UserSessionInfo>({
  UserId: -1,
  SessionId: -1,
});
export function UserSession_ValidSession(props: {
  UserId: number;
  SessionId: number;
  children: React.ReactNode;
}) {
  return (
    <UserSessionContext.Provider
      value={{
        UserId: props.UserId,
        SessionId: props.SessionId,
      }}
    >
      {props.children}
    </UserSessionContext.Provider>
  );
}
export const useUserSession = () => React.useContext(UserSessionContext);

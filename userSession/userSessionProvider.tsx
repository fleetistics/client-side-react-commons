import { useEffect } from 'react';
import { getErrorMessage, getErrorStatus } from '@/client-side.Commons/dataLayer/core/apiError';
import { setOnAuthLost } from '@/client-side.Commons/dataLayer/core/apiSlice';
import { InitError } from '@/app.Impl/initComponents/init-error';
import { InitWaiter } from '@/app.Impl/initComponents/init-waiter';
import { NoAuthUI } from '@/app.Impl/userSession/noauth-ui';
import { UserSession_ValidSession  } from './userSession_ValidSession';
import { useCheckSessionQuery } from './userSessionApi';
import { APP_CONFIG } from '@/app.Impl/configs/app-config';
import { UserSessionContext } from './userSessionContext';

export function UserSessionProvider(props: {
  children: React.ReactNode;
  // Test/harness escape hatch: when set, skips the real checkSession call entirely and renders
  // children under a synthetic session with these values instead. Left undefined in every real
  // app entry point.
  mockSession?: { UserId: number; SessionId: number; PlatformId: number };
}) {
  const { data, isLoading, isError, error, refetch } = useCheckSessionQuery(undefined, {
    skip: props.mockSession != null,
  });
  console.log(`UserSessionProvider::useCheckSessionQuery isLoading {isLoading} isError {isError}  - Data/error:`, data, error);
  // When apiSlice exhausts its refresh path, re-check the session so the UI drops
  // back to the login screen instead of sitting on stale, unauthorized data.
  useEffect(() => {
    setOnAuthLost(() => {
      void refetch();
    });
    return () => setOnAuthLost(null);
  }, [refetch]);

  if (props.mockSession) {
    UserSessionContext.AssignValues(
      APP_CONFIG.ClientAppId,
      props.mockSession.PlatformId,
      props.mockSession.SessionId,
      props.mockSession.UserId
    );
    return (
      <UserSession_ValidSession
        UserId={props.mockSession.UserId}
        SessionId={props.mockSession.SessionId}
        ClientAppId={UserSessionContext.ClientAppId}
        PlatformId={props.mockSession.PlatformId}
      >
        {props.children}
      </UserSession_ValidSession>
    );
  }
  if (isLoading) {
    return <InitWaiter loadingLabel="Checking user session..." />;
  }
  if (isError) {
    if (getErrorStatus(error) === 401) {
      return <NoAuthUI reloadSessionFunc={refetch} />;
    }
    return (
      <InitError
        title="Session check failed"
        errorMsg={getErrorMessage(error)}
        retryFunc={refetch}
      />
    );
  }
  if (data === undefined) {
    return <InitError errorMsg="Session check failed: no data returned" retryFunc={refetch} />;
  }
  UserSessionContext.AssignValues(
    APP_CONFIG.ClientAppId,
    data.clientInfo.PlatformId,
    data.serverSessionInfo.SessionId,
    data.serverSessionInfo.UserId
  );
  return (
    <UserSession_ValidSession
      UserId={data.serverSessionInfo.UserId}
      SessionId={data.serverSessionInfo.SessionId}
      ClientAppId={UserSessionContext.ClientAppId}
      PlatformId={data.clientInfo.PlatformId}
    >
      {props.children}
    </UserSession_ValidSession>
  );
}

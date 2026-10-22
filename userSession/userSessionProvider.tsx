import { useEffect } from 'react';
import { useStore } from 'react-redux';
import { getErrorMessage, getErrorStatus } from '@/client-side.Commons/dataLayer/core/apiError';
import { setOnAuthLost } from '@/client-side.Commons/dataLayer/core/apiSlice';
import { getOutbox } from '@/client-side.Commons/dataLayer/outbox/outbox';
import { InitError } from '@/client-side.Impl/bootstrap/init-error';
import { InitWaiter } from '@/client-side.Impl/bootstrap/init-waiter';
import { NoAuthUI } from '@/client-side.Impl/userSession/noauth-ui';
import { UserSession_ValidSession } from './userSession_ValidSession';
import { useCheckSessionQuery } from './userSessionApi';
import { APP_CONFIG } from '@/client-side.Impl/config/app-config';
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

  // The saved offline queue belongs to the logged-in user: load and send it only once a
  // session exists (mock, or a successful session check).
  const store = useStore();
  // Same condition as the one below that renders <UserSession_ValidSession>.
  const hasSession = props.mockSession != null || (!isLoading && !isError && data !== undefined);
  useEffect(() => {
    if (hasSession) void getOutbox(store).startSending();
    if (data) {
      UserSessionContext.AssignValues(
        APP_CONFIG.ClientAppId,
        data.clientInfo.PlatformId,
        data.serverSessionInfo.SessionId,
        data.serverSessionInfo.UserId
      );
    }
  }, [hasSession, store]);

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

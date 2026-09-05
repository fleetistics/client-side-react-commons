import { Text } from 'react-native';
import { cleanup, fireEvent, installApiMock, jsonResponse, renderApp, screen } from '@test-utils';
import { AuthToken } from '@/client-side.Commons/dataLayer/apiSlice';
import { USER_SESSION_CONSTS } from '@/app.Impl/configs/userSession-consts';
import { UserSessionProvider } from './userSessionProvider';

// The real NoAuthUI mounts a react-navigation native-stack around LoginPage — worth its
// own test file. Here we only need to verify UserSessionProvider renders it on a 401 and
// wires reloadSessionFunc correctly, so a minimal stand-in keeps this file focused on
// UserSessionProvider's own branching.
jest.mock('@/app.Impl/userSession/noauth-ui', () => {
  const { Pressable, Text: RNText } = require('react-native');
  return {
    NoAuthUI: (props: { reloadSessionFunc?: () => void }) => (
      <Pressable testID="noauth-retry" onPress={props.reloadSessionFunc}>
        <RNText>Sign in</RNText>
      </Pressable>
    ),
  };
});

const session = { AccessToken: 'eyJtest.token.value', UserId: 7, SessionId: 42 };
const checkSessionPath = new URL(USER_SESSION_CONSTS.CHECK_SESSION_URL).pathname;

afterEach(() => {
  cleanup();
  AuthToken.clear();
});

describe('UserSessionProvider', () => {
  it('shows a loading state while the session check is in flight', async () => {
    // Left dangling, a never-resolving fetch keeps InitWaiter's ActivityIndicator
    // scheduling requestAnimationFrame past this test's end, which throws once Jest
    // tears the environment down — so resolve it before the test finishes.
    let resolveCheck!: (response: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      resolveCheck = resolve;
    });
    installApiMock({
      [`POST ${checkSessionPath}`]: () => pending,
    });

    renderApp(
      <UserSessionProvider>
        <Text>app content</Text>
      </UserSessionProvider>
    );

    expect(await screen.findByText('Checking user session...')).toBeTruthy();

    resolveCheck(jsonResponse(session));
    await screen.findByText('app content');
  });

  it('renders children and stores the token when the session is valid', async () => {
    installApiMock({
      [`POST ${checkSessionPath}`]: () => jsonResponse(session),
    });

    renderApp(
      <UserSessionProvider>
        <Text>app content</Text>
      </UserSessionProvider>
    );

    expect(await screen.findByText('app content')).toBeTruthy();
    expect(AuthToken.jwtToken).toBe(session.AccessToken);
  });

  it('shows the no-auth screen on 401 without attempting a token refresh', async () => {
    const api = installApiMock({
      [`POST ${checkSessionPath}`]: () => jsonResponse({ message: 'no session' }, 401),
    });

    renderApp(
      <UserSessionProvider>
        <Text>app content</Text>
      </UserSessionProvider>
    );

    expect(await screen.findByTestId('noauth-retry')).toBeTruthy();
    expect(screen.queryByText('app content')).toBeNull();
    // A 401 from the session check is a normal "not signed in" — it must not trigger the
    // refresh flow (that would hit the refresh endpoint against this mock and fail/loop).
    expect(api.requests.every((r) => r.pathname === checkSessionPath)).toBe(true);
  });

  it('shows an error screen with retry for non-401 failures', async () => {
    installApiMock({
      [`POST ${checkSessionPath}`]: () => jsonResponse({ message: 'nope' }, 400),
    });

    renderApp(
      <UserSessionProvider>
        <Text>app content</Text>
      </UserSessionProvider>
    );

    expect(await screen.findByText('Session check failed')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
  });

  it('retries the session check when "Try again" is pressed', async () => {
    let attempt = 0;
    const api = installApiMock({
      [`POST ${checkSessionPath}`]: () => {
        attempt += 1;
        return attempt === 1 ? jsonResponse({ message: 'nope' }, 400) : jsonResponse(session);
      },
    });

    renderApp(
      <UserSessionProvider>
        <Text>app content</Text>
      </UserSessionProvider>
    );

    await screen.findByText('Session check failed');
    fireEvent.press(screen.getByText('Try again'));

    expect(await screen.findByText('app content')).toBeTruthy();
    expect(api.requests).toHaveLength(2);
  });

  it('re-checks the session when NoAuthUI asks it to, and renders children once it succeeds', async () => {
    let authenticated = false;
    installApiMock({
      [`POST ${checkSessionPath}`]: () =>
        authenticated ? jsonResponse(session) : jsonResponse({ message: 'no session' }, 401),
    });

    renderApp(
      <UserSessionProvider>
        <Text>app content</Text>
      </UserSessionProvider>
    );

    await screen.findByTestId('noauth-retry');
    authenticated = true;
    fireEvent.press(screen.getByTestId('noauth-retry'));

    expect(await screen.findByText('app content')).toBeTruthy();
    expect(AuthToken.jwtToken).toBe(session.AccessToken);
  });
});

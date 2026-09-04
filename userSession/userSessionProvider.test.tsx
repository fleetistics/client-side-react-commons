import { installApiMock, jsonResponse, renderApp, screen, userEvent, waitFor } from '@test-utils';
import { AuthToken } from '@/app.Commons/dataLayer/apiSlice';
import { UserSessionProvider } from './userSessionProvider';

const session = { accessToken: 'eyJtest.token.value', userId: 7, sessionId: 42 };

beforeAll(() => {
  vi.stubEnv('VITE_BASE_URL', 'http://api.test');
});

afterEach(() => {
  vi.unstubAllGlobals();
  AuthToken.clear();
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe('UserSessionProvider', () => {
  it('renders children and stores the token when the session is valid', async () => {
    installApiMock({ 'POST /api/auth/CheckSession': () => jsonResponse(session) });

    renderApp(
      <UserSessionProvider>
        <div>app content</div>
      </UserSessionProvider>
    );

    expect(await screen.findByText('app content')).toBeInTheDocument();
    expect(AuthToken.jwtToken).toBe(session.accessToken);
  });

  it('shows the login screen on 401 without attempting a token refresh', async () => {
    const api = installApiMock({
      'POST /api/auth/CheckSession': () => jsonResponse({ message: 'no session' }, 401),
    });

    renderApp(
      <UserSessionProvider>
        <div>app content</div>
      </UserSessionProvider>
    );

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByText('app content')).not.toBeInTheDocument();
    // A 401 from the session check is a normal "not signed in" — it must not
    // trigger the refresh flow (that would 501 against this mock and loop).
    expect(api.requests.every((r) => r.pathname === '/api/auth/CheckSession')).toBe(true);
  });

  it('shows an error screen with retry for non-401 failures', async () => {
    installApiMock({
      'POST /api/auth/CheckSession': () => jsonResponse({ message: 'nope' }, 400),
    });

    renderApp(
      <UserSessionProvider>
        <div>app content</div>
      </UserSessionProvider>
    );

    expect(await screen.findByText('Session check failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('completes the full login round-trip: 401 → sign in → app renders', async () => {
    // Stateful mock: login flips the session state, the recheck then succeeds.
    let authenticated = false;
    installApiMock({
      'POST /api/auth/CheckSession': () =>
        authenticated ? jsonResponse(session) : jsonResponse({ message: 'no session' }, 401),
      'POST /api/auth/login': (_req, recorded) => {
        const body = recorded.body as { UserName: string; Password: string };
        if (body.UserName === 'alice' && body.Password === 'secret') {
          authenticated = true;
          return jsonResponse(session);
        }
        return jsonResponse({ message: 'bad credentials' }, 401);
      },
    });
    const user = userEvent.setup();

    renderApp(
      <UserSessionProvider>
        <div>app content</div>
      </UserSessionProvider>
    );

    await screen.findByRole('heading', { name: 'Sign in' });

    // Wrong password first: stays on the login screen with an error.
    await user.type(screen.getByLabelText(/^username/i), 'alice');
    await user.type(screen.getByLabelText(/^password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Invalid username or password')).toBeInTheDocument();

    // Correct password: session recheck succeeds and the app appears.
    await user.clear(screen.getByLabelText(/^password/i));
    await user.type(screen.getByLabelText(/^password/i), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('app content')).toBeInTheDocument();
    });
    expect(AuthToken.jwtToken).toBe(session.accessToken);
  });
});

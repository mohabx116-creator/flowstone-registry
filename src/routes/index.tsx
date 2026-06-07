import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/lib/auth-api';
import { isAuthenticated, setStoredAuth } from '@/lib/auth-storage';

export const Route = createFileRoute('/')({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate({ to: '/dashboard' });
      return;
    }

    const checkAutoLogin = async () => {
      const isDemoAutoLogin = import.meta.env.VITE_DEMO_AUTO_LOGIN === 'true';
      const hasLoggedOut = typeof window !== 'undefined' && window.sessionStorage.getItem('flowstone_demo_logout') === 'true';

      if (isDemoAutoLogin && !hasLoggedOut && !autoLoginAttempted) {
        setAutoLoginAttempted(true);
        setLoading(true);
        setError(null);
        try {
          const demoEmail = import.meta.env.VITE_DEMO_EMAIL || 'admin@flowstone.dev';
          const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || 'password123';
          
          const response = await login(demoEmail, demoPassword);
          setStoredAuth(response.access_token, response.user);
          navigate({ to: '/dashboard' });
        } catch (err) {
          setError(err instanceof Error ? `Auto-login failed: ${err.message}` : 'Auto-login failed');
          setLoading(false);
        }
      }
    };

    checkAutoLogin();
  }, [navigate, autoLoginAttempted]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setLoading(true);
    setAutoLoginAttempted(true);

    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('flowstone_demo_logout');
    }

    try {
      const response = await login(email, password);

      setStoredAuth(response.access_token, response.user);

      navigate({ to: '/dashboard' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
      setLoading(false);
    }
  };

  const isAutoLoggingIn = loading && import.meta.env.VITE_DEMO_AUTO_LOGIN === 'true' && !autoLoginAttempted;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">
            FlowStone Registry
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {isAutoLoggingIn ? 'Logging you in automatically...' : 'Sign in to your account'}
          </p>
        </div>

        {isAutoLoggingIn ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
            <p className="text-xs text-muted-foreground">Initiating demo session...</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
            autoComplete="off"
          >
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="flowstone-login-email">Email address</Label>

                <Input
                  id="flowstone-login-email"
                  name="flowstone-login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@flowstone.dev"
                  disabled={loading}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="flowstone-login-password">Password</Label>

                <Input
                  id="flowstone-login-password"
                  name="flowstone-login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>

            <div className="mt-4 text-center text-xs text-muted-foreground">
              <p>Demo accounts: admin, investor, compliance, issuer</p>
              <p>Password: password123</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
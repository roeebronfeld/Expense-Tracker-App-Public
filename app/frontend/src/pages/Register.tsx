import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Eye, EyeOff, Check, X } from 'lucide-react';
import { toast } from 'sonner';

// Use relative URL - same domain serves both frontend and API
const API_BASE = import.meta.env.VITE_API_URL ?? "";

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordValidation = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    passwordsMatch: password === confirmPassword && password.length > 0,
  };

  const isValid = Object.values(passwordValidation).every(Boolean) && fullName.trim() && email.includes('@');

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Registration failed');
        return;
      }

      toast.success('Account created! Please sign in');
      navigate('/');
    } catch (err) {
      toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-glow">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">Expense Tracker</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Sign up to start tracking your expenses</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {password && (
                <div className="text-sm space-y-2 p-3 rounded-lg bg-secondary/50">
                  <p className="font-medium mb-2">Password requirements:</p>
                  <ValidationItem valid={passwordValidation.minLength}>
                    At least 8 characters
                  </ValidationItem>
                  <ValidationItem valid={passwordValidation.hasUppercase}>
                    One uppercase letter
                  </ValidationItem>
                  <ValidationItem valid={passwordValidation.hasLowercase}>
                    One lowercase letter
                  </ValidationItem>
                  <ValidationItem valid={passwordValidation.hasNumber}>
                    One number
                  </ValidationItem>
                  {confirmPassword && (
                    <ValidationItem valid={passwordValidation.passwordsMatch}>
                      Passwords match
                    </ValidationItem>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading || !isValid}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link to="/" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

function ValidationItem({ valid, children }: { valid: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {valid ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={valid ? 'text-success' : 'text-muted-foreground'}>{children}</span>
    </div>
  );
}

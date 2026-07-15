import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { auth } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Users, Loader2, Mail } from 'lucide-react';
import Seo from '@/components/Seo';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || '/';
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await auth.signIn({ email, password });
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await auth.signUp({ email, password, fullName });
      toast.success('Account created! Check your email to confirm, then sign in.');
    } catch (error) {
      toast.error(error.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) return toast.error('Enter your email first');
    setLoading(true);
    try {
      await auth.signInWithMagicLink(email);
      toast.success('Magic link sent — check your email.');
    } catch (error) {
      toast.error(error.message || 'Could not send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
      <Seo title="Log In" path="/login" noindex />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600">
            <Users className="h-6 w-6 text-white" />
          </Link>
          <CardTitle className="text-2xl">Neighbourly Exchange</CardTitle>
          <CardDescription>Exchange skills with your neighbors</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email}
                         onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required value={password}
                         onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
                </Button>
                <Button type="button" variant="outline" className="w-full" disabled={loading}
                        onClick={handleMagicLink}>
                  <Mail className="mr-2 h-4 w-4" /> Email me a magic link
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" required value={fullName}
                         onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email">Email</Label>
                  <Input id="new-email" type="email" required value={email}
                         onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Password</Label>
                  <Input id="new-password" type="password" required minLength={8} value={password}
                         onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

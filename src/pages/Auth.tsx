import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { Session, User } from '@supabase/supabase-js';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { usePasswordSecurity } from '@/hooks/usePasswordSecurity';
import { setSEO } from '@/lib/seo';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<string>('');
  const [passwordCheckLoading, setPasswordCheckLoading] = useState(false);
  const [passwordBreached, setPasswordBreached] = useState(false);
  const navigate = useNavigate();
  const { validatePassword: secureValidatePassword } = usePasswordSecurity();

  useEffect(() => {
    setSEO({
      title: "Start Free Trial — TradeLine 24/7",
      description: "Tell us about your business and we'll set up your 24/7 AI receptionist. No setup cost.",
      path: "/auth",
    });

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Redirect authenticated users to home
        if (session?.user) {
          navigate('/');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Redirect if already logged in
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validatePassword = (password: string): { isValid: boolean; strength: string; message?: string } => {
    if (password.length < 8) {
      return { isValid: false, strength: 'Too short', message: 'Password must be at least 8 characters long' };
    }
    
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const criteriaCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (criteriaCount < 3) {
      return { 
        isValid: false, 
        strength: 'Weak', 
        message: 'Password must contain at least 3 of: lowercase, uppercase, number, special character' 
      };
    }
    
    const strength = criteriaCount === 4 ? 'Strong' : 'Good';
    return { isValid: true, strength };
  };

  const handlePasswordChange = async (newPassword: string) => {
    setPassword(newPassword);
    setPasswordCheckLoading(true);
    setPasswordBreached(false);
    
    try {
      // Quick client-side validation first
      const basicValidation = validatePassword(newPassword);
      setPasswordStrength(basicValidation.strength);
      
      // If password meets basic requirements, check for breaches
      if (basicValidation.isValid && newPassword.length >= 8) {
        const secureValidation = await secureValidatePassword(newPassword);
        setPasswordStrength(secureValidation.strength);
        setPasswordBreached(secureValidation.isBreached);
        
        if (secureValidation.isBreached) {
          setError(secureValidation.message || 'This password appears in known data breaches');
        } else {
          setError(null);
        }
      }
    } catch (error) {
      console.error('Password validation error:', error);
      // Don't block user if validation fails
    } finally {
      setPasswordCheckLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    // Check password security (both strength and breach status)
    const secureValidation = await secureValidatePassword(password);
    
    if (!secureValidation.isValid) {
      throw new Error(secureValidation.message || 'Password does not meet security requirements');
    }
    
    if (secureValidation.isBreached) {
      throw new Error('This password appears in known data breaches. Please choose a different password.');
    }

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await signUp(email, password, displayName);
    
    if (error) {
      if (error.message.includes('already registered')) {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(error.message);
      }
    } else {
      setMessage('Check your email for a confirmation link!');
    }
    
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials.');
      } else {
        setError(error.message);
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8 px-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to TradeLine 24/7</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {message && (
                <Alert>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Display Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                   <div className="space-y-2">
                     <Label htmlFor="signup-password">Password</Label>
                     <Input
                       id="signup-password"
                       type="password"
                       placeholder="Create a strong password"
                       value={password}
                       onChange={(e) => handlePasswordChange(e.target.value)}
                       required
                       minLength={8}
                     />
                      {password && (
                        <div className="text-sm space-y-2">
                          <div>
                            <span className="text-muted-foreground">Strength: </span>
                            <span className={`font-medium ${
                              passwordStrength === 'Very strong' || passwordStrength === 'Strong' ? 'text-green-600' :
                              passwordStrength === 'Good' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {passwordStrength}
                              {passwordCheckLoading && <Loader2 className="inline w-3 h-3 ml-1 animate-spin" />}
                            </span>
                          </div>
                          
                          {passwordBreached && (
                            <div className="text-xs text-red-600 font-medium">
                              ⚠️ This password appears in known data breaches. Please choose a different password.
                            </div>
                          )}
                          
                          {password.length >= 8 && !passwordBreached && passwordStrength !== 'Too short' && (
                            <div className="text-xs text-green-600">
                              ✓ Password meets security requirements
                            </div>
                          )}
                          
                          {(passwordStrength === 'Too short' || passwordStrength === 'Weak' || passwordStrength === 'Too weak') && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Use 8+ characters with uppercase, lowercase, numbers, and symbols
                            </div>
                          )}
                        </div>
                      )}
                   </div>
                  
                  <Button 
                    type="submit" 
                    variant="success"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Auth;
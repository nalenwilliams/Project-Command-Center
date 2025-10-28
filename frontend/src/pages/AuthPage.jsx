import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import api from '@/lib/api';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [processingSession, setProcessingSession] = useState(false);

  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    first_name: '',
    last_name: '',
    invitation_code: '' 
  });

  // Handle session_id from URL fragment (Emergent Auth callback)
  useEffect(() => {
    const processSessionId = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('session_id=')) {
        setProcessingSession(true);
        const sessionId = hash.split('session_id=')[1].split('&')[0];
        
        // Clear URL fragment immediately
        window.history.replaceState(null, '', window.location.pathname);
        
        try {
          // Call backend to process session
          const response = await api.post('/auth/session', null, {
            headers: {
              'X-Session-ID': sessionId
            }
          });
          
          if (response.data.success) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
            toast.success('Welcome! Logged in with Google');
            
            // Navigate to dashboard
            navigate('/', { replace: true });
          }
        } catch (error) {
          console.error('Session processing error:', error);
          toast.error('Authentication failed. Please try again.');
          setProcessingSession(false);
        }
      }
    };

    processSessionId();
  }, []); // Empty dependency array - run only once on mount

  const handleGoogleLogin = () => {
    // For mobile-friendly experience, use the current window instead of popup
    const redirectUrl = `${window.location.origin}/auth`;
    const emergentAuthUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    
    // Open in same window (no popup/iframe issues on mobile)
    window.location.href = emergentAuthUrl;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', loginData);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/register', registerData);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4" data-testid="auth-page">
      {processingSession ? (
        <Card className="w-full max-w-md bg-black border-2" style={{ borderColor: '#C9A961' }}>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: '#C9A961' }}></div>
            <p className="text-lg" style={{ color: '#C9A961' }}>Processing Google Sign In...</p>
          </CardContent>
        </Card>
      ) : (
      <Card className="w-full max-w-md bg-black border-2" style={{ borderColor: '#C9A961' }}>
        <CardHeader className="space-y-3 text-center">
          <img 
            src="/williams-logo.png" 
            alt="Williams Diversified LLC" 
            className="w-48 h-auto mx-auto mb-2"
          />
          <CardTitle className="text-3xl font-bold" style={{ color: '#C9A961' }}>Williams Diversified LLC</CardTitle>
          <CardDescription style={{ color: '#C9A961', opacity: 0.8 }}>
            Project Command Center
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-black border" style={{ borderColor: '#C9A961' }}>
              <TabsTrigger 
                value="login" 
                data-testid="login-tab" 
                className="data-[state=active]:text-black"
                style={{
                  color: '#C9A961',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F2937'}
                onMouseLeave={(e) => {
                  if (e.currentTarget.getAttribute('data-state') !== 'active') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                data-testid="register-tab" 
                className="data-[state=active]:text-black"
                style={{
                  color: '#C9A961',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F2937'}
                onMouseLeave={(e) => {
                  if (e.currentTarget.getAttribute('data-state') !== 'active') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username" style={{ color: '#C9A961' }}>Username</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Enter your username"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    required
                    data-testid="login-username-input"
                    className="bg-gray-900 text-white placeholder:text-gray-500"
                    style={{ borderColor: '#C9A961' }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" style={{ color: '#C9A961' }}>Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    data-testid="login-password-input"
                    className="bg-gray-900 text-white placeholder:text-gray-500"
                    style={{ borderColor: '#C9A961' }}
                  />
                </div>
                <Button type="submit" className="w-full text-black hover:opacity-90" disabled={loading || processingSession} data-testid="login-submit-button" style={{ backgroundColor: '#C9A961' }}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" style={{ borderColor: '#C9A961', opacity: 0.3 }}></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black px-2" style={{ color: '#C9A961', opacity: 0.7 }}>Or continue with</span>
                  </div>
                </div>
                
                <Button 
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading || processingSession}
                  className="w-full bg-white text-gray-800 hover:bg-gray-100 border"
                  style={{ borderColor: '#C9A961' }}
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {processingSession ? 'Processing...' : 'Sign in with Google'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-invitation" style={{ color: '#C9A961' }}>Invitation Code *</Label>
                  <Input
                    id="register-invitation"
                    type="text"
                    placeholder="Enter invitation code"
                    value={registerData.invitation_code}
                    onChange={(e) => setRegisterData({ ...registerData, invitation_code: e.target.value.toUpperCase() })}
                    required
                    data-testid="register-invitation-input"
                    className="bg-gray-900 text-white placeholder:text-gray-500"
                    style={{ borderColor: '#C9A961' }}
                  />
                  <p className="text-xs text-gray-500">Contact admin to receive an invitation code</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-first-name" style={{ color: '#C9A961' }}>First Name</Label>
                    <Input
                      id="register-first-name"
                      type="text"
                      placeholder="First name"
                      value={registerData.first_name}
                      onChange={(e) => setRegisterData({ ...registerData, first_name: e.target.value })}
                      data-testid="register-first-name-input"
                      className="bg-gray-900 text-white placeholder:text-gray-500"
                      style={{ borderColor: '#C9A961' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-last-name" style={{ color: '#C9A961' }}>Last Name</Label>
                    <Input
                      id="register-last-name"
                      type="text"
                      placeholder="Last name"
                      value={registerData.last_name}
                      onChange={(e) => setRegisterData({ ...registerData, last_name: e.target.value })}
                      data-testid="register-last-name-input"
                      className="bg-gray-900 text-white placeholder:text-gray-500"
                      style={{ borderColor: '#C9A961' }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-username" style={{ color: '#C9A961' }}>Username</Label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="Choose a username"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    required
                    data-testid="register-username-input"
                    className="bg-gray-900 text-white placeholder:text-gray-500"
                    style={{ borderColor: '#C9A961' }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email" style={{ color: '#C9A961' }}>Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                    data-testid="register-email-input"
                    className="bg-gray-900 text-white placeholder:text-gray-500"
                    style={{ borderColor: '#C9A961' }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password" style={{ color: '#C9A961' }}>Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Choose a password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                    data-testid="register-password-input"
                    className="bg-gray-900 text-white placeholder:text-gray-500"
                    style={{ borderColor: '#C9A961' }}
                  />
                </div>
                <Button type="submit" className="w-full text-black hover:opacity-90" disabled={loading} data-testid="register-submit-button" style={{ backgroundColor: '#C9A961' }}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default AuthPage;

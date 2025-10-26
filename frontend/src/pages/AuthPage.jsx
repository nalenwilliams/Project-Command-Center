import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import api from '@/lib/api';

const AuthPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', email: '', password: '', invitation_code: '' });

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
      <Card className="w-full max-w-md bg-black border-2" style={{ borderColor: '#C9A961' }}>
        <CardHeader className="space-y-3 text-center">
          <img 
            src="/williams-logo.png" 
            alt="Williams Diversified LLC" 
            className="w-48 h-auto mx-auto mb-2"
          />
          <CardTitle className="text-3xl font-bold" style={{ color: '#C9A961' }}>Williams Diversified LLC</CardTitle>
          <CardDescription style={{ color: '#C9A961', opacity: 0.8 }}>
            CRM & Project Management System
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
                <Button type="submit" className="w-full text-black hover:opacity-90" disabled={loading} data-testid="login-submit-button" style={{ backgroundColor: '#C9A961' }}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
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
    </div>
  );
};

export default AuthPage;

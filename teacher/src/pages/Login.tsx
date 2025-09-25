
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { LogIn, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/authStore';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, login, fetchPermissions } = useAuthStore();
  
  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    // Call authentication API service
    login(email, password)
    .then((token) => {
      if (token) {
        return fetchPermissions();
      }
      throw new Error('No token received');
    })
    .then(() => {
      setSuccess('Login successful! Redirecting...');
      toast.success('Login successful', {
        duration: 3000,
        description: 'Welcome back'
      });
      navigate('/');
    })
    .catch(error => {
      setError('Incorrect email or password');
      toast.error('Login failed', {
        duration: 4000,
        description: 'Please check your credentials'
      });
    })
    .finally(() => {
      setIsLoading(false);
    });
  };
  

  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-blue-50 p-3">
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">
            Career Center Management
          </h1>
          <p className="text-gray-500 mt-2">Login to access the system</p>
        </div>
        
        <Card className="border border-gray-100 shadow-md">
          <CardHeader>
            {/* Status messages */}
            {error && (
              <Alert variant="destructive" className="mb-3 animate-fade-in">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert variant="success" className="mb-3 animate-fade-in">
                <AlertDescription className="text-sm">{success}</AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teacher@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={error ? "border-red-200 focus-visible:ring-red-200" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={error ? "border-red-200 focus-visible:ring-red-200" : ""}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" /> Login
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <div>© {new Date().getFullYear()} Career Center Management System</div>
        </div>
      </div>
    </div>
  );
};

export default Login;

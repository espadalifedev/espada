'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { User, Eye, EyeOff, ChevronLeft, Check, X, Apple } from 'lucide-react';

type AuthMode = 'welcome' | 'login' | 'signup';
type SignupStep = 'email' | 'password' | 'confirm-password' | 'name' | 'gender' | 'age' | 'country' | 'username' | 'interests';

interface AuthData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  gender: string;
  age: string;
  country: string;
  username: string;
  interests: string[];
}

const countries = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands',
  'Australia', 'Japan', 'South Korea', 'India', 'Brazil', 'Mexico', 'Argentina', 'Other'
];

const interests = [
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'anime', label: 'Anime', emoji: '🌸' },
  { id: 'movies', label: 'Movies', emoji: '🎬' },
  { id: 'books', label: 'Books', emoji: '📚' },
  { id: 'discussions', label: 'Discussions', emoji: '💬' }
];

export function SignupFlow() {
  const [authMode, setAuthMode] = useState<AuthMode>('welcome');
  const [signupStep, setSignupStep] = useState<SignupStep>('email');
  const { signUp, signIn, user, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [authData, setAuthData] = useState<AuthData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    gender: '',
    age: '',
    country: '',
    username: '',
    interests: [],
  });

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      // User is authenticated, redirect to main app
      window.location.href = '/dashboard';
    }
  }, [user, authLoading]);

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  const updateAuthData = (field: keyof AuthData, value: string | string[]) => {
    setAuthData(prev => ({ ...prev, [field]: value }));
  };

  // Auto-focus input when step changes
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, [signupStep]);

  // Mock username availability check
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    
    setCheckingUsername(true);
    
    try {
      // Check if username exists in profiles table
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .single();
      
      if (error && error.code === 'PGRST116') {
        // No rows returned, username is available
        setUsernameAvailable(true);
      } else if (data) {
        // Username exists
        setUsernameAvailable(false);
      } else {
        // Other error
        setUsernameAvailable(null);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  useEffect(() => {
    if (signupStep === 'username' && authData.username) {
      const debounceTimeout = setTimeout(() => {
        checkUsernameAvailability(authData.username);
      }, 500);
      return () => clearTimeout(debounceTimeout);
    }
  }, [authData.username, signupStep]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authData.email || !authData.password) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await signIn(authData.email, authData.password);
      
      if (error) {
        console.error('Login failed:', error.message);
        alert(`Login failed: ${error.message}`);
      } else {
        console.log('Login successful:', data.user?.email);
        // User will be redirected by the auth state change
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('An unexpected error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceedToNext = () => {
    switch (signupStep) {
      case 'email':
        return authData.email.includes('@') && authData.email.length > 0;
      case 'password':
        return authData.password.length >= 8;
      case 'confirm-password':
        return authData.confirmPassword === authData.password && authData.confirmPassword.length > 0;
      case 'name':
        return authData.firstName.length > 0 && authData.lastName.length > 0;
      case 'gender':
        return authData.gender.length > 0;
      case 'age':
        return authData.age.length > 0 && parseInt(authData.age) >= 13 && parseInt(authData.age) <= 120;
      case 'country':
        return authData.country.length > 0;
      case 'username':
        return authData.username.length >= 3 && usernameAvailable === true;
      case 'interests':
        return authData.interests.length > 0;
      default:
        return false;
    }
  };

  const goToNextStep = async () => {
    const steps: SignupStep[] = ['email', 'password', 'confirm-password', 'name', 'gender', 'age', 'country', 'username', 'interests'];
    const currentIndex = steps.indexOf(signupStep);
    
    if (currentIndex < steps.length - 1) {
      setSignupStep(steps[currentIndex + 1]);
    } else {
      // Complete signup
      setIsLoading(true);
      try {
        const { data, error } = await signUp(authData.email, authData.password, {
          firstName: authData.firstName,
          lastName: authData.lastName,
          username: authData.username,
          gender: authData.gender,
          age: authData.age,
          country: authData.country,
          interests: authData.interests
        });
        
        if (error) {
          console.error('Signup failed:', error.message);
          alert(`Signup failed: ${error.message}`);
        } else {
          console.log('Signup successful:', data.user?.email);
          alert('🎉 Welcome! Your account has been created successfully. Please check your email to verify your account.');
          // Reset to welcome screen
          setAuthMode('welcome');
          resetSignup();
        }
      } catch (error) {
        console.error('Signup failed:', error);
        alert('An unexpected error occurred during signup.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const goToPreviousStep = () => {
    const steps: SignupStep[] = ['email', 'password', 'confirm-password', 'name', 'gender', 'age', 'country', 'username', 'interests'];
    const currentIndex = steps.indexOf(signupStep);
    if (currentIndex > 0) {
      setSignupStep(steps[currentIndex - 1]);
    } else {
      setAuthMode('welcome');
    }
  };

  const resetSignup = () => {
    setSignupStep('email');
    setUsernameAvailable(null);
    setCheckingUsername(false);
    setAuthData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      gender: '',
      age: '',
      country: '',
      username: '',
      interests: [],
    });
  };

  const handleInterestToggle = (interestId: string) => {
    const currentInterests = authData.interests;
    if (currentInterests.includes(interestId)) {
      updateAuthData('interests', currentInterests.filter(id => id !== interestId));
    } else {
      updateAuthData('interests', [...currentInterests, interestId]);
    }
  };

  const getStepProgress = () => {
    const steps: SignupStep[] = ['email', 'password', 'confirm-password', 'name', 'gender', 'age', 'country', 'username', 'interests'];
    const currentIndex = steps.indexOf(signupStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const getStepTitle = () => {
    switch (signupStep) {
      case 'email': return 'What\'s your email?';
      case 'password': return 'Create a password';
      case 'confirm-password': return 'Confirm your password';
      case 'name': return 'What\'s your name?';
      case 'gender': return 'What\'s your gender?';
      case 'age': return 'How old are you?';
      case 'country': return 'Where are you from?';
      case 'username': return 'Choose a username';
      case 'interests': return 'What interests you?';
      default: return '';
    }
  };

  const getStepSubtitle = () => {
    switch (signupStep) {
      case 'email': return 'We\'ll use this to create your account';
      case 'password': return 'Must be at least 8 characters';
      case 'confirm-password': return 'Re-enter to make sure it matches';
      case 'name': return 'Let us know what to call you';
      case 'gender': return 'Help us personalize your experience';
      case 'age': return 'You must be 13 or older to sign up';
      case 'country': return 'This helps us customize content for you';
      case 'username': return 'This is how others will find you';
      case 'interests': return 'Pick what you\'re into (you can change this later)';
      default: return '';
    }
  };

  // Welcome screen
  if (authMode === 'welcome') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Status bar space */}
        <div className="h-12"></div>
        
        {/* App icon and branding */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-24 h-24 bg-blue-500 rounded-3xl flex items-center justify-center mb-8 shadow-lg transform transition-transform duration-300 hover:scale-105">
            <Apple className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-3xl mb-4 text-center">Welcome</h1>
          <p className="text-muted-foreground text-center mb-16 max-w-sm leading-relaxed">
            Join our community and discover amazing content tailored just for you.
          </p>
          
          <div className="w-full max-w-sm space-y-4">
            <Button 
              onClick={() => {
                setAuthMode('signup');
                setSignupStep('email');
                resetSignup();
              }}
              className="w-full h-14 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Create Account
            </Button>
            
            <Button 
              onClick={() => setAuthMode('login')}
              variant="outline"
              className="w-full h-14 rounded-2xl border-2 text-blue-500 border-blue-500/20 hover:bg-blue-500/5 text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign In
            </Button>
          </div>
        </div>
        
        {/* Safe area bottom */}
        <div className="h-8"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Status bar space */}
      <div className="h-12"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (authMode === 'login') {
              setAuthMode('welcome');
            } else {
              goToPreviousStep();
            }
          }}
          className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        
        {authMode === 'signup' && (
          <div className="flex-1 mx-6">
            <div className="w-full bg-muted/50 rounded-full h-1 overflow-hidden">
              <div 
                className="bg-blue-500 h-1 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${getStepProgress()}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <div className="w-10"></div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4">
        {authMode === 'login' ? (
          /* Login Form */
          <div className="max-w-sm mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl mb-4">Sign In</h1>
              <p className="text-muted-foreground leading-relaxed">
                Welcome back! Enter your details to continue.
              </p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-muted-foreground">Email</Label>
                <Input
                  ref={inputRef}
                  id="email"
                  type="email"
                  value={authData.email}
                  onChange={(e) => updateAuthData('email', e.target.value)}
                  placeholder="Enter your email"
                  className="h-14 rounded-2xl border-0 bg-muted/50 text-foreground placeholder:text-muted-foreground focus:bg-muted focus:ring-2 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="login-password" className="text-muted-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={authData.password}
                    onChange={(e) => updateAuthData('password', e.target.value)}
                    placeholder="Enter your password"
                    className="h-14 rounded-2xl border-0 bg-muted/50 text-foreground placeholder:text-muted-foreground focus:bg-muted focus:ring-2 focus:ring-blue-500/20 pr-14 transition-all"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 text-muted-foreground hover:text-foreground hover:bg-transparent rounded-xl transition-all"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || !authData.email || !authData.password}
                  className="w-full h-14 bg-blue-500 hover:bg-blue-600 disabled:bg-muted disabled:text-muted-foreground text-white rounded-2xl text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing In...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </div>

              <div className="text-center pt-6">
                <button
                  type="button"
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Signup Steps */
          <div className="max-w-sm mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl mb-2">{getStepTitle()}</h1>
              <p className="text-muted-foreground leading-relaxed">
                {getStepSubtitle()}
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Email Step */}
              {signupStep === 'email' && (
                <div className="space-y-3">
                  <Label htmlFor="signup-email" className="text-muted-foreground">Email Address</Label>
                  <Input
                    ref={inputRef}
                    id="signup-email"
                    type="email"
                    value={authData.email}
                    onChange={(e) => updateAuthData('email', e.target.value)}
                    placeholder="name@example.com"
                    className="h-14 rounded-2xl border-0 bg-muted/50 text-foreground placeholder:text-muted-foreground focus:bg-muted focus:ring-2 focus:ring-blue-500/20 transition-all"
                    required
                  />
                </div>
              )}

              {/* Password Step */}
              {signupStep === 'password' && (
                <div className="space-y-3">
                  <Label htmlFor="signup-password" className="text-muted-foreground">Password</Label>
                  <div className="relative">
                    <Input
                      ref={inputRef}
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      value={authData.password}
                      onChange={(e) => updateAuthData('password', e.target.value)}
                      placeholder="Create a secure password"
                      className="h-14 rounded-2xl border-0 bg-muted/50 text-foreground placeholder:text-muted-foreground focus:bg-muted focus:ring-2 focus:ring-blue-500/20 pr-14 transition-all"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 text-muted-foreground hover:text-foreground hover:bg-transparent rounded-xl transition-all"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </Button>
                  </div>
                  {authData.password && authData.password.length < 8 && (
                    <p className="text-destructive text-sm pl-1 animate-in slide-in-from-left-1 duration-200">
                      Password must be at least 8 characters
                    </p>
                  )}
                </div>
              )}

              {/* Confirm Password Step */}
              {signupStep === 'confirm-password' && (
                <div className="space-y-3">
                  <Label htmlFor="confirm-password" className="text-muted-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      ref={inputRef}
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={authData.confirmPassword}
                      onChange={(e) => updateAuthData('confirmPassword', e.target.value)}
                      placeholder="Re-enter your password"
                      className="h-14 rounded-2xl border-0 bg-muted/50 text-foreground placeholder:text-muted-foreground focus:bg-muted focus:ring-2 focus:ring-blue-500/20 pr-14 transition-all"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 text-muted-foreground hover:text-foreground hover:bg-transparent rounded-xl transition-all"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </Button>
                  </div>
                  {authData.confirmPassword && authData.password !== authData.confirmPassword && (
                    <p className="text-destructive text-sm pl-1 animate-in slide-in-from-left-1 duration-200">
                      Passwords don't match
                    </p>
                  )}
                </div>
              )}

              {/* Name Step */}
              {signupStep === 'name' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="firstName" className="text-muted-foreground">First Name</Label>
                    <Input
                      ref={inputRef}
                      id="firstName"
                      type="text"
                      value={authData.firstName}
                      onChange={(e) => updateAuthData('firstName', e.target.value)}
                      placeholder="Your first name"
                      className="h-14 rounded-2xl border-0 bg-muted/50 text-foreground placeholder:text-muted-foreground focus:bg-muted focus:ring-2 focus:ring-blue-500/20 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="lastName" className="text-muted-foreground">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={authData.lastName}
                      onChange={(e) => updateAuthData('lastName', e.target.value)}
                      placeholder="Your last name"
                      className="h-14 rounded-2xl border-0 bg-muted/50 text-foreground placeholder:text-muted-foreground focus:bg-muted focus:ring-2 focus:ring-blue-500/20 transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Gender Step */}
              {signupStep === 'gender' && (
                <div className="space-y-3">
                  <Label className="text-muted-foreground">Gender</Label>
                  <Select value={authData.gender} onValueChange={(value) => updateAuthData('gender', value)}>
                    <SelectTrigger className="h-14 rounded-2xl border-0 bg-muted/50 text-foreground focus:bg-muted focus:ring-2 focus:ring-blue-500/20 transition-all">
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Age Step */}
              {signupStep === 'age' && (
                <div className="space-y-3">
                  <Label htmlFor="age" className="text-muted-foreground">Age</Label>
                  <Input
                    ref={inputRef}
                    id="age"
                    type="number"
                    min="13"
                    max="120"
                    value={authData.age}
                    onChange={(e) => updateAuthData('age', e.target.value)}
                    placeholder="18"
                    className="h-14 rounded-2xl border-0 bg-muted/50 text-foreground placeholder:text-muted-foreground focus:bg-muted focus:ring-2 focus:ring-blue-500/20 transition-all"
                    required
                  />
                  {authData.age && (parseInt(authData.age) < 13 || parseInt(authData.age) > 120) && (
                    <p className="text-destructive text-sm pl-1 animate-in slide-in-from-left-1 duration-200">
                      Please enter a valid age (13-120)
                    </p>
                  )}
                </div>
              )}

              {/* Country Step */}
              {signupStep === 'country' && (
                <div className="space-y-3">
                  <Label className="text-muted-foreground">Country</Label>
                  <Select value={authData.country} onValueChange={(value) => updateAuthData('country', value)}>
                    <SelectTrigger className="h-14 rounded-2xl border-0 bg-muted/50 text-foreground focus:bg-muted focus:ring-2 focus:ring-blue-500/20 transition-all">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl max-h-64">
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Username Step */}
              {signupStep === 'username' && (
                <div className="space-y-3">
                  <Label htmlFor="username" className="text-muted-foreground">Username</Label>
                  <div className="relative">
                    <Input
                      ref={inputRef}
                      id="username"
                      type="text"
                      value={authData.username}
                      onChange={(e) => updateAuthData('username', e.target.value)}
                      placeholder="Choose a unique username"
                      className="h-14 rounded-2xl border-0 bg-muted/50 text-foreground placeholder:text-muted-foreground focus:bg-muted focus:ring-2 focus:ring-blue-500/20 pr-14 transition-all"
                      required
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {checkingUsername && (
                        <div className="animate-spin w-5 h-5 border-2 border-muted-foreground border-t-blue-500 rounded-full"></div>
                      )}
                      {!checkingUsername && usernameAvailable === true && (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-200">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      {!checkingUsername && usernameAvailable === false && (
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-200">
                          <X className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  {authData.username && authData.username.length < 3 && (
                    <p className="text-muted-foreground text-sm pl-1">Username must be at least 3 characters</p>
                  )}
                  {usernameAvailable === false && (
                    <p className="text-red-500 text-sm pl-1 animate-in slide-in-from-left-1 duration-200">
                      Username is not available
                    </p>
                  )}
                  {usernameAvailable === true && (
                    <p className="text-green-500 text-sm pl-1 animate-in slide-in-from-left-1 duration-200">
                      Username is available!
                    </p>
                  )}
                </div>
              )}

              {/* Interests Step */}
              {signupStep === 'interests' && (
                <div className="space-y-6">
                  <div className="grid gap-4">
                    {interests.map((interest, index) => (
                      <div
                        key={interest.id}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                          authData.interests.includes(interest.id)
                            ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10 scale-[1.02]'
                            : 'border-muted/50 bg-muted/20 hover:border-blue-500/30 hover:bg-blue-500/5 hover:scale-[1.01]'
                        }`}
                        onClick={() => handleInterestToggle(interest.id)}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{interest.emoji}</span>
                          <span className="text-foreground font-medium">{interest.label}</span>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          authData.interests.includes(interest.id)
                            ? 'border-blue-500 bg-blue-500 scale-110'
                            : 'border-muted-foreground'
                        }`}>
                          {authData.interests.includes(interest.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Button - Fixed position */}
      <div className="px-6 pb-8 pt-6">
        <Button
          onClick={authMode === 'login' ? handleLogin : goToNextStep}
          disabled={(authMode === 'signup' && !canProceedToNext()) || isLoading}
          className="w-full h-14 bg-blue-500 hover:bg-blue-600 disabled:bg-muted disabled:text-muted-foreground text-white rounded-2xl text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              {signupStep === 'interests' ? 'Creating Account...' : 'Processing...'}
            </div>
          ) : authMode === 'login' ? (
            'Sign In'
          ) : signupStep === 'interests' ? (
            'Create Account'
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft, Mail, Phone } from 'lucide-react';
import cravenLogo from '@/assets/craven-logo.png';

interface MobileFeederLoginProps {
  onBack?: () => void;
  onLoginSuccess?: () => void;
}

type LoginMethod = 'email' | 'phone';

const MobileFeederLogin: React.FC<MobileFeederLoginProps> = ({ onBack, onLoginSuccess }) => {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log('MobileFeederLogin: Component mounted');
  }, []);

  // Format phone number as user types
  const handlePhoneChange = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format: (XXX) XXX-XXXX
    let formatted = cleaned;
    if (cleaned.length >= 6) {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else if (cleaned.length >= 3) {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    }
    
    setPhone(formatted);
  };

  const handlePostLoginRouting = async (userId: string) => {
    try {
      console.log('MobileFeederLogin: Checking application status for user', userId);
      
      const { data: application, error } = await supabase
        .from('craver_applications')
        .select('status, first_name, background_check, background_check_approved_at, background_check_initiated_at, welcome_screen_shown, onboarding_completed_at')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('MobileFeederLogin: Error fetching application:', error);
        toast({
          title: "Error",
          description: "Could not load your application status. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      if (!application) {
        console.log('MobileFeederLogin: No application found');
        toast({
          title: "No Application Found",
          description: "Please apply to become a Feeder first.",
        });
        navigate('/feeder');
        return;
      }

      console.log('MobileFeederLogin: Application status:', application.status);
      console.log('MobileFeederLogin: Background check approved:', application.background_check_approved_at);
      console.log('MobileFeederLogin: Onboarding completed:', application.onboarding_completed_at);

      // Check if background check is pending or in progress
      if (application.background_check_initiated_at && !application.background_check_approved_at) {
        console.log('MobileFeederLogin: Background check in progress, showing status screen');
        // Background check is in progress - navigate to mobile background check status
        navigate('/mobile/background-check-status');
        return;
      }

      // Check if background check hasn't been initiated yet
      if (!application.background_check && !application.background_check_approved_at) {
        console.log('MobileFeederLogin: Application pending, showing pending message');
        toast({
          title: "Application Pending",
          description: "Your application is being reviewed. We'll notify you when your background check begins!",
        });
        // Stay on login screen or navigate to a pending status page
        return;
      }

      // Background check is approved, check onboarding
      if (!application.onboarding_completed_at) {
        console.log('MobileFeederLogin: Onboarding incomplete, navigating to onboarding');
        navigate('/onboarding');
        return;
      }

      // All checks passed, proceed to dashboard
      console.log('MobileFeederLogin: All checks passed, proceeding to dashboard');
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        navigate('/mobile');
      }
    } catch (error) {
      console.error('MobileFeederLogin: Error in post-login routing:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let authResult;
      
      if (loginMethod === 'email') {
        authResult = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      } else {
        // For phone login, convert formatted phone to E.164 format
        const cleanedPhone = phone.replace(/\D/g, '');
        const e164Phone = `+1${cleanedPhone}`; // Assuming US numbers
        
        authResult = await supabase.auth.signInWithPassword({
          phone: e164Phone,
          password,
        });
      }

      if (authResult.error) throw authResult.error;

      if (authResult.data.user) {
        await handlePostLoginRouting(authResult.data.user.id);
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your Feeder account.",
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Sign In Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRedirect = () => {
    navigate('/feeder');
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-orange-50 to-white overflow-y-auto z-50">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 safe-area-top">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack || (() => navigate(-1))}
            className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <img src={cravenLogo} alt="Crave'n" className="h-8" />
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Login Form */}
      <div className="px-6 py-8 max-w-md mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back, Feeder!
          </h1>
          <p className="text-gray-600">
            Sign in to start earning and delivering happiness
          </p>
        </div>

        {/* Login Method Toggle */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setLoginMethod('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-medium transition-all ${
              loginMethod === 'email'
                ? 'bg-white text-orange-500 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
          <button
            onClick={() => setLoginMethod('phone')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-medium transition-all ${
              loginMethod === 'phone'
                ? 'bg-white text-orange-500 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            <Phone className="w-4 h-4" />
            Phone
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSignIn} className="space-y-5">
          {/* Email or Phone Input */}
          <div className="space-y-2">
            <Label htmlFor="login-input" className="text-gray-700 font-medium">
              {loginMethod === 'email' ? 'Email Address' : 'Phone Number'}
            </Label>
            {loginMethod === 'email' ? (
              <Input
                id="login-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 text-base"
              />
            ) : (
              <Input
                id="login-input"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                maxLength={14}
                required
                className="h-12 text-base"
              />
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 text-base pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </Button>

          {/* Forgot Password */}
          <button
            type="button"
            className="w-full text-center text-sm text-gray-600 hover:text-orange-500 underline"
            onClick={() => toast({
              title: "Password Reset",
              description: "Please contact support to reset your password.",
            })}
          >
            Forgot your password?
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500 font-medium">
              New to Crave'n?
            </span>
          </div>
        </div>

        {/* Apply Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleApplyRedirect}
          className="w-full h-12 border-2 border-orange-500 text-orange-500 hover:bg-orange-50 text-lg font-semibold rounded-lg"
        >
          Apply to Become a Feeder
        </Button>

        {/* Info Text */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Your account will be created when you submit your application
        </p>
      </div>
    </div>
  );
};

export default MobileFeederLogin;


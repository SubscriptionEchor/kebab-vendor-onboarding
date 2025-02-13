import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { verifyPhoneOTP, sendPhoneOTP } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { RefreshConfirmationDialog } from '../components/ui/RefreshConfirmationDialog';
import { getApplications } from '../services/restaurant';

export function VerifyPhonePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [showRefreshConfirmation, setShowRefreshConfirmation] = useState(false);

  useEffect(() => {
    if (!user?.phone) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Handle beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      setShowRefreshConfirmation(true);
      // Chrome requires returnValue to be set
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleRefreshConfirm = () => {
    // Store a flag indicating the user chose to refresh
    localStorage.setItem('skipEmailVerification', 'true');
    window.location.reload();
  };

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);

    // Move to next input if value is entered
    if (cleanValue && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!user?.phone) return;
    
    try {
      const response = await sendPhoneOTP(user.phone);
      if (response.sendPhoneOtpForOnboardingVendorLogin.result) {
        setTimer(30);
      } else {
        setErrors([response.sendPhoneOtpForOnboardingVendorLogin.message]);
      }
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      setErrors(['Failed to send verification code. Please try again.']);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Clean and validate OTP
    const otpString = otp.join('');
    const cleanOtp = otpString.replace(/\D/g, '');
    
    if (!cleanOtp || cleanOtp.length !== 4) {
      setErrors(['Please enter a complete 4-digit verification code']);
      return;
    }

    if (!user?.phone) {
      setErrors(['Phone number not found. Please try logging in again']);
      navigate('/login');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyPhoneOTP(user.phone, otpString);
      setErrors([]); // Clear any existing errors on success
      
      if (response.verifyPhoneOtpForOnboardingVendorAndLogin.token) {
        // Store the token for future API calls
        localStorage.setItem('authToken', response.verifyPhoneOtpForOnboardingVendorAndLogin.token);

        // Check if this is a new vendor
        if (response.verifyPhoneOtpForOnboardingVendorAndLogin.isNewVendor) {
          navigate('/verify-email');
          return;
        } 
        
        navigate('/applications');
      } else {
        setErrors(['Verification failed. Please try again.']);
      }
    } catch (error) {
      console.error('Phone verification failed:', error);
      let errorMessage = 'Verification failed. Please try again';
      
      if (error instanceof Error) {
        const lowerCaseError = error.message.toLowerCase();
        if (lowerCaseError.includes('invalid') || lowerCaseError.includes('incorrect')) {
          errorMessage = 'Invalid verification code. Please try again';
        } else if (lowerCaseError.includes('expired')) {
          errorMessage = 'Verification code has expired. Please request a new code';
          setTimer(0); // Enable resend button immediately
          inputRefs.current[0]?.focus(); // Focus first input for new code
        }
        setErrors([errorMessage]);
      } else {
        setErrors(['An unexpected error occurred. Please try again']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 max-w-[2560px] mx-auto">
      {/* Left Side - OTP Form */}
      <motion.div 
        className="flex flex-col justify-center px-8 md:px-16 lg:px-24 xl:px-32 2xl:px-40 py-12 max-w-3xl mx-auto w-full"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="mb-12">
          <img
            src="https://vendor-onboarding-qa.kebapp-chefs.com/static/media/logo-kp.4d8a59f505edc841df24.png"
            alt="Kebab Partners Logo"
            className="h-12 w-auto mb-8"
          />
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight">
            Verify Your Phone
          </h1>
          <p className="text-gray-600 text-lg">
            We've sent a verification code to your phone
          </p>
        </div>

        {errors.length > 0 && (
          <div className="space-y-2 mb-6">
            {errors.map((error, index) => (
              <ErrorAlert
                key={index}
                message={error}
                onClose={() => setErrors(errors.filter((_, i) => i !== index))}
              />
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 max-w-md">
          <div className="flex gap-2 justify-between">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center text-2xl font-semibold rounded-lg border ${
                  errors.length > 0 ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 
                  'border-gray-200 focus:border-brand-primary focus:ring-brand-primary/20'
                }`}
              />
            ))}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full text-lg py-6"
            isLoading={isLoading}
          >
            Verify Phone
          </Button>

          <div className="text-center">
            {timer > 0 ? (
              <p className="text-gray-500">
                Resend code in {timer}s
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-brand-secondary hover:text-brand-primary"
              >
                Resend verification code
              </button>
            )}
          </div>
        </form>

        <div className="mt-4 text-center">
          <a
            href="mailto:helpdesk@kebapp.club"
            className="text-sm text-brand-secondary hover:text-brand-primary transition-colors inline-flex items-center gap-1"
          >
            Need help? Contact our support team
          </a>
        </div>
      </motion.div>
      
      {/* Refresh Confirmation Dialog */}
      <RefreshConfirmationDialog
        isOpen={showRefreshConfirmation}
        onClose={() => setShowRefreshConfirmation(false)}
        onConfirm={handleRefreshConfirm}
      />

      {/* Right Side - Image */}
      <motion.div 
        className="hidden md:block relative overflow-hidden h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}>
        <div className="absolute inset-0 w-full h-full">
          <img
            src="https://cdn.dribbble.com/userupload/12272146/file/original-839557f4883c81f19fdac3da6401505a.png?resize=2048x1537&vertical=center"
            alt="Dashboard Preview"
            className="w-full h-full object-cover"
          />
        </div>
      </motion.div>
    </div>
  );
}
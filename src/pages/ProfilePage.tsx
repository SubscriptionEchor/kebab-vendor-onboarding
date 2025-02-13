import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { validateEmail, validatePhone } from '../utils/validation';
import PhoneInput from '../components/ui/PhoneInput';
import { User, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { sendEmailOTP, verifyEmailOTP } from '../services/auth';
import confetti from 'canvas-confetti';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [otp, setOtp] = useState('');

  // Initialize email verification status from localStorage
  useEffect(() => {
    const savedEmailVerification = localStorage.getItem('emailVerified');
    const verifiedEmail = localStorage.getItem('verifiedEmail');
    if (savedEmailVerification === 'true') {
      setIsEmailVerified(true);
      // Set the verified email in the form
      setFormData(prev => ({
        ...prev,
        email: verifiedEmail || prev.email
      }));
    }
  }, []);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone?.replace(/^\+\d{2}/, '') || '', // Remove country code
    countryCode: 'DE'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    
    // Validate name
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setErrors(['Name is required']);
      return;
    }

    if (trimmedName.length < 2) {
      setErrors(['Name must be at least 2 characters long']);
      return;
    }

    setIsLoading(true);

    try {
      // Save name to localStorage
      localStorage.setItem('userName', trimmedName);
      
      // Update user context
      if (user) {
        user.name = trimmedName;
      }
      
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update profile:', error);
      if (error instanceof Error) {
        setErrors([error.message]);
      } else {
        setErrors(['An unexpected error occurred']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fireConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 1000,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      scalar: 0.8,
      colors: ['#EDCC27', '#2B4D7E', '#F4E7B0'],
    });

    fire(0.2, {
      spread: 60,
      scalar: 1.2,
      colors: ['#EDCC27', '#2B4D7E', '#F4E7B0'],
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ['#EDCC27', '#2B4D7E', '#F4E7B0'],
    });
  };

  const handleSendEmailOTP = async () => {
    if (!formData.email) {
      setErrors(['Please enter your email address']);
      return;
    }

    const emailError = getEmailValidationError(formData.email);
    if (emailError) {
      setErrors([emailError]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await sendEmailOTP(formData.email);
      if (response.sendEmailOtpForOnboardingVendor.result) {
        setIsEmailSent(true);
        showToast('Verification code sent to your email', 'success');
      } else {
        throw new Error(response.sendEmailOtpForOnboardingVendor.message);
      }
    } catch (error) {
      console.error('Failed to send email OTP:', error);
      if (error instanceof Error) {
        setErrors([error.message]);
      } else {
        setErrors(['Failed to send verification code']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    if (!otp) {
      setErrors(['Please enter the verification code']);
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyEmailOTP(formData.email, otp);
      if (response.verifyEmailOtpForOnboardingVendor.emailIsVerified) {
        setIsEmailVerified(true);
        // Store email verification status
        localStorage.setItem('emailVerified', 'true');
        // Store verified email
        localStorage.setItem('verifiedEmail', formData.email);
        setIsEmailSent(false);
        fireConfetti();
        showToast('Email verified successfully!', 'success');
      } else {
        throw new Error('Email verification failed');
      }
    } catch (error) {
      console.error('Failed to verify email:', error);
      if (error instanceof Error) {
        setErrors([error.message]);
      } else {
        setErrors(['Failed to verify email']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 font-display">
            Profile Settings
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>

        {errors.length > 0 && (
          <div className="space-y-2">
            {errors.map((error, index) => (
              <ErrorAlert
                key={index}
                message={error}
                onClose={() => setErrors(errors.filter((_, i) => i !== index))}
              />
            ))}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 text-gray-900 placeholder:text-gray-400 focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                      placeholder="Enter your full name"
                      required
                      minLength={2}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="opacity-50">
                    <PhoneInput
                    value={formData.phone}
                    countryCode={formData.countryCode}
                    onPhoneChange={() => {}} // No-op since phone is not editable
                    className="cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Email Verification */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Email Verification
              </h2>
              
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => !isEmailVerified && setFormData({ ...formData, email: e.target.value })}
                  className={`block w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 text-gray-900 placeholder:text-gray-400 focus:border-brand-primary focus:ring-brand-primary sm:text-sm ${
                    isEmailVerified ? 'bg-gray-50 cursor-not-allowed opacity-75' : ''
                  }`}
                  placeholder="Enter your email address"
                  disabled={isEmailVerified}
                />
                {isEmailVerified && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-green-100 text-green-700">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Verified
                    </span>
                  </div>
                )}
              </div>

              {isEmailSent && (
                <div className="bg-brand-accent/10 rounded-lg p-6 mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Enter Verification Code
                  </h3>
                  <div className="space-y-4">
                    <Input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter verification code"
                      className="text-lg"
                    />
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendEmailOTP}
                      >
                        Resend Code
                      </Button>
                      <Button type="button" onClick={handleVerifyEmailOTP} isLoading={isLoading}>
                        Verify
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {!isEmailVerified && !isEmailSent && (
                <div className="bg-brand-accent/10 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Email Verification Required
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 mb-4">
                        Please verify your email address to ensure account security and receive important notifications.
                      </p>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleSendEmailOTP}
                        isLoading={isLoading}
                      >
                        Verify Email
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                isLoading={isLoading}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
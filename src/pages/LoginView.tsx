import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePhone } from '../utils/validation';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import PhoneInput from '../components/ui/PhoneInput';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { sendPhoneOTP } from '../services/auth';

export function LoginView() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('DE');
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!validatePhone(phone, countryCode)) {
      setErrors([
        countryCode === 'IN'
          ? 'Please enter a valid Indian phone number (10 digits)'
          : 'Please enter a valid German phone number (10-11 digits)'
      ]);
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = `${countryCode === 'IN' ? '+91' : '+49'}${phone}`;
      await login(formattedPhone, countryCode);
      navigate('/verify-phone');
    } catch (error) {
      console.error('Login failed:', error);
      if (error instanceof Error) {
        setErrors([error.message]);
      } else {
        setErrors(['Failed to send verification code. Please try again.']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 max-w-[2560px] mx-auto">
      {/* Left Side - Login Form */}
      <motion.div 
        className="flex flex-col justify-center px-8 md:px-16 lg:px-24 xl:px-32 2xl:px-40 py-12 max-w-3xl mx-auto w-full"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-12">
          <img
            src="https://vendor-onboarding-qa.kebapp-chefs.com/static/media/logo-kp.4d8a59f505edc841df24.png"
            alt="Kebab Partners Logo"
            className="h-12 w-auto mb-8"
          />
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight">
            Welcome to Kebab Partners
          </h1>
          <p className="text-gray-600 text-lg mb-2">
            Sign in with your phone number
          </p>
          <p className="text-sm text-gray-500">
            We'll send you a verification code to your phone
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

        <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
          <div className="space-y-2">
            <PhoneInput
              label="Phone Number"
              value={phone}
              countryCode={countryCode}
              onPhoneChange={(newPhone, newCountryCode) => {
                setPhone(newPhone);
                setCountryCode(newCountryCode);
              }}
              required
              className="text-lg"
            />
            <p className="text-sm text-gray-500">
              We'll use this number for order notifications and important updates
            </p>
          </div>
          
          <Button
            type="submit"
            size="lg"
            className="w-full text-lg py-6"
            isLoading={isLoading}
          >
            Send Code
          </Button>
        </form>

        <p className="mt-8 text-sm text-gray-500 max-w-md">
          By signing up, you agree to our Terms of Service, Privacy Policy, and Cookie Policy
        </p>
        <div className="mt-4 text-center">
          <a
            href="mailto:helpdesk@kebapp.club"
            className="text-sm text-brand-secondary hover:text-brand-primary transition-colors inline-flex items-center gap-1"
          >
            Need help? Contact our support team
          </a>
        </div>
      </motion.div>

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
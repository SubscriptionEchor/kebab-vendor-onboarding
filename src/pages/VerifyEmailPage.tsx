import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { validateEmail } from '../utils/validation';
import confetti from 'canvas-confetti';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

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

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!validateEmail(email)) {
      setErrors(['Please enter a valid email address']);
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual email sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEmailSent(true);
    } catch (error) {
      console.error('Failed to send email:', error);
      setErrors(['Failed to send verification code. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!otp) {
      setErrors(['Please enter the verification code']);
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual email verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      fireConfetti();
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Email verification failed:', error);
      setErrors(['Invalid verification code. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 max-w-[2560px] mx-auto">
      {/* Left Side - Email Form */}
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
            Verify Your Email
          </h1>
          <p className="text-gray-600 text-lg mb-2">
            {isEmailSent
              ? "We've sent a verification code to your email"
              : "Please enter your work email"}
          </p>
          {!isEmailSent && (
            <p className="text-sm text-gray-500">
              Using your work email will make it easier for you to collaborate with your team
            </p>
          )}
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

        {!isEmailSent ? (
          <form onSubmit={handleSendEmail} className="space-y-6 max-w-md">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email"
              className="text-lg py-6"
              required
            />
            
            <Button
              type="submit"
              size="lg"
              className="w-full text-lg py-6"
              isLoading={isLoading}
            >
              Send Code
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyEmail} className="space-y-6 max-w-md">
            <Input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter verification code"
              className="text-lg py-6"
              required
            />
            
            <Button
              type="submit"
              size="lg"
              className="w-full text-lg py-6"
              isLoading={isLoading}
            >
              Verify Email
            </Button>
          </form>
        )}

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
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

export function VerifyOTPPage() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
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

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ['#EDCC27', '#2B4D7E', '#F4E7B0'],
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      colors: ['#EDCC27', '#2B4D7E', '#F4E7B0'],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // TODO: Implement actual OTP verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      fireConfetti();
      // Wait for confetti animation before navigating
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('OTP verification failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setTimer(30);
    // TODO: Implement actual resend logic
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
            Verify Your Email
          </h1>
          <p className="text-gray-600 text-lg">
            We've sent a verification code to your email
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 max-w-md">
          <div className="flex gap-2 justify-between">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-semibold rounded-lg border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
            ))}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full text-lg py-6"
            isLoading={isLoading}
          >
            Verify Email
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
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { Button } from './Button';

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGoHome: () => void;
}

export function SuccessDialog({ isOpen, onClose, onGoHome }: SuccessDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full relative">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>

                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Application Submitted!
                </h2>
                <p className="text-gray-600 mb-6">
                  Thank you for your application. Our team will review it within 4-5 business days.
                  We'll notify you once the review is complete.
                </p>

                <Button
                  onClick={onGoHome}
                  size="lg"
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
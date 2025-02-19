import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  blur?: boolean;
}

export function LoadingOverlay({ isLoading, message = 'Loading...', blur = true }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2 } }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            blur ? 'backdrop-blur-sm' : ''
          } bg-black/20 transition-all`}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6 flex flex-col items-center"
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-gray-700 font-medium animate-pulse">{message}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
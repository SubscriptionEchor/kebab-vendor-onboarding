import { motion } from 'framer-motion';
import { Button } from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onBack?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function FormNavigation({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  isSubmitting = false,
  submitLabel = 'Submit'
}: FormNavigationProps) {
  return (
    <div className="flex justify-between items-center pt-8">
      {currentStep > 1 ? (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
      ) : (
        <div /> {/* Spacer */}
      )}

      <div className="flex-1 flex justify-center">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <motion.div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index + 1 === currentStep
                  ? 'bg-brand-primary'
                  : index + 1 < currentStep
                  ? 'bg-brand-primary/50'
                  : 'bg-gray-200'
              }`}
              initial={false}
              animate={{
                scale: index + 1 === currentStep ? 1.2 : 1
              }}
            />
          ))}
        </div>
      </div>

      <Button
        type={currentStep === totalSteps ? 'submit' : 'button'}
        onClick={currentStep < totalSteps ? onNext : undefined}
        isLoading={isSubmitting}
      >
        {currentStep === totalSteps ? (
          submitLabel
        ) : (
          <>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
}
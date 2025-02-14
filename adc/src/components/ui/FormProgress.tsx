import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface FormProgressProps {
  steps: {
    id: number;
    title: string;
    description?: string;
  }[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function FormProgress({ steps, currentStep, onStepClick }: FormProgressProps) {
  return (
    <nav aria-label="Progress">
      <ol className="space-y-4 md:flex md:space-y-0 md:space-x-8">
        {steps.map((step) => (
          <li key={step.id} className="md:flex-1">
            <button
              onClick={() => onStepClick?.(step.id)}
              className={`group flex w-full flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0 ${
                step.id < currentStep
                  ? 'border-brand-primary'
                  : step.id === currentStep
                  ? 'border-brand-primary'
                  : 'border-gray-200'
              }`}
              disabled={step.id > currentStep}
            >
              <span className="text-sm font-medium">
                {step.id < currentStep ? (
                  <span className="flex items-center text-brand-primary">
                    <Check className="mr-2 h-4 w-4" />
                    {step.title}
                  </span>
                ) : step.id === currentStep ? (
                  <span className="text-brand-primary">{step.title}</span>
                ) : (
                  <span className="text-gray-500">{step.title}</span>
                )}
              </span>
              {step.description && (
                <span className="text-sm text-gray-500">{step.description}</span>
              )}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
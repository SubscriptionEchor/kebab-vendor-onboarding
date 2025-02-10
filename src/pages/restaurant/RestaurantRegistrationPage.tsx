import { motion } from 'framer-motion';
import { ChevronRight, Store, UtensilsCrossed, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RestaurantInfoStep } from './steps/RestaurantInfoStep';
import { MenuDetailsStep } from './steps/MenuDetailsStep';
import { DocumentsStep } from './steps/DocumentsStep';
import { useRestaurantApplication } from '../../context/RestaurantApplicationContext';

const steps = [
  { id: 1, title: 'Restaurant Information', icon: Store },
  { id: 2, title: 'Menu Details', icon: UtensilsCrossed },
  { id: 3, title: 'Documents', icon: FileText },
];

export function RestaurantRegistrationPage() {
  const { currentStep, setCurrentStep } = useRestaurantApplication();

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-sm p-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 font-display mb-8">
          Add New Restaurant
        </h1>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep >= step.id
                      ? 'bg-brand-primary text-brand-secondary'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                <p
                  className={`mt-2 text-sm font-medium ${
                    currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </p>
                {index < steps.length - 1 && (
                  <ChevronRight
                    className={`absolute left-[calc(100%+1rem)] top-3 w-4 h-4 ${
                      currentStep > step.id ? 'text-brand-primary' : 'text-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
            <div
              className="absolute top-5 h-0.5 w-full -z-10"
              style={{
                background: `linear-gradient(to right, #EDCC27 ${
                  ((currentStep - 1) / (steps.length - 1)) * 100
                }%, #E5E7EB ${((currentStep - 1) / (steps.length - 1)) * 100}%)`,
              }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 1 && <RestaurantInfoStep onNext={handleNext} />}
          {currentStep === 2 && <MenuDetailsStep onNext={handleNext} onBack={handleBack} />}
          {currentStep === 3 && <DocumentsStep onBack={handleBack} />}
        </div>
      </motion.div>
    </div>
  );
}
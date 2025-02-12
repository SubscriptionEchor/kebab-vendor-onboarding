import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Store, UtensilsCrossed, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RestaurantInfoStep } from './steps/RestaurantInfoStep';
import { MenuDetailsStep } from './steps/MenuDetailsStep';
import { DocumentsStep } from './steps/DocumentsStep';
import { useRestaurantApplication } from '../../context/RestaurantApplicationContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getApplicationById } from '../../services/restaurant';
import { useToast } from '../../context/ToastContext';

const steps = [
  { id: 1, title: 'Restaurant Information', icon: Store },
  { id: 2, title: 'Menu Details', icon: UtensilsCrossed },
  { id: 3, title: 'Documents', icon: FileText },
];

export function RestaurantRegistrationPage() {
  const { currentStep, setCurrentStep, updateApplication } = useRestaurantApplication();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const editId = searchParams.get('edit');

    if (editId) {
      const loadApplication = async () => {
        setIsLoading(true);
        try {
          const applicationData = await getApplicationById(editId);
          console.log('Loaded application data:', applicationData);
          
          // Format opening times
          const formattedOpeningTimes = applicationData.openingTimes?.map(time => ({
            day: time.day,
            isOpen: time.isOpen,
            times: time.isOpen && time.times?.length > 0 ? [{
              startTime: Array.isArray(time.times[0].startTime) ? 
                time.times[0].startTime[0] : time.times[0].startTime,
              endTime: Array.isArray(time.times[0].endTime) ? 
                time.times[0].endTime[0] : time.times[0].endTime
            }] : []
          }));

          // Extract address components from the backend format
          let addressComponents = {
            street: '',
            number: '',
            city: 'Berlin',
            postalCode: '',
            country: 'Germany'
          };

          if (applicationData.location?.address) {
            const addressParts = applicationData.location.address.split(',').map(part => part.trim());
            
            if (addressParts[0]) {
              const streetMatch = addressParts[0].match(/^(.*?)\s+(\d+\s*[A-Za-z]?)?$/);
              if (streetMatch) {
                addressComponents.street = streetMatch[1]?.trim() || '';
                addressComponents.number = streetMatch[2]?.trim() || '';
              } else {
                addressComponents.street = addressParts[0];
              }
            }

            if (addressParts[1]) {
              const cityParts = addressParts[1].match(/(\d+)\s+(.+)/);
              if (cityParts) {
                addressComponents.postalCode = cityParts[1];
                addressComponents.city = cityParts[2];
              } else {
                addressComponents.city = addressParts[1];
              }
            }

            if (addressParts[3]) {
              addressComponents.country = addressParts[3];
            }
          }
          
          // Handle phone numbers - strip country code if present
          const stripCountryCode = (phone: string) => {
            if (!phone) return '';
            return phone.replace(/^\+\d{2}/, '');
          };

          // Get coordinates, ensuring they're numbers
          const coordinates = applicationData.location?.coordinates?.coordinates || [13.404954, 52.520008];
          const [lng, lat] = coordinates.map(coord => typeof coord === 'number' ? coord : parseFloat(coord));
          
          // Format the data to match our application structure
          const formattedData = {
            beneficialOwners: applicationData.beneficialOwners.map(owner => ({
              ...owner,
              phone: stripCountryCode(owner.phone),
              idCardDocuments: owner.idCardDocuments || []
            })),
            companyName: applicationData.companyName,
            restaurantName: applicationData.restaurantName,
            restaurantContactInfo: {
              ...applicationData.restaurantContactInfo,
              phone: stripCountryCode(applicationData.restaurantContactInfo.phone)
            },
            location: {
              coordinates: {
                type: 'Point',
                coordinates: [
                  lng,
                  lat
                ]
              },
              address: addressComponents
            },
            restaurantImages: applicationData.restaurantImages,
            menuImages: applicationData.menuImages,
            profileImage: applicationData.profileImage,
            cuisines: applicationData.cuisines,
            openingTimes: formattedOpeningTimes,
            businessDocuments: applicationData.businessDocuments,
          };

          console.log('Formatted application data:', formattedData);
          updateApplication(formattedData);
          showToast('Application loaded successfully', 'success');
        } catch (error) {
          console.error('Failed to load application:', error);
          showToast('Failed to load application. Please try again.', 'error');
          navigate('/applications');
        } finally {
          setIsLoading(false);
        }
      };

      loadApplication();
    }
  }, [location.search]);

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        key="registration-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-sm p-8"
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-display">
            {location.search.includes('edit') ? 'Edit Application' : 'Add New Restaurant'}
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate('/applications')}
          >
            Back to Applications
          </Button>
        </div>

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
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-12"
            >
              <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-8"
            >
              {currentStep === 1 && <RestaurantInfoStep onNext={handleNext} />}
              {currentStep === 2 && <MenuDetailsStep onNext={handleNext} onBack={handleBack} />}
              {currentStep === 3 && <DocumentsStep onBack={handleBack} />}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
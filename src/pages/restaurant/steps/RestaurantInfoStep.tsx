import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { useRestaurantApplication } from '../../../context/RestaurantApplicationContext';
import { useToast } from '../../../context/ToastContext';
import { DEFAULT_LOCATION } from '../../../config/defaults';
import { ValidationError } from '../../../utils/validation';
import {
  ContactInformation,
  BusinessOwnership,
  CompanyDetails,
  RestaurantDetails,
  LocationDetails
} from './components';

interface RestaurantInfoStepProps {
  onNext: () => void;
}

export function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 mb-1">
      <span className="text-sm font-medium text-gray-700">{children}</span>
      <span className="text-red-500">*</span>
    </div>
  );
}

// Validation function for restaurant info snapshot
const validateSnapshot = (snapshot: any): void => {
  const errors = [];

  if (!snapshot.companyName) {
    errors.push('Company name is required');
  }
  if (!snapshot.restaurantName) {
    errors.push('Restaurant name is required');
  }
  if (!snapshot.restaurantContactInfo.email) {
    errors.push('Restaurant email is required');
  }
  if (!snapshot.restaurantContactInfo.phone) {
    errors.push('Restaurant phone is required');
  }
  if (!snapshot.location.address) {
    errors.push('Complete address is required');
  }
  if (!snapshot.beneficialOwners.some(owner => owner.isPrimary)) {
    errors.push('Primary owner information is required');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

// Helper function to format phone numbers
const formatPhoneNumber = (phone: string, countryCode: string): string => {
  // Remove any existing country code prefix and clean the number
  const cleanPhone = phone.replace(/^\+\d{2}/, '').replace(/\D/g, '').replace(/^0+/, '');
  return `+${countryCode === 'IN' ? '91' : '49'}${cleanPhone}`;
};

export function RestaurantInfoStep({ onNext }: RestaurantInfoStepProps) {
  const { showToast } = useToast();
  const { application, updateApplication } = useRestaurantApplication();
  const [formData, setFormData] = useState({
    companyName: '',
    restaurantName: '',
    restaurantEmail: '',
    restaurantPhone: '',
    restaurantCountryCode: 'DE',
    address: '',
    location: {
      lat: DEFAULT_LOCATION.lat,
      lng: DEFAULT_LOCATION.lng,
    },
    ownerName: '',
    passportId: '',
    email: '',
    phone: '',
    countryCode: 'DE',
    language: 'English',
    currency: 'EUR',
    hasMultipleOwners: false,
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [additionalOwners, setAdditionalOwners] = useState<any[]>([]);

  // Initialize form data from application context
  useEffect(() => {
    if (application) {
      console.log('Initializing form data from application:', application);
      
      // Handle address from backend
      let address = '';
      if (application.location?.address) {
        // Handle both string and object address formats
        address = typeof application.location.address === 'string' 
          ? application.location.address.trim() 
          : '';
        console.log('Parsed address from application:', address);
      }

      console.log('Setting address from application:', address);

      // Get coordinates
      const coordinates = application.location?.coordinates?.coordinates || [DEFAULT_LOCATION.lng, DEFAULT_LOCATION.lat];
      const [lng, lat] = coordinates;

      // Update form data with address and coordinates
      setFormData(prev => ({
        ...prev,
        companyName: application.companyName || '',
        restaurantName: application.restaurantName || '',
        restaurantEmail: application.restaurantContactInfo?.email || '',
        restaurantPhone: application.restaurantContactInfo?.phone || '',
        address: address,
        location: {
          lat: lat || DEFAULT_LOCATION.lat,
          lng: lng || DEFAULT_LOCATION.lng
        }
      }));

      // Save to localStorage with proper address
      localStorage.setItem('restaurantFormData', JSON.stringify({
        address: address,
        location: {
          lat: lat || DEFAULT_LOCATION.lat,
          lng: lng || DEFAULT_LOCATION.lng
        }
      }));

      // Restore beneficial owners
      if (application.beneficialOwners?.length) {
        const primaryOwner = application.beneficialOwners.find(owner => owner.isPrimary);
        const otherOwners = application.beneficialOwners.filter(owner => !owner.isPrimary);

        if (primaryOwner) {
          setFormData(prev => ({
            ...prev,
            ownerName: primaryOwner.name || '',
            passportId: primaryOwner.passportId || '',
            email: primaryOwner.email || '',
            phone: primaryOwner.phone || '',
            hasMultipleOwners: otherOwners.length > 0
          }));
        }

        if (otherOwners.length) {
          setAdditionalOwners(
            otherOwners.map(owner => ({
              id: crypto.randomUUID(),
              firstName: owner.name?.split(' ')[0] || '',
              lastName: owner.name?.split(' ').slice(1).join(' ') || '',
              passportId: owner.passportId || '',
              email: owner.email || '',
              phone: owner.phone || '',
              countryCode: 'DE'
            }))
          );
        }
      }
    }
  }, [application]);

  // Load saved form data from localStorage when component mounts
  useEffect(() => {
    const savedData = localStorage.getItem('restaurantFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(prev => ({
          ...prev,
          ...parsedData
        }));
      } catch (error) {
        console.error('Failed to parse saved form data:', error);
      }
    }
  }, []);

  // Format additional owners before creating snapshot
  const formattedAdditionalOwners = additionalOwners.map(owner => ({
    name: `${owner.firstName} ${owner.lastName}`.trim(),
    passportId: owner.passportId.trim(),
    email: owner.email.trim(),
    phone: owner.phone ? formatPhoneNumber(owner.phone, owner.countryCode) : '',
    countryCode: owner.countryCode,
    isPrimary: false,
    idCardDocuments: []
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    
    // Create a complete snapshot first
    const formSnapshot = {
      companyName: formData.companyName.trim(),
      restaurantName: formData.restaurantName.trim(),
      restaurantContactInfo: {
        email: formData.restaurantEmail.trim(),
        phone: formatPhoneNumber(formData.restaurantPhone, formData.restaurantCountryCode),
        countryCode: formData.restaurantCountryCode
      },
      location: {
        coordinates: {
          type: 'Point' as const,
          coordinates: [
            parseFloat(formData.location.lng.toFixed(6)),
            parseFloat(formData.location.lat.toFixed(6))
          ]
        },
        address: formData.address
      },
      beneficialOwners: [
        {
          name: formData.ownerName.trim(),
          passportId: formData.passportId.trim(),
          email: formData.email.trim(),
          phone: formatPhoneNumber(formData.phone, formData.countryCode),
          countryCode: formData.countryCode,
          isPrimary: true,
          idCardDocuments: []
        },
        ...formattedAdditionalOwners
      ]
    };
    
    try {
      // Validate the snapshot
      validateSnapshot(formSnapshot);
      
      // Update the snapshot with the full address
      formSnapshot.location.address = formData.address;
      
      // Update application with validated snapshot
      await updateApplication(formSnapshot);

      // Clear any existing errors
      setValidationErrors([]);
      onNext();
    } catch (error) {
      console.error('Form submission error:', error);
      
      if (error instanceof ValidationError) {
        setValidationErrors(error.errors);
        showToast('Please fix the validation errors and try again', 'error');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setValidationErrors([errorMessage]);
        showToast(errorMessage, 'error');
      }
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto space-y-8"
    >
      {validationErrors.length > 0 && (
        <div className="space-y-2">
          {validationErrors.map((error, index) => (
            <ErrorAlert
              key={index}
              message={error}
              onClose={() => setValidationErrors([])}
            />
          ))}
        </div>
      )}

      <ContactInformation
        formData={formData}
        setFormData={setFormData}
        setValidationErrors={setValidationErrors}
      />

      <BusinessOwnership
        formData={formData}
        setFormData={setFormData}
        additionalOwners={additionalOwners}
        setAdditionalOwners={setAdditionalOwners}
      />

      <CompanyDetails
        formData={formData}
        setFormData={setFormData}
      />

      <RestaurantDetails
        formData={formData}
        setFormData={setFormData}
      />

      <LocationDetails
        formData={formData}
        setFormData={setFormData}
      />

      {/* Navigation */}
      <div className="flex justify-end pt-8">
        <Button type="submit" size="lg">
          Next Step
        </Button>
      </div>
    </motion.form>
  );
}
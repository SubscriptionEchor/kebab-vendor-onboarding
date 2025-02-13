import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { useRestaurantApplication } from '../../../context/RestaurantApplicationContext';
import { useToast } from '../../../context/ToastContext';
import { DEFAULT_LOCATION } from '../../../config/defaults';
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

export function RestaurantInfoStep({ onNext }: RestaurantInfoStepProps) {
  const { showToast } = useToast();
  const { application, updateApplication } = useRestaurantApplication();
  const [formData, setFormData] = useState({
    companyName: '',
    restaurantName: '',
    restaurantEmail: '',
    restaurantPhone: '',
    restaurantCountryCode: 'DE',
    address: {
      doorNumber: '',
      street: '',
      area: '',
      city: '',
      postalCode: '',
      country: 'Germany',
    },
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

      // Extract address components
      const address = typeof application.location?.address === 'object' 
        ? application.location.address
        : {
            doorNumber: '',
            street: '',
            area: '',
            city: 'Berlin',
            postalCode: '',
            country: 'Germany'
          };
      // Extract address components from the stored address
      let addressComponents = {
        doorNumber: '',
        street: '',
        area: '',
        city: 'Berlin',
        postalCode: '',
        country: 'Germany'
      };

      if (typeof application.location?.address === 'object') {
        addressComponents = {
          doorNumber: application.location.address.doorNumber || '',
          street: application.location.address.street || '',
          area: application.location.address.area || '',
          city: application.location.address.city || 'Berlin',
          postalCode: application.location.address.postalCode || '',
          country: application.location.address.country || 'Germany'
        };
      }

      // Get coordinates
      const coordinates = application.location?.coordinates?.coordinates || [DEFAULT_LOCATION.lng, DEFAULT_LOCATION.lat];
      const [lng, lat] = coordinates;

      setFormData(prev => ({
        ...prev,
        companyName: application.companyName || '',
        restaurantName: application.restaurantName || '',
        restaurantEmail: application.restaurantContactInfo?.email || '',
        restaurantPhone: application.restaurantContactInfo?.phone || '',
        address: addressComponents,
        location: {
          lat: lat || DEFAULT_LOCATION.lat,
          lng: lng || DEFAULT_LOCATION.lng
        }
      }));
      localStorage.setItem('restaurantFormData', JSON.stringify({
        address: addressComponents,
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    
    // Helper function to format phone numbers
    const formatPhoneNumber = (phone: string, countryCode: string): string => {
      // Remove any existing country code prefix and clean the number
      const cleanPhone = phone.replace(/^\+\d{2}/, '').replace(/\D/g, '').replace(/^0+/, '');
      return `+${countryCode === 'IN' ? '91' : '49'}${cleanPhone}`;
    };

    try {
      // Format address according to backend expectations
      const formattedAddress = [
        formData.address.doorNumber,
        formData.address.street,
        formData.address.area,
        `${formData.address.postalCode} ${formData.address.city}`.trim(),
        formData.address.country
      ].filter(Boolean).join(', ');

      // Helper function to format phone numbers
      const formatPhoneNumber = (phone: string, countryCode: string): string => {
        const digits = phone.replace(/\D/g, '').replace(/^0+/, '');
        const prefix = countryCode === 'IN' ? '91' : '49';
        return `+${prefix}${digits}`;
      };

      // Format phone numbers for additional owners safely
      const formattedAdditionalOwners = additionalOwners.map(owner => ({
        name: `${owner.firstName} ${owner.lastName}`,
        passportId: owner.passportId,
        email: owner.email,
        phone: owner.phone ? formatPhoneNumber(owner.phone, owner.countryCode) : '',
        isPrimary: false,
        idCardDocuments: [],
      }));

      // Prepare application data
      await updateApplication({
        companyName: formData.companyName,
        restaurantName: formData.restaurantName,
        restaurantContactInfo: {
          email: formData.restaurantEmail.trim(),
          phone: formData.restaurantPhone,
          countryCode: formData.restaurantCountryCode === 'DE' ? '49' : '91',
        },
        location: {
          coordinates: {
            type: 'Point' as const,
            coordinates: [
              parseFloat(formData.location.lng.toFixed(6)),
              parseFloat(formData.location.lat.toFixed(6))
            ]
          },
          address: {
            doorNumber: formData.address.doorNumber,
            street: formData.address.street,
            area: formData.address.area,
            city: formData.address.city,
            postalCode: formData.address.postalCode,
            country: formData.address.country
          },
        },
        beneficialOwners: [
          {
            name: formData.ownerName,
            passportId: formData.passportId.trim(),
            email: formData.email.trim(),
            phone: formData.phone,
            countryCode: formData.countryCode === 'DE' ? '49' : '91',
            isPrimary: true,
            idCardDocuments: [],
          },
          ...formattedAdditionalOwners,
        ],
      });

      onNext();
    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      showToast(errorMessage, 'error');
      if (error instanceof Error) {
        setValidationErrors(prev => [...prev, error.message]);
      } else {
        setValidationErrors(prev => [...prev, 'An unexpected error occurred']);
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
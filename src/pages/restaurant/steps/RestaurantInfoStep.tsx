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
  const [formData, setFormData] = useState({
    companyName: '',
    restaurantName: '',
    restaurantEmail: '',
    restaurantPhone: '',
    restaurantCountryCode: 'DE',
    address: {
      street: '',
      number: '',
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
  const { application, updateApplication } = useRestaurantApplication();

  // Initialize form data from application context
  useEffect(() => {
    if (application) {
      // Handle address parsing safely
      let addressComponents = {
        street: '',
        number: '',
        city: 'Berlin',
        postalCode: '',
        country: 'Germany'
      };

      if (typeof application.location?.address === 'string') {
        const addressParts = application.location.address.split(',').map(part => part.trim());
        const [streetWithNumber = '', city = '', state = '', country = '', postalCode = ''] = addressParts;

        // Split street and number if present
        const streetMatch = streetWithNumber.match(/^(.*?)\s*(\d+\s*[A-Za-z]?)?$/);
        if (streetMatch) {
          const [, street = '', number = ''] = streetMatch;
          addressComponents.street = street.trim();
          addressComponents.number = number.trim();
        } else {
          addressComponents.street = streetWithNumber;
        }

        addressComponents.city = city || 'Berlin';
        addressComponents.postalCode = postalCode || '';
        addressComponents.country = country || 'Germany';
      } else if (typeof application.location?.address === 'object') {
        // If address is already an object, use its components
        addressComponents = {
          street: application.location.address.street || '',
          number: application.location.address.number || '',
          city: application.location.address.city || 'Berlin',
          postalCode: application.location.address.postalCode || '',
          country: application.location.address.country || 'Germany'
        };
      }

      setFormData(prev => ({
        ...prev,
        companyName: application.companyName || '',
        restaurantName: application.restaurantName || '',
        restaurantEmail: application.restaurantContactInfo?.email || '',
        restaurantPhone: application.restaurantContactInfo?.phone || '',
        address: addressComponents,
        location: {
          lat: application.location?.coordinates?.coordinates[1] || 52.520008,
          lng: application.location?.coordinates?.coordinates[0] || 13.404954,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    try {
      // Format address according to backend expectations
      const formattedAddress = [
        `${formData.address.street} ${formData.address.number}`.trim(),
        `${formData.address.postalCode} ${formData.address.city}`.trim(),
        formData.address.city,
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
          phone: formData.restaurantPhone ? formatPhoneNumber(formData.restaurantPhone, formData.restaurantCountryCode) : '',
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
          address: formattedAddress.trim(),
        },
        beneficialOwners: [
          {
            name: formData.ownerName,
            passportId: formData.passportId.trim(),
            email: formData.email.trim(),
            phone: formatPhoneNumber(formData.phone, formData.countryCode),
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
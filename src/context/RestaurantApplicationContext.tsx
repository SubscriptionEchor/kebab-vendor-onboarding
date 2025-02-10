import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from './ToastContext';
import type { RestaurantApplication, RestaurantApplicationContextType, RestaurantApplicationResponse } from '../types/restaurant';
import { graphqlRequest } from '../services/api';

const CREATE_APPLICATION = `
  mutation CreateApplication($input: RestaurantOnboardingApplicationInput!) {
    createRestaurantOnboardingApplication(input: $input) {
      _id
      applicationStatus
      resubmissionCount
      restaurantName
      createdAt
    }
  }
`;
import {
  validateRestaurantName,
  validateCompanyName,
  validateEmail,
  validatePhone,
  validateAddress,
  validateBankAccount,
  validateBIC,
  validateDocument,
  validateOpeningHours,
  validatePassportId,
  validateTaxId,
  validateCuisines,
  validateImage,
  validateLocation
} from '../utils/validation';
import { DEFAULT_LOCATION, DEFAULT_BUSINESS_HOURS } from '../config/defaults';

const defaultApplication: RestaurantApplication = {
  beneficialOwners: [],
  companyName: '',
  restaurantName: '',
  restaurantContactInfo: {
    email: '',
    phone: '',
    countryCode: 'DE',
  },
  location: {
    coordinates: {
      type: 'Point',
      coordinates: [DEFAULT_LOCATION.lng, DEFAULT_LOCATION.lat],
    },
    address: '',
  },
  restaurantImages: [],
  menuImages: [],
  profileImage: '',
  cuisines: [],
  openingTimes: [
    { day: 'MON', times: [{ startTime: [DEFAULT_BUSINESS_HOURS.weekday.open], endTime: [DEFAULT_BUSINESS_HOURS.weekday.close] }], isOpen: true },
    { day: 'TUE', times: [{ startTime: [DEFAULT_BUSINESS_HOURS.weekday.open], endTime: [DEFAULT_BUSINESS_HOURS.weekday.close] }], isOpen: true },
    { day: 'WED', times: [{ startTime: [DEFAULT_BUSINESS_HOURS.weekday.open], endTime: [DEFAULT_BUSINESS_HOURS.weekday.close] }], isOpen: true },
    { day: 'THU', times: [{ startTime: [DEFAULT_BUSINESS_HOURS.weekday.open], endTime: [DEFAULT_BUSINESS_HOURS.weekday.close] }], isOpen: true },
    { day: 'FRI', times: [{ startTime: [DEFAULT_BUSINESS_HOURS.weekday.open], endTime: [DEFAULT_BUSINESS_HOURS.weekday.close] }], isOpen: true },
    { day: 'SAT', times: [{ startTime: [DEFAULT_BUSINESS_HOURS.weekend.open], endTime: [DEFAULT_BUSINESS_HOURS.weekend.close] }], isOpen: true },
    { day: 'SUN', times: [{ startTime: [DEFAULT_BUSINESS_HOURS.weekend.open], endTime: [DEFAULT_BUSINESS_HOURS.weekend.close] }], isOpen: true },
  ],
  businessDocuments: {
    hospitalityLicense: '',
    registrationCertificate: '',
    bankDetails: {
      accountNumber: '',
      bankName: '',
      branchName: '',
      bankIdentifierCode: '',
      accountHolderName: '',
      documentUrl: '',
    },
    taxId: {
      documentNumber: '',
      documentUrl: '',
    }
  },
};

const RestaurantApplicationContext = createContext<RestaurantApplicationContextType | null>(null);

export function RestaurantApplicationProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [application, setApplication] = useState<RestaurantApplication | null>(() => {
    // Try to load saved application data on mount
    try {
      const savedData = localStorage.getItem('restaurantApplication');
      return savedData ? JSON.parse(savedData) : defaultApplication;
    } catch (error) {
      console.error('Failed to load saved application:', error);
      return defaultApplication;
    }
  });

  const [currentStep, setCurrentStep] = useState(1);

  // Load current step from sessionStorage
  useEffect(() => {
    const savedStep = sessionStorage.getItem('currentStep');
    if (savedStep) {
      setCurrentStep(parseInt(savedStep, 10));
    }
  }, []);

  // Save current step to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('currentStep', currentStep.toString());
  }, [currentStep]);

  // Listen for beforeunload event to save data before refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (application) {
        localStorage.setItem('restaurantApplication', JSON.stringify(application));
        sessionStorage.setItem('currentStep', currentStep.toString());
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [application]);

  const updateApplication = (data: Partial<RestaurantApplication>) => {
    console.log('Updating application with:', data);
    setApplication(prev => {
      if (!prev) return { ...defaultApplication, ...data };
      const currentApplication = prev || defaultApplication;

      const updatedApplication = {
        ...currentApplication,
        ...data,
        // Preserve arrays if not provided in update
        beneficialOwners: data.beneficialOwners || currentApplication.beneficialOwners,
        restaurantImages: data.restaurantImages || currentApplication.restaurantImages,
        menuImages: data.menuImages || currentApplication.menuImages,
        cuisines: data.cuisines || currentApplication.cuisines,
        openingTimes: data.openingTimes || currentApplication.openingTimes
      };
      console.log('Updated application state:', updatedApplication);
      return updatedApplication;
    });
  };

  // Auto-save to localStorage whenever application changes
  useEffect(() => {
    if (application) {
      localStorage.setItem('restaurantApplication', JSON.stringify(application));
    }
  }, [application]);

  const resetApplication = () => {
    // This function is now only used internally
    // and should not be exposed to components
  };

  const submitApplication = async (): Promise<RestaurantApplicationResponse> => {
    if (!application) {
      console.error('No application data to submit');
      throw new Error('Please fill in all required information before submitting.');
    }
    console.log('Cuisines being submitted:', application.cuisines);

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('Authentication token not found');
      throw new Error('Your session has expired. Please log in again.');
    }

    // Validate required fields
    // Validate required fields
    const requiredFields = {
      'Restaurant Name': application.restaurantName,
      'Company Name': application.companyName?.trim(),
      'Restaurant Email': application.restaurantContactInfo.email,
      'Restaurant Phone': application.restaurantContactInfo.phone,
      'Restaurant Address': application.location.address,
      'Restaurant Images': application.restaurantImages?.length >= 2,
      'Menu Images': application.menuImages?.length >= 1,
      'Profile Image': application.profileImage,
      'Cuisines': application.cuisines?.length === 3,
      'Hospitality License': application.businessDocuments.hospitalityLicense,
      'Registration Certificate': application.businessDocuments.registrationCertificate,
      'Opening Hours': application.openingTimes?.length === 7,
      'Primary Owner': application.beneficialOwners?.some(owner => owner.isPrimary),
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([field]) => field);

    console.log('Checking required fields:', missingFields);
    if (missingFields.length > 0) {
      throw new Error(`Please complete all required fields: ${missingFields.join(', ')}`);
    }

    console.log('Submitting application:', application);
    try {
      // Format application data for API submission
      console.log('Formatting application data for submission...');
      const applicationInput = {
        beneficialOwners: application.beneficialOwners.map(owner => {
          console.log('Processing owner:', owner);
          return {
            name: owner.name.trim(),
            passportId: owner.passportId.trim(),
            email: owner.email.trim(),
            phone: formatPhoneNumber(owner.phone, owner.countryCode),
            isPrimary: owner.isPrimary,
            idCardDocuments: owner.idCardDocuments?.filter(Boolean) || []
          };
        }),
        companyName: application.companyName.trim(),
        restaurantName: application.restaurantName.trim(),
        restaurantContactInfo: {
          email: application.restaurantContactInfo.email.trim(),
          phone: formatPhoneNumber(application.restaurantContactInfo.phone, application.restaurantContactInfo.countryCode)
        },
        location: {
          coordinates: {
            type: 'Point' as const,
            coordinates: [
              application.location.coordinates.coordinates[0],
              parseFloat(application.location.coordinates.coordinates[1].toFixed(8))
            ]
          },
          address: formatAddress(application.location.address, application.restaurantContactInfo.countryCode)
        },
        restaurantImages: application.restaurantImages
          .map(img => typeof img === 'string' ? img : img.key)
          .filter(Boolean),
        menuImages: application.menuImages
          .map(img => typeof img === 'string' ? img : img.key)
          .filter(Boolean),
        profileImage: typeof application.profileImage === 'string' ? 
          application.profileImage : application.profileImage?.key,
        cuisines: application.cuisines.map(cuisine => 
          typeof cuisine === 'string' ? cuisine.trim() : cuisine.name.trim()
        ),
        openingTimes: application.openingTimes.map(time => ({
          day: time.day,
          isOpen: time.isOpen,
          times: time.isOpen && time.times?.length > 0 ? [{
            startTime: [time.times[0].startTime[0] || time.times[0].startTime],
            endTime: [time.times[0].endTime[0] || time.times[0].endTime]
          }] : []
        })),
        businessDocuments: {
          hospitalityLicense: getDocumentKey(application.businessDocuments.hospitalityLicense),
          registrationCertificate: getDocumentKey(application.businessDocuments.registrationCertificate),
          taxId: {
            documentNumber: application.businessDocuments.taxId.documentNumber || 'default',
            documentUrl: getDocumentKey(application.businessDocuments.taxId.documentUrl)
          }
        }
      };
      
      console.log('Formatted application data:', applicationInput);

      // Helper function to format phone numbers
      function formatPhoneNumber(phone: string, countryCode: string): string {
        const cleanPhone = phone.replace(/\D/g, '');
        // Keep the phone number as is if it already has a + prefix
        if (phone.startsWith('+')) {
          return phone;
        }
        // Otherwise, format it with the country code
        const normalizedPhone = cleanPhone.replace(/^0+/, '');
        return `+${countryCode === 'IN' ? '91' : '49'}${normalizedPhone}`;
      }

      // Helper function to format address
      function formatAddress(address: string, countryCode: string): string {
        const parts = address.split(',').map(part => part.trim());
        if (countryCode === 'IN') {
          const [street = '', city = '', state = '', country = 'India', postalCode = ''] = parts;
          return `${street}, ${city}, ${state}, ${country}, ${postalCode}`;
        } else {
          const [street = '', city = 'Berlin', state = 'Berlin', country = 'Germany', postalCode = ''] = parts;
          return `${street}, ${city}, ${state}, ${country}, ${postalCode}`;
        }
      }

      // Helper function to get document key
      function getDocumentKey(doc: string | { key: string }): string {
        if (!doc) return '';
        return typeof doc === 'string' ? doc : doc.key || '';
      }

      console.log('Formatted application data:', applicationInput);
      console.log('Sending application to API...');

      // Log ID card documents before submission
      console.log('ID Card Documents being submitted:', applicationInput.beneficialOwners.map(owner => owner.idCardDocuments));

      const response = await graphqlRequest<{ createRestaurantOnboardingApplication: RestaurantApplicationResponse }>(
        CREATE_APPLICATION,
        { input: applicationInput },
        {
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://vendor-onboarding-qa.kebapp-chefs.com',
          'Referer': 'https://vendor-onboarding-qa.kebapp-chefs.com/',
          'Priority': 'u=1, i'
        }
      );

      console.log('Application submitted successfully:', response);
      showToast('Application submitted successfully!', 'success');
      return response.createRestaurantOnboardingApplication;
    } catch (error) {
      console.error('Submission failed:', error);
      let errorMessage = 'Failed to submit application. ';
      
      if (error instanceof Error) {
        console.error('Submission error details:', error);
        if (error.message.includes('validation')) {
          errorMessage += 'Please check all required fields are filled correctly.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Your session has expired. Please log in again.';
          window.location.href = '/login';
        } else if (error.message.includes('unauthorized')) {
          errorMessage = 'Your session has expired. Please log in again.';
          window.location.href = '/login';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'An unexpected error occurred.';
      }
      showToast(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  return (
    <RestaurantApplicationContext.Provider
      value={{
        application,
        currentStep,
        setCurrentStep,
        updateApplication,
        resetApplication,
        submitApplication,
      }}
    >
      {children}
    </RestaurantApplicationContext.Provider>
  );
}

export function useRestaurantApplication() {
  const context = useContext(RestaurantApplicationContext);
  if (!context) {
    throw new Error('useRestaurantApplication must be used within a RestaurantApplicationProvider');
  }
  return context;
}
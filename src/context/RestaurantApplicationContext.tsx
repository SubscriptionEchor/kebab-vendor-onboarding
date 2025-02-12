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
    countryCode: '',
  },
  location: {
    coordinates: {
      type: 'Point',
      coordinates: [0, 0],
    },
    address: '',
  },
  restaurantImages: [],
  menuImages: [],
  profileImage: '',
  cuisines: [],
  openingTimes: [
    { day: 'MON', times: [], isOpen: false },
    { day: 'TUE', times: [], isOpen: false },
    { day: 'WED', times: [], isOpen: false },
    { day: 'THU', times: [], isOpen: false },
    { day: 'FRI', times: [], isOpen: false },
    { day: 'SAT', times: [], isOpen: false },
    { day: 'SUN', times: [], isOpen: false },
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
    // Only load saved data if we're editing an existing application
    const searchParams = new URLSearchParams(window.location.search);
    const isEditing = searchParams.has('edit');

    try {
      if (isEditing) {
        const savedData = localStorage.getItem('restaurantApplication');
        return savedData ? JSON.parse(savedData) : defaultApplication;
      }
      // For new applications, start fresh
      return defaultApplication;
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
      const searchParams = new URLSearchParams(window.location.search);
      const isEditing = searchParams.has('edit');
      
      // Only save data if we're editing or have made changes
      if (application && (isEditing || JSON.stringify(application) !== JSON.stringify(defaultApplication))) {
        localStorage.setItem('restaurantApplication', JSON.stringify(application));
        sessionStorage.setItem('currentStep', currentStep.toString());
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [application]);

  const updateApplication = (data: Partial<RestaurantApplication>) => {
    setApplication(prev => {
      if (!prev) return { ...defaultApplication, ...data };
      const currentApplication = prev || defaultApplication;

      // Deep merge arrays and nested objects
      const updatedApplication: RestaurantApplication = {
        ...currentApplication,
        ...data,
        // Deep merge arrays
        beneficialOwners: data.beneficialOwners 
          ? [...data.beneficialOwners]
          : [...currentApplication.beneficialOwners],
        restaurantImages: data.restaurantImages 
          ? [...data.restaurantImages]
          : [...currentApplication.restaurantImages],
        menuImages: data.menuImages 
          ? [...data.menuImages]
          : [...currentApplication.menuImages],
        cuisines: data.cuisines 
          ? [...data.cuisines]
          : [...currentApplication.cuisines],
        openingTimes: data.openingTimes 
          ? [...data.openingTimes]
          : [...currentApplication.openingTimes],
        // Deep merge nested objects
        restaurantContactInfo: {
          ...currentApplication.restaurantContactInfo,
          ...data.restaurantContactInfo
        },
        location: {
          ...currentApplication.location,
          ...data.location,
          coordinates: {
            ...currentApplication.location.coordinates,
            ...data.location?.coordinates
          }
        },
        businessDocuments: {
          ...currentApplication.businessDocuments,
          ...data.businessDocuments,
          bankDetails: {
            ...currentApplication.businessDocuments.bankDetails,
            ...data.businessDocuments?.bankDetails
          },
          taxId: {
            ...currentApplication.businessDocuments.taxId,
            ...data.businessDocuments?.taxId
          }
        }
      };
      return updatedApplication;
    });
  };

  // Auto-save to localStorage whenever application changes
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const isEditing = searchParams.has('edit');
    
    // Debounce localStorage updates
    const timeoutId = setTimeout(() => {
      if (application && (isEditing || JSON.stringify(application) !== JSON.stringify(defaultApplication))) {
      localStorage.setItem('restaurantApplication', JSON.stringify(application));
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [application]);

  const submitApplication = async (): Promise<RestaurantApplicationResponse> => {
    if (!application) {
      console.error('No application data to submit');
      showToast('Please fill in all required information before submitting.', 'error');
      return;
    }
    
    // Check if this is a new application or resubmission
    const searchParams = new URLSearchParams(window.location.search);
    const isResubmission = searchParams.has('edit');

    if (isResubmission) {
      const applicationId = searchParams.get('edit');
      if (!applicationId) {
        showToast('Invalid application ID for resubmission', 'error');
        return;
      }
      // For resubmission, use the resubmitApplication function
      return resubmitApplication(applicationId, application);
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('Authentication token not found');
      showToast('Your session has expired. Please log in again.', 'error');
      window.location.href = '/login';
      return;
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
      showToast(`Please complete all required fields: ${missingFields.join(', ')}`, 'error');
      return;
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
      console.log('ID Card Documents being submitted:', JSON.stringify(applicationInput.beneficialOwners.map(owner => owner.idCardDocuments), null, 2));

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

      console.log('Application submitted successfully:', JSON.stringify(response, null, 2));
      showToast('Application submitted successfully!', 'success');
      return response.createRestaurantOnboardingApplication;
    } catch (error) {
      console.error('Submission failed:', error instanceof Error ? error.message : 'Unknown error');
      let errorMessage = 'Failed to submit application. ';
      
      if (error instanceof Error) {
        console.error('Submission error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
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
      return null;
    }
  };

  return (
    <RestaurantApplicationContext.Provider
      value={{
        application,
        currentStep,
        setCurrentStep,
        updateApplication,
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
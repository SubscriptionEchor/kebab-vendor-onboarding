import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from './ToastContext';
import type { RestaurantApplication, RestaurantApplicationContextType, RestaurantApplicationResponse } from '../types/restaurant';
import { graphqlRequest } from '../services/api';
import { CREATE_APPLICATION } from '../services/restaurant';
import { validateApplicationSnapshot, ValidationError, formatOpeningTimes } from '../utils/validation';
import { DEFAULT_LOCATION, DEFAULT_BUSINESS_HOURS } from '../config/defaults';

const defaultApplication: RestaurantApplication = {
  beneficialOwners: [],
  companyName: '',
  restaurantName: '',
  restaurantContactInfo: {
    email: '',
    phone: '',
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
    const isNewApplication = window.location.pathname === '/restaurants/new' && !isEditing;

    try {
      // Clear saved data for new applications
      if (isNewApplication) {
        localStorage.removeItem('restaurantApplication');
        localStorage.removeItem('restaurantDocuments');
        localStorage.removeItem('cachedCuisines');
        sessionStorage.removeItem('currentStep');
        return defaultApplication;
      }

      if (isEditing) {
        const savedData = localStorage.getItem('restaurantApplication');
        return savedData ? JSON.parse(savedData) : defaultApplication;
      }
      return defaultApplication;
    } catch (error) {
      console.error('Failed to load saved application:', error);
      return defaultApplication;
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [submissionSnapshot, setSubmissionSnapshot] = useState<RestaurantApplication | null>(null);

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

  const submitApplication = async (snapshot?: RestaurantApplication): Promise<RestaurantApplicationResponse> => {
    // Always use the provided snapshot if available
    const applicationData = snapshot || application!;
    if (!application) {
      console.error('No application data to submit');
      throw new ValidationError(['Please fill in all required information before submitting.']);
    }

    console.log('[submitApplication] Using snapshot:', {
      businessDocuments: applicationData.businessDocuments,
      beneficialOwners: applicationData.beneficialOwners?.map(owner => ({
        isPrimary: owner.isPrimary,
        idCardDocuments: owner.idCardDocuments
      }))
    });
    
    // Check if this is a new application or resubmission
    const searchParams = new URLSearchParams(window.location.search);
    const isResubmission = searchParams.has('edit');

    if (isResubmission) {
      const applicationId = searchParams.get('edit');
      if (!applicationId) {
        throw new Error('Invalid application ID for resubmission');
      }
      // For resubmission, use the resubmitApplication function
      return resubmitApplication(applicationId, application);
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('Authentication token not found');
      throw new ValidationError('Session expired. Please log in again.');
    }

    try {
      // Create complete application snapshot
      const applicationSnapshot = {
        ...applicationData,
        openingTimes: formatOpeningTimes(application.openingTimes),
        beneficialOwners: applicationData.beneficialOwners.map(({ countryCode, ...owner }) => ({
          ...owner,
          name: owner.name.trim(),
          passportId: owner.passportId.trim(),
          email: owner.email.trim(),
          phone: formatPhoneNumber(owner.phone, 'DE'), // Using 'DE' here since we don't want to include countryCode
          isPrimary: owner.isPrimary,
          idCardDocuments: owner.isPrimary ? 
            applicationData.beneficialOwners.find(o => o.isPrimary)?.idCardDocuments || [] :
            []
        })),
        restaurantContactInfo: {
          email: applicationData.restaurantContactInfo.email.trim(),
          phone: formatPhoneNumber(applicationData.restaurantContactInfo.phone, 'DE')
        },
        location: {
          coordinates: {
            type: 'Point' as const,
            coordinates: [
              applicationData.location.coordinates.coordinates[0],
              applicationData.location.coordinates.coordinates[1]
            ]
          },
          address: formatAddressString(applicationData.location.address)
        },
        restaurantImages: applicationData.restaurantImages
          .map(img => typeof img === 'string' ? img : img.key)
          .filter(Boolean),
        menuImages: applicationData.menuImages
          .map(img => typeof img === 'string' ? img : img.key)
          .filter(Boolean),
        profileImage: typeof applicationData.profileImage === 'string' ? 
          applicationData.profileImage : 
          applicationData.profileImage?.key,
        businessDocuments: {
          hospitalityLicense: getDocumentKey(applicationData.businessDocuments.hospitalityLicense),
          registrationCertificate: getDocumentKey(applicationData.businessDocuments.registrationCertificate),
          taxId: {
            documentNumber: applicationData.businessDocuments.taxId?.documentNumber || 'default',
            documentUrl: getDocumentKey(applicationData.businessDocuments.taxId?.documentUrl)
          }
        }
      };

      console.log('[submitApplication] Final snapshot:', JSON.stringify({
        businessDocuments: applicationSnapshot.businessDocuments,
        beneficialOwners: applicationSnapshot.beneficialOwners?.map(owner => ({
          isPrimary: owner.isPrimary,
          idCardDocuments: owner.idCardDocuments
        }))
      }, null, 2));

      // Validate the complete snapshot
      validateApplicationSnapshot(applicationSnapshot);

      // Submit validated snapshot
      const response = await graphqlRequest<{ createRestaurantOnboardingApplication: RestaurantApplicationResponse }>(
        CREATE_APPLICATION,
        { input: applicationSnapshot },
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
      console.error('Submission failed:', error);
      
      // Rethrow ValidationErrors as is
      if (error instanceof ValidationError) {
        throw error;
      } 
      
      // Convert other errors to ValidationError
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit application. Please try again.';
      throw new ValidationError([errorMessage]);
    }
  };

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

  // Helper function to format address as a string
  function formatAddressString(address: any): string {
    if (typeof address === 'string') return address;
    
    const {
      doorNumber = '',
      street = '',
      area = '',
      city = 'Berlin',
      postalCode = '',
      country = 'Germany'
    } = address;

    return `${doorNumber},${street}, ${area}, ${city}, ${postalCode}, ${country}`
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Helper function to get document key
  function getDocumentKey(doc: string | { key: string }): string {
    if (!doc) return '';
    return typeof doc === 'string' ? doc : doc.key || '';
  }

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
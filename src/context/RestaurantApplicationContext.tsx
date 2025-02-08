import React, { createContext, useContext, useEffect } from 'react';
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
      coordinates: [13.404954, 52.520008], // Default to Berlin
    },
    address: '',
  },
  restaurantImages: [],
  menuImages: [],
  profileImage: '',
  cuisines: [],
  openingTimes: [
    { day: 'MON', times: [{ startTime: ['09:00'], endTime: ['22:00'] }], isOpen: true },
    { day: 'TUE', times: [{ startTime: ['09:00'], endTime: ['22:00'] }], isOpen: true },
    { day: 'WED', times: [{ startTime: ['09:00'], endTime: ['22:00'] }], isOpen: true },
    { day: 'THU', times: [{ startTime: ['09:00'], endTime: ['22:00'] }], isOpen: true },
    { day: 'FRI', times: [{ startTime: ['09:00'], endTime: ['22:00'] }], isOpen: true },
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
    },
  },
};

const RestaurantApplicationContext = createContext<RestaurantApplicationContextType | null>(null);

export function RestaurantApplicationProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [application, setApplication] = useLocalStorage<RestaurantApplication | null>(
    'restaurantApplication',
    defaultApplication
  );

  // Listen for beforeunload event to save data before refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (application) {
        localStorage.setItem('restaurantApplication', JSON.stringify(application));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [application]);

  const updateApplication = (data: Partial<RestaurantApplication>) => {
    console.log('Updating application with:', data);
    setApplication(prev => {
      if (!prev) {
        const newApplication = { ...defaultApplication, ...data };
        console.log('Creating new application:', newApplication);
        return newApplication;
      }

      const updatedApplication = {
        ...prev,
        ...data,
        openingTimes: Array.isArray(data.openingTimes) ? data.openingTimes : prev.openingTimes || []
      };
      console.log('Updated application state:', updatedApplication);
      return updatedApplication;
    });
  };

  const resetApplication = () => {
    console.log('Resetting application state');
    setApplication(null);
    window.localStorage.removeItem('restaurantApplication');
  };

  const submitApplication = async (): Promise<RestaurantApplicationResponse> => {
    if (!application) {
      console.error('No application data to submit');
      throw new Error('No application data to submit');
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('Authentication token not found');
      throw new Error('Authentication required');
    }

    console.log('Submitting application:', application);
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://vendor-onboarding-qa.kebapp-chefs.com',
      'Referer': 'https://vendor-onboarding-qa.kebapp-chefs.com/',
      'Priority': 'u=1, i'
    };

    // Format the application data according to the API requirements
    const input = {
      beneficialOwners: (application.beneficialOwners || []).map(owner => ({
        name: owner.name || '',
        passportId: owner.passportId || '',
        email: owner.email || '',
        phone: owner.phone || '',
        isPrimary: owner.isPrimary || false,
        idCardDocuments: Array.isArray(owner.idCardDocuments) 
          ? owner.idCardDocuments.map(doc => typeof doc === 'string' ? doc : doc.key).filter(Boolean)
          : []
      })),
      companyName: application.companyName,
      restaurantName: application.restaurantName,
      restaurantContactInfo: {
        email: application.restaurantContactInfo.email || '',
        phone: application.restaurantContactInfo.phone || ''
      },
      location: {
        coordinates: application.location.coordinates,
        address: application.location.address
      },
      restaurantImages: Array.isArray(application.restaurantImages)
        ? application.restaurantImages.map(img => typeof img === 'string' ? img : img.key).filter(Boolean)
        : [],
      menuImages: Array.isArray(application.menuImages)
        ? application.menuImages.map(img => typeof img === 'string' ? img : img.key).filter(Boolean)
        : [],
      profileImage: typeof application.profileImage === 'string' 
        ? application.profileImage 
        : application.profileImage?.key || '',
      cuisines: Array.isArray(application.cuisines) ? application.cuisines.map(cuisine => cuisine.id || cuisine).filter(Boolean) : [],
      openingTimes: Array.isArray(application.openingTimes) ? application.openingTimes.map(time => ({
        day: time.day,
        isOpen: time.isOpen,
        times: time.isOpen && time.times && time.times[0] ? [
          {
            startTime: time.times[0].startTime || [],
            endTime: time.times[0].endTime || []
          }
        ] : []
      })) : [],
      businessDocuments: {
        hospitalityLicense: typeof application.businessDocuments.hospitalityLicense === 'string'
          ? application.businessDocuments.hospitalityLicense
          : application.businessDocuments.hospitalityLicense?.key || '',
        registrationCertificate: typeof application.businessDocuments.registrationCertificate === 'string'
          ? application.businessDocuments.registrationCertificate
          : application.businessDocuments.registrationCertificate?.key || '',
        bankDetails: {
          accountNumber: application.businessDocuments.bankDetails.accountNumber,
          bankName: application.businessDocuments.bankDetails.bankName,
          branchName: application.businessDocuments.bankDetails.branchName,
          bankIdentifierCode: application.businessDocuments.bankDetails.bankIdentifierCode,
          accountHolderName: application.businessDocuments.bankDetails.accountHolderName,
          documentUrl: typeof application.businessDocuments.bankDetails.documentUrl === 'string'
            ? application.businessDocuments.bankDetails.documentUrl
            : application.businessDocuments.bankDetails.documentUrl?.key || ''
        },
        taxId: {
          documentNumber: application.businessDocuments.taxId.documentNumber,
          documentUrl: typeof application.businessDocuments.taxId.documentUrl === 'string'
            ? application.businessDocuments.taxId.documentUrl
            : application.businessDocuments.taxId.documentUrl?.key || ''
        }
      },
    };
    console.log('Formatted input for submission:', input);

    try {
      const response = await graphqlRequest<{ createRestaurantOnboardingApplication: RestaurantApplicationResponse }>(
        CREATE_APPLICATION,
        { input },
        headers
      );

      console.log('Application submitted successfully:', response);
      showToast('Application submitted successfully!', 'success');

      // Clear the stored application data after successful submission
      resetApplication();

      return response.createRestaurantOnboardingApplication;
    } catch (error) {
      console.error('Failed to submit application:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to submit application: ${error.message}`);
      }
      throw error;
    }
  };

  return (
    <RestaurantApplicationContext.Provider
      value={{
        application,
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
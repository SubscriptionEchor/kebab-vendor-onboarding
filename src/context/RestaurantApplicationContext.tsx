import React, { createContext, useContext, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { RestaurantApplication, RestaurantApplicationContextType, RestaurantApplicationResponse } from '../types/restaurant';
import { graphqlRequest } from '../services/api';

const CREATE_APPLICATION = `
  mutation CreateApplication($input: RestaurantOnboardingApplicationInput!) {
    createRestaurantOnboardingApplication(input: $input) {
      _id
      resubmissionCount
      applicationStatus
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
    { day: 'SAT', isOpen: false },
    { day: 'SUN', isOpen: false },
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
    setApplication(prev => {
      if (!prev) return { ...defaultApplication, ...data };
      return { ...prev, ...data };
    });
  };

  const resetApplication = () => {
    setApplication(null);
    window.localStorage.removeItem('restaurantApplication');
  };

  const submitApplication = async (): Promise<RestaurantApplicationResponse> => {
    if (!application) {
      throw new Error('No application data to submit');
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication required');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/json',
      'origin': 'https://vendor-onboarding-qa.kebapp-chefs.com',
      'priority': 'u=1, i',
      'referer': 'https://vendor-onboarding-qa.kebapp-chefs.com/'
    };

    // Format the application data according to the API requirements
    const input = {
      beneficialOwners: application.beneficialOwners.map(owner => ({
        name: owner.name || '',
        passportId: owner.passportId || '',
        email: owner.email || '',
        phone: owner.phone || '',
        isPrimary: owner.isPrimary || false,
        idCardDocuments: owner.idCardDocuments || []
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
      restaurantImages: application.restaurantImages.map(img => img.key || ''),
      menuImages: application.menuImages.map(img => img.key || ''),
      profileImage: application.profileImage || '',
      cuisines: application.cuisines,
      openingTimes: application.openingTimes.map(time => ({
        day: time.day,
        isOpen: time.isOpen,
        times: time.isOpen && time.times?.[0] ? [{
          startTime: [time.times[0].startTime[0] || ''],
          endTime: [time.times[0].endTime[0] || '']
        }] : []
      })),
      businessDocuments: {
        hospitalityLicense: application.businessDocuments.hospitalityLicense,
        registrationCertificate: application.businessDocuments.registrationCertificate,
        taxId: {
          documentNumber: application.businessDocuments.taxId.documentNumber || 'default',
          documentUrl: application.businessDocuments.taxId.documentUrl
        }
      }
    };

    try {
      const response = await graphqlRequest<{ createRestaurantOnboardingApplication: RestaurantApplicationResponse }>(
        CREATE_APPLICATION,
        { input },
        headers
      );

      console.log('Application submitted successfully:', response);

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
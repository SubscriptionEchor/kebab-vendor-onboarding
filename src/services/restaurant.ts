// src/services/restaurant.ts
import { graphqlRequest } from './api';
import type { 
  CreateRestaurantResponse, 
  UpdateRestaurantResponse, 
  UploadDocumentResponse,
  GetCuisinesResponse,
  GetApplicationsResponse
} from './types';

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

const GET_APPLICATIONS = `
  query VendorApplications {
    getRestaurantOnboardingApplication {
      _id
      restaurantName
      applicationStatus
      resubmissionCount
      createdAt
      statusHistory {
        status
        timestamp
        reason
      }
      location {
        address
      }
      businessDocuments {
        hospitalityLicense
        registrationCertificate
        taxId {
          documentUrl
        }
      }
    }
  }
`;

const GET_CUISINES = `
  query VendorOnboardingBootstrap {
    vendorOnboardingBootstrap {
      cuisines {
        name
      }
    }
  }
`;

const CREATE_RESTAURANT = `
  mutation CreateRestaurant($input: CreateRestaurantInput!) {
    createRestaurant(input: $input) {
      id
      name
      status
    }
  }
`;

const UPDATE_RESTAURANT = `
  mutation UpdateRestaurant($id: ID!, $input: UpdateRestaurantInput!) {
    updateRestaurant(id: $id, input: $input) {
      id
      name
      status
    }
  }
`;

const GET_PRESIGNED_URL = `
  query GetPresignedUrls($urlsRequested: [String!]!) {
    getVendorApplicationAccessiblePresignedUrls(urlsRequested: $urlsRequested)
  }
`;

const GET_APPLICATION_BY_ID = `
  query GetRestaurantOnboardingApplicationById($applicationId: String!) {
    getRestaurantOnboardingApplicationById(applicationId: $applicationId) {
      restaurantId
      profileImage
      _id
      potentialVendor
      beneficialOwners {
        name
        passportId
        email
        phone
        isPrimary
        emailVerified
        idCardDocuments
      }
      companyName
      restaurantName
      restaurantContactInfo {
        email
        phone
        emailVerified
      }
      location {
        coordinates {
          coordinates
        }
        address
      }
      restaurantImages
      menuImages
      cuisines
      openingTimes {
        day
        times {
          startTime
          endTime
        }
        isOpen
      }
      businessDocuments {
        hospitalityLicense
        registrationCertificate
        bankDetails {
          accountNumber
          bankName
          branchName
          bankIdentifierCode
          accountHolderName
          documentUrl
        }
        taxId {
          documentNumber
          documentUrl
        }
      }
    }
  }
`;

const RESUBMIT_APPLICATION = `
  mutation ResubmitRestaurantOnboardingApplication($applicationId: ID!, $input: RestaurantOnboardingApplicationInput!) {
    resubmitRestaurantOnboardingApplication(applicationId: $applicationId, input: $input) {
      _id
      resubmissionCount
      applicationStatus
      restaurantName
      createdAt
    }
  }
`;

// Other functions (createRestaurant, updateRestaurant, etc.) remain unchanged

export async function resubmitApplication(applicationId: string, input: any) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication required');
  }

  console.log('[resubmitApplication] Starting resubmission with:', {
    applicationId,
    input: {
      businessDocuments: input.businessDocuments,
      beneficialOwners: input.beneficialOwners?.map(owner => ({
        isPrimary: owner.isPrimary,
        idCardDocuments: owner.idCardDocuments
      }))
    }
  });

  // Format opening times correctly
  if (input.openingTimes) {
    input.openingTimes = formatOpeningTimes(input.openingTimes);
  }

  // Helper function to format opening times
  function formatOpeningTimes(times: any[]) {
    return times.map(time => ({
      day: time.day,
      isOpen: time.isOpen,
      times: time.isOpen && time.times?.length > 0
        ? [{
            startTime: flattenTimeValue(time.times[0].startTime),
            endTime: flattenTimeValue(time.times[0].endTime)
          }]
        : []
    }));
  }

  // Helper function to ensure we get a single-level array of strings
  function flattenTimeValue(timeValue: any): string[] {
    if (!Array.isArray(timeValue)) {
      return [timeValue];
    }
    if (timeValue.length > 0 && Array.isArray(timeValue[0])) {
      return timeValue.flat();
    }
    return timeValue;
  }

  // Ensure coordinates are properly formatted
  if (input.location?.coordinates?.coordinates) {
    const [lng, lat] = input.location.coordinates.coordinates;
    input.location.coordinates = {
      type: 'Point',
      coordinates: [lng, lat]
    };
    console.log('Formatted coordinates:', input.location.coordinates);
  }

  // Format document URLs
  if (input.businessDocuments) {
    input.businessDocuments = {
      hospitalityLicense: input.businessDocuments.hospitalityLicense || '',
      registrationCertificate: input.businessDocuments.registrationCertificate || '',
      taxId: {
        documentNumber: input.businessDocuments.taxId?.documentNumber || 'default',
        documentUrl: input.businessDocuments.taxId?.documentUrl || ''
      },
      bankDetails: {
        accountNumber: input.businessDocuments.bankDetails?.accountNumber || '',
        bankName: input.businessDocuments.bankDetails?.bankName || '',
        branchName: input.businessDocuments.bankDetails?.branchName || '',
        bankIdentifierCode: input.businessDocuments.bankDetails?.bankIdentifierCode || '',
        accountHolderName: input.businessDocuments.bankDetails?.accountHolderName || '',
        documentUrl: input.businessDocuments.bankDetails?.documentUrl || ''
      }
    };
  }

  // Format cuisines
  if (input.cuisines) {
    input.cuisines = input.cuisines.map(cuisine => 
      typeof cuisine === 'string' ? cuisine.toLowerCase() : cuisine.name.toLowerCase()
    );
  }

  // Format image arrays
  if (input.restaurantImages) {
    input.restaurantImages = input.restaurantImages
      .map(img => typeof img === 'string' ? img : img.key || '')
      .filter(Boolean);
  }

  if (input.menuImages) {
    input.menuImages = input.menuImages
      .map(img => typeof img === 'string' ? img : img.key || '')
      .filter(Boolean);
  }

  if (input.profileImage) {
    input.profileImage = typeof input.profileImage === 'string' ? input.profileImage : (input.profileImage?.key || '');
  }

  // Format phone numbers in restaurantContactInfo and remove countryCode
  if (input.restaurantContactInfo?.phone) {
    if (!input.restaurantContactInfo.phone.startsWith('+')) {
      input.restaurantContactInfo.phone = formatPhoneNumber(
        input.restaurantContactInfo.phone,
        input.restaurantContactInfo.countryCode || 'DE'
      );
    }
    delete input.restaurantContactInfo.countryCode;
  }

  // Map beneficialOwners while omitting countryCode using destructuring
  if (input.beneficialOwners) {
    input.beneficialOwners = input.beneficialOwners.map(({ countryCode, ...owner }) => ({
      ...owner,
      phone: owner.phone?.startsWith('+')
        ? owner.phone
        : formatPhoneNumber(owner.phone || '', countryCode || 'DE'),
      isPrimary: owner.isPrimary,
      idCardDocuments: (owner.idCardDocuments || [])
        .map(doc => typeof doc === 'string' ? doc : doc.key || '')
        .filter(Boolean)
    }));
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://vendor-onboarding-qa.kebapp-chefs.com',
    'Referer': 'https://vendor-onboarding-qa.kebapp-chefs.com/',
    'Priority': 'u=1'
  };

  try {
    console.log('Submitting resubmission with formatted data:', JSON.stringify({
      applicationId,
      input: {
        businessDocuments: input.businessDocuments,
        beneficialOwners: input.beneficialOwners?.map(owner => ({
          isPrimary: owner.isPrimary,
          idCardDocuments: owner.idCardDocuments
        }))
      }
    }, null, 2));

    console.log('[resubmitApplication] Final input object:', JSON.stringify(input, null, 2));

    // Validate the input before submission
    console.log('[resubmitApplication] Validating input data...');
    validateApplicationSnapshot(input);
    console.log('[resubmitApplication] Input validation passed');

    const response = await graphqlRequest(
      RESUBMIT_APPLICATION,
      { applicationId, input },
      headers
    );

    console.log('Resubmission successful:', response);
    return response.resubmitRestaurantOnboardingApplication;
  } catch (error) {
    console.error('[resubmitApplication] Failed:', error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : 'Unknown error');

    if (error instanceof ValidationError) {
      console.error('[resubmitApplication] Validation error:', error.errors);
      throw error;
    }
    throw error;
  }
}

export async function getApplicationById(applicationId: string) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication required');
  }

  console.log('[getApplicationById] Fetching application:', applicationId);

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://vendor-onboarding-qa.kebapp-chefs.com',
    'Referer': 'https://vendor-onboarding-qa.kebapp-chefs.com/',
    'Priority': 'u=1, i'
  };

  try {
    const applicationResponse = await graphqlRequest(
      GET_APPLICATION_BY_ID,
      { applicationId },
      headers
    );
    
    const applicationData = applicationResponse.getRestaurantOnboardingApplicationById;
    console.log('[getApplicationById] Application data:', applicationData);
    
    const urlsToFetch = [
      applicationData.profileImage,
      ...applicationData.restaurantImages,
      ...applicationData.menuImages,
      applicationData.businessDocuments?.hospitalityLicense,
      applicationData.businessDocuments?.registrationCertificate,
      applicationData.businessDocuments?.taxId?.documentUrl,
      ...(applicationData.beneficialOwners?.find(owner => owner.isPrimary)?.idCardDocuments || [])
    ].filter(Boolean);

    console.log('[getApplicationById] Fetching presigned URLs for:', urlsToFetch);

    const urlsResponse = await graphqlRequest(
      GET_PRESIGNED_URL,
      { urlsRequested: urlsToFetch },
      headers
    );

    const cuisinesResponse = await graphqlRequest(
      GET_CUISINES,
      {},
      headers
    );

    console.log('[getApplicationById] Fetched all data:', {
      application: applicationData,
      urls: urlsResponse,
      cuisines: cuisinesResponse
    });

    return {
      ...applicationData,
      presignedUrls: urlsResponse.getVendorApplicationAccessiblePresignedUrls,
      availableCuisines: cuisinesResponse.vendorOnboardingBootstrap.cuisines
    };
  } catch (error) {
    console.error('Failed to fetch application:', error);
    throw error;
  }
}

// Helper function to get document key
function getDocumentKey(doc: any): string {
  if (!doc) return '';
  if (typeof doc === 'string') return doc;
  if (typeof doc === 'object' && doc.key) return doc.key;
  return '';
}

// Helper function to format phone numbers
function formatPhoneNumber(phone: string, countryCode: string): string {
  if (!phone) return '';
  const cleanPhone = phone.replace(/\D/g, '');
  if (phone.startsWith('+')) return phone;
  const normalizedPhone = cleanPhone.replace(/^0+/, '');
  return `+${countryCode === 'IN' ? '91' : '49'}${normalizedPhone}`;
}


export async function getApplications(token: string) {
  if (!token) {
    throw new Error('Authentication required');
  }


  try {
    // Verify token is valid
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (Date.now() >= payload.exp * 1000) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired');
    }
  } catch (error) {
    localStorage.removeItem('authToken');
    throw new Error('Invalid token');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://vendor-onboarding-qa.kebapp-chefs.com',
    'Referer': 'https://vendor-onboarding-qa.kebapp-chefs.com/',
    'Priority': 'u=1, i'
  };

  try {
    const response = await graphqlRequest<GetApplicationsResponse>(GET_APPLICATIONS, undefined, headers);
    return response;
  } catch (error) {
    console.error('Failed to fetch applications:', error);
    if (error instanceof Error && error.message.includes('401')) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired');
    }
    throw error;
  }
}

export async function getCuisines() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication required');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://vendor-onboarding-qa.kebapp-chefs.com',
    'Referer': 'https://vendor-onboarding-qa.kebapp-chefs.com/',
    'Priority': 'u=1, i'
  };

  try {
    console.log('Fetching cuisines with token:', token);
    const response = await graphqlRequest<GetCuisinesResponse>(GET_CUISINES, {}, headers);
    console.log('Cuisine API response:', response);
    return response;
  } catch (error) {
    console.error('Failed to fetch cuisines:', error);
    throw error;
  }
}

export {
  CREATE_APPLICATION,
  GET_PRESIGNED_URL,
  GET_APPLICATIONS,
  GET_CUISINES,
  CREATE_RESTAURANT,
  UPDATE_RESTAURANT,
  GET_APPLICATION_BY_ID
};
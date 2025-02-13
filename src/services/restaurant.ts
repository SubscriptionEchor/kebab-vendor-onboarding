import { graphqlRequest } from './api';
import type { 
  CreateRestaurantResponse, 
  UpdateRestaurantResponse, 
  UploadDocumentResponse,
  GetCuisinesResponse,
  GetApplicationsResponse
} from './types';

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

const UPLOAD_DOCUMENT = `
  mutation UploadDocument($restaurantId: ID!, $type: DocumentType!, $file: Upload!) {
    uploadDocument(restaurantId: $restaurantId, type: $type, file: $file) {
      id
      url
      status
    }
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

export interface CreateRestaurantInput {
  name: string;
  email: string;
  phone: string;
  address: {
    doorNumber: string;
    street: string;
    area: string;
    city: string;
    postalCode: string;
    country: string;
    location: {
      lat: number;
      lng: number;
    };
  };
  owners: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    passportId: string;
  }>;
  bankDetails: {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    branchName: string;
    bankIdentifierCode: string;
  };
}

export async function createRestaurant(input: CreateRestaurantInput) {
  return graphqlRequest<CreateRestaurantResponse>(CREATE_RESTAURANT, { input });
}

export async function updateRestaurant(id: string, input: Partial<CreateRestaurantInput>) {
  return graphqlRequest<UpdateRestaurantResponse>(UPDATE_RESTAURANT, { id, input });
}

export async function uploadDocument(restaurantId: string, type: string, file: File) {
  return graphqlRequest<UploadDocumentResponse>(UPLOAD_DOCUMENT, {
    restaurantId,
    type,
    file
  });
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

export async function resubmitApplication(applicationId: string, input: any) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication required');
  }

  // Format opening times correctly
  if (input.openingTimes) {
    input.openingTimes = input.openingTimes.map(time => ({
      day: time.day,
      isOpen: time.isOpen,
      times: time.isOpen ? [{
        startTime: Array.isArray(time.times[0].startTime) ? time.times[0].startTime : [time.times[0].startTime],
        endTime: Array.isArray(time.times[0].endTime) ? time.times[0].endTime : [time.times[0].endTime]
      }] : []
    }));
  }

  // Ensure coordinates are properly formatted
  if (input.location?.coordinates?.coordinates) {
    // Preserve the original coordinates without modification
    const [lng, lat] = input.location.coordinates.coordinates;

    input.location.coordinates = {
      type: 'Point',
      coordinates: [lng, lat]
    };
    console.log('Formatted coordinates:', input.location.coordinates);
  }

  // Format all document URLs to ensure they're strings
  if (input.businessDocuments) {
    input.businessDocuments = {
      hospitalityLicense: getDocumentKey(input.businessDocuments.hospitalityLicense),
      registrationCertificate: getDocumentKey(input.businessDocuments.registrationCertificate),
      taxId: {
        documentNumber: input.businessDocuments.taxId?.documentNumber || 'default',
        documentUrl: getDocumentKey(input.businessDocuments.taxId?.documentUrl)
      },
      bankDetails: {
        accountNumber: input.businessDocuments.bankDetails?.accountNumber || '',
        bankName: input.businessDocuments.bankDetails?.bankName || '',
        branchName: input.businessDocuments.bankDetails?.branchName || '',
        bankIdentifierCode: input.businessDocuments.bankDetails?.bankIdentifierCode || '',
        accountHolderName: input.businessDocuments.bankDetails?.accountHolderName || '',
        documentUrl: getDocumentKey(input.businessDocuments.bankDetails?.documentUrl) || ''
      }
    };
  }

  // Ensure cuisines are properly formatted strings
  if (input.cuisines) {
    input.cuisines = input.cuisines.map(cuisine => 
      typeof cuisine === 'string' ? 
        cuisine.toLowerCase() : 
        cuisine.name.toLowerCase()
    );
  }
  // Format all image arrays to ensure they contain only string keys
  if (input.restaurantImages) {
    input.restaurantImages = input.restaurantImages
      .map(img => typeof img === 'string' ? img : img.key)
      .filter(Boolean);
  }

  if (input.menuImages) {
    input.menuImages = input.menuImages
      .map(img => typeof img === 'string' ? img : img.key)
      .filter(Boolean);
  }

  if (input.profileImage) {
    input.profileImage = typeof input.profileImage === 'string' ? 
      input.profileImage : 
      input.profileImage?.key || '';
  }

  // Format phone numbers
  if (input.restaurantContactInfo?.phone) {
    // Only format if not already formatted
    if (!input.restaurantContactInfo.phone.startsWith('+')) {
      input.restaurantContactInfo.phone = formatPhoneNumber(
        input.restaurantContactInfo.phone,
        input.restaurantContactInfo.countryCode || 'DE'
      );
    }
  }

  if (input.beneficialOwners) {
    input.beneficialOwners = input.beneficialOwners.map(owner => ({
      name: owner.name,
      passportId: owner.passportId,
      email: owner.email,
      // Only format if not already formatted
      phone: owner.phone.startsWith('+') ? owner.phone : formatPhoneNumber(owner.phone, owner.countryCode || 'DE'),
      isPrimary: owner.isPrimary,
      idCardDocuments: (owner.idCardDocuments || [])
        .map(doc => typeof doc === 'string' ? doc : doc.key)
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
    // Log the formatted data for debugging
    console.log('Submitting resubmission with formatted data:', JSON.stringify({
      coordinates: input.location?.coordinates,
      applicationId,
      input
    }, null, 2));

    const response = await graphqlRequest(
      RESUBMIT_APPLICATION,
      { applicationId, input },
      headers,
    );
    console.log('Resubmission successful:', response);
    return response.resubmitRestaurantOnboardingApplication;
  } catch (error) {
    console.error('Failed to resubmit application:', error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : 'Unknown error');
    throw error;
  }
}

export async function getApplicationById(applicationId: string) {
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
    const response = await graphqlRequest(
      GET_APPLICATION_BY_ID,
      { applicationId },
      headers
    );
    return response.getRestaurantOnboardingApplicationById;
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
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Keep the phone number as is if it already has a + prefix
  if (phone.startsWith('+')) return phone;
  
  // Format with country code
  const normalizedPhone = cleanPhone.replace(/^0+/, '');
  return `+${countryCode === 'IN' ? '91' : '49'}${normalizedPhone}`;
}
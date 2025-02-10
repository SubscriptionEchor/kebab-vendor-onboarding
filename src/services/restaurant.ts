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
    street: string;
    number: string;
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
    throw new Error('Please log in to continue');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://vendor-onboarding-qa.kebapp-chefs.com',
    'Referer': 'https://vendor-onboarding-qa.kebapp-chefs.com/',
    'Priority': 'u=1, i'
  };

  return graphqlRequest<GetCuisinesResponse>(GET_CUISINES, {}, headers);
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

  // Ensure coordinates are properly formatted
  if (input.location?.coordinates) {
    input.location.coordinates = {
      type: 'Point',
      coordinates: [
        parseFloat(input.location.coordinates.coordinates[0].toFixed(6)),
        parseFloat(input.location.coordinates.coordinates[1].toFixed(6))
      ]
    };
  }

  console.log('Resubmitting application with data:', {
    applicationId,
    input
  });

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
      RESUBMIT_APPLICATION,
      { applicationId, input },
      headers
    );
    return response.resubmitRestaurantOnboardingApplication;
  } catch (error) {
    console.error('Failed to resubmit application:', error);
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
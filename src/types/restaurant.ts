// Restaurant Application Types
export interface RestaurantApplication {
  id?: string;
  companyName: string;
  restaurantName: string;
  restaurantContactInfo: RestaurantContactInfo;
  location: RestaurantLocation;
  restaurantImages: ImageAsset[];
  menuImages: ImageAsset[];
  profileImage: ImageAsset | string;
  cuisines: string[];
  openingTimes: OpeningTime[];
  businessDocuments: BusinessDocuments;
  beneficialOwners: BeneficialOwner[];
  status?: ApplicationStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface RestaurantContactInfo {
  email: string;
  phone: string;
  countryCode: string;
  emailVerified?: boolean;
}

export interface RestaurantLocation {
  coordinates: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  address: string | RestaurantAddress;
}

export interface RestaurantAddress {
  doorNumber: string;
  street: string;
  area: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface OpeningTime {
  day: DayOfWeek;
  times: TimeSlot[];
  isOpen: boolean;
}

export interface TimeSlot {
  startTime: string[];
  endTime: string[];
}

export interface BusinessDocuments {
  hospitalityLicense: string;
  registrationCertificate: string;
  bankDetails: BankDetails;
  taxId: TaxDocument;
}

export interface BankDetails {
  accountNumber: string;
  bankName: string;
  branchName: string;
  bankIdentifierCode: string;
  accountHolderName: string;
  documentUrl: string;
}

export interface TaxDocument {
  documentNumber: string;
  documentUrl: string;
}

export interface BeneficialOwner {
  name: string;
  passportId: string;
  email: string;
  phone: string;
  countryCode?: string;
  isPrimary: boolean;
  emailVerified?: boolean;
  idCardDocuments: string[];
}

export interface ImageAsset {
  key: string;
  previewUrl: string;
}

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export type ApplicationStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REQUESTED_ONBOARDING'
  | 'REQUESTED_CHANGES';

// API Response Types
export interface GetApplicationsResponse {
  getRestaurantOnboardingApplication: Array<{
    _id: string;
    restaurantName: string;
    applicationStatus: ApplicationStatus;
    resubmissionCount: number;
    createdAt: string;
    statusHistory: Array<{
      status: string;
      timestamp: string;
      reason: string | null;
    }>;
    location: {
      address: string;
    };
    businessDocuments: {
      hospitalityLicense: string;
      registrationCertificate: string;
      taxId: {
        documentUrl: string;
      };
    };
  }>;
}

export interface RestaurantApplicationResponse {
  _id: string;
  resubmissionCount: number;
  applicationStatus: ApplicationStatus;
  restaurantName: string;
  createdAt: string;
}

export interface RestaurantApplicationContextType {
  application: RestaurantApplication | null;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  updateApplication: (data: Partial<RestaurantApplication>) => void;
  resetApplication: () => void;
  submitApplication: () => Promise<RestaurantApplicationResponse>;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationRules {
  [key: string]: (value: any) => boolean | Promise<boolean>;
}
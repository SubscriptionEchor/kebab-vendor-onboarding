// API Response Types
export interface APIResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    path: string[];
  }>;
}

// Auth Types
export interface SendPhoneOTPResponse {
  sendPhoneOtpForOnboardingVendorLogin: {
    result: boolean;
    retryAfter: number;
    message: string;
    validFor: number;
  };
}

export interface VerifyPhoneOTPResponse {
  verifyPhoneOtpForOnboardingVendorAndLogin: {
    token: string;
    isNewVendor: boolean;
    potentialVendor: {
      _id: string;
      phoneNumber: string;
      phoneIsVerified: boolean;
      emailIsVerified: boolean;
      assignedVendorId: string | null;
      createdAt: string;
    };
  };
}

export interface SendEmailOTPResponse {
  sendEmailOtpForOnboardingVendor: {
    result: boolean;
    retryAfter: number;
    message: string;
  };
}

export interface VerifyEmailOTPResponse {
  verifyEmailOtpForOnboardingVendor: {
    _id: string;
    email: string;
    emailIsVerified: boolean;
    phoneNumber: string;
    phoneIsVerified: boolean;
  };
}

// Restaurant Types
export interface CreateRestaurantResponse {
  createRestaurant: {
    id: string;
    name: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  };
}

export interface UpdateRestaurantResponse {
  updateRestaurant: {
    id: string;
    name: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  };
}

export interface UploadDocumentResponse {
  uploadDocument: {
    id: string;
    url: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  };
}
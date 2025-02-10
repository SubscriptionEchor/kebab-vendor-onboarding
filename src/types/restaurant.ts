export interface GetApplicationsResponse {
  getRestaurantOnboardingApplication: Array<{
    _id: string;
    restaurantName: string;
    applicationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUESTED_ONBOARDING' | 'REQUESTED_CHANGES';
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
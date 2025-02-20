// Restaurant Queries
export const GET_APPLICATIONS = `
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

export const GET_CUISINES = `
  query VendorOnboardingBootstrap {
    vendorOnboardingBootstrap {
      cuisines {
        name
      }
    }
  }
`;

export const GET_APPLICATION_BY_ID = `
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

export const GET_PRESIGNED_URL = `
  query GetPresignedUrls($urlsRequested: [String!]!) {
    getVendorApplicationAccessiblePresignedUrls(urlsRequested: $urlsRequested)
  }
`;
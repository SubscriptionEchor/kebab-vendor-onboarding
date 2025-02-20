// Authentication Mutations
export const SEND_PHONE_OTP = `
  mutation SendPhoneOTP($phoneNumber: String!) {
    sendPhoneOtpForOnboardingVendorLogin(phoneNumber: $phoneNumber) {
      result
      retryAfter
      message
      validFor
    }
  }
`;

export const VERIFY_PHONE_OTP = `
  mutation VerifyPhoneOTP($phoneNumber: String!, $otp: String!) {
    verifyPhoneOtpForOnboardingVendorAndLogin(phoneNumber: $phoneNumber, otp: $otp) {
      token
      isNewVendor
      potentialVendor {
        _id
        phoneNumber
        phoneIsVerified
        emailIsVerified
        assignedVendorId
        createdAt
      }
    }
  }
`;

export const SEND_EMAIL_OTP = `
  mutation SendEmailOTP($input: EmailVerificationInput!) {
    sendEmailOtpForOnboardingVendor(input: $input) {
      result
      retryAfter
      message
    }
  }
`;

export const VERIFY_EMAIL_OTP = `
  mutation VerifyEmailOTP($input: EmailVerificationInput!, $otp: String!) {
    verifyEmailOtpForOnboardingVendor(input: $input, otp: $otp) {
      _id
      email
      emailIsVerified
      phoneNumber
      phoneIsVerified
    }
  }
`;
import { graphqlRequest } from './api';
import type {
  SendPhoneOTPResponse,
  VerifyPhoneOTPResponse,
  SendEmailOTPResponse,
  VerifyEmailOTPResponse
} from './types';

const SEND_PHONE_OTP = `
  mutation SendPhoneOTP($phoneNumber: String!) {
    sendPhoneOtpForOnboardingVendorLogin(phoneNumber: $phoneNumber) {
      result
      retryAfter
      message
      validFor
    }
  }
`;

const VERIFY_PHONE_OTP = `
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

const SEND_EMAIL_OTP = `
  mutation SendEmailOTP($input: EmailVerificationInput!) {
    sendEmailOtpForOnboardingVendor(input: $input) {
      result
      retryAfter
      message
    }
  }
`;

const VERIFY_EMAIL_OTP = `
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

export async function sendPhoneOTP(phoneNumber: string) {
  return graphqlRequest<SendPhoneOTPResponse>(SEND_PHONE_OTP, { phoneNumber });
}

export async function verifyPhoneOTP(phoneNumber: string, otp: string) {
  try {
  return graphqlRequest<VerifyPhoneOTPResponse>(VERIFY_PHONE_OTP, { phoneNumber, otp });
  } catch (error) {
    console.error('Phone verification failed:', error);
    if (error instanceof Error) {
      throw new Error(error.message || 'Phone verification failed');
    }
    throw new Error('Phone verification failed. Please try again.');
  }
}

export async function sendEmailOTP(email: string) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Please log in again to verify your email');
  }

  try {
  return graphqlRequest<SendEmailOTPResponse>(
    SEND_EMAIL_OTP,
    {
      input: { email }
    },
    {
      'Authorization': `bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://vendor-onboarding-qa.kebapp-chefs.com',
      'Referer': 'https://vendor-onboarding-qa.kebapp-chefs.com/',
      'Priority': 'u=1, i'
    }
  );
  } catch (error) {
    console.error('Failed to send email:', error);
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to send verification email');
    }
    throw new Error('Failed to send verification email. Please try again.');
  }
}

export async function verifyEmailOTP(email: string, otp: string) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }

  const headers = {
    'Authorization': `bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://vendor-onboarding-qa.kebapp-chefs.com', 
    'Referer': 'https://vendor-onboarding-qa.kebapp-chefs.com/',
    'Priority': 'u=1, i'
  };

  return graphqlRequest<VerifyEmailOTPResponse>(
    VERIFY_EMAIL_OTP,
    {
      input: { email: email },
      otp
    },
    headers
  );
}
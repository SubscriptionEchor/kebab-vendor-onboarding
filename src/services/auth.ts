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
  console.log('Sending phone OTP for:', phoneNumber);
  try {
    // Ensure phone number has proper country code
    const formattedPhone = phoneNumber.startsWith('+') ? 
      phoneNumber : 
      `+${phoneNumber.replace(/^0+/, '')}`;

    return graphqlRequest<SendPhoneOTPResponse>(SEND_PHONE_OTP, { phoneNumber: formattedPhone });
  } catch (error) {
    console.error('Failed to send OTP:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to send verification code: ${error.message}`);
    }
    throw new Error('Failed to send verification code. Please try again.');
  }
}

export async function verifyPhoneOTP(phoneNumber: string, otp: string) {
  console.log('Verifying phone OTP for:', phoneNumber);
  try {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }
    
    // Clean and validate OTP
    const cleanOtp = otp.replace(/\D/g, '');
    if (!cleanOtp || cleanOtp.length !== 4) {
      throw new Error('Invalid verification code format');
    }

    return graphqlRequest<VerifyPhoneOTPResponse>(VERIFY_PHONE_OTP, { 
      phoneNumber: phoneNumber.trim(),
      otp: cleanOtp
    });
  } catch (error) {
    console.error('Phone verification failed:', error);
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        throw new Error('Session expired. Please try again.');
      } else if (error.message.includes('validation')) {
        throw new Error('Please enter a valid 4-digit verification code');
      } else if (error.message.includes('expired')) {
        throw new Error('Verification code has expired. Please request a new code');
      } else if (error.message.includes('invalid') || error.message.includes('incorrect')) {
        throw new Error('Invalid verification code. Please try again');
      }
      throw new Error(error.message || 'Invalid verification code');
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
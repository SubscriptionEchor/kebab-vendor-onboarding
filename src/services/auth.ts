import { graphqlRequest } from './api';
import { validateEmail } from '../utils/validation';
import { SEND_PHONE_OTP, VERIFY_PHONE_OTP, SEND_EMAIL_OTP, VERIFY_EMAIL_OTP } from '../graphql';
import type {
  SendPhoneOTPResponse,
  VerifyPhoneOTPResponse,
  SendEmailOTPResponse,
  VerifyEmailOTPResponse
} from './types';

export async function sendPhoneOTP(phoneNumber: string) {
  console.log('[sendPhoneOTP] Starting with phone:', phoneNumber);
  try {
    // Ensure phone number has proper country code
    const formattedPhone = phoneNumber.startsWith('+') ? 
      phoneNumber : 
      `+${phoneNumber.replace(/^0+/, '')}`;
    console.log('[sendPhoneOTP] Formatted phone:', formattedPhone);

    const response = await graphqlRequest<SendPhoneOTPResponse>(
      SEND_PHONE_OTP, 
      { phoneNumber: formattedPhone }
    );
    console.log('[sendPhoneOTP] Response:', response);
    return response;
  } catch (error) {
    console.error('[sendPhoneOTP] Failed:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to send verification code: ${error.message}`);
    }
    throw new Error('Failed to send verification code. Please try again.');
  }
}

export async function verifyPhoneOTP(phoneNumber: string, otp: string) {
  console.log('[verifyPhoneOTP] Starting verification for:', phoneNumber);
  try {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }
    
    // Clean and validate OTP
    const cleanOtp = otp.replace(/\D/g, '');
    console.log('[verifyPhoneOTP] Cleaned OTP:', cleanOtp);
    if (!cleanOtp || cleanOtp.length !== 4) {
      throw new Error('Invalid verification code format');
    }

    const response = await graphqlRequest<VerifyPhoneOTPResponse>(VERIFY_PHONE_OTP, { 
      phoneNumber: phoneNumber.trim(),
      otp: cleanOtp
    });
    console.log('[verifyPhoneOTP] Response:', {
      token: response.verifyPhoneOtpForOnboardingVendorAndLogin.token ? 'present' : 'missing',
      isNewVendor: response.verifyPhoneOtpForOnboardingVendorAndLogin.isNewVendor
    });
    return response;
  } catch (error) {
    console.error('[verifyPhoneOTP] Failed:', error);
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

  // Validate email format before sending request
  if (!validateEmail(email)) {
    throw new Error('Please enter a valid email address');
  }

  try {
    const response = await graphqlRequest<SendEmailOTPResponse>(
      SEND_EMAIL_OTP,
      {
        input: { email: email.trim().toLowerCase() }
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

    if (!response.sendEmailOtpForOnboardingVendor.result) {
      throw new Error(response.sendEmailOtpForOnboardingVendor.message || 'Failed to send verification code');
    }

    return response;
  } catch (error) {
    console.error('Failed to send email:', error);
    if (error instanceof Error) {
      // Handle specific error codes
      if (error.message === 'EMAIL_ALREADY_REGISTERED' || error.message.includes('already registered')) {
        throw new Error('Email already exists, please try with a new email');
      }
      
      // Handle validation errors
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        throw new Error('Please enter a valid email address');
      }
      
      // Handle other known errors
      if (error.message.includes('log in') || error.message.includes('token')) {
        throw new Error('Please log in again to continue');
      }
      
      // Pass through the original error message
      throw error;
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
const API_URL = 'https://del-qa-api.kebapp-chefs.com/graphql';

interface SendOTPResponse {
  sendPhoneOtpForOnboardingVendorLogin: {
    result: boolean;
    retryAfter: number;
    message: string;
    validFor: number;
  };
}

export async function sendPhoneOTP(phoneNumber: string): Promise<SendOTPResponse> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    body: JSON.stringify({
      operationName: 'SendPhoneOTP',
      variables: { phoneNumber },
      query: `mutation SendPhoneOTP($phoneNumber: String!) {
        sendPhoneOtpForOnboardingVendorLogin(phoneNumber: $phoneNumber) {
          result
          retryAfter
          message
          validFor
        }
      }`
    })
  });

  if (!response.ok) {
    throw new Error('Failed to send OTP');
  }

  const data = await response.json();
  return data;
}
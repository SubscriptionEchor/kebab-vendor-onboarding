export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  // Basic phone validation - can be made more strict based on requirements
  const phoneRegex = /^\d{6,15}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

export function validateOTP(otp: string[]): boolean {
  return otp.every(digit => /^\d$/.test(digit)) && otp.length === 6;
}
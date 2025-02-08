// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// Phone number validation
export function validatePhone(phone: string): boolean {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if the number has valid length
  // Indian numbers: 10 digits
  // German numbers: 10-11 digits
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

// OTP validation
export function validateOTP(otp: string[]): boolean {
  return otp.every(digit => /^\d$/.test(digit)) && otp.length === 6;
}

// Restaurant name validation
export function validateRestaurantName(name: string): boolean {
  return name.length >= 3 && name.length <= 50;
}

// Company name validation
export function validateCompanyName(name: string): boolean {
  return name.length >= 3 && name.length <= 100;
}

// Address validation
export function validateAddress(address: string): boolean {
  return address.length >= 5 && address.length <= 200;
}

// Bank account validation
export function validateBankAccount(account: string): boolean {
  return /^[A-Z0-9]{8,34}$/.test(account);
}

// BIC/SWIFT code validation
export function validateBIC(bic: string): boolean {
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic);
}

// Document validation
export function validateDocument(document: string): boolean {
  return document?.length > 0;
}

// Opening hours validation
export function validateOpeningHours(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

// Passport ID validation
export function validatePassportId(id: string): boolean {
  return id.length >= 5 && id.length <= 20;
}

// Tax ID validation
export function validateTaxId(id: string): boolean {
  return id.length >= 5 && id.length <= 30;
}

// Cuisine validation
export function validateCuisines(cuisines: string[]): boolean {
  return cuisines.length >= 1 && cuisines.length <= 3;
}

// Image validation
export function validateImage(image: string): boolean {
  return image.length > 0;
}

// Location validation
export function validateLocation(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
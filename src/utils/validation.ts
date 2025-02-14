// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// Phone validation
export function validatePhone(phone: string): boolean {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  return /^[0-9]{10,11}$/.test(cleanPhone);
}

// Name validation
export function validateName(name: string): boolean {
  // Only allow letters and spaces
  return /^[A-Za-z\s]+$/.test(name);
}

// First name validation
export function validateFirstName(name: string): boolean {
  // Only allow letters, no spaces or special characters
  return /^[A-Za-z]+$/.test(name);
}

// Last name validation
export function validateLastName(name: string): boolean {
  // Only allow letters, no spaces or special characters
  return /^[A-Za-z]+$/.test(name);
}

// German postal code validation
export function validateGermanPostalCode(postalCode: string): boolean {
  return /^[0-9]{5}$/.test(postalCode);
}

// German phone number validation
export function validateGermanPhone(phone: string): boolean {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // German mobile numbers should start with 15, 16, or 17 and be 10-11 digits
  return /^(15|16|17)\d{7,8}$/.test(cleanPhone);
}

// Indian phone number validation
export function validateIndianPhone(phone: string): boolean {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Indian mobile numbers should start with 6, 7, 8, or 9 and be exactly 10 digits
  return /^[6-9]\d{9}$/.test(cleanPhone);
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
  // Format: One uppercase letter followed by exactly 8 digits
  return /^[A-Z]\d{8}$/.test(id);
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

// Area validation
export function validateArea(area: string): { isValid: boolean; message?: string } {
  // Don't show error for empty value - let HTML5 validation handle required state
  if (!area) {
    return { isValid: true };
  }

  // Check for minimum length
  if (area.length < 3) {
    return {
      isValid: false,
      message: 'Area must be at least 3 characters long'
    };
  }

  // Check for maximum length
  if (area.length > 50) {
    return {
      isValid: false,
      message: 'Area cannot exceed 50 characters'
    };
  }

  // Check for valid characters (letters, numbers, spaces, hyphens, and periods)
  if (!/^[A-Za-z0-9\s\-\.]+$/.test(area)) {
    return {
      isValid: false,
      message: 'Only letters, numbers, spaces, hyphens (-) and periods (.) are allowed'
    };
  }

  // Check for consecutive special characters
  if (/[-]{2,}|[\.]{2,}/.test(area)) {
    return {
      isValid: false,
      message: 'Cannot use consecutive hyphens or periods'
    };
  }

  // Check if it starts or ends with a special character
  if (/^[-\.]|[-\.]$/.test(area)) {
    return {
      isValid: false,
      message: 'Cannot start or end with a hyphen or period'
    };
  }

  return { isValid: true };
}

// Helper function to format opening times consistently
export function formatOpeningTimes(times: any[]) {
  return times.map(time => ({
    day: time.day,
    isOpen: time.isOpen,
    times: time.isOpen && time.times?.length > 0 ? [{
      startTime: Array.isArray(time.times[0].startTime) ? 
        time.times[0].startTime : 
        [time.times[0].startTime],
      endTime: Array.isArray(time.times[0].endTime) ? 
        time.times[0].endTime : 
        [time.times[0].endTime]
    }] : []
  }));
}

export class ValidationError extends Error {
  constructor(public errors: string[] | string) {
    super(Array.isArray(errors) ? errors.join(', ') : errors);
    this.name = 'ValidationError';
    this.errors = Array.isArray(errors) ? errors : [errors];
  }
}

export function validateApplicationSnapshot(snapshot: any) {
  console.log('[validateApplicationSnapshot] Starting validation with snapshot:', {
    businessDocuments: snapshot.businessDocuments,
    beneficialOwners: snapshot.beneficialOwners?.map(owner => {
      const { isPrimary, idCardDocuments } = owner;
      return {
        isPrimary,
        idCardDocuments: Array.isArray(idCardDocuments) ? idCardDocuments : []
      };
    })
  });

  const errors: string[] = [];

  // Helper function to check if a document key is valid
  const isValidDocument = (doc: any): boolean => {
    console.log('[validateApplicationSnapshot] Checking document:', doc);
    return doc && doc.length > 0;
  };

  // Validate business documents
  const docs = snapshot.businessDocuments || {};
  
  console.log('[validateApplicationSnapshot] Validating hospitalityLicense:', docs.hospitalityLicense);
  if (!isValidDocument(docs.hospitalityLicense)) {
    errors.push('Please upload a valid hospitality license');
  }

  console.log('[validateApplicationSnapshot] Validating registrationCertificate:', docs.registrationCertificate);
  if (!isValidDocument(docs.registrationCertificate)) {
    errors.push('Please upload a valid registration certificate');
  }

  console.log('[validateApplicationSnapshot] Validating taxDocument:', docs.taxId?.documentUrl);
  if (!isValidDocument(docs.taxId?.documentUrl)) {
    errors.push('Please upload a valid tax document');
  }

  // Validate ID cards
  const primaryOwner = snapshot.beneficialOwners?.find(owner => owner.isPrimary);
  const idCards = Array.isArray(primaryOwner?.idCardDocuments) ? 
    primaryOwner.idCardDocuments.filter(Boolean) : 
    [];
  
  console.log('[validateApplicationSnapshot] Validating ID cards:', {
    primaryOwner: primaryOwner ? { isPrimary: primaryOwner.isPrimary } : null,
    idCards
  });

  if (idCards.length < 2) {
    errors.push('Please upload both front and back sides of your ID card');
  }

  if (errors.length > 0) {
    console.error('[validateApplicationSnapshot] Validation failed with errors:', errors);
    throw new ValidationError(errors);
  }

  console.log('[validateApplicationSnapshot] Validation passed successfully');
  return true;
}
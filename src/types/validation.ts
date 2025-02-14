// Validation Types
export interface ValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | Promise<boolean>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Form Validation Types
export interface FormValidation<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
}

export interface FormField<T = any> {
  name: string;
  value: T;
  onChange: (value: T) => void;
  onBlur: () => void;
  error?: string;
  touched: boolean;
}

// Phone Validation Types
export interface PhoneValidationOptions {
  country: string;
  type?: 'MOBILE' | 'FIXED_LINE' | 'ANY';
}

// Address Validation Types
export interface AddressValidationOptions {
  country: string;
  requirePostalCode?: boolean;
  requireStreetNumber?: boolean;
}

// Document Validation Types
export interface DocumentValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
  required?: boolean;
}
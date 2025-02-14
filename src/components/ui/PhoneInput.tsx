import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { validatePhone } from '../../utils/validation';
import { ErrorAlert } from './ErrorAlert';

interface PhoneInputProps {
  label?: string;
  value: string;
  onPhoneChange: (phone: string) => void;
  required?: boolean;
  error?: string;
  className?: string;
}

const COUNTRY_INFO = {
  code: 'DE',
  name: 'Germany',
  dialCode: '+49',
  flag: '\uD83C\uDDE9\uD83C\uDDEA'  // Unicode for German flag emoji
};

export default function PhoneInput({
  label,
  value,
  onPhoneChange,
  required,
  error,
  className = '',
}: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart || 0;
    const inputValue = e.target.value;
    
    // Remove any existing country code prefix
    const cleanValue = inputValue.replace(/^\+\d{2}/, '');
    
    // Check for invalid characters
    if (/[a-zA-Z]/.test(cleanValue)) {
      setValidationError('Only numbers allowed');
      return;
    }
    
    if (/[^0-9\s]/.test(cleanValue)) {
      setValidationError('Only numbers allowed');
      return;
    }
    
    // Allow only digits and spaces
    const newValue = cleanValue.replace(/[^\d\s]/g, '');
    
    // Validate the phone number
    setIsValid(validatePhone(newValue));
    setValidationError(null);
    
    // Update the input value
    onPhoneChange(newValue);
    
    // Restore cursor position on next tick
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = cursorPosition;
        inputRef.current.selectionEnd = cursorPosition;
      }
    }, 0);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative flex">
        <button
          type="button"
          className="flex items-center gap-1 px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-700 min-w-[90px] justify-center cursor-default"
          aria-label="Country code"
        >
          <span className="text-lg">{COUNTRY_INFO.flag}</span>
          <span className="hidden sm:inline">{COUNTRY_INFO.dialCode}</span>
        </button>
        <input
          type="tel"
          value={value}
          ref={inputRef}
          className={`block flex-1 rounded-r-lg border ${
            !isValid && value ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' :
            'border-gray-300 focus:border-brand-primary focus:ring-brand-primary'
          } px-3 py-2 text-gray-900 placeholder:text-gray-400 sm:text-sm ${className}`}
          onChange={handlePhoneChange}
          placeholder="e.g., 151 1234 5678"
          required={required}
          aria-invalid={!isValid && value.length > 0}
          aria-describedby={error ? 'phone-error' : undefined}
        />
      </div>
      {validationError && (
        <p className="mt-1 text-sm text-red-500">{validationError}</p>
      )}
      {error && (
        <p id="phone-error" className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { validatePhone } from '../../utils/validation';
import { ErrorAlert } from './ErrorAlert';

interface PhoneInputProps {
  label?: string;
  value: string;
  countryCode: string;
  onPhoneChange: (phone: string, countryCode: string) => void;
  required?: boolean;
  error?: string;
  className?: string;
}

const countries = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' }
];

export default function PhoneInput({
  label,
  value,
  countryCode,
  onPhoneChange,
  required,
  error,
  className = '',
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const selectedCountry = countries.find(c => c.code === countryCode) || countries[0];
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setIsValid(validatePhone(newValue, countryCode));
    setValidationError(null);
    
    // Update the input value
    onPhoneChange(newValue, countryCode);
    
    // Restore cursor position on next tick
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = cursorPosition;
        inputRef.current.selectionEnd = cursorPosition;
      }
    }, 0);
  };

  const handleCountrySelect = (country: typeof countries[0]) => {
    // Clear the phone number when switching countries
    onPhoneChange('', country.code);
    setIsOpen(false);
    // Focus the input after country selection
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isOpen) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }
      
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = countries.findIndex(c => c.code === countryCode);
        const nextIndex = e.key === 'ArrowDown' 
          ? (currentIndex + 1) % countries.length
          : (currentIndex - 1 + countries.length) % countries.length;
        handleCountrySelect(countries[nextIndex]);
      }
    }
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
          ref={dropdownRef}
          type="button"
          className="flex items-center gap-1 px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-700 hover:bg-gray-100 min-w-[90px] justify-center"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              // Focus input when opening dropdown
              inputRef.current?.focus();
            }
          }}
          onKeyDown={handleKeyDown}
          aria-label="Select country"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span>{selectedCountry.flag}</span>
          <span className="hidden sm:inline">{selectedCountry.dialCode}</span>
          <ChevronDown className="w-4 h-4" />
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
          onKeyDown={handleKeyDown}
          placeholder={countryCode === 'IN' ? 
            "e.g., 98765 43210" : 
            "e.g., 151 1234 5678"}
          required={required}
          aria-invalid={!isValid && value.length > 0}
          aria-describedby={error ? 'phone-error' : undefined}
        />
        
        {/* Dropdown */}
        {isOpen && (
          <div 
            className="absolute top-full left-0 mt-1 w-64 max-h-60 overflow-auto z-50 bg-white border border-gray-200 rounded-lg shadow-lg"
            role="listbox"
            aria-label="Select country"
          >
            {countries.map((country) => (
              <button
                key={country.code}
                type="button"
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
                  country.code === countryCode ? 'bg-gray-50' : ''
                }`}
                onClick={() => handleCountrySelect(country)}
                role="option"
                aria-selected={country.code === countryCode}
              >
                <span>{country.flag}</span>
                <span>{country.name}</span>
                <span className="text-gray-500 ml-auto">{country.dialCode}</span>
              </button>
            ))}
          </div>
        )}
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
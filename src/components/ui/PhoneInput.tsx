import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

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
  const selectedCountry = countries.find(c => c.code === countryCode) || countries[0];

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
          className="flex items-center gap-1 px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-700 hover:bg-gray-100"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{selectedCountry.flag}</span>
          <span className="hidden sm:inline">{selectedCountry.dialCode}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
        <input
          type="tel"
          value={value}
          className={`block flex-1 rounded-r-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-brand-primary focus:ring-brand-primary sm:text-sm ${className}`}
          onChange={(e) => onPhoneChange(e.target.value, countryCode)}
          placeholder="Enter phone number"
          required={required}
        />
        
        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 max-h-60 overflow-auto z-50 bg-white border border-gray-200 rounded-lg shadow-lg">
            {countries.map((country) => (
              <button
                key={country.code}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                onClick={() => {
                  onPhoneChange(value, country.code);
                  setIsOpen(false);
                }}
              >
                <span>{country.flag}</span>
                <span>{country.name}</span>
                <span className="text-gray-500 ml-auto">{country.dialCode}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
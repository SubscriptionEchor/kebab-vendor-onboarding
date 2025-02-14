import { Input } from '../../../../components/ui/Input';
import { RequiredLabel } from '../RestaurantInfoStep';
import PhoneInput from '../../../../components/ui/PhoneInput';
import { useState } from 'react';
import { ErrorAlert } from '../../../../components/ui/ErrorAlert';
import { validateFirstName, validateLastName, validateEmail, validatePassportId } from '../../../../utils/validation';

interface ContactInformationProps {
  formData: {
    ownerName: string;
    passportId: string;
    email: string;
    phone: string;
    countryCode: string;
  };
  setFormData: (data: any) => void;
  setValidationErrors: (errors: string[]) => void;
}

export function ContactInformation({ formData, setFormData, setValidationErrors }: ContactInformationProps) {
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passportError, setPassportError] = useState<string | null>(null);
  const [showEmailError, setShowEmailError] = useState(false);

  const handlePassportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase(); // Convert to uppercase
    
    // Clear previous error
    setPassportError(null);
    
    // Check format while typing
    if (value && !/^[A-Z]?\d*$/.test(value)) {
      setPassportError('Must start with a letter followed by numbers only');
      return;
    }
    
    // Update the value
    setFormData({ ...formData, passportId: value });
    
    // Validate complete passport ID
    if (value && !validatePassportId(value)) {
      setPassportError('Format: 1 letter followed by 8 numbers (e.g., A12345678)');
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({ ...formData, email });

    // Clear previous error
    setEmailError(null);
    setShowEmailError(false);

    // Don't validate empty email (let HTML5 validation handle required state)
    if (!email) return;

    // Check for valid email format
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      setShowEmailError(true);
      return;
    }

    // Check for business domain
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && !domain.includes('.')) {
      setEmailError('Please enter a valid email domain');
      setShowEmailError(true);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <RequiredLabel>First Name</RequiredLabel>
          <Input
            pattern="[A-Za-z]+"
            value={formData.ownerName.split(' ')[0] || ''}
            onChange={(e) => { 
              const value = e.target.value;
              if (/[^A-Za-z]/.test(value)) {
                setFirstNameError('Only letters (A-Z, a-z) are allowed');
                return;
              }
              setFirstNameError(null);
              const lastName = formData.ownerName.split(' ').slice(1).join(' ');
              if (validateFirstName(value)) {
                setFormData({ ...formData, ownerName: `${value} ${lastName}`.trim() });
              }
            }}
            placeholder="Enter your first name"
            className="h-11"
            title="Only letters allowed (A-Z, a-z)"
            error={firstNameError}
          />
        </div>
        <div>
          <RequiredLabel>Last Name</RequiredLabel>
          <Input
            pattern="[A-Za-z]+"
            value={formData.ownerName.split(' ').slice(1).join(' ')}
            onChange={(e) => {
              const value = e.target.value;
              if (/[^A-Za-z]/.test(value)) {
                setLastNameError('Only letters (A-Z, a-z) are allowed');
                return;
              }
              setLastNameError(null);
              const firstName = formData.ownerName.split(' ')[0] || '';
              if (validateLastName(value)) {
                setFormData({ ...formData, ownerName: `${firstName} ${value}`.trim() });
              }
            }}
            placeholder="Enter your last name"
            className="h-11"
            title="Only letters allowed (A-Z, a-z)"
            error={lastNameError}
          />
        </div>
        <div>
          <RequiredLabel>Email</RequiredLabel>
          <div className="space-y-2">
          <Input
            type="email"
            value={formData.email}
            onChange={handleEmailChange}
            onBlur={(e) => {
              if (!e.target.value) return;
              if (!validateEmail(e.target.value)) {
                setEmailError('Invalid email format');
                setShowEmailError(true);
              }
            }}
            placeholder="Enter your business email"
            className="h-11"
            error={showEmailError ? emailError : undefined}
          />
          </div>
        </div>
        <div>
          <RequiredLabel>Phone Number</RequiredLabel>
          <PhoneInput
            value={formData.phone}
            countryCode={formData.countryCode}
            onPhoneChange={(phone, country) => 
              setFormData({ ...formData, phone, countryCode: country })
            }
            className="h-11"
          />
        </div>
        <div>
          <RequiredLabel>Passport ID</RequiredLabel>
          <Input
            maxLength={9}
            pattern="[A-Z]\d{8}"
            value={formData.passportId}
            onChange={handlePassportChange}
            placeholder="e.g., A12345678"
            className="h-11"
            error={passportError}
            title="One letter followed by 8 numbers"
          />
        </div>
      </div>
    </div>
  );
}
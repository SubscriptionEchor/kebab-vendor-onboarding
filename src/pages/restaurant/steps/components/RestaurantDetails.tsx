import { Input } from '../../../../components/ui/Input';
import { RequiredLabel } from '../RestaurantInfoStep';
import PhoneInput from '../../../../components/ui/PhoneInput';
import { useState } from 'react';
import { validateEmail } from '../../../../utils/validation';

interface RestaurantDetailsProps {
  formData: {
    restaurantName: string;
    restaurantEmail: string;
    restaurantPhone: string;
    restaurantCountryCode: string;
  };
  setFormData: (data: any) => void;
}

export function RestaurantDetails({ formData, setFormData }: RestaurantDetailsProps) {
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showEmailError, setShowEmailError] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({ ...formData, restaurantEmail: email });

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
      <h2 className="text-xl font-semibold text-gray-900">Restaurant Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <RequiredLabel>Restaurant Name</RequiredLabel>
          <Input
            value={formData.restaurantName}
            onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
            placeholder="Enter restaurant name"
            className="h-11"
            required
          />
        </div>
        <div>
          <RequiredLabel>Restaurant Email</RequiredLabel>
          <Input
            type="email"
            value={formData.restaurantEmail}
            onChange={handleEmailChange}
            onBlur={(e) => {
              if (!e.target.value) return;
              if (!validateEmail(e.target.value)) {
                setEmailError('Invalid email format');
                setShowEmailError(true);
              }
            }}
            placeholder="Enter restaurant email"
            className="h-11"
            error={showEmailError ? emailError : undefined}
            required
          />
        </div>
        <div className="md:col-span-2">
          <RequiredLabel>Restaurant Phone</RequiredLabel>
          <PhoneInput
            value={formData.restaurantPhone}
            countryCode={formData.restaurantCountryCode}
            onPhoneChange={(phone, country) => 
              setFormData({ ...formData, restaurantPhone: phone, restaurantCountryCode: country })
            }
            className="h-11"
          />
        </div>
      </div>
    </div>
  );
}
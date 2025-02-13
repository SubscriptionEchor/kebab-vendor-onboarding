import { Input } from '../../../../components/ui/Input';
import { RequiredLabel } from '../RestaurantInfoStep';
import PhoneInput from '../../../../components/ui/PhoneInput';

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
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <RequiredLabel>First Name</RequiredLabel>
          <Input
            value={formData.ownerName.split(' ')[0] || ''}
            onChange={(e) => {
              const lastName = formData.ownerName.split(' ').slice(1).join(' ');
              setFormData({ ...formData, ownerName: `${e.target.value} ${lastName}`.trim() });
            }}
            placeholder="Enter your first name"
            className="h-11"
          />
        </div>
        <div>
          <RequiredLabel>Last Name</RequiredLabel>
          <Input
            value={formData.ownerName.split(' ').slice(1).join(' ')}
            onChange={(e) => {
              const firstName = formData.ownerName.split(' ')[0] || '';
              setFormData({ ...formData, ownerName: `${firstName} ${e.target.value}`.trim() });
            }}
            placeholder="Enter your last name"
            className="h-11"
          />
        </div>
        <div>
          <RequiredLabel>Email</RequiredLabel>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter your business email"
            className="h-11"
          />
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
            value={formData.passportId}
            onChange={(e) => setFormData({ ...formData, passportId: e.target.value })}
            placeholder="Enter your passport number"
            className="h-11"
          />
        </div>
      </div>
    </div>
  );
}
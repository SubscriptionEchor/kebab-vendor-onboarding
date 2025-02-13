import { Input } from '../../../../components/ui/Input';
import { RequiredLabel } from '../RestaurantInfoStep';
import PhoneInput from '../../../../components/ui/PhoneInput';

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
            onChange={(e) => setFormData({ ...formData, restaurantEmail: e.target.value })}
            placeholder="Enter restaurant email"
            className="h-11"
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
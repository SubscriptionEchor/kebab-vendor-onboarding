import { Input } from '../../../../components/ui/Input';
import { RequiredLabel } from '../RestaurantInfoStep';

interface CompanyDetailsProps {
  formData: {
    companyName: string;
  };
  setFormData: (data: any) => void;
}

export function CompanyDetails({ formData, setFormData }: CompanyDetailsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Company Details</h2>
      <div>
        <div>
          <RequiredLabel>Company Name</RequiredLabel>
          <Input
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder="Enter company name"
            className="h-11"
            required
          />
        </div>
      </div>
    </div>
  );
}
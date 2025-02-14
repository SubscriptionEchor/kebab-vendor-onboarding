import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import PhoneInput from '../../../../components/ui/PhoneInput';
import { RequiredLabel } from '../RestaurantInfoStep';

import { validateFirstName, validateLastName, validatePassportId } from '../../../../utils/validation';

interface BusinessOwnershipProps {
  formData: {
    ownerName: string;
    passportId: string;
    email: string;
    phone: string;
    countryCode: string;
    hasMultipleOwners: boolean;
  };
  setFormData: (data: any) => void;
  additionalOwners: any[];
  setAdditionalOwners: (owners: any[]) => void;
}

export function BusinessOwnership({
  formData,
  setFormData,
  additionalOwners,
  setAdditionalOwners
}: BusinessOwnershipProps) {
  const [ownerErrors, setOwnerErrors] = useState<Record<string, { firstName?: string; lastName?: string; passportId?: string }>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const addOwner = () => {
    if (additionalOwners.length >= 6) return; // Maximum 7 owners (primary + 6 additional)

    setAdditionalOwners([
      ...additionalOwners,
      {
        id: crypto.randomUUID(),
        firstName: '',
        lastName: '',
        passportId: '',
        email: '',
        phone: '',
        countryCode: 'DE',
      },
    ]);
  };

  const removeOwner = (id: string) => {
    setAdditionalOwners(additionalOwners.filter(owner => owner.id !== id));
  };

  const updateOwner = (id: string, field: string, value: string) => {
    setAdditionalOwners(owners =>
      owners.map(owner =>
        owner.id === id ? { ...owner, [field]: value } : owner
      )
    );
  };

  const handlePassportChange = (id: string, value: string) => {
    const upperValue = value.toUpperCase();
    
    // Clear previous error
    setOwnerErrors(prev => ({
      ...prev,
      [id]: { ...prev[id], passportId: undefined }
    }));
    
    // Check format while typing
    if (upperValue && !/^[A-Z]?\d*$/.test(upperValue)) {
      setOwnerErrors(prev => ({
        ...prev,
        [id]: { ...prev[id], passportId: 'Must start with a letter followed by numbers only' }
      }));
      return;
    }
    
    // Update the value
    updateOwner(id, 'passportId', upperValue);
    
    // Validate complete passport ID
    if (upperValue && !validatePassportId(upperValue)) {
      setOwnerErrors(prev => ({
        ...prev,
        [id]: { ...prev[id], passportId: 'Format: 1 letter followed by 8 numbers (e.g., A12345678)' }
      }));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Business Ownership</h2>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-700">Does this business have more than one Ultimate Beneficial Owner?</p>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="hasMultipleOwners"
                checked={!formData.hasMultipleOwners}
                onChange={() => {
                  setFormData({ ...formData, hasMultipleOwners: false });
                  setAdditionalOwners([]);
                }}
                className="text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm">No</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="hasMultipleOwners"
                checked={formData.hasMultipleOwners}
                onChange={() => setFormData({ ...formData, hasMultipleOwners: true })}
                className="text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm">Yes</span>
            </label>
          </div>
        </div>

        {formData.hasMultipleOwners && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6"
          >
            {additionalOwners.map((owner, index) => (
              <motion.div
                key={owner.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6 border border-gray-200 rounded-lg space-y-4 relative"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Additional Owner {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeOwner(owner.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <RequiredLabel>First Name</RequiredLabel>
                    <Input
                      pattern="[A-Za-z]+"
                      value={owner.firstName}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/[^A-Za-z]/.test(value)) {
                          setValidationErrors(prev => [...prev, 'Only letters are allowed in first name']);
                          setOwnerErrors(prev => ({ ...prev, [owner.id]: { ...prev[owner.id], firstName: 'Only letters allowed' } }));
                          return;
                        }
                        setOwnerErrors(prev => ({
                          ...prev,
                          [owner.id]: { ...prev[owner.id], firstName: undefined }
                        }));
                        if (validateFirstName(value)) {
                          updateOwner(owner.id, 'firstName', value);
                        }
                      }}
                      placeholder="Enter first name"
                      className="h-11"
                      required
                      title="Only letters allowed (A-Z, a-z)"
                      error={ownerErrors[owner.id]?.firstName}
                    />
                  </div>
                  <div>
                    <RequiredLabel>Last Name</RequiredLabel>
                    <Input
                      pattern="[A-Za-z]+"
                      value={owner.lastName}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/[^A-Za-z]/.test(value)) {
                          setValidationErrors(prev => [...prev, 'Only letters are allowed in last name']);
                          setOwnerErrors(prev => ({ ...prev, [owner.id]: { ...prev[owner.id], lastName: 'Only letters allowed' } }));
                          return;
                        }
                        setOwnerErrors(prev => ({
                          ...prev,
                          [owner.id]: { ...prev[owner.id], lastName: undefined }
                        }));
                        if (validateLastName(value)) {
                          updateOwner(owner.id, 'lastName', value);
                        }
                      }}
                      placeholder="Enter last name"
                      className="h-11"
                      required
                      title="Only letters allowed (A-Z, a-z)"
                      error={ownerErrors[owner.id]?.lastName}
                    />
                  </div>
                  <div>
                    <RequiredLabel>Passport ID</RequiredLabel>
                    <Input
                      maxLength={9}
                      pattern="[A-Z]\d{8}"
                      value={owner.passportId}
                      onChange={(e) => handlePassportChange(owner.id, e.target.value)}
                      placeholder="e.g., A12345678"
                      className="h-11"
                      required
                      error={ownerErrors[owner.id]?.passportId}
                      title="One letter followed by 8 numbers"
                    />
                  </div>
                  <div>
                    <RequiredLabel>Email</RequiredLabel>
                    <Input
                      type="email"
                      value={owner.email}
                      onChange={(e) => updateOwner(owner.id, 'email', e.target.value)}
                      placeholder="Enter email address"
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <RequiredLabel>Phone Number</RequiredLabel>
                    <PhoneInput
                      value={owner.phone}
                      countryCode={owner.countryCode}
                      onPhoneChange={(phone, country) => {
                        updateOwner(owner.id, 'phone', phone);
                        updateOwner(owner.id, 'countryCode', country);
                      }}
                      className="h-11"
                    />
                  </div>
                </div>
              </motion.div>
            ))}

            {additionalOwners.length < 6 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOwner}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Owner
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
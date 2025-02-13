import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import PhoneInput from '../../../../components/ui/PhoneInput';
import { RequiredLabel } from '../RestaurantInfoStep';

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
                      value={owner.firstName}
                      onChange={(e) => updateOwner(owner.id, 'firstName', e.target.value)}
                      placeholder="Enter first name"
                      className="h-11"
                      required
                    />
                  </div>
                  <div>
                    <RequiredLabel>Last Name</RequiredLabel>
                    <Input
                      value={owner.lastName}
                      onChange={(e) => updateOwner(owner.id, 'lastName', e.target.value)}
                      placeholder="Enter last name"
                      className="h-11"
                      required
                    />
                  </div>
                  <div>
                    <RequiredLabel>Passport ID</RequiredLabel>
                    <Input
                      value={owner.passportId}
                      onChange={(e) => updateOwner(owner.id, 'passportId', e.target.value)}
                      placeholder="Enter passport number"
                      className="h-11"
                      required
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
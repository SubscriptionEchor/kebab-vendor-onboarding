import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { Asterisk, Plus, X, MapPin, Search, AlertCircle } from 'lucide-react';
import PhoneInput from '../../../components/ui/PhoneInput';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import L from 'leaflet';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Berlin boundaries (approximate)
const BERLIN_BOUNDS = {
  north: 52.6755,
  south: 52.3382,
  east: 13.7611,
  west: 13.0878
};

// Berlin center
const BERLIN_CENTER = {
  lat: 52.520008,
  lng: 13.404954
};

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
import { DEFAULT_LOCATION, COUNTRY_CODES } from '../../../config/defaults';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

function SearchControl({ onLocationSelect }: { onLocationSelect: (location: Location) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [outOfBounds, setOutOfBounds] = useState(false);
  const map = useMap();
  const provider = new OpenStreetMapProvider();

  // Add Berlin boundary rectangle
  useEffect(() => {
    const rectangle = L.rectangle([
      [BERLIN_BOUNDS.north, BERLIN_BOUNDS.west],
      [BERLIN_BOUNDS.south, BERLIN_BOUNDS.east]
    ], {
      color: '#EDCC27',
      weight: 2,
      fillColor: '#EDCC27',
      fillOpacity: 0.1,
      dashArray: '5, 10'
    }).addTo(map);

    return () => {
      map.removeLayer(rectangle);
    };
  }, [map]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setOutOfBounds(false);
    
    try {
      const results = await provider.search({ query: `${searchQuery}, Berlin` });
      setResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  const isLocationInBerlin = (lat: number, lng: number) => {
    return lat >= BERLIN_BOUNDS.south && 
           lat <= BERLIN_BOUNDS.north && 
           lng >= BERLIN_BOUNDS.west && 
           lng <= BERLIN_BOUNDS.east;
  };

  const handleSelect = (result: any) => {
    if (!isLocationInBerlin(result.y, result.x)) {
      setOutOfBounds(true);
      return;
    }
    
    setOutOfBounds(false);
    const location = {
      lat: result.y,
      lng: result.x,
      address: result.label,
    };
    onLocationSelect(location);
    map.setView([location.lat, location.lng], 16);
    setResults([]);
    setSearchQuery('');
  };

  return (
    <div className="absolute top-3 left-0 right-0 z-[1000] mx-3">
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for a location..."
              className="w-full h-11 px-4 rounded-lg bg-white/90 backdrop-blur-sm border-0 shadow-lg pr-10 placeholder:text-gray-500"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <Button
            type="button"
            onClick={handleSearch}
            isLoading={isSearching}
            className="shadow-lg bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white/95 h-11 px-6"
            variant="ghost"
          >
            Search
          </Button>
        </div>

        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg max-h-60 overflow-auto border-0">
            {results.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSelect(result)}
                className="w-full px-4 py-2 text-left hover:bg-white/90 flex items-start gap-2 transition-colors"
              >
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{result.label}</span>
              </button>
            ))}
          </div>
        )}
        
        {outOfBounds && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">
                Selected location is outside Berlin. Please choose a location within Berlin city limits.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface AdditionalOwner {
  id: string;
  firstName: string;
  lastName: string;
  passportId: string;
  email: string;
  phone: string;
  countryCode: string;
}
import { useRestaurantApplication } from '../../../context/RestaurantApplicationContext';
import { useFormValidation } from '../../../hooks/useFormValidation';
import { validateCompanyName, validateRestaurantName, validateEmail, validatePhone, validateAddress, validateLocation, validatePassportId } from '../../../utils/validation';

interface RestaurantInfoStepProps {
  onNext: () => void;
}

export function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
  <div className="flex items-center gap-1 mb-1">
    <span className="text-sm font-medium text-gray-700">{children}</span>
    <Asterisk className="w-3 h-3 text-red-500" />
  </div>
  );
}

export function RestaurantInfoStep({ onNext }: RestaurantInfoStepProps) {
  const [formData, setFormData] = useState({
    // Company Details
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyCountryCode: 'DE',
    
    // Restaurant Details
    restaurantName: '',
    restaurantEmail: '',
    restaurantPhone: '',
    restaurantCountryCode: 'DE',
    
    // Location
    address: {
      street: '',
      number: '',
      city: '',
      postalCode: '',
      country: 'Germany',
    },
    location: {
      lat: DEFAULT_LOCATION.lat,
      lng: DEFAULT_LOCATION.lng,
    },
    
    // Owner Details
    ownerName: '',
    passportId: '',
    email: '',
    phone: '',
    countryCode: 'DE', // Default to Germany
    language: 'English',
    currency: 'EUR',
    hasMultipleOwners: false,
  });
  const [additionalOwners, setAdditionalOwners] = useState<AdditionalOwner[]>([]);
  const { errors, validate, clearErrors } = useFormValidation({
    companyName: validateCompanyName,
    restaurantName: validateRestaurantName,
    restaurantEmail: validateEmail,
    restaurantPhone: validatePhone,
    address: validateAddress,
    ownerName: (value) => value.length >= 3,
    passportId: validatePassportId,
    email: validateEmail,
    phone: validatePhone,
  });

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

  const updateOwner = (id: string, field: keyof AdditionalOwner, value: string) => {
    setAdditionalOwners(owners =>
      owners.map(owner =>
        owner.id === id ? { ...owner, [field]: value } : owner
      )
    );
  };

  const { application, updateApplication } = useRestaurantApplication();
  
  // Initialize form data from application context
  useEffect(() => {
    if (application) {
      setFormData(prev => ({
        ...prev,
        companyName: application.companyName || '',
        restaurantName: application.restaurantName || '',
        restaurantEmail: application.restaurantContactInfo?.email || '',
        restaurantPhone: application.restaurantContactInfo?.phone || '',
        address: {
          ...prev.address,
          street: application.location?.address?.split(',')[0] || '',
          city: application.location?.address?.split(',')[1]?.trim() || '',
        },
        location: {
          lat: application.location?.coordinates?.coordinates[1] || 52.520008,
          lng: application.location?.coordinates?.coordinates[0] || 13.404954,
        }
      }));

      // Restore beneficial owners
      if (application.beneficialOwners?.length) {
        const primaryOwner = application.beneficialOwners.find(owner => owner.isPrimary);
        const otherOwners = application.beneficialOwners.filter(owner => !owner.isPrimary);

        if (primaryOwner) {
          setFormData(prev => ({
            ...prev,
            ownerName: primaryOwner.name || '',
            passportId: primaryOwner.passportId || '',
            email: primaryOwner.email || '',
            phone: primaryOwner.phone || '',
            hasMultipleOwners: otherOwners.length > 0
          }));
        }

        if (otherOwners.length) {
          setAdditionalOwners(
            otherOwners.map(owner => ({
              id: crypto.randomUUID(),
              firstName: owner.name?.split(' ')[0] || '',
              lastName: owner.name?.split(' ').slice(1).join(' ') || '',
              passportId: owner.passportId || '',
              email: owner.email || '',
              phone: owner.phone || '',
              countryCode: 'DE'
            }))
          );
        }
      }
    }
  }, [application]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    
    // Ensure coordinates are properly formatted as numbers
    const coordinates = {
      lng: typeof formData.location.lng === 'string' ? 
        parseFloat(formData.location.lng) : formData.location.lng,
      lat: typeof formData.location.lat === 'string' ? 
        parseFloat(formData.location.lat) : formData.location.lat
    };

    // Format address into a single string
    const formattedAddress = [
      formData.address.street,
      formData.address.number,
      formData.address.postalCode,
      formData.address.city,
      formData.address.country
    ].filter(Boolean).join(', ');

    const validationData = {
      companyName: formData.companyName,
      restaurantName: formData.restaurantName,
      restaurantEmail: formData.restaurantEmail,
      restaurantPhone: formData.restaurantPhone,
      address: formattedAddress,
      ownerName: formData.ownerName,
      passportId: formData.passportId,
      email: formData.email,
      phone: formData.phone,
    };

    if (validate(validationData)) {
      // Helper function to format phone numbers correctly
      function formatPhoneNumber(phone: string, countryCode: string): string {
        // Remove all non-digit characters and leading zeros
        let digits = phone.replace(/\D/g, '').replace(/^0+/, '');
        
        // Remove existing country code if present
        const germanPrefix = '49';
        const indianPrefix = '91';
        if (digits.startsWith(germanPrefix) && countryCode === 'DE') {
          digits = digits.substring(2);
        } else if (digits.startsWith(indianPrefix) && countryCode === 'IN') {
          digits = digits.substring(2);
        }
        
        // For Indian numbers, ensure exactly 10 digits
        if (countryCode === 'IN') {
          digits = digits.slice(-10);
        }
        
        // Add the appropriate country code prefix
        return `+${countryCode === 'IN' ? indianPrefix : germanPrefix}${digits}`;
      }

      // Format phone numbers for additional owners
      const formattedAdditionalOwners = additionalOwners.map(owner => ({
        name: `${owner.firstName} ${owner.lastName}`,
        passportId: owner.passportId,
        email: owner.email,
        phone: formatPhoneNumber(owner.phone, owner.countryCode),
        isPrimary: false,
        idCardDocuments: [],
      }));

      const applicationData = {
        companyName: formData.companyName,
        restaurantName: formData.restaurantName,
        // Format restaurant contact info
        restaurantContactInfo: {
          email: formData.restaurantEmail.trim(),
          phone: formatPhoneNumber(formData.restaurantPhone, formData.restaurantCountryCode),
          countryCode: formData.restaurantCountryCode === 'DE' ? '49' : '91',
        },
        location: {
          coordinates: {
            type: 'Point' as const,
            coordinates: [coordinates.lng, coordinates.lat].map(coord => 
              parseFloat(coord.toFixed(6))
            )
          },
          address: formattedAddress.trim(),
        },
        beneficialOwners: [
          {
            name: formData.ownerName,
            passportId: formData.passportId.trim(),
            email: formData.email.trim(),
            phone: formatPhoneNumber(formData.phone, formData.countryCode),
            countryCode: formData.countryCode === 'DE' ? '49' : '91',
            isPrimary: true,
            idCardDocuments: [],
          },
          ...formattedAdditionalOwners,
        ],
      };

      updateApplication(applicationData);
      onNext();
    }
  };

  const languages = [
    { value: 'English', label: 'English' },
    { value: 'German', label: 'German' },
    { value: 'French', label: 'French' },
    { value: 'Italian', label: 'Italian' },
    { value: 'Spanish', label: 'Spanish' },
  ];

  const currencies = [
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'USD', label: 'USD ($)' },
    { value: 'GBP', label: 'GBP (£)' },
  ];
  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto space-y-8"
    >
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <ErrorAlert
              key={index}
              message={error.message}
              onClose={() => clearErrors()}
            />
          ))}
        </div>
      )}

      {/* Contact Information Section */}
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

      {/* Multiple Owners Section */}
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

      {/* Company Details Section */}
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

      {/* Restaurant Details Section */}
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

      {/* Location Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Restaurant Location</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <RequiredLabel>Street</RequiredLabel>
            <Input
              value={formData.address.street}
              onChange={(e) => setFormData({
                ...formData,
                address: { ...formData.address, street: e.target.value }
              })}
              placeholder="Enter street name"
              className="h-11"
              required
            />
          </div>
          <div>
            <RequiredLabel>Street Number</RequiredLabel>
            <Input
              value={formData.address.number}
              onChange={(e) => setFormData({
                ...formData,
                address: { ...formData.address, number: e.target.value }
              })}
              placeholder="Enter street number"
              className="h-11"
              required
            />
          </div>
          <div>
            <RequiredLabel>City</RequiredLabel>
            <Input
              value={formData.address.city}
              onChange={(e) => setFormData({
                ...formData,
                address: { ...formData.address, city: e.target.value }
              })}
              placeholder="Enter city"
              className="h-11"
              required
            />
          </div>
          <div>
            <RequiredLabel>Postal Code</RequiredLabel>
            <Input
              value={formData.address.postalCode}
              onChange={(e) => setFormData({
                ...formData,
                address: { ...formData.address, postalCode: e.target.value }
              })}
              placeholder="Enter postal code"
              className="h-11"
              required
            />
          </div>
        </div>

        <div className="mt-6">
          <RequiredLabel>Confirm Location on Map</RequiredLabel>
          <p className="text-sm text-gray-600 mb-2">
            Please select a location within Berlin city limits (highlighted area)
          </p>
          <div className="relative h-[400px] rounded-xl overflow-hidden shadow-lg">
            <MapContainer
              center={[BERLIN_CENTER.lat, BERLIN_CENTER.lng]}
              zoom={13}
              className="h-full w-full [&_.leaflet-control-attribution]:bg-white/70 [&_.leaflet-control-attribution]:backdrop-blur-sm"
              zoomControl={false}
              maxBounds={[
                [BERLIN_BOUNDS.north, BERLIN_BOUNDS.west],
                [BERLIN_BOUNDS.south, BERLIN_BOUNDS.east]
              ]}
              maxBoundsViscosity={1.0}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='<a href="https://www.openstreetmap.org/copyright" class="text-gray-600 hover:text-gray-900">OpenStreetMap</a>'
              />
              <SearchControl
                onLocationSelect={(location) => {
                  setFormData({
                    ...formData,
                    location: {
                      lat: parseFloat(location.lat.toFixed(6)),
                      lng: parseFloat(location.lng.toFixed(6))
                    },
                    address: {
                      ...formData.address,
                      ...(location.address ? { 
                        street: location.address.split(',')[0]?.trim() || '',
                        city: location.address.split(',')[1]?.trim() || formData.address.city,
                        country: 'Germany'
                      } : {})
                    }
                  });
                }}
              />
              <Marker
                position={[formData.location.lat, formData.location.lng]}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    // Round coordinates to 6 decimal places
                    setFormData({
                      ...formData,
                      location: {
                        lat: parseFloat(position.lat.toFixed(6)),
                        lng: parseFloat(position.lng.toFixed(6))
                      }
                    });
                  },
                }}
              />
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Terms Confirmation */}
      <div className="space-y-4">
        <label className="flex items-start gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            className="mt-1 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
            required
          />
          <span>
            I confirm that I am authorized to sign this document on behalf of the
            company and accept the terms of this document
          </span>
        </label>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => window.history.back()}
        >
          Go back
        </Button>
        <Button type="submit" size="lg">
          Save & continue
        </Button>
      </div>
    </motion.form>
  );
}
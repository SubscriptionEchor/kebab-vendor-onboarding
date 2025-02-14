import { Input } from '../../../../components/ui/Input';
import { RequiredLabel } from '../RestaurantInfoStep';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import L from 'leaflet';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, AlertCircle, MapPin, Plus, Minus } from 'lucide-react';
import { useToast } from '../../../../context/ToastContext';
import { useRestaurantApplication } from '../../../../context/RestaurantApplicationContext';
import { validateAddress } from '../../../../utils/validation';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Berlin boundaries (approximate)
const BERLIN_BOUNDS = {
  north: 52.6755,
  south: 52.3382,
  east: 13.7611,
  west: 13.0878
};

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface LocationDetailsProps {
  formData: {
    address: string;
    location: {
      lat: number;
      lng: number;
    };
  };
  setFormData: (data: any) => void;
}

function ZoomControl() {
  const map = useMap();
  
  const handleZoomIn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const currentZoom = map.getZoom();
    map.setZoom(currentZoom + 1);
  };

  const handleZoomOut = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const currentZoom = map.getZoom();
    map.setZoom(currentZoom - 1);
  };

  return (
    <div className="leaflet-bottom leaflet-left" style={{ zIndex: 1000 }}>
      <div className="flex flex-col gap-1 m-4">
        <button
          type="button"
          className="w-8 h-8 bg-white rounded-lg shadow-md hover:bg-gray-50 active:bg-gray-100 flex items-center justify-center border border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20 cursor-pointer"
          title="Zoom in"
          aria-label="Zoom in"
          onClick={handleZoomIn}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
        <button
          type="button"
          className="w-8 h-8 bg-white rounded-lg shadow-md hover:bg-gray-50 active:bg-gray-100 flex items-center justify-center border border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20 cursor-pointer"
          title="Zoom out"
          aria-label="Zoom out"
          onClick={handleZoomOut}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Minus className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}

// Helper function to format address
const formatAddress = (address: string): string => {
  if (!address || typeof address !== 'string') return '';
  console.log('formatAddress input:', address);
  const formatted = address
    .replace(/, Deutschland$/, ', Germany')
    .replace(/\s+/g, ' ')
    .trim();
  console.log('Formatted address:', { input: address, output: formatted });
  return formatted;
};

function SearchControl({ onLocationSelect }: { onLocationSelect: (location: Location) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [outOfBounds, setOutOfBounds] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const map = useMap();
  const provider = useMemo(() => new OpenStreetMapProvider(), []);
  const { showToast } = useToast();
  const searchTimeout = useRef<NodeJS.Timeout>();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search function
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setIsDropdownOpen(false);
      return;
    }

    setIsSearching(true);
    setOutOfBounds(false);
    
    try {
      // Force search within Berlin
      const results = await provider.search({ 
        query: `${query}, Berlin, Germany`,
        bounds: [
          [BERLIN_BOUNDS.south, BERLIN_BOUNDS.west],
          [BERLIN_BOUNDS.north, BERLIN_BOUNDS.east]
        ]
      });
      setResults(results);
      setIsDropdownOpen(true);
    } finally {
      setIsSearching(false);
    }
  }, [provider]);

  // Handle input change with debounce
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300); // 300ms debounce delay

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, handleSearch]);

  const isLocationInBerlin = (lat: number, lng: number) => {
    return lat >= BERLIN_BOUNDS.south && 
           lat <= BERLIN_BOUNDS.north && 
           lng >= BERLIN_BOUNDS.west && 
           lng <= BERLIN_BOUNDS.east;
  };

  const handleSelect = (result: any) => {
    if (!isLocationInBerlin(result.y, result.x)) {
      setOutOfBounds(true);
      showToast('Currently we only operate in Berlin. Please select a location within Berlin city limits.', 'error');
      return;
    }
    
    setOutOfBounds(false);
    const formattedAddress = formatAddress(result.label);
    const selectedLocation = {
      lat: result.y,
      lng: result.x,
      address: formattedAddress,
    };
    
    onLocationSelect(selectedLocation);
    map.setView([selectedLocation.lat, selectedLocation.lng], 16);
    setResults([]);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="absolute top-3 left-0 right-0 z-[1000] mx-3" ref={dropdownRef}>
      <div className="relative">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 mb-3 shadow-lg border border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>Currently we only operate in Berlin. Please select a location within the highlighted area.</p>
          </div>
        </div>
        <div className="relative">
          <input
            type="text"
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => {
              if (results.length > 0) {
                setIsDropdownOpen(true);
              }
            }}
            placeholder="Search for a location in Berlin..."
            className="w-full h-11 px-4 rounded-lg bg-white border border-gray-200 pr-10 placeholder:text-gray-500 focus:border-brand-primary focus:ring-brand-primary shadow-lg"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {isDropdownOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg max-h-60 overflow-auto border border-gray-200">
            {results.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSelect(result)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-start gap-2 transition-colors relative z-[1001]"
                onMouseDown={(e) => e.preventDefault()} // Prevent input blur
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

export function LocationDetails({ formData, setFormData }: LocationDetailsProps) {
  const [addressInput, setAddressInput] = useState(formData.address || '');
  const [addressError, setAddressError] = useState<string | null>(null);
  const { application } = useRestaurantApplication();

  // Initialize address from application data
  useEffect(() => {
    if (application?.location?.address) {
      console.log('LocationDetails: Loading address from application:', application.location.address);
      let address = '';
      
      // Handle both string and object address formats
      if (typeof application.location.address === 'string') {
        address = application.location.address.trim();
      } else if (typeof application.location.address === 'object') {
        // Reconstruct address from components if it's an object
        const addr = application.location.address;
        address = [
          addr.doorNumber,
          addr.street,
          addr.area,
          addr.city,
          addr.postalCode,
          addr.country
        ].filter(Boolean).join(', ');
      }
      
      console.log('LocationDetails: Formatted address:', address);
      setAddressInput(address);
      setFormData(prev => ({
        ...prev,
        address: address
      }));
    }
  }, [application]);

  // Update address when location is selected from map
  useEffect(() => {
    if (formData.address && formData.address !== addressInput) {
      console.log('LocationDetails: Address updated from map:', formData.address);
      const formattedAddress = formatAddress(formData.address);
      if (formattedAddress) {
        setAddressInput(formattedAddress);
      }
    }
  }, [formData.address, addressInput]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    
    // Prevent input if it would exceed 200 characters
    if (newAddress.length > 200) {
      return;
    }
    
    setAddressInput(newAddress);
    setAddressError(null);
    
    // Update form data with the new address
    const formattedAddress = newAddress.endsWith(', Germany') ? newAddress : `${newAddress}, Germany`;
    setFormData({
      ...formData,
      address: formattedAddress
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Restaurant Location</h2>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <RequiredLabel>Full Address</RequiredLabel>
        <Input
          value={addressInput}
          onChange={handleAddressChange}
          placeholder="Enter full address"
          maxLength={200}
          className="h-11"
          required
          error={addressError}
        />
      </div>

      <div>
        <RequiredLabel>Confirm Location on Map</RequiredLabel>
        <p className="text-sm text-gray-600 mb-2">
          Please select a location within Berlin city limits (highlighted area)
        </p>
        <div className="relative h-96 rounded-xl overflow-hidden shadow-lg z-0">
          <MapContainer
            center={[formData.location.lat, formData.location.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%', zIndex: 1 }}
            scrollWheelZoom={true}
            zoomControl={false} // Disable default zoom control
          > 
            <ZoomControl />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <SearchControl onLocationSelect={(location) => {
              setFormData(prev => ({
                ...prev,
                address: location.address || prev.address,
                location: {
                  lat: location.lat,
                  lng: location.lng
                }
              }));
            }} />
            <Marker
              position={[formData.location.lat, formData.location.lng]}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  setFormData(prev => ({
                    ...prev,
                    location: {
                      lat: position.lat,
                      lng: position.lng
                    }
                  }));
                }
              }}
            />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
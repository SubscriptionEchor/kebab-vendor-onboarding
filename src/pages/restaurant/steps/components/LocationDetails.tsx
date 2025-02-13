import { Input } from '../../../../components/ui/Input';
import { RequiredLabel } from '../RestaurantInfoStep';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import L from 'leaflet';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, AlertCircle, MapPin } from 'lucide-react';
import { useToast } from '../../../../context/ToastContext';
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
    address: {
      street: string;
      number: string;
      city: string;
      postalCode: string;
      country: string;
    };
    location: {
      lat: number;
      lng: number;
    };
  };
  setFormData: (data: any) => void;
}

function SearchControl({ onLocationSelect }: { onLocationSelect: (location: Location) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [outOfBounds, setOutOfBounds] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const map = useMap();
  const provider = new OpenStreetMapProvider();
  const { showToast } = useToast();
  const searchTimeout = useRef<NodeJS.Timeout>();

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

  // Debounced search function
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
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
    <div className="absolute top-3 left-0 right-0 z-[999] mx-3">
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a location in Berlin..."
            className="w-full h-11 px-4 rounded-lg bg-white border border-gray-200 pr-10 placeholder:text-gray-500 focus:border-brand-primary focus:ring-brand-primary shadow-lg"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg max-h-60 overflow-auto border border-gray-200">
            {results.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSelect(result)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-start gap-2 transition-colors"
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
  return (
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
            pattern="[0-9]{5}"
            maxLength={5}
            value={formData.address.postalCode}
            onChange={(e) => setFormData({
              ...formData,
              address: { ...formData.address, postalCode: e.target.value }
            })}
            placeholder="Enter postal code (e.g., 10115)"
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
        <div className="relative h-96 rounded-xl overflow-hidden shadow-lg z-0">
          <MapContainer
            center={[formData.location.lat, formData.location.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%', zIndex: 1 }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <SearchControl onLocationSelect={(location) => {
              setFormData(prev => ({
                ...prev,
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
              
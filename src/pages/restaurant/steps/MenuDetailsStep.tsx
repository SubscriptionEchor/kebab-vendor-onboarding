import { useState, useEffect, useCallback } from 'react';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { Clock, ChevronDown, Search } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { ImageUpload } from '../../../components/ui/ImageUpload';
import { getCuisines } from '../../../services/restaurant';
import { useRestaurantApplication } from '../../../context/RestaurantApplicationContext';
import { useFormValidation } from '../../../hooks/useFormValidation';
import { validateImage, validateCuisines, validateOpeningHours } from '../../../utils/validation';

interface MenuDetailsStepProps {
  onNext: () => void;
  onBack: () => void;
}

interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface Cuisine {
  id: string;
  name: string;
  description: string;
  cuisine: string;
}

type WeekSchedule = {
  [key in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']: DaySchedule;
};

const defaultCuisines = [
  { id: 'doner', name: 'Döner Kebab', description: 'Turkish-style meat in flatbread', cuisine: 'Turkish' },
  { id: 'shawarma', name: 'Shawarma', description: 'Middle Eastern-style wrapped meat', cuisine: 'Middle Eastern' },
  { id: 'gyros', name: 'Gyros', description: 'Greek-style meat with tzatziki', cuisine: 'Greek' },
  { id: 'adana', name: 'Adana Kebab', description: 'Spicy minced meat kebab', cuisine: 'Turkish' },
  { id: 'shish', name: 'Shish Kebab', description: 'Grilled meat on skewers', cuisine: 'Turkish' },
  { id: 'beyti', name: 'Beyti Kebab', description: 'Wrapped ground meat in lavash', cuisine: 'Turkish' },
  { id: 'iskender', name: 'İskender Kebab', description: 'Sliced döner on bread with sauce', cuisine: 'Turkish' },
  { id: 'cag', name: 'Cağ Kebab', description: 'Horizontally stacked meat', cuisine: 'Turkish' },
  { id: 'urfa', name: 'Urfa Kebab', description: 'Spiced ground lamb kebab', cuisine: 'Turkish' },
  { id: 'alinazik', name: 'Alinazik Kebab', description: 'Grilled meat on smoky eggplant puree', cuisine: 'Turkish' },
  { id: 'testi', name: 'Testi Kebab', description: 'Clay pot kebab', cuisine: 'Turkish' },
  { id: 'kofta', name: 'Kofta Kebab', description: 'Spiced meatballs', cuisine: 'Middle Eastern' },
  { id: 'seekh', name: 'Seekh Kebab', description: 'Spiced minced meat on skewers', cuisine: 'Indian' },
  { id: 'chapli', name: 'Chapli Kebab', description: 'Flat spiced meat patties', cuisine: 'Pakistani' },
  { id: 'shami', name: 'Shami Kebab', description: 'Minced meat with lentils', cuisine: 'Indian' },
  { id: 'galouti', name: 'Galouti Kebab', description: 'Tender minced meat kebab', cuisine: 'Indian' },
  { id: 'barg', name: 'Kabab Barg', description: 'Persian style grilled meat', cuisine: 'Persian' },
  { id: 'koobideh', name: 'Koobideh Kebab', description: 'Ground meat kebab', cuisine: 'Persian' },
  { id: 'joojeh', name: 'Joojeh Kebab', description: 'Persian chicken kebab', cuisine: 'Persian' },
  { id: 'souvlaki', name: 'Souvlaki', description: 'Greek meat skewers', cuisine: 'Greek' }
];

export function MenuDetailsStep({ onNext, onBack }: MenuDetailsStepProps) {
  const [restaurantImages, setRestaurantImages] = useState<string[]>([]);
  const [menuImages, setMenuImages] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>(defaultCuisines);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [cuisineSearch, setCuisineSearch] = useState('');
  const [selectedCuisineType, setSelectedCuisineType] = useState<string>('all');
  const [isLoadingCuisines, setIsLoadingCuisines] = useState(false);
  const { application, updateApplication } = useRestaurantApplication();
  const { errors, validate, clearErrors } = useFormValidation({
    profileImage: validateImage,
    restaurantImages: (images) => images.length >= 2 && images.length <= 4,
    menuImages: (images) => images.length >= 1 && images.length <= 4,
    cuisines: validateCuisines,
    openingTimes: (times) => Object.values(times).every(t => !t.isOpen || (t.openTime && t.closeTime)),
  });
  const [schedule, setSchedule] = useState<WeekSchedule>({
    monday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
    wednesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
    thursday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
    friday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
    saturday: { isOpen: true, openTime: '10:00', closeTime: '23:00' },
    sunday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
  });

  const cuisineTypes = useMemo(() => 
    ['all', ...new Set(cuisines.map(c => c.cuisine))].sort(),
    [cuisines]
  );

  const filteredCuisines = useMemo(() => 
    cuisines.filter(cuisine => {
      const matchesSearch = cuisine.name.toLowerCase().includes(cuisineSearch.toLowerCase()) ||
                           cuisine.description.toLowerCase().includes(cuisineSearch.toLowerCase());
      const matchesCuisineType = selectedCuisineType === 'all' || cuisine.cuisine === selectedCuisineType;
      return matchesSearch && matchesCuisineType;
    }),
    [cuisines, cuisineSearch, selectedCuisineType]
  );

  const handleCuisineToggle = (cuisineId: string) => {
    setSelectedCuisines(prev => {
      if (prev.includes(cuisineId)) {
        return prev.filter(id => id !== cuisineId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, cuisineId];
    });
  };

  const updateSchedule = (
    day: keyof WeekSchedule,
    field: keyof DaySchedule,
    value: string | boolean
  ) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (selectedCuisines.length !== 3) {
      alert('Please select exactly 3 cuisines');
      return;
    }
    
    const formData = {
      profileImage: profileImage,
      restaurantImages: restaurantImages,
      menuImages: menuImages,
      cuisines: selectedCuisines,
      openingTimes: schedule,
    };

    if (validate(formData)) {
      updateApplication(formData);
      onNext();
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      {/* Restaurant Profile Image */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Restaurant Profile</h2>
        <ImageUpload
          label="Profile Image"
          maxImages={1}
          images={profileImage}
          onImagesChange={setProfileImage}
          required
          className="mb-6"
        />
      </div>

      {/* Restaurant Images */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Restaurant Images</h2>
        <ImageUpload
          label="Upload 2-4 high-quality images of your restaurant"
          maxImages={4}
          images={restaurantImages}
          onImagesChange={setRestaurantImages}
          required
          className="mb-6"
        />
      </div>

      {/* Menu Images */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Menu Images</h2>
        <ImageUpload
          label="Upload 1-4 images of your menu"
          maxImages={4}
          images={menuImages}
          onImagesChange={setMenuImages}
          required
          className="mb-6"
        />
      </div>

      {/* Cuisine Selection */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Kebab Cuisines</h2>
        <p className="text-sm text-gray-600 mb-4">
          Select 3 cuisines that best represent your restaurant ({3 - selectedCuisines.length} selections remaining)
        </p>
        
        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search cuisines..."
                value={cuisineSearch}
                onChange={(e) => setCuisineSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-48">
            <select
              value={selectedCuisineType}
              onChange={(e) => setSelectedCuisineType(e.target.value)}
              className="w-full h-full px-4 rounded-lg border border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
            >
              <option value="all">All Cuisines</option>
              {cuisineTypes.filter(type => type !== 'all').map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoadingCuisines && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((_, index) => (
              <div
                key={index}
                className="h-24 rounded-lg bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoadingCuisines && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCuisines.map((cuisine) => (
                <button
                  key={cuisine.id}
                  type="button"
                  onClick={() => handleCuisineToggle(cuisine.id)}
                  className={`p-4 rounded-lg text-left transition-all ${
                    selectedCuisines.includes(cuisine.id)
                      ? 'bg-brand-primary/10 border-2 border-brand-primary shadow-md'
                      : selectedCuisines.length >= 3
                        ? 'bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed'
                        : 'bg-white border-2 border-gray-200 hover:border-brand-primary/50 hover:shadow-md'
                  }`}
                  disabled={selectedCuisines.length >= 3 && !selectedCuisines.includes(cuisine.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{cuisine.name}</div>
                      <div className="text-sm text-gray-600">{cuisine.description}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      {cuisine.cuisine}
                    </span>
                  </div>
                </button>
              ))}
            </div>
        
            {filteredCuisines.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No cuisines found matching your search
              </div>
            )}
          </>
        )}
      </div>

      {/* Opening Hours */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Opening Hours</h2>
        <div className="space-y-4">
          {(Object.keys(schedule) as Array<keyof WeekSchedule>).map((day) => (
            <div
              key={day}
              className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200"
            >
              <div className="w-28 font-medium capitalize">{day}</div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={schedule[day].isOpen}
                  onChange={(e) => updateSchedule(day, 'isOpen', e.target.checked)}
                  className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-sm">Open</span>
              </label>
              {schedule[day].isOpen && (
                <>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <input
                      type="time"
                      value={schedule[day].openTime}
                      onChange={(e) => updateSchedule(day, 'openTime', e.target.value)}
                      className="rounded-md border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={schedule[day].closeTime}
                      onChange={(e) => updateSchedule(day, 'closeTime', e.target.value)}
                      className="rounded-md border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
        >
          Previous Step
        </Button>
        <Button type="submit" size="lg">
          Next Step
        </Button>
      </div>
    </motion.form>
  );
}
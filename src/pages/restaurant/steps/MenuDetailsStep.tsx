import { useState, useEffect, useCallback } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Search } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { TimePicker } from "../../../components/ui/TimePicker";
import { Input } from "../../../components/ui/Input";
import { ImageUpload } from "../../../components/ui/ImageUpload";
import { getCuisines } from "../../../services/restaurant";
import { useRestaurantApplication } from "../../../context/RestaurantApplicationContext";
import { useFormValidation } from "../../../hooks/useFormValidation";
import {
  validateImage,
  validateCuisines,
  validateOpeningHours,
} from "../../../utils/validation";
import { DEFAULT_BUSINESS_HOURS } from '../../../config/defaults';

interface MenuDetailsStepProps {
  onNext: () => void;
  onBack: () => void;
}

interface DaySchedule {
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

interface Cuisine {
  id: string;
  name: string;
}

type WeekSchedule = {
  [key in
    | "MON"
    | "TUE"
    | "WED"
    | "THU"
    | "FRI"
    | "SAT"
    | "SUN"]: DaySchedule;
};

const DEFAULT_CUISINE_TYPE = "Other";

export function MenuDetailsStep({ onNext, onBack }: MenuDetailsStepProps) {
  const { application, updateApplication } = useRestaurantApplication();
  
  const [restaurantImages, setRestaurantImages] = useState(() => 
    application?.restaurantImages?.map(img => ({
      key: typeof img === 'string' ? img : img.key,
      previewUrl: typeof img === 'string' ? img : img.previewUrl
    })) || []
  );
  
  const [menuImages, setMenuImages] = useState(() =>
    application?.menuImages?.map(img => ({
      key: typeof img === 'string' ? img : img.key,
      previewUrl: typeof img === 'string' ? img : img.previewUrl
    })) || []
  );
  
  const [profileImage, setProfileImage] = useState(() =>
    application?.profileImage ? [{
      key: typeof application.profileImage === 'string' ? application.profileImage : application.profileImage.key,
      previewUrl: typeof application.profileImage === 'string' ? application.profileImage : application.profileImage.previewUrl
    }] : []
  );
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [cuisineSearch, setCuisineSearch] = useState("");
  const [isLoadingCuisines, setIsLoadingCuisines] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize form data from application context
  useEffect(() => {
    if (application && !isInitialized) {
      // Restore profile image
      if (application.profileImage) {
        setProfileImage([{ key: application.profileImage, previewUrl: application.profileImage }]);
      }
      
      // Restore restaurant images
      if (application.restaurantImages?.length) {
        setRestaurantImages(
          application.restaurantImages.map(img => ({
            key: typeof img === 'string' ? img : img.key,
            previewUrl: typeof img === 'string' ? img : img.previewUrl
          }))
        );
      }
      
      // Restore menu images
      if (application.menuImages?.length) {
        setMenuImages(
          application.menuImages.map(img => ({
            key: typeof img === 'string' ? img : img.key,
            previewUrl: typeof img === 'string' ? img : img.previewUrl
          }))
        );
      }
      
      // Restore cuisines
      if (application.cuisines?.length) {
        setSelectedCuisines(application.cuisines);
      }
      
      setIsInitialized(true);
    }
  }, [application, isInitialized]);
  
  // Initialize selected cuisines from application state
  useEffect(() => {
    if (application?.cuisines) {
      setSelectedCuisines(application.cuisines);
    }
  }, [application]);
  const { errors, validate, clearErrors } = useFormValidation({
    profileImage: validateImage,
    restaurantImages: (images) => images.length >= 2 && images.length <= 4,
    menuImages: (images) => images.length >= 1 && images.length <= 4,
    cuisines: validateCuisines,
    openingTimes: (times) =>
      Object.values(times).every(
        (t) => !t.isOpen || (t.startTime && t.endTime)
      ),
  });
  const [schedule, setSchedule] = useState<WeekSchedule>({
    MON: { isOpen: true, startTime: "09:00", endTime: "22:00" },
    TUE: { isOpen: true, startTime: "09:00", endTime: "22:00" },
    WED: { isOpen: true, startTime: "09:00", endTime: "22:00" },
    THU: { isOpen: true, startTime: "09:00", endTime: "22:00" },
    FRI: { isOpen: true, startTime: "09:00", endTime: "22:00" },
    SAT: { isOpen: true, startTime: "10:00", endTime: "23:00" },
    SUN: { isOpen: true, startTime: "10:00", endTime: "23:00" },
  });

  // Initialize schedule from application state
  useEffect(() => {
    if (application?.openingTimes) {
      const newSchedule = { ...schedule };
      application.openingTimes.forEach(time => {
        if (time.day in newSchedule) {
          newSchedule[time.day as keyof WeekSchedule] = {
            isOpen: time.isOpen,
            startTime: time.times?.[0]?.startTime[0] || DEFAULT_BUSINESS_HOURS.weekday.open,
            endTime: time.times?.[0]?.endTime[0] || DEFAULT_BUSINESS_HOURS.weekday.close
          };
        }
      });
      setSchedule(newSchedule);
    }
  }, [application]);

  useEffect(() => {
    const fetchCuisines = async () => {
      setIsLoadingCuisines(true);
      const seenNames = new Set();
      try {
        const response = await getCuisines();
        console.log("Cuisine response:", response);

        if (response?.vendorOnboardingBootstrap?.cuisines) {
          // Filter out duplicates and create unique IDs
          const fetchedCuisines = response.vendorOnboardingBootstrap.cuisines
            .filter((cuisine) => {
              if (seenNames.has(cuisine.name)) {
                return false;
              }
              seenNames.add(cuisine.name);
              return true;
            })
            .map((cuisine) => ({
              id: `cuisine-${cuisine.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")}`,
              name: cuisine.name,
            }));
          console.log("Fetched cuisines:", fetchedCuisines);
          setCuisines(fetchedCuisines);
        } else {
          throw new Error("No cuisines found");
        }
      } catch (error) {
        console.error("Failed to fetch cuisines:", error);
        setCuisines([]);
      } finally {
        setIsLoadingCuisines(false);
      }
    };

    fetchCuisines();
  }, []);

  const filteredCuisines = useMemo(
    () =>
      cuisines.filter((cuisine) => {
        const matchesSearch = cuisine.name?.toLowerCase()
          .toLowerCase()
          .includes(cuisineSearch.toLowerCase());
        return matchesSearch;
      }),
    [cuisines, cuisineSearch]
  );

  const handleCuisineToggle = (cuisineId: string) => {
    setSelectedCuisines((prev) => {
      if (prev.includes(cuisineId)) {
        // Remove both prefixed and unprefixed versions
        return prev.filter((id) => id !== cuisineId && id !== cuisineId.replace('cuisine-', ''));
      }
      if (prev.length >= 3) {
        return prev;
      }
      // Store cuisine name without prefix
      const cuisineName = cuisines.find(c => c.id === cuisineId)?.name;
      if (!cuisineName) return prev;
      return [...prev, cuisineName];
    });
  };

  const updateSchedule = (
    day: keyof WeekSchedule,
    field: keyof DaySchedule,
    value: string | boolean
  ) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: field === 'isOpen'
        ? {
            ...prev[day],
            isOpen: value as boolean,
            startTime: prev[day].startTime || DEFAULT_BUSINESS_HOURS.weekday.open,
            endTime: prev[day].endTime || DEFAULT_BUSINESS_HOURS.weekday.close,
          }
        : {
            ...prev[day],
            [field]: value,
          },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    try {
      // Validate required fields
      if (profileImage.length === 0) {
        throw new Error("Please upload a profile image");
      }

      if (restaurantImages.length < 2) {
        throw new Error("Please upload at least 2 restaurant images");
      }

      if (menuImages.length === 0) {
        throw new Error("Please upload at least one menu image");
      }

      if (selectedCuisines.length !== 3) {
        throw new Error("Please select exactly 3 cuisines");
      }

      // Format opening times
      const openingTimes = Object.entries(schedule).map(([day, daySchedule]) => {
        // Ensure time is in HH:mm format
        const formatTime = (time: string) => {
          const [hours, minutes] = time.split(':');
          return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        };

        return {
          day,
          times: daySchedule.isOpen ? [{
            startTime: [formatTime(daySchedule.startTime)],
            endTime: [formatTime(daySchedule.endTime)]
          }] : [],
          isOpen: daySchedule.isOpen,
        };
      });

      // Prepare form data
      const formData = {
        profileImage: profileImage[0]?.key,
        restaurantImages: restaurantImages.map(img => img.key),
        menuImages: menuImages.map(img => img.key),
        cuisines: selectedCuisines.map(cuisine => cuisine.trim()),
        openingTimes,
      };
      
      console.log('Submitting form data:', formData);
  
      // Update application and move to next step
      updateApplication(formData);
      onNext();
    } catch (error) {
      console.error('Form submission error:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Please fill in all required fields");
      }
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Restaurant Profile
        </h2>
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Restaurant Images
        </h2>
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Menu Images
        </h2>
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Kebab Cuisines
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Select 3 cuisines that best represent your restaurant (
          {3 - selectedCuisines.length} selections remaining)
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
              {filteredCuisines.map((cuisine, index) => (
                <button
                  key={`${cuisine.id}-${index}`} // Ensure unique keys
                  type="button"
                  onClick={() => handleCuisineToggle(cuisine.id)}
                  className={`p-4 rounded-lg text-left transition-all ${
                    selectedCuisines.includes(cuisine.id) || selectedCuisines.includes(cuisine.name)
                      ? "bg-brand-primary/10 border-2 border-brand-primary shadow-md"
                      : selectedCuisines.length >= 3
                      ? "bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed"
                      : "bg-white border-2 border-gray-200 hover:border-brand-primary/50 hover:shadow-md"
                  }`}
                  disabled={
                    selectedCuisines.length >= 3 &&
                    !selectedCuisines.includes(cuisine.id) &&
                    !selectedCuisines.includes(cuisine.name)
                  }
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{cuisine.name}</div>
                    </div>
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Opening Hours
        </h2>
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
                  onChange={(e) =>
                    updateSchedule(day, "isOpen", e.target.checked)
                  }
                  className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-sm">Open</span>
              </label>
              {schedule[day].isOpen && (
                <>
                  <div className="flex items-center gap-2">
                    <TimePicker
                      value={schedule[day].startTime}
                      onChange={(time) => updateSchedule(day, "startTime", time)}
                    />
                    <span>to</span>
                    <TimePicker
                      value={schedule[day].endTime}
                      onChange={(time) => updateSchedule(day, "endTime", time)}
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
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          Previous Step
        </Button>
        <Button type="submit" size="lg">
          Next Step
        </Button>
      </div>
    </motion.form>
  );
}
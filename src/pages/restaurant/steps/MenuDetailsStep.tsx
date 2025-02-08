import { useState, useEffect, useCallback } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Search } from "lucide-react";
import { Button } from "../../../components/ui/Button";
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
}

type WeekSchedule = {
  [key in
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday"]: DaySchedule;
};

const DEFAULT_CUISINE_TYPE = "Other";

export function MenuDetailsStep({ onNext, onBack }: MenuDetailsStepProps) {
  const [restaurantImages, setRestaurantImages] = useState<{ key: string; previewUrl: string }[]>([]);
  const [menuImages, setMenuImages] = useState<{ key: string; previewUrl: string }[]>([]);
  const [profileImage, setProfileImage] = useState<{ key: string; previewUrl: string }[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [cuisineSearch, setCuisineSearch] = useState("");
  const [selectedCuisineType, setSelectedCuisineType] = useState<string>("all");
  const [isLoadingCuisines, setIsLoadingCuisines] = useState(false);
  const { application, updateApplication } = useRestaurantApplication();
  const { errors, validate, clearErrors } = useFormValidation({
    profileImage: validateImage,
    restaurantImages: (images) => images.length >= 2 && images.length <= 4,
    menuImages: (images) => images.length >= 1 && images.length <= 4,
    cuisines: validateCuisines,
    openingTimes: (times) =>
      Object.values(times).every(
        (t) => !t.isOpen || (t.openTime && t.closeTime)
      ),
  });
  const [schedule, setSchedule] = useState<WeekSchedule>({
    monday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
    tuesday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
    wednesday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
    thursday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
    friday: { isOpen: true, openTime: "09:00", closeTime: "23:00" },
    saturday: { isOpen: true, openTime: "10:00", closeTime: "23:00" },
    sunday: { isOpen: true, openTime: "10:00", closeTime: "22:00" },
  });

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
        const matchesSearch = cuisine.name
          .toLowerCase()
          .includes(cuisineSearch.toLowerCase());
        return matchesSearch;
      }),
    [cuisines, cuisineSearch]
  );

  const handleCuisineToggle = (cuisineId: string) => {
    setSelectedCuisines((prev) => {
      if (prev.includes(cuisineId)) {
        return prev.filter((id) => id !== cuisineId);
      }
      if (prev.length >= 3) {
        return prev;
      }
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
      [day]: {
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
      const allDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
      const openingTimes = allDays.map((day) => {
        const scheduleDay = Object.entries(schedule).find(([key]) =>
          key.toUpperCase().startsWith(day)
        );
  
        if (!scheduleDay) {
          return {
            day,
            times: [],
            isOpen: false,
          };
        }
  
        const [_, daySchedule] = scheduleDay;
        return {
          day,
          times: daySchedule.isOpen
            ? [
                {
                  startTime: [daySchedule.openTime],
                  endTime: [daySchedule.closeTime],
                },
              ]
            : [],
          isOpen: daySchedule.isOpen,
        };
      });
  
      // Prepare form data
      const formData = {
        profileImage: profileImage[0]?.key,
        restaurantImages: restaurantImages.map(img => img.key),
        menuImages: menuImages.map(img => img.key),
        cuisines: selectedCuisines.map(id => id.replace('cuisine-', '')),
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
                    selectedCuisines.includes(cuisine.id)
                      ? "bg-brand-primary/10 border-2 border-brand-primary shadow-md"
                      : selectedCuisines.length >= 3
                      ? "bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed"
                      : "bg-white border-2 border-gray-200 hover:border-brand-primary/50 hover:shadow-md"
                  }`}
                  disabled={
                    selectedCuisines.length >= 3 &&
                    !selectedCuisines.includes(cuisine.id)
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
                    <Clock className="w-4 h-4 text-gray-400" />
                    <input
                      type="time"
                      value={schedule[day].openTime}
                      onChange={(e) =>
                        updateSchedule(day, "openTime", e.target.value)
                      }
                      className="rounded-md border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={schedule[day].closeTime}
                      onChange={(e) =>
                        updateSchedule(day, "closeTime", e.target.value)
                      }
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

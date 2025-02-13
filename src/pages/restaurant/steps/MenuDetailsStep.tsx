import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../../../components/ui/Button";
import { useCuisines } from '../../../hooks/useCuisines';
import { useRestaurantApplication } from "../../../context/RestaurantApplicationContext";
import { useFormValidation } from "../../../hooks/useFormValidation";
import {
  validateImage,
  validateCuisines,
  validateOpeningHours,
} from "../../../utils/validation";
import { DEFAULT_BUSINESS_HOURS } from "../../../config/defaults";
import { CuisineSelection, OpeningHours, RestaurantImages } from './components/MenuDetails';

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
  [key in "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN"]: DaySchedule;
};

const DEFAULT_CUISINE_TYPE = "Other";

export function MenuDetailsStep({ onNext, onBack }: MenuDetailsStepProps) {
  const { application, updateApplication } = useRestaurantApplication();

  const { cuisines: availableCuisines, isLoading: isLoadingCuisines, error, refreshCuisines } = useCuisines();
  const [restaurantImages, setRestaurantImages] = useState(
    () =>
      application?.restaurantImages?.map((img) => ({
        key: typeof img === "string" ? img : img.key,
        previewUrl: typeof img === "string" ? img : img.previewUrl,
      })) || []
  );

  const [menuImages, setMenuImages] = useState(
    () =>
      application?.menuImages?.map((img) => ({
        key: typeof img === "string" ? img : img.key,
        previewUrl: typeof img === "string" ? img : img.previewUrl,
      })) || []
  );

  const [profileImage, setProfileImage] = useState(() =>
    application?.profileImage
      ? [
          {
            key:
              typeof application.profileImage === "string"
                ? application.profileImage
                : application.profileImage.key,
            previewUrl:
              typeof application.profileImage === "string"
                ? application.profileImage
                : application.profileImage.previewUrl,
          },
        ]
      : []
  );
  const cuisines = availableCuisines.map(cuisine => ({
    id: `cuisine-${cuisine.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).substr(2, 9)}`,
    name: cuisine.name
  }));
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize form data from application context
  useEffect(() => {
    if (application && !isInitialized) {
      // Restore profile image
      if (application.profileImage) {
        setProfileImage([
          {
            key: application.profileImage,
            previewUrl: application.profileImage,
          },
        ]);
      }

      // Restore restaurant images
      if (application.restaurantImages?.length) {
        setRestaurantImages(
          application.restaurantImages.map((img) => ({
            key: typeof img === "string" ? img : img.key,
            previewUrl: typeof img === "string" ? img : img.previewUrl,
          }))
        );
      }

      // Restore menu images
      if (application.menuImages?.length) {
        setMenuImages(
          application.menuImages.map((img) => ({
            key: typeof img === "string" ? img : img.key,
            previewUrl: typeof img === "string" ? img : img.previewUrl,
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
    if (application?.cuisines && cuisines.length > 0) {
      const normalizedCuisines = application.cuisines
        .map(cuisine => {
          const name = typeof cuisine === 'string' ? cuisine : cuisine.name;
          return name.trim();
        })
        .filter(name => 
          cuisines.some(c => c.name.toLowerCase() === name.toLowerCase())
        );

      setSelectedCuisines(normalizedCuisines);
    }
  }, [application, cuisines.length]);
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

      // Iterate over object keys
      Object.entries(application.openingTimes).forEach(([day, time]) => {
        if (day in newSchedule) {
          newSchedule[day as keyof WeekSchedule] = {
            isOpen: time.isOpen,
            startTime: time.openTime || DEFAULT_BUSINESS_HOURS.weekday.open,
            endTime: time.closeTime || DEFAULT_BUSINESS_HOURS.weekday.close,
          };
        }
      });

      setSchedule(newSchedule);
    }
  }, [application]);

  const handleCuisineToggle = (cuisineId: string) => {
    setSelectedCuisines((prev) => {
      const cuisineName = cuisines.find(c => c.id === cuisineId)?.name;
      if (!cuisineName) {
        return prev;
      }
  
      if (prev.includes(cuisineName)) {
        return prev.filter(name => name !== cuisineName);
      }
      if (prev.length >= 3) {
        return prev;
      }
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
      [day]:
        field === "isOpen"
          ? {
              ...prev[day],
              isOpen: value as boolean,
              startTime:
                prev[day].startTime || DEFAULT_BUSINESS_HOURS.weekday.open,
              endTime:
                prev[day].endTime || DEFAULT_BUSINESS_HOURS.weekday.close,
            }
          : {
              ...prev[day],
              [field]: value,
            },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      const openingTimes = Object.entries(schedule).map(
        ([day, daySchedule]) => {
          // Ensure time is in HH:mm format
          const formatTime = (time: string) => {
            const [hours, minutes] = time.split(":");
            return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
          };

          return {
            day,
            times: daySchedule.isOpen
              ? [
                  {
                    startTime: [formatTime(daySchedule.startTime)],
                    endTime: [formatTime(daySchedule.endTime)],
                  },
                ]
              : [],
            isOpen: daySchedule.isOpen,
          };
        }
      );

      // Prepare form data
      const formData = {
        profileImage: profileImage[0]?.key,
        restaurantImages: restaurantImages.map((img) => img.key),
        menuImages: menuImages.map((img) => img.key),
        cuisines: selectedCuisines.map((cuisine) => cuisine.trim()),
        openingTimes,
      };

      // Update application and move to next step
      updateApplication(formData);
      onNext();
    } catch (error) {
      console.error("Form submission error:", error);
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
      <div>
        <RestaurantImages
          profileImage={profileImage}
          setProfileImage={setProfileImage}
          restaurantImages={restaurantImages}
          setRestaurantImages={setRestaurantImages}
          menuImages={menuImages}
          setMenuImages={setMenuImages}
        />
      </div>

      <CuisineSelection
        cuisines={cuisines}
        selectedCuisines={selectedCuisines}
        onCuisineToggle={handleCuisineToggle}
        isLoadingCuisines={isLoadingCuisines}
        cuisineError={error}
        refreshCuisines={refreshCuisines}
      />

      <OpeningHours
        schedule={schedule}
        updateSchedule={updateSchedule}
      />

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
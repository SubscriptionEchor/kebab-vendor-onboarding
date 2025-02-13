import { ImageUpload } from '../../../../../components/ui/ImageUpload';

interface RestaurantImagesProps {
  profileImage: Array<{ key: string; previewUrl: string }>;
  setProfileImage: (images: Array<{ key: string; previewUrl: string }>) => void;
  restaurantImages: Array<{ key: string; previewUrl: string }>;
  setRestaurantImages: (images: Array<{ key: string; previewUrl: string }>) => void;
  menuImages: Array<{ key: string; previewUrl: string }>;
  setMenuImages: (images: Array<{ key: string; previewUrl: string }>) => void;
}

export function RestaurantImages({
  profileImage,
  setProfileImage,
  restaurantImages,
  setRestaurantImages,
  menuImages,
  setMenuImages
}: RestaurantImagesProps) {
  return (
    <>
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
    </>
  );
}
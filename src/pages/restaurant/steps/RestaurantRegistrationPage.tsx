// src/pages/restaurant/steps/RestaurantRegistrationPage.tsx
import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { getApplicationById } from '../../services/restaurant';
import { updateApplication } from '../../context/RestaurantApplicationContext';
import { stripCountryCode } from '../../utils/phone'; // Your helper to remove country code, if applicable

// Helper function to get a presigned URL for a document
const getPresignedUrl = (key: string, presignedUrls: Record<string, string>) => {
  return presignedUrls[key] || key;
};

// Parse address string into components
const parseAddressString = (addressString: string | undefined) => {
  console.log('[parseAddressString] Parsing address:', addressString);

  const addressComponents = {
    doorNumber: '',
    street: '',
    area: '',
    city: 'Berlin',
    postalCode: '',
    country: 'Germany'
  };

  if (!addressString) return addressComponents;

  try {
    // First try to parse if it's a comma-separated string
    const parts = addressString.split(',').map(part => part.trim());
    console.log('[parseAddressString] Split parts:', parts);

    if (parts[0]) {
      // Parse door number and street from first part
      const streetMatch = parts[0].match(/^(.*?)\s*(\d+[A-Za-z]?)?$/);
      if (streetMatch) {
        addressComponents.doorNumber = streetMatch[2]?.trim() || '';
        addressComponents.street = streetMatch[1]?.trim() || '';
      } else {
        addressComponents.street = parts[0];
      }
    }

    if (parts[1]) {
      addressComponents.area = parts[1].trim();
    }

    if (parts[2]) {
      // Try to extract postal code from city part
      const cityMatch = parts[2].match(/(\d{5})\s*(.+)/);
      if (cityMatch) {
        addressComponents.postalCode = cityMatch[1];
        addressComponents.city = cityMatch[2];
      } else {
        addressComponents.city = parts[2].trim();
      }
    }

    if (parts[3]) {
      addressComponents.country = parts[3].trim();
    }
  } catch (error) {
    console.error('[parseAddressString] Error parsing address:', error);
  }

  console.log('[parseAddressString] Final parsed components:', addressComponents);
  return addressComponents;
};

export function RestaurantRegistrationPage() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const editId = searchParams.get('edit');

    const loadApplication = async () => {
      setIsLoading(true);
      try {
        const applicationData = await getApplicationById(editId!);
        console.log('[loadApplication] Loaded application data:', applicationData);

        // Parse address components
        let addressComponents;
        if (typeof applicationData.location?.address === 'string') {
          addressComponents = parseAddressString(applicationData.location.address);
        } else if (typeof applicationData.location?.address === 'object') {
          addressComponents = {
            doorNumber: applicationData.location.address.doorNumber || '',
            street: applicationData.location.address.street || '',
            area: applicationData.location.address.area || '',
            city: applicationData.location.address.city || 'Berlin',
            postalCode: applicationData.location.address.postalCode || '',
            country: applicationData.location.address.country || 'Germany'
          };
        } else {
          addressComponents = parseAddressString('');
        }

        console.log('[loadApplication] Address components:', addressComponents);

        // Get coordinates ensuring they are numbers
        const coordinates = applicationData.location?.coordinates?.coordinates || [13.404954, 52.520008];
        const [lng, lat] = coordinates.map(coord => typeof coord === 'number' ? coord : parseFloat(coord));
        console.log('[loadApplication] Parsed coordinates:', { lng, lat });

        // Format the data to match the application structure
        const formattedData = {
          beneficialOwners: applicationData.beneficialOwners.map(owner => ({
            ...owner,
            phone: stripCountryCode(owner.phone),
            idCardDocuments: (owner.idCardDocuments || []).map(doc => ({
              key: doc,
              previewUrl: getPresignedUrl(doc, applicationData.presignedUrls)
            }))
          })),
          companyName: applicationData.companyName,
          restaurantName: applicationData.restaurantName,
          restaurantContactInfo: {
            ...applicationData.restaurantContactInfo,
            phone: stripCountryCode(applicationData.restaurantContactInfo.phone)
          },
          location: {
            coordinates: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            address: addressComponents
          },
          restaurantImages: applicationData.restaurantImages.map(img => ({
            key: img,
            previewUrl: getPresignedUrl(img, applicationData.presignedUrls)
          })),
          menuImages: applicationData.menuImages.map(img => ({
            key: img,
            previewUrl: getPresignedUrl(img, applicationData.presignedUrls)
          })),
          profileImage: applicationData.profileImage ? {
            key: applicationData.profileImage,
            previewUrl: getPresignedUrl(applicationData.profileImage, applicationData.presignedUrls)
          } : '',
          cuisines: applicationData.cuisines || [],
          openingTimes: applicationData.openingTimes || [],
          businessDocuments: {
            hospitalityLicense: applicationData.businessDocuments?.hospitalityLicense ? [{
              key: applicationData.businessDocuments.hospitalityLicense,
              previewUrl: getPresignedUrl(applicationData.businessDocuments.hospitalityLicense, applicationData.presignedUrls)
            }] : [],
            registrationCertificate: applicationData.businessDocuments?.registrationCertificate ? [{
              key: applicationData.businessDocuments.registrationCertificate,
              previewUrl: getPresignedUrl(applicationData.businessDocuments.registrationCertificate, applicationData.presignedUrls)
            }] : [],
            taxId: {
              documentNumber: applicationData.businessDocuments?.taxId?.documentNumber || '',
              documentUrl: applicationData.businessDocuments?.taxId?.documentUrl ? [{
                key: applicationData.businessDocuments.taxId.documentUrl,
                previewUrl: getPresignedUrl(applicationData.businessDocuments.taxId.documentUrl, applicationData.presignedUrls)
              }] : []
            }
          }
        };

        console.log('[loadApplication] Formatted data:', formattedData);
        updateApplication(formattedData);
        showToast('Application loaded successfully', 'success');
      } catch (error) {
        console.error('Failed to load application:', error);
        showToast('Failed to load application. Please try again.', 'error');
        // Optionally navigate away if load fails
      } finally {
        setIsLoading(false);
      }
    };

    if (editId) {
      loadApplication();
    }
  }, []);

  return (
    <div>
      {isLoading ? <p>Loading application data...</p> : <p>Edit application form goes here</p>}
    </div>
  );
}
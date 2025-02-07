import { graphqlRequest } from './api';

interface UploadResponse {
  success: boolean;
  key: string;
}

interface UploadResult {
  key: string;
  previewUrl: string;
}

export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication required');
  }

  // Step 1: Upload file to get the key
  const formData = new FormData();
  formData.append('file', file);

  try {
    const uploadResponse = await fetch('https://del-qa-api.kebapp-chefs.com/upload/vendor/vendorDoc', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://vendor-onboarding-qa.kebapp-chefs.com',
        'Referer': 'https://vendor-onboarding-qa.kebapp-chefs.com/',
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    const uploadResult = await uploadResponse.json() as UploadResponse;
    if (!uploadResult.success || !uploadResult.key) {
      throw new Error('Upload failed: No key received');
    }

    // Step 2: Get presigned URL using the key
    const GET_PRESIGNED_URL = `
      query GetPresignedUrls($urlsRequested: [String!]!) {
        getVendorApplicationAccessiblePresignedUrls(urlsRequested: $urlsRequested)
      }
    `;

    const response = await graphqlRequest<{ getVendorApplicationAccessiblePresignedUrls: string[] }>(
      GET_PRESIGNED_URL,
      { urlsRequested: [uploadResult.key] },
      {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://vendor-onboarding-qa.kebapp-chefs.com',
        'Priority': 'u=1, i',
        'Referer': 'https://vendor-onboarding-qa.kebapp-chefs.com/'
      }
    );

    const presignedUrls = response.getVendorApplicationAccessiblePresignedUrls;
    const previewUrl = presignedUrls[uploadResult.key];
    
    if (!previewUrl) {
      throw new Error('Failed to get file URL');
    }

    // Return both the key and preview URL
    return {
      key: uploadResult.key,
      previewUrl
    };
  } catch (error) {
    console.error('Upload failed:', error);
    if (error instanceof Error) {
      if (error.message.includes('Authentication') || error.message.includes('token')) {
        window.location.href = '/login';
        throw new Error('Please log in again to continue');
      }
      throw error;
    }
    throw new Error('Failed to upload file');
  }
}

export async function handleFileUpload(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  try {
    // Validate file
    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file');
    }

    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload an image or PDF.');
    }

    // Upload file and get both key and preview URL
    return await uploadFile(file, onProgress);
  } catch (error) {
    console.error('File upload failed:', error);
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    throw new Error('Failed to upload file. Please try again.');
  }
}
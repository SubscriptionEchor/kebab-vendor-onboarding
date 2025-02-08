import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    Icon: {
      Default: {
        prototype: {
          _getIconUrl: vi.fn(),
        },
        mergeOptions: vi.fn(),
      },
    },
  },
}));

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: vi.fn(() => null),
  TileLayer: vi.fn(() => null),
  Marker: vi.fn(() => null),
  useMap: vi.fn(() => ({
    setView: vi.fn(),
  })),
}));

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock MSW server
export const handlers = [
  http.post('https://del-qa-api.kebapp-chefs.com/graphql', async ({ request }) => {
    const { query, variables } = await request.json();
    
    // Mock authentication responses
    if (query.includes('sendPhoneOtpForOnboardingVendorLogin')) {
      return HttpResponse.json({
        data: {
          sendPhoneOtpForOnboardingVendorLogin: {
            result: true,
            message: 'OTP sent successfully',
            token: 'mock-token',
          },
        },
      });
    }

    // Mock cuisine responses
    if (query.includes('vendorOnboardingBootstrap')) {
      return HttpResponse.json({
        data: {
          vendorOnboardingBootstrap: {
            cuisines: [
              { name: 'Turkish' },
              { name: 'Mediterranean' },
              { name: 'Middle Eastern' },
            ],
          },
        },
      });
    }

    // Mock application submission
    if (query.includes('createRestaurantOnboardingApplication')) {
      return HttpResponse.json({
        data: {
          createRestaurantOnboardingApplication: {
            _id: 'mock-application-id',
            applicationStatus: 'PENDING',
            restaurantName: variables.input.restaurantName,
            createdAt: new Date().toISOString(),
          },
        },
      });
    }

    return HttpResponse.json({ data: {} });
  }),
];

const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Clean up after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => server.close());

export { server }
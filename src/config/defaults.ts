// Default location (Berlin)
export const DEFAULT_LOCATION = {
  lat: 52.520008,
  lng: 13.404954,
};

// Default business hours
export const DEFAULT_BUSINESS_HOURS = {
  weekday: {
    open: '09:00',
    close: '22:00',
  },
  weekend: {
    open: '10:00',
    close: '23:00',
  },
};

// Phone number country codes
export const COUNTRY_CODES = {
  DE: {
    code: 'DE',
    prefix: '+49',
    flag: '🇩🇪',
    name: 'Germany',
  },
  IN: {
    code: 'IN',
    prefix: '+91',
    flag: '🇮🇳',
    name: 'India',
  },
} as const;
export interface Point {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface BeneficialOwner {
  name: string;
  passportId: string;
  email: string;
  phone: string;
  countryCode: string;
  isPrimary: boolean;
  idCardDocuments: string[];
}

export interface RestaurantContactInfo {
  email: string;
  phone: string;
  countryCode: string;
}

export interface Location {
  coordinates: Point;
  address: string;
}

export interface OpeningTime {
  startTime: string[];
  endTime: string[];
}

export interface DaySchedule {
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  times?: OpeningTime[];
  isOpen: boolean;
}

export interface BankDetails {
  accountNumber: string;
  bankName: string;
  branchName: string;
  bankIdentifierCode: string;
  accountHolderName: string;
  documentUrl: string;
}

export interface TaxId {
  documentNumber: string;
  documentUrl: string;
}

export interface BusinessDocuments {
  hospitalityLicense: string;
  registrationCertificate: string;
  bankDetails: BankDetails;
  taxId: TaxId;
}

export interface RestaurantApplication {
  beneficialOwners: BeneficialOwner[];
  companyName: string;
  restaurantName: string;
  restaurantContactInfo: RestaurantContactInfo;
  location: Location;
  restaurantImages: string[];
  menuImages: string[];
  profileImage: string;
  cuisines: string[];
  openingTimes: DaySchedule[];
  businessDocuments: BusinessDocuments;
}

export interface RestaurantApplicationResponse {
  _id: string;
  applicationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  restaurantName: string;
  createdAt: string;
}

export interface RestaurantApplicationContextType {
  application: RestaurantApplication | null;
  updateApplication: (data: Partial<RestaurantApplication>) => void;
  resetApplication: () => void;
  submitApplication: () => Promise<RestaurantApplicationResponse>;
}
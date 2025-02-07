export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: 'owner' | 'manager' | 'staff';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (phone: string, countryCode: string) => Promise<void>;
  logout: () => void;
  register: (phone: string, countryCode: string, name: string) => Promise<void>;
}
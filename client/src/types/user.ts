export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

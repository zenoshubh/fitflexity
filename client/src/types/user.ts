export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  provider: string;
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

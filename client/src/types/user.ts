export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentWeightInKgs: number;
  targetWeightInKgs: number;
  lastUpdatedWeightInKgs: number;
  initialWeightInKgs: number;
  heightInCms: number;
  dateOfBirth?: string;
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
  updateRequired?: boolean;
  hasDietPlan?: boolean;
  hasWorkoutPlan?: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

export interface UserProfile {
  given_name: string;
  family_name: string;
  email: string;
}

export interface AuthResponse {
  authenticated: boolean;
  profile?: UserProfile;
}
export type RequestStatus =
  | 'Pending'
  | 'Accepted'
  | 'Rejected'
  | 'Completed'
  | 'Cancelled';

export type ServiceRequest = {
  id: string;
  requestId?: string;
  providerId: string;
  providerName: string;
  category: string;
  service: string;
  description: string;
  date: string;
  time: string;
  location: string;
  phone: string;
  price: string;
  status: RequestStatus;
  userId?: string;
  userName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateServiceRequestPayload = {
  providerId: string;
  providerName: string;
  category: string;
  service: string;
  description: string;
  date: string;
  time: string;
  location: string;
  phone: string;
  price: string;
  userId?: string;
  latitude?: number;
  longitude?: number;
};

export type ProviderService = {
  id?: string;
  name: string;
  price: string;
  description?: string;
};

export type Provider = {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  distance: string;
  price: string;
  available: boolean;
  location: string;
  phone: string;
  whatsapp: string;
  experience: string;
  about: string;
  avatarUrl?: string;
  imageUrl?: string;
  gallery?: string[];
  latitude?: number;
  longitude?: number;
  services: ProviderService[];
};

export type UserRole = 'User' | 'Provider' | 'Admin';

export type AuthMethod = 'password' | 'google';

export type AuthUser = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  role: UserRole;
  providerId?: string | null;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  authMethod?: AuthMethod;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type RegisterResponse = {
  user: AuthUser;
  emailVerified: boolean;
  message: string;
};

export type FavoriteItem = {
  id: string;
  providerId: string;
  createdAt: string;
  provider: Provider;
};

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  requestId: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  location?: string;
  role: 'User' | 'Provider';
  businessName?: string;
  category?: string;
};

export type ProviderQueryParams = {
  lat?: number;
  lng?: number;
  q?: string;
  category?: string;
  sort?: 'distance' | 'rating' | 'price' | 'smart';
};

export type CreateServicePayload = {
  name: string;
  price: string;
  description?: string;
};

export type UpdateServicePayload = {
  name?: string;
  price?: string;
  description?: string;
};

export type UpdateProviderProfilePayload = {
  name?: string;
  about?: string;
  phone?: string;
  whatsapp?: string;
  available?: boolean;
  location?: string;
  latitude?: number;
  longitude?: number;
  experience?: string;
};

export type PriceSuggestResponse = {
  suggestedPrice?: string;
  price?: string;
  min?: number;
  max?: number;
  message?: string;
};

/** @deprecated Use AuthUser instead */
export type UserProfile = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  role?: UserRole;
};

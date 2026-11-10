import { getToken } from '@/lib/auth-storage';
import type {
  AppNotification,
  AuthResponse,
  AuthUser,
  CreateServicePayload,
  CreateServiceRequestPayload,
  FavoriteItem,
  LoginPayload,
  PriceSuggestResponse,
  Provider,
  ProviderQueryParams,
  RegisterPayload,
  RegisterResponse,
  RequestStatus,
  ServiceRequest,
  UpdateProviderProfilePayload,
  UpdateServicePayload,
} from '@/types';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'http://localhost:4000';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let isServerOnline = true;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

async function checkServerHealth(): Promise<boolean> {
  const now = Date.now();
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return isServerOnline;
  }

  try {
    const response = await fetch(`${API_URL}/auth/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000), // 5 second timeout for health check
    });
    isServerOnline = response.ok && response.status !== 0;
  } catch {
    isServerOnline = false;
  }

  lastHealthCheck = now;
  return isServerOnline;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      message?: string | string[];
      error?: string;
    };

    if (Array.isArray(data.message)) {
      return data.message.join(', ');
    }

    if (typeof data.message === 'string') {
      return data.message;
    }

    if (data.error) {
      return data.error;
    }
  } catch {
    // ignore JSON parse failures
  }

  return `Request failed with status ${response.status}`;
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = getToken();
  const maxRetries = 3;
  const retryDelay = 1000;

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) await delay(retryDelay * attempt);

    try {
      const isOnline = await checkServerHealth();
      if (!isOnline && attempt < maxRetries) continue;

      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options?.headers || {}),
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });

      if (
        response.status === 0 ||
        response.status.toString().startsWith('5')
      ) {
        if (attempt < maxRetries) continue;
      }

      if (!response.ok) {
        const message = await parseErrorMessage(response);
        throw new ApiError(message, response.status);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (
        attempt < maxRetries &&
        (error as Error).name !== 'AbortError'
      ) {
        continue;
      }
      throw new ApiError(
        'Unable to reach the server. Please check your internet connection and ensure the backend is running.',
        0,
      );
    }
  }

  throw new ApiError(
    'Unable to reach the server. Please check your internet connection and ensure the backend is running.',
    0,
  );
}

function buildQuery(params?: Record<string, string | number | undefined>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function getApiBaseUrl(): string {
  return API_URL;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me');
}

export async function updateProfile(payload: {
  name?: string;
  phone?: string;
  location?: string;
}): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function uploadUserAvatar(file: File): Promise<AuthUser> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/auth/me/avatar`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as AuthUser;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function sendPhoneVerification(phone: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/send-phone-verification', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function verifyPhone(code: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/verify-phone', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

// ── Providers ───────────────────────────────────────────────────────────────

export async function getProviders(
  params?: ProviderQueryParams,
): Promise<Provider[]> {
  return apiFetch<Provider[]>(`/providers${buildQuery(params)}`);
}

export async function getProviderById(id: string): Promise<Provider> {
  return apiFetch<Provider>(`/providers/${encodeURIComponent(id)}`);
}

export async function getMyProviderProfile(): Promise<Provider> {
  return apiFetch<Provider>('/providers/me/profile');
}

export async function updateMyProviderProfile(
  payload: UpdateProviderProfilePayload,
): Promise<Provider> {
  return apiFetch<Provider>('/providers/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function uploadProfilePhoto(file: File): Promise<{ url: string }> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/providers/me/upload/avatar`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
    signal: AbortSignal.timeout(30000), // 30 second timeout for uploads
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as { url: string };
}

export async function createService(
  payload: CreateServicePayload,
): Promise<Provider> {
  return apiFetch<Provider>('/providers/me/services', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateService(
  serviceId: string,
  payload: UpdateServicePayload,
): Promise<Provider> {
  return apiFetch<Provider>(
    `/providers/me/services/${encodeURIComponent(serviceId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteService(serviceId: string): Promise<Provider> {
  return apiFetch<Provider>(
    `/providers/me/services/${encodeURIComponent(serviceId)}`,
    { method: 'DELETE' },
  );
}

export async function suggestPrice(
  category: string,
  service: string,
): Promise<PriceSuggestResponse> {
  return apiFetch<PriceSuggestResponse>(
    `/smart/price-suggest${buildQuery({ category, service })}`,
  );
}

// ── Requests ────────────────────────────────────────────────────────────────

export async function getRequests(): Promise<ServiceRequest[]> {
  return apiFetch<ServiceRequest[]>('/requests');
}

export async function getMyRequests(): Promise<ServiceRequest[]> {
  return apiFetch<ServiceRequest[]>('/requests/mine');
}

export async function getProviderInbox(): Promise<ServiceRequest[]> {
  return apiFetch<ServiceRequest[]>('/requests/inbox');
}

export async function getRequestById(id: string): Promise<ServiceRequest> {
  return apiFetch<ServiceRequest>(`/requests/${encodeURIComponent(id)}`);
}

export async function getRequestsByProvider(
  providerId: string,
): Promise<ServiceRequest[]> {
  return apiFetch<ServiceRequest[]>(
    `/requests/provider/${encodeURIComponent(providerId)}`,
  );
}

export async function createRequest(
  payload: CreateServiceRequestPayload,
): Promise<ServiceRequest> {
  return apiFetch<ServiceRequest>('/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateRequestStatus(
  id: string,
  status: RequestStatus,
): Promise<ServiceRequest> {
  return apiFetch<ServiceRequest>(
    `/requests/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  );
}

export async function rescheduleRequest(
  id: string,
  date: string,
  time: string,
): Promise<ServiceRequest> {
  return apiFetch<ServiceRequest>(
    `/requests/${encodeURIComponent(id)}/reschedule`,
    {
      method: 'PATCH',
      body: JSON.stringify({ date, time }),
    },
  );
}

export async function deleteRequest(
  id: string,
): Promise<{ message: string; id: string }> {
  return apiFetch<{ message: string; id: string }>(
    `/requests/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}

export async function getUnreadMessageCount(): Promise<{ count: number }> {
  return apiFetch<{ count: number }>('/chat/unread/count');
}

export async function getUnreadCountForRequest(
  requestId: string,
): Promise<{ count: number }> {
  return apiFetch<{ count: number }>(
    `/chat/${encodeURIComponent(requestId)}/unread/count`,
  );
}

// ── Favorites ────────────────────────────────────────────────────────────────

export async function getFavorites(): Promise<FavoriteItem[]> {
  return apiFetch<FavoriteItem[]>('/favorites');
}

export async function getFavoriteStatus(
  providerId: string,
): Promise<{ isFavorite: boolean }> {
  return apiFetch<{ isFavorite: boolean }>(
    `/favorites/status/${encodeURIComponent(providerId)}`,
  );
}

export async function addFavorite(providerId: string): Promise<{ added: boolean }> {
  return apiFetch<{ added: boolean }>('/favorites', {
    method: 'POST',
    body: JSON.stringify({ providerId }),
  });
}

export async function removeFavorite(providerId: string): Promise<{
  removed: boolean;
}> {
  return apiFetch<{ removed: boolean }>(
    `/favorites/${encodeURIComponent(providerId)}`,
    { method: 'DELETE' },
  );
}

// ── Notifications (in-app) ──────────────────────────────────────────────────

export async function getNotifications(): Promise<AppNotification[]> {
  return apiFetch<AppNotification[]>('/notifications');
}

export async function getUnreadNotificationsCount(): Promise<{ count: number }> {
  return apiFetch<{ count: number }>('/notifications/unread-count');
}

export async function markNotificationRead(id: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(
    `/notifications/${encodeURIComponent(id)}/read`,
    { method: 'PATCH' },
  );
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/notifications/read-all', {
    method: 'PATCH',
  });
}

export function getGoogleAuthUrl(): string {
  return `${API_URL}/auth/google`;
}

export async function getProviderReviews(
  providerId: string,
): Promise<Array<{
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    name: string;
  };
}>> {
  return apiFetch<Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: {
      name: string;
    };
  }>>(`/providers/${encodeURIComponent(providerId)}/reviews`);
}

export interface ReviewDto {
  id: string;
  providerId: string;
  userId: string;
  requestId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string } | null;
}

export async function submitReview(
  requestId: string,
  rating: number,
  comment?: string,
): Promise<ReviewDto> {
  return apiFetch('/reviews', {
    method: 'POST',
    body: JSON.stringify({ requestId, rating, comment }),
  });
}

export const fetcher = apiFetch;

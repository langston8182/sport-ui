const API_BASE_URL = import.meta.env.VITE_API_URL;
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL;

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

// Function to handle token refresh and retry
async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  // First attempt
  let response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  // If we get a 401, try to refresh the token
  if (response.status === 401) {
    const refreshResponse = await fetch(`${AUTH_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshResponse.ok) {
      // Retry the original request
      response = await fetch(url, {
        ...options,
        credentials: 'include',
      });
    } else {
      // Refresh failed, redirect to login
      window.location.href = `${AUTH_BASE_URL}/auth/login`;
      throw new Error('Authentication failed');
    }
  }

  return response;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;

  if (params) {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  }

  const response = await fetchWithAuth(url, {
    ...fetchOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (response.status === 204 || !contentType?.includes('application/json')) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string>) =>
      apiFetch<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, data: unknown) =>
      apiFetch<T>(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

  patch: <T>(endpoint: string, data: unknown) =>
      apiFetch<T>(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

  put: <T>(endpoint: string, data: unknown) =>
      apiFetch<T>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

  delete: <T>(endpoint: string) =>
      apiFetch<T>(endpoint, { method: 'DELETE' }),
};
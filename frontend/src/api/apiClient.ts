/**
 * api/apiClient.ts
 *
 * Configured Axios instance with automatic token refresh.
 *
 * ARCHITECTURE ROLE: API layer (client-side application layer)
 *
 * This interceptor implements the silent refresh pattern:
 * 1. A request fails with 401 TOKEN_EXPIRED
 * 2. We call /auth/refresh with the HTTP-only cookie
 * 3. We update the access token in memory and in the auth store
 * 4. We retry the original request with the new token
 *
 * WHY: This makes token refresh transparent to the UI layer.
 * Components and stores don't need to know about token lifecycle.
 */

import axios, { AxiosError } from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1',
  withCredentials: true, // Required for the refresh token cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track whether a refresh is in progress to avoid concurrent refresh attempts
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(p => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as any;

    const isTokenExpired =
      error.response?.status === 401 &&
      error.response?.data?.error?.subCode === 'TOKEN_EXPIRED';

    if (isTokenExpired && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request to retry after refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await apiClient.post('/auth/refresh');
        const newToken = data.data.accessToken;

        // Update the default header for future requests
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        // Update auth store (lazy import to avoid circular dependency)
        const { useAuthStore } = await import('../store/authStore');
        useAuthStore.getState().setAccessToken(newToken);

        processQueue(null, newToken);

        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Refresh failed — force logout
        const { useAuthStore } = await import('../store/authStore');
        useAuthStore.getState().logout();

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Standardized API error extractor.
 * Converts Axios errors into the API error shape for store error handling.
 */
export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message ?? 'An unexpected error occurred.';
  }
  return 'An unexpected error occurred.';
}

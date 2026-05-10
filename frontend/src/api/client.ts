import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://192.168.0.117:4000/api/v1',
  withCredentials: true,
});

apiClient.interceptors.response.use(
  r => r,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await apiClient.post('/auth/refresh');
        const token = data.data.accessToken;
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        original.headers['Authorization'] = `Bearer ${token}`;
        return apiClient(original);
      } catch {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

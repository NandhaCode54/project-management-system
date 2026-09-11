import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let inMemoryToken = null;

export function setAuthToken(token) {
  inMemoryToken = token || null;
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

api.interceptors.request.use((config) => {
  if (inMemoryToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${inMemoryToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'An unexpected error occurred';
    const details = error.response?.data?.error?.details;

    if (status === 401) {
      inMemoryToken = null;
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    return Promise.reject({ status, message, details });
  },
);

export default api;
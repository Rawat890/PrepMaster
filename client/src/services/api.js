const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/** Centralized fetch wrapper; credentials include the HTTP-only JWT cookie. */
export const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong. Please try again.');
    error.status = response.status;
    error.errors = data.errors || {};
    throw error;
  }
  return data;
};

import { createApiUrl, fetcher } from '../../lib/fetcher';

/**
 * Register a new user
 */
export const registerUser = async (username: string, email: string, password: string) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const error = new Error('Registration failed');
    const data = await response.json();
    (error as any).info = data;
    throw error;
  }

  return response.json();
};

/**
 * Login a user
 */
export const loginUser = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = new Error('Login failed');
    const data = await response.json();
    (error as any).info = data;
    throw error;
  }

  return response.json();
};

/**
 * Logout the current user
 */
export const logoutUser = async () => {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
  });

  if (!response.ok) {
    const error = new Error('Logout failed');
    const data = await response.json();
    (error as any).info = data;
    throw error;
  }

  return response.json();
};

/**
 * Get the current user
 */
export const getCurrentUser = async () => {
  return fetcher(createApiUrl('/auth/me'));
};

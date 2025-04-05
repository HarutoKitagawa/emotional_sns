"use client";

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { loginUser, logoutUser, registerUser } from './api';
import { User } from '@/types/user';

/**
 * Hook for managing user authentication
 */
export const useAuth = () => {
  const router = useRouter();
  const { data: user, error, isLoading, mutate } = useSWR<User|null>('/api/auth/me', async () => {
    return fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    }).then((res) => {
      if (!res.ok) {
        throw new Error('Failed to fetch user data');
      }
      return res.json();
    });
  });

  const login = async (email: string, password: string) => {
    try {
      const data = await loginUser(email, password);
      await mutate();
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const data = await registerUser(username, email, password);
      await mutate();
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      await mutate(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user,
    isLoading,
    isLoggedIn: !!user,
    login,
    register,
    logout,
  };
};

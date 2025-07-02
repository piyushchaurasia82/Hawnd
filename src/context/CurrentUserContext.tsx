import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import api, { tokenManager } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface CurrentUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

interface CurrentUserContextType {
  user: CurrentUser | null;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
}

const CurrentUserContext = createContext<CurrentUserContextType>({
  user: null,
  loading: true,
  error: '',
  refetch: async () => {},
});

export const useCurrentUser = () => useContext(CurrentUserContext);

export const CurrentUserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchUser = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch the current user using the get-profile API
      const res = await api.get('/api/projectmanagement/get-profile/');
      const u = res.data.data || res.data;
      setUser({
        id: u.id,
        username: u.username,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        isActive: u.is_active === true || u.is_active === 'true' || u.is_active === 'True' || u.is_active === 1,
      });
    } catch (err: any) {
      // If error is 401, log out
      if (err?.response?.status === 401) {
        tokenManager.clearTokens();
        if (window.location.pathname !== '/auth') {
          navigate('/auth', { replace: true });
        }
        return;
      }
      setError(err.message || 'Failed to load user data.');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch user if not on auth or forgot-password page
    if (
      window.location.pathname !== '/auth' &&
      window.location.pathname !== '/forgot-password'
    ) {
      fetchUser();
    }
  }, []);

  return (
    <CurrentUserContext.Provider value={{ user, loading, error, refetch: fetchUser }}>
      {children}
    </CurrentUserContext.Provider>
  );
}; 
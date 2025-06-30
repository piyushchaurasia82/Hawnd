import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import api, { tokenManager } from '../services/api';

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

  const fetchUser = async () => {
    setLoading(true);
    setError('');
    try {
      // Try to get user ID from token or user_data
      let userId = null;
      const userData = tokenManager.getUserData();
      if (userData && userData.id) {
        userId = userData.id;
      } else {
        const token = tokenManager.getAccessToken();
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.id || payload.user_id || payload.sub;
          } catch {}
        }
      }
      if (!userId) throw new Error('User ID not found in token');
      const res = await api.get(`/api/projectmanagement/users/${userId}/`);
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
      setError(err.message || 'Failed to load user data.');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <CurrentUserContext.Provider value={{ user, loading, error, refetch: fetchUser }}>
      {children}
    </CurrentUserContext.Provider>
  );
}; 
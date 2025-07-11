import { createContext, useContext, useEffect, useState } from 'react';
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
  userRole: string | null;
  userRoleId: string | null;
}

const CurrentUserContext = createContext<CurrentUserContextType>({
  user: null,
  loading: true,
  error: '',
  refetch: async () => {},
  userRole: null,
  userRoleId: null,
});

export const useCurrentUser = () => useContext(CurrentUserContext);

export const CurrentUserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userRoleId, setUserRoleId] = useState<string | null>(null);
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

      // Fetch all user_roles
      const allUserRolesRes = await api.get('/api/projectmanagement/user_roles/');
      const allUserRolesArr = allUserRolesRes.data.data || allUserRolesRes.data.user_roles || allUserRolesRes.data;
      // Find the user_roles entry for this user
      const userRoleEntry = Array.isArray(allUserRolesArr) ? allUserRolesArr.find((ur: any) => String(ur.user_id) === String(u.id)) : null;
      const userRoleId = userRoleEntry ? userRoleEntry.role_id : null;
      if (userRoleId) {
        // Fetch all roles
        const rolesRes = await api.get('/api/projectmanagement/roles/');
        const rolesArr = rolesRes.data.data || rolesRes.data.roles || rolesRes.data;
        const matchedRole = Array.isArray(rolesArr) ? rolesArr.find((r: any) => String(r.id) === String(userRoleId)) : null;
        if (matchedRole) {
          localStorage.setItem('user_role', matchedRole.name);
          localStorage.setItem('user_role_id', String(matchedRole.id));
          window.dispatchEvent(new Event('user_role_updated'));
          setUserRole(matchedRole.name);
          setUserRoleId(String(matchedRole.id));
        }
      }
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
    <CurrentUserContext.Provider value={{ user, loading, error, refetch: fetchUser, userRole, userRoleId }}>
      {children}
    </CurrentUserContext.Provider>
  );
}; 
import React, { useEffect, useState, createContext, useContext } from 'react';
import Switch from '../components/form/switch/Switch';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { tokenManager } from '../services/api';

// PasswordChangeContext for session-only password sharing
export const PasswordChangeContext = createContext({ lastChangedPassword: '', setLastChangedPassword: (_pw: string) => {} });
export const usePasswordChange = () => useContext(PasswordChangeContext);

const AccountSettings: React.FC = () => {
  const [form, setForm] = useState({
    id: '',
    username: '',
    firstName: '',
    lastName: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ email: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [showProfileConfirm, setShowProfileConfirm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const token = tokenManager.getAccessToken();
  const [lastChangedPassword, setLastChangedPassword] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError('');
      try {
        // Get username from tokenManager
        let username = null;
        const userData = tokenManager.getUserData();
        if (userData && userData.username) {
          username = userData.username;
        } else {
          const accessToken = tokenManager.getAccessToken();
          if (accessToken) {
            try {
              const payload = JSON.parse(atob(accessToken.split('.')[1]));
              username = payload.username || payload.user_name || payload.sub || payload.name;
            } catch {}
          }
        }
        if (!username) throw new Error('Username not found in token');
        // Fetch user by username
        const userRes = await api.get(`/api/projectmanagement/users/?username=${encodeURIComponent(username)}`);
        // Try to get the user from the response (array or data field)
        let user = null;
        if (Array.isArray(userRes.data)) {
          // Find the user with exact username match (case-sensitive)
          user = userRes.data.find((u: any) => u.username === username);
        } else if (userRes.data.data && Array.isArray(userRes.data.data)) {
          user = userRes.data.data.find((u: any) => u.username === username);
        } else if (userRes.data.data) {
          user = userRes.data.data;
        } else {
          user = userRes.data;
        }
        if (!user || !user.id) throw new Error('User not found');
        setForm({
          id: user.id,
          username: user.username || '',
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          isActive: user.is_active === true || user.is_active === 'true' || user.is_active === 'True' || user.is_active === 1,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load user data.');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Fetch email for profile details
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setProfileError('Please log in to view your profile.');
        return;
      }
      try {
        const response = await api.get('/api/projectmanagement/get-profile/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
        if (!data.email) throw new Error('Invalid response format: Email not found in response');
        setProfile({ email: data.email });
      } catch (err: any) {
        setProfileError(err.message || 'Failed to load profile.');
      }
    };
    fetchProfile();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleStatusChange = (checked: boolean) => {
    setForm({ ...form, isActive: checked });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        username: form.username,
        first_name: form.firstName,
        last_name: form.lastName,
        is_active: form.isActive ? 'True' : 'False',
      };
      await api.put(`/api/projectmanagement/users/${form.id}/`, payload);
      setSuccess('Account settings updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update account settings.');
    } finally {
      setSaving(false);
    }
  };

  // Add handlers for profile and password change
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowProfileConfirm(true);
  };
  const confirmProfileUpdate = async () => {
    if (!token) {
      setProfileError('Please log in to update your profile.');
      setShowProfileConfirm(false);
      return;
    }
    setShowProfileConfirm(false);
    setProfileMsg('');
    setProfileError('');
    setLoading(true);
    try {
      const response = await api.put('/api/projectmanagement/update-profile/1/', { email: profile.email }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      setProfileMsg(data.message || 'Profile updated successfully.');
    } catch (err: any) {
      setProfileError(err.message || 'Profile update failed.');
    } finally {
      setLoading(false);
    }
  };
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/.test(newPassword)) {
      setPwError('Password must be at least 8 characters, include a number and a special character.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwError('New password and confirm password do not match.');
      return;
    }
    setShowPwConfirm(true);
  };
  const confirmPasswordChange = async () => {
    if (!token) {
      setPwError('Please log in to change your password.');
      setShowPwConfirm(false);
      return;
    }
    setShowPwConfirm(false);
    setPwMsg('');
    setPwError('');
    setPwLoading(true);
    try {
      const response = await api.post('/api/projectmanagement/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      setPwMsg(data.message || 'Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setLastChangedPassword(newPassword);
    } catch (err: any) {
      setPwError(err.message || 'Password change failed.');
    } finally {
      setPwLoading(false);
    }
  };
  const toggleOldPasswordVisibility = () => setShowOldPassword(!showOldPassword);
  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);

  if (loading) {
    return <div className="p-8 text-center text-lg">Loading...</div>;
  }

  return (
    <PasswordChangeContext.Provider value={{ lastChangedPassword, setLastChangedPassword }}>
      <div className="min-h-screen bg-white px-6 py-10">
        <h1 className="text-2xl font-semibold mb-8 text-gray-900">Account Settings</h1>
        <form onSubmit={handleSave} className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <label className="block mb-2 font-medium text-gray-900 text-sm">User Name</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter user name"
                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-gray-900 text-sm">First Name</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-gray-900 text-sm">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Enter last name"
                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-16">
            <div className="bg-gray-50 rounded-xl p-6 w-full md:w-auto mb-8 md:mb-0">
              <div className="mb-2 font-medium text-gray-900 text-sm">Status</div>
              <div className="flex items-center gap-4">
                <Switch
                  label={form.isActive ? 'Active' : 'Inactive'}
                  defaultChecked={form.isActive}
                  onChange={handleStatusChange}
                  color="blue"
                />
              </div>
            </div>
            <div className="flex gap-4 justify-end w-full md:w-auto">
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg shadow transition"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold px-8 py-3 rounded-lg shadow border border-gray-300 transition"
                onClick={() => navigate(-1)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
          {error && <div className="text-red-600 mt-4">{error}</div>}
          {success && <div className="text-green-600 mt-4">{success}</div>}
          <div className="mt-12 mb-8">
            <form onSubmit={handleProfileSubmit} className="mb-10">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Details</h2>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1 font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>
              {profileMsg && <div className="text-green-600 mb-2">{profileMsg}</div>}
              {profileError && <div className="text-red-600 mb-2">{profileError}</div>}
              <button
                type="submit"
                className="bg-orange-500 text-white px-6 py-2 rounded-md font-semibold hover:bg-orange-600 transition"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
            <form onSubmit={handlePasswordSubmit}>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>
              <div className="mb-4 relative">
                <label className="block text-gray-700 mb-1 font-medium">Old Password</label>
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
                <button
                  type="button"
                  onClick={toggleOldPasswordVisibility}
                  className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
                >
                  {/* Eye icon logic as in EditProfile */}
                  {showOldPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  )}
                </button>
              </div>
              <div className="mb-4 relative">
                <label className="block text-gray-700 mb-1 font-medium">New Password</label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
                <button
                  type="button"
                  onClick={toggleNewPasswordVisibility}
                  className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  )}
                </button>
                <div className="text-xs text-gray-500 mt-1">At least 8 characters, a number, and a special character.</div>
              </div>
              <div className="mb-4 relative">
                <label className="block text-gray-700 mb-1 font-medium">Confirm New Password</label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>
              {pwMsg && <div className="text-green-600 mb-2">{pwMsg}</div>}
              {pwError && <div className="text-red-600 mb-2">{pwError}</div>}
              <button
                type="submit"
                className="bg-orange-500 text-white px-6 py-2 rounded-md font-semibold hover:bg-orange-600 transition"
                disabled={pwLoading}
              >
                {pwLoading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
            {/* Confirmation Modals */}
            {showProfileConfirm && (
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent backdrop-blur-sm">
                <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-xl max-w-sm w-full text-center border border-gray-300">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">Confirm Profile Update</h3>
                  <p className="mb-6 text-gray-700">Are you sure you want to save these changes?</p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={confirmProfileUpdate}
                      className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-semibold"
                    >
                      Yes, Save Changes
                    </button>
                    <button
                      onClick={() => setShowProfileConfirm(false)}
                      className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showPwConfirm && (
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent backdrop-blur-sm">
                <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-xl max-w-sm w-full text-center border border-gray-300">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">Confirm Password Change</h3>
                  <p className="mb-6 text-gray-700">Are you sure you want to change your password?</p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={confirmPasswordChange}
                      className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-semibold"
                    >
                      Yes, Change Password
                    </button>
                    <button
                      onClick={() => setShowPwConfirm(false)}
                      className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </PasswordChangeContext.Provider>
  );
};

export default AccountSettings; 
import React, { useEffect, useState, createContext, useContext } from 'react';
import Switch from '../components/form/switch/Switch';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { tokenManager } from '../services/api';
import { useCurrentUser } from '../context/CurrentUserContext';
import { useToast } from '../components/ui/alert/ToastContext';

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
    email: '',
    hashed_password: '',
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
  const { user: currentUser } = useCurrentUser();
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStatus, setOtpStatus] = useState<'idle' | 'pending' | 'sent' | 'verified' | 'error'>('idle');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpIntervalId, setOtpIntervalId] = useState<NodeJS.Timeout | null>(null);
  const { showToast } = useToast();

  // Refactored fetchUser to support fetching by user ID or username
  const fetchUser = async (idOverride: string | null = null) => {
    setLoading(true);
    setError('');
    try {
      let user = null;
      let userId = idOverride || form.id;
      if (userId) {
        // Fetch by ID if available
        const userRes = await api.get(`/api/projectmanagement/users/${userId}/`);
        user = userRes.data.data || userRes.data;
      } else {
        // Fallback to username (first load)
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
        const userRes = await api.get(`/api/projectmanagement/users/?username=${encodeURIComponent(username)}`);
        if (Array.isArray(userRes.data)) {
          user = userRes.data.find((u: any) => u.username === username);
        } else if (userRes.data.data && Array.isArray(userRes.data.data)) {
          user = userRes.data.data.find((u: any) => u.username === username);
        } else if (userRes.data.data) {
          user = userRes.data.data;
        } else {
          user = userRes.data;
        }
      }
      if (!user || !user.id) throw new Error('User not found');
      setForm({
        id: user.id,
        username: user.username || '',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        isActive: user.is_active === true || user.is_active === 'true' || user.is_active === 'True' || user.is_active === 1,
        email: user.email || '',
        hashed_password: user.hashed_password || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load user data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser(currentUser?.id || null);
  }, [currentUser]);

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
        // Try to extract email from possible locations
        const email = data.email || (data.data && data.data.email) || (data.user && data.user.email);
        if (!email) throw new Error('Invalid response format: Email not found in response');
        setProfile({ email });
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
        email: form.email,
        hashed_password: form.hashed_password,
      };
      await api.put(`/api/projectmanagement/users/${form.id}/`, payload);
      setSuccess('Account settings updated successfully.');
      showToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile details have been updated successfully.',
        duration: 4000
      });
      await fetchUser(form.id || null); // Reload user details after save using ID
    } catch (err: any) {
      setError(err.message || 'Failed to update account settings.');
    } finally {
      setSaving(false);
    }
  };

  // Add handlers for profile and password change
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowProfileConfirm(false);
    setProfileMsg('');
    setProfileError('');
    setLoading(true);
    if (newEmail && newEmail !== form.email) {
      setOtpStatus('pending');
      setOtpLoading(true);
      try {
        // 1. Verify OTP
        await api.post('/api/projectmanagement/verify-user-verification-otp/', { email: form.email, otp });
        setOtpStatus('verified');
        setOtpLoading(true);
        showToast({
          type: 'success',
          title: 'OTP Verified',
          message: 'Your OTP has been verified. Updating email...',
          duration: 4000
        });
        // 2. Update user with new email (send all fields)
        const updatePayload = {
          username: form.username,
          first_name: form.firstName,
          last_name: form.lastName,
          is_active: form.isActive ? 'True' : 'False',
          email: newEmail,
        };
        try {
          await api.put(`/api/projectmanagement/users/${form.id}/`, updatePayload);
        } catch (err) {
          throw err;
        }
        setForm({ ...form, email: newEmail });
        setProfile({ ...profile, email: newEmail });
        setNewEmail('');
        setOtp('');
        showToast({
          type: 'success',
          title: 'Email Updated',
          message: 'Your email has been updated successfully.',
          duration: 5000
        });
        // Optionally re-fetch user data for full sync
        setTimeout(async () => {
          await fetchUser(form.id || null);
        }, 500);
      } catch (err: any) {
        setOtpStatus('error');
        showToast({
          type: 'error',
          title: 'Update Failed',
          message: err.message || 'OTP verification or email update failed.',
          duration: 5000
        });
        setLoading(false);
        return;
      } finally {
        setOtpLoading(false);
      }
    }
    setLoading(false);
    setProfileMsg('Profile updated successfully.');
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

  // Send OTP to current email, require new email to be filled
  const handleSendOtp = async () => {
    if (!newEmail) {
      setOtpStatus('error');
      return;
    }
    setOtpStatus('pending');
    setOtpLoading(true);
    try {
      await api.post('/api/projectmanagement/send-user-verification-otp/', { email: form.email });
      setOtpStatus('sent');
      showToast({
        type: 'success',
        title: 'OTP Sent',
        message: 'OTP has been sent to your current email.',
        duration: 5000
      });
      setOtpTimer(30);
      if (otpIntervalId) clearInterval(otpIntervalId);
      const interval = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setOtpIntervalId(interval);
    } catch (err: any) {
      setOtpStatus('error');
    } finally {
      setOtpLoading(false);
    }
  };

  // Clean up timer on unmount
  React.useEffect(() => {
    return () => {
      if (otpIntervalId) clearInterval(otpIntervalId);
    };
  }, [otpIntervalId]);

  if (loading) {
    return <div className="p-8 text-center text-lg">Loading...</div>;
  }

  return (
    <PasswordChangeContext.Provider value={{ lastChangedPassword, setLastChangedPassword }}>
      <div className="min-h-screen bg-white px-6 py-10">
        <h1 className="text-2xl font-semibold mb-8 pl-19 text-gray-900">Account Settings</h1>
        <form onSubmit={handleSave} className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <label className="block mb-2 font-medium text-gray-900 text-sm">User Name</label>
              <input
                type="text"
                name="username"
                value={form.username}
                placeholder="Enter user name"
                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                disabled
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
                onClick={() => navigate('/')}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
          {error && <div className="text-red-600 mt-4">{error}</div>}
          {success && <div className="text-green-600 mt-4">{success}</div>}
          <div className="mt-12 mb-8">
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Details</h2>
              {/* Email Change with OTP UI */}
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="w-full md:w-1/2">
                  <label className="block text-gray-700 mb-1 font-medium">Current Email</label>
                  <input
                    type="email"
                    name="emailToChange"
                    value={form.email}
                    readOnly
                    className="w-full h-12 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium py-1 px-2 cursor-not-allowed"
                  />
                </div>
                <div className="w-full md:w-1/2 flex flex-col">
                  <label className="block text-gray-700 mb-1 font-medium">New Email</label>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      name="newEmail"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="Enter new email"
                      className="w-full h-12 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium py-1 px-2 pr-28"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-sm bg-orange-500 text-white px-4 py-1 rounded hover:bg-orange-600 transition disabled:opacity-50"
                      onClick={handleSendOtp}
                      disabled={otpLoading || !form.email || !newEmail || otpTimer > 0}
                    >
                      {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : (otpStatus === 'sent' || otpStatus === 'verified' ? 'Resend OTP' : 'Send OTP')}
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-gray-700 mb-1 font-medium">Verify OTP</label>
                    <div className="bg-gray-100 rounded-md p-3">
                      <input
                        type="text"
                        name="otp"
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                        placeholder="Enter OTP"
                        className="w-full bg-transparent border-none outline-none text-sm font-medium py-1"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="bg-orange-500 h-12 text-white px-6 py-2 rounded-md font-semibold hover:bg-orange-600 transition whitespace-nowrap mt-7"
                    disabled={loading}
                    onClick={handleProfileSubmit}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
              {/* End Email Change with OTP UI */}
              {profileMsg && <div className="text-green-600 mb-2">{profileMsg}</div>}
              {profileError && <div className="text-red-600 mb-2">{profileError}</div>}
            </div>
          </div>
        </form>
        {/* Move the password change form outside the main form */}
        <div className="max-w-6xl mx-auto mb-8">
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
        </div>
        {/* Confirmation Modals remain outside both forms */}
        {showProfileConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent backdrop-blur-sm">
            <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-xl max-w-sm w-full text-center border border-gray-300">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Confirm Profile Update</h3>
              <p className="mb-6 text-gray-700">Are you sure you want to save these changes?</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleProfileSubmit}
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
    </PasswordChangeContext.Provider>
  );
};

export default AccountSettings; 
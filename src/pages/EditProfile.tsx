import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHeaderVisibility } from "../context/HeaderVisibilityContext";
import api from '../services/api';

interface Profile {
  email: string;
}

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({ email: "" });
  const [profileMsg, setProfileMsg] = useState<string>("");
  const [profileError, setProfileError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showProfileConfirm, setShowProfileConfirm] = useState<boolean>(false);
  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [pwMsg, setPwMsg] = useState<string>("");
  const [pwError, setPwError] = useState<string>("");
  const [pwLoading, setPwLoading] = useState<boolean>(false);
  const [showPwConfirm, setShowPwConfirm] = useState<boolean>(false);
  const [showOldPassword, setShowOldPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");
  const { setHeaderHidden } = useHeaderVisibility();

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setProfileError("Please log in to view your profile.");
        return;
      }
      setLoading(true);
      setProfileError("");
      try {
        const response = await api.get('/api/projectmanagement/get-profile/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = response.data;
        if (!data.email) {
          throw new Error(
            "Invalid response format: Email not found in response"
          );
        }
        setProfile({ email: data.email });
      } catch (err: any) {
        setProfileError(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  useEffect(() => {
    if (showProfileConfirm || showPwConfirm) {
      setHeaderHidden(true);
    } else {
      setHeaderHidden(false);
    }
    return () => setHeaderHidden(false);
  }, [showProfileConfirm, showPwConfirm, setHeaderHidden]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowProfileConfirm(true);
  };

  const confirmProfileUpdate = async () => {
    if (!token) {
      setProfileError("Please log in to update your profile.");
      setShowProfileConfirm(false);
      return;
    }
    setShowProfileConfirm(false);
    setProfileMsg("");
    setProfileError("");
    setLoading(true);
    try {
      const response = await api.put('/api/projectmanagement/update-profile/1/', { email: profile.email }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = response.data;
      setProfileMsg(data.message || "Profile updated successfully.");
    } catch (err: any) {
      setProfileError(err.message || "Profile update failed.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/.test(newPassword)
    ) {
      setPwError(
        "Password must be at least 8 characters, include a number and a special character."
      );
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwError("New password and confirm password do not match.");
      return;
    }
    setShowPwConfirm(true);
  };

  const confirmPasswordChange = async () => {
    if (!token) {
      setPwError("Please log in to change your password.");
      setShowPwConfirm(false);
      return;
    }
    setShowPwConfirm(false);
    setPwMsg("");
    setPwError("");
    setPwLoading(true);
    try {
      const response = await api.post('/api/projectmanagement/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = response.data;
      setPwMsg(data.message || "Password changed successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      setPwError(err.message || "Password change failed.");
    } finally {
      setPwLoading(false);
    }
  };

  const toggleOldPasswordVisibility = () => {
    setShowOldPassword(!showOldPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-lg shadow-lg p-3 sm:p-8 mt-2 sm:mt-8 relative text-sm sm:text-base">
      {/* Responsive header row: button left, heading center on mobile; stacked on desktop */}
      <div className="mb-2 sm:mb-4">
        <button
          type="button"
          className="flex items-center text-orange-500 hover:text-orange-600 font-semibold px-2 py-1"
          onClick={() => navigate('/')}
          style={{ zIndex: 30 }}
          disabled={showProfileConfirm || showPwConfirm}
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-base">Back</span>
        </button>
      </div>
      <div className="mb-6 sm:mb-8 w-full flex justify-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-orange-500 text-center break-words w-full">
          Edit Profile
        </h1>
      </div>
      <form onSubmit={handleProfileSubmit} className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Profile Details
        </h2>
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
        {profileError && (
          <div className="text-red-600 mb-2">{profileError}</div>
        )}
        <button
          type="submit"
          className="bg-orange-500 text-white px-6 py-2 rounded-md font-semibold hover:bg-orange-600 transition"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
      <form onSubmit={handlePasswordSubmit}>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Change Password
        </h2>
        <div className="mb-4 relative">
          <label className="block text-gray-700 mb-1 font-medium">
            Old Password
          </label>
          <input
            type={showOldPassword ? "text" : "password"}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-400"
            required
          />
          <button
            type="button"
            onClick={toggleOldPasswordVisibility}
            className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
          >
            {showOldPassword ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
        <div className="mb-4 relative">
          <label className="block text-gray-700 mb-1 font-medium">
            New Password
          </label>
          <input
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-400"
            required
          />
          <button
            type="button"
            onClick={toggleNewPasswordVisibility}
            className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
          >
            {showNewPassword ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
          <div className="text-xs text-gray-500 mt-1">
            At least 8 characters, a number, and a special character.
          </div>
        </div>
        <div className="mb-4 relative">
          <label className="block text-gray-700 mb-1 font-medium">
            Confirm New Password
          </label>
          <input
            type={showNewPassword ? "text" : "password"}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
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
          {pwLoading ? "Changing..." : "Change Password"}
        </button>
      </form>
      {/* Confirmation Modals - styled like sign out confirmation */}
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
  );
};

export default EditProfile;

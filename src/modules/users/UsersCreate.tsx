import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Eye, EyeOff } from 'lucide-react';

const UsersCreate: React.FC = () => {
  const navigate = useNavigate();
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [tokenStatus, setTokenStatus] = useState<'Pending' | 'Valid' | 'Invalid'>('Pending');
  const [role, setRole] = useState('');
  const [rolesOptions, setRolesOptions] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenValidated, setTokenValidated] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch roles, projects, tasks
  useEffect(() => {
    async function fetchOptions() {
      try {
        const [rolesRes] = await Promise.all([
          api.get('/api/projectmanagement/roles/'),
        ]);
        setRolesOptions((rolesRes.data.data || rolesRes.data.roles || rolesRes.data).map((r: any) => ({ value: r.id, label: r.name || r.description })));
      } catch (e) {
        // fallback to empty
      }
    }
    fetchOptions();
  }, []);

  // Email verification token logic (UI only)
  const handleSendToken = async () => {
    setTokenLoading(true);
    setTimeout(() => {
      setTokenLoading(false);
      setTokenStatus('Pending');
      setOtpTimer(30);
    }, 1000);
  };
  const handleValidateToken = async () => {
    setTokenLoading(true);
    setTimeout(() => {
      setTokenLoading(false);
      setTokenStatus(verificationToken === '123456' ? 'Valid' : 'Invalid');
      setTokenValidated(verificationToken === '123456');
    }, 1000);
  };

  // OTP resend timer logic
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  // Save handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!fullName || !email || !password || !confirmPassword) {
        setError('Please fill all required fields.');
        setLoading(false);
        return;
      }
      // Password validation
      const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
      if (!passwordRegex.test(password)) {
        setError('Password must be at least 8 characters, include one uppercase letter and one special character.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
      // Split full name
      const [first_name, ...rest] = fullName.trim().split(' ');
      const last_name = rest.join(' ');
      await api.post('/api/projectmanagement/users/', {
        first_name,
        last_name,
        email,
        hashed_password: password,
        role_id: role,
      });
      navigate('/users');
    } catch (err: any) {
      setError('Error creating user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 mb-2 flex gap-1">
        <button type="button" onClick={() => navigate('/')} className="hover:underline hover:text-black focus:outline-none bg-transparent p-0 m-0">Home</button>
        <span>/</span>
        <button type="button" onClick={() => navigate('/users')} className="hover:underline hover:text-black focus:outline-none bg-transparent p-0 m-0">Users</button>
        <span>/</span>
        <span className="font-semibold text-black">Create New User</span>
      </nav>
      <h1 className="text-2xl font-bold mb-6">Add New User</h1>
      <form onSubmit={handleSubmit}>
        {/* User Information */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block font-semibold mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Enter full name"
                className="w-full rounded bg-gray-100 h-12 p-3 text-sm placeholder-gray-400"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <label className="block font-semibold mb-1">Email</label>
              <input
                type="email"
                placeholder="Enter email"
                className="w-full rounded bg-gray-100 h-12 p-3 text-sm placeholder-gray-400 pr-32"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <span
                className={`absolute right-4 top-1/2 -translate-y-1/5 text-xs font-medium cursor-pointer select-none ${tokenLoading || otpTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:underline'}`}
                onClick={() => {
                  if (!tokenLoading && otpTimer === 0) handleSendToken();
                }}
                style={{ userSelect: 'none' }}
              >
                {tokenLoading
                  ? 'Sending...'
                  : otpTimer > 0
                    ? `Resend OTP in ${otpTimer}s`
                    : (otpTimer === 0 ? (tokenValidated ? 'Resend OTP' : 'Send OTP') : 'Send OTP')}
              </span>
            </div>
            <div>
              <label className="block font-semibold mb-1">Verification Token</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter verification token"
                  className="w-full rounded bg-gray-100 h-12 p-3 text-sm placeholder-gray-400"
                  value={verificationToken}
                  onChange={e => setVerificationToken(e.target.value)}
                />
                <button
                  type="button"
                  className="bg-gray-100 rounded px-4 text-sm font-semibold border border-gray-200"
                  onClick={handleValidateToken}
                  disabled={tokenLoading}
                >
                  {tokenLoading ? '...' : 'Validate'}
                </button>
              </div>
              <div className="text-xs mt-1 text-gray-600">Token Status: {tokenStatus}</div>
            </div>
            <div className="relative">
              <label className="block font-semibold mb-1">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                className="w-full rounded bg-gray-100 h-12 p-3 text-sm placeholder-gray-400 pr-14"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-4 inset-y-0 flex items-center bg-transparent border-0 p-0 m-0"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ width: 24, height: '100%', transform: 'translateY(14px)' }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="relative">
              <label className="block font-semibold mb-1">Confirm Password</label>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                className="w-full rounded bg-gray-100 h-12 p-3 text-sm placeholder-gray-400 pr-14"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-4 inset-y-0 flex items-center bg-transparent border-0 p-0 m-0"
                tabIndex={-1}
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                style={{ width: 24, height: '100%', transform: 'translateY(14px)' }}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        </div>
        {/* Roles */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Roles</h2>
          <div className="max-w-xs relative">
            <div className="relative">
              <select
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-300 dark:bg-white dark:text-black dark:placeholder:text-gray-500 dark:focus:border-brand-800"
                value={role}
                onChange={e => {
                  if (e.target.value === '__create__') {
                    navigate('/roles/create?from=users-create');
                  } else {
                    setRole(e.target.value);
                  }
                }}
              >
                <option value="" disabled>Role</option>
                <option value="__create__">+ Create new role</option>
                {rolesOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {/* Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg transition bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 text-sm"
            disabled={loading}
          >
            Save
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg transition bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 font-bold px-8 py-3 text-sm"
            onClick={() => navigate('/users')}
          >
            Cancel
          </button>
        </div>
        {error && <div className="text-red-600 mt-2 text-xs">{error}</div>}
      </form>
    </div>
  );
};

export default UsersCreate;

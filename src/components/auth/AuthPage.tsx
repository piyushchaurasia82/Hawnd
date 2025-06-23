import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api, { tokenManager } from '../../services/api';

// Define a type for your message modal
interface Message {
  type: 'success' | 'error' | 'info';
  title: string;
  body: string | React.ReactNode;
  buttonText: string;
}

// Add decodeJwt function to extract token details including expiry
function decodeJwt(token: string) {
  if (!token) return null;
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null);

  const navigate = useNavigate();

  // Helper function to set the message state
  const displayMessage = (type: Message['type'], title: string, body: string | React.ReactNode, buttonText: string = 'Close') => {
    setMessage({ type, title, body, buttonText });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null); // Clear any previous messages

    if (!isLoginView) { // Sign-Up logic
      if (password !== confirmPassword) {
        displayMessage('error', 'Error', 'Passwords do not match.');
        return;
      }

      try {
        const response = await api.post('/api/projectmanagement/signup/', {
            username: username,
            email: email,
            password: password,
            organisation: 1,
          person: 1,
           // Request 90-day access token
          refresh_lifetime: '90d' // Request 90-day refresh token
        });

        console.log('Sign-up API response:', response.data);

        if (response.data.status === 'success') {
          displayMessage('success', 'Sign Up Successful!', 'Your account has been created. You can now log in.');
          setIsLoginView(true);
          setUsername('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        } else {
          displayMessage('error', 'Registration Failed!', response.data.message || 'Sign up failed. Please try again.');
        }
      } catch (error: any) {
        console.error('Error during signup:', error);
        
          let mainErrorMessage: string = 'Sign up failed. Please try again.';
          let detailedErrorBody: React.ReactNode | null = null;

        if (error.response?.data) {
          const data = error.response.data;
          
            if (data.message && typeof data.message === 'string') {
              mainErrorMessage = data.message;
            }

            if (data.data && typeof data.data === 'object' && Object.keys(data.data).length > 0) {
              const fieldErrorNodes: React.ReactNode[] = [];
              for (const key in data.data) {
                if (Object.prototype.hasOwnProperty.call(data.data, key)) {
                  if (Array.isArray(data.data[key])) {
                    fieldErrorNodes.push(
                      <p key={key} className="text-sm">
                        <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {data.data[key].join(', ')}
                      </p>
                    );
                  } else if (typeof data.data[key] === 'string') {
                    fieldErrorNodes.push(
                      <p key={key} className="text-sm">
                        <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {data.data[key]}
                      </p>
                    );
                  }
                }
              }
              if (fieldErrorNodes.length > 0) {
                detailedErrorBody = (
                  <>
                    <p className="mb-2 font-medium">Details:</p>
                    {fieldErrorNodes}
                  </>
                );
              }
          }
          }

          const finalErrorBody = detailedErrorBody ? (
            <>
              {mainErrorMessage}
              <br /><br />
              {detailedErrorBody}
            </>
          ) : mainErrorMessage;

          displayMessage('error', 'Registration Failed!', finalErrorBody);
      }
    } else { // Login logic
      try {
        const response = await api.post('/api/projectmanagement/login/', {
            username: username,
            password: password,
            // Request 90-day access token
          refresh_lifetime: '90d' // Request 90-day refresh token
        });

        console.log('Login API response:', response.data);

        if (response.data.status === 'success') {
          // Store tokens using tokenManager
          if (response.data.data && response.data.data.access && response.data.data.refresh) {
            tokenManager.setTokens(response.data.data.access, response.data.data.refresh, { username });
            console.log('Tokens and username stored successfully');
          }

          // Directly navigate to dashboard after successful login
          navigate('/');
          return;
        } else {
          displayMessage('error', 'Login Failed', response.data.message || 'Unexpected response from server. Please try again.');
        }
      } catch (error: any) {
        console.error('Error during login:', error);
        let mainErrorMessage: string = 'Login failed. Please try again.';
        let detailedErrorBody: React.ReactNode | null = null;

        // Show a user-friendly message for invalid credentials
        if (error.response?.status === 401 || (error.response?.data && error.response.data.message && /invalid/i.test(error.response.data.message))) {
          mainErrorMessage = 'Invalid credentials entered';
        } else if (error.response?.data) {
          const data = error.response.data;
          if (data.message && typeof data.message === 'string') {
            mainErrorMessage = data.message;
          }
          if (data.data && typeof data.data === 'object' && Object.keys(data.data).length > 0) {
            const fieldErrorNodes: React.ReactNode[] = [];
            for (const key in data.data) {
              if (Object.prototype.hasOwnProperty.call(data.data, key)) {
                if (Array.isArray(data.data[key])) {
                  fieldErrorNodes.push(
                    <p key={key} className="text-sm">
                      <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {data.data[key].join(', ')}
                    </p>
                  );
                } else if (typeof data.data[key] === 'string') {
                  fieldErrorNodes.push(
                    <p key={key} className="text-sm">
                      <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {data.data[key]}
                    </p>
                  );
                }
              }
            }
            if (fieldErrorNodes.length > 0) {
              detailedErrorBody = (
                <>
                  <p className="mb-2 font-medium">Details:</p>
                  {fieldErrorNodes}
                </>
              );
            }
          }
        }

        const finalErrorBody = detailedErrorBody ? (
          <>
            {mainErrorMessage}
            <br /><br />
            {detailedErrorBody}
          </>
        ) : mainErrorMessage;

        displayMessage('error', 'Login Failed!', finalErrorBody);
      }
    }
  };

  const handleCloseMessage = () => {
    setMessage(null);
  };

  // Helper to determine message box colors based on type
  const getMessageColors = (type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success':
        return {
          titleColor: 'text-green-600',
          buttonBg: 'bg-green-500 hover:bg-green-600',
          modalBg: 'bg-green-100',
        };
      case 'error':
        return {
          titleColor: 'text-red-600',
          buttonBg: 'bg-red-500 hover:bg-red-600',
          modalBg: 'bg-red-100',
        };
      case 'info':
        return {
          titleColor: 'text-gray-800',
          buttonBg: 'bg-[#f39c12] hover:bg-[#e68a00]',
          modalBg: 'bg-blue-100',
        };
      default:
        return {
          titleColor: 'text-gray-800',
          buttonBg: 'bg-gray-500 hover:bg-gray-600',
          modalBg: 'bg-white',
        };
    }
  };

  const messageColors = message ? getMessageColors(message.type) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#b3d8fd] to-[#eaf6ff] font-inter">
      <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl px-8 py-10 w-full max-w-md text-center">
        {/* Logo */}
        <img src="/images/logo/logo.png" alt="ebizneeds logo" className="mx-auto mb-4 w-48" />
        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl font-bold text-[#f39c12] mb-2">Hey You, Let's Get In</h2>
        <p className="text-xl font-semibold text-gray-900 mb-8">Welcome back, legend</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          {isLoginView ? (
            <>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#f39c12] focus:ring-2 focus:ring-[#f39c12] focus:ring-opacity-20 transition-all duration-300"
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-md bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#f39c12] focus:ring-2 focus:ring-[#f39c12] focus:ring-opacity-20 transition-all duration-300"
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2 mb-2">
                <div></div>
                <span
                  className="text-[#f39c12] font-semibold hover:underline cursor-pointer"
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot Password?
                </span>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-[#f39c12] text-white rounded-md font-semibold text-lg hover:bg-[#e68a00] transition-all duration-300 shadow-md"
              >
                Sign In
              </button>
              {/* Google Auth Separator and Button */}
              <div className="relative my-8 flex items-center justify-center">
                <div className="absolute inset-x-0 h-px bg-gray-200"></div>
                <span className="relative z-10 bg-white px-4 text-sm text-gray-500">Or login with</span>
              </div>
              <div className="flex justify-center mb-6">
                <GoogleLogin
                  onSuccess={credentialResponse => {
                    const idToken = credentialResponse.credential;
                    if (idToken) {
                      const decoded = decodeJwt(idToken);
                      console.log('Decoded Google ID Token:', decoded);
                    }
                    console.log(credentialResponse);
                  }}
                  onError={() => {
                    console.log('Login Failed');
                  }}
                  width="320"
                  size="large"
                  theme="outline"
                  text="signin_with"
                  shape="circle"
                />
              </div>
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#f39c12] focus:ring-2 focus:ring-[#f39c12] focus:ring-opacity-20 transition-all duration-300"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#f39c12] focus:ring-2 focus:ring-[#f39c12] focus:ring-opacity-20 transition-all duration-300"
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-md bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#f39c12] focus:ring-2 focus:ring-[#f39c12] focus:ring-opacity-20 transition-all duration-300"
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-md bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#f39c12] focus:ring-2 focus:ring-[#f39c12] focus:ring-opacity-20 transition-all duration-300"
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-[#f39c12] text-white rounded-md font-semibold text-lg hover:bg-[#e68a00] transition-all duration-300 shadow-md"
              >
                Sign Up
              </button>
            </>
          )}
        </form>
        {/* Toggle between login and sign-up views */}
        <p className="text-sm text-gray-600 mt-8">
          {isLoginView ? "Don't have an account?" : "Already have an account?"}{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setIsLoginView(!isLoginView);
              setUsername('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setMessage(null);
            }}
            className="text-[#f39c12] hover:text-[#e68a00] hover:underline font-semibold transition-colors duration-300"
          >
            {isLoginView ? 'Sign Up' : 'Login'}
          </a>
        </p>
        {/* Message Modal - Conditionally Rendered */}
        {message && messageColors && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className={`bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center ${messageColors.modalBg}`}>
              <h3 className={`text-xl font-semibold mb-4 ${messageColors.titleColor}`}>{message.title}</h3>
              <div className="text-gray-700 mb-4 text-left whitespace-pre-wrap">{message.body}</div>
              <button
                onClick={handleCloseMessage}
                className={`mt-6 px-6 py-2 text-white rounded-md transition-colors ${messageColors.buttonBg}`}
              >
                {message.buttonText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
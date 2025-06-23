import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react'; // Using lucide-react for icons

const SignUp: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      // Using a simple message box for demonstration, in a real app, use a custom modal or form validation
      const messageBox = document.createElement('div');
      messageBox.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50';
      messageBox.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm text-center">
          <h3 class="text-xl font-semibold mb-4 text-red-600">Error</h3>
          <p class="text-gray-700 mb-4">Passwords do not match.</p>
          <button id="closeMessageBox" class="mt-6 px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">Close</button>
        </div>
      `;
      document.body.appendChild(messageBox);

      document.getElementById('closeMessageBox')?.addEventListener('click', () => {
        document.body.removeChild(messageBox);
      });
      return;
    }
    // In a real application, you would send this to a registration API
    console.log('Sign-up attempt:', { username, password });
    const messageBox = document.createElement('div');
    messageBox.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50';
    messageBox.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm text-center">
        <h3 class="text-xl font-semibold mb-4 text-gray-800">Sign-Up Info</h3>
        <p class="text-gray-700 mb-4">Username: ${username}</p>
        <p class="text-gray-700 mb-4">Password: ${password}</p>
        <p class="text-gray-600 text-sm">Sign-up functionality not implemented in this demo. Check console for values.</p>
        <button id="closeMessageBox" class="mt-6 px-6 py-2 bg-[#f39c12] text-white rounded-md hover:bg-[#e68a00] transition-colors">Close</button>
      </div>
    `;
    document.body.appendChild(messageBox);

    document.getElementById('closeMessageBox')?.addEventListener('click', () => {
      document.body.removeChild(messageBox);
    });
  };

  return (
    // Main container for the sign-up page, centered vertically and horizontally
    <div className="min-h-screen flex items-center justify-center bg-[#f7f1eb] p-4 sm:p-6 lg:p-8 font-inter">
      {/* Sign-up card container */}
      <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8 md:p-10 w-full max-w-sm md:max-w-md text-center animate-fade-in">
        {/* Title and subtitle */}
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Join eBizneeds!</h2>
        <p className="text-base sm:text-lg text-gray-600 mb-8">Create your account to get started.</p>

        {/* Sign-up form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username/Email input group */}
          <div className="text-left">
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
              Username or Email
            </label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 placeholder-gray-500
                         focus:outline-none focus:border-[#f39c12] focus:ring-2 focus:ring-[#f39c12] focus:ring-opacity-20
                         transition-all duration-300 ease-in-out"
            />
          </div>

          {/* Password input group */}
          <div className="text-left">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 placeholder-gray-500
                           focus:outline-none focus:border-[#f39c12] focus:ring-2 focus:ring-[#f39c12] focus:ring-opacity-20
                           transition-all duration-300 ease-in-out"
              />
              {/* Eye icon for show/hide password */}
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
            </div>
          </div>

          {/* Confirm Password input group */}
          <div className="text-left">
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 placeholder-gray-500
                           focus:outline-none focus:border-[#f39c12] focus:ring-2 focus:ring-[#f39c12] focus:ring-opacity-20
                           transition-all duration-300 ease-in-out"
              />
              {/* Eye icon for show/hide confirm password */}
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
            </div>
          </div>

          {/* Sign-up button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-[#f39c12] text-white rounded-lg font-semibold text-lg
                       hover:bg-[#e68a00] hover:-translate-y-0.5 active:translate-y-0
                       transition-all duration-300 ease-in-out shadow-md hover:shadow-lg"
          >
            Sign Up
          </button>
        </form>

        {/* Social sign-up separator */}
        <div className="relative my-8 flex items-center justify-center">
          <div className="absolute inset-x-0 h-px bg-gray-200"></div>
          <span className="relative z-10 bg-white px-4 text-sm text-gray-500">Or sign up with</span>
        </div>

        {/* Social sign-up buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            className="flex-1 flex items-center justify-center py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-semibold
                       hover:bg-gray-100 hover:border-gray-400 transition-all duration-300 ease-in-out shadow-sm"
          >
            <img src="https://img.icons8.com/color/48/google-logo.png" alt="Google" className="w-5 h-5 mr-3" />
            Google
          </button>
          <button
            className="flex-1 flex items-center justify-center py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-semibold
                       hover:bg-gray-100 hover:border-gray-400 transition-all duration-300 ease-in-out shadow-sm"
          >
            <img src="https://img.icons8.com/color/48/facebook-new.png" alt="Facebook" className="w-5 h-5 mr-3" />
            Facebook
          </button>
        </div>

        {/* Already have an account text */}
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <a href="#" className="text-[#f39c12] hover:text-[#e68a00] hover:underline font-semibold transition-colors duration-300">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;

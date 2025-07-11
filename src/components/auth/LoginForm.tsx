import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react'; // Using lucide-react for icons

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, you would send this to an authentication API
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative font-inter">
      {/* Background image */}
      <div className="absolute inset-0 w-full h-full bg-cover bg-center z-0" style={{ backgroundImage: "url('/images/background/clouds.png')" }} />
      {/* Content */}
      <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl px-8 py-10 w-full max-w-md text-center relative z-20">
        {/* Logo */}
        <img src="/images/logo/logo.png" alt="ebizneeds logo" className="mx-auto mb-4 w-48" />
        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl font-bold text-[#f39c12] mb-2">Hey You, Let's Get In</h2>
        <p className="text-xl font-semibold text-gray-900 mb-8">Welcome back, legend</p>
        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-5">
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
            <a href="#" className="text-[#f39c12] font-semibold hover:underline">Forgot Password?</a>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-[#f39c12] text-white rounded-md font-semibold text-lg hover:bg-[#e68a00] transition-all duration-300 shadow-md"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;

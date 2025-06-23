import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically call your API to send the reset email
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#b3d8fd] to-[#eaf6ff] font-inter">
      <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl px-8 py-10 w-full max-w-md text-center">
        {/* Logo */}
        <img src="/images/logo/logo.png" alt="ebizneeds logo" className="mx-auto mb-4 w-48" />
        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Oops, brain lag?</h2>
        <p className="text-base text-gray-800 mb-8">
          Enter the email associated with your account and we'll send an email with instructions to reset your password.
        </p>
        {submitted ? (
          <div className="text-green-600 font-semibold mb-4">If an account exists for {email}, you will receive an email with password reset instructions.</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-[#fbeee6] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#f39c12] focus:ring-2 focus:ring-[#f39c12] focus:ring-opacity-20 transition-all duration-300"
            />
            <button
              type="submit"
              className="w-full py-3 bg-[#f39c12] text-white rounded-md font-semibold text-lg hover:bg-[#e68a00] transition-all duration-300 shadow-md"
            >
              Get Me Back In
            </button>
          </form>
        )}
        <div className="mt-6 text-sm text-gray-800">
          Just kidding?{' '}
          <span
            className="text-[#f39c12] font-semibold cursor-pointer hover:underline"
            onClick={() => navigate('/auth')}
          >
            Sign in
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 
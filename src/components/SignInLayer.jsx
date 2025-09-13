'use client';
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Image from "next/image";

const SignInLayer = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const router = useRouter();

  const submitForm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/signin`,
        { username, password },
        { withCredentials: true }
      );
      const {
        message,
        firstName,
        lastName,
        email,
        phoneNumber,
        role,
        access_token,
        state,
        community
      } = response.data;

      const userData = {
        firstName,
        lastName,
        email,
        phoneNumber,
        role,
        access_token,
        state,
        community
      };

      localStorage.setItem('user', JSON.stringify(userData));
      setSuccessMessage('Login successful! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.response?.data?.message || 'Invalid username or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);
    
  return (
    <section className='auth-container'>
      {/* Background Image - Hidden on mobile */}
      <div className='auth-background' />

      {/* Form Container */}
      <div className='auth-form'>
        <div className='form-wrapper'>
          {/* Enhanced Message Alerts */}
          <div className="alert-container">
            {error && (
              <div className="alert error">
                <Icon 
                  icon="material-symbols:error-outline" 
                  className="alert-icon error" 
                />
                <p className="alert-message error">{error}</p>
              </div>
            )}
            {successMessage && (
              <div className="alert success">
                <Icon 
                  icon="clarity:success-standard-line" 
                  className="alert-icon success" 
                />
                <p className="alert-message success">{successMessage}</p>
              </div>
            )}
          </div>

          <div className="form-header">
            <Link href='/' className='logo-link'>
              <Image 
                src="/assets/images/wima-logo.svg" 
                alt="Home Icon" 
                width={300} 
                height={70} 
                className="logo-image"
              />
            </Link>
            <h4 className='form-title'>Sign In to your Account</h4>
            <p className='form-subtitle'>
              Welcome back! Please enter your details
            </p>
          </div>

          <form onSubmit={submitForm}>
            <div className='input-field'>
              <span className='input-icon'>
                <Icon icon='mage:email' />
              </span>
              <input
                type='text'
                className='form-input'
                placeholder='Email or Phone Number'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className='input-field password-field'>
              <span className='input-icon'>
                <Icon icon='solar:lock-password-outline' />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className='form-input'
                id='your-password'
                placeholder='Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                className='password-toggle'
                onClick={() => setShowPassword(!showPassword)}
              >
                <Icon icon={showPassword ? 'ri:eye-off-line' : 'ri:eye-line'} />
              </button>
            </div>

            <div className='form-options'>
              <div className='remember-me'>
                <input
                  className='remember-checkbox'
                  type='checkbox'
                  id='remember'
                />
                <label htmlFor='remember'>
                  Remember me
                </label>
              </div>
              <Link href='#' className='forgot-password'>
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" role="status" aria-hidden="true"></span>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <div className='signup-link'>
              <p>
                Don't have an account?{" "}
                <Link href='/sign-up' className='signup-text'>
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* CSS Styles */}
      <style jsx>{`
        .auth-container {
          display: flex;
          min-height: 100vh;
          position: relative;
        }
        
        /* Background Image - Desktop */
        .auth-background {
          display: none;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 50%;
          background-image: url('/assets/images/login-page.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: 0;
        }
        
        /* Form Container - Desktop */
        .auth-form {
          width: 100%;
          padding: 2rem 1.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: white;
          z-index: 1;
        }
        
        .form-wrapper {
          width: 100%;
          max-width: 464px;
        }
        
        /* Responsive Styles */
        @media (min-width: 992px) {
          .auth-background {
            display: block;
          }
          
          .auth-form {
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 50%;
            padding: 3rem 6rem;
            overflow-y: auto;
          }
        }
        
        /* Alert Styles */
        .alert-container {
          margin-bottom: 1.5rem;
        }
        
        .alert {
          display: flex;
          align-items: center;
          padding: 1rem;
          border-radius: 0.75rem;
          margin-bottom: 1rem;
          animation: fadeIn 0.3s ease-in-out;
        }
        
        .error {
          background-color: #FEF2F2;
          border: 1px solid #FECACA;
        }
        
        .success {
          background-color: #F0FDF4;
          border: 1px solid #BBF7D0;
        }
        
        .alert-icon {
          font-size: 1.25rem;
          margin-right: 0.75rem;
        }
        
        .alert-icon.error {
          color: #EF4444;
        }
        
        .alert-icon.success {
          color: #22C55E;
        }
        
        .alert-message {
          font-weight: 500;
          margin: 0;
        }
        
        .alert-message.error {
          color: #EF4444;
        }
        
        .alert-message.success {
          color: #22C55E;
        }
        
        /* Form Header */
        .form-header {
          margin-bottom: 2rem;
        }
        
        .logo-link {
          display: block;
          max-width: 290px;
          margin-bottom: 2.5rem;
        }
        
        .logo-image {
          width: 100%;
          height: auto;
        }
        
        .form-title {
          color: #1F2937;
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }
        
        .form-subtitle {
          color: #6B7280;
          font-size: 1.125rem;
          margin-bottom: 2rem;
        }
        
        /* Form Inputs */
        .input-field {
          position: relative;
          margin-bottom: 1rem;
        }
        
        .password-field {
          margin-bottom: 1.25rem;
        }
        
        .input-icon {
          position: absolute;
          top: 50%;
          left: 1rem;
          transform: translateY(-50%);
          color: #9CA3AF;
          font-size: 1.25rem;
        }
        
        .form-input {
          width: 100%;
          height: 3.5rem;
          background-color: #F9FAFB;
          border-radius: 0.75rem;
          padding-left: 3rem;
          border: 1px solid #E5E7EB;
          transition: all 0.2s;
        }
        
        .form-input:focus {
          border-color: #3B82F6;
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        
        .password-toggle {
          position: absolute;
          top: 50%;
          right: 1rem;
          transform: translateY(-50%);
          color: #9CA3AF;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.25rem;
        }
        
        .password-toggle:hover {
          color: #4B5563;
        }
        
        /* Form Options */
        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        
        .remember-me {
          display: flex;
          align-items: center;
        }
        
        .remember-checkbox {
          width: 1rem;
          height: 1rem;
          border: 1px solid #D1D5DB;
          border-radius: 0.25rem;
          margin-right: 0.5rem;
        }
        
        .remember-me label {
          color: #6B7280;
        }
        
        .forgot-password {
          color: #2563EB;
          font-weight: 500;
        }
        
        .forgot-password:hover {
          color: #1D4ED8;
        }
        
        /* Submit Button */
        .submit-button {
          width: 100%;
          padding: 1rem;
          background-color: #2563EB;
          color: white;
          border: none;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-top: 2rem;
        }
        
        .submit-button:hover {
          background-color: #1D4ED8;
        }
        
        .submit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .spinner {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          margin-right: 0.5rem;
          border: 0.15em solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spinner-border 0.75s linear infinite;
        }
        
        /* Sign Up Link */
        .signup-link {
          text-align: center;
          margin-top: 2rem;
          font-size: 0.875rem;
          color: #6B7280;
        }
        
        .signup-text {
          color: #2563EB;
          font-weight: 600;
        }
        
        .signup-text:hover {
          color: #1D4ED8;
        }
        
        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spinner-border {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
};

export default SignInLayer;
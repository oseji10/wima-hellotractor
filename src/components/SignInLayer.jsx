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
            // Extract the data from the response
            const {
                message,
                firstName,
                lastName,
                email,
                phoneNumber,
                role,
                access_token,
            } = response.data;

            const userData = {
                firstName,
                lastName,
                email,
                phoneNumber,
                role,
                access_token,
                
            };

            // Save to localStorage as a JSON string
            localStorage.setItem('user', JSON.stringify(userData));

            // Set success message
            setSuccessMessage('Login successful!');
            // Delay redirect to show success message
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (error) {
            console.error('Login failed:', error);
            setError('Invalid username or password');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Clear messages after 3 seconds
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
    <section className='auth bg-base d-flex flex-wrap'>
      <div className='auth-left d-lg-block d-none'>
        <div className='d-flex align-items-center flex-column h-1vh justify-content-center'>
          <img src='assets/images/hellotractor-bg.png' alt='' />
        </div>
      </div>
      <div className='auth-right py-32 px-24 d-flex flex-column justify-content-center'>
        <div className='max-w-464-px mx-auto w-100'>
          <div>
            <Link href='/' className='mb-40 max-w-290-px'>
              <Image src="assets/images/wima-logo.svg" alt="Home Icon" width={300} height={70} />
            </Link>
            <h4 className='mb-12'>Sign In to your Account</h4>
            <p className='mb-32 text-secondary-light text-lg'>
              Welcome back! please enter your detail
            </p>
          </div>
          <form onSubmit={submitForm}>
            <div className='icon-field mb-16'>
              <span className='icon top-50 translate-middle-y'>
                <Icon icon='mage:email' />
              </span>
              <input
                type='text'
                className='form-control h-56-px bg-neutral-50 radius-12'
                placeholder='Email or Phone Number'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className='position-relative mb-20'>
              <div className='icon-field'>
                <span className='icon top-50 translate-middle-y'>
                  <Icon icon='solar:lock-password-outline' />
                </span>
                <input
                  type='password'
                  className='form-control h-56-px bg-neutral-50 radius-12'
                  id='your-password'
                  placeholder='Password'
                  value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                />
              </div>
              <span
                className='toggle-password ri-eye-line cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 text-secondary-light'
                data-toggle='#your-password'
              />
            </div>
            <div className=''>
              <div className='d-flex justify-content-between gap-2'>
                <div className='form-check style-check d-flex align-items-center'>
                  <input
                    className='form-check-input border border-neutral-300'
                    type='checkbox'
                    defaultValue=''
                    id='remeber'
                  />
                  <label className='form-check-label' htmlFor='remeber'>
                    Remember me{" "}
                  </label>
                </div>
                <Link href='#' className='text-primary-600 fw-medium'>
                  Forgot Password?
                </Link>
              </div>
            </div>
            <button
                type="submit"
                className="btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-32"
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                <>
                  {/* <span className="animate-spin inline-block w-10 h-10 border-2 border-white border-t-transparent rounded-full mr-2"></span> */}
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>

             {/* <button
              type='submit'
              className='btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-32'
            >
              {" "}
              Sign In
            </button> */}

            {(error || successMessage) && (
                <div className="mt-4 text-center">
                    {error && <p className="text-red-500 text-sm" role="alert">{error}</p>}
                    {successMessage && <p className="text-green-500 text-sm" role="status">{successMessage}</p>}
                </div>
            )}


           
            <div className='mt-32 text-center text-sm'>
              <p className='mb-0'>
                Don’t have an account?{" "}
                <Link href='/sign-up' className='text-primary-600 fw-semibold'>
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default SignInLayer;

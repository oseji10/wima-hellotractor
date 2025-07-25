'use client';
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import Image from 'next/image';
import { useState } from 'react';

const SignUpLayer = () => {
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastnName: '',
    otherNames: '',
    phoneNumber: '',
    email: '',
    password: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isChecked) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        window.location.href = '/';
      } else {
        console.error('Signup failed');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <section className='auth bg-base d-flex flex-wrap'>
      <div className='auth-left d-lg-block d-none'>
        <div className='d-flex align-items-center flex-column h-full justify-content-center'>
          <img src='assets/images/hellotractor-bg.png' alt='' />
        </div>
      </div>
      <div className='auth-right py-32 px-24 d-flex flex-column justify-content-center'>
        <div className='max-w-464-px mx-auto w-100'>
          <div>
            <Link href='/' className='mb-40 max-w-290-px'>
              <Image src="assets/images/wima-logo.svg" alt="Home Icon" width={300} height={70} />
            </Link>
            <h6 className='mb-12'>Sign Up to your Account</h6>
            <p className='mb-32 text-secondary-light text-lg'>
              Welcome back! please enter your detail
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className='icon-field mb-16'>
              <span className='icon top-50 translate-middle-y'>
                <Icon icon='mdi:account' />
              </span>
              <input
                type='text'
                className='form-control h-56-px bg-neutral-50 radius-12'
                placeholder='First Name'
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
              />
            </div>
            <div className='icon-field mb-16'>
              <span className='icon top-50 translate-middle-y'>
                <Icon icon='mdi:account' />
              </span>
              <input
                type='text'
                className='form-control h-56-px bg-neutral-50 radius-12'
                placeholder='Last Name'
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
              />
            </div>
            <div className='icon-field mb-16'>
              <span className='icon top-50 translate-middle-y'>
                <Icon icon='mdi:account' />
              </span>
              <input
                type='text'
                className='form-control h-56-px bg-neutral-50 radius-12'
                placeholder='Other Names'
                name="othernames"
                value={formData.otherNames}
                onChange={handleInputChange}
              />
            </div>
            <div className='icon-field mb-16'>
              <span className='icon top-50 translate-middle-y'>
                <Icon icon='f7:phone' />
              </span>
              <input
                type='tel'
                className='form-control h-56-px bg-neutral-50 radius-12'
                placeholder='Phone Number'
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
              />
            </div>
            <div className='icon-field mb-16'>
              <span className='icon top-50 translate-middle-y'>
                <Icon icon='mage:email' />
              </span>
              <input
                type='email'
                className='form-control h-56-px bg-neutral-50 radius-12'
                placeholder='Email'
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className='mb-20'>
              <div className='position-relative'>
                <div className='icon-field'>
                  <span className='icon top-50 translate-middle-y'>
                    <Icon icon='solar:lock-password-outline' />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className='form-control h-56-px bg-neutral-50 radius-12'
                    id='your-password'
                    placeholder='Password'
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>
                <span
                  className='cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 text-secondary-light'
                  onClick={togglePasswordVisibility}
                >
                  <Icon icon={showPassword ? 'ri:eye-off-line' : 'ri:eye-line'} />
                </span>
              </div>
              <span className='mt-12 text-sm text-secondary-light'>
                Your password must have at least 8 characters
              </span>
            </div>
            <div className=''>
              <div className='d-flex justify-content-between gap-2'>
                <div className='form-check style-check d-flex align-items-start'>
                  <input
                    className='form-check-input border border-neutral-300 mt-4'
                    type='checkbox'
                    defaultValue=''
                    id='condition'
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                  />
                  <label
                    className='form-check-label text-sm'
                    htmlFor='condition'
                  >
                    By creating an account means you agree to the
                    <Link href='#' className='text-primary-600 fw-semibold'>
                      Terms & Conditions
                    </Link>{" "}
                    and our {" "}
                    <Link href='#' className='text-primary-600 fw-semibold'>
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>
            </div>
            <button
              type='submit'
              disabled={!isChecked || isSubmitting}
              className={`btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-32
                ${isChecked && !isSubmitting 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
                }`}
            >
              {isSubmitting ? (
                <>
                  Submitting...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
            <div className='mt-32 text-center text-sm'>
              <p className='mb-0'>
                Already have an account?{" "}
                <Link href='/sign-in' className='text-primary-600 fw-semibold'>
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default SignUpLayer;
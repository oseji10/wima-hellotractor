"use client";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NotificationModal from "./Modal";


   

const SignUpLayer = () => {
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [accountTypes, setAccountTypes] = useState([]); // State for account types
  const [isLoadingAccountTypes, setIsLoadingAccountTypes] = useState(true); // Loading state

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'error' or 'success'
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    otherNames: "",
    phoneNumber: "",
    email: "",
    password: "",
    accountType: "",
  });



  // Fetch account types from API
  useEffect(() => {
    const fetchAccountTypes = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/roles`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch account types");
        }
        const data = await response.json();
        setAccountTypes([
          { value: "", label: "Select Account Type" }, // Default option
          ...data.map((type) => ({ value: type.roleId, label: type.roleName })),
        ]);
      } catch (error) {
        console.error("Error fetching account types:", error);
        setError("Failed to load account types. Using default options.");
        // Fallback to default options
        // setAccountTypes([
        //   { value: '', label: 'Select Account Type' },
        //   { value: 'Farmer', label: 'Farmer' },
        //   { value: 'Investor', label: 'Investor' },
        //   { value: 'MSP', label: 'MSP' },
        //   { value: 'Cooperative', label: 'Cooperative' }
        // ]);
      } finally {
        setIsLoadingAccountTypes(false);
      }
    };

    fetchAccountTypes();
  }, []);

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
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...formData, role: formData.accountType }),
        }
      );

      if (response.ok) {
        setModalType("success");
        setModalTitle("Success!");
        setModalMessage(
          "Account created successfully! You will be redirected shortly."
        );
        setShowModal(true);

        setTimeout(() => {
          router.push("/sign-in");
        }, 3000);
      } else {
        const errorData = await response.json();
        let errorMsg =
          errorData.message || "Registration failed. Please try again.";

        if (errorData.errors) {
          errorMsg +=
            "\n" +
            Object.entries(errorData.errors)
              .map(([field, messages]) => `${messages.join(", ")}`)
              .join("\n");
        }

        setModalType("error");
        setModalTitle("Error");
        setModalMessage(errorMsg);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setModalType("error");
      setModalTitle("Error");
      setModalMessage("An unexpected error occurred. Please try again.");
      setShowModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
     {showModal && (
        <NotificationModal 
          type={modalType}
          title={modalTitle}
          message={modalMessage}
          onClose={() => setShowModal(false)}
        />
      )}
    <section className="auth-container">
      {/* Background Image - Hidden on mobile */}
      <div className="auth-background" />

 
      {/* Form Container */}
      <div className="auth-form">
        <div className="form-wrapper">
          {/* Enhanced Message Alerts */}

          <div className="form-header">
            <Link href="/" className="logo-link">
              <Image
                src="/assets/images/wima-logo.svg"
                alt="WIMA Logo"
                width={300}
                height={70}
                className="logo-image"
                priority
              />
            </Link>
            <h4 className="form-title">Create Your Account</h4>
            <p className="form-subtitle">
              Join us today! Please enter your details
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Account Type Dropdown */}
            <div className="input-field">
              <span className="input-icon">
                <Icon icon="mdi:account-group" />
              </span>
              {isLoadingAccountTypes ? (
                <select className="form-input" disabled>
                  <option>Loading account types...</option>
                </select>
              ) : (
                <select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  {accountTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              )}
              <span className="dropdown-icon">
                <Icon icon="mdi:chevron-down" />
              </span>
            </div>

            <div className="input-field">
              <span className="input-icon">
                <Icon icon="mdi:account" />
              </span>
              <input
                type="text"
                className="form-input"
                placeholder="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="input-field">
              <span className="input-icon">
                <Icon icon="mdi:account" />
              </span>
              <input
                type="text"
                className="form-input"
                placeholder="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="input-field">
              <span className="input-icon">
                <Icon icon="mdi:account" />
              </span>
              <input
                type="text"
                className="form-input"
                placeholder="Other Names (Optional)"
                name="otherNames"
                value={formData.otherNames}
                onChange={handleInputChange}
              />
            </div>

            <div className="input-field">
              <span className="input-icon">
                <Icon icon="f7:phone" />
              </span>
              <input
                type="tel"
                className={`form-input ${
                  error?.includes("phoneNumber") ? "input-error" : ""
                }`}
                placeholder="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="input-field">
              <span className="input-icon">
                <Icon icon="mage:email" />
              </span>
              <input
                type="email"
                className="form-input"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="input-field password-field">
              <span className="input-icon">
                <Icon icon="solar:lock-password-outline" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
              >
                <Icon icon={showPassword ? "ri:eye-off-line" : "ri:eye-line"} />
              </button>
            </div>
            <span className="password-hint">
              Your password must have at least 8 characters
            </span>

            <div className="form-options">
              <div className="remember-me">
                <input
                  className="remember-checkbox"
                  type="checkbox"
                  id="condition"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  required
                />
                <label htmlFor="condition">
                  By creating an account means you agree to the{" "}
                  <Link href="#" className="terms-link">
                    Terms & Conditions
                  </Link>{" "}
                  and our{" "}
                  <Link href="#" className="terms-link">
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isChecked || isSubmitting}
              className="submit-button"
            >
              {isSubmitting ? (
                <>
                  <span
                    className="spinner"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Creating Account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>

            <div className="signup-link">
              <p>
                Already have an account?{" "}
                <Link href="/" className="signup-text">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* CSS Styles */}
      <style jsx global>{`
      .auth-container {
    display: flex;
    min-height: 100vh;
    position: relative;
    /* Ensure this doesn't affect the modal */
    overflow: visible !important;
    z-index: 1;
  }

        /* Background Image - Desktop */
        .auth-background {
          display: none;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 50%;
          background-image: url("/assets/images/login-page2.png");
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
          background-color: #fef2f2;
          border: 1px solid #fecaca;
        }

        .success {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
        }

        .alert-icon {
          font-size: 1.25rem;
          margin-right: 0.75rem;
        }

        .alert-icon.error {
          color: #ef4444;
        }

        .alert-icon.success {
          color: #22c55e;
        }

        .alert-message {
          font-weight: 500;
          margin: 0;
        }

        .alert-message.error {
          color: #ef4444;
          white-space: pre-line;
        }

        .alert-message.error p {
          margin: 0.25rem 0;
        }

        .input-error {
          border-color: #ef4444 !important;
          background-color: #fef2f2 !important;
        }

        .alert-message.success {
          color: #22c55e;
        }

        /* Form Header */
        .form-header {
          margin-bottom: 2rem;
        }

        .logo-link {
          display: block;
          max-width: 290px;
          margin-bottom: 1.5rem;
        }

        .logo-image {
          width: 100%;
          height: auto;
        }

        .form-title {
          color: #1f2937;
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .form-subtitle {
          color: #6b7280;
          font-size: 1.125rem;
          margin-bottom: 2rem;
        }

        .input-field {
          position: relative;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          color: #9ca3af;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          height: 100%;
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          height: 3.5rem;
          background-color: #f9fafb;
          border-radius: 0.75rem;
          padding: 1rem 1rem 1rem 3rem;
          border: 1px solid #e5e7eb;
          transition: all 0.2s;
          font-size: 1rem;
          line-height: 1.5;
        }

        /* For select elements specifically */
        select.form-input {
          appearance: none;
          padding-top: 1rem;
          padding-bottom: 1rem;
        }

        /* Password field toggle button */
        .password-toggle {
          position: absolute;
          right: 1rem;
          color: #9ca3af;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.25rem;
          height: 100%;
          display: flex;
          align-items: center;
        }

        .form-input:focus {
          border-color: #3b82f6;
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .dropdown-icon {
          position: absolute;
          top: 50%;
          right: 1rem;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
          font-size: 1.25rem;
        }

        .password-toggle {
          position: absolute;
          top: 50%;
          right: 1rem;
          transform: translateY(-50%);
          color: #9ca3af;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.25rem;
        }

        .password-toggle:hover {
          color: #4b5563;
        }

        .password-hint {
          display: block;
          margin-top: 0.25rem;
          margin-bottom: 1.5rem;
          color: #6b7280;
          font-size: 0.875rem;
        }

        /* Form Options */
        .form-options {
          margin-bottom: 1.5rem;
        }

        .remember-me {
          display: flex;
          align-items: flex-start;
        }

        .remember-checkbox {
          width: 1rem;
          height: 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          margin-right: 0.5rem;
          margin-top: 0.25rem;
          appearance: none; /* Add this */
          -webkit-appearance: none; /* For Safari */
          cursor: pointer;
          position: relative;
        }

        .remember-checkbox:checked {
          background-color: #2563eb;
          border-color: #2563eb;
        }

        .remember-checkbox:checked::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 0.5rem;
          height: 0.5rem;
          background-color: white;
          transform: translate(-50%, -50%);
          border-radius: 0.125rem;
        }

        .terms-link {
          color: #2563eb;
          font-weight: 600;
        }

        .terms-link:hover {
          color: #1d4ed8;
        }

        /* Submit Button */
        .submit-button {
          width: 100%;
          padding: 1rem;
          background-color: #2563eb;
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
          background-color: #1d4ed8;
        }

        .submit-button:disabled {
          background-color: #9ca3af;
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
          color: #6b7280;
        }

        .signup-text {
          color: #2563eb;
          font-weight: 600;
        }

        .signup-text:hover {
          color: #1d4ed8;
        }

        /* Animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spinner-border {
          to {
            transform: rotate(360deg);
          }
        }

   

      `}</style>
    </section>
    </>
  );
};


export default SignUpLayer;

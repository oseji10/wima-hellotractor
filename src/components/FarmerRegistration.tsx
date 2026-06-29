'use client';
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Image from "next/image";

interface State {
  id: number;
  name: string;
}

interface LGA {
  id: number;
  name: string;
}

interface Service {
  id: string;
  name: string;
  icon?: string;
}

interface ActiveHub {
  hubId: number;
  state: number;
  lga: number;
  state_info?: {
    stateId: number;
    stateName: string;
  };
  lga_info?: {
    lgaId: number;
    lgaName: string;
  };
}

interface CLSubCLData {
  userId: number;
  fullname: string;
  phoneNumber: string;
  email: string;
  age: string;
  gender: string;
  stateId: string;
  lgaId: string;
  stateName?: string;
  lgaName?: string;
  mspCategory: string;
  year: string;
  code: string;
  verifiedBy?: string;
}

const FarmerRegistration = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [activeHubs, setActiveHubs] = useState<ActiveHub[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [lgas, setLgas] = useState<LGA[]>([]);
  const [isExistingFarmer, setIsExistingFarmer] = useState(false);
  const [isCLSubCL, setIsCLSubCL] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [clSubCLData, setClSubCLData] = useState<CLSubCLData | null>(null);
  const [verificationInput, setVerificationInput] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  
  const services: Service[] = [
    { id: 'threshing', name: 'Threshing', icon: 'mdi:grain' },
    { id: 'spraying', name: 'Spraying', icon: 'mdi:spray' },
    { id: 'drying', name: 'Drying', icon: 'mdi:weather-sunny' },
    { id: 'tractor-hire', name: 'Tractor Hire', icon: 'mdi:tractor' },
    { id: 'harvesting', name: 'Harvesting', icon: 'mdi:combine' },
    { id: 'planting', name: 'Planting', icon: 'mdi:seedling' },
    { id: 'irrigation', name: 'Irrigation', icon: 'mdi:sprinkler' },
    { id: 'ploughing', name: 'Ploughing', icon: 'mdi:plough' },
    { id: 'weed-control', name: 'Weed Control', icon: 'mdi:weed' },
    { id: 'fertilizer-application', name: 'Fertilizer Application', icon: 'mdi:flask' },
    { id: 'soil-testing', name: 'Soil Testing', icon: 'mdi:test-tube' },
    { id: 'storage', name: 'Storage Facilities', icon: 'mdi:warehouse' },
    { id: 'transport', name: 'Transport Services', icon: 'mdi:truck' },
    { id: 'consultancy', name: 'Farm Consultancy', icon: 'mdi:account-tie' },
    { id: 'others', name: 'Others', icon: 'mdi:dots-horizontal' },
  ];
  
  const [formData, setFormData] = useState({
    fullname: '',
    phoneNumber: '',
    age: '',
    stateId: '',
    lgaId: '',
    email: '',
    gender: '',
    mechanizedServices: [] as string[],
  });
  
  const router = useRouter();

  useEffect(() => {
    const fetchActiveHubs = async () => {
      setLoadingStates(true);
      setError(null);
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs/all-active-hubs`);
        const data = response.data || response;
        const hubs = Array.isArray(data) ? data : [];
        setActiveHubs(hubs);
        
        const uniqueStates: Record<number, State> = {};
        hubs.forEach((hub: ActiveHub) => {
          if (hub.state_info && hub.state_info.stateId && hub.state_info.stateName) {
            uniqueStates[hub.state_info.stateId] = {
              id: hub.state_info.stateId,
              name: hub.state_info.stateName
            };
          }
        });
        setStates(Object.values(uniqueStates));
      } catch (error) {
        console.error("Error fetching active hubs:", error);
        setError("Failed to load hubs. Please try again.");
        setStates([]);
        setActiveHubs([]);
      } finally {
        setLoadingStates(false);
      }
    };
    fetchActiveHubs();
  }, []);

  useEffect(() => {
    if (!formData.stateId) {
      setLgas([]);
      return;
    }

    const stateId = parseInt(formData.stateId);
    const stateHubs = activeHubs.filter(hub => 
      hub.state_info && hub.state_info.stateId === stateId
    );
    
    const uniqueLgas: Record<number, LGA> = {};
    stateHubs.forEach(hub => {
      if (hub.lga_info && hub.lga_info.lgaId && hub.lga_info.lgaName) {
        uniqueLgas[hub.lga_info.lgaId] = {
          id: hub.lga_info.lgaId,
          name: hub.lga_info.lgaName
        };
      }
    });
    setLgas(Object.values(uniqueLgas));
    
    setFormData(prev => ({ ...prev, lgaId: '' }));
  }, [formData.stateId, activeHubs]);

  // Only check for existing farmer if verified
  useEffect(() => {
    if (isVerified && formData.phoneNumber.length === 11) {
      (async () => {
        try {
          setCheckingPhone(true);
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/validate-farmer/${formData.phoneNumber}`);
          if (res.data.exists) {
            setFormData((prev) => ({
              ...prev,
              fullname: res.data.fullname || "",
              email: res.data.email || "",
              age: res.data.age || "",
              gender: res.data.gender || "",
            }));
            setIsExistingFarmer(true);
            setMessage("Existing farmer found. Details prefilled (read-only).");
          } else {
            setFormData((prev) => ({
              ...prev,
              fullname: "",
              email: "",
              age: "",
              gender: "",
            }));
            setIsExistingFarmer(false);
            setMessage("New farmer — please enter the details.");
          }
        } catch (err) {
          setMessage("Could not validate number.");
          setIsExistingFarmer(false);
          console.error(err);
        } finally {
          setCheckingPhone(false);
        }
      })();
    } else if (isVerified && formData.phoneNumber.length < 11 && formData.phoneNumber.length > 0) {
      setMessage("");
      setIsExistingFarmer(false);
      setFormData((prev) => ({
        ...prev,
        fullname: "",
        email: "",
        age: "",
        gender: "",
      }));
    }
  }, [formData.phoneNumber, isVerified]);

  const handleVerifyCLSubCL = async () => {
    if (!verificationInput.trim()) {
      setError('Please enter your unique code or phone number.');
      return;
    }

    setVerifyingCode(true);
    setError(null);
    setMessage('');

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/verify-cl-subcl`,
        { identifier: verificationInput.trim() }
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setClSubCLData(data);
        setIsCLSubCL(true);
        setIsVerified(true);
        
        const verifiedBy = data.verifiedBy === 'code' ? 'unique code' : 'phone number';
        setMessage(`✓ CL/SubCL verified successfully via ${verifiedBy}. You can now fill in the farmer details.`);
        setSuccessMessage(`CL/SubCL verification successful via ${verifiedBy}!`);
      }
    } catch (error: any) {
      console.error('Verification failed:', error);
      
      // Handle specific error message
      const errorMessage = error.response?.data?.message || 'Verification failed. Please check your unique code or phone number.';
      
      // Check if the error is about user not being CL/SubCL
      if (errorMessage.includes('not registered as CL or SubCL')) {
        setError('This phone number belongs to a user but they are not registered as CL or SubCL. Please contact support.');
      } else {
        setError(errorMessage);
      }
      
      setIsCLSubCL(false);
      setIsVerified(false);
      setClSubCLData(null);
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleResetVerification = () => {
    setIsCLSubCL(false);
    setIsVerified(false);
    setClSubCLData(null);
    setVerificationInput('');
    setMessage('');
    setError(null);
    setSuccessMessage(null);
    // Reset form data when verification is reset
    setFormData({
      fullname: '',
      phoneNumber: '',
      age: '',
      stateId: '',
      lgaId: '',
      email: '',
      gender: '',
      mechanizedServices: [],
    });
    setIsExistingFarmer(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
    if (message) setMessage('');
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: [] }));
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => {
      const currentServices = prev.mechanizedServices;
      const isSelected = currentServices.includes(serviceId);
      const updatedServices = isSelected
        ? currentServices.filter(id => id !== serviceId)
        : [...currentServices, serviceId];
      return { ...prev, mechanizedServices: updatedServices };
    });
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setFieldErrors({});

    try {
      if (!isVerified || !clSubCLData) {
        setError('Please verify your CL/SubCL identity before submitting.');
        setIsSubmitting(false);
        return;
      }

      if (!formData.fullname || !formData.phoneNumber || !formData.age || !formData.stateId || !formData.lgaId) {
        setError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        fullName: formData.fullname,
        phoneNumber: formData.phoneNumber,
        age: parseInt(formData.age),
        stateId: parseInt(formData.stateId),
        lgaId: parseInt(formData.lgaId),
        email: formData.email || undefined,
        gender: formData.gender || undefined,
        mechanizedServices: formData.mechanizedServices,
        addedBy: clSubCLData.userId,
        clSubCLCode: clSubCLData.code,
        registeredBy: clSubCLData.fullname,
        mspCategory: clSubCLData.mspCategory,
      };

      console.log('Sending payload:', payload);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/farmers/register`,
        payload,
        { withCredentials: true }
      );

      // Store registration data for the modal
      setRegistrationData(response.data.data);
      setShowSuccessModal(true);
      setSuccessMessage('Farmer registration successful!');
      setMessage('');
      
      // Clear the form after successful submission
      setFormData({
        fullname: '',
        phoneNumber: '',
        age: '',
        stateId: '',
        lgaId: '',
        email: '',
        gender: '',
        mechanizedServices: [],
      });
      
      // Reset verification but keep the modal open
      handleResetVerification();
      
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        setFieldErrors(errors);
        
        const firstErrorKey = Object.keys(errors)[0];
        const firstErrorMessage = errors[firstErrorKey]?.[0] || 'Please check your inputs.';
        setError(firstErrorMessage);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setRegistrationData(null);
    setSuccessMessage(null);
  };

  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  const hasFieldError = (fieldName: string): boolean => {
    return fieldErrors[fieldName] && fieldErrors[fieldName].length > 0;
  };

  const getFieldError = (fieldName: string): string => {
    return fieldErrors[fieldName]?.[0] || '';
  };

  return (
    <section className="auth-container">
      <div className="auth-form">
        <div className="form-wrapper">
          <div className="gradient-orb" />
          <div className="gradient-orb-2" />

          <div className="form-header">
            <Link href="/" className="logo-link">
              <Image
                src="/assets/images/wima-logo.svg"
                alt="Home Icon"
                width={280}
                height={65}
                className="logo-image"
              />
            </Link>
            <div className="header-content">
              <div className="title-badge">
                <span className="badge">New Farmer Registration</span>
              </div>
              <p className="form-subtitle">
                {isVerified 
                  ? "Fill in the farmer's details below" 
                  : "Verify your CL/SubCL identity to start registering farmers"}
              </p>
            </div>
          </div>

          <div className="alert-container">
            {error && (
              <div className="alert error">
                <Icon icon="material-symbols:error-outline" className="alert-icon error" />
                <span className="alert-text">{error}</span>
                <button className="alert-close" onClick={() => setError(null)}>
                  <Icon icon="mdi:close" />
                </button>
              </div>
            )}
            {successMessage && !showSuccessModal && (
              <div className="alert success">
                <Icon icon="clarity:success-standard-line" className="alert-icon success" />
                <span className="alert-text">{successMessage}</span>
                <button className="alert-close" onClick={() => setSuccessMessage(null)}>
                  <Icon icon="mdi:close" />
                </button>
              </div>
            )}
            {message && (
              <div className={`alert ${isExistingFarmer ? "success" : "info"}`}>
                <Icon 
                  icon={isExistingFarmer ? "clarity:success-standard-line" : "mdi:information"} 
                  className={`alert-icon ${isExistingFarmer ? "success" : "info"}`} 
                />
                <span className="alert-text">{message}</span>
              </div>
            )}
          </div>

          {/* Verification Section - Always visible at the top */}
          <div className="verification-section">
            <div className="verification-header">
              <Icon icon="mdi:shield-check" className="verification-icon" />
              <span className="verification-title">CL/SubCL Verification</span>
            </div>
            
            <div className="verification-info">
              <Icon icon="mdi:information-outline" />
              <span>Enter your unique code (8 characters) OR your phone number to verify your identity.</span>
            </div>

            <div className="verification-input-group">
              <div className={`input-field ${focusedField === "verification" ? "focused" : ""}`}>
                <span className="input-icon">
                  <Icon icon="mdi:key" />
                </span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter Unique Code or Phone Number"
                  value={verificationInput}
                  onChange={(e) => setVerificationInput(e.target.value)}
                  onFocus={() => setFocusedField("verification")}
                  onBlur={() => setFocusedField(null)}
                  disabled={isSubmitting || verifyingCode || isVerified}
                />
                <span className="input-highlight" />
              </div>
              <div className="verification-actions">
                {!isVerified ? (
                  <button
                    type="button"
                    className="verify-button"
                    onClick={handleVerifyCLSubCL}
                    disabled={verifyingCode || isSubmitting || !verificationInput.trim()}
                  >
                    {verifyingCode ? (
                      <>
                        <span className="spinner-small" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Icon icon="mdi:check-circle" />
                        Verify
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="reset-button"
                    onClick={handleResetVerification}
                    disabled={isSubmitting}
                  >
                    <Icon icon="mdi:close-circle" />
                    Reset
                  </button>
                )}
              </div>
            </div>

            {isVerified && clSubCLData && (
              <div className="verification-status success">
                <Icon icon="mdi:check-circle" />
                <div>
                  <strong>Verified as:</strong> {clSubCLData.mspCategory} - {clSubCLData.fullname}
                  <br />
                  <span className="code-display">Code: {clSubCLData.code}</span>
                  {clSubCLData.verifiedBy && (
                    <span className="verified-by-display">
                      {clSubCLData.verifiedBy === "code" ? "✓ Verified by code" : "✓ Verified by phone"}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Farmer Registration Form - Only shown when verified */}
          {isVerified ? (
            <form onSubmit={submitForm}>
              <div className="form-grid">
                <div className={`input-field ${focusedField === "phoneNumber" ? "focused" : ""} ${hasFieldError("phoneNumber") ? "has-error" : ""}`}>
                  <span className="input-icon">
                    <Icon icon="mdi:phone" />
                  </span>
                  <input
                    type="tel"
                    name="phoneNumber"
                    className="form-input"
                    placeholder="Farmer's Phone Number (11 digits)"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("phoneNumber")}
                    onBlur={() => setFocusedField(null)}
                    disabled={isSubmitting || checkingPhone}
                    maxLength={11}
                    required
                  />
                  {checkingPhone && (
                    <span className="input-loading">
                      <Icon icon="mdi:loading" className="spinning" />
                    </span>
                  )}
                  <span className="input-highlight" />
                  {hasFieldError("phoneNumber") && (
                    <span className="field-error">{getFieldError("phoneNumber")}</span>
                  )}
                </div>

                <div className={`input-field ${focusedField === "fullname" ? "focused" : ""} ${hasFieldError("fullName") ? "has-error" : ""}`}>
                  <span className="input-icon">
                    <Icon icon="mdi:user" />
                  </span>
                  <input
                    type="text"
                    name="fullname"
                    className="form-input"
                    placeholder="Farmer's Full Name"
                    value={formData.fullname}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("fullname")}
                    onBlur={() => setFocusedField(null)}
                    disabled={isSubmitting || isExistingFarmer}
                    required
                  />
                  <span className="input-highlight" />
                  {hasFieldError("fullName") && (
                    <span className="field-error">{getFieldError("fullName")}</span>
                  )}
                </div>

                <div className={`input-field ${focusedField === "email" ? "focused" : ""} ${hasFieldError("email") ? "has-error" : ""}`}>
                  <span className="input-icon">
                    <Icon icon="mdi:email" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    placeholder="Farmer's Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    disabled={isSubmitting || isExistingFarmer}
                  />
                  <span className="input-highlight" />
                  {hasFieldError("email") && (
                    <span className="field-error">{getFieldError("email")}</span>
                  )}
                </div>

                <div className="input-row">
                  <div className={`input-field half ${focusedField === "age" ? "focused" : ""} ${hasFieldError("age") ? "has-error" : ""}`}>
                    <span className="input-icon">
                      <Icon icon="mdi:calendar" />
                    </span>
                    <input
                      type="number"
                      name="age"
                      className="form-input"
                      placeholder="Farmer's Age"
                      value={formData.age}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("age")}
                      onBlur={() => setFocusedField(null)}
                      disabled={isSubmitting || isExistingFarmer}
                      min="18"
                      max="120"
                      required
                    />
                    <span className="input-highlight" />
                    {hasFieldError("age") && (
                      <span className="field-error">{getFieldError("age")}</span>
                    )}
                  </div>

                  <div className={`input-field half ${focusedField === "gender" ? "focused" : ""} ${hasFieldError("gender") ? "has-error" : ""}`}>
                    <span className="input-icon">
                      <Icon icon="mdi:gender-male-female" />
                    </span>
                    <select
                      name="gender"
                      className="form-input select-input"
                      value={formData.gender}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("gender")}
                      onBlur={() => setFocusedField(null)}
                      disabled={isSubmitting || isExistingFarmer}
                    >
                      <option value="">Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <span className="input-highlight" />
                    {hasFieldError("gender") && (
                      <span className="field-error">{getFieldError("gender")}</span>
                    )}
                  </div>
                </div>

                <div className={`input-field ${focusedField === "stateId" ? "focused" : ""} ${hasFieldError("stateId") ? "has-error" : ""}`}>
                  <span className="input-icon">
                    <Icon icon="mdi:map-marker" />
                  </span>
                  <select
                    name="stateId"
                    className="form-input select-input"
                    value={formData.stateId}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("stateId")}
                    onBlur={() => setFocusedField(null)}
                    disabled={isSubmitting || loadingStates || states.length === 0}
                    required
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                  {loadingStates && (
                    <span className="input-loading">
                      <Icon icon="mdi:loading" className="spinning" />
                    </span>
                  )}
                  <span className="input-highlight" />
                  {hasFieldError("stateId") && (
                    <span className="field-error">{getFieldError("stateId")}</span>
                  )}
                </div>

                <div className={`input-field ${focusedField === "lgaId" ? "focused" : ""} ${hasFieldError("lgaId") ? "has-error" : ""}`}>
                  <span className="input-icon">
                    <Icon icon="mdi:city" />
                  </span>
                  <select
                    name="lgaId"
                    className="form-input select-input"
                    value={formData.lgaId}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("lgaId")}
                    onBlur={() => setFocusedField(null)}
                    disabled={isSubmitting || !formData.stateId || lgas.length === 0}
                    required
                  >
                    <option value="">Select LGA</option>
                    {lgas.map((lga) => (
                      <option key={lga.id} value={lga.id}>
                        {lga.name}
                      </option>
                    ))}
                  </select>
                  <span className="input-highlight" />
                  {hasFieldError("lgaId") && (
                    <span className="field-error">{getFieldError("lgaId")}</span>
                  )}
                </div>
              </div>

              <div className="services-container">
                <div className="services-header">
                  <div className="services-label">
                    <Icon icon="mdi:tractor" className="services-icon" />
                    <span>Mechanized Services Required</span>
                  </div>
                  {formData.mechanizedServices.length > 0 && (
                    <span className="selected-badge">
                      {formData.mechanizedServices.length} selected
                    </span>
                  )}
                </div>
                <div className="services-grid">
                  {services.map((service) => {
                    const isSelected = formData.mechanizedServices.includes(service.id);
                    return (
                      <div 
                        key={service.id} 
                        className={`service-chip ${isSelected ? "selected" : ""}`}
                        onClick={() => {
                          if (!isSubmitting) {
                            handleServiceToggle(service.id);
                          }
                        }}
                      >
                        <Icon icon={service.icon || "mdi:tools"} className="service-chip-icon" />
                        <span>{service.name}</span>
                        {isSelected && (
                          <Icon icon="mdi:check-circle" className="check-icon" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" role="status" aria-hidden="true" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:account-plus" className="button-icon" />
                    Register as Farmer
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="verification-prompt">
              <Icon icon="mdi:lock-outline" />
              <p>Please verify your CL/SubCL identity above to access the farmer registration form.</p>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={closeSuccessModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon success-icon">
                <Icon icon="clarity:success-standard-line" />
              </div>
              <h2>Farmer Registered Successfully!</h2>
              {/* <p className="modal-subtitle">The farmer has been registered successfully.</p> */}
            </div>
            
            {registrationData && (
              <div className="modal-body">
                <div className="detail-item">
                  <span className="detail-label">Farmer ID:</span>
                  <span className="detail-value">{registrationData.farmerId || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Full Name:</span>
                  <span className="detail-value">{formData.fullname || registrationData.farmerFirstName + ' ' + registrationData.farmerLastName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone Number:</span>
                  <span className="detail-value">{formData.phoneNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Gender:</span>
                  <span className="detail-value">{formData.gender || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Registered By:</span>
                  <span className="detail-value">{clSubCLData?.fullname || 'N/A'}</span>
                </div>
                <div className="detail-item highlight">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{clSubCLData?.mspCategory || 'N/A'}</span>
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="modal-button" onClick={closeSuccessModal}>
                <Icon icon="mdi:check" />
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .auth-container {
          display: flex;
          min-height: 100vh;
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
          background: linear-gradient(135deg, #f0f4ff 0%, #fafbfc 100%);
          justify-content: center;
          align-items: center;
          padding: 1rem;
          position: relative;
        }

        .gradient-orb {
          position: absolute;
          top: -200px;
          right: -200px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.06) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          animation: float 8s ease-in-out infinite;
        }

        .gradient-orb-2 {
          position: absolute;
          bottom: -150px;
          left: -150px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.04) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          animation: float 10s ease-in-out infinite reverse;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.05); }
        }

        .auth-form {
          width: 100%;
          max-width: 560px;
          background: white;
          border-radius: 2rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.04);
          padding: 2.5rem 2rem;
          position: relative;
          z-index: 1;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          transition: all 0.3s ease;
          max-height: 95vh;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .auth-form::-webkit-scrollbar {
          width: 4px;
        }

        .auth-form::-webkit-scrollbar-track {
          background: transparent;
        }

        .auth-form::-webkit-scrollbar-thumb {
          background: #2563eb;
          border-radius: 10px;
        }

        .auth-form:hover {
          box-shadow: 0 24px 70px rgba(37, 99, 235, 0.1), 0 8px 24px rgba(0, 0, 0, 0.04);
        }

        .form-wrapper {
          width: 100%;
          position: relative;
          z-index: 2;
          overflow: hidden;
        }

        .alert-container {
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .alert {
          display: flex;
          align-items: center;
          padding: 0.875rem 1.25rem;
          border-radius: 1rem;
          animation: slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          gap: 0.75rem;
          width: 100%;
          overflow: hidden;
        }

        .error {
          background: linear-gradient(135deg, #fef2f2, #fde8e8);
          border: 1px solid #fecaca;
        }

        .success {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 1px solid #bbf7d0;
        }

        .info {
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border: 1px solid #bfdbfe;
        }

        .alert-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .alert-icon.error {
          color: #ef4444;
        }

        .alert-icon.success {
          color: #22c55e;
        }

        .alert-icon.info {
          color: #3b82f6;
        }

        .alert-text {
          flex: 1;
          font-weight: 500;
          font-size: 0.875rem;
          color: #1f2937;
          word-break: break-word;
        }

        .alert-close {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .alert-close:hover {
          background: rgba(0,0,0,0.05);
          color: #4b5563;
          transform: rotate(90deg);
        }

        .form-header {
          margin-bottom: 2rem;
        }

        .logo-link {
          display: block;
          max-width: 240px;
          margin: 0 auto 1.5rem;
          transition: transform 0.3s ease;
        }

        .logo-link:hover {
          transform: scale(1.02);
        }

        .logo-image {
          width: 100%;
          height: auto;
        }

        .header-content {
          text-align: center;
        }

        .title-badge {
          display: flex;
          justify-content: center;
          margin-bottom: 0.75rem;
        }

        .badge {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.3rem 1rem;
          border-radius: 2rem;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .form-subtitle {
          color: #6b7280;
          font-size: 0.95rem;
          line-height: 1.6;
          max-width: 400px;
          margin: 0 auto;
        }

        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          margin-bottom: 0.5rem;
          width: 100%;
        }

        .input-row {
          display: flex;
          gap: 0.875rem;
          width: 100%;
        }

        .input-row .half {
          flex: 1;
          min-width: 0;
        }

        .input-field {
          position: relative;
          border-radius: 0.875rem;
          background: #f8fafc;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          flex-direction: column;
          width: 100%;
          min-width: 0;
        }

        .input-field.focused {
          background: white;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
          transform: scale(1.01);
        }

        .input-field.has-error {
          background: #fef2f2;
        }

        .input-field.has-error .form-input {
          border-color: #ef4444;
        }

        .input-field.has-error .input-icon {
          color: #ef4444;
        }

        .input-icon {
          position: absolute;
          top: 1.125rem;
          left: 1rem;
          color: #94a3b8;
          font-size: 1.25rem;
          pointer-events: none;
          z-index: 2;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.5rem;
          height: 1.5rem;
          flex-shrink: 0;
        }

        .input-field.focused .input-icon {
          color: #2563eb;
        }

        .form-input {
          width: 100%;
          min-width: 0;
          height: 3.5rem;
          background: transparent;
          border-radius: 0.875rem;
          padding-left: 3.5rem;
          padding-right: 1rem;
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
          font-size: 0.95rem;
          color: #1f2937;
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          -webkit-appearance: none;
          appearance: none;
          box-sizing: border-box;
        }

        .form-input:focus {
          border-color: #2563eb;
          outline: none;
          box-shadow: none;
        }

        .form-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: #f1f5f9;
        }

        .form-input::placeholder {
          color: #94a3b8;
        }

        .form-input[type="number"]::-webkit-inner-spin-button,
        .form-input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .form-input[type="number"] {
          -moz-appearance: textfield;
        }

        .input-highlight {
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2.5px;
          background: linear-gradient(90deg, #2563eb, #3b82f6);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform: translateX(-50%);
          border-radius: 0 0 0.875rem 0.875rem;
        }

        .input-field.focused .input-highlight {
          width: 70%;
        }

        .field-error {
          color: #ef4444;
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.25rem 0.5rem 0.25rem 1rem;
          display: block;
          animation: slideDown 0.3s ease;
        }

        .input-loading {
          position: absolute;
          right: 1rem;
          top: 1.125rem;
          color: #2563eb;
          font-size: 1.25rem;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .select-input {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          padding-right: 2.5rem;
          cursor: pointer;
        }

        .select-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .select-input option {
          padding: 0.5rem;
          background: white;
        }

        .services-container {
          margin: 1.5rem 0 0.5rem;
          padding: 1.25rem;
          background: #f8fafc;
          border-radius: 1rem;
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
          width: 100%;
          overflow: hidden;
        }

        .services-container:hover {
          border-color: #cbd5e1;
          background: #fafbfc;
        }

        .services-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .services-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: #1f2937;
          font-size: 0.9rem;
        }

        .services-icon {
          font-size: 1.25rem;
          color: #2563eb;
        }

        .selected-badge {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.25rem 0.875rem;
          border-radius: 2rem;
          letter-spacing: 0.3px;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
          white-space: nowrap;
        }

        .services-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
          width: 100%;
        }

        .service-chip {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 2rem;
          font-size: 0.8rem;
          font-weight: 500;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          user-select: none;
          touch-action: manipulation;
          flex-shrink: 0;
        }

        .service-chip:hover {
          border-color: #93b5f0;
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.12);
        }

        .service-chip:active {
          transform: scale(0.95);
        }

        .service-chip.selected {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border-color: #2563eb;
          color: white;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
          transform: scale(1.02);
        }

        .service-chip-icon {
          font-size: 1rem;
          color: #64748b;
          flex-shrink: 0;
        }

        .service-chip.selected .service-chip-icon {
          color: white;
        }

        .check-icon {
          font-size: 0.875rem;
          animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          flex-shrink: 0;
        }

        .verification-section {
          background: linear-gradient(135deg, #f0f7ff, #e8f0fe);
          border: 2px solid #bfdbfe;
          border-radius: 1rem;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .verification-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          font-weight: 600;
          color: #1e40af;
          font-size: 0.95rem;
        }

        .verification-icon {
          font-size: 1.25rem;
          color: #2563eb;
        }

        .verification-title {
          color: #1e293b;
        }

        .verification-info {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 0.5rem;
          font-size: 0.8rem;
          color: #475569;
          margin-bottom: 0.75rem;
        }

        .verification-info svg {
          flex-shrink: 0;
          margin-top: 0.1rem;
          color: #64748b;
        }

        .verification-input-group {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .verification-input-group .input-field {
          flex: 1;
        }

        .verification-actions {
          display: flex;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .verify-button {
          padding: 0 1.25rem;
          height: 3.5rem;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          border: none;
          border-radius: 0.875rem;
          font-weight: 600;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .verify-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
        }

        .verify-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .verify-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .reset-button {
          padding: 0 1.25rem;
          height: 3.5rem;
          background: #f1f5f9;
          color: #64748b;
          border: 2px solid #e2e8f0;
          border-radius: 0.875rem;
          font-weight: 600;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .reset-button:hover:not(:disabled) {
          background: #fee2e2;
          border-color: #fca5a5;
          color: #dc2626;
        }

        .reset-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner-small {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spinner-border 0.75s linear infinite;
        }

        .verification-status {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.85rem;
        }

        .verification-status.success {
          background: #dcfce7;
          color: #166534;
          border-left: 4px solid #22c55e;
        }

        .verification-status.success svg {
          color: #22c55e;
          flex-shrink: 0;
          font-size: 1.25rem;
        }

        .code-display {
          display: inline-block;
          background: #166534;
          color: white;
          padding: 0.15rem 0.75rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.8rem;
          margin-top: 0.25rem;
        }

        .verified-by-display {
          display: inline-block;
          background: #059669;
          color: white;
          padding: 0.15rem 0.75rem;
          border-radius: 0.25rem;
          font-size: 0.7rem;
          margin-left: 0.5rem;
          font-weight: 500;
        }

        .verification-prompt {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem;
          text-align: center;
          background: #f8fafc;
          border-radius: 1rem;
          border: 2px dashed #e2e8f0;
          margin-top: 1rem;
        }

        .verification-prompt svg {
          font-size: 3rem;
          color: #94a3b8;
          margin-bottom: 1rem;
        }

        .verification-prompt p {
          color: #64748b;
          font-size: 0.95rem;
          max-width: 300px;
          margin: 0;
          line-height: 1.6;
        }

        .submit-button {
          width: 100%;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          border: none;
          border-radius: 1rem;
          font-size: 0.95rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          margin-top: 1.5rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.25);
          touch-action: manipulation;
        }

        .submit-button::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transition: left 0.6s ease;
        }

        .submit-button:hover:not(:disabled)::before {
          left: 100%;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 8px 30px rgba(37, 99, 235, 0.35);
        }

        .submit-button:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }

        .submit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          background: #94a3b8;
        }

        .button-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .spinner {
          display: inline-block;
          width: 1.25rem;
          height: 1.25rem;
          border: 2.5px solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spinner-border 0.75s linear infinite;
          flex-shrink: 0;
        }

        /* ===== SUCCESS MODAL ===== */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
          padding: 1rem;
        }

        .modal-content {
          background: white;
          border-radius: 1.5rem;
          max-width: 480px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          padding: 2rem 2rem 1rem;
          text-align: center;
        }

        .modal-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          margin: 0 auto 1rem;
          font-size: 2.5rem;
        }

        .success-icon {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          color: #22c55e;
        }

        .modal-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.25rem;
        }

        .modal-subtitle {
          color: #6b7280;
          font-size: 0.95rem;
          margin: 0;
        }

        .modal-body {
          padding: 1rem 2rem 0.5rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.625rem 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .detail-item.highlight {
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          margin: 0 -0.5rem;
          padding: 0.625rem 0.5rem;
          border-radius: 0.5rem;
          border-bottom: none;
        }

        .detail-label {
          font-weight: 500;
          color: #4b5563;
          font-size: 0.875rem;
        }

        .detail-value {
          color: #1f2937;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .modal-footer {
          padding: 1.5rem 2rem 2rem;
          text-align: center;
        }

        .modal-button {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          border: none;
          padding: 0.75rem 2.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.2);
        }

        .modal-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
        }

        /* ===== MODAL ANIMATIONS ===== */
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes spinner-border {
          to { transform: rotate(360deg); }
        }

        @keyframes popIn {
          0% {
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          70% {
            transform: scale(1.2) rotate(0deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .auth-form {
            padding: 2rem 1.5rem;
            max-width: 100%;
            border-radius: 1.5rem;
          }
          .logo-link {
            max-width: 200px;
          }
          .modal-content {
            max-width: 90%;
          }
        }

        @media (max-width: 640px) {
          .auth-container {
            padding: 0.75rem;
            align-items: flex-start;
            padding-top: 1rem;
          }
          .auth-form {
            padding: 1.5rem 1rem;
            border-radius: 1.25rem;
            max-height: 98vh;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
          }
          .form-header {
            margin-bottom: 1.5rem;
          }
          .logo-link {
            max-width: 170px;
            margin-bottom: 1rem;
          }
          .badge {
            font-size: 0.6rem;
            padding: 0.2rem 0.75rem;
          }
          .verification-section {
            padding: 1rem;
          }
          .verification-input-group {
            flex-direction: column;
          }
          .verify-button,
          .reset-button {
            width: 100%;
            justify-content: center;
            height: 3rem;
          }
          .form-grid {
            gap: 0.75rem;
          }
          .input-row {
            flex-direction: column;
            gap: 0.75rem;
          }
          .input-row .half {
            flex: none;
            width: 100%;
          }
          .form-input {
            height: 3.25rem;
            font-size: 0.9rem;
            padding-left: 3rem;
            padding-right: 0.75rem;
          }
          .input-icon {
            font-size: 1.1rem;
            top: 1rem;
            left: 0.875rem;
          }
          .services-container {
            padding: 1rem;
            margin: 1rem 0 0.5rem;
          }
          .services-grid {
            gap: 0.5rem;
          }
          .service-chip {
            font-size: 0.75rem;
            padding: 0.4rem 0.75rem;
          }
          .submit-button {
            padding: 0.875rem 1.25rem;
            font-size: 0.9rem;
            margin-top: 1.5rem;
          }
          .gradient-orb,
          .gradient-orb-2 {
            display: none;
          }
          .modal-content {
            max-width: 95%;
            border-radius: 1.25rem;
          }
          .modal-header {
            padding: 1.5rem 1.5rem 0.75rem;
          }
          .modal-icon {
            width: 56px;
            height: 56px;
            font-size: 2rem;
          }
          .modal-header h2 {
            font-size: 1.25rem;
          }
          .modal-body {
            padding: 0.75rem 1.5rem 0.25rem;
          }
          .modal-footer {
            padding: 1rem 1.5rem 1.5rem;
          }
        }

        @media (max-width: 400px) {
          .auth-container {
            padding: 0.5rem;
            padding-top: 0.75rem;
          }
          .auth-form {
            padding: 1.25rem 0.75rem;
            border-radius: 1rem;
          }
          .form-input {
            height: 3rem;
            font-size: 0.85rem;
            padding-left: 2.75rem;
          }
          .input-icon {
            font-size: 1rem;
            top: 0.875rem;
            left: 0.75rem;
          }
          .logo-link {
            max-width: 150px;
          }
          .submit-button {
            padding: 0.75rem 1rem;
            font-size: 0.85rem;
          }
          .modal-header h2 {
            font-size: 1.1rem;
          }
        }

        @media (max-height: 600px) and (orientation: landscape) {
          .auth-container {
            padding: 0.5rem;
            align-items: center;
          }
          .auth-form {
            padding: 1.25rem 1.5rem;
            max-height: 98vh;
          }
          .form-header {
            margin-bottom: 0.75rem;
          }
          .logo-link {
            max-width: 130px;
            margin-bottom: 0.5rem;
          }
          .form-grid {
            gap: 0.5rem;
          }
          .form-input {
            height: 2.75rem;
            font-size: 0.8rem;
            padding-left: 2.75rem;
          }
          .input-icon {
            font-size: 0.9rem;
            top: 0.875rem;
            left: 0.75rem;
          }
          .input-row {
            flex-direction: row;
            gap: 0.5rem;
          }
          .services-container {
            padding: 0.75rem;
            margin: 0.75rem 0 0.25rem;
          }
          .services-grid {
            gap: 0.375rem;
          }
          .service-chip {
            font-size: 0.65rem;
            padding: 0.3rem 0.625rem;
          }
          .submit-button {
            padding: 0.625rem 1rem;
            font-size: 0.8rem;
            margin-top: 0.75rem;
          }
          .badge {
            display: none;
          }
          .verification-section {
            padding: 0.75rem;
          }
          .verification-input-group {
            flex-direction: row;
          }
          .verify-button,
          .reset-button {
            height: 2.75rem;
            padding: 0 0.75rem;
            font-size: 0.75rem;
          }
          .modal-content {
            max-height: 90vh;
          }
          .modal-header {
            padding: 1rem 1.5rem 0.5rem;
          }
          .modal-icon {
            width: 48px;
            height: 48px;
            font-size: 1.75rem;
          }
          .modal-body {
            padding: 0.5rem 1.5rem 0.25rem;
          }
          .modal-footer {
            padding: 0.75rem 1.5rem 1rem;
          }
        }
      `}</style>
    </section>
  );
};

export default FarmerRegistration;
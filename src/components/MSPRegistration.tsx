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

interface Training {
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

const MSPRegistration = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [activeHubs, setActiveHubs] = useState<ActiveHub[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [lgas, setLgas] = useState<LGA[]>([]);
  const [isExistingMSP, setIsExistingMSP] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  
  // Static list of trainings
  const trainings: Training[] = [
    { id: 'mobilization-sensitization', name: 'Mobilization & Sensitization', icon: 'mdi:bullhorn' },
    { id: 'quarterly-review-meeting', name: 'Quarterly Review Meeting', icon: 'mdi:calendar-check' },
    { id: 'msp-training', name: 'MSP Training', icon: 'mdi:school' },
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
    trainingsAttended: [] as string[],
    year: '', // New field: Year
    mspCategory: '', // New field: MSP Category
  });
  
  const router = useRouter();

  // Load States from active hubs initially
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

  // Extract unique LGAs for the selected state from activeHubs
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
    
    // Reset LGA selection when state changes
    setFormData(prev => ({ ...prev, lgaId: '' }));
  }, [formData.stateId, activeHubs]);

  // Validate phone number on change (after 11 digits) and prefill if existing MSP
  useEffect(() => {
    if (formData.phoneNumber.length === 11) {
      (async () => {
        try {
          setCheckingPhone(true);
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/validate-msp/${formData.phoneNumber}`);
          if (res.data.exists) {
            setFormData((prev) => ({
              ...prev,
              fullname: res.data.fullname || "",
              email: res.data.email || "",
              age: res.data.age || "",
              gender: res.data.gender || "",
              // Don't override year and mspCategory for existing MSPs
            }));
            setIsExistingMSP(true);
            setMessage("Existing MSP found. Details prefilled (read-only).");
          } else {
            setFormData((prev) => ({
              ...prev,
              fullname: "",
              email: "",
              age: "",
              gender: "",
              // Don't reset year and mspCategory for new MSPs
            }));
            setIsExistingMSP(false);
            setMessage("New MSP — please enter your details (will be registered on submit).");
          }
        } catch (err) {
          setMessage("Could not validate number.");
          setIsExistingMSP(false);
          console.error(err);
        } finally {
          setCheckingPhone(false);
        }
      })();
    } else {
      if (formData.phoneNumber.length < 11 && formData.phoneNumber.length > 0) {
        setMessage("");
        setIsExistingMSP(false);
        setFormData((prev) => ({
          ...prev,
          fullname: "",
          email: "",
          age: "",
          gender: "",
          // Don't reset year and mspCategory
        }));
      }
    }
  }, [formData.phoneNumber]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
    if (message) setMessage('');
    // Clear field-specific errors when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: [] }));
    }
  };

  const handleTrainingToggle = (trainingId: string) => {
    setFormData(prev => {
      const currentTrainings = prev.trainingsAttended;
      const isSelected = currentTrainings.includes(trainingId);
      const updatedTrainings = isSelected
        ? currentTrainings.filter(id => id !== trainingId)
        : [...currentTrainings, trainingId];
      return { ...prev, trainingsAttended: updatedTrainings };
    });
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setFieldErrors({});

    try {
      if (!formData.fullname || !formData.phoneNumber || !formData.age || !formData.stateId || !formData.lgaId || !formData.year || !formData.mspCategory) {
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
        trainingsAttended: formData.trainingsAttended,
        year: formData.year, // Add year to payload
        mspCategory: formData.mspCategory, // Add MSP category to payload
      };

      console.log('Sending payload:', payload);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/msps/register`,
        payload,
        { withCredentials: true }
      );

      setSuccessMessage('MSP Registration successful!');
      setMessage('');
      
     
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      // Handle validation errors from backend
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

  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  // Helper to check if a field has an error
  const hasFieldError = (fieldName: string): boolean => {
    return fieldErrors[fieldName] && fieldErrors[fieldName].length > 0;
  };

  // Helper to get field error message
  const getFieldError = (fieldName: string): string => {
    return fieldErrors[fieldName]?.[0] || '';
  };

  return (
    <section className='auth-container'>
      <div className='auth-form'>
        <div className='form-wrapper'>
          {/* Decorative gradient orbs */}
          <div className="gradient-orb"></div>
          <div className="gradient-orb-2"></div>

          <div className="form-header">
            <Link href='/' className='logo-link'>
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
                <span className="badge">ISSAM Project Attendance Form</span>
              </div>
              <p className='form-subtitle'>
                If you've attended any of ISSAM Project trainings, sensitization or mobilization, kindly fill this form.
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
            {successMessage && (
              <div className="alert success">
                <Icon icon="clarity:success-standard-line" className="alert-icon success" />
                <span className="alert-text">{successMessage}</span>
                <button className="alert-close" onClick={() => setSuccessMessage(null)}>
                  <Icon icon="mdi:close" />
                </button>
              </div>
            )}
            {message && (
              <div className={`alert ${isExistingMSP ? 'success' : 'info'}`}>
                <Icon 
                  icon={isExistingMSP ? "clarity:success-standard-line" : "mdi:information"} 
                  className={`alert-icon ${isExistingMSP ? 'success' : 'info'}`} 
                />
                <span className="alert-text">{message}</span>
              </div>
            )}
          </div>

          <form onSubmit={submitForm}>
            <div className="form-grid">
              {/* Phone Number - Primary identifier */}
              <div className={`input-field ${focusedField === 'phoneNumber' ? 'focused' : ''} ${hasFieldError('phoneNumber') ? 'has-error' : ''}`}>
                <span className='input-icon'>
                  <Icon icon='mdi:phone' />
                </span>
                <input
                  type='tel'
                  name='phoneNumber'
                  className='form-input'
                  placeholder='Phone Number (11 digits)'
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('phoneNumber')}
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
                <span className="input-highlight"></span>
                {hasFieldError('phoneNumber') && (
                  <span className="field-error">{getFieldError('phoneNumber')}</span>
                )}
              </div>

              {/* Full Name */}
              <div className={`input-field ${focusedField === 'fullname' ? 'focused' : ''} ${hasFieldError('fullName') ? 'has-error' : ''}`}>
                <span className='input-icon'>
                  <Icon icon='mdi:user' />
                </span>
                <input
                  type='text'
                  name='fullname'
                  className='form-input'
                  placeholder='Full Name'
                  value={formData.fullname}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('fullname')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isSubmitting || isExistingMSP}
                  required
                />
                <span className="input-highlight"></span>
                {hasFieldError('fullName') && (
                  <span className="field-error">{getFieldError('fullName')}</span>
                )}
              </div>

              {/* Email */}
              <div className={`input-field ${focusedField === 'email' ? 'focused' : ''} ${hasFieldError('email') ? 'has-error' : ''}`}>
                <span className='input-icon'>
                  <Icon icon='mdi:email' />
                </span>
                <input
                  type='email'
                  name='email'
                  className='form-input'
                  placeholder='Email Address'
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isSubmitting || isExistingMSP}
                />
                <span className="input-highlight"></span>
                {hasFieldError('email') && (
                  <span className="field-error">{getFieldError('email')}</span>
                )}
              </div>

              {/* Age and Gender in a row */}
              <div className="input-row">
                <div className={`input-field half ${focusedField === 'age' ? 'focused' : ''} ${hasFieldError('age') ? 'has-error' : ''}`}>
                  <span className='input-icon'>
                    <Icon icon='mdi:calendar' />
                  </span>
                  <input
                    type='number'
                    name='age'
                    className='form-input'
                    placeholder='Age'
                    value={formData.age}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('age')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isSubmitting || isExistingMSP}
                    min="18"
                    max="120"
                    required
                  />
                  <span className="input-highlight"></span>
                  {hasFieldError('age') && (
                    <span className="field-error">{getFieldError('age')}</span>
                  )}
                </div>

                <div className={`input-field half ${focusedField === 'gender' ? 'focused' : ''} ${hasFieldError('gender') ? 'has-error' : ''}`}>
                  <span className='input-icon'>
                    <Icon icon='mdi:gender-male-female' />
                  </span>
                  <select
                    name='gender'
                    className='form-input select-input'
                    value={formData.gender}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('gender')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isSubmitting || isExistingMSP}
                  >
                    <option value=''>Gender</option>
                    <option value='Male'>Male</option>
                    <option value='Female'>Female</option>
                  </select>
                  <span className="input-highlight"></span>
                  {hasFieldError('gender') && (
                    <span className="field-error">{getFieldError('gender')}</span>
                  )}
                </div>
              </div>

              {/* Year Dropdown - NEW FIELD */}
              <div className={`input-field ${focusedField === 'year' ? 'focused' : ''} ${hasFieldError('year') ? 'has-error' : ''}`}>
                <span className='input-icon'>
                  <Icon icon='mdi:calendar-range' />
                </span>
                <select
                  name='year'
                  className='form-input select-input'
                  value={formData.year}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('year')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isSubmitting}
                  required
                >
                  <option value=''>Select Year</option>
                  <option value='Year 1'>Year 1</option>
                  <option value='Year 2'>Year 2</option>
                  <option value='Year 1&2'>All</option>
                </select>
                <span className="input-highlight"></span>
                {hasFieldError('year') && (
                  <span className="field-error">{getFieldError('year')}</span>
                )}
              </div>

              {/* MSP Category Dropdown - NEW FIELD */}
              <div className={`input-field ${focusedField === 'mspCategory' ? 'focused' : ''} ${hasFieldError('mspCategory') ? 'has-error' : ''}`}>
                <span className='input-icon'>
                  <Icon icon='mdi:account-tag' />
                </span>
                <select
                  name='mspCategory'
                  className='form-input select-input'
                  value={formData.mspCategory}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('mspCategory')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isSubmitting}
                  required
                >
                  <option value=''>Select MSP Category</option>
                  <option value='Mechanic'>Mechanic</option>
                  <option value='Existing MSP'>Existing MSP</option>
                  <option value='New MSP'>New MSP</option>
                  <option value='CL'>CL</option>
                  <option value='SubCL'>SubCL</option>
                </select>
                <span className="input-highlight"></span>
                {hasFieldError('mspCategory') && (
                  <span className="field-error">{getFieldError('mspCategory')}</span>
                )}
              </div>

              {/* State Dropdown */}
              <div className={`input-field ${focusedField === 'stateId' ? 'focused' : ''} ${hasFieldError('stateId') ? 'has-error' : ''}`}>
                <span className='input-icon'>
                  <Icon icon='mdi:map-marker' />
                </span>
                <select
                  name='stateId'
                  className='form-input select-input'
                  value={formData.stateId}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('stateId')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isSubmitting || loadingStates || states.length === 0}
                  required
                >
                  <option value=''>Select State</option>
                  {states.map(state => (
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
                <span className="input-highlight"></span>
                {hasFieldError('stateId') && (
                  <span className="field-error">{getFieldError('stateId')}</span>
                )}
              </div>

              {/* LGA Dropdown */}
              <div className={`input-field ${focusedField === 'lgaId' ? 'focused' : ''} ${hasFieldError('lgaId') ? 'has-error' : ''}`}>
                <span className='input-icon'>
                  <Icon icon='mdi:city' />
                </span>
                <select
                  name='lgaId'
                  className='form-input select-input'
                  value={formData.lgaId}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('lgaId')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isSubmitting || !formData.stateId || lgas.length === 0}
                  required
                >
                  <option value=''>Select LGA</option>
                  {lgas.map(lga => (
                    <option key={lga.id} value={lga.id}>
                      {lga.name}
                    </option>
                  ))}
                </select>
                <span className="input-highlight"></span>
                {hasFieldError('lgaId') && (
                  <span className="field-error">{getFieldError('lgaId')}</span>
                )}
              </div>
            </div>

            {/* Trainings Attended Multi-Select */}
            <div className='services-container'>
              <div className='services-header'>
                <div className='services-label'>
                  <Icon icon='mdi:school' className='services-icon' />
                  <span>Trainings Attended</span>
                </div>
                {formData.trainingsAttended.length > 0 && (
                  <span className='selected-badge'>
                    {formData.trainingsAttended.length} selected
                  </span>
                )}
              </div>
              <div className='services-grid'>
                {trainings.map((training) => {
                  const isSelected = formData.trainingsAttended.includes(training.id);
                  
                  return (
                    <div 
                      key={training.id} 
                      className={`service-chip ${isSelected ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isSubmitting) {
                          handleTrainingToggle(training.id);
                        }
                      }}
                    >
                      <Icon icon={training.icon || 'mdi:tools'} className="service-chip-icon" />
                      <span>{training.name}</span>
                      {isSelected && (
                        <Icon icon='mdi:check-circle' className='check-icon' />
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
                  <span className="spinner" role="status" aria-hidden="true"></span>
                  Submitting...
                </>
              ) : (
                <>
                  <Icon icon="mdi:account-plus" className="button-icon" />
                  Submit
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        /* ===== RESET & BASE ===== */
        * {
          box-sizing: border-box;
        }

        .auth-container {
          display: flex;
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
          background: linear-gradient(135deg, #f0f4ff 0%, #fafbfc 100%);
          justify-content: center;
          align-items: center;
          padding: 1rem;
          position: relative;
        }

        /* ===== DECORATIVE ORBS ===== */
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

        /* ===== FORM CARD ===== */
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
          max-height: 95dvh;
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

        /* ===== ALERT STYLES ===== */
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

        /* ===== FORM HEADER ===== */
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

        .form-title {
          color: #1f2937;
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .title-icon {
          color: #2563eb;
          font-size: 1.75rem;
        }

        .form-subtitle {
          color: #6b7280;
          font-size: 0.95rem;
          line-height: 1.6;
          max-width: 400px;
          margin: 0 auto;
        }

        /* ===== FORM GRID ===== */
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

        /* ===== INPUT FIELDS ===== */
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

        /* Remove number input spinners */
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

        /* ===== SELECT INPUT ===== */
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

        /* ===== TRAININGS ===== */
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

        /* ===== SUBMIT BUTTON ===== */
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
          margin-top: 2rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.25);
          touch-action: manipulation;
        }

        .submit-button::before {
          content: '';
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
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
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

        /* ===== ANIMATIONS ===== */
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

        /* ======================================== */
        /* ===== RESPONSIVE BREAKPOINTS ===== */
        /* ======================================== */

        /* === Tablets & Small Laptops === */
        @media (max-width: 768px) {
          .auth-form {
            padding: 2rem 1.5rem;
            max-width: 100%;
            border-radius: 1.5rem;
          }

          .form-title {
            font-size: 1.5rem;
          }

          .form-subtitle {
            font-size: 0.9rem;
          }

          .logo-link {
            max-width: 200px;
          }
        }

        /* === Mobile Phones === */
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
            max-height: 98dvh;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
          }

          .form-header {
            margin-bottom: 1.5rem;
          }

          .logo-link {
            max-width: 170px;
            margin-bottom: 1rem;
          }

          .form-title {
            font-size: 1.25rem;
            gap: 0.5rem;
          }

          .title-icon {
            font-size: 1.25rem;
          }

          .form-subtitle {
            font-size: 0.85rem;
            padding: 0 0.5rem;
          }

          .badge {
            font-size: 0.6rem;
            padding: 0.2rem 0.75rem;
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
            width: 1.25rem;
            height: 1.25rem;
          }

          .services-container {
            padding: 1rem;
            margin: 1rem 0 0.5rem;
          }

          .services-label {
            font-size: 0.85rem;
          }

          .services-grid {
            gap: 0.5rem;
          }

          .service-chip {
            font-size: 0.75rem;
            padding: 0.4rem 0.75rem;
            gap: 0.4rem;
          }

          .service-chip-icon {
            font-size: 0.875rem;
          }

          .selected-badge {
            font-size: 0.65rem;
            padding: 0.2rem 0.625rem;
          }

          .submit-button {
            padding: 0.875rem 1.25rem;
            font-size: 0.9rem;
            margin-top: 1.5rem;
            border-radius: 0.875rem;
          }

          .button-icon {
            font-size: 1.1rem;
          }

          .alert {
            padding: 0.75rem 1rem;
            border-radius: 0.75rem;
            gap: 0.5rem;
          }

          .alert-text {
            font-size: 0.8rem;
          }

          .alert-icon {
            font-size: 1.1rem;
          }

          .alert-close {
            font-size: 1.1rem;
          }

          .gradient-orb,
          .gradient-orb-2 {
            display: none;
          }

          .input-loading {
            font-size: 1.1rem;
            top: 1rem;
            right: 0.75rem;
          }

          .select-input {
            background-position: right 0.75rem center;
            padding-right: 2rem;
          }

          .field-error {
            font-size: 0.7rem;
            padding: 0.2rem 0.5rem 0.2rem 0.75rem;
          }
        }

        /* === Small Mobile Phones === */
        @media (max-width: 400px) {
          .auth-container {
            padding: 0.5rem;
            padding-top: 0.75rem;
          }

          .auth-form {
            padding: 1.25rem 0.75rem;
            border-radius: 1rem;
          }

          .form-title {
            font-size: 1.1rem;
          }

          .title-icon {
            font-size: 1.1rem;
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
            width: 1.1rem;
            height: 1.1rem;
          }

          .logo-link {
            max-width: 150px;
          }

          .services-container {
            padding: 0.75rem;
          }

          .service-chip {
            font-size: 0.7rem;
            padding: 0.35rem 0.625rem;
          }

          .submit-button {
            padding: 0.75rem 1rem;
            font-size: 0.85rem;
          }
        }

        /* === Landscape Mode on Mobile === */
        @media (max-height: 600px) and (orientation: landscape) {
          .auth-container {
            padding: 0.5rem;
            align-items: center;
          }

          .auth-form {
            padding: 1.25rem 1.5rem;
            max-height: 98vh;
            max-height: 98dvh;
          }

          .form-header {
            margin-bottom: 0.75rem;
          }

          .logo-link {
            max-width: 130px;
            margin-bottom: 0.5rem;
          }

          .form-title {
            font-size: 1.1rem;
          }

          .form-subtitle {
            font-size: 0.75rem;
            margin-bottom: 0;
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
        }
      `}</style>
    </section>
  );
};

export default MSPRegistration;
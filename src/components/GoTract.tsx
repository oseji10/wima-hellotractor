'use client';
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Image from "next/image";

/* ------------------------------------------------------------------ */
/*  GoTRACT - Gombe Tractor Access & Capacity Transformation Programme */
/*  Youth application form (multi-step)                                */
/*  Colours kept on the original WIMA blue palette (#16a34a).          */
/*  To use WIMA brand green instead, change --accent / --accent-dark   */
/*  in the styles block at the bottom of this file.                    */
/* ------------------------------------------------------------------ */

interface OptionItem {
  id: string;
  name: string;
  icon?: string;
}

// The programme runs across all 11 LGAs of Gombe State.
const GOMBE_LGAS: string[] = [
  'Akko', 'Balanga', 'Billiri', 'Dukku', 'Funakaye', 'Gombe',
  'Kaltungo', 'Kwami', 'Nafada', 'Shongom', 'Yamaltu/Deba',
];

const PREFERRED_SERVICES: OptionItem[] = [
  { id: 'ploughing', name: 'Ploughing', icon: 'mdi:tractor' },
  { id: 'planting', name: 'Planting', icon: 'mdi:sprout' },
  { id: 'harvesting', name: 'Harvesting', icon: 'mdi:grain' },
  { id: 'harrowing', name: 'Harrowing', icon: 'mdi:rake' },
  { id: 'tilling', name: 'Tilling', icon: 'mdi:shovel' },
  { id: 'threshing', name: 'Threshing', icon: 'mdi:cog-transfer' },
  { id: 'water-pumping', name: 'Water Pumping', icon: 'mdi:water-pump' },
  { id: 'other', name: 'Other', icon: 'mdi:dots-horizontal' },
];

const TRAINING_AREAS: OptionItem[] = [
  { id: 'mechanization-operation', name: 'Mechanization Equipment Operation', icon: 'mdi:tractor-variant' },
  { id: 'business-financial', name: 'Business & Financial Management', icon: 'mdi:finance' },
  { id: 'group-leadership', name: 'Group Dynamics & Leadership', icon: 'mdi:account-group' },
  { id: 'other', name: 'Other', icon: 'mdi:dots-horizontal' },
];

const STEPS = [
  { id: 1, label: 'Personal', icon: 'mdi:account' },
  { id: 2, label: 'ID & Banking', icon: 'mdi:card-account-details' },
  { id: 3, label: 'Farm Profile', icon: 'mdi:barn' },
  { id: 4, label: 'Mechanization', icon: 'mdi:tractor' },
  { id: 5, label: 'Training & Consent', icon: 'mdi:shield-check' },
];

const TOTAL_STEPS = STEPS.length;

type FormState = {
  fullName: string; gender: string; dateOfBirth: string; phoneNumber: string; email: string;
  state: string; lga: string; village: string;
  nationalId: string; bvn: string; bankAccountNumber: string; bankName: string;
  hasDisability: string; disabilityType: string; disabilityOther: string;
  maritalStatus: string; primaryOccupation: string; occupationOther: string;
  cropsFarmed: string; householdSize: string; dependents: string;
  landArea: string; landOwnership: string;
  inCooperative: string; cooperativeName: string; priorMechExperience: string;
  preferredServices: string[]; currentlyEmployed: string; willingRepayment: string; accessToCredit: string;
  trainingAreas: string[]; trainingOther: string; consent: boolean; signature: string;
};

const INITIAL_FORM: FormState = {
  fullName: '', gender: '', dateOfBirth: '', phoneNumber: '', email: '',
  state: 'Gombe', lga: '', village: '',
  nationalId: '', bvn: '', bankAccountNumber: '', bankName: '',
  hasDisability: '', disabilityType: '', disabilityOther: '',
  maritalStatus: '', primaryOccupation: '', occupationOther: '',
  cropsFarmed: '', householdSize: '', dependents: '',
  landArea: '', landOwnership: '',
  inCooperative: '', cooperativeName: '', priorMechExperience: '',
  preferredServices: [], currentlyEmployed: '', willingRepayment: '', accessToCredit: '',
  trainingAreas: [], trainingOther: '', consent: false, signature: '',
};

// Shared context passed to module-level field components so they don't
// remount on every keystroke (which would otherwise steal input focus).
type FieldCtx = {
  formData: FormState;
  focusedField: string | null;
  fieldErrors: Record<string, string[]>;
  isSubmitting: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  setFocusedField: (s: string | null) => void;
  setField: (n: keyof FormState, v: any) => void;
};

const errOf = (ctx: FieldCtx, field: string) =>
  ctx.fieldErrors[field] && ctx.fieldErrors[field].length > 0 ? ctx.fieldErrors[field][0] : '';

const TextField = ({
  ctx, name, placeholder, icon, type = 'text', maxLength, inputMode,
}: {
  ctx: FieldCtx; name: keyof FormState; placeholder: string; icon: string;
  type?: string; maxLength?: number; inputMode?: any;
}) => {
  const err = errOf(ctx, name as string);
  return (
    <div className={`input-field ${ctx.focusedField === name ? 'focused' : ''} ${err ? 'has-error' : ''}`}>
      <span className='input-icon'><Icon icon={icon} /></span>
      <input
        type={type}
        name={name as string}
        className='form-input'
        placeholder={placeholder}
        value={ctx.formData[name] as string}
        onChange={ctx.handleChange}
        onFocus={() => ctx.setFocusedField(name as string)}
        onBlur={() => ctx.setFocusedField(null)}
        disabled={ctx.isSubmitting}
        maxLength={maxLength}
        inputMode={inputMode}
      />
      <span className="input-highlight" />
      {err && <span className="field-error">{err}</span>}
    </div>
  );
};

const SelectField = ({
  ctx, name, icon, placeholder, options,
}: {
  ctx: FieldCtx; name: keyof FormState; icon: string; placeholder: string;
  options: { value: string; label: string }[];
}) => {
  const err = errOf(ctx, name as string);
  return (
    <div className={`input-field ${ctx.focusedField === name ? 'focused' : ''} ${err ? 'has-error' : ''}`}>
      <span className='input-icon'><Icon icon={icon} /></span>
      <select
        name={name as string}
        className='form-input select-input'
        value={ctx.formData[name] as string}
        onChange={ctx.handleChange}
        onFocus={() => ctx.setFocusedField(name as string)}
        onBlur={() => ctx.setFocusedField(null)}
        disabled={ctx.isSubmitting}
      >
        <option value=''>{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="input-highlight" />
      {err && <span className="field-error">{err}</span>}
    </div>
  );
};

const YesNo = ({ ctx, name, question }: { ctx: FieldCtx; name: keyof FormState; question: string }) => {
  const err = errOf(ctx, name as string);
  return (
    <div className={`question-block ${err ? 'has-error' : ''}`}>
      <span className="question-text">{question}</span>
      <div className="yesno-group">
        {['Yes', 'No'].map(opt => (
          <button
            key={opt}
            type="button"
            className={`yesno-pill ${ctx.formData[name] === opt ? 'active' : ''}`}
            onClick={() => ctx.setField(name, opt)}
            disabled={ctx.isSubmitting}
          >
            <Icon icon={opt === 'Yes' ? 'mdi:check' : 'mdi:close'} />
            {opt}
          </button>
        ))}
      </div>
      {err && <span className="field-error inline">{err}</span>}
    </div>
  );
};

// Programme partners (from the GoTRACT proposal). Drop logo files into
// /public/assets/images/partners/ — until then each card shows the name.
const PARTNERS: { name: string; src: string }[] = [
  { name: 'Gombe State Government', src: '/assets/images/gotract/gombe_state.jpg' },
  { name: 'WIMA', src: '/assets/images/gotract/wima-base.png' },
  { name: 'AltBank', src: '/assets/images/gotract/alt_bank.webp' },
  { name: 'Sonalika Tractors', src: '/assets/images/gotract/sonalika.png' },
];

const PartnerLogo = ({ name, src }: { name: string; src: string }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="partner-card" title={name}>
      {failed ? (
        <span className="partner-fallback">{name}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="partner-img" loading="lazy" onError={() => setFailed(true)} />
      )}
    </div>
  );
};

const GoTractApplication = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [direction, setDirection] = useState<'next' | 'back'>('next');

  const router = useRouter();

  const age = useMemo(() => {
    if (!formData.dateOfBirth) return null;
    const dob = new Date(formData.dateOfBirth);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let a = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--;
    return a;
  }, [formData.dateOfBirth]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: [] }));
  };

  const setField = (name: keyof FormState, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
    if (fieldErrors[name as string]) setFieldErrors(prev => ({ ...prev, [name as string]: [] }));
  };

  const toggleArrayValue = (name: 'preferredServices' | 'trainingAreas', id: string) => {
    setFormData(prev => {
      const current = prev[name];
      const updated = current.includes(id) ? current.filter(v => v !== id) : [...current, id];
      return { ...prev, [name]: updated };
    });
  };

  const validateStep = (step: number): boolean => {
    const errs: Record<string, string[]> = {};

    if (step === 1) {
      if (!formData.fullName.trim()) errs.fullName = ['Full name is required'];
      if (!formData.gender) errs.gender = ['Select your gender'];
      if (!formData.dateOfBirth) errs.dateOfBirth = ['Date of birth is required'];
      if (!/^\d{11}$/.test(formData.phoneNumber)) errs.phoneNumber = ['Enter a valid 11-digit phone number'];
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = ['Enter a valid email address'];
      if (!formData.lga) errs.lga = ['Select your LGA'];
      if (!formData.village.trim()) errs.village = ['Village / community is required'];
    }
    if (step === 2) {
      if (!/^\d{11}$/.test(formData.nationalId)) errs.nationalId = ['NIN must be 11 digits'];
      if (formData.bvn && !/^\d{11}$/.test(formData.bvn)) errs.bvn = ['BVN must be 11 digits'];
      if (formData.bankAccountNumber && !/^\d{10}$/.test(formData.bankAccountNumber)) errs.bankAccountNumber = ['Account number must be 10 digits'];
      if (formData.bankAccountNumber && !formData.bankName.trim()) errs.bankName = ['Enter the bank name'];
      if (!formData.hasDisability) errs.hasDisability = ['Please answer this question'];
      if (formData.hasDisability === 'Yes' && !formData.disabilityType) errs.disabilityType = ['Select the type of disability'];
    }
    if (step === 3) {
      if (!formData.maritalStatus) errs.maritalStatus = ['Select your marital status'];
      if (!formData.primaryOccupation) errs.primaryOccupation = ['Select your primary occupation'];
      if (!formData.householdSize) errs.householdSize = ['Enter your household size'];
    }
    if (step === 4) {
      if (!formData.inCooperative) errs.inCooperative = ['Please answer this question'];
      if (formData.inCooperative === 'Yes' && !formData.cooperativeName.trim()) errs.cooperativeName = ['Enter the cooperative / group name'];
      if (!formData.priorMechExperience) errs.priorMechExperience = ['Please answer this question'];
      if (formData.preferredServices.length === 0) errs.preferredServices = ['Select at least one service'];
      if (!formData.willingRepayment) errs.willingRepayment = ['Please answer this question'];
    }
    if (step === 5) {
      if (formData.trainingAreas.length === 0) errs.trainingAreas = ['Select at least one training area'];
      if (!formData.consent) errs.consent = ['You must consent to continue'];
      if (!formData.signature.trim()) errs.signature = ['Type your full name to sign'];
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError('Please complete the highlighted fields before continuing.');
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(currentStep)) return;
    setDirection('next');
    setError(null);
    setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setDirection('back');
    setError(null);
    setCurrentStep(s => Math.max(s - 1, 1));
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setDirection('back');
      setCurrentStep(step);
      setError(null);
    }
  };

  const submitApplication = async () => {
    if (!validateStep(5)) return;
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const payload = {
        fullName: formData.fullName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        age: age ?? undefined,
        phoneNumber: formData.phoneNumber,
        email: formData.email || undefined,
        state: formData.state,
        lga: formData.lga,
        village: formData.village,
        nationalId: formData.nationalId,
        bvn: formData.bvn || undefined,
        bankAccountNumber: formData.bankAccountNumber || undefined,
        bankName: formData.bankName || undefined,
        hasDisability: formData.hasDisability === 'Yes',
        disabilityType: formData.hasDisability === 'Yes' ? formData.disabilityType : undefined,
        disabilityOther: formData.disabilityType === 'Other' ? formData.disabilityOther : undefined,
        maritalStatus: formData.maritalStatus,
        primaryOccupation: formData.primaryOccupation === 'Other' ? formData.occupationOther : formData.primaryOccupation,
        cropsFarmed: formData.cropsFarmed || undefined,
        householdSize: formData.householdSize ? parseInt(formData.householdSize) : undefined,
        dependents: formData.dependents ? parseInt(formData.dependents) : undefined,
        landArea: formData.landArea || undefined,
        landOwnership: formData.landOwnership || undefined,
        inCooperative: formData.inCooperative === 'Yes',
        cooperativeName: formData.inCooperative === 'Yes' ? formData.cooperativeName : undefined,
        priorMechExperience: formData.priorMechExperience === 'Yes',
        preferredServices: formData.preferredServices,
        currentlyEmployed: formData.currentlyEmployed === 'Yes',
        willingRepayment: formData.willingRepayment === 'Yes',
        accessToCredit: formData.accessToCredit === 'Yes',
        trainingAreas: formData.trainingAreas,
        trainingOther: formData.trainingAreas.includes('other') ? formData.trainingOther : undefined,
        consent: formData.consent,
        signature: formData.signature,
        submittedAt: new Date().toISOString(),
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/gotract/applications`,
        payload,
        { withCredentials: true }
      );

      setRegistrationData(response.data?.data ?? null);
      setSuccessMessage('Application submitted successfully!');
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Application failed:', err);
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        setFieldErrors(errors);
        const firstKey = Object.keys(errors)[0];
        setError(errors[firstKey]?.[0] || 'Please check your inputs.');
        const stepForField: Record<string, number> = {
          fullName: 1, gender: 1, dateOfBirth: 1, phoneNumber: 1, email: 1, lga: 1, village: 1,
          nationalId: 2, bvn: 2, bankAccountNumber: 2, bankName: 2, hasDisability: 2,
          maritalStatus: 3, primaryOccupation: 3, householdSize: 3,
          inCooperative: 4, priorMechExperience: 4, preferredServices: 4, willingRepayment: 4,
          trainingAreas: 5, consent: 5, signature: 5,
        };
        const jump = stepForField[firstKey];
        if (jump) setCurrentStep(jump);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Application could not be submitted. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    // Owns submission so nothing triggers a native page reload. On non-final
    // steps the primary button just advances; only the last step posts.
    e.preventDefault();
    if (currentStep < TOTAL_STEPS) {
      goNext();
    } else {
      submitApplication();
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setCurrentStep(1);
    setShowSuccessModal(false);
    setRegistrationData(null);
    setSuccessMessage(null);
    setError(null);
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const hasFieldError = (field: string) => fieldErrors[field] && fieldErrors[field].length > 0;
  const getFieldError = (field: string) => fieldErrors[field]?.[0] || '';
  const progressPct = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  const ctx: FieldCtx = {
    formData, focusedField, fieldErrors, isSubmitting,
    handleChange, setFocusedField, setField,
  };

  return (
    <section className='auth-container'>
      <div className='auth-form'>
        {/* Brand / info panel */}
        <aside className='brand-panel'>
          <div className="brand-orb" />
          <div className="brand-orb-2" />
          <div className="brand-inner">
            <Link href='/' className='logo-link'>
              <Image src="/assets/images/gotract/wima-logo.svg" alt="WIMA" width={280} height={65} className="logo-image" />
            </Link>
            <span className="badge">
              <Icon icon="mdi:tractor" className="badge-icon" />
              GoTRACT Programme
            </span>
            <h4 className="form-title">Youth Mechanization Application</h4>
            <p className='form-subtitle'>
              Apply to the Gombe Tractor Access &amp; Capacity Transformation Programme &mdash;
              practical training and structured equipment financing for young people across Gombe State.
            </p>
            <div className="brand-facts">
              <div className="fact">
                <Icon icon="mdi:account-group" />
                <div><strong>440</strong><span>youths statewide</span></div>
              </div>
              <div className="fact">
                <Icon icon="mdi:map-marker-multiple" />
                <div><strong>11 LGAs</strong><span>across Gombe State</span></div>
              </div>
              <div className="fact">
                <Icon icon="mdi:calendar-range" />
                <div><strong>2-day</strong><span>practical training</span></div>
              </div>
            </div>

            <div className="brand-partners">
              <span className="partners-label">Delivered in partnership with</span>
              <div className="partners-grid">
                {PARTNERS.map(p => <PartnerLogo key={p.name} name={p.name} src={p.src} />)}
              </div>
            </div>
          </div>
        </aside>

        {/* Form panel */}
        <form className='form-panel' onSubmit={handleFormSubmit} noValidate>

          {/* Stepper */}
          <div className="stepper" role="navigation" aria-label="Application steps">
            <div className="stepper-track">
              <div className="stepper-progress" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="stepper-nodes">
              {STEPS.map(step => {
                const state = step.id < currentStep ? 'done' : step.id === currentStep ? 'active' : 'todo';
                return (
                  <button
                    key={step.id}
                    type="button"
                    className={`step-node ${state}`}
                    onClick={() => goToStep(step.id)}
                    disabled={step.id >= currentStep}
                    aria-current={step.id === currentStep ? 'step' : undefined}
                  >
                    <span className="step-circle">
                      {state === 'done' ? <Icon icon="mdi:check" /> : <Icon icon={step.icon} />}
                    </span>
                    <span className="step-label">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alerts */}
          <div className="alert-container">
            {error && (
              <div className="alert error">
                <Icon icon="material-symbols:error-outline" className="alert-icon error" />
                <span className="alert-text">{error}</span>
                <button type="button" className="alert-close" onClick={() => setError(null)}><Icon icon="mdi:close" /></button>
              </div>
            )}
          </div>

          {/* Step panels */}
          <div className={`step-panel ${direction === 'next' ? 'slide-next' : 'slide-back'}`} key={currentStep}>

            {/* STEP 1 - PERSONAL */}
            {currentStep === 1 && (
              <>
                <div className="section-heading"><Icon icon="mdi:account" /> <span>Personal Information</span></div>
                <div className="form-grid">
                  <TextField ctx={ctx} name="fullName" placeholder="Full Name" icon="mdi:account-outline" />
                  <div className="input-row">
                    <SelectField ctx={ctx} name="gender" icon="mdi:gender-male-female" placeholder="Gender"
                      options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]} />
                    <div className={`input-field half ${focusedField === 'dateOfBirth' ? 'focused' : ''} ${hasFieldError('dateOfBirth') ? 'has-error' : ''}`}>
                      <span className='input-icon'><Icon icon='mdi:calendar' /></span>
                      <input
                        type='date' name='dateOfBirth' className='form-input'
                        value={formData.dateOfBirth} onChange={handleChange}
                        onFocus={() => setFocusedField('dateOfBirth')} onBlur={() => setFocusedField(null)}
                        disabled={isSubmitting} max={new Date().toISOString().split('T')[0]}
                      />
                      <span className="input-highlight" />
                      {hasFieldError('dateOfBirth') && <span className="field-error">{getFieldError('dateOfBirth')}</span>}
                    </div>
                  </div>
                  {age !== null && (
                    <div className="age-note">
                      <Icon icon="mdi:cake-variant-outline" />
                      Age: <strong>{age}</strong> years
                      {(age < 18 || age > 35) && <span className="age-flag"> &mdash; note: GoTRACT targets youth (typically 18&ndash;35)</span>}
                    </div>
                  )}
                  <TextField ctx={ctx} name="phoneNumber" placeholder="Phone Number (11 digits)" icon="mdi:phone" type="tel" maxLength={11} inputMode="numeric" />
                  <TextField ctx={ctx} name="email" placeholder="Email Address (optional)" icon="mdi:email" type="email" />
                  <div className="input-row">
                    <div className="input-field half">
                      <span className='input-icon'><Icon icon='mdi:map-marker' /></span>
                      <input className='form-input' value="Gombe State" disabled readOnly />
                    </div>
                    <SelectField ctx={ctx} name="lga" icon="mdi:city" placeholder="Select LGA"
                      options={GOMBE_LGAS.map(l => ({ value: l, label: l }))} />
                  </div>
                  <TextField ctx={ctx} name="village" placeholder="Village / Community" icon="mdi:home-group" />
                </div>
              </>
            )}

            {/* STEP 2 - ID & BANKING */}
            {currentStep === 2 && (
              <>
                <div className="section-heading"><Icon icon="mdi:card-account-details" /> <span>Identification &amp; Banking</span></div>
                <p className="section-hint">
                  Banking details support programme financing through AltBank. Account details are optional now
                  but required before equipment financing.
                </p>
                <div className="form-grid">
                  <TextField ctx={ctx} name="nationalId" placeholder="National ID Number (NIN)" icon="mdi:identifier" maxLength={11} inputMode="numeric" />
                  <TextField ctx={ctx} name="bvn" placeholder="BVN (optional)" icon="mdi:bank-check" maxLength={11} inputMode="numeric" />
                  <div className="input-row">
                    <TextField ctx={ctx} name="bankAccountNumber" placeholder="Account Number" icon="mdi:bank" maxLength={10} inputMode="numeric" />
                    <TextField ctx={ctx} name="bankName" placeholder="Bank Name" icon="mdi:office-building" />
                  </div>
                  <YesNo ctx={ctx} name="hasDisability" question="Do you have a disability?" />
                  {formData.hasDisability === 'Yes' && (
                    <>
                      <SelectField ctx={ctx} name="disabilityType" icon="mdi:human-wheelchair" placeholder="Type of disability"
                        options={[
                          { value: 'Physical', label: 'Physical' },
                          { value: 'Mental', label: 'Mental' },
                          { value: 'Both', label: 'Both' },
                          { value: 'Other', label: 'Other' },
                        ]} />
                      {formData.disabilityType === 'Other' && (
                        <TextField ctx={ctx} name="disabilityOther" placeholder="Please specify" icon="mdi:pencil" />
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {/* STEP 3 - FARM PROFILE */}
            {currentStep === 3 && (
              <>
                <div className="section-heading"><Icon icon="mdi:barn" /> <span>Demographic &amp; Economic</span></div>
                <div className="form-grid">
                  <div className="input-row">
                    <SelectField ctx={ctx} name="maritalStatus" icon="mdi:ring" placeholder="Marital Status"
                      options={[
                        { value: 'Single', label: 'Single' },
                        { value: 'Married', label: 'Married' },
                        { value: 'Widowed', label: 'Widowed' },
                        { value: 'Other', label: 'Other' },
                      ]} />
                    <SelectField ctx={ctx} name="primaryOccupation" icon="mdi:briefcase" placeholder="Primary Occupation"
                      options={[
                        { value: 'Farming', label: 'Farming' },
                        { value: 'Livestock Rearing', label: 'Livestock Rearing' },
                        { value: 'Both', label: 'Both' },
                        { value: 'Other', label: 'Other' },
                      ]} />
                  </div>
                  {formData.primaryOccupation === 'Other' && (
                    <TextField ctx={ctx} name="occupationOther" placeholder="Specify occupation" icon="mdi:pencil" />
                  )}
                  <TextField ctx={ctx} name="cropsFarmed" placeholder="Type of crops farmed (e.g. Rice, Maize)" icon="mdi:sprout" />
                  <div className="input-row">
                    <TextField ctx={ctx} name="householdSize" placeholder="Household Size" icon="mdi:home-account" type="number" inputMode="numeric" />
                    <TextField ctx={ctx} name="dependents" placeholder="No. of Dependents" icon="mdi:account-multiple" type="number" inputMode="numeric" />
                  </div>
                  <div className="input-row">
                    <TextField ctx={ctx} name="landArea" placeholder="Land Area (hectares)" icon="mdi:texture-box" inputMode="decimal" />
                    <SelectField ctx={ctx} name="landOwnership" icon="mdi:file-document-outline" placeholder="Ownership Type"
                      options={[
                        { value: 'Owned', label: 'Owned' },
                        { value: 'Rented', label: 'Rented' },
                        { value: 'Communal', label: 'Communal' },
                      ]} />
                  </div>
                </div>
              </>
            )}

            {/* STEP 4 - MECHANIZATION & FINANCIAL */}
            {currentStep === 4 && (
              <>
                <div className="section-heading"><Icon icon="mdi:tractor" /> <span>Mechanization &amp; Financial</span></div>
                <div className="form-grid">
                  <YesNo ctx={ctx} name="inCooperative" question="Are you part of a cooperative or group?" />
                  {formData.inCooperative === 'Yes' && (
                    <TextField ctx={ctx} name="cooperativeName" placeholder="Cooperative / group name" icon="mdi:account-group" />
                  )}
                  <YesNo ctx={ctx} name="priorMechExperience" question="Do you have prior experience with mechanized farming?" />

                  <div className={`services-container ${hasFieldError('preferredServices') ? 'has-error' : ''}`}>
                    <div className='services-header'>
                      <div className='services-label'><Icon icon='mdi:cog' className='services-icon' /><span>Preferred Mechanization Services</span></div>
                      {formData.preferredServices.length > 0 && <span className='selected-badge'>{formData.preferredServices.length} selected</span>}
                    </div>
                    <div className='services-grid'>
                      {PREFERRED_SERVICES.map(s => {
                        const sel = formData.preferredServices.includes(s.id);
                        return (
                          <div key={s.id} className={`service-chip ${sel ? 'selected' : ''}`}
                            onClick={() => !isSubmitting && toggleArrayValue('preferredServices', s.id)}>
                            <Icon icon={s.icon || 'mdi:cog'} className="service-chip-icon" />
                            <span>{s.name}</span>
                            {sel && <Icon icon='mdi:check-circle' className='check-icon' />}
                          </div>
                        );
                      })}
                    </div>
                    {hasFieldError('preferredServices') && <span className="field-error inline">{getFieldError('preferredServices')}</span>}
                  </div>

                  <div className="divider"><span>Financial</span></div>

                  <YesNo ctx={ctx} name="currentlyEmployed" question="Are you currently employed or earning an income?" />
                  <div className="equity-note">
                    <Icon icon="mdi:information-outline" />
                    Financed beneficiaries provide a <strong>20% equity contribution</strong> toward equipment acquisition, with structured repayment through AltBank.
                  </div>
                  <YesNo ctx={ctx} name="willingRepayment" question="Are you willing to commit to the repayment plan for the Starter Kit?" />
                  <YesNo ctx={ctx} name="accessToCredit" question="Do you have access to any form of credit or savings?" />
                </div>
              </>
            )}

            {/* STEP 5 - TRAINING & CONSENT */}
            {currentStep === 5 && (
              <>
                <div className="section-heading"><Icon icon="mdi:shield-check" /> <span>Training &amp; Consent</span></div>
                <div className="form-grid">
                  <div className={`services-container ${hasFieldError('trainingAreas') ? 'has-error' : ''}`}>
                    <div className='services-header'>
                      <div className='services-label'><Icon icon='mdi:school' className='services-icon' /><span>Training areas you&rsquo;d like to receive</span></div>
                      {formData.trainingAreas.length > 0 && <span className='selected-badge'>{formData.trainingAreas.length} selected</span>}
                    </div>
                    <div className='services-grid'>
                      {TRAINING_AREAS.map(t => {
                        const sel = formData.trainingAreas.includes(t.id);
                        return (
                          <div key={t.id} className={`service-chip ${sel ? 'selected' : ''}`}
                            onClick={() => !isSubmitting && toggleArrayValue('trainingAreas', t.id)}>
                            <Icon icon={t.icon || 'mdi:school'} className="service-chip-icon" />
                            <span>{t.name}</span>
                            {sel && <Icon icon='mdi:check-circle' className='check-icon' />}
                          </div>
                        );
                      })}
                    </div>
                    {hasFieldError('trainingAreas') && <span className="field-error inline">{getFieldError('trainingAreas')}</span>}
                  </div>

                  {formData.trainingAreas.includes('other') && (
                    <TextField ctx={ctx} name="trainingOther" placeholder="Specify other training area" icon="mdi:pencil" />
                  )}

                  <div className="review-card">
                    <div className="review-title"><Icon icon="mdi:clipboard-text-outline" /> Review your details</div>
                    <div className="review-grid">
                      <div><span>Name</span><strong>{formData.fullName || '-'}</strong></div>
                      <div><span>Phone</span><strong>{formData.phoneNumber || '-'}</strong></div>
                      <div><span>LGA</span><strong>{formData.lga || '-'}</strong></div>
                      <div><span>Community</span><strong>{formData.village || '-'}</strong></div>
                      <div><span>NIN</span><strong>{formData.nationalId || '-'}</strong></div>
                      <div><span>Occupation</span><strong>{formData.primaryOccupation || '-'}</strong></div>
                      <div><span>Services</span><strong>{formData.preferredServices.length || 0} selected</strong></div>
                      <div><span>Repayment</span><strong>{formData.willingRepayment || '-'}</strong></div>
                    </div>
                  </div>

                  <label className={`consent-box ${hasFieldError('consent') ? 'has-error' : ''}`}>
                    <input type="checkbox" checked={formData.consent}
                      onChange={e => setField('consent', e.target.checked)} disabled={isSubmitting} />
                    <span className="consent-check"><Icon icon="mdi:check" /></span>
                    <span className="consent-text">
                      I consent to the collection and use of my personal data for the purpose of participating in
                      WIMA&rsquo;s GoTRACT mechanization programme, and I declare that the information provided is true
                      to the best of my knowledge.
                    </span>
                  </label>

                  <TextField ctx={ctx} name="signature" placeholder="Type your full name to sign" icon="mdi:draw-pen" />
                  <div className="signature-date">
                    <Icon icon="mdi:calendar-check" /> Date: {new Date().toLocaleDateString('en-GB')}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="form-nav">
            {currentStep > 1 ? (
              <button type="button" className="nav-button back" onClick={goBack} disabled={isSubmitting}>
                <Icon icon="mdi:arrow-left" /> Back
              </button>
            ) : <span />}

            {currentStep < TOTAL_STEPS ? (
              <button type="submit" className="nav-button next" disabled={isSubmitting}>
                Next <Icon icon="mdi:arrow-right" />
              </button>
            ) : (
              <button type="submit" className="nav-button submit" disabled={isSubmitting}>
                {isSubmitting ? <><span className="spinner" /> Submitting&hellip;</> : <><Icon icon="mdi:send-check" /> Submit Application</>}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon success-icon"><Icon icon="clarity:success-standard-line" /></div>
              <h2>Application Received!</h2>
              {/* <p className="modal-subtitle">Your GoTRACT application has been submitted for screening.</p> */}
            </div>
            <div className="modal-body">
              {registrationData?.referenceId && (
                <div className="detail-item highlight">
                  <span className="detail-label">Reference ID</span>
                  <span className="detail-value code-value">{registrationData.referenceId}</span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">Full Name</span>
                <span className="detail-value">{registrationData?.fullName || formData.fullName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">LGA</span>
                <span className="detail-value">{registrationData?.lga || formData.lga}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{registrationData?.phoneNumber || formData.phoneNumber}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-button" onClick={resetForm}><Icon icon="mdi:check" /> Done</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* WIMA green colour tokens. Defined globally so var() resolves in scoped
           styles. Change these three values to rebrand the whole form. */
        :global(:root) {
          --accent: #16a34a;
          --accent-dark: #15803d;
          --accent-soft: rgba(22, 163, 74, 0.08);
        }
        .auth-container, .auth-container * { box-sizing: border-box; }

        .auth-container {
          display: flex; min-height: 100vh; min-height: 100dvh; width: 100%; max-width: 100vw;
          overflow-x: hidden; background: linear-gradient(135deg, #ecfdf5 0%, #fafbfc 100%);
          justify-content: center; align-items: center; padding: 1.5rem 1rem; position: relative;
        }

        /* Landscape two-panel card */
        .auth-form {
          width: 100%; max-width: 940px; background: white; border-radius: 1.75rem;
          box-shadow: 0 24px 70px rgba(15,23,42,0.12), 0 8px 24px rgba(15,23,42,0.05);
          position: relative; z-index: 1; border: 1px solid rgba(226,232,240,0.7);
          display: flex; overflow: hidden; max-height: 94vh; max-height: 94dvh;
        }

        /* Brand panel (left on desktop) */
        .brand-panel {
          position: relative; overflow: hidden; flex-shrink: 0; width: 340px;
          background: linear-gradient(160deg, #16a34a 0%, #15803d 55%, #166534 100%);
          color: white; padding: 2.75rem 2rem; display: flex; align-items: center;
        }
        .brand-orb, .brand-orb-2 { position: absolute; border-radius: 50%; pointer-events: none; }
        .brand-orb { top: -90px; right: -90px; width: 240px; height: 240px;
          background: radial-gradient(circle, rgba(255,255,255,0.16) 0%, transparent 70%); }
        .brand-orb-2 { bottom: -110px; left: -70px; width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%); }
        .brand-inner { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 1.1rem; width: 100%; }

        .logo-link { display: inline-flex; align-self: flex-start; background: white; padding: 0.7rem 0.95rem;
          border-radius: 0.9rem; max-width: 210px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); transition: transform .3s; }
        .logo-link:hover { transform: translateY(-2px); }
        .logo-image { width: 100%; height: auto; }

        .badge {
          display: inline-flex; align-self: flex-start; align-items: center; gap: 0.4rem;
          background: rgba(255,255,255,0.16); border: 1px solid rgba(255,255,255,0.28); color: white;
          font-size: 0.68rem; font-weight: 600; padding: 0.35rem 0.9rem; border-radius: 2rem;
          letter-spacing: 0.5px; text-transform: uppercase; backdrop-filter: blur(6px);
        }
        .badge-icon { font-size: 0.9rem; }
        .form-title { color: white; font-size: 1.6rem; font-weight: 700; margin: 0; line-height: 1.18; }
        .form-subtitle { color: rgba(255,255,255,0.82); font-size: 0.86rem; line-height: 1.6; margin: 0; }

        .brand-facts { display: flex; flex-direction: column; gap: 0.85rem; margin-top: 0.4rem; }
        .fact { display: flex; align-items: center; gap: 0.7rem; }
        .fact :global(svg) { font-size: 1.35rem; color: rgba(255,255,255,0.92); flex-shrink: 0; }
        .fact > div { display: flex; flex-direction: column; line-height: 1.15; }
        .fact strong { font-size: 1rem; font-weight: 700; color: white; }
        .fact span { font-size: 0.72rem; color: rgba(255,255,255,0.7); }

        .brand-partners { margin-top: 0.6rem; display: flex; flex-direction: column; gap: 0.55rem; }
        .partners-label { font-size: 0.64rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.7px; color: rgba(255,255,255,0.72); }
        .partners-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.55rem; max-width: 340px; }
        .partner-card { background: white; border-radius: 0.7rem; height: 62px; display: flex; align-items: center; justify-content: center; padding: 0.5rem 0.7rem; box-shadow: 0 4px 12px rgba(0,0,0,0.12); overflow: hidden; }
        .partner-img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; }
        .partner-fallback { font-size: 0.66rem; font-weight: 700; color: #15803d; text-align: center; line-height: 1.2; }

        /* Form panel (right on desktop) */
        .form-panel {
          flex: 1; min-width: 0; padding: 2.25rem 2.25rem 2rem; display: flex; flex-direction: column;
          overflow-y: auto; max-height: 94vh; max-height: 94dvh;
        }
        .form-panel::-webkit-scrollbar { width: 5px; }
        .form-panel::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

        .stepper { position: relative; margin: 0 0 1.75rem; padding: 0 0.25rem; }
        .stepper-track { position: absolute; top: 19px; left: 8%; right: 8%; height: 3px; background: #e2e8f0; border-radius: 3px; z-index: 0; }
        .stepper-progress { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--accent), var(--accent-dark)); transition: width .45s cubic-bezier(.34,1.56,.64,1); }
        .stepper-nodes { display: flex; justify-content: space-between; position: relative; z-index: 1; }
        .step-node { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; background: none; border: none; cursor: pointer; padding: 0; flex: 1; }
        .step-node:disabled { cursor: default; }
        .step-circle { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          background: white; border: 2px solid #e2e8f0; color: #94a3b8; font-size: 1.1rem; transition: all .3s cubic-bezier(.34,1.56,.64,1); }
        .step-node.active .step-circle { border-color: var(--accent); color: var(--accent); box-shadow: 0 0 0 5px var(--accent-soft); transform: scale(1.08); }
        .step-node.done .step-circle { background: linear-gradient(135deg, var(--accent), var(--accent-dark)); border-color: var(--accent); color: white; }
        .step-label { font-size: 0.68rem; font-weight: 600; color: #94a3b8; text-align: center; transition: color .3s; }
        .step-node.active .step-label { color: var(--accent); }
        .step-node.done .step-label { color: #4b5563; }

        .alert-container { margin-bottom: 1rem; }
        .alert { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1.25rem; border-radius: 1rem; animation: slideDown .4s cubic-bezier(.34,1.56,.64,1); }
        .error { background: linear-gradient(135deg,#fef2f2,#fde8e8); border: 1px solid #fecaca; }
        .alert-icon { font-size: 1.25rem; flex-shrink: 0; }
        .alert-icon.error { color: #ef4444; }
        .alert-text { flex: 1; font-weight: 500; font-size: 0.85rem; color: #1f2937; }
        .alert-close { background: none; border: none; color: #9ca3af; cursor: pointer; padding: 0.25rem; border-radius: 0.5rem; display: flex; font-size: 1.25rem; transition: all .2s; }
        .alert-close:hover { background: rgba(0,0,0,0.05); transform: rotate(90deg); }

        .step-panel { animation: panelIn .4s ease both; }
        .slide-next { animation: slideFromRight .4s cubic-bezier(.34,1.1,.64,1) both; }
        .slide-back { animation: slideFromLeft .4s cubic-bezier(.34,1.1,.64,1) both; }
        @keyframes slideFromRight { from { opacity:0; transform: translateX(28px);} to {opacity:1; transform:none;} }
        @keyframes slideFromLeft { from { opacity:0; transform: translateX(-28px);} to {opacity:1; transform:none;} }
        @keyframes panelIn { from {opacity:0;} to {opacity:1;} }

        .section-heading { display: flex; align-items: center; gap: 0.5rem; font-size: 1.05rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem; }
        .section-heading :global(svg) { color: var(--accent); font-size: 1.25rem; }
        .section-hint { font-size: 0.8rem; color: #6b7280; margin: 0 0 1rem; line-height: 1.5; }

        .form-grid { display: flex; flex-direction: column; gap: 0.875rem; width: 100%; }
        .input-row { display: flex; gap: 0.875rem; width: 100%; }
        .input-row > * { flex: 1; min-width: 0; }

        .input-field { position: relative; border-radius: 0.875rem; background: #f8fafc; transition: all .3s cubic-bezier(.34,1.56,.64,1); display: flex; flex-direction: column; width: 100%; min-width: 0; }
        .input-field.half { flex: 1; }
        .input-field.focused { background: white; box-shadow: 0 0 0 4px var(--accent-soft); transform: scale(1.01); }
        .input-field.has-error { background: #fef2f2; }
        .input-field.has-error .form-input { border-color: #ef4444; }
        .input-field.has-error .input-icon { color: #ef4444; }
        .input-icon { position: absolute; top: 0; left: 1rem; height: 3.5rem; width: 1.5rem; color: #94a3b8; font-size: 1.25rem; pointer-events: none; z-index: 2; transition: color .3s; display: flex; align-items: center; justify-content: center; }
        .input-field.focused .input-icon { color: var(--accent); }
        .form-input { width: 100%; min-width: 0; height: 3.5rem; line-height: 3.25rem; background: transparent; border-radius: 0.875rem; padding-left: 3.5rem; padding-right: 1rem; border: 2px solid #e2e8f0; transition: all .3s; font-size: 0.95rem; color: #1f2937; position: relative; z-index: 1; -webkit-appearance: none; appearance: none; }
        .select-input option { line-height: normal; }
        .form-input:focus { border-color: var(--accent); outline: none; }
        .form-input:disabled { opacity: 0.7; cursor: not-allowed; background: #f1f5f9; }
        .form-input::placeholder { color: #94a3b8; }
        .form-input[type="number"]::-webkit-inner-spin-button, .form-input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .form-input[type="number"] { -moz-appearance: textfield; }
        .input-highlight { position: absolute; bottom: 0; left: 50%; width: 0; height: 2.5px; background: linear-gradient(90deg, var(--accent), #22c55e); transition: width .4s cubic-bezier(.34,1.56,.64,1); transform: translateX(-50%); border-radius: 0 0 0.875rem 0.875rem; }
        .input-field.focused .input-highlight { width: 70%; }
        .field-error { color: #ef4444; font-size: 0.72rem; font-weight: 500; padding: 0.25rem 0.5rem 0.25rem 1rem; display: block; animation: slideDown .3s ease; }
        .field-error.inline { padding-left: 0; }
        .select-input { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; padding-right: 2.5rem; cursor: pointer; }

        .age-note, .equity-note, .signature-date { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; font-size: 0.82rem; color: #475569; background: var(--accent-soft); border-radius: 0.75rem; padding: 0.625rem 0.875rem; }
        .age-note :global(svg), .equity-note :global(svg), .signature-date :global(svg) { color: var(--accent); font-size: 1.1rem; flex-shrink: 0; }
        .age-flag { color: #b45309; font-weight: 500; }

        .question-block { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 0.875rem; padding: 0.875rem 1rem; display: flex; flex-direction: column; gap: 0.625rem; transition: all .3s; }
        .question-block.has-error { border-color: #fecaca; background: #fef2f2; }
        .question-text { font-size: 0.875rem; font-weight: 500; color: #334155; }
        .yesno-group { display: flex; gap: 0.625rem; }
        .yesno-pill { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.6rem 1rem; border: 2px solid #e2e8f0; border-radius: 0.75rem; background: white; color: #64748b; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all .25s cubic-bezier(.34,1.56,.64,1); }
        .yesno-pill:hover { border-color: #86efac; transform: translateY(-1px); }
        .yesno-pill.active { background: linear-gradient(135deg, var(--accent), var(--accent-dark)); border-color: var(--accent); color: white; box-shadow: 0 4px 14px rgba(22,163,74,0.25); }

        .services-container { padding: 1.25rem; background: #f8fafc; border-radius: 1rem; border: 2px solid #e2e8f0; transition: all .3s; width: 100%; }
        .services-container.has-error { border-color: #fecaca; background: #fef2f2; }
        .services-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.875rem; flex-wrap: wrap; gap: 0.5rem; }
        .services-label { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: #1f2937; font-size: 0.875rem; }
        .services-icon { font-size: 1.2rem; color: var(--accent); }
        .selected-badge { background: linear-gradient(135deg, var(--accent), var(--accent-dark)); color: white; font-size: 0.68rem; font-weight: 600; padding: 0.25rem 0.875rem; border-radius: 2rem; box-shadow: 0 2px 8px rgba(22,163,74,0.2); white-space: nowrap; }
        .services-grid { display: flex; flex-wrap: wrap; gap: 0.625rem; }
        .service-chip { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: white; border: 2px solid #e2e8f0; border-radius: 2rem; font-size: 0.8rem; font-weight: 500; color: #4b5563; cursor: pointer; transition: all .3s cubic-bezier(.34,1.56,.64,1); user-select: none; }
        .service-chip:hover { border-color: #86efac; transform: translateY(-2px) scale(1.02); box-shadow: 0 4px 16px rgba(22,163,74,0.12); }
        .service-chip.selected { background: linear-gradient(135deg, var(--accent), var(--accent-dark)); border-color: var(--accent); color: white; box-shadow: 0 4px 16px rgba(22,163,74,0.3); }
        .service-chip-icon { font-size: 1rem; color: #64748b; flex-shrink: 0; }
        .service-chip.selected .service-chip-icon { color: white; }
        .check-icon { font-size: 0.9rem; animation: popIn .3s cubic-bezier(.34,1.56,.64,1); }

        .divider { display: flex; align-items: center; text-align: center; margin: 0.5rem 0; color: #94a3b8; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }
        .divider span { padding: 0 0.875rem; }

        .review-card { border: 2px solid #e2e8f0; border-radius: 1rem; padding: 1.25rem; background: linear-gradient(135deg, #f8fafc, #fff); }
        .review-title { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: #1f2937; font-size: 0.9rem; margin-bottom: 0.875rem; }
        .review-title :global(svg) { color: var(--accent); font-size: 1.1rem; }
        .review-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem 1rem; }
        .review-grid > div { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
        .review-grid span { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .review-grid strong { font-size: 0.85rem; color: #1f2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .consent-box { display: flex; gap: 0.75rem; align-items: flex-start; padding: 1rem; border: 2px solid #e2e8f0; border-radius: 1rem; background: #f8fafc; cursor: pointer; transition: all .25s; }
        .consent-box:hover { border-color: #cbd5e1; }
        .consent-box.has-error { border-color: #fecaca; background: #fef2f2; }
        .consent-box input { position: absolute; opacity: 0; width: 0; height: 0; }
        .consent-check { width: 24px; height: 24px; border-radius: 0.5rem; border: 2px solid #cbd5e1; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: white; color: transparent; transition: all .25s; font-size: 1rem; margin-top: 1px; }
        .consent-box input:checked + .consent-check { background: linear-gradient(135deg, var(--accent), var(--accent-dark)); border-color: var(--accent); color: white; }
        .consent-text { font-size: 0.82rem; color: #475569; line-height: 1.55; }

        .form-nav { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-top: 1.75rem; }
        .nav-button { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.875rem 1.75rem; border-radius: 0.875rem; font-weight: 600; font-size: 0.9rem; cursor: pointer; border: none; transition: all .3s cubic-bezier(.34,1.56,.64,1); }
        .nav-button.back { background: #f1f5f9; color: #475569; }
        .nav-button.back:hover:not(:disabled) { background: #e2e8f0; transform: translateX(-2px); }
        .nav-button.next, .nav-button.submit { background: linear-gradient(135deg, var(--accent), var(--accent-dark)); color: white; box-shadow: 0 4px 16px rgba(22,163,74,0.25); margin-left: auto; }
        .nav-button.next:hover:not(:disabled), .nav-button.submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(22,163,74,0.35); }
        .nav-button:disabled { opacity: 0.6; cursor: not-allowed; }
        .spinner { display: inline-block; width: 1.1rem; height: 1.1rem; border: 2.5px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin .75s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn .3s ease; padding: 1rem; }
        .modal-content { background: white; border-radius: 1.5rem; max-width: 460px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 80px rgba(0,0,0,0.2); animation: slideUp .4s cubic-bezier(.34,1.56,.64,1); }
        .modal-header { padding: 2rem 2rem 1rem; text-align: center; }
        .modal-icon { width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }
        .success-icon { background: linear-gradient(135deg,#dcfce7,#bbf7d0); color: #22c55e; }
        .modal-header h2 { font-size: 1.4rem; font-weight: 700; color: #1f2937; margin: 0 0 0.35rem; }
        .modal-subtitle { color: #6b7280; font-size: 0.875rem; margin: 0; line-height: 1.5; }
        .modal-body { padding: 1rem 2rem 0.5rem; }
        .detail-item { display: flex; justify-content: space-between; align-items: center; padding: 0.625rem 0; border-bottom: 1px solid #f3f4f6; }
        .detail-item:last-child { border-bottom: none; }
        .detail-item.highlight { background: var(--accent-soft); margin: 0 -0.5rem 0.25rem; padding: 0.625rem 0.75rem; border-radius: 0.5rem; border-bottom: none; }
        .detail-label { font-weight: 500; color: #4b5563; font-size: 0.85rem; }
        .detail-value { color: #1f2937; font-size: 0.85rem; font-weight: 500; }
        .code-value { color: var(--accent); font-weight: 700; font-family: monospace; letter-spacing: 1px; }
        .modal-footer { padding: 1.5rem 2rem 2rem; text-align: center; }
        .modal-button { background: linear-gradient(135deg, var(--accent), var(--accent-dark)); color: white; border: none; padding: 0.75rem 2.5rem; border-radius: 0.75rem; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all .3s; display: inline-flex; align-items: center; gap: 0.5rem; box-shadow: 0 4px 16px rgba(22,163,74,0.2); }
        .modal-button:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(22,163,74,0.3); }

        @keyframes fadeIn { from {opacity:0;} to {opacity:1;} }
        @keyframes slideUp { from {opacity:0; transform: translateY(30px) scale(.95);} to {opacity:1; transform:none;} }
        @keyframes slideDown { from {opacity:0; transform: translateY(-10px) scale(.96);} to {opacity:1; transform:none;} }
        @keyframes popIn { 0%{transform:scale(0) rotate(-45deg);opacity:0;} 70%{transform:scale(1.2) rotate(0);} 100%{transform:scale(1);opacity:1;} }

        /* Stack the two panels on tablet & below */
        @media (max-width: 900px) {
          .auth-container { padding: 0.75rem; align-items: flex-start; }
          .auth-form { flex-direction: column; max-width: 600px; border-radius: 1.5rem; max-height: none; }
          .brand-panel { width: auto; padding: 1.85rem 1.5rem 1.6rem; }
          .brand-inner { align-items: center; text-align: center; gap: 0.9rem; }
          .logo-link, .badge { align-self: center; }
          .form-title { font-size: 1.4rem; }
          .form-subtitle { max-width: 440px; }
          .brand-facts { flex-direction: row; justify-content: center; flex-wrap: wrap; gap: 0.9rem 1.5rem; margin-top: 0.2rem; }
          .fact { flex-direction: column; gap: 0.2rem; text-align: center; }
          .fact > div { align-items: center; }
          .brand-partners { align-items: center; }
          .partners-grid { margin: 0 auto; grid-template-columns: repeat(4, 1fr); max-width: 420px; width: 100%; }
          .form-panel { max-height: none; overflow: visible; padding: 1.75rem 1.5rem 1.75rem; }
        }
        @media (max-width: 640px) {
          .brand-panel { padding: 1.6rem 1.25rem 1.4rem; }
          .form-panel { padding: 1.5rem 1.1rem 1.6rem; }
          .form-title { font-size: 1.25rem; }
          .form-subtitle { font-size: 0.82rem; }
          .logo-link { max-width: 170px; }
          .brand-facts { gap: 0.75rem 1.1rem; }
          .partners-grid { grid-template-columns: repeat(2, 1fr); max-width: 260px; }
          .step-label { display: none; }
          .step-circle { width: 36px; height: 36px; font-size: 1rem; }
          .stepper-track { top: 17px; }
          .input-row { flex-direction: column; gap: 0.75rem; }
          .form-input { height: 3.25rem; line-height: 3rem; font-size: 0.9rem; padding-left: 3rem; }
          .input-icon { height: 3.25rem; left: 0.875rem; font-size: 1.1rem; }
          .review-grid { grid-template-columns: 1fr; }
          .nav-button { padding: 0.8rem 1.25rem; font-size: 0.85rem; }
        }
        @media (max-width: 400px) {
          .step-circle { width: 32px; height: 32px; }
          .nav-button { padding: 0.75rem 1rem; }
          .brand-facts { gap: 0.6rem 0.9rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .auth-container *, .modal-overlay * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </section>
  );
};

export default GoTractApplication;
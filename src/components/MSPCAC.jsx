"use client";
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

/* ------------------------------------------------------------------ */
/*  MSP CAC Onboarding form (public)                                   */
/*  Flow: enter phone -> lookup -> prefill bio (or new) -> full form.  */
/*    GET  /msps/cac-lookup?phone=…                                    */
/*    POST /msps/cac-registration  (multipart)                        */
/* ------------------------------------------------------------------ */

const ID_TYPES = [
  { value: "passport", label: "International Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "voters_card", label: "Voter's Card" },
  { value: "national_id", label: "National ID Card" },
];

const MAX_MB = 5;
const okType = (file, exts) => exts.some((e) => file.name.toLowerCase().endsWith(e));

// Words CAC treats as generic/descriptive — a name made only of these gets bounced.
const GENERIC_WORDS = new Set([
  "farming", "farm", "farmer", "fishing", "fish", "poultry", "agriculture", "agric",
  "crops", "crop", "livestock", "cattle", "goat", "rice", "maize", "yam", "cassava",
  "business", "trading", "trade", "trader", "services", "service", "enterprise",
  "enterprises", "ventures", "venture", "company", "ltd", "limited", "nig", "nigeria",
  "global", "and", "sons", "general", "merchant", "merchants", "store", "shop", "the",
]);
const isGenericName = (name) => {
  const words = (name || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return false;
  const distinctive = words.filter((w) => !GENERIC_WORDS.has(w) && w.length > 1);
  return distinctive.length === 0;
};

const emptyForm = {
  firstName: "", lastName: "", otherNames: "", gender: "", email: "",
  dateOfBirth: "", state: "", lga: "",
  cohort: "", nin: "", validIdType: "",
  businessAddress: "", businessName1: "", businessName2: "", businessName3: "",
};

const FileField = ({ label, hint, accept, file, onFile, error, onPick, icon }) => (
  <div className="col-12 col-md-4">
    <label className="form-label">
      {label} {onFile && !file ? <span className="text-success" style={{ fontSize: "0.72rem" }}>· on file</span> : <span className="text-danger">*</span>}
    </label>
    <label
      className={`d-flex flex-column align-items-center justify-content-center text-center p-3 rounded border ${error ? "border-danger" : "border-2"}`}
      style={{ cursor: "pointer", minHeight: 120, borderStyle: file || onFile ? "solid" : "dashed", background: "#f8fafc" }}
    >
      <input type="file" accept={accept} className="d-none" onChange={(e) => onPick(e.target.files?.[0] || null)} />
      <Icon icon={file ? "mdi:check-circle" : onFile ? "mdi:file-check-outline" : icon} width={30} className={file ? "text-success" : onFile ? "text-success-600" : "text-secondary"} />
      {file ? (
        <span className="text-sm mt-2 fw-medium text-truncate" style={{ maxWidth: "100%" }}>{file.name}</span>
      ) : onFile ? (
        <span className="text-sm mt-2 fw-medium">On file — click to replace</span>
      ) : (
        <>
          <span className="text-sm mt-2 fw-medium">Click to upload</span>
          <span className="text-secondary" style={{ fontSize: "0.72rem" }}>{hint}</span>
        </>
      )}
    </label>
    {error && <div className="text-danger" style={{ fontSize: "0.78rem" }}>{error}</div>}
  </div>
);

const MspCacForm = () => {
  const [phase, setPhase] = useState("phone"); // "phone" | "form"
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [isExisting, setIsExisting] = useState(false);
  const [onFile, setOnFile] = useState({ validId: false, passportPhoto: false, signature: false });

  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState({ validId: null, passportPhoto: null, signature: null });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [ageOnFile, setAgeOnFile] = useState(null);
  const [nameStatus, setNameStatus] = useState({ businessName1: null, businessName2: null, businessName3: null });
  const [nameSuggestions, setNameSuggestions] = useState({ businessName1: [], businessName2: [], businessName3: [] });
  const [suggestLoading, setSuggestLoading] = useState({ businessName1: false, businessName2: false, businessName3: false });

  // Load states once
  useEffect(() => {
    api.get("/msps/cac-states").then((r) => setStates(r.data?.data || [])).catch(() => {});
  }, []);

  // Load LGAs whenever the selected state changes
  useEffect(() => {
    if (!form.state) { setLgas([]); return; }
    api.get("/msps/cac-lgas", { params: { state: form.state } })
      .then((r) => setLgas(r.data?.data || []))
      .catch(() => setLgas([]));
  }, [form.state]);

  const onStateChange = (v) => {
    setForm((p) => ({ ...p, state: v, lga: "" }));
    setErrors((p) => ({ ...p, state: "", lga: "" }));
  };

  // Real-time check: is a proposed business name already registered by another MSP?
  useEffect(() => {
    const keys = ["businessName1", "businessName2", "businessName3"];
    const timer = setTimeout(async () => {
      for (const key of keys) {
        const value = (form[key] || "").trim();
        if (value.length < 2) {
          setNameStatus((p) => ({ ...p, [key]: null }));
          continue;
        }
        setNameStatus((p) => ({ ...p, [key]: "checking" }));
        try {
          const res = await api.get("/msps/cac-name-check", { params: { name: value, phone } });
          setNameStatus((p) => ({ ...p, [key]: res.data?.taken ? "taken" : "available" }));
        } catch {
          setNameStatus((p) => ({ ...p, [key]: null }));
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.businessName1, form.businessName2, form.businessName3, phone]);

  const setField = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleSuggest = async (key) => {
    setSuggestLoading((p) => ({ ...p, [key]: true }));
    try {
      const res = await api.post("/msps/cac-name-suggest", { name: (form[key] || "").trim() });
      const list = res.data?.suggestions || [];
      setNameSuggestions((p) => ({ ...p, [key]: list }));
      if (!list.length) toast("No suggestions available right now.");
    } catch {
      toast.error("Couldn't fetch AI suggestions.");
    } finally {
      setSuggestLoading((p) => ({ ...p, [key]: false }));
    }
  };

  const applySuggestion = (key, value) => {
    setField(key, value);
    setNameSuggestions((p) => ({ ...p, [key]: [] }));
  };

  const pickFile = (key, file) => {
    if (file) {
      const allowed = key === "validId" ? okType(file, [".jpg", ".jpeg", ".png", ".pdf"]) : okType(file, [".jpg", ".jpeg", ".png"]);
      if (!allowed) return setErrors((p) => ({ ...p, [key]: key === "validId" ? "JPG, PNG or PDF only" : "JPG or PNG only" }));
      if (file.size > MAX_MB * 1024 * 1024) return setErrors((p) => ({ ...p, [key]: `Must be under ${MAX_MB} MB` }));
    }
    setFiles((p) => ({ ...p, [key]: file }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const lookup = async () => {
    if (!/^\d{11}$/.test(phone)) return setPhoneError("Enter a valid 11-digit phone number");
    setPhoneError("");
    setLookupLoading(true);
    try {
      const res = await api.get("/msps/cac-lookup", { params: { phone } });
      if (res.data?.found) {
        const d = res.data.data || {};
        setForm({
          firstName: d.firstName || "", lastName: d.lastName || "", otherNames: d.otherNames || "",
          gender: d.gender || "", email: d.email || "", dateOfBirth: d.dateOfBirth || "",
          state: d.state ? String(d.state) : "", lga: d.lga ? String(d.lga) : "",
          cohort: d.cohort || "", nin: d.nin || "", validIdType: d.validIdType || "",
          businessAddress: d.businessAddress || "", businessName1: d.businessName1 || "",
          businessName2: d.businessName2 || "", businessName3: d.businessName3 || "",
        });
        setOnFile({ validId: !!d.hasValidId, passportPhoto: !!d.hasPassport, signature: !!d.hasSignature });
        setAgeOnFile(d.age ?? null);
        setIsExisting(true);
      } else {
        setForm(emptyForm);
        setOnFile({ validId: false, passportPhoto: false, signature: false });
        setAgeOnFile(null);
        setIsExisting(false);
      }
      setPhase("form");
    } catch (e) {
      setPhoneError(e?.response?.data?.message || "Could not check that number. Please try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.cohort) e.cohort = "Select your MSP cohort";
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.gender) e.gender = "Select gender";
    if (!form.dateOfBirth && !ageOnFile) e.dateOfBirth = "Date of birth is required";
    if (!form.state) e.state = "Select your state";
    if (!form.lga) e.lga = "Select your LGA";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!/^\d{11}$/.test(form.nin)) e.nin = "NIN must be 11 digits";
    if (!form.validIdType) e.validIdType = "Select your ID type";
    if (!files.validId && !onFile.validId) e.validId = "Upload your valid ID";
    if (!files.passportPhoto && !onFile.passportPhoto) e.passportPhoto = "Upload your passport photo";
    if (!files.signature && !onFile.signature) e.signature = "Upload your scanned signature";
    if (!form.businessAddress.trim()) e.businessAddress = "Business address is required";
    ["businessName1", "businessName2", "businessName3"].forEach((k, i) => {
      if (!form[k].trim()) e[k] = `Proposed name ${i + 1} is required`;
    });
    const names = [form.businessName1, form.businessName2, form.businessName3].map((n) => n.trim().toLowerCase()).filter(Boolean);
    if (new Set(names).size < names.length) e.businessName1 = "The three names must be different";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) { toast.error("Please fix the highlighted fields."); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("phoneNumber", phone);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
      if (files.validId) fd.append("validId", files.validId);
      if (files.passportPhoto) fd.append("passportPhoto", files.passportPhoto);
      if (files.signature) fd.append("signature", files.signature);

      const res = await api.post("/msps/cac-registration", fd);
      toast.success("Details submitted successfully.");
      setDone(res.data?.data || { fullName: `${form.firstName} ${form.lastName}` });
    } catch (err) {
      const resErrors = err?.response?.data?.errors;
      if (resErrors) {
        const mapped = {};
        Object.keys(resErrors).forEach((k) => (mapped[k] = resErrors[k][0]));
        setErrors((p) => ({ ...p, ...mapped }));
        toast.error(err?.response?.data?.message || "Please correct the highlighted fields.");
      } else {
        toast.error(err?.response?.data?.message || "Submission failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Success ---------- */
  const resetAll = () => {
    setDone(null);
    setPhase("phone");
    setPhone("");
    setPhoneError("");
    setForm(emptyForm);
    setFiles({ validId: null, passportPhoto: null, signature: null });
    setErrors({});
    setIsExisting(false);
    setOnFile({ validId: false, passportPhoto: false, signature: false });
    setAgeOnFile(null);
    setLgas([]);
    setNameStatus({ businessName1: null, businessName2: null, businessName3: null });
    setNameSuggestions({ businessName1: [], businessName2: [], businessName3: [] });
  };

  if (done) {
    return (
      <div className="container py-5" style={{ maxWidth: 640 }}>
        <Toaster position="top-right" />
        <div className="card text-center">
          <div className="card-body p-5">
            <Icon icon="clarity:success-standard-line" width={64} className="text-success mb-3" />
            <h4 className="fw-bold mb-2">Details Submitted</h4>
            <p className="text-secondary mb-3">Thank you{done.fullName ? `, ${done.fullName}` : ""}. Your CAC onboarding details have been received.</p>
            {done.code && (
              <div className="d-inline-block px-4 py-3 rounded bg-success-light">
                <div className="text-secondary text-sm mb-1">Your registration code</div>
                <div className="fw-bold fs-5 text-success-600" style={{ letterSpacing: 2 }}>{done.code}</div>
                {done.emailed && <div className="text-secondary mt-1" style={{ fontSize: "0.75rem" }}>A copy has been sent to your email.</div>}
              </div>
            )}
            <div className="mt-4">
              <button className="btn btn-success px-4 d-inline-flex align-items-center justify-content-center gap-1" onClick={resetAll}>
                <Icon icon="mdi:home-outline" /> Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Header (shared) ---------- */
  const Header = () => (
    <div className="rounded-3 p-4 mb-4 text-white" style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
      <h4 className="text-white fw-bold mb-1">MSP CAC Registration — Details Submission</h4>
      <p className="mb-2" style={{ color: "rgba(255,255,255,0.85)" }}>
        Existing MSPs (Year 1 &amp; Year 2), please provide the details below for onboarding on the CAC portal.
      </p>
      <span className="badge rounded-pill px-3 py-2 d-inline-flex align-items-center gap-1" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <Icon icon="mdi:calendar-clock" /> Deadline: Friday, 10 July 2026
      </span>
    </div>
  );

  /* ---------- Phase 1: phone ---------- */
  if (phase === "phone") {
    return (
      <div className="container py-4" style={{ maxWidth: 560 }}>
        <Toaster position="top-right" />
        <Header />
        <div className="card">
          <div className="card-body p-4">
            <h6 className="fw-bold text-success-600 mb-1">Get started</h6>
            <p className="text-secondary text-sm mb-3">Enter your registered phone number. If we find your record, we'll prefill your details.</p>
            <label className="form-label">Phone Number <span className="text-danger">*</span></label>
            <div className="input-group">
              <span className="input-group-text"><Icon icon="mdi:phone-outline" /></span>
              <input
                className={`form-control ${phoneError ? "is-invalid" : ""}`}
                value={phone}
                inputMode="numeric"
                maxLength={11}
                placeholder="11-digit phone number"
                onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }}
                onKeyDown={(e) => e.key === "Enter" && lookup()}
              />
            </div>
            {phoneError && <div className="text-danger mt-1" style={{ fontSize: "0.8rem" }}>{phoneError}</div>}
            <button className="btn btn-success w-100 mt-3 d-inline-flex align-items-center justify-content-center gap-1" onClick={lookup} disabled={lookupLoading}>
              {lookupLoading ? (<><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Checking…</>) : (<><Icon icon="mdi:arrow-right" />Continue</>)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Phase 2: form ---------- */
  return (
    <div className="container py-4" style={{ maxWidth: 860 }}>
      <Toaster position="top-right" />
      <Header />

      <div className={`alert ${isExisting ? "alert-success" : "alert-info"} d-flex align-items-center gap-2`}>
        <Icon icon={isExisting ? "mdi:account-check-outline" : "mdi:account-plus-outline"} width={20} />
        <div className="flex-grow-1">
          {isExisting ? "We found your MSP record — please review and complete the details below." : "No existing record found — you'll be onboarded as a new MSP."}
          <span className="text-secondary"> ({phone})</span>
        </div>
        <button className="btn btn-sm btn-link text-decoration-none p-0" onClick={() => setPhase("phone")}>Change</button>
      </div>

      <div className="card">
        <div className="card-body">
          {/* Bio */}
          <h6 className="fw-bold text-success-600 mb-3">Your Details</h6>
          <div className="row g-3 mb-2">
            <div className="col-12 col-md-4">
              <label className="form-label">First Name <span className="text-danger">*</span></label>
              <input className={`form-control ${errors.firstName ? "is-invalid" : ""}`} value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} />
              {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">Last Name <span className="text-danger">*</span></label>
              <input className={`form-control ${errors.lastName ? "is-invalid" : ""}`} value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} />
              {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">Other Names</label>
              <input className="form-control" value={form.otherNames} onChange={(e) => setField("otherNames", e.target.value)} />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">Gender <span className="text-danger">*</span></label>
              <select className={`form-select ${errors.gender ? "is-invalid" : ""}`} value={form.gender} onChange={(e) => setField("gender", e.target.value)}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">
                Date of Birth {ageOnFile ? <span className="text-success" style={{ fontSize: "0.72rem" }}>· age on file ({ageOnFile})</span> : <span className="text-danger">*</span>}
              </label>
              <input type="date" className={`form-control ${errors.dateOfBirth ? "is-invalid" : ""}`} value={form.dateOfBirth} max={new Date().toISOString().split("T")[0]} onChange={(e) => setField("dateOfBirth", e.target.value)} />
              {errors.dateOfBirth && <div className="invalid-feedback">{errors.dateOfBirth}</div>}
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">State <span className="text-danger">*</span></label>
              <select className={`form-select ${errors.state ? "is-invalid" : ""}`} value={form.state} onChange={(e) => onStateChange(e.target.value)}>
                <option value="">Select state</option>
                {states.map((s) => {
                  const id = s.stateId ?? s.id;
                  const label = s.stateName ?? s.name ?? s.state ?? id;
                  return <option key={id} value={String(id)}>{label}</option>;
                })}
              </select>
              {errors.state && <div className="invalid-feedback">{errors.state}</div>}
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">LGA <span className="text-danger">*</span></label>
              <select className={`form-select ${errors.lga ? "is-invalid" : ""}`} value={form.lga} onChange={(e) => setField("lga", e.target.value)} disabled={!form.state}>
                <option value="">{form.state ? "Select LGA" : "Select state first"}</option>
                {lgas.map((l) => {
                  const id = l.lgaId ?? l.id;
                  const label = l.lgaName ?? l.name ?? l.lga ?? id;
                  return <option key={id} value={String(id)}>{label}</option>;
                })}
              </select>
              {errors.lga && <div className="invalid-feedback">{errors.lga}</div>}
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">MSP Cohort <span className="text-danger">*</span></label>
              <select className={`form-select ${errors.cohort ? "is-invalid" : ""}`} value={form.cohort} onChange={(e) => setField("cohort", e.target.value)}>
                <option value="">Select cohort</option>
                <option value="Year 1">Year 1</option>
                <option value="Year 2">Year 2</option>
              </select>
              {errors.cohort && <div className="invalid-feedback">{errors.cohort}</div>}
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">NIN <span className="text-danger">*</span></label>
              <input className={`form-control ${errors.nin ? "is-invalid" : ""}`} value={form.nin} inputMode="numeric" maxLength={11} onChange={(e) => setField("nin", e.target.value)} placeholder="11-digit NIN" />
              {errors.nin && <div className="invalid-feedback">{errors.nin}</div>}
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">Email <span className="text-secondary" style={{ fontSize: "0.72rem" }}>(optional)</span></label>
              <input type="email" className={`form-control ${errors.email ? "is-invalid" : ""}`} value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="you@example.com" />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              <div className="text-secondary" style={{ fontSize: "0.72rem" }}>We'll email your registration code here.</div>
            </div>
          </div>

          <hr className="my-4" />

          {/* Documents */}
          <h6 className="fw-bold text-success-600 mb-3">Identification &amp; Documents</h6>
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-4">
              <label className="form-label">Valid ID Type <span className="text-danger">*</span></label>
              <select className={`form-select ${errors.validIdType ? "is-invalid" : ""}`} value={form.validIdType} onChange={(e) => setField("validIdType", e.target.value)}>
                <option value="">Select ID type</option>
                {ID_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {errors.validIdType && <div className="invalid-feedback">{errors.validIdType}</div>}
            </div>
          </div>
          <div className="row g-3">
            <FileField label="Valid ID" hint="JPG, PNG or PDF · max 5MB" accept=".jpg,.jpeg,.png,.pdf" icon="mdi:card-account-details-outline" file={files.validId} onFile={onFile.validId} error={errors.validId} onPick={(f) => pickFile("validId", f)} />
            <FileField label="Passport Photo" hint="JPG or PNG · max 5MB" accept=".jpg,.jpeg,.png" icon="mdi:account-box-outline" file={files.passportPhoto} onFile={onFile.passportPhoto} error={errors.passportPhoto} onPick={(f) => pickFile("passportPhoto", f)} />
            <FileField label="Scanned Signature" hint="JPG or PNG · max 5MB" accept=".jpg,.jpeg,.png" icon="mdi:draw-pen" file={files.signature} onFile={onFile.signature} error={errors.signature} onPick={(f) => pickFile("signature", f)} />
          </div>

          <hr className="my-4" />

          {/* Business */}
          <h6 className="fw-bold text-success-600 mb-3">Business Details</h6>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Business Address <span className="text-danger">*</span></label>
              <textarea className={`form-control ${errors.businessAddress ? "is-invalid" : ""}`} rows={2} value={form.businessAddress} onChange={(e) => setField("businessAddress", e.target.value)} placeholder="Full business address" />
              {errors.businessAddress && <div className="invalid-feedback">{errors.businessAddress}</div>}
            </div>
            {[1, 2, 3].map((n) => {
              const key = `businessName${n}`;
              const generic = isGenericName(form[key]);
              const status = nameStatus[key];
              return (
                <div className="col-12 col-md-4" key={n}>
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label mb-1">Proposed Business Name {n} <span className="text-danger">*</span></label>
                    <button type="button" className="btn btn-sm btn-link p-0 text-decoration-none d-inline-flex align-items-center gap-1" onClick={() => handleSuggest(key)} disabled={suggestLoading[key]}>
                      {suggestLoading[key]
                        ? <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }}></span>
                        : <><Icon icon="mdi:auto-fix" /> Suggest</>}
                    </button>
                  </div>
                  <input className={`form-control ${errors[key] ? "is-invalid" : ""}`} value={form[key]} onChange={(e) => setField(key, e.target.value)} placeholder={`Option ${n}`} />
                  {errors[key] && <div className="invalid-feedback">{errors[key]}</div>}

                  {generic ? (
                    <small className="text-danger d-flex align-items-center gap-1 mt-1"><Icon icon="mdi:alert-outline" />Too generic — CAC will likely reject this. Tap "Suggest".</small>
                  ) : status === "checking" ? (
                    <small className="text-secondary d-flex align-items-center gap-1 mt-1"><span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }}></span>Checking availability…</small>
                  ) : status === "available" ? (
                    <small className="text-success d-flex align-items-center gap-1 mt-1"><Icon icon="mdi:check-circle-outline" />Available</small>
                  ) : status === "taken" ? (
                    <small className="text-danger d-flex align-items-center gap-1 mt-1"><Icon icon="mdi:alert-circle-outline" />Already proposed — consider another</small>
                  ) : null}

                  {(nameSuggestions[key] || []).length > 0 && (
                    <div className="mt-2 d-flex flex-wrap gap-1">
                      {nameSuggestions[key].map((s, i) => (
                        <button key={i} type="button" className="btn btn-sm btn-outline-success py-0 px-2" style={{ fontSize: "0.72rem" }} onClick={() => applySuggestion(key, s)}>{s}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="d-flex justify-content-end mt-4">
            <button className="btn btn-success px-4 d-inline-flex align-items-center justify-content-center gap-1" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (<><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Submitting…</>) : (<><Icon icon="mdi:send-check" />Submit Details</>)}
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-secondary mt-3 d-flex align-items-center justify-content-center gap-1" style={{ fontSize: "0.78rem" }}>
        <Icon icon="mdi:shield-lock-outline" />
        Your documents are used solely for CAC business registration under this programme.
      </p>
    </div>
  );
};

export default MspCacForm;
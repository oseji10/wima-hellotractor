"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const arr = (x) => (Array.isArray(x) ? x : []);
const today = () => new Date().toISOString().slice(0, 10);

const FIELD_TYPES = ["text", "textarea", "number", "select", "boolean", "date"];
const emptyField = () => ({ label: "", type: "number", unit: "", required: false, options: "" });

/* ---------------------------- Form builder ---------------------------- */
const FormBuilder = ({ onClose, onSaved }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState([emptyField()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const setField = (i, k, v) => setFields((fs) => fs.map((f, idx) => (idx === i ? { ...f, [k]: v } : f)));
  const addField = () => setFields((fs) => [...fs, emptyField()]);
  const delField = (i) => setFields((fs) => (fs.length > 1 ? fs.filter((_, idx) => idx !== i) : fs));

  const save = async () => {
    if (!name || fields.some((f) => !f.label)) { setError("Form name and every field label are required."); return; }
    setSaving(true); setError(null);
    try {
      await api.post(`/me/forms`, {
        name, description,
        fields: fields.map((f) => ({
          label: f.label, type: f.type, required: f.required, unit: f.unit || null,
          options: f.type === "select" ? f.options.split(",").map((o) => o.trim()).filter(Boolean) : null,
        })),
      });
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save form.");
    } finally { setSaving(false); }
  };

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(16,24,40,.5)" }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
          <div className="modal-header">
            <h5 className="modal-title">New collection form</h5>
            <button className="btn-close" onClick={onClose} disabled={saving} />
          </div>
          <div className="modal-body">
            <div className="row g-3 mb-2">
              <div className="col-md-6">
                <label className="form-label">Form name *</label>
                <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Weekly Field Activity" />
              </div>
              <div className="col-md-6">
                <label className="form-label">Description</label>
                <input className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>

            <label className="form-label">Fields</label>
            {fields.map((f, i) => (
              <div key={i}>
                <div className="me-field-row">
                  <input className="form-control form-control-sm" placeholder="Field label" value={f.label} onChange={(e) => setField(i, "label", e.target.value)} />
                  <select className="form-select form-select-sm" value={f.type} onChange={(e) => setField(i, "type", e.target.value)}>
                    {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input className="form-control form-control-sm" placeholder="Unit" value={f.unit} onChange={(e) => setField(i, "unit", e.target.value)} />
                  <button className="btn btn-sm btn-link text-danger p-0" onClick={() => delField(i)}><Icon icon="solar:close-circle-outline" width={18} /></button>
                </div>
                {f.type === "select" && (
                  <input className="form-control form-control-sm mb-2" placeholder="Options, comma-separated" value={f.options} onChange={(e) => setField(i, "options", e.target.value)} />
                )}
                <div className="form-check mb-2">
                  <input className="form-check-input" type="checkbox" id={`req${i}`} checked={f.required} onChange={(e) => setField(i, "required", e.target.checked)} />
                  <label className="form-check-label small" htmlFor={`req${i}`}>Required</label>
                </div>
              </div>
            ))}
            <button className="btn btn-sm btn-light" onClick={addField}><Icon icon="solar:add-circle-outline" width={15} className="me-1" />Add field</button>
            {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-light" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}Save form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------- Dynamic submission ------------------------- */
const SubmissionForm = ({ form, hubs, onClose, onSaved }) => {
  const [hub, setHub] = useState("");
  const [date, setDate] = useState(today());
  const [location, setLocation] = useState("");
  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const setVal = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const submit = async () => {
    setSaving(true); setError(null);
    try {
      await api.post(`/me/submissions`, {
        form_id: form.id, hub: hub || null, submission_date: date, location, data,
      });
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to submit.");
    } finally { setSaving(false); }
  };

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(16,24,40,.5)" }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
          <div className="modal-header">
            <div>
              <h5 className="modal-title">{form.name}</h5>
              {form.description && <div className="small text-muted">{form.description}</div>}
            </div>
            <button className="btn-close" onClick={onClose} disabled={saving} />
          </div>
          <div className="modal-body">
            <div className="row g-3 mb-2">
              <div className="col-md-4">
                <label className="form-label">Hub</label>
                <select className="form-select" value={hub} onChange={(e) => setHub(e.target.value)}>
                  <option value="">N/A</option>
                  {hubs.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Location</label>
                <input className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            </div>
            <hr />
            <div className="row g-3">
              {arr(form.fields).map((f) => (
                <div className="col-md-6" key={f.key}>
                  <label className="form-label">{f.label}{f.required ? " *" : ""}{f.unit ? ` (${f.unit})` : ""}</label>
                  {f.type === "textarea" ? (
                    <textarea className="form-control" rows={2} value={data[f.key] || ""} onChange={(e) => setVal(f.key, e.target.value)} />
                  ) : f.type === "select" ? (
                    <select className="form-select" value={data[f.key] || ""} onChange={(e) => setVal(f.key, e.target.value)}>
                      <option value="">Select…</option>
                      {arr(f.options).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : f.type === "boolean" ? (
                    <select className="form-select" value={data[f.key] || ""} onChange={(e) => setVal(f.key, e.target.value)}>
                      <option value="">—</option><option value="1">Yes</option><option value="0">No</option>
                    </select>
                  ) : (
                    <input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                      className="form-control" value={data[f.key] || ""} onChange={(e) => setVal(f.key, e.target.value)} />
                  )}
                </div>
              ))}
            </div>
            {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-light" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}Submit data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --------------------------- Main panel ------------------------------- */
const DataCollectionPanel = ({ userRole, hubs }) => {
  const canManage = userRole === "ADMIN" || userRole === "National Coordinator";
  const [forms, setForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [builder, setBuilder] = useState(false);
  const [collectForm, setCollectForm] = useState(null);

  const loadForms = useCallback(() => {
    api.get(`/me/forms`).then((r) => setForms(arr(r.data))).catch(() => setForms([]));
  }, []);
  const loadSubs = useCallback(() => {
    setLoading(true);
    api.get(`/me/submissions`, { params: { per_page: 25 } })
      .then((r) => setSubmissions(arr(r.data?.data ?? r.data)))
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { loadForms(); loadSubs(); }, [loadForms, loadSubs]);

  const startCollect = async (f) => {
    const r = await api.get(`/me/forms/${f.id}`);
    setCollectForm(r.data);
  };

  return (
    <>
      <div className="me-panel-head">
        <h6 className="mb-0">Field data collection</h6>
        {canManage && <button className="btn btn-sm btn-outline-primary" onClick={() => setBuilder(true)}><Icon icon="solar:widget-add-outline" width={15} className="me-1" />New form</button>}
      </div>

      <div className="row g-3 mb-4">
        {forms.length === 0 ? (
          <div className="col-12"><div className="me-card"><div className="me-empty">No forms yet.{canManage ? " Create one to start collecting field data." : ""}</div></div></div>
        ) : forms.map((f) => (
          <div className="col-md-6 col-lg-4" key={f.id}>
            <div className="me-card me-card-pad h-100 d-flex flex-column">
              <div className="fw-bold">{f.name}</div>
              <div className="small text-muted mb-2">{f.description || "—"}</div>
              <div className="small text-muted mb-3">{f.fields_count ?? 0} fields · v{f.version}</div>
              <button className="btn btn-sm btn-primary mt-auto" onClick={() => startCollect(f)}>
                <Icon icon="solar:pen-new-square-outline" width={15} className="me-1" />Collect data
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="me-panel-head"><h6 className="mb-0">Recent submissions</h6></div>
      <div className="me-card">
        <div className="table-responsive">
          <table className="me-table">
            <thead><tr><th>Form</th><th>Hub</th><th>Date</th><th>By</th><th>Location</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5"><div className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary" /></div></td></tr>
              ) : submissions.length === 0 ? (
                <tr><td colSpan="5" className="me-empty">No submissions yet.</td></tr>
              ) : submissions.map((s) => (
                <tr key={s.id}>
                  <td className="fw-medium">{s.form?.name || "—"}</td>
                  <td className="small">{s.hub?.lgas?.lgaName || "—"}</td>
                  <td className="small text-muted">{s.submission_date}</td>
                  <td className="small">{s.submitter?.name || "—"}</td>
                  <td className="small text-muted">{s.location || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {builder && <FormBuilder onClose={() => setBuilder(false)} onSaved={loadForms} />}
      {collectForm && <SubmissionForm form={collectForm} hubs={hubs} onClose={() => setCollectForm(null)} onSaved={loadSubs} />}
    </>
  );
};

export default DataCollectionPanel;
"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const arr = (x) => (Array.isArray(x) ? x : []);

const emptyForm = () => ({
  name: "", code: "", description: "", unit: "", level: "output", project_id: "", program: "",
  source_type: "form", form_id: "", field_key: "", aggregation: "sum",
  numerator_field: "", denominator_field: "", formula: "",
  baseline: "", target: "", direction: "increase", frequency: "monthly",
  is_donor_visible: false, active: true,
});

const KpiConfigPanel = ({ userRole, projects = [] }) => {
  const canEdit = userRole === "ADMIN" || userRole === "National Coordinator";
  const [items, setItems] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm());

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/me/indicators`).then((r) => setItems(arr(r.data))).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  useEffect(() => {
    api.get(`/me/forms`).then((r) => setForms(arr(r.data))).catch(() => setForms([]));
  }, []);

  const [formFields, setFormFields] = useState([]);
  useEffect(() => {
    if (form.source_type !== "form" || !form.form_id) { setFormFields([]); return; }
    api.get(`/me/forms/${form.form_id}`).then((r) => setFormFields(arr(r.data?.fields))).catch(() => setFormFields([]));
  }, [form.form_id, form.source_type]);

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setError(null); setModal(true); };
  const openEdit = (ind) => {
    setEditing(ind);
    setForm({ ...emptyForm(), ...ind, form_id: ind.form_id || "", baseline: ind.baseline ?? "", target: ind.target ?? "" });
    setError(null);
    setModal(true);
  };

  const save = async () => {
    if (!form.name) { setError("Name is required."); return; }
    setSaving(true); setError(null);
    try {
      const selectedProject = projects.find((p) => String(p.id) === String(form.project_id));
      const payload = {
        ...form,
        project_id: form.project_id || null,
        program: selectedProject ? selectedProject.name : (form.program || null),
        form_id: form.source_type === "form" ? (form.form_id || null) : null,
        baseline: form.baseline === "" ? null : parseFloat(form.baseline),
        target: form.target === "" ? null : parseFloat(form.target),
      };
      if (editing) await api.put(`/me/indicators/${editing.id}`, payload);
      else await api.post(`/me/indicators`, payload);
      setModal(false);
      load();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save KPI.");
    } finally { setSaving(false); }
  };

  const remove = async (ind) => {
    if (!confirm(`Remove KPI "${ind.name}"?`)) return;
    await api.delete(`/me/indicators/${ind.id}`);
    load();
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <div className="me-panel-head">
        <h6 className="mb-0">Digital KPI configuration</h6>
        {canEdit && <button className="btn btn-sm btn-primary" onClick={openAdd}><Icon icon="solar:add-circle-outline" width={15} className="me-1" />New KPI</button>}
      </div>

      <div className="me-card">
        <div className="table-responsive">
          <table className="me-table">
            <thead>
              <tr><th>KPI</th><th>Level</th><th>Program</th><th>Source</th><th className="me-num">Target</th><th>Donor</th>{canEdit && <th></th>}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={canEdit ? 7 : 6}><div className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary" /></div></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={canEdit ? 7 : 6} className="me-empty">No KPIs configured yet.</td></tr>
              ) : items.map((ind) => (
                <tr key={ind.id}>
                  <td>
                    <div className="fw-medium">{ind.name}</div>
                    <div className="small text-muted font-monospace">{ind.code}{ind.unit ? ` · ${ind.unit}` : ""}</div>
                  </td>
                  <td><span className="me-pill me-pill--blue">{ind.level}</span></td>
                  <td className="small">{ind.program || "—"}</td>
                  <td className="small">
                    {ind.source_type === "form" && <>Form: {ind.form?.name || "—"} · {ind.aggregation}</>}
                    {ind.source_type === "manual" && "Manual entry"}
                    {ind.source_type === "computed" && <span className="font-monospace">{ind.formula}</span>}
                  </td>
                  <td className="me-num">{ind.target ?? "—"}</td>
                  <td>{ind.is_donor_visible ? <Icon icon="solar:check-circle-bold" className="text-success" width={18} /> : <span className="text-muted">—</span>}</td>
                  {canEdit && (
                    <td className="me-num">
                      <button className="btn btn-sm btn-link p-0 me-2" onClick={() => openEdit(ind)}><Icon icon="lucide:edit" width={15} /></button>
                      <button className="btn btn-sm btn-link text-danger p-0" onClick={() => remove(ind)}><Icon icon="solar:trash-bin-trash-outline" width={15} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(16,24,40,.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
              <div className="modal-header">
                <h5 className="modal-title">{editing ? "Edit KPI" : "New KPI"}</h5>
                <button className="btn-close" onClick={() => setModal(false)} disabled={saving} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label">Name *</label>
                    <input className="form-control" value={form.name} onChange={(e) => set("name", e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Code</label>
                    <input className="form-control font-monospace" value={form.code} placeholder="auto from name" onChange={(e) => set("code", e.target.value)} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Unit</label>
                    <input className="form-control" value={form.unit} placeholder="count, %, people…" onChange={(e) => set("unit", e.target.value)} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Level</label>
                    <select className="form-select" value={form.level} onChange={(e) => set("level", e.target.value)}>
                      {["output", "outcome", "impact"].map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Program (project)</label>
                    <select className="form-select" value={form.project_id} onChange={(e) => set("project_id", e.target.value)}>
                      <option value="">None</option>
                      {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Frequency</label>
                    <select className="form-select" value={form.frequency} onChange={(e) => set("frequency", e.target.value)}>
                      {["monthly", "quarterly", "annual"].map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>

                  <div className="col-12"><hr className="my-1" /><div className="small fw-semibold text-muted">How is this KPI computed?</div></div>
                  <div className="col-md-4">
                    <label className="form-label">Source</label>
                    <select className="form-select" value={form.source_type} onChange={(e) => set("source_type", e.target.value)}>
                      <option value="form">From a collection form</option>
                      <option value="manual">Manual entry</option>
                      <option value="computed">Computed (formula)</option>
                    </select>
                  </div>

                  {form.source_type === "form" && (
                    <>
                      <div className="col-md-4">
                        <label className="form-label">Form</label>
                        <select className="form-select" value={form.form_id} onChange={(e) => set("form_id", e.target.value)}>
                          <option value="">Select…</option>
                          {forms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Aggregation</label>
                        <select className="form-select" value={form.aggregation} onChange={(e) => set("aggregation", e.target.value)}>
                          {["sum", "average", "count", "latest", "ratio"].map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      {form.aggregation === "ratio" ? (
                        <>
                          <div className="col-md-6">
                            <label className="form-label">Numerator field</label>
                            <select className="form-select" value={form.numerator_field} onChange={(e) => set("numerator_field", e.target.value)}>
                              <option value="">Select…</option>
                              {formFields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Denominator field</label>
                            <select className="form-select" value={form.denominator_field} onChange={(e) => set("denominator_field", e.target.value)}>
                              <option value="">Select…</option>
                              {formFields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                            </select>
                          </div>
                        </>
                      ) : form.aggregation !== "count" && (
                        <div className="col-md-12">
                          <label className="form-label">Field</label>
                          <select className="form-select" value={form.field_key} onChange={(e) => set("field_key", e.target.value)}>
                            <option value="">Select…</option>
                            {formFields.map((f) => <option key={f.key} value={f.key}>{f.label}{f.unit ? ` (${f.unit})` : ""}</option>)}
                          </select>
                        </div>
                      )}
                    </>
                  )}

                  {form.source_type === "computed" && (
                    <div className="col-md-8">
                      <label className="form-label">Formula</label>
                      <input className="form-control font-monospace" value={form.formula} placeholder="e.g. (women_reached / total_reached) * 100" onChange={(e) => set("formula", e.target.value)} />
                      <div className="form-text">Reference other KPIs by their code. Supports + − × ÷ and parentheses.</div>
                    </div>
                  )}

                  <div className="col-12"><hr className="my-1" /><div className="small fw-semibold text-muted">Targets</div></div>
                  <div className="col-md-3">
                    <label className="form-label">Baseline</label>
                    <input type="number" step="any" className="form-control" value={form.baseline} onChange={(e) => set("baseline", e.target.value)} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Target</label>
                    <input type="number" step="any" className="form-control" value={form.target} onChange={(e) => set("target", e.target.value)} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Direction</label>
                    <select className="form-select" value={form.direction} onChange={(e) => set("direction", e.target.value)}>
                      <option value="increase">Higher is better</option>
                      <option value="decrease">Lower is better</option>
                    </select>
                  </div>
                  <div className="col-md-3 d-flex align-items-end">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="donorVis" checked={form.is_donor_visible} onChange={(e) => set("is_donor_visible", e.target.checked)} />
                      <label className="form-check-label" htmlFor="donorVis">Show on donor dashboard</label>
                    </div>
                  </div>
                </div>
                {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setModal(false)} disabled={saving}>Cancel</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}{editing ? "Update KPI" : "Create KPI"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KpiConfigPanel;
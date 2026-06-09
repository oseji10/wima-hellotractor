"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const arr = (x) => (Array.isArray(x) ? x : []);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const statusTone = { valid: "green", expiring: "amber", expired: "red" };
const Pill = ({ tone = "gray", children }) => (
  <span className={`hr-pill hr-pill--${tone}`}><span className="dot" />{children}</span>
);

const TYPES = ["certification", "contract", "training", "document", "background_check", "medical"];

const CompliancePanel = ({ userRole }) => {
  const [data, setData] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ staff_id: "", type: "certification", title: "", issued_at: "", expires_at: "", authority: "", document_ref: "", notes: "" });

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (typeFilter) params.type = typeFilter;
    api.get(`/hr/compliance`, { params })
      .then((r) => setData(arr(r.data)))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [statusFilter, typeFilter]);
  useEffect(load, [load]);

  useEffect(() => {
    api.get(`/hr/staff`, { params: { per_page: 200 } }).then((r) => setStaffList(arr(r.data?.data ?? r.data))).catch(() => setStaffList([]));
  }, []);

  const submit = async () => {
    if (!form.staff_id || !form.title) { setError("Staff and title are required."); return; }
    setSaving(true); setError(null);
    try {
      await api.post(`/hr/compliance`, { ...form, issued_at: form.issued_at || null, expires_at: form.expires_at || null });
      setForm({ staff_id: "", type: "certification", title: "", issued_at: "", expires_at: "", authority: "", document_ref: "", notes: "" });
      setModal(false); load();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save item.");
    } finally { setSaving(false); }
  };

  const remove = async (item) => {
    if (!confirm(`Remove "${item.title}"?`)) return;
    await api.delete(`/hr/compliance/${item.id}`);
    load();
  };

  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-6 col-md-3">
          <label className="hr-field-label">Status</label>
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            {["valid", "expiring", "expired"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <label className="hr-field-label">Type</label>
          <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All</option>
            {TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
          </select>
        </div>
        <div className="col-12 col-md-6 d-flex align-items-end justify-content-md-end">
          <button className="btn btn-primary" onClick={() => setModal(true)}><Icon icon="solar:document-add-outline" width={16} className="me-1" />Add item</button>
        </div>
      </div>

      <div className="hr-card">
        <div className="table-responsive">
          <table className="hr-table">
            <thead><tr><th>Staff</th><th>Item</th><th>Type</th><th>Expires</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6"><div className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary" /></div></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="6" className="hr-empty">No compliance items.</td></tr>
              ) : data.map((c) => (
                <tr key={c.id}>
                  <td className="fw-medium">{c.staff ? `${c.staff.firstName} ${c.staff.lastName}` : "—"}</td>
                  <td>{c.title}{c.authority ? <div className="small text-muted">{c.authority}</div> : null}</td>
                  <td className="small text-capitalize">{c.type.replace("_", " ")}</td>
                  <td className="small text-muted">{fmtDate(c.expires_at)}{c.days_until_expiry != null && c.computed_status !== "expired" ? <div className="small">{c.days_until_expiry}d left</div> : null}</td>
                  <td><Pill tone={statusTone[c.computed_status]}>{c.computed_status}</Pill></td>
                  <td className="hr-num"><button className="btn btn-sm btn-link text-danger p-0" onClick={() => remove(c)}><Icon icon="solar:trash-bin-trash-outline" width={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(16,24,40,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
              <div className="modal-header"><h5 className="modal-title">Add compliance item</h5><button className="btn-close" onClick={() => setModal(false)} disabled={saving} /></div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Staff *</label>
                    <select className="form-select" value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })}>
                      <option value="">Select…</option>
                      {staffList.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-7"><label className="form-label">Title *</label><input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                  <div className="col-md-5">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      {TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6"><label className="form-label">Issued</label><input type="date" className="form-control" value={form.issued_at} onChange={(e) => setForm({ ...form, issued_at: e.target.value })} /></div>
                  <div className="col-md-6"><label className="form-label">Expires</label><input type="date" className="form-control" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></div>
                  <div className="col-md-6"><label className="form-label">Issuing authority</label><input className="form-control" value={form.authority} onChange={(e) => setForm({ ...form, authority: e.target.value })} /></div>
                  <div className="col-md-6"><label className="form-label">Document ref</label><input className="form-control" value={form.document_ref} onChange={(e) => setForm({ ...form, document_ref: e.target.value })} /></div>
                </div>
                {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setModal(false)} disabled={saving}>Cancel</button>
                <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompliancePanel;
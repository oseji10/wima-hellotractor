"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const arr = (x) => (Array.isArray(x) ? x : []);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const statusTone = { pending: "amber", approved: "green", rejected: "red", cancelled: "gray" };
const Pill = ({ tone = "gray", children }) => (
  <span className={`hr-pill hr-pill--${tone}`}><span className="dot" />{children}</span>
);

const LeavePanel = ({ userRole }) => {
  const canApprove = ["ADMIN", "National Coordinator", "State Coordinator", "Community Lead"].includes(userRole);
  const canManageTypes = userRole === "ADMIN" || userRole === "National Coordinator";

  const [data, setData] = useState([]);
  const [types, setTypes] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [requestModal, setRequestModal] = useState(false);
  const [typesModal, setTypesModal] = useState(false);
  const [form, setForm] = useState({ staff_id: "", leave_type_id: "", start_date: "", end_date: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = { per_page: 50 };
    if (statusFilter) params.status = statusFilter;
    api.get(`/hr/leave`, { params })
      .then((r) => setData(arr(r.data?.data ?? r.data)))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);
  useEffect(load, [load]);

  const loadTypes = useCallback(() => {
    api.get(`/hr/leave-types`).then((r) => setTypes(arr(r.data))).catch(() => setTypes([]));
  }, []);
  useEffect(loadTypes, [loadTypes]);

  useEffect(() => {
    api.get(`/hr/staff`, { params: { per_page: 200 } }).then((r) => setStaffList(arr(r.data?.data ?? r.data))).catch(() => setStaffList([]));
  }, []);

  const submit = async () => {
    if (!form.staff_id || !form.leave_type_id || !form.start_date || !form.end_date) { setError("All fields except reason are required."); return; }
    setSaving(true); setError(null);
    try {
      await api.post(`/hr/leave`, form);
      setForm({ staff_id: "", leave_type_id: "", start_date: "", end_date: "", reason: "" });
      setRequestModal(false); load();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to submit request.");
    } finally { setSaving(false); }
  };

  const decide = async (leave, status) => {
    const note = status === "rejected" ? (prompt("Reason for rejection (optional):") || "") : "";
    await api.put(`/hr/leave/${leave.id}/decide`, { status, decision_note: note });
    load();
  };

  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-6 col-md-3">
          <label className="hr-field-label">Status</label>
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            {["pending", "approved", "rejected", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-12 col-md-9 d-flex align-items-end justify-content-md-end gap-2">
          {canManageTypes && <button className="btn btn-outline-secondary" onClick={() => setTypesModal(true)}><Icon icon="solar:settings-outline" width={16} className="me-1" />Leave types</button>}
          <button className="btn btn-primary" onClick={() => setRequestModal(true)}><Icon icon="solar:calendar-add-outline" width={16} className="me-1" />Request leave</button>
        </div>
      </div>

      <div className="hr-card">
        <div className="table-responsive">
          <table className="hr-table">
            <thead><tr><th>Staff</th><th>Type</th><th>Dates</th><th className="hr-num">Days</th><th>Status</th>{canApprove && <th></th>}</tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={canApprove ? 6 : 5}><div className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary" /></div></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={canApprove ? 6 : 5} className="hr-empty">No leave requests.</td></tr>
              ) : data.map((l) => (
                <tr key={l.id}>
                  <td className="fw-medium">{l.staff ? `${l.staff.firstName} ${l.staff.lastName}` : "—"}</td>
                  <td className="small">{l.leave_type?.name || "—"}</td>
                  <td className="small text-muted">{fmtDate(l.start_date)} → {fmtDate(l.end_date)}</td>
                  <td className="hr-num">{l.days}</td>
                  <td><Pill tone={statusTone[l.status]}>{l.status}</Pill></td>
                  {canApprove && (
                    <td className="hr-num">
                      {l.status === "pending" && (
                        <>
                          <button className="btn btn-sm btn-link text-success p-0 me-2" onClick={() => decide(l, "approved")}><Icon icon="solar:check-circle-outline" width={18} /></button>
                          <button className="btn btn-sm btn-link text-danger p-0" onClick={() => decide(l, "rejected")}><Icon icon="solar:close-circle-outline" width={18} /></button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request modal */}
      {requestModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(16,24,40,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
              <div className="modal-header"><h5 className="modal-title">Request leave</h5><button className="btn-close" onClick={() => setRequestModal(false)} disabled={saving} /></div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Staff *</label>
                    <select className="form-select" value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })}>
                      <option value="">Select…</option>
                      {staffList.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Leave type *</label>
                    <select className="form-select" value={form.leave_type_id} onChange={(e) => setForm({ ...form, leave_type_id: e.target.value })}>
                      <option value="">Select…</option>
                      {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="col-6"><label className="form-label">From *</label><input type="date" className="form-control" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                  <div className="col-6"><label className="form-label">To *</label><input type="date" className="form-control" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
                  <div className="col-12"><label className="form-label">Reason</label><textarea className="form-control" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
                </div>
                {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setRequestModal(false)} disabled={saving}>Cancel</button>
                <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {typesModal && <LeaveTypesModal types={types} onClose={() => setTypesModal(false)} onChanged={loadTypes} />}
    </>
  );
};

const LeaveTypesModal = ({ types, onClose, onChanged }) => {
  const [form, setForm] = useState({ name: "", default_days_per_year: 0, paid: true });
  const [saving, setSaving] = useState(false);
  const add = async () => {
    if (!form.name) return;
    setSaving(true);
    try { await api.post(`/hr/leave-types`, { ...form, default_days_per_year: parseInt(form.default_days_per_year, 10) || 0 }); setForm({ name: "", default_days_per_year: 0, paid: true }); onChanged?.(); }
    finally { setSaving(false); }
  };
  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(16,24,40,.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
          <div className="modal-header"><h5 className="modal-title">Leave types</h5><button className="btn-close" onClick={onClose} /></div>
          <div className="modal-body">
            <div className="row g-2 align-items-end mb-3">
              <div className="col-md-5"><label className="hr-field-label">Name</label><input className="form-control form-control-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="col-md-4"><label className="hr-field-label">Days / year</label><input type="number" min="0" className="form-control form-control-sm" value={form.default_days_per_year} onChange={(e) => setForm({ ...form, default_days_per_year: e.target.value })} /></div>
              <div className="col-md-3"><button className="btn btn-sm btn-primary w-100" onClick={add} disabled={saving}>Add</button></div>
            </div>
            <table className="hr-table">
              <thead><tr><th>Type</th><th className="hr-num">Days/yr</th><th>Paid</th></tr></thead>
              <tbody>
                {types.length === 0 ? <tr><td colSpan="3" className="hr-empty">No leave types.</td></tr> :
                  types.map((t) => (
                    <tr key={t.id}><td className="fw-medium">{t.name}</td><td className="hr-num">{t.default_days_per_year}</td><td>{t.paid ? "Yes" : "No"}</td></tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="modal-footer"><button className="btn btn-light" onClick={onClose}>Close</button></div>
        </div>
      </div>
    </div>
  );
};

export default LeavePanel;
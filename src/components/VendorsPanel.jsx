"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const arr = (x) => (Array.isArray(x) ? x : []);

const typeTone = { public: "blue", private: "purple" };
const Pill = ({ tone = "gray", children }) => (
  <span className={`sec-pill sec-pill--${tone}`}><span className="dot" />{children}</span>
);

const emptyVendor = () => ({
  name: "", type: "private", contact_name: "", contact_phone: "", contact_email: "",
  service_scope: "", status: "active", notes: "",
});

const VendorsPanel = ({ userRole, locations }) => {
  const canManage = userRole === "ADMIN" || userRole === "National Coordinator" || userRole === "State Coordinator";
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: "", status: "", search: "" });
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyVendor());
  const [coverage, setCoverage] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.get(`/security/vendors`, { params })
      .then((r) => setData(arr(r.data)))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [filters]);
  useEffect(load, [load]);

  const stateName = (id) => (locations?.states || []).find((s) => String(s.id) === String(id))?.name || `State ${id}`;

  const openAdd = () => { setEditing(null); setForm(emptyVendor()); setCoverage([]); setError(null); setModal(true); };
  const openEdit = (v) => {
    setEditing(v); setForm({ ...emptyVendor(), ...v });
    setCoverage(arr(v.coverage).map((c) => ({ state: c.state || "", lga: c.lga || "", hub: c.hub || "" })));
    setError(null); setModal(true);
  };

  const addCoverage = () => setCoverage((c) => [...c, { state: "", lga: "", hub: "" }]);
  const setCov = (i, k, val) => setCoverage((c) => c.map((row, idx) => (idx === i ? { ...row, [k]: val } : row)));
  const delCov = (i) => setCoverage((c) => c.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!form.name) { setError("Vendor name is required."); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        ...form,
        coverage: coverage.map((c) => ({ state: c.state || null, lga: c.lga || null, hub: c.hub || null })),
      };
      if (editing) await api.put(`/security/vendors/${editing.id}`, payload);
      else await api.post(`/security/vendors`, payload);
      setModal(false); load();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save vendor.");
    } finally { setSaving(false); }
  };

  const remove = async (v) => {
    if (!confirm(`Remove vendor "${v.name}"?`)) return;
    await api.delete(`/security/vendors/${v.id}`);
    load();
  };

  return (
    <>
      <div className="row g-2 mb-3">
        <div className="col-6 col-md-2">
          <label className="sec-field-label">Type</label>
          <select className="form-select" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="">All</option><option value="public">Public</option><option value="private">Private</option>
          </select>
        </div>
        <div className="col-6 col-md-2">
          <label className="sec-field-label">Status</label>
          <select className="form-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="col-12 col-md-4">
          <label className="sec-field-label">Search</label>
          <input className="form-control" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Vendor name…" />
        </div>
        <div className="col-12 col-md-4 d-flex align-items-end justify-content-md-end">
          {canManage && <button className="btn btn-primary" onClick={openAdd}><Icon icon="solar:shield-user-outline" width={16} className="me-1" />Add vendor</button>}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><span className="spinner-border text-primary" /></div>
      ) : data.length === 0 ? (
        <div className="sec-card"><div className="sec-empty">No vendors registered.</div></div>
      ) : (
        <div className="row g-3">
          {data.map((v) => (
            <div className="col-md-6 col-lg-4" key={v.id}>
              <div className="sec-card sec-card-pad h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div><div className="fw-bold">{v.name}</div><div className="small text-muted">{v.contact_name || "—"}</div></div>
                  <Pill tone={typeTone[v.type]}>{v.type}</Pill>
                </div>
                {v.service_scope && <div className="small mb-2">{v.service_scope}</div>}
                <div className="small text-muted mb-1"><Icon icon="solar:phone-outline" width={13} className="me-1" />{v.contact_phone || "—"}{v.contact_email ? ` · ${v.contact_email}` : ""}</div>
                <div className="small mb-2">
                  <span className="text-muted">Covers: </span>
                  {arr(v.coverage).length === 0 ? "—" :
                    [...new Set(arr(v.coverage).map((c) => c.state).filter(Boolean))].map((s) => stateName(s)).join(", ") || "Specific hubs"}
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <Pill tone={v.status === "active" ? "green" : "gray"}>{v.status}</Pill>
                  {canManage && (
                    <div>
                      <button className="btn btn-sm btn-link p-0 me-2" onClick={() => openEdit(v)}><Icon icon="lucide:edit" width={15} /></button>
                      <button className="btn btn-sm btn-link text-danger p-0" onClick={() => remove(v)}><Icon icon="solar:trash-bin-trash-outline" width={15} /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(16,24,40,.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
              <div className="modal-header"><h5 className="modal-title">{editing ? "Edit vendor" : "Add security vendor"}</h5><button className="btn-close" onClick={() => setModal(false)} disabled={saving} /></div>
              <div className="modal-body">
                <div className="row g-3 mb-2">
                  <div className="col-md-7"><label className="form-label">Name *</label><input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div className="col-md-5">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="public">Public (e.g. police, civil defence)</option>
                      <option value="private">Private security firm</option>
                    </select>
                  </div>
                  <div className="col-md-4"><label className="form-label">Contact name</label><input className="form-control" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
                  <div className="col-md-4"><label className="form-label">Phone</label><input className="form-control" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
                  <div className="col-md-4"><label className="form-label">Email</label><input className="form-control" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
                  <div className="col-12"><label className="form-label">Service scope</label><textarea className="form-control" rows={2} value={form.service_scope} onChange={(e) => setForm({ ...form, service_scope: e.target.value })} placeholder="e.g. Armed escort, guarding, rapid response…" /></div>
                  <div className="col-md-4">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0">Coverage (states / communities / hubs)</label>
                  <button className="btn btn-sm btn-light" onClick={addCoverage}><Icon icon="solar:add-circle-outline" width={14} className="me-1" />Add area</button>
                </div>
                {coverage.length === 0 && <div className="small text-muted mb-2">No coverage areas — add the states, communities, or hubs this vendor serves.</div>}
                {coverage.map((c, i) => {
                  const lgas = (locations?.lgas || []).filter((l) => !c.state || String(l.state_id) === String(c.state));
                  const hubs = (locations?.hubs || []).filter((h) => !c.state || String(h.state_id) === String(c.state));
                  return (
                    <div className="row g-2 mb-2 align-items-end" key={i}>
                      <div className="col-md-4">
                        <select className="form-select form-select-sm" value={c.state} onChange={(e) => setCov(i, "state", e.target.value)}>
                          <option value="">Any state</option>{(locations?.states || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <select className="form-select form-select-sm" value={c.lga} onChange={(e) => setCov(i, "lga", e.target.value)}>
                          <option value="">Any community</option>{lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <select className="form-select form-select-sm" value={c.hub} onChange={(e) => setCov(i, "hub", e.target.value)}>
                          <option value="">Any hub</option>{hubs.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                      </div>
                      <div className="col-md-1"><button className="btn btn-sm btn-link text-danger p-0" onClick={() => delCov(i)}><Icon icon="solar:close-circle-outline" width={18} /></button></div>
                    </div>
                  );
                })}
                {error && <div className="alert alert-danger mt-2 mb-0">{error}</div>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setModal(false)} disabled={saving}>Cancel</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}Save vendor</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VendorsPanel;
"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const arr = (x) => (Array.isArray(x) ? x : []);
const initials = (f, l) => `${(f || "?")[0]}${(l || "")[0] || ""}`.toUpperCase();
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const statusTone = { active: "green", on_leave: "amber", suspended: "red", exited: "gray" };
const Pill = ({ tone = "gray", children }) => (
  <span className={`hr-pill hr-pill--${tone}`}><span className="dot" />{children}</span>
);

/* --------------------------- Detail drawer ---------------------------- */
const StaffDrawer = ({ staffId, onClose }) => {
  const [staff, setStaff] = useState(null);
  const [balances, setBalances] = useState([]);
  const [tab, setTab] = useState("profile");

  useEffect(() => {
    api.get(`/hr/staff/${staffId}`).then((r) => setStaff(r.data)).catch(() => setStaff(null));
    api.get(`/hr/staff/${staffId}/leave-balance`).then((r) => setBalances(arr(r.data?.balances))).catch(() => setBalances([]));
  }, [staffId]);

  const TABS = [
    { k: "profile", label: "Profile" },
    { k: "compliance", label: "Compliance" },
    { k: "leave", label: "Leave" },
    { k: "reviews", label: "Reviews" },
  ];

  const p = staff?.profile || {};
  const empStatus = staff?.employment_status || "active";

  return (
    <>
      <div className="hr-overlay" onClick={onClose} />
      <div className="hr-drawer">
        <div className="hr-drawer-head">
          <div className="d-flex gap-3">
            <span className="hr-avatar" style={{ width: 46, height: 46, fontSize: "1rem" }}>
              {staff ? initials(staff.firstName, staff.lastName) : "…"}
            </span>
            <div>
              <h5 className="mb-0">{staff ? staff.full_name : "Loading…"}</h5>
              <div className="small text-muted">{p.job_title || staff?.role_name || "—"}{p.staff_number ? ` · ${p.staff_number}` : ""}</div>
              {staff && <div className="mt-1"><Pill tone={statusTone[empStatus]}>{empStatus.replace("_", " ")}</Pill></div>}
            </div>
          </div>
          <button className="btn-close" onClick={onClose} />
        </div>

        <div className="hr-drawer-tabs">
          {TABS.map((t) => (
            <button key={t.k} className={`hr-tab ${tab === t.k ? "is-active" : ""}`} onClick={() => setTab(t.k)}>{t.label}</button>
          ))}
        </div>

        <div className="hr-drawer-body">
          {!staff ? (
            <div className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary" /></div>
          ) : tab === "profile" ? (
            <dl className="row mb-0 small">
              {[
                ["Email", staff.email], ["Phone", staff.phoneNumber],
                ["Role", staff.role_name], ["Department", p.department],
                ["Employment", (p.employment_type || "").replace("_", " ")],
                ["State", staff.state_name], ["LGA", staff.lga_name],
                ["Manager", staff.manager_name],
                ["Hire date", fmtDate(p.hire_date)],
                ["Years of service", p.years_of_service],
              ].map(([k, v]) => (
                <div className="col-6 mb-3" key={k}>
                  <div className="text-muted" style={{ fontSize: ".7rem", textTransform: "uppercase" }}>{k}</div>
                  <div className="fw-medium">{v || "—"}</div>
                </div>
              ))}
              {p.notes && <div className="col-12"><div className="text-muted" style={{ fontSize: ".7rem", textTransform: "uppercase" }}>Notes</div><div>{p.notes}</div></div>}
            </dl>
          ) : tab === "compliance" ? (
            arr(staff.compliance_items).length === 0 ? <div className="hr-empty">No compliance records.</div> :
            arr(staff.compliance_items).map((c) => (
              <div key={c.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div><div className="fw-medium">{c.title}</div><div className="small text-muted text-capitalize">{c.type.replace("_", " ")} · expires {fmtDate(c.expires_at)}</div></div>
                <Pill tone={c.computed_status === "valid" ? "green" : c.computed_status === "expiring" ? "amber" : "red"}>{c.computed_status}</Pill>
              </div>
            ))
          ) : tab === "leave" ? (
            <>
              <div className="row g-2 mb-3">
                {balances.map((b) => (
                  <div className="col-6" key={b.leave_type_id}>
                    <div className="hr-card hr-card-pad">
                      <div className="small text-muted">{b.name}</div>
                      <div className="fw-bold">{b.remaining} <span className="small text-muted fw-normal">/ {b.allocated} left</span></div>
                    </div>
                  </div>
                ))}
              </div>
              {arr(staff.leave_requests).length === 0 ? <div className="hr-empty">No leave history.</div> :
                arr(staff.leave_requests).map((l) => (
                  <div key={l.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div><div className="fw-medium">{l.leave_type?.name || "Leave"}</div><div className="small text-muted">{fmtDate(l.start_date)} → {fmtDate(l.end_date)} · {l.days}d</div></div>
                    <Pill tone={l.status === "approved" ? "green" : l.status === "pending" ? "amber" : l.status === "rejected" ? "red" : "gray"}>{l.status}</Pill>
                  </div>
                ))}
            </>
          ) : (
            arr(staff.reviews).length === 0 ? <div className="hr-empty">No reviews yet.</div> :
            arr(staff.reviews).map((r) => (
              <div key={r.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div><div className="fw-medium">{r.period_label || "Review"}</div><div className="small text-muted text-capitalize">{r.status.replace("_", " ")}</div></div>
                <div className="fw-bold">{r.overall_score != null ? `${r.overall_score}%` : "—"}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

/* --------------------------- Main panel ------------------------------- */
const StaffDirectoryPanel = ({ userRole, hubs = [], projects = [], onChanged }) => {
  const canManage = userRole === "ADMIN" || userRole === "National Coordinator" || userRole === "State Coordinator";
  const [data, setData] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [drawerId, setDrawerId] = useState(null);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = { per_page: 50 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    api.get(`/hr/staff`, { params })
      .then((r) => setData(arr(r.data?.data ?? r.data)))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [search, statusFilter]);
  useEffect(load, [load]);

  useEffect(() => {
    api.get(`/hr/roles`).then((r) => setRoles(arr(r.data))).catch(() => setRoles([]));
  }, []);

  const openEdit = (s) => {
    const p = s.profile || {};
    setEditing(s);
    setForm({
      firstName: s.firstName || "", lastName: s.lastName || "", otherNames: s.otherNames || "",
      phoneNumber: s.phoneNumber || "", role: s.role || "", account_status: s.account_status || "",
      staff_number: p.staff_number || "", job_title: p.job_title || "", department: p.department || "",
      employment_type: p.employment_type || "full_time", hub: p.hub || "", project_id: p.project_id || "",
      manager_id: p.manager_id || "", hire_date: p.hire_date ? p.hire_date.slice(0, 10) : "",
      employment_status: p.employment_status || "active", base_salary: p.base_salary ?? "", notes: p.notes || "",
    });
    setError(null); setModal(true);
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const payload = {
        ...form,
        role: form.role || null, hub: form.hub || null, project_id: form.project_id || null,
        manager_id: form.manager_id || null, hire_date: form.hire_date || null,
        base_salary: form.base_salary === "" ? null : parseFloat(form.base_salary),
      };
      await api.put(`/hr/staff/${editing.id}`, payload);
      setModal(false); load(); onChanged?.();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save staff record.");
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-6 col-md-4">
          <label className="hr-field-label">Search</label>
          <input className="form-control" placeholder="Name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="col-6 col-md-3">
          <label className="hr-field-label">Employment status</label>
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            {["active", "on_leave", "suspended", "exited"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
      </div>

      <div className="hr-card">
        <div className="table-responsive">
          <table className="hr-table">
            <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Location</th><th>Status</th>{canManage && <th></th>}</tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={canManage ? 6 : 5}><div className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary" /></div></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={canManage ? 6 : 5} className="hr-empty">No staff found.</td></tr>
              ) : data.map((s) => (
                <tr key={s.id} className="clickable" onClick={() => setDrawerId(s.id)}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span className="hr-avatar">{initials(s.firstName, s.lastName)}</span>
                      <div><div className="fw-medium">{s.full_name}</div><div className="small text-muted">{s.email}</div></div>
                    </div>
                  </td>
                  <td className="small">{s.role_name || s.job_title || "—"}</td>
                  <td className="small">{s.department || "—"}</td>
                  <td className="small">{s.lga_name || s.state_name || "—"}</td>
                  <td><Pill tone={statusTone[s.employment_status || "active"]}>{(s.employment_status || "active").replace("_", " ")}</Pill></td>
                  {canManage && (
                    <td className="hr-num" onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-sm btn-link p-0" onClick={() => openEdit(s)} title="Edit employment details"><Icon icon="lucide:edit" width={15} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {drawerId && <StaffDrawer staffId={drawerId} onClose={() => setDrawerId(null)} />}

      {/* Edit modal (employment details + safe user fields) */}
      {modal && editing && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(16,24,40,.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
              <div className="modal-header">
                <div>
                  <h5 className="modal-title">Edit staff record</h5>
                  <div className="small text-muted">{editing.email} — login details are managed in account settings, not here.</div>
                </div>
                <button className="btn-close" onClick={() => setModal(false)} disabled={saving} />
              </div>
              <div className="modal-body">
                <div className="small fw-semibold text-muted mb-2">Person</div>
                <div className="row g-3 mb-2">
                  <div className="col-md-4"><label className="form-label">First name</label><input className="form-control" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} /></div>
                  <div className="col-md-4"><label className="form-label">Last name</label><input className="form-control" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} /></div>
                  <div className="col-md-4"><label className="form-label">Other names</label><input className="form-control" value={form.otherNames} onChange={(e) => set("otherNames", e.target.value)} /></div>
                  <div className="col-md-4"><label className="form-label">Phone</label><input className="form-control" value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} /></div>
                  <div className="col-md-4">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={form.role} onChange={(e) => set("role", e.target.value)}>
                      <option value="">—</option>
                      {roles.map((r) => <option key={r.roleId} value={r.roleId}>{r.roleName}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Account status</label>
                    <input className="form-control" value={form.account_status} onChange={(e) => set("account_status", e.target.value)} placeholder="active / inactive" />
                  </div>
                </div>

                <div className="small fw-semibold text-muted mb-2 mt-2">Employment</div>
                <div className="row g-3">
                  <div className="col-md-4"><label className="form-label">Staff number</label><input className="form-control" value={form.staff_number} onChange={(e) => set("staff_number", e.target.value)} /></div>
                  <div className="col-md-4"><label className="form-label">Job title</label><input className="form-control" value={form.job_title} onChange={(e) => set("job_title", e.target.value)} /></div>
                  <div className="col-md-4"><label className="form-label">Department</label><input className="form-control" value={form.department} onChange={(e) => set("department", e.target.value)} /></div>
                  <div className="col-md-4">
                    <label className="form-label">Employment type</label>
                    <select className="form-select" value={form.employment_type} onChange={(e) => set("employment_type", e.target.value)}>
                      {["full_time", "part_time", "contract", "volunteer", "intern"].map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Employment status</label>
                    <select className="form-select" value={form.employment_status} onChange={(e) => set("employment_status", e.target.value)}>
                      {["active", "on_leave", "suspended", "exited"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Manager</label>
                    <select className="form-select" value={form.manager_id} onChange={(e) => set("manager_id", e.target.value)}>
                      <option value="">—</option>
                      {data.filter((s) => s.id !== editing.id).map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Work hub</label>
                    <select className="form-select" value={form.hub} onChange={(e) => set("hub", e.target.value)}>
                      <option value="">—</option>
                      {hubs.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Project</label>
                    <select className="form-select" value={form.project_id} onChange={(e) => set("project_id", e.target.value)}>
                      <option value="">—</option>
                      {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4"><label className="form-label">Hire date</label><input type="date" className="form-control" value={form.hire_date} onChange={(e) => set("hire_date", e.target.value)} /></div>
                  <div className="col-12"><label className="form-label">Notes</label><textarea className="form-control" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
                </div>
                {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setModal(false)} disabled={saving}>Cancel</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StaffDirectoryPanel;
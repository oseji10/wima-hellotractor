"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const arr = (x) => (Array.isArray(x) ? x : []);
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : "—");

const TYPES = [
  ["bandit_attack", "Bandit attack"], ["terrorism", "Terrorism / insurgency"],
  ["community_unrest", "Community unrest / violence"], ["theft_vandalism", "Theft / vandalism / asset damage"],
  ["equipment_accident", "Equipment-related accident"], ["health_safety", "Health & safety emergency"],
  ["other", "Other"],
];
const typeLabel = (t) => (TYPES.find(([k]) => k === t) || [t, t])[1];
const SEVERITIES = ["low", "medium", "high", "critical"];
const STATUSES = [["open", "Open"], ["under_investigation", "Under investigation"], ["resolved", "Resolved"], ["closed", "Closed"]];

const statusTone = { open: "amber", under_investigation: "blue", resolved: "green", closed: "gray" };
const Pill = ({ tone = "gray", children }) => (
  <span className={`sec-pill sec-pill--${tone}`}><span className="dot" />{children}</span>
);
const Sev = ({ s }) => <span><span className={`sec-sev sec-sev--${s}`} />{s}</span>;

/* ----------------------------- Drawer ------------------------------- */
const IncidentDrawer = ({ id, userRole, staff, onClose, onChanged }) => {
  const [inc, setInc] = useState(null);
  const [tab, setTab] = useState("details");
  const [action, setAction] = useState({ action_type: "response", description: "", decision_note: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/security/incidents/${id}`).then((r) => setInc(r.data)).catch(() => setInc(null));
  }, [id]);
  useEffect(load, [load]);

  const update = async (patch) => {
    setBusy(true);
    try { await api.put(`/security/incidents/${id}`, patch); load(); onChanged?.(); }
    finally { setBusy(false); }
  };

  const addAction = async () => {
    if (!action.description) return;
    setBusy(true);
    try {
      await api.post(`/security/incidents/${id}/actions`, action);
      setAction({ action_type: "response", description: "", decision_note: "" });
      load(); onChanged?.();
    } finally { setBusy(false); }
  };

  return (
    <>
      <div className="sec-overlay" onClick={onClose} />
      <div className="sec-drawer">
        <div className="sec-drawer-head">
          <div>
            <div className="font-monospace small text-muted">{inc?.reference}</div>
            <h5 className="mb-1">{inc?.title || "Loading…"}</h5>
            {inc && <div className="d-flex gap-2"><Pill tone={statusTone[inc.status]}>{inc.status.replace("_", " ")}</Pill><span className="small"><Sev s={inc.severity} /></span></div>}
          </div>
          <button className="btn-close" onClick={onClose} />
        </div>

        <div className="sec-tabs px-3">
          {["details", "timeline", "manage"].map((t) => (
            <button key={t} className={`sec-tab ${tab === t ? "is-active" : ""}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        <div className="sec-drawer-body">
          {!inc ? <div className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary" /></div> :
            tab === "details" ? (
              <dl className="row small mb-0">
                {[
                  ["Type", typeLabel(inc.type)], ["Occurred", fmtDateTime(inc.occurred_at)],
                  ["State", inc.hub_info?.states?.stateName ?? inc.state], ["Community (LGA)", inc.hub_info?.lgas?.lgaName ?? inc.lga],
                  ["Location note", inc.location_note], ["Affected persons", inc.affected_persons || inc.affected_persons_count],
                  ["Affected assets", inc.affected_assets], ["Assigned to", inc.assignee ? `${inc.assignee.firstName} ${inc.assignee.lastName}` : inc.assigned_team],
                  ["Escalation level", inc.escalation_level],
                ].map(([k, v]) => (
                  <div className="col-6 mb-3" key={k}>
                    <div className="text-muted" style={{ fontSize: ".7rem", textTransform: "uppercase" }}>{k}</div>
                    <div className="fw-medium">{v ?? "—"}</div>
                  </div>
                ))}
                <div className="col-12 mb-2">
                  <div className="text-muted" style={{ fontSize: ".7rem", textTransform: "uppercase" }}>Description</div>
                  <div>{inc.description || "—"}</div>
                </div>
                {inc.resolution && <div className="col-12"><div className="text-muted" style={{ fontSize: ".7rem", textTransform: "uppercase" }}>Resolution</div><div>{inc.resolution}</div></div>}
              </dl>
            ) : tab === "timeline" ? (
              arr(inc.actions).length === 0 ? <div className="sec-empty">No actions logged yet.</div> : (
                <div className="sec-timeline">
                  {arr(inc.actions).map((a) => (
                    <div className="sec-tl-item" key={a.id}>
                      <div className="d-flex justify-content-between">
                        <span className="fw-semibold text-capitalize">{a.action_type.replace("_", " ")}</span>
                        <span className="small text-muted">{fmtDateTime(a.action_at)}</span>
                      </div>
                      <div className="small">{a.description}</div>
                      {a.decision_note && <div className="small text-muted fst-italic">Note: {a.decision_note}</div>}
                      {a.performer && <div className="small text-muted">— {a.performer.firstName} {a.performer.lastName}</div>}
                    </div>
                  ))}
                </div>
              )
            ) : (
              <>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="sec-field-label">Status</label>
                    <select className="form-select form-select-sm" value={inc.status} onChange={(e) => update({ status: e.target.value })} disabled={busy}>
                      {STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="sec-field-label">Severity</label>
                    <select className="form-select form-select-sm" value={inc.severity} onChange={(e) => update({ severity: e.target.value })} disabled={busy}>
                      {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="sec-field-label">Assign to</label>
                    <select className="form-select form-select-sm" value={inc.assigned_to || ""} onChange={(e) => update({ assigned_to: e.target.value || null })} disabled={busy}>
                      <option value="">Unassigned</option>
                      {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                  </div>
                  {(inc.status === "resolved" || inc.status === "closed") && (
                    <div className="col-12">
                      <label className="sec-field-label">Resolution</label>
                      <textarea className="form-control form-control-sm" rows={2} defaultValue={inc.resolution || ""} onBlur={(e) => update({ resolution: e.target.value })} />
                    </div>
                  )}
                </div>

                <div className="sec-card sec-card-pad" style={{ background: "var(--sec-bg-soft)" }}>
                  <div className="small fw-semibold mb-2">Log an action</div>
                  <div className="row g-2">
                    <div className="col-12">
                      <select className="form-select form-select-sm" value={action.action_type} onChange={(e) => setAction({ ...action, action_type: e.target.value })}>
                        {["response", "escalation", "note"].map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-12"><textarea className="form-control form-control-sm" rows={2} placeholder="What was done…" value={action.description} onChange={(e) => setAction({ ...action, description: e.target.value })} /></div>
                    <div className="col-12"><input className="form-control form-control-sm" placeholder="Decision note (optional)" value={action.decision_note} onChange={(e) => setAction({ ...action, decision_note: e.target.value })} /></div>
                  </div>
                  <div className="text-end mt-2"><button className="btn btn-sm btn-primary" onClick={addAction} disabled={busy}>Add to timeline</button></div>
                </div>
              </>
            )}
        </div>
      </div>
    </>
  );
};

/* ----------------------------- Panel ------------------------------- */
const IncidentsPanel = ({ userRole, locations, staff, onChanged }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: "", severity: "", status: "", search: "" });
  const [drawerId, setDrawerId] = useState(null);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    type: "bandit_attack", severity: "medium", occurred_at: "", title: "", description: "",
    state: "", lga: "", hub: "", location_note: "", affected_persons: "", affected_persons_count: "", affected_assets: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    const params = { per_page: 50 };
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.get(`/security/incidents`, { params })
      .then((r) => setData(arr(r.data?.data ?? r.data)))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [filters]);
  useEffect(load, [load]);

  const lgasForState = (locations?.lgas || []).filter((l) => !form.state || String(l.state_id) === String(form.state));

  const submit = async () => {
    if (!form.title || !form.occurred_at) { setError("Title and occurrence date/time are required."); return; }
    setSaving(true); setError(null);
    try {
      await api.post(`/security/incidents`, {
        ...form,
        state: form.state || null, lga: form.lga || null, hub: form.hub || null,
        affected_persons_count: form.affected_persons_count === "" ? 0 : parseInt(form.affected_persons_count, 10),
      });
      setModal(false);
      setForm({ type: "bandit_attack", severity: "medium", occurred_at: "", title: "", description: "", state: "", lga: "", hub: "", location_note: "", affected_persons: "", affected_persons_count: "", affected_assets: "" });
      load(); onChanged?.();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to report incident.");
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="row g-2 mb-3">
        <div className="col-6 col-md-3">
          <label className="sec-field-label">Type</label>
          <select className="form-select" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="">All</option>{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-2">
          <label className="sec-field-label">Severity</label>
          <select className="form-select" value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })}>
            <option value="">All</option>{SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-2">
          <label className="sec-field-label">Status</label>
          <select className="form-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All</option>{STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <label className="sec-field-label">Search</label>
          <input className="form-control" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Title or ref…" />
        </div>
        <div className="col-12 col-md-2 d-flex align-items-end">
          <button className="btn btn-primary w-100" onClick={() => setModal(true)}><Icon icon="solar:danger-triangle-outline" width={16} className="me-1" />Report</button>
        </div>
      </div>

      <div className="sec-card">
        <div className="table-responsive">
          <table className="sec-table">
            <thead><tr><th>Ref</th><th>Title</th><th>Type</th><th>Severity</th><th>Occurred</th><th>Status</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6"><div className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary" /></div></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="6" className="sec-empty">No incidents reported.</td></tr>
              ) : data.map((i) => (
                <tr key={i.id} className="clickable" onClick={() => setDrawerId(i.id)}>
                  <td className="font-monospace small">{i.reference}</td>
                  <td className="fw-medium">{i.title}</td>
                  <td className="small">{typeLabel(i.type)}</td>
                  <td className="small"><Sev s={i.severity} /></td>
                  <td className="small text-muted">{fmtDateTime(i.occurred_at)}</td>
                  <td><Pill tone={statusTone[i.status]}>{i.status.replace("_", " ")}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {drawerId && <IncidentDrawer id={drawerId} userRole={userRole} staff={staff} onClose={() => setDrawerId(null)} onChanged={() => { load(); onChanged?.(); }} />}

      {modal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(16,24,40,.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
              <div className="modal-header"><h5 className="modal-title">Report security incident</h5><button className="btn-close" onClick={() => setModal(false)} disabled={saving} /></div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6"><label className="form-label">Title *</label><input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                  <div className="col-md-3">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Severity</label>
                    <select className="form-select" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>{SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                  </div>
                  <div className="col-md-4"><label className="form-label">Occurred at *</label><input type="datetime-local" className="form-control" value={form.occurred_at} onChange={(e) => setForm({ ...form, occurred_at: e.target.value })} /></div>
                  <div className="col-md-4">
                    <label className="form-label">State</label>
                    <select className="form-select" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value, lga: "", hub: "" })}>
                      <option value="">—</option>{(locations?.states || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Community (LGA)</label>
                    <select className="form-select" value={form.lga} onChange={(e) => setForm({ ...form, lga: e.target.value })}>
                      <option value="">—</option>{lgasForState.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Hub</label>
                    <select className="form-select" value={form.hub} onChange={(e) => setForm({ ...form, hub: e.target.value })}>
                      <option value="">—</option>{(locations?.hubs || []).filter((h) => !form.state || String(h.state_id) === String(form.state)).map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6"><label className="form-label">Location note</label><input className="form-control" value={form.location_note} onChange={(e) => setForm({ ...form, location_note: e.target.value })} /></div>
                  <div className="col-md-8"><label className="form-label">Affected persons</label><input className="form-control" value={form.affected_persons} onChange={(e) => setForm({ ...form, affected_persons: e.target.value })} placeholder="Names or description" /></div>
                  <div className="col-md-4"><label className="form-label"># Affected</label><input type="number" min="0" className="form-control" value={form.affected_persons_count} onChange={(e) => setForm({ ...form, affected_persons_count: e.target.value })} /></div>
                  <div className="col-12"><label className="form-label">Affected assets</label><input className="form-control" value={form.affected_assets} onChange={(e) => setForm({ ...form, affected_assets: e.target.value })} /></div>
                  <div className="col-12"><label className="form-label">Description</label><textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                </div>
                {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setModal(false)} disabled={saving}>Cancel</button>
                <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}Report incident</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IncidentsPanel;
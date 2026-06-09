"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const arr = (x) => (Array.isArray(x) ? x : []);
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : "—");

const CATEGORIES = ["harassment", "abuse", "intimidation", "discrimination", "other"];
const STATUSES = ["reported", "under_review", "support_provided", "referred", "resolved", "closed"];
const statusTone = { reported: "amber", under_review: "blue", support_provided: "purple", referred: "blue", resolved: "green", closed: "gray" };
const Pill = ({ tone = "gray", children }) => (
  <span className={`sec-pill sec-pill--${tone}`}><span className="dot" />{children}</span>
);

const Confidential = () => (
  <div className="sec-confidential">
    <Icon icon="solar:lock-keyhole-minimalistic-bold" className="ic" width={22} />
    <div>
      <div className="fw-semibold">Confidential — survivor-centred</div>
      <div className="small text-muted">Access is restricted to authorised safeguarding officers and every view is recorded in an audit trail. Handle in line with WIMA's safeguarding and donor protection standards.</div>
    </div>
  </div>
);

/* --------------------------- Case detail ----------------------------- */
const CaseDetail = ({ id, onClose, onChanged }) => {
  const [c, setC] = useState(null);
  const [tab, setTab] = useState("case");
  const [audit, setAudit] = useState([]);
  const [action, setAction] = useState({ action_type: "response", description: "", decision_note: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/safeguarding/cases/${id}`).then((r) => setC(r.data)).catch(() => setC(null));
  }, [id]);
  useEffect(load, [load]);

  useEffect(() => {
    if (tab === "audit") api.get(`/safeguarding/cases/${id}/audit`).then((r) => setAudit(arr(r.data))).catch(() => setAudit([]));
  }, [tab, id]);

  const update = async (patch) => {
    setBusy(true);
    try { await api.put(`/safeguarding/cases/${id}`, patch); load(); onChanged?.(); }
    finally { setBusy(false); }
  };

  const addAction = async () => {
    if (!action.description) return;
    setBusy(true);
    try {
      await api.post(`/safeguarding/cases/${id}/actions`, action);
      setAction({ action_type: "response", description: "", decision_note: "" });
      load();
    } finally { setBusy(false); }
  };

  return (
    <>
      <div className="sec-overlay" onClick={onClose} />
      <div className="sec-drawer">
        <div className="sec-drawer-head">
          <div>
            <div className="font-monospace small text-muted">{c?.reference}</div>
            <h5 className="mb-1 text-capitalize">{c?.category || "Loading…"}</h5>
            {c && <Pill tone={statusTone[c.status]}>{c.status.replace("_", " ")}</Pill>}
          </div>
          <button className="btn-close" onClick={onClose} />
        </div>

        <div className="sec-tabs px-3">
          {["case", "actions", "audit"].map((t) => (
            <button key={t} className={`sec-tab ${tab === t ? "is-active" : ""}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        <div className="sec-drawer-body">
          {!c ? <div className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary" /></div> :
            tab === "case" ? (
              <>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="sec-field-label">Status</label>
                    <select className="form-select form-select-sm" value={c.status} onChange={(e) => update({ status: e.target.value })} disabled={busy}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="sec-field-label">Severity</label>
                    <select className="form-select form-select-sm" value={c.severity} onChange={(e) => update({ severity: e.target.value })} disabled={busy}>
                      {["low", "medium", "high", "critical"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <dl className="row small mb-0">
                  {[
                    ["Occurred", fmtDateTime(c.occurred_at)],
                    ["Anonymous", c.is_anonymous ? "Yes" : "No"],
                    ["Survivor reference", c.survivor_ref],
                    ["Consent to share", c.consent_to_share ? "Given" : "Not given"],
                  ].map(([k, v]) => (
                    <div className="col-6 mb-3" key={k}>
                      <div className="text-muted" style={{ fontSize: ".7rem", textTransform: "uppercase" }}>{k}</div>
                      <div className="fw-medium">{v ?? "—"}</div>
                    </div>
                  ))}
                  <div className="col-12 mb-2"><div className="text-muted" style={{ fontSize: ".7rem", textTransform: "uppercase" }}>Description</div><div>{c.description || "—"}</div></div>
                  {c.immediate_needs && <div className="col-12 mb-2"><div className="text-muted" style={{ fontSize: ".7rem", textTransform: "uppercase" }}>Immediate needs</div><div>{c.immediate_needs}</div></div>}
                  {c.survivor_details && <div className="col-12"><div className="text-muted" style={{ fontSize: ".7rem", textTransform: "uppercase" }}>Survivor details (confidential)</div><div>{c.survivor_details}</div></div>}
                </dl>
              </>
            ) : tab === "actions" ? (
              <>
                {arr(c.actions).length === 0 ? <div className="sec-empty">No actions logged.</div> : (
                  <div className="sec-timeline mb-3">
                    {arr(c.actions).map((a) => (
                      <div className="sec-tl-item" key={a.id}>
                        <div className="d-flex justify-content-between"><span className="fw-semibold text-capitalize">{a.action_type.replace("_", " ")}</span><span className="small text-muted">{fmtDateTime(a.action_at)}</span></div>
                        <div className="small">{a.description}</div>
                        {a.decision_note && <div className="small text-muted fst-italic">Note: {a.decision_note}</div>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="sec-card sec-card-pad" style={{ background: "var(--sec-bg-soft)" }}>
                  <div className="small fw-semibold mb-2">Log action (response / escalation / referral)</div>
                  <select className="form-select form-select-sm mb-2" value={action.action_type} onChange={(e) => setAction({ ...action, action_type: e.target.value })}>
                    {["response", "escalation", "referral", "note", "resolution"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <textarea className="form-control form-control-sm mb-2" rows={2} placeholder="Action taken…" value={action.description} onChange={(e) => setAction({ ...action, description: e.target.value })} />
                  <input className="form-control form-control-sm mb-2" placeholder="Decision note (optional)" value={action.decision_note} onChange={(e) => setAction({ ...action, decision_note: e.target.value })} />
                  <div className="text-end"><button className="btn btn-sm btn-primary" onClick={addAction} disabled={busy}>Log action</button></div>
                </div>
              </>
            ) : (
              <>
                <div className="small text-muted mb-2">Every access to this case is recorded.</div>
                {audit.length === 0 ? <div className="sec-empty">No audit entries.</div> :
                  audit.map((a) => (
                    <div key={a.id} className="d-flex justify-content-between py-2 border-bottom small">
                      <div>
                        <span className="fw-medium text-capitalize">{a.action.replace("_", " ")}</span>
                        {a.user && <span className="text-muted"> — {a.user.firstName} {a.user.lastName}</span>}
                        {a.detail && <div className="text-muted">{a.detail}</div>}
                      </div>
                      <span className="text-muted">{fmtDateTime(a.created_at)}</span>
                    </div>
                  ))}
              </>
            )}
        </div>
      </div>
    </>
  );
};

/* --------------------------- Main panel ------------------------------ */
const SafeguardingPanel = ({ isOfficer }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", category: "" });
  const [detailId, setDetailId] = useState(null);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [intake, setIntake] = useState({ category: "harassment", severity: "medium", description: "", immediate_needs: "", is_anonymous: false, survivor_ref: "", consent_to_share: false });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const load = useCallback(() => {
    if (!isOfficer) { setLoading(false); return; }
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.get(`/safeguarding/cases`, { params })
      .then((r) => setCases(arr(r.data)))
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, [filters, isOfficer]);
  useEffect(load, [load]);

  const submitIntake = async () => {
    if (!intake.description) return;
    setSubmitting(true);
    try {
      const r = await api.post(`/safeguarding/cases`, intake);
      setSubmitted(r.data?.reference || "received");
      setIntake({ category: "harassment", severity: "medium", description: "", immediate_needs: "", is_anonymous: false, survivor_ref: "", consent_to_share: false });
      if (isOfficer) load();
    } finally { setSubmitting(false); }
  };

  return (
    <>
      <Confidential />

      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-outline-danger" onClick={() => { setSubmitted(null); setIntakeOpen(true); }}>
          <Icon icon="solar:document-add-outline" width={16} className="me-1" />Report a concern
        </button>
      </div>

      {!isOfficer ? (
        <div className="sec-card">
          <div className="sec-locked-state">
            <Icon icon="solar:lock-keyhole-minimalistic-outline" width={40} className="mb-2" />
            <div className="fw-semibold">Restricted area</div>
            <div className="small">Safeguarding case records are visible only to authorised safeguarding officers. You can still confidentially report a concern using the button above.</div>
          </div>
        </div>
      ) : (
        <>
          <div className="row g-2 mb-3">
            <div className="col-6 col-md-3">
              <label className="sec-field-label">Status</label>
              <select className="form-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="sec-field-label">Category</label>
              <select className="form-select" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="sec-card">
            <div className="table-responsive">
              <table className="sec-table">
                <thead><tr><th>Ref</th><th>Category</th><th>Severity</th><th>Reported</th><th>Status</th></tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5"><div className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary" /></div></td></tr>
                  ) : cases.length === 0 ? (
                    <tr><td colSpan="5" className="sec-empty">No cases.</td></tr>
                  ) : cases.map((c) => (
                    <tr key={c.id} className="clickable" onClick={() => setDetailId(c.id)}>
                      <td className="font-monospace small">{c.reference}{c.is_anonymous ? <span className="ms-1" title="Anonymous"><Icon icon="solar:incognito-outline" width={13} /></span> : null}</td>
                      <td className="text-capitalize">{c.category}</td>
                      <td className="small text-capitalize">{c.severity}</td>
                      <td className="small text-muted">{fmtDateTime(c.created_at)}</td>
                      <td><Pill tone={statusTone[c.status]}>{c.status.replace("_", " ")}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {detailId && <CaseDetail id={detailId} onClose={() => setDetailId(null)} onChanged={load} />}

      {/* Confidential intake — available to anyone */}
      {intakeOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(16,24,40,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
              <div className="modal-header">
                <h5 className="modal-title">Report a safeguarding concern</h5>
                <button className="btn-close" onClick={() => setIntakeOpen(false)} disabled={submitting} />
              </div>
              <div className="modal-body">
                {submitted ? (
                  <div className="text-center py-3">
                    <Icon icon="solar:check-circle-bold" className="text-success mb-2" width={40} />
                    <div className="fw-semibold">Report received confidentially</div>
                    <div className="small text-muted">Reference: <span className="font-monospace">{submitted}</span></div>
                    <div className="small text-muted mt-2">An authorised safeguarding officer will handle this. Keep your reference if you wish to follow up through an officer.</div>
                  </div>
                ) : (
                  <>
                    <div className="small text-muted mb-3">This report is confidential and only authorised safeguarding officers can read it. You may report anonymously.</div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Category</label>
                        <select className="form-select" value={intake.category} onChange={(e) => setIntake({ ...intake, category: e.target.value })}>
                          {CATEGORIES.map((c) => <option key={c} value={c} className="text-capitalize">{c}</option>)}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Severity</label>
                        <select className="form-select" value={intake.severity} onChange={(e) => setIntake({ ...intake, severity: e.target.value })}>
                          {["low", "medium", "high", "critical"].map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="col-12"><label className="form-label">What happened? *</label><textarea className="form-control" rows={4} value={intake.description} onChange={(e) => setIntake({ ...intake, description: e.target.value })} /></div>
                      <div className="col-12"><label className="form-label">Immediate needs / support requested</label><textarea className="form-control" rows={2} value={intake.immediate_needs} onChange={(e) => setIntake({ ...intake, immediate_needs: e.target.value })} /></div>
                      <div className="col-12">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="anon" checked={intake.is_anonymous} onChange={(e) => setIntake({ ...intake, is_anonymous: e.target.checked })} />
                          <label className="form-check-label" htmlFor="anon">Report anonymously (don't attach my identity)</label>
                        </div>
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="consent" checked={intake.consent_to_share} onChange={(e) => setIntake({ ...intake, consent_to_share: e.target.checked })} />
                          <label className="form-check-label" htmlFor="consent">I consent to this being shared with relevant support services</label>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                {submitted ? (
                  <button className="btn btn-primary" onClick={() => setIntakeOpen(false)}>Done</button>
                ) : (
                  <>
                    <button className="btn btn-light" onClick={() => setIntakeOpen(false)} disabled={submitting}>Cancel</button>
                    <button className="btn btn-danger" onClick={submitIntake} disabled={submitting}>{submitting ? <span className="spinner-border spinner-border-sm me-1" /> : null}Submit confidentially</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SafeguardingPanel;
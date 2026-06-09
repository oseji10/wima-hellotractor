"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const arr = (x) => (Array.isArray(x) ? x : []);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const statusTone = { draft: "gray", in_progress: "blue", completed: "green", acknowledged: "purple" };
const Pill = ({ tone = "gray", children }) => (
  <span className={`hr-pill hr-pill--${tone}`}><span className="dot" />{children}</span>
);

const emptyGoal = () => ({ title: "", description: "", indicator_id: "", target_value: "", actual_value: "", weight: 1, score: "", status: "in_progress" });

/* Weighted overall from goals with a score */
const weightedScore = (goals) => {
  const scored = goals.filter((g) => g.score !== "" && g.score != null);
  const tw = scored.reduce((s, g) => s + (parseFloat(g.weight) || 0), 0);
  if (tw <= 0) return null;
  return Math.round((scored.reduce((s, g) => s + (parseFloat(g.score) || 0) * (parseFloat(g.weight) || 0), 0) / tw) * 100) / 100;
};

const ReviewEditor = ({ review, staffList, indicators, hubs, onClose, onSaved }) => {
  const editing = !!review?.id;
  const [meta, setMeta] = useState({
    staff_id: review?.staff_id || "", period_label: review?.period_label || "",
    period_start: review?.period_start?.slice(0, 10) || "", period_end: review?.period_end?.slice(0, 10) || "",
    status: review?.status || "draft", summary: review?.summary || "",
    strengths: review?.strengths || "", improvements: review?.improvements || "",
  });
  const [goals, setGoals] = useState(
    arr(review?.goals).length ? review.goals.map((g) => ({
      title: g.title, description: g.description || "", indicator_id: g.indicator_id || "",
      target_value: g.target_value ?? "", actual_value: g.actual_value ?? "", weight: g.weight ?? 1,
      score: g.score ?? "", status: g.status || "in_progress",
    })) : [emptyGoal()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pulling, setPulling] = useState(null);

  const setGoal = (i, k, v) => setGoals((gs) => gs.map((g, idx) => (idx === i ? { ...g, [k]: v } : g)));
  const addGoal = () => setGoals((gs) => [...gs, emptyGoal()]);
  const delGoal = (i) => setGoals((gs) => (gs.length > 1 ? gs.filter((_, idx) => idx !== i) : gs));

  const staff = staffList.find((s) => String(s.id) === String(meta.staff_id));

  // Pull the live KPI attainment for a goal from the M&E dashboard, scoped to the staff's hub + review period
  const pullFromKpi = async (i) => {
    const goal = goals[i];
    if (!goal.indicator_id) return;
    setPulling(i);
    try {
      const params = {};
      if (staff?.profile?.hub) params.hub = staff.profile.hub;
      if (meta.period_start) params.from = meta.period_start;
      if (meta.period_end) params.to = meta.period_end;
      const r = await api.get(`/me/dashboard`, { params });
      const card = arr(r.data?.scorecard).find((c) => String(c.id) === String(goal.indicator_id));
      if (card) {
        setGoals((gs) => gs.map((g, idx) => idx === i ? {
          ...g,
          actual_value: card.value ?? g.actual_value,
          target_value: card.target ?? g.target_value,
          score: card.attainment != null ? Math.min(100, Math.round(card.attainment)) : g.score,
        } : g));
      }
    } finally { setPulling(null); }
  };

  const overall = weightedScore(goals);

  const save = async () => {
    if (!meta.staff_id) { setError("Select a staff member."); return; }
    if (goals.some((g) => !g.title)) { setError("Every goal needs a title."); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        ...meta,
        staff_id: meta.staff_id,
        period_start: meta.period_start || null, period_end: meta.period_end || null,
        goals: goals.map((g) => ({
          title: g.title, description: g.description || null,
          indicator_id: g.indicator_id || null,
          target_value: g.target_value === "" ? null : parseFloat(g.target_value),
          actual_value: g.actual_value === "" ? null : parseFloat(g.actual_value),
          weight: parseFloat(g.weight) || 1,
          score: g.score === "" ? null : parseFloat(g.score),
          status: g.status,
        })),
      };
      if (editing) await api.put(`/hr/reviews/${review.id}`, payload);
      else await api.post(`/hr/reviews`, payload);
      onSaved?.(); onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save review.");
    } finally { setSaving(false); }
  };

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(16,24,40,.5)" }}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
          <div className="modal-header">
            <h5 className="modal-title">{editing ? "Edit review" : "New performance review"}</h5>
            <div className="d-flex align-items-center gap-3">
              <div className="text-end"><div className="small text-muted">Weighted score</div><div className="hr-score-ring text-primary">{overall != null ? `${overall}%` : "—"}</div></div>
              <button className="btn-close" onClick={onClose} disabled={saving} />
            </div>
          </div>
          <div className="modal-body">
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label">Staff *</label>
                <select className="form-select" value={meta.staff_id} onChange={(e) => setMeta({ ...meta, staff_id: e.target.value })} disabled={editing}>
                  <option value="">Select…</option>
                  {staffList.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div className="col-md-3"><label className="form-label">Period label</label><input className="form-control" placeholder="Q2 2025" value={meta.period_label} onChange={(e) => setMeta({ ...meta, period_label: e.target.value })} /></div>
              <div className="col-md-2"><label className="form-label">From</label><input type="date" className="form-control" value={meta.period_start} onChange={(e) => setMeta({ ...meta, period_start: e.target.value })} /></div>
              <div className="col-md-2"><label className="form-label">To</label><input type="date" className="form-control" value={meta.period_end} onChange={(e) => setMeta({ ...meta, period_end: e.target.value })} /></div>
              <div className="col-md-1">
                <label className="form-label">Status</label>
                <select className="form-select" value={meta.status} onChange={(e) => setMeta({ ...meta, status: e.target.value })}>
                  {["draft", "in_progress", "completed", "acknowledged"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label mb-0">Goals & KPIs</label>
              <button className="btn btn-sm btn-light" onClick={addGoal}><Icon icon="solar:add-circle-outline" width={15} className="me-1" />Add goal</button>
            </div>

            {goals.map((g, i) => (
              <div className="hr-goal-row" key={i}>
                <div className="row g-2">
                  <div className="col-md-5"><label className="hr-field-label">Goal *</label><input className="form-control form-control-sm" value={g.title} onChange={(e) => setGoal(i, "title", e.target.value)} /></div>
                  <div className="col-md-4">
                    <label className="hr-field-label">Linked KPI</label>
                    <select className="form-select form-select-sm" value={g.indicator_id} onChange={(e) => setGoal(i, "indicator_id", e.target.value)}>
                      <option value="">None (qualitative)</option>
                      {indicators.map((ind) => <option key={ind.id} value={ind.id}>{ind.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-3 d-flex align-items-end">
                    {g.indicator_id ? (
                      <button className="btn btn-sm btn-outline-primary w-100" onClick={() => pullFromKpi(i)} disabled={pulling === i}>
                        {pulling === i ? <span className="spinner-border spinner-border-sm" /> : <><Icon icon="solar:refresh-outline" width={14} className="me-1" />Pull from KPI</>}
                      </button>
                    ) : <span className="small text-muted">Manual scoring</span>}
                  </div>
                  <div className="col-md-3"><label className="hr-field-label">Target</label><input type="number" step="any" className="form-control form-control-sm" value={g.target_value} onChange={(e) => setGoal(i, "target_value", e.target.value)} /></div>
                  <div className="col-md-3"><label className="hr-field-label">Actual</label><input type="number" step="any" className="form-control form-control-sm" value={g.actual_value} onChange={(e) => setGoal(i, "actual_value", e.target.value)} /></div>
                  <div className="col-md-2"><label className="hr-field-label">Weight</label><input type="number" step="any" min="0" className="form-control form-control-sm" value={g.weight} onChange={(e) => setGoal(i, "weight", e.target.value)} /></div>
                  <div className="col-md-2"><label className="hr-field-label">Score %</label><input type="number" step="any" min="0" max="100" className="form-control form-control-sm" value={g.score} onChange={(e) => setGoal(i, "score", e.target.value)} /></div>
                  <div className="col-md-2 d-flex align-items-end justify-content-end">
                    <button className="btn btn-sm btn-link text-danger p-0" onClick={() => delGoal(i)}><Icon icon="solar:trash-bin-trash-outline" width={16} /></button>
                  </div>
                </div>
              </div>
            ))}

            <div className="row g-3 mt-1">
              <div className="col-md-4"><label className="form-label">Strengths</label><textarea className="form-control" rows={2} value={meta.strengths} onChange={(e) => setMeta({ ...meta, strengths: e.target.value })} /></div>
              <div className="col-md-4"><label className="form-label">Areas to improve</label><textarea className="form-control" rows={2} value={meta.improvements} onChange={(e) => setMeta({ ...meta, improvements: e.target.value })} /></div>
              <div className="col-md-4"><label className="form-label">Summary</label><textarea className="form-control" rows={2} value={meta.summary} onChange={(e) => setMeta({ ...meta, summary: e.target.value })} /></div>
            </div>
            {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-light" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}{editing ? "Update review" : "Create review"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PerformancePanel = ({ userRole, hubs }) => {
  const canManage = userRole === "ADMIN" || userRole === "National Coordinator" || userRole === "State Coordinator";
  const [reviews, setReviews] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/hr/reviews`).then((r) => setReviews(arr(r.data))).catch(() => setReviews([])).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  useEffect(() => {
    api.get(`/hr/staff`, { params: { per_page: 200 } }).then((r) => setStaffList(arr(r.data?.data ?? r.data))).catch(() => setStaffList([]));
    api.get(`/me/indicators`).then((r) => setIndicators(arr(r.data))).catch(() => setIndicators([]));
  }, []);

  const openEdit = async (rev) => {
    const r = await api.get(`/hr/reviews/${rev.id}`);
    setEditor(r.data);
  };

  return (
    <>
      <div className="hr-panel-head">
        <h6 className="mb-0">Performance reviews <span className="small text-muted fw-normal">— goals can be linked to M&E KPIs</span></h6>
        {canManage && <button className="btn btn-sm btn-primary" onClick={() => setEditor({})}><Icon icon="solar:medal-ribbon-star-outline" width={16} className="me-1" />New review</button>}
      </div>

      <div className="hr-card">
        <div className="table-responsive">
          <table className="hr-table">
            <thead><tr><th>Staff</th><th>Period</th><th>Status</th><th className="hr-num">Score</th><th></th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5"><div className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary" /></div></td></tr>
              ) : reviews.length === 0 ? (
                <tr><td colSpan="5" className="hr-empty">No reviews yet.</td></tr>
              ) : reviews.map((r) => (
                <tr key={r.id} className="clickable" onClick={() => openEdit(r)}>
                  <td className="fw-medium">{r.staff ? `${r.staff.firstName} ${r.staff.lastName}` : "—"}</td>
                  <td className="small">{r.period_label || `${fmtDate(r.period_start)} → ${fmtDate(r.period_end)}`}</td>
                  <td><Pill tone={statusTone[r.status]}>{r.status.replace("_", " ")}</Pill></td>
                  <td className="hr-num fw-semibold">{r.overall_score != null ? `${r.overall_score}%` : "—"}</td>
                  <td className="hr-num"><Icon icon="solar:alt-arrow-right-outline" width={16} className="text-muted" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editor && (
        <ReviewEditor
          review={editor.id ? editor : null}
          staffList={staffList}
          indicators={indicators}
          hubs={hubs}
          onClose={() => setEditor(null)}
          onSaved={load}
        />
      )}
    </>
  );
};

export default PerformancePanel;
"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

/* ------------------------------- helpers ------------------------------- */
const naira = (v) =>
  v || v === 0
    ? `₦${parseFloat(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : "—";
const today = () => new Date().toISOString().slice(0, 10);
const arr = (x) => (Array.isArray(x) ? x : []);

/* The stakeholder columns, derived from the scheme — single source of labels */
const SHARE_COLS = [
  { key: "wima_combined", label: "WIMA (total)" },
  { key: "community_dev", label: "Community Dev" },
  { key: "state_coord", label: "State Coord" },
  { key: "cl", label: "CL" },
  { key: "subcl", label: "SubCL" },
  { key: "msp", label: "MSP" },
  { key: "msp_per_person", label: "MSP / person" },
];

/* ============================ Scheme editor ============================ */
/* Every figure in the module is driven by these variables. */
const SCHEME_FIELDS = [
  { key: "wima_pct", label: "WIMA %", group: "top" },
  { key: "state_pct", label: "State %", group: "top" },
  { key: "sb_wima_pct", label: "WIMA %", group: "state" },
  { key: "sb_community_dev_pct", label: "Community Dev %", group: "state" },
  { key: "sb_state_coord_pct", label: "State Coord %", group: "state" },
  { key: "sb_cl_pct", label: "CL %", group: "state" },
  { key: "sb_subcl_pct", label: "SubCL %", group: "state" },
  { key: "sb_msp_pct", label: "MSP %", group: "state" },
];



const SchemeEditor = ({ scheme, canEdit, onSaved }) => {
  const [form, setForm] = useState(scheme);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => setForm(scheme), [scheme]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const num = (v) => (v === "" || v == null ? 0 : parseFloat(v));

  const topSum = num(form.wima_pct) + num(form.state_pct);
  const stateSum =
    num(form.sb_wima_pct) + num(form.sb_community_dev_pct) + num(form.sb_state_coord_pct) +
    num(form.sb_cl_pct) + num(form.sb_subcl_pct) + num(form.sb_msp_pct);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        name: form.name || "Default Scheme",
        wima_pct: num(form.wima_pct), state_pct: num(form.state_pct),
        sb_wima_pct: num(form.sb_wima_pct), sb_community_dev_pct: num(form.sb_community_dev_pct),
        sb_state_coord_pct: num(form.sb_state_coord_pct), sb_cl_pct: num(form.sb_cl_pct),
        sb_subcl_pct: num(form.sb_subcl_pct), sb_msp_pct: num(form.sb_msp_pct),
        msp_groups: parseInt(form.msp_groups, 10) || 1,
        msp_per_group: parseInt(form.msp_per_group, 10) || 1,
        weekly_multiplier: num(form.weekly_multiplier),
        monthly_multiplier: num(form.monthly_multiplier),
      };
      const res = await api.put(`/finance/scheme`, payload);
      setMsg({ type: "ok", text: "Scheme saved." + (res.data?.warnings?.length ? " " + res.data.warnings.join(" ") : "") });
      onSaved?.(res.data.scheme);
    } catch (e) {
      setMsg({ type: "err", text: e.response?.data?.message || "Failed to save scheme." });
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ k, label }) => (
    <div className="fin-field">
      <label>{label}</label>
      <input
        type="number" step="0.001" min="0" className="form-control form-control-sm"
        value={form[k] ?? ""} disabled={!canEdit}
        onChange={(e) => set(k, e.target.value)}
      />
    </div>
  );

  return (
    <div className="fin-card fin-card-pad mb-4">
      <div className="fin-panel-head">
        <h6><Icon icon="solar:tuning-2-bold" className="me-2" style={{ verticalAlign: "-3px" }} width={18} />Sharing scheme (variables)</h6>
        {canEdit && (
          <button className="btn btn-sm btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="spinner-border spinner-border-sm me-1" /> : <Icon icon="solar:diskette-bold" width={15} className="me-1" />}
            Save scheme
          </button>
        )}
      </div>

      <div className="text-muted small mb-1 fw-semibold">Top-level split (of each line's gross)</div>
      <div className="fin-scheme-grid mb-1">
        {SCHEME_FIELDS.filter((f) => f.group === "top").map((f) => <Field key={f.key} k={f.key} label={f.label} />)}
      </div>
      <div className={`fin-sum-note ${Math.abs(topSum - 100) < 0.01 ? "fin-sum-ok" : "fin-sum-warn"}`}>
        Total: {topSum}% {Math.abs(topSum - 100) < 0.01 ? "✓" : "(should be 100%)"}
      </div>

      <hr />

      <div className="text-muted small mb-1 fw-semibold">Breakdown of the State portion</div>
      <div className="fin-scheme-grid mb-1">
        {SCHEME_FIELDS.filter((f) => f.group === "state").map((f) => <Field key={f.key} k={f.key} label={f.label} />)}
      </div>
      <div className={`fin-sum-note ${Math.abs(stateSum - 100) < 0.01 ? "fin-sum-ok" : "fin-sum-warn"}`}>
        Total: {stateSum}% {Math.abs(stateSum - 100) < 0.01 ? "✓" : "(should be 100%)"}
      </div>

      <hr />

      <div className="text-muted small mb-1 fw-semibold">MSP distribution & period multipliers</div>
      <div className="fin-scheme-grid">
        <Field k="msp_groups" label="MSP groups" />
        <Field k="msp_per_group" label="MSP per group" />
        <Field k="weekly_multiplier" label="Weekly ×" />
        <Field k="monthly_multiplier" label="Monthly ×" />
        <div className="fin-field">
          <label>MSP headcount</label>
          <input className="form-control form-control-sm" disabled
            value={(parseInt(form.msp_groups, 10) || 0) * (parseInt(form.msp_per_group, 10) || 0)} />
        </div>
      </div>

      {msg && (
        <div className={`fin-sum-note mt-2 ${msg.type === "ok" ? "fin-sum-ok" : "fin-sum-warn"}`}>{msg.text}</div>
      )}
    </div>
  );
};

/* ===================== Projection (per hub roll-up) ==================== */
const RollupCard = ({ title, data }) => (
  <div className="fin-card fin-card-pad">
    <div className="fw-bold mb-2">{title}</div>
    <div className="fin-share-grid">
      <div className="fin-share"><div className="v">{naira(data?.gross)}</div><div className="l">Gross</div></div>
      <div className="fin-share"><div className="v">{naira(data?.wima_combined)}</div><div className="l">WIMA</div></div>
      <div className="fin-share"><div className="v">{naira(data?.msp)}</div><div className="l">MSP pool</div></div>
      <div className="fin-share"><div className="v">{naira(data?.msp_per_person)}</div><div className="l">MSP / person</div></div>
    </div>
  </div>
);

/* ========================= Main revenue panel ========================= */
const RevenueSharingPanel = ({ userRole, hubs = [], scheme, onSchemeSaved }) => {
  const canManage = userRole === "ADMIN" || userRole === "National Coordinator";
  const [entries, setEntries] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hubFilter, setHubFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projection, setProjection] = useState(null);
  const [form, setForm] = useState({
    hub: "", service_id: "", service_name: "", unit_cost: "", target: "", quantity: "", entry_date: today(),
  });

  const loadEntries = useCallback(() => {
    setLoading(true);
    const params = {};
    if (hubFilter) params.hub = hubFilter;
    api.get(`/finance/revenue`, { params })
      .then((r) => setEntries(arr(r.data)))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [hubFilter]);

  useEffect(loadEntries, [loadEntries]);

  useEffect(() => {
    api.get(`/finance/services`).then((r) => setServices(arr(r.data))).catch(() => setServices([]));
  }, []);

  // Pull a per-hub projection when a single hub is selected
  useEffect(() => {
    if (!hubFilter) { setProjection(null); return; }
    api.get(`/finance/hubs/${hubFilter}/projection`)
      .then((r) => setProjection(r.data))
      .catch(() => setProjection(null));
  }, [hubFilter, entries]);

  const pickService = (id) => {
    const svc = services.find((s) => String(s.id) === String(id));
    setForm((f) => ({
      ...f, service_id: id,
      service_name: svc?.name || f.service_name,
      unit_cost: svc ? svc.default_unit_cost : f.unit_cost,
      target: svc ? svc.default_target : f.target,
    }));
  };

  const submit = async () => {
    if (!form.service_name || !form.entry_date) return;
    setSaving(true);
    try {
      await api.post(`/finance/revenue`, {
        hub: form.hub || null,
        service_id: form.service_id || null,
        service_name: form.service_name,
        unit_cost: parseFloat(form.unit_cost || 0),
        target: parseInt(form.target || 0, 10),
        quantity: parseInt(form.quantity || 0, 10),
        entry_date: form.entry_date,
      });
      setForm({ hub: form.hub, service_id: "", service_name: "", unit_cost: "", target: "", quantity: "", entry_date: today() });
      setShowForm(false);
      loadEntries();
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm("Remove this revenue entry?")) return;
    await api.delete(`/finance/revenue/${id}`);
    loadEntries();
  };

  return (
    <>
      {/* The variables */}
      <SchemeEditor scheme={scheme} canEdit={canManage} onSaved={onSchemeSaved} />

      {/* Revenue entries */}
      <div className="fin-card fin-card-pad mb-4">
        <div className="fin-panel-head">
          <h6><Icon icon="solar:dollar-minimalistic-bold" className="me-2" style={{ verticalAlign: "-3px" }} width={18} />Revenue tracking & sharing</h6>
          <div className="d-flex gap-2">
            <select className="form-select form-select-sm w-auto" value={hubFilter} onChange={(e) => setHubFilter(e.target.value)}>
              <option value="">All hubs</option>
              {hubs.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <button className={`btn btn-sm btn-${showForm ? "secondary" : "primary"}`} onClick={() => setShowForm((s) => !s)}>
              <Icon icon={showForm ? "solar:close-circle-outline" : "solar:add-circle-outline"} width={15} className="me-1" />
              {showForm ? "Cancel" : "Log revenue"}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="fin-card fin-card-pad mb-3" style={{ background: "var(--fin-bg-soft)" }}>
            <div className="row g-2">
              <div className="col-md-3">
                <label className="form-label small mb-1">Hub</label>
                <select className="form-select form-select-sm" value={form.hub} onChange={(e) => setForm({ ...form, hub: e.target.value })}>
                  <option value="">N/A</option>
                  {hubs.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small mb-1">Service</label>
                <select className="form-select form-select-sm" value={form.service_id} onChange={(e) => pickService(e.target.value)}>
                  <option value="">Custom…</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label small mb-1">Service name</label>
                <input className="form-control form-control-sm" value={form.service_name}
                  onChange={(e) => setForm({ ...form, service_name: e.target.value })} placeholder="e.g. Maize Threshing" />
              </div>
              <div className="col-md-3">
                <label className="form-label small mb-1">Unit cost (₦)</label>
                <input type="number" min="0" step="0.01" className="form-control form-control-sm" value={form.unit_cost}
                  onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} />
              </div>
              <div className="col-md-3">
                <label className="form-label small mb-1">Target</label>
                <input type="number" min="0" className="form-control form-control-sm" value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })} />
              </div>
              <div className="col-md-3">
                <label className="form-label small mb-1">Quantity</label>
                <input type="number" min="0" className="form-control form-control-sm" value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="col-md-3">
                <label className="form-label small mb-1">Date</label>
                <input type="date" className="form-control form-control-sm" value={form.entry_date}
                  onChange={(e) => setForm({ ...form, entry_date: e.target.value })} />
              </div>
            </div>
            <div className="d-flex justify-content-between align-items-center mt-2">
              <span className="small text-muted">
                Gross = {naira((parseFloat(form.unit_cost || 0)) * (parseInt(form.target || 0, 10)) * (parseInt(form.quantity || 0, 10)))}
              </span>
              <button className="btn btn-sm btn-primary" onClick={submit} disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm" /> : "Save entry"}
              </button>
            </div>
          </div>
        )}

        <div className="table-responsive">
          <table className="fin-table">
            <thead>
              <tr>
                <th>Date</th><th>Service</th><th className="fin-num">Unit</th><th className="fin-num">Tgt</th>
                <th className="fin-num">Qty</th><th className="fin-num">Gross</th>
                <th className="fin-num">WIMA</th><th className="fin-num">MSP</th>
                {canManage && <th></th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={canManage ? 9 : 8}><div className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary" /></div></td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={canManage ? 9 : 8} className="fin-empty">No revenue entries yet.</td></tr>
              ) : entries.map((e) => (
                <tr key={e.id}>
                  <td className="small text-muted">{ new Date(e.entry_date).toLocaleDateString()}</td>
                  <td className="fw-medium">{e.service_name}</td>
                  <td className="fin-num">{naira(e.unit_cost)}</td>
                  <td className="fin-num">{e.target}</td>
                  <td className="fin-num">{e.quantity}</td>
                  <td className="fin-num fw-semibold">{naira(e.gross_total)}</td>
                  <td className="fin-num">{naira(e.shares?.wima_combined)}</td>
                  <td className="fin-num">{naira(e.shares?.msp)}</td>
                  {canManage && (
                    <td className="fin-num">
                      <button className="btn btn-sm btn-link text-danger p-0" onClick={() => remove(e.id)}>
                        <Icon icon="solar:trash-bin-trash-outline" width={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-hub projection (daily / weekly / monthly) */}
      {projection && (
        <div className="mb-2">
          <div className="fin-panel-head">
            <h6 className="mb-0">
              <Icon icon="solar:chart-2-bold" className="me-2" style={{ verticalAlign: "-3px" }} width={18} />
              {projection.hub?.lgas?.lgaName || "Hub"} projection
            </h6>
          </div>
          <div className="row g-3">
            <div className="col-md-4"><RollupCard title="Daily" data={projection.rollup?.daily} /></div>
            <div className="col-md-4"><RollupCard title="Weekly" data={projection.rollup?.weekly} /></div>
            <div className="col-md-4"><RollupCard title="Monthly" data={projection.rollup?.monthly} /></div>
          </div>
        </div>
      )}
    </>
  );
};

export default RevenueSharingPanel;
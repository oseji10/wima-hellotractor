"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

/* ----------------------------- small helpers ----------------------------- */

const Pill = ({ tone = "gray", children }) => (
  <span className={`am-pill am-pill--${tone}`}>
    <span className="dot" />
    {children}
  </span>
);

const statusTone = (s) => {
  const v = (s || "").toLowerCase();
  if (["active", "compliant", "resolved", "closed", "returned", "completed"].includes(v)) return "green";
  if (["inactive", "retired", "na"].includes(v)) return "gray";
  if (["under maintenance", "due", "due_soon", "in_transit", "acknowledged", "in_progress", "paused"].includes(v)) return "amber";
  if (["overdue", "expired", "open", "critical", "breakdown", "high"].includes(v)) return "red";
  return "blue";
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—");
const naira = (v) => (v || v === 0 ? `₦${parseFloat(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—");
const titleCase = (s) => (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const SUB_TABS = [
  { key: "overview", label: "Overview", icon: "solar:widget-2-outline" },
  { key: "lifecycle", label: "Lifecycle", icon: "solar:history-outline" },
  { key: "movements", label: "Movements", icon: "solar:routing-2-outline" },
  { key: "utilization", label: "Utilization", icon: "solar:chart-2-outline" },
  { key: "maintenance", label: "Maintenance", icon: "solar:calendar-outline" },
  { key: "incidents", label: "Incidents", icon: "solar:danger-triangle-outline" },
  { key: "compliance", label: "Compliance", icon: "solar:shield-check-outline" },
];

/* ============================== main drawer ============================== */

const AssetDetailDrawer = ({ equipment, userRole, lgas = [], owners = [], onClose, onAssetChanged }) => {
  const [tab, setTab] = useState("overview");
  const canEdit = userRole === "ADMIN" || userRole === "National Coordinator";
  const canLog = canEdit || userRole === "State Coordinator" || userRole === "Community Lead";
  const eqId = equipment?.equipmentId;

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="am-drawer-overlay" onClick={onClose} />
      <aside className="am-drawer" role="dialog" aria-modal="true">
        <div className="am-drawer-head">
          <div>
            <h5>{equipment?.equipmentName || "Asset"}</h5>
            <div className="am-sub">
              {equipment?.serialNumber || "No serial"} · {equipment?.category?.categoryName || "Uncategorised"}
            </div>
            <div className="mt-2 d-flex gap-2 flex-wrap">
              <Pill tone={statusTone(equipment?.status)}>{equipment?.status || "Unknown"}</Pill>
              <Pill tone="blue">{equipment?.hub?.lgas?.lgaName || "No hub"}</Pill>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close" />
        </div>

        <div className="am-drawer-tabs">
          {SUB_TABS.map((t) => (
            <button
              key={t.key}
              className={`am-tab ${tab === t.key ? "is-active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              <Icon icon={t.icon} className="me-1" width={15} style={{ verticalAlign: "-2px" }} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="am-drawer-body">
          {tab === "overview" && <OverviewPanel eqId={eqId} equipment={equipment} />}
          {tab === "lifecycle" && <LifecyclePanel eqId={eqId} canLog={canLog} />}
          {tab === "movements" && <MovementsPanel eqId={eqId} canLog={canLog} lgas={lgas} onAssetChanged={onAssetChanged} />}
          {tab === "utilization" && <UtilizationPanel eqId={eqId} canLog={canLog} />}
          {tab === "maintenance" && <MaintenancePanel eqId={eqId} canLog={canLog} owners={owners} />}
          {tab === "incidents" && <IncidentsPanel eqId={eqId} canLog={canLog} owners={owners} onAssetChanged={onAssetChanged} />}
          {tab === "compliance" && <CompliancePanel eqId={eqId} canLog={canLog} />}
        </div>
      </aside>
    </>
  );
};

/* ------------------------------ Overview -------------------------------- */

const OverviewPanel = ({ eqId, equipment }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get(`/equipment/${eqId}/overview`)
      .then((r) => alive && setData(r.data))
      .catch(() => alive && setData(null))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [eqId]);

  if (loading) return <Spinner />;

  const upt = data?.uptime_30d_pct;
  const util = data?.utilization_30d_pct;

  return (
    <>
      <div className="am-stat-grid">
        <div className="am-stat">
          <div className="v">{upt != null ? `${upt}%` : "—"}</div>
          <div className="l">Uptime (30d)</div>
          {upt != null && <Bar pct={upt} className="mt-2" />}
        </div>
        <div className="am-stat">
          <div className="v">{util != null ? `${util}%` : "—"}</div>
          <div className="l">Utilization (30d)</div>
          {util != null && <Bar pct={util} className="mt-2" />}
        </div>
        <div className="am-stat">
          <div className="v">{data?.open_incidents ?? 0}</div>
          <div className="l">Open incidents</div>
        </div>
        <div className="am-stat">
          <div className="v" style={{ fontSize: "1rem" }}>
            {data?.next_maintenance ? fmtDate(data.next_maintenance.next_due_at) : "None"}
          </div>
          <div className="l">Next maintenance</div>
        </div>
      </div>

      <h6 className="fw-bold mb-2">Asset details</h6>
      <KV label="Asset value" value={naira(equipment?.value)} />
      <KV label="Owner" value={equipment?.owner?.name || equipment?.owner?.firstName || "—"} />
      <KV label="Hub" value={equipment?.hub?.lgas?.lgaName || "—"} />
      <KV label="Current location" value={data?.current_location || equipment?.exact_location || "—"} />
      <KV label="Category" value={equipment?.category?.categoryName || "—"} last />
    </>
  );
};

const KV = ({ label, value, last }) => (
  <div className="d-flex justify-content-between py-2" style={{ borderBottom: last ? "none" : "1px solid var(--am-border)" }}>
    <span style={{ color: "var(--am-text-muted)", fontSize: ".85rem" }}>{label}</span>
    <span className="fw-medium" style={{ fontSize: ".88rem", textAlign: "right" }}>{value}</span>
  </div>
);

/* ------------------------------ Lifecycle ------------------------------- */

const LifecyclePanel = ({ eqId, canLog }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ event_type: "deployed", title: "", description: "", event_date: today() });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/equipment/${eqId}/lifecycle`)
      .then((r) => setItems(arr(r.data)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [eqId]);
  useEffect(load, [load]);

  const submit = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      await api.post(`/equipment/${eqId}/lifecycle`, form);
      setForm({ event_type: "deployed", title: "", description: "", event_date: today() });
      setShowForm(false);
      load();
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="am-panel-head">
        <h6>Lifecycle timeline</h6>
        {canLog && <AddBtn open={showForm} onClick={() => setShowForm((s) => !s)} />}
      </div>

      {showForm && (
        <div className="am-inline-form">
          <div className="row g-2">
            <div className="col-6">
              <select className="form-select form-select-sm" value={form.event_type}
                onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
                {["acquired", "deployed", "transferred", "maintenance", "repaired", "idle", "reactivated", "retired", "disposed"]
                  .map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
              </select>
            </div>
            <div className="col-6">
              <input type="date" className="form-control form-control-sm" value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
            </div>
            <div className="col-12">
              <input className="form-control form-control-sm" placeholder="Title" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="col-12">
              <textarea className="form-control form-control-sm" rows={2} placeholder="Notes (optional)" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <SaveRow saving={saving} onSave={submit} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? <Spinner /> : items.length === 0 ? <Empty text="No lifecycle events recorded yet." /> : (
        <div className="am-timeline">
          {items.map((ev) => (
            <div className="am-tl-item" key={ev.id}>
              <div className="am-tl-date">{fmtDate(ev.event_date)} · <Pill tone={statusTone(ev.event_type)}>{titleCase(ev.event_type)}</Pill></div>
              <div className="am-tl-title">{ev.title}</div>
              {ev.description && <div className="am-tl-desc">{ev.description}</div>}
              {ev.performer?.name && <div className="am-tl-date">by {ev.performer.name}</div>}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

/* ------------------------------ Movements ------------------------------- */

const MovementsPanel = ({ eqId, canLog, lgas, onAssetChanged }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    movement_type: "deployment", to_hub: "", to_location: "", reason: "",
    movement_date: today(), expected_return_date: "", status: "in_transit",
  });

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/equipment/${eqId}/movements`)
      .then((r) => setItems(arr(r.data)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [eqId]);
  useEffect(load, [load]);

  const submit = async () => {
    setSaving(true);
    try {
      const payload = { ...form, to_hub: form.to_hub || null, expected_return_date: form.expected_return_date || null };
      await api.post(`/equipment/${eqId}/movements`, payload);
      setForm({ movement_type: "deployment", to_hub: "", to_location: "", reason: "", movement_date: today(), expected_return_date: "", status: "in_transit" });
      setShowForm(false);
      load();
      onAssetChanged?.();
    } finally { setSaving(false); }
  };

  const receive = async (id) => {
    await api.put(`/movements/${id}/receive`, { status: "completed" });
    load();
    onAssetChanged?.();
  };

  return (
    <>
      <div className="am-panel-head">
        <h6>Deployment & movement log</h6>
        {canLog && <AddBtn open={showForm} onClick={() => setShowForm((s) => !s)} />}
      </div>

      {showForm && (
        <div className="am-inline-form">
          <div className="row g-2">
            <div className="col-6">
              <label className="form-label small mb-1">Type</label>
              <select className="form-select form-select-sm" value={form.movement_type}
                onChange={(e) => setForm({ ...form, movement_type: e.target.value })}>
                {["deployment", "transfer", "return", "loan", "maintenance_dispatch"].map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small mb-1">Destination hub</label>
              <select className="form-select form-select-sm" value={form.to_hub}
                onChange={(e) => setForm({ ...form, to_hub: e.target.value })}>
                <option value="">Same / N/A</option>
                {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="col-12">
              <label className="form-label small mb-1">Destination location</label>
              <input className="form-control form-control-sm" value={form.to_location}
                onChange={(e) => setForm({ ...form, to_location: e.target.value })} placeholder="e.g. Field site, Block C" />
            </div>
            <div className="col-6">
              <label className="form-label small mb-1">Date</label>
              <input type="date" className="form-control form-control-sm" value={form.movement_date}
                onChange={(e) => setForm({ ...form, movement_date: e.target.value })} />
            </div>
            <div className="col-6">
              <label className="form-label small mb-1">Expected return</label>
              <input type="date" className="form-control form-control-sm" value={form.expected_return_date}
                onChange={(e) => setForm({ ...form, expected_return_date: e.target.value })} />
            </div>
            <div className="col-12">
              <input className="form-control form-control-sm" placeholder="Reason / notes" value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
          </div>
          <SaveRow saving={saving} onSave={submit} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? <Spinner /> : items.length === 0 ? <Empty text="No movements logged." /> : items.map((m) => (
        <div className="am-list-row" key={m.id}>
          <div className="am-lr-top">
            <span className="am-lr-title">{titleCase(m.movement_type)}{m.to_location ? ` → ${m.to_location}` : ""}</span>
            <Pill tone={statusTone(m.status)}>{titleCase(m.status)}</Pill>
          </div>
          <div className="am-lr-meta">
            {fmtDate(m.movement_date)}
            {m.toHub?.lgas?.lgaName ? ` · to ${m.toHub.lgas.lgaName}` : ""}
            {m.expected_return_date ? ` · return ${fmtDate(m.expected_return_date)}` : ""}
          </div>
          {m.reason && <div className="am-lr-meta mt-1">{m.reason}</div>}
          {canLog && ["in_transit", "deployed"].includes(m.status) && (
            <button className="btn btn-sm btn-outline-success mt-2" onClick={() => receive(m.id)}>
              <Icon icon="solar:check-circle-outline" width={14} className="me-1" /> Mark received
            </button>
          )}
        </div>
      ))}
    </>
  );
};

/* ----------------------------- Utilization ------------------------------ */

const UtilizationPanel = ({ eqId, canLog }) => {
  const [data, setData] = useState({ logs: [], summary: null });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ log_date: today(), hours_used: "", hours_available: "", downtime_hours: "0", notes: "" });

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/equipment/${eqId}/utilization`)
      .then((r) => setData({ logs: arr(r.data?.logs), summary: r.data?.summary || null }))
      .catch(() => setData({ logs: [], summary: null }))
      .finally(() => setLoading(false));
  }, [eqId]);
  useEffect(load, [load]);

  const submit = async () => {
    if (!form.hours_available) return;
    setSaving(true);
    try {
      await api.post(`/equipment/${eqId}/utilization`, {
        ...form,
        hours_used: parseFloat(form.hours_used || 0),
        hours_available: parseFloat(form.hours_available || 0),
        downtime_hours: parseFloat(form.downtime_hours || 0),
      });
      setForm({ log_date: today(), hours_used: "", hours_available: "", downtime_hours: "0", notes: "" });
      setShowForm(false);
      load();
    } finally { setSaving(false); }
  };

  const s = data.summary;

  return (
    <>
      <div className="am-panel-head">
        <h6>Utilization & uptime</h6>
        {canLog && <AddBtn open={showForm} onClick={() => setShowForm((x) => !x)} label="Log day" />}
      </div>

      {s && (
        <div className="am-stat-grid">
          <div className="am-stat">
            <div className="v">{s.uptime_pct}%</div>
            <div className="l">Uptime</div>
            <Bar pct={s.uptime_pct} className="mt-2" />
          </div>
          <div className="am-stat">
            <div className="v">{s.utilization_pct}%</div>
            <div className="l">Utilization</div>
            <Bar pct={s.utilization_pct} className="mt-2" />
          </div>
          <div className="am-stat">
            <div className="v">{s.total_hours_used}</div>
            <div className="l">Hours used</div>
          </div>
          <div className="am-stat">
            <div className="v">{s.total_downtime_hours}</div>
            <div className="l">Downtime hrs</div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="am-inline-form">
          <div className="row g-2">
            <div className="col-6">
              <label className="form-label small mb-1">Date</label>
              <input type="date" className="form-control form-control-sm" value={form.log_date}
                onChange={(e) => setForm({ ...form, log_date: e.target.value })} />
            </div>
            <div className="col-6">
              <label className="form-label small mb-1">Hours available</label>
              <input type="number" min="0" step="0.5" className="form-control form-control-sm" value={form.hours_available}
                onChange={(e) => setForm({ ...form, hours_available: e.target.value })} />
            </div>
            <div className="col-6">
              <label className="form-label small mb-1">Hours used</label>
              <input type="number" min="0" step="0.5" className="form-control form-control-sm" value={form.hours_used}
                onChange={(e) => setForm({ ...form, hours_used: e.target.value })} />
            </div>
            <div className="col-6">
              <label className="form-label small mb-1">Downtime hours</label>
              <input type="number" min="0" step="0.5" className="form-control form-control-sm" value={form.downtime_hours}
                onChange={(e) => setForm({ ...form, downtime_hours: e.target.value })} />
            </div>
            <div className="col-12">
              <input className="form-control form-control-sm" placeholder="Notes (optional)" value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <SaveRow saving={saving} onSave={submit} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? <Spinner /> : data.logs.length === 0 ? <Empty text="No utilization logs yet." /> : (
        <>
          <h6 className="fw-bold mt-2 mb-2" style={{ fontSize: ".82rem", color: "var(--am-text-muted)" }}>RECENT LOGS</h6>
          {[...data.logs].reverse().slice(0, 12).map((l) => (
            <div className="am-list-row" key={l.id}>
              <div className="am-lr-top">
                <span className="am-lr-title">{fmtDate(l.log_date)}</span>
                <Pill tone={l.uptime_pct >= 90 ? "green" : l.uptime_pct >= 70 ? "amber" : "red"}>{l.uptime_pct}% uptime</Pill>
              </div>
              <div className="am-lr-meta">
                {l.hours_used}h used / {l.hours_available}h available · {l.downtime_hours}h down
                {l.output_units ? ` · ${l.output_units} ${l.output_unit_label || ""}` : ""}
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );
};

/* ----------------------------- Maintenance ------------------------------ */

const MaintenancePanel = ({ eqId, canLog, owners }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", maintenance_type: "preventive", frequency_type: "months",
    frequency_value: 3, next_due_at: today(), assigned_to: "", instructions: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/equipment/${eqId}/schedules`)
      .then((r) => setItems(arr(r.data)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [eqId]);
  useEffect(load, [load]);

  const submit = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      await api.post(`/equipment/${eqId}/schedules`, {
        ...form, assigned_to: form.assigned_to || null, frequency_value: parseInt(form.frequency_value, 10),
      });
      setForm({ title: "", maintenance_type: "preventive", frequency_type: "months", frequency_value: 3, next_due_at: today(), assigned_to: "", instructions: "" });
      setShowForm(false);
      load();
    } finally { setSaving(false); }
  };

  const markServiced = async (id) => {
    await api.post(`/schedules/${id}/serviced`, { serviced_at: today() });
    load();
  };
  const remove = async (id) => {
    if (!confirm("Remove this maintenance schedule?")) return;
    await api.delete(`/schedules/${id}`);
    load();
  };

  const dueTone = (st) => (st === "overdue" ? "red" : st === "due_soon" ? "amber" : "green");
  const dueLabel = (s) => {
    if (s.due_status === "overdue") return `${Math.abs(s.days_until_due)}d overdue`;
    if (s.due_status === "due_soon") return `Due in ${s.days_until_due}d`;
    return "On track";
  };

  return (
    <>
      <div className="am-panel-head">
        <h6>Preventive maintenance</h6>
        {canLog && <AddBtn open={showForm} onClick={() => setShowForm((x) => !x)} label="Add schedule" />}
      </div>

      {showForm && (
        <div className="am-inline-form">
          <div className="row g-2">
            <div className="col-12">
              <input className="form-control form-control-sm" placeholder="Schedule title (e.g. Engine oil change)" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="col-6">
              <label className="form-label small mb-1">Type</label>
              <select className="form-select form-select-sm" value={form.maintenance_type}
                onChange={(e) => setForm({ ...form, maintenance_type: e.target.value })}>
                {["preventive", "inspection", "calibration", "service", "safety_check"].map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small mb-1">Next due</label>
              <input type="date" className="form-control form-control-sm" value={form.next_due_at}
                onChange={(e) => setForm({ ...form, next_due_at: e.target.value })} />
            </div>
            <div className="col-6">
              <label className="form-label small mb-1">Every</label>
              <input type="number" min="1" className="form-control form-control-sm" value={form.frequency_value}
                onChange={(e) => setForm({ ...form, frequency_value: e.target.value })} />
            </div>
            <div className="col-6">
              <label className="form-label small mb-1">Interval</label>
              <select className="form-select form-select-sm" value={form.frequency_type}
                onChange={(e) => setForm({ ...form, frequency_type: e.target.value })}>
                {["days", "weeks", "months", "usage_hours"].map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
              </select>
            </div>
            <div className="col-12">
              <select className="form-select form-select-sm" value={form.assigned_to}
                onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>
                <option value="">Assign to… (optional)</option>
                {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div className="col-12">
              <textarea className="form-control form-control-sm" rows={2} placeholder="Instructions (optional)" value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
            </div>
          </div>
          <SaveRow saving={saving} onSave={submit} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? <Spinner /> : items.length === 0 ? <Empty text="No maintenance schedules." /> : items.map((s) => (
        <div className="am-list-row" key={s.id}>
          <div className="am-lr-top">
            <span className="am-lr-title">{s.title}</span>
            <Pill tone={dueTone(s.due_status)}>{dueLabel(s)}</Pill>
          </div>
          <div className="am-lr-meta">
            {titleCase(s.maintenance_type)} · every {s.frequency_value} {titleCase(s.frequency_type)} · next {fmtDate(s.next_due_at)}
            {s.assignee?.name ? ` · ${s.assignee.name}` : ""}
          </div>
          {s.instructions && <div className="am-lr-meta mt-1">{s.instructions}</div>}
          {canLog && (
            <div className="d-flex gap-2 mt-2">
              <button className="btn btn-sm btn-outline-success" onClick={() => markServiced(s.id)}>
                <Icon icon="solar:check-circle-outline" width={14} className="me-1" /> Mark serviced
              </button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => remove(s.id)}>
                <Icon icon="solar:trash-bin-trash-outline" width={14} />
              </button>
            </div>
          )}
        </div>
      ))}
    </>
  );
};

/* ------------------------------ Incidents ------------------------------- */

const IncidentsPanel = ({ eqId, canLog, owners, onAssetChanged }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "breakdown", severity: "medium", title: "", description: "", downtime_hours: "" });

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/asset-management/incidents`, { params: { equipmentId: eqId, per_page: 50 } })
      .then((r) => setItems(arr(r.data?.data ?? r.data)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [eqId]);
  useEffect(load, [load]);

  const submit = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      await api.post(`/equipment/${eqId}/incidents`, { ...form, downtime_hours: form.downtime_hours ? parseFloat(form.downtime_hours) : null });
      setForm({ type: "breakdown", severity: "medium", title: "", description: "", downtime_hours: "" });
      setShowForm(false);
      load();
      onAssetChanged?.();
    } finally { setSaving(false); }
  };

  const advance = async (inc, status) => {
    await api.put(`/incidents/${inc.id}`, { status });
    load();
    onAssetChanged?.();
  };

  return (
    <>
      <div className="am-panel-head">
        <h6>Breakdowns & incidents</h6>
        {canLog && <AddBtn open={showForm} onClick={() => setShowForm((x) => !x)} label="Report" tone="danger" />}
      </div>

      {showForm && (
        <div className="am-inline-form">
          <div className="row g-2">
            <div className="col-6">
              <label className="form-label small mb-1">Type</label>
              <select className="form-select form-select-sm" value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {["breakdown", "incident", "fault", "accident"].map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small mb-1">Severity</label>
              <select className="form-select form-select-sm" value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                {["low", "medium", "high", "critical"].map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
              </select>
            </div>
            <div className="col-12">
              <input className="form-control form-control-sm" placeholder="Summary" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="col-12">
              <textarea className="form-control form-control-sm" rows={2} placeholder="What happened?" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="col-6">
              <label className="form-label small mb-1">Downtime hrs</label>
              <input type="number" min="0" step="0.5" className="form-control form-control-sm" value={form.downtime_hours}
                onChange={(e) => setForm({ ...form, downtime_hours: e.target.value })} />
            </div>
          </div>
          <SaveRow saving={saving} onSave={submit} onCancel={() => setShowForm(false)} saveLabel="Submit report" />
        </div>
      )}

      {loading ? <Spinner /> : items.length === 0 ? <Empty text="No incidents reported." /> : items.map((i) => (
        <div className="am-list-row" key={i.id}>
          <div className="am-lr-top">
            <span className="am-lr-title">{i.title}</span>
            <Pill tone={statusTone(i.severity)}>{titleCase(i.severity)}</Pill>
          </div>
          <div className="am-lr-meta">
            <span className="font-monospace">{i.reference}</span> · {titleCase(i.type)} · {fmtDate(i.reported_at)}
            {i.reporter?.name ? ` · ${i.reporter.name}` : ""}
          </div>
          {i.description && <div className="am-lr-meta mt-1">{i.description}</div>}
          <div className="d-flex align-items-center gap-2 mt-2">
            <Pill tone={statusTone(i.status)}>{titleCase(i.status)}</Pill>
            {canLog && i.is_open && (
              <div className="ms-auto d-flex gap-2">
                {i.status === "open" && <button className="btn btn-sm btn-outline-secondary" onClick={() => advance(i, "in_progress")}>Start</button>}
                <button className="btn btn-sm btn-outline-success" onClick={() => advance(i, "resolved")}>Resolve</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
};

/* ------------------------------ Compliance ------------------------------ */

const CompliancePanel = ({ eqId, canLog }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ log_type: "inspection", title: "", issued_at: today(), expires_at: "", authority: "", document_ref: "", notes: "" });

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/equipment/${eqId}/compliance`)
      .then((r) => setItems(arr(r.data)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [eqId]);
  useEffect(load, [load]);

  const submit = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      await api.post(`/equipment/${eqId}/compliance`, { ...form, expires_at: form.expires_at || null });
      setForm({ log_type: "inspection", title: "", issued_at: today(), expires_at: "", authority: "", document_ref: "", notes: "" });
      setShowForm(false);
      load();
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="am-panel-head">
        <h6>Service alerts & compliance</h6>
        {canLog && <AddBtn open={showForm} onClick={() => setShowForm((x) => !x)} label="Add record" />}
      </div>

      {showForm && (
        <div className="am-inline-form">
          <div className="row g-2">
            <div className="col-6">
              <label className="form-label small mb-1">Type</label>
              <select className="form-select form-select-sm" value={form.log_type}
                onChange={(e) => setForm({ ...form, log_type: e.target.value })}>
                {["inspection", "certification", "safety_check", "warranty", "insurance", "calibration", "service"].map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small mb-1">Authority</label>
              <input className="form-control form-control-sm" value={form.authority}
                onChange={(e) => setForm({ ...form, authority: e.target.value })} placeholder="Issuing body" />
            </div>
            <div className="col-12">
              <input className="form-control form-control-sm" placeholder="Title (e.g. Annual safety certificate)" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="col-6">
              <label className="form-label small mb-1">Issued</label>
              <input type="date" className="form-control form-control-sm" value={form.issued_at}
                onChange={(e) => setForm({ ...form, issued_at: e.target.value })} />
            </div>
            <div className="col-6">
              <label className="form-label small mb-1">Expires</label>
              <input type="date" className="form-control form-control-sm" value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
            </div>
            <div className="col-12">
              <input className="form-control form-control-sm" placeholder="Document / certificate ref" value={form.document_ref}
                onChange={(e) => setForm({ ...form, document_ref: e.target.value })} />
            </div>
          </div>
          <SaveRow saving={saving} onSave={submit} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? <Spinner /> : items.length === 0 ? <Empty text="No compliance records." /> : items.map((c) => (
        <div className="am-list-row" key={c.id}>
          <div className="am-lr-top">
            <span className="am-lr-title">{c.title}</span>
            <Pill tone={statusTone(c.computed_status)}>{titleCase(c.computed_status)}</Pill>
          </div>
          <div className="am-lr-meta">
            {titleCase(c.log_type)}{c.authority ? ` · ${c.authority}` : ""}
            {c.expires_at ? ` · expires ${fmtDate(c.expires_at)}` : ""}
            {c.document_ref ? ` · ${c.document_ref}` : ""}
          </div>
        </div>
      ))}
    </>
  );
};

/* ------------------------------- shared UI ------------------------------ */

const Spinner = () => (
  <div className="text-center py-4">
    <div className="spinner-border spinner-border-sm text-primary" role="status" />
  </div>
);
const Empty = ({ text }) => <div className="am-empty">{text}</div>;
const Bar = ({ pct, className = "" }) => {
  const tone = pct >= 90 ? "green" : pct >= 70 ? "amber" : "red";
  return <div className={`am-bar ${tone} ${className}`}><span style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} /></div>;
};
const AddBtn = ({ open, onClick, label = "Add", tone = "primary" }) => (
  <button className={`btn btn-sm btn-${open ? "secondary" : tone}`} onClick={onClick}>
    <Icon icon={open ? "solar:close-circle-outline" : "solar:add-circle-outline"} width={15} className="me-1" />
    {open ? "Cancel" : label}
  </button>
);
const SaveRow = ({ saving, onSave, onCancel, saveLabel = "Save", cancelLabel = "Cancel" }) => (
  <div className="d-flex justify-content-end gap-2 mt-3">
    <button className="btn btn-sm btn-light" onClick={onCancel} disabled={saving}>{cancelLabel}</button>
    <button className="btn btn-sm btn-primary" onClick={onSave} disabled={saving}>
      {saving ? <span className="spinner-border spinner-border-sm" role="status" /> : saveLabel}
    </button>
  </div>
);

/* ------------------------------- utils ---------------------------------- */
function today() { return new Date().toISOString().slice(0, 10); }
function arr(x) { return Array.isArray(x) ? x : []; }

export default AssetDetailDrawer;
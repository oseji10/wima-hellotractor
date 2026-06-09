"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const naira = (v) =>
  v || v === 0 ? `₦${parseFloat(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "₦0";

const KPI = ({ icon, accent, accentSoft, value, label }) => (
  <div className="am-kpi" style={{ "--am-accent": accent, "--am-accent-soft": accentSoft }}>
    <span className="am-kpi-icon"><Icon icon={icon} width={20} /></span>
    <div className="am-kpi-value">{value}</div>
    <div className="am-kpi-label">{label}</div>
  </div>
);

const alertVisual = (a) => {
  if (a.severity === "expired" || a.severity === "overdue" || a.severity === "critical")
    return { tone: "am-pill--red", bg: "#fef3f2", color: "#b42318", icon: "solar:danger-triangle-bold" };
  if (a.severity === "open")
    return { tone: "am-pill--purple", bg: "#f4f3ff", color: "#5925dc", icon: "solar:wrench-bold" };
  return { tone: "am-pill--amber", bg: "#fffaeb", color: "#b54708", icon: "solar:clock-circle-bold" };
};
const catIcon = { maintenance: "solar:calendar-bold", compliance: "solar:shield-warning-bold", incident: "solar:bolt-bold" };

const AssetDashboard = ({ onOpenAsset, refreshKey }) => {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      api.get(`/asset-management/dashboard`).then((r) => r.data).catch(() => null),
      api.get(`/asset-management/alerts`).then((r) => (Array.isArray(r.data) ? r.data : [])).catch(() => []),
    ]).then(([s, a]) => {
      if (!alive) return;
      setStats(s);
      setAlerts(a);
    }).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  const visibleAlerts = showAllAlerts ? alerts : alerts.slice(0, 4);

  return (
    <div className="mb-4">
      <div className="am-kpis">
        <KPI icon="solar:box-bold" accent="#4f46e5" accentSoft="#eef2ff"
          value={stats?.total_assets ?? 0} label="Total assets" />
        <KPI icon="solar:wallet-money-bold" accent="#0ea5e9" accentSoft="#e0f2fe"
          value={naira(stats?.total_value)} label="Fleet value" />
        <KPI icon="solar:graph-up-bold" accent="#12b76a" accentSoft="#ecfdf3"
          value={`${stats?.fleet_uptime_pct ?? 0}%`} label="Uptime (30d)" />
        <KPI icon="solar:speedometer-middle-bold" accent="#7c3aed" accentSoft="#f4f3ff"
          value={`${stats?.fleet_utilization_pct ?? 0}%`} label="Utilization (30d)" />
        <KPI icon="solar:calendar-mark-bold" accent="#f79009" accentSoft="#fffaeb"
          value={(stats?.overdue_maintenance ?? 0) + (stats?.due_soon_maintenance ?? 0)} label="Maintenance due" />
        <KPI icon="solar:danger-triangle-bold" accent="#f04438" accentSoft="#fef3f2"
          value={stats?.open_incidents ?? 0} label="Open incidents" />
      </div>

      {alerts.length > 0 && (
        <div className="am-table-card" style={{ padding: 16 }}>
          <div className="am-panel-head">
            <h6 className="mb-0 fw-bold">
              <Icon icon="solar:bell-bing-bold" className="me-2 text-warning" width={18} style={{ verticalAlign: "-3px" }} />
              Service alerts <span className="text-muted fw-normal">({alerts.length})</span>
            </h6>
            {alerts.length > 4 && (
              <button className="btn btn-sm btn-link p-0" onClick={() => setShowAllAlerts((s) => !s)}>
                {showAllAlerts ? "Show less" : "Show all"}
              </button>
            )}
          </div>
          {visibleAlerts.map((a, idx) => {
            const v = alertVisual(a);
            return (
              <div className="am-alert-row" key={idx} role="button" onClick={() => onOpenAsset?.(a.equipmentId)}>
                <span className="am-alert-icon" style={{ background: v.bg, color: v.color }}>
                  <Icon icon={catIcon[a.category] || v.icon} width={18} />
                </span>
                <div className="am-alert-body">
                  <div className="am-alert-title">{a.asset} — {a.title}</div>
                  <div className="am-alert-meta">{a.detail}{a.date ? ` · ${a.date}` : ""}</div>
                </div>
                <span className={`am-pill ${v.tone}`}>
                  <span className="dot" />{a.severity.replace("_", " ")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssetDashboard;
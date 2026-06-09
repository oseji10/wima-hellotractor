"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";
import "./security.css";
import IncidentsPanel from "./IncidentsPanel";
import VendorsPanel from "./VendorsPanel";
import RiskMapPanel from "./RiskMapPanel";
import SafeguardingPanel from "./SafeguardingPanel";

const KPI = ({ icon, accent, accentSoft, value, label, sub }) => (
  <div className="sec-kpi" style={{ "--sec-accent": accent, "--sec-accent-soft": accentSoft }}>
    <span className="sec-kpi-icon"><Icon icon={icon} width={20} /></span>
    <div className="sec-kpi-value">{value}</div>
    <div className="sec-kpi-label">{label}</div>
    {sub && <div className="sec-kpi-sub">{sub}</div>}
  </div>
);

const SecurityManagement = () => {
  const [userRole, setUserRole] = useState(null);
  const [locations, setLocations] = useState({ states: [], lgas: [], hubs: [] });
  const [staff, setStaff] = useState([]);
  const [dash, setDash] = useState(null);
  const [access, setAccess] = useState({ is_officer: false });
  const [tab, setTab] = useState("riskmap");

  useEffect(() => {
    api.get(`${process.env.NEXT_PUBLIC_API_URL}/user`).then((r) => setUserRole(r.data.role)).catch(() => setUserRole(null));
    api.get(`/security/locations`).then((r) => setLocations(r.data)).catch(() => setLocations({ states: [], lgas: [], hubs: [] }));
    api.get(`/safeguarding/access`).then((r) => setAccess(r.data)).catch(() => setAccess({ is_officer: false }));
    // staff list for assignment dropdowns (from the HR/users-backed endpoint)
    api.get(`/hr/staff`, { params: { per_page: 200 } }).then((r) => setStaff(Array.isArray(r.data?.data) ? r.data.data : [])).catch(() => setStaff([]));
  }, []);

  const loadDash = useCallback(() => {
    api.get(`/security/dashboard`).then((r) => setDash(r.data)).catch(() => setDash(null));
  }, []);
  useEffect(loadDash, [loadDash]);

  const TABS = [
    { key: "riskmap", label: "Risk Map", icon: "solar:map-point-wave-outline" },
    { key: "incidents", label: "Incidents", icon: "solar:danger-triangle-outline" },
    { key: "vendors", label: "Vendor Register", icon: "solar:shield-user-outline" },
    { key: "safeguarding", label: "Safeguarding", icon: "solar:lock-keyhole-minimalistic-outline", locked: true },
  ];

  return (
    <div className="sec-scope col-lg-12">
      <div className="sec-page-head">
        <div>
          <h4>Security & Incident Management</h4>
          <div className="sec-sub">Incident reporting, response & escalation tracking, the security vendor register, and location-based risk mapping.</div>
        </div>
      </div>

      <div className="sec-kpis">
        <KPI icon="solar:danger-triangle-bold" accent="#f04438" accentSoft="#fef3f2" value={dash?.open ?? "—"} label="Open incidents" sub={`${dash?.critical_open ?? 0} critical`} />
        <KPI icon="solar:magnifer-bold" accent="#175cd3" accentSoft="#eff8ff" value={dash?.under_investigation ?? "—"} label="Under investigation" />
        <KPI icon="solar:fire-bold" accent="#b54708" accentSoft="#fffaeb" value={dash?.high_risk_zones ?? "—"} label="High-risk zones" />
        <KPI icon="solar:shield-check-bold" accent="#12b76a" accentSoft="#ecfdf3" value={dash?.vendors ?? "—"} label="Active vendors" />
      </div>

      <div className="sec-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`sec-tab ${t.locked ? "sec-tab--locked" : ""} ${tab === t.key ? "is-active" : ""}`} onClick={() => setTab(t.key)}>
            <Icon icon={t.icon} width={16} style={{ verticalAlign: "-3px" }} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "riskmap" && <RiskMapPanel />}
      {tab === "incidents" && <IncidentsPanel userRole={userRole} locations={locations} staff={staff} onChanged={loadDash} />}
      {tab === "vendors" && <VendorsPanel userRole={userRole} locations={locations} />}
      {tab === "safeguarding" && <SafeguardingPanel isOfficer={!!access.is_officer} />}
    </div>
  );
};

export default SecurityManagement;
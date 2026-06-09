"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";
import "./hr.css";
import StaffDirectoryPanel from "./StaffDirectoryPanel";
import PerformancePanel from "./PerformancePanel";
import LeavePanel from "./LeavePanel";
import CompliancePanel from "./CompliancePanel";

const KPI = ({ icon, accent, accentSoft, value, label, sub }) => (
  <div className="hr-kpi" style={{ "--hr-accent": accent, "--hr-accent-soft": accentSoft }}>
    <span className="hr-kpi-icon"><Icon icon={icon} width={20} /></span>
    <div className="hr-kpi-value">{value}</div>
    <div className="hr-kpi-label">{label}</div>
    {sub && <div className="hr-kpi-sub">{sub}</div>}
  </div>
);

const TABS = [
  { key: "staff", label: "Staff Directory", icon: "solar:users-group-rounded-outline" },
  { key: "performance", label: "Performance", icon: "solar:medal-ribbon-star-outline" },
  { key: "leave", label: "Leave", icon: "solar:calendar-outline" },
  { key: "compliance", label: "Compliance", icon: "solar:shield-check-outline" },
];

const HumanResources = () => {
  const [userRole, setUserRole] = useState(null);
  const [hubs, setHubs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [dash, setDash] = useState(null);
  const [tab, setTab] = useState("staff");

  useEffect(() => {
    api.get(`${process.env.NEXT_PUBLIC_API_URL}/user`).then((r) => setUserRole(r.data.role)).catch(() => setUserRole(null));
  }, []);

  useEffect(() => {
    api.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs/all-active-hubs`).then((r) => {
      const list = Array.isArray(r.data) ? r.data : [];
      const uniq = {};
      list.forEach((h) => { if (h.lga_info?.lgaId) uniq[h.lga_info.lgaId] = { id: h.hubId ?? h.lga_info.lgaId, name: h.lga_info.lgaName }; });
      setHubs(Object.values(uniq));
    }).catch(() => setHubs([]));
  }, []);

  useEffect(() => {
    api.get(`${process.env.NEXT_PUBLIC_API_URL}/projects`, { params: { per_page: 200 } }).then((r) => {
      const list = Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : []);
      setProjects(list.map((p) => ({ id: p.projectId, name: p.projectName })));
    }).catch(() => setProjects([]));
  }, []);

  const loadDash = useCallback(() => {
    api.get(`/hr/dashboard`).then((r) => setDash(r.data)).catch(() => setDash(null));
  }, []);
  useEffect(loadDash, [loadDash]);

  return (
    <div className="hr-scope col-lg-12">
      <div className="hr-page-head">
        <div>
          <h4>Human Resources</h4>
          <div className="hr-sub">Staff records and roles, KPI-linked performance, and leave & compliance management.</div>
        </div>
      </div>

      <div className="hr-kpis">
        <KPI icon="solar:users-group-rounded-bold" accent="#4f46e5" accentSoft="#eef2ff" value={dash?.headcount ?? "—"} label="Headcount" sub={`${dash?.active ?? 0} active · ${dash?.on_leave ?? 0} on leave`} />
        <KPI icon="solar:calendar-bold" accent="#f79009" accentSoft="#fffaeb" value={dash?.pending_leave ?? "—"} label="Leave to approve" sub={`${dash?.upcoming_leave ?? 0} upcoming`} />
        <KPI icon="solar:shield-warning-bold" accent="#f04438" accentSoft="#fef3f2" value={dash?.expiring_compliance ?? "—"} label="Compliance alerts" sub="expiring or expired" />
        <KPI icon="solar:medal-ribbon-star-bold" accent="#12b76a" accentSoft="#ecfdf3" value={dash?.open_reviews ?? "—"} label="Reviews in progress" />
      </div>

      <div className="hr-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`hr-tab ${tab === t.key ? "is-active" : ""}`} onClick={() => setTab(t.key)}>
            <Icon icon={t.icon} width={16} className="me-1" style={{ verticalAlign: "-3px" }} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "staff" && <StaffDirectoryPanel userRole={userRole} hubs={hubs} projects={projects} onChanged={loadDash} />}
      {tab === "performance" && <PerformancePanel userRole={userRole} hubs={hubs} />}
      {tab === "leave" && <LeavePanel userRole={userRole} />}
      {tab === "compliance" && <CompliancePanel userRole={userRole} />}
    </div>
  );
};

export default HumanResources;
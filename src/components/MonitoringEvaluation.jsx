"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";
import "./me.css";
import ExecutiveDashboard from "./ExecutiveDashboard";
import KpiConfigPanel from "./KpiConfigPanel";
import DataCollectionPanel from "./DataCollectionPanel";
import DonorDashboard from "./DonorDashboard";

const TABS = [
  { key: "exec", label: "Executive Dashboard", icon: "solar:chart-square-outline" },
  { key: "config", label: "KPI Configuration", icon: "solar:tuning-square-outline" },
  { key: "collect", label: "Data Collection", icon: "solar:clipboard-list-outline" },
  { key: "donor", label: "Donor Dashboard", icon: "solar:hand-stars-outline" },
];

const MonitoringEvaluation = () => {
  const [userRole, setUserRole] = useState(null);
  const [hubs, setHubs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tab, setTab] = useState("exec");

  useEffect(() => {
    api.get(`${process.env.NEXT_PUBLIC_API_URL}/user`)
      .then((r) => setUserRole(r.data.role))
      .catch(() => setUserRole(null));
  }, []);

  // Projects = the "programs" KPIs are grouped under
  useEffect(() => {
    api.get(`${process.env.NEXT_PUBLIC_API_URL}/projects`, { params: { per_page: 200 } })
      .then((r) => {
        const list = Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : []);
        setProjects(list.map((p) => ({ id: p.projectId, name: p.projectName, status: p.status })));
      })
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    api.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs/all-active-hubs`).then((r) => {
      const list = Array.isArray(r.data) ? r.data : [];
      const uniq = {};
      list.forEach((h) => {
        if (h.lga_info?.lgaId) uniq[h.lga_info.lgaId] = { id: h.hubId ?? h.lga_info.lgaId, name: h.lga_info.lgaName };
      });
      setHubs(Object.values(uniq));
    }).catch(() => setHubs([]));
  }, []);

  return (
    <div className="me-scope col-lg-12">
      <div className="me-page-head">
        <div>
          <h4>Monitoring & Evaluation</h4>
          <div className="me-sub">Configure KPIs, collect field data, compute results automatically, and report to leadership and donors.</div>
        </div>
      </div>

      <div className="me-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`me-tab ${tab === t.key ? "is-active" : ""}`} onClick={() => setTab(t.key)}>
            <Icon icon={t.icon} width={16} className="me-1" style={{ verticalAlign: "-3px" }} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "exec" && <ExecutiveDashboard hubs={hubs} projects={projects} />}
      {tab === "config" && <KpiConfigPanel userRole={userRole} projects={projects} />}
      {tab === "collect" && <DataCollectionPanel userRole={userRole} hubs={hubs} />}
      {tab === "donor" && <DonorDashboard />}
    </div>
  );
};

export default MonitoringEvaluation;
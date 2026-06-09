"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";
import "./finance.css";
import RevenueSharingPanel from "./RevenueSharingPanel";
import InvoicingPanel from "./InvoicingPanel";
import FundingPanel from "./FundingPanel";

const naira0 = (v) =>
  v || v === 0 ? `₦${parseFloat(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "₦0";

const KPI = ({ icon, accent, accentSoft, value, label, sub }) => (
  <div className="fin-kpi" style={{ "--fin-accent": accent, "--fin-accent-soft": accentSoft }}>
    <span className="fin-kpi-icon"><Icon icon={icon} width={20} /></span>
    <div className="fin-kpi-value">{value}</div>
    <div className="fin-kpi-label">{label}</div>
    {sub && <div className="fin-kpi-sub">{sub}</div>}
  </div>
);

const TABS = [
  { key: "revenue", label: "Revenue & Sharing", icon: "solar:dollar-minimalistic-outline" },
  { key: "invoicing", label: "Invoicing & Receivables", icon: "solar:bill-list-outline" },
  { key: "funding", label: "Donors, Grants & Investments", icon: "solar:hand-money-outline" },
];

const FinanceTreasury = () => {
  const [userRole, setUserRole] = useState(null);
  const [hubs, setHubs] = useState([]);
  const [scheme, setScheme] = useState(null);
  const [dash, setDash] = useState(null);
  const [tab, setTab] = useState("revenue");
  const [loading, setLoading] = useState(true);

  // user
  useEffect(() => {
    api.get(`${process.env.NEXT_PUBLIC_API_URL}/user`)
      .then((r) => setUserRole(r.data.role))
      .catch(() => setUserRole(null));
  }, []);

  // hubs (for selectors) — reuse the active-hubs endpoint, flatten to {id,name}
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

  const loadDashboard = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get(`/finance/dashboard`).then((r) => r.data).catch(() => null),
      api.get(`/finance/scheme`).then((r) => r.data).catch(() => null),
    ]).then(([d, s]) => {
      setDash(d);
      setScheme(s);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(loadDashboard, [loadDashboard]);

  const rev = dash?.revenue;
  const rec = dash?.receivables;
  const fund = dash?.funding;

  return (
    <div className="fin-scope col-lg-12">
      <div className="fin-page-head">
        <div>
          <h4>Finance & Treasury</h4>
          <div className="fin-sub">Revenue tracking & sharing, automated invoicing & receivables, and donor / grant / investment tracking.</div>
        </div>
      </div>

      {/* KPI dashboard */}
      {loading ? (
        <div className="text-center py-4"><span className="spinner-border text-primary" /></div>
      ) : (
        <div className="fin-kpis">
          <KPI icon="solar:dollar-minimalistic-bold" accent="#12b76a" accentSoft="#ecfdf3"
            value={naira0(rev?.gross_monthly)} label="Projected monthly revenue"
            sub={`${rev?.entry_count ?? 0} entries this month`} />
          <KPI icon="solar:users-group-rounded-bold" accent="#4f46e5" accentSoft="#eef2ff"
            value={naira0(rev?.stakeholders?.msp)} label="MSP share (monthly pool)" />
          <KPI icon="solar:file-text-bold" accent="#f79009" accentSoft="#fffaeb"
            value={naira0(rec?.outstanding)} label="Outstanding receivables"
            sub={`${rec?.open_count ?? 0} open · ${naira0(rec?.overdue)} overdue`} />
          <KPI icon="solar:hand-money-bold" accent="#0ea5e9" accentSoft="#e0f2fe"
            value={naira0(fund?.received)} label="Funding received"
            sub={`of ${naira0(fund?.committed)} committed`} />
        </div>
      )}

      {/* Tabs */}
      <div className="fin-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`fin-tab ${tab === t.key ? "is-active" : ""}`} onClick={() => setTab(t.key)}>
            <Icon icon={t.icon} width={16} className="me-1" style={{ verticalAlign: "-3px" }} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "revenue" && scheme && (
        <RevenueSharingPanel
          userRole={userRole}
          hubs={hubs}
          scheme={scheme}
          onSchemeSaved={(s) => { setScheme(s); loadDashboard(); }}
        />
      )}
      {tab === "invoicing" && <InvoicingPanel userRole={userRole} hubs={hubs} />}
      {tab === "funding" && <FundingPanel userRole={userRole} />}
    </div>
  );
};

export default FinanceTreasury;
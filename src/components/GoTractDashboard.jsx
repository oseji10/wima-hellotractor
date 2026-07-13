"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

/* ------------------------------------------------------------------ */
/*  GoTRACT — Central Dashboard                                        */
/*  One hub: live programme numbers + entry points to every module.    */
/*  Update ROUTES below to match your actual page paths.               */
/* ------------------------------------------------------------------ */

const ROUTES = {
  applications: "/dashboard/gotract-applications",
  badges:       "/dashboard/badge-generator",
  accreditation:"/dashboard/accreditation",
  scanner:      "/dashboard/gotract-scanner",
  oversight:    "/dashboard/gotract-applications",
};

const num = (v) => Number(v || 0);

const StatTile = ({ icon, label, value, sub, color }) => (
  <div className="col-6 col-lg-3">
    <div className="card h-100 shadow-none border">
      <div className="card-body d-flex align-items-center gap-3">
        <span
          className={`bg-${color}-light text-${color}-600 rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0`}
          style={{ width: 48, height: 48 }}
        >
          <Icon icon={icon} width={22} />
        </span>
        <div className="min-w-0">
          <h6 className="mb-0 fw-bold">{value}</h6>
          <span className="text-secondary text-sm d-block">{label}</span>
          {sub && <span className="text-secondary" style={{ fontSize: "0.7rem" }}>{sub}</span>}
        </div>
      </div>
    </div>
  </div>
);

const ModuleCard = ({ href, icon, title, description, cta, color = "success", stat }) => (
  <div className="col-12 col-md-6 col-xl-3">
    <div className="card h-100 shadow-none border">
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span
            className={`bg-${color}-light text-${color}-600 rounded-3 d-inline-flex align-items-center justify-content-center`}
            style={{ width: 48, height: 48 }}
          >
            <Icon icon={icon} width={26} />
          </span>
          {stat != null && (
            <span className={`badge bg-${color} rounded-pill px-3 py-2`}>{stat}</span>
          )}
        </div>

        <h6 className="fw-bold mb-1">{title}</h6>
        <p className="text-secondary text-sm flex-grow-1 mb-3">{description}</p>

        <Link href={href} className={`btn btn-${color} w-100 d-inline-flex align-items-center justify-content-center gap-1`}>
          {cta} <Icon icon="mdi:arrow-right" />
        </Link>
      </div>
    </div>
  </div>
);

const GoTractDashboard = () => {
  const [appStats, setAppStats] = useState(null);
  const [accStats, setAccStats] = useState(null);
  const [badgeStats, setBadgeStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [a, b, c] = await Promise.allSettled([
      api.get("/gotract/stats"),
      api.get("/gotract/accreditation/stats"),
      api.get("/gotract/badges/stats"),
    ]);
    if (a.status === "fulfilled") setAppStats(a.value.data?.data || null);
    if (b.status === "fulfilled") setAccStats(b.value.data?.data || null);
    if (c.status === "fulfilled") setBadgeStats(c.value.data?.data || null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const byStatus = appStats?.byStatus || {};
  const accredited = num(accStats?.accredited);
  const eligible = num(accStats?.eligible);
  const awaiting = num(accStats?.pending);
  const accreditedPct = eligible ? Math.round((accredited / eligible) * 100) : 0;

  return (
    <div className="col-lg-12">
      {/* Header */}
      <div
        className="rounded-3 p-4 mb-4 text-white d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3"
        style={{ background: "linear-gradient(135deg,#16a34a 0%,#15803d 60%,#166534 100%)" }}
      >
        <div>
          <span
            className="badge rounded-pill px-3 py-2 mb-2 d-inline-flex align-items-center gap-1"
            style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)" }}
          >
            <Icon icon="mdi:tractor" /> GoTRACT Programme
          </span>
          <h4 className="text-white fw-bold mb-1">Programme Control Centre</h4>
          <p className="mb-0" style={{ color: "rgba(255,255,255,0.85)" }}>
            Gombe Tractor Access &amp; Capacity Transformation Programme
          </p>
        </div>
        <button className="btn btn-light d-inline-flex align-items-center gap-1" onClick={load} disabled={loading}>
          {loading
            ? <><span className="spinner-border spinner-border-sm"></span>Refreshing…</>
            : <><Icon icon="mdi:refresh" /> Refresh</>}
        </button>
      </div>

      {/* Live numbers */}
      <div className="row g-3 mb-4">
        <StatTile
          icon="mdi:file-document-multiple-outline"
          label="Applications"
          value={num(appStats?.total).toLocaleString()}
          sub={`${num(byStatus.pending) + num(byStatus.screening)} pending review`}
          color="primary"
        />
        <StatTile
          icon="mdi:badge-account-horizontal-outline"
          label="Accredited"
          value={accredited.toLocaleString()}
          sub={`${accreditedPct}% of ${eligible.toLocaleString()} registered`}
          color="success"
        />
        <StatTile
          icon="mdi:clock-outline"
          label="Awaiting accreditation"
          value={awaiting.toLocaleString()}
          sub="participants still to check in"
          color="warning"
        />
        <StatTile
          icon="mdi:qrcode"
          label="Blank badges left"
          value={num(badgeStats?.unassigned).toLocaleString()}
          sub={`${num(badgeStats?.assigned).toLocaleString()} assigned of ${num(badgeStats?.total).toLocaleString()} printed`}
          color="info"
        />
      </div>

      {/* Check-in progress */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0 fw-bold">Check-in progress</h6>
            <span className="text-secondary text-sm">
              {accredited.toLocaleString()} of {eligible.toLocaleString()} accredited ({accreditedPct}%)
            </span>
          </div>
          <div className="progress" style={{ height: 12 }}>
            <div
              className={`progress-bar ${accreditedPct >= 100 ? "bg-success" : "bg-primary"}`}
              role="progressbar"
              style={{ width: `${Math.min(100, accreditedPct)}%` }}
              aria-valuenow={accreditedPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          {num(badgeStats?.unassigned) < 20 && num(badgeStats?.total) > 0 && (
            <div className="alert alert-warning mt-3 mb-0 d-flex align-items-center gap-2">
              <Icon icon="mdi:alert-outline" width={20} />
              <span>
                Only <strong>{num(badgeStats?.unassigned)}</strong> blank badges left — print more before the desk runs out.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modules */}
      <h6 className="fw-bold mb-3">Modules</h6>
      <div className="row g-3 mb-4">
        <ModuleCard
          href={ROUTES.applications}
          icon="mdi:file-document-multiple-outline"
          title="Applications"
          description="Review, score and screen applicants. Filter by LGA and status, update decisions, and export."
          cta="Open applications"
          color="primary"
          stat={num(appStats?.total).toLocaleString()}
        />
        <ModuleCard
          href={ROUTES.badges}
          icon="mdi:qrcode-plus"
          title="Badge Generator"
          description="Pre-print blank QR badges before participants arrive, and reprint any batch."
          cta="Print badges"
          color="info"
          stat={`${num(badgeStats?.unassigned)} blank`}
        />
        <ModuleCard
          href={ROUTES.accreditation}
          icon="mdi:badge-account-outline"
          title="Accreditation Desk"
          description="Search an arriving participant, accredit them, and bind their pre-printed badge serial."
          cta="Open desk"
          color="success"
          stat={`${awaiting} waiting`}
        />
        <ModuleCard
          href={ROUTES.scanner}
          icon="mdi:qrcode-scan"
          title="Meal & Attendance Scanner"
          description="Scan badges at the hall and dining area. Duplicate meal claims are blocked automatically."
          cta="Start scanning"
          color="warning"
        />
      </div>

      {/* Quick actions */}
      <div className="card">
        <div className="card-body d-flex flex-wrap align-items-center gap-2">
          <span className="fw-bold me-2">Quick actions:</span>
          <Link href={ROUTES.accreditation} className="btn btn-sm btn-success d-inline-flex align-items-center gap-1">
            <Icon icon="mdi:account-plus-outline" /> Accredit a participant
          </Link>
          <Link href={ROUTES.scanner} className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1">
            <Icon icon="mdi:food" /> Scan for meals
          </Link>
          <Link href={ROUTES.badges} className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1">
            <Icon icon="mdi:printer" /> Print more badges
          </Link>
          <Link href={ROUTES.oversight} className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1">
            <Icon icon="mdi:eye-outline" /> Government oversight view
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GoTractDashboard;
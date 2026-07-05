"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

/* ------------------------------------------------------------------ */
/*  GoTRACT — Government Oversight (public, read-only)                  */
/*  Accessed via a shareable link carrying a secret ?token=…           */
/*  Shows AGGREGATE data only. No applicant PII, no actions.           */
/*    GET /gotract/oversight?token=…                                   */
/* ------------------------------------------------------------------ */

const num = (v) => Number(v || 0);

const SummaryCard = ({ icon, label, value, sub, color = "success" }) => (
  <div className="col-sm-6 col-lg-3">
    <div className="card h-100 shadow-none border">
      <div className="card-body d-flex align-items-center gap-3">
        <span
          className={`bg-${color}-light text-${color}-600 rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0`}
          style={{ width: 52, height: 52 }}
        >
          <Icon icon={icon} width={24} />
        </span>
        <div>
          <h5 className="mb-0 fw-bold">{value}</h5>
          <span className="text-secondary text-sm d-block">{label}</span>
          {sub ? <span className="text-secondary" style={{ fontSize: "0.72rem" }}>{sub}</span> : null}
        </div>
      </div>
    </div>
  </div>
);

const Screen = ({ icon, title, message }) => (
  <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
    <div className="text-center">
      <Icon icon={icon} width={56} className="text-secondary mb-3" />
      <h5 className="mb-1">{title}</h5>
      {message ? <p className="text-secondary mb-0">{message}</p> : null}
    </div>
  </div>
);

const GoTractOversight = () => {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // "missing" | "invalid" | "error"

  // Read the access token from the link once on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      if (!token) {
        setError("missing");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/gotract/oversight", { params: { token } });
        setData(res.data?.data || null);
      } catch (e) {
        setError(e?.response?.status === 403 ? "invalid" : "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ready, token]);

  if (!ready || loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error === "missing")
    return <Screen icon="mdi:link-variant-off" title="Access token missing" message="This oversight link is incomplete. Please use the full link provided to you." />;
  if (error === "invalid")
    return <Screen icon="mdi:lock-alert-outline" title="Link invalid or expired" message="This oversight link is no longer valid. Please request an updated link." />;
  if (error === "error" || !data)
    return <Screen icon="mdi:alert-circle-outline" title="Unable to load data" message="Something went wrong loading the programme figures. Please try again shortly." />;

  const byStatus = data.byStatus || {};
  const gender = data.gender || {};
  const ageBands = data.ageBands || {};
  const totalTarget = num(data.totalTarget);
  const approved = num(data.approved);
  const overallPct = totalTarget ? Math.min(100, Math.round((approved / totalTarget) * 100)) : 0;
  const receivedPct = totalTarget ? Math.min(100, Math.round((num(data.total) / totalTarget) * 100)) : 0;
  const generated = data.generatedAt ? new Date(data.generatedAt) : null;

  return (
    <div className="container-fluid py-4" style={{ maxWidth: 1200 }}>
      {/* Header banner */}
      <div
        className="rounded-3 p-4 mb-4 text-white"
        style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 60%, #166534 100%)" }}
      >
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div>
            <span
              className="badge rounded-pill px-3 py-2 mb-2"
              style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              <Icon icon="mdi:eye-outline" className="me-1" /> Read-only oversight
            </span>
            <h4 className="mb-1 text-white fw-bold">GoTRACT Programme — Oversight Dashboard</h4>
            <p className="mb-0" style={{ color: "rgba(255,255,255,0.85)" }}>
              Gombe Tractor Access &amp; Capacity Transformation Programme · Aggregate figures across all 11 LGAs
            </p>
          </div>
          {generated && (
            <div className="text-md-end" style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.8rem" }}>
              Last updated<br />
              <span className="fw-medium text-white">
                {generated.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="row g-3 mb-4">
        <SummaryCard icon="mdi:file-document-multiple-outline" label="Total Applications" value={num(data.total).toLocaleString()} color="primary" />
        <SummaryCard icon="mdi:check-decagram-outline" label="Approved" value={approved.toLocaleString()} color="success" />
        <SummaryCard icon="mdi:percent-outline" label="Approval Rate" value={`${num(data.approvalRate)}%`} color="info" />
        <SummaryCard
          icon="mdi:target-arrow"
          label="Applications vs Target"
          value={`${num(data.total).toLocaleString()} / ${totalTarget.toLocaleString()}`}
          sub={`${receivedPct}% of statewide target`}
          color="warning"
        />
      </div>

      {/* Overall target progress */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0 fw-bold">Statewide approvals vs target</h6>
            <span className="text-secondary text-sm">{approved.toLocaleString()} of {totalTarget.toLocaleString()} ({overallPct}%)</span>
          </div>
          <div className="progress" style={{ height: 12 }}>
            <div className={`progress-bar ${overallPct >= 100 ? "bg-success" : "bg-primary"}`} style={{ width: `${overallPct}%` }} />
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Approvals by LGA */}
        <div className="col-12 col-xl-8">
          <div className="card h-100">
            <div className="card-header">
              <h6 className="mb-0 fw-bold">Approvals by LGA</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th scope="col">LGA</th>
                      <th scope="col">Applications</th>
                      <th scope="col">Approved</th>
                      <th scope="col" style={{ minWidth: 180 }}>Progress to target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.lgas || []).map((row) => {
                      const target = num(row.target) || num(data.targetPerLga) || 40;
                      const pct = target ? Math.min(100, Math.round((num(row.total) / target) * 100)) : 0;
                      return (
                        <tr key={row.lga}>
                          <td className="fw-medium">{row.lga}</td>
                          <td>{num(row.total)}</td>
                          <td><span className="fw-bold text-success-600">{num(row.approved)}</span></td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="progress flex-grow-1" style={{ height: 8, minWidth: 100 }}>
                                <div className={`progress-bar ${pct >= 100 ? "bg-success" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-sm text-secondary" style={{ width: 40 }}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown & demographics */}
        <div className="col-12 col-xl-4">
          <div className="card mb-4">
            <div className="card-header"><h6 className="mb-0 fw-bold">Status Breakdown</h6></div>
            <div className="card-body">
              {[
                { key: "pending", label: "Pending", cls: "bg-warning" },
                { key: "screening", label: "Screening", cls: "bg-info" },
                { key: "approved", label: "Approved", cls: "bg-success" },
                { key: "rejected", label: "Rejected", cls: "bg-danger" },
              ].map((s) => (
                <div key={s.key} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                  <span className="d-flex align-items-center gap-2">
                    <span className={`d-inline-block rounded-circle ${s.cls}`} style={{ width: 10, height: 10 }} />
                    {s.label}
                  </span>
                  <span className="fw-bold">{num(byStatus[s.key]).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header"><h6 className="mb-0 fw-bold">Gender</h6></div>
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
                <span><Icon icon="mdi:gender-male" className="me-1 text-primary-600" />Male</span>
                <span className="fw-bold">{num(gender.Male).toLocaleString()}</span>
              </div>
              <div className="d-flex align-items-center justify-content-between py-2">
                <span><Icon icon="mdi:gender-female" className="me-1 text-danger-600" />Female</span>
                <span className="fw-bold">{num(gender.Female).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h6 className="mb-0 fw-bold">Age Distribution</h6></div>
            <div className="card-body">
              {["18-25", "26-35", "36+"].map((band) => (
                <div key={band} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                  <span>{band} years</span>
                  <span className="fw-bold">{num(ageBands[band]).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-secondary mt-4 mb-0" style={{ fontSize: "0.78rem" }}>
        <Icon icon="mdi:shield-lock-outline" className="me-1" />
        This is a read-only oversight view showing aggregate figures only. No personal applicant information is displayed.
      </p>
    </div>
  );
};

export default GoTractOversight;
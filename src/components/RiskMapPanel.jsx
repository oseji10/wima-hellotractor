"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const arr = (x) => (Array.isArray(x) ? x : []);
const bandTone = { low: "gray", medium: "amber", high: "red", critical: "red" };

const RiskMapPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    api.get(`/security/risk-map`, { params })
      .then((r) => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [from, to]);
  useEffect(load, [load]);

  const zones = arr(data?.zones);
  const maxScore = Math.max(1, ...zones.map((z) => z.score));

  return (
    <>
      <div className="sec-card sec-card-pad mb-3" style={{ background: "var(--sec-bg-soft)" }}>
        <div className="d-flex flex-wrap align-items-end gap-3">
          <div>
            <div className="fw-bold"><Icon icon="solar:map-point-wave-bold" className="me-2 text-primary" style={{ verticalAlign: "-3px" }} width={18} />Location-based risk profile</div>
            <div className="small text-muted">Severity-weighted incident scoring by state, with vendor-coverage gaps flagged.</div>
          </div>
          <div className="ms-auto d-flex gap-2">
            <div><label className="sec-field-label">From</label><input type="date" className="form-control form-control-sm" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><label className="sec-field-label">To</label><input type="date" className="form-control form-control-sm" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><span className="spinner-border text-primary" /></div>
      ) : zones.length === 0 ? (
        <div className="sec-card"><div className="sec-empty">No incident data to profile yet.</div></div>
      ) : (
        <>
          {arr(data?.coverage_gaps).length > 0 && (
            <div className="sec-confidential mb-3" style={{ borderColor: "#fec84b", background: "#fffcf5" }}>
              <Icon icon="solar:shield-cross-bold" className="ic" style={{ color: "#b54708" }} width={22} />
              <div>
                <div className="fw-semibold">Coverage gaps detected</div>
                <div className="small text-muted">
                  {arr(data.coverage_gaps).map((z) => z.state_name).join(", ")} {arr(data.coverage_gaps).length === 1 ? "is" : "are"} high-risk with no registered vendor coverage. Consider onboarding a security vendor or deploying resources there.
                </div>
              </div>
            </div>
          )}

          <div className="sec-card sec-card-pad">
            <div className="sec-panel-head"><h6>Risk by state</h6><span className="small text-muted">{zones.length} states with incidents</span></div>
            <div className="sec-risk-row" style={{ borderBottom: "2px solid var(--sec-border)", fontSize: ".72rem", textTransform: "uppercase", color: "var(--sec-text-muted)", fontWeight: 600 }}>
              <div>State</div><div className="text-center">Incidents</div><div>Risk score</div><div className="text-end">Vendors</div>
            </div>
            {zones.map((z) => (
              <div className="sec-risk-row" key={z.state}>
                <div>
                  <div className="fw-medium">{z.state_name}</div>
                  <div className="small text-muted">{z.open} open · last {z.last_incident || "—"}{z.top_type ? ` · ${z.top_type.replace("_", " ")}` : ""}</div>
                </div>
                <div className="text-center">{z.incidents}</div>
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <div className={`sec-risk-bar sec-band--${z.band}`} style={{ flex: 1 }}><span style={{ width: `${(z.score / maxScore) * 100}%` }} /></div>
                    <span className={`sec-pill sec-pill--${bandTone[z.band]}`} style={{ textTransform: "uppercase", fontSize: ".66rem" }}>{z.band}</span>
                  </div>
                </div>
                <div className="text-end">
                  {z.coverage_gap
                    ? <span className="sec-pill sec-pill--red"><Icon icon="solar:close-circle-bold" width={12} />gap</span>
                    : <span className="fw-medium">{z.vendor_coverage}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="row g-3 mt-1">
            <div className="col-md-6">
              <div className="sec-card sec-card-pad h-100">
                <div className="fw-bold mb-2"><Icon icon="solar:fire-bold" className="me-1 text-danger" style={{ verticalAlign: "-2px" }} width={16} />High-risk zones</div>
                {arr(data?.high_risk_zones).length === 0 ? <div className="small text-muted">None currently.</div> :
                  arr(data.high_risk_zones).map((z) => (
                    <div key={z.state} className="d-flex justify-content-between py-1 border-bottom small">
                      <span>{z.state_name}</span>
                      <span><span className={`sec-pill sec-pill--${bandTone[z.band]}`} style={{ textTransform: "uppercase", fontSize: ".66rem" }}>{z.band}</span> <span className="text-muted ms-1">score {z.score}</span></span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="col-md-6">
              <div className="sec-card sec-card-pad h-100">
                <div className="fw-bold mb-2">Scoring</div>
                <div className="small text-muted">Each incident contributes by severity: low 1, medium 3, high 7, critical 12. State bands: <strong>critical</strong> ≥ 40, <strong>high</strong> ≥ 20, <strong>medium</strong> ≥ 8, else <strong>low</strong>. Use the date filters to profile a specific window.</div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default RiskMapPanel;
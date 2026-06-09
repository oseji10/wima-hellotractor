"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";
import { KpiCard } from "./ExecutiveDashboard";

const arr = (x) => (Array.isArray(x) ? x : []);

const attTone = (pct) => (pct >= 100 ? "green" : pct >= 70 ? "amber" : "red");

const DonorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    api.get(`/me/donor-dashboard`, { params })
      .then((r) => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [from, to]);
  useEffect(load, [load]);

  return (
    <>
      <div className="me-card me-card-pad mb-3" style={{ background: "var(--me-bg-soft)" }}>
        <div className="d-flex flex-wrap align-items-end gap-3">
          <div>
            <div className="fw-bold"><Icon icon="solar:hand-stars-bold" className="me-2 text-primary" style={{ verticalAlign: "-3px" }} width={18} />Donor & impact summary</div>
            <div className="small text-muted">Outcomes against targets for donor-visible indicators, grouped by program.</div>
          </div>
          <div className="ms-auto d-flex gap-2">
            <div>
              <label className="me-field-label">From</label>
              <input type="date" className="form-control form-control-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="me-field-label">To</label>
              <input type="date" className="form-control form-control-sm" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><span className="spinner-border text-primary" /></div>
      ) : arr(data?.programs).length === 0 ? (
        <div className="me-card"><div className="me-empty">No donor-visible KPIs yet. Mark KPIs as “Show on donor dashboard” in configuration.</div></div>
      ) : (
        arr(data.programs).map((prog, idx) => (
          <div className="mb-4" key={idx}>
            <div className="me-panel-head">
              <h6 className="mb-0">{prog.program}</h6>
              <span className={`me-pill me-pill--${attTone(prog.avg_attainment)}`}>
                <span className="dot" />{prog.avg_attainment}% avg attainment
              </span>
            </div>
            <div className="me-kpis">
              {arr(prog.indicators).map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)}
            </div>
          </div>
        ))
      )}
    </>
  );
};

export default DonorDashboard;
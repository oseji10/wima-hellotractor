"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const arr = (x) => (Array.isArray(x) ? x : []);
const fmt = (v, unit) => {
  if (v === null || v === undefined) return "—";
  const n = parseFloat(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return unit === "%" ? `${n}%` : unit ? `${n} ${unit}` : n;
};

const STATUS_LABEL = { on_track: "On track", at_risk: "At risk", off_track: "Off track", no_data: "No data" };
const STATUS_PILL = { on_track: "green", at_risk: "amber", off_track: "red", no_data: "gray" };

/* Shared scorecard card — used by executive & donor dashboards */
export const KpiCard = ({ kpi, onTrend }) => {
  const pct = kpi.attainment;
  return (
    <div className={`me-kpi me-acc-${kpi.status}`}>
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <div className="me-kpi-level">{kpi.level}{kpi.program ? ` · ${kpi.program}` : ""}</div>
          <div className="me-kpi-name">{kpi.name}</div>
        </div>
        <span className={`me-pill me-pill--${STATUS_PILL[kpi.status]}`}><span className="dot" />{STATUS_LABEL[kpi.status]}</span>
      </div>
      <div className="me-kpi-value">{fmt(kpi.value, kpi.unit)}</div>
      <div className="me-kpi-target">
        {kpi.target != null ? <>Target {fmt(kpi.target, kpi.unit)}{pct != null ? ` · ${pct}% attained` : ""}</> : "No target set"}
      </div>
      {kpi.target != null && (
        <div className="me-progress"><span style={{ width: `${Math.min(100, Math.max(0, pct || 0))}%` }} /></div>
      )}
      {onTrend && (
        <button className="btn btn-sm btn-link p-0 mt-2" onClick={() => onTrend(kpi)}>
          <Icon icon="solar:chart-2-outline" width={14} className="me-1" />Trend
        </button>
      )}
    </div>
  );
};

const TrendModal = ({ kpi, onClose }) => {
  const [series, setSeries] = useState(null);
  useEffect(() => {
    api.get(`/me/indicators/${kpi.id}/trend`, { params: { months: 6 } })
      .then((r) => setSeries(r.data)).catch(() => setSeries({ series: [] }));
  }, [kpi.id]);

  const vals = arr(series?.series).map((p) => p.value || 0);
  const max = Math.max(1, ...vals);

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(16,24,40,.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
          <div className="modal-header">
            <h5 className="modal-title">{kpi.name} — 6-month trend</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {!series ? (
              <div className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary" /></div>
            ) : (
              <>
                <div className="me-trend me-acc-on_track" style={{ height: 120 }}>
                  {arr(series.series).map((p, i) => (
                    <div key={i} className="d-flex flex-column align-items-center" style={{ flex: 1 }}>
                      <div className="me-trend-bar" style={{ height: `${((p.value || 0) / max) * 100}%`, width: "100%" }} title={fmt(p.value, kpi.unit)} />
                    </div>
                  ))}
                </div>
                <div className="d-flex" style={{ gap: 4 }}>
                  {arr(series.series).map((p, i) => (
                    <div key={i} className="text-center small text-muted" style={{ flex: 1, fontSize: ".68rem" }}>{p.period.split(" ")[0]}</div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ExecutiveDashboard = ({ hubs, projects = [] }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState("");
  const [hub, setHub] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [trendKpi, setTrendKpi] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (projectId) params.project_id = projectId;
    if (hub) params.hub = hub;
    if (from) params.from = from;
    if (to) params.to = to;
    api.get(`/me/dashboard`, { params })
      .then((r) => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [projectId, hub, from, to]);
  useEffect(load, [load]);

  const s = data?.summary;

  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-6 col-md-3">
          <label className="me-field-label">Program</label>
          <select className="form-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">All programs</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <label className="me-field-label">Hub</label>
          <select className="form-select" value={hub} onChange={(e) => setHub(e.target.value)}>
            <option value="">All hubs</option>
            {hubs.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <label className="me-field-label">From</label>
          <input type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="col-6 col-md-3">
          <label className="me-field-label">To</label>
          <input type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><span className="spinner-border text-primary" /></div>
      ) : (
        <>
          <div className="me-summary">
            <div className="me-chip"><span className="me-chip-dot" style={{ background: "#12b76a" }} /><div><div className="v">{s?.on_track ?? 0}</div><div className="l">On track</div></div></div>
            <div className="me-chip"><span className="me-chip-dot" style={{ background: "#f79009" }} /><div><div className="v">{s?.at_risk ?? 0}</div><div className="l">At risk</div></div></div>
            <div className="me-chip"><span className="me-chip-dot" style={{ background: "#f04438" }} /><div><div className="v">{s?.off_track ?? 0}</div><div className="l">Off track</div></div></div>
            <div className="me-chip"><span className="me-chip-dot" style={{ background: "#98a2b3" }} /><div><div className="v">{s?.no_data ?? 0}</div><div className="l">No data</div></div></div>
          </div>

          {arr(data?.scorecard).length === 0 ? (
            <div className="me-card"><div className="me-empty">No KPIs to display for this period. Configure KPIs and collect data to populate the dashboard.</div></div>
          ) : (
            <div className="me-kpis">
              {arr(data.scorecard).map((kpi) => <KpiCard key={kpi.id} kpi={kpi} onTrend={setTrendKpi} />)}
            </div>
          )}
        </>
      )}

      {trendKpi && <TrendModal kpi={trendKpi} onClose={() => setTrendKpi(null)} />}
    </>
  );
};

export default ExecutiveDashboard;
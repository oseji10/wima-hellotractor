"use client";
import { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

/* ------------------------------------------------------------------ */
/*  GoTRACT — Accreditation Desk                                       */
/*  Search approved participants, accredit them, then bind a PRE-PRINTED */
/*  badge serial to them (badges are printed blank ahead of time).       */
/*    GET  /gotract/accreditation/search?search=&pending_only=           */
/*    POST /gotract/accreditation/{id}/accredit                          */
/*    POST /gotract/badges/assign  { serial, application_id }            */
/* ------------------------------------------------------------------ */

const GoTractAccreditationDesk = () => {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [assignFor, setAssignFor] = useState(null);  // participant awaiting a badge serial
  const [serial, setSerial] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [accrediting, setAccrediting] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStats = useCallback(async () => {
    try {
      const r = await api.get("/gotract/accreditation/stats");
      setStats(r.data?.data || null);
    } catch { /* non-critical */ }
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/gotract/accreditation/search", {
        params: { search: debounced, pending_only: pendingOnly ? 1 : 0, per_page: 15 },
      });
      setRows(Array.isArray(r.data?.data) ? r.data.data : []);
    } catch {
      toast.error("Could not load participants.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [debounced, pendingOnly]);

  useEffect(() => { fetchRows(); }, [fetchRows]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const accredit = async (p) => {
    setAccrediting(p.id);
    try {
      const r = await api.post(`/gotract/accreditation/${p.id}/accredit`);
      const data = r.data?.data;
      toast.success(`${data.fullName} accredited.`);
      setRows((prev) => prev.map((x) => (x.id === p.id ? data : x)));
      setAssignFor(data);      // straight to badge assignment
      setSerial("");
      fetchStats();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not accredit participant.");
    } finally {
      setAccrediting(null);
    }
  };

  const assignBadge = async () => {
    const code = serial.trim().toUpperCase();
    if (!code) return toast.error("Enter the badge serial.");
    setAssigning(true);
    try {
      const r = await api.post("/gotract/badges/assign", {
        serial: code,
        application_id: assignFor.id,
      });
      toast.success(r.data?.message || "Badge assigned.");
      setRows((prev) => prev.map((x) => (x.id === assignFor.id ? { ...x, badgeSerial: code } : x)));
      setAssignFor(null);
      setSerial("");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not assign that badge.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="col-lg-12">
      <Toaster position="top-right" />

      {/* Stats */}
      <div className="row g-3 mb-4 no-print">
        {[
          { label: "Registered participants", value: stats?.eligible, icon: "mdi:account-group-outline", color: "primary" },
          { label: "Accredited", value: stats?.accredited, icon: "mdi:badge-account-horizontal-outline", color: "success" },
          { label: "Awaiting accreditation", value: stats?.pending, icon: "mdi:clock-outline", color: "warning" },
        ].map((s) => (
          <div className="col-sm-6 col-lg-4" key={s.label}>
            <div className="card h-100 shadow-none border">
              <div className="card-body d-flex align-items-center gap-3">
                <span className={`bg-${s.color}-light text-${s.color}-600 rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0`} style={{ width: 48, height: 48 }}>
                  <Icon icon={s.icon} width={22} />
                </span>
                <div>
                  <h6 className="mb-0 fw-bold">{s.value ?? 0}</h6>
                  <span className="text-secondary text-sm">{s.label}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card no-print">
        <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <h5 className="card-title mb-3 mb-md-0">Accreditation Desk</h5>
          <div className="form-check form-switch">
            <input className="form-check-input" type="checkbox" id="pendingOnly" checked={pendingOnly} onChange={(e) => setPendingOnly(e.target.checked)} />
            <label className="form-check-label" htmlFor="pendingOnly">Show only not-yet-accredited</label>
          </div>
        </div>

        <div className="card-body">
          <div className="input-group mb-3">
            <span className="input-group-text"><Icon icon="ion:search" /></span>
            <input
              className="form-control"
              placeholder="Search by name, phone, reference or NIN…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status"><span className="visually-hidden">Loading…</span></div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>LGA</th>
                    <th>Status</th>
                    <th>Badge</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? rows.map((p) => (
                    <tr key={p.id}>
                      <td className="fw-medium text-success-600">{p.referenceId}</td>
                      <td>{p.fullName}</td>
                      <td>{p.phoneNumber}</td>
                      <td>{p.lga}</td>
                      <td>
                        {p.isAccredited
                          ? <span className="badge bg-success rounded-pill px-3 py-2">Accredited</span>
                          : <span className="badge bg-warning text-dark rounded-pill px-3 py-2">Pending</span>}
                      </td>
                      <td>
                        {p.badgeSerial
                          ? <span className="fw-bold text-success-600">{p.badgeSerial}</span>
                          : <span className="text-secondary">—</span>}
                      </td>
                      <td className="text-end">
                        {!p.isAccredited ? (
                          <button className="btn btn-sm btn-success d-inline-flex align-items-center gap-1" onClick={() => accredit(p)} disabled={accrediting === p.id}>
                            {accrediting === p.id
                              ? <><span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }}></span>Accrediting…</>
                              : <><Icon icon="mdi:badge-account-outline" /> Accredit</>}
                          </button>
                        ) : (
                          <button className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1" onClick={() => { setAssignFor(p); setSerial(""); }}>
                            <Icon icon="mdi:qrcode-plus" /> {p.badgeSerial ? "Reassign badge" : "Assign badge"}
                          </button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="7" className="text-center py-4 text-secondary">No participants match your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Assign a pre-printed badge serial */}
      {assignFor && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Assign Badge</h5>
                <button type="button" className="btn-close" onClick={() => setAssignFor(null)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-success d-flex align-items-center gap-2">
                  <Icon icon="mdi:account-check-outline" width={22} />
                  <div>
                    <div className="fw-bold">{assignFor.fullName}</div>
                    <div className="text-sm">{assignFor.referenceId} · {assignFor.lga}</div>
                  </div>
                </div>

                <label className="form-label">Badge serial <span className="text-danger">*</span></label>
                <div className="input-group input-group-lg">
                  <span className="input-group-text"><Icon icon="mdi:qrcode" /></span>
                  <input
                    className="form-control text-uppercase fw-bold"
                    placeholder="GT-0001"
                    value={serial}
                    autoFocus
                    onChange={(e) => setSerial(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && assignBadge()}
                  />
                </div>
                <small className="text-secondary">
                  Type the serial printed under the QR on the badge you're handing them.
                </small>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setAssignFor(null)} disabled={assigning}>Cancel</button>
                <button className="btn btn-success d-inline-flex align-items-center gap-1" onClick={assignBadge} disabled={assigning || !serial.trim()}>
                  {assigning
                    ? <><span className="spinner-border spinner-border-sm"></span>Assigning…</>
                    : <><Icon icon="mdi:link-variant" /> Assign badge</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GoTractAccreditationDesk;
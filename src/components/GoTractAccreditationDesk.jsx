"use client";
import { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

/* ------------------------------------------------------------------ */
/*  GoTRACT — Accreditation Desk                                       */
/*  Top:    search a participant -> details modal -> serial + accredit */
/*  Bottom: log of accredited participants + per-LGA progress panel    */
/*    GET  /gotract/accreditation/search                               */
/*    GET  /gotract/accreditation/accredited                           */
/*    GET  /gotract/accreditation/stats                                */
/*    POST /gotract/accreditation/{id}/accredit                        */
/*    POST /gotract/badges/assign  { serial, application_id }          */
/* ------------------------------------------------------------------ */

const num = (v) => Number(v || 0);

const StatTile = ({ icon, label, value, color }) => (
  <div className="col-sm-6 col-lg-4">
    <div className="card h-100 shadow-none border">
      <div className="card-body d-flex align-items-center gap-3">
        <span
          className={`bg-${color}-light text-${color}-600 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`}
          style={{ width: 48, height: 48 }}
        >
          <Icon icon={icon} width={22} />
        </span>
        <div>
          <h6 className="mb-0 fw-bold">{value ?? 0}</h6>
          <span className="text-secondary text-sm">{label}</span>
        </div>
      </div>
    </div>
  </div>
);

const Detail = ({ label, value }) => (
  <div className="col-6 mb-3">
    <div className="text-secondary text-uppercase" style={{ fontSize: "0.68rem", letterSpacing: 0.5 }}>{label}</div>
    <div className="fw-medium">{value || "—"}</div>
  </div>
);

const GoTractAccreditationDesk = () => {
  // search
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // modal
  const [selected, setSelected] = useState(null);
  const [serial, setSerial] = useState("");
  const [processing, setProcessing] = useState(false);

  // lower section
  const [accredited, setAccredited] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const r = await api.get("/gotract/accreditation/stats");
      setStats(r.data?.data || null);
    } catch { /* non-critical */ }
  }, []);

  const fetchAccredited = useCallback(async () => {
    setLoadingList(true);
    try {
      const r = await api.get("/gotract/accreditation/accredited", { params: { page, per_page: 10 } });
      setAccredited(Array.isArray(r.data?.data) ? r.data.data : []);
      setTotalPages(r.data?.last_page || 1);
    } catch {
      setAccredited([]);
    } finally {
      setLoadingList(false);
    }
  }, [page]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchAccredited(); }, [fetchAccredited]);

  const runSearch = async () => {
    const term = search.trim();
    if (!term) return toast.error("Enter a name, phone number or application ID.");
    setSearching(true);
    setSearched(true);
    try {
      const r = await api.get("/gotract/accreditation/search", { params: { search: term, per_page: 10 } });
      const list = Array.isArray(r.data?.data) ? r.data.data : [];
      setResults(list);
      if (list.length === 1) openParticipant(list[0]);   // straight to the modal
      else if (!list.length) toast.error("No participant found.");
    } catch {
      toast.error("Search failed. Please try again.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const openParticipant = (p) => {
    setSelected(p);
    setSerial(p.badgeSerial || "");
  };

  const closeModal = () => {
    setSelected(null);
    setSerial("");
  };

  // Accredit (if needed) then bind the badge serial — one action.
  const accreditAndAssign = async () => {
    const code = serial.trim().toUpperCase();
    if (!code) return toast.error("Enter the badge QR serial number.");

    setProcessing(true);
    try {
      let participant = selected;

      if (!participant.isAccredited) {
        const r = await api.post(`/gotract/accreditation/${participant.id}/accredit`);
        participant = r.data?.data || participant;
      }

      await api.post("/gotract/badges/assign", { serial: code, application_id: participant.id });

      toast.success(`${participant.fullName} accredited — badge ${code} issued.`);
      closeModal();
      setSearch("");
      setResults([]);
      setSearched(false);
      setPage(1);
      fetchAccredited();
      fetchStats();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not complete accreditation.");
    } finally {
      setProcessing(false);
    }
  };

  const lgas = stats?.lgas || [];

  return (
    <div className="col-lg-12">
      <Toaster position="top-right" />

      {/* Stats */}
      <div className="row g-3 mb-4">
        <StatTile icon="mdi:account-group-outline" label="Registered participants" value={num(stats?.eligible)} color="primary" />
        <StatTile icon="mdi:badge-account-horizontal-outline" label="Accredited" value={num(stats?.accredited)} color="success" />
        <StatTile icon="mdi:clock-outline" label="Awaiting accreditation" value={num(stats?.pending)} color="warning" />
      </div>

      {/* ===== UPPER: search ===== */}
      <div className="card mb-4">
        <div className="card-body p-4">
          <div className="text-center mb-3">
            <span
              className="bg-success-light text-success-600 rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
              style={{ width: 56, height: 56 }}
            >
              <Icon icon="mdi:account-search-outline" width={28} />
            </span>
            <h5 className="fw-bold mb-1">Find a Participant</h5>
            <p className="text-secondary text-sm mb-0">Search by name, phone number or application ID to begin accreditation.</p>
          </div>

          <div className="mx-auto" style={{ maxWidth: 640 }}>
            <div className="input-group input-group-lg">
              <span className="input-group-text bg-white"><Icon icon="ion:search" /></span>
              <input
                className="form-control"
                placeholder="Name, phone number or application ID…"
                value={search}
                autoFocus
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
              />
              <button className="btn btn-success px-4 d-flex align-items-center gap-1" onClick={runSearch} disabled={searching}>
                {searching
                  ? <><span className="spinner-border spinner-border-sm"></span>Searching…</>
                  : <><Icon icon="mdi:magnify" /> Search</>}
              </button>
            </div>
          </div>

          {/* Multiple matches — pick one */}
          {searched && results.length > 1 && (
            <div className="mx-auto mt-4" style={{ maxWidth: 720 }}>
              <div className="text-secondary text-sm mb-2">{results.length} matches — select the participant:</div>
              <div className="list-group">
                {results.map((p) => (
                  <button key={p.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center" onClick={() => openParticipant(p)}>
                    <span>
                      <span className="fw-medium">{p.fullName}</span>
                      <span className="text-secondary text-sm"> · {p.phoneNumber} · {p.lga}</span>
                    </span>
                    <span className="d-flex align-items-center gap-2">
                      {p.isAccredited && <span className="badge bg-success rounded-pill px-3 py-1">Accredited</span>}
                      <Icon icon="mdi:chevron-right" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {searched && !searching && results.length === 0 && (
            <div className="text-center text-secondary mt-4">
              <Icon icon="mdi:account-off-outline" width={32} className="mb-2 d-block mx-auto" />
              No participant matches that search.
            </div>
          )}
        </div>
      </div>

      {/* ===== LOWER: accredited list + LGA panel ===== */}
      <div className="row g-4">
        {/* Accredited participants */}
        <div className="col-12 col-xl-8">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Accredited Participants</h5>
              <span className="badge bg-success rounded-pill px-3 py-2">{num(stats?.accredited)} total</span>
            </div>
            <div className="card-body">
              {loadingList ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success" role="status"><span className="visually-hidden">Loading…</span></div>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Participant ID</th>
                          <th>Name</th>
                          <th>Phone Number</th>
                          <th>LGA</th>
                          <th>Badge</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accredited.length ? accredited.map((p) => (
                          <tr key={p.id}>
                            <td className="fw-medium text-success-600">{p.referenceId}</td>
                            <td>{p.fullName}</td>
                            <td>{p.phoneNumber}</td>
                            <td>{p.lga}</td>
                            <td>
                              {p.badgeSerial
                                ? <span className="badge bg-success-light text-success-600 rounded-pill px-3 py-1 fw-bold">{p.badgeSerial}</span>
                                : <span className="text-secondary">—</span>}
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="5" className="text-center py-4 text-secondary">Nobody accredited yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <nav className="mt-3">
                      <ul className="pagination pagination-sm justify-content-center mb-0">
                        <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
                        </li>
                        <li className="page-item disabled"><span className="page-link">{page} / {totalPages}</span></li>
                        <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
                        </li>
                      </ul>
                    </nav>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Per-LGA progress */}
        <div className="col-12 col-xl-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">Accreditation by LGA</h5>
              <small className="text-secondary">Accredited vs registered</small>
            </div>
            <div className="card-body">
              {lgas.length ? lgas.map((row) => {
                const reg = num(row.registered);
                const acc = num(row.accredited);
                const pct = reg ? Math.min(100, Math.round((acc / reg) * 100)) : 0;
                return (
                  <div className="mb-3" key={row.lga}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-medium text-sm">{row.lga}</span>
                      <span className="text-secondary" style={{ fontSize: "0.75rem" }}>
                        <span className="fw-bold text-success-600">{acc}</span> / {reg}
                      </span>
                    </div>
                    <div className="progress" style={{ height: 6 }}>
                      <div
                        className={`progress-bar ${pct >= 100 ? "bg-success" : "bg-primary"}`}
                        role="progressbar"
                        style={{ width: `${pct}%` }}
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center text-secondary py-4">No LGA data yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Participant modal ===== */}
      {selected && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Participant Details</h5>
                <button type="button" className="btn-close" onClick={closeModal} disabled={processing}></button>
              </div>

              <div className="modal-body">
                {/* Identity header */}
                <div className="text-center mb-4">
                  <span
                    className="bg-success-light text-success-600 rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                    style={{ width: 64, height: 64 }}
                  >
                    <Icon icon="mdi:account" width={34} />
                  </span>
                  <h5 className="fw-bold mb-1">{selected.fullName}</h5>
                  <div className="d-flex align-items-center justify-content-center gap-2">
                    <span className="badge bg-success-light text-success-600 rounded-pill px-3 py-1 fw-bold">{selected.referenceId}</span>
                    {selected.isAccredited && (
                      <span className="badge bg-success rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1">
                        <Icon icon="mdi:check-circle-outline" /> Accredited
                      </span>
                    )}
                  </div>
                </div>

                <div className="row">
                  <Detail label="Phone Number" value={selected.phoneNumber} />
                  <Detail label="LGA" value={selected.lga} />
                  <Detail label="Community" value={selected.village} />
                  <Detail label="Gender" value={selected.gender} />
                </div>

                <hr />

                {/* Badge serial */}
                <label className="form-label fw-medium">QR Badge Serial Number <span className="text-danger">*</span></label>
                <div className="input-group input-group-lg">
                  <span className="input-group-text bg-white"><Icon icon="mdi:qrcode" /></span>
                  <input
                    className="form-control text-uppercase fw-bold"
                    placeholder="GT-0001"
                    value={serial}
                    autoFocus
                    disabled={processing}
                    onChange={(e) => setSerial(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && accreditAndAssign()}
                  />
                </div>
                <small className="text-secondary">
                  Type the serial printed beneath the QR code on the badge you're handing them.
                </small>

                {selected.badgeSerial && (
                  <div className="alert alert-warning mt-3 mb-0 d-flex align-items-center gap-2">
                    <Icon icon="mdi:alert-outline" width={20} />
                    <span>Currently holds badge <strong>{selected.badgeSerial}</strong>. Entering a new serial will release the old one.</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal} disabled={processing}>Cancel</button>
                <button
                  className="btn btn-success px-4 d-flex align-items-center gap-1"
                  onClick={accreditAndAssign}
                  disabled={processing || !serial.trim()}
                >
                  {processing
                    ? <><span className="spinner-border spinner-border-sm"></span>Processing…</>
                    : <><Icon icon="mdi:badge-account-outline" /> {selected.isAccredited ? "Reassign Badge" : "Accredit & Issue Badge"}</>}
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
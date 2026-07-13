"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Html5Qrcode } from "html5-qrcode";
import api from "../../lib/api";

/* ------------------------------------------------------------------ */
/*  GoTRACT — Meal & Attendance Scanner                                */
/*  Scans a participant badge and records the scan for the chosen      */
/*  session. Duplicate claims are rejected by the backend.             */
/*    POST /gotract/accreditation/scan { token, type, session }        */
/* ------------------------------------------------------------------ */

const SCANNER_ID = "gotract-qr-reader";

const GoTractScanner = () => {
  const [type, setType] = useState("meal");          // meal | attendance
  const [session, setSession] = useState("");
  const [sessions, setSessions] = useState({});
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);        // {result, message, data}
  const [manual, setManual] = useState("");
  const [count, setCount] = useState(null);
  const [busy, setBusy] = useState(false);

  const scannerRef = useRef(null);
  const lockRef = useRef(false); // stops the camera firing the same code repeatedly

  // Load configured sessions
  useEffect(() => {
    api.get("/gotract/accreditation/stats")
      .then((r) => setSessions(r.data?.data?.sessions || {}))
      .catch(() => {});
  }, []);

  // Default to the first session of the chosen type
  useEffect(() => {
    const list = sessions?.[type] || {};
    const first = Object.keys(list)[0] || "";
    setSession(first);
  }, [type, sessions]);

  const refreshCount = useCallback(async () => {
    if (!session) return;
    try {
      const r = await api.get("/gotract/accreditation/stats", { params: { type, session } });
      setCount(r.data?.data?.sessionCount ?? null);
    } catch { /* non-critical */ }
  }, [type, session]);

  useEffect(() => { refreshCount(); }, [refreshCount]);

  const submitToken = useCallback(async (token) => {
    if (!token || !session || busy) return;
    setBusy(true);
    try {
      const r = await api.post("/gotract/accreditation/scan", { token, type, session });
      setResult(r.data);
      toast.success(r.data?.message || "Recorded.");
      refreshCount();
    } catch (e) {
      const body = e?.response?.data;
      setResult(body || { result: "invalid", message: "Scan failed." });
      toast.error(body?.message || "Scan failed.");
    } finally {
      setBusy(false);
      // brief cooldown so one badge isn't scanned twice in a burst
      setTimeout(() => { lockRef.current = false; }, 1500);
    }
  }, [type, session, busy, refreshCount]);

  const startScanner = async () => {
    if (!session) return toast.error("Choose a session first.");
    try {
      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          if (lockRef.current) return;
          lockRef.current = true;
          submitToken(decoded.trim());
        },
        () => {} // ignore per-frame decode misses
      );
      setScanning(true);
    } catch {
      toast.error("Could not start the camera. Check permissions, or use manual entry.");
    }
  };

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch { /* already stopped */ }
    setScanning(false);
  }, []);

  // Always release the camera on unmount
  useEffect(() => () => { stopScanner(); }, [stopScanner]);

  const banner = () => {
    if (!result) return null;
    const map = {
      ok:             { cls: "success", icon: "mdi:check-circle", title: result.message },
      duplicate:      { cls: "danger",  icon: "mdi:alert-circle", title: result.message },
      invalid:        { cls: "danger",  icon: "mdi:close-circle", title: result.message },
      not_accredited: { cls: "warning", icon: "mdi:alert",        title: result.message },
    };
    const m = map[result.result] || map.invalid;
    const p = result.data;

    return (
      <div className={`alert alert-${m.cls} d-flex align-items-center gap-3 mt-3`}>
        <Icon icon={m.icon} width={40} />
        <div className="flex-grow-1">
          <div className="fw-bold">{m.title}</div>
          {p && (
            <div className="mt-1">
              <span className="fw-bold fs-5">{p.fullName}</span>
              <div className="text-sm">{p.referenceId} · {p.lga}</div>
            </div>
          )}
          {result.scanned_at && (
            <div className="text-sm mt-1">Previously scanned: {new Date(result.scanned_at).toLocaleString("en-GB")}</div>
          )}
        </div>
        <button className="btn btn-sm btn-light" onClick={() => setResult(null)}>Next</button>
      </div>
    );
  };

  const sessionList = sessions?.[type] || {};

  return (
    <div className="col-lg-12">
      <Toaster position="top-right" />

      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Meal &amp; Attendance Scanner</h5>
        </div>

        <div className="card-body">
          {/* Controls */}
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-4">
              <label className="form-label">Scan for</label>
              <div className="btn-group w-100">
                <button className={`btn ${type === "meal" ? "btn-success" : "btn-outline-success"}`} onClick={() => { setType("meal"); setResult(null); }} disabled={scanning}>
                  <Icon icon="mdi:food" className="me-1" /> Meal
                </button>
                <button className={`btn ${type === "attendance" ? "btn-success" : "btn-outline-success"}`} onClick={() => { setType("attendance"); setResult(null); }} disabled={scanning}>
                  <Icon icon="mdi:clipboard-check-outline" className="me-1" /> Attendance
                </button>
              </div>
            </div>

            <div className="col-12 col-md-5">
              <label className="form-label">Session</label>
              <select className="form-select" value={session} onChange={(e) => { setSession(e.target.value); setResult(null); }} disabled={scanning}>
                {Object.keys(sessionList).length === 0 && <option value="">No sessions configured</option>}
                {Object.entries(sessionList).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3 d-flex align-items-end">
              <div className="w-100 text-center border rounded p-2">
                <div className="fw-bold fs-5">{count ?? 0}</div>
                <div className="text-secondary" style={{ fontSize: "0.72rem" }}>scanned this session</div>
              </div>
            </div>
          </div>

          {/* Camera */}
          <div className="text-center">
            <div id={SCANNER_ID} className="mx-auto rounded" style={{ width: "100%", maxWidth: 380, minHeight: scanning ? 300 : 0 }} />

            {!scanning ? (
              <button className="btn btn-success btn-lg mt-3 d-inline-flex align-items-center gap-2" onClick={startScanner} disabled={!session}>
                <Icon icon="mdi:qrcode-scan" /> Start scanning
              </button>
            ) : (
              <button className="btn btn-outline-danger mt-3 d-inline-flex align-items-center gap-2" onClick={stopScanner}>
                <Icon icon="mdi:stop-circle-outline" /> Stop camera
              </button>
            )}
          </div>

          {banner()}

          {/* Manual fallback — for a damaged/unreadable badge */}
          <hr className="my-4" />
          <label className="form-label">Badge code (manual entry)</label>
          <div className="input-group">
            <input
              className="form-control"
              placeholder="Type the badge code if the QR won't scan"
              value={manual}
              onChange={(e) => setManual(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === "Enter") { submitToken(manual.trim()); setManual(""); } }}
            />
            <button className="btn btn-success" onClick={() => { submitToken(manual.trim()); setManual(""); }} disabled={!manual.trim() || busy}>
              Submit
            </button>
          </div>
          <small className="text-secondary">Tip: keep the camera running and scan badges back-to-back — each result appears above.</small>
        </div>
      </div>
    </div>
  );
};

export default GoTractScanner;
"use client";
import { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Icon } from "@iconify/react/dist/iconify.js";
import { QRCodeCanvas } from "qrcode.react";
import api from "../../lib/api";

/* ------------------------------------------------------------------ */
/*  GoTRACT — Blank Badge Generator (pre-printing)                     */
/*  Generate a pool of anonymous QR badges, print them, and cut them   */
/*  up. Each badge carries a SERIAL (printed) + token (in the QR).     */
/*  They mean nothing until assigned to a participant at the desk.     */
/*    POST /gotract/badges/generate  { count, batch }                  */
/*    GET  /gotract/badges/sheet?batch=&include_assigned=              */
/*    GET  /gotract/badges/batches                                     */
/*    GET  /gotract/badges/stats                                       */
/* ------------------------------------------------------------------ */

const GoTractBadgeGenerator = () => {
  const [count, setCount] = useState(500);
  const [batch, setBatch] = useState("");
  const [badges, setBadges] = useState([]);
  const [batches, setBatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([
        api.get("/gotract/badges/stats"),
        api.get("/gotract/badges/batches"),
      ]);
      setStats(s.data?.data || null);
      setBatches(b.data?.data || []);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const generate = async () => {
    if (!count || count < 1) return toast.error("Enter how many badges to print.");
    setGenerating(true);
    try {
      const r = await api.post("/gotract/badges/generate", { count: Number(count), batch: batch || undefined });
      const list = r.data?.data || [];
      setBadges(list);
      toast.success(`${list.length} badges generated. Ready to print.`);
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not generate badges.");
    } finally {
      setGenerating(false);
    }
  };

  const loadSheet = async (batchName, includeAssigned = false) => {
    setLoading(true);
    try {
      const r = await api.get("/gotract/badges/sheet", {
        params: { batch: batchName || undefined, include_assigned: includeAssigned ? 1 : 0, limit: 2000 },
      });
      const list = r.data?.data || [];
      setBadges(list);
      if (!list.length) toast("No unassigned badges in that batch.");
    } catch {
      toast.error("Could not load badges.");
    } finally {
      setLoading(false);
    }
  };

  // CSV of serial+token — useful as a backup / for an external print house.
  const downloadCsv = () => {
    if (!badges.length) return;
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      ["Serial", "Token", "Batch"].map(esc).join(","),
      ...badges.map((b) => [b.serial, b.token, b.batch].map(esc).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `gotract-badges-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="col-lg-12">
      <Toaster position="top-right" />

      {/* Stats */}
      <div className="row g-3 mb-4 no-print">
        {[
          { label: "Badges printed", value: stats?.total, icon: "mdi:qrcode", color: "primary" },
          { label: "Assigned", value: stats?.assigned, icon: "mdi:account-check-outline", color: "success" },
          { label: "Blank / available", value: stats?.unassigned, icon: "mdi:tray-full", color: "warning" },
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

      {/* Generate */}
      <div className="card mb-4 no-print">
        <div className="card-header">
          <h5 className="card-title mb-0">Pre-print Blank QR Badges</h5>
        </div>
        <div className="card-body">
          <p className="text-secondary text-sm">
            Generate a pool of anonymous badges and print them before participants arrive.
            Each badge shows a <strong>serial</strong> under the QR. At the desk you'll search the
            participant, accredit them, then type that serial to bind the badge to them.
          </p>

          <div className="row g-3 align-items-end">
            <div className="col-6 col-md-3">
              <label className="form-label">How many?</label>
              <input type="number" min="1" max="2000" className="form-control" value={count} onChange={(e) => setCount(e.target.value)} />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label">Batch label <span className="text-secondary">(optional)</span></label>
              <input className="form-control" value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="e.g. akko-day1" />
            </div>
            <div className="col-12 col-md-6 d-flex gap-2">
              <button className="btn btn-success d-inline-flex align-items-center gap-1" onClick={generate} disabled={generating}>
                {generating
                  ? <><span className="spinner-border spinner-border-sm"></span>Generating…</>
                  : <><Icon icon="mdi:plus-box-outline" /> Generate badges</>}
              </button>
              {badges.length > 0 && (
                <>
                  <button className="btn btn-success d-inline-flex align-items-center gap-1" onClick={() => window.print()}>
                    <Icon icon="mdi:printer" /> Print {badges.length} badges
                  </button>
                  <button className="btn btn-outline-secondary d-inline-flex align-items-center gap-1" onClick={downloadCsv}>
                    <Icon icon="mdi:tray-arrow-down" /> CSV
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Reprint an existing batch */}
          {batches.length > 0 && (
            <>
              <hr className="my-4" />
              <h6 className="fw-bold mb-2">Reprint an existing batch</h6>
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead><tr><th>Batch</th><th>Total</th><th>Still blank</th><th className="text-end">Action</th></tr></thead>
                  <tbody>
                    {batches.map((b) => (
                      <tr key={b.batch}>
                        <td className="fw-medium">{b.batch || "—"}</td>
                        <td>{b.total}</td>
                        <td>{b.unassigned}</td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-success" onClick={() => loadSheet(b.batch)} disabled={loading}>
                            Load blanks
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Print sheet */}
      {badges.length > 0 && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center no-print">
            <h5 className="card-title mb-0">Print preview — {badges.length} badges</h5>
            <button className="btn btn-success d-inline-flex align-items-center gap-1" onClick={() => window.print()}>
              <Icon icon="mdi:printer" /> Print
            </button>
          </div>
          <div className="card-body">
            <div id="badge-sheet" className="badge-grid">
              {badges.map((b) => (
                <div className="badge-cell" key={b.serial}>
                  <div className="badge-title">GoTRACT</div>
                  <QRCodeCanvas value={b.token} size={110} level="M" includeMargin={false} />
                  <div className="badge-serial">{b.serial}</div>
                  <div className="badge-note">Meals &amp; Attendance</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .badge-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 10px;
        }
        .badge-cell {
          border: 1px dashed #94a3b8;
          border-radius: 8px;
          padding: 10px 6px;
          text-align: center;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .badge-title { font-size: 10px; font-weight: 700; color: #15803d; letter-spacing: 1px; }
        .badge-serial { font-weight: 700; font-size: 15px; letter-spacing: 1px; margin-top: 4px; }
        .badge-note { font-size: 8px; color: #64748b; }

        @media print {
          @page { size: A4; margin: 8mm; }
          body * { visibility: hidden !important; }
          #badge-sheet, #badge-sheet * { visibility: visible !important; }
          #badge-sheet {
            position: absolute; left: 0; top: 0; width: 100%;
            grid-template-columns: repeat(4, 1fr); /* 4 across on A4 */
          }
          .no-print, .card-header { display: none !important; }
          .card { border: 0 !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default GoTractBadgeGenerator;
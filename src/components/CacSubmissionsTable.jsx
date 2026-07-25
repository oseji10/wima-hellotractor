"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import toast, { Toaster } from "react-hot-toast";
import api from "../../lib/api";

const STATUS_BADGE = {
  submitted: { cls: "bg-warning-light text-warning-600", label: "Awaiting review" },
  approved: { cls: "bg-success-light text-success-600", label: "Approved" },
  rejected: { cls: "bg-danger-light text-danger-600", label: "Rejected" },
  needs_revision: { cls: "bg-info-light text-info-600", label: "Needs revision" },
};

const CacSubmissionsTable = () => {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState("approved");
//   const [approvedName, setApprovedName] = useState("1");
  const [approvedName, setApprovedName] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchRows = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get("/msps/cac-submissions", {
        params: { page, per_page: pagination.per_page, status: status || undefined, search: search || undefined },
      });
      const d = res.data;
      setRows(d.data || []);
      setPagination({ current_page: d.current_page, last_page: d.last_page, per_page: d.per_page, total: d.total });
    } catch {
      toast.error("Couldn't load CAC submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRows(1); }, [status, search]);

const openDetail = async (row) => {
  setDetailLoading(true);
  setDetail(null);
  setReviewOpen(false);
  try {
    const res = await api.get(`/msps/cac-submissions/${row.id}`);
    const d = res.data.data;
    setDetail(d);
    setReviewStatus(d.cac_status === "submitted" ? "" : d.cac_status || "");
    setApprovedName(d.cac_approved_name ? String(d.cac_approved_name) : "");
    setAdminNote(d.cac_admin_note || "");
  } catch {
    toast.error("Couldn't load submission details.");
  } finally {
    setDetailLoading(false);
  }
};

const saveReview = async () => {
  if (!reviewStatus) { toast.error("Select a decision first."); return; }
  if (reviewStatus === "approved" && !approvedName) { toast.error("Tick which name is approved."); return; }
  setSaving(true);
  try {
    await api.patch(`/msps/cac-submissions/${detail.id}/status`, {
      status: reviewStatus,
      approvedName: reviewStatus === "approved" ? Number(approvedName) : null,
      adminNote,
    });
    toast.success("Submission updated.");
    setDetail(null);
    fetchRows(pagination.current_page);
  } catch (e) {
    toast.error(e?.response?.data?.message || "Update failed.");
  } finally {
    setSaving(false);
  }
};

  const proposedNames = (row) => [row.cac_business_name_1, row.cac_business_name_2, row.cac_business_name_3].filter(Boolean);


  const [exporting, setExporting] = useState(false);

const handleExport = async () => {
  setExporting(true);
  try {
    const res = await api.get("/msps/cac-submissions/export", {
      params: { status: status || undefined, search: search || undefined },
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `cac-submissions-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    toast.error("Export failed.");
  } finally {
    setExporting(false);
  }
};

  return (
    <div className="col-lg-12">
      <Toaster position="top-right" />
      <div className="card">
        <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <div>
            <h5 className="card-title mb-1">CAC Name Submissions</h5>
            <p className="text-secondary text-sm mb-0">Review proposed business names and file status for MSP CAC onboarding.</p>
          </div>
            <div className="d-flex gap-2">
  <button className="btn btn-outline-success d-inline-flex align-items-center gap-1" onClick={handleExport} disabled={exporting}>
    <Icon icon="mdi:file-excel-outline" /> {exporting ? "Exporting…" : "Export to Excel"}
  </button>
  <button className="btn btn-outline-secondary d-inline-flex align-items-center gap-1" onClick={() => router.push("/dashboard/msps")}>
    <Icon icon="mdi:arrow-left" /> Back to MSPs
  </button>
</div>
        </div>



        <div className="card-body">
          <div className="row mb-4 g-3">
            <div className="col-12 col-md-4">
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                <option value="submitted">Awaiting review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="needs_revision">Needs revision</option>
              </select>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">Search</label>
              <input className="form-control" placeholder="Name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading…</span></div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table border-primary-table mb-0">
                <thead>
  <tr>
    <th>MSP ID</th>
    <th>MSP</th>
    <th>Phone</th>
    <th>Cohort</th>
    <th>Proposed names</th>
    <th>Status</th>
    <th>Submitted</th>
    <th></th>
  </tr>
</thead>
<tbody>
  {rows.length ? rows.map((row) => {
    const badge = STATUS_BADGE[row.cac_status] || STATUS_BADGE.submitted;
    return (
      <tr key={row.id}>
        <td>{row.mspId || "N/A"}</td>
        <td>{`${row.users?.firstName || ""} ${row.users?.lastName || ""}`}</td>
        <td>{row.alternatePhoneNumber || row.users?.phoneNumber || "N/A"}</td>
        <td>{row.cac_cohort || "N/A"}</td>
        <td>
          {proposedNames(row).length ? (
            <div className="d-flex flex-column">
              {proposedNames(row).map((n, i) => (
                <span key={i} className={row.cac_approved_name === i + 1 ? "fw-medium text-success-600" : ""}>
                  {i + 1}. {n}
                </span>
              ))}
            </div>
          ) : "N/A"}
        </td>
        <td><span className={`badge rounded-pill px-2 py-1 ${badge.cls}`}>{badge.label}</span></td>
        <td>{row.cac_submitted_at ? new Date(row.cac_submitted_at).toLocaleDateString() : "N/A"}</td>
        <td>
          <button className="btn btn-sm btn-outline-primary" onClick={() => openDetail(row)}>Review</button>
        </td>
      </tr>
    );
  }) : (
    <tr><td colSpan="8" className="text-center py-4">No CAC submissions found.</td></tr>
  )}
</tbody>
              </table>
            </div>
          )}

          {pagination.last_page > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-secondary text-sm">
                Showing {(pagination.current_page - 1) * pagination.per_page + 1}–
                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total}
              </span>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-secondary" disabled={pagination.current_page === 1} onClick={() => fetchRows(pagination.current_page - 1)}>Previous</button>
                <button className="btn btn-sm btn-outline-secondary" disabled={pagination.current_page === pagination.last_page} onClick={() => fetchRows(pagination.current_page + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail / review modal */}
      {(detailLoading || detail) && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">CAC Submission Review</h5>
                <button className="btn-close" onClick={() => setDetail(null)}></button>
              </div>
              <div className="modal-body">
                {detailLoading ? (
                  <div className="text-center py-4"><div className="spinner-border text-primary" role="status"></div></div>
                ) : (
                  <>
                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <label className="form-label">Applicant</label>
                        <p className="mb-0">{`${detail.users?.firstName || ""} ${detail.users?.lastName || ""}`}</p>
                      </div>
                      <div className="col-6">
                        <label className="form-label">Phone</label>
                        <p className="mb-0">{detail.alternatePhoneNumber || detail.users?.phoneNumber || "N/A"}</p>
                      </div>
                      <div className="col-6">
                        <label className="form-label">Business address</label>
                        <p className="mb-0">{detail.cac_business_address || "N/A"}</p>
                      </div>
                      <div className="col-6">
                        <label className="form-label">NIN</label>
                        <p className="mb-0">{detail.nin || "N/A"}</p>
                      </div>
                    </div>

<hr />
<h6 className="fw-bold mb-2">Proposed names — tick the one to approve</h6>
<div className="d-flex flex-column gap-2 mb-3">
  {[1, 2, 3].map((n) => detail[`cac_business_name_${n}`] && (
    <div className="form-check d-flex align-items-center" key={n}>
      <input
        type="radio"
        className="form-check-input mt-0 me-2"
        id={`approvedName-${n}`}
        name="approvedName"
        value={n}
        checked={approvedName === String(n)}
        onChange={() => { setApprovedName(String(n)); setReviewStatus("approved"); }}
      />
      <label className="form-check-label" htmlFor={`approvedName-${n}`}>
        {detail[`cac_business_name_${n}`]}
      </label>
    </div>
  ))}
</div>

                    <hr />
                    <h6 className="fw-bold mb-2">Documents</h6>
                    <div className="row g-2 mb-3">
                      {["validIdUrl", "passportUrl", "signatureUrl"].map((key) => detail[key] && (
                        <div className="col-4" key={key}>
                          <a href={detail[key]} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary w-100 d-inline-flex align-items-center justify-content-center gap-1">
                            <Icon icon="mdi:file-eye-outline" />{key.replace("Url", "")}
                          </a>
                        </div>
                      ))}
                    </div>

                    <hr />
                    <h6 className="fw-bold mb-2">Decision</h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>
  <option value="" disabled>Select a decision</option>
  <option value="approved">Approved</option>
  <option value="rejected">Rejected</option>
  <option value="needs_revision">Needs revision</option>
</select>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Note to applicant / internal note</label>
                        <textarea className="form-control" rows={2} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button>
                <button className="btn btn-primary" onClick={saveReview} disabled={saving || detailLoading}>
                  {saving ? "Saving…" : "Save decision"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CacSubmissionsTable;
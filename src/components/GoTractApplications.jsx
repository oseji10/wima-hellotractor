"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

/* ------------------------------------------------------------------ */
/*  GoTRACT — Applications management table                            */
/*  Mirrors the MSP table styling. Reads the admin endpoints:          */
/*    GET   /gotract/applications      (list, filters + pagination)    */
/*    PATCH /gotract/applications/:id/status                           */
/*    GET   /gotract/stats                                             */
/* ------------------------------------------------------------------ */

const GOMBE_LGAS = [
  "Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Gombe",
  "Kaltungo", "Kwami", "Nafada", "Shongom", "Yamaltu/Deba",
];

const STATUS_META = {
  pending:   { label: "Pending",   cls: "bg-warning text-dark" },
  screening: { label: "Screening", cls: "bg-info text-dark" },
  approved:  { label: "Approved",  cls: "bg-success" },
  rejected:  { label: "Rejected",  cls: "bg-danger" },
};
const STATUSES = Object.keys(STATUS_META);

const LGA_PER_PAGE = 6;

const SERVICE_LABELS = {
  ploughing: "Ploughing", planting: "Planting", harvesting: "Harvesting",
  harrowing: "Harrowing", tilling: "Tilling", threshing: "Threshing",
  "water-pumping": "Water Pumping", other: "Other",
};
const TRAINING_LABELS = {
  "mechanization-operation": "Mechanization Equipment Operation",
  "business-financial": "Business & Financial Management",
  "group-leadership": "Group Dynamics & Leadership",
  other: "Other",
};

const badge = (status) => {
  const meta = STATUS_META[status] || { label: status || "N/A", cls: "bg-secondary" };
  return <span className={`badge ${meta.cls} rounded-pill px-3 py-2 fw-medium`}>{meta.label}</span>;
};

const SCORE_BAND_CLS = { High: "bg-success", Medium: "bg-warning text-dark", Low: "bg-secondary" };
const scoreBadge = (app) => {
  const cls = SCORE_BAND_CLS[app?.score_band] || "bg-secondary";
  return (
    <span className={`badge ${cls} rounded-pill px-3 py-2 fw-bold`} title={`${app?.score_band || ""} suitability`}>
      {app?.score ?? "—"}
    </span>
  );
};

const yesNo = (v) => (v === true || v === 1 || v === "1" ? "Yes" : v === false || v === 0 || v === "0" ? "No" : "N/A");

const fmtDate = (v) => {
  if (!v) return "N/A";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const labelList = (arr, map) =>
  Array.isArray(arr) && arr.length ? arr.map((id) => map[id] || id).join(", ") : "None";

/* Small presentational helper for the view modal */
const Detail = ({ label, value }) => (
  <div className="col-12 col-md-6 mb-3">
    <label className="form-label text-secondary mb-1 text-sm">{label}</label>
    <p className="form-control-static mb-0 fw-medium">{value ?? "N/A"}</p>
  </div>
);

const StatCard = ({ icon, label, value, color }) => (
  <div className="col-sm-6 col-lg-4">
    <div className="card h-100 shadow-none border">
      <div className="card-body d-flex align-items-center gap-3">
        <span
          className={`bg-${color}-light text-${color}-600 rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0`}
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

const GoTractApplicationsTable = () => {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [selectedLga, setSelectedLga] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatusValue, setBulkStatusValue] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [lgaPage, setLgaPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset to first page whenever a filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedLga, selectedStatus, debouncedSearch, perPage]);

  // Selection is scoped to the current page; clear it when the list changes
  useEffect(() => {
    setSelectedIds([]);
  }, [page, perPage, selectedLga, selectedStatus, debouncedSearch]);

  // Fetch stats once
  const fetchStats = async () => {
    try {
      const res = await api.get("/gotract/stats");
      setStats(res.data?.data || null);
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };
  useEffect(() => {
    fetchStats();
  }, []);

  // Who's logged in? Government officials get read-only access.
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/user");
        setUserRole(res.data?.role ?? null);
      } catch (e) {
        console.error("Error fetching user role:", e);
      }
    };
    fetchUser();
  }, []);

  // Keep the LGA analysis on a valid page when the data refreshes
  useEffect(() => {
    setLgaPage(1);
  }, [stats]);

  // Fetch applications on filter / page changes
  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { page, per_page: perPage };
        if (selectedLga) params.lga = selectedLga;
        if (selectedStatus) params.status = selectedStatus;
        if (debouncedSearch) params.search = debouncedSearch;

        const res = await api.get("/gotract/applications", { params });
        const data = res.data;
        setApplications(Array.isArray(data.data) ? data.data : []);
        setTotalPages(data.last_page || 1);
        setTotal(data.total || 0);
      } catch (e) {
        console.error("Error fetching applications:", e);
        setError("Failed to load applications.");
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [page, perPage, selectedLga, selectedStatus, debouncedSearch]);

  const handleView = (app) => {
    setSelected(app);
    setViewModalOpen(true);
  };

  const handleOpenStatus = (app) => {
    setSelected(app);
    setNewStatus(app.status || "pending");
    setError(null);
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.patch(`/gotract/applications/${selected.id}/status`, { status: newStatus });
      if (res.status >= 200 && res.status < 300) {
        setApplications((prev) => prev.map((a) => (a.id === selected.id ? { ...a, status: newStatus } : a)));
        setStatusModalOpen(false);
        fetchStats();
      } else {
        throw new Error(res.data?.message || "Failed to update status");
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedLga("");
    setSelectedStatus("");
    setSearchTerm("");
  };

  const toggleSelect = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const allOnPageSelected = applications.length > 0 && applications.every((a) => selectedIds.includes(a.id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !applications.some((a) => a.id === id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...applications.map((a) => a.id)])));
    }
  };

  const handleBulkApply = async () => {
    if (!bulkStatusValue || selectedIds.length === 0) return;
    setBulkSubmitting(true);
    setError(null);
    try {
      const res = await api.patch("/gotract/applications/bulk-status", {
        ids: selectedIds,
        status: bulkStatusValue,
      });
      if (res.status >= 200 && res.status < 300) {
        setApplications((prev) =>
          prev.map((a) => (selectedIds.includes(a.id) ? { ...a, status: bulkStatusValue } : a))
        );
        setSelectedIds([]);
        setBulkStatusValue("");
        fetchStats();
      } else {
        throw new Error(res.data?.message || "Bulk update failed");
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Bulk update failed");
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsSubmitting(true);
      const params = { per_page: 10000, page: 1 };
      if (selectedLga) params.lga = selectedLga;
      if (selectedStatus) params.status = selectedStatus;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await api.get("/gotract/applications", { params });
      const rows = Array.isArray(res.data?.data) ? res.data.data : [];

      const headers = [
        "Reference", "Full Name", "Phone", "Gender", "Age", "LGA", "Community",
        "NIN", "Occupation", "Services", "Training", "Status", "Submitted",
      ];
      const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const lines = rows.map((a) =>
        [
          a.reference_id, a.full_name, a.phone_number, a.gender, a.age, a.lga, a.village,
          a.national_id, a.primary_occupation,
          labelList(a.preferred_services, SERVICE_LABELS),
          labelList(a.training_areas, TRAINING_LABELS),
          a.status, fmtDate(a.submitted_at),
        ].map(esc).join(",")
      );
      const csv = [headers.map(esc).join(","), ...lines].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gotract-applications-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("Failed to export applications.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  const byStatus = stats?.byStatus || {};
  const num = (v) => Number(v || 0);

  // Government officials can view/export but cannot approve or change status.
  const canManage = userRole !== "GOTRACT PARTNER";

  const lgaRows = stats?.lgas || [];
  const lgaTotalPages = Math.max(1, Math.ceil(lgaRows.length / LGA_PER_PAGE));
  const pagedLgas = lgaRows.slice((lgaPage - 1) * LGA_PER_PAGE, lgaPage * LGA_PER_PAGE);

  return (
    <div className="col-lg-12">
      {/* Stats cards */}
      <div className="row g-3 mb-4">
        <StatCard icon="mdi:file-document-multiple-outline" label="Total Applications" value={num(stats?.total)} color="primary" />
        <StatCard icon="mdi:clock-outline" label="Pending" value={num(byStatus.pending) + num(byStatus.screening)} color="warning" />
        <StatCard icon="mdi:check-decagram-outline" label="Approved" value={num(byStatus.approved)} color="success" />
      </div>

      {/* Approvals by LGA analysis */}
      <div className="card mb-4">
        <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <h5 className="card-title mb-2 mb-md-0">Approvals by LGA</h5>
          <span className="text-secondary text-sm">Target: {stats?.targetPerLga || 40} per LGA</span>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead>
                <tr>
                  <th scope="col">SN</th>
                  <th scope="col">LGA</th>
                  <th scope="col">Applications Received</th>
                  <th scope="col">Approved</th>
                  <th scope="col" style={{ minWidth: 200 }}>Progress to target</th>
                </tr>
              </thead>
              <tbody>
                {pagedLgas.length > 0 ? (
                  pagedLgas.map((row, i) => {
                    const target = row.target || stats?.targetPerLga || 40;
                    const pct = target ? Math.min(100, Math.round((num(row.total) / target) * 100)) : 0;
                    return (
                      <tr key={row.lga}>
                        <td>{(lgaPage - 1) * LGA_PER_PAGE + i + 1}</td>
                        <td className="fw-medium">{row.lga}</td>
                        <td>{num(row.total)}</td>
                        <td><span className="fw-bold text-primary-600">{num(row.approved)}</span></td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: 8, minWidth: 120 }}>
                              <div
                                className={`progress-bar ${pct >= 100 ? "bg-success" : "bg-primary"}`}
                                role="progressbar"
                                style={{ width: `${pct}%` }}
                                aria-valuenow={pct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              />
                            </div>
                            <span className="text-sm text-secondary" style={{ width: 44 }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">No approval data yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {lgaTotalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
              <span className="text-secondary text-sm">
                Showing {(lgaPage - 1) * LGA_PER_PAGE + 1} to {Math.min(lgaPage * LGA_PER_PAGE, lgaRows.length)} of {lgaRows.length} LGAs
              </span>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${lgaPage === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setLgaPage((p) => Math.max(1, p - 1))}>Previous</button>
                  </li>
                  {Array.from({ length: lgaTotalPages }, (_, i) => i + 1).map((n) => (
                    <li key={n} className={`page-item ${lgaPage === n ? "active" : ""}`}>
                      <button className="page-link" onClick={() => setLgaPage(n)}>{n}</button>
                    </li>
                  ))}
                  <li className={`page-item ${lgaPage === lgaTotalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setLgaPage((p) => Math.min(lgaTotalPages, p + 1))}>Next</button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <h5 className="card-title mb-3 mb-md-0">GoTRACT Applications</h5>
          <button className="btn btn-outline-primary" onClick={handleExport} disabled={loading || isSubmitting}>
            <Icon icon="mdi:tray-arrow-down" className="me-1" />
            Export CSV
          </button>
        </div>

        <div className="card-body">
          {/* Filters */}
          <div className="row mb-4 g-3">
            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="lgaFilter" className="form-label">Filter by LGA</label>
              <select
                id="lgaFilter"
                className="form-select"
                value={selectedLga}
                onChange={(e) => setSelectedLga(e.target.value)}
              >
                <option value="">All LGAs</option>
                {GOMBE_LGAS.map((lga) => (
                  <option key={lga} value={lga}>{lga}</option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="statusFilter" className="form-label">Filter by Status</label>
              <select
                id="statusFilter"
                className="form-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-4">
              <label htmlFor="searchApp" className="form-label">Search by name, phone, NIN or reference</label>
              <div className="input-group">
                <input
                  type="text"
                  id="searchApp"
                  className="form-control"
                  placeholder="Enter name, phone, NIN or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-outline-secondary" type="button">
                  <Icon icon="ion:search" />
                </button>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-2 d-flex align-items-end">
              <button
                className="btn btn-secondary w-100"
                onClick={handleReset}
                disabled={!selectedLga && !selectedStatus && !searchTerm}
              >
                Reset Filters
              </button>
            </div>
          </div>

          {error && !loading && !statusModalOpen && (
            <div className="alert alert-danger">{error}</div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              {canManage && selectedIds.length > 0 && (
                <div className="d-flex flex-wrap align-items-center gap-2 p-3 mb-3 bg-primary-light rounded">
                  <span className="fw-medium me-1">{selectedIds.length} selected</span>
                  <select
                    className="form-select form-select-sm w-auto"
                    value={bulkStatusValue}
                    onChange={(e) => setBulkStatusValue(e.target.value)}
                    disabled={bulkSubmitting}
                  >
                    <option value="">Set status to…</option>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_META[s].label}</option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleBulkApply}
                    disabled={!bulkStatusValue || bulkSubmitting}
                  >
                    {bulkSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Applying…
                      </>
                    ) : (
                      "Apply"
                    )}
                  </button>
                  <button
                    className="btn btn-sm btn-link text-secondary text-decoration-none"
                    onClick={() => setSelectedIds([])}
                    disabled={bulkSubmitting}
                  >
                    Clear
                  </button>
                </div>
              )}
              <div className="table-responsive">
                <table className="table border-primary-table mb-0">
                  <thead>
                    <tr>
                      {canManage && (
                        <th scope="col" style={{ width: 36 }}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={allOnPageSelected}
                            onChange={toggleSelectAll}
                            title="Select all on this page"
                          />
                        </th>
                      )}
                      <th scope="col">SN</th>
                      <th scope="col">Reference</th>
                      <th scope="col">Name</th>
                      <th scope="col">Phone</th>
                      <th scope="col">LGA</th>
                      <th scope="col">Community</th>
                      <th scope="col">Submitted</th>
                      <th scope="col">Score</th>
                      <th scope="col">Status</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.length > 0 ? (
                      applications.map((app, index) => (
                        <tr key={app.id || index} className={canManage && selectedIds.includes(app.id) ? "table-active" : ""}>
                          {canManage && (
                            <td>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={selectedIds.includes(app.id)}
                                onChange={() => toggleSelect(app.id)}
                              />
                            </td>
                          )}
                          <td>{(page - 1) * perPage + index + 1}</td>
                          <td><span className="fw-medium text-primary-600">{app.reference_id || "N/A"}</span></td>
                          <td>{app.full_name || "N/A"}</td>
                          <td>{app.phone_number || "N/A"}</td>
                          <td>{app.lga || "N/A"}</td>
                          <td>{app.village || "N/A"}</td>
                          <td>{fmtDate(app.submitted_at)}</td>
                          <td>{scoreBadge(app)}</td>
                          <td>{badge(app.status)}</td>
                          <td>
                            <div className="d-flex">
                              <button
                                className="w-32-px h-32-px me-2 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleView(app)}
                                title="View"
                              >
                                <Icon icon="iconamoon:eye-light" width={16} />
                              </button>
                              {canManage && (
                                <button
                                  className="w-32-px h-32-px bg-success-light text-success-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                  onClick={() => handleOpenStatus(app)}
                                  title="Update status"
                                >
                                  <Icon icon="mdi:progress-check" width={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={canManage ? 11 : 10} className="text-center py-4">
                          No applications found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 gap-3">
                  <div className="d-flex align-items-center">
                    <span className="me-2">Show:</span>
                    <select
                      className="form-select form-select-sm w-auto"
                      value={perPage}
                      onChange={(e) => setPerPage(parseInt(e.target.value))}
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    <span className="ms-2">entries</span>
                  </div>

                  <div className="order-md-1">
                    <nav>
                      <ul className="pagination mb-0 flex-wrap justify-content-center">
                        <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => handlePageChange(page - 1)}>Previous</button>
                        </li>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) pageNum = i + 1;
                          else if (page <= 3) pageNum = i + 1;
                          else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                          else pageNum = page - 2 + i;
                          return (
                            <li key={pageNum} className={`page-item ${page === pageNum ? "active" : ""}`}>
                              <button className="page-link" onClick={() => handlePageChange(pageNum)}>{pageNum}</button>
                            </li>
                          );
                        })}
                        <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => handlePageChange(page + 1)}>Next</button>
                        </li>
                      </ul>
                    </nav>
                  </div>

                  <div className="text-center text-md-start">
                    Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} entries
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModalOpen && selected && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title mb-1">Application Details</h5>
                  <span className="text-secondary text-sm">{selected.reference_id}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {badge(selected.status)}
                  <button type="button" className="btn-close" onClick={() => setViewModalOpen(false)}></button>
                </div>
              </div>
              <div className="modal-body">
                {/* Suitability score */}
                <div className="d-flex align-items-center gap-3 mb-3 p-3 rounded bg-primary-light">
                  <div className="text-center" style={{ minWidth: 64 }}>
                    <div className="fw-bold" style={{ fontSize: "1.7rem", lineHeight: 1 }}>{selected.score ?? "—"}</div>
                    <div className="text-sm text-secondary">/ 100</div>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fw-bold">Suitability</span>
                      {scoreBadge(selected)}
                    </div>
                    <div className="progress" style={{ height: 8 }}>
                      <div
                        className={`progress-bar ${selected.score_band === "High" ? "bg-success" : selected.score_band === "Medium" ? "bg-warning" : "bg-secondary"}`}
                        role="progressbar"
                        style={{ width: `${selected.score || 0}%` }}
                        aria-valuenow={selected.score || 0}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                  </div>
                </div>

                {Array.isArray(selected.score_breakdown) && selected.score_breakdown.length > 0 && (
                  <div className="row g-2 mb-3">
                    {selected.score_breakdown.map((f) => (
                      <div key={f.label} className="col-12 col-md-6">
                        <div className="d-flex align-items-center justify-content-between px-3 py-2 border rounded">
                          <span className="text-sm">
                            <Icon
                              icon={f.points > 0 ? "mdi:check-circle" : "mdi:circle-outline"}
                              className={`me-1 ${f.points > 0 ? "text-success-600" : "text-secondary"}`}
                            />
                            {f.label}
                          </span>
                          <span className="fw-medium text-sm">{f.points}/{f.max}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <hr />
                <h6 className="fw-bold text-primary-600 mb-3">Personal Information</h6>
                <div className="row">
                  <Detail label="Full Name" value={selected.full_name} />
                  <Detail label="Gender" value={selected.gender} />
                  <Detail label="Date of Birth" value={fmtDate(selected.date_of_birth)} />
                  <Detail label="Age" value={selected.age} />
                  <Detail label="Phone Number" value={selected.phone_number} />
                  <Detail label="Email" value={selected.email} />
                  <Detail label="State" value={selected.state} />
                  <Detail label="LGA" value={selected.lga} />
                  <Detail label="Village / Community" value={selected.village} />
                </div>

                <hr />
                <h6 className="fw-bold text-primary-600 mb-3">Identification &amp; Banking</h6>
                <div className="row">
                  <Detail label="National ID (NIN)" value={selected.national_id} />
                  <Detail label="BVN" value={selected.bvn} />
                  <Detail label="Account Number" value={selected.bank_account_number} />
                  <Detail label="Bank Name" value={selected.bank_name} />
                  <Detail label="Has Disability" value={yesNo(selected.has_disability)} />
                  <Detail label="Disability Type" value={selected.disability_type || (selected.has_disability ? "N/A" : "—")} />
                </div>

                <hr />
                <h6 className="fw-bold text-primary-600 mb-3">Demographic &amp; Economic</h6>
                <div className="row">
                  <Detail label="Marital Status" value={selected.marital_status} />
                  <Detail label="Primary Occupation" value={selected.primary_occupation} />
                  <Detail label="Crops Farmed" value={selected.crops_farmed} />
                  <Detail label="Household Size" value={selected.household_size} />
                  <Detail label="Dependents" value={selected.dependents} />
                  <Detail label="Land Area (ha)" value={selected.land_area} />
                  <Detail label="Land Ownership" value={selected.land_ownership} />
                </div>

                <hr />
                <h6 className="fw-bold text-primary-600 mb-3">Mechanization &amp; Financial</h6>
                <div className="row">
                  <Detail label="In Cooperative" value={yesNo(selected.in_cooperative)} />
                  <Detail label="Cooperative Name" value={selected.cooperative_name} />
                  <Detail label="Prior Mechanized Experience" value={yesNo(selected.prior_mech_experience)} />
                  <Detail label="Currently Employed" value={yesNo(selected.currently_employed)} />
                  <Detail label="Willing to Repay (20% equity)" value={yesNo(selected.willing_repayment)} />
                  <Detail label="Access to Credit / Savings" value={yesNo(selected.access_to_credit)} />
                  <div className="col-12 mb-3">
                    <label className="form-label text-secondary mb-1 text-sm">Preferred Services</label>
                    <div className="d-flex flex-wrap gap-2">
                      {Array.isArray(selected.preferred_services) && selected.preferred_services.length
                        ? selected.preferred_services.map((s) => (
                            <span key={s} className="badge bg-primary-light text-primary-600 rounded-pill px-3 py-2">
                              {SERVICE_LABELS[s] || s}
                            </span>
                          ))
                        : <span className="text-secondary">None</span>}
                    </div>
                  </div>
                </div>

                <hr />
                <h6 className="fw-bold text-primary-600 mb-3">Training &amp; Consent</h6>
                <div className="row">
                  <div className="col-12 mb-3">
                    <label className="form-label text-secondary mb-1 text-sm">Training Areas</label>
                    <div className="d-flex flex-wrap gap-2">
                      {Array.isArray(selected.training_areas) && selected.training_areas.length
                        ? selected.training_areas.map((t) => (
                            <span key={t} className="badge bg-success-light text-success-600 rounded-pill px-3 py-2">
                              {TRAINING_LABELS[t] || t}
                            </span>
                          ))
                        : <span className="text-secondary">None</span>}
                    </div>
                  </div>
                  <Detail label="Other Training" value={selected.training_other} />
                  <Detail label="Consent Given" value={yesNo(selected.consent)} />
                  <Detail label="Signature" value={selected.signature} />
                  <Detail label="Submitted" value={fmtDate(selected.submitted_at)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setViewModalOpen(false)}>Close</button>
                {canManage && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => { setViewModalOpen(false); handleOpenStatus(selected); }}
                  >
                    Update Status
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {statusModalOpen && selected && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Application Status</h5>
                <button type="button" className="btn-close" onClick={() => setStatusModalOpen(false)} disabled={isSubmitting}></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  <span className="text-secondary">Applicant:</span>{" "}
                  <strong>{selected.full_name}</strong>{" "}
                  <span className="text-secondary">({selected.reference_id})</span>
                </p>
                <div className="mb-3">
                  <label htmlFor="statusSelect" className="form-label">Status</label>
                  <select
                    id="statusSelect"
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    disabled={isSubmitting}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_META[s].label}</option>
                    ))}
                  </select>
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setStatusModalOpen(false)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleUpdateStatus} disabled={isSubmitting || newStatus === selected.status}>
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Status"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoTractApplicationsTable;
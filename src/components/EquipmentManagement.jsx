"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";
import "./asset-management.css";
import AssetDashboard from "./AssetDashboard";
import AssetDetailDrawer from "./AssetDetailDrawer";

/* ----------------------------- helpers ----------------------------- */
const naira = (v) =>
  v || v === 0 ? `₦${parseFloat(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A";
const statusTone = (s) => {
  const v = (s || "").toLowerCase();
  if (v === "active") return "green";
  if (v === "inactive") return "gray";
  if (v === "under maintenance") return "amber";
  return "blue";
};
const Pill = ({ tone = "gray", children }) => (
  <span className={`am-pill am-pill--${tone}`}><span className="dot" />{children}</span>
);

const STATUS_OPTIONS = ["Active", "Inactive", "Under Maintenance"];

const EquipmentManagement = () => {
  /* ---- reference data ---- */
  const [displayedEquipment, setDisplayedEquipment] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [owners, setOwners] = useState([]);
  const [activeHubs, setActiveHubs] = useState([]);

  /* ---- filters ---- */
  const [selectedState, setSelectedState] = useState("");
  const [selectedLga, setSelectedLga] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  /* ---- user ---- */
  const [userRole, setUserRole] = useState(null);
  const [userStateId, setUserStateId] = useState(null);
  const [userLgaId, setUserLgaId] = useState(null);

  /* ---- ui state ---- */
  const [activeTab, setActiveTab] = useState("assets");
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState(null);
  const [drawerEquipment, setDrawerEquipment] = useState(null);
  const [dashRefresh, setDashRefresh] = useState(0);

  /* ---- CRUD modal ---- */
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add"); // add | edit
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, perPage: 10, total: 0 });

  const isAdminish = userRole === "ADMIN" || userRole === "National Coordinator";
  const canManage = isAdminish || userRole === "State Coordinator" || userRole === "Community Lead";

  function emptyForm() {
    return {
      equipmentName: "", serialNumber: "", value: "", exactLocation: "",
      status: "", category: "", state: "", lga: "", owner: "",
    };
  }

  /* ---- fetch user ---- */
  useEffect(() => {
    api.get(`${process.env.NEXT_PUBLIC_API_URL}/user`).then((res) => {
      setUserRole(res.data.role);
      if (res.data.role === "State Coordinator" || res.data.role === "Community Lead") {
        setUserStateId(res.data.stateId || null);
        setUserLgaId(res.data.communityId || null);
        setSelectedState(res.data.stateId || "");
      }
    }).catch(() => setError("Failed to load user profile"));
  }, []);

  /* ---- fetch hubs / states ---- */
  useEffect(() => {
    api.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs/all-active-hubs`).then((res) => {
      const hubs = Array.isArray(res.data) ? res.data : [];
      setActiveHubs(hubs);
      const uniq = {};
      hubs.forEach((h) => {
        if (h.state_info?.stateId) uniq[h.state_info.stateId] = { id: h.state_info.stateId, name: h.state_info.stateName };
      });
      setStates(Object.values(uniq));
    }).catch(() => { setStates([]); setActiveHubs([]); });
  }, []);

  /* ---- categories ---- */
  useEffect(() => {
    setLoadingCategories(true);
    api.get(`${process.env.NEXT_PUBLIC_API_URL}/equipment/categories`).then((res) => {
      const data = Array.isArray(res.data) ? res.data : [];
      setCategories(data.map((c) => ({ id: c.categoryId, name: c.categoryName })));
    }).catch(() => setCategories([])).finally(() => setLoadingCategories(false));
  }, []);

  /* ---- owners ---- */
  useEffect(() => {
    api.get(`${process.env.NEXT_PUBLIC_API_URL}/users`).then((res) => {
      const data = res.data?.data;
      setOwners(Array.isArray(data) ? data.map((u) => ({ id: u.id, name: u.name })) : []);
    }).catch(() => setOwners([]));
  }, []);

  /* ---- derive LGAs from selected/effective state ---- */
  useEffect(() => {
    const effectiveStateId = selectedState || form.state || userStateId;
    if (!effectiveStateId) { setLgas([]); return; }
    const uniq = {};
    activeHubs
      .filter((h) => h.state_info?.stateId?.toString() === effectiveStateId.toString())
      .forEach((h) => {
        if (h.lga_info?.lgaId) uniq[h.lga_info.lgaId] = { id: h.lga_info.lgaId, name: h.lga_info.lgaName };
      });
    setLgas(Object.values(uniq));
  }, [selectedState, form.state, userStateId, activeHubs]);

  /* ---- fetch equipment ---- */
  const fetchEquipment = () => {
    setLoadingEquipment(true);
    const params = { page: pagination.currentPage, per_page: pagination.perPage };
    if (isAdminish) {
      if (selectedState) params.state = selectedState;
      if (selectedLga) params.lga = selectedLga;
    } else if (userRole === "State Coordinator") {
      if (userStateId) params.state = userStateId;
      if (selectedLga) params.lga = selectedLga;
    } else if (userRole === "Community Lead") {
      if (userStateId) params.state = userStateId;
      if (userLgaId) params.lga = userLgaId;
    }
    if (selectedCategory) params.equipmentCategory = selectedCategory;
    if (searchTerm) params.search = searchTerm;

    api.get(`${process.env.NEXT_PUBLIC_API_URL}/equipment`, { params }).then((res) => {
      const data = res.data;
      setDisplayedEquipment(Array.isArray(data.data) ? data.data : []);
      setPagination((p) => ({ ...p, totalPages: data.last_page || 1, total: data.total || 0 }));
    }).catch(() => { setError("Failed to load equipment"); setDisplayedEquipment([]); })
      .finally(() => setLoadingEquipment(false));
  };

  useEffect(() => {
    if (userRole) fetchEquipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage, pagination.perPage, selectedState, selectedLga, selectedCategory, searchTerm, userRole, userStateId, userLgaId]);

  useEffect(() => {
    setPagination((p) => ({ ...p, currentPage: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, selectedLga, selectedCategory, searchTerm]);

  /* ---- CRUD ---- */
  const openAdd = () => {
    setFormMode("add");
    setSelectedEquipment(null);
    const f = emptyForm();
    if (!isAdminish) { f.state = userStateId || ""; }
    if (userRole === "Community Lead") { f.lga = userLgaId || ""; }
    setForm(f);
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (eq) => {
    setFormMode("edit");
    setSelectedEquipment(eq);
    setForm({
      equipmentName: eq.equipmentName || "",
      serialNumber: eq.serialNumber || "",
      value: eq.value || "",
      exactLocation: eq.exact_location || "",
      status: eq.status || "",
      category: eq.equipmentCategory || eq.category?.categoryId || "",
      state: eq.hub?.state || eq.hubs?.state || userStateId || "",
      lga: eq.hub || eq.hubs?.lga || userLgaId || "",
      owner: eq.owner?.id || eq.owner || "",
    });
    setError(null);
    setFormOpen(true);
  };

  const validateForm = () => {
    if (!form.equipmentName || !form.serialNumber) return "Equipment Name and Serial Number are required";
    if (!/^\d+(\.\d{1,2})?$/.test(form.value) || parseFloat(form.value) <= 0) return "Enter a valid positive value (e.g. 1000.00)";
    if (isAdminish && (!form.state || !form.lga || !form.category)) return "Select state, hub and category";
    if (userRole === "State Coordinator" && (!form.lga || !form.category)) return "Select hub and category";
    if (userRole === "Community Lead" && !form.category) return "Select category";
    if (userRole === "Community Lead" && !userLgaId) return "Hub not assigned to your profile. Contact support.";
    return null;
  };

  const submitForm = async (e) => {
    e.preventDefault();
    const v = validateForm();
    if (v) { setError(v); return; }
    setIsSubmitting(true);
    setError(null);

    const hub = userRole === "Community Lead" ? userLgaId : form.lga;
    const payload = {
      equipmentName: form.equipmentName,
      serialNumber: form.serialNumber,
      value: parseFloat(form.value),
      equipmentCategory: form.category,
      owner: form.owner || null,
      exact_location: form.exactLocation,
      status: form.status,
      hub,
    };

    try {
      if (formMode === "add") {
        await api.post("/equipment", payload);
      } else {
        await api.put(`/equipment/${selectedEquipment.equipmentId}`, payload);
      }
      setFormOpen(false);
      setForm(emptyForm());
      fetchEquipment();
      setDashRefresh((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save equipment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setIsSubmitting(true);
    try {
      await api.delete(`/equipment/${deleteTarget.equipmentId}`);
      setDeleteTarget(null);
      fetchEquipment();
      setDashRefresh((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete equipment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDrawerById = (id) => {
    const found = displayedEquipment.find((e) => String(e.equipmentId) === String(id));
    if (found) setDrawerEquipment(found);
    else api.get(`/equipment/${id}/overview`).then((r) => setDrawerEquipment(r.data.equipment)).catch(() => {});
  };

  const resetFilters = () => {
    if (isAdminish) setSelectedState("");
    setSelectedLga(""); setSelectedCategory(""); setSearchTerm("");
  };

  /* ------------------------------- render ------------------------------- */
  return (
    <div className="col-lg-12">
      <div className="am-page-head">
        <div>
          <h4>Equipment & Asset Management</h4>
          <div className="am-sub">Lifecycle, deployment, utilization, maintenance and compliance in one place.</div>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={openAdd} disabled={userRole === "Community Lead" && !userLgaId}>
            <Icon icon="solar:add-circle-bold" width={18} className="me-1" style={{ verticalAlign: "-3px" }} />
            Add Equipment
          </button>
        )}
      </div>

      <AssetDashboard onOpenAsset={openDrawerById} refreshKey={dashRefresh} />

      <div className="am-tabs">
        <button className={`am-tab ${activeTab === "assets" ? "is-active" : ""}`} onClick={() => setActiveTab("assets")}>
          <Icon icon="solar:box-outline" width={16} className="me-1" style={{ verticalAlign: "-3px" }} /> Asset Register
        </button>
        <button className={`am-tab ${activeTab === "incidents" ? "is-active" : ""}`} onClick={() => setActiveTab("incidents")}>
          <Icon icon="solar:danger-triangle-outline" width={16} className="me-1" style={{ verticalAlign: "-3px" }} /> Incident Log
        </button>
      </div>

      {activeTab === "assets" && (
        <>
          {/* filters */}
          <div className="row g-3 mb-3">
            {isAdminish && (
              <div className="col-12 col-md-6 col-lg-3">
                <label className="form-label small text-muted">State</label>
                <select className="form-select" value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
                  <option value="">All States</option>
                  {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            {(isAdminish || userRole === "State Coordinator") && (
              <div className="col-12 col-md-6 col-lg-3">
                <label className="form-label small text-muted">Hub</label>
                <select className="form-select" value={selectedLga} onChange={(e) => setSelectedLga(e.target.value)} disabled={!lgas.length}>
                  <option value="">All Hubs</option>
                  {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            )}
            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label small text-muted">Category</label>
              <select className="form-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} disabled={loadingCategories}>
                <option value="">All Categories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label small text-muted">Search</label>
              <div className="input-group">
                <span className="input-group-text bg-white"><Icon icon="ion:search" /></span>
                <input className="form-control" placeholder="Name or serial…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </div>

          {error && !loadingEquipment && <div className="alert alert-danger">{error}</div>}

          {/* table */}
          <div className="am-table-card">
            {loadingEquipment ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
            ) : (
              <div className="table-responsive">
                <table className="table am-table mb-0">
                  <thead>
                    <tr>
                      <th>Asset</th><th>Value</th><th>Category</th><th>Hub</th>
                      <th>Owner</th><th>Location</th><th>Status</th><th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedEquipment.length ? displayedEquipment.map((eq) => (
                      <tr key={eq.equipmentId} onClick={() => setDrawerEquipment(eq)}>
                        <td>
                          <div className="am-asset-name">{eq.equipmentName || "N/A"}</div>
                          <div className="am-asset-sn">{eq.serialNumber || "—"} · #{eq.equipmentId}</div>
                        </td>
                        <td>{naira(eq.value)}</td>
                        <td>{eq.category?.categoryName || "N/A"}</td>
                        <td>{eq.hub?.lgas?.lgaName || "N/A"}</td>
                        <td>{eq.owner?.name || eq.owner?.firstName || "N/A"}</td>
                        <td>{eq.exact_location || "N/A"}</td>
                        <td><Pill tone={statusTone(eq.status)}>{eq.status || "N/A"}</Pill></td>
                        <td className="text-end" onClick={(e) => e.stopPropagation()}>
                          <div className="d-flex gap-2 justify-content-end">
                            <button className="am-iconbtn" title="Open" onClick={() => setDrawerEquipment(eq)}>
                              <Icon icon="solar:eye-outline" width={16} />
                            </button>
                            {isAdminish && (
                              <>
                                <button className="am-iconbtn" title="Edit" onClick={() => openEdit(eq)}>
                                  <Icon icon="lucide:edit" width={15} />
                                </button>
                                <button className="am-iconbtn danger" title="Delete" onClick={() => setDeleteTarget(eq)}>
                                  <Icon icon="mingcute:delete-2-line" width={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="8" className="am-empty">No equipment matches your criteria.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* pagination */}
          {pagination.totalPages > 1 && (
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 gap-3">
              <div className="d-flex align-items-center">
                <span className="me-2 small text-muted">Show</span>
                <select className="form-select form-select-sm w-auto" value={pagination.perPage}
                  onChange={(e) => setPagination((p) => ({ ...p, perPage: parseInt(e.target.value), currentPage: 1 }))}>
                  {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <nav>
                <ul className="pagination mb-0 flex-wrap justify-content-center">
                  <li className={`page-item ${pagination.currentPage === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPagination((p) => ({ ...p, currentPage: p.currentPage - 1 }))}>Prev</button>
                  </li>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let n;
                    if (pagination.totalPages <= 5) n = i + 1;
                    else if (pagination.currentPage <= 3) n = i + 1;
                    else if (pagination.currentPage >= pagination.totalPages - 2) n = pagination.totalPages - 4 + i;
                    else n = pagination.currentPage - 2 + i;
                    return (
                      <li key={n} className={`page-item ${pagination.currentPage === n ? "active" : ""}`}>
                        <button className="page-link" onClick={() => setPagination((p) => ({ ...p, currentPage: n }))}>{n}</button>
                      </li>
                    );
                  })}
                  <li className={`page-item ${pagination.currentPage === pagination.totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPagination((p) => ({ ...p, currentPage: p.currentPage + 1 }))}>Next</button>
                  </li>
                </ul>
              </nav>
              <div className="small text-muted">
                {(pagination.currentPage - 1) * pagination.perPage + 1}–
                {Math.min(pagination.currentPage * pagination.perPage, pagination.total)} of {pagination.total}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "incidents" && <IncidentLog onOpenAsset={openDrawerById} />}

      {/* Detail drawer */}
      {drawerEquipment && (
        <AssetDetailDrawer
          equipment={drawerEquipment}
          userRole={userRole}
          lgas={lgas}
          owners={owners}
          onClose={() => setDrawerEquipment(null)}
          onAssetChanged={() => { fetchEquipment(); setDashRefresh((k) => k + 1); }}
        />
      )}

      {/* Add / Edit modal */}
      {formOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(16,24,40,.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
              <div className="modal-header">
                <h5 className="modal-title">{formMode === "add" ? "Add New Equipment" : "Edit Equipment"}</h5>
                <button className="btn-close" onClick={() => setFormOpen(false)} disabled={isSubmitting} />
              </div>
              <form onSubmit={submitForm}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Equipment Name *</label>
                      <input className="form-control" value={form.equipmentName} required
                        onChange={(e) => setForm({ ...form, equipmentName: e.target.value })} disabled={isSubmitting} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Serial Number *</label>
                      <input className="form-control" value={form.serialNumber} required
                        onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} disabled={isSubmitting} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Value (₦) *</label>
                      <input className="form-control" value={form.value} placeholder="1000.00"
                        onChange={(e) => { const v = e.target.value; if (/^\d*\.?\d{0,2}$/.test(v) || v === "") setForm({ ...form, value: v }); }}
                        disabled={isSubmitting} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Exact Location</label>
                      <input className="form-control" value={form.exactLocation}
                        onChange={(e) => setForm({ ...form, exactLocation: e.target.value })} disabled={isSubmitting} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Status</label>
                      <select className="form-select" value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })} disabled={isSubmitting}>
                        <option value="">Select Status</option>
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Category *</label>
                      <select className="form-select" value={form.category} required
                        onChange={(e) => setForm({ ...form, category: e.target.value })} disabled={isSubmitting}>
                        <option value="">Select Category</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    {isAdminish && (
                      <div className="col-md-6">
                        <label className="form-label">State *</label>
                        <select className="form-select" value={form.state} required
                          onChange={(e) => setForm({ ...form, state: e.target.value, lga: "" })} disabled={isSubmitting}>
                          <option value="">Select State</option>
                          {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    )}
                    {(isAdminish || userRole === "State Coordinator") && (
                      <div className="col-md-6">
                        <label className="form-label">Hub *</label>
                        <select className="form-select" value={form.lga} required
                          onChange={(e) => setForm({ ...form, lga: e.target.value })} disabled={isSubmitting || !lgas.length}>
                          <option value="">Select Hub</option>
                          {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="col-md-6">
                      <label className="form-label">Owner</label>
                      <select className="form-select" value={form.owner}
                        onChange={(e) => setForm({ ...form, owner: e.target.value })} disabled={isSubmitting}>
                        <option value="">Select Owner</option>
                        {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </div>
                  </div>
                  {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setFormOpen(false)} disabled={isSubmitting}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                    {formMode === "add" ? "Save Equipment" : "Update Equipment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(16,24,40,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button className="btn-close" onClick={() => setDeleteTarget(null)} disabled={isSubmitting} />
              </div>
              <div className="modal-body">
                <p>Delete <strong>{deleteTarget.equipmentName}</strong>? This also removes its lifecycle, maintenance and compliance history.</p>
                <p className="text-danger small mb-0">This action cannot be undone.</p>
                {error && <div className="alert alert-danger mt-2">{error}</div>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setDeleteTarget(null)} disabled={isSubmitting}>Cancel</button>
                <button className="btn btn-danger" onClick={confirmDelete} disabled={isSubmitting}>
                  {isSubmitting ? <span className="spinner-border spinner-border-sm me-1" /> : null} Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================== Fleet incident log =========================== */
const IncidentLog = ({ onOpenAsset }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [sevFilter, setSevFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = { per_page: 50 };
    if (statusFilter) params.status = statusFilter;
    if (sevFilter) params.severity = sevFilter;
    api.get(`/asset-management/incidents`, { params })
      .then((r) => setData(Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [statusFilter, sevFilter]);

  const tone = (s) => {
    const v = (s || "").toLowerCase();
    if (["resolved", "closed", "low"].includes(v)) return "green";
    if (["in_progress", "acknowledged", "medium"].includes(v)) return "amber";
    if (["open", "critical", "high"].includes(v)) return "red";
    return "gray";
  };

  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-6 col-md-3">
          <label className="form-label small text-muted">Status</label>
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            {["open", "acknowledged", "in_progress", "resolved", "closed"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label small text-muted">Severity</label>
          <select className="form-select" value={sevFilter} onChange={(e) => setSevFilter(e.target.value)}>
            <option value="">All</option>
            {["low", "medium", "high", "critical"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="am-table-card">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
        ) : (
          <div className="table-responsive">
            <table className="table am-table mb-0">
              <thead>
                <tr><th>Reference</th><th>Asset</th><th>Issue</th><th>Severity</th><th>Reported</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.length ? data.map((i) => (
                  <tr key={i.id} onClick={() => onOpenAsset?.(i.equipmentId)}>
                    <td className="font-monospace small">{i.reference}</td>
                    <td className="am-asset-name">{i.equipment?.equipmentName || "—"}</td>
                    <td>{i.title}</td>
                    <td><Pill tone={tone(i.severity)}>{i.severity}</Pill></td>
                    <td className="small text-muted">{i.reported_at ? new Date(i.reported_at).toLocaleDateString() : "—"}</td>
                    <td><Pill tone={tone(i.status)}>{(i.status || "").replace("_", " ")}</Pill></td>
                  </tr>
                )) : <tr><td colSpan="6" className="am-empty">No incidents found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default EquipmentManagement;
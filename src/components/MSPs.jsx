"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const MSPSTable = () => {
  // State management
  const [allMsps, setAllMsps] = useState([]);
  const [displayedMsps, setDisplayedMsps] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedLga, setSelectedLga] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingMsps, setLoadingMsps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMsp, setSelectedMsp] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    total: 0,
  });
  const [isFiltered, setIsFiltered] = useState(false);

  // Fetch MSPs with filtering and pagination
  useEffect(() => {
    const fetchMsps = async () => {
      setLoadingMsps(true);
      try {
        const params = {
          page: pagination.currentPage,
          per_page: pagination.perPage,
        };

        // Add filter params if any filter is active
        if (selectedState) params.state = selectedState;
        if (selectedLga) params.lga = selectedLga;
        if (searchTerm) params.search = searchTerm;

        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/msps`, { params });
        const data = response.data;
        const mspsData = Array.isArray(data.data) ? data.data : [];

        if (selectedState || selectedLga || searchTerm) {
          // Using backend filtering
          setDisplayedMsps(mspsData);
          setIsFiltered(true);
        } else {
          // No filters, store all MSPs
          setAllMsps(mspsData);
          setDisplayedMsps(mspsData);
          setIsFiltered(false);
        }
        
        setPagination(prev => ({
          ...prev,
          totalPages: data.last_page || 1,
          total: data.total || 0,
        }));
      } catch (error) {
        console.error("Error fetching MSPs:", error);
        setError("Failed to load MSPs");
        setAllMsps([]);
        setDisplayedMsps([]);
      } finally {
        setLoadingMsps(false);
      }
    };
    fetchMsps();
  }, [pagination.currentPage, pagination.perPage, selectedState, selectedLga, searchTerm]);

  // Apply frontend filtering when we have all data and filters are active
  useEffect(() => {
    if (!isFiltered && (selectedState || selectedLga || searchTerm)) {
      let filtered = [...allMsps];
      
      if (selectedState) {
        filtered = filtered.filter(msp => 
          msp.hub?.state?.toString() === selectedState.toString()
        );
      }
      
      if (selectedLga) {
        filtered = filtered.filter(msp => 
          msp.hub?.lga?.toString() === selectedLga.toString()
        );
      }
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(msp => 
          msp.users?.firstName?.toLowerCase().includes(term) ||
          msp.users?.lastName?.toLowerCase().includes(term) ||
          msp.users?.phoneNumber?.includes(term)
        );
      }
      
      // Calculate pagination for frontend-filtered results
      const totalPages = Math.ceil(filtered.length / pagination.perPage);
      const startIndex = (pagination.currentPage - 1) * pagination.perPage;
      const paginatedData = filtered.slice(startIndex, startIndex + pagination.perPage);
      
      setDisplayedMsps(paginatedData);
      setPagination(prev => ({
        ...prev,
        totalPages,
        total: filtered.length,
      }));
    }
  }, [allMsps, selectedState, selectedLga, searchTerm, pagination.currentPage, pagination.perPage, isFiltered]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (selectedState || selectedLga || searchTerm) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [selectedState, selectedLga, searchTerm]);

  // Fetch states
  useEffect(() => {
    const fetchStates = async () => {
      setLoadingStates(true);
      setError(null);
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs/active`);
        const data = response.data || response;
        setStates(
          Array.isArray(data)
            ? data.map((state) => ({
                id: state.state_info.stateId || state.id,
                name: state.state_info.stateName || state.name,
              }))
            : []
        );
      } catch (error) {
        console.error("Error fetching states:", error);
        setError("Failed to load states. Please try again.");
        setStates([]);
      } finally {
        setLoadingStates(false);
      }
    };
    fetchStates();
  }, []);

  // Fetch LGAs when state is selected
  useEffect(() => {
    const fetchLgas = async () => {
      if (!selectedState) {
        setLgas([]);
        setSelectedLga("");
        return;
      }
      
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/lgas`, {
          params: { state: selectedState }
        });
        
        const responseData = response.data || response;
        const lgasData = responseData.data || responseData;
        
        setLgas(
          Array.isArray(lgasData)
            ? lgasData.map((lga) => ({
                id: lga.lgaId || lga.id,
                name: lga.lgaName || lga.name,
              }))
            : []
        );
      } catch (error) {
        console.error("Error fetching LGAs:", error);
        setLgas([]);
        setSelectedLga("");
      }
    };
    fetchLgas();
  }, [selectedState]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedState("");
    setSelectedLga("");
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setEmail("");
    setError(null);
  };

  // View Modal Handler
  const handleView = (msp) => {
    setSelectedMsp(msp);
    setViewModalOpen(true);
  };

  // Edit Modal Handler
  const handleEdit = (msp) => {
    setSelectedMsp(msp);
    setSelectedState(msp.hub?.state || "");
    setSelectedLga(msp.hub?.lga || "");
    setFirstName(msp.users?.firstName || "");
    setLastName(msp.users?.lastName || "");
    setPhoneNumber(msp.users?.phoneNumber || "");
    setEmail(msp.users?.email || "");
    setEditModalOpen(true);
  };

  // Delete Modal Handler
  const handleDelete = (msp) => {
    setSelectedMsp(msp);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
      const response = await api.delete(`/msps/${selectedMsp.id}`);
      
      if (response.status >= 200 && response.status < 300) {
        // Remove from both allMsps and displayedMsps
        setAllMsps(prev => prev.filter(m => m.id !== selectedMsp.id));
        setDisplayedMsps(prev => prev.filter(m => m.id !== selectedMsp.id));
        setDeleteModalOpen(false);
      } else {
        throw new Error(response.data?.message || 'Failed to delete MSP');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete MSP');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update MSP
  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        firstName,
        lastName,
        phoneNumber,
        email,
        state: selectedState,
        lga: selectedLga,
      };
      
      const response = await api.put(`/msps/${selectedMsp.id}`, payload);
      
      if (response.status >= 200 && response.status < 300) {
        // Get state and LGA names from existing data
        const stateObj = states.find(s => s.id.toString() === selectedState.toString());
        const lgaObj = lgas.find(l => l.id.toString() === selectedLga.toString());
        
        // Create updated MSP with all required fields
        const updatedMsp = {
          ...response.data,
          hub: {
            ...selectedMsp.hub,
            state: selectedState,
            lga: selectedLga,
          },
          users: {
            ...selectedMsp.users,
            firstName,
            lastName,
            phoneNumber,
            email,
          }
        };
        
        // Update the MSPs arrays
        setAllMsps(prev => 
          prev.map(m => m.id === selectedMsp.id ? updatedMsp : m)
        );
        setDisplayedMsps(prev => 
          prev.map(m => m.id === selectedMsp.id ? updatedMsp : m)
        );
        
        setEditModalOpen(false);
        setError(null);
      } else {
        throw new Error(response.data?.message || 'Failed to update MSP');
      }
    } catch (error) {
      console.error("Update error:", error);
      setError(error.response?.data?.message || error.message || 'Failed to update MSP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!selectedState || !selectedLga) {
      setError("Please select both state and LGA");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        firstName,
        lastName,
        phoneNumber,
        email,
        state: selectedState,
        lga: selectedLga,
      };
      
      const response = await api.post('/msps', payload);
      
      if (response.status >= 200 && response.status < 300) {
        // Refresh the MSPs after successful addition
        const mspsResponse = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/msps`);
        const newMsps = Array.isArray(mspsResponse.data.data) ? mspsResponse.data.data : [];
        
        setAllMsps(newMsps);
        setDisplayedMsps(newMsps);
        handleCloseModal();
      } else {
        throw new Error(response.data?.message || 'Failed to add MSP');
      }
    } catch (error) {
      console.error("Submission error:", error);
      setError(error.response?.data?.message || error.message || 'Failed to add MSP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: page }));
    }
  };

  const handlePerPageChange = (e) => {
    const perPage = parseInt(e.target.value);
    setPagination(prev => ({ ...prev, perPage, currentPage: 1 }));
  };

   return (
    <div className="col-lg-12">
      <div className="card">
        <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <h5 className="card-title mb-3 mb-md-0">Mechanized Service Providers</h5>
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            disabled={loadingMsps}
          >
            {loadingMsps ? 'Loading...' : 'Add MSP'}
          </button>
        </div>
        
        <div className="card-body">
          {/* Filter and Search Section - Made responsive */}
          <div className="row mb-4 g-3">
            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="stateFilter" className="form-label">Filter by State</label>
              <select
                id="stateFilter"
                className="form-select"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                disabled={loadingStates}
              >
                <option value="">All States</option>
                {states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="lgaFilter" className="form-label">Filter by Hubs</label>
              <select
                id="lgaFilter"
                className="form-select"
                value={selectedLga}
                onChange={(e) => setSelectedLga(e.target.value)}
                disabled={!selectedState || lgas.length === 0}
              >
                <option value="">All Hubs</option>
                {lgas.map((lga) => (
                  <option key={lga.id} value={lga.id}>
                    {lga.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-12 col-md-6 col-lg-4">
              <label htmlFor="searchMsp" className="form-label">Search by Name or Phone</label>
              <div className="input-group">
                <input
                  type="text"
                  id="searchMsp"
                  className="form-control"
                  placeholder="Enter name or phone..."
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
                onClick={() => {
                  setSelectedState("");
                  setSelectedLga("");
                  setSearchTerm("");
                }}
                disabled={!selectedState && !selectedLga && !searchTerm}
              >
                Reset Filters
              </button>
            </div>
          </div>
          
          {error && !loadingMsps && (
            <div className="alert alert-danger">{error}</div>
          )}
          
          {loadingMsps ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table border-primary-table mb-0">
                  <thead>
                    <tr>
                      <th scope="col">SN</th>
                      <th scope="col">MSP ID</th>
                      <th scope="col">Name</th>
                      <th scope="col">Phone</th>
                      <th scope="col">State</th>
                      <th scope="col">Hub</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedMsps.length > 0 ? (
                      displayedMsps.map((msp, index) => (
                        <tr key={msp.id || index}>
                          <td>{(pagination.currentPage - 1) * pagination.perPage + index + 1}</td>
                          <td>
                            {/* {(pagination.currentPage - 1) * pagination.perPage + index + 1} */}
                            {msp.mspId || 'N/A'}
                          </td>
                          <td>{`${msp.users?.firstName || ''} ${msp.users?.lastName || ''}`}</td>
                          <td>{msp.users?.phoneNumber || 'N/A'}</td>
                          <td>
                            {states.find(s => s.id === msp.hub?.state)?.name || 'N/A'}
                          </td>
                          <td>
                            {msp.hub?.lgas?.lgaName || 'N/A'}
                          </td>
                          <td>
                            <div className="d-flex">
                              <button
                                className="w-32-px h-32-px me-2 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleView(msp)}
                                title="View"
                              >
                                <Icon icon="iconamoon:eye-light" width={16} />
                              </button>
                              <button
                                className="w-32-px h-32-px me-2 bg-success-light text-success-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleEdit(msp)}
                                title="Edit"
                              >
                                <Icon icon="lucide:edit" width={16} />
                              </button>
                              <button
                                className="w-32-px h-32-px bg-danger-light text-danger-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleDelete(msp)}
                                title="Delete"
                              >
                                <Icon icon="mingcute:delete-2-line" width={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          No MSPs found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Responsive Pagination */}
              {pagination.totalPages > 1 && (
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 gap-3">
                  <div className="d-flex align-items-center">
                    <span className="me-2">Show:</span>
                    <select 
                      className="form-select form-select-sm w-auto" 
                      value={pagination.perPage}
                      onChange={handlePerPageChange}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                    <span className="ms-2">entries</span>
                  </div>
                  
                  <div className="order-md-1">
                    <nav>
                      <ul className="pagination mb-0 flex-wrap justify-content-center">
                        <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                          >
                            Previous
                          </button>
                        </li>
                        
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.currentPage >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.currentPage - 2 + i;
                          }
                          
                          return (
                            <li 
                              key={pageNum} 
                              className={`page-item ${pagination.currentPage === pageNum ? 'active' : ''}`}
                            >
                              <button 
                                className="page-link" 
                                onClick={() => handlePageChange(pageNum)}
                              >
                                {pageNum}
                              </button>
                            </li>
                          );
                        })}
                        
                        <li className={`page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                  
                  <div className="text-center text-md-start">
                    Showing {(pagination.currentPage - 1) * pagination.perPage + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.perPage, pagination.total)} of{' '}
                    {pagination.total} entries
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals - Made responsive */}
      {/* Add MSP Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New MSP</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="firstName" className="form-label">First Name</label>
                      <input
                        type="text"
                        id="firstName"
                        className="form-control"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="lastName" className="form-label">Last Name</label>
                      <input
                        type="text"
                        id="lastName"
                        className="form-control"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        className="form-control"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="email" className="form-label">Email</label>
                      <input
                        type="email"
                        id="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="state" className="form-label">State</label>
                    {loadingStates ? (
                      <div className="text-muted">Loading states...</div>
                    ) : (
                      <select
                        id="state"
                        className="form-select"
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        disabled={isSubmitting}
                        required
                      >
                        <option value="">Select State</option>
                        {states.map((state) => (
                          <option key={state.id} value={state.id}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="lga" className="form-label">LGA</label>
                    <select
                      id="lga"
                      className="form-select"
                      value={selectedLga}
                      onChange={(e) => setSelectedLga(e.target.value)}
                      disabled={!selectedState || lgas.length === 0 || isSubmitting}
                      required
                    >
                      <option value="">Select LGA</option>
                      {lgas.map((lga) => (
                        <option key={lga.id} value={lga.id}>
                          {lga.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && (
                    <div className="alert alert-danger">{error}</div>
                  )}
                  
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCloseModal}
                      disabled={isSubmitting}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!selectedState || !selectedLga || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        'Save MSP'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">MSP Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <p className="form-control-static">{`${selectedMsp?.users?.firstName || ''} ${selectedMsp?.users?.lastName || ''}`}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  <p className="form-control-static">{selectedMsp?.users?.phoneNumber || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <p className="form-control-static">{selectedMsp?.users?.email || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">State</label>
                  <p className="form-control-static">
                    {states.find(s => s.id === selectedMsp?.hub?.state)?.name || 'N/A'}
                  </p>
                </div>
                <div className="mb-3">
                  <label className="form-label">LGA</label>
                  <p className="form-control-static">
                    {lgas.find(l => l.id === selectedMsp?.hub?.lga)?.name || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setViewModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit MSP</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditModalOpen(false)}
                  disabled={isSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleUpdate}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="editFirstName" className="form-label">First Name</label>
                      <input
                        type="text"
                        id="editFirstName"
                        className="form-control"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="editLastName" className="form-label">Last Name</label>
                      <input
                        type="text"
                        id="editLastName"
                        className="form-control"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="editPhoneNumber" className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        id="editPhoneNumber"
                        className="form-control"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="editEmail" className="form-label">Email</label>
                      <input
                        type="email"
                        id="editEmail"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="editState" className="form-label">State</label>
                    <select
                      id="editState"
                      className="form-select"
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      disabled={isSubmitting}
                      required
                    >
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state.id} value={state.id}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editLga" className="form-label">LGA</label>
                    <select
                      id="editLga"
                      className="form-select"
                      value={selectedLga}
                      onChange={(e) => setSelectedLga(e.target.value)}
                      disabled={!selectedState || lgas.length === 0 || isSubmitting}
                      required
                    >
                      <option value="">Select LGA</option>
                      {lgas.map((lga) => (
                        <option key={lga.id} value={lga.id}>
                          {lga.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {error && (
                    <div className="alert alert-danger">{error}</div>
                  )}
                  
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setEditModalOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Updating...
                        </>
                      ) : (
                        'Update MSP'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={isSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete the MSP <strong>{`${selectedMsp?.users?.firstName || ''} ${selectedMsp?.users?.lastName || ''}`}</strong>?</p>
                <p className="text-danger">This action cannot be undone.</p>
                
                {error && (
                  <div className="alert alert-danger">{error}</div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Deleting...
                    </>
                  ) : (
                    'Delete MSP'
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

export default MSPSTable;
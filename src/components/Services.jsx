"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const ServicesTable = () => {
  // State management
  const [services, setServices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [serviceName, setServiceName] = useState("");
  const [cost, setCost] = useState("");
  const [measuringUnit, setMeasuringUnit] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedLga, setSelectedLga] = useState("");
  const [modalSelectedState, setModalSelectedState] = useState("");
  const [modalSelectedLga, setModalSelectedLga] = useState("");
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [activeHubs, setActiveHubs] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userStateId, setUserStateId] = useState(null);
  const [userLgaId, setUserLgaId] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    total: 0,
  });

  const [modalSelectedProject, setModalSelectedProject] = useState("");
  const [editModalSelectedState, setEditModalSelectedState] = useState("");
  const [editModalSelectedLga, setEditModalSelectedLga] = useState("");
  const [editModalSelectedProject, setEditModalSelectedProject] = useState("");
 

  // Fetch user role, stateId, and lgaId
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/user`);
        setUserRole(response.data.role);
        if (response.data.role === 'State Coordinator' || response.data.role === 'Community Lead') {
          setUserStateId(response.data.stateId);
          setSelectedState(response.data.stateId);
          setModalSelectedState(response.data.stateId);
          setEditModalSelectedState(response.data.stateId);
          setUserLgaId(response.data.communityId || null); 
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setError("Failed to load user profile");
      }
    };
    fetchUserRole();
  }, []);

  // Fetch active hubs data
  useEffect(() => {
    const fetchActiveHubs = async () => {
      setLoadingStates(true);
      setError(null);
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs/all-active-hubs`);
        const data = response.data || response;
        const hubs = Array.isArray(data) ? data : [];
        setActiveHubs(hubs);
        
        const uniqueStates = {};
        hubs.forEach(hub => {
          if (hub.state && hub.state_info?.stateName) {
            uniqueStates[hub.state] = {
              id: hub.state,
              name: hub.state_info.stateName
            };
          }
        });
        setStates(Object.values(uniqueStates));
      } catch (error) {
        console.error("Error fetching active hubs:", error);
        setError("Failed to load hubs. Please try again.");
        setStates([]);
        setActiveHubs([]);
      } finally {
        setLoadingStates(false);
      }
    };
    fetchActiveHubs();
  }, []);

   // Fetch LGAs based on selectedState
  useEffect(() => {
    // Clear LGAs if no valid state is selected
    if (!selectedState && !modalSelectedState && !editModalSelectedState) {
      setLgas([]);
      setSelectedLga("");
      setModalSelectedLga("");
      setEditModalSelectedLga("");
      return;
    }

    // Determine the state to filter LGAs by
    const effectiveStateId = selectedState || modalSelectedState || editModalSelectedState;
    
    if (!effectiveStateId) {
      setLgas([]);
      setSelectedLga("");
      setModalSelectedLga("");
      setEditModalSelectedLga("");
      return;
    }

    // Filter active hubs by the effective state ID
    const stateHubs = activeHubs.filter(hub => 
      hub.state_info && hub.state_info.stateId && 
      hub.state_info.stateId.toString() === effectiveStateId.toString()
    );
    
    // Extract unique LGAs from the filtered hubs
    const uniqueLgas = {};
    stateHubs.forEach(hub => {
      if (hub.lga_info && hub.lga_info.lgaId && hub.lga_info.lgaName) {
        uniqueLgas[hub.lga_info.lgaId] = {
          id: hub.lga_info.lgaId,
          name: hub.lga_info.lgaName
        };
      } else {
        console.warn("Invalid hub data, missing lga_info:", hub);
      }
    });
    
    setLgas(Object.values(uniqueLgas));
  }, [selectedState, modalSelectedState, editModalSelectedState, activeHubs]);

  // Fetch services with pagination, search, and role-based filters
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const params = {
          page: pagination.currentPage,
          per_page: pagination.perPage,
          ...(searchTerm && { search: searchTerm }),
        };

        // Add state and hub filters based on role
        // if (userRole === 1 || userRole === 3) {
        //   if (selectedState) params.state = selectedState;
        //   if (selectedLga) params.lga = selectedLga;
        // } else if (userRole === 4) {
        //   if (userStateId) params.state = userStateId;
        //   if (selectedLga) params.lga = selectedLga;
        // } else if (userRole === 5) {
        //   if (userStateId) params.state = userStateId;
        //   if (userLgaId) params.lga = userLgaId;
        // }

          if (userRole === 'ADMIN' || userRole === 'National Coordinator') {
          if (selectedState) params.state = selectedState;
          if (selectedLga) params.lga = selectedLga;
        } else if (userRole === 'State Coordinator' || userRole === 'Community Lead') {
          if (userStateId) params.state = userStateId;
          if (selectedLga && userRole === 'State Coordinator') params.lga = selectedLga;
        }

        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/services`, { params });
        const data = response.data;
        const servicesData = Array.isArray(data.data) ? data.data : [];

        setServices(servicesData);
        
        setPagination(prev => ({
          ...prev,
          totalPages: data.last_page || 1,
          total: data.total || 0,
        }));
      } catch (error) {
        console.error("Error fetching services:", error);
        setError("Failed to load services");
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    if (userRole) {
      fetchServices();
    }
  }, [pagination.currentPage, pagination.perPage, searchTerm, selectedState, selectedLga, userRole, userStateId, userLgaId]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (searchTerm || selectedState || selectedLga) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [searchTerm, selectedState, selectedLga]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setServiceName("");
    setCost("");
    setMeasuringUnit("");
    setError(null);
    if (userRole === 1 || userRole === 3) {
      setModalSelectedState("");
      setModalSelectedLga("");
    } else if (userRole === 4) {
      setModalSelectedLga("");
    }
  };

  // View Modal Handler
  const handleView = (service) => {
    setSelectedService(service);
    setViewModalOpen(true);
  };

  // Edit Modal Handler
  const handleEdit = (service) => {
    setSelectedService(service);
    setServiceName(service.serviceName || "");
    setCost(service.cost || "");
    setMeasuringUnit(service.measuringUnit || "");
    setModalSelectedState(userRole === 4 || userRole === 5 ? userStateId : service.hubs?.state || "");
    setModalSelectedLga(userRole === 5 ? userLgaId : service.hub || "");
    setEditModalOpen(true);
  };

  // Delete Modal Handler
  const handleDelete = (service) => {
    setSelectedService(service);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
      const response = await api.delete(`/services/${selectedService.serviceId}`);
      
      if (response.status >= 200 && response.status < 300) {
        setServices(prev => prev.filter(s => s.serviceId !== selectedService.serviceId));
        setDeleteModalOpen(false);
      } else {
        throw new Error(response.data?.message || 'Failed to delete service');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete service');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Service
  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if ((userRole === 1 || userRole === 3) && (!modalSelectedState || !modalSelectedLga)) {
        setError("Please select state and hub");
        setIsSubmitting(false);
        return;
      } else if (userRole === 4 && !modalSelectedLga) {
        setError("Please select hub");
        setIsSubmitting(false);
        return;
      } else if (userRole === 5 && !userLgaId) {
        setError("Hub not assigned to your profile. Contact support.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        serviceName,
        cost,
        measuringUnit,
        hub: userRole === 5 ? userLgaId : modalSelectedLga,
      };
      
      const response = await api.put(`/services/${selectedService.serviceId}`, payload);
      
      if (response.status >= 200 && response.status < 300) {
        const updatedService = response.data;
        
        setServices(prev => 
          prev.map(s => s.serviceId === selectedService.serviceId ? updatedService : s)
        );
        
        setEditModalOpen(false);
        setServiceName("");
        setCost("");
        setMeasuringUnit("");
        setError(null);
        if (userRole === 1 || userRole === 3) {
          setModalSelectedState("");
          setModalSelectedLga("");
        } else if (userRole === 4) {
          setModalSelectedLga("");
        }
      } else {
        throw new Error(response.data?.message || 'Failed to update service');
      }
    } catch (error) {
      console.error("Update error:", error);
      setError(error.response?.data?.message || error.message || 'Failed to update service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if ((userRole === 1 || userRole === 3) && (!modalSelectedState || !modalSelectedLga)) {
        setError("Please select state and hub");
        setIsSubmitting(false);
        return;
      } else if (userRole === 4 && !modalSelectedLga) {
        setError("Please select hub");
        setIsSubmitting(false);
        return;
      } else if (userRole === 5 && !userLgaId) {
        setError("Hub not assigned to your profile. Contact support.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        serviceName,
        cost,
        measuringUnit,
        hub: userRole === 5 ? userLgaId : modalSelectedLga,
      };
      
      const response = await api.post('/services', payload);
      
      if (response.status >= 200 && response.status < 300) {
        const servicesResponse = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/services`, {
          params: {
            ...(userRole === 4 && userStateId ? { state: userStateId } : {}),
            ...(userRole === 4 && selectedLga ? { lga: selectedLga } : {}),
            ...(userRole === 5 && userLgaId ? { lga: userLgaId } : {}),
          },
        });
        const newServices = Array.isArray(servicesResponse.data.data) ? servicesResponse.data.data : [];
        
        setServices(newServices);
        handleCloseModal();
      } else {
        throw new Error(response.data?.message || 'Failed to add service');
      }
    } catch (error) {
      console.error("Submission error:", error);
      setError(error.response?.data?.message || error.message || 'Failed to add service');
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
          <h5 className="card-title mb-3 mb-md-0">Services</h5>
          {(userRole === 1 || userRole === 3 || userRole === 4) && (
            <button
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
              disabled={loading || (userRole === 5 && !userLgaId)}
            >
              {loading ? 'Loading...' : 'Add Service'}
            </button>
          )}
        </div>
        
        <div className="card-body">
          {/* Search and Filter Section */}
          <div className="row mb-4 g-3">
             {(userRole === 'ADMIN' || userRole === 'National Coordinator') && (
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
            )}

            {(userRole === 'ADMIN' || userRole === 'National Coordinator' || userRole === 'State Coordinator') && (
              <div className="col-12 col-md-6 col-lg-3">
                <label htmlFor="lgaFilter" className="form-label">Filter by Hubs</label>
                <select
                  id="lgaFilter"
                  className="form-select"
                  value={selectedLga}
                  onChange={(e) => setSelectedLga(e.target.value)}
                  disabled={lgas.length === 0 || loadingStates}
                >
                  <option value="">All Hubs</option>
                  {lgas.map((lga) => (
                    <option key={lga.id} value={lga.id}>
                      {lga.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="searchService" className="form-label">Search by Name</label>
              <div className="input-group">
                <input
                  type="text"
                  id="searchService"
                  className="form-control"
                  placeholder="Enter service name..."
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
                  if (userRole === 1 || userRole === 3) {
                    setSelectedState("");
                  }
                  setSelectedLga("");
                  setSearchTerm("");
                }}
                disabled={
                  (userRole === 1 || userRole === 3) ? 
                  (!selectedState && !selectedLga && !searchTerm) :
                  (!selectedLga && !searchTerm)
                }
              >
                Reset Filters
              </button>
            </div>
          </div>
          
          {error && !loading && (
            <div className="alert alert-danger">{error}</div>
          )}
          
          {loading ? (
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
                      <th scope="col">ID</th>
                      <th scope="col">Service Name</th>
                      <th scope="col">Cost</th>
                      <th scope="col">Measuring Unit</th>
                      <th scope="col">Hub</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.length > 0 ? (
                      services.map((service, index) => (
                        <tr key={service.serviceId || index}>
                          <td>
                            {(pagination.currentPage - 1) * pagination.perPage + index + 1}
                          </td>
                          <td>{service.serviceName || 'N/A'}</td>
                          <td>₦{parseFloat(service.cost || 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}</td>
                          <td>{service.measuringUnit || 'N/A'}</td>
                          <td>{service.hubs?.lgas?.lgaName || `Hub #${service.hub}`}</td>
                          <td>
                            <div className="d-flex">
                              <button
                                className="w-32-px h-32-px me-2 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleView(service)}
                                title="View"
                              >
                                <Icon icon="iconamoon:eye-light" width={16} />
                              </button>
                              {(userRole === 1 || userRole === 3 || userRole === 4) && (
                                <>
                                  <button
                                    className="w-32-px h-32-px me-2 bg-success-light text-success-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                    onClick={() => handleEdit(service)}
                                    title="Edit"
                                  >
                                    <Icon icon="lucide:edit" width={16} />
                                  </button>
                                  <button
                                    className="w-32-px h-32-px bg-danger-light text-danger-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                    onClick={() => handleDelete(service)}
                                    title="Delete"
                                  >
                                    <Icon icon="mingcute:delete-2-line" width={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          No services found
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

      {/* Modals */}
      {/* Add Service Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Service</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  {(userRole === 1 || userRole === 3) && (
                    <div className="mb-3">
                      <label htmlFor="modalState" className="form-label">State</label>
                      <select
                        id="modalState"
                        className="form-select"
                        value={modalSelectedState}
                        onChange={(e) => setModalSelectedState(e.target.value)}
                        disabled={isSubmitting || loadingStates}
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
                  )}

                  {(userRole === 1 || userRole === 3 || userRole === 4) && (
                    <div className="mb-3">
                      <label htmlFor="modalHub" className="form-label">Hub</label>
                      <select
                        id="modalHub"
                        className="form-select"
                        value={modalSelectedLga}
                        onChange={(e) => setModalSelectedLga(e.target.value)}
                        disabled={lgas.length === 0 || isSubmitting}
                        required
                      >
                        <option value="">Select Hub</option>
                        {lgas.map((lga) => (
                          <option key={lga.id} value={lga.id}>
                            {lga.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="serviceName" className="form-label">Service Name</label>
                    <input
                      type="text"
                      id="serviceName"
                      className="form-control"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="cost" className="form-label">Cost</label>
                    <input
                      type="number"
                      id="cost"
                      className="form-control"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="measuringUnit" className="form-label">Measuring Unit</label>
                    <input
                      type="text"
                      id="measuringUnit"
                      className="form-control"
                      value={measuringUnit}
                      onChange={(e) => setMeasuringUnit(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
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
                      disabled={isSubmitting || 
                        (userRole === 1 || userRole === 3) && (!modalSelectedState || !modalSelectedLga) ||
                        (userRole === 4 && !modalSelectedLga) ||
                        (userRole === 5 && !userLgaId)}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        'Save Service'
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
                <h5 className="modal-title">Service Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Service Name</label>
                  <p className="form-control-static">{selectedService?.serviceName || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Cost</label>
                  <p className="form-control-static">₦{parseFloat(selectedService?.cost || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Measuring Unit</label>
                  <p className="form-control-static">{selectedService?.measuringUnit || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Hub</label>
                  <p className="form-control-static">{selectedService?.hubs?.lgas?.lgaName || `Hub #${selectedService?.hub}`}</p>
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
                <h5 className="modal-title">Edit Service</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditModalOpen(false)}
                  disabled={isSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleUpdate}>
                  {(userRole === 1 || userRole === 3) && (
                    <div className="mb-3">
                      <label htmlFor="editModalState" className="form-label">State</label>
                      <select
                        id="editModalState"
                        className="form-select"
                        value={modalSelectedState}
                        onChange={(e) => setModalSelectedState(e.target.value)}
                        disabled={isSubmitting || loadingStates}
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
                  )}

                  {(userRole === 1 || userRole === 3 || userRole === 4) && (
                    <div className="mb-3">
                      <label htmlFor="editModalHub" className="form-label">Hub</label>
                      <select
                        id="editModalHub"
                        className="form-select"
                        value={modalSelectedLga}
                        onChange={(e) => setModalSelectedLga(e.target.value)}
                        disabled={lgas.length === 0 || isSubmitting}
                        required
                      >
                        <option value="">Select Hub</option>
                        {lgas.map((lga) => (
                          <option key={lga.id} value={lga.id}>
                            {lga.name}
                        </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="editServiceName" className="form-label">Service Name</label>
                    <input
                      type="text"
                      id="editServiceName"
                      className="form-control"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="editCost" className="form-label">Cost</label>
                    <input
                      type="number"
                      id="editCost"
                      className="form-control"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="editMeasuringUnit" className="form-label">Measuring Unit</label>
                    <input
                      type="text"
                      id="editMeasuringUnit"
                      className="form-control"
                      value={measuringUnit}
                      onChange={(e) => setMeasuringUnit(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
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
                      disabled={isSubmitting || 
                        (userRole === 1 || userRole === 3) && (!modalSelectedState || !modalSelectedLga) ||
                        (userRole === 4 && !modalSelectedLga) ||
                        (userRole === 5 && !userLgaId)}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Updating...
                        </>
                      ) : (
                        'Update Service'
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
                <p>Are you sure you want to delete the service <strong>{selectedService?.serviceName || ''}</strong>?</p>
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
                    'Delete Service'
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

export default ServicesTable;
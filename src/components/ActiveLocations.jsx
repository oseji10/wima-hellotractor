"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const ActiveLocationsTable = () => {
  // State management
  const [allLocations, setAllLocations] = useState([]);
  const [displayedLocations, setDisplayedLocations] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [subhubs, setSubHubs] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedLga, setSelectedLga] = useState("");
  const [selectedSubHubs, setSelectedSubHubs] = useState("");
   const [selectedHub, setSelectedHub] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [hubName, setHubName] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loadingHubs, setLoadingHubs] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    total: 0,
  });
  const [isFiltered, setIsFiltered] = useState(false);

  // Fetch locations with filtering and pagination
   // Fetch locations with filtering and pagination
  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const params = {
          page: pagination.currentPage,
          per_page: pagination.perPage,
        };

        // Add filter params if any filter is active
        if (selectedState) params.state = selectedState;
        if (selectedLga) params.lga = selectedLga;
        if (selectedHub) params.hub = selectedHub;
        if (selectedSubHubs) params.hubId = selectedSubHubs;
        if (searchTerm) params.search = searchTerm;

        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs`, { params });
        const data = response.data;
        const locationsData = Array.isArray(data.data) ? data.data : [];

        if (selectedState || selectedLga || selectedSubHubs || searchTerm) {
          // Using backend filtering
          setDisplayedLocations(locationsData);
          setIsFiltered(true);
        } else {
          // No filters, store all locations
          setAllLocations(locationsData);
          setDisplayedLocations(locationsData);
          setIsFiltered(false);
        }
        
        setPagination(prev => ({
          ...prev,
          totalPages: data.last_page || 1,
          total: data.total || 0,
        }));
      } catch (error) {
        console.error("Error fetching locations:", error);
        setError("Failed to load locations");
        setAllLocations([]);
        setDisplayedLocations([]);
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, [pagination.currentPage, pagination.perPage, selectedState, selectedLga, selectedHub, searchTerm]);

  // Fetch hubs list for filter


  // Apply frontend filtering when we have all data and filters are active
  useEffect(() => {
    if (!isFiltered && (selectedState || selectedLga || searchTerm)) {
      let filtered = [...allLocations];
      
      if (selectedState) {
        filtered = filtered.filter(location => 
          location.state.toString() === selectedState.toString()
        );
      }
      
      if (selectedLga) {
        filtered = filtered.filter(location => 
          location.lga.toString() === selectedLga.toString()
        );
      }

      if (selectedSubHubs) {
        filtered = filtered.filter(location => 
          location.hubId.toString() === selectedSubHubs.toString()
        );
      }
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(location => 
          location.hubName?.toLowerCase().includes(term)
        );
      }
      
      // Calculate pagination for frontend-filtered results
      const totalPages = Math.ceil(filtered.length / pagination.perPage);
      const startIndex = (pagination.currentPage - 1) * pagination.perPage;
      const paginatedData = filtered.slice(startIndex, startIndex + pagination.perPage);
      
      setDisplayedLocations(paginatedData);
      setPagination(prev => ({
        ...prev,
        totalPages,
        total: filtered.length,
      }));
    }
  }, [allLocations, selectedState, selectedLga, searchTerm, pagination.currentPage, pagination.perPage, isFiltered]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (selectedState || selectedLga || selectedSubHubs || searchTerm) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [selectedState, selectedLga, selectedSubHubs, searchTerm]);

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


  // Fetch Subhubs when Hubs is selected
  useEffect(() => {
    const fetchSubHubs = async () => {
      if (!selectedLga) {
        setSubHubs([]);
        setSelectedSubHubs("");
        return;
      }
      
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/subhubs`, {
          params: { lga: selectedLga }
        });
        
        const responseData = response.data || response;
        const subhubsData = responseData.data || responseData;
        
        setSubHubs(
          Array.isArray(subhubsData)
            ? subhubsData.map((subhub) => ({
                id: subhub.subHubId || subhub.id,
                name: subhub.subHubName || subhub.name,
              }))
            : []
        );
      } catch (error) {
        console.error("Error fetching Subhubs:", error);
        setSubHubs([]);
        setSelectedSubHubs("");
      }
    };
    fetchSubHubs();
  }, [selectedLga]);


  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedState("");
    setSelectedLga("");
    setSelectedSubHubs("");
    setHubName(""); 
    setError(null);
  };

  // View Modal Handler
  const handleView = (location) => {
    setSelectedLocation(location);
    setViewModalOpen(true);
  };

  // Edit Modal Handler
  const handleEdit = (location) => {
    setSelectedLocation(location);
    setSelectedState(location.state);
    setSelectedLga(location.lga);
    setHubName(location.hubName);
    setEditModalOpen(true);
  };

  // Delete Modal Handler
  const handleDelete = (location) => {
    setSelectedLocation(location);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
      const response = await api.delete(`/hubs/${selectedLocation.hubId}`);
      
      if (response.status >= 200 && response.status < 300) {
        // Remove from both allLocations and displayedLocations
        setAllLocations(prev => prev.filter(loc => loc.hubId !== selectedLocation.hubId));
        setDisplayedLocations(prev => prev.filter(loc => loc.hubId !== selectedLocation.hubId));
        setDeleteModalOpen(false);
      } else {
        throw new Error(response.data?.message || 'Failed to delete hub');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete hub');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Hub
  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        state: selectedState,
        lga: selectedLga,
        hubName: hubName,
      };
      
      const response = await api.put(`/hubs/${selectedLocation.hubId}`, payload);
      
      if (response.status >= 200 && response.status < 300) {
        // Get state and LGA names from existing data
        const stateObj = states.find(s => s.id.toString() === selectedLocation.state.toString());
        const lgaObj = lgas.find(l => l.id.toString() === selectedLocation.lga.toString());
        
        // Create updated location with all required fields
        const updatedLocation = {
          ...response.data,
          states: { 
            stateName: stateObj?.name || selectedLocation.states?.stateName || selectedState 
          },
          lgas: { 
            lgaName: lgaObj?.name || selectedLocation.lgas?.lgaName || selectedLga 
          }
        };
        
        // Update the locations arrays
        setAllLocations(prev => 
          prev.map(loc => loc.hubId === selectedLocation.hubId ? updatedLocation : loc)
        );
        setDisplayedLocations(prev => 
          prev.map(loc => loc.hubId === selectedLocation.hubId ? updatedLocation : loc)
        );
        
        setEditModalOpen(false);
        setError(null);
      } else {
        throw new Error(response.data?.message || 'Failed to update hub');
      }
    } catch (error) {
      console.error("Update error:", error);
      setError(error.response?.data?.message || error.message || 'Failed to update hub');
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
        state: selectedState,
        lga: selectedLga,
        hubName: hubName,
      };
      
      const response = await api.post('/hubs', payload);
      
      if (response.status >= 200 && response.status < 300) {
        // Refresh the locations after successful addition
        const locationsResponse = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs`);
        const newLocations = Array.isArray(locationsResponse.data.data) ? locationsResponse.data.data : [];
        
        setAllLocations(newLocations);
        setDisplayedLocations(newLocations);
        handleCloseModal();
      } else {
        throw new Error(response.data?.message || 'Failed to add location');
      }
    } catch (error) {
      console.error("Submission error:", error);
      setError(error.response?.data?.message || error.message || 'Failed to add location');
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
          <h5 className="card-title mb-3 mb-md-0">Active Locations</h5>
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            disabled={loadingLocations}
          >
            {loadingLocations ? 'Loading...' : 'Add Hub'}
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
              <label htmlFor="lgaFilter" className="form-label">Filter by LGA</label>
              <select
                id="lgaFilter"
                className="form-select"
                value={selectedLga}
                onChange={(e) => setSelectedLga(e.target.value)}
                disabled={!selectedState || lgas.length === 0}
              >
                <option value="">All LGAs</option>
                {lgas.map((lga) => (
                  <option key={lga.id} value={lga.id}>
                    {lga.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-2">
              <label htmlFor="hubFilter" className="form-label">Filter by Hub</label>
              <select
                id="hubFilter"
                className="form-select"
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                disabled={loadingHubs}
              >
                <option value="">All Hubs</option>
                {hubs.map((hub) => (
                  <option key={hub.id} value={hub.id}>
                    {hub.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-12 col-md-6 col-lg-4">
              <label htmlFor="searchHub" className="form-label">Search by Hub Name</label>
              <div className="input-group">
                <input
                  type="text"
                  id="searchHub"
                  className="form-control"
                  placeholder="Enter hub name..."
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
          
          {error && !loadingLocations && (
            <div className="alert alert-danger">{error}</div>
          )}
          
          {loadingLocations ? (
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
                      <th scope="col">State</th>
                      <th scope="col">Hub</th>
                      <th scope="col">Subhubs</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedLocations.length > 0 ? (
                      displayedLocations.map((location, index) => (
                        <tr key={location.hubId || index}>
                          <td>
                            {(pagination.currentPage - 1) * pagination.perPage + index + 1}
                          </td>
                          <td>{location.states?.stateName || 'N/A'}</td>
                          <td>{location.lgas?.lgaName || 'N/A'}</td>
                          <td><a href="#">View Hubs</a></td>
                          <td>
                            <div className="d-flex">
                              <button
                                className="w-32-px h-32-px me-2 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleView(location)}
                                title="View"
                              >
                                <Icon icon="iconamoon:eye-light" width={16} />
                              </button>
                              <button
                                className="w-32-px h-32-px me-2 bg-success-light text-success-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleEdit(location)}
                                title="Edit"
                              >
                                <Icon icon="lucide:edit" width={16} />
                              </button>
                              <button
                                className="w-32-px h-32-px bg-danger-light text-danger-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleDelete(location)}
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
                        <td colSpan="5" className="text-center py-4">
                          No locations found matching your criteria
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
      {/* Add Location Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Hub</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
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
                  
                  <div className="mb-3">
                    <label htmlFor="hubName" className="form-label">Hub Name</label>
                    <input
                      type="text"
                      id="hubName"
                      className="form-control"
                      value={hubName}
                      onChange={(e) => setHubName(e.target.value)}
                      disabled={isSubmitting}
                      required
                      placeholder="Enter hub name"
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
                      disabled={!selectedState || !selectedLga || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        'Save Hub'
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
                <h5 className="modal-title">Hub Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Hub Name</label>
                  <p className="form-control-static">{selectedLocation?.hubName || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">State</label>
                  <p className="form-control-static">{selectedLocation?.states?.stateName || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">LGA</label>
                  <p className="form-control-static">{selectedLocation?.lgas?.lgaName || 'N/A'}</p>
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
                <h5 className="modal-title">Edit Hub</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditModalOpen(false)}
                  disabled={isSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleUpdate}>
                  <div className="mb-3">
                    <label htmlFor="editHubName" className="form-label">Hub Name</label>
                    <input
                      type="text"
                      id="editHubName"
                      className="form-control"
                      value={hubName}
                      onChange={(e) => setHubName(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
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
                        'Update Hub'
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
                <p>Are you sure you want to delete the hub <strong>{selectedLocation?.hubName}</strong>?</p>
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
                    'Delete Hub'
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

export default ActiveLocationsTable;

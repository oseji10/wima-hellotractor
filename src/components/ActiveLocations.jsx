"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const ActiveLocationsTable = () => {
  // State management for filter section
  const [allLocations, setAllLocations] = useState([]);
  const [displayedLocations, setDisplayedLocations] = useState([]);
  const [filterStates, setFilterStates] = useState([]);
  const [filterLgas, setFilterLgas] = useState([]);
  const [filterSubHubs, setFilterSubHubs] = useState([]);
  const [filterSelectedState, setFilterSelectedState] = useState("");
  const [filterSelectedLga, setFilterSelectedLga] = useState("");
  const [filterSelectedSubHubs, setFilterSelectedSubHubs] = useState("");
  const [loadingFilterStates, setLoadingFilterStates] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    total: 0,
  });
  const [isFiltered, setIsFiltered] = useState(false);

  // State management for modals
  const [modalStates, setModalStates] = useState([]);
  const [modalLgas, setModalLgas] = useState([]);
  const [modalSelectedState, setModalSelectedState] = useState("");
  const [modalSelectedLga, setModalSelectedLga] = useState("");
  const [hubName, setHubName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loadingModalStates, setLoadingModalStates] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userStateId, setUserStateId] = useState(null);

  // Fetch user role and stateId
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/user`);
        setUserRole(response.data.role);
        setUserStateId(response.data.stateId || null);
        if (response.data.role === 'State Coordinator' && response.data.stateId) {
          setFilterSelectedState(response.data.stateId);
          setModalSelectedState(response.data.stateId);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setError("Failed to load user profile");
      }
    };
    fetchUserRole();
  }, []);

  // Fetch locations with filtering and pagination
  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const params = {
          page: pagination.currentPage,
          per_page: pagination.perPage,
        };

        // Add filter params based on role
        if (userRole === 'State Coordinator' && userStateId) {
          params.state = userStateId;
        } else if (filterSelectedState) {
          params.state = filterSelectedState;
        }
        if (filterSelectedLga) params.lga = filterSelectedLga;
        if (filterSelectedSubHubs) params.hubId = filterSelectedSubHubs;
        if (searchTerm) params.search = searchTerm;

        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs`, { params });
        const data = response.data;
        const locationsData = Array.isArray(data.data) ? data.data : [];

        if (filterSelectedState || filterSelectedLga || filterSelectedSubHubs || searchTerm || (userRole === 'State Coordinator' && userStateId)) {
          setDisplayedLocations(locationsData);
          setIsFiltered(true);
        } else {
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
    if (userRole) {
      fetchLocations();
    }
  }, [pagination.currentPage, pagination.perPage, filterSelectedState, filterSelectedLga, filterSelectedSubHubs, searchTerm, userRole, userStateId]);

  // Apply frontend filtering when we have all data and filters are active
  useEffect(() => {
    if (!isFiltered && (filterSelectedState || filterSelectedLga || filterSelectedSubHubs || searchTerm || (userRole === 'State Coordinator' && userStateId))) {
      let filtered = [...allLocations];

      if (userRole === 'State Coordinator' && userStateId) {
        filtered = filtered.filter(location =>
          location.state?.toString() === userStateId.toString()
        );
      } else if (filterSelectedState) {
        filtered = filtered.filter(location =>
          location.state?.toString() === filterSelectedState.toString()
        );
      }

      if (filterSelectedLga) {
        filtered = filtered.filter(location =>
          location.lga?.toString() === filterSelectedLga.toString()
        );
      }

      if (filterSelectedSubHubs) {
        filtered = filtered.filter(location =>
          location.hubId?.toString() === filterSelectedSubHubs.toString()
        );
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(location =>
          location.hubName?.toLowerCase().includes(term)
        );
      }

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
  }, [allLocations, filterSelectedState, filterSelectedLga, filterSelectedSubHubs, searchTerm, userRole, userStateId, pagination.currentPage, pagination.perPage, isFiltered]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (filterSelectedState || filterSelectedLga || filterSelectedSubHubs || searchTerm || (userRole === 'State Coordinator' && userStateId)) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [filterSelectedState, filterSelectedLga, filterSelectedSubHubs, searchTerm, userRole, userStateId]);

  // Fetch states for filter section
  useEffect(() => {
    const fetchFilterStates = async () => {
      setLoadingFilterStates(true);
      setError(null);
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs/active`);
        const data = response.data || response;
        let states = Array.isArray(data)
          ? data.map((state) => ({
              id: state.state_info?.stateId || state.id,
              name: state.state_info?.stateName || state.name,
            }))
          : [];
        
        // For State Coordinator, only show their state
        if (userRole === 'State Coordinator' && userStateId) {
          states = states.filter(state => state.id.toString() === userStateId.toString());
        }
        
        setFilterStates(states);
      } catch (error) {
        console.error("Error fetching filter states:", error);
        setError("Failed to load states for filter. Please try again.");
        setFilterStates([]);
      } finally {
        setLoadingFilterStates(false);
      }
    };
    if (userRole) {
      fetchFilterStates();
    }
  }, [userRole, userStateId]);

  // Fetch LGAs for filter section when state is selected
  useEffect(() => {
    const fetchFilterLgas = async () => {
      const effectiveStateId = userRole === 'State Coordinator' ? userStateId : filterSelectedState;
      if (!effectiveStateId) {
        setFilterLgas([]);
        setFilterSelectedLga("");
        setFilterSubHubs([]);
        setFilterSelectedSubHubs("");
        return;
      }

      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/lgas`, {
          params: { state: effectiveStateId }
        });

        const responseData = response.data || response;
        const lgasData = responseData.data || responseData;

        setFilterLgas(
          Array.isArray(lgasData)
            ? lgasData.map((lga) => ({
                id: lga.lgaId || lga.id,
                name: lga.lgaName || lga.name,
              }))
            : []
        );
        setFilterSelectedLga("");
        setFilterSubHubs([]);
        setFilterSelectedSubHubs("");
      } catch (error) {
        console.error("Error fetching filter LGAs:", error);
        setFilterLgas([]);
        setFilterSelectedLga("");
        setFilterSubHubs([]);
        setFilterSelectedSubHubs("");
      }
    };
    if (userRole) {
      fetchFilterLgas();
    }
  }, [filterSelectedState, userRole, userStateId]);

  // Fetch Subhubs for filter section when LGA is selected
  useEffect(() => {
    const fetchFilterSubHubs = async () => {
      if (!filterSelectedLga) {
        setFilterSubHubs([]);
        setFilterSelectedSubHubs("");
        return;
      }

      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/subhubs`, {
          params: { lga: filterSelectedLga }
        });

        const responseData = response.data || response;
        const subhubsData = responseData.data || responseData;

        setFilterSubHubs(
          Array.isArray(subhubsData)
            ? subhubsData.map((subhub) => ({
                id: subhub.subHubId || subhub.id,
                name: subhub.subHubName || subhub.name,
              }))
            : []
        );
        setFilterSelectedSubHubs("");
      } catch (error) {
        console.error("Error fetching filter Subhubs:", error);
        setFilterSubHubs([]);
        setFilterSelectedSubHubs("");
      }
    };
    fetchFilterSubHubs();
  }, [filterSelectedLga]);

  // Fetch states for modals
  useEffect(() => {
    const fetchModalStates = async () => {
      setLoadingModalStates(true);
      setError(null);
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/states`);
        let states = Array.isArray(response.data)
          ? response.data.map((state) => ({
              id: state.stateId || state.id,
              name: state.stateName || state.name,
            }))
          : [];
        
        // For State Coordinator, only show their state
        if (userRole === 'State Coordinator' && userStateId) {
          states = states.filter(state => state.id.toString() === userStateId.toString());
          if (states.length > 0) {
            setModalSelectedState(states[0].id);
          }
        }
        
        setModalStates(states);
      } catch (error) {
        console.error("Error fetching modal states:", error);
        setError("Failed to load states for modal. Please try again.");
        setModalStates([]);
      } finally {
        setLoadingModalStates(false);
      }
    };
    if (userRole) {
      fetchModalStates();
    }
  }, [userRole, userStateId]);

  // Fetch LGAs for modals when state is selected
  useEffect(() => {
    const fetchModalLgas = async () => {
      const effectiveStateId = userRole === 'State Coordinator' ? userStateId : modalSelectedState;
      if (!effectiveStateId) {
        setModalLgas([]);
        setModalSelectedLga("");
        return;
      }

      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/lgas`, {
          params: { state: effectiveStateId }
        });

        const responseData = response.data || response;
        const lgasData = responseData.data || responseData;

        setModalLgas(
          Array.isArray(lgasData)
            ? lgasData.map((lga) => ({
                id: lga.lgaId || lga.id,
                name: lga.lgaName || lga.name,
              }))
            : []
        );
        setModalSelectedLga("");
      } catch (error) {
        console.error("Error fetching modal LGAs:", error);
        setModalLgas([]);
        setModalSelectedLga("");
      }
    };
    if (userRole) {
      fetchModalLgas();
    }
  }, [modalSelectedState, userRole, userStateId]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (userRole !== 'State Coordinator') {
      setModalSelectedState("");
    }
    setModalSelectedLga("");
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
    setModalSelectedState(userRole === 'State Coordinator' ? userStateId : location.state || "");
    setModalSelectedLga(location.lga || "");
    setHubName(location.hubName || "");
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

    if (!modalSelectedState || !modalSelectedLga) {
      setError("Please select both state and LGA");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        state: modalSelectedState,
        lga: modalSelectedLga,
        hubName: hubName,
      };

      const response = await api.put(`/hubs/${selectedLocation.hubId}`, payload);

      if (response.status >= 200 && response.status < 300) {
        const stateObj = modalStates.find(s => s.id.toString() === modalSelectedState.toString());
        const lgaObj = modalLgas.find(l => l.id.toString() === modalSelectedLga.toString());

        const updatedLocation = {
          ...response.data,
          states: {
            stateName: stateObj?.name || selectedLocation.states?.stateName || modalSelectedState
          },
          lgas: {
            lgaName: lgaObj?.name || selectedLocation.lgas?.lgaName || modalSelectedLga
          },
          hubName: hubName,
          state: modalSelectedState,
          lga: modalSelectedLga,
        };

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

    if (!modalSelectedState || !modalSelectedLga) {
      setError("Please select both state and LGA");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        state: modalSelectedState,
        lga: modalSelectedLga,
        hubName: hubName,
      };

      const response = await api.post('/hubs', payload);

      if (response.status >= 200 && response.status < 300) {
        const locationsResponse = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs`);
        const newLocations = Array.isArray(locationsResponse.data.data) ? locationsResponse.data.data : [];

        setAllLocations(newLocations);
        setDisplayedLocations(newLocations);
        handleCloseModal();
      } else {
        throw new Error(response.data?.message || 'Failed to add hub');
      }
    } catch (error) {
      console.error("Submission error:", error);
      setError(error.response?.data?.message || error.message || 'Failed to add hub');
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
          {(userRole === 'ADMIN' || userRole === 'State Coordinator') && (
            <button
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
              disabled={loadingLocations || (userRole === 'State Coordinator' && !userStateId)}
            >
              Add Hub
            </button>
          )}
        </div>

        <div className="card-body">
          {/* Filter and Search Section - Made responsive */}
          <div className="row mb-4 g-3">
            {(userRole === 'ADMIN' || userRole === 'National Coordinator') && (
              <>
              <div className="col-12 col-md-6 col-lg-3">
                <label htmlFor="stateFilter" className="form-label">Filter by State</label>
                <select
                  id="stateFilter"
                  className="form-select"
                  value={filterSelectedState}
                  onChange={(e) => setFilterSelectedState(e.target.value)}
                  disabled={loadingFilterStates}
                >
                  <option value="">All States</option>
                  {filterStates.map((state) => (
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
                value={filterSelectedLga}
                onChange={(e) => setFilterSelectedLga(e.target.value)}
                disabled={(userRole === 'State Coordinator' ? !userStateId : !filterSelectedState) || filterLgas.length === 0}
              >
                <option value="">All LGAs</option>
                {filterLgas.map((lga) => (
                  <option key={lga.id} value={lga.id}>
                    {lga.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="subHubFilter" className="form-label">Filter by Subhub</label>
              <select
                id="subHubFilter"
                className="form-select"
                value={filterSelectedSubHubs}
                onChange={(e) => setFilterSelectedSubHubs(e.target.value)}
                disabled={!filterSelectedLga || filterSubHubs.length === 0}
              >
                <option value="">All Subhubs</option>
                {filterSubHubs.map((subhub) => (
                  <option key={subhub.id} value={subhub.id}>
                    {subhub.name}
                  </option>
                ))}
              </select>
            </div>
</>
            )}

            <div className="col-12 col-md-6 col-lg-3">
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
                  if (userRole !== 'State Coordinator') {
                    setFilterSelectedState("");
                  }
                  setFilterSelectedLga("");
                  setFilterSelectedSubHubs("");
                  setSearchTerm("");
                }}
                disabled={
                  (userRole === 'State Coordinator' ? false : !filterSelectedState) &&
                  !filterSelectedLga &&
                  !filterSelectedSubHubs &&
                  !searchTerm
                }
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
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedLocations.length > 0 ? (
                      displayedLocations.map((location, index) => (
                        <tr key={location.hubId || index}>
                          <td>{(pagination.currentPage - 1) * pagination.perPage + index + 1}</td>
                          <td>{location.states?.stateName || 'N/A'}</td>
                          <td>{location.lgas?.lgaName || 'N/A'}</td>
                          <td>
                            <div className="d-flex">
                              <button
                                className="w-32-px h-32-px me-2 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleView(location)}
                                title="View"
                              >
                                <Icon icon="iconamoon:eye-light" width={16} />
                              </button>
                              {(userRole === 'ADMIN' || userRole === 'State Coordinator') && (
                                <button
                                  className="w-32-px h-32-px me-2 bg-success-light text-success-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                  onClick={() => handleEdit(location)}
                                  title="Edit"
                                >
                                  <Icon icon="lucide:edit" width={16} />
                                </button>
                              )}
                              {userRole === 'ADMIN' && (
                                <button
                                  className="w-32-px h-32-px bg-danger-light text-danger-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                  onClick={() => handleDelete(location)}
                                  title="Delete"
                                >
                                  <Icon icon="mingcute:delete-2-line" width={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-4">
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
                  {userRole !== 'State Coordinator' && (
                    <div className="mb-3">
                      <label htmlFor="modalState" className="form-label">State</label>
                      {loadingModalStates ? (
                        <div className="text-muted">Loading states...</div>
                      ) : (
                        <select
                          id="modalState"
                          className="form-select"
                          value={modalSelectedState}
                          onChange={(e) => setModalSelectedState(e.target.value)}
                          disabled={isSubmitting}
                          required
                        >
                          <option value="">Select State</option>
                          {modalStates.map((state) => (
                            <option key={state.id} value={state.id}>
                              {state.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                  <div className="mb-3">
                    <label htmlFor="modalLga" className="form-label">LGA</label>
                    <select
                      id="modalLga"
                      className="form-select"
                      value={modalSelectedLga}
                      onChange={(e) => setModalSelectedLga(e.target.value)}
                      disabled={(userRole === 'State Coordinator' ? !userStateId : !modalSelectedState) || modalLgas.length === 0 || isSubmitting}
                      required
                    >
                      <option value="">Select LGA</option>
                      {modalLgas.map((lga) => (
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
                      disabled={(userRole === 'State Coordinator' ? !userStateId : !modalSelectedState) || !modalSelectedLga || !hubName || isSubmitting}
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
                  {userRole !== 'State Coordinator' && (
                    <div className="mb-3">
                      <label htmlFor="editState" className="form-label">State</label>
                      <select
                        id="editState"
                        className="form-select"
                        value={modalSelectedState}
                        onChange={(e) => setModalSelectedState(e.target.value)}
                        disabled={isSubmitting || loadingModalStates}
                        required
                      >
                        <option value="">Select State</option>
                        {modalStates.map((state) => (
                          <option key={state.id} value={state.id}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="mb-3">
                    <label htmlFor="editLga" className="form-label">LGA</label>
                    <select
                      id="editLga"
                      className="form-select"
                      value={modalSelectedLga}
                      onChange={(e) => setModalSelectedLga(e.target.value)}
                      disabled={(userRole === 'State Coordinator' ? !userStateId : !modalSelectedState) || modalLgas.length === 0 || isSubmitting}
                      required
                    >
                      <option value="">Select LGA</option>
                      {modalLgas.map((lga) => (
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
                      disabled={(userRole === 'State Coordinator' ? !userStateId : !modalSelectedState) || !modalSelectedLga || !hubName || isSubmitting}
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
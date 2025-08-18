"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const FarmersTable = () => {
  // State management
  const [allFarmers, setAllFarmers] = useState([]);
  const [displayedFarmers, setDisplayedFarmers] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedLga, setSelectedLga] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingFarmers, setLoadingFarmers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [otherNames, setOtherNames] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [alternatePhoneNumber, setAlternatePhoneNumber] = useState("");
  const [gender, setGender] = useState("");
  const [ageBracket, setAgeBracket] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    total: 0,
  });
  const [isFiltered, setIsFiltered] = useState(false);

  // Fetch Farmers with filtering and pagination
  useEffect(() => {
    const fetchFarmers = async () => {
      setLoadingFarmers(true);
      try {
        const params = {
          page: pagination.currentPage,
          per_page: pagination.perPage,
        };

        // Add filter params if any filter is active
        if (selectedState) params.state = selectedState;
        if (selectedLga) params.lga = selectedLga;
        if (searchTerm) params.search = searchTerm;

        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/farmers`, { params });
        const data = response.data;
        const farmersData = Array.isArray(data.data) ? data.data : [];

        if (selectedState || selectedLga || searchTerm) {
          // Using backend filtering
          setDisplayedFarmers(farmersData);
          setIsFiltered(true);
        } else {
          // No filters, store all Farmers
          setAllFarmers(farmersData);
          setDisplayedFarmers(farmersData);
          setIsFiltered(false);
        }
        
        setPagination(prev => ({
          ...prev,
          totalPages: data.last_page || 1,
          total: data.total || 0,
        }));
      } catch (error) {
        console.error("Error fetching Farmers:", error);
        setError("Failed to load Farmers");
        setAllFarmers([]);
        setDisplayedFarmers([]);
      } finally {
        setLoadingFarmers(false);
      }
    };
    fetchFarmers();
  }, [pagination.currentPage, pagination.perPage, selectedState, selectedLga, searchTerm]);

  // Apply frontend filtering when we have all data and filters are active
  useEffect(() => {
    if (!isFiltered && (selectedState || selectedLga || searchTerm)) {
      let filtered = [...allFarmers];
      
      if (selectedState) {
        filtered = filtered.filter(farmer => 
          farmer.msp?.hub?.toString() === selectedState.toString()
        );
      }
      
      if (selectedLga) {
        filtered = filtered.filter(farmer => 
          farmer.subhubs?.hubId?.toString() === selectedLga.toString()
        );
      }
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(farmer => 
          farmer.farmerFirstName?.toLowerCase().includes(term) ||
          farmer.farmerLastName?.toLowerCase().includes(term) ||
          farmer.phoneNumber?.includes(term)
        );
      }
      
      // Calculate pagination for frontend-filtered results
      const totalPages = Math.ceil(filtered.length / pagination.perPage);
      const startIndex = (pagination.currentPage - 1) * pagination.perPage;
      const paginatedData = filtered.slice(startIndex, startIndex + pagination.perPage);
      
      setDisplayedFarmers(paginatedData);
      setPagination(prev => ({
        ...prev,
        totalPages,
        total: filtered.length,
      }));
    }
  }, [allFarmers, selectedState, selectedLga, searchTerm, pagination.currentPage, pagination.perPage, isFiltered]);

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
    setOtherNames("");
    setPhoneNumber("");
    setAlternatePhoneNumber("");
    setGender("");
    setAgeBracket("");
    setError(null);
  };

  // View Modal Handler
  const handleView = (farmer) => {
    setSelectedFarmer(farmer);
    setViewModalOpen(true);
  };

  // Edit Modal Handler
  const handleEdit = (farmer) => {
    setSelectedFarmer(farmer);
    setSelectedState(farmer.msp?.hub || "");
    setFirstName(farmer.farmerFirstName || "");
    setLastName(farmer.farmerLastName || "");
    setOtherNames(farmer.farmerOtherNames || "");
    setPhoneNumber(farmer.phoneNumber || "");
    setAlternatePhoneNumber(farmer.alternatePhoneNumber || "");
    setGender(farmer.gender || "");
    setAgeBracket(farmer.ageBracket || "");
    setEditModalOpen(true);
  };

  // Delete Modal Handler
  const handleDelete = (farmer) => {
    setSelectedFarmer(farmer);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
      const response = await api.delete(`/farmers/${selectedFarmer.farmerId}`);
      
      if (response.status >= 200 && response.status < 300) {
        // Remove from both allFarmers and displayedFarmers
        setAllFarmers(prev => prev.filter(f => f.farmerId !== selectedFarmer.farmerId));
        setDisplayedFarmers(prev => prev.filter(f => f.farmerId !== selectedFarmer.farmerId));
        setDeleteModalOpen(false);
      } else {
        throw new Error(response.data?.message || 'Failed to delete Farmer');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete Farmer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Farmer
  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        farmerFirstName: firstName,
        farmerLastName: lastName,
        farmerOtherNames: otherNames,
        phoneNumber,
        alternatePhoneNumber,
        gender,
        ageBracket,
        hub: selectedState,
        subHub: selectedLga,
      };
      
      const response = await api.put(`/farmers/${selectedFarmer.farmerId}`, payload);
      
      if (response.status >= 200 && response.status < 300) {
        // Get state and LGA names from existing data
        const stateObj = states.find(s => s.id.toString() === selectedState.toString());
        const lgaObj = lgas.find(l => l.id.toString() === selectedLga.toString());
        
        // Create updated Farmer with all required fields
        const updatedFarmer = {
          ...response.data,
          farmerFirstName: firstName,
          farmerLastName: lastName,
          farmerOtherNames: otherNames,
          phoneNumber,
          alternatePhoneNumber,
          gender,
          ageBracket,
          msp: {
            ...selectedFarmer.msp,
            hub: selectedState,
          },
          subhubs: {
            ...selectedFarmer.subhubs,
            hubId: selectedLga,
          }
        };
        
        // Update the Farmers arrays
        setAllFarmers(prev => 
          prev.map(f => f.farmerId === selectedFarmer.farmerId ? updatedFarmer : f)
        );
        setDisplayedFarmers(prev => 
          prev.map(f => f.farmerId === selectedFarmer.farmerId ? updatedFarmer : f)
        );
        
        setEditModalOpen(false);
        setError(null);
      } else {
        throw new Error(response.data?.message || 'Failed to update Farmer');
      }
    } catch (error) {
      console.error("Update error:", error);
      setError(error.response?.data?.message || error.message || 'Failed to update Farmer');
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
        farmerFirstName: firstName,
        farmerLastName: lastName,
        farmerOtherNames: otherNames,
        phoneNumber,
        alternatePhoneNumber,
        gender,
        ageBracket,
        hub: selectedState,
        subHub: selectedLga,
      };
      
      const response = await api.post('/farmers', payload);
      
      if (response.status >= 200 && response.status < 300) {
        // Refresh the Farmers after successful addition
        const farmersResponse = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/farmers`);
        const newFarmers = Array.isArray(farmersResponse.data.data) ? farmersResponse.data.data : [];
        
        setAllFarmers(newFarmers);
        setDisplayedFarmers(newFarmers);
        handleCloseModal();
      } else {
        throw new Error(response.data?.message || 'Failed to add farmer');
      }
    } catch (error) {
      console.error("Submission error:", error);
      setError(error.response?.data?.message || error.message || 'Failed to add farmer');
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
          <h5 className="card-title mb-3 mb-md-0">Farmers</h5>
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            disabled={loadingFarmers}
          >
            {loadingFarmers ? 'Loading...' : 'Add Farmer'}
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
              <label htmlFor="lgaFilter" className="form-label">Filter by Sub-Hubs</label>
              <select
                id="lgaFilter"
                className="form-select"
                value={selectedLga}
                onChange={(e) => setSelectedLga(e.target.value)}
                disabled={!selectedState || lgas.length === 0}
              >
                <option value="">All Sub-Hubs</option>
                {lgas.map((lga) => (
                  <option key={lga.id} value={lga.id}>
                    {lga.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-12 col-md-6 col-lg-4">
              <label htmlFor="searchFarmer" className="form-label">Search by Name or Phone</label>
              <div className="input-group">
                <input
                  type="text"
                  id="searchFarmer"
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
          
          {error && !loadingFarmers && (
            <div className="alert alert-danger">{error}</div>
          )}
          
          {loadingFarmers ? (
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
                      <th scope="col">Farmer ID</th>
                      <th scope="col">Name</th>
                      <th scope="col">Phone</th>
                      <th scope="col">Gender</th>
                      <th scope="col">Age Bracket</th>
                      <th scope="col">Sub-Hub</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedFarmers.length > 0 ? (
                      displayedFarmers.map((farmer, index) => (
                        <tr key={farmer.farmerId || index}>
                          <td>
                            {/* {(pagination.currentPage - 1) * pagination.perPage + index + 1} */}
                            {farmer.farmerId || 'N/A'}
                          </td>
                          <td>{`${farmer.farmerFirstName || ''} ${farmer.farmerLastName || ''} ${farmer.farmerOtherNames || ''}`}</td>
                          <td>{farmer.phoneNumber || 'N/A'}</td>
                          <td>{farmer.gender || 'N/A'}</td>
                          <td>{farmer.ageBracket || 'N/A'}</td>
                          <td>
                            {farmer.subhubs?.subHubName || 'N/A'}
                          </td>
                          <td>
                            <div className="d-flex">
                              <button
                                className="w-32-px h-32-px me-2 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleView(farmer)}
                                title="View"
                              >
                                <Icon icon="iconamoon:eye-light" width={16} />
                              </button>
                              <button
                                className="w-32-px h-32-px me-2 bg-success-light text-success-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleEdit(farmer)}
                                title="Edit"
                              >
                                <Icon icon="lucide:edit" width={16} />
                              </button>
                              <button
                                className="w-32-px h-32-px bg-danger-light text-danger-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleDelete(farmer)}
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
                        <td colSpan="7" className="text-center py-4">
                          No Farmers found matching your criteria
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
      {/* Add Farmer Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Farmer</h5>
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
                    <div className="col-12 col-md-4 mb-3">
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
                    <div className="col-12 col-md-4 mb-3">
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
                    <div className="col-12 col-md-4 mb-3">
                      <label htmlFor="otherNames" className="form-label">Other Names</label>
                      <input
                        type="text"
                        id="otherNames"
                        className="form-control"
                        value={otherNames}
                        onChange={(e) => setOtherNames(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-12 col-md-6 mb-3">
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
                    <div className="col-12 col-md-6 mb-3">
                      <label htmlFor="alternatePhoneNumber" className="form-label">Alternate Phone</label>
                      <input
                        type="tel"
                        id="alternatePhoneNumber"
                        className="form-control"
                        value={alternatePhoneNumber}
                        onChange={(e) => setAlternatePhoneNumber(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-12 col-md-6 mb-3">
                      <label htmlFor="gender" className="form-label">Gender</label>
                      <select
                        id="gender"
                        className="form-select"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6 mb-3">
                      <label htmlFor="ageBracket" className="form-label">Age Bracket</label>
                      <select
                        id="ageBracket"
                        className="form-select"
                        value={ageBracket}
                        onChange={(e) => setAgeBracket(e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select Age Bracket</option>
                        <option value="Youth: 15-24">Youth: 15-24</option>
                        <option value="Adult: 25-64">Adult: 25-64</option>
                        <option value="Senior: 65+">Senior: 65+</option>
                      </select>
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
                    <label htmlFor="lga" className="form-label">Sub-Hub</label>
                    <select
                      id="lga"
                      className="form-select"
                      value={selectedLga}
                      onChange={(e) => setSelectedLga(e.target.value)}
                      disabled={!selectedState || lgas.length === 0 || isSubmitting}
                      required
                    >
                      <option value="">Select Sub-Hub</option>
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
                        'Save Farmer'
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
                <h5 className="modal-title">Farmer Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <p className="form-control-static">{`${selectedFarmer?.farmerFirstName || ''} ${selectedFarmer?.farmerLastName || ''} ${selectedFarmer?.farmerOtherNames || ''}`}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  <p className="form-control-static">{selectedFarmer?.phoneNumber || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Alternate Phone</label>
                  <p className="form-control-static">{selectedFarmer?.alternatePhoneNumber || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Gender</label>
                  <p className="form-control-static">{selectedFarmer?.gender || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Age Bracket</label>
                  <p className="form-control-static">{selectedFarmer?.ageBracket || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">State</label>
                  <p className="form-control-static">
                    {states.find(s => s.id === selectedFarmer?.msp?.hub)?.name || 'N/A'}
                  </p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Sub-Hub</label>
                  <p className="form-control-static">
                    {selectedFarmer?.subhubs?.subHubName || 'N/A'}
                  </p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <p className="form-control-static">
                    {selectedFarmer?.status || 'N/A'}
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
                <h5 className="modal-title">Edit Farmer</h5>
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
                    <div className="col-12 col-md-4 mb-3">
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
                    <div className="col-12 col-md-4 mb-3">
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
                    <div className="col-12 col-md-4 mb-3">
                      <label htmlFor="editOtherNames" className="form-label">Other Names</label>
                      <input
                        type="text"
                        id="editOtherNames"
                        className="form-control"
                        value={otherNames}
                        onChange={(e) => setOtherNames(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-12 col-md-6 mb-3">
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
                    <div className="col-12 col-md-6 mb-3">
                      <label htmlFor="editAlternatePhoneNumber" className="form-label">Alternate Phone</label>
                      <input
                        type="tel"
                        id="editAlternatePhoneNumber"
                        className="form-control"
                        value={alternatePhoneNumber}
                        onChange={(e) => setAlternatePhoneNumber(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-12 col-md-6 mb-3">
                      <label htmlFor="editGender" className="form-label">Gender</label>
                      <select
                        id="editGender"
                        className="form-select"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6 mb-3">
                      <label htmlFor="editAgeBracket" className="form-label">Age Bracket</label>
                      <select
                        id="editAgeBracket"
                        className="form-select"
                        value={ageBracket}
                        onChange={(e) => setAgeBracket(e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select Age Bracket</option>
                        <option value="Youth: 15-24">Youth: 15-24</option>
                        <option value="Adult: 25-64">Adult: 25-64</option>
                        <option value="Senior: 65+">Senior: 65+</option>
                      </select>
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
                    <label htmlFor="editLga" className="form-label">Sub-Hub</label>
                    <select
                      id="editLga"
                      className="form-select"
                      value={selectedLga}
                      onChange={(e) => setSelectedLga(e.target.value)}
                      disabled={!selectedState || lgas.length === 0 || isSubmitting}
                      required
                    >
                      <option value="">Select Sub-Hub</option>
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
                        'Update Farmer'
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
                <p>Are you sure you want to delete the farmer <strong>{`${selectedFarmer?.farmerFirstName || ''} ${selectedFarmer?.farmerLastName || ''}`}</strong>?</p>
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
                    'Delete Farmer'
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

export default FarmersTable;

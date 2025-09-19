"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const EquipmentTable = () => {
  // State management
  const [allEquipment, setAllEquipment] = useState([]);
  const [displayedEquipment, setDisplayedEquipment] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [owners, setOwners] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedLga, setSelectedLga] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [equipmentName, setEquipmentName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [value, setValue] = useState("");
  const [exactLocation, setExactLocation] = useState("");
  const [status, setStatus] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    total: 0,
  });
  const [activeHubs, setActiveHubs] = useState([]);
  const [modalSelectedState, setModalSelectedState] = useState("");
  const [modalSelectedLga, setModalSelectedLga] = useState("");
  const [modalSelectedCategory, setModalSelectedCategory] = useState("");
  const [modalSelectedOwner, setModalSelectedOwner] = useState("");
  const [editModalSelectedState, setEditModalSelectedState] = useState("");
  const [editModalSelectedLga, setEditModalSelectedLga] = useState("");
  const [editModalSelectedCategory, setEditModalSelectedCategory] = useState("");
  const [editModalSelectedOwner, setEditModalSelectedOwner] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [userStateId, setUserStateId] = useState(null);
  const [userLgaId, setUserLgaId] = useState(null);

  // Fetch user role, stateId, and communityId (as lgaId)
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/user`);
        setUserRole(response.data.role);
        if (response.data.role === 'State Coordinator' || response.data.role === 'Community Lead') {
          setUserStateId(response.data.stateId || null);
          setUserLgaId(response.data.communityId || null); // Use communityId as lgaId
          setSelectedState(response.data.stateId || "");
          setModalSelectedState(response.data.stateId || "");
          setEditModalSelectedState(response.data.stateId || "");
          if (response.data.role === 'Community Lead' && response.data.communityId) {
            setModalSelectedLga(response.data.communityId);
            setEditModalSelectedLga(response.data.communityId);
          }
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
        
        // Store the active hubs data
        const hubs = Array.isArray(data) ? data : [];
        setActiveHubs(hubs);
        
        // Extract unique states from active hubs
        const uniqueStates = {};
        hubs.forEach(hub => {
          if (hub.state_info && hub.state_info.stateId && hub.state_info.stateName) {
            uniqueStates[hub.state_info.stateId] = {
              id: hub.state_info.stateId,
              name: hub.state_info.stateName
            };
          } else {
            console.warn("Invalid hub data, missing state_info:", hub);
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

  // Fetch equipment categories data
useEffect(() => {
  const fetchCategories = async () => {
    setLoadingCategories(true);
    setError(null);
    try {
      const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/equipment/categories`);
      const data = response.data; // The API returns the array directly
      const categoriesData = Array.isArray(data) ? data.map(category => ({
        id: category.categoryId,
        name: category.categoryName
      })) : [];
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching equipment categories:", error);
      setError("Failed to load equipment categories. Please try again.");
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };
  fetchCategories();
}, []);

  // Fetch owners data
  useEffect(() => {
    const fetchOwners = async () => {
      setLoadingOwners(true);
      setError(null);
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/users`);
        const data = response.data || response;
        const ownersData = Array.isArray(data.data) ? data.data.map(user => ({
          id: user.id,
          name: user.name
        })) : [];
        setOwners(ownersData);
      } catch (error) {
        console.error("Error fetching owners:", error);
        setError("Failed to load owners. Please try again.");
        setOwners([]);
      } finally {
        setLoadingOwners(false);
      }
    };
    fetchOwners();
  }, []);

  // Fetch LGAs based on selectedState
  useEffect(() => {
    // Clear LGAs if no valid state is selected
    if (!selectedState && !modalSelectedState && !editModalSelectedState) {
      setLgas([]);
      setSelectedLga("");
      if (userRole !== 'Community Lead') {
        setModalSelectedLga("");
        setEditModalSelectedLga("");
      }
      return;
    }

    // Determine the state to filter LGAs by
    const effectiveStateId = selectedState || modalSelectedState || editModalSelectedState;
    
    if (!effectiveStateId) {
      setLgas([]);
      setSelectedLga("");
      if (userRole !== 'Community Lead') {
        setModalSelectedLga("");
        setEditModalSelectedLga("");
      }
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
  }, [selectedState, modalSelectedState, editModalSelectedState, activeHubs, userRole]);

  // Fetch Equipment with filtering and pagination
  useEffect(() => {
    const fetchEquipment = async () => {
      setLoadingEquipment(true);
      try {
        const params = {
          page: pagination.currentPage,
          per_page: pagination.perPage,
        };

        // Add filter params based on role
        if (userRole === 'ADMIN' || userRole === 'National Coordinator') {
          if (selectedState) params.state = selectedState;
          if (selectedLga) params.lga = selectedLga;
        } else if (userRole === 'State Coordinator' || userRole === 'Community Lead') {
          if (userStateId) params.state = userStateId;
          if (selectedLga && userRole === 'State Coordinator') params.lga = selectedLga;
          if (userLgaId && userRole === 'Community Lead') params.lga = userLgaId;
        }
        if (selectedCategory) params.equipmentCategory = selectedCategory;
        if (searchTerm) params.search = searchTerm;

        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/equipment`, { params });
        const data = response.data;
        const equipmentData = Array.isArray(data.data) ? data.data : [];

        setDisplayedEquipment(equipmentData);
        setAllEquipment(equipmentData);
        setPagination(prev => ({
          ...prev,
          totalPages: data.last_page || 1,
          total: data.total || 0,
        }));
      } catch (error) {
        console.error("Error fetching equipment:", error);
        setError("Failed to load equipment");
        setAllEquipment([]);
        setDisplayedEquipment([]);
      } finally {
        setLoadingEquipment(false);
      }
    };
    if (userRole) {
      fetchEquipment();
    }
  }, [pagination.currentPage, pagination.perPage, selectedState, selectedLga, selectedCategory, searchTerm, userRole, userStateId, userLgaId]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (selectedState || selectedLga || selectedCategory || searchTerm) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [selectedState, selectedLga, selectedCategory, searchTerm]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalSelectedLga("");
    setModalSelectedCategory("");
    setModalSelectedOwner("");
    setEquipmentName("");
    setSerialNumber("");
    setValue("");
    setExactLocation("");
    setStatus("");
    setError(null);
    if (userRole === 'ADMIN' || userRole === 'National Coordinator') {
      setModalSelectedState("");
    }
  };

  // View Modal Handler
  const handleView = (equipment) => {
    setSelectedEquipment(equipment);
    setViewModalOpen(true);
  };

  // Edit Modal Handler
  const handleEdit = (equipment) => {
    setSelectedEquipment(equipment);
    setEditModalSelectedLga(equipment.hub || userLgaId || "");
    setEditModalSelectedCategory(equipment.equipmentCategory || "");
    setEditModalSelectedOwner(equipment.owner || "");
    setEquipmentName(equipment.equipmentName || "");
    setSerialNumber(equipment.serialNumber || "");
    setValue(equipment.value || "");
    setExactLocation(equipment.exact_location || "");
    setStatus(equipment.status || "");
    if (userRole === 'ADMIN' || userRole === 'National Coordinator') {
      setEditModalSelectedState(equipment.hubs?.state || "");
    }
    setEditModalOpen(true);
  };

  // Delete Modal Handler
  const handleDelete = (equipment) => {
    setSelectedEquipment(equipment);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
      const response = await api.delete(`/equipment/${selectedEquipment.equipmentId}`);
      
      if (response.status >= 200 && response.status < 300) {
        setAllEquipment(prev => prev.filter(e => e.equipmentId !== selectedEquipment.equipmentId));
        setDisplayedEquipment(prev => prev.filter(e => e.equipmentId !== selectedEquipment.equipmentId));
        setDeleteModalOpen(false);
      } else {
        throw new Error(response.data?.message || 'Failed to delete equipment');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete equipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Equipment
  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!equipmentName || !serialNumber) {
      setError("Please fill in all required fields (Equipment Name, Serial Number)");
      setIsSubmitting(false);
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(value) || parseFloat(value) <= 0) {
      setError("Please enter a valid positive value (e.g., 1000.00)");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        equipmentName,
        serialNumber,
        value: parseFloat(value),
        equipmentCategory: editModalSelectedCategory,
        owner: editModalSelectedOwner,
        exact_location: exactLocation,
        status,
      };
      
      // Include hub based on role
      if (userRole === 'ADMIN' || userRole === 'National Coordinator') {
        if (!editModalSelectedState || !editModalSelectedLga || !editModalSelectedCategory) {
          setError("Please select state, hub, and category");
          setIsSubmitting(false);
          return;
        }
        payload.hub = editModalSelectedLga; // hub is lgaId
      } else if (userRole === 'State Coordinator') {
        if (!editModalSelectedLga || !editModalSelectedCategory) {
          setError("Please select hub and category");
          setIsSubmitting(false);
          return;
        }
        payload.hub = editModalSelectedLga;
      } else if (userRole === 'Community Lead') {
        if (!editModalSelectedCategory) {
          setError("Please select category");
          setIsSubmitting(false);
          return;
        }
        if (!userLgaId) {
          setError("Hub not assigned to your profile. Contact support.");
          setIsSubmitting(false);
          return;
        }
        payload.hub = userLgaId; // Use communityId as hub
      }
      
      const response = await api.put(`/equipment/${selectedEquipment.equipmentId}`, payload);
      
      if (response.status >= 200 && response.status < 300) {
        const stateObj = states.find(s => s.id.toString() === (editModalSelectedState || userStateId || "").toString());
        const lgaObj = lgas.find(l => l.id.toString() === (editModalSelectedLga || userLgaId).toString());
        const categoryObj = categories.find(c => c.id.toString() === editModalSelectedCategory.toString());
        const ownerObj = owners.find(o => o.id.toString() === editModalSelectedOwner.toString());
        
        const updatedEquipment = {
          ...response.data,
          equipmentName,
          serialNumber,
          value: parseFloat(value),
          equipmentCategory: editModalSelectedCategory,
          owner: editModalSelectedOwner,
          exact_location: exactLocation,
          status,
          category: {
            categoryName: categoryObj?.name || 'N/A'
          },
          hubs: {
            ...selectedEquipment.hubs,
            state: editModalSelectedState || userStateId || null,
            lga: editModalSelectedLga || userLgaId,
            states: {
              stateName: stateObj?.name || 'N/A'
            },
            lgas: {
              lgaName: lgaObj?.name || 'N/A'
            }
          },
          owners: {
            name: ownerObj?.name || 'N/A'
          }
        };
        
        setAllEquipment(prev => 
          prev.map(e => e.equipmentId === selectedEquipment.equipmentId ? updatedEquipment : e)
        );
        setDisplayedEquipment(prev => 
          prev.map(e => e.equipmentId === selectedEquipment.equipmentId ? updatedEquipment : e)
        );
        
        setEditModalOpen(false);
        setError(null);
      } else {
        throw new Error(response.data?.message || 'Failed to update equipment');
      }
    } catch (error) {
      console.error("Update error:", error);
      setError(error.response?.data?.message || error.message || 'Failed to update equipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate required fields
    if (!equipmentName || !serialNumber) {
      setError("Please fill in all required fields (Equipment Name, Serial Number)");
      setIsSubmitting(false);
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(value) || parseFloat(value) <= 0) {
      setError("Please enter a valid positive value (e.g., 1000.00)");
      setIsSubmitting(false);
      return;
    }
    if ((userRole === 'ADMIN' || userRole === 'National Coordinator') && (!modalSelectedState || !modalSelectedLga || !modalSelectedCategory)) {
      setError("Please select state, hub, and category");
      setIsSubmitting(false);
      return;
    }
    if (userRole === 'State Coordinator' && (!modalSelectedLga || !modalSelectedCategory)) {
      setError("Please select hub and category");
      setIsSubmitting(false);
      return;
    }
    if (userRole === 'Community Lead' && !modalSelectedCategory) {
      setError("Please select category");
      setIsSubmitting(false);
      return;
    }
    if (userRole === 'Community Lead' && !userLgaId) {
      setError("Hub not assigned to your profile. Contact support.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        equipmentName,
        serialNumber,
        value: parseFloat(value),
        equipmentCategory: modalSelectedCategory,
        owner: modalSelectedOwner,
        exact_location: exactLocation,
        status,
      };
      
      // Include hub based on role
      if (userRole === 'ADMIN' || userRole === 'National Coordinator') {
        payload.hub = modalSelectedLga;
      } else if (userRole === 'State Coordinator') {
        payload.hub = modalSelectedLga;
      } else if (userRole === 'Community Lead') {
        payload.hub = userLgaId;
      }
      
      const response = await api.post('/equipment', payload);
      
      if (response.status >= 200 && response.status < 300) {
        const equipmentResponse = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/equipment`);
        const newEquipment = Array.isArray(equipmentResponse.data.data) ? equipmentResponse.data.data : [];
        
        setAllEquipment(newEquipment);
        setDisplayedEquipment(newEquipment);
        handleCloseModal();
      } else {
        throw new Error(response.data?.message || 'Failed to add equipment');
      }
    } catch (error) {
      console.error("Submission error:", error);
      setError(error.response?.data?.message || error.message || 'Failed to add equipment');
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
          <h5 className="card-title mb-3 mb-md-0">Equipment</h5>
          {(userRole === 'Community Lead' || userRole === 'State Coordinator' || userRole === 'ADMIN' || userRole === 'National Coordinator') && (
            <button
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
              disabled={loadingEquipment || (userRole === 'Community Lead' && !userLgaId)}
            >
              Add Equipment
            </button>
          )}
        </div>
        
        <div className="card-body">
          {/* Filter and Search Section - Made responsive */}
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
                <label htmlFor="lgaFilter" className="form-label">Filter by Hub</label>
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
              <label htmlFor="categoryFilter" className="form-label">Filter by Category</label>
              <select
                id="categoryFilter"
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={loadingCategories}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="searchEquipment" className="form-label">Search by Name or Serial</label>
              <div className="input-group">
                <input
                  type="text"
                  id="searchEquipment"
                  className="form-control"
                  placeholder="Enter name or serial..."
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
                  if (userRole === 'ADMIN' || userRole === 'National Coordinator') {
                    setSelectedState("");
                  }
                  setSelectedLga("");
                  setSelectedCategory("");
                  setSearchTerm("");
                }}
                disabled={
                  (userRole === 'ADMIN' || userRole === 'National Coordinator') ? 
                  (!selectedState && !selectedLga && !selectedCategory && !searchTerm) :
                  (!selectedLga && !selectedCategory && !searchTerm)
                }
              >
                Reset Filters
              </button>
            </div>
          </div>
          
          {error && !loadingEquipment && (
            <div className="alert alert-danger">{error}</div>
          )}
          
          {loadingEquipment ? (
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
                      <th scope="col">Equipment ID</th>
                      <th scope="col">Name</th>
                      <th scope="col">Serial Number</th>
                      <th scope="col">Value</th>
                      <th scope="col">Category</th>
                      <th scope="col">Hub</th>
                      <th scope="col">Owner</th>
                      <th scope="col">Location</th>
                      <th scope="col">Status</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedEquipment.length > 0 ? (
                      displayedEquipment.map((equipment, index) => (
                        <tr key={equipment.equipmentId || index}>
                          <td>{(pagination.currentPage - 1) * pagination.perPage + index + 1}</td>
                          <td>{equipment.equipmentId || 'N/A'}</td>
                          <td>{equipment.equipmentName || 'N/A'}</td>
                          <td>{equipment.serialNumber || 'N/A'}</td>
                          <td>{equipment.value ? `₦${parseFloat(equipment.value).toFixed(2)}` : 'N/A'}</td>
                          <td>{equipment.category?.categoryName || 'N/A'}</td>
                          <td>{equipment.hub?.lgas?.lgaName || 'N/A'}</td>
                          <td>{equipment.owner?.firstName || 'N/A'}</td>
                          <td>{equipment.exact_location || 'N/A'}</td>
                          <td>{equipment.status || 'N/A'}</td>
                          <td>
                            <div className="d-flex">
                              <button
                                className="w-32-px h-32-px me-2 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleView(equipment)}
                                title="View"
                              >
                                <Icon icon="iconamoon:eye-light" width={16} />
                              </button>
                              {(userRole === 'National Coordinator' || userRole === 'ADMIN' ) && (
                                <>
                                  <button
                                    className="w-32-px h-32-px me-2 bg-success-light text-success-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                    onClick={() => handleEdit(equipment)}
                                    title="Edit"
                                  >
                                    <Icon icon="lucide:edit" width={16} />
                                  </button>
                                  <button
                                    className="w-32-px h-32-px bg-danger-light text-danger-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                    onClick={() => handleDelete(equipment)}
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
                        <td colSpan="11" className="text-center py-4">
                          No equipment found matching your criteria
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
      {/* Add Equipment Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Equipment</h5>
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
                    <div className="col-12 col-md-6 mb-3">
                      <label htmlFor="equipmentName" className="form-label">Equipment Name</label>
                      <input
                        type="text"
                        id="equipmentName"
                        className="form-control"
                        value={equipmentName}
                        onChange={(e) => setEquipmentName(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6 mb-3">
                      <label htmlFor="serialNumber" className="form-label">Serial Number</label>
                      <input
                        type="text"
                        id="serialNumber"
                        className="form-control"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-12 col-md-6 mb-3">
                      <label htmlFor="value" className="form-label">Value (₦)</label>
                      <input
                        type="text"
                        id="value"
                        className="form-control"
                        value={value}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^\d*\.?\d{0,2}$/.test(val) || val === "") {
                            setValue(val);
                          }
                        }}
                        disabled={isSubmitting}
                        placeholder="Enter value (e.g., 1000.00)"
                      />
                    </div>
                    <div className="col-12 col-md-6 mb-3">
                      <label htmlFor="exactLocation" className="form-label">Exact Location</label>
                      <input
                        type="text"
                        id="exactLocation"
                        className="form-control"
                        value={exactLocation}
                        onChange={(e) => setExactLocation(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-12 col-md-6 mb-3">
                      <label htmlFor="status" className="form-label">Status</label>
                      <select
                        id="status"
                        className="form-select"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Under Maintenance">Under Maintenance</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6 mb-3">
                      <label htmlFor="category" className="form-label">Category</label>
                      {loadingCategories ? (
                        <div className="text-muted">Loading categories...</div>
                      ) : (
                        <select
                          id="category"
                          className="form-select"
                          value={modalSelectedCategory}
                          onChange={(e) => setModalSelectedCategory(e.target.value)}
                          disabled={isSubmitting}
                          required
                        >
                          <option value="">Select Category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                  
                  {(userRole === 'ADMIN' || userRole === 'National Coordinator') && (
                    <div className="mb-3">
                      <label htmlFor="state" className="form-label">State</label>
                      {loadingStates ? (
                        <div className="text-muted">Loading states...</div>
                      ) : (
                        <select
                          id="state"
                          className="form-select"
                          value={modalSelectedState}
                          onChange={(e) => setModalSelectedState(e.target.value)}
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
                  )}
                  {(userRole === 'ADMIN' || userRole === 'National Coordinator' || userRole === 'State Coordinator') && (
                    <div className="mb-3">
                      <label htmlFor="lga" className="form-label">Hub</label>
                      <select
                        id="lga"
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
                    <label htmlFor="owner" className="form-label">Owner</label>
                    {loadingOwners ? (
                      <div className="text-muted">Loading owners...</div>
                    ) : (
                      <select
                        id="owner"
                        className="form-select"
                        value={modalSelectedOwner}
                        onChange={(e) => setModalSelectedOwner(e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select Owner</option>
                        {owners.map((owner) => (
                          <option key={owner.id} value={owner.id}>
                            {owner.name}
                          </option>
                        ))}
                      </select>
                    )}
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
                      disabled={
                        !equipmentName ||
                        !serialNumber ||
                        !/^\d+(\.\d{1,2})?$/.test(value) ||
                        parseFloat(value) <= 0 ||
                        (userRole === 'ADMIN' || userRole === 'National Coordinator') && (!modalSelectedState || !modalSelectedLga || !modalSelectedCategory) ||
                        (userRole === 'State Coordinator' && (!modalSelectedLga || !modalSelectedCategory)) ||
                        (userRole === 'Community Lead' && !modalSelectedCategory) ||
                        isSubmitting
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        'Save Equipment'
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
                <h5 className="modal-title">Equipment Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Equipment Name</label>
                  <p className="form-control-static">{selectedEquipment?.equipmentName || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Serial Number</label>
                  <p className="form-control-static">{selectedEquipment?.serialNumber || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Value</label>
                  <p className="form-control-static">{selectedEquipment?.value ? `₦${parseFloat(selectedEquipment.value).toFixed(2)}` : 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Category</label>
                  <p className="form-control-static">{selectedEquipment?.category?.categoryName || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">State</label>
                  <p className="form-control-static">
                    {states.find(s => s.id === selectedEquipment?.hubs?.state)?.name || 'N/A'}
                  </p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Hub</label>
                  <p className="form-control-static">
                    {lgas.find(l => l.id === selectedEquipment?.hubs?.lga)?.name || 'N/A'}
                  </p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Owner</label>
                  <p className="form-control-static">{selectedEquipment?.owners?.name || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Exact Location</label>
                  <p className="form-control-static">{selectedEquipment?.exact_location || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <p className="form-control-static">{selectedEquipment?.status || 'N/A'}</p>
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
                <h5 className="modal-title">Edit Equipment</h5>
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
                    <div className="col-12 col-md-6 mb-3">
                      <label htmlFor="editEquipmentName" className="form-label">Equipment Name</label>
                      <input
                        type="text"
                        id="editEquipmentName"
                        className="form-control"
                        value={equipmentName}
                        onChange={(e) => setEquipmentName(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6 mb-3">
                      <label htmlFor="editSerialNumber" className="form-label">Serial Number</label>
                      <input
                        type="text"
                        id="editSerialNumber"
                        className="form-control"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-12 col-md-6 mb-3">
                      <label htmlFor="editValue" className="form-label">Value (₦)</label>
                      <input
                        type="text"
                        id="editValue"
                        className="form-control"
                        value={value}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^\d*\.?\d{0,2}$/.test(val) || val === "") {
                            setValue(val);
                          }
                        }}
                        disabled={isSubmitting}
                        placeholder="Enter value (e.g., 1000.00)"
                      />
                    </div>
                    <div className="col-12 col-md-6 mb-3">
                      <label htmlFor="editExactLocation" className="form-label">Exact Location</label>
                      <input
                        type="text"
                        id="editExactLocation"
                        className="form-control"
                        value={exactLocation}
                        onChange={(e) => setExactLocation(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-12 col-md-6 mb-3">
                      <label htmlFor="editStatus" className="form-label">Status</label>
                      <select
                        id="editStatus"
                        className="form-select"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Under Maintenance">Under Maintenance</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6 mb-3">
                      <label htmlFor="editCategory" className="form-label">Category</label>
                      <select
                        id="editCategory"
                        className="form-select"
                        value={editModalSelectedCategory}
                        onChange={(e) => setEditModalSelectedCategory(e.target.value)}
                        disabled={isSubmitting}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {(userRole === 'ADMIN' || userRole === 'National Coordinator') && (
                    <div className="mb-3">
                      <label htmlFor="editState" className="form-label">State</label>
                      <select
                        id="editState"
                        className="form-select"
                        value={editModalSelectedState}
                        onChange={(e) => setEditModalSelectedState(e.target.value)}
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
                  )}
                  {(userRole === 'ADMIN' || userRole === 'National Coordinator' || userRole === 'State Coordinator') && (
                    <div className="mb-3">
                      <label htmlFor="editLga" className="form-label">Hub</label>
                      <select
                        id="editLga"
                        className="form-select"
                        value={editModalSelectedLga}
                        onChange={(e) => setEditModalSelectedLga(e.target.value)}
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
                    <label htmlFor="editOwner" className="form-label">Owner</label>
                    <select
                      id="editOwner"
                      className="form-select"
                      value={editModalSelectedOwner}
                      onChange={(e) => setEditModalSelectedOwner(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="">Select Owner</option>
                      {owners.map((owner) => (
                        <option key={owner.id} value={owner.id}>
                          {owner.name}
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
                      disabled={
                        !equipmentName ||
                        !serialNumber ||
                        !/^\d+(\.\d{1,2})?$/.test(value) ||
                        parseFloat(value) <= 0 ||
                        (userRole === 'ADMIN' || userRole === 'National Coordinator') && (!editModalSelectedState || !editModalSelectedLga || !editModalSelectedCategory) ||
                        (userRole === 'State Coordinator' && (!editModalSelectedLga || !editModalSelectedCategory)) ||
                        (userRole === 'Community Lead' && !editModalSelectedCategory) ||
                        isSubmitting
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Updating...
                        </>
                      ) : (
                        'Update Equipment'
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
                <p>Are you sure you want to delete the equipment <strong>{selectedEquipment?.equipmentName || ''}</strong>?</p>
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
                    'Delete Equipment'
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

export default EquipmentTable;
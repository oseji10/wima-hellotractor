"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const Transactions = () => {
  // State management
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedLga, setSelectedLga] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    total: 0,
  });
  const [isFarmerSearchOpen, setIsFarmerSearchOpen] = useState(false);
  const [farmerSearchTerm, setFarmerSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [selectedCommodities, setSelectedCommodities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [activeHubs, setActiveHubs] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [modalSelectedState, setModalSelectedState] = useState("");
  const [modalSelectedLga, setModalSelectedLga] = useState("");
  const [modalSelectedProject, setModalSelectedProject] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [userStateId, setUserStateId] = useState(null);
  const [userLgaId, setUserLgaId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    msp: "",
    farmer: "",
    transactionType: "Service",
    totalCost: "",
    transactionStatus: "Paid",
    paymentMethod: "Cash",
    hub: "",
    transaction_commodity: [],
    projectId: ""
  });

  // Status colors mapping
  const statusColors = {
    Paid: "bg-green text-green dark:text-green dark:bg-green",
    Pending: "bg-yellow text-yellow",
    Failed: "bg-red text-red",
  };

  // Fetch user role, stateId, and lgaId
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/user`);
        setUserRole(response.data.role);
        if (response.data.role === 'State Coordinator' || response.data.role === 'Community Lead') {
          setUserStateId(response.data.stateId || null);
          setUserLgaId(response.data.communityId || null);
          setSelectedState(response.data.stateId || "");
          setModalSelectedState(response.data.stateId || "");
          if (response.data.role === 'Community Lead' && response.data.communityId) {
            setModalSelectedLga(response.data.communityId);
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
        const hubs = Array.isArray(data) ? data : [];
        setActiveHubs(hubs);
        
        const uniqueStates = {};
        hubs.forEach(hub => {
          if (hub.state_info && hub.state_info.stateId && hub.state_info.stateName) {
            uniqueStates[hub.state_info.stateId] = {
              id: hub.state_info.stateId,
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
    if (!selectedState && !modalSelectedState) {
      setLgas([]);
      setSelectedLga("");
      if (userRole !== 'Community Lead') {
        setModalSelectedLga("");
      }
      return;
    }

    const effectiveStateId = selectedState || modalSelectedState;
    if (!effectiveStateId) {
      setLgas([]);
      setSelectedLga("");
      if (userRole !== 'Community Lead') {
        setModalSelectedLga("");
      }
      return;
    }

    const stateHubs = activeHubs.filter(hub => 
      hub.state_info && hub.state_info.stateId && 
      hub.state_info.stateId.toString() === effectiveStateId.toString()
    );
    
    const uniqueLgas = {};
    stateHubs.forEach(hub => {
      if (hub.lga_info && hub.lga_info.lgaId && hub.lga_info.lgaName) {
        uniqueLgas[hub.lga_info.lgaId] = {
          id: hub.lga_info.lgaId,
          name: hub.lga_info.lgaName
        };
      }
    });
    setLgas(Object.values(uniqueLgas));
  }, [selectedState, modalSelectedState, activeHubs, userRole]);

  // Fetch transactions with state and hub filters
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const params = {
          page: pagination.currentPage,
          per_page: pagination.perPage,
          ...(searchTerm && { search: searchTerm }),
          ...(selectedProject && { projectId: selectedProject }),
        };

        // Add state and hub filters based on role
        if (userRole === 'ADMIN' || userRole === 'National Coordinator') {
          if (selectedState) params.state = selectedState;
          if (selectedLga) params.lga = selectedLga;
        } else if (userRole === 'State Coordinator' || userRole === 'Community Lead') {
          if (userStateId) params.state = userStateId;
          if (selectedLga && userRole === 'State Coordinator') params.lga = selectedLga;
          if (userLgaId && userRole === 'Community Lead') params.lga = userLgaId;
        }

        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/transactions`, { params });
        
        const transactionsData = Array.isArray(response.data) 
          ? response.data 
          : (Array.isArray(response.data?.data) ? response.data.data : []);
        
        setTransactions(transactionsData);
        
        setPagination(prev => ({
          ...prev,
          totalPages: response.data?.last_page || 1,
          total: response.data?.total || transactionsData.length,
        }));
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setError("Failed to load transactions");
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (userRole) {
      fetchTransactions();
    }
  }, [pagination.currentPage, pagination.perPage, searchTerm, selectedProject, selectedState, selectedLga, userRole, userStateId, userLgaId]);

  // Fetch projects data
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      setError(null);
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/projects`);
        const data = response.data || response;
        const projectsData = Array.isArray(data.data) ? data.data.map(project => ({
          id: project.projectId,
          name: project.projectName
        })) : [];
        setProjects(projectsData);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError("Failed to load projects. Please try again.");
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // Fetch services and commodities
  useEffect(() => {
    const fetchServicesAndCommodities = async () => {
      try {
        const servicesResponse = await api.get('/services');
        setServices(servicesResponse.data.data || []);
        
        const commoditiesResponse = await api.get('/commodities');
        setCommodities(commoditiesResponse.data.data || []);
      } catch (error) {
        console.error("Error fetching services or commodities:", error);
      }
    };
    
    fetchServicesAndCommodities();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (selectedState || selectedLga || selectedProject || searchTerm) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [selectedState, selectedLga, selectedProject, searchTerm]);

  const handleView = (transaction) => {
    setSelectedTransaction(transaction);
    setViewModalOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleSearchFarmers = async () => {
    setIsSearching(true);
    try {
      const response = await api.get('/farmers/search', {
        params: { search: farmerSearchTerm }
      });
      setSearchResults(response.data || []);
    } catch (error) {
      console.error("Error searching farmers:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectFarmer = (farmer) => {
    setSelectedFarmer(farmer);
    setFormData(prev => ({
      ...prev,
      farmer: farmer.farmerId,
      msp: farmer.msp,
      hub: farmer.hub || (userRole === 'Community Lead' ? userLgaId : modalSelectedLga)
    }));
    setIsFarmerSearchOpen(false);
  };

  const handleAddService = (service) => {
    if (!selectedServices.some(s => s.serviceId === service.serviceId)) {
      const newService = {
        ...service,
        quantity: 1,
        totalCost: parseFloat(service.price || service.cost)
      };
      
      setSelectedServices(prev => [...prev, newService]);
      
      setFormData(prev => ({
        ...prev,
        totalCost: (parseFloat(prev.totalCost || 0) + parseFloat(newService.totalCost)).toFixed(2)
      }));
    }
  };

  const handleRemoveService = (serviceId) => {
    const serviceToRemove = selectedServices.find(s => s.serviceId === serviceId);
    if (serviceToRemove) {
      setSelectedServices(prev => prev.filter(s => s.serviceId !== serviceId));
      setFormData(prev => ({
        ...prev,
        totalCost: (parseFloat(prev.totalCost || 0) - parseFloat(serviceToRemove.price)).toString()
      }));
    }
  };

  const handleAddCommodity = (commodity) => {
    if (!selectedCommodities.some(c => c.commodityId === commodity.commodityId)) {
      setSelectedCommodities(prev => [...prev, commodity]);
      setFormData(prev => ({
        ...prev,
        transaction_commodity: [...prev.transaction_commodity, commodity.commodityId]
      }));
    }
  };

  const handleRemoveCommodity = (commodityId) => {
    setSelectedCommodities(prev => prev.filter(c => c.commodityId !== commodityId));
    setFormData(prev => ({
      ...prev,
      transaction_commodity: prev.transaction_commodity.filter(id => id !== commodityId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!formData.farmer || !formData.projectId) {
        setError("Please select a farmer and project");
        setIsSubmitting(false);
        return;
      }
      if (userRole === 'ADMIN' || userRole === 'National Coordinator') {
        if (!modalSelectedState || !modalSelectedLga) {
          setError("Please select state and hub");
          setIsSubmitting(false);
          return;
        }
        formData.hub = modalSelectedLga;
      } else if (userRole === 'State Coordinator') {
        if (!modalSelectedLga) {
          setError("Please select hub");
          setIsSubmitting(false);
          return;
        }
        formData.hub = modalSelectedLga;
      } else if (userRole === 'Community Lead') {
        if (!userLgaId) {
          setError("Hub not assigned to your profile. Contact support.");
          setIsSubmitting(false);
          return;
        }
        formData.hub = userLgaId;
      }

      const response = await api.post('/transactions', formData);
      
      if (response.status >= 200 && response.status < 300) {
        const transactionsResponse = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/transactions`);
        const newTransactions = Array.isArray(transactionsResponse.data) 
          ? transactionsResponse.data 
          : (Array.isArray(transactionsResponse.data?.data) ? transactionsResponse.data.data : []);
        
        setTransactions(newTransactions);
        setIsModalOpen(false);
        setFormData({
          msp: "",
          farmer: "",
          transactionType: "Service",
          totalCost: "",
          transactionStatus: "Paid",
          paymentMethod: "Cash",
          hub: "",
          transaction_commodity: [],
          projectId: ""
        });
        setSelectedFarmer(null);
        setSelectedServices([]);
        setSelectedCommodities([]);
        setError(null);
        if (userRole === 'ADMIN' || userRole === 'National Coordinator') {
          setModalSelectedState("");
          setModalSelectedLga("");
        } else if (userRole === 'State Coordinator') {
          setModalSelectedLga("");
        }
      } else {
        throw new Error(response.data?.message || 'Failed to add transaction');
      }
    } catch (error) {
      console.error("Submission error:", error);
      setError(error.response?.data?.message || error.message || 'Failed to add transaction');
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
          <h5 className="card-title mb-3 mb-md-0">Transactions</h5>
           {(userRole === 'Community Lead') && (
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            disabled={loading || (userRole === 'Community Lead' && !userLgaId)}
          >
            {/* {loading ? 'Loading...' : 'Add Transaction'} */}
            Add Transaction
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
              <label htmlFor="projectFilter" className="form-label">Filter by Project</label>
              <select
                id="projectFilter"
                className="form-select"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                disabled={loadingProjects}
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="searchTransaction" className="form-label">Search</label>
              <div className="input-group">
                <input
                  type="text"
                  id="searchTransaction"
                  className="form-control"
                  placeholder="Search by reference, MSP or farmer..."
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
                  setSelectedProject("");
                  setSearchTerm("");
                }}
                disabled={
                  (userRole === 'ADMIN' || userRole === 'National Coordinator') ? 
                  (!selectedState && !selectedLga && !selectedProject && !searchTerm) :
                  (!selectedLga && !selectedProject && !searchTerm)
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
                      <th scope="col">Reference</th>
                      
                      <th scope="col">MSP Name</th>
                      <th scope="col">Farmer</th>
                      <th scope="col">Hub</th>
                      {/* <th scope="col">Type</th> */}
                      <th scope="col">Amount</th>
                      <th scope="col">Status</th>
                      <th scope="col">Project</th>
                      <th scope="col">Date</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length > 0 ? (
                      transactions.map((transaction, index) => (
                        <tr key={transaction.transactionId || index}>
                          <td>{(pagination.currentPage - 1) * pagination.perPage + index + 1}</td>
                          <td>{transaction.transactionReference}</td>
                          
                          <td>
                            {transaction.msp_info?.users?.firstName} {transaction.msp_info?.users?.lastName}
                          </td>
                          <td>
                            {transaction.farmer_info?.farmerFirstName} {transaction.farmer_info?.farmerLastName}
                          </td>
                          {/* <td>{transaction.transactionType}</td> */}
                          <td>{transaction.hub_info?.lgas?.lgaName }</td>
                          <td>₦{parseFloat(transaction.totalCost || 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}</td>
                          <td>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                transaction.transactionStatus === "Paid"
                                  ? "bg-green text-green"
                                  : transaction.transactionStatus === "Pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red text-red"
                              }`}
                            >
                              {transaction.transactionStatus}
                            </span>
                          </td>
                          <td>{transaction.projects?.projectName || 'N/A'}</td>
                          <td>{formatDate(transaction.created_at)}</td>
                          <td>
                            <div className="d-flex">
                              <button
                                className="w-32-px h-32-px me-2 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleView(transaction)}
                                title="View"
                              >
                                <Icon icon="iconamoon:eye-light" width={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-center py-4">
                          No transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
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

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title text-white">Create Transaction</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData({
                      msp: "",
                      farmer: "",
                      transactionType: "Service",
                      totalCost: "",
                      transactionStatus: "Paid",
                      paymentMethod: "Cash",
                      hub: "",
                      transaction_commodity: [],
                      projectId: ""
                    });
                    setSelectedFarmer(null);
                    setSelectedServices([]);
                    setSelectedCommodities([]);
                    setError(null);
                    if (userRole === 'ADMIN' || userRole === 'National Coordinator') {
                      setModalSelectedState("");
                      setModalSelectedLga("");
                    } else if (userRole === 'State Coordinator') {
                      setModalSelectedLga("");
                    }
                  }}
                  disabled={isSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3 mb-4">
                    {/* Farmer Selection */}
                    <div className="col-md-12">
                      <label className="form-label">Farmer</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          value={selectedFarmer ? 
                            `${selectedFarmer.farmerFirstName} ${selectedFarmer.farmerLastName} (${selectedFarmer.farmerId})` : 
                            ""}
                          readOnly
                        />
                        <button 
                          className="btn btn-outline-primary" 
                          type="button"
                          onClick={() => setIsFarmerSearchOpen(true)}
                        >
                          Search
                        </button>
                      </div>
                    </div>
                    
                    {/* MSP Name */}
                    {/* <div className="col-md-6">
                      <label className="form-label">MSP Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedFarmer?.msp_info?.firstName ? 
                          `${selectedFarmer.msp_info.firstName} ${selectedFarmer.msp_info.lastName}` : 
                          selectedFarmer?.msp_info?.users?.firstName ?
                          `${selectedFarmer.msp_info.users.firstName} ${selectedFarmer.msp_info.users.lastName}` :
                          ""}
                        readOnly
                      />
                    </div> */}
                    
                    {/* State Selection */}
                    {(userRole === 'ADMIN' || userRole === 'National Coordinator') && (
                      <div className="col-md-6">
                        <label className="form-label">State</label>
                        <select
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
                    
                    {/* Hub Selection */}
                    {(userRole === 'ADMIN' || userRole === 'National Coordinator' || userRole === 'State Coordinator') && (
                      <div className="col-md-6">
                        <label className="form-label">Hub</label>
                        <select
                          className="form-select"
                          value={modalSelectedLga}
                          onChange={(e) => {
                            setModalSelectedLga(e.target.value);
                            setFormData(prev => ({ ...prev, hub: e.target.value }));
                          }}
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
                    
                    {/* Project Selection */}
                    <div className="col-md-6">
                      <label className="form-label">Project</label>
                      <select
                        className="form-select"
                        value={formData.projectId}
                        onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                        disabled={isSubmitting || loadingProjects}
                        required
                      >
                        <option value="">Select a project...</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Transaction Type */}
                    <div className="col-md-6">
                      <label className="form-label">Transaction Type</label>
                      <select
                        className="form-select"
                        value={formData.transactionType}
                        onChange={(e) => setFormData({...formData, transactionType: e.target.value})}
                        disabled={isSubmitting}
                        required
                      >
                        <option value="Service">Service</option>
                        <option value="Product">Product</option>
                      </select>
                    </div>
                    
                    {/* Status */}
                    <div className="col-md-6">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={formData.transactionStatus}
                        onChange={(e) => setFormData({...formData, transactionStatus: e.target.value})}
                        disabled={isSubmitting}
                        required
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>
                    
                    {/* Payment Method */}
                    <div className="col-md-6">
                      <label className="form-label">Payment Method</label>
                      <select
                        className="form-select"
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                        disabled={isSubmitting}
                        required
                      >
                        <option value="Cash">Cash</option>
                        <option value="Transfer">Transfer</option>
                        <option value="Card">Card</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Services Section */}
                  <div className="mb-4">
                    <h6 className="border-bottom pb-2">Services</h6>
                    <div className="mb-3">
                      <select
                        className="form-select"
                        onChange={(e) => {
                          const serviceId = e.target.value;
                          if (serviceId) {
                            const service = services.find(s => s.serviceId == serviceId);
                            if (service) {
                              handleAddService({
                                ...service,
                                quantity: 1,
                                totalCost: parseFloat(service.cost)
                              });
                            }
                            e.target.value = "";
                          }
                        }}
                        disabled={isSubmitting}
                      >
                        <option value="">Select a service to add...</option>
                        {services.map(service => (
                          <option 
                            key={service.serviceId} 
                            value={service.serviceId}
                            disabled={selectedServices.some(s => s.serviceId === service.serviceId)}
                          >
                            {service.serviceName} (₦{service.cost}/{service.measuringUnit})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {selectedServices.length > 0 && (
                      <div className="table-responsive mb-2">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Service</th>
                              <th>Unit Price</th>
                              <th>Quantity</th>
                              <th>Total</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedServices.map(service => (
                              <tr key={service.serviceId}>
                                <td>
                                  <div>{service.serviceName}</div>
                                  <small className="text-muted">{service.measuringUnit}</small>
                                </td>
                                <td>₦{parseFloat(service.cost).toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}</td>
                                <td style={{ width: '100px' }}>
                                  <input
                                    type="number"
                                    min="1"
                                    className="form-control form-control-sm"
                                    value={service.quantity}
                                    onChange={(e) => {
                                      const newQuantity = parseInt(e.target.value) || 1;
                                      const updatedServices = selectedServices.map(s => 
                                        s.serviceId === service.serviceId 
                                          ? { 
                                              ...s, 
                                              quantity: newQuantity,
                                              totalCost: parseFloat(s.price || s.cost) * newQuantity
                                            } 
                                          : s
                                      );
                                      setSelectedServices(updatedServices);
                                      
                                      const newTotal = updatedServices.reduce(
                                        (sum, s) => sum + (s.totalCost || 0), 0
                                      );
                                      setFormData(prev => ({
                                        ...prev,
                                        totalCost: newTotal.toFixed(2)
                                      }));
                                    }}
                                    disabled={isSubmitting}
                                  />
                                </td>
                                <td>₦{(service.totalCost || service.cost).toLocaleString()}</td>
                                <td className="text-end">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleRemoveService(service.serviceId)}
                                    disabled={isSubmitting}
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {selectedServices.length > 0 && (
                      <div className="text-end mb-3">
                        <div className="d-inline-block border-top pt-2 px-3">
                          <strong>Subtotal: ₦{parseFloat(formData.totalCost || 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Commodities Section */}
                  <div className="mb-4">
                    <h6 className="border-bottom pb-2">Commodities</h6>
                    <div className="mb-3">
                      <select
                        className="form-select"
                        onChange={(e) => {
                          const commodityId = e.target.value;
                          if (commodityId) {
                            const commodity = commodities.find(c => c.commodityId == commodityId);
                            if (commodity) handleAddCommodity(commodity);
                            e.target.value = "";
                          }
                        }}
                        disabled={isSubmitting}
                      >
                        <option value="">Select commodities...</option>
                        {commodities.map(commodity => (
                          <option 
                            key={commodity.commodityId} 
                            value={commodity.commodityId}
                            disabled={selectedCommodities.some(c => c.commodityId === commodity.commodityId)}
                          >
                            {commodity.commodityName}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {selectedCommodities.length > 0 && (
                      <div className="d-flex flex-wrap gap-2">
                        {selectedCommodities.map(commodity => (
                          <span key={commodity.commodityId} className="badge bg-primary bg-opacity-10 text-primary p-2">
                            {commodity.commodityName}
                            <button 
                              type="button" 
                              className="ms-2 btn-close btn-close-primary"
                              onClick={() => handleRemoveCommodity(commodity.commodityId)}
                              style={{ fontSize: '0.5rem' }}
                              disabled={isSubmitting}
                            />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {error && (
                    <div className="alert alert-danger">{error}</div>
                  )}
                  
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setIsModalOpen(false);
                        setFormData({
                          msp: "",
                          farmer: "",
                          transactionType: "Service",
                          totalCost: "",
                          transactionStatus: "Paid",
                          paymentMethod: "Cash",
                          hub: "",
                          transaction_commodity: [],
                          projectId: ""
                        });
                        setSelectedFarmer(null);
                        setSelectedServices([]);
                        setSelectedCommodities([]);
                        setError(null);
                        if (userRole === 'ADMIN' || userRole === 'National Coordinator') {
                          setModalSelectedState("");
                          setModalSelectedLga("");
                        } else if (userRole === 'State Coordinator') {
                          setModalSelectedLga("");
                        }
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting || !selectedFarmer || selectedServices.length === 0 || !formData.projectId ||
                        (userRole === 'ADMIN' || userRole === 'National Coordinator') && (!modalSelectedState || !modalSelectedLga) ||
                        (userRole === 'State Coordinator' && !modalSelectedLga) ||
                        (userRole === 'Community Lead' && !userLgaId)}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        'Create Transaction'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Farmer Search Modal */}
      {isFarmerSearchOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Search Farmer</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsFarmerSearchOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by farmer name or ID..."
                    value={farmerSearchTerm}
                    onChange={(e) => setFarmerSearchTerm(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={isSearching}
                    onClick={handleSearchFarmers}
                  >
                    {isSearching ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Searching...
                      </>
                    ) : (
                      'Search'
                    )}
                  </button>
                </div>
                
                {searchResults.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Hub</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.map(farmer => (
                          <tr key={farmer.farmerId}>
                            <td>{farmer.farmerId}</td>
                            <td>{farmer.farmerFirstName} {farmer.farmerLastName}</td>
                            <td>{farmer.phoneNumber}</td>
                            <td>{farmer.hubs?.lgas?.lgaName}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleSelectFarmer(farmer)}
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    {farmerSearchTerm ? "No farmers found" : "Enter search term to find farmers"}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsFarmerSearchOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModalOpen && selectedTransaction && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Transaction Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Transaction Information</h6>
                    <div className="mb-3">
                      <label className="form-label">Transaction ID</label>
                      <p className="form-control-static">{selectedTransaction.transactionId}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Reference</label>
                      <p className="form-control-static">{selectedTransaction.transactionReference}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Type</label>
                      <p className="form-control-static">{selectedTransaction.transactionType}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <p className="form-control-static">
                        <span className={`badge ${statusColors[selectedTransaction.transactionStatus] || 'bg-gray-100 text-gray-800'}`}>
                          {selectedTransaction.transactionStatus}
                        </span>
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Total Cost</label>
                      <p className="form-control-static">₦{parseFloat(selectedTransaction.totalCost || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Payment Method</label>
                      <p className="form-control-static">{selectedTransaction.paymentMethod}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Project</label>
                      <p className="form-control-static">{selectedTransaction.project_info?.projectName || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Date</label>
                      <p className="form-control-static">{formatDate(selectedTransaction.created_at)}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6>Farmer Information</h6>
                    <div className="mb-3">
                      <label className="form-label">Farmer ID</label>
                      <p className="form-control-static">{selectedTransaction.farmer}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <p className="form-control-static">
                        {selectedTransaction.farmer_info?.farmerFirstName} {selectedTransaction.farmer_info?.farmerLastName}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Phone</label>
                      <p className="form-control-static">{selectedTransaction.farmer_info?.phoneNumber}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Gender</label>
                      <p className="form-control-static">{selectedTransaction.farmer_info?.gender}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Age Bracket</label>
                      <p className="form-control-static">{selectedTransaction.farmer_info?.ageBracket}</p>
                    </div>
                    
                    <h6 className="mt-4">MSP Information</h6>
                    <div className="mb-3">
                      <label className="form-label">Hub</label>
                      <p className="form-control-static">{selectedTransaction.hubs?.lgas?.lgaName || `Hub #${selectedTransaction.hub}`}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">MSP Name</label>
                      <p className="form-control-static">
                        {selectedTransaction.msp_info?.users?.firstName} {selectedTransaction.msp_info?.users?.lastName}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">MSP Phone</label>
                      <p className="form-control-static">{selectedTransaction.msp_info?.users?.phoneNumber}</p>
                    </div>
                  </div>
                </div>
                
                {selectedTransaction.transaction_commodity?.length > 0 && (
                  <div className="mt-4">
                    <h6>Commodities</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Reference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTransaction.transaction_commodity.map((commodity, idx) => (
                            <tr key={idx}>
                              <td>{commodity.commodityId}</td>
                              <td>{commodity.commodities?.commodityName}</td>
                              <td>{commodity.transactionReference}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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
    </div>
  );
};

export default Transactions;
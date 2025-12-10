"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const Transactions = () => {
  // Main state management
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [activeHubs, setActiveHubs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [services, setServices] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [userStateId, setUserStateId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    farmer: "",
    farmerId: "",
    phoneNumber: "",
    farmerFirstName: "",
    farmerLastName: "",
    projectId: "",
    hub: "",
    services: []
  });
  
  const [modalSelectedState, setModalSelectedState] = useState("");
  const [modalSelectedLga, setModalSelectedLga] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [isSearchingFarmer, setIsSearchingFarmer] = useState(false);
  const [farmerSearchTerm, setFarmerSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isCreatingFarmer, setIsCreatingFarmer] = useState(false);

  // View and Confirm Modal States
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmTransactionId, setConfirmTransactionId] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

  // Payment methods
  const paymentMethods = [
    { id: "cash", name: "Cash" },
    { id: "bank_transfer", name: "Bank Transfer" },
    { id: "mobile_money", name: "Mobile Money" },
  ];

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/user`);
        setUserRole(response.data.role);
        if (response.data.role === 'State Coordinator') {
          setUserStateId(response.data.stateId || null);
          setSelectedState(response.data.stateId || "");
          setModalSelectedState(response.data.stateId || "");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };
    fetchUserRole();
  }, []);

  // Fetch active hubs and states
  useEffect(() => {
    const fetchActiveHubs = async () => {
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs/all-active-hubs`);
        const data = response.data || response;
        const hubs = Array.isArray(data) ? data : [];
        setActiveHubs(hubs);
        
        const uniqueStates = {};
        hubs.forEach(hub => {
          if (hub.state_info?.stateId && hub.state_info?.stateName) {
            uniqueStates[hub.state_info.stateId] = {
              id: hub.state_info.stateId,
              name: hub.state_info.stateName
            };
          }
        });
        setStates(Object.values(uniqueStates));
      } catch (error) {
        console.error("Error fetching active hubs:", error);
        setError("Failed to load hubs.");
      }
    };
    fetchActiveHubs();
  }, []);

  // Filter LGAs based on selected state
  useEffect(() => {
    if (!selectedState && !modalSelectedState) {
      setLgas([]);
      setSelectedLga("");
      setModalSelectedLga("");
      return;
    }

    const effectiveStateId = selectedState || modalSelectedState;
    if (!effectiveStateId) return;

    const stateHubs = activeHubs.filter(hub => 
      hub.state_info?.stateId?.toString() === effectiveStateId.toString()
    );
    
    const uniqueLgas = {};
    stateHubs.forEach(hub => {
      if (hub.lga_info?.lgaId && hub.lga_info?.lgaName) {
        uniqueLgas[hub.lga_info.lgaId] = {
          id: hub.lga_info.lgaId,
          name: hub.lga_info.lgaName
        };
      }
    });
    setLgas(Object.values(uniqueLgas));
  }, [selectedState, modalSelectedState, activeHubs]);

  // Fetch transactions
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

        if (userRole === 'ADMIN' || userRole === 'National Coordinator') {
          if (selectedState) params.state = selectedState;
          if (selectedLga) params.lga = selectedLga;
        } else if (userRole === 'State Coordinator') {
          if (userStateId) params.state = userStateId;
          if (selectedLga) params.lga = selectedLga;
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
      } finally {
        setLoading(false);
      }
    };
    
    if (userRole) {
      fetchTransactions();
    }
  }, [pagination.currentPage, pagination.perPage, searchTerm, selectedProject, selectedState, selectedLga, userRole, userStateId]);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
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
        setProjects([]);
      }
    };
    fetchProjects();
  }, []);

  // Load services when hub is selected
  useEffect(() => {
    if (!modalSelectedLga) {
      setServices([]);
      return;
    }
    
    const loadServices = async () => {
      try {
        const response = await api.post(`${process.env.NEXT_PUBLIC_API_URL}/load-services2`, { 
          hubId: modalSelectedLga,
          stateId: modalSelectedState, 
        });
        setServices(response.data || []);
      } catch (error) {
        console.error("Error loading services:", error);
        setServices([]);
      }
    };
    loadServices();
  }, [modalSelectedLga, modalSelectedState]);

  // Load equipment when service is selected
  const loadEquipmentForService = async (serviceId, serviceCategoryId) => {
    if (!modalSelectedLga || !serviceId) return [];
    
    try {
      const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/load-equipment2`, {
        params: {
          hubId: modalSelectedLga,
          serviceId: serviceId,
          serviceCategoryId: serviceCategoryId,
        }
      });
      return response.data || [];
    } catch (error) {
      console.error("Error fetching equipment:", error);
      return [];
    }
  };

  // Calculate total cost
  const calculateTotal = () => {
    return formData.services.reduce((sum, service) => {
      return sum + (parseFloat(service.cost) * (service.quantity || 1));
    }, 0).toFixed(2);
  };

  // Handle farmer search
  const handleSearchFarmer = async () => {
    if (!farmerSearchTerm.trim()) return;
    
    setIsSearchingFarmer(true);
    try {
      const params = {
        search: farmerSearchTerm,
      };
      
      if (userRole === 'National Coordinator' && modalSelectedState) {
        params.stateId = modalSelectedState;
        if (modalSelectedLga) {
          params.communityId = modalSelectedLga;
        }
      } else if (userRole === 'State Coordinator') {
        if (userStateId) {
          params.stateId = userStateId;
        }
        if (modalSelectedLga) {
          params.communityId = modalSelectedLga;
        }
      }

      const response = await api.get('/farmers/search-2', { params });
      setSearchResults(response.data || []);
    } catch (error) {
      console.error("Error searching farmers:", error);
      setSearchResults([]);
    } finally {
      setIsSearchingFarmer(false);
    }
  };

  // Handle farmer selection
  const handleSelectFarmer = (farmer) => {
    setSelectedFarmer(farmer);
    setFormData(prev => ({
      ...prev,
      farmer: farmer.farmerId,
      farmerId: farmer.farmerId,
      phoneNumber: farmer.phoneNumber,
      farmerFirstName: farmer.farmerFirstName,
      farmerLastName: farmer.farmerLastName
    }));
    setFarmerSearchTerm("");
    setSearchResults([]);
  };

  // Handle create new farmer
  const handleCreateFarmer = async () => {
    if (!formData.farmerFirstName || !formData.farmerLastName || !formData.phoneNumber) {
      setError("Please enter farmer's first name, last name, and phone number");
      return;
    }

    setIsCreatingFarmer(true);
    try {
      const payload = {
        farmerFirstName: formData.farmerFirstName,
        farmerLastName: formData.farmerLastName,
        phoneNumber: formData.phoneNumber,
        hub: modalSelectedLga,
        stateId: userRole === 'State Coordinator' ? userStateId : modalSelectedState
      };
      
      const response = await api.post('/farmers', payload);
      const newFarmer = Array.isArray(response.data) ? response.data[0] : response.data;
      
      handleSelectFarmer(newFarmer);
      setError(null);
    } catch (error) {
      console.error("Error creating farmer:", error);
      setError(error.response?.data?.message || "Failed to create farmer");
    } finally {
      setIsCreatingFarmer(false);
    }
  };

  // Handle service addition
  const handleAddService = async (service) => {
    if (!formData.services.some(s => s.serviceId === service.serviceId)) {
      // Load equipment for this service - pass serviceCategoryId from the service object
      const equipmentList = await loadEquipmentForService(service.serviceId, service.serviceCategoryId);
      
      const newService = {
        ...service,
        quantity: 1,
        equipmentId: "",
        availableEquipment: equipmentList
      };
      
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, newService]
      }));
    }
  };

  // Handle service removal
  const handleRemoveService = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(s => s.serviceId !== serviceId)
    }));
  };

  // Handle service equipment change
  const handleEquipmentChange = (serviceId, equipmentId) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map(s => 
        s.serviceId === serviceId ? { ...s, equipmentId } : s
      )
    }));
  };

  // Handle service quantity change
  const handleQuantityChange = (serviceId, quantity) => {
    const qty = Math.max(1, parseInt(quantity) || 1);
    setFormData(prev => ({
      ...prev,
      services: prev.services.map(s => 
        s.serviceId === serviceId ? { ...s, quantity: qty } : s
      )
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!selectedFarmer) {
        setError("Please select or create a farmer");
        setIsSubmitting(false);
        return;
      }

      if (!modalSelectedLga) {
        setError("Please select a hub");
        setIsSubmitting(false);
        return;
      }

      if (formData.services.length === 0) {
        setError("Please add at least one service");
        setIsSubmitting(false);
        return;
      }

      // Validate all services have equipment selected
      const incompleteServices = formData.services.filter(s => !s.equipmentId);
      if (incompleteServices.length > 0) {
        setError("Please select equipment for all services");
        setIsSubmitting(false);
        return;
      }

      // Calculate total quantity (sum of all service quantities)
      const totalQuantity = formData.services.reduce((sum, service) => {
        return sum + (service.quantity || 1);
      }, 0);

      // Prepare the services array with string serviceId
      const servicesPayload = formData.services.map(s => ({
        serviceId: String(s.serviceId), // Convert to string
        quantity: s.quantity,
        equipmentId: s.equipmentId
      }));

      const payload = {
        farmer: formData.farmer,
        projectId: formData.projectId,
        hub: modalSelectedLga,
        totalCost: calculateTotal(),
        quantity: totalQuantity, // Keep for backward compatibility
        services: servicesPayload, // Send services array with string serviceId
        transactionType: "Service"
      };

      console.log("Submitting payload:", JSON.stringify(payload, null, 2));

      const response = await api.post('/transactions', payload);
      
      if (response.status >= 200 && response.status < 300) {
        // Refresh transactions
        const transactionsResponse = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/transactions`);
        setTransactions(Array.isArray(transactionsResponse.data) 
          ? transactionsResponse.data 
          : (Array.isArray(transactionsResponse.data?.data) 
            ? transactionsResponse.data.data 
            : []));
        
        // Reset form
        setIsModalOpen(false);
        setFormData({
          farmer: "",
          farmerId: "",
          phoneNumber: "",
          farmerFirstName: "",
          farmerLastName: "",
          projectId: "",
          hub: "",
          services: []
        });
        setModalSelectedState("");
        setModalSelectedLga("");
        setSelectedFarmer(null);
        setError(null);
      }
    } catch (error) {
      console.error("Submission error:", error.response?.data);
      setError(error.response?.data?.message || error.response?.data?.errors || 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle view transaction
  const handleView = (transaction) => {
    setSelectedTransaction(transaction);
    setViewModalOpen(true);
  };

  // Handle confirm transaction
  const handleConfirmTransaction = async () => {
    if (!selectedPaymentMethod) {
      setError("Please select a payment method");
      return;
    }

    setIsConfirming(true);
    try {
      const payload = {
        paymentMethod: selectedPaymentMethod,
        transactionId: confirmTransactionId,
      };
      
      const response = await api.put(`/transactions/${confirmTransactionId}/confirm`, payload);
      
      if (response.status >= 200 && response.status < 300) {
        // Refresh transactions
        const transactionsResponse = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/transactions`);
        setTransactions(Array.isArray(transactionsResponse.data) 
          ? transactionsResponse.data 
          : (Array.isArray(transactionsResponse.data?.data) 
            ? transactionsResponse.data.data 
            : []));
        
        setIsConfirmModalOpen(false);
        setConfirmTransactionId(null);
        setSelectedPaymentMethod("");
        setError(null);
      }
    } catch (error) {
      console.error("Error confirming transaction:", error);
      setError(error.response?.data?.message || 'Failed to confirm transaction');
    } finally {
      setIsConfirming(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: page }));
    }
  };

  const handlePerPageChange = (e) => {
    const perPage = parseInt(e.target.value);
    setPagination(prev => ({ ...prev, perPage, currentPage: 1 }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Check if user is National Coordinator
  const isNationalCoordinator = userRole === 'National Coordinator';

  // Beautified status badge function
 // Beautified status badge function - UPDATED COLORS
// Simplified status badges
const getStatusBadge = (status) => {
  const statusText = status?.toLowerCase();
  
  if (statusText === 'paid' || statusText === 'completed') {
    return <span className="badge bg-success">Paid</span>;
  } else if (statusText === 'pending') {
    return <span className="badge bg-warning">Pending</span>;
  } else if (statusText === 'failed' || statusText === 'cancelled') {
    return <span className="badge bg-danger">{status}</span>;
  } else {
    return <span className="badge bg-secondary">{status || 'Unknown'}</span>;
  }
};
  return (
    <div className="col-lg-12">
      <div className="card">
        <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <h5 className="card-title mb-3 mb-md-0">Transactions</h5>
          {(['National Coordinator', 'State Coordinator', 'SUPER ADMIN', 'ADMIN'].includes(userRole?.trim())) && (
            <button
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
              disabled={loading}
            >
              Add Transaction
            </button>
          )}
        </div>
        
        <div className="card-body">
          {/* Filters Section */}
          <div className="row mb-4 g-3">
            {(['National Coordinator', 'SUPER ADMIN', 'ADMIN'].includes(userRole?.trim())) && (
              <div className="col-12 col-md-6 col-lg-3">
                <label htmlFor="stateFilter" className="form-label">Filter by State</label>
                <select
                  id="stateFilter"
                  className="form-select"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
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
                  disabled={lgas.length === 0}
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
                  if (['National Coordinator', 'SUPER ADMIN', 'ADMIN'].includes(userRole?.trim())) {
                    setSelectedState("");
                  }
                  setSelectedLga("");
                  setSelectedProject("");
                  setSearchTerm("");
                }}
                disabled={
                  (['National Coordinator', 'SUPER ADMIN', 'ADMIN'].includes(userRole?.trim())) ?
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
          
          {/* Transactions Table */}
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
                      <th scope="col">Farmer</th>
                      <th scope="col">Hub</th>
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
                          <td>
                            <span className="font-mono text-sm">
                              {transaction.transactionReference}
                            </span>
                          </td>
                          <td>
                            <div className="font-medium">
                              {transaction.farmer_info?.farmerFirstName} {transaction.farmer_info?.farmerLastName}
                            </div>
                            <div className="text-xs text-muted">
                              {transaction.farmer_info?.phoneNumber}
                            </div>
                          </td>
                          <td>{transaction.hub_info?.lgas?.lgaName}</td>
                          <td className="font-semibold">
                            ₦{parseFloat(transaction.totalCost || 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </td>
                          <td>
                            {getStatusBadge(transaction.transactionStatus)}
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">
                              {transaction.projects?.projectName || 'No Project'}
                            </span>
                          </td>
                          <td>{formatDate(transaction.created_at)}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                                onClick={() => handleView(transaction)}
                                title="View Details"
                              >
                                <Icon icon="iconamoon:eye-light" width={16} />
                                <span className="d-none d-md-inline">View</span>
                              </button>
                              
                              {(transaction.transactionStatus === "Pending" || transaction.transactionStatus === "PENDING") && (
                                <button
                                  className="btn btn-sm btn-success d-flex align-items-center gap-1"
                                  onClick={() => {
                                    setConfirmTransactionId(transaction.transactionId);
                                    setSelectedPaymentMethod("");
                                    setIsConfirmModalOpen(true);
                                  }}
                                  title="Confirm Payment"
                                  disabled={isConfirming}
                                >
                                  <Icon icon="ion:checkmark-circle-outline" width={16} />
                                  <span className="d-none d-md-inline">Confirm</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center py-4">
                          <div className="text-muted">
                            <Icon icon="mdi:file-document-outline" className="fs-1 mb-2" />
                            <p>No transactions found</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
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
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <motion.div 
              className="modal-content"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title text-white">Create Transaction</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData({
                      farmer: "",
                      farmerId: "",
                      phoneNumber: "",
                      farmerFirstName: "",
                      farmerLastName: "",
                      projectId: "",
                      hub: "",
                      services: []
                    });
                    setModalSelectedState("");
                    setModalSelectedLga("");
                    setSelectedFarmer(null);
                    setFarmerSearchTerm("");
                    setSearchResults([]);
                    setError(null);
                  }}
                  disabled={isSubmitting}
                />
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    {/* State Selection for National Coordinator */}
                    {isNationalCoordinator && (
                      <div className="col-md-6">
                        <label className="form-label">State *</label>
                        <select
                          className="form-select"
                          value={modalSelectedState}
                          onChange={(e) => {
                            setModalSelectedState(e.target.value);
                            setModalSelectedLga("");
                            setFormData(prev => ({ ...prev, hub: "", services: [] }));
                          }}
                          required
                          disabled={isSubmitting}
                        >
                          <option value="">Select State</option>
                          {states.map(state => (
                            <option key={state.id} value={state.id}>
                              {state.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Hub Selection */}
                    <div className="col-md-6">
                      <label className="form-label">Hub *</label>
                      <select
                        className="form-select"
                        value={modalSelectedLga}
                        onChange={(e) => {
                          setModalSelectedLga(e.target.value);
                          setFormData(prev => ({ ...prev, hub: e.target.value, services: [] }));
                        }}
                        required
                        disabled={isSubmitting || (isNationalCoordinator && !modalSelectedState)}
                      >
                        <option value="">Select Hub</option>
                        {lgas.map(lga => (
                          <option key={lga.id} value={lga.id}>
                            {lga.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Project Selection */}
                    <div className="col-md-6">
                      <label className="form-label">Project *</label>
                      <select
                        className="form-select"
                        value={formData.projectId}
                        onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                        required
                        disabled={isSubmitting}
                      >
                        <option value="">Select Project</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Farmer Section */}
                    <div className="col-12">
                      <label className="form-label">Farmer *</label>
                      
                      {/* Selected Farmer Display */}
                      {selectedFarmer ? (
                        <div className="alert alert-success mb-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong>Selected Farmer:</strong> {selectedFarmer.farmerFirstName} {selectedFarmer.farmerLastName}
                              <br />
                              <small>Phone: {selectedFarmer.phoneNumber} | ID: {selectedFarmer.farmerId}</small>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                setSelectedFarmer(null);
                                setFormData(prev => ({
                                  ...prev,
                                  farmer: "",
                                  farmerId: "",
                                  phoneNumber: "",
                                  farmerFirstName: "",
                                  farmerLastName: ""
                                }));
                              }}
                              disabled={isSubmitting}
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Search Existing Farmer */}
                          <div className="mb-3">
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Search farmer by phone number or ID"
                                value={farmerSearchTerm}
                                onChange={(e) => setFarmerSearchTerm(e.target.value)}
                                disabled={isSubmitting || !modalSelectedLga}
                              />
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={handleSearchFarmer}
                                disabled={isSearchingFarmer || !farmerSearchTerm || !modalSelectedLga}
                              >
                                {isSearchingFarmer ? 'Searching...' : 'Search'}
                              </button>
                            </div>
                          </div>

                          {/* Search Results */}
                          {searchResults.length > 0 && (
                            <div className="mb-3">
                              <div className="card">
                                <div className="card-body p-2">
                                  <h6 className="card-title">Search Results</h6>
                                  <div className="list-group">
                                    {searchResults.map(farmer => (
                                      <button
                                        key={farmer.farmerId}
                                        type="button"
                                        className="list-group-item list-group-item-action"
                                        onClick={() => handleSelectFarmer(farmer)}
                                      >
                                        {farmer.farmerFirstName} {farmer.farmerLastName} - {farmer.phoneNumber}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Create New Farmer */}
                          <div className="card">
                            <div className="card-body">
                              <h6 className="card-title">Or Create New Farmer</h6>
                              <div className="row g-2">
                                <div className="col-md-4">
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="First Name"
                                    value={formData.farmerFirstName}
                                    onChange={(e) => setFormData({...formData, farmerFirstName: e.target.value})}
                                    disabled={isSubmitting || isCreatingFarmer}
                                  />
                                </div>
                                <div className="col-md-4">
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Last Name"
                                    value={formData.farmerLastName}
                                    onChange={(e) => setFormData({...formData, farmerLastName: e.target.value})}
                                    disabled={isSubmitting || isCreatingFarmer}
                                  />
                                </div>
                                <div className="col-md-3">
                                  <input
                                    type="tel"
                                    className="form-control form-control-sm"
                                    placeholder="Phone Number"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                                    disabled={isSubmitting || isCreatingFarmer}
                                  />
                                </div>
                                <div className="col-md-1">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary w-100"
                                    onClick={handleCreateFarmer}
                                    disabled={isSubmitting || isCreatingFarmer || !formData.farmerFirstName || !formData.farmerLastName || !formData.phoneNumber}
                                  >
                                    {isCreatingFarmer ? '...' : 'Create'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Services Section */}
                    <div className="col-12">
                      <label className="form-label">Services *</label>
                      
                      {/* Services Dropdown */}
                      {modalSelectedLga && services.length > 0 ? (
                        <select
                          className="form-select mb-3"
                          onChange={(e) => {
                            const serviceId = e.target.value;
                            if (serviceId) {
                              const service = services.find(s => s.serviceId == serviceId);
                              if (service) handleAddService(service);
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
                              disabled={formData.services.some(s => s.serviceId === service.serviceId)}
                            >
                              {service.serviceName} - ₦{service.cost} per {service.measuringUnit}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="alert alert-warning">
                          {modalSelectedLga ? 'No services available in this hub' : 'Select a hub first'}
                        </div>
                      )}

                      {/* Selected Services List */}
                      {formData.services.length > 0 && (
                        <div className="table-responsive">
                          <table className="table table-sm">
                            <thead>
                              <tr>
                                <th>Service</th>
                                <th>Unit Price</th>
                                <th>Quantity</th>
                                <th>Equipment</th>
                                <th>Total</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {formData.services.map(service => (
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
                                      onChange={(e) => handleQuantityChange(service.serviceId, e.target.value)}
                                      disabled={isSubmitting}
                                    />
                                  </td>
                                  <td style={{ width: '200px' }}>
                                    <select
                                      className="form-select form-select-sm"
                                      value={service.equipmentId || ""}
                                      onChange={(e) => handleEquipmentChange(service.serviceId, e.target.value)}
                                      disabled={isSubmitting || !service.availableEquipment || service.availableEquipment.length === 0}
                                    >
                                      <option value="">Select equipment...</option>
                                      {service.availableEquipment?.map(item => (
                                        <option key={item.equipmentId} value={item.equipmentId}>
                                          {item.serialNumber} - {item.equipmentName}
                                        </option>
                                      ))}
                                    </select>
                                    {(!service.availableEquipment || service.availableEquipment.length === 0) && (
                                      <small className="text-danger">No equipment available</small>
                                    )}
                                  </td>
                                  <td>₦{(service.cost * service.quantity).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}</td>
                                  <td className="text-end">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleRemoveService(service.serviceId)}
                                      disabled={isSubmitting}
                                    >
                                      <Icon icon="mdi:close" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Total Cost Display */}
                    {formData.services.length > 0 && (
                      <div className="col-12">
                        <div className="alert alert-primary">
                          <strong>Total Cost: ₦{calculateTotal()}</strong>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {error && (
                      <div className="col-12">
                        <div className="alert alert-danger">{error}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsModalOpen(false);
                      setFormData({
                        farmer: "",
                        farmerId: "",
                        phoneNumber: "",
                        farmerFirstName: "",
                        farmerLastName: "",
                        projectId: "",
                        hub: "",
                        services: []
                      });
                      setModalSelectedState("");
                      setModalSelectedLga("");
                      setSelectedFarmer(null);
                      setFarmerSearchTerm("");
                      setSearchResults([]);
                      setError(null);
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || formData.services.length === 0 || !formData.projectId || !modalSelectedLga || !selectedFarmer || (isNationalCoordinator && !modalSelectedState)}
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
            </motion.div>
          </div>
        </div>
      )}

      {/* View Transaction Modal */}
      {viewModalOpen && selectedTransaction && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <motion.div 
              className="modal-content"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title text-white">Transaction Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setViewModalOpen(false)}
                />
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="border-bottom pb-2 mb-3">Transaction Information</h6>
                    <div className="mb-3">
                      <label className="form-label text-muted">Transaction ID</label>
                      <p className="form-control-static fw-bold">{selectedTransaction.transactionId}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Reference</label>
                      <p className="form-control-static font-monospace">{selectedTransaction.transactionReference}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Status</label>
                      <p className="form-control-static">
                        {getStatusBadge(selectedTransaction.transactionStatus)}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Total Amount</label>
                      <p className="form-control-static fw-bold fs-5 text-success">
                        ₦{parseFloat(selectedTransaction.totalCost || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Payment Method</label>
                      <p className="form-control-static">
                        {selectedTransaction.paymentMethod || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="border-bottom pb-2 mb-3">Farmer Information</h6>
                    <div className="mb-3">
                      <label className="form-label text-muted">Farmer Name</label>
                      <p className="form-control-static fw-bold">
                        {selectedTransaction.farmer_info?.farmerFirstName} {selectedTransaction.farmer_info?.farmerLastName}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Phone Number</label>
                      <p className="form-control-static">{selectedTransaction.farmer_info?.phoneNumber}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Farmer ID</label>
                      <p className="form-control-static font-monospace">{selectedTransaction.farmer}</p>
                    </div>
                    
                    <h6 className="border-bottom pb-2 mb-3 mt-4">Hub Information</h6>
                    <div className="mb-3">
                      <label className="form-label text-muted">Hub Name</label>
                      <p className="form-control-static">{selectedTransaction.hub_info?.lgas?.lgaName}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Project</label>
                      <p className="form-control-static">
                        <span className="badge bg-light text-dark">
                          {selectedTransaction.projects?.projectName || 'No Project'}
                        </span>
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Date Created</label>
                      <p className="form-control-static">{formatDate(selectedTransaction.created_at)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Services Section if available */}
                {selectedTransaction.transaction_commodity?.length > 0 && (
                  <div className="mt-4">
                    <h6 className="border-bottom pb-2">Services & Commodities</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Service/Commodity</th>
                            <th>Details</th>
                            <th>Reference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTransaction.transaction_commodity.map((commodity, idx) => (
                            <tr key={idx}>
                              <td>{commodity.commodities?.commodityName}</td>
                              <td>{commodity.commodities?.description || 'No description'}</td>
                              <td className="font-monospace">{commodity.transactionReference}</td>
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
                {(selectedTransaction.transactionStatus === "Pending" || selectedTransaction.transactionStatus === "PENDING") && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => {
                      setViewModalOpen(false);
                      setConfirmTransactionId(selectedTransaction.transactionId);
                      setSelectedPaymentMethod("");
                      setIsConfirmModalOpen(true);
                    }}
                  >
                    Confirm Payment
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Confirm Payment Modal */}
      {isConfirmModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <motion.div 
              className="modal-content"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title text-white">Confirm Payment</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setIsConfirmModalOpen(false);
                    setConfirmTransactionId(null);
                    setSelectedPaymentMethod("");
                    setError(null);
                  }}
                  disabled={isConfirming}
                />
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <Icon icon="ion:checkmark-circle-outline" className="text-success" width={48} />
                  <h5 className="mt-2">Confirm Transaction Payment</h5>
                  <p className="text-muted">Transaction ID: {confirmTransactionId}</p>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="paymentMethod" className="form-label">Select Payment Method *</label>
                  <select
                    id="paymentMethod"
                    className="form-select"
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    disabled={isConfirming}
                    required
                  >
                    <option value="">Choose payment method...</option>
                    {paymentMethods.map(method => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {error && (
                  <div className="alert alert-danger">{error}</div>
                )}
                
                <div className="alert alert-info">
                  <small>
                    <Icon icon="mdi:information" className="me-1" />
                    Once confirmed, this transaction will be marked as paid and cannot be reversed.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsConfirmModalOpen(false);
                    setConfirmTransactionId(null);
                    setSelectedPaymentMethod("");
                    setError(null);
                  }}
                  disabled={isConfirming}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleConfirmTransaction}
                  disabled={isConfirming || !selectedPaymentMethod}
                >
                  {isConfirming ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Confirming...
                    </>
                  ) : (
                    'Confirm Payment'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
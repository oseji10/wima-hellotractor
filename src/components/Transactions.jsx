"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";
import { v4 as uuidv4 } from 'uuid';

const Transactions = () => {
  // State management
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingFarmer, setIsCreatingFarmer] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmTransactionId, setConfirmTransactionId] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(""); // New state for payment method
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
  const [equipment, setEquipment] = useState([]);
  const [newFarmerData, setNewFarmerData] = useState({
    farmerFirstName: "",
    farmerLastName: "",
    phoneNumber: "",
    gender: "",
    ageBracket: "",
  });

  
  // Predefined payment methods (replace with API call if available)
  const paymentMethods = [
    { id: "cash", name: "Cash" },
    { id: "bank_transfer", name: "Bank Transfer" },
    { id: "mobile_money", name: "Mobile Money" },
  ];

  // Form state
  const [formData, setFormData] = useState({
    msp: "",
    farmer: "",
    transactionType: "Service",
    totalCost: "",
    hub: "",
    transaction_commodity: [],
    projectId: "",
    equipment: []
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
        if (response.data.role === 'State Coordinator') {
          setUserStateId(response.data.stateId || null);
          setUserLgaId(response.data.communityId || null);
          setSelectedState(response.data.stateId || "");
          setModalSelectedState(response.data.stateId || "");
          if (response.data.communityId) {
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
      if (userRole !== 'State Coordinator') {
        setModalSelectedLga("");
      }
      return;
    }

    const effectiveStateId = selectedState || modalSelectedState;
    if (!effectiveStateId) {
      setLgas([]);
      setSelectedLga("");
      if (userRole !== 'State Coordinator') {
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

  // Fetch equipment based on selected hub and service
  useEffect(() => {
    const fetchEquipment = async () => {
      if (!modalSelectedLga || selectedServices.length === 0) {
        setEquipment([]);
        setError("Please select a hub and at least one service to load equipment.");
        return;
      }
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/equipment/search`, {
          params: {
            hubId: modalSelectedLga,
            serviceIds: selectedServices.map(s => s.serviceId).join(',')
          }
        });
        const equipmentData = response.data || [];
        console.log("Equipment API response:", equipmentData);
        setEquipment(equipmentData);
        if (equipmentData.length === 0) {
          setError("No equipment available for the selected hub and services.");
        } else {
          setError(null);
        }
      } catch (error) {
        console.error("Error fetching equipment:", error);
        setEquipment([]);
        setError("Failed to load equipment. Please try again.");
      }
    };
    fetchEquipment();
  }, [modalSelectedLga, selectedServices]);

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
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (userRole) {
      fetchTransactions();
    }
  }, [pagination.currentPage, pagination.perPage, searchTerm, selectedProject, selectedState, selectedLga, userRole, userStateId]);

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

  const handleConfirmTransaction = async (transactionId) => {
    if (!selectedPaymentMethod) {
      setError("Please select a payment method");
      return;
    }

    // Find the transaction to get the hub/communityId
    const transaction = transactions.find(t => t.transactionId === transactionId);
    if (!transaction) {
      setError("Transaction not found");
      return;
    }

    const hubId = transaction.hub || transaction.hub_info?.lga_info?.lgaId || transaction.communityId;

    setIsConfirming(true);
    try {
      const payload = {
        paymentMethod: selectedPaymentMethod,
        hub: hubId,
        transactionId: transactionId,
      };
      const response = await api.put(`/transactions/${transactionId}/confirm`, payload);
      if (response.status >= 200 && response.status < 300) {
        // Refresh transactions
        const transactionsResponse = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/transactions`);
        const newTransactions = Array.isArray(transactionsResponse.data) 
          ? transactionsResponse.data 
          : (Array.isArray(transactionsResponse.data?.data) ? transactionsResponse.data.data : []);
        setTransactions(newTransactions);
        setIsConfirmModalOpen(false);
        setConfirmTransactionId(null);
        setSelectedPaymentMethod("");
        setError(null);
      } else {
        throw new Error(response.data?.message || 'Failed to confirm transaction');
      }
    } catch (error) {
      console.error("Error confirming transaction:", error);
      setError(error.response?.data?.message || 'Failed to confirm transaction');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleUpdateProject = async (transactionId, projectId) => {
    try {
      const response = await api.put(`/transactions/${transactionId}/project-type`, { projectId, transactionId: transactionId });
      if (response.status >= 200 && response.status < 300) {
        // Refresh transactions
        const transactionsResponse = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/transactions`);
        const newTransactions = Array.isArray(transactionsResponse.data) 
          ? transactionsResponse.data 
          : (Array.isArray(transactionsResponse.data?.data) ? transactionsResponse.data.data : []);
        setTransactions(newTransactions);
        setError(null);
      } else {
        throw new Error(response.data?.message || 'Failed to update project');
      }
    } catch (error) {
      console.error("Error updating project:", error);
      setError(error.response?.data?.message || 'Failed to update project');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleSearchFarmers = async () => {
    setIsSearching(true);
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
      setIsSearching(false);
    }
  };

  const handleSelectFarmer = (farmer) => {
    setSelectedFarmer(farmer);
    setFormData(prev => ({
      ...prev,
      farmer: farmer.farmerId,
      msp: farmer.msp,
      hub: farmer.hub || (userRole === 'State Coordinator' ? modalSelectedLga : "")
    }));
    setFarmerSearchTerm("");
    setSearchResults([]);
    setIsFarmerSearchOpen(false);
  };

  const handleCreateFarmer = async (e) => {
    e.preventDefault();
    setIsCreatingFarmer(true);
    try {
      const payload = {
        ...newFarmerData,
        hub: modalSelectedLga,
        stateId: userRole === 'State Coordinator' ? userStateId : modalSelectedState
      };
      const response = await api.post('/farmers', payload);
      const newFarmer = Array.isArray(response.data) ? response.data[0] : response.data;
      setSelectedFarmer(newFarmer);
      setFormData(prev => ({
        ...prev,
        farmer: newFarmer.farmerId,
        msp: newFarmer.msp || null,
        hub: newFarmer.hub || modalSelectedLga
      }));
      setNewFarmerData({
        farmerFirstName: "",
        farmerLastName: "",
        phoneNumber: "",
        gender: "",
        ageBracket: "",
      });
      setFarmerSearchTerm("");
      setSearchResults([]);
      setIsFarmerSearchOpen(false);
    } catch (error) {
      console.error("Error creating farmer:", error);
      setError(error.response?.data?.message || "Failed to create farmer");
    } finally {
      setIsCreatingFarmer(false);
    }
  };

  const handleAddService = (service) => {
    if (!selectedServices.some(s => s.serviceId === service.serviceId)) {
      const newService = {
        ...service,
        quantity: 1,
        totalCost: parseFloat(service.price || service.cost),
        equipmentId: ""
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
        totalCost: (parseFloat(prev.totalCost || 0) - parseFloat(serviceToRemove.totalCost)).toFixed(2),
        equipment: prev.equipment.filter(id => id !== serviceToRemove.equipmentId)
      }));
    }
  };

  const handleSelectEquipment = (serviceId, equipmentId) => {
    const updatedServices = selectedServices.map(s => 
      s.serviceId === serviceId ? { ...s, equipmentId } : s
    );
    setSelectedServices(updatedServices);
    
    const allEquipmentIds = updatedServices
      .filter(s => s.equipmentId)
      .map(s => s.equipmentId);
    setFormData(prev => ({
      ...prev,
      equipment: allEquipmentIds
    }));
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
      if (userRole === 'National Coordinator') {
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
          hub: "",
          transaction_commodity: [],
          projectId: "",
          equipment: []
        });
        setSelectedFarmer(null);
        setSelectedServices([]);
        setSelectedCommodities([]);
        setError(null);
        if (userRole === 'National Coordinator') {
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

  const isFarmerSearchEnabled = userRole === 'National Coordinator' 
    ? modalSelectedState && modalSelectedLga 
    : userRole === 'State Coordinator' 
      ? modalSelectedLga 
      : true;

  return (
    <div className="col-lg-12">
      <div className="card">
        <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <h5 className="card-title mb-3 mb-md-0">Transactions</h5>
          {(userRole === 'National Coordinator' || userRole === 'State Coordinator' || userRole === 'SUPER ADMIN' || userRole === 'ADMIN') && (
            <button
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
              disabled={loading || (userRole === 'State Coordinator' && !userStateId)}
            >
              Add Transaction
            </button>
          )}
        </div>
        
        <div className="card-body">
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
                          <td>{transaction.transactionReference}</td>
                          <td>
                            {transaction.farmer_info?.farmerFirstName} {transaction.farmer_info?.farmerLastName}
                          </td>
                          <td>{transaction.hub_info?.lgas?.lgaName}</td>
                          <td>₦{parseFloat(transaction.totalCost || 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}</td>
                          <td>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                transaction.transactionStatus === "Paid" || transaction.transactionStatus === "PAID"
                                  ? "bg-primary text-white"
                                  : transaction.transactionStatus === "Pending" || transaction.transactionStatus === "PENDING"
                                  ? "bg-yellow text-black"
                                  : "bg-red text-red"
                              }`}
                            >
                              {transaction.transactionStatus}
                            </span>
                          </td>
                          <td>
                            {transaction.projects?.projectName ? (
                              transaction.projects.projectName
                            ) : (
                              <select
                                className="form-select form-select-sm"
                                value=""
                                onChange={(e) => handleUpdateProject(transaction.transactionId, e.target.value)}
                                disabled={loadingProjects || isConfirming}
                              >
                                <option value="">Select project...</option>
                                {projects.map(project => (
                                  <option key={project.id} value={project.id}>
                                    {project.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td>{formatDate(transaction.created_at)}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="w-32-px h-32-px bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleView(transaction)}
                                title="View"
                              >
                                <Icon icon="iconamoon:eye-light" width={16} />
                              </button>
                              {(transaction.transactionStatus === "Pending" || transaction.transactionStatus === "PENDING") && (
                                <button
                                  className="w-32-px h-32-px bg-success-light text-success-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                  onClick={() => {
                                    setConfirmTransactionId(transaction.transactionId);
                                    setSelectedPaymentMethod(""); // Reset payment method
                                    setIsConfirmModalOpen(true);
                                  }}
                                  title="Confirm Transaction"
                                  disabled={isConfirming}
                                >
                                  <Icon icon="ion:checkmark-circle-outline" width={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center py-4">
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
                      hub: "",
                      transaction_commodity: [],
                      projectId: "",
                      equipment: []
                    });
                    setSelectedFarmer(null);
                    setSelectedServices([]);
                    setSelectedCommodities([]);
                    setError(null);
                    if (userRole === 'National Coordinator') {
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
                    {userRole === 'National Coordinator' && (
                      <div className="col-md-6">
                        <label className="form-label">State</label>
                        <select
                          className="form-select"
                          value={modalSelectedState}
                          onChange={(e) => {
                            setModalSelectedState(e.target.value);
                            setModalSelectedLga("");
                            setFormData(prev => ({ ...prev, hub: "" }));
                            setSelectedServices([]);
                          }}
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
                    
                    {(userRole === 'National Coordinator' || userRole === 'State Coordinator') && (
                      <div className="col-md-6">
                        <label className="form-label">Hub</label>
                        <select
                          className="form-select"
                          value={modalSelectedLga}
                          onChange={(e) => {
                            setModalSelectedLga(e.target.value);
                            setFormData(prev => ({ ...prev, hub: e.target.value }));
                            setSelectedServices([]);
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
                    
                    <div className="col-md-12">
                      <label className="form-label">Farmer</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          value={selectedFarmer ? 
                            `${selectedFarmer.farmerFirstName} ${selectedFarmer.farmerLastName} (${selectedFarmer.hubs?.lgas?.lgaName || 'No Hub'})` : 
                            ""}
                          readOnly
                        />
                        <button 
                          className="btn btn-outline-primary" 
                          type="button"
                          onClick={() => setIsFarmerSearchOpen(true)}
                          disabled={!isFarmerSearchEnabled}
                        >
                          Search
                        </button>
                      </div>
                    </div>
                    
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
                  </div>
                  
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
                        disabled={isSubmitting || !modalSelectedLga}
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
                              <th>Equipment</th>
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
                                <td style={{ width: '200px' }}>
                                  <select
                                    className="form-select form-select-sm"
                                    value={service.equipmentId || ""}
                                    onChange={(e) => handleSelectEquipment(service.serviceId, e.target.value)}
                                    disabled={isSubmitting || !modalSelectedLga || selectedServices.length === 0}
                                  >
                                    <option value="">Select equipment...</option>
                                    {equipment
                                      .filter(item => Number(item.serviceCategoryId) === Number(service.serviceCategoryId))
                                      .filter(item => !selectedServices.some(s => s.equipmentId === item.equipmentId && s.serviceId !== service.serviceId))
                                      .map(item => (
                                        <option 
                                          key={item.equipmentId} 
                                          value={item.equipmentId}
                                        >
                                          {item.serialNumber} - {item.equipmentName}
                                        </option>
                                      ))}
                                  </select>
                                  {equipment.length === 0 && modalSelectedLga && selectedServices.length > 0 && (
                                    <small className="text-danger">No equipment available for this hub/service.</small>
                                  )}
                                </td>
                                <td>₦{(service.totalCost || service.cost).toLocaleString()}</td>
                                <td className="text-end">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleRemoveService(service.serviceId)}
                                    disabled={isSubmitting}
                                  >
                                    X
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
                          hub: "",
                          transaction_commodity: [],
                          projectId: "",
                          equipment: []
                        });
                        setSelectedFarmer(null);
                        setSelectedServices([]);
                        setSelectedCommodities([]);
                        setError(null);
                        if (userRole === 'National Coordinator') {
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
                        (userRole === 'National Coordinator' && (!modalSelectedState || !modalSelectedLga)) ||
                        (userRole === 'State Coordinator' && !modalSelectedLga)}
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
                  onClick={() => {
                    setIsFarmerSearchOpen(false);
                    setNewFarmerData({
                      farmerFirstName: "",
                      farmerLastName: "",
                      phoneNumber: "",
                      gender: "",
                      ageBracket: "",
                    });
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-4">
                  <h6>Add New Farmer</h6>
                  <form onSubmit={handleCreateFarmer}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">First Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newFarmerData.farmerFirstName}
                          onChange={(e) => setNewFarmerData(prev => ({ ...prev, farmerFirstName: e.target.value }))}
                          required
                          disabled={isCreatingFarmer}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newFarmerData.farmerLastName}
                          onChange={(e) => setNewFarmerData(prev => ({ ...prev, farmerLastName: e.target.value }))}
                          required
                          disabled={isCreatingFarmer}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone Number</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={newFarmerData.phoneNumber}
                          onChange={(e) => setNewFarmerData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          required
                          disabled={isCreatingFarmer}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Gender</label>
                        <select
                          className="form-select"
                          value={newFarmerData.gender}
                          onChange={(e) => setNewFarmerData(prev => ({ ...prev, gender: e.target.value }))}
                          required
                          disabled={isCreatingFarmer}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Age</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={newFarmerData.ageBracket}
                          onChange={(e) => setNewFarmerData(prev => ({ ...prev, ageBracket: e.target.value }))}
                          required
                          disabled={isCreatingFarmer}
                        />
                      </div>
                      <div className="col-md-6 d-flex align-items-end">
                        <button
                          type="submit"
                          className="btn btn-primary w-100"
                          disabled={isCreatingFarmer || !isFarmerSearchEnabled}
                        >
                          {isCreatingFarmer ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                              Creating...
                            </>
                          ) : (
                            'Create Farmer'
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
                
                <br/>
                <h6>Search Farmer</h6>

                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by farmer name or ID..."
                    value={farmerSearchTerm}
                    onChange={(e) => setFarmerSearchTerm(e.target.value)}
                    disabled={!isFarmerSearchEnabled}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={isSearching || !isFarmerSearchEnabled}
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
                          <th>Hub</th>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.map(farmer => (
                          <tr key={farmer.farmerId}>
                            <td>{farmer.hubs?.lgas?.lgaName || 'No Hub'}</td>
                            <td>{farmer.farmerFirstName} {farmer.farmerLastName}</td>
                            <td>{farmer.phoneNumber}</td>
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
                  onClick={() => {
                    setIsFarmerSearchOpen(false);
                    setNewFarmerData({
                      farmerFirstName: "",
                      farmerLastName: "",
                      phoneNumber: "",
                      gender: "",
                      ageBracket: "",
                    });
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title text-white">Confirm Transaction</h5>
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
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to confirm transaction ID {confirmTransactionId}?</p>
                <div className="mb-3">
                  <label htmlFor="paymentMethod" className="form-label">Payment Method</label>
                  <select
                    id="paymentMethod"
                    className="form-select"
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    disabled={isConfirming}
                    required
                  >
                    <option value="">Select payment method...</option>
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
                  onClick={() => handleConfirmTransaction(confirmTransactionId)}
                  disabled={isConfirming || !selectedPaymentMethod}
                >
                  {isConfirming ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Confirming...
                    </>
                  ) : (
                    'Confirm'
                  )}
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
                      <p className="form-control-static">{selectedTransaction.paymentMethod || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Project</label>
                      <p className="form-control-static">{selectedTransaction.projects?.projectName || 'N/A'}</p>
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
                      <p className="form-control-static">{selectedTransaction.hub_info?.lgas?.lgaName || `Hub #${selectedTransaction.hub}`}</p>
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
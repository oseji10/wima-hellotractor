"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const AgentsTable = () => {
  // State management
  const [allAgents, setAllAgents] = useState([]);
  const [displayedAgents, setDisplayedAgents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    total: 0,
  });
  const [userRole, setUserRole] = useState(null);

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/user`);
        setUserRole(response.data.role);
      } catch (error) {
        console.error("Error fetching user role:", error);
        setError("Failed to load user profile");
      }
    };
    fetchUserRole();
  }, []);

  // Fetch Agents with filtering and pagination
  useEffect(() => {
    const fetchAgents = async () => {
      setLoadingAgents(true);
      try {
        const params = {
          page: pagination.currentPage,
          per_page: pagination.perPage,
        };

        if (searchTerm) params.search = searchTerm;

        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/agents`, { params });
        const data = response.data;
        const agentsData = Array.isArray(data.data) ? data.data : [];

        setDisplayedAgents(agentsData);
        setAllAgents(agentsData);
        setPagination(prev => ({
          ...prev,
          totalPages: data.last_page || 1,
          total: data.total || 0,
        }));
      } catch (error) {
        console.error("Error fetching agents:", error);
        setError("Failed to load agents");
        setAllAgents([]);
        setDisplayedAgents([]);
      } finally {
        setLoadingAgents(false);
      }
    };
    if (userRole) {
      fetchAgents();
    }
  }, [pagination.currentPage, pagination.perPage, searchTerm, userRole]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    if (searchTerm) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [searchTerm]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setEmail("");
    setError(null);
  };

  // View Modal Handler
  const handleView = (agent) => {
    setSelectedAgent(agent);
    setViewModalOpen(true);
  };

  // Edit Modal Handler
  const handleEdit = (agent) => {
    setSelectedAgent(agent);
    setFirstName(agent.users?.firstName || "");
    setLastName(agent.users?.lastName || "");
    setPhoneNumber(agent.users?.phoneNumber || "");
    setEmail(agent.users?.email || "");
    setEditModalOpen(true);
  };

  // Delete Modal Handler
  const handleDelete = (agent) => {
    setSelectedAgent(agent);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
      const response = await api.delete(`/agents/${selectedAgent.id}`);
      
      if (response.status >= 200 && response.status < 300) {
        setAllAgents(prev => prev.filter(a => a.id !== selectedAgent.id));
        setDisplayedAgents(prev => prev.filter(a => a.id !== selectedAgent.id));
        setDeleteModalOpen(false);
      } else {
        throw new Error(response.data?.message || 'Failed to delete agent');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Agent
  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        firstName,
        lastName,
        phoneNumber,
        email,
      };
      
      const response = await api.put(`/agents/${selectedAgent.id}`, payload);
      
      if (response.status >= 200 && response.status < 300) {
        const updatedAgent = {
          ...response.data,
          users: {
            ...selectedAgent.users,
            firstName,
            lastName,
            phoneNumber,
            email,
          }
        };
        
        setAllAgents(prev => 
          prev.map(a => a.id === selectedAgent.id ? updatedAgent : a)
        );
        setDisplayedAgents(prev => 
          prev.map(a => a.id === selectedAgent.id ? updatedAgent : a)
        );
        
        setEditModalOpen(false);
        setError(null);
      } else {
        throw new Error(response.data?.message || 'Failed to update agent');
      }
    } catch (error) {
      console.error("Update error:", error);
      setError(error.response?.data?.message || error.message || 'Failed to update agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        firstName,
        lastName,
        phoneNumber,
        email,
      };
      
      const response = await api.post('/agents', payload);
      
      if (response.status >= 200 && response.status < 300) {
        const agentsResponse = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/agents`);
        const newAgents = Array.isArray(agentsResponse.data.data) ? agentsResponse.data.data : [];
        
        setAllAgents(newAgents);
        setDisplayedAgents(newAgents);
        handleCloseModal();
      } else {
        throw new Error(response.data?.message || 'Failed to add agent');
      }
    } catch (error) {
      console.error("Submission error:", error);
      setError(error.response?.data?.message || error.message || 'Failed to add agent');
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
          <h5 className="card-title mb-3 mb-md-0">Agents</h5>
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            disabled={loadingAgents}
          >
            Add Agent
          </button>
        </div>
        <div className="card-body">
          {/* Search Section */}
          <div className="row mb-4 g-3">
            <div className="col-12 col-md-6 col-lg-4">
              <label htmlFor="searchAgent" className="form-label">Search by Name or Phone</label>
              <div className="input-group">
                <input
                  type="text"
                  id="searchAgent"
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
                onClick={() => setSearchTerm("")}
                disabled={!searchTerm}
              >
                Reset Search
              </button>
            </div>
          </div>
          
          {error && !loadingAgents && (
            <div className="alert alert-danger">{error}</div>
          )}
          
          {loadingAgents ? (
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
                      <th scope="col">Agent ID</th>
                      <th scope="col">Agent Name</th>
                      <th scope="col">Phone Number</th>
                      <th scope="col">Email</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedAgents.length > 0 ? (
                      displayedAgents.map((agent, index) => (
                        <tr key={agent.id || index}>
                          <td>{(pagination.currentPage - 1) * pagination.perPage + index + 1}</td>
                          <td>{agent.agentId || 'N/A'}</td>
                          <td>{`${agent?.agentName || ''}`}</td>
                          <td>{agent?.phoneNumber || 'N/A'}</td>
                          <td>{agent?.email || 'N/A'}</td>
                          <td>
                            <div className="d-flex">
                              <button
                                className="w-32-px h-32-px me-2 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleView(agent)}
                                title="View"
                              >
                                <Icon icon="iconamoon:eye-light" width={16} />
                              </button>

                              <button
                                className="w-32-px h-32-px me-2 bg-success-light text-success-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleEdit(agent)}
                                title="Edit"
                              >
                                <Icon icon="lucide:edit" width={16} />
                              </button>
                              <button
                                className="w-32-px h-32-px bg-danger-light text-danger-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleDelete(agent)}
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
                          No agents found matching your criteria
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
      {/* Add Agent Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Agent</h5>
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
                    <div className="col-12 col-md-6 mb-3">
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
                      <label htmlFor="email" className="form-label">Email</label>
                      <input
                        type="email"
                        id="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
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
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        'Save Agent'
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
                <h5 className="modal-title">Agent Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Agent ID</label>
                  <p className="form-control-static">{selectedAgent?.agentId || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <p className="form-control-static">{`${selectedAgent?.users?.firstName || ''} ${selectedAgent?.users?.lastName || ''}`}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  <p className="form-control-static">{selectedAgent?.users?.phoneNumber || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <p className="form-control-static">{selectedAgent?.users?.email || 'N/A'}</p>
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
                <h5 className="modal-title">Edit Agent</h5>
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
                    <div className="col-12 col-md-6 mb-3">
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
                      <label htmlFor="editEmail" className="form-label">Email</label>
                      <input
                        type="email"
                        id="editEmail"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
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
                        'Update Agent'
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
                <p>Are you sure you want to delete the agent <strong>{`${selectedAgent?.users?.firstName || ''} ${selectedAgent?.users?.lastName || ''}`}</strong>?</p>
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
                    'Delete Agent'
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

export default AgentsTable;
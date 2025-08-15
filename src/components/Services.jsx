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
  const [costPerUnit, setCostPerUnit] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    total: 0,
  });

  // Fetch services with pagination and search
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const params = {
          page: pagination.currentPage,
          per_page: pagination.perPage,
        };

        if (searchTerm) params.search = searchTerm;

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
    fetchServices();
  }, [pagination.currentPage, pagination.perPage, searchTerm]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    if (searchTerm) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [searchTerm]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setServiceName("");
    setCost("");
    setMeasuringUnit("");
    setCostPerUnit("");
    setError(null);
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
    setCostPerUnit(service.costPerUnit || "");
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
      const payload = {
        serviceName,
        cost,
        measuringUnit,
        costPerUnit,
      };
      
      const response = await api.put(`/services/${selectedService.serviceId}`, payload);
      
      if (response.status >= 200 && response.status < 300) {
        const updatedService = response.data;
        
        setServices(prev => 
          prev.map(s => s.serviceId === selectedService.serviceId ? updatedService : s)
        );
        
        setEditModalOpen(false);
        setError(null);
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
      const payload = {
        serviceName,
        cost,
        measuringUnit,
        costPerUnit,
      };
      
      const response = await api.post('/services', payload);
      
      if (response.status >= 200 && response.status < 300) {
        // Refresh the services after successful addition
        const servicesResponse = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/services`);
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
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Add Service'}
          </button>
        </div>
        
        <div className="card-body">
          {/* Search Section */}
          <div className="row mb-4 g-3">
            <div className="col-12 col-md-6 col-lg-4">
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
                onClick={() => setSearchTerm("")}
                disabled={!searchTerm}
              >
                Reset Search
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
                      <th scope="col">Cost Per Unit</th>
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
                          <td>{service.cost || 'N/A'}</td>
                          <td>{service.measuringUnit || 'N/A'}</td>
                          <td>{service.costPerUnit || 'N/A'}</td>
                          <td>
                            <div className="d-flex">
                              <button
                                className="w-32-px h-32-px me-2 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleView(service)}
                                title="View"
                              >
                                <Icon icon="iconamoon:eye-light" width={16} />
                              </button>
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
                  
                  <div className="mb-3">
                    <label htmlFor="costPerUnit" className="form-label">Cost Per Unit</label>
                    <input
                      type="number"
                      id="costPerUnit"
                      className="form-control"
                      value={costPerUnit}
                      onChange={(e) => setCostPerUnit(e.target.value)}
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
                      disabled={isSubmitting}
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
                  <p className="form-control-static">{selectedService?.cost || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Measuring Unit</label>
                  <p className="form-control-static">{selectedService?.measuringUnit || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Cost Per Unit</label>
                  <p className="form-control-static">{selectedService?.costPerUnit || 'N/A'}</p>
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
                  
                  <div className="mb-3">
                    <label htmlFor="editCostPerUnit" className="form-label">Cost Per Unit</label>
                    <input
                      type="number"
                      id="editCostPerUnit"
                      className="form-control"
                      value={costPerUnit}
                      onChange={(e) => setCostPerUnit(e.target.value)}
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
                      disabled={isSubmitting}
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
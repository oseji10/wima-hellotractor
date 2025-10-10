"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const MembershipsTable = () => {
  // State management
  const [applications, setApplications] = useState([]);
  const [displayedApplications, setDisplayedApplications] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    total: 0,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [membershipTypeFilter, setMembershipTypeFilter] = useState("all");

  // Fetch applications with filtering and pagination
  useEffect(() => {
    const fetchApplications = async () => {
      setLoadingApplications(true);
      try {
        const params = {
          page: pagination.currentPage,
          per_page: pagination.perPage,
        };

        // Add filter params
        if (searchTerm) params.search = searchTerm;
        if (statusFilter !== "all") params.status = statusFilter;
        if (membershipTypeFilter !== "all") params.membership_type = membershipTypeFilter;

        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/membership-application`, { params });
        const data = response.data;
        const appsData = Array.isArray(data.data) ? data.data : [];

        setApplications(appsData);
        setDisplayedApplications(appsData);
        
        setPagination(prev => ({
          ...prev,
          totalPages: data.last_page || 1,
          total: data.total || 0,
        }));
      } catch (error) {
        console.error("Error fetching applications:", error);
        setError("Failed to load applications");
        setApplications([]);
        setDisplayedApplications([]);
      } finally {
        setLoadingApplications(false);
      }
    };
    fetchApplications();
  }, [pagination.currentPage, pagination.perPage, searchTerm, statusFilter, membershipTypeFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [searchTerm, statusFilter, membershipTypeFilter]);

  // View Modal Handler
  const handleView = (application) => {
    setSelectedApplication(application);
    setViewModalOpen(true);
  };

  // Approve/Reject Application
  const handleStatusChange = async (id, status) => {
    try {
      setIsSubmitting(true);
      const response = await api.put(`/membership-application/${id}/status`, { status });
      
      if (response.status >= 200 && response.status < 300) {
        // Update the applications state
        setApplications(prev => 
          prev.map(app => app.id === id ? { ...app, status } : app)
        );
        setDisplayedApplications(prev => 
          prev.map(app => app.id === id ? { ...app, status } : app)
        );
        setSelectedApplication(prev => prev ? { ...prev, status } : null);
      } else {
        throw new Error(response.data?.message || 'Failed to update status');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to update status');
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge bg-success">Approved</span>;
      case 'rejected':
        return <span className="badge bg-danger">Rejected</span>;
      case 'pending':
        return <span className="badge bg-warning">Pending</span>;
      default:
        return <span className="badge bg-secondary">Unknown</span>;
    }
  };

  return (
    <div className="col-lg-12">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Membership Applications</h5>
        </div>
        
        <div className="card-body">
          {/* Filter and Search Section */}
          <div className="row mb-4">
            <div className="col-md-3">
              <label htmlFor="statusFilter" className="form-label">Filter by Status</label>
              <select
                id="statusFilter"
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div className="col-md-3">
              <label htmlFor="typeFilter" className="form-label">Filter by Type</label>
              <select
                id="typeFilter"
                className="form-select"
                value={membershipTypeFilter}
                onChange={(e) => setMembershipTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="Full Membership">Full Membership</option>
                <option value="Associate Membership">Associate Membership</option>
                <option value="Youth & Student Membership">Youth & Student Membership</option>
                <option value="Operator Membership">Operator Membership</option>
                <option value="Corporate/Institution Membership">Corporate/Institution Membership</option>
              </select>
            </div>
            
            <div className="col-md-4">
              <label htmlFor="searchApplication" className="form-label">Search by Name, Email or Phone</label>
              <div className="input-group">
                <input
                  type="text"
                  id="searchApplication"
                  className="form-control"
                  placeholder="Enter name, email or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-outline-secondary" type="button">
                  <Icon icon="ion:search" />
                </button>
              </div>
            </div>
            
            <div className="col-md-2 d-flex align-items-end">
              <button 
                className="btn btn-secondary w-100"
                onClick={() => {
                  setStatusFilter("all");
                  setMembershipTypeFilter("all");
                  setSearchTerm("");
                }}
                disabled={statusFilter === "all" && membershipTypeFilter === "all" && !searchTerm}
              >
                Reset Filters
              </button>
            </div>
          </div>
          
          {error && !loadingApplications && (
            <div className="alert alert-danger">{error}</div>
          )}
          
          {loadingApplications ? (
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
                      <th scope="col">Full Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Phone</th>
                      <th scope="col">Membership Type</th>
                      <th scope="col">Status</th>
                      <th scope="col">Date Applied</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedApplications.length > 0 ? (
                      displayedApplications.map((application, index) => (
                        <tr key={application.id || index}>
                          <td>
                            {(pagination.currentPage - 1) * pagination.perPage + index + 1}
                          </td>
                          <td>{application.fullName || 'N/A'}</td>
                          <td>{application.email || 'N/A'}</td>
                          <td>{application.phoneNumber || 'N/A'}</td>
                          <td>{application.membershipType || 'N/A'}</td>
                          <td>
                            {getStatusBadge(application.status || 'pending')}
                          </td>
                          <td>
                            {new Date(application.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="d-flex">
                              <button
                                className="w-32-px h-32-px me-2 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleView(application)}
                                title="View"
                              >
                                <Icon icon="iconamoon:eye-light" width={16} />
                              </button>
                              {(!application.status || application.status === 'pending') && (
                                <>
                                  <button
                                    className="w-32-px h-32-px me-2 bg-success-light text-success-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                    onClick={() => handleStatusChange(application.id, 'approved')}
                                    title="Approve"
                                    disabled={isSubmitting}
                                  >
                                    <Icon icon="mdi:check" width={16} />
                                  </button>
                                  <button
                                    className="w-32-px h-32-px bg-danger-light text-danger-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                    onClick={() => handleStatusChange(application.id, 'rejected')}
                                    title="Reject"
                                    disabled={isSubmitting}
                                  >
                                    <Icon icon="mdi:close" width={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-4">
                          No applications found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
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
                  
                  <div>
                    <nav>
                      <ul className="pagination mb-0">
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
                  
                  <div>
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

      {/* View Application Modal */}
      {viewModalOpen && selectedApplication && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Application Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Full Name</label>
                      <p className="form-control-static">{selectedApplication.fullName || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <p className="form-control-static">{selectedApplication.email || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Phone Number</label>
                      <p className="form-control-static">{selectedApplication.phoneNumber || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Occupation</label>
                      <p className="form-control-static">{selectedApplication.occupation || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Date of Birth</label>
                      <p className="form-control-static">
                        {selectedApplication.dateOfBirth ? new Date(selectedApplication.dateOfBirth).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Gender</label>
                      <p className="form-control-static">{selectedApplication.gender || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Marital Status</label>
                      <p className="form-control-static">{selectedApplication.maritalStatus || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Nationality</label>
                      <p className="form-control-static">{selectedApplication.nationality || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Membership Type</label>
                      <p className="form-control-static">{selectedApplication.membershipType || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <p className="form-control-static">{getStatusBadge(selectedApplication.status || 'pending')}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Date Applied</label>
                      <p className="form-control-static">
                        {new Date(selectedApplication.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Last Updated</label>
                      <p className="form-control-static">
                        {new Date(selectedApplication.updated_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Home Address</label>
                      <p className="form-control-static">{selectedApplication.homeAddress || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">State</label>
                      <p className="form-control-static">{selectedApplication.state || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">LGA</label>
                      <p className="form-control-static">{selectedApplication.lga || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Ward/District</label>
                      <p className="form-control-static">{selectedApplication.wardDistrict || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Community</label>
                      <p className="form-control-static">{selectedApplication.community || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Organization</label>
                      <p className="form-control-static">{selectedApplication.organization || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Position/Title</label>
                      <p className="form-control-static">{selectedApplication.positionTitle || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Area of Expertise</label>
                      <p className="form-control-static">{selectedApplication.areaOfExpertise || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Reason for Joining</label>
                      <p className="form-control-static">{selectedApplication.reasonForJoining || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Preferred Communication</label>
                      <p className="form-control-static">{selectedApplication.preferredCommunication || 'N/A'}</p>
                    </div>
                    {selectedApplication.membershipType === 'Corporate/Institution Membership' && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">Company Details</label>
                          <p className="form-control-static">{selectedApplication.companyDetails || 'N/A'}</p>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Company Mission</label>
                          <p className="form-control-static">{selectedApplication.companyMission || 'N/A'}</p>
                        </div>
                      </>
                    )}
                    {selectedApplication.membershipType === 'Operator Membership' && (
                      <div className="mb-3">
                        <label className="form-label">Operator Experience</label>
                        <p className="form-control-static">{selectedApplication.operatorExperience || 'N/A'}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents Section */}
                <div className="row">
                  <div className="col-12">
                    <h6 className="mb-3">Supporting Documents</h6>
                  </div>
                  
                  {selectedApplication.meansOfIdentification && (
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Means of Identification ({selectedApplication.meansOfIdentificationType || 'N/A'})</label>
                      <div>
                        <a 
                          href={`${process.env.NEXT_PUBLIC_FILE_URL}/${selectedApplication.meansOfIdentification}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          View Document
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {selectedApplication.cacDocument && selectedApplication.membershipType === 'Corporate/Institution Membership' && (
                    <div className="col-md-6 mb-3">
                      <label className="form-label">CAC Document</label>
                      <div>
                        <a 
                          href={`${process.env.NEXT_PUBLIC_FILE_URL}/${selectedApplication.cacDocument}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          View Document
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Actions */}
                {(!selectedApplication.status || selectedApplication.status === 'pending') && (
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          className="btn btn-success"
                          onClick={() => {
                            handleStatusChange(selectedApplication.id, 'approved');
                            setViewModalOpen(false);
                          }}
                          disabled={isSubmitting}
                        >
                          Approve Application
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => {
                            handleStatusChange(selectedApplication.id, 'rejected');
                            setViewModalOpen(false);
                          }}
                          disabled={isSubmitting}
                        >
                          Reject Application
                        </button>
                      </div>
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

export default MembershipsTable;
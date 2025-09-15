"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const UsersTable = () => {
  // State management
  const [allUsers, setAllUsers] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [states, setStates] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("");
  const [modalSelectedState, setModalSelectedState] = useState("");
  const [modalSelectedCommunity, setModalSelectedCommunity] = useState("");
  const [editSelectedState, setEditSelectedState] = useState("");
  const [editSelectedCommunity, setEditSelectedCommunity] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    total: 0,
  });
  const [isFiltered, setIsFiltered] = useState(false);

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingStates(true);
      setError(null);
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/roles`);
        const data = response.data || response;
        setRoles(
          Array.isArray(data)
            ? data
                .filter(role => !role.deleted_at) // Filter out deleted roles
                .map((role) => ({
                  id: role.roleId,
                  name: role.roleName,
                }))
            : []
        );
      } catch (error) {
        console.error("Error fetching roles:", error);
        setError("Failed to load roles. Please try again.");
        setRoles([]);
      } finally {
        setLoadingStates(false);
      }
    };
    fetchRoles();
  }, []);

  // Fetch states
  useEffect(() => {
    const fetchStates = async () => {
      setLoadingStates(true);
      setError(null);
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs/active`);
        const data = response.data || response;
        // Filter active states and map to required format
        const formattedStates = data
          .filter(state => state.status === "active" && state.state_info)
          .map(state => ({
            id: state.state_info.stateId,
            name: state.state_info.stateName,
          }));
        setStates(formattedStates);
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

  // Fetch communities for add modal
  useEffect(() => {
    if (modalSelectedState && (role === "4" || role === "5" || role === "6")) {
      const fetchCommunities = async () => {
        setLoadingCommunities(true);
        try {
          const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs/state/${modalSelectedState}`);
          const data = response.data || response;
          setCommunities(
            Array.isArray(data)
              ? data
                  .filter(community => community.lga_info)
                  .map(community => ({
                    id: community.lga_info.lgaId,
                    name: community.lga_info.lgaName,
                  }))
              : []
          );
        } catch (error) {
          console.error("Error fetching communities:", error);
          setError("Failed to load communities. Please try again.");
          setCommunities([]);
        } finally {
          setLoadingCommunities(false);
        }
      };
      fetchCommunities();
    } else {
      setCommunities([]);
      setModalSelectedCommunity("");
    }
  }, [modalSelectedState, role]);

  // Fetch communities for edit modal
  useEffect(() => {
    if (editSelectedState && (role === "4" || role === "5" || role === "6")) {
      const fetchCommunities = async () => {
        setLoadingCommunities(true);
        try {
          const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs/state/${editSelectedState}`);
          const data = response.data || response;
          setCommunities(
            Array.isArray(data)
              ? data
                  .filter(community => community.lga_info)
                  .map(community => ({
                    id: community.lga_info.lgaId,
                    name: community.lga_info.lgaName,
                  }))
              : []
          );
        } catch (error) {
          console.error("Error fetching communities:", error);
          setError("Failed to load communities. Please try again.");
          setCommunities([]);
        } finally {
          setLoadingCommunities(false);
        }
      };
      fetchCommunities();
    } else {
      setCommunities([]);
      setEditSelectedCommunity("");
    }
  }, [editSelectedState, role]);

  // Fetch Users with filtering and pagination
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const params = {
          page: pagination.currentPage,
          per_page: pagination.perPage,
        };

        if (selectedRole) params.role = selectedRole;
        if (searchTerm) params.search = searchTerm;

        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/users`, { params });
        const data = response.data;
        const usersData = Array.isArray(data.data) ? data.data : [];

        if (selectedRole || searchTerm) {
          setDisplayedUsers(usersData);
          setIsFiltered(true);
        } else {
          setAllUsers(usersData);
          setDisplayedUsers(usersData);
          setIsFiltered(false);
        }

        setPagination(prev => ({
          ...prev,
          totalPages: data.last_page || 1,
          total: data.total || 0,
        }));
      } catch (error) {
        console.error("Error fetching Users:", error);
        setError("Failed to load Users");
        setAllUsers([]);
        setDisplayedUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [pagination.currentPage, pagination.perPage, selectedRole, searchTerm]);

  // Apply frontend filtering
  useEffect(() => {
    if (!isFiltered && (selectedRole || searchTerm)) {
      let filtered = [...allUsers];

      if (selectedRole) {
        filtered = filtered.filter(user => user.role === selectedRole);
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(user =>
          user.firstName?.toLowerCase().includes(term) ||
          user.lastName?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          user.phoneNumber?.includes(term)
        );
      }

      const totalPages = Math.ceil(filtered.length / pagination.perPage);
      const startIndex = (pagination.currentPage - 1) * pagination.perPage;
      const paginatedData = filtered.slice(startIndex, startIndex + pagination.perPage);

      setDisplayedUsers(paginatedData);
      setPagination(prev => ({
        ...prev,
        totalPages,
        total: filtered.length,
      }));
    }
  }, [allUsers, selectedRole, searchTerm, pagination.currentPage, pagination.perPage, isFiltered]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (selectedRole || searchTerm) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [selectedRole, searchTerm]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhoneNumber("");
    setRole("");
    setModalSelectedState("");
    setModalSelectedCommunity("");
    setError(null);
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setEmail(user.email || "");
    setPhoneNumber(user.phoneNumber || "");
    setRole(user.role || "");
    setEditSelectedState(user.stateId || "");
    setEditSelectedCommunity(user.communityId || "");
    setEditModalOpen(true);
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
      const response = await api.delete(`/users/${selectedUser.userId}`);

      if (response.status >= 200 && response.status < 300) {
        setAllUsers(prev => prev.filter(u => u.userId !== selectedUser.userId));
        setDisplayedUsers(prev => prev.filter(u => u.userId !== selectedUser.userId));
        setDeleteModalOpen(false);
      } else {
        throw new Error(response.data?.message || 'Failed to delete User');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete User');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let validationError = null;
    if (!role) {
      validationError = "Please select a role";
    } else if (needsState(role) && !editSelectedState) {
      validationError = "Please select a state";
    } else if (needsCommunity(role) && !editSelectedCommunity) {
      validationError = "Please select a community";
    }

    if (validationError) {
      setError(validationError);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        firstName,
        lastName,
        email,
        phoneNumber,
        role,
      };
      if (needsState(role)) {
        payload.stateId = editSelectedState;
      }
      if (needsCommunity(role)) {
        payload.communityId = editSelectedCommunity;
      }

      const response = await api.put(`/users/${selectedUser.userId}`, payload);

      if (response.status >= 200 && response.status < 300) {
        const updatedUser = {
          ...response.data,
          firstName,
          lastName,
          email,
          phoneNumber,
          role,
          stateId: payload.stateId,
          communityId: payload.communityId,
          stateName: states.find(s => s.id === payload.stateId)?.name || 'N/A',
          communityName: communities.find(c => c.id === payload.communityId)?.name || 'N/A',
          user_role: { roleName: roles.find(r => r.id === parseInt(role))?.name || 'N/A' },
        };

        setAllUsers(prev =>
          prev.map(u => u.userId === selectedUser.userId ? updatedUser : u)
        );
        setDisplayedUsers(prev =>
          prev.map(u => u.userId === selectedUser.userId ? updatedUser : u)
        );

        setEditModalOpen(false);
        setError(null);
      } else {
        throw new Error(response.data?.message || 'Failed to update User');
      }
    } catch (error) {
      console.error("Update error:", error);
      setError(error.response?.data?.message || error.message || 'Failed to update User');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let validationError = null;
    if (!role) {
      validationError = "Please select a role";
    } else if (needsState(role) && !modalSelectedState) {
      validationError = "Please select a state";
    } else if (needsCommunity(role) && !modalSelectedCommunity) {
      validationError = "Please select a community";
    }

    if (validationError) {
      setError(validationError);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        firstName,
        lastName,
        email,
        phoneNumber,
        // role,
        role: parseInt(role),
      };
      if (modalSelectedState) {
        // payload.stateId = modalSelectedState;
        payload.stateId = parseInt(modalSelectedState);
      }
      if (modalSelectedCommunity) {
        payload.communityId = parseInt(modalSelectedCommunity);
      }

      const response = await api.post('/users', payload);

      if (response.status >= 200 && response.status < 300) {
        const usersResponse = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/users`);
        const newUsers = Array.isArray(usersResponse.data.data) ? usersResponse.data.data : [];

        setAllUsers(newUsers);
        setDisplayedUsers(newUsers);
        handleCloseModal();
      } else {
        throw new Error(response.data?.message || 'Failed to add user');
      }
    } catch (error) {
      console.error("Submission error:", error);
      setError(error.response?.data?.message || error.message || 'Failed to add user');
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

  const needsState = (selectedRole) => ['4', '5', '6'].includes(selectedRole);
  const needsCommunity = (selectedRole) => ['5', '6'].includes(selectedRole);

  return (
    <div className="col-lg-12">
      <div className="card">
        <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <h5 className="card-title mb-3 mb-md-0">Users</h5>
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            disabled={loadingUsers || loadingStates}
          >
            {loadingUsers || loadingStates ? 'Loading...' : 'Add User'}
          </button>
        </div>

        <div className="card-body">
          <div className="row mb-4 g-3">
            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="roleFilter" className="form-label">Filter by Role</label>
              <select
                id="roleFilter"
                className="form-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={loadingStates}
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-4">
              <label htmlFor="searchUser" className="form-label">Search by Name, Email, or Phone</label>
              <div className="input-group">
                <input
                  type="text"
                  id="searchUser"
                  className="form-control"
                  placeholder="Enter name, email, or phone..."
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
                  setSelectedRole("");
                  setSearchTerm("");
                }}
                disabled={!selectedRole && !searchTerm}
              >
                Reset Filters
              </button>
            </div>
          </div>

          {error && !loadingUsers && (
            <div className="alert alert-danger">{error}</div>
          )}

          {loadingUsers ? (
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
                      {/* <th scope="col">User ID</th> */}
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Phone</th>
                      <th scope="col">Role</th>
                      <th scope="col">State</th>
                      <th scope="col">Hub</th>
                      {/* <th scope="col">Status</th> */}
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedUsers.length > 0 ? (
                      displayedUsers.map((user, index) => (
                        <tr key={user.userId || index}>
                          <td>{(pagination.currentPage - 1) * pagination.perPage + index + 1}</td>
                          {/* <td>{user.userId || 'N/A'}</td> */}
                          <td>{`${user.firstName || ''} ${user.lastName || ''}`}</td>
                          <td>{user.email || 'N/A'}</td>
                          <td>{user.phoneNumber || 'N/A'}</td>
                          <td>{user.user_role?.roleName || 'N/A'}</td>
                          <td>
  {user?.state_coordinator?.state?.stateName ??
   user?.community_lead?.lga_info?.state?.stateName ??
   "N/A"}
</td>

                          <td>{user?.community_lead?.lga_info?.lgaName || 'N/A'}</td>
                          {/* <td>{user.status || 'N/A'}</td> */}
                          <td>
                            <div className="d-flex">
                              <button
                                className="w-32-px h-32-px me-2 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleView(user)}
                                title="View"
                              >
                                <Icon icon="iconamoon:eye-light" width={16} />
                              </button>
                              <button
                                className="w-32-px h-32-px me-2 bg-success-light text-success-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleEdit(user)}
                                title="Edit"
                              >
                                <Icon icon="lucide:edit" width={16} />
                              </button>
                              <button
                                className="w-32-px h-32-px bg-danger-light text-danger-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleDelete(user)}
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
                        <td colSpan="10" className="text-center py-4">
                          No Users found matching your criteria
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

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New User</h5>
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

                  <div className="mb-3">
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

                  <div className="mb-3">
                    <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      className="form-control"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="role" className="form-label">Role</label>
                    <select
                      id="role"
                      className="form-select"
                      value={role}
                      onChange={(e) => {
                        setRole(e.target.value);
                        setModalSelectedState("");
                        setModalSelectedCommunity("");
                      }}
                      disabled={isSubmitting || loadingStates}
                      required
                    >
                      <option value="">Select Role</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {needsState(role) && (
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

                  {needsCommunity(role) && (
                    <div className="mb-3">
                      <label htmlFor="community" className="form-label">Community</label>
                      {loadingCommunities ? (
                        <div className="text-muted">Loading communities...</div>
                      ) : (
                        <select
                          id="community"
                          className="form-select"
                          value={modalSelectedCommunity}
                          onChange={(e) => setModalSelectedCommunity(e.target.value)}
                          disabled={!modalSelectedState || communities.length === 0 || isSubmitting}
                          required
                        >
                          <option value="">Select Community</option>
                          {communities.map((community) => (
                            <option key={community.id} value={community.id}>
                              {community.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

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
                        'Save User'
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
                <h5 className="modal-title">User Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <p className="form-control-static">{`${selectedUser?.firstName || ''} ${selectedUser?.lastName || ''}`}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <p className="form-control-static">{selectedUser?.email || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  <p className="form-control-static">{selectedUser?.phoneNumber || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <p className="form-control-static">{selectedUser?.user_role?.roleName || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">State</label>
                  <p className="form-control-static">{selectedUser?.stateName || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Community</label>
                  <p className="form-control-static">{selectedUser?.communityName || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <p className="form-control-static">{selectedUser?.status || 'N/A'}</p>
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
                <h5 className="modal-title">Edit User</h5>
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

                  <div className="mb-3">
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

                  <div className="mb-3">
                    <label htmlFor="editPhoneNumber" className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      id="editPhoneNumber"
                      className="form-control"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="editRole" className="form-label">Role</label>
                    <select
                      id="editRole"
                      className="form-select"
                      value={role}
                      onChange={(e) => {
                        setRole(e.target.value);
                        setEditSelectedState("");
                        setEditSelectedCommunity("");
                      }}
                      disabled={isSubmitting || loadingStates}
                      required
                    >
                      <option value="">Select Role</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {needsState(role) && (
                    <div className="mb-3">
                      <label htmlFor="editState" className="form-label">State</label>
                      {loadingStates ? (
                        <div className="text-muted">Loading states...</div>
                      ) : (
                        <select
                          id="editState"
                          className="form-select"
                          value={editSelectedState}
                          onChange={(e) => setEditSelectedState(e.target.value)}
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

                  {needsCommunity(role) && (
                    <div className="mb-3">
                      <label htmlFor="editCommunity" className="form-label">Community</label>
                      {loadingCommunities ? (
                        <div className="text-muted">Loading communities...</div>
                      ) : (
                        <select
                          id="editCommunity"
                          className="form-select"
                          value={editSelectedCommunity}
                          onChange={(e) => setEditSelectedCommunity(e.target.value)}
                          disabled={!editSelectedState || communities.length === 0 || isSubmitting}
                          required
                        >
                          <option value="">Select Community</option>
                          {communities.map((community) => (
                            <option key={community.id} value={community.id}>
                              {community.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

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
                        'Update User'
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
                <p>Are you sure you want to delete the user <strong>{`${selectedUser?.firstName || ''} ${selectedUser?.lastName || ''}`}</strong>?</p>
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
                    'Delete User'
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

export default UsersTable;
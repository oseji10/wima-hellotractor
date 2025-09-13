"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const Projects = () => {
  const [allProjects, setAllProjects] = useState([]);
  const [displayedProjects, setDisplayedProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    total: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectName, setProjectName] = useState("");

  // Fetch projects with pagination and search
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const params = {
          page: pagination.currentPage,
          per_page: pagination.perPage,
        };

        if (searchTerm) params.search = searchTerm;

        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/projects`, { params });
        const data = response.data;
        const projectsData = Array.isArray(data.data) ? data.data : [];

        setAllProjects(projectsData);
        setDisplayedProjects(projectsData);
        setPagination(prev => ({
          ...prev,
          totalPages: data.last_page || 1,
          total: data.total || 0,
        }));
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError("Failed to load projects");
        setAllProjects([]);
        setDisplayedProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, [pagination.currentPage, pagination.perPage, searchTerm]);

  // Apply frontend search filtering
  useEffect(() => {
    if (searchTerm) {
      let filtered = [...allProjects];
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.projectName?.toLowerCase().includes(term)
      );

      const totalPages = Math.ceil(filtered.length / pagination.perPage);
      const startIndex = (pagination.currentPage - 1) * pagination.perPage;
      const paginatedData = filtered.slice(startIndex, startIndex + pagination.perPage);

      setDisplayedProjects(paginatedData);
      setPagination(prev => ({
        ...prev,
        totalPages,
        total: filtered.length,
      }));
    } else {
      setDisplayedProjects(allProjects);
      setPagination(prev => ({
        ...prev,
        totalPages: Math.ceil(allProjects.length / prev.perPage),
        total: allProjects.length,
      }));
    }
  }, [allProjects, searchTerm, pagination.currentPage, pagination.perPage]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    if (searchTerm) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [searchTerm]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProjectName("");
    setError(null);
  };

  // View Modal Handler
  const handleView = (project) => {
    setSelectedProject(project);
    setViewModalOpen(true);
  };

  // Edit Modal Handler
  const handleEdit = (project) => {
    setSelectedProject(project);
    setProjectName(project.projectName || "");
    setEditModalOpen(true);
  };

  // Delete Modal Handler
  const handleDelete = (project) => {
    setSelectedProject(project);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
      const response = await api.delete(`/projects/${selectedProject.projectId}`);

      if (response.status >= 200 && response.status < 300) {
        setAllProjects(prev => prev.filter(proj => proj.projectId !== selectedProject.projectId));
        setDisplayedProjects(prev => prev.filter(proj => proj.projectId !== selectedProject.projectId));
        setDeleteModalOpen(false);
      } else {
        throw new Error(response.data?.message || 'Failed to delete project');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete project');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Project
  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!projectName) {
      setError("Please provide project name");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        projectName,
      };

      const response = await api.put(`/projects/${selectedProject.projectId}`, payload);

      if (response.status >= 200 && response.status < 300) {
        const updatedProject = {
          ...response.data,
          projectName,
        };

        setAllProjects(prev =>
          prev.map(proj => proj.projectId === selectedProject.projectId ? updatedProject : proj)
        );
        setDisplayedProjects(prev =>
          prev.map(proj => proj.projectId === selectedProject.projectId ? updatedProject : proj)
        );

        setEditModalOpen(false);
        setError(null);
      } else {
        throw new Error(response.data?.message || 'Failed to update project');
      }
    } catch (error) {
      console.error("Update error:", error);
      setError(error.response?.data?.message || error.message || 'Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Project
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!projectName) {
      setError("Please provide project name");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        projectName,
      };

      const response = await api.post('/projects', payload);

      if (response.status >= 200 && response.status < 300) {
        const projectsResponse = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/projects`);
        const newProjects = Array.isArray(projectsResponse.data.data) ? projectsResponse.data.data : [];

        setAllProjects(newProjects);
        setDisplayedProjects(newProjects);
        handleCloseModal();
      } else {
        throw new Error(response.data?.message || 'Failed to add project');
      }
    } catch (error) {
      console.error("Submission error:", error);
      setError(error.response?.data?.message || error.message || 'Failed to add project');
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
          <h5 className="card-title mb-3 mb-md-0">Projects</h5>
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            disabled={loadingProjects}
          >
            {loadingProjects ? 'Loading...' : 'Add Project'}
          </button>
        </div>

        <div className="card-body">
          <div className="row mb-4 g-3">
            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="searchProject" className="form-label">Search by Project Name</label>
              <div className="input-group">
                <input
                  type="text"
                  id="searchProject"
                  className="form-control"
                  placeholder="Enter project name..."
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

          {error && !loadingProjects && (
            <div className="alert alert-danger">{error}</div>
          )}

          {loadingProjects ? (
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
                      <th scope="col">Project Name</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedProjects.length > 0 ? (
                      displayedProjects.map((project, index) => (
                        <tr key={project.projectId || index}>
                          <td>{project.projectId}</td>
                          <td>{project.projectName || 'N/A'}</td>
                          <td>
                            <div className="d-flex">
                              <button
                                className="w-32-px h-32-px me-2 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleView(project)}
                                title="View"
                              >
                                <Icon icon="iconamoon:eye-light" width={16} />
                              </button>
                              <button
                                className="w-32-px h-32-px me-2 bg-success-light text-success-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleEdit(project)}
                                title="Edit"
                              >
                                <Icon icon="lucide:edit" width={16} />
                              </button>
                              <button
                                className="w-32-px h-32-px bg-danger-light text-danger-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                onClick={() => handleDelete(project)}
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
                        <td colSpan="3" className="text-center py-4">
                          No projects found matching your criteria
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

      {/* Add Project Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Project</h5>
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
                    <label htmlFor="projectName" className="form-label">Project Name</label>
                    <input
                      type="text"
                      id="projectName"
                      className="form-control"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      disabled={isSubmitting}
                      required
                      placeholder="Enter project name"
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
                      disabled={!projectName || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        'Save Project'
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
                <h5 className="modal-title">Project Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Project ID</label>
                  <p className="form-control-static">{selectedProject?.projectId || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Project Name</label>
                  <p className="form-control-static">{selectedProject?.projectName || 'N/A'}</p>
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
                <h5 className="modal-title">Edit Project</h5>
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
                    <label htmlFor="editProjectName" className="form-label">Project Name</label>
                    <input
                      type="text"
                      id="editProjectName"
                      className="form-control"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
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
                      disabled={!projectName || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Updating...
                        </>
                      ) : (
                        'Update Project'
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
                <p>Are you sure you want to delete the project <strong>{selectedProject?.projectName}</strong>?</p>
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
                    'Delete Project'
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

export default Projects;
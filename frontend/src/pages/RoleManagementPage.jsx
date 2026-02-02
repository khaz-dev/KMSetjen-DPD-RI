import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container, Table, Button, Modal, Form, Spinner, Alert,
  Pagination, Card, Badge
} from 'react-bootstrap';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';
import './RoleManagementPage.css';

/**
 * RoleManagementPage Component
 * Admin interface for role and permission management
 */
function RoleManagementPage({ onLogout }) {
  const { t } = useTranslation();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedRole, setSelectedRole] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    permissions: [],
  });

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/roles/?page=${currentPage}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      setRoles(response.data.results || []);
      setTotalPages(Math.ceil((response.data.count || 0) / 20));
    } catch (err) {
      console.error('Error loading roles:', err);
      setError(err.response?.data?.detail || t('roles.role_error'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, t]);

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, [loadRoles]);

  const loadPermissions = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/permissions/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      setPermissions(response.data.results || response.data || []);
    } catch (err) {
      console.error('Error loading permissions:', err);
    }
  };

  const handleOpenModal = (role = null) => {
    if (role) {
      setModalMode('edit');
      setSelectedRole(role);
      setFormData({
        code: role.code,
        name: role.name,
        description: role.description || '',
        permissions: role.permissions?.map((p) => p.id) || [],
      });
    } else {
      setModalMode('create');
      setSelectedRole(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        permissions: [],
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRole(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePermissionChange = (permissionId) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((id) => id !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      const endpoint = modalMode === 'create'
        ? `${import.meta.env.VITE_API_URL}/api/v1/admin/roles/`
        : `${import.meta.env.VITE_API_URL}/api/v1/admin/roles/${selectedRole.id}/`;

      const method = modalMode === 'create' ? 'post' : 'put';

      await axios({
        method,
        url: endpoint,
        data: {
          code: formData.code,
          name: formData.name,
          description: formData.description,
          permission_ids: formData.permissions,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      setError(null);
      loadRoles();
      handleCloseModal();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.response?.data?.detail || t('roles.role_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm(t('roles.confirm_delete'))) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/roles/${roleId}/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      setError(null);
      loadRoles();
    } catch (err) {
      console.error('Error deleting role:', err);
      setError(err.response?.data?.detail || t('roles.role_error'));
    }
  };

  return (
    <div className="admin-wrapper">
      <AdminSidebar onLogout={onLogout} />

      <div className="admin-content">
        <Container fluid>
          {/* Header */}
          <div className="admin-header">
            <div>
              <h1>{t('roles.title')}</h1>
              <p className="text-muted">{t('roles.subtitle')}</p>
            </div>
            <Button
              variant="primary"
              onClick={() => handleOpenModal()}
              className="btn-add"
            >
              <FiPlus /> {t('roles.add_role')}
            </Button>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Roles Table */}
          {loading ? (
            <div className="loading-container">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">{t('common.loading')}</span>
              </Spinner>
              <p>{t('roles.loading_roles')}</p>
            </div>
          ) : roles.length > 0 ? (
            <>
              <Card className="table-card">
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-header">
                      <tr>
                        <th>{t('roles.code')}</th>
                        <th>{t('roles.name')}</th>
                        <th>{t('roles.description')}</th>
                        <th>{t('roles.permissions')}</th>
                        <th>{t('sidebar.users')}</th>
                        <th>{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((role) => (
                        <tr key={role.id}>
                          <td>
                            <code className="role-code">{role.code}</code>
                          </td>
                          <td>
                            <strong>{role.name}</strong>
                          </td>
                          <td>{role.description || '-'}</td>
                          <td>
                            <div className="permission-badges">
                              {role.permissions && role.permissions.length > 0 ? (
                                role.permissions.slice(0, 3).map((perm) => (
                                  <Badge
                                    key={perm.id}
                                    bg="info"
                                    className="permission-badge"
                                  >
                                    {perm.code}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted">No permissions</span>
                              )}
                              {role.permissions && role.permissions.length > 3 && (
                                <Badge bg="secondary" className="permission-badge">
                                  +{role.permissions.length - 3}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td>
                            <Badge bg="success">{role.user_count || 0}</Badge>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleOpenModal(role)}
                                title={t('buttons.edit')}
                              >
                                <FiEdit2 />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteRole(role.id)}
                                disabled={role.user_count > 0}
                                title={
                                  role.user_count > 0
                                    ? 'Cannot delete role with users'
                                    : 'Delete role'
                                }
                              >
                                <FiTrash2 />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-container">
                  <Pagination>
                    <Pagination.First
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    />
                    <Pagination.Prev
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    />
                    {Array.from({ length: totalPages }, (_, i) => (
                      <Pagination.Item
                        key={i + 1}
                        active={i + 1 === currentPage}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    />
                    <Pagination.Last
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <Card className="empty-state">
              <Card.Body>
                <h5>{t('roles.no_roles')}</h5>
                <p className="text-muted">{t('buttons.create')} {t('roles.add_role')}</p>
              </Card.Body>
            </Card>
          )}
        </Container>
      </div>

      {/* Role Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? t('roles.add_role') : t('roles.edit_role')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitForm}>
            <Form.Group className="mb-3">
              <Form.Label>Role Code *</Form.Label>
              <Form.Control
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                disabled={modalMode === 'edit'}
                placeholder="e.g., EDITOR, REVIEWER"
              />
              <Form.Text className="text-muted">
                Unique identifier for the role (cannot be changed)
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Role Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Content Editor"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Role description and responsibilities"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Permissions</Form.Label>
              <div className="permissions-grid">
                {permissions.length > 0 ? (
                  permissions.map((permission) => (
                    <Form.Check
                      key={permission.id}
                      type="checkbox"
                      id={`perm-${permission.id}`}
                      label={`${permission.code} - ${permission.description}`}
                      checked={formData.permissions.includes(permission.id)}
                      onChange={() => handlePermissionChange(permission.id)}
                      className="permission-check"
                    />
                  ))
                ) : (
                  <p className="text-muted">No permissions available</p>
                )}
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            {t('buttons.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitForm}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" />
                {t('common.saving')}
              </>
            ) : (
              t('buttons.save')
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default RoleManagementPage;


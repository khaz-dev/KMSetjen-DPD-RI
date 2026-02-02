import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container, Table, Button, Modal, Form, Spinner, Alert,
  Pagination, Card, Badge
} from 'react-bootstrap';
import { FiEdit2, FiTrash2, FiPlus, FiSearch } from 'react-icons/fi';
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';
import './UserManagementPage.css';

/**
 * UserManagementPage Component
 * Admin interface for user CRUD operations
 */
function UserManagementPage({ onLogout }) {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    is_active: true,
    is_staff: false,
  });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `${import.meta.env.VITE_API_URL}/api/v1/admin/users/?page=${currentPage}`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      setUsers(response.data.results || []);
      setTotalPages(Math.ceil((response.data.count || 0) / 20));
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err.response?.data?.detail || t('users.user_error'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, t]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleOpenModal = (user = null) => {
    if (user) {
      setModalMode('edit');
      setSelectedUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        is_active: user.is_active,
        is_staff: user.is_staff,
      });
    } else {
      setModalMode('create');
      setSelectedUser(null);
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        is_active: true,
        is_staff: false,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      const endpoint = modalMode === 'create'
        ? `${import.meta.env.VITE_API_URL}/api/v1/admin/users/`
        : `${import.meta.env.VITE_API_URL}/api/v1/admin/users/${selectedUser.id}/`;

      const method = modalMode === 'create' ? 'post' : 'put';

      await axios({
        method,
        url: endpoint,
        data: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      setError(null);
      loadUsers();
      handleCloseModal();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.response?.data?.detail || t('users.user_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(t('users.confirm_delete'))) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/users/${userId}/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      setError(null);
      loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.detail || 't:errors.failed_delete_user');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const endpoint =
        user.is_active
          ? `${import.meta.env.VITE_API_URL}/api/v1/admin/users/${user.id}/deactivate/`
          : `${import.meta.env.VITE_API_URL}/api/v1/admin/users/${user.id}/activate/`;

      await axios.post(endpoint, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      setError(null);
      loadUsers();
    } catch (err) {
      console.error('Error toggling user status:', err);
      setError(err.response?.data?.detail || 't:errors.failed_toggle_user_status');
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
              <h1>{t('users.title')}</h1>
              <p className="text-muted">{t('users.subtitle')}</p>
            </div>
            <Button
              variant="primary"
              onClick={() => handleOpenModal()}
              className="btn-add"
            >
              <FiPlus /> {t('users.add_user')}
            </Button>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Search Bar */}
          <Card className="search-card mb-4">
            <Card.Body>
              <div className="search-wrapper">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder={t('common.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </Card.Body>
          </Card>

          {/* Users Table */}
          {loading ? (
            <div className="loading-container">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">{t('common.loading')}</span>
              </Spinner>
              <p>{t('users.loading_users')}</p>
            </div>
          ) : users.length > 0 ? (
            <>
              <Card className="table-card">
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-header">
                      <tr>
                        <th>{t('users.username')}</th>
                        <th>{t('users.email')}</th>
                        <th>{t('table.name')}</th>
                        <th>{t('users.is_active')}</th>
                        <th>{t('users.is_staff')}</th>
                        <th>{t('users.date_joined')}</th>
                        <th>{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="username-cell">
                            <strong>{user.username}</strong>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            {user.first_name || user.last_name
                              ? `${user.first_name} ${user.last_name}`.trim()
                              : '-'}
                          </td>
                          <td>
                            <Badge
                              bg={user.is_active ? 'success' : 'danger'}
                              className="status-badge"
                            >
                              {user.is_active ? t('common.yes') : t('buttons.cancel')}
                            </Badge>
                          </td>
                          <td>
                            <Badge
                              bg={user.is_staff ? 'info' : 'secondary'}
                              className="status-badge"
                            >
                              {user.is_staff ? t('common.yes') : t('common.no')}
                            </Badge>
                          </td>
                          <td className="date-cell">
                            {new Date(user.date_joined).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleOpenModal(user)}
                                title={t('common.edit')}
                              >
                                <FiEdit2 />
                              </Button>
                              <Button
                                variant={user.is_active ? 'outline-warning' : 'outline-success'}
                                size="sm"
                                onClick={() => handleToggleActive(user)}
                                title={user.is_active ? t('buttons.cancel') : t('buttons.submit')}
                              >
                                {user.is_active ? t('buttons.cancel') : t('buttons.submit')}
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                                title={t('common.delete')}
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
                <h5>{t('users.no_users')}</h5>
                <p className="text-muted">
                  {searchQuery
                    ? t('common.no_results')
                    : t('buttons.create')}
                </p>
              </Card.Body>
            </Card>
          )}
        </Container>
      </div>

      {/* User Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? t('users.add_user') : t('users.edit_user')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitForm}>
            <Form.Group className="mb-3">
              <Form.Label>{t('users.username')} *</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                disabled={modalMode === 'edit'}
                placeholder={t('users.username')}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('users.email')} *</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder={t('users.email')}
              />
            </Form.Group>

            <Form.Row className="mb-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>{t('users.first_name')}</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder={t('users.first_name')}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>{t('users.last_name')}</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder={t('users.last_name')}
                  />
                </Form.Group>
              </div>
            </Form.Row>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="is_active"
                label={t('users.is_active')}
                checked={formData.is_active}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="is_staff"
                label={t('users.is_staff')}
                checked={formData.is_staff}
                onChange={handleInputChange}
              />
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

export default UserManagementPage;


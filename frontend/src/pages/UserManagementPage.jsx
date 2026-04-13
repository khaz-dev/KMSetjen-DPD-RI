import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import {
  Container, Table, Button, Modal, Form, Spinner, Alert,
  Pagination, Card, Badge, Row, Col
} from 'react-bootstrap';
import { FiEdit2, FiTrash2, FiPlus, FiSearch } from 'react-icons/fi';
import AdminSidebar from '../components/AdminSidebar';
import { adminAPI } from '../services/api';
import './UserManagementPage.css';

/**
 * Calculate which page numbers to display in pagination
 * Shows smart pagination: First 3, Current±1, Last 3 with ellipsis
 * Maximum ~9 items displayed
 */
function calculatePageNumbers(currentPage, totalPages) {
  if (totalPages <= 9) {
    // Show all pages if 9 or fewer
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];
  const maxDisplay = 9; // Max page numbers to show
  const siblingCount = 1; // Pages on either side of current
  const boundaryCount = 3; // Pages to show at start and end

  // First boundary pages
  for (let i = 1; i <= Math.min(boundaryCount, totalPages); i++) {
    pages.push(i);
  }

  // Current page and its siblings
  const startSibling = Math.max(boundaryCount + 1, currentPage - siblingCount);
  const endSibling = Math.min(totalPages - boundaryCount, currentPage + siblingCount);

  if (startSibling > boundaryCount + 1) {
    pages.push(null); // Ellipsis marker
  }

  for (let i = startSibling; i <= endSibling; i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  if (endSibling < totalPages - boundaryCount) {
    pages.push(null); // Ellipsis marker
  }

  // Last boundary pages
  for (let i = Math.max(endSibling + 1, totalPages - boundaryCount + 1); i <= totalPages; i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  return pages;
}

/**
 * UserManagementPage Component
 * Admin interface for user CRUD operations
 */
function UserManagementPage({ onLogout }) {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    nip: '',
    jenis_jabatan: '',
    unit_organisasi: '',
    jabatan: '',
    preferred_language: 'id',
    theme_mode: 'light',
    is_active: true,
    is_staff: false,
    roles: [],
  });
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null); // 'success', 'error', 'info'
  const [pageSize, setPageSize] = useState(null); // Store page size from first load
  const [syncProgress, setSyncProgress] = useState(0); // 0-100
  const [syncStats, setSyncStats] = useState({
    current_page: 0,
    total_pages: 0,
    total_fetched: 0,
    created: 0,
    updated: 0,
    errors_count: 0,
    elapsed_seconds: 0,
    estimated_remaining_seconds: 0,
    status_message: ''
  });
  const [itemsPerPage, setItemsPerPage] = useState(10); // Page size selector
  const [filterStatus, setFilterStatus] = useState('all'); // Filter: all, active, inactive
  const [filterStaff, setFilterStaff] = useState('all'); // Filter: all, staff, regular

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'delete', 'deactivate', 'activate'
  const [confirmUser, setConfirmUser] = useState(null);
  const [confirmCallback, setConfirmCallback] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        page_size: itemsPerPage,
      };
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      // Add filters
      if (filterStatus === 'active') {
        params.is_active = true;
      } else if (filterStatus === 'inactive') {
        params.is_active = false;
      }

      if (filterStaff === 'staff') {
        params.is_staff = true;
      } else if (filterStaff === 'regular') {
        params.is_staff = false;
      }

      const response = await adminAPI.getUsers(params);
      const totalItems = response.data.count || 0;
      const calculatedTotalPages = Math.ceil(totalItems / effectivePageSize);
      
      setTotalCount(totalItems);
      setTotalPages(calculatedTotalPages);
      
      // Reset to page 1 if page_size changed and current page exceeds new total
      if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err.response?.data?.detail || t('users.user_error'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, t, pageSize, itemsPerPage, filterStatus, filterStaff]);

  // Reset to page 1 when page size changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [itemsPerPage, filterStatus, filterStaff]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleOpenModal = (user = null) => {
    if (user) {
      // Fetch full user details (including roles) from detail endpoint
      adminAPI.getUser(user.id)
      .then((response) => {
        const fullUser = response.data;
        setModalMode('edit');
        setSelectedUser(fullUser);
        setFormData({
          username: fullUser.username,
          email: fullUser.email,
          first_name: fullUser.first_name || '',
          last_name: fullUser.last_name || '',
          phone: fullUser.phone || '',
          nip: fullUser.nip || '',
          jenis_jabatan: fullUser.jenis_jabatan || '',
          unit_organisasi: fullUser.unit_organisasi || '',
          jabatan: fullUser.jabatan || '',
          preferred_language: fullUser.preferred_language || 'id',
          theme_mode: fullUser.theme_mode || 'light',
          is_active: fullUser.is_active,
          is_staff: fullUser.is_staff,
          roles: fullUser.roles && Array.isArray(fullUser.roles) ? fullUser.roles.map(r => r.id) : [],
        });
        setShowModal(true);
      }).catch((err) => {
        console.error('Error loading user details:', err);
        // Fallback to list data if detail fetch fails
        setModalMode('edit');
        setSelectedUser(user);
        setFormData({
          username: user.username,
          email: user.email,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          phone: user.phone || '',
          nip: user.nip || '',
          jenis_jabatan: user.jenis_jabatan || '',
          unit_organisasi: user.unit_organisasi || '',
          jabatan: user.jabatan || '',
          preferred_language: user.preferred_language || 'id',
          theme_mode: user.theme_mode || 'light',
          is_active: user.is_active,
          is_staff: user.is_staff,
          roles: [],
        });
        setShowModal(true);
      });
    } else {
      setModalMode('create');
      setSelectedUser(null);
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        nip: '',
        jenis_jabatan: '',
        unit_organisasi: '',
        jabatan: '',
        preferred_language: 'id',
        theme_mode: 'light',
        is_active: true,
        is_staff: false,
        roles: [],
      });
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const loadRoles = useCallback(async () => {
    try {
      const response = await adminAPI.getRoles({
        page: 1,
        page_size: 100,
      });
      setRoles(response.data.results || []);
    } catch (err) {
      console.error('Error loading roles:', err);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleInputChange = (e) => {
    const { name, value, type, checked, dataset } = e.target;
    if (name === 'roles') {
      // Handle role checkboxes - use data attribute for role ID
      setFormData((prev) => {
        const roleId = parseInt(dataset.roleId || value);
        const currentRoles = prev.roles || [];
        if (checked) {
          return {
            ...prev,
            roles: [...currentRoles, roleId],
          };
        } else {
          return {
            ...prev,
            roles: currentRoles.filter(r => r !== roleId),
          };
        }
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      if (modalMode === 'create') {
        await adminAPI.createUser(formData);
      } else {
        await adminAPI.updateUser(selectedUser.id, formData);
      }

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
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setConfirmUser(user);
    setConfirmAction('delete');
    setConfirmCallback(() => async () => {
      try {
        await adminAPI.deleteUser(userId);

        setError(null);
        loadUsers();
        setShowConfirmModal(false);
      } catch (err) {
        console.error('Error deleting user:', err);
        setError(err.response?.data?.detail || t('users.user_error'));
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handleToggleActive = async (user) => {
    setConfirmUser(user);
    setConfirmAction(user.is_active ? 'deactivate' : 'activate');
    setConfirmCallback(() => async () => {
      try {
        if (user.is_active) {
          await adminAPI.deactivateUser(user.id);
        } else {
          await adminAPI.activateUser(user.id);
        }

        setError(null);
        loadUsers();
        setShowConfirmModal(false);
      } catch (err) {
        console.error('Error toggling user status:', err);
        setError(err.response?.data?.detail || t('users.user_error'));
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };
  const handleSyncExternalUsers = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      setSyncStatus('info');
      setSyncProgress(0);
      setSyncStats({
        current_page: 0,
        total_pages: 0,
        total_fetched: 0,
        created: 0,
        updated: 0,
        errors_count: 0,
        elapsed_seconds: 0,
        estimated_remaining_seconds: 0,
        status_message: 'Initializing sync...'
      });

      // Start the sync in the background
      adminAPI.syncExternalUsers().then(response => {
        if (response.data.success) {
          setSyncStatus('success');
          setSyncProgress(100);
          setSyncMessage(
            `${t('users.sync_success')}: ${response.data.created} ${t('users.created')}, ${response.data.updated} ${t('users.updated')}`
          );
          // Reload users after successful sync
          setTimeout(() => {
            loadUsers();
            setSyncing(false);
            setSyncMessage(null);
          }, 2000);
        } else {
          setSyncStatus('error');
          setSyncMessage(response.data.message || t('users.sync_failed'));
          setSyncing(false);
        }
      }).catch(err => {
        console.error('Error syncing users:', err);
        setSyncStatus('error');
        
        // Extract error message with diagnostic info
        let errorMsg = err.response?.data?.message || err.message || t('users.sync_failed');
        if (err.response?.data?.diagnostic) {
          const diagnostic = err.response.data.diagnostic;
          if (diagnostic.hint) {
            errorMsg += ` [${diagnostic.hint}]`;
          }
        }
        
        setSyncMessage(errorMsg);
        setSyncing(false);
        
        // Log diagnostic info to console for debugging
        if (err.response?.data?.diagnostic) {
          console.error('Diagnostic info:', err.response.data.diagnostic);
        }
      });

      // Poll progress every 500ms
      const pollProgress = async () => {
        try {
          const progressResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/v1/admin/users/sync-external-users-progress/`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('access_token')}`,
              },
            }
          );

          if (progressResponse.data.is_syncing) {
            setSyncProgress(progressResponse.data.progress);
            setSyncStats({
              current_page: progressResponse.data.current_page,
              total_pages: progressResponse.data.total_pages,
              total_fetched: progressResponse.data.total_fetched,
              created: progressResponse.data.created,
              updated: progressResponse.data.updated,
              errors_count: progressResponse.data.errors_count,
              elapsed_seconds: progressResponse.data.elapsed_seconds,
              estimated_remaining_seconds: progressResponse.data.estimated_remaining_seconds,
              status_message: progressResponse.data.status_message
            });

            // Continue polling
            setTimeout(pollProgress, 500);
          }
        } catch (err) {
          console.error('Error fetching sync progress:', err);
        }
      };

      // Start polling after 100ms (give API time to start)
      setTimeout(pollProgress, 100);
    } catch (err) {
      console.error('Error starting sync:', err);
      setSyncStatus('error');
      setSyncMessage(
        err.response?.data?.message || err.message || t('users.sync_failed')
      );
      setSyncing(false);
    }
  };

  const handleCheckApiHealth = async () => {
    try {
      setSyncStatus('info');
      setSyncMessage('Checking external API health...');
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/users/check-external-api-health/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (response.data.healthy) {
        setSyncStatus('success');
        setSyncMessage('✅ External API is healthy and accessible');
        console.log('API Diagnostic:', response.data.diagnostic);
      } else {
        setSyncStatus('error');
        let errorMsg = `❌ API Health Check Failed: ${response.data.error}`;
        if (response.data.diagnostic?.hint) {
          errorMsg += ` - ${response.data.diagnostic.hint}`;
        }
        setSyncMessage(errorMsg);
        console.error('API Diagnostic:', response.data.diagnostic);
      }
    } catch (err) {
      console.error('Error checking API health:', err);
      setSyncStatus('error');
      setSyncMessage('Error checking API health: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className={`admin-wrapper ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <AdminSidebar onLogout={onLogout} />

      <div className="admin-content">
        <Container>
          {/* Header */}
          <div className="admin-header">
            <div>
              <h1>{t('users.title')}</h1>
              <p className="text-muted">{t('users.subtitle')}</p>
            </div>
            <div className="header-actions">
              <Button
                variant="outline-secondary"
                onClick={handleCheckApiHealth}
                disabled={syncing}
                className="btn-check-health"
                title="Check if external API is accessible"
              >
                🔍 Check API
              </Button>
              <Button
                variant="info"
                onClick={handleSyncExternalUsers}
                disabled={syncing}
                className="btn-sync"
              >
                {syncing ? (
                  <>
                    <Spinner
                      animation="border"
                      size="sm"
                      className="me-2"
                      style={{ width: '1rem', height: '1rem' }}
                    />
                    {t('users.syncing')}
                  </>
                ) : (
                  <>
                    <FiPlus /> {t('users.sync_pegawai')}
                  </>
                )}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleOpenModal()}
                className="btn-add"
              >
                <FiPlus /> {t('users.add_user')}
              </Button>
            </div>
          </div>

          {syncMessage && (
            <Alert
              variant={syncStatus === 'success' ? 'success' : syncStatus === 'error' ? 'danger' : 'info'}
              dismissible={syncStatus !== 'info'}
              onClose={() => syncStatus !== 'info' && setSyncMessage(null)}
              className="mt-3"
            >
              {syncMessage}
            </Alert>
          )}

          {syncing && syncStatus === 'info' && (
            <Card className="mt-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Sync Progress</h6>
                  <span className="badge bg-info">{syncProgress}%</span>
                </div>
                
                {/* Progress Bar */}
                <div className="progress mb-3" style={{ height: '25px' }}>
                  <div
                    className="progress-bar bg-info"
                    role="progressbar"
                    style={{ width: `${syncProgress}%` }}
                    aria-valuenow={syncProgress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    {syncProgress > 10 && `${syncProgress}%`}
                  </div>
                </div>

                {/* Sync Statistics */}
                <Row className="g-2">
                  <div className="col-md-3">
                    <small className="text-muted">Fetched</small>
                    <div className="fw-bold">{syncStats.total_fetched}</div>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted">Created</small>
                    <div className="fw-bold text-success">{syncStats.created}</div>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted">Updated</small>
                    <div className="fw-bold text-warning">{syncStats.updated}</div>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted">Errors</small>
                    <div className="fw-bold text-danger">{syncStats.errors_count}</div>
                  </div>
                </Row>

                {/* Page Progress */}
                {syncStats.total_pages > 0 && (
                  <div className="mt-3">
                    <small className="text-muted">
                      Page: {syncStats.current_page} of {syncStats.total_pages}
                    </small>
                  </div>
                )}

                {/* Time Information */}
                <div className="mt-2">
                  <small className="text-muted">
                    Elapsed: {Math.floor(syncStats.elapsed_seconds / 60)}m {syncStats.elapsed_seconds % 60}s
                    {syncStats.estimated_remaining_seconds > 0 && (
                      <>
                        {' '} | Remaining: ~{Math.ceil(syncStats.estimated_remaining_seconds / 60)}m
                      </>
                    )}
                  </small>
                </div>

                {/* Status Message */}
                {syncStats.status_message && (
                  <div className="mt-2">
                    <small className="text-muted d-block">{syncStats.status_message}</small>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

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

          {/* Page Size & Filter Controls */}
          <Card className="mb-4">
            <Card.Body>
              <Row className="g-3">
                {/* Items Per Page Selector */}
                <Col md={3} sm={6}>
                  <div>
                    <label className="form-label fw-bold mb-2">{t('common.items_per_page') || 'Items Per Page'}</label>
                    <select
                      className="form-select"
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={75}>75</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </Col>

                {/* Status Filter */}
                <Col md={3} sm={6}>
                  <div>
                    <label className="form-label fw-bold mb-2">{t('users.status') || 'Status'}</label>
                    <select
                      className="form-select"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">{t('common.all') || 'All'}</option>
                      <option value="active">{t('users.active') || 'Active'}</option>
                      <option value="inactive">{t('users.inactive') || 'Inactive'}</option>
                    </select>
                  </div>
                </Col>

                {/* Staff Filter */}
                <Col md={3} sm={6}>
                  <div>
                    <label className="form-label fw-bold mb-2">{t('users.staff_type') || 'User Type'}</label>
                    <select
                      className="form-select"
                      value={filterStaff}
                      onChange={(e) => setFilterStaff(e.target.value)}
                    >
                      <option value="all">{t('common.all') || 'All'}</option>
                      <option value="staff">{t('users.staff') || 'Staff'}</option>
                      <option value="regular">{t('users.regular_user') || 'Regular User'}</option>
                    </select>
                  </div>
                </Col>

                {/* Results Count */}
                <Col md={3} sm={6}>
                  <div>
                    <label className="form-label fw-bold mb-2">{t('common.results') || 'Results'}</label>
                    <div className="form-control-plaintext pt-2">
                      <strong>{users.length}</strong> {t('pagination.of') || 'of'} <strong>{totalCount}</strong>
                      {totalPages > 1 && <small className="text-muted ms-2">({t('pagination.page', { current: currentPage, total: totalPages })})</small>}
                    </div>
                  </div>
                </Col>
              </Row>
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
                        <th style={{width:'50px',textAlign:'center'}}>{'No.'}</th>
                        <th>{t('table.name')}</th>
                        <th>{t('users.nip') || 'NIP'}</th>
                        <th>{t('users.email')}</th>
                        <th>{t('users.is_active')}</th>
                        <th>{t('users.is_staff')}</th>
                        <th>{t('users.date_joined')}</th>
                        <th>{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, index) => (
                        <tr key={user.id}>
                          <td style={{textAlign:'center',fontWeight:'bold'}}>
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td>
                            {user.first_name || user.last_name
                              ? `${user.first_name} ${user.last_name}`.trim()
                              : '-'}
                          </td>
                          <td className="username-cell">
                            <strong>{user.nip || user.username || '-'}</strong>
                          </td>
                          <td>{user.email}</td>
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
                    {calculatePageNumbers(currentPage, totalPages).map((page, index) => (
                      page === null ? (
                        <Pagination.Ellipsis key={`ellipsis-${index}`} disabled />
                      ) : (
                        <Pagination.Item
                          key={page}
                          active={page === currentPage}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Pagination.Item>
                      )
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
      <Modal show={showModal} onHide={handleCloseModal} size="lg" className={isDarkMode ? 'dark-mode' : ''}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? t('users.add_user') : t('users.edit_user')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitForm}>
            {/* Basic Information Section */}
            <h6 className="mb-3 mt-2 fw-bold">{t('common.basic_info') || 'Basic Information'}</h6>
            
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

            <Row className="mb-3">
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
            </Row>

            <Row className="mb-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>{t('users.nip') || 'NIP'}</Form.Label>
                  <Form.Control
                    type="text"
                    name="nip"
                    value={formData.nip}
                    onChange={handleInputChange}
                    placeholder={t('users.nip') || 'NIP'}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>{t('users.phone') || 'Phone'}</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={t('users.phone') || 'Phone'}
                  />
                </Form.Group>
              </div>
            </Row>

            {/* Organization Information Section */}
            <h6 className="mb-3 mt-4 fw-bold">{t('common.organization') || 'Organization'}</h6>

            {/* Roles Section */}
            <h6 className="mb-3 mt-4 fw-bold">{t('users.roles') || 'Roles'}</h6>
            <div className="roles-checkboxes mb-3 p-3 border rounded bg-light">
              {roles && roles.length > 0 ? (
                roles.map((role) => (
                  <Form.Check
                    key={role.id}
                    type="checkbox"
                    id={`role-${role.id}`}
                    name="roles"
                    data-role-id={role.id}
                    label={role.name_id || role.name_en || role.code}
                    checked={formData.roles && formData.roles.includes(role.id)}
                    onChange={handleInputChange}
                    className="mb-2"
                  />
                ))
              ) : (
                <p className="text-muted">{t('roles.no_roles') || 'No roles available'}</p>
              )}
            </div>

            <Form.Group className="mb-3">
              <Form.Label>{t('users.unit_organisasi') || 'Unit Organisasi'}</Form.Label>
              <Form.Control
                type="text"
                name="unit_organisasi"
                value={formData.unit_organisasi}
                onChange={handleInputChange}
                placeholder={t('users.unit_organisasi') || 'Unit Organisasi'}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('users.jenis_jabatan') || 'Jenis Jabatan'}</Form.Label>
              <Form.Control
                type="text"
                name="jenis_jabatan"
                value={formData.jenis_jabatan}
                onChange={handleInputChange}
                placeholder={t('users.jenis_jabatan') || 'Jenis Jabatan'}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('users.jabatan') || 'Jabatan'}</Form.Label>
              <Form.Control
                type="text"
                name="jabatan"
                value={formData.jabatan}
                onChange={handleInputChange}
                placeholder={t('users.jabatan') || 'Jabatan'}
              />
            </Form.Group>

            {/* Preferences Section */}
            <h6 className="mb-3 mt-4 fw-bold">{t('common.preferences') || 'Preferences'}</h6>

            <Row className="mb-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>{t('users.preferred_language') || 'Language'}</Form.Label>
                  <Form.Select
                    name="preferred_language"
                    value={formData.preferred_language}
                    onChange={handleInputChange}
                  >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>{t('users.theme_mode') || 'Theme'}</Form.Label>
                  <Form.Select
                    name="theme_mode"
                    value={formData.theme_mode}
                    onChange={handleInputChange}
                  >
                    <option value="light">{t('common.light') || 'Light'}</option>
                    <option value="dark">{t('common.dark') || 'Dark'}</option>
                    <option value="auto">{t('common.auto') || 'Auto'}</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </Row>

            {/* Status Section */}
            <h6 className="mb-3 mt-4 fw-bold">{t('common.status') || 'Status'}</h6>

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

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} className={isDarkMode ? 'dark-mode' : ''}>
        <Modal.Header closeButton>
          <Modal.Title>
            {confirmAction === 'delete' && t('users.confirm_delete')}
            {confirmAction === 'deactivate' && t('users.confirm_deactivate')}
            {confirmAction === 'activate' && t('users.confirm_activate')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {confirmUser && (
            <div>
              <p>
                {confirmAction === 'delete' && t('users.confirm_delete_detail', { 
                  user: confirmUser.first_name && confirmUser.last_name 
                    ? `${confirmUser.first_name} ${confirmUser.last_name}` 
                    : confirmUser.username || confirmUser.email
                })}
                {confirmAction === 'deactivate' && t('users.confirm_deactivate_detail', { 
                  user: confirmUser.first_name && confirmUser.last_name 
                    ? `${confirmUser.first_name} ${confirmUser.last_name}` 
                    : confirmUser.username || confirmUser.email
                })}
                {confirmAction === 'activate' && t('users.confirm_activate_detail', { 
                  user: confirmUser.first_name && confirmUser.last_name 
                    ? `${confirmUser.first_name} ${confirmUser.last_name}` 
                    : confirmUser.username || confirmUser.email
                })}
              </p>
              <Alert variant={confirmAction === 'delete' ? 'danger' : 'warning'} className="mb-0">
                <strong>
                  {confirmAction === 'delete' && t('common.warning') || 'Warning'}:
                </strong>
                {confirmAction === 'delete' && ` ${t('users.confirm_delete_warning')}`}
                {confirmAction === 'deactivate' && ` ${t('users.confirm_deactivate_warning')}`}
                {confirmAction === 'activate' && ` ${t('users.confirm_activate_warning')}`}
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            {t('buttons.cancel')}
          </Button>
          <Button
            variant={confirmAction === 'delete' ? 'danger' : 'warning'}
            onClick={confirmCallback}
          >
            {confirmAction === 'delete' && t('common.delete')}
            {confirmAction === 'deactivate' && t('buttons.cancel')}
            {confirmAction === 'activate' && t('buttons.submit')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default UserManagementPage;


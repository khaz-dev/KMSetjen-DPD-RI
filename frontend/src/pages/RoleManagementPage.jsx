import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import {
  Container, Table, Button, Modal, Form, Spinner, Alert,
  Pagination, Card, Badge
} from 'react-bootstrap';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import AdminSidebar from '../components/AdminSidebar';
import { adminAPI } from '../services/api';
import './RoleManagementPage.css';

/**
 * RoleManagementPage Component
 * Admin interface for role and permission management
 */
function RoleManagementPage({ onLogout }) {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  // State declarations must come first
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteRoleId, setDeleteRoleId] = useState(null);
  const [deleteRoleName, setDeleteRoleName] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    permissions: [],
  });
  const [sortBy, setSortBy] = useState('code'); // Sort field
  const [sortOrder, setSortOrder] = useState('asc'); // Sort order: 'asc' or 'desc'

  // Memoized permission lookup object for efficient ID-to-codename mapping
  // MUST be after state declarations to avoid TDZ (Temporal Dead Zone) error
  const permissionsLookup = React.useMemo(() => {
    const lookup = {};
    if (Array.isArray(permissions) && permissions.length > 0) {
      permissions.forEach(perm => {
        lookup[perm.id] = perm.codename;
      });
    }
    console.log('[RoleManagement] LOOKUP BUILD:', {
      permissionsArraySize: permissions.length,
      lookupSize: Object.keys(lookup).length,
      firstPermission: permissions[0],
      samplePermissions: permissions.slice(0, 3),
      lookupEntries: lookup,
    });
    return lookup;
  }, [permissions]);

  // Helper function to get permission codename by ID
  const getPermissionCodename = (permissionId) => {
    if (!permissionsLookup || typeof permissionsLookup !== 'object') return null;
    return permissionsLookup[permissionId] || null;
  };

  // Helper function to format permission labels with translation fallback
  const getPermissionLabel = (codename) => {
    if (!codename) return 'Unknown Permission';
    
    // First try to get the translation
    const translationKey = `permissions.${codename}`;
    const translated = t(translationKey);
    
    // If translation exists (doesn't start with 'permissions.'), return it
    if (translated && !translated.startsWith('permissions.')) {
      return translated;
    }
    
    // Otherwise, format the codename nicely
    // e.g., "add_article" -> "Add article"
    if (!codename || typeof codename !== 'string') {
      return `Permission: ${codename}`;
    }
    
    const parts = codename.split('_');
    if (parts.length === 0) return codename;
    
    const action = parts[0]; // 'add', 'change', 'delete', 'view'
    const resource = parts.slice(1).join(' '); // 'article', 'content type', etc.
    
    const actionMap = {
      'add': 'Add',
      'change': 'Edit',
      'delete': 'Delete',
      'view': 'View',
    };
    
    const actionText = actionMap[action] || action.charAt(0).toUpperCase() + action.slice(1);
    const formattedLabel = resource ? `${actionText} ${resource}` : actionText;
    
    // Capitalize first letter
    return formattedLabel.charAt(0).toUpperCase() + formattedLabel.slice(1);
  };

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
      };

      // Add sorting
      if (sortBy) {
        params.ordering = sortOrder === 'desc' ? `-${sortBy}` : sortBy;
      }

      const response = await adminAPI.getRoles(params);

      const rolesList = response.data.results || [];
      
      console.log('[RoleManagement LOAD] Roles loaded:', rolesList.length);
      console.log('[RoleManagement LOAD] Full roles response:', response.data);
      rolesList.forEach((role, idx) => {
        console.log(`[RoleManagement LOAD] Role ${idx}: Code=${role.code}, ID=${role.id}, UserCount=${role.user_count}, Type=${typeof role.user_count}, Keys=${Object.keys(role)}`);
      });
      
      setRoles(rolesList);
      setTotalPages(Math.ceil((response.data.count || 0) / 20));
    } catch (err) {
      console.error('Error loading roles:', err);
      setError(err.response?.data?.detail || t('roles.role_error'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, t, sortBy, sortOrder]);

  const loadPermissions = useCallback(async () => {
    try {
      console.log('[RoleManagement] Loading permissions...');
      const response = await adminAPI.getPermissions({
        page_size: 100,
      });

      // Extract results from paginated response
      const permissionsList = response.data.results || response.data || [];
      console.log('[RoleManagement] Permissions loaded:', permissionsList.length, 'items');
      console.log('[RoleManagement] First permission:', permissionsList[0]);
      console.log('[RoleManagement] Sample of loaded permissions (IDs 29-31):',
        permissionsList.filter(p => [29, 30, 31].includes(p.id))
      );
      
      // Ensure we have an array of objects with id property
      if (Array.isArray(permissionsList) && permissionsList.length > 0) {
        setPermissions(permissionsList);
      } else {
        console.warn('[RoleManagement] Permissions response format unexpected:', response.data);
        setPermissions([]);
      }
    } catch (err) {
      console.error('Error loading permissions:', err);
      setPermissions([]);
    }
  }, []);

  // Load permissions once when component mounts
  useEffect(() => {
    console.log('[RoleManagement] Component mounted - loading permissions');
    loadPermissions();
  }, [loadPermissions]);

  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle sort order if clicking same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field with ascending order
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return ' ↕';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  // Load roles when currentPage changes
  useEffect(() => {
    console.log('[RoleManagement] Page changed or loadRoles updated - loading roles');
    loadRoles();
  }, [loadRoles]);

  // Diagnostic effect to track permissions updates
  useEffect(() => {
    if (permissions.length > 0) {
      const lookupKeys = Object.keys(permissionsLookup);
      const allIds = permissions.map(p => p.id);
      const hasId29 = allIds.includes(29);
      const hasId30 = allIds.includes(30);
      const hasId31 = allIds.includes(31);
      
      console.log('[RoleManagement DIAGNOSTIC]:', {
        permissionsLoaded: permissions.length,
        lookupBuilt: lookupKeys.length,
        allPermissionIds: allIds.slice(0, 10),
        hasPermission29: hasId29,
        hasPermission30: hasId30,
        hasPermission31: hasId31,
        permissionsStructure: permissions[0],
        lookupStructure: { '29': permissionsLookup[29], '30': permissionsLookup[30], '31': permissionsLookup[31] },
      });
    }
  }, [permissions, permissionsLookup]);

  const handleOpenModal = (role = null) => {
    if (role) {
      setModalMode('edit');
      setSelectedRole(role);
      
      // Debug logging
      console.log('[RoleManagement] Opening edit modal for role:', role.code);
      console.log('[RoleManagement] Role permissions data:', role.permissions);
      console.log('[RoleManagement] Available permissions count:', permissions.length);
      
      // Convert permission IDs to numbers for proper comparison
      // Handle both direct IDs and objects with id property
      let permissionIds = [];
      if (Array.isArray(role.permissions)) {
        permissionIds = role.permissions.map(item => {
          // If it's a string, parse as integer
          if (typeof item === 'string') {
            return parseInt(item, 10);
          }
          // If it's a number, return as-is
          if (typeof item === 'number') {
            return item;
          }
          // If it's an object with id property, extract the id
          if (typeof item === 'object' && item !== null && 'id' in item) {
            return item.id;
          }
          // Otherwise return the item (should not happen in normal flow)
          console.warn('[RoleManagement] Unexpected permission format:', item);
          return item;
        });
      }
      
      console.log('[RoleManagement] Extracted permission IDs:', permissionIds);
      
      setFormData({
        code: role.code,
        name: role.name_id || role.name_en || '',
        description: (role.description_id || role.description_en || ''),
        permissions: permissionIds,
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

      const roleData = {
        code: formData.code,
        name_id: formData.name,
        name_en: formData.name,
        description_id: formData.description,
        description_en: formData.description,
        permissions: formData.permissions,
      };

      console.log('[RoleManagement FORM] Submitting:', {
        mode: modalMode,
        formData: {
          code: formData.code,
          name_id: formData.name,
          name_en: formData.name,
          description_id: formData.description,
          description_en: formData.description,
          permissions_count: formData.permissions.length,
        }
      });

      const response = modalMode === 'create'
        ? await adminAPI.createRole(roleData)
        : await adminAPI.updateRole(selectedRole.id, roleData);

      console.log('[RoleManagement FORM] Success:', response.status, response.data);
      setError(null);
      loadRoles();
      handleCloseModal();
    } catch (err) {
      console.error('[RoleManagement FORM] Error submitting form:', err);
      console.error('[RoleManagement FORM] Error response:', err.response?.status, err.response?.data);
      
      // Extract detailed error message from backend response
      let errorDetail = t('roles.role_error');
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Handle different error formats
        if (typeof errorData === 'string') {
          errorDetail = errorData;
        } else if (errorData.detail) {
          errorDetail = errorData.detail;
        } else if (errorData.code) {
          // Handle field-specific validation errors (e.g., {"code": ["error message"]})
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => {
              const msgText = Array.isArray(messages) ? messages.join(', ') : messages;
              return `${field}: ${msgText}`;
            })
            .join('; ');
          errorDetail = errorMessages || 'Validation error occurred';
        } else {
          // Fallback: stringify the error data
          errorDetail = JSON.stringify(errorData);
        }
      }
      
      console.log('[RoleManagement FORM] Final error message:', errorDetail);
      setError(errorDetail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = (roleId) => {
    console.log('[RoleManagement DELETE] Button clicked for roleId:', roleId);
    
    // Find the role name for display in confirmation modal
    const role = roles.find(r => r.id === roleId);
    const roleName = role ? role.code : `Role ${roleId}`;
    
    console.log('[RoleManagement DELETE] Opening confirmation modal for role:', roleName);
    setDeleteRoleId(roleId);
    setDeleteRoleName(roleName);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    const roleId = deleteRoleId;
    console.log('[RoleManagement DELETE] User confirmed, sending DELETE request...');
    
    try {
      console.log('[RoleManagement DELETE] Deleting role ID:', roleId);
      
      const response = await adminAPI.deleteRole(roleId);

      console.log('[RoleManagement DELETE] Success! Response:', response.status, response.data);
      
      // Show success alert
      alert(`Success: ${response.data.detail || 'Role deleted successfully'}`);
      
      setError(null);
      await loadRoles();
      console.log('[RoleManagement DELETE] Roles reloaded');
      setShowDeleteModal(false);
      setDeleteRoleId(null);
      setDeleteRoleName('');
    } catch (err) {
      console.error('[RoleManagement DELETE] Error deleting role:', err);
      console.error('[RoleManagement DELETE] Error status:', err.response?.status);
      console.error('[RoleManagement DELETE] Error data:', err.response?.data);
      console.error('[RoleManagement DELETE] Error message:', err.message);
      
      // Get detailed error message from backend response
      let errorDetail = t('roles.role_error');
      
      if (err.response?.data?.detail) {
        errorDetail = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorDetail = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorDetail = 'Cannot delete this role. Check if it has users assigned.';
      } else if (err.response?.status === 403) {
        errorDetail = 'You do not have permission to delete this role.';
      } else if (err.response?.status === 404) {
        errorDetail = 'Role not found.';
      } else if (err.response?.status === 500) {
        errorDetail = 'Server error occurred while deleting the role.';
      }
      
      // Show error alert
      alert(`Error: ${errorDetail}`);
      
      setError(errorDetail);
      setShowDeleteModal(false);
      setDeleteRoleId(null);
      setDeleteRoleName('');
    }
  };

  const handleCancelDelete = () => {
    console.log('[RoleManagement DELETE] User cancelled delete');
    setShowDeleteModal(false);
    setDeleteRoleId(null);
    setDeleteRoleName('');
  };

  return (
    <div className={`admin-wrapper ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <AdminSidebar onLogout={onLogout} />

      <div className="admin-content">
        <Container>
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
                        <th style={{cursor:'pointer'}} onClick={() => handleSort('code')}>
                          {t('roles.code')}{getSortIcon('code')}
                        </th>
                        <th style={{cursor:'pointer'}} onClick={() => handleSort('name')}>
                          {t('roles.name')}{getSortIcon('name')}
                        </th>
                        <th style={{cursor:'pointer'}} onClick={() => handleSort('description')}>
                          {t('roles.description')}{getSortIcon('description')}
                        </th>
                        <th>{t('roles.permissions')}</th>
                        <th>{t('sidebar.users')}</th>
                        <th>{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((role) => {
                        // Log table state when rendering roles
                        if (role.code === 'admin') {
                          console.log('[RoleManagement TABLE RENDER STATE]:', {
                            roleCode: role.code,
                            rolePermissionsArray: role.permissions,
                            rolePermissionsArrayType: Array.isArray(role.permissions) ? 'array' : typeof role.permissions,
                            permissionsStateSize: permissions.length,
                            permissionsStateSample: permissions.slice(0, 3).map(p => ({ id: p.id, codename: p.codename })),
                            lookupSize: Object.keys(permissionsLookup).length,
                            lookupKeys: Object.keys(permissionsLookup).slice(0, 5),
                            lookupFor29: permissionsLookup[29],
                            lookupFor30: permissionsLookup[30],
                            lookupFor31: permissionsLookup[31],
                          });
                        }
                        
                        return (
                        <tr key={role.id}>
                          <td>
                            <code className="role-code">{role.code}</code>
                          </td>
                          <td>
                            <strong>{role.name_id || role.name_en || '-'}</strong>
                          </td>
                          <td>{role.description_id || role.description_en || '-'}</td>
                          <td>
                            <div className="permission-badges">
                              {role.permissions && Array.isArray(role.permissions) && role.permissions.length > 0 ? (
                                role.permissions.slice(0, 3).map((permId, idx) => {
                                  // Convert permission ID to codename using lookup
                                  const codename = getPermissionCodename(permId);
                                  const label = codename ? getPermissionLabel(codename) : `Permission ${permId}`;
                                  
                                  // Debug logging for first role only
                                  if (role.code === 'admin' && idx < 3) {
                                    console.log(`[RoleManagement Table] Row ${idx}: PermID=${permId}, Codename=${codename}, Label=${label}, LookupHasID=${permId in permissionsLookup}, LookupValue=${permissionsLookup[permId]}`);
                                  }
                                  
                                  return (
                                    <Badge
                                      key={`perm-${role.id}-${idx}`}
                                      bg="info"
                                      className="permission-badge"
                                      title={label}
                                    >
                                      {label}
                                    </Badge>
                                  );
                                })
                              ) : (
                                <span className="text-muted">No permissions</span>
                              )}
                              {role.permissions && Array.isArray(role.permissions) && role.permissions.length > 3 && (
                                <Badge bg="secondary" className="permission-badge">
                                  +{role.permissions.length - 3}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td>
                            <Badge bg="success" className="permission-badge">{role.user_count || 0}</Badge>
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
                              {(() => {
                                const isDisabled = role.user_count > 0;
                                console.log(`[RoleManagement DELETE BTN] Role: ${role.code}, UserCount: ${role.user_count}, Type: ${typeof role.user_count}, Disabled: ${isDisabled}`);
                                return (
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => {
                                      console.log(`[RoleManagement DELETE BTN CLICK] Clicked delete for role: ${role.code} (ID: ${role.id})`);
                                      handleDeleteRole(role.id);
                                    }}
                                    disabled={isDisabled}
                                    title={
                                      isDisabled
                                        ? 'Cannot delete role with users'
                                        : 'Delete role'
                                    }
                                  >
                                    <FiTrash2 />
                                  </Button>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                        );
                      })}
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
      <Modal show={showModal} onHide={handleCloseModal} size="lg" className={isDarkMode ? 'dark-mode' : ''}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? t('roles.add_role') : t('roles.edit_role')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitForm}>
            <Form.Group className="mb-3">
              <Form.Label>{t('roles.code_required')}</Form.Label>
              <Form.Control
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                disabled={modalMode === 'edit'}
                placeholder={t('roles.code_placeholder')}
              />
              <Form.Text className="text-muted">
                {t('roles.code_hint')}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('roles.name_required')}</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder={t('roles.name_placeholder')}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('roles.description')}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder={t('roles.description_placeholder')}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('roles.permissions')}</Form.Label>
              <div className="permissions-grid">
                {permissions.length > 0 ? (
                  permissions.map((permission) => {
                    // Ensure we can extract ID from permission object
                    const permissionId = permission.id || permission.permission_id;
                    const isChecked = formData.permissions.includes(permissionId);
                    
                    // Debug first few checkboxes
                    if (permissions.indexOf(permission) < 3) {
                      console.log(`[RoleManagement] Permission: ID=${permissionId}, Codename=${permission.codename}, Checked=${isChecked}`);
                    }
                    
                    return (
                      <Form.Check
                        key={permissionId}
                        type="checkbox"
                        id={`perm-${permissionId}`}
                        label={getPermissionLabel(permission.codename)}
                        checked={isChecked}
                        onChange={() => handlePermissionChange(permissionId)}
                        className="permission-check"
                      />
                    );
                  })
                ) : (
                  <p className="text-muted">{t('roles.no_permissions')}</p>
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

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleCancelDelete} size="sm" className={isDarkMode ? 'dark-mode' : ''} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <span style={{ color: '#e74c3c' }}>⚠️ {t('roles.delete_confirmation')}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '1rem', fontSize: '1.05rem' }}>
              {t('roles.confirm_delete')}
            </p>
            <div style={{
              backgroundColor: isDarkMode ? '#2c3e50' : '#f8f9fa',
              padding: '1rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              border: '2px solid #e74c3c'
            }}>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem', color: '#e74c3c' }}>
                {deleteRoleName}
              </p>
            </div>
            <p style={{ fontSize: '0.95rem', color: '#7f8c8d', marginBottom: 0 }}>
              {t('roles.delete_warning') || 'This action cannot be undone.'}
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCancelDelete}
          >
            {t('buttons.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            style={{ backgroundColor: '#e74c3c', borderColor: '#c0392b' }}
          >
            {t('buttons.delete') || 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default RoleManagementPage;


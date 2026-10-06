import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Row, Col, Card, Badge, Table } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { authService, getAbsoluteMediaUrl } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import './ProfilePage.css';

/**
 * ProfilePage Component
 * User profile viewing and editing, showing roles, permissions, and activity
 */
const ProfilePage = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const notification = useNotification();
  const [loading, setLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [activityError, setActivityError] = useState(null);

  // Profile form state
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    nip: user?.nip || '',
    unit_organisasi: user?.unit_organisasi || '',
    jenis_jabatan: user?.jenis_jabatan || '',
    jabatan: user?.jabatan || '',
    avatar: user?.avatar || null,
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [avatarChanged, setAvatarChanged] = useState(false);

  // Sync profileData with user whenever user changes
  useEffect(() => {
    if (user) {
      // FIX: Convert relative avatar URL to absolute URL with backend domain
      const avatarPreviewUrl = getAbsoluteMediaUrl(user.avatar);

      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        nip: user.nip || '',
        unit_organisasi: user.unit_organisasi || '',
        jenis_jabatan: user.jenis_jabatan || '',
        jabatan: user.jabatan || '',
        avatar: avatarPreviewUrl || null,
      });
      setAvatarPreview(avatarPreviewUrl || null);
    }
  }, [user]);

  // Fetch user activity data
  useEffect(() => {
    // Wait for auth context to finish loading before fetching data
    if (authLoading) {
      return;
    }

    const fetchUserActivity = async () => {
      try {
        setActivityLoading(true);
        setActivityError(null);
        const response = await authService.getUserActivity();
        setActivityData(response.data);
      } catch (err) {
        console.error('Failed to fetch user activity:', err);
        setActivityError(err.response?.data?.detail || t('errors.server_error'));
      } finally {
        setActivityLoading(false);
      }
    };

    if (user) {
      fetchUserActivity();
    }
  }, [user, authLoading, t]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'id' ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get role badge color
  const getRoleBadgeColor = (roleName) => {
    if (!roleName) return 'primary'; // Default color if roleName is undefined
    const roleLower = roleName.toLowerCase();
    if (roleLower.includes('admin')) return 'danger';
    if (roleLower.includes('editor')) return 'warning';
    if (roleLower.includes('contributor')) return 'info';
    if (roleLower.includes('reader')) return 'secondary';
    return 'primary';
  };

  // Get action badge color
  const getActionBadgeColor = (action) => {
    if (!action) return 'default'; // Default color if action is undefined
    const actionUpper = action.toUpperCase();
    if (actionUpper === 'CREATE') return 'success';
    if (actionUpper === 'UPDATE') return 'info';
    if (actionUpper === 'DELETE') return 'danger';
    if (actionUpper === 'PUBLISH') return 'primary';
    if (actionUpper === 'APPROVE') return 'success';
    if (actionUpper === 'REJECT') return 'danger';
    if (actionUpper === 'VIEW') return 'secondary';
    return 'default';
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(t('profile.invalid_image_type') || 'Please select a valid image file');
        // Reset file input so same file can be selected again
        e.target.value = '';
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(t('profile.image_too_large') || 'Image file is too large (max 5MB)');
        // Reset file input so same file can be selected again
        e.target.value = '';
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = async () => {
        setAvatarPreview(reader.result);
        setProfileData((prev) => ({
          ...prev,
          avatar: file,
        }));
        setAvatarChanged(true);
        setError(null);

        // Auto-save avatar to backend after preview is set
        await saveAvatarToBackend(file);
        
        // Reset file input so same file can be selected again
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const saveAvatarToBackend = async (avatarFile) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await authService.updateProfile(formData);

      // Update local profile data with response
      if (response.data.user && response.data.user.avatar) {
        // FIX: Backend returns relative URL like "/media/avatars/user_1.jpg"
        // Convert to absolute URL by prepending backend domain
        const absoluteAvatarUrl = getAbsoluteMediaUrl(response.data.user.avatar);
        
        setProfileData((prev) => ({
          ...prev,
          avatar: absoluteAvatarUrl,
        }));
        setAvatarPreview(absoluteAvatarUrl);
      }

      notification.success('t:messages.avatar_updated');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || t('errors.server_error');
      setError(errorMsg);
      notification.error(errorMsg);
      console.error('Failed to save avatar:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarPreview(null);
    setProfileData((prev) => ({
      ...prev,
      avatar: null,
    }));

    // Auto-save removal to backend
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('avatar', ''); // Empty string to remove

      await authService.updateProfile(formData);

      notification.success('t:messages.avatar_removed');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || t('errors.server_error');
      setError(errorMsg);
      notification.error(errorMsg);
      console.error('Failed to remove avatar:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="profile-page">
      <Container className="py-5">
        <div className="profile-header">
          <h1>{t('profile.title')}</h1>
          <p className="text-muted">{user?.email}</p>
        </div>

        {activityError && <ErrorAlert message={activityError} onDismiss={() => setActivityError(null)} />}

        <Row className="mb-4">
          <Col xs={12}>
            <Card className="profile-card mb-4">
              <Card.Header>
                <Card.Title className="mb-0">{t('profile.edit_profile')}</Card.Title>
              </Card.Header>
              <Card.Body>
                {/* Avatar Section - Two Column Layout */}
                <div className="avatar-profile-section mb-4">
                  <Row>
                    {/* Left Column - Avatar Upload */}
                    <Col md={4} className="text-center">
                      <div className="avatar-upload-wrapper">
                        <input
                          type="file"
                          id="avatar-upload"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="avatar-upload" style={{ cursor: 'pointer', margin: 0 }}>
                          <div className="avatar-preview-container">
                            {avatarPreview ? (
                              <div className="avatar-current">
                                <img 
                                  src={avatarPreview} 
                                  alt="Avatar Preview" 
                                  className="avatar-image"
                                  loading="lazy"
                                  decoding="async"
                                  width="120"
                                  height="120"
                                  onError={() => {
                                    setAvatarPreview(null);
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="avatar-placeholder">
                                <p>📷</p>
                                <small>{t('profile.upload_avatar') || 'Upload Avatar'}</small>
                              </div>
                            )}
                          </div>
                        </label>
                        {avatarPreview && (
                          <div className="avatar-actions mt-3">
                            <button 
                              type="button"
                              className="btn btn-sm btn-outline-primary me-2"
                              disabled={loading}
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('avatar-upload').click();
                              }}
                            >
                              {loading ? t('messages.loading') : (t('buttons.change_image') || 'Change')}
                            </button>
                            <button 
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              disabled={loading}
                              onClick={handleAvatarRemove}
                            >
                              {loading ? t('messages.loading') : (t('buttons.remove_image') || 'Remove')}
                            </button>
                          </div>
                        )}
                        {!avatarPreview && (
                          <small className="d-block mt-2 text-muted">{t('profile.image_requirements') || 'Max 5MB, PNG/JPG/GIF'}</small>
                        )}
                      </div>
                    </Col>

                    {/* Right Column - Profile Information */}
                    <Col md={8}>
                      <div className="profile-info-section">
                        {/* Row 1: Nama Depan and Nama Belakang */}
                        <Row className="mb-3">
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-bold">{t('profile.first_name')}</Form.Label>
                              <Form.Control
                                type="text"
                                value={profileData.first_name}
                                disabled
                                className="bg-light"
                              />
                              <Form.Text className="text-muted">{t('profile.read_only') || 'Read-only'}</Form.Text>
                            </Form.Group>
                          </Col>

                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-bold">{t('profile.last_name')}</Form.Label>
                              <Form.Control
                                type="text"
                                value={profileData.last_name}
                                disabled
                                className="bg-light"
                              />
                              <Form.Text className="text-muted">{t('profile.read_only') || 'Read-only'}</Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>

                        {/* Row 2: Email and NIP */}
                        <Row className="mb-3">
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-bold">{t('profile.email')}</Form.Label>
                              <Form.Control
                                type="email"
                                value={profileData.email}
                                disabled
                                className="bg-light"
                              />
                              <Form.Text className="text-muted">{t('profile.read_only') || 'Read-only'}</Form.Text>
                            </Form.Group>
                          </Col>

                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-bold">{t('profile.nip') || 'NIP'}</Form.Label>
                              <Form.Control
                                type="text"
                                value={profileData.nip}
                                disabled
                                className="bg-light"
                              />
                              <Form.Text className="text-muted">{t('profile.read_only') || 'Read-only'}</Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>

                        {/* Row 3: Unit Organisasi (Full Width) */}
                        <Row className="mb-3">
                          <Col md={12}>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-bold">{t('profile.unit_organisasi') || 'Unit Organisasi'}</Form.Label>
                              <Form.Control
                                type="text"
                                value={profileData.unit_organisasi}
                                disabled
                                className="bg-light"
                              />
                              <Form.Text className="text-muted">{t('profile.read_only') || 'Read-only'}</Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>

                        {/* Row 4: Jenis Jabatan and Jabatan */}
                        <Row className="mb-3">
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-bold">{t('profile.jenis_jabatan') || 'Jenis Jabatan'}</Form.Label>
                              <Form.Control
                                type="text"
                                value={profileData.jenis_jabatan}
                                disabled
                                className="bg-light"
                              />
                              <Form.Text className="text-muted">{t('profile.read_only') || 'Read-only'}</Form.Text>
                            </Form.Group>
                          </Col>

                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-bold">{t('profile.jabatan') || 'Jabatan'}</Form.Label>
                              <Form.Control
                                type="text"
                                value={profileData.jabatan}
                                disabled
                                className="bg-light"
                              />
                              <Form.Text className="text-muted">{t('profile.read_only') || 'Read-only'}</Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Roles Section */}
        {activityData && (
          <>
            <Card className="profile-section mb-4">
              <Card.Header>
                <Card.Title className="mb-0">{t('profile.roles')}</Card.Title>
              </Card.Header>
              <Card.Body>
                {activityData.roles && activityData.roles.length > 0 ? (
                  <div className="roles-container">
                    {activityData.roles.map((role, index) => (
                      <div key={index} className="role-item mb-3">
                        <Badge bg={getRoleBadgeColor(role?.name)} className="mb-2">
                          {role?.name || 'Unknown Role'}
                        </Badge>
                        {role?.description && (
                          <p className="text-muted small mb-2">{role.description}</p>
                        )}
                        {role?.permissions && role.permissions.length > 0 && (
                          <div className="permissions-list">
                            <small className="text-secondary">
                              <strong>{t('profile.permissions')}:</strong>
                            </small>
                            <div className="mt-1">
                              {role.permissions.map((perm, permIndex) => (
                                <Badge key={permIndex} className="permission-badge me-1 mb-1">
                                  {perm.name || perm}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">{t('profile.no_roles')}</p>
                )}
              </Card.Body>
            </Card>

            {/* Activity Log Section */}
            <Card className="profile-section">
              <Card.Header>
                <Card.Title className="mb-0">{t('profile.activity')}</Card.Title>
              </Card.Header>
              <Card.Body>
                {activityData.activity && activityData.activity.length > 0 ? (
                  <div className="activity-container">
                    <Table striped hover responsive size="sm">
                      <thead>
                        <tr>
                          <th>{t('profile.action')}</th>
                          <th>{t('profile.content')}</th>
                          <th>{t('profile.timestamp')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityData.activity?.map((log, index) => (
                          <tr key={index}>
                            <td>
                              <Badge bg={getActionBadgeColor(log?.action)}>
                                {log?.action || 'Unknown'}
                              </Badge>
                            </td>
                            <td>
                              <small>
                                {log?.content_display || `${log?.content_type || 'Content'} (ID: ${log?.content_id || 'N/A'})`}
                              </small>
                            </td>
                            <td>
                              <small className="text-muted">
                                {log?.timestamp ? formatDate(log.timestamp) : 'Unknown'}
                              </small>
                            </td>
                          </tr>
                        )) || <tr><td colSpan="3" className="text-center text-muted">{t('profile.no_activity')}</td></tr>}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted">{t('profile.no_activity')}</p>
                )}
              </Card.Body>
            </Card>
          </>
        )}

        {activityLoading && <LoadingSpinner />}
      </Container>
    </div>
  );
};

export default ProfilePage;


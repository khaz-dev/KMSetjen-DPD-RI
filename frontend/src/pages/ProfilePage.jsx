import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Row, Col, Card, Badge, Table } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
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
  const [loading, setLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [activityError, setActivityError] = useState(null);

  // Profile form state
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });
  const [profileErrors, setProfileErrors] = useState({});

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

  const validateProfileForm = () => {
    const errors = {};
    if (!profileData.first_name) errors.first_name = t('validation.required');
    if (!profileData.last_name) errors.last_name = t('validation.required');
    if (!profileData.email) {
      errors.email = t('validation.required');
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      errors.email = t('validation.email_invalid');
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    try {
      setLoading(true);
      setError(null);
      await authService.updateProfile(profileData);
      setSuccess(t('messages.profile_updated'));
      setTimeout(() => setSuccess(null), 5175);
    } catch (err) {
      setError(err.response?.data?.detail || t('errors.server_error'));
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

        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
        {success && (
          <ErrorAlert
            type="success"
            message={success}
            onDismiss={() => setSuccess(null)}
          />
        )}
        {activityError && <ErrorAlert message={activityError} onDismiss={() => setActivityError(null)} />}

        <Row className="mb-4">
          <Col lg={8}>
            <Card className="profile-card mb-4">
              <Card.Header>
                <Card.Title className="mb-0">{t('profile.edit_profile')}</Card.Title>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleProfileSubmit} className="profile-form">
                  <Form.Group className="mb-3">
                    <Form.Label>{t('profile.first_name')}</Form.Label>
                    <Form.Control
                      type="text"
                      name="first_name"
                      value={profileData.first_name}
                      onChange={handleProfileChange}
                      isInvalid={!!profileErrors.first_name}
                      disabled={loading}
                    />
                    <Form.Control.Feedback type="invalid">
                      {profileErrors.first_name}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>{t('profile.last_name')}</Form.Label>
                    <Form.Control
                      type="text"
                      name="last_name"
                      value={profileData.last_name}
                      onChange={handleProfileChange}
                      isInvalid={!!profileErrors.last_name}
                      disabled={loading}
                    />
                    <Form.Control.Feedback type="invalid">
                      {profileErrors.last_name}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>{t('profile.email')}</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      isInvalid={!!profileErrors.email}
                      disabled={loading}
                    />
                    <Form.Control.Feedback type="invalid">
                      {profileErrors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="mb-2"
                  >
                    {loading ? t('messages.loading') : t('buttons.save')}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="profile-actions-card">
              <Card.Body>
                <Button
                  variant="outline-danger"
                  className="w-100"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  {t('nav.logout')}
                </Button>
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


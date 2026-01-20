import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import './ProfilePage.css';

/**
 * ProfilePage Component
 * User profile viewing and editing
 */
const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Profile form state
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });
  const [profileErrors, setProfileErrors] = useState({});

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
      setTimeout(() => setSuccess(null), 3000);
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
          <p className="text-muted">{t('dashboard.my_articles')}</p>
        </div>

        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
        {success && (
          <ErrorAlert
            type="success"
            message={success}
            onDismiss={() => setSuccess(null)}
          />
        )}

        <div className="profile-card">
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

          <div className="profile-actions">
            <Button
              variant="outline-danger"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ProfilePage;

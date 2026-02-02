import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container } from 'react-bootstrap';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/api';
import ErrorAlert from '../components/ErrorAlert';
import './AuthPages.css';

/**
 * RegisterPage Component
 * User registration form with validation
 */
const RegisterPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = t('register.email_required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('register.email_invalid');
    }

    if (!formData.first_name) {
      newErrors.first_name = t('validation.required');
    }

    if (!formData.last_name) {
      newErrors.last_name = t('validation.required');
    }

    if (!formData.password) {
      newErrors.password = t('register.password_required');
    } else if (formData.password.length < 8) {
      newErrors.password = t('register.password_min');
    }

    if (!formData.password_confirm) {
      newErrors.password_confirm = t('register.confirm_required');
    } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = t('register.passwords_mismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setApiError(null);

      await authService.register({
        email: formData.email,
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
      });

      // Redirect to login
      navigate('/login', {
        state: { message: 'Registration successful! Please log in.' },
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.email?.[0] ||
        err.response?.data?.username?.[0] ||
        'Registration failed. Please try again.';
      setApiError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Container className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>{t('register.title')}</h1>
            <p>{t('header.welcome')}</p>
          </div>

          {apiError && (
            <ErrorAlert message={apiError} onDismiss={() => setApiError(null)} />
          )}

          <Form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <Form.Group className="mb-3">
                <Form.Label>{t('register.first_name')}</Form.Label>
                <Form.Control
                  type="text"
                  name="first_name"
                  placeholder="John"
                  value={formData.first_name}
                  onChange={handleChange}
                  isInvalid={!!errors.first_name}
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.first_name}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>{t('register.last_name')}</Form.Label>
                <Form.Control
                  type="text"
                  name="last_name"
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={handleChange}
                  isInvalid={!!errors.last_name}
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.last_name}
                </Form.Control.Feedback>
              </Form.Group>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>{t('register.email')}</Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!errors.email}
                disabled={loading}
              />
              <Form.Control.Feedback type="invalid">
                {errors.email}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('register.password')}</Form.Label>
              <div className="password-input-wrapper">
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  isInvalid={!!errors.password}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              <Form.Control.Feedback type="invalid">
                {errors.password}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('register.confirm_password')}</Form.Label>
              <div className="password-input-wrapper">
                <Form.Control
                  type={showPasswordConfirm ? 'text' : 'password'}
                  name="password_confirm"
                  placeholder="••••••••"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  isInvalid={!!errors.password_confirm}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  disabled={loading}
                  aria-label={showPasswordConfirm ? 'Hide password' : 'Show password'}
                >
                  {showPasswordConfirm ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              <Form.Control.Feedback type="invalid">
                {errors.password_confirm}
              </Form.Control.Feedback>
            </Form.Group>

            <Button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? t('messages.loading') : t('register.submit')}
            </Button>
          </Form>

          <div className="auth-footer">
            <p>
              {t('register.have_account')}{' '}
              <a href="/login">{t('register.login_link')}</a>
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default RegisterPage;


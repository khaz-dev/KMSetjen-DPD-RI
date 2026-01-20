import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Form, Button, Card, Row, Col } from 'react-bootstrap';
import { useTheme } from '../contexts/ThemeContext';
import ErrorAlert from '../components/ErrorAlert';
import './SettingsPage.css';

/**
 * SettingsPage Component
 * User settings and preferences (theme, language, notifications)
 */
const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { isDarkMode, toggleTheme } = useTheme();
  const [success, setSuccess] = useState(null);

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    if (newTheme === 'dark') {
      if (!isDarkMode) toggleTheme();
    } else {
      if (isDarkMode) toggleTheme();
    }
    setSuccess(t('messages.settings_saved'));
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    setSuccess(t('messages.settings_saved'));
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="settings-page">
      <Container className="py-5">
        <div className="settings-header mb-5">
          <h1>{t('settings.title', 'Settings')}</h1>
          <p className="text-muted">{t('settings.subtitle', 'Manage your preferences and account settings')}</p>
        </div>

        {success && (
          <ErrorAlert
            type="success"
            message={success}
            onDismiss={() => setSuccess(null)}
          />
        )}

        <Row>
          <Col lg={8}>
            {/* Theme Settings */}
            <Card className="settings-card mb-4">
              <Card.Header className="settings-card-header">
                <h5 className="mb-0">{t('settings.appearance', 'Appearance')}</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>{t('settings.theme', 'Theme')}</Form.Label>
                  <Form.Select
                    value={isDarkMode ? 'dark' : 'light'}
                    onChange={handleThemeChange}
                  >
                    <option value="light">{t('settings.light_mode', 'Light Mode')}</option>
                    <option value="dark">{t('settings.dark_mode', 'Dark Mode')}</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    {t('settings.theme_help', 'Choose your preferred color scheme')}
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Language Settings */}
            <Card className="settings-card mb-4">
              <Card.Header className="settings-card-header">
                <h5 className="mb-0">{t('settings.language', 'Language')}</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>{t('settings.interface_language', 'Interface Language')}</Form.Label>
                  <Form.Select
                    value={i18n.language || 'en'}
                    onChange={handleLanguageChange}
                  >
                    <option value="en">{t('settings.english', 'English')}</option>
                    <option value="id">{t('settings.indonesian', 'Indonesian')}</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    {t('settings.language_help', 'Select your preferred language')}
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Account Settings */}
            <Card className="settings-card">
              <Card.Header className="settings-card-header">
                <h5 className="mb-0">{t('settings.account', 'Account')}</h5>
              </Card.Header>
              <Card.Body>
                <div className="account-info mb-3">
                  <p className="text-muted mb-2">{t('settings.account_help', 'Manage your account information')}</p>
                  <Button variant="primary" href="/profile">
                    {t('settings.edit_profile', 'Edit Profile')}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Settings Info Card */}
          <Col lg={4}>
            <Card className="settings-info-card">
              <Card.Header className="settings-info-header">
                <h6 className="mb-0">{t('settings.info_title', 'About Settings')}</h6>
              </Card.Header>
              <Card.Body>
                <p className="small">{t('settings.info_content', 'Your settings are saved automatically. Changes to theme and language take effect immediately.')}</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SettingsPage;

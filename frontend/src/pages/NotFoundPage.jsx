import React from 'react';
import { Container, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import './ErrorPages.css';

/**
 * NotFoundPage Component
 * 404 - Page Not Found Page
 * Bilingual (Indonesian & English) error page
 */
const NotFoundPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  return (
    <div className={`error-page ${isDarkMode ? 'dark-mode' : ''}`}>
      <Container className="error-container">
        <Row className="h-100 align-items-center justify-content-center">
          <Col md={8} lg={6} className="text-center">
            <div className="error-content">
              <div className="error-code">404</div>
              
              <h1 className="error-title">
                {t('errors.page_not_found')}
              </h1>
              
              <p className="error-description">
                {t('errors.page_not_found_description')}
              </p>

              <div className="error-actions">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/')}
                  className="me-3"
                >
                  {t('common.home')}
                </Button>
                <Button
                  variant="outline-primary"
                  size="lg"
                  onClick={() => navigate(-1)}
                >
                  {t('common.go_back')}
                </Button>
              </div>

              <div className="error-help">
                <p className="text-muted">
                  {t('errors.need_help')}
                </p>
                <a href="/contact">
                  {t('common.contact_us')}
                </a>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default NotFoundPage;

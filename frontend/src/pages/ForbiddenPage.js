import React from 'react';
import { Container, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './ErrorPages.css';

/**
 * ForbiddenPage Component
 * Displays when user lacks required permissions (403 error)
 */
const ForbiddenPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="error-page">
      <Container>
        <Row className="align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
          <Col md={6} className="text-center">
            <div className="error-content">
              <h1 className="error-code">403</h1>
              <h2 className="error-title">{t('errors.unauthorized')}</h2>
              <p className="error-message">
                You do not have permission to access this resource. 
                Please contact the administrator if you believe this is an error.
              </p>

              <div className="error-actions">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/')}
                  className="me-2"
                >
                  {t('buttons.back')} to Home
                </Button>
                <Button
                  variant="outline-secondary"
                  size="lg"
                  onClick={() => navigate(-1)}
                >
                  Go Back
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ForbiddenPage;

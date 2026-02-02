import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import './AboutPage.css';

/**
 * About Page Component
 * Displays information about DPD RI and the KMS system
 */
const AboutPage = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  return (
    <div className={`about-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Header Section */}
      <section className="about-header py-5">
        <Container>
          <Row>
            <Col lg={8} className="mx-auto text-center">
              <h1 className="display-4 mb-3">{t('about.title', 'About DPD RI KMS')}</h1>
              <p className="lead">
                {t('about.subtitle', 'Knowledge Management System for the Regional Representative Council of Indonesia')}
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Main Content */}
      <section className="about-content py-5">
        <Container>
          {/* Mission Section */}
          <Row className="mb-5">
            <Col lg={8} className="mx-auto">
              <h2 className="mb-4">{t('about.mission', 'Our Mission')}</h2>
              <p className="mb-3">
                {t('about.mission_text', 'The DPD RI Knowledge Management System is designed to facilitate effective sharing and management of institutional knowledge within the Regional Representative Council of Indonesia. We aim to create a centralized platform that enables members, staff, and stakeholders to access, contribute, and collaborate on important information and insights.')}
              </p>
              <p>
                {t('about.mission_text_2', 'Our commitment is to enhance institutional efficiency, promote transparency, and support better decision-making through organized and accessible knowledge resources.')}
              </p>
            </Col>
          </Row>

          {/* Vision Section */}
          <Row className="mb-5">
            <Col lg={8} className="mx-auto">
              <h2 className="mb-4">{t('about.vision', 'Our Vision')}</h2>
              <p className="mb-3">
                {t('about.vision_text', 'To become a leading knowledge management platform that empowers the DPD RI to make informed decisions, foster collaboration, and drive organizational excellence through the effective use of institutional knowledge and best practices.')}
              </p>
              <p>
                {t('about.vision_text_2', 'We envision a future where knowledge is seamlessly shared, easily accessible, and strategically utilized to support the DPD RI\'s mission of representing the regions and advancing national interests.')}
              </p>
            </Col>
          </Row>

          {/* Features Section */}
          <Row className="mb-5">
            <Col lg={8} className="mx-auto">
              <h2 className="mb-4">{t('about.features', 'Key Features')}</h2>
              <div className="features-list">
                <div className="feature-item mb-3">
                  <h5>📚 {t('about.feature_content', 'Rich Content Management')}</h5>
                  <p className="text-muted">{t('about.feature_content_desc', 'Comprehensive article management with support for text, images, videos, and attachments')}</p>
                </div>
                <div className="feature-item mb-3">
                  <h5>🌍 {t('about.feature_bilingual', 'Bilingual Support')}</h5>
                  <p className="text-muted">{t('about.feature_bilingual_desc', 'Full support for Indonesian and English languages to reach a wider audience')}</p>
                </div>
                <div className="feature-item mb-3">
                  <h5>🔐 {t('about.feature_security', 'Secure Access Control')}</h5>
                  <p className="text-muted">{t('about.feature_security_desc', 'Role-based access control and authentication mechanisms to protect sensitive information')}</p>
                </div>
                <div className="feature-item mb-3">
                  <h5>🎯 {t('about.feature_organization', 'Well-Organized Structure')}</h5>
                  <p className="text-muted">{t('about.feature_organization_desc', 'Category-based organization and powerful search capabilities for easy information discovery')}</p>
                </div>
                <div className="feature-item mb-3">
                  <h5>🌙 {t('about.feature_accessibility', 'Accessible Design')}</h5>
                  <p className="text-muted">{t('about.feature_accessibility_desc', 'Light and dark mode support with WCAG compliance for inclusive user experience')}</p>
                </div>
                <div className="feature-item mb-3">
                  <h5>👥 {t('about.feature_collaboration', 'Collaborative Features')}</h5>
                  <p className="text-muted">{t('about.feature_collaboration_desc', 'Engagement metrics, likes, comments, and user profiles to foster community interaction')}</p>
                </div>
              </div>
            </Col>
          </Row>

          {/* About DPD RI Section */}
          <Row className="mb-5">
            <Col lg={8} className="mx-auto">
              <h2 className="mb-4">{t('about.dpdri_info', 'About DPD RI')}</h2>
              <p className="mb-3">
                {t('about.dpdri_text', 'The Regional Representative Council of Indonesia (Dewan Perwakilan Daerah Republik Indonesia - DPD RI) is one of the legislative bodies of Indonesia. It was established through the amendment of the Indonesian Constitution in 1999 and began operations in 2004.')}
              </p>
              <p className="mb-3">
                {t('about.dpdri_text_2', 'The DPD RI consists of representatives from each province, and its primary role is to represent regional interests in the national legislative process. The council focuses on issues related to regional autonomy, inter-regional relations, and the equitable development of regions throughout Indonesia.')}
              </p>
              <p>
                {t('about.dpdri_text_3', 'Through this Knowledge Management System, the DPD RI continues to enhance its operational efficiency and promote transparency in serving the people and advancing the interests of the Indonesian regions.')}
              </p>
            </Col>
          </Row>

          {/* Contact Information */}
          <Row className="mb-5 bg-light-section p-4 rounded">
            <Col lg={8} className="mx-auto">
              <h2 className="mb-4">{t('about.get_in_touch', 'Get in Touch')}</h2>
              <p className="mb-3">
                {t('about.contact_intro', 'For inquiries about the Knowledge Management System or to provide feedback, please contact us:')}
              </p>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <strong>📧 {t('about.email', 'Email')}:</strong> <a href="mailto:sdm@dpd.go.id">sdm@dpd.go.id</a>
                </li>
                <li className="mb-2">
                  <strong>🌐 {t('about.website', 'Website')}:</strong> <a href="https://www.dpd.go.id/" target="_blank" rel="noopener noreferrer">https://www.dpd.go.id/</a>
                </li>
                <li className="mb-2">
                  <strong>📍 {t('about.location', 'Location')}:</strong> {t('about.address', 'Jakarta, Indonesia')}
                </li>
              </ul>
            </Col>
          </Row>

          {/* Last Updated */}
          <Row>
            <Col lg={8} className="mx-auto text-center">
              <p className="text-muted small mt-5">
                {t('about.last_updated', 'Last updated: January 2024')}
              </p>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default AboutPage;


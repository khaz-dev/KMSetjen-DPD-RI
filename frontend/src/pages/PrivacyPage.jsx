import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import './PolicyPage.css';

/**
 * Privacy Page Component
 * Displays privacy policy information
 */
const PrivacyPage = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <div className={`policy-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Header Section */}
      <section className="policy-header py-5">
        <Container>
          <Row>
            <Col lg={10} className="mx-auto">
              <h1 className="display-4 mb-3">{t('privacy.title', 'Privacy Policy')}</h1>
              <p className="lead mb-3">
                {t('privacy.subtitle', 'How we collect, use, and protect your information')}
              </p>
              <p className="text-muted policy-header-muted">
                {t('privacy.last_updated', 'Last updated: January 2024')}
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Privacy Content */}
      <section className="policy-content py-5">
        <Container>
          <Row>
            <Col lg={10} className="mx-auto">
              {/* Introduction */}
              <div className="policy-section mb-5">
                <h2>{t('privacy.intro_title', 'Introduction')}</h2>
                <p>
                  {t('privacy.intro_text', 'The DPD RI Knowledge Management System ("System") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our System, including any other media form, media channel, mobile website, or mobile application.')}
                </p>
              </div>

              {/* Information We Collect */}
              <div className="policy-section mb-5">
                <h2>{t('privacy.info_collect_title', 'Information We Collect')}</h2>
                <h5>{t('privacy.personal_info', 'Personal Information')}</h5>
                <p>
                  {t('privacy.personal_info_text', 'We collect personal information that you voluntarily provide to us when you register an account, create a profile, log in, or interact with the System. This may include:')}
                </p>
                <ul>
                  <li>{t('privacy.personal_info_1', 'Full name')}</li>
                  <li>{t('privacy.personal_info_2', 'Email address')}</li>
                  <li>{t('privacy.personal_info_3', 'Phone number')}</li>
                  <li>{t('privacy.personal_info_4', 'Organization/Department')}</li>
                  <li>{t('privacy.personal_info_5', 'Profile information and preferences')}</li>
                </ul>

                <h5 className="mt-4">{t('privacy.usage_info', 'Usage Information')}</h5>
                <p>
                  {t('privacy.usage_info_text', 'We automatically collect certain information about your device when you use the System, including:')}
                </p>
                <ul>
                  <li>{t('privacy.usage_info_1', 'IP address and browser type')}</li>
                  <li>{t('privacy.usage_info_2', 'Pages visited and time spent')}</li>
                  <li>{t('privacy.usage_info_3', 'Search queries and navigation patterns')}</li>
                  <li>{t('privacy.usage_info_4', 'Device information and operating system')}</li>
                </ul>
              </div>

              {/* How We Use Information */}
              <div className="policy-section mb-5">
                <h2>{t('privacy.how_use_title', 'How We Use Your Information')}</h2>
                <p>
                  {t('privacy.how_use_intro', 'We use the information we collect to:')}
                </p>
                <ul>
                  <li>{t('privacy.how_use_1', 'Provide and maintain the System')}</li>
                  <li>{t('privacy.how_use_2', 'Authenticate your identity and manage your account')}</li>
                  <li>{t('privacy.how_use_3', 'Deliver personalized content and recommendations')}</li>
                  <li>{t('privacy.how_use_4', 'Improve and optimize the System\'s functionality')}</li>
                  <li>{t('privacy.how_use_5', 'Send administrative and promotional communications')}</li>
                  <li>{t('privacy.how_use_6', 'Comply with legal obligations')}</li>
                  <li>{t('privacy.how_use_7', 'Prevent fraud and ensure system security')}</li>
                </ul>
              </div>

              {/* Data Security */}
              <div className="policy-section mb-5">
                <h2>{t('privacy.security_title', 'Data Security')}</h2>
                <p>
                  {t('privacy.security_text', 'We implement comprehensive security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. These measures include:')}
                </p>
                <ul>
                  <li>{t('privacy.security_1', 'Encrypted data transmission (HTTPS/SSL)')}</li>
                  <li>{t('privacy.security_2', 'Secure password storage with hashing')}</li>
                  <li>{t('privacy.security_3', 'Role-based access control')}</li>
                  <li>{t('privacy.security_4', 'Regular security audits and updates')}</li>
                  <li>{t('privacy.security_5', 'Limited access to sensitive information')}</li>
                </ul>
              </div>

              {/* Third-Party Services */}
              <div className="policy-section mb-5">
                <h2>{t('privacy.third_party_title', 'Third-Party Services')}</h2>
                <p>
                  {t('privacy.third_party_text', 'The System may use third-party services for authentication, analytics, and hosting. These services have their own privacy policies. We encourage you to review the privacy policies of any third-party services before providing your information.')}
                </p>
              </div>

              {/* Your Rights */}
              <div className="policy-section mb-5">
                <h2>{t('privacy.rights_title', 'Your Privacy Rights')}</h2>
                <p>
                  {t('privacy.rights_intro', 'You have the right to:')}
                </p>
                <ul>
                  <li>{t('privacy.rights_1', 'Access your personal information')}</li>
                  <li>{t('privacy.rights_2', 'Request correction of inaccurate data')}</li>
                  <li>{t('privacy.rights_3', 'Request deletion of your account and data')}</li>
                  <li>{t('privacy.rights_4', 'Opt out of promotional communications')}</li>
                  <li>{t('privacy.rights_5', 'Withdraw consent for data processing')}</li>
                </ul>
              </div>

              {/* Data Retention */}
              <div className="policy-section mb-5">
                <h2>{t('privacy.retention_title', 'Data Retention')}</h2>
                <p>
                  {t('privacy.retention_text', 'We retain your personal information for as long as necessary to provide the System\'s services and fulfill the purposes outlined in this Privacy Policy. You can request deletion of your data at any time by contacting our support team.')}
                </p>
              </div>

              {/* Contact Us */}
              <div className="policy-section mb-5 contact-section">
                <h2>{t('privacy.contact_title', 'Contact Us')}</h2>
                <p>
                  {t('privacy.contact_text', 'If you have questions about this Privacy Policy or our privacy practices, please contact us at:')}
                </p>
                <ul className="list-unstyled">
                  <li>
                    <strong>Email:</strong> <a href="mailto:privacy@dpd.go.id">privacy@dpd.go.id</a>
                  </li>
                  <li>
                    <strong>Phone:</strong> <a href="tel:+62-81-3948-4805">+62-81-3948-4805</a>
                  </li>
                  <li>
                    <strong>Address:</strong> DPD RI, Jakarta, Indonesia
                  </li>
                </ul>
              </div>

              {/* Policy Changes */}
              <div className="policy-section">
                <h2>{t('privacy.changes_title', 'Changes to This Privacy Policy')}</h2>
                <p>
                  {t('privacy.changes_text', 'We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated Privacy Policy on the System and updating the "Last Updated" date.')}
                </p>
              </div>

              <hr className="my-5" />

              <p className="text-muted small">
                &copy; {currentYear} BPSDM, OKK, Setjen DPD RI. {t('privacy.copyright', 'All rights reserved.')}
              </p>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default PrivacyPage;


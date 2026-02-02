import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import './PolicyPage.css';

/**
 * Terms Page Component
 * Displays terms of service information
 */
const TermsPage = () => {
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
              <h1 className="display-4 mb-3">{t('terms.title', 'Terms of Service')}</h1>
              <p className="lead mb-3">
                {t('terms.subtitle', 'Please read these terms carefully before using the Knowledge Management System')}
              </p>
              <p className="text-muted">
                {t('terms.last_updated', 'Last updated: January 2024')}
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Terms Content */}
      <section className="policy-content py-5">
        <Container>
          <Row>
            <Col lg={10} className="mx-auto">
              {/* Agreement */}
              <div className="policy-section mb-5">
                <h2>{t('terms.agreement_title', 'Agreement to Terms')}</h2>
                <p>
                  {t('terms.agreement_text', 'By accessing and using the DPD RI Knowledge Management System ("System"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.')}
                </p>
              </div>

              {/* Use License */}
              <div className="policy-section mb-5">
                <h2>{t('terms.license_title', 'Use License')}</h2>
                <p>
                  {t('terms.license_intro', 'Permission is granted to temporarily download one copy of the materials (information or software) on the System for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:')}
                </p>
                <ul>
                  <li>{t('terms.license_1', 'Modify or copy the materials')}</li>
                  <li>{t('terms.license_2', 'Use the materials for any commercial purpose or for any public display')}</li>
                  <li>{t('terms.license_3', 'Attempt to decompile or reverse engineer any software contained on the System')}</li>
                  <li>{t('terms.license_4', 'Remove any copyright or other proprietary notations from the materials')}</li>
                  <li>{t('terms.license_5', 'Transfer the materials to another person or "mirror" the materials on any other server')}</li>
                  <li>{t('terms.license_6', 'Violate any applicable laws or regulations')}</li>
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="policy-section mb-5">
                <h2>{t('terms.disclaimer_title', 'Disclaimer')}</h2>
                <p>
                  {t('terms.disclaimer_text', 'The materials on the System are provided on an "as is" basis. DPD RI makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.')}
                </p>
              </div>

              {/* Limitations */}
              <div className="policy-section mb-5">
                <h2>{t('terms.limitations_title', 'Limitations')}</h2>
                <p>
                  {t('terms.limitations_text', 'In no event shall DPD RI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the System, even if DPD RI or an authorized representative has been notified orally or in writing of the possibility of such damage.')}
                </p>
              </div>

              {/* Accuracy of Materials */}
              <div className="policy-section mb-5">
                <h2>{t('terms.accuracy_title', 'Accuracy of Materials')}</h2>
                <p>
                  {t('terms.accuracy_text', 'The materials appearing on the System could include technical, typographical, or photographic errors. DPD RI does not warrant that any of the materials on the System are accurate, complete, or current. DPD RI may make changes to the materials contained on the System at any time without notice.')}
                </p>
              </div>

              {/* Links */}
              <div className="policy-section mb-5">
                <h2>{t('terms.links_title', 'Links')}</h2>
                <p>
                  {t('terms.links_text', 'DPD RI has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by DPD RI of the site. Use of any such linked website is at the user\'s own risk.')}
                </p>
              </div>

              {/* Modifications */}
              <div className="policy-section mb-5">
                <h2>{t('terms.modifications_title', 'Modifications')}</h2>
                <p>
                  {t('terms.modifications_text', 'DPD RI may revise these terms of service for the System at any time without notice. By using the System, you are agreeing to be bound by the then current version of these terms of service.')}
                </p>
              </div>

              {/* Governing Law */}
              <div className="policy-section mb-5">
                <h2>{t('terms.law_title', 'Governing Law')}</h2>
                <p>
                  {t('terms.law_text', 'These terms and conditions are governed by and construed in accordance with the laws of the Republic of Indonesia, and you irrevocably submit to the exclusive jurisdiction of the courts in Indonesia.')}
                </p>
              </div>

              {/* User Conduct */}
              <div className="policy-section mb-5">
                <h2>{t('terms.conduct_title', 'User Conduct')}</h2>
                <p>
                  {t('terms.conduct_intro', 'You agree not to use the System for any purpose that is prohibited by these Terms. You agree that you will not:')}
                </p>
                <ul>
                  <li>{t('terms.conduct_1', 'Violate any applicable laws or regulations')}</li>
                  <li>{t('terms.conduct_2', 'Infringe upon any intellectual property rights')}</li>
                  <li>{t('terms.conduct_3', 'Harass, threaten, or harm others')}</li>
                  <li>{t('terms.conduct_4', 'Transmit spam or unsolicited communications')}</li>
                  <li>{t('terms.conduct_5', 'Gain unauthorized access to the System')}</li>
                  <li>{t('terms.conduct_6', 'Disrupt the normal operation of the System')}</li>
                  <li>{t('terms.conduct_7', 'Collect or track personal information of others')}</li>
                </ul>
              </div>

              {/* Intellectual Property */}
              <div className="policy-section mb-5">
                <h2>{t('terms.ip_title', 'Intellectual Property Rights')}</h2>
                <p>
                  {t('terms.ip_text', 'Unless otherwise stated, DPD RI and/or its licensors own the intellectual property rights for all material on the System. All intellectual property rights are reserved. You may access this content for personal use subject to restrictions set in these terms and conditions.')}
                </p>
              </div>

              {/* Account Responsibilities */}
              <div className="policy-section mb-5">
                <h2>{t('terms.account_title', 'Account Responsibilities')}</h2>
                <p>
                  {t('terms.account_text', 'If you create an account on the System, you are responsible for maintaining the confidentiality of your account information and password and for restricting access to your account. You agree to accept responsibility for all activities that occur under your account.')}
                </p>
              </div>

              {/* Contact Us */}
              <div className="policy-section mb-5 contact-section">
                <h2>{t('terms.contact_title', 'Contact Us')}</h2>
                <p>
                  {t('terms.contact_text', 'If you have questions about these Terms of Service, please contact us at:')}
                </p>
                <ul className="list-unstyled">
                  <li>
                    <strong>Email:</strong> <a href="mailto:support@dpd.go.id">support@dpd.go.id</a>
                  </li>
                  <li>
                    <strong>Phone:</strong> <a href="tel:+62-81-3948-4805">+62-81-3948-4805</a>
                  </li>
                  <li>
                    <strong>Address:</strong> DPD RI, Jakarta, Indonesia
                  </li>
                </ul>
              </div>

              {/* Severability */}
              <div className="policy-section">
                <h2>{t('terms.severability_title', 'Severability')}</h2>
                <p>
                  {t('terms.severability_text', 'If any provision of these terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.')}
                </p>
              </div>

              <hr className="my-5" />

              <p className="text-muted small">
                &copy; {currentYear} DPD RI. {t('terms.copyright', 'All rights reserved.')}
              </p>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default TermsPage;


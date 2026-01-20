import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import './ContactPage.css';

/**
 * Contact Page Component
 * Displays contact information and a contact form for user inquiries
 */
const ContactPage = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    // Validate form
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setSubmitError(t('contact.error_required_fields', 'Please fill in all required fields'));
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitError(t('contact.error_invalid_email', 'Please enter a valid email address'));
      return;
    }

    try {
      // Create email body with formatted message
      const emailBody = `Name: ${formData.name}\nEmail: ${formData.email}\n\nSubject:\n${formData.subject}\n\nMessage:\n${formData.message}`;
      const emailSubject = `KMS - ${formData.subject} - ${formData.name}`;
      
      // Try Gmail first (if user has Gmail account)
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=sdm@dpd.go.id&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Open Gmail in a new tab
      window.open(gmailUrl, '_blank');
      
      // Show success message
      setSubmitted(true);

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);

      // Also try to send via backend API in background (without blocking user)
      try {
        const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
        await fetch(`${apiBaseUrl}/v1/public/contact/send-email/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            subject: `KMS - ${formData.subject}`,
            message: formData.message,
            recipientEmail: 'sdm@dpd.go.id'
          })
        });
      } catch (apiError) {
        // Silently fail - user already has email client open
      }
    } catch (error) {
      setSubmitError(t('contact.error_submit', 'An error occurred. Please try again later.'));
    }
  };

  return (
    <div className={`contact-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Header Section */}
      <section className="contact-header py-5">
        <Container>
          <Row>
            <Col lg={8} className="mx-auto text-center">
              <h1 className="display-4 mb-3">{t('contact.title', 'Contact Us')}</h1>
              <p className="lead">
                {t('contact.subtitle', 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.')}
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Contact Content */}
      <section className="contact-content py-5">
        <Container>
          <Row>
            {/* Contact Information */}
            <Col lg={4} className="mb-5 mb-lg-0">
              <h2 className="mb-4">{t('contact.info_title', 'Contact Information')}</h2>

              <div className="contact-info-item mb-4">
                <h5 className="mb-2">
                  📧 {t('contact.email_label', 'Email')}
                </h5>
                <p>
                  <a href="mailto:sdm@dpd.go.id">sdm@dpd.go.id</a>
                </p>
                <p className="text-muted small">
                  {t('contact.email_desc', 'We typically respond within 24 business hours')}
                </p>
              </div>

              <div className="contact-info-item mb-4">
                <h5 className="mb-2">
                  📱 {t('contact.phone_label', 'Phone')}
                </h5>
                <p>
                  <a href="tel:+62-81-3948-4805">+62-81-3948-4805</a>
                </p>
                <p className="text-muted small">
                  {t('contact.phone_hours', 'Monday - Friday, 8:00 AM - 5:00 PM WIB')}
                </p>
              </div>

              <div className="contact-info-item mb-4">
                <h5 className="mb-2">
                  🌐 {t('contact.website_label', 'Website')}
                </h5>
                <p>
                  <a href="https://www.dpd.go.id/" target="_blank" rel="noopener noreferrer">
                    https://www.dpd.go.id/
                  </a>
                </p>
              </div>

              {/* Social Media */}
              <div className="contact-info-item">
                <h5 className="mb-3">{t('contact.follow_us', 'Follow Us')}</h5>
                <div className="social-links">
                  <a href="https://twitter.com/dpdri" target="_blank" rel="noopener noreferrer" className="social-link">
                    𝕏
                  </a>
                  <a href="https://facebook.com/dpdri" target="_blank" rel="noopener noreferrer" className="social-link">
                    f
                  </a>
                  <a href="https://instagram.com/dpdri.official" target="_blank" rel="noopener noreferrer" className="social-link">
                    📷
                  </a>
                  <a href="https://youtube.com/dpdri" target="_blank" rel="noopener noreferrer" className="social-link">
                    ▶
                  </a>
                </div>
              </div>
            </Col>

            {/* Contact Form */}
            <Col lg={8}>
              <h2 className="mb-4">{t('contact.form_title', 'Send us a Message')}</h2>

              {submitted && (
                <Alert variant="success" dismissible onClose={() => setSubmitted(false)}>
                  {t('contact.success_message', 'Thank you! Your message has been sent successfully. We\'ll get back to you soon.')}
                </Alert>
              )}

              {submitError && (
                <Alert variant="danger" dismissible onClose={() => setSubmitError('')}>
                  {submitError}
                </Alert>
              )}

              <Form onSubmit={handleSubmit} className="contact-form">
                <Form.Group className="mb-3">
                  <Form.Label>{t('contact.form_name', 'Your Name')} *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    placeholder={t('contact.form_name_placeholder', 'Enter your full name')}
                    value={formData.name}
                    onChange={handleInputChange}
                    className={isDarkMode ? 'form-control-dark' : ''}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('contact.form_email', 'Email Address')} *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder={t('contact.form_email_placeholder', 'your.email@example.com')}
                    value={formData.email}
                    onChange={handleInputChange}
                    className={isDarkMode ? 'form-control-dark' : ''}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('contact.form_subject', 'Subject')} *</Form.Label>
                  <Form.Control
                    type="text"
                    name="subject"
                    placeholder={t('contact.form_subject_placeholder', 'What is this about?')}
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={isDarkMode ? 'form-control-dark' : ''}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('contact.form_message', 'Message')} *</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="message"
                    rows={6}
                    placeholder={t('contact.form_message_placeholder', 'Please share your message, feedback, or inquiry...')}
                    value={formData.message}
                    onChange={handleInputChange}
                    className={isDarkMode ? 'form-control-dark' : ''}
                  />
                </Form.Group>

                <p className="text-muted small mb-3">
                  {t('contact.form_note', '* All fields are required')}
                </p>

                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  className="w-100 contact-submit-btn"
                >
                  {t('contact.send_button', 'Send Message')}
                </Button>
              </Form>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Office Hours & Address Section */}
      <section className="office-hours-section py-5">
        <Container>
          <Row>
            <Col lg={3} className="mb-4 mb-lg-0">
              <div className="office-hours-card p-4 rounded">
                <h3 className="mb-3">{t('contact.office_hours', 'Office Hours')}</h3>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <strong>{t('contact.monday_friday', 'Monday - Friday')}:</strong> 8:00 AM - 5:00 PM WIB
                  </li>
                  <li className="mb-2">
                    <strong>{t('contact.saturday_sunday', 'Saturday - Sunday')}:</strong> {t('contact.closed', 'Closed')}
                  </li>
                  <li>
                    <strong>{t('contact.public_holidays', 'Public Holidays')}:</strong> {t('contact.closed', 'Closed')}
                  </li>
                </ul>
              </div>
            </Col>

            <Col lg={9}>
              <div className="contact-info-item mb-4">
                <h5 className="mb-2">
                  📍 {t('contact.address_label', 'Address')}
                </h5>
                <p>
                  {t('contact.address', 'Sekretariat Jenderal (Setjen) DPD RI\nGedung DPR/MPR RI, Kompleks Parlemen, Senayan, Jakarta, Jalan Jenderal Gatot Subroto, Jakarta Selatan, 12570.')}
                </p>
                <a 
                  href="https://maps.google.com/?q=Gedung+DPR+MPR+RI+Jakarta" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 d-inline-block text-decoration-none"
                  style={{ color: 'inherit' }}
                >
                  <small>🗺️ {t('contact.view_map', 'View on Google Maps')}</small>
                </a>
                
                {/* Embedded Map */}
                <div className="map-container mt-4">
                  <iframe
                    title="Setjen DPD RI Location"
                    width="100%"
                    height="300"
                    style={{ border: 0, borderRadius: '0.5rem' }}
                    loading="lazy"
                    allowFullScreen=""
                    referrerPolicy="no-referrer-when-downgrade"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.451!2d106.7998183!3d-6.2089515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f153a35426ef:0xf69c935a828d0d3d!2sGedung%20DPR%2FMPR%20RI!5e0!3m2!1sid!2sid!4v1673000000"
                  ></iframe>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default ContactPage;

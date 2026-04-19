import React, { useState } from 'react';
import { Container, Row, Col, Accordion, Card, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import {
  FiBook, FiSearch, FiArrowRight, FiEdit3, FiUserCheck,
  FiLock, FiLogIn, FiBell, FiStar, FiDownload, FiShare2,
  FiEye, FiHeart, FiMessageSquare, FiThumbsUp, FiMenu
} from 'react-icons/fi';
import './UserGuidePage.css';

/**
 * User Guide Page Component
 * Comprehensive guide for users to understand and use the KMSetjen DPD RI system
 */
const UserGuidePage = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const [expandedFaq, setExpandedFaq] = useState(0);

  const guideSteps = [
    {
      icon: FiLogIn,
      title: t('userguide.step1_title', 'Step 1: Login to Your Account'),
      description: t('userguide.step1_desc', 'Access the system using your credentials. If you don\'t have an account, contact your administrator.')
    },
    {
      icon: FiSearch,
      title: t('userguide.step2_title', 'Step 2: Search for Knowledge'),
      description: t('userguide.step2_desc', 'Use the search bar on the homepage to find articles by keyword, or browse by categories.')
    },
    {
      icon: FiBook,
      title: t('userguide.step3_title', 'Step 3: Read Articles'),
      description: t('userguide.step3_desc', 'Click on any article to view its full content, including images, attachments, and videos.')
    },
    {
      icon: FiThumbsUp,
      title: t('userguide.step4_title', 'Step 4: Engage with Content'),
      description: t('userguide.step4_desc', 'Like articles, leave comments, and rate the helpfulness of content to help improve the system.')
    }
  ];

  const features = [
    {
      icon: FiSearch,
      title: t('userguide.feature_search_title', 'Powerful Search'),
      description: t('userguide.feature_search_desc', 'Find relevant knowledge quickly with our advanced search functionality that supports multiple languages.')
    },
    {
      icon: FiMenu,
      title: t('userguide.feature_browse_title', 'Browse by Categories'),
      description: t('userguide.feature_browse_desc', 'Explore knowledge organized in well-structured categories for easy navigation.')
    },
    {
      icon: FiBell,
      title: t('userguide.feature_notifications_title', 'Smart Notifications'),
      description: t('userguide.feature_notifications_desc', 'Stay informed with notifications about new articles and updates in your areas of interest.')
    },
    {
      icon: FiEdit3,
      title: t('userguide.feature_contribute_title', 'Contribute Knowledge'),
      description: t('userguide.feature_contribute_desc', 'With editor or admin rights, you can create and share valuable knowledge with the organization.')
    },
    {
      icon: FiDownload,
      title: t('userguide.feature_download_title', 'Download & Export'),
      description: t('userguide.feature_download_desc', 'Save articles and attachments for offline access or share with your team.')
    },
    {
      icon: FiUserCheck,
      title: t('userguide.feature_profiles_title', 'User Profiles'),
      description: t('userguide.feature_profiles_desc', 'View contributor information and track article statistics and engagement metrics.')
    }
  ];

  const faqItems = [
    {
      question: t('userguide.faq1_question', 'How do I search for specific knowledge?'),
      answer: t('userguide.faq1_answer', 'You can search using the search bar on the homepage or in the Knowledge section. Type keywords relevant to what you\'re looking for. You can also use filters like date, category, and author to narrow down results.')
    },
    {
      question: t('userguide.faq2_question', 'Can I download articles?'),
      answer: t('userguide.faq2_answer', 'Yes! Most articles have a download button that allows you to save them in PDF format. Some articles may also have attachments you can download.')
    },
    {
      question: t('userguide.faq3_question', 'How can I contribute my own knowledge?'),
      answer: t('userguide.faq3_answer', 'If you have Editor or Admin privileges, navigate to your Dashboard and click "Create New Article". Fill in the form with your knowledge content, add images and attachments if needed, and submit for review.')
    },
    {
      question: t('userguide.faq4_question', 'What is the moderation process?'),
      answer: t('userguide.faq4_answer', 'All new articles go through a moderation process. Admins review submitted articles to ensure quality and accuracy before they\'re published. You\'ll be notified of the review status.')
    },
    {
      question: t('userguide.faq5_question', 'How do I change my profile information?'),
      answer: t('userguide.faq5_answer', 'Go to your Profile page from the dropdown menu. You can update your personal information, profile picture, and other settings. Click Save to update your changes.')
    },
    {
      question: t('userguide.faq6_question', 'Can I access the system on mobile devices?'),
      answer: t('userguide.faq6_answer', 'Yes, the system is fully responsive and works on tablets and smartphones. Simply access it through your mobile browser.')
    },
    {
      question: t('userguide.faq7_question', 'Is there a dark mode?'),
      answer: t('userguide.faq7_answer', 'Yes! Click the theme toggle button (usually in the top navigation) to switch between light and dark modes. Your preference is automatically saved.')
    },
    {
      question: t('userguide.faq8_question', 'What does it mean to "like" an article?'),
      answer: t('userguide.faq8_answer', 'Liking an article helps other users understand which content is most valuable. It also helps the system recommend articles based on popular content.')
    }
  ];

  const bestPractices = [
    {
      title: t('userguide.practice1_title', 'Use Specific Keywords'),
      description: t('userguide.practice1_desc', 'When searching, use specific keywords rather than broad terms. For example, search for "Q3 financial report" instead of just "report".')
    },
    {
      title: t('userguide.practice2_title', 'Check Publication Date'),
      description: t('userguide.practice2_desc', 'Always check the publication date of articles to ensure you\'re using current information. Older articles may contain outdated data.')
    },
    {
      title: t('userguide.practice3_title', 'Use Relevant Categories'),
      description: t('userguide.practice3_desc', 'When creating articles, select the most appropriate category to help others find your content easily.')
    },
    {
      title: t('userguide.practice4_title', 'Add Clear Descriptions'),
      description: t('userguide.practice4_desc', 'Write clear and concise article titles and summaries. This helps both search engines and human readers quickly understand the content.')
    },
    {
      title: t('userguide.practice5_title', 'Include Attachments'),
      description: t('userguide.practice5_desc', 'When relevant, attach supporting files such as spreadsheets, presentations, or PDFs to make your knowledge more complete.')
    },
    {
      title: t('userguide.practice6_title', 'Provide Both Languages'),
      description: t('userguide.practice6_desc', 'When possible, provide content in both Indonesian and English to maximize accessibility for all users.')
    }
  ];

  return (
    <div className={`user-guide-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Header Section */}
      <section className="guide-header py-5">
        <Container>
          <Row>
            <Col lg={8} className="mx-auto text-center">
              <div className="header-icon mb-3">
                <FiBook size={48} />
              </div>
              <h1 className="display-4 mb-3 fw-bold">{t('userguide.title', 'User Guide')}</h1>
              <p className="lead">
                {t('userguide.subtitle', 'Everything you need to know to make the most of the KMSetjen DPD RI Knowledge Management System')}
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Quick Start Section */}
      <section className="guide-content py-5">
        <Container>
          {/* Getting Started */}
          <Row className="mb-5">
            <Col lg={10} className="mx-auto">
              <h2 className="mb-4">{t('userguide.quick_start', 'Quick Start Guide')}</h2>
              <div className="steps-container">
                {guideSteps.map((step, index) => {
                  const IconComponent = step.icon;
                  return (
                    <div key={index} className="step-card mb-4">
                      <div className="step-number">{index + 1}</div>
                      <div className="step-icon">
                        <IconComponent size={32} />
                      </div>
                      <div className="step-content">
                        <h5 className="step-title">{step.title}</h5>
                        <p className="step-description">{step.description}</p>
                      </div>
                      {index < guideSteps.length - 1 && <div className="step-arrow"><FiArrowRight /></div>}
                    </div>
                  );
                })}
              </div>
            </Col>
          </Row>

          {/* Features Section */}
          <Row className="mb-5">
            <Col lg={10} className="mx-auto">
              <h2 className="mb-4">{t('userguide.key_features', 'Key Features')}</h2>
              <Row>
                {features.map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <Col md={6} key={index} className="mb-4">
                      <Card className="feature-card h-100 shadow-sm">
                        <Card.Body>
                          <div className="feature-icon mb-3">
                            <IconComponent size={28} />
                          </div>
                          <h5 className="feature-title mb-2">{feature.title}</h5>
                          <p className="feature-description">{feature.description}</p>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Col>
          </Row>

          {/* Best Practices Section */}
          <Row className="mb-5">
            <Col lg={10} className="mx-auto">
              <h2 className="mb-4">{t('userguide.best_practices', 'Best Practices')}</h2>
              <div className="practices-grid">
                {bestPractices.map((practice, index) => (
                  <div key={index} className="practice-card mb-3">
                    <div className="practice-header">
                      <div className="practice-number">{index + 1}</div>
                      <h5 className="practice-title">{practice.title}</h5>
                    </div>
                    <p className="practice-description">{practice.description}</p>
                  </div>
                ))}
              </div>
            </Col>
          </Row>

          {/* FAQ Section */}
          <Row className="mb-5">
            <Col lg={10} className="mx-auto">
              <h2 className="mb-4">{t('userguide.faq_title', 'Frequently Asked Questions')}</h2>
              <Accordion
                activeKey={expandedFaq}
                onSelect={(key) => setExpandedFaq(key)}
                className="faq-accordion"
              >
                {faqItems.map((item, index) => (
                  <Accordion.Item key={index} eventKey={index} className="faq-item">
                    <Accordion.Header className="faq-question">
                      {item.question}
                    </Accordion.Header>
                    <Accordion.Body className="faq-answer">
                      {item.answer}
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Col>
          </Row>

          {/* Tips Section */}
          <Row className="mb-5">
            <Col lg={10} className="mx-auto">
              <div className="tips-box p-4">
                <h3 className="mb-3">💡 {t('userguide.pro_tips', 'Pro Tips')}</h3>
                <ul className="tips-list">
                  <li>{t('userguide.tip1', 'Use filters and sorting options to refine your search results')}</li>
                  <li>{t('userguide.tip2', 'Check article ratings and comments to gauge content quality')}</li>
                  <li>{t('userguide.tip3', 'Subscribe to categories of interest to stay updated')}</li>
                  <li>{t('userguide.tip4', 'Use the browser\'s Find function (Ctrl+F) to search within long articles')}</li>
                  <li>{t('userguide.tip5', 'Save important articles to your favorites for quick access')}</li>
                </ul>
              </div>
            </Col>
          </Row>

          {/* Support Section */}
          <Row className="mb-5">
            <Col lg={10} className="mx-auto">
              <div className="support-box p-4 text-center">
                <h3 className="mb-3">{t('userguide.need_help', 'Need Help?')}</h3>
                <p className="mb-4">
                  {t('userguide.support_text', 'If you can\'t find the answer to your question in this guide, please contact our support team.')}
                </p>
                <Button
                  href="/contact"
                  variant="primary"
                  size="lg"
                  className="me-3"
                >
                  {t('userguide.contact_us', 'Contact Us')}
                </Button>
                <Button
                  href="/about"
                  variant="outline-primary"
                  size="lg"
                >
                  {t('userguide.learn_more', 'Learn More')}
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default UserGuidePage;

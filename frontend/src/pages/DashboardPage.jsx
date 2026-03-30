import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { internalAPI, getArticleUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import ImageWithFallback from '../components/ImageWithFallback';
import './DashboardPage.css';
import { FiFileText, FiCheckCircle, FiAlertCircle, FiClock, FiX } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';

/**
 * Safe date format helper - handles null/invalid dates gracefully
 */
const formatSafeDate = (dateValue, isIndonesian) => {
  try {
    const dateObj = new Date(dateValue);
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
    return formatDistanceToNow(dateObj, {
      addSuffix: true,
      locale: isIndonesian ? idLocale : enUS
    });
  } catch (error) {
    return 'N/A';
  }
};

/**
 * DashboardPage Component
 * Contributor dashboard with article statistics and management
 */
const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isIndonesian } = useLanguage();
  const [dashboard, setDashboard] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchDashboard = async () => {
    try {
      const response = await internalAPI.getDashboard();
      setDashboard(response.data);
    } catch (err) {
      setError(t('errors.server_error'));
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchArticles = async () => {
    try {
      const response = await internalAPI.getMyArticles({ page_size: 5 });
      const articlesData = response.data.results || [];
      setArticles(articlesData);
    } catch (err) {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <LoadingSpinner message={t('messages.loading')} />;

  const getStatusBadge = (status) => {
    // Convert to lowercase for comparison since backend returns lowercase status values
    const statusLower = status?.toLowerCase();
    
    switch (statusLower) {
      case 'published':
        return <span className="badge bg-success">{t('dashboard.status_published')}</span>;
      case 'approved':
        return <span className="badge bg-info">{t('dashboard.status_approved')}</span>;
      case 'review':
        return <span className="badge bg-warning">{t('dashboard.status_review')}</span>;
      case 'draft':
        return <span className="badge bg-secondary">{t('dashboard.status_draft')}</span>;
      case 'rejected':
        return <span className="badge bg-danger">{t('dashboard.status_rejected')}</span>;
      case 'scheduled':
        return <span className="badge bg-info">{t('dashboard.status_scheduled')}</span>;
      case 'archived':
        return <span className="badge bg-dark">{t('dashboard.status_archived')}</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const getFileTypeBadge = (mimeType) => {
    if (!mimeType) return null;
    
    const typeMap = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'text/plain': 'txt',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'audio/mpeg': 'mp3',
      'application/zip': 'zip',
      'application/x-rar-compressed': 'rar',
      'application/x-7z-compressed': '7z',
    };

    const fileTypeKey = typeMap[mimeType] || 'file';
    return t(`editor.file_types.${fileTypeKey}`);
  };

  return (
    <div className="dashboard-page">
      <Container className="py-5">
        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

        <div className="dashboard-header">
          <div className="header-content">
            <h1>{t('dashboard.welcome', { name: user?.first_name || 'User' })}</h1>
            <p className="text-muted">{t('dashboard.my_articles')}</p>
          </div>
          {dashboard && (
            <div className="header-stats">
              <Card className="stat-card stat-card-small">
                <Card.Body className="text-center">
                  <FiFileText className="stat-icon" />
                  <div className="stat-value">{dashboard.total_articles}</div>
                  <div className="stat-label">{t('admin.total_articles')}</div>
                </Card.Body>
              </Card>
              <Card className="stat-card stat-card-small">
                <Card.Body className="text-center">
                  <FiCheckCircle className="stat-icon text-success" />
                  <div className="stat-value">{dashboard.published_articles}</div>
                  <div className="stat-label">{t('dashboard.status_published')}</div>
                </Card.Body>
              </Card>
            </div>
          )}
        </div>

        {dashboard && (
          <Row className="mb-4 stats-row">
            <Col md={3} className="mb-3">
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <FiAlertCircle className="stat-icon text-warning" />
                  <div className="stat-value">{dashboard.draft_articles}</div>
                  <div className="stat-label">{t('dashboard.status_draft')}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <FiClock className="stat-icon text-info" />
                  <div className="stat-value">{dashboard.review_articles}</div>
                  <div className="stat-label">{t('dashboard.status_review')}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <FiX className="stat-icon text-danger" />
                  <div className="stat-value">{dashboard.rejected_articles || 0}</div>
                  <div className="stat-label">{t('dashboard.rejected')}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="stat-card">
                <Card.Body className="text-center">
                  <FiCheckCircle className="stat-icon text-info" />
                  <div className="stat-value">{dashboard.approved_articles || 0}</div>
                  <div className="stat-label">{t('dashboard.status_approved')}</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        <Row>
          <Col>
            <Card className="dashboard-card">
              <Card.Header className="card-header-custom">
                <h5>{t('dashboard.my_articles')}</h5>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/editor')}
                >
                  {t('buttons.create')}
                </Button>
              </Card.Header>
              <Card.Body>
                {articles.length === 0 ? (
                  <p className="text-muted">{t('dashboard.no_data')}</p>
                ) : (
                  <div className="articles-list">
                    {articles.map((article) => (
                      <div key={article.id} className="article-item">
                        <div className="dashboard-image-container">
                          <ImageWithFallback
                            src={article.image || article.image_url}
                            alt={isIndonesian ? article.title_id : article.title_en}
                            className="dashboard-image"
                            type="article"
                          />
                        </div>
                        <div className="article-badge">
                          {getStatusBadge(article.status)}
                          {article.files && article.files.length > 0 && (
                            <span className="badge bg-secondary">
                              📎 {getFileTypeBadge(article.files[0].mime_type)}
                            </span>
                          )}
                        </div>
                        <div className="article-bottom-section">
                          <div className="article-content">
                            <div className="dashboard-article-info">
                              <h6 className="article-title">
                                {isIndonesian 
                                  ? (article.title_id || article.title_en) 
                                  : (article.title_en || article.title_id)}
                              </h6>
                              <div className="article-tags-section">
                                {article.category && (
                                  <div className="category-badge-wrapper">
                                    <span className="dashboard-category-badge">
                                      {isIndonesian 
                                        ? (article.category.name_id || article.category.name_en)
                                        : (article.category.name_en || article.category.name_id)}
                                    </span>
                                  </div>
                                )}
                                {article.tags && article.tags.length > 0 && (
                                  <div className="tags-badges-wrapper">
                                    {article.tags.slice(0, 3).map((tag) => (
                                      <span key={tag.id} className="tag-badge">
                                        {isIndonesian ? (tag.name_id || tag.name_en) : (tag.name_en || tag.name_id)}
                                      </span>
                                    ))}
                                    {article.tags.length > 3 && (
                                      <span className="tag-badge tag-more">+{article.tags.length - 3}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="article-meta">
                                <span className="date">
                                  {formatDistanceToNow(new Date(article.created_at), {
                                    addSuffix: true,
                                    locale: isIndonesian ? idLocale : enUS
                                  })}
                                </span>
                                <span className="separator">•</span>
                                <span className="views">
                                  {article.view_count} {t('articles.views')}
                                </span>
                                <span className="separator">•</span>
                                <span className="likes">
                                  {article.like_count} {t('articles.likes')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="article-actions">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => window.open(getArticleUrl(article), '_blank')}
                            >
                              {t('buttons.view')}
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => navigate(`/editor/${article.id}`)}
                            >
                              {t('buttons.edit')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default DashboardPage;


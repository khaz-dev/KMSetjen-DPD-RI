import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Modal, Form, InputGroup } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { internalAPI, publicAPI, getArticleUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import ImageWithFallback from '../components/ImageWithFallback';
import ArticleMetaLine from '../components/ArticleMetaLine';
import './DashboardPage.css';
import { FiFileText, FiCheckCircle, FiAlertCircle, FiClock, FiX, FiEye, FiEdit2, FiTrash2, FiSearch, FiRotateCcw, FiBookOpen } from 'react-icons/fi';
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
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const { isIndonesian } = useLanguage();
  const [dashboard, setDashboard] = useState(null);
  const [articles, setArticles] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteArticleId, setDeleteArticleId] = useState(null);
  const [deleteArticleTitle, setDeleteArticleTitle] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('-created_at');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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
  const fetchCategories = async () => {
    try {
      const response = await publicAPI.getCategories({ page_size: 100 });
      const cats = response.data.results || response.data || [];
      setAllCategories(cats);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchArticles = async () => {
    try {
      setArticlesLoading(true);
      const params = {
        page: currentPage,
        page_size: pageSize,
        ordering: sortBy,
      };

      // Add search parameter
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add category filter
      if (selectedCategory) {
        params.category = selectedCategory;
      }

      // Add status filter
      if (selectedStatus) {
        params.status = selectedStatus;
      }

      const response = await internalAPI.getMyArticles(params);
      const articlesData = response.data.results || [];
      setArticles(articlesData);
      setTotalCount(response.data.count || 0);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setArticlesLoading(false);
      setLoading(false);
    }
  };

  const handleDeleteArticle = (article) => {
    setDeleteArticleId(article.id);
    setDeleteArticleTitle(isIndonesian ? (article.title_id || article.title_en) : (article.title_en || article.title_id));
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteArticleId(null);
    setDeleteArticleTitle(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteArticleId) return;

    setDeleting(true);
    try {
      await internalAPI.deleteArticle(deleteArticleId);
      // Remove article from list
      setArticles(prev => prev.filter(a => a.id !== deleteArticleId));
      setShowDeleteModal(false);
      setDeleteArticleId(null);
      setDeleteArticleTitle(null);
    } catch (err) {
      console.error('Delete article error:', err);
      setError(t('errors.delete_article_failed') || 'Failed to delete article');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    // Wait for auth context to finish loading before fetching data
    if (authLoading) {
      return;
    }

    fetchDashboard();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  // Re-fetch articles when filters/search/sort change
  useEffect(() => {
    if (!authLoading) {
      fetchArticles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, selectedStatus, sortBy, pageSize, currentPage, authLoading]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus, sortBy, pageSize]);

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
          <Row className="stats-row">
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
              <Card className={`stat-card ${dashboard.rejected_articles > 0 ? 'stat-card-highlight' : ''}`}>
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
              
              {/* Filter and Search Controls */}
              <div className="dashboard-filters">
                <Row className="g-3">
                  {/* Search Input */}
                  <Col md={4} sm={12}>
                    <InputGroup>
                      <InputGroup.Text className="search-icon">
                        <FiSearch />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder={t('search.placeholder') || 'Cari pengetahuan...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                      />
                    </InputGroup>
                  </Col>

                  {/* Category Filter */}
                  <Col md={3} sm={6}>
                    <Form.Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">{t('search.all_categories') || 'Semua Kategori'}</option>
                      {allCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {isIndonesian ? (cat.name_id || cat.name_en) : (cat.name_en || cat.name_id)}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>

                  {/* Status Filter */}
                  <Col md={3} sm={6}>
                    <Form.Select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">{t('search.all_status')}</option>
                      <option value="draft">{t('dashboard.status_draft')}</option>
                      <option value="review">{t('dashboard.status_review')}</option>
                      <option value="approved">{t('dashboard.status_approved')}</option>
                      <option value="published">{t('dashboard.status_published')}</option>
                      <option value="rejected">{t('dashboard.status_rejected')}</option>
                      <option value="scheduled">{t('dashboard.status_scheduled')}</option>
                      <option value="archived">{t('dashboard.status_archived')}</option>
                    </Form.Select>
                  </Col>

                  {/* Sort By */}
                  <Col md={2} sm={6}>
                    <Form.Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="filter-select"
                    >
                      <option value="-created_at">{t('search.newest')}</option>
                      <option value="created_at">{t('search.oldest')}</option>
                      <option value="title_id">{t('search.title')}</option>
                      <option value="-updated_at">{t('search.recently_updated')}</option>
                    </Form.Select>
                  </Col>

                  {/* Items Per Page Selector */}
                  <Col md={2} sm={6}>
                    <div>
                      <label className="form-label fw-bold mb-2">{t('common.items_per_page') || 'Items Per Page'}</label>
                      <Form.Select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="filter-select"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </Form.Select>
                    </div>
                  </Col>

                  {/* Results Counter */}
                  <Col md={2} sm={6}>
                    <div>
                      <label className="form-label fw-bold mb-2">{t('common.results') || 'Results'}</label>
                      <div className="form-control-plaintext pt-2">
                        <small className="text-muted">
                          {totalCount === 0 ? '0' : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)} {t('pagination.of') || 'of'} <strong>{totalCount}</strong>
                        </small>
                      </div>
                    </div>
                  </Col>

                  {/* Reset Filters Button */}
                  <Col xs={12} sm="auto" className="d-flex align-items-end">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('');
                        setSelectedStatus('');
                        setSortBy('-created_at');
                        setCurrentPage(1);
                        setPageSize(10);
                      }}
                      className="reset-filters-btn"
                    >
                      <FiRotateCcw size={16} className="me-1" />
                      {t('search.reset')}
                    </Button>
                  </Col>
                </Row>
              </div>

              <Card.Body>
                {articlesLoading ? (
                  <div className="text-center py-4">
                    <LoadingSpinner message={t('messages.loading')} />
                  </div>
                ) : articles.length === 0 ? (
                  <div className="empty-state">
                    <FiFileText size={48} className="empty-icon" />
                    <p className="empty-message">{t('dashboard.no_data') || 'Tidak ada pengetahuan'}</p>
                  </div>
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
                              {(() => {
                                const articleTitle = isIndonesian 
                                  ? (article.title_id || article.title_en) 
                                  : (article.title_en || article.title_id);
                                return (
                                  <h6 className="article-title" title={articleTitle}>
                                    {articleTitle}
                                  </h6>
                                );
                              })()}
                              <div className="article-tags-section">
                                {article.category && (
                                  <div className="category-badge-wrapper">
                                    {(() => {
                                      const catName = isIndonesian 
                                        ? (article.category.name_id || article.category.name_en)
                                        : (article.category.name_en || article.category.name_id);
                                      return (
                                        <span className="dashboard-category-badge" title={catName} style={{ cursor: 'help' }}>
                                          {catName}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                )}
                                {article.tags && article.tags.length > 0 && (
                                  <div className="tags-badges-wrapper">
                                    {article.tags.slice(0, 3).map((tag) => {
                                      const tagName = isIndonesian ? (tag.name_id || tag.name_en) : (tag.name_en || tag.name_id);
                                      return (
                                        <span key={tag.id} className="tag-badge" title={tagName} style={{ cursor: 'help' }}>
                                          {tagName}
                                        </span>
                                      );
                                    })}
                                    {article.tags.length > 3 && (
                                      <span 
                                        className="tag-badge tag-more"
                                        title={article.tags.slice(3).map(t => isIndonesian ? (t.name_id || t.name_en) : (t.name_en || t.name_id)).join(', ')}
                                        style={{ cursor: 'help' }}
                                      >
                                        +{article.tags.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="dashboard-creator-meta mb-2">
                                <ArticleMetaLine article={article} compact={true} showDate={false} />
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
                          <div className="dashboard-article-actions">
                            {/* Lihat Draft Button - Show draft version */}
                            <Button
                              variant="info"
                              size="sm"
                              onClick={() => window.open(`/knowledges/${article.slug || article.id}?version=draft`, '_blank')}
                              title={t('dashboard.view_draft')}
                              className="btn-view-draft d-flex align-items-center gap-1"
                            >
                              <FiFileText size={16} />
                              <span className="btn-draft-text">{t('dashboard.view_draft')}</span>
                            </Button>
                            
                            {/* Lihat Dipublikasikan Button - Show published version if it exists */}
                            {article.published_version_id && (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => window.open(`/knowledges/${article.slug || article.id}`, '_blank')}
                                title={t('dashboard.view_published')}
                                className="btn-view-published d-flex align-items-center gap-1"
                              >
                                <FiCheckCircle size={16} />
                                <span className="btn-published-text">{t('dashboard.view_published')}</span>
                              </Button>
                            )}
                            
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => navigate(`/editor/${article.id}`)}
                              title={t('buttons.edit')}
                            >
                              <FiEdit2 />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteArticle(article)}
                              title={t('buttons.delete')}
                            >
                              <FiTrash2 />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>

              {/* Pagination Controls */}
              {totalCount > 0 && (
                <div className="pagination-container">
                  <div className="pagination-controls-wrapper">
                    {/* Page Info */}
                    <div className="pagination-info-text">
                      <span className="pagination-label">
                        {t('pagination.page', { current: currentPage, total: Math.ceil(totalCount / pageSize) })}
                      </span>
                    </div>
                  </div>

                  {/* Page Navigation Buttons */}
                  <div className="pagination-buttons-wrapper">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="pagination-btn pagination-first"
                      title={t('pagination.first')}
                    >
                      ⏮
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="pagination-btn pagination-prev"
                      title={t('pagination.previous')}
                    >
                      ◄
                    </Button>

                    {/* Page Number Buttons */}
                    <div className="pagination-numbers">
                      {Array.from(
                        { length: Math.ceil(totalCount / pageSize) },
                        (_, i) => i + 1
                      )
                        .filter((page) => {
                          // Show first 2, current ±1, last 2
                          if (page <= 2 || page >= Math.ceil(totalCount / pageSize) - 1) return true;
                          if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                          return false;
                        })
                        .map((page, idx, arr) => (
                          <React.Fragment key={page}>
                            {idx > 0 && arr[idx - 1] !== page - 1 && (
                              <span className="pagination-ellipsis">...</span>
                            )}
                            <Button
                              variant={page === currentPage ? 'primary' : 'outline-secondary'}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="pagination-btn pagination-number"
                            >
                              {page}
                            </Button>
                          </React.Fragment>
                        ))}
                    </div>

                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === Math.ceil(totalCount / pageSize)}
                      className="pagination-btn pagination-next"
                      title={t('pagination.next')}
                    >
                      ►
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setCurrentPage(Math.ceil(totalCount / pageSize))}
                      disabled={currentPage === Math.ceil(totalCount / pageSize)}
                      className="pagination-btn pagination-last"
                      title={t('pagination.last')}
                    >
                      ⏭
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Delete Article Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleCancelDelete} size="sm" centered backdrop="static">
        <Modal.Header closeButton={!deleting}>
          <Modal.Title>
            <span style={{ color: '#ef4444' }}>⚠️ {t('dashboard.delete_confirmation')}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '1rem', fontSize: '1.05rem', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
              {t('dashboard.delete_article_confirm')}
            </p>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '1rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              border: '2px solid #ef4444',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              wordBreak: 'break-word'
            }}>
              <p style={{ 
                margin: 0, 
                fontWeight: 'bold', 
                fontSize: '1.1rem', 
                color: '#ef4444',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                wordBreak: 'break-word'
              }}>
                {deleteArticleTitle}
              </p>
            </div>
            <p style={{ fontSize: '0.95rem', color: '#7f8c8d', marginBottom: 0, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
              {t('dashboard.delete_warning')}
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCancelDelete}
            disabled={deleting}
          >
            {t('buttons.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={deleting}
            style={{ backgroundColor: '#ef4444', borderColor: '#dc2626' }}
          >
            {deleting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {t('common.deleting') || 'Deleting...'}
              </>
            ) : (
              t('buttons.delete') || 'Delete'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DashboardPage;


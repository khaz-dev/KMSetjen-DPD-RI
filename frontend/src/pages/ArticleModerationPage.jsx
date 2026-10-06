import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../hooks/useLanguage';
import { Container, Table, Button, Modal, Form, Spinner, Alert, Card, Badge, Pagination, Tabs, Tab } from 'react-bootstrap';
import { FiEye, FiCheck, FiX } from 'react-icons/fi';
import AdminSidebar from '../components/AdminSidebar';
import { getArticleUrl } from '../services/api';
import axios from 'axios';
import './ManagementPage.css';

function ArticleModerationPage({ onLogout }) {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const { isIndonesian } = useLanguage();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState('approve'); // 'approve' or 'reject'
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Status counts state
  const [statusCounts, setStatusCounts] = useState({
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    PUBLISHED: 0
  });

  // Fetch counts for all statuses
  const loadStatusCounts = useCallback(async () => {
    try {
      const statusMap = {
        'PENDING': 'review',
        'APPROVED': 'approved',
        'REJECTED': 'rejected',
        'PUBLISHED': 'published'
      };
      
      const counts = {};
      for (const [key, backendStatus] of Object.entries(statusMap)) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/v1/internal/articles/?status=${backendStatus}&page=1&page_size=1`,
            { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
          );
          counts[key] = response.data.count || 0;
        } catch (err) {
          counts[key] = 0;
        }
      }
      setStatusCounts(counts);
    } catch (err) {
      console.error('Failed to load status counts:', err);
    }
  }, []);

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Map frontend status values to backend values
      const statusMap = {
        'PENDING': 'review',
        'APPROVED': 'approved',
        'REJECTED': 'rejected',
        'PUBLISHED': 'published'
      };
      const backendStatus = statusMap[filterStatus] || filterStatus;
      
      let url = `${import.meta.env.VITE_API_URL}/api/v1/internal/articles/?status=${backendStatus}&page=${currentPage}`;
      if (sortBy) {
        const orderingValue = sortOrder === 'desc' ? `-${sortBy}` : sortBy;
        url += `&ordering=${orderingValue}`;
      }
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });
      setArticles(response.data.results || []);
      setTotalPages(Math.ceil((response.data.count || 0) / 20));
    } catch (err) {
      setError(err.response?.data?.detail || t('errors.failed_load_articles'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterStatus, t, sortBy, sortOrder]);

  // Load status counts on mount
  useEffect(() => {
    loadStatusCounts();
  }, [loadStatusCounts]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleOpenModal = (article, act) => {
    setSelectedArticle(article);
    setAction(act);
    setComment('');
    setShowModal(true);
  };

  const handleViewArticle = (article) => {
    // Open the article detail page in a new tab
    window.open(getArticleUrl(article), '_blank');
  };

  const handlePublish = async (article) => {
    try {
      setSubmitting(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/internal/articles/${article.id}/publish/`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
      );
      loadArticles();
      loadStatusCounts();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to publish article');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (action === 'reject' && !comment) {
      setError(t('moderation.rejection_reason'));
      return;
    }
    try {
      setSubmitting(true);
      
      // Determine endpoint based on action
      const endpoint = action === 'approve' ? 'approve' : 'reject';
      const payload = action === 'reject' ? { reason: comment } : { comment };
      
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/internal/articles/${selectedArticle.id}/${endpoint}/`,
        payload,
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
      );
      loadArticles();
      loadStatusCounts();
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger', PUBLISHED: 'primary' };
    return variants[status] || 'secondary';
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'draft': t('moderation.status_draft'),
      'review': t('moderation.status_review'),
      'rejected': t('moderation.status_rejected'),
      'approved': t('moderation.status_approved'),
      'published': t('moderation.status_published'),
      'scheduled': t('moderation.status_scheduled'),
      'archived': t('moderation.status_archived')
    };
    return statusMap[status] || status;
  };

  const renderArticleTitle = (article) => {
    const fullTitle = (isIndonesian ? article.title_id : article.title_en) || article.title_id || article.title_en || '-';
    const isTruncated = fullTitle.length > 40;
    return (
      <td title={fullTitle} style={{ cursor: isTruncated ? 'help' : 'default' }}>
        <strong>{isTruncated ? `${fullTitle.substring(0, 40)}...` : fullTitle}</strong>
      </td>
    );
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return ' ↕';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className={`admin-wrapper ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <AdminSidebar onLogout={onLogout} pendingReviewCount={statusCounts.PENDING} />
      <div className="admin-content">
        <Container>
          <div className="admin-header">
            <div>
              <h1>{t('moderation.title')}</h1>
              <p className="text-muted">{t('moderation.subtitle')}</p>
            </div>
          </div>

          {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

          <Tabs 
            id="moderation-tabs"
            activeKey={filterStatus} 
            onSelect={(k) => { setFilterStatus(k); setCurrentPage(1); }} 
            className="mb-4"
          >
            <Tab eventKey="PENDING" title={<span>{t('moderation.pending_review')} <Badge bg="warning">{statusCounts.PENDING}</Badge></span>}>
              {loading ? (
                <div className="loading-container">
                  <Spinner animation="border" role="status" />
                  <p>{t('moderation.loading_articles')}</p>
                </div>
              ) : articles.length > 0 ? (
                <>
                  <Card className="table-card">
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead className="table-header">
                          <tr>
                            <th style={{ width: '50px', textAlign: 'center', fontWeight: '600' }}>No.</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('title_id')} title="Click to sort">{t('moderation.table_title')}{getSortIcon('title_id')}</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('author__username')} title="Click to sort">{t('moderation.table_author')}{getSortIcon('author__username')}</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('category__name_id')} title="Click to sort">{t('moderation.table_category')}{getSortIcon('category__name_id')}</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('status')} title="Click to sort">{t('moderation.table_status')}{getSortIcon('status')}</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('created_at')} title="Click to sort">{t('moderation.table_date')}{getSortIcon('created_at')}</th>
                            <th>{t('moderation.table_actions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {articles.map((article, index) => (
                            <tr key={article.id}>
                              <td style={{ textAlign: 'center', fontWeight: '600', color: '#999', width: '50px' }}>{(currentPage - 1) * 20 + index + 1}</td>
                              {renderArticleTitle(article)}
                              <td>
                                <div className="d-flex flex-column gap-1">
                                  <span title="Penyusun / Penulis Asli" style={{ fontSize: '0.85rem' }}>
                                    ✍️ <strong>{article.creator_name || article.author?.username || t('moderation.empty_value')}</strong>
                                  </span>
                                  <span title="Dipublikasikan / Diunggah Oleh" className="text-muted" style={{ fontSize: '0.78rem' }}>
                                    🌐 {article.uploader_name || article.author?.username || '-'}
                                  </span>
                                </div>
                              </td>
                              <td>{(isIndonesian ? article.category?.name_id : article.category?.name_en) || t('moderation.empty_value')}</td>
                              <td><Badge bg={getStatusBadge(article.status)}>{getStatusLabel(article.status)}</Badge></td>
                              <td>{new Date(article.created_at).toLocaleDateString()}</td>
                              <td>
                                <div className="action-buttons">
                                  <Button variant="outline-info" size="sm" title={t('buttons.view')} onClick={() => handleViewArticle(article)}><FiEye /></Button>
                                  {filterStatus === 'PENDING' && (
                                    <>
                                      <Button variant="outline-success" size="sm" title={t('buttons.approve')} onClick={() => handleOpenModal(article, 'approve')}><FiCheck /></Button>
                                      <Button variant="outline-danger" size="sm" title={t('buttons.reject')} onClick={() => handleOpenModal(article, 'reject')}><FiX /></Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card>

                  {totalPages > 1 && (
                    <div className="pagination-container">
                      <Pagination>
                        <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                          <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>{i + 1}</Pagination.Item>
                        ))}
                        <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} />
                        <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <Card className="empty-state">
                  <Card.Body>
                    <h5>{t('moderation.no_articles')}</h5>
                    <p className="text-muted">{t('moderation.no_articles_status')}</p>
                  </Card.Body>
                </Card>
              )}
            </Tab>
            <Tab eventKey="APPROVED" title={<span>{t('moderation.approved')} <Badge bg="success">{statusCounts.APPROVED}</Badge></span>}>
              {loading ? (
                <div className="loading-container">
                  <Spinner animation="border" role="status" />
                  <p>{t('moderation.loading_articles')}</p>
                </div>
              ) : articles.length > 0 ? (
                <>
                  <Card className="table-card">
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead className="table-header">
                          <tr>
                            <th style={{ width: '50px', textAlign: 'center', fontWeight: '600' }}>No.</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('title_id')} title="Click to sort">{t('moderation.table_title')}{getSortIcon('title_id')}</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('author__username')} title="Click to sort">{t('moderation.table_author')}{getSortIcon('author__username')}</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('category__name_id')} title="Click to sort">{t('moderation.table_category')}{getSortIcon('category__name_id')}</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('status')} title="Click to sort">{t('moderation.table_status')}{getSortIcon('status')}</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('created_at')} title="Click to sort">{t('moderation.table_date')}{getSortIcon('created_at')}</th>
                            <th>{t('moderation.table_actions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {articles.map((article, index) => (
                            <tr key={article.id}>
                              <td style={{ textAlign: 'center', fontWeight: '600', color: '#999', width: '50px' }}>{(currentPage - 1) * 20 + index + 1}</td>
                              {renderArticleTitle(article)}
                              <td>{article.author?.username || t('moderation.empty_value')}</td>
                              <td>{(isIndonesian ? article.category?.name_id : article.category?.name_en) || t('moderation.empty_value')}</td>
                              <td><Badge bg={getStatusBadge(article.status)}>{getStatusLabel(article.status)}</Badge></td>
                              <td>{new Date(article.created_at).toLocaleDateString()}</td>
                              <td>
                                <div className="action-buttons">
                                  <Button variant="outline-info" size="sm" title={t('buttons.view')} onClick={() => handleViewArticle(article)}><FiEye /></Button>
                                  <Button variant="outline-success" size="sm" title={t('buttons.publish')} onClick={() => handlePublish(article)} disabled={submitting}><FiCheck /></Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card>

                  {totalPages > 1 && (
                    <div className="pagination-container">
                      <Pagination>
                        <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                          <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>{i + 1}</Pagination.Item>
                        ))}
                        <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} />
                        <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <Card className="empty-state">
                  <Card.Body>
                    <h5>{t('moderation.no_articles')}</h5>
                    <p className="text-muted">{t('moderation.no_articles_status')}</p>
                  </Card.Body>
                </Card>
              )}
            </Tab>
            <Tab eventKey="REJECTED" title={<span>{t('moderation.rejected')} <Badge bg="danger">{statusCounts.REJECTED}</Badge></span>}>
              {loading ? (
                <div className="loading-container">
                  <Spinner animation="border" role="status" />
                  <p>{t('moderation.loading_articles')}</p>
                </div>
              ) : articles.length > 0 ? (
                <>
                  <Card className="table-card">
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead className="table-header">
                          <tr>
                            <th style={{ width: '50px', textAlign: 'center', fontWeight: '600' }}>No.</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('title_id')} title="Click to sort">{t('moderation.table_title')}{getSortIcon('title_id')}</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('author__username')} title="Click to sort">{t('moderation.table_author')}{getSortIcon('author__username')}</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('category__name_id')} title="Click to sort">{t('moderation.table_category')}{getSortIcon('category__name_id')}</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('status')} title="Click to sort">{t('moderation.table_status')}{getSortIcon('status')}</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('created_at')} title="Click to sort">{t('moderation.table_date')}{getSortIcon('created_at')}</th>
                            <th>{t('moderation.table_actions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {articles.map((article, index) => (
                            <tr key={article.id}>
                              <td style={{ textAlign: 'center', fontWeight: '600', color: '#999', width: '50px' }}>{(currentPage - 1) * 20 + index + 1}</td>
                              {renderArticleTitle(article)}
                              <td>{article.author?.username || t('moderation.empty_value')}</td>
                              <td>{(isIndonesian ? article.category?.name_id : article.category?.name_en) || t('moderation.empty_value')}</td>
                              <td><Badge bg={getStatusBadge(article.status)}>{getStatusLabel(article.status)}</Badge></td>
                              <td>{new Date(article.created_at).toLocaleDateString()}</td>
                              <td>
                                <div className="action-buttons">
                                  <Button variant="outline-info" size="sm" title={t('buttons.view')} onClick={() => handleViewArticle(article)}><FiEye /></Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card>

                  {totalPages > 1 && (
                    <div className="pagination-container">
                      <Pagination>
                        <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                          <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>{i + 1}</Pagination.Item>
                        ))}
                        <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} />
                        <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <Card className="empty-state">
                  <Card.Body>
                    <h5>{t('moderation.no_articles')}</h5>
                    <p className="text-muted">{t('moderation.no_articles_status')}</p>
                  </Card.Body>
                </Card>
              )}
            </Tab>
            <Tab eventKey="PUBLISHED" title={<span>{t('moderation.published')} <Badge bg="primary">{statusCounts.PUBLISHED}</Badge></span>}>
              {loading ? (
                <div className="loading-container">
                  <Spinner animation="border" role="status" />
                  <p>{t('moderation.loading_articles')}</p>
                </div>
              ) : articles.length > 0 ? (
                <>
                  <Card className="table-card">
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead className="table-header">
                          <tr>
                            <th style={{ width: '50px', textAlign: 'center', fontWeight: '600' }}>No.</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('title_id')} title="Click to sort">{t('moderation.table_title')}{getSortIcon('title_id')}</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('author__username')} title="Click to sort">{t('moderation.table_author')}{getSortIcon('author__username')}</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('category__name_id')} title="Click to sort">{t('moderation.table_category')}{getSortIcon('category__name_id')}</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('status')} title="Click to sort">{t('moderation.table_status')}{getSortIcon('status')}</th>
                            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('created_at')} title="Click to sort">{t('moderation.table_date')}{getSortIcon('created_at')}</th>
                            <th>{t('moderation.table_actions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {articles.map((article, index) => (
                            <tr key={article.id}>
                              <td style={{ textAlign: 'center', fontWeight: '600', color: '#999', width: '50px' }}>{(currentPage - 1) * 20 + index + 1}</td>
                              {renderArticleTitle(article)}
                              <td>{article.author?.username || t('moderation.empty_value')}</td>
                              <td>{(isIndonesian ? article.category?.name_id : article.category?.name_en) || t('moderation.empty_value')}</td>
                              <td><Badge bg={getStatusBadge(article.status)}>{getStatusLabel(article.status)}</Badge></td>
                              <td>{new Date(article.created_at).toLocaleDateString()}</td>
                              <td>
                                <div className="action-buttons">
                                  <Button variant="outline-info" size="sm" title={t('buttons.view')} onClick={() => handleViewArticle(article)}><FiEye /></Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card>

                  {totalPages > 1 && (
                    <div className="pagination-container">
                      <Pagination>
                        <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                          <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>{i + 1}</Pagination.Item>
                        ))}
                        <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} />
                        <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <Card className="empty-state">
                  <Card.Body>
                    <h5>{t('moderation.no_articles')}</h5>
                    <p className="text-muted">{t('moderation.no_articles_status')}</p>
                  </Card.Body>
                </Card>
              )}
            </Tab>
          </Tabs>
        </Container>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{action === 'approve' ? t('moderation.modal_title_approve') : t('moderation.modal_title_reject')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>{action === 'approve' ? t('moderation.approval_comments') : t('moderation.rejection_reason_label') + ' *'}</Form.Label>
            <Form.Control as="textarea" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={action === 'approve' ? t('moderation.optional_notes') : t('moderation.required_rejection_reason')} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>{t('buttons.cancel')}</Button>
          <Button variant={action === 'approve' ? 'success' : 'danger'} onClick={handleSubmitReview} disabled={submitting}>{submitting ? t('moderation.modal_submitting') : action === 'approve' ? t('moderation.modal_button_approve') : t('moderation.modal_button_reject')}</Button>
        </Modal.Footer>
      </Modal>


    </div>
  );
}

export default ArticleModerationPage;


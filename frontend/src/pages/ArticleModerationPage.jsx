import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Table, Button, Modal, Form, Spinner, Alert, Card, Badge, Pagination, Tabs, Tab } from 'react-bootstrap';
import { FiEye, FiCheck, FiX } from 'react-icons/fi';
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';
import './ManagementPage.css';

function ArticleModerationPage({ onLogout }) {
  const { t } = useTranslation();
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

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/internal/articles/?status=${filterStatus}&page=${currentPage}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
      );
      setArticles(response.data.results || []);
      setTotalPages(Math.ceil((response.data.count || 0) / 10));
    } catch (err) {
      setError(err.response?.data?.detail || t('errors.failed_load_articles'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterStatus, t]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleOpenModal = (article, act) => {
    setSelectedArticle(article);
    setAction(act);
    setComment('');
    setShowModal(true);
  };

  const handleSubmitReview = async () => {
    if (action === 'reject' && !comment) {
      setError(t('moderation.rejection_reason'));
      return;
    }
    try {
      setSubmitting(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/internal/articles/${selectedArticle.id}/review/`,
        { status: action === 'approve' ? 'APPROVED' : 'REJECTED', review_comment: comment },
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
      );
      loadArticles();
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.detail || t('moderation.review_submitted'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger', PUBLISHED: 'primary' };
    return variants[status] || 'secondary';
  };

  return (
    <div className="admin-wrapper">
      <AdminSidebar onLogout={onLogout} />
      <div className="admin-content">
        <Container fluid>
          <div className="admin-header">
            <div>
              <h1>{t('moderation.title')}</h1>
              <p className="text-muted">{t('moderation.subtitle')}</p>
            </div>
          </div>

          {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

          <Tabs activeKey={filterStatus} onSelect={(k) => { setFilterStatus(k); setCurrentPage(1); }} className="mb-4">
            <Tab eventKey="PENDING" title={t('moderation.pending_review')} />
            <Tab eventKey="APPROVED" title={t('moderation.approved')} />
            <Tab eventKey="REJECTED" title={t('moderation.rejected')} />
            <Tab eventKey="PUBLISHED" title={t('moderation.published')} />
          </Tabs>

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
                        <th>Title</th>
                        <th>Author</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articles.map((article) => (
                        <tr key={article.id}>
                          <td><strong>{article.title_en.substring(0, 40)}...</strong></td>
                          <td>{article.author?.username || '-'}</td>
                          <td>{article.category?.name_en || '-'}</td>
                          <td><Badge bg={getStatusBadge(article.status)}>{article.status}</Badge></td>
                          <td>{new Date(article.created_at).toLocaleDateString()}</td>
                          <td>
                            <div className="action-buttons">
                              <Button variant="outline-info" size="sm" title={t('buttons.view')}><FiEye /></Button>
                              {filterStatus === 'PENDING' && (
                                <>
                                  <Button variant="outline-success" size="sm" onClick={() => handleOpenModal(article, 'approve')}><FiCheck /></Button>
                                  <Button variant="outline-danger" size="sm" onClick={() => handleOpenModal(article, 'reject')}><FiX /></Button>
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
        </Container>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{action === 'approve' ? 'Approve Article' : 'Reject Article'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>{action === 'approve' ? t('moderation.approval_comments') : t('moderation.rejection_reason_label') + ' *'}</Form.Label>
            <Form.Control as="textarea" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={action === 'approve' ? t('moderation.optional_notes') : t('moderation.required_rejection_reason')} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>{t('buttons.cancel')}</Button>
          <Button variant={action === 'approve' ? 'success' : 'danger'} onClick={handleSubmitReview} disabled={submitting}>{submitting ? 'Submitting...' : action === 'approve' ? 'Approve' : 'Reject'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ArticleModerationPage;


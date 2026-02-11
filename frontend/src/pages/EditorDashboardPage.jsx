import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Card, Badge, Button, Tabs, Tab, Form, Modal } from 'react-bootstrap';
import { FiEye, FiCheckCircle, FiX, FiMessageSquare } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import Pagination from '../components/Pagination';
import './EditorDashboardPage.css';

/**
 * EditorDashboard Page Component
 * Dashboard for editors to review submitted articles
 * Features:
 * - View submitted articles waiting for review
 * - Approve/reject articles with comments
 * - Filter by status
 * - Pagination
 */
const EditorDashboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [articles, setArticles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(null); // 'approve' or 'reject'
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  });

  const loadArticles = async () => {
    try {
      setLoading(true);
      let status = 'submitted';
      
      if (activeTab === 'approved') {
        status = 'approved';
      } else if (activeTab === 'rejected') {
        status = 'rejected';
      }

      const response = await fetch(
        `/api/v1/internal/articles/?status=${status}&page=${currentPage}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(t('moderation.loading_articles'));
      }

      const data = await response.json();
      setArticles(data.results || data);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(
        '/api/v1/internal/articles/review-stats/',
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error(t('editor.saving'), err);
    }
  };

  const handleReviewClick = (article, action) => {
    setSelectedArticle(article);
    setReviewAction(action);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedArticle) return;

    try {
      setSubmitting(true);
      const payload = {
        status: reviewAction === 'approve' ? 'approved' : 'rejected',
        review_comment: reviewComment
      };

      const response = await fetch(
        `/api/v1/internal/articles/${selectedArticle.id}/review/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      setShowReviewModal(false);
      loadArticles();
      loadStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && articles.length === 0) {
    return <LoadingSpinner message={t('loading.loading_articles_for_review')} />;
  }

  return (
    <Container className="editor-dashboard-page py-4">
      {/* Header */}
      <div className="dashboard-header mb-4">
        <h1 className="page-title">Editor Dashboard</h1>
        <p className="text-muted">Review and manage submitted articles</p>
      </div>

      {error && (
        <ErrorAlert 
          message={error}
          onDismiss={() => setError('')}
          className="mb-4"
        />
      )}

      {/* Statistics */}
      <Row className="mb-4 g-3">
        <Col xs={12} sm={6} lg={3}>
          <Card className="stat-card pending">
            <Card.Body>
              <div className="stat-number">{stats.pending}</div>
              <div className="stat-label">{t('dashboard.pending_review')}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card className="stat-card approved">
            <Card.Body>
              <div className="stat-number">{stats.approved}</div>
              <div className="stat-label">{t('dashboard.approved')}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card className="stat-card rejected">
            <Card.Body>
              <div className="stat-number">{stats.rejected}</div>
              <div className="stat-label">{t('dashboard.rejected')}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card className="stat-card total">
            <Card.Body>
              <div className="stat-number">
                {stats.pending + stats.approved + stats.rejected}
              </div>
              <div className="stat-label">Total Reviews</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Articles Tabs */}
      <Card className="articles-card">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => {
            setActiveTab(k);
            setCurrentPage(1);
          }}
          className="editor-tabs"
        >
          {/* Pending Tab */}
          <Tab eventKey="pending" title={t('dashboard.pending_review')}>
            {articles.length === 0 ? (
              <div className="empty-state text-center py-5">
                <p className="text-muted mb-0">{t('dashboard.no_pending')}</p>
              </div>
            ) : (
              <div className="articles-list">
                {articles.map(article => (
                  <div key={article.id} className="article-item">
                    <div className="article-header">
                      <div className="article-info">
                        <h5 className="article-title">{article.title}</h5>
                        <div className="article-meta">
                          <small className="text-muted">
                            By {article.author?.first_name || 'Anonymous'} •
                            {' '}{new Date(article.created_at).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                      <div className="article-badges">
                        <Badge bg="warning" text="dark">
                          Pending Review
                        </Badge>
                      </div>
                    </div>

                    <div className="article-excerpt">
                      <p>{article.description || article.content.substring(0, 200)}...</p>
                    </div>

                    <div className="article-footer">
                      <div className="article-stats">
                        <small className="stat">
                          Category: <strong>{article.category?.name}</strong>
                        </small>
                        <small className="stat">
                          Views: <strong>{article.views_count || 0}</strong>
                        </small>
                      </div>
                      <div className="article-actions">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="action-btn"
                        >
                          <FiEye /> View
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          className="action-btn"
                          onClick={() => handleReviewClick(article, 'approve')}
                        >
                          <FiCheckCircle /> Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="action-btn"
                          onClick={() => handleReviewClick(article, 'reject')}
                        >
                          <FiX /> Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Tab>

          {/* Approved Tab */}
          <Tab eventKey="approved" title={t('dashboard.approved')}>
            {articles.length === 0 ? (
              <div className="empty-state text-center py-5">
                <p className="text-muted mb-0">{t('dashboard.no_approved')}</p>
              </div>
            ) : (
              <div className="articles-list">
                {articles.map(article => (
                  <div key={article.id} className="article-item approved">
                    <div className="article-header">
                      <div className="article-info">
                        <h5 className="article-title">{article.title}</h5>
                        <div className="article-meta">
                          <small className="text-muted">
                            By {article.author?.first_name || 'Anonymous'} •
                            {' '}{new Date(article.created_at).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                      <div className="article-badges">
                        <Badge bg="success">{t('dashboard.approved')}</Badge>
                        {article.published_at && (
                          <Badge bg="primary">{t('dashboard.published')}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="article-footer">
                      <div className="article-stats">
                        <small className="stat">
                          Views: <strong>{article.views_count || 0}</strong>
                        </small>
                      </div>
                      <div className="article-actions">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="action-btn"
                        >
                          <FiEye /> View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Tab>

          {/* Rejected Tab */}
          <Tab eventKey="rejected" title={t('dashboard.rejected')}>
            {articles.length === 0 ? (
              <div className="empty-state text-center py-5">
                <p className="text-muted mb-0">{t('dashboard.no_rejected')}</p>
              </div>
            ) : (
              <div className="articles-list">
                {articles.map(article => (
                  <div key={article.id} className="article-item rejected">
                    <div className="article-header">
                      <div className="article-info">
                        <h5 className="article-title">{article.title}</h5>
                        <div className="article-meta">
                          <small className="text-muted">
                            By {article.author?.first_name || 'Anonymous'} •
                            {' '}{new Date(article.created_at).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                      <div className="article-badges">
                        <Badge bg="danger">{t('dashboard.rejected')}</Badge>
                      </div>
                    </div>

                    {article.rejection_reason && (
                      <div className="rejection-reason">
                        <div className="reason-header">
                          <FiMessageSquare size={16} />
                          <strong>{t('moderation.rejection_reason_display')}</strong>
                        </div>
                        <p className="reason-text">{article.rejection_reason}</p>
                      </div>
                    )}

                    {article.approval_comment && (
                      <div className="approval-comment" style={{marginTop: '10px'}}>
                        <div className="reason-header">
                          <FiMessageSquare size={16} />
                          <strong>{t('moderation.approval_comments')}</strong>
                        </div>
                        <p className="reason-text">{article.approval_comment}</p>
                      </div>
                    )}

                    <div className="article-footer">
                      <div className="article-stats">
                      </div>
                      <div className="article-actions">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="action-btn"
                        >
                          <FiEye /> View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Tab>
        </Tabs>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {reviewAction === 'approve' ? 'Approve' : 'Reject'} Article
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedArticle && (
            <>
              <div className="article-preview mb-4">
                <h5>{selectedArticle.title}</h5>
                <p className="text-muted small">
                  By {selectedArticle.author?.first_name} •
                  {' '}{new Date(selectedArticle.created_at).toLocaleDateString()}
                </p>
              </div>

              <Form.Group>
                <Form.Label>
                  {reviewAction === 'approve' 
                    ? 'Approval Notes (Optional)' 
                    : 'Rejection Reason (Required)'}
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={
                    reviewAction === 'approve'
                      ? 'Add any notes for the author...'
                      : 'Explain why the article is being rejected...'
                  }
                  required={reviewAction === 'reject'}
                />
                <Form.Text className="text-muted">
                  {reviewComment.length} characters
                </Form.Text>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowReviewModal(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant={reviewAction === 'approve' ? 'success' : 'danger'}
            onClick={handleSubmitReview}
            disabled={
              submitting || 
              (reviewAction === 'reject' && !reviewComment.trim())
            }
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EditorDashboard;


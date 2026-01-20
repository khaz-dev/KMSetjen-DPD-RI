import React, { useState } from 'react';
import { Card, Badge, Button, Form, ListGroup } from 'react-bootstrap';
import { FiThumbsUp, FiThumbsDown, FiMessage } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import './ReviewInterface.css';

/**
 * ReviewInterface Component
 * Reusable component for reviewing articles with approval/rejection workflow
 * 
 * Props:
 *   article {object} - Article data
 *   onApprove {function} - Callback when approved
 *   onReject {function} - Callback when rejected
 *   onComment {function} - Callback for comments
 *   isLoading {boolean} - Loading state
 *   comments {array} - Array of existing comments
 */
const ReviewInterface = ({
  article,
  onApprove,
  onReject,
  onComment,
  isLoading = false,
  comments = []
}) => {
  const { t } = useTranslation();
  const [comment, setComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);

  const handleSubmitComment = () => {
    if (comment.trim() && onComment) {
      onComment(comment);
      setComment('');
      setShowCommentForm(false);
    }
  };

  return (
    <Card className="review-interface">
      {/* Article Header */}
      <Card.Header className="review-header">
        <div className="header-content">
          <h4 className="mb-2">{article?.title}</h4>
          <div className="header-meta">
            <span className="badge-wrapper">
              {article?.status && (
                <Badge bg={getStatusColor(article.status)}>
                  {formatStatus(article.status)}
                </Badge>
              )}
            </span>
            <span className="meta-info">
              By {article?.author?.first_name || 'Anonymous'} •
              {' '}{article?.created_at && new Date(article.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Card.Header>

      {/* Article Content */}
      <Card.Body className="review-body">
        {/* Description */}
        {article?.description && (
          <div className="review-section">
            <h6 className="section-title">{t('review.description_label')}</h6>
            <p className="section-content">{article.description}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="review-metadata">
          <div className="metadata-item">
            <span className="metadata-label">{t('review.category_label')}</span>
            <span className="metadata-value">{article?.category?.name}</span>
          </div>
          {article?.tags && article.tags.length > 0 && (
            <div className="metadata-item">
              <span className="metadata-label">{t('review.tags_label')}</span>
              <div className="metadata-tags">
                {article.tags.map(tag => (
                  <Badge key={tag.id} bg="light" text="dark" className="tag">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Preview */}
        {article?.content && (
          <div className="review-section">
            <h6 className="section-title">{t('review.content_preview')}</h6>
            <div className="content-preview">
              {article.content.substring(0, 500)}...
            </div>
          </div>
        )}

        {/* Comments Section */}
        {comments.length > 0 && (
          <div className="review-section">
            <h6 className="section-title">
              <FiMessage size={16} /> {t('review.comments')} ({comments.length})
            </h6>
            <ListGroup variant="flush" className="comments-list">
              {comments.map(cmt => (
                <ListGroup.Item key={cmt.id} className="comment-item">
                  <div className="comment-header">
                    <strong>{cmt.author || t('review.anonymous')}</strong>
                    <small className="text-muted">
                      {cmt.created_at && new Date(cmt.created_at).toLocaleDateString()}
                    </small>
                  </div>
                  <p className="comment-text">{cmt.text}</p>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        {/* Add Comment */}
        <div className="review-section">
          {!showCommentForm ? (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setShowCommentForm(true)}
              className="add-comment-btn"
            >
              <FiMessage size={16} /> {t('review.add_comment')}
            </Button>
          ) : (
            <div className="comment-form">
              <Form.Group>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('review.comment_placeholder')}
                  className="comment-input"
                />
              </Form.Group>
              <div className="comment-actions">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!comment.trim() || isLoading}
                >
                  Post Comment
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    setShowCommentForm(false);
                    setComment('');
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card.Body>

      {/* Action Buttons */}
      <Card.Footer className="review-footer">
        <div className="action-buttons">
          <Button
            variant="success"
            onClick={onApprove}
            disabled={isLoading}
            className="action-btn approve-btn"
          >
            <FiThumbsUp /> Approve
          </Button>
          <Button
            variant="danger"
            onClick={onReject}
            disabled={isLoading}
            className="action-btn reject-btn"
          >
            <FiThumbsDown /> Reject
          </Button>
          <span className="action-info text-muted">
            Review this article to approve or request changes
          </span>
        </div>
      </Card.Footer>
    </Card>
  );
};

// Helper functions
const getStatusColor = (status) => {
  switch (status) {
    case 'draft':
      return 'secondary';
    case 'submitted':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'published':
      return 'primary';
    default:
      return 'light';
  }
};

const formatStatus = (status) => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default ReviewInterface;

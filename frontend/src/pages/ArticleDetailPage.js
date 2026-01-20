import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Badge, Spinner, Button, Alert, Modal } from 'react-bootstrap';
import { marked } from 'marked';
import { publicAPI, internalAPI } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import { FiShare2, FiPrinter, FiCheck, FiFacebook, FiTwitter, FiMail, FiEye, FiHeart } from 'react-icons/fi';
import './ArticleDetailPage.css';

/**
 * ArticleDetailPage Component
 * Displays full article with metadata
 */
const ArticleDetailPage = () => {
  const { t } = useTranslation();
  const { isIndonesian } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [similarArticles, setSimilarArticles] = useState([]);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [popularArticles, setPopularArticles] = useState([]);
  const [expandedFilePreview, setExpandedFilePreview] = useState({});

  // Helper function to get file preview type based on MIME type
  const getPreviewType = (mimeType) => {
    if (!mimeType) return null;
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return null;
  };

  // Helper function to get Bootstrap icon for file type
  const getFileIcon = (mimeType) => {
    if (!mimeType) return 'bi-file';
    if (mimeType.startsWith('image/')) return 'bi-image';
    if (mimeType === 'application/pdf') return 'bi-file-pdf';
    if (mimeType.startsWith('video/')) return 'bi-film';
    if (mimeType.startsWith('audio/')) return 'bi-music-note';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'bi-file-word';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'bi-file-spreadsheet';
    return 'bi-file';
  };

  // Helper function to toggle file preview
  const toggleFilePreview = (fileId) => {
    setExpandedFilePreview(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Helper function to convert Markdown to HTML
  const convertMarkdownToHtml = (markdown) => {
    if (!markdown) return '';
    
    // Check if content looks like markdown (starts with #, contains markdown syntax)
    const isMarkdown = /^#+\s|^-\s|^\*\*|^\*[^*]|\[.*\]\(.*\)/.test(markdown.trim());
    
    if (isMarkdown) {
      try {
        return marked(markdown, {
          breaks: true,
          gfm: true,
          silent: true
        });
      } catch (error) {
        console.error('[MarkdownConversion] Error converting markdown:', error);
        return markdown; // Fallback to raw markdown if conversion fails
      }
    }
    
    // If it looks like HTML already, return as-is
    if (markdown.trim().startsWith('<')) {
      return markdown;
    }
    
    // Otherwise treat as plain text
    return markdown;
  };

  useEffect(() => {
    const loadArticle = async () => {
      try {
        setLoading(true);
        setError(null);
        let response;
        
        // Check if user is authenticated (either user object exists or token in localStorage)
        const token = localStorage.getItem('access_token');
        const isAuthenticated = !!user || !!token;
        
        // If user is authenticated, try internal API first (allows viewing draft articles)
        if (isAuthenticated) {
          try {
            response = await internalAPI.getArticle(id);
          } catch (internalErr) {
            // If internal API fails, fall back to public API
            response = await publicAPI.getArticle(id);
          }
        } else {
          // If not authenticated, use public API
          response = await publicAPI.getArticle(id);
        }
        
        setArticle(response.data);
        
        // Load related articles after main article is loaded
        await loadRelatedArticles(response.data);
      } catch (err) {
        // Store error key, not translated string, so 't' is not a dependency
        setError('errors.failed_load_article');
        console.error('Error loading article:', err);
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [id, user]);

  const loadRelatedArticles = async (currentArticle) => {
    try {
      setLoadingRelated(true);
      
      // Fetch all articles to find similar/related/popular
      const response = await publicAPI.getArticles({ page: 1, limit: 50 });
      const allArticles = response.data.results || response.data;
      
      // Filter articles
      const similar = allArticles.filter(
        (art) => art.id !== currentArticle.id && art.category?.id === currentArticle.category?.id
      ).slice(0, 3);
      
      // Find related by tags
      const currentTags = currentArticle.tags?.map(t => t.id) || [];
      const related = allArticles.filter((art) => {
        if (art.id === currentArticle.id) return false;
        const artTags = art.tags?.map(t => t.id) || [];
        return currentTags.some(tagId => artTags.includes(tagId));
      }).slice(0, 3);
      
      // Get popular articles (top by views)
      const popular = allArticles
        .filter((art) => art.id !== currentArticle.id)
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 5);
      
      setSimilarArticles(similar);
      setRelatedArticles(related);
      setPopularArticles(popular);
    } catch (err) {
      console.error('Error loading related articles:', err);
    } finally {
      setLoadingRelated(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">{t('common.loading')}</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{t(error)}</Alert>
        <Button onClick={() => navigate('/articles')}>{t('buttons.back')}</Button>
      </Container>
    );
  }

  if (!article) {
    return (
      <Container className="py-5">
        <Alert variant="warning">{t('errors.not_found')}</Alert>
        <Button onClick={() => navigate('/articles')}>{t('buttons.back')}</Button>
      </Container>
    );
  }

  // Content language selection with fallback to Indonesian if English not available
  const title = isIndonesian 
    ? article.title_id 
    : (article.title_en || article.title_id);
  
  const content = isIndonesian 
    ? article.content_id 
    : (article.content_en || article.content_id);
  
  const summary = isIndonesian 
    ? article.summary_id 
    : (article.summary_en || article.summary_id);
  
  const categoryName = isIndonesian 
    ? article.category?.name_id 
    : (article.category?.name_en || article.category?.name_id);

  const articleUrl = `${window.location.origin}/articles/${article.id}`;

  const handleShare = (platform) => {
    const encodedUrl = encodeURIComponent(articleUrl);
    const encodedTitle = encodeURIComponent(title);

    switch (platform) {
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
          '_blank',
          'width=600,height=400'
        );
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
          '_blank',
          'width=600,height=400'
        );
        break;
      case 'email':
        window.open(
          `mailto:?subject=${encodedTitle}&body=${encodedTitle}%0A%0A${encodedUrl}`,
          '_blank'
        );
        break;
      case 'copy':
        navigator.clipboard.writeText(articleUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        break;
      default:
        break;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const ArticleListItem = ({ article: art }) => {
    // Content language selection with fallback to Indonesian if English not available
    const artTitle = isIndonesian ? art.title_id : (art.title_en || art.title_id);
    const artContent = isIndonesian ? art.content_id : (art.content_en || art.content_id);
    const artSummary = isIndonesian ? art.summary_id : (art.summary_en || art.summary_id);
    
    // Create excerpt from summary or content, max 120 characters
    const getExcerpt = () => {
      let excerpt = artSummary || artContent || '';
      // Remove HTML tags if present
      excerpt = excerpt.replace(/<[^>]*>/g, '');
      // Remove extra whitespace
      excerpt = excerpt.replace(/\s+/g, ' ').trim();
      // Limit to 120 chars
      return excerpt.length > 120 ? excerpt.substring(0, 120) + '...' : excerpt;
    };
    
    const excerpt = getExcerpt();
    
    return (
      <div 
        className="article-list-item p-3 border-bottom"
        style={{ cursor: 'pointer' }}
        onClick={() => navigate(`/articles/${art.id}`)}
      >
        <div className="d-flex align-items-start gap-2">
          <div className="flex-grow-1">
            <h6 className="mb-2 article-list-item-title">{artTitle}</h6>
            {excerpt && (
              <p className="mb-2 article-list-item-excerpt">{excerpt}</p>
            )}
            <div className="article-list-item-meta">
              <FiEye size={12} />
              <span>{art.view_count || 0}</span>
              <span>•</span>
              <FiHeart size={12} />
              <span>{art.like_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="article-detail-page">
      <Container className="py-5">
        <Row>
          <Col lg={8}>
            <article>
              <header className="article-header mb-5">
                <h1 className="display-5 fw-bold mb-3">{title}</h1>
                
                <div className="article-meta mb-3">
                  <Badge bg="primary" className="me-2">
                    {categoryName || t('common.no_results')}
                  </Badge>
                  
                  {article.tags?.map((tag) => (
                    <Badge key={tag.id} bg="secondary" className="me-2">
                      {isIndonesian ? tag.name_id : tag.name_en}
                    </Badge>
                  ))}
                </div>

                <div className="article-detail-info text-muted small mb-3">
                  <span>
                    {t('common.by')} <strong>{article.author_name}</strong>
                  </span>
                  <span className="separator">•</span>
                  <span>
                    {formatDistanceToNow(new Date(article.published_at), { 
                      addSuffix: true,
                      locale: isIndonesian ? idLocale : enUS
                    })}
                  </span>
                  <span className="separator">•</span>
                  <span className="d-inline-flex align-items-center gap-1">
                    <FiEye size={14} />
                    {article.view_count} {t('articles.views')}
                  </span>
                  <span className="separator">•</span>
                  <span className="d-inline-flex align-items-center gap-1">
                    <FiHeart size={14} />
                    {article.like_count} {t('articles.likes')}
                  </span>
                </div>
                
              </header>

              {(article.image || article.image_url) && (
                <div className="article-featured-image mb-5">
                  <img 
                    src={article.image || article.image_url} 
                    alt={title}
                    className="img-fluid rounded"
                    style={{ maxHeight: '400px', objectFit: 'cover', width: '100%' }}
                  />
                </div>
              )}

              {/* File Attachments */}
              {article.files && article.files.length > 0 && (
                <div className="article-attachments mt-5 pt-5 border-top">
                  <h5 className="mb-4">{t('articles.file_attachments') || 'File Attachments'}</h5>
                  <div className="attachments-list">
                    {article.files.map((file) => {
                      const previewType = getPreviewType(file.mime_type);
                      const showPreview = expandedFilePreview[file.id] || false;

                      return (
                        <div key={file.id} className="file-item-wrapper">
                          <div className="attachment-item">
                            <div className="attachment-icon">
                              <i className={`bi ${getFileIcon(file.mime_type)}`}></i>
                            </div>
                            <div className="attachment-info">
                              <div className="attachment-name">{file.original_filename}</div>
                              <small className="attachment-meta">
                                {file.file_size_display} • {new Date(file.created_at).toLocaleDateString(isIndonesian ? 'id-ID' : 'en-US')}
                              </small>
                            </div>
                            <div className="attachment-actions">
                              {previewType && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary me-2"
                                  onClick={() => toggleFilePreview(file.id)}
                                  title={showPreview ? 'Hide preview' : 'Show preview'}
                                >
                                  <i className={`bi ${showPreview ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                  <span className="ms-1">{showPreview ? 'Hide' : 'Preview'}</span>
                                </button>
                              )}
                              <a 
                                href={file.file} 
                                download={file.original_filename}
                                className="btn btn-sm btn-outline-primary"
                              >
                                <i className="bi bi-download"></i>
                                <span className="ms-1">{t('buttons.download') || 'Download'}</span>
                              </a>
                            </div>
                          </div>

                          {/* File Preview */}
                          {showPreview && previewType && file.file && (
                            <div className="file-preview-container">
                              {previewType === 'image' && (
                                <img 
                                  src={file.file} 
                                  alt={file.original_filename}
                                  className="file-preview-image"
                                  onError={(e) => {
                                    console.error('[FilePreview] Image failed to load:', file.file);
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}
                              {previewType === 'pdf' && (
                                <iframe
                                  src={`${file.file}#toolbar=0`}
                                  className="file-preview-pdf"
                                  title={file.original_filename}
                                  onLoad={() => console.debug('[FilePreview] PDF iframe loaded')}
                                  onError={(e) => console.error('[FilePreview] PDF iframe error:', file.file, e)}
                                />
                              )}
                              {previewType === 'video' && (
                                <video
                                  controls
                                  className="file-preview-video"
                                  src={file.file}
                                >
                                  Your browser does not support the video tag.
                                </video>
                              )}
                              {previewType === 'audio' && (
                                <audio
                                  controls
                                  className="file-preview-audio"
                                  src={file.file}
                                >
                                  Your browser does not support the audio tag.
                                </audio>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {summary && (
                <div className="article-summary bg-light p-4 mb-4 rounded">
                  <p className="text-muted fst-italic mb-0">{summary}</p>
                </div>
              )}

              <div className="article-content">
                {/* Render HTML/Markdown content from backend */}
                <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(content) }} />
              </div>

              {article.is_bilingual && (
                <div className="article-language-note mt-4 p-3 bg-info bg-opacity-10 border-start border-info">
                  <small className="text-muted">
                    {t('articles.bilingual_note')}
                  </small>
                </div>
              )}
            </article>

            <hr className="my-5" />

            <div className="article-actions">
              <Button 
                variant="outline-primary" 
                className="me-2"
                onClick={() => setShowShareModal(true)}
              >
                <FiShare2 className="me-2" style={{ display: 'inline' }} />
                {t('articles.share')}
              </Button>
              <Button 
                variant="outline-secondary"
                onClick={handlePrint}
              >
                <FiPrinter className="me-2" style={{ display: 'inline' }} />
                {t('articles.print')}
              </Button>
            </div>
          </Col>

          {/* Sidebar */}
          <Col lg={4}>
            <div className="sidebar-sticky">
              {/* Related Articles */}
              <div className="card mb-4">
                <div className="card-body">
                  <h5 className="card-title">{t('articles.article_information')}</h5>
                  <div className="article-details">
                    <p>
                      <strong>{t('articles.status')}:</strong>{' '}
                      <Badge bg={article.status === 'published' ? 'success' : 'secondary'}>
                        {article.status === 'published' && t('articles.published')}
                        {article.status === 'draft' && t('articles.draft')}
                        {article.status === 'review' && t('dashboard.status_review')}
                        {article.status === 'approved' && t('dashboard.status_approved')}
                        {article.status === 'rejected' && t('dashboard.status_rejected')}
                      </Badge>
                    </p>
                    <p>
                      <strong>{t('articles.last_updated')}:</strong><br />
                      {new Date(article.updated_at).toLocaleDateString(isIndonesian ? 'id-ID' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p>
                      <strong>{t('articles.access_level')}:</strong>{' '}
                      <span>
                        {article.access_level === 'public' && t('articles.access_public')}
                        {article.access_level === 'internal' && t('articles.access_internal')}
                        {article.access_level === 'role_based' && t('articles.access_role_based')}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Category */}
              {article.category && (
                <div className="card mb-4">
                  <div className="card-body">
                    <h5 className="card-title">{t('articles.category')}</h5>
                    <Button
                      variant="light"
                      className="w-100"
                      href={`/articles?category=${article.category.id}`}
                    >
                      {categoryName}
                    </Button>
                  </div>
                </div>
              )}

              {/* Similar Articles */}
              {similarArticles.length > 0 && (
                <div className="card mb-4">
                  <div className="card-body p-0">
                    <h5 className="card-title p-3 mb-0">{t('articles.similar_articles')}</h5>
                    <div className="article-list">
                      {similarArticles.map((art) => (
                        <ArticleListItem key={art.id} article={art} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <div className="card mb-4">
                  <div className="card-body p-0">
                    <h5 className="card-title p-3 mb-0">{t('articles.related_articles')}</h5>
                    <div className="article-list">
                      {relatedArticles.map((art) => (
                        <ArticleListItem key={art.id} article={art} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Popular Articles */}
              {popularArticles.length > 0 && (
                <div className="card mb-4">
                  <div className="card-body p-0">
                    <h5 className="card-title p-3 mb-0">{t('articles.popular_articles')}</h5>
                    <div className="article-list">
                      {popularArticles.map((art) => (
                        <ArticleListItem key={art.id} article={art} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Container>

      {/* Share Modal */}
      <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('articles.share')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="share-options">
            <div className="mb-3">
              <p className="mb-3">{t('articles.share_article')}</p>
              <div className="d-grid gap-2">
                <Button 
                  variant="light" 
                  className="text-start"
                  onClick={() => handleShare('facebook')}
                >
                  <FiFacebook className="me-2" style={{ color: '#1877F2' }} />
                  {t('articles.share_facebook')}
                </Button>
                <Button 
                  variant="light" 
                  className="text-start"
                  onClick={() => handleShare('twitter')}
                >
                  <FiTwitter className="me-2" style={{ color: '#1DA1F2' }} />
                  {t('articles.share_twitter')}
                </Button>
                <Button 
                  variant="light" 
                  className="text-start"
                  onClick={() => handleShare('email')}
                >
                  <FiMail className="me-2" />
                  {t('articles.share_email')}
                </Button>
              </div>
            </div>
            <hr />
            <div>
              <p className="mb-2">{t('articles.copy_link')}</p>
              <div className="input-group">
                <input 
                  type="text" 
                  className="form-control" 
                  value={articleUrl} 
                  readOnly 
                />
                <Button 
                  variant={copySuccess ? 'success' : 'outline-secondary'}
                  onClick={() => handleShare('copy')}
                >
                  {copySuccess ? (
                    <>
                      <FiCheck className="me-2" style={{ display: 'inline' }} />
                      {t('articles.copied')}
                    </>
                  ) : (
                    t('articles.copy')
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ArticleDetailPage;

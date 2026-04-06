import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Badge, Spinner, Button, Alert, Modal } from 'react-bootstrap';
import { marked } from 'marked';
import { publicAPI, internalAPI, getArticleUrl } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import { FiShare2, FiPrinter, FiCheck, FiFacebook, FiTwitter, FiMail, FiEye, FiHeart } from 'react-icons/fi';
import ImageWithFallback from '../components/ImageWithFallback';
import './ArticleDetailPage.css';

/**
 * ArticleDetailPage Component
 * Displays full article with metadata
 */
const ArticleDetailPage = () => {
  const { t } = useTranslation();
  const { isIndonesian } = useLanguage();
  const { idOrSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
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
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [fullscreenFile, setFullscreenFile] = useState(null);
  const articleRef = React.useRef(null);

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
        
        // Check if we need to load draft version
        const versionParam = searchParams.get('version');
        const isDraftRequest = versionParam === 'draft';
        
        // Route articles based on user role:
        // - PUBLIC users → use public API (can see published articles only)
        // - CONTRIBUTOR/READER → use internal API (can see articles based on author/editor status)
        // - EDITOR/ADMIN → use internal API (can see all articles)
        // - Anonymous → use public API
        //
        // PUBLIC users must use publicAPI because internalAPI only shows articles
        // authored by the user, and most articles are authored by others.
        if (isDraftRequest && user && user.primary_role !== 'public') {
          // User requested draft version - use internal API with ID
          // This will get the draft article which shows unpublished/draft content
          try {
            response = await internalAPI.getArticle(idOrSlug);
            // If we got a published version, try to fetch the draft
            if (response.data.draft_article_id) {
              // This is a published version, fetch the associated draft
              response = await internalAPI.getArticle(response.data.draft_article_id);
            }
          } catch (internalErr) {
            throw internalErr;
          }
        } else if (user && user.primary_role !== 'public') {
          // User is authenticated and NOT PUBLIC - use internal API
          try {
            response = await internalAPI.getArticle(idOrSlug);
          } catch (internalErr) {
            // If internal API fails, that's a real error (permission denied or not found)
            throw internalErr;
          }
        } else {
          // User is public (public role) or not authenticated - use public API (published articles only)
          response = await publicAPI.getArticle(idOrSlug);
        }
        
        setArticle(response.data);
        // Set liked state from response
        setLiked(response.data.liked_by_user || false);
        
        // Record view (track article views in backend)
        // ONLY record views for published articles
        // Don't block the request if this fails - it's non-critical
        try {
          // Only attempt to record view if article is published and not a draft view
          const articleData = response.data;
          if (articleData.is_published && articleData.status === 'published' && !isDraftRequest) {
            // Use public API for all users (both authenticated and anonymous can view articles)
            publicAPI.recordView(idOrSlug).catch((err) => {
              // Only log if not a "not found" error (article might not be visible to anonymous)
              if (err.response?.status !== 404) {
                console.debug('View recording failed, but continuing...');
              }
            });
          } else {
            // Article is not published or this is a draft view - view tracking disabled
            console.debug(`View tracking disabled for unpublished article or draft view (status: ${articleData.status}, isDraft: ${isDraftRequest})`);
          }
        } catch (viewErr) {
          // Silently fail
          console.debug('View recording error:', viewErr);
        }
        
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

    // Skip loading article until auth is loaded
    if (authLoading) {
      return;
    }

    loadArticle();
  }, [idOrSlug, user, authLoading, searchParams]);

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

  const toggleLike = async () => {
    if (!article) return;
    
    // CRITICAL: Only allow likes on published articles by AUTHENTICATED users
    if (!article.is_published || article.status !== 'published') {
      console.debug('Like disabled: Article must be published');
      return;
    }
    
    // CRITICAL: Only authenticated users can like articles
    const token = localStorage.getItem('access_token');
    if (!token && !user) {
      console.debug('Like disabled: User must be authenticated');
      alert(t('auth.login_required_to_like') || 'Please log in to like articles');
      return;
    }
    
    setLikeLoading(true);
    try {
      // Use public API for like toggle (works for all users, requires authentication)
      const response = await publicAPI.recordLike(article.id);
      
      if (response.data.success) {
        // Update local state with the response
        setLiked(response.data.liked);
        
        // Update article with new like count
        setArticle(prev => ({
          ...prev,
          like_count: response.data.like_count
        }));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      // Could show an error notification here if needed
    } finally {
      setLikeLoading(false);
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
        <Button onClick={() => navigate('/knowledges')}>{t('buttons.back')}</Button>
      </Container>
    );
  }

  if (!article) {
    return (
      <Container className="py-5">
        <Alert variant="warning">{t('errors.not_found')}</Alert>
        <Button onClick={() => navigate('/knowledges')}>{t('buttons.back')}</Button>
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

  const articleUrl = `${window.location.origin}${getArticleUrl(article)}`;

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
    if (!articleRef.current) return;
    
    // Add class to hide non-article content during print
    const body = document.body;
    body.classList.add('article-print-mode');
    
    // Use setTimeout to ensure the class is applied before printing
    setTimeout(() => {
      window.print();
      // Remove the class after print dialog closes
      setTimeout(() => {
        body.classList.remove('article-print-mode');
      }, 100);
    }, 100);
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
        onClick={() => navigate(getArticleUrl(art))}
      >
        {/* Row 1: Featured Image and Content */}
        <div className="d-flex gap-2">
          {/* Featured Image Left */}
          <div className="article-list-item-image">
            <ImageWithFallback
              src={art.image || art.image_url}
              alt={artTitle}
              type="article"
              className="article-list-thumbnail"
            />
          </div>
          
          {/* Title and Excerpt Center with flex-grow-1 */}
          <div className="flex-grow-1">
            <h6 className="mb-2 article-list-item-title">{artTitle}</h6>
            {excerpt && (
              <p className="mb-0 article-list-item-excerpt">{excerpt}</p>
            )}
          </div>
        </div>
        
        {/* Row 2: Meta Stick to Right End */}
        <div className="article-list-item-meta">
          <FiEye size={12} />
          <span>{art.view_count || 0}</span>
          <span>•</span>
          <FiHeart size={12} />
          <span>{art.like_count || 0}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="article-detail-page">
      <Container className="py-5">
        <Row>
          <Col lg={8}>
            <article ref={articleRef}>
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
                    {formatDistanceToNow(new Date(article.published_at || article.updated_at), { 
                      addSuffix: true,
                      locale: isIndonesian ? idLocale : enUS
                    })}
                  </span>
                  <span className="separator">•</span>
                  <span className="d-inline-flex align-items-center gap-1">
                    <FiEye size={14} />
                    {article.view_count} {t('articles.views')}
                  </span>
                </div>
                
              </header>

              <div className="article-featured-image mb-5">
                <ImageWithFallback 
                  src={article.image || article.image_url} 
                  alt={title}
                  className="img-fluid rounded"
                  style={{ maxHeight: '400px', objectFit: 'cover', width: '100%' }}
                  type="article"
                />
              </div>

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
                              {previewType && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-info me-2"
                                  onClick={() => setFullscreenFile(file)}
                                  title="Full screen view"
                                >
                                  <i className="bi bi-fullscreen"></i>
                                  <span className="ms-1">{t('buttons.fullscreen') || 'Full Screen'}</span>
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

            <div className="my-5" />

            <div className="article-actions">
              <Button
                variant="link"
                size="sm"
                className={`like-button d-inline-flex align-items-center gap-1 p-0 text-decoration-none ${liked ? 'text-danger' : ''}`}
                onClick={toggleLike}
                disabled={likeLoading || !article.is_published || article.status !== 'published' || (!user && !localStorage.getItem('access_token'))}
                title={
                  !article.is_published || article.status !== 'published'
                    ? t('articles.like_disabled') || 'Liking disabled for unpublished articles'
                    : (!user && !localStorage.getItem('access_token'))
                    ? t('auth.login_required_to_like') || 'Please log in to like articles'
                    : (liked ? t('buttons.unlike') || 'Unlike' : t('buttons.like') || 'Like')
                }
              >
                <FiHeart 
                  size={16}
                  fill={liked ? 'currentColor' : 'none'}
                />
                {article.like_count} {t('articles.likes')}
              </Button>
              
              <div className="article-actions-right">
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
                    {article.status === 'rejected' && article.rejection_reason && (
                      <div className="alert alert-danger mt-3">
                        <h6 className="alert-heading">
                          <strong>{t('moderation.rejection_reason_display')}</strong>
                        </h6>
                        <p className="mb-0">{article.rejection_reason}</p>
                      </div>
                    )}
                    {article.status === 'approved' && article.approval_comment && (
                      <div className="alert alert-info mt-3">
                        <h6 className="alert-heading">
                          <strong>{t('moderation.approval_comments')}</strong>
                        </h6>
                        <p className="mb-0">{article.approval_comment}</p>
                      </div>
                    )}
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
                      href={`/knowledges?category=${article.category.id}`}
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

      {/* Fullscreen File Preview Modal */}
      <Modal 
        show={!!fullscreenFile} 
        onHide={() => setFullscreenFile(null)}
        size="xl"
        fullscreen={true}
        className="file-fullscreen-modal"
      >
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>{fullscreenFile?.original_filename}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark p-0">
          {fullscreenFile && (
            <div className="fullscreen-file-container">
              {fullscreenFile.mime_type?.startsWith('image/') && (
                <img 
                  src={fullscreenFile.file} 
                  alt={fullscreenFile.original_filename}
                  className="fullscreen-file-image"
                  onError={(e) => {
                    console.error('[FullscreenPreview] Image failed to load:', fullscreenFile.file);
                    e.target.style.display = 'none';
                  }}
                />
              )}
              {fullscreenFile.mime_type === 'application/pdf' && (
                <iframe
                  src={`${fullscreenFile.file}#toolbar=1`}
                  className="fullscreen-file-pdf"
                  title={fullscreenFile.original_filename}
                  onLoad={() => console.debug('[FullscreenPreview] PDF iframe loaded')}
                  onError={(e) => console.error('[FullscreenPreview] PDF iframe error:', fullscreenFile.file, e)}
                />
              )}
              {fullscreenFile.mime_type?.startsWith('video/') && (
                <video
                  controls
                  autoPlay
                  className="fullscreen-file-video"
                  src={fullscreenFile.file}
                >
                  Your browser does not support the video tag.
                </video>
              )}
              {fullscreenFile.mime_type?.startsWith('audio/') && (
                <div className="fullscreen-audio-container">
                  <audio
                    controls
                    autoPlay
                    className="fullscreen-file-audio"
                    src={fullscreenFile.file}
                  >
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ArticleDetailPage;


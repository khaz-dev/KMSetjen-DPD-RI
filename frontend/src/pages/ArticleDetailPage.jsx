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
import { FaWhatsapp } from 'react-icons/fa';
import ImageWithFallback from '../components/ImageWithFallback';
import PptxViewer from '../components/PptxViewer';
import PdfViewer from '../components/PdfViewer';
import ArticleMetaLine from '../components/ArticleMetaLine';
import { getKnowledgeTypeInfo } from '../constants/knowledgeTypes';
import { getMediaEmbedInfo, extractDomain } from '../utils/mediaUtils';
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
  const [shareLoading, setShareLoading] = useState(false);
  const [fullscreenFile, setFullscreenFile] = useState(null);
  const [showInfographicModal, setShowInfographicModal] = useState(false);
  const [infographicZoom, setInfographicZoom] = useState(1);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [infographicViewMode, setInfographicViewMode] = useState('slides'); // 'slides' or 'continuous'
  const articleRef = React.useRef(null);

  const handleZoomIn = () => setInfographicZoom(prev => Math.min(Number((prev + 0.25).toFixed(2)), 3));
  const handleZoomOut = () => setInfographicZoom(prev => Math.max(Number((prev - 0.25).toFixed(2)), 0.5));
  const handleResetZoom = () => setInfographicZoom(1);

  // Helper function to get file preview type based on MIME type
  const getPreviewType = (mimeType) => {
    if (!mimeType || mimeType === 'link') return null;
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint') || mimeType.includes('openxmlformats-officedocument.presentationml')) return 'presentation';
    return null;
  };

  // Helper function to get Bootstrap icon for file type
  const getFileIcon = (mimeType) => {
    if (!mimeType) return 'bi-file';
    if (mimeType === 'link') return 'bi-link-45deg';
    if (mimeType.startsWith('image/')) return 'bi-image';
    if (mimeType === 'application/pdf') return 'bi-file-pdf';
    if (mimeType.startsWith('video/')) return 'bi-film';
    if (mimeType.startsWith('audio/')) return 'bi-music-note';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint') || mimeType.includes('openxmlformats-officedocument.presentationml')) return 'bi-file-earmark-ppt';
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
            publicAPI.recordView(idOrSlug).catch(() => {});
          }
        } catch {
          // Silently fail
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
      return;
    }

    // CRITICAL: Only authenticated users can like articles
    const token = localStorage.getItem('access_token');
    if (!token && !user) {
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

  const isInfografis = article.knowledge_type === 'infografis';
  const isAudiovisual = article.knowledge_type === 'audiovisual';
  const mediaEmbed = article.media_url ? getMediaEmbedInfo(article.media_url) : null;
  const firstMediaFile = (!article.media_url && article.files)
    ? article.files.find(f => f.mime_type?.startsWith('video/') || f.mime_type?.startsWith('audio/'))
    : null;
  const infographicImageSrc = article.image || article.image_url;

  const infographicSlides = (article?.infographic_images && Array.isArray(article.infographic_images) && article.infographic_images.length > 0)
    ? article.infographic_images
    : (infographicImageSrc ? [{
        id: 'main',
        image: infographicImageSrc,
        image_url: article.image_url,
        caption: title
      }] : []);

  const currentSlide = infographicSlides[activeSlideIndex] || infographicSlides[0];
  const currentSlideSrc = currentSlide ? (currentSlide.image || currentSlide.image_url) : null;

  const handleShare = async (platform) => {
    const encodedUrl = encodeURIComponent(articleUrl);
    const encodedTitle = encodeURIComponent(title);

    // Record share on backend with cooldown & anti-abuse protection
    if (article?.id && !shareLoading) {
      setShareLoading(true);
      try {
        const response = await publicAPI.recordShare(article.id, { platform });
        if (response.data?.success) {
          if (response.data.share_count !== undefined) {
            setArticle(prev => ({
              ...prev,
              share_count: response.data.share_count
            }));
          }
        }
      } catch (err) {
        console.error('Error recording share:', err);
      } finally {
        setShareLoading(false);
      }
    }

    switch (platform) {
      case 'whatsapp':
        window.open(
          `https://api.whatsapp.com/send?text=${encodedTitle}%0A%0A${encodedUrl}`,
          '_blank'
        );
        break;
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
    const getCleanFullText = () => {
      let text = artSummary || artContent || '';
      // Remove HTML tags if present
      text = text.replace(/<[^>]*>/g, '');
      // Remove extra whitespace
      text = text.replace(/\s+/g, ' ').trim();
      return text;
    };

    const fullExcerpt = getCleanFullText();
    const isExcerptTruncated = fullExcerpt.length > 120;
    const displayExcerpt = isExcerptTruncated ? `${fullExcerpt.substring(0, 120)}...` : fullExcerpt;

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
            <h6
              className="mb-2 article-list-item-title"
              title={artTitle}
            >
              {artTitle}
            </h6>
            {displayExcerpt && (
              <p
                className="mb-0 article-list-item-excerpt"
                title={fullExcerpt}
                style={{ cursor: isExcerptTruncated ? 'help' : 'pointer' }}
              >
                {displayExcerpt}
              </p>
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
          <span>•</span>
          <FiShare2 size={12} />
          <span>{art.share_count || 0}</span>
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
              {/* Infografis Hero Showcase (Mendukung Gambar Berantai / Multi-Slide) */}
              {isInfografis && (
                <div className="infografis-hero-showcase mb-4">
                  <div className="card border-0 shadow-sm overflow-hidden infografis-showcase-card">
                    <div className="infografis-card-header d-flex justify-content-between align-items-center px-3 py-2 border-bottom flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="badge bg-warning text-dark px-2 py-1">
                          <i className="bi bi-pie-chart-fill me-1"></i>
                          {isIndonesian ? 'Bentuk Infografis' : 'Infographic Format'}
                        </span>
                        {infographicSlides.length > 1 && (
                          <span className="badge bg-primary text-white px-2 py-1">
                            {isIndonesian
                              ? `Slide ${activeSlideIndex + 1} dari ${infographicSlides.length}`
                              : `Slide ${activeSlideIndex + 1} of ${infographicSlides.length}`}
                          </span>
                        )}
                        {/* Switcher Mode Tampilan jika slide lebih dari 1 */}
                        {infographicSlides.length > 1 && (
                          <div className="infographic-mode-switcher ms-sm-2" role="group">
                            <button
                              type="button"
                              className={`infographic-mode-btn ${infographicViewMode === 'slides' ? 'active' : ''}`}
                              onClick={() => setInfographicViewMode('slides')}
                              title={isIndonesian ? 'Tampilkan satu per satu dengan penampil slide interaktif' : 'Display one by one with interactive slide viewer'}
                            >
                              <i className="bi bi-collection-play me-1"></i> {isIndonesian ? 'Mode Slide' : 'Slide Mode'}
                            </button>
                            <button
                              type="button"
                              className={`infographic-mode-btn ${infographicViewMode === 'continuous' ? 'active' : ''}`}
                              onClick={() => setInfographicViewMode('continuous')}
                              title={isIndonesian ? 'Tampilkan seluruh lembar ke bawah secara utuh bersambung' : 'Display all sheets continuously'}
                            >
                              <i className="bi bi-view-stacked me-1"></i> {isIndonesian ? 'Mode Bersambung' : 'Continuous Mode'}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="infographic-zoom-btn"
                          onClick={() => {
                            setInfographicZoom(1);
                            setShowInfographicModal(true);
                          }}
                          title={isIndonesian ? 'Perbesar Tampilan / Zoom Lightbox' : 'Enlarge View / Zoom Lightbox'}
                        >
                          <i className="bi bi-arrows-fullscreen me-1"></i>
                          {isIndonesian ? 'Perbesar Visual' : 'Enlarge Visual'}
                        </Button>
                        {currentSlideSrc && (
                          <a
                            href={currentSlideSrc}
                            download={`${title || 'infografis'}-slide-${activeSlideIndex + 1}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-primary"
                            title={isIndonesian ? 'Unduh visual asli resolusi penuh' : 'Download original full-resolution visual'}
                          >
                            <i className="bi bi-download me-1"></i>
                            {isIndonesian ? 'Unduh' : 'Download'}
                          </a>
                        )}
                      </div>
                    </div>

                    {infographicSlides.length > 0 ? (
                      infographicViewMode === 'slides' || infographicSlides.length === 1 ? (
                        /* MODE SLIDE / CAROUSEL */
                        <div className="infografis-slide-view p-3">
                          <div
                            className="infografis-image-container p-2 text-center rounded position-relative shadow-sm"
                            style={{ cursor: 'zoom-in', minHeight: '320px' }}
                            onClick={() => {
                              setInfographicZoom(1);
                              setShowInfographicModal(true);
                            }}
                            title={isIndonesian ? 'Klik gambar untuk memperbesar (Interactive Lightbox)' : 'Click image to enlarge (Interactive Lightbox)'}
                          >
                            {/* Previous Slide Floating Button */}
                            {infographicSlides.length > 1 && (
                              <button
                                type="button"
                                className="infographic-float-nav-btn prev position-absolute top-50 start-0 translate-middle-y ms-2 btn btn-dark bg-opacity-75 text-white rounded-circle p-0 d-flex align-items-center justify-content-center shadow"
                                style={{ width: '42px', height: '42px', zIndex: 5 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveSlideIndex(prev => Math.max(0, prev - 1));
                                }}
                                disabled={activeSlideIndex === 0}
                                title={isIndonesian ? 'Slide Sebelumnya' : 'Previous Slide'}
                              >
                                <i className="bi bi-chevron-left fs-5"></i>
                              </button>
                            )}

                            {/* Main Active Slide Image */}
                            <img
                              src={currentSlideSrc}
                              alt={currentSlide?.caption || `${title} - Slide ${activeSlideIndex + 1}`}
                              className="img-fluid rounded infografis-main-image"
                              style={{
                                maxHeight: '750px',
                                width: 'auto',
                                maxWidth: '100%',
                                objectFit: 'contain',
                                display: 'inline-block',
                                transition: 'opacity 0.2s ease-in-out'
                              }}
                              onError={(e) => {
                                e.target.src = '/default-article-image.svg';
                              }}
                            />

                            {/* Next Slide Floating Button */}
                            {infographicSlides.length > 1 && (
                              <button
                                type="button"
                                className="infographic-float-nav-btn next position-absolute top-50 end-0 translate-middle-y me-2 btn btn-dark bg-opacity-75 text-white rounded-circle p-0 d-flex align-items-center justify-content-center shadow"
                                style={{ width: '42px', height: '42px', zIndex: 5 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveSlideIndex(prev => Math.min(infographicSlides.length - 1, prev + 1));
                                }}
                                disabled={activeSlideIndex === infographicSlides.length - 1}
                                title={isIndonesian ? 'Slide Berikutnya' : 'Next Slide'}
                              >
                                <i className="bi bi-chevron-right fs-5"></i>
                              </button>
                            )}

                            {/* Zoom Badge Hint */}
                            <div className="position-absolute bottom-0 end-0 m-3 px-3 py-1 bg-dark bg-opacity-75 text-white rounded-pill small shadow-sm pointer-events-none">
                              <i className="bi bi-zoom-in me-1"></i> {isIndonesian ? 'Klik untuk memperbesar / zoom' : 'Click to enlarge / zoom'}
                            </div>
                          </div>

                          {/* Caption if provided */}
                          {currentSlide?.caption && (
                            <div className="infographic-caption-text text-center small mt-2 fw-medium">
                              {currentSlide.caption}
                            </div>
                          )}

                          {/* Thumbnail Strip for Multi-Slide Navigation */}
                          {infographicSlides.length > 1 && (
                            <>
                              <div className="infographic-thumbnails-strip mt-3 d-flex align-items-center justify-content-center gap-2 overflow-auto py-2 px-1">
                                {infographicSlides.map((slide, idx) => {
                                  const slideSrc = slide.image || slide.image_url;
                                  const isActive = idx === activeSlideIndex;
                                  return (
                                    <button
                                      key={slide.id || idx}
                                      type="button"
                                      className={`infographic-thumb-btn position-relative rounded overflow-hidden p-0 border ${isActive ? 'border-primary border-3 shadow' : 'border-secondary-subtle opacity-75'}`}
                                      onClick={() => setActiveSlideIndex(idx)}
                                      style={{
                                        width: '84px',
                                        height: '60px',
                                        flexShrink: 0,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        outline: 'none'
                                      }}
                                      title={slide.caption || (isIndonesian ? `Slide ${idx + 1}` : `Slide ${idx + 1}`)}
                                    >
                                      <img
                                        src={slideSrc}
                                        alt={`Slide ${idx + 1}`}
                                        className="w-100 h-100 object-fit-cover"
                                        onError={(e) => {
                                          e.target.src = '/default-article-image.svg';
                                        }}
                                      />
                                      <span
                                        className={`position-absolute bottom-0 end-0 px-1 py-0 ${isActive ? 'bg-primary text-white' : 'bg-dark bg-opacity-75 text-white'}`}
                                        style={{ fontSize: '0.68rem', borderRadius: '3px 0 0 0' }}
                                      >
                                        #{idx + 1}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Bottom Navigation Buttons */}
                              <div className="d-flex justify-content-between align-items-center mt-2 px-1">
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  disabled={activeSlideIndex === 0}
                                  onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                                >
                                  <i className="bi bi-chevron-left me-1"></i> {isIndonesian ? 'Slide Sebelumnya' : 'Previous Slide'}
                                </Button>
                                <span className="infographic-counter-text small fw-semibold">
                                  {isIndonesian
                                    ? `Menampilkan lembar ${activeSlideIndex + 1} dari ${infographicSlides.length}`
                                    : `Showing sheet ${activeSlideIndex + 1} of ${infographicSlides.length}`}
                                </span>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  disabled={activeSlideIndex === infographicSlides.length - 1}
                                  onClick={() => setActiveSlideIndex(prev => Math.min(infographicSlides.length - 1, prev + 1))}
                                >
                                  {isIndonesian ? 'Slide Berikutnya' : 'Next Slide'} <i className="bi bi-chevron-right ms-1"></i>
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        /* MODE BERSAMBUNG / CONTINUOUS (SEMUA SLIDE TERTAMPIL UTUH BERURUTAN KE BAWAH) */
                        <div className="infographic-continuous-list d-flex flex-column gap-4 p-3">
                          {infographicSlides.map((slide, idx) => {
                            const slideSrc = slide.image || slide.image_url;
                            return (
                              <div
                                key={slide.id || idx}
                                className="infographic-continuous-item p-3 rounded shadow-sm border"
                              >
                                <div className="d-flex justify-content-between align-items-center mb-2 px-1 flex-wrap gap-2">
                                  <div className="d-flex align-items-center gap-2">
                                    <span className={`badge ${idx === 0 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                                      {isIndonesian
                                        ? `Lembar #${idx + 1} ${idx === 0 ? '(Sampul Utama)' : ''}`
                                        : `Sheet #${idx + 1} ${idx === 0 ? '(Main Cover)' : ''}`}
                                    </span>
                                    {slide.caption && (
                                      <span className="fw-semibold small text-truncate">
                                        {slide.caption}
                                      </span>
                                    )}
                                  </div>
                                  <div className="d-flex gap-2">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      className="py-0 px-2"
                                      style={{ fontSize: '0.8rem' }}
                                      onClick={() => {
                                        setActiveSlideIndex(idx);
                                        setInfographicZoom(1);
                                        setShowInfographicModal(true);
                                      }}
                                      title={isIndonesian ? 'Perbesar lembar ini' : 'Enlarge this sheet'}
                                    >
                                      <i className="bi bi-arrows-fullscreen me-1"></i> {isIndonesian ? 'Perbesar' : 'Enlarge'}
                                    </Button>
                                    <a
                                      href={slideSrc}
                                      download={`${title || 'infografis'}-slide-${idx + 1}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-sm btn-outline-secondary py-0 px-2"
                                      style={{ fontSize: '0.8rem' }}
                                      title={isIndonesian ? 'Unduh lembar ini' : 'Download this sheet'}
                                    >
                                      <i className="bi bi-download me-1"></i> {isIndonesian ? 'Unduh' : 'Download'}
                                    </a>
                                  </div>
                                </div>

                                <div
                                  className="infographic-continuous-image-box text-center p-2 rounded"
                                  style={{ cursor: 'zoom-in' }}
                                  onClick={() => {
                                    setActiveSlideIndex(idx);
                                    setInfographicZoom(1);
                                    setShowInfographicModal(true);
                                  }}
                                  title={isIndonesian ? 'Klik untuk memperbesar lembar ini' : 'Click to enlarge this sheet'}
                                >
                                  <img
                                    src={slideSrc}
                                    alt={slide.caption || `${title} - Lembar ${idx + 1}`}
                                    className="img-fluid rounded"
                                    style={{
                                      maxHeight: '850px',
                                      width: 'auto',
                                      maxWidth: '100%',
                                      objectFit: 'contain',
                                      display: 'inline-block',
                                      boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
                                    }}
                                    onError={(e) => {
                                      e.target.src = '/default-article-image.svg';
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      <div className="infographic-empty-state p-4 text-center">
                        <i className="bi bi-card-image fs-1 d-block mb-2 text-warning"></i>
                        <p className="mb-0">
                          {isIndonesian
                            ? 'Visual infografis belum dilampirkan pada artikel ini.'
                            : 'Infographic visuals have not been attached to this article.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Audiovisual Hero Showcase */}
              {isAudiovisual && (
                <div className="audiovisual-hero-showcase mb-4">
                  <div className="card border-0 shadow-sm overflow-hidden audiovisual-showcase-card">
                    <div className="audiovisual-card-header d-flex justify-content-between align-items-center px-3 py-2 bg-dark text-white">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-danger px-2 py-1">
                          <i className="bi bi-play-circle-fill me-1"></i>
                          Tayangan Audiovisual
                        </span>
                        {mediaEmbed?.platform && (
                          <span className="badge bg-secondary text-capitalize">
                            {mediaEmbed.platform === 'gdrive' ? 'Google Drive' : mediaEmbed.platform}
                          </span>
                        )}
                      </div>
                      {article.media_url && (
                        <a
                          href={article.media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
                          title="Buka tautan tayangan di tab baru"
                        >
                          <i className="bi bi-box-arrow-up-right"></i>
                          <span className="d-none d-sm-inline">Buka Sumber</span>
                        </a>
                      )}
                    </div>

                    <div className="audiovisual-player-body bg-black text-center">
                      {mediaEmbed?.type === 'embed' && (
                        <div className="ratio ratio-16x9">
                          <iframe
                            src={mediaEmbed.embedUrl}
                            title={title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="border-0 w-100 h-100"
                          ></iframe>
                        </div>
                      )}

                      {mediaEmbed?.type === 'video' && (
                        <div className="audiovisual-direct-video">
                          <video
                            controls
                            className="w-100"
                            style={{ maxHeight: '520px', backgroundColor: '#000' }}
                            src={mediaEmbed.originalUrl}
                            poster={article.image || article.image_url}
                          >
                            Browser Anda tidak mendukung pemutar video HTML5.
                          </video>
                        </div>
                      )}

                      {mediaEmbed?.type === 'audio' && (
                        <div className="p-4 bg-light text-dark text-center">
                          {article.image && (
                            <div className="mb-3">
                              <img
                                src={article.image || article.image_url}
                                alt={title}
                                className="rounded shadow-sm"
                                style={{ maxHeight: '240px', objectFit: 'cover' }}
                              />
                            </div>
                          )}
                          <h6 className="fw-bold mb-2">Rekaman Audio / Podcast</h6>
                          <audio controls className="w-100 mt-2" src={mediaEmbed.originalUrl}>
                            Browser Anda tidak mendukung pemutar audio HTML5.
                          </audio>
                        </div>
                      )}

                      {!mediaEmbed && firstMediaFile && (
                        <div className="audiovisual-attached-media">
                          {firstMediaFile.mime_type?.startsWith('video/') ? (
                            <video
                              controls
                              className="w-100"
                              style={{ maxHeight: '520px', backgroundColor: '#000' }}
                              src={firstMediaFile.file}
                              poster={article.image || article.image_url}
                            >
                              Browser Anda tidak mendukung pemutar video HTML5.
                            </video>
                          ) : (
                            <div className="p-4 bg-light text-dark text-center">
                              <audio controls className="w-100 mt-2" src={firstMediaFile.file}>
                                Browser Anda tidak mendukung pemutar audio HTML5.
                              </audio>
                            </div>
                          )}
                        </div>
                      )}

                      {!mediaEmbed && !firstMediaFile && (
                        <div className="position-relative">
                          {article.image ? (
                            <ImageWithFallback
                              src={article.image || article.image_url}
                              alt={title}
                              className="img-fluid w-100"
                              style={{ maxHeight: '420px', objectFit: 'cover' }}
                              type="article"
                            />
                          ) : (
                            <div className="p-5 text-center text-light bg-dark">
                              <i className="bi bi-film fs-1 text-danger d-block mb-2"></i>
                              <p className="mb-0">Media tayangan belum dilampirkan pada artikel ini.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Standard Featured Image (Bukan Infografis dan Bukan Audiovisual) */}
              {!isInfografis && !isAudiovisual && (article.image || article.image_url) && (
                <div className="article-featured-image">
                  <ImageWithFallback
                    src={article.image || article.image_url}
                    alt={title}
                    className="img-fluid rounded"
                    style={{ maxHeight: '400px', objectFit: 'cover', width: '100%' }}
                    type="article"
                  />
                </div>
              )}

              <header className="article-header">
                <h1 className="display-7 fw-bold">{title}</h1>

                <div className="article-meta mb-3">
                  {/* Category Badge - Custom Styled Span */}
                  {(() => {
                    const catColor = article.category?.color;
                    return (
                      <span
                        className="article-badge-custom me-2"
                        style={{
                          backgroundColor: catColor || '#0d6efd',
                          borderColor: catColor || '#0d6efd',
                          color: '#ffffff',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          display: 'inline-block',
                          border: '1px solid'
                        }}
                      >
                        {categoryName || t('common.no_results')}
                      </span>
                    );
                  })()}

                  {/* Knowledge Type Badge (Persekjen DPD RI No. 8/2026 Bab II Pasal 7) */}
                  {article.knowledge_type && (() => {
                    const typeInfo = getKnowledgeTypeInfo(article.knowledge_type);
                    return (
                      <span
                        className="article-badge-custom me-2"
                        style={{
                          backgroundColor: typeInfo?.color || '#0284c7',
                          borderColor: typeInfo?.color || '#0284c7',
                          color: '#ffffff',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          border: '1px solid',
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/knowledges?knowledge_type=${article.knowledge_type}`)}
                        title={`Bentuk Pengetahuan: ${isIndonesian ? (typeInfo?.name_id || article.knowledge_type_display) : (typeInfo?.name_en || article.knowledge_type_display)}`}
                      >
                        <span>{typeInfo?.emoji || '📋'}</span>
                        <span>
                          {isIndonesian 
                            ? (typeInfo?.name_id || article.knowledge_type_display) 
                            : (typeInfo?.name_en || article.knowledge_type_display)}
                        </span>
                      </span>
                    );
                  })()}

                  {/* Tag Badges - Custom Styled Spans */}
                  {article.tags?.map((tag) => {
                    const tagColor = tag.color;
                    return (
                      <span
                        key={tag.id}
                        className="article-badge-custom me-2"
                        style={{
                          backgroundColor: tagColor || '#6c757d',
                          borderColor: tagColor || '#6c757d',
                          color: '#ffffff',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          display: 'inline-block',
                          border: '1px solid'
                        }}
                      >
                        {isIndonesian ? tag.name_id : tag.name_en}
                      </span>
                    );
                  })}
                </div>

                <div className="article-detail-info-wrapper mb-3">
                  <ArticleMetaLine article={article} showViews={true} showShares={true} />
                </div>

              </header>

              {summary && (
                <div className="article-summary bg-light p-4 mb-4 rounded d-flex align-items-center">
                  <p className="text-muted fst-italic mb-0">{summary}</p>
                </div>
              )}

              {/* File Attachments */}
              {article.files && article.files.length > 0 && (
                <div className="article-attachments">
                  <h5 className="mb-4">{t('articles.file_attachments') || 'File Attachments'}</h5>
                  <div className="attachments-list">
                    {article.files.map((file) => {
                      const isFileLink = Boolean(file.is_link || file.mime_type === 'link' || (!file.file && file.link_url));
                      const previewType = isFileLink ? null : getPreviewType(file.mime_type);
                      const showPreview = expandedFilePreview[file.id] || false;
                      const fileTargetUrl = file.link_url || file.file;
                      const linkDomain = isFileLink ? extractDomain(fileTargetUrl) : null;

                      return (
                        <div key={file.id} className={`file-item-wrapper ${isFileLink ? 'link-item-wrapper' : ''}`}>
                          <div className="attachment-item">
                            <div className={`attachment-icon ${isFileLink ? 'bg-info bg-opacity-10 text-primary' : ''}`}>
                              <i className={`bi ${isFileLink ? 'bi-link-45deg' : getFileIcon(file.mime_type)}`}></i>
                            </div>
                            <div className="attachment-info">
                              <div
                                className="attachment-name d-flex align-items-center gap-2 flex-wrap"
                                title={file.original_filename || fileTargetUrl}
                              >
                                {isFileLink && (
                                  <span className="badge bg-info-subtle text-info border border-info-subtle" style={{ fontSize: '0.72rem' }}>
                                    Tautan / Link
                                  </span>
                                )}
                                <span className="fw-medium">{file.original_filename || fileTargetUrl}</span>
                              </div>
                              <small className="attachment-meta text-muted d-flex align-items-center gap-2 mt-1 flex-wrap">
                                {isFileLink && linkDomain && (
                                  <span className="badge bg-light text-dark border">
                                    <i className="bi bi-globe2 me-1"></i>{linkDomain}
                                  </span>
                                )}
                                {!isFileLink && <span>{file.file_size_display}</span>}
                                {file.description && <span>• {file.description}</span>}
                                <span>• {new Date(file.created_at).toLocaleDateString(isIndonesian ? 'id-ID' : 'en-US')}</span>
                              </small>
                            </div>
                            <div className="attachment-actions">
                              {isFileLink ? (
                                <a
                                  href={fileTargetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary d-inline-flex align-items-center"
                                  title="Buka tautan lampiran di tab baru"
                                >
                                  <i className="bi bi-box-arrow-up-right me-1"></i>
                                  <span>Buka Tautan</span>
                                </a>
                              ) : (
                                <>
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
                                </>
                              )}
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
                                  loading="lazy"
                                  decoding="async"
                                  onError={(e) => {
                                    console.error('[FilePreview] Image failed to load:', file.file);
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}
                              {previewType === 'pdf' && (
                                <PdfViewer
                                  fileUrl={file.preview_url || file.file}
                                  fileId={file.id}
                                  fileName={file.original_filename}
                                  className="file-preview-pdf"
                                  toolbar={1}
                                  onError={(e) => console.error('[FilePreview] PDF error:', file.preview_url || file.file, e)}
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
                              {previewType === 'presentation' && (
                                <PptxViewer
                                  fileUrl={file.file}
                                  fileName={file.original_filename}
                                  onError={(err) => console.error('[FilePreview] PptxViewer error:', err)}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
                  className="me-2 d-inline-flex align-items-center"
                  onClick={() => setShowShareModal(true)}
                  title={t('articles.share')}
                >
                  <FiShare2 className="me-2" style={{ display: 'inline' }} />
                  {t('articles.share')}
                  {article.share_count !== undefined && (
                    <span className="badge bg-primary-subtle text-primary ms-2 px-2 py-1 rounded-pill">
                      {article.share_count}
                    </span>
                  )}
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
                      <strong>{t('articles.creator_original', 'Penyusun / Penulis Asli')}:</strong><br />
                      <span>{article.creator_name || article.author_name || '-'}</span>
                    </p>
                    <p>
                      <strong>{t('articles.published_by', 'Dipublikasikan Oleh')}:</strong><br />
                      <span>{article.uploader_name || article.author_name || '-'}</span>
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
                    {article.knowledge_type && (() => {
                      const typeInfo = getKnowledgeTypeInfo(article.knowledge_type);
                      return (
                        <div className="knowledge-type-sidebar-box mt-3 p-3 rounded border">
                          <div className="small text-muted fw-bold mb-1">
                            {t('articles.knowledge_form')}:
                          </div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span style={{ fontSize: '1.2rem' }}>{typeInfo?.emoji || '📋'}</span>
                            <span className="fw-bold text-primary">
                              {isIndonesian 
                                ? (typeInfo?.name_id || article.knowledge_type_display) 
                                : (typeInfo?.name_en || article.knowledge_type_display)}
                            </span>
                          </div>
                          <div className="small text-secondary mb-2">
                            {isIndonesian ? typeInfo?.cluster_title_id : typeInfo?.cluster_title_en}
                          </div>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="w-100"
                            onClick={() => navigate(`/knowledges?knowledge_type=${article.knowledge_type}`)}
                          >
                            {isIndonesian ? `Semua ${typeInfo?.name_id || ''}` : `All ${typeInfo?.name_en || ''}`}
                          </Button>
                        </div>
                      );
                    })()}
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
            <div className="d-flex align-items-center justify-content-between mb-3 text-muted small bg-light p-2 rounded">
              <span><FiShare2 className="me-1 text-primary" /> {t('articles.share')}:</span>
              <strong className="text-dark">{article.share_count || 0} {t('articles.shares', 'dibagikan')}</strong>
            </div>
            <div className="mb-3">
              <p className="mb-3">{t('articles.share_article')}</p>
              <div className="d-grid gap-2">
                <Button
                  variant="light"
                  className="text-start"
                  onClick={() => handleShare('whatsapp')}
                >
                  <FaWhatsapp className="me-2" style={{ color: '#25D366' }} />
                  {t('articles.share_whatsapp')}
                </Button>
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
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    console.error('[FullscreenPreview] Image failed to load:', fullscreenFile.file);
                    e.target.style.display = 'none';
                  }}
                />
              )}
              {fullscreenFile.mime_type === 'application/pdf' && (
                <PdfViewer
                  fileUrl={fullscreenFile.preview_url || fullscreenFile.file}
                  fileId={fullscreenFile.id}
                  fileName={fullscreenFile.original_filename}
                  className="fullscreen-file-pdf"
                  toolbar={1}
                  onError={(e) => console.error('[FullscreenPreview] PDF error:', fullscreenFile.preview_url || fullscreenFile.file, e)}
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
              {(fullscreenFile.mime_type?.includes('presentation') || fullscreenFile.mime_type?.includes('powerpoint')) && (
                <div className="fullscreen-pptx-container">
                  <PptxViewer
                    fileUrl={fullscreenFile.file}
                    fileName={fullscreenFile.original_filename}
                    onError={(err) => console.error('[FullscreenPreview] PptxViewer error:', err)}
                  />
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Infographic Lightbox Modal with Interactive Zoom & Multi-Slide Navigation */}
      <Modal
        show={showInfographicModal}
        onHide={() => setShowInfographicModal(false)}
        size="xl"
        fullscreen={true}
        className="infographic-lightbox-modal"
      >
        <Modal.Header closeButton className="bg-dark text-white border-secondary py-2">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="badge bg-warning text-dark px-2 py-1">
              <i className="bi bi-pie-chart-fill me-1"></i> {isIndonesian ? 'Infografis' : 'Infographic'}
            </span>
            {infographicSlides.length > 1 && (
              <span className="badge bg-info text-dark px-2 py-1">
                Slide {activeSlideIndex + 1} / {infographicSlides.length}
              </span>
            )}
            <Modal.Title className="fs-6 text-truncate mb-0" style={{ maxWidth: '350px' }} title={title}>
              {currentSlide?.caption || title}
            </Modal.Title>
          </div>
          <div className="ms-auto me-3 d-flex align-items-center gap-2 flex-wrap">
            <div className="btn-group btn-group-sm bg-secondary bg-opacity-25 rounded p-1">
              <Button
                variant="dark"
                size="sm"
                onClick={handleZoomOut}
                disabled={infographicZoom <= 0.5}
                title={isIndonesian ? 'Perkecil (-)' : 'Zoom Out (-)'}
              >
                <i className="bi bi-zoom-out"></i>
              </Button>
              <span className="px-2 py-1 text-white small font-monospace d-flex align-items-center">
                {Math.round(infographicZoom * 100)}%
              </span>
              <Button
                variant="dark"
                size="sm"
                onClick={handleZoomIn}
                disabled={infographicZoom >= 3}
                title={isIndonesian ? 'Perbesar (+)' : 'Zoom In (+)'}
              >
                <i className="bi bi-zoom-in"></i>
              </Button>
              <Button
                variant="dark"
                size="sm"
                onClick={handleResetZoom}
                title={isIndonesian ? 'Reset Zoom (100%)' : 'Reset Zoom (100%)'}
              >
                <i className="bi bi-arrow-counterclockwise"></i>
              </Button>
            </div>
            {currentSlideSrc && (
              <a
                href={currentSlideSrc}
                download={`${title || 'infografis'}-slide-${activeSlideIndex + 1}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-primary d-inline-flex align-items-center"
                title={isIndonesian ? 'Unduh visual asli resolusi penuh' : 'Download original full-resolution visual'}
              >
                <i className="bi bi-download me-1"></i>
                <span className="d-none d-sm-inline">{isIndonesian ? 'Unduh Visual' : 'Download Visual'}</span>
              </a>
            )}
          </div>
        </Modal.Header>
        <Modal.Body className="bg-dark p-0 d-flex align-items-center justify-content-center position-relative overflow-auto" style={{ minHeight: '85vh' }}>
          {/* Floating Left Button for Previous Slide in Modal */}
          {infographicSlides.length > 1 && (
            <button
              type="button"
              className="position-fixed top-50 start-0 translate-middle-y ms-3 btn btn-dark bg-opacity-75 text-white rounded-circle p-0 d-flex align-items-center justify-content-center shadow-lg border border-secondary"
              style={{ width: '48px', height: '48px', zIndex: 1050 }}
              onClick={() => {
                setActiveSlideIndex(prev => Math.max(0, prev - 1));
                setInfographicZoom(1);
              }}
              disabled={activeSlideIndex === 0}
              title={isIndonesian ? 'Slide Sebelumnya (Arrow Left)' : 'Previous Slide (Arrow Left)'}
            >
              <i className="bi bi-chevron-left fs-4"></i>
            </button>
          )}

          <div
            className="p-3 text-center position-relative"
            style={{
              transform: `scale(${infographicZoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-out',
              maxWidth: '100%',
              userSelect: 'none'
            }}
          >
            <img
              src={currentSlideSrc}
              alt={currentSlide?.caption || `${title} - Slide ${activeSlideIndex + 1}`}
              style={{
                maxHeight: '85vh',
                maxWidth: '100%',
                objectFit: 'contain',
                borderRadius: '4px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
              }}
              onError={(e) => {
                e.target.src = '/default-article-image.svg';
              }}
            />
            {currentSlide?.caption && (
              <div className="mt-2 text-white-50 small bg-dark bg-opacity-75 px-3 py-1 rounded-pill d-inline-block">
                {currentSlide.caption}
              </div>
            )}
          </div>

          {/* Floating Right Button for Next Slide in Modal */}
          {infographicSlides.length > 1 && (
            <button
              type="button"
              className="position-fixed top-50 end-0 translate-middle-y me-3 btn btn-dark bg-opacity-75 text-white rounded-circle p-0 d-flex align-items-center justify-content-center shadow-lg border border-secondary"
              style={{ width: '48px', height: '48px', zIndex: 1050 }}
              onClick={() => {
                setActiveSlideIndex(prev => Math.min(infographicSlides.length - 1, prev + 1));
                setInfographicZoom(1);
              }}
              disabled={activeSlideIndex === infographicSlides.length - 1}
              title={isIndonesian ? 'Slide Berikutnya (Arrow Right)' : 'Next Slide (Arrow Right)'}
            >
              <i className="bi bi-chevron-right fs-4"></i>
            </button>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ArticleDetailPage;


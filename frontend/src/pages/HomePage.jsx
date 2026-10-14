import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { publicAPI, getArticleUrl } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';
import { 
  FiEye, FiHeart, FiFileText, FiBell, FiBook, 
  FiBarChart2, FiRss, FiFolder, FiTag, FiHome, FiUsers,
  FiLayers, FiActivity, FiTrendingUp, FiExternalLink, FiChevronLeft, FiChevronRight,
  FiBookmark, FiAward
} from 'react-icons/fi';
import ImageWithFallback from '../components/ImageWithFallback';
import ArticleMetaLine from '../components/ArticleMetaLine';
import { getDefaultImages, getAssetPath } from '../utils/imageUtils';
import { 
  KNOWLEDGE_CLUSTERS, 
  KNOWLEDGE_TYPES, 
  getKnowledgeTypeInfo 
} from '../constants/knowledgeTypes';
import './HomePage.css';

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
 * Calculate perceived luminance of a color
 * Returns a value between 0 (dark) and 1 (light)
 */
const getLuminance = (hexColor) => {
  try {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate perceived luminance using standard formula
    // https://www.w3.org/TR/AERT/#color-contrast
    return (r * 299 + g * 587 + b * 114) / 1000 / 255;
  } catch (e) {
    return 0.5; // Default to middle gray on error
  }
};

/**
 * Determine if text should be light or dark based on background color
 */
const getContrastColor = (hexColor) => {
  const luminance = getLuminance(hexColor);
  // If background is light (luminance > 0.5), use dark text; otherwise use light text
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

/**
 * Map icon names to React icon components
 */
const getIconComponent = (iconName) => {
  if (!iconName) return null;
  
  // If it's an emoji, return it as is
  if (/\p{Emoji}/u.test(iconName)) {
    return iconName;
  }
  
  // Map icon names to Feather Icon components
  const iconMap = {
    'file-text': FiFileText,
    'bell': FiBell,
    'book': FiBook,
    'bar-chart': FiBarChart2,
    'newspaper': FiRss,
    'folder': FiFolder,
    'tag': FiTag,
    'home': FiHome,
    'users': FiUsers,
    'layers': FiLayers,
    'activity': FiActivity,
    'trending-up': FiTrendingUp,
  };
  
  const IconComponent = iconMap[iconName.toLowerCase()];
  return IconComponent || null;
};

/**
 * Render category icon with proper styling
 */
const renderCategoryIcon = (iconName, size = 28) => {
  if (!iconName) {
    return null;
  }
  
  // Check if it's an emoji
  if (/\p{Emoji}/u.test(iconName)) {
    return <span title={iconName} style={{ fontSize: `${size}px`, display: 'flex', alignItems: 'center' }}>{iconName}</span>;
  }
  
  // Try to get the icon component
  const IconComponent = getIconComponent(iconName);
  if (IconComponent) {
    return <IconComponent title={iconName} size={size} style={{ minWidth: `${size}px`, minHeight: `${size}px` }} />;
  }
  
  // Fallback: don't render anything if icon not found
  return null;
};

/**
 * HomePage Component
 * Landing page with featured articles and categories
 */
const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isIndonesian } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [knowledgeClustersStats, setKnowledgeClustersStats] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [isCarouselHovering, setIsCarouselHovering] = useState(false);
  const abortControllerRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    // Wait for auth context to finish loading before fetching data
    if (authLoading) {
      return;
    }

    // Create abort controller for canceling requests on unmount
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const loadContent = async () => {
      try {
        setArticlesLoading(true);
        setCategoriesLoading(true);
        
        // Load featured/popular articles, categories, and knowledge types in parallel
        const [articlesRes, categoriesRes, knowledgeTypesRes] = await Promise.all([
          publicAPI.getPopularArticles(),
          publicAPI.getCategories({ page_size: 6 }),
          publicAPI.getKnowledgeTypes().catch(() => ({ data: { clusters: {} } })),
        ]);
        
        // Only update state if the request wasn't aborted
        if (!abortController.signal.aborted) {
          setFeaturedArticles(articlesRes.data.results?.slice(0, 6) || []);
          setCategories(categoriesRes.data.results || []);
          setKnowledgeClustersStats(knowledgeTypesRes.data?.clusters || {});
          setArticlesLoading(false);
          setCategoriesLoading(false);
        }
      } catch (error) {
        // Don't log errors if the request was aborted (component unmounted)
        if (!abortController.signal.aborted) {
          console.error('Error loading homepage content:', error);
          setArticlesLoading(false);
          setCategoriesLoading(false);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setInitialLoading(false);
        }
      }
    };

    loadContent();

    // Cleanup: abort any in-flight requests when component unmounts
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [authLoading]);

  // Auto-scroll carousel every 5 seconds (paused when hovering)
  useEffect(() => {
    if (featuredArticles.length === 0 || isCarouselHovering) return;

    const autoScrollInterval = setInterval(() => {
      setCurrentArticleIndex((prev) => {
        return (prev + 1) % featuredArticles.length;
      });
    }, 5000); // Auto-scroll every 5 seconds

    return () => clearInterval(autoScrollInterval);
  }, [featuredArticles.length, isCarouselHovering]);

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Button-controlled carousel navigation
  const handlePrevArticle = () => {
    setCurrentArticleIndex((prev) => {
      if (featuredArticles.length === 0) return 0;
      // Infinite loop: go to last item if at first
      return prev === 0 ? featuredArticles.length - 1 : prev - 1;
    });
  };

  const handleNextArticle = () => {
    setCurrentArticleIndex((prev) => {
      if (featuredArticles.length === 0) return 0;
      // Infinite loop: go to first item if at last
      return (prev + 1) % featuredArticles.length;
    });
  };

  // Handle dot pagination click
  const handleDotClick = (index) => {
    setCurrentArticleIndex(index);
  };

  // Handle carousel mouse enter - pause auto-scroll
  const handleCarouselMouseEnter = () => {
    setIsCarouselHovering(true);
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  // Handle carousel mouse leave - resume auto-scroll after 1 second of no movement
  const handleCarouselMouseLeave = () => {
    // Set a timeout to resume scrolling after 1 second
    hoverTimeoutRef.current = setTimeout(() => {
      setIsCarouselHovering(false);
    }, 1000);
  };

  // Handle carousel mouse move - reset the hover timeout
  const handleCarouselMouseMove = () => {
    // If already hovering, reset the timeout for resuming
    if (isCarouselHovering && hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        setIsCarouselHovering(false);
      }, 1000);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/knowledges?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  if (initialLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">{t('messages.loading')}</span>
        </Spinner>
      </div>
    );
  }

  const images = getDefaultImages();

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col md={6} className="mb-4 mb-md-0">
              <h1 className="display-4 fw-bold mb-4">{t('home.title')}</h1>
              <p className="lead mb-4">
                {t('home.subtitle')}
              </p>
              <Form onSubmit={handleSearch} className="search-form">
                <Form.Group className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    placeholder={t('home.search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  <Button variant="light" type="submit" className="search-button">
                    {t('buttons.search')}
                  </Button>
                </Form.Group>
              </Form>
              <div className="mt-4 d-flex flex-wrap gap-3 align-items-center">
                <Link to="/guide" className="guide-button">
                  📖 {t('userguide.title', 'User Guide')}
                </Link>
                <p className="text-white small mb-0 opacity-75">
                  {t('home.learn_how_to_use', 'Learn how to use the system')}
                </p>
              </div>
            </Col>
            <Col md={6}>
              <div className="hero-image">
                <img
                  src={images.LOGO}
                  alt="KMS Logo"
                  className="hero-logo"
                  loading="eager"
                  decoding="async"
                  fetchpriority="high"
                  width="200"
                  height="200"
                />
                <svg viewBox="0 0 500 500" className="hero-svg">
                  <circle cx="250" cy="250" r="250" fill="rgba(255,255,255,0.1)" />
                  <circle cx="250" cy="250" r="200" fill="rgba(255,255,255,0.2)" />
                  <circle cx="250" cy="250" r="150" fill="rgba(255,255,255,0.2)" />
                </svg>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Featured Articles */}
      <section className="py-5 articles-section-light">
        <Container>
          <h2>{t('home.popular_articles')}</h2>
          <div 
            className="articles-scroll-container" 
            style={{ opacity: articlesLoading ? 0.6 : 1, transition: 'opacity 0.3s ease', position: 'relative' }}
            onMouseEnter={handleCarouselMouseEnter}
            onMouseLeave={handleCarouselMouseLeave}
            onMouseMove={handleCarouselMouseMove}
          >
            {articlesLoading && (
              <div className="section-loading">
                <Spinner animation="border" size="sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            )}
            {featuredArticles.length > 0 ? (
              <>
                {/* Left Navigation Button */}
                <button 
                  className="carousel-nav-btn carousel-nav-left"
                  onClick={handlePrevArticle}
                  aria-label={t('buttons.previous') || 'Previous'}
                  title={t('buttons.previous') || 'Previous'}
                >
                  <FiChevronLeft size={24} />
                </button>

                {/* Articles Carousel */}
                <div className="articles-scroll">
                  <div 
                    className="articles-scroll-wrapper"
                    style={{
                      transform: `translateX(calc(-${0 * (360 + 32)}px))`,
                      transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                    }}
                  >
                  {(() => {
                    // Show 3 items: previous, current, next (infinite loop)
                    const total = featuredArticles.length;
                    if (total === 0) return null;
                    
                    const itemsToShow = [];
                    
                    // Previous item (with infinite loop)
                    const prevIndex = (currentArticleIndex - 1 + total) % total;
                    itemsToShow.push({ article: featuredArticles[prevIndex], position: 'prev' });
                    
                    // Current item (center)
                    itemsToShow.push({ article: featuredArticles[currentArticleIndex], position: 'current' });
                    
                    // Next item (with infinite loop)
                    const nextIndex = (currentArticleIndex + 1) % total;
                    itemsToShow.push({ article: featuredArticles[nextIndex], position: 'next' });
                    
                    return itemsToShow.map(({ article, position }) => (
                      <div key={`${article.id}-${position}`} className={`article-scroll-item ${position}`}>
                        <Card className="article-card h-100 shadow-sm">
                        <div className="article-image-container">
                          <ImageWithFallback 
                            src={article.image} 
                            alt={isIndonesian ? article.title_id : article.title_en}
                            className="article-image"
                            type="article"
                          />
                          {/* Badges on Image Overlay */}
                          <div className="article-badges-overlay">
                            {article.category && (
                              <div 
                                className="article-category-badge"
                                style={{
                                  backgroundColor: article.category.color || '#0d9488',
                                  color: getContrastColor(article.category.color || '#0d9488')
                                }}
                                title={isIndonesian ? (article.category?.name_id || article.category?.name_en) : (article.category?.name_en || article.category?.name_id)}
                              >
                                {article.category.icon && (
                                  <span className="badge-icon">
                                    {renderCategoryIcon(article.category.icon, 16)}
                                  </span>
                                )}
                                <span className="badge-text">
                                  {isIndonesian ? (article.category?.name_id || article.category?.name_en) : (article.category?.name_en || article.category?.name_id)}
                                </span>
                              </div>
                            )}
                            {article.knowledge_type && (() => {
                              const typeInfo = getKnowledgeTypeInfo(article.knowledge_type);
                              return (
                                <div 
                                  className="article-knowledge-badge-home"
                                  style={{
                                    backgroundColor: typeInfo?.color || '#2563eb',
                                    color: '#ffffff'
                                  }}
                                  title={`Bentuk Pengetahuan: ${isIndonesian ? typeInfo?.name_id : typeInfo?.name_en}`}
                                >
                                  <span>{typeInfo?.emoji || '📄'}</span>
                                  <span>{isIndonesian ? typeInfo?.name_id : typeInfo?.name_en}</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        <Card.Body className="d-flex flex-column">
                          <h5 className="card-title" title={isIndonesian ? article.title_id : article.title_en}>{isIndonesian ? article.title_id : article.title_en}</h5>
                          <p className="card-text article-summary flex-grow-1" title={isIndonesian ? article.summary_id : article.summary_en}>{isIndonesian ? article.summary_id : article.summary_en}</p>
                          
                          {/* Article Meta Information */}
                          <div className="article-meta mt-3" style={{ transition: 'none' }}>
                            <ArticleMetaLine article={article} compact={true} />
                            <div className="meta-row mt-2">
                              <small className="text-muted d-flex align-items-center gap-1">
                                <FiEye size={14} />
                                {article.view_count} {t('articles.views')}
                              </small>
                              <span className="meta-separator">•</span>
                              <small className="text-muted d-flex align-items-center gap-1">
                                <FiHeart size={14} />
                                {article.like_count} {t('articles.likes')}
                              </small>
                            </div>
                          </div>
                        </Card.Body>
                        <Card.Footer className="bg-transparent d-flex justify-content-end">
                          <Link to={getArticleUrl(article)} className="btn btn-sm btn-primary">
                            {t('buttons.read_more')}
                          </Link>
                        </Card.Footer>
                      </Card>
                      </div>
                    ));
                  })()}
                  </div>
                </div>

                {/* Right Navigation Button */}
                <button 
                  className="carousel-nav-btn carousel-nav-right"
                  onClick={handleNextArticle}
                  aria-label={t('buttons.next') || 'Next'}
                  title={t('buttons.next') || 'Next'}
                >
                  <FiChevronRight size={24} />
                </button>

                {/* Dot Pagination */}
                <div className="carousel-dots">
                  {featuredArticles.map((_, index) => (
                    <button
                      key={`dot-${index}`}
                      className={`carousel-dot ${index === currentArticleIndex ? 'active' : ''}`}
                      onClick={() => handleDotClick(index)}
                      aria-label={`Go to article ${index + 1}`}
                      aria-current={index === currentArticleIndex ? 'true' : 'false'}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-5">
                <p className="text-muted">{t('home.no_articles')}</p>
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Bentuk Pengetahuan */}
      <section className="py-5 knowledge-clusters-section">
        <Container>
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4">
            <div>
              <h2 className="mb-2 fw-bold">
                {isIndonesian ? 'Bentuk Pengetahuan' : 'Knowledge Forms'}
              </h2>
              <p className="text-muted mb-0" style={{ maxWidth: '800px' }}>
                {isIndonesian 
                  ? 'Temukan berbagai format dokumentasi pengetahuan yang tersedia di lingkungan Sekretariat Jenderal DPD RI untuk menunjang produktivitas dan wawasan kerja.'
                  : 'Explore various knowledge formats available across the Secretariat General of DPD RI to support productivity and insights.'}
              </p>
            </div>
            <div className="mt-3 mt-md-0">
              <Link to="/knowledges" className="btn btn-outline-primary px-3 py-2 fw-semibold">
                {t('buttons.view')} {t('articles.title')} →
              </Link>
            </div>
          </div>

          <Row className="g-4">
            {KNOWLEDGE_CLUSTERS.map((cluster) => {
              const stats = knowledgeClustersStats[cluster.code] || {};
              const count = stats.count ?? 0;
              return (
                <Col lg={3} md={6} key={cluster.code}>
                  <div 
                    className="knowledge-cluster-card h-100 d-flex flex-column"
                    style={{
                      '--cluster-accent': cluster.color,
                      '--cluster-bg': cluster.bgLight
                    }}
                  >
                    <div className="cluster-card-header d-flex align-items-center justify-content-between mb-3">
                      <span className="cluster-header-pill">
                        {isIndonesian ? cluster.short_title_id : cluster.short_title_en}
                      </span>
                      <span className="cluster-count-badge">
                        <strong>{count}</strong> {t('nav.articles', 'Pengetahuan')}
                      </span>
                    </div>

                    <h4 className="cluster-title mb-2">
                      {isIndonesian ? cluster.title_id : cluster.title_en}
                    </h4>

                    <p className="cluster-desc text-secondary small flex-grow-1 mb-3">
                      {isIndonesian ? cluster.description_id : cluster.description_en}
                    </p>

                    <div className="cluster-types-pills d-flex flex-wrap gap-1 mb-3">
                      {cluster.types.map((typeKey) => {
                        const typeInfo = KNOWLEDGE_TYPES[typeKey];
                        return (
                          <span key={typeKey} className="cluster-sub-pill">
                            {typeInfo?.emoji} {isIndonesian ? typeInfo?.name_id : typeInfo?.name_en}
                          </span>
                        );
                      })}
                    </div>

                    <Link
                      to={`/knowledges?knowledge_cluster=${cluster.code}`}
                      className="btn btn-sm cluster-action-btn mt-auto text-center"
                    >
                      {isIndonesian ? 'Jelajahi' : 'Explore'} →
                    </Link>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Container>
      </section>

      {/* Categories */}
      <section className="py-5 categories-section-light">
        <Container>
          <h2>{t('home.browse_categories')}</h2>
          <Row style={{ opacity: categoriesLoading ? 0.6 : 1, transition: 'opacity 0.3s ease', position: 'relative' }}>
            {categoriesLoading && (
              <div className="section-loading">
                <Spinner animation="border" size="sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            )}
            {categories.length > 0 ? (
              categories.map((category) => (
                <Col md={4} key={category.id} className="mb-4">
                  <Link
                    to={`/knowledges?category=${category.id}`}
                    className="category-link"
                  >
                    <Card className="category-card h-100" style={{
                      borderLeft: category.color ? `4px solid ${category.color}` : '4px solid #007bff',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}>
                      <div className="category-image-container" style={{ position: 'relative' }}>
                        {category.icon && (
                          <div className="category-icon-badge" style={{
                            backgroundColor: category.color || '#14b8a6',
                            color: 'white'
                          }}>
                            {renderCategoryIcon(category.icon)}
                          </div>
                        )}
                        <ImageWithFallback 
                          src={category.image} 
                          alt={isIndonesian ? category.name_id : category.name_en}
                          className="category-image"
                          type="category"
                        />
                        <div className="category-image-overlay"></div>
                        
                        {/* Article Count Badge */}
                        <div className="category-article-badge">
                          <span className="badge-number">{category.article_count || 0}</span>
                          <span className="badge-label">{t('home.articles_count')}</span>
                        </div>
                      </div>
                      
                      <Card.Body className="d-flex flex-column">
                        <h5 
                          className="category-title" 
                          title={isIndonesian ? category.name_id : category.name_en}
                        >
                          {isIndonesian ? category.name_id : category.name_en}
                        </h5>
                        
                        {/* Category Description */}
                        {(() => {
                          const desc = isIndonesian ? category.description_id : category.description_en;
                          if (!desc) return null;
                          const isTruncated = desc.length > 100;
                          return (
                            <p 
                              className="category-description text-muted flex-grow-1 small"
                              title={desc}
                              style={{ cursor: isTruncated ? 'help' : 'default' }}
                            >
                              {isTruncated ? `${desc.substring(0, 100)}...` : desc}
                            </p>
                          );
                        })()}
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
              ))
            ) : (
              <Col className="text-center py-5">
                <p className="text-muted">{t('home.no_categories')}</p>
              </Col>
            )}
          </Row>
        </Container>
      </section>

      {/* Related Repositories */}
      <section className="py-5 repositories-section">
        <Container>
          <h2 className="mb-2">{t('home.explore_repositories')}</h2>
          <p className="text-muted mb-4">{t('home.explore_repositories_subtitle')}</p>
          <Row>
            {/* Perpustakaan DPD RI */}
            <Col md={4} className="mb-3">
              <Card className="repository-card h-100" style={{ borderLeft: '4px solid #f39c12' }}>
                <div className="repository-image-container">
                  <ImageWithFallback 
                    src={getAssetPath('perpustakaan.webp')} 
                    alt={t('home.perpustakaan_title')}
                    className="repository-image"
                    type="repository"
                    loading="lazy"
                    decoding="async"
                    width="400"
                    height="240"
                  />
                  <div className="repository-image-overlay"></div>
                  <div className="repository-icon-badge" style={{ backgroundColor: '#f39c12' }}>
                    <FiBook size={20} color="white" />
                  </div>
                  <div className="repository-status-badge">
                    <span className="badge bg-warning text-dark">
                      {t('home.perpustakaan_status')}
                    </span>
                  </div>
                </div>
                <Card.Body className="d-flex flex-column">
                  <h5 className="mb-2">{t('home.perpustakaan_title')}</h5>
                  <p className="text-muted flex-grow-1 small">
                    {t('home.perpustakaan_desc')}
                  </p>
                  <button className="btn btn-sm btn-outline-secondary w-100" disabled>
                    {t('home.open_external')}
                  </button>
                </Card.Body>
              </Card>
            </Col>

            {/* JDIH DPD RI */}
            <Col md={4} className="mb-3">
              <Card className="repository-card h-100" style={{ borderLeft: '4px solid #3498db' }}>
                <div className="repository-image-container">
                  <ImageWithFallback 
                    src={getAssetPath('jdih.webp')} 
                    alt={t('home.jdih_title')}
                    className="repository-image"
                    type="repository"
                    loading="lazy"
                    decoding="async"
                    width="400"
                    height="240"
                  />
                  <div className="repository-image-overlay"></div>
                  <div className="repository-icon-badge" style={{ backgroundColor: '#3498db' }}>
                    <FiFileText size={20} color="white" />
                  </div>
                </div>
                <Card.Body className="d-flex flex-column">
                  <h5 className="mb-2">{t('home.jdih_title')}</h5>
                  <p className="text-muted flex-grow-1 small">
                    {t('home.jdih_desc')}
                  </p>
                  <a 
                    href="https://jdih.dpd.go.id/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-primary w-100"
                  >
                    <FiExternalLink size={14} className="me-1" />
                    {t('home.open_external')}
                  </a>
                </Card.Body>
              </Card>
            </Col>

            {/* PPID DPD RI */}
            <Col md={4} className="mb-3">
              <Card className="repository-card h-100" style={{ borderLeft: '4px solid #e74c3c' }}>
                <div className="repository-image-container">
                  <ImageWithFallback 
                    src={getAssetPath('ppid.webp')} 
                    alt={t('home.ppid_title')}
                    className="repository-image"
                    type="repository"
                    loading="lazy"
                    decoding="async"
                    width="400"
                    height="240"
                  />
                  <div className="repository-image-overlay"></div>
                  <div className="repository-icon-badge" style={{ backgroundColor: '#e74c3c' }}>
                    <FiUsers size={20} color="white" />
                  </div>
                </div>
                <Card.Body className="d-flex flex-column">
                  <h5 className="mb-2">{t('home.ppid_title')}</h5>
                  <p className="text-muted flex-grow-1 small">
                    {t('home.ppid_desc')}
                  </p>
                  <a 
                    href="https://ppid.dpd.go.id/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-primary w-100"
                  >
                    <FiExternalLink size={14} className="me-1" />
                    {t('home.open_external')}
                  </a>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Call to Action */}
      <section className="cta-section py-5 text-white">
        <Container className="text-center">
          <h2 className="mb-4">{t('home.share_knowledge')}</h2>
          <p className="lead mb-4">
            {t('home.share_subtitle')}
          </p>
          <button onClick={() => navigate('/login')} className="btn btn-light btn-lg">
            {t('buttons.get_started')}
          </button>
        </Container>
      </section>
    </div>
  );
};

export default HomePage;


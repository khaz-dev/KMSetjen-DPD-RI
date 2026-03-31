import React, { useState, useEffect } from 'react';
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
  FiLayers, FiActivity, FiTrendingUp
} from 'react-icons/fi';
import ImageWithFallback from '../components/ImageWithFallback';
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
const renderCategoryIcon = (iconName) => {
  if (!iconName) {
    return null;
  }
  
  // Check if it's an emoji
  if (/\p{Emoji}/u.test(iconName)) {
    return <span title={iconName} style={{ fontSize: '28px', display: 'flex', alignItems: 'center' }}>{iconName}</span>;
  }
  
  // Try to get the icon component
  const IconComponent = getIconComponent(iconName);
  if (IconComponent) {
    return <IconComponent title={iconName} size={28} style={{ minWidth: '28px', minHeight: '28px' }} />;
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Wait for auth context to finish loading before fetching data
    // This ensures any token refresh/validation completes first
    if (authLoading) {
      return;
    }

    const loadContent = async () => {
      try {
        setArticlesLoading(true);
        setCategoriesLoading(true);
        
        // Load featured/popular articles
        const articlesRes = await publicAPI.getPopularArticles();
        setFeaturedArticles(articlesRes.data.results?.slice(0, 6) || []);
        setArticlesLoading(false);
        
        // Load categories
        const categoriesRes = await publicAPI.getCategories({ page_size: 6 });
        setCategories(categoriesRes.data.results || []);
        setCategoriesLoading(false);
      } catch (error) {
        console.error('Error loading homepage content:', error);
        setArticlesLoading(false);
        setCategoriesLoading(false);
      } finally {
        setInitialLoading(false);
      }
    };

    loadContent();
  }, [user, authLoading]);

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
            </Col>
            <Col md={6}>
              <div className="hero-image">
                <img
                  src="/logo.png"
                  alt="KMS Logo"
                  className="hero-logo"
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
      <section className="py-5">
        <Container>
          <h2 className="mb-4">{t('home.popular_articles')}</h2>
          <div className="articles-scroll-container" style={{ opacity: articlesLoading ? 0.6 : 1, transition: 'opacity 0.3s ease', position: 'relative' }}>
            {articlesLoading && (
              <div className="section-loading">
                <Spinner animation="border" size="sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            )}
            {featuredArticles.length > 0 ? (
              <div className="articles-scroll">
                {featuredArticles.map((article) => (
                  <div key={article.id} className="article-scroll-item">
                    <Card className="article-card h-100 shadow-sm">
                    <div className="article-image-container">
                      <ImageWithFallback 
                        src={article.image} 
                        alt={isIndonesian ? article.title_id : article.title_en}
                        className="article-image"
                        type="article"
                      />
                      <div className="article-image-overlay"></div>
                    </div>
                    <Card.Body className="d-flex flex-column">
                      <h5 className="card-title">{isIndonesian ? article.title_id : article.title_en}</h5>
                      <p className="text-muted small mb-2">
                        {isIndonesian ? (article.category?.name_id || article.category?.name_en) : (article.category?.name_en || article.category?.name_id)}
                      </p>
                      <p className="card-text article-summary flex-grow-1">{isIndonesian ? article.summary_id : article.summary_en}</p>
                      
                      {/* Article Meta Information */}
                      <div className="article-meta mt-3 mb-3">
                        <div className="meta-row mb-2">
                          <small className="text-muted">
                            {formatSafeDate(article.published_at || article.updated_at, isIndonesian)}
                          </small>
                          <span className="meta-separator">•</span>
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
                        {article.author_name && (
                          <div className="meta-row">
                            <small className="text-secondary">
                              {t('articles.by', { name: article.author_name })}
                            </small>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                    <Card.Footer className="bg-transparent d-flex justify-content-end">
                      <Link to={getArticleUrl(article)} className="btn btn-sm btn-primary">
                        {t('buttons.read_more')}
                      </Link>
                    </Card.Footer>
                  </Card>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <p className="text-muted">{t('home.no_articles')}</p>
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Categories */}
      <section className="py-5 categories-section-light">
        <Container>
          <h2 className="mb-4">{t('home.browse_categories')}</h2>
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
                <Col md={4} key={category.id} className="mb-3">
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
                          <div className="category-icon-container">
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
                      </div>
                      <Card.Body>
                        <h5>{isIndonesian ? category.name_id : category.name_en}</h5>
                        <p className="text-muted mb-0">
                          {category.article_count || 0} {t('home.articles_count')}
                        </p>
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


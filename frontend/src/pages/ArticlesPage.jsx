import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { publicAPI, getArticleUrl } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import SearchFilter from '../components/SearchFilter';
import Pagination from '../components/Pagination';
import Breadcrumbs from '../components/Breadcrumbs';
import ImageWithFallback from '../components/ImageWithFallback';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../contexts/AuthContext';
import './ArticlesPage.css';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import { FiEye, FiFolder, FiHeart } from 'react-icons/fi';

/**
 * Safe date format helper - handles null/invalid dates gracefully
 */
const formatSafeDate = (dateValue, isIndonesian) => {
  try {
    // Handle null/undefined inputs
    if (!dateValue) {
      return 'N/A';
    }
    
    const dateObj = new Date(dateValue);
    // Check if date is valid (not Invalid Date)
    if (isNaN(dateObj.getTime())) {
      return 'N/A'; // Return fallback for invalid dates
    }
    return formatDistanceToNow(dateObj, {
      addSuffix: true,
      locale: isIndonesian ? idLocale : enUS
    });
  } catch (error) {
    // Return fallback if any error occurs
    return 'N/A';
  }
};

/**
 * ArticlesPage Component
 * Displays list of articles with filtering, searching, and pagination
 */
const ArticlesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isIndonesian } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get parameters from URL
  const searchQuery = searchParams.get('search') || '';
  const categoryId = searchParams.get('category') || '';
  const accessLevel = searchParams.get('access_level') || '';
  const sortBy = searchParams.get('sort') || 'date';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Map sort parameter to backend ordering filter choices
      let ordering = '-published_at'; // default: newest
      if (sortBy === 'date-asc') {
        ordering = 'published_at';
      } else if (sortBy === 'views') {
        ordering = '-view_count';
      } else if (sortBy === 'likes') {
        ordering = '-like_count';
      }
      
      const params = {
        page,
        search: searchQuery || undefined,
        category: categoryId || undefined,
        access_level: accessLevel || undefined,
        ordering,
      };

      // Remove undefined values
      Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

      const response = await publicAPI.getArticles(params);
      setArticles(response.data.results || []);
      setTotalCount(response.data.count || 0);
    } catch (err) {
      setError(err.response?.data?.detail || 't:errors.failed_load_articles');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [searchQuery, categoryId, accessLevel, sortBy, page]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await publicAPI.getCategories({ page_size: 100 });
      setCategories(response.data.results || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  useEffect(() => {
    // Wait for auth context to finish loading before fetching data
    // This prevents race condition where articles are fetched with unverified token
    if (authLoading) {
      console.debug('[ArticlesPage] Waiting for auth context to load before fetching data...');
      return;
    }
    fetchArticles();
    fetchCategories();
  }, [fetchArticles, fetchCategories, authLoading]);

  const handleSearch = (query) => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (categoryId) params.set('category', categoryId);
    if (accessLevel) params.set('access_level', accessLevel);
    params.set('sort', sortBy);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleCategoryChange = (catId) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (catId) params.set('category', catId);
    if (accessLevel) params.set('access_level', accessLevel);
    params.set('sort', sortBy);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleAccessLevelChange = (level) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (categoryId) params.set('category', categoryId);
    if (level) params.set('access_level', level);
    params.set('sort', sortBy);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSortChange = (sort) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (categoryId) params.set('category', categoryId);
    if (accessLevel) params.set('access_level', accessLevel);
    params.set('sort', sort);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (categoryId) params.set('category', categoryId);
    if (accessLevel) params.set('access_level', accessLevel);
    params.set('sort', sortBy);
    params.set('page', newPage);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const breadcrumbItems = [
    { label: 'nav.home', path: '/' },
    { label: 'articles.title', path: '/knowledges' },
  ];

  // Add category to breadcrumbs if selected
  if (categoryId) {
    const selectedCategory = categories.find(cat => cat.id === parseInt(categoryId));
    if (selectedCategory) {
      const categoryName = isIndonesian ? selectedCategory.name_id : selectedCategory.name_en;
      breadcrumbItems.push({ label: categoryName, active: true });
    }
  } else {
    breadcrumbItems[1].active = true;
  }

  // Get page title and subtitle based on filters
  const getPageTitle = () => {
    if (categoryId) {
      const selectedCategory = categories.find(cat => cat.id === parseInt(categoryId));
      if (selectedCategory) {
        return isIndonesian ? selectedCategory.name_id : selectedCategory.name_en;
      }
    }
    return t('articles.title');
  };

  const getPageSubtitle = () => {
    if (searchQuery) {
      return `${t('articles.search_placeholder')} "${searchQuery}"`;
    }
    if (categoryId) {
      const selectedCategory = categories.find(cat => cat.id === parseInt(categoryId));
      if (selectedCategory) {
        const categoryName = isIndonesian ? selectedCategory.name_id : selectedCategory.name_en;
        return `${t('articles.category')}: ${categoryName}`;
      }
    }
    return t('articles.title');
  };

  if (initialLoading) return <LoadingSpinner message={t('loading.loading_articles')} />;

  return (
    <div className="articles-page">
      <div className="container py-4">
        <Breadcrumbs items={breadcrumbItems} />

        <h1 className="page-title">{getPageTitle()}</h1>
        <p className="page-subtitle">
          {getPageSubtitle()}
        </p>

        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          selectedCategory={categoryId}
          onCategoryChange={handleCategoryChange}
          categories={categories}
          selectedAccessLevel={accessLevel}
          onAccessLevelChange={handleAccessLevelChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          onReset={handleReset}
          user={user}
        />

        {articles.length === 0 ? (
          <div className="empty-state">
            <p>{t('articles.no_results')}</p>
          </div>
        ) : (
          <>
            <div className="articles-grid" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s ease' }}>
              {loading && (
                <div className="articles-grid-loading">
                  <div className="spinner-small">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                </div>
              )}
              {articles.map((article) => (
                <div key={article.id} className="article-card">
                  <div className="card-image-placeholder">
                    <ImageWithFallback
                      src={article.image || article.image_url}
                      alt={isIndonesian ? article.title_id : article.title_en}
                      type="article"
                      className="article-card-image"
                    />
                    {article.category && (
                      <span className="article-category-badge">
                        <FiFolder size={16} />
                        {isIndonesian ? article.category.name_id : article.category.name_en}
                      </span>
                    )}
                  </div>
                  <div className="article-card-content">
                    <h3 className="article-title">
                      <a href={getArticleUrl(article)} onClick={(e) => { e.preventDefault(); navigate(getArticleUrl(article)); }}>
                        {isIndonesian ? article.title_id : article.title_en}
                      </a>
                    </h3>
                    <p className="article-excerpt">
                      {isIndonesian ? article.summary_id : article.summary_en}
                    </p>
                    <div className="article-meta mt-3 mb-0">
                      {/* Author - Always first */}
                      <span className="meta-item">
                        {article.author_name || t('common.unknown_author')}
                      </span>

                      {/* Dynamically reorder metrics based on sort selection */}
                      {(sortBy === 'date' || sortBy === 'date-asc') && (
                        <>
                          <span className="meta-item meta-highlight">
                            {formatSafeDate(article.published_at || article.updated_at, isIndonesian)}
                          </span>
                          <span className="meta-item">
                            <FiEye size={16} />
                            {article.view_count} {t('articles.views')}
                          </span>
                          <span className="meta-item">
                            <FiHeart size={16} />
                            {article.like_count} {t('articles.likes')}
                          </span>
                        </>
                      )}

                      {sortBy === 'views' && (
                        <>
                          <span className="meta-item meta-highlight">
                            <FiEye size={16} />
                            {article.view_count} {t('articles.views')}
                          </span>
                          <span className="meta-item">
                            {formatSafeDate(article.published_at || article.updated_at, isIndonesian)}
                          </span>
                          <span className="meta-item">
                            <FiHeart size={16} />
                            {article.like_count} {t('articles.likes')}
                          </span>
                        </>
                      )}

                      {sortBy === 'likes' && (
                        <>
                          <span className="meta-item meta-highlight">
                            <FiHeart size={16} />
                            {article.like_count} {t('articles.likes')}
                          </span>
                          <span className="meta-item">
                            <FiEye size={16} />
                            {article.view_count} {t('articles.views')}
                          </span>
                          <span className="meta-item">
                            {formatSafeDate(article.published_at || article.updated_at, isIndonesian)}
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      className="read-more-btn"
                      onClick={() => navigate(getArticleUrl(article))}
                    >
                      {t('buttons.read_more')} →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={page}
              totalPages={Math.ceil(totalCount / 20) || 1}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ArticlesPage;


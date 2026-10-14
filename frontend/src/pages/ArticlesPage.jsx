import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { publicAPI, getArticleUrl } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import SearchFilter from '../components/SearchFilter';
import Pagination from '../components/Pagination';
import Breadcrumbs from '../components/Breadcrumbs';
import ImageWithFallback from '../components/ImageWithFallback';
import ArticleMetaLine from '../components/ArticleMetaLine';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../contexts/AuthContext';
import './ArticlesPage.css';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import { 
  FiEye, FiFolder, FiHeart, FiShare2, FiFileText, FiBell, FiBook, 
  FiBarChart2, FiRss, FiTag, FiHome, FiUsers,
  FiLayers, FiActivity, FiTrendingUp, FiBookmark, FiAward
} from 'react-icons/fi';
import { 
  KNOWLEDGE_CLUSTERS, 
  KNOWLEDGE_TYPES, 
  getKnowledgeTypeInfo 
} from '../constants/knowledgeTypes';

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
 * Get icon component by icon name
 * Maps icon names to Feather Icon components or returns emoji
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
const renderCategoryIcon = (iconName, size = 16) => {
  if (!iconName) {
    return <FiFolder size={size} />;  // Default fallback
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
  
  // Fallback to folder icon if no match
  return <FiFolder size={size} />;
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
  const [tags, setTags] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Refs for preventing memory leaks on unmount
  const abortControllerRef = useRef(null);

  // Get parameters from URL - use string values as dependencies to keep them stable
  const searchQuery = searchParams.get('search') || '';
  const categoryId = searchParams.get('category') || '';
  const knowledgeType = searchParams.get('knowledge_type') || '';
  const knowledgeCluster = searchParams.get('knowledge_cluster') || '';
  const accessLevel = searchParams.get('access_level') || '';
  const selectedTagsString = searchParams.get('tags') || '';
  const tagsLogic = searchParams.get('tags_logic') || 'or';
  const sortBy = searchParams.get('sort') || 'date';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Derive selectedTags from the stable string (for use in render, not in deps)
  const selectedTags = selectedTagsString ? selectedTagsString.split(',') : [];

  useEffect(() => {
    // Wait for auth context to finish loading before fetching data
    if (authLoading) {
      return;
    }

    // Create abort controller for canceling requests on unmount
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Fetch all required data
    const loadData = async () => {
      try {
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
          page_size: itemsPerPage,
          search: searchQuery || undefined,
          category: categoryId || undefined,
          knowledge_type: knowledgeType || undefined,
          knowledge_cluster: knowledgeCluster || undefined,
          access_level: accessLevel || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          tags_logic: selectedTags.length > 0 ? tagsLogic : undefined,
          ordering,
        };

        // Remove undefined values
        Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

        setLoading(true);
        setError(null);

        const [articlesRes, categoriesRes, tagsRes] = await Promise.all([
          publicAPI.getArticles(params),
          publicAPI.getCategories({ page_size: 100 }),
          publicAPI.getTags({ page_size: 100 }),
        ]);

        // Only update state if request wasn't aborted
        if (!abortController.signal.aborted) {
          setArticles(articlesRes.data.results || []);
          setTotalCount(articlesRes.data.count || 0);
          setCategories(categoriesRes.data.results || []);
          setTags(tagsRes.data.results || []);
          setLoading(false);
          setInitialLoading(false);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err.response?.data?.detail || 't:errors.failed_load_articles');
          setLoading(false);
          setInitialLoading(false);
          console.error('Error loading articles page data:', err);
        }
      }
    };

    loadData();

    // Cleanup function - only abort on unmount or when effect re-runs with active fetching
    return () => { abortControllerRef.current?.abort(); };
  }, [searchQuery, categoryId, knowledgeType, knowledgeCluster, accessLevel, selectedTagsString, tagsLogic, sortBy, page, itemsPerPage, authLoading]);

  const handleSearch = useCallback((query) => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (categoryId) params.set('category', categoryId);
    if (knowledgeType) params.set('knowledge_type', knowledgeType);
    if (knowledgeCluster) params.set('knowledge_cluster', knowledgeCluster);
    if (accessLevel) params.set('access_level', accessLevel);
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','));
      params.set('tags_logic', tagsLogic);
    }
    params.set('sort', sortBy);
    params.set('page', '1');
    setSearchParams(params);
  }, [categoryId, knowledgeType, knowledgeCluster, accessLevel, selectedTags, tagsLogic, sortBy]);

  const handleCategoryChange = useCallback((catId) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (catId) params.set('category', catId);
    if (knowledgeType) params.set('knowledge_type', knowledgeType);
    if (knowledgeCluster) params.set('knowledge_cluster', knowledgeCluster);
    if (accessLevel) params.set('access_level', accessLevel);
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','));
      params.set('tags_logic', tagsLogic);
    }
    params.set('sort', sortBy);
    params.set('page', '1');
    setSearchParams(params);
  }, [searchQuery, knowledgeType, knowledgeCluster, accessLevel, selectedTags, tagsLogic, sortBy]);

  const handleKnowledgeTypeChange = useCallback((type) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (categoryId) params.set('category', categoryId);
    if (type) {
      params.set('knowledge_type', type);
      // Auto-set matching cluster if applicable
      const typeInfo = KNOWLEDGE_TYPES[type];
      if (typeInfo?.cluster) {
        params.set('knowledge_cluster', typeInfo.cluster);
      }
    }
    if (accessLevel) params.set('access_level', accessLevel);
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','));
      params.set('tags_logic', tagsLogic);
    }
    params.set('sort', sortBy);
    params.set('page', '1');
    setSearchParams(params);
  }, [searchQuery, categoryId, accessLevel, selectedTags, tagsLogic, sortBy]);

  const handleKnowledgeClusterChange = useCallback((clusterCode) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (categoryId) params.set('category', categoryId);
    // If clicking the currently active cluster, toggle it off
    if (knowledgeCluster !== clusterCode && clusterCode) {
      params.set('knowledge_cluster', clusterCode);
    }
    // Clear granular knowledge_type so whole cluster shows
    if (accessLevel) params.set('access_level', accessLevel);
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','));
      params.set('tags_logic', tagsLogic);
    }
    params.set('sort', sortBy);
    params.set('page', '1');
    setSearchParams(params);
  }, [searchQuery, categoryId, knowledgeCluster, accessLevel, selectedTags, tagsLogic, sortBy]);

  const handleAccessLevelChange = useCallback((level) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (categoryId) params.set('category', categoryId);
    if (knowledgeType) params.set('knowledge_type', knowledgeType);
    if (knowledgeCluster) params.set('knowledge_cluster', knowledgeCluster);
    if (level) params.set('access_level', level);
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','));
      params.set('tags_logic', tagsLogic);
    }
    params.set('sort', sortBy);
    params.set('page', '1');
    setSearchParams(params);
  }, [searchQuery, categoryId, knowledgeType, knowledgeCluster, selectedTags, tagsLogic, sortBy]);

  const handleTagsChange = useCallback((newTags) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (categoryId) params.set('category', categoryId);
    if (knowledgeType) params.set('knowledge_type', knowledgeType);
    if (knowledgeCluster) params.set('knowledge_cluster', knowledgeCluster);
    if (accessLevel) params.set('access_level', accessLevel);
    if (newTags.length > 0) {
      params.set('tags', newTags.join(','));
      params.set('tags_logic', tagsLogic);
    }
    params.set('sort', sortBy);
    params.set('page', '1');
    setSearchParams(params);
  }, [searchQuery, categoryId, knowledgeType, knowledgeCluster, accessLevel, tagsLogic, sortBy]);
  
  const handleTagsLogicChange = useCallback((newLogic) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (categoryId) params.set('category', categoryId);
    if (knowledgeType) params.set('knowledge_type', knowledgeType);
    if (knowledgeCluster) params.set('knowledge_cluster', knowledgeCluster);
    if (accessLevel) params.set('access_level', accessLevel);
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','));
      params.set('tags_logic', newLogic);
    }
    params.set('sort', sortBy);
    params.set('page', '1');
    setSearchParams(params);
  }, [searchQuery, categoryId, knowledgeType, knowledgeCluster, accessLevel, selectedTags, sortBy]);

  const handleSortChange = useCallback((sort) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (categoryId) params.set('category', categoryId);
    if (knowledgeType) params.set('knowledge_type', knowledgeType);
    if (knowledgeCluster) params.set('knowledge_cluster', knowledgeCluster);
    if (accessLevel) params.set('access_level', accessLevel);
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','));
      params.set('tags_logic', tagsLogic);
    }
    params.set('sort', sort);
    params.set('page', '1');
    setSearchParams(params);
  }, [searchQuery, categoryId, knowledgeType, knowledgeCluster, accessLevel, selectedTags, tagsLogic]);

  const handleReset = useCallback(() => {
    setItemsPerPage(10);
    setSearchParams({});
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    // Reset to page 1 when items per page changes
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (categoryId) params.set('category', categoryId);
    if (knowledgeType) params.set('knowledge_type', knowledgeType);
    if (knowledgeCluster) params.set('knowledge_cluster', knowledgeCluster);
    if (accessLevel) params.set('access_level', accessLevel);
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','));
      params.set('tags_logic', tagsLogic);
    }
    params.set('sort', sortBy);
    params.set('page', '1');
    setSearchParams(params);
  }, [searchQuery, categoryId, knowledgeType, knowledgeCluster, accessLevel, selectedTags, tagsLogic, sortBy]);

  const handlePageChange = useCallback((newPage) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (categoryId) params.set('category', categoryId);
    if (knowledgeType) params.set('knowledge_type', knowledgeType);
    if (knowledgeCluster) params.set('knowledge_cluster', knowledgeCluster);
    if (accessLevel) params.set('access_level', accessLevel);
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','));
      params.set('tags_logic', tagsLogic);
    }
    params.set('sort', sortBy);
    params.set('page', newPage);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchQuery, categoryId, knowledgeType, knowledgeCluster, accessLevel, selectedTags, tagsLogic, sortBy]);

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
        const categoryDesc = isIndonesian ? selectedCategory.description_id : selectedCategory.description_en;
        return categoryDesc || (isIndonesian ? selectedCategory.name_id : selectedCategory.name_en);
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

        {/* Bentuk Pengetahuan Filter Bar */}
        <div className="knowledge-clusters-bar mb-3">
          <div className="clusters-bar-header d-flex align-items-center justify-content-between mb-2">
            <span className="clusters-bar-label fw-bold d-flex align-items-center gap-2">
              <span className="text-secondary small fw-semibold">📑 {t('articles.knowledge_form')}</span>
            </span>
            {(knowledgeCluster || knowledgeType) && (
              <button 
                type="button"
                className="btn btn-link btn-sm text-decoration-none p-0 text-muted"
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete('knowledge_cluster');
                  params.delete('knowledge_type');
                  params.set('page', '1');
                  setSearchParams(params);
                }}
              >
                ✕ {t('search.reset')}
              </button>
            )}
          </div>
          <div className="clusters-tabs-pills">
            <button
              type="button"
              className={`cluster-pill-btn ${!knowledgeCluster && !knowledgeType ? 'active' : ''}`}
              onClick={() => handleKnowledgeClusterChange('')}
            >
              <span className="cluster-pill-icon">🏛️</span>
              <span className="cluster-pill-title">{t('articles.all_clusters')}</span>
            </button>
            {KNOWLEDGE_CLUSTERS.map((cluster) => {
              const isActive = knowledgeCluster === cluster.code || (knowledgeType && KNOWLEDGE_TYPES[knowledgeType]?.cluster === cluster.code);
              return (
                <button
                  key={cluster.code}
                  type="button"
                  className={`cluster-pill-btn ${isActive ? 'active' : ''}`}
                  style={{
                    '--cluster-accent': cluster.color,
                  }}
                  onClick={() => handleKnowledgeClusterChange(cluster.code)}
                  title={isIndonesian ? cluster.title_id : cluster.title_en}
                >
                  <span className="cluster-pill-title">{isIndonesian ? cluster.short_title_id : cluster.short_title_en}</span>
                </button>
              );
            })}
          </div>
        </div>

        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          selectedCategory={categoryId}
          onCategoryChange={handleCategoryChange}
          categories={categories}
          selectedKnowledgeType={knowledgeType}
          onKnowledgeTypeChange={handleKnowledgeTypeChange}
          selectedAccessLevel={accessLevel}
          onAccessLevelChange={handleAccessLevelChange}
          selectedTags={selectedTags}
          onTagsChange={handleTagsChange}
          tags={tags}
          tagsLogic={tagsLogic}
          onTagsLogicChange={handleTagsLogicChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          onReset={handleReset}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          totalCount={totalCount}
          currentPage={page}
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
              {articles.map((article) => {
                const typeInfo = getKnowledgeTypeInfo(article.knowledge_type);
                return (
                  <div key={article.id} className="article-card">
                    <div className="card-image-placeholder">
                      <ImageWithFallback
                        src={article.image || article.image_url}
                        alt={isIndonesian ? article.title_id : article.title_en}
                        type="article"
                        className="article-card-image"
                      />
                      <div className="article-badges-container">
                        {article.category && (
                          <span 
                            className="article-category-badge"
                            style={{
                              backgroundColor: article.category.color || '#0d9488',
                              color: getContrastColor(article.category.color || '#0d9488')
                            }}
                            title={isIndonesian ? article.category.name_id : article.category.name_en}
                          >
                            <span className="badge-icon">
                              {renderCategoryIcon(article.category.icon, 16)}
                            </span>
                            <span className="badge-text">{isIndonesian ? article.category.name_id : article.category.name_en}</span>
                          </span>
                        )}
                        {article.knowledge_type && (
                          <span
                            className="article-knowledge-badge"
                            style={{
                              backgroundColor: typeInfo?.color || '#3b82f6',
                              color: '#ffffff'
                            }}
                            title={`Bentuk Pengetahuan: ${isIndonesian ? (typeInfo?.name_id || article.knowledge_type_display) : (typeInfo?.name_en || article.knowledge_type_display)}`}
                          >
                            <span className="badge-emoji">{typeInfo?.emoji || '📄'}</span>
                            <span className="badge-text">
                              {isIndonesian ? (typeInfo?.name_id || article.knowledge_type_display) : (typeInfo?.name_en || article.knowledge_type_display)}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  <div className="article-card-content">
                    <h3 className="article-title" title={isIndonesian ? article.title_id : article.title_en}>
                      <a href={getArticleUrl(article)} onClick={(e) => { e.preventDefault(); navigate(getArticleUrl(article)); }}>
                        {isIndonesian ? article.title_id : article.title_en}
                      </a>
                    </h3>
                    <p className="article-excerpt" title={isIndonesian ? article.summary_id : article.summary_en}>
                      {isIndonesian ? article.summary_id : article.summary_en}
                    </p>
                    <div className="article-meta-line-container mt-3 mb-2">
                      <ArticleMetaLine article={article} compact={true} />
                    </div>
                    <div className="article-meta mt-1 mb-0">
                      <span className="meta-item">
                        <FiEye size={15} />
                        {article.view_count} {t('articles.views')}
                      </span>
                      <span className="meta-item">
                        <FiHeart size={15} />
                        {article.like_count} {t('articles.likes')}
                      </span>
                      <span className="meta-item">
                        <FiShare2 size={15} />
                        {article.share_count || 0} {t('articles.shares', 'dibagikan')}
                      </span>
                    </div>
                    <button
                      className="read-more-btn"
                      onClick={() => navigate(getArticleUrl(article))}
                    >
                      {t('buttons.read_more')} →
                    </button>
                  </div>
                </div>
              );
            })}
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages || 1}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ArticlesPage;


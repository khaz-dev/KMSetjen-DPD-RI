import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { publicAPI, getArticleUrl } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import Breadcrumbs from '../components/Breadcrumbs';
import ArticleMetaLine from '../components/ArticleMetaLine';
import './CategoryDetailPage.css';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import { FiArrowRight } from 'react-icons/fi';

/**
 * CategoryDetailPage Component
 * Displays all articles in a specific category
 */
const CategoryDetailPage = () => {
  const { t } = useTranslation();
  const { isIndonesian } = useLanguage();
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategoryAndArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch category details and articles
      const [categoryRes, articlesRes] = await Promise.all([
        publicAPI.getCategories(),
        publicAPI.getArticles({ category: categoryId }),
      ]);

      const cat = categoryRes.data.results.find((c) => c.id === parseInt(categoryId));
      setCategory(cat);
      setArticles(articlesRes.data.results || []);
    } catch (err) {
      setError(err.response?.data?.detail || 't:errors.failed_fetch_category');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchCategoryAndArticles();
  }, [fetchCategoryAndArticles]);

  if (loading) return <LoadingSpinner message={t('loading.loading_category')} />;

  if (!category) {
    return (
      <div className="category-detail-page">
        <div className="container py-4">
          <ErrorAlert
            message={t('errors.not_found')}
            onDismiss={() => navigate('/knowledges')}
          />
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'nav.home', path: '/' },
    { label: 'articles.title', path: '/knowledges' },
    { label: isIndonesian ? category.name_id : category.name_en, active: true },
  ];

  return (
    <div className="category-detail-page">
      <div className="container py-4">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="category-header">
          <h1 className="category-title">{isIndonesian ? category.name_id : category.name_en}</h1>
          {category.description && (
            <p className="category-description">{category.description}</p>
          )}
          <p className="category-count">
            {articles.length} {articles.length === 1 ? t('audit.title') : t('articles.title')} {t('categories.articles')}
          </p>
        </div>

        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

        {articles.length === 0 ? (
          <div className="empty-state">
            <p>{t('moderation.no_articles')}</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/knowledges')}
            >
              {t('buttons.back')}
            </button>
          </div>
        ) : (
          <div className="articles-list">
            {articles.map((article) => (
              <div key={article.id} className="article-list-item">
                <div className="article-content">
                  {(() => {
                    const artTitle = isIndonesian ? article.title_id : article.title_en;
                    const artSummary = isIndonesian ? article.summary_id : article.summary_en;
                    return (
                      <>
                        <h3 className="article-title" title={artTitle}>
                          {artTitle}
                        </h3>
                        <p className="article-summary" title={artSummary}>
                          {artSummary}
                        </p>
                      </>
                    );
                  })()}
                  <div className="article-info d-flex align-items-center flex-wrap gap-2">
                    <ArticleMetaLine article={article} compact={true} />
                    <span className="separator">•</span>
                    <span className="views">{article.view_count} {t('articles.views')}</span>
                  </div>
                </div>
                <button
                  className="article-link-btn"
                  onClick={() => navigate(getArticleUrl(article))}
                  title={t('moderation.view_article')}
                >
                  <FiArrowRight size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDetailPage;


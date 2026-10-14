import React, { useState, useEffect } from 'react';
import { Form, InputGroup, Button } from 'react-bootstrap';
import { FiSearch, FiFileText } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';
import TagFilter from './TagFilter';
import { KNOWLEDGE_CLUSTERS, KNOWLEDGE_TYPES } from '../constants/knowledgeTypes';
import './SearchFilter.css';

/**
 * SearchFilter Component
 * Displays search input with filters (category, knowledge type, tags, sort, access level, etc.)
 * 
 * Note: Access level filter is hidden for PUBLIC role users since they
 * can only see 'public' access level articles anyway
 */
const SearchFilter = ({
  searchQuery = '',
  onSearchChange,
  selectedCategory = '',
  onCategoryChange,
  categories = [],
  selectedKnowledgeType = '',
  onKnowledgeTypeChange = () => {},
  selectedAccessLevel = '',
  onAccessLevelChange,
  selectedTags = [],
  onTagsChange,
  tags = [],
  tagsLogic = 'or',
  onTagsLogicChange = () => {},
  sortBy = 'published_at',
  onSortChange,
  onReset,
  itemsPerPage = 10,
  onItemsPerPageChange,
  totalCount = 0,
  currentPage = 1,
  user = null,
}) => {
  const { t } = useTranslation();
  const { isIndonesian } = useLanguage();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Check if user is PUBLIC role
  const isPublicUser = user && user.primary_role === 'public';

  // Debounce search input - only update parent after 500ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchQuery !== searchQuery) {
        onSearchChange(localSearchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearchQuery, searchQuery]);

  // Update local state when external searchQuery changes (from URL)
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleSearchInput = (e) => {
    setLocalSearchQuery(e.target.value);
  };

  return (
    <div className="search-filter-container">
      {/* Top Section: Search Input on Left, Results/Items Per Page on Right */}
      <div className="search-header-wrapper">
        <InputGroup className="search-input">
          <InputGroup.Text className="search-icon">
            <FiSearch />
          </InputGroup.Text>
          <Form.Control
            placeholder={t('search.placeholder')}
            title={t('search.placeholder')}
            aria-label={t('search.placeholder')}
            value={localSearchQuery}
            onChange={handleSearchInput}
            className="search-field"
          />
        </InputGroup>

        {/* Items Per Page and Results Display - Positioned on Right */}
        <div className="pagination-info-container">
          <div className="items-per-page-wrapper">
            <label className="form-label fw-bold mb-2">{t('common.items_per_page') || 'Items Per Page'}</label>
            <Form.Select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange?.(Number(e.target.value))}
              className="filter-select pagination-select"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </Form.Select>
          </div>

          <div className="results-display-wrapper">
            <label className="form-label fw-bold mb-2">{t('common.results') || 'Results'}</label>
            <div className="form-control-plaintext">
              <small>
                <strong>{Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}</strong> - <strong>{Math.min(currentPage * itemsPerPage, totalCount)}</strong> {t('pagination.of') || 'of'} <strong>{totalCount}</strong>
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Main Filter Controls Row */}
      <div className="filter-controls">
        <Form.Select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="filter-select"
          title={t('search.filter_category') || 'Filter by category'}
        >
          <option value="">{t('search.all_categories')}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {isIndonesian ? cat.name_id : cat.name_en}
            </option>
          ))}
        </Form.Select>

        {/* Knowledge Type (Persekjen DPD RI No. 8/2026 Bab II Pasal 7) */}
        <Form.Select
          value={selectedKnowledgeType}
          onChange={(e) => onKnowledgeTypeChange(e.target.value)}
          className="filter-select knowledge-type-filter"
          title={t('articles.filter_by_knowledge_type')}
        >
          <option value="">📋 {t('articles.all_types')}</option>
          {KNOWLEDGE_CLUSTERS.map((cluster) => (
            <optgroup 
              key={cluster.code} 
              label={isIndonesian ? cluster.title_id : cluster.title_en}
            >
              {cluster.types.map((typeKey) => {
                const typeInfo = KNOWLEDGE_TYPES[typeKey];
                return (
                  <option key={typeKey} value={typeKey}>
                    {typeInfo ? `${typeInfo.emoji} ${isIndonesian ? typeInfo.name_id : typeInfo.name_en}` : typeKey}
                  </option>
                );
              })}
            </optgroup>
          ))}
        </Form.Select>

        {!isPublicUser && (
          <Form.Select
            value={selectedAccessLevel}
            onChange={(e) => onAccessLevelChange(e.target.value)}
            className="filter-select"
            title={t('search.filter_access_level') || 'Filter by access level'}
          >
            <option value="">{t('search.all_access_levels')}</option>
            <option value="public">{t('search.access_public')}</option>
            <option value="internal">{t('search.access_internal')}</option>
          </Form.Select>
        )}

        <Form.Select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="filter-select"
          title={t('search.sort_by') || 'Sort by'}
        >
          <option value="date">{t('search.newest')}</option>
          <option value="date-asc">{t('search.oldest')}</option>
          <option value="views">{t('search.most_viewed')}</option>
          <option value="likes">{t('search.most_liked')}</option>
        </Form.Select>

        <Button
          variant="outline-secondary"
          size="sm"
          onClick={onReset}
          className="reset-btn"
          title={t('search.reset_filters') || 'Reset all filters'}
        >
          {t('search.reset')}
        </Button>
      </div>

      {/* Tag Filter - Moved Below Filter Controls for Better UX */}
      <div className="tag-filter-wrapper">
        <label className="tag-filter-label">
          {t('search.filter_tags') || 'Filter by Tags'}
        </label>
        <TagFilter
          selectedTags={selectedTags}
          onTagsChange={onTagsChange}
          tags={tags}
          tagsLogic={tagsLogic}
          onTagsLogicChange={onTagsLogicChange}
        />
      </div>
    </div>
  );
};

export default SearchFilter;


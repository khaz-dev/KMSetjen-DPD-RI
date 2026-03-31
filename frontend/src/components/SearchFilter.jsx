import React, { useState, useEffect } from 'react';
import { Form, InputGroup, Button } from 'react-bootstrap';
import { FiSearch } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';
import './SearchFilter.css';

/**
 * SearchFilter Component
 * Displays search input with filters (category, sort, access level, etc.)
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
  selectedAccessLevel = '',
  onAccessLevelChange,
  sortBy = 'published_at',
  onSortChange,
  onReset,
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
  }, [localSearchQuery, searchQuery, onSearchChange]);

  // Update local state when external searchQuery changes (from URL)
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleSearchInput = (e) => {
    setLocalSearchQuery(e.target.value);
  };

  return (
    <div className="search-filter-container">
      <div className="search-input-wrapper">
        <InputGroup className="search-input">
          <InputGroup.Text className="search-icon">
            <FiSearch />
          </InputGroup.Text>
          <Form.Control
            placeholder={t('search.placeholder')}
            value={localSearchQuery}
            onChange={handleSearchInput}
            className="search-field"
          />
        </InputGroup>
      </div>

      <div className="filter-controls">
        <Form.Select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="filter-select"
        >
          <option value="">{t('search.all_categories')}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {isIndonesian ? cat.name_id : cat.name_en}
            </option>
          ))}
        </Form.Select>

        {!isPublicUser && (
          <Form.Select
            value={selectedAccessLevel}
            onChange={(e) => onAccessLevelChange(e.target.value)}
            className="filter-select"
          >
            <option value="">{t('search.all_access_levels')}</option>
            <option value="public">{t('search.access_public')}</option>
            <option value="internal">{t('search.access_internal')}</option>
            <option value="role_based">{t('search.access_role_based')}</option>
          </Form.Select>
        )}

        <Form.Select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="filter-select"
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
        >
          {t('search.reset')}
        </Button>
      </div>
    </div>
  );
};

export default SearchFilter;


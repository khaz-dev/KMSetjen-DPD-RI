import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiChevronDown } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';
import './TagFilter.css';

/**
 * TagFilter Component
 * A user-friendly tag filter with:
 * - Clickable tag chips/pills
 * - Visual feedback for selected tags
 * - Dropdown list of available tags with checkboxes
 * - Shows selected tags at the top
 * - AND/OR toggle for multiple tag filtering
 * 
 * Props:
 * - selectedTags: array of selected tag IDs
 * - onTagsChange: callback function when tags change
 * - tags: array of available tag objects {id, name_id, name_en, usage_count}
 * - tagsLogic: 'or' (default) or 'and' for multiple tag filtering
 * - onTagsLogicChange: callback function when AND/OR logic changes
 */
const TagFilter = ({
  selectedTags = [],
  onTagsChange = () => {},
  tags = [],
  tagsLogic = 'or',
  onTagsLogicChange = () => {},
}) => {
  const { t } = useTranslation();
  const { isIndonesian } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Convert selectedTags to string array for comparison
  const selectedTagsArray = selectedTags.map(tag => String(tag));

  const handleTagToggle = (tagId) => {
    const tagIdStr = String(tagId);
    let newTags;
    
    if (selectedTagsArray.includes(tagIdStr)) {
      // Remove tag
      newTags = selectedTagsArray.filter(t => t !== tagIdStr);
    } else {
      // Add tag
      newTags = [...selectedTagsArray, tagIdStr];
    }
    
    onTagsChange(newTags);
  };

  const handleRemoveTag = (tagId) => {
    const tagIdStr = String(tagId);
    const newTags = selectedTagsArray.filter(t => t !== tagIdStr);
    onTagsChange(newTags);
  };

  const handleClearAll = () => {
    onTagsChange([]);
    setIsOpen(false);
  };

  // Filter tags based on search query
  const filteredTags = tags.filter((tag) => {
    const searchLower = searchQuery.toLowerCase();
    const tagName = isIndonesian ? tag.name_id : tag.name_en;
    return tagName.toLowerCase().includes(searchLower);
  });

  // Get names of selected tags for display
  const getSelectedTagNames = () => {
    return selectedTagsArray.map(tagId => {
      const tag = tags.find(t => String(t.id) === tagId);
      return tag ? (isIndonesian ? tag.name_id : tag.name_en) : tagId;
    });
  };

  return (
    <div className="tag-filter-container" ref={dropdownRef}>
      {/* Selected Tags Display */}
      <div className="tag-filter-selected">
        {selectedTagsArray.length > 0 ? (
          <div className="tag-chips-wrapper">
            {selectedTagsArray.map((tagId) => {
              const tag = tags.find(t => String(t.id) === tagId);
              const tagName = tag ? (isIndonesian ? tag.name_id : tag.name_en) : tagId;
              return (
                <div key={tagId} className="tag-chip">
                  <span className="tag-chip-text" title={tagName}>
                    {tagName}
                  </span>
                  <button
                    type="button"
                    className="tag-chip-remove"
                    onClick={() => handleRemoveTag(tagId)}
                    aria-label={`Remove ${tag?.name_id || tag?.name_en || tagId}`}
                  >
                    <FiX size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <span className="tag-filter-placeholder">
            {t('search.all_tags') || 'All Tags'}
          </span>
        )}

        {/* Dropdown Toggle Button */}
        <button
          type="button"
          className="tag-filter-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Toggle tag filter dropdown"
        >
          <FiChevronDown size={18} className={isOpen ? 'rotated' : ''} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="tag-filter-dropdown">
          <div className="tag-filter-header">
            <h4 className="tag-filter-title">
              {t('search.filter_tags') || 'Filter by Tags'}
            </h4>
            {selectedTagsArray.length > 0 && (
              <button
                type="button"
                className="tag-filter-clear"
                onClick={handleClearAll}
              >
                {t('search.clear') || 'Clear All'}
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="tag-filter-search-wrapper">
            <input
              type="text"
              className="tag-filter-search"
              placeholder={t('search.search_tags') || 'Search tags...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search tags"
            />
          </div>

          <div className="tag-filter-list">
            {tags.length > 0 ? (
              filteredTags.length > 0 ? (
                filteredTags.map((tag) => {
                const tagIdStr = String(tag.id);
                const isSelected = selectedTagsArray.includes(tagIdStr);
                return (
                  <label key={tag.id} className={`tag-filter-item ${isSelected ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleTagToggle(tag.id)}
                      className="tag-filter-checkbox"
                    />
                    <span className="tag-filter-name">
                      {isIndonesian ? tag.name_id : tag.name_en}
                    </span>
                    <span className="tag-filter-count">
                      ({tag.usage_count || 0})
                    </span>
                  </label>
                );
              })
              ) : (
                <div className="tag-filter-empty">
                  {t('common.no_results') || 'No tags match your search'}
                </div>
              )
            ) : (
              <div className="tag-filter-empty">
                {t('common.no_data') || 'No tags available'}
              </div>
            )}
          </div>

          <div className="tag-filter-footer">
            <small className="tag-filter-hint">
              {t('search.select_multiple_hint') || 'Select multiple tags to refine your search'}
            </small>
            {selectedTagsArray.length > 1 && (
              <div className="tag-filter-logic-toggle">
                <button
                  type="button"
                  className={`tag-logic-btn ${tagsLogic === 'or' ? 'active' : ''}`}
                  onClick={() => onTagsLogicChange('or')}
                  title="Show articles matching ANY selected tag"
                >
                  {t('search.tag_logic_or') || 'OR'}
                </button>
                <button
                  type="button"
                  className={`tag-logic-btn ${tagsLogic === 'and' ? 'active' : ''}`}
                  onClick={() => onTagsLogicChange('and')}
                  title="Show articles matching ALL selected tags"
                >
                  {t('search.tag_logic_and') || 'AND'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagFilter;

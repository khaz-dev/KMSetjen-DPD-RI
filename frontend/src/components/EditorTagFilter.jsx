import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiChevronDown, FiCheck } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';
import './EditorTagFilter.css';

/**
 * EditorTagFilter Component
 * Enhanced tag selection for article editor with:
 * - Interactive tag chips/pills
 * - Dropdown with search and checkboxes
 * - Visual feedback for selected tags
 * - Usage count display
 * - Bilingual support
 * - Dark mode support
 * 
 * Props:
 * - selectedTags: array of selected tag IDs
 * - onTagsChange: callback function when tags change
 * - tags: array of available tag objects {id, name_id, name_en, usage_count}
 */
const EditorTagFilter = ({
  selectedTags = [],
  onTagsChange = () => {},
  tags = [],
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

  return (
    <div className="editor-tag-filter-container" ref={dropdownRef}>
      {/* Selected Tags Display */}
      <div className="editor-tag-filter-selected">
        {selectedTagsArray.length > 0 ? (
          <div className="editor-tag-chips-wrapper">
            {selectedTagsArray.map((tagId) => {
              const tag = tags.find(t => String(t.id) === tagId);
              const tagName = tag ? (isIndonesian ? tag.name_id : tag.name_en) : tagId;
              return (
                <div key={tagId} className="editor-tag-chip" title={tagName}>
                  <span className="editor-tag-chip-text" title={tagName}>
                    {tagName}
                  </span>
                  <button
                    type="button"
                    className="editor-tag-chip-remove"
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
          <span className="editor-tag-filter-placeholder">
            {t('search.all_tags') || 'All Tags'}
          </span>
        )}

        {/* Dropdown Toggle Button */}
        <button
          type="button"
          className="editor-tag-filter-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Toggle tag filter dropdown"
        >
          <FiChevronDown size={18} className={isOpen ? 'rotated' : ''} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="editor-tag-filter-dropdown">
          {/* Search Input */}
          <div className="editor-tag-filter-search-wrapper">
            <input
              type="text"
              className="editor-tag-filter-search"
              placeholder={t('search.search_tags') || 'Search tags...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              aria-label="Search tags"
            />
          </div>

          {/* Header with Clear All Button */}
          {selectedTagsArray.length > 0 && (
            <div className="editor-tag-filter-header">
              <button
                type="button"
                className="editor-tag-filter-clear"
                onClick={handleClearAll}
              >
                {t('search.clear') || 'Clear All'}
              </button>
            </div>
          )}

          {/* Tag List */}
          <div className="editor-tag-filter-list">
            {tags.length > 0 ? (
              filteredTags.length > 0 ? (
                filteredTags.map((tag) => {
                  const tagIdStr = String(tag.id);
                  const isSelected = selectedTagsArray.includes(tagIdStr);
                  return (
                    <label key={tag.id} className={`editor-tag-filter-item ${isSelected ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTagToggle(tag.id)}
                        className="editor-tag-filter-checkbox"
                      />
                      <span className="editor-tag-filter-name">
                        {isIndonesian ? tag.name_id : tag.name_en}
                      </span>
                      {isSelected && <FiCheck size={16} className="editor-tag-filter-checkmark" />}
                      <span className="editor-tag-filter-count">
                        ({tag.usage_count || 0})
                      </span>
                    </label>
                  );
                })
              ) : (
                <div className="editor-tag-filter-empty">
                  {t('common.no_results') || 'No tags match your search'}
                </div>
              )
            ) : (
              <div className="editor-tag-filter-empty">
                {t('common.no_data') || 'No tags available'}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="editor-tag-filter-footer">
            <small className="editor-tag-filter-hint">
              {selectedTagsArray.length > 0 
                ? `${selectedTagsArray.length} tag${selectedTagsArray.length > 1 ? 's' : ''} selected`
                : (t('search.select_multiple_hint') || 'Select tags to categorize your article')
              }
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorTagFilter;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Breadcrumbs.css';

/**
 * Breadcrumbs Component
 * Displays navigation breadcrumb trail
 */
const Breadcrumbs = ({ items = [] }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (items.length === 0) return null;

  // Function to translate label if it's a translation key
  const getLabel = (label) => {
    // Check if label looks like a translation key (contains a dot)
    if (typeof label === 'string' && label.includes('.')) {
      return t(label);
    }
    return label;
  };

  return (
    <nav aria-label="breadcrumb" className="breadcrumbs-container">
      <ol className="breadcrumb">
        {items.map((item, index) => (
          <li
            key={index}
            className={`breadcrumb-item ${item.active ? 'active' : ''}`}
          >
            {item.active ? (
              <span>{getLabel(item.label)}</span>
            ) : (
              <button
                className="breadcrumb-link"
                onClick={() => navigate(item.path)}
              >
                {getLabel(item.label)}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;


import React from 'react';
import { Pagination as BsPagination } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import './Pagination.css';

/**
 * Pagination Component
 * Displays pagination controls with page numbers
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const { t } = useTranslation();
  const items = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  // Previous button
  items.push(
    <BsPagination.Prev
      key="prev"
      disabled={currentPage === 1}
      onClick={() => onPageChange(currentPage - 1)}
      title={t('pagination.previous')}
    />
  );

  // First page and ellipsis
  if (startPage > 1) {
    items.push(
      <BsPagination.Item key={1} onClick={() => onPageChange(1)}>
        1
      </BsPagination.Item>
    );
    if (startPage > 2) {
      items.push(<BsPagination.Ellipsis key="ellipsis-start" disabled />);
    }
  }

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    items.push(
      <BsPagination.Item
        key={i}
        active={i === currentPage}
        onClick={() => onPageChange(i)}
      >
        {i}
      </BsPagination.Item>
    );
  }

  // Last page and ellipsis
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      items.push(<BsPagination.Ellipsis key="ellipsis-end" disabled />);
    }
    items.push(
      <BsPagination.Item
        key={totalPages}
        onClick={() => onPageChange(totalPages)}
      >
        {totalPages}
      </BsPagination.Item>
    );
  }

  // Next button
  items.push(
    <BsPagination.Next
      key="next"
      disabled={currentPage === totalPages}
      onClick={() => onPageChange(currentPage + 1)}
      title={t('pagination.next')}
    />
  );

  return (
    <div className="pagination-container">
      <BsPagination className="pagination-controls">{items}</BsPagination>
      <p className="pagination-info">
        {t('pagination.page', { current: currentPage, total: totalPages })}
      </p>
    </div>
  );
};

export default Pagination;


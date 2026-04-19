import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { Container, Table, Button, Modal, Form, Spinner, Alert, Card, Badge, Pagination, Row, Col } from 'react-bootstrap';
import { FiEdit2, FiTrash2, FiPlus, FiSearch } from 'react-icons/fi';
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';
import './ManagementPage.css';

// Helper function to calculate pagination
function calculatePageNumbers(currentPage, totalPages) {
  if (totalPages <= 9) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];
  const maxDisplay = 9;
  const siblingCount = 1;
  const boundaryCount = 3;

  for (let i = 1; i <= Math.min(boundaryCount, totalPages); i++) {
    pages.push(i);
  }

  const startSibling = Math.max(boundaryCount + 1, currentPage - siblingCount);
  const endSibling = Math.min(totalPages - boundaryCount, currentPage + siblingCount);

  if (startSibling > boundaryCount + 1) {
    pages.push(null);
  }

  for (let i = startSibling; i <= endSibling; i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  if (endSibling < totalPages - boundaryCount) {
    pages.push(null);
  }

  for (let i = Math.max(endSibling + 1, totalPages - boundaryCount + 1); i <= totalPages; i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  return pages;
}

function TagManagementPage({ onLogout }) {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const { success, error: showError } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name_id'); // Sort field
  const [sortOrder, setSortOrder] = useState('asc'); // Sort order: 'asc' or 'desc'
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name_en: '',
    name_id: '',
    description_en: '',
    description_id: '',
    color: '#3498db',
    is_active: true
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTagId, setDeleteTagId] = useState(null);
  const [deleteTagName, setDeleteTagName] = useState('');

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
      };
      
      if (searchQuery) {
        params.search = searchQuery;
      }

      // Add sorting
      if (sortBy) {
        params.ordering = sortOrder === 'desc' ? `-${sortBy}` : sortBy;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/tags/`,
        { 
          params,
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } 
        }
      );
      
      const totalItems = response.data.count || 0;
      const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
      
      setItems(response.data.results || []);
      setTotalCount(totalItems);
      setTotalPages(calculatedTotalPages);
      
      // Reset to page 1 if page_size changed and current page exceeds new total
      if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
        setCurrentPage(1);
      }
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, sortBy, sortOrder, t]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleOpenModal = (item = null) => {
    if (item) {
      setModalMode('edit');
      setSelectedItem(item);
      setFormData({
        name_en: item.name_en || '',
        name_id: item.name_id || '',
        description_en: item.description_en || '',
        description_id: item.description_id || '',
        color: item.color || '#3498db',
        is_active: item.is_active !== false
      });
    } else {
      setModalMode('create');
      setSelectedItem(null);
      setFormData({
        name_en: '',
        name_id: '',
        description_en: '',
        description_id: '',
        color: '#3498db',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const endpoint = modalMode === 'create'
        ? `${import.meta.env.VITE_API_URL}/api/v1/admin/tags/`
        : `${import.meta.env.VITE_API_URL}/api/v1/admin/tags/${selectedItem.id}/`;
      const method = modalMode === 'create' ? 'post' : 'put';
      await axios({
        method,
        url: endpoint,
        data: formData,
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      });
      
      // Show success notification
      success(t('tags.tag_saved'));
      
      loadItems();
      setShowModal(false);
      setError(null);
    } catch (err) {
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = (id) => {
    const tag = items.find(item => item.id === id);
    const tagName = tag ? tag.name_en : `Tag ${id}`;

    setDeleteTagId(id);
    setDeleteTagName(tagName);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    const tagId = deleteTagId;

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/v1/admin/tags/${tagId}/`;
      const token = localStorage.getItem('access_token');

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      // Show success notification
      success(t('tags.tag_deleted'));
      
      setShowDeleteModal(false);
      loadItems();
      setError(null);
    } catch (err) {
      const errorMessage = t('tags.delete_error') || 'Failed to delete tag';
      setError(errorMessage);
      showError(errorMessage);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTagId(null);
    setDeleteTagName('');
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const formatErrorMessage = (err) => {
    // If no error response, return generic message
    if (!err.response?.data) {
      return t('tags.error') || 'Failed to save tag';
    }

    const data = err.response.data;

    // Check for 'detail' key first (custom error handler format)
    if (data.detail) {
      // If detail is a string, return it
      if (typeof data.detail === 'string') {
        return data.detail;
      }
      // If detail is an object (field validation errors), extract messages
      if (typeof data.detail === 'object') {
        const messages = [];
        for (const [field, errors] of Object.entries(data.detail)) {
          if (Array.isArray(errors)) {
            messages.push(`${field}: ${errors.join(', ')}`);
          } else if (typeof errors === 'string') {
            messages.push(`${field}: ${errors}`);
          }
        }
        if (messages.length > 0) {
          return messages.join(' | ');
        }
      }
    }

    // Check for field validation errors directly
    if (typeof data === 'object' && !Array.isArray(data)) {
      const messages = [];
      for (const [key, value] of Object.entries(data)) {
        if (key !== 'detail' && key !== 'error' && key !== 'error_en') {
          if (Array.isArray(value)) {
            messages.push(`${key}: ${value.join(', ')}`);
          } else if (typeof value === 'string') {
            messages.push(`${key}: ${value}`);
          }
        }
      }
      if (messages.length > 0) {
        return messages.join(' | ');
      }
    }

    // Fallback to generic error message
    return t('tags.error') || 'Failed to save tag';
  };

  const handleColorChange = (e) => {
    let value = e.target.value.trim();
    
    // Allow only hex color format
    if (value === '') {
      setFormData(prev => ({ ...prev, color: '#3498db' }));
      return;
    }

    // Add # if not present
    if (!value.startsWith('#')) {
      value = '#' + value;
    }

    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      setFormData(prev => ({ ...prev, color: value }));
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle sort order if clicking same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field with ascending order
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return ' ↕';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className={`admin-wrapper ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <AdminSidebar onLogout={onLogout} />
      <div className="admin-content">
        <Container>
          <div className="admin-header">
            <div>
              <h1>{t('tags.title') || 'Tags'}</h1>
              <p className="text-muted">{t('tags.subtitle') || 'Manage knowledge tags'}</p>
            </div>
            <Button variant="primary" onClick={() => handleOpenModal()} className="btn-add">
              <FiPlus /> {t('tags.add_tag') || 'Add Tag'}
            </Button>
          </div>

          {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

          {/* Search Bar */}
          <Card className="search-card mb-4">
            <Card.Body>
              <div className="search-wrapper">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder={t('common.search_placeholder') || 'Search tags...'}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </Card.Body>
          </Card>

          {/* Page Size & Filter Controls */}
          <Card className="mb-4">
            <Card.Body>
              <Row className="g-3">
                {/* Items Per Page Selector */}
                <Col md={3} sm={6}>
                  <div>
                    <label className="form-label fw-bold mb-2">{t('common.items_per_page') || 'Items Per Page'}</label>
                    <select
                      className="form-select"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={75}>75</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </Col>

                {/* Results Count */}
                <Col md={3} sm={6}>
                  <div>
                    <label className="form-label fw-bold mb-2">{t('common.results') || 'Results'}</label>
                    <div className="form-control-plaintext pt-2">
                      <strong>{items.length}</strong> {t('pagination.of') || 'of'} <strong>{totalCount}</strong>
                      {totalPages > 1 && <small className="text-muted ms-2">({t('pagination.page', { current: currentPage, total: totalPages })})</small>}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {loading ? (
            <div className="loading-container">
              <Spinner animation="border" role="status" />
              <p>{t('tags.loading') || 'Loading tags...'}</p>
            </div>
          ) : items.length > 0 ? (
            <>
              <Card className="table-card">
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-header">
                      <tr>
                        <th style={{width:'50px',textAlign:'center'}}>{'No.'}</th>
                        <th style={{cursor:'pointer'}} onClick={() => handleSort('name_id')}>
                          {t('tags.name_id') || 'Name (Indonesian)'}{getSortIcon('name_id')}
                        </th>
                        <th style={{cursor:'pointer'}} onClick={() => handleSort('name_en')}>
                          {t('tags.name_en') || 'Name (English)'}{getSortIcon('name_en')}
                        </th>
                        <th style={{cursor:'pointer'}} onClick={() => handleSort('color')}>
                          {t('tags.color') || 'Color'}{getSortIcon('color')}
                        </th>
                        <th>{t('tags.articles') || 'Knowledge'}</th>
                        <th style={{cursor:'pointer'}} onClick={() => handleSort('is_active')}>
                          {t('tags.status') || 'Status'}{getSortIcon('is_active')}
                        </th>
                        <th>{t('common.actions') || 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={item.id}>
                          <td style={{textAlign:'center',fontWeight:'bold'}}>
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td><strong>{item.name_id || '-'}</strong></td>
                          <td>{item.name_en || '-'}</td>
                          <td>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                backgroundColor: item.color || '#3498db',
                                border: '1px solid #ddd'
                              }} />
                              <span>{item.color || '#3498db'}</span>
                            </div>
                          </td>
                          <td><Badge bg="info">{item.article_count || 0}</Badge></td>
                          <td>
                            {item.is_active ? (
                              <Badge bg="success">{t('common.active') || 'Active'}</Badge>
                            ) : (
                              <Badge bg="secondary">{t('common.inactive') || 'Inactive'}</Badge>
                            )}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <Button variant="outline-primary" size="sm" onClick={() => handleOpenModal(item)}><FiEdit2 /></Button>
                              <Button variant="outline-danger" size="sm" onClick={() => handleDeleteItem(item.id)}><FiTrash2 /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card>

              {totalPages > 1 && (
                <div className="pagination-container">
                  <Pagination>
                    <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
                    {calculatePageNumbers(currentPage, totalPages).map((page, index) => (
                      page === null ? (
                        <Pagination.Ellipsis key={`ellipsis-${index}`} disabled />
                      ) : (
                        <Pagination.Item
                          key={page}
                          active={page === currentPage}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Pagination.Item>
                      )
                    ))}
                    <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} />
                    <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <Card className="empty-state">
              <Card.Body>
                <h5>{t('tags.no_tags') || 'No tags found'}</h5>
                <p className="text-muted">{t('tags.no_tags_description') || 'Create your first tag'}</p>
              </Card.Body>
            </Card>
          )}
        </Container>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered className={`tag-modal ${isDarkMode ? 'dark-mode' : ''}`}>
        <Modal.Header closeButton className="tag-modal-header">
          <Modal.Title className="tag-modal-title">
            {modalMode === 'create' ? (t('tags.add_tag') || 'Tambah Tag') : (t('tags.edit_tag') || 'Edit Tag')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="tag-modal-body">
          <Form onSubmit={handleSubmitForm}>
            {/* Required Fields Notice */}
            <div className="required-notice">
              <small className="text-muted">
                {t('tags.required_fields_description') || '* Name (Indonesia), Description (Indonesia), and Color are required'}
              </small>
            </div>

            {/* Two Column Layout */}
            <Row className="g-4">
              {/* Column 1: Indonesian Fields */}
              <Col lg={6}>
                <div className="form-column">
                  <h6 className="column-title">{t('tags.indonesian_info') || 'Informasi Bahasa Indonesia'}</h6>
                  
                  {/* Nama Indonesia */}
                  <Form.Group className="mb-4">
                    <Form.Label className="required-label">
                      {t('tags.name_id') || 'Nama (Indonesia)'} <span className="required-asterisk">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="name_id"
                      value={formData.name_id}
                      onChange={handleFormChange}
                      required
                      placeholder={t('tags.placeholder_name_id') || 'Masukkan nama tag dalam Bahasa Indonesia'}
                      className={`tag-input ${!formData.name_id && 'input-focus'}`}
                    />
                    <Form.Text className="text-muted d-block mt-1">
                      {t('tags.name_id_help') || 'Nama unik untuk tag dalam Bahasa Indonesia'}
                    </Form.Text>
                  </Form.Group>

                  {/* Deskripsi Indonesia */}
                  <Form.Group className="mb-4">
                    <Form.Label className="required-label">
                      {t('tags.description_id') || 'Deskripsi (Indonesia)'} <span className="required-asterisk">*</span>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="description_id"
                      value={formData.description_id}
                      onChange={handleFormChange}
                      required
                      placeholder={t('tags.placeholder_description_id') || 'Jelaskan tujuan dan penggunaan tag ini...'}
                      className="tag-textarea"
                    />
                    <Form.Text className="text-muted d-block mt-1">
                      {t('tags.description_help') || 'Deskripsi yang jelas membantu pengguna memahami tag ini'}
                    </Form.Text>
                  </Form.Group>
                </div>
              </Col>

              {/* Column 2: English & Color Fields */}
              <Col lg={6}>
                <div className="form-column">
                  <h6 className="column-title">{t('tags.english_info') || 'English Information'}</h6>
                  
                  {/* Nama English */}
                  <Form.Group className="mb-4">
                    <Form.Label>
                      {t('tags.name_en') || 'Name (English)'}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="name_en"
                      value={formData.name_en}
                      onChange={handleFormChange}
                      placeholder={t('tags.placeholder_name_en') || 'Enter tag name in English'}
                      className={`tag-input ${!formData.name_en && 'input-focus'}`}
                    />
                    <Form.Text className="text-muted d-block mt-1">
                      {t('tags.name_en_help') || 'Unique name for the tag in English'}
                    </Form.Text>
                  </Form.Group>

                  {/* Deskripsi English */}
                  <Form.Group className="mb-4">
                    <Form.Label>
                      {t('tags.description_en') || 'Description (English)'}
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="description_en"
                      value={formData.description_en}
                      onChange={handleFormChange}
                      placeholder={t('tags.placeholder_description_en') || 'Describe the purpose and use of this tag...'}
                      className="tag-textarea"
                    />
                    <Form.Text className="text-muted d-block mt-1">
                      {t('tags.description_help') || 'Clear description helps users understand this tag'}
                    </Form.Text>
                  </Form.Group>
                </div>
              </Col>
            </Row>

            {/* Color and Status Section */}
            <div className="color-status-section mt-5">
              <h6 className="section-title">{t('tags.appearance') || 'Tampilan & Status'}</h6>
              <Row className="g-4">
                {/* Color Picker & Hex Input */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="required-label">
                      {t('tags.color') || 'Warna'} <span className="required-asterisk">*</span>
                    </Form.Label>
                    <div className="color-picker-container">
                      <Form.Control
                        type="color"
                        name="color"
                        value={formData.color}
                        onChange={handleFormChange}
                        required
                        className="color-picker"
                        title={t('tags.select_color') || 'Pilih warna untuk tag'}
                      />
                      <div className="color-preview" style={{ backgroundColor: formData.color }} />
                      <span className="color-value">{formData.color}</span>
                    </div>
                    <Form.Text className="text-muted d-block mt-2">
                      {t('tags.color_help') || 'Pilih satu warna untuk membedakan tag ini'}
                    </Form.Text>
                    
                    {/* Hex Color Input */}
                    <Form.Label className="mt-3 mb-2">{t('tags.hex_color_input') || 'Or enter hex color'}</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="#3498db"
                      value={formData.color}
                      onChange={handleColorChange}
                      maxLength={7}
                      className="hex-color-input"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                    <Form.Text className="text-muted d-block mt-1">
                      {t('tags.hex_color_help') || 'Format: #RRGGBB (e.g., #3498db)'}
                    </Form.Text>
                  </Form.Group>
                </Col>

                {/* Active Status */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>{t('tags.settings') || 'Pengaturan'}</Form.Label>
                    <div className="status-checkbox">
                      <Form.Check
                        type="checkbox"
                        name="is_active"
                        id="is_active"
                        label={t('tags.active') || 'Tag Aktif'}
                        checked={formData.is_active}
                        onChange={handleFormChange}
                        className="custom-check"
                      />
                    </div>
                    <Form.Text className="text-muted d-block mt-2">
                      {t('tags.active_help') || 'Tag aktif dapat digunakan untuk artikel baru'}
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Form Actions */}
            <div className="form-actions mt-5">
              <Button 
                variant="secondary" 
                onClick={() => setShowModal(false)}
                className="btn-cancel"
              >
                {t('buttons.cancel') || 'Batal'}
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={submitting || !formData.name_id || !formData.description_id || !formData.color}
                className="btn-save"
              >
                {submitting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    {t('common.saving') || 'Menyimpan...'}
                  </>
                ) : (
                  t('buttons.save') || 'Simpan'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showDeleteModal} onHide={handleCancelDelete} size="sm" className={isDarkMode ? 'dark-mode' : ''}>
        <Modal.Header closeButton>
          <Modal.Title>{t('tags.delete_tag') || 'Delete Tag'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '1rem', fontSize: '1.05rem' }}>
              {t('tags.confirm_delete') || 'Are you sure you want to delete this tag?'}
            </p>
            <div style={{
              backgroundColor: isDarkMode ? '#2c3e50' : '#f8f9fa',
              padding: '1rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              border: '2px solid #e74c3c'
            }}>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem', color: '#e74c3c' }}>
                {deleteTagName}
              </p>
            </div>
            <p style={{ fontSize: '0.95rem', color: '#7f8c8d', marginBottom: 0 }}>
              {t('common.cannot_undo') || 'This action cannot be undone.'}
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelDelete}>
            {t('buttons.cancel') || 'Cancel'}
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            {t('buttons.delete') || 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default TagManagementPage;

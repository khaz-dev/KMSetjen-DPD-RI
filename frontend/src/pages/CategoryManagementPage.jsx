import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { Container, Table, Button, Modal, Form, Spinner, Alert, Card, Badge, Pagination, Row, Col } from 'react-bootstrap';
import { 
  FiEdit2, FiTrash2, FiPlus, FiFileText, FiBell, FiBook, 
  FiBarChart2, FiRss, FiFolder, FiTag, FiHome, FiUsers,
  FiLayers, FiActivity, FiTrendingUp
} from 'react-icons/fi';
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';
import './ManagementPage.css';

function CategoryManagementPage({ onLogout }) {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const { success, error: showError } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ 
    name_en: '', 
    name_id: '', 
    description_id: '',
    description_en: '',
    image: '',
    image_file: null,
    icon: '',
    color: '#007bff',
    is_active: true
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);
  const [deleteCategoryName, setDeleteCategoryName] = useState('');
  const [sortBy, setSortBy] = useState('name_id'); // Sort field
  const [sortOrder, setSortOrder] = useState('asc'); // Sort order: 'asc' or 'desc'

  // Handle hex color input with validation
  const handleColorChange = (e) => {
    let value = e.target.value.trim();
    
    // Allow only hex color format
    if (value === '') {
      setFormData(prev => ({ ...prev, color: '#007bff' }));
      return;
    }

    // Add # if not present
    if (!value.startsWith('#')) {
      value = '#' + value;
    }

    // Validate hex color - 6 digits
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      setFormData(prev => ({ ...prev, color: value }));
    }
  };

  // Map icon names to React icon components
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

  // Render icon in table
  const renderCategoryIcon = (iconName) => {
    if (!iconName) {
      return <span style={{ color: '#ccc', fontSize: '16px' }}>-</span>;
    }
    
    // Check if it's an emoji
    if (/\p{Emoji}/u.test(iconName)) {
      return <span title={iconName} style={{ fontSize: '20px' }}>{iconName}</span>;
    }
    
    // Try to get the icon component
    const IconComponent = getIconComponent(iconName);
    if (IconComponent) {
      return <IconComponent title={iconName} style={{ fontSize: '20px' }} />;
    }
    
    // Fallback to text display
    return <span title={iconName} style={{ fontSize: '14px', color: '#666' }}>{iconName}</span>;
  };

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
      };

      // Add sorting
      if (sortBy) {
        params.ordering = sortOrder === 'desc' ? `-${sortBy}` : sortBy;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/categories/`,
        { 
          params,
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } 
        }
      );
      setItems(response.data.results || []);
      setTotalPages(Math.ceil((response.data.count || 0) / 20));
    } catch (err) {
      setError(err.response?.data?.detail || t('categories.category_error'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, t, sortBy, sortOrder]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

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

  const handleOpenModal = (item = null) => {
    if (item) {
      setModalMode('edit');
      setSelectedItem(item);
      setFormData({ 
        name_en: item.name_en || '', 
        name_id: item.name_id || '', 
        description_id: item.description_id || '',
        description_en: item.description_en || '',
        image: item.image || '',
        image_file: null,
        icon: item.icon || '',
        color: item.color || '#007bff',
        is_active: item.is_active !== undefined ? item.is_active : true
      });
      setImagePreview(item.image || null);
      setImageRemoved(false);
    } else {
      setModalMode('create');
      setSelectedItem(null);
      setFormData({ 
        name_en: '', 
        name_id: '', 
        description_id: '',
        description_en: '',
        image: '',
        image_file: null,
        icon: '',
        color: '#007bff',
        is_active: true
      });
      setImagePreview(null);
      setImageRemoved(false);
    }
    setShowModal(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const endpoint = modalMode === 'create'
        ? `${import.meta.env.VITE_API_URL}/api/v1/admin/categories/`
        : `${import.meta.env.VITE_API_URL}/api/v1/admin/categories/${selectedItem.id}/`;
      const method = modalMode === 'create' ? 'post' : 'put';
      
      let dataToSend;
      if (formData.image_file) {
        // Use FormData for file upload
        dataToSend = new FormData();
        dataToSend.append('name_en', formData.name_en);
        dataToSend.append('name_id', formData.name_id);
        dataToSend.append('description_en', formData.description_en);
        dataToSend.append('description_id', formData.description_id);
        dataToSend.append('icon', formData.icon);
        dataToSend.append('color', formData.color);
        dataToSend.append('is_active', formData.is_active);
        dataToSend.append('image', formData.image_file);
      } else {
        dataToSend = {
          name_en: formData.name_en,
          name_id: formData.name_id,
          description_en: formData.description_en,
          description_id: formData.description_id,
          icon: formData.icon,
          color: formData.color,
          is_active: formData.is_active
        };
        // In edit mode, if image was explicitly removed, send null to trigger deletion
        if (modalMode === 'edit' && imageRemoved) {
          dataToSend.image = null;
        }
      }
      
      const headers = {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      };
      
      if (!(dataToSend instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
      
      await axios({ method, url: endpoint, data: dataToSend, headers });
      
      // Show success notification
      if (modalMode === 'create') {
        success(t('categories.category_created_successfully'));
      } else {
        success(t('categories.category_updated_successfully'));
      }
      
      loadItems();
      setShowModal(false);
      setImageRemoved(false);
      setError(null);
    } catch (err) {
      showError(err.response?.data?.detail || err.response?.data?.name_en?.[0] || t('categories.category_error'));
      setError(err.response?.data?.detail || err.response?.data?.name_en?.[0] || t('categories.category_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = (id) => {
    console.log('[CategoryManagement DELETE] Button clicked for categoryId:', id);
    
    // Find the category name for display in confirmation modal
    const category = items.find(item => item.id === id);
    const categoryName = category ? category.name_en : `Category ${id}`;
    
    console.log('[CategoryManagement DELETE] Opening confirmation modal for category:', categoryName);
    setDeleteCategoryId(id);
    setDeleteCategoryName(categoryName);
    setShowDeleteModal(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(t('categories.invalid_image_type') || 'Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(t('categories.image_too_large') || 'Image file is too large (max 5MB)');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: reader.result,
          image_file: file
        }));
        setImagePreview(reader.result);
        setImageRemoved(false);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleImageRemove = () => {
    setFormData(prev => ({
      ...prev,
      image: '',
      image_file: null
    }));
    setImagePreview(null);
    setImageRemoved(true);
  };

  const handleConfirmDelete = async () => {
    const categoryId = deleteCategoryId;
    console.log('[CategoryManagement DELETE] User confirmed, sending DELETE request...');
    
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/v1/admin/categories/${categoryId}/`;
      const token = localStorage.getItem('access_token');
      
      console.log('[CategoryManagement DELETE] API URL:', apiUrl);
      console.log('[CategoryManagement DELETE] Has token:', !!token);
      
      const response = await axios.delete(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[CategoryManagement DELETE] Success! Response:', response.status, response.data);
      
      // Show success notification
      success(response.data.detail || t('categories.category_deleted_successfully'));
      
      setError(null);
      loadItems();
      console.log('[CategoryManagement DELETE] Categories reloaded');
      setShowDeleteModal(false);
      setDeleteCategoryId(null);
      setDeleteCategoryName('');
    } catch (err) {
      console.error('[CategoryManagement DELETE] Error deleting category:', err);
      console.error('[CategoryManagement DELETE] Error status:', err.response?.status);
      console.error('[CategoryManagement DELETE] Error data:', err.response?.data);
      console.error('[CategoryManagement DELETE] Error message:', err.message);
      
      // Get detailed error message from backend response
      let errorDetail = t('categories.category_error');
      
      if (err.response?.data?.detail) {
        errorDetail = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorDetail = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorDetail = 'Cannot delete this category. It may have dependent articles.';
      } else if (err.response?.status === 403) {
        errorDetail = 'You do not have permission to delete this category.';
      } else if (err.response?.status === 404) {
        errorDetail = 'Category not found.';
      } else if (err.response?.status === 500) {
        errorDetail = 'Server error occurred while deleting the category.';
      }
      
      // Show error notification
      showError(errorDetail);
      
      setError(errorDetail);
      setShowDeleteModal(false);
      setDeleteCategoryId(null);
      setDeleteCategoryName('');
    }
  };

  const handleCancelDelete = () => {
    console.log('[CategoryManagement DELETE] User cancelled delete');
    setShowDeleteModal(false);
    setDeleteCategoryId(null);
    setDeleteCategoryName('');
  };

  return (
    <div className={`admin-wrapper ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <AdminSidebar onLogout={onLogout} />
      <div className="admin-content">
        <Container>
          <div className="admin-header">
            <div>
              <h1>{t('categories.title')}</h1>
              <p className="text-muted">{t('categories.subtitle')}</p>
            </div>
            <Button variant="primary" onClick={() => handleOpenModal()} className="btn-add">
              <FiPlus /> {t('categories.add_category')}
            </Button>
          </div>

          {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

          {loading ? (
            <div className="loading-container">
              <Spinner animation="border" role="status" />
              <p>{t('categories.loading_categories')}</p>
            </div>
          ) : items.length > 0 ? (
            <>
              <Card className="table-card">
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-header">
                      <tr>
                        <th style={{ width: '50px', textAlign: 'center' }}>No.</th>
                        <th style={{cursor:'pointer'}} onClick={() => handleSort('name_id')}>
                          {t('categories.name_id')}{getSortIcon('name_id')}
                        </th>
                        <th style={{cursor:'pointer'}} onClick={() => handleSort('name_en')}>
                          {t('categories.name_en')}{getSortIcon('name_en')}
                        </th>
                        <th>{t('categories.description')}</th>
                        <th style={{ width: '8%', textAlign: 'center' }}>{t('categories.articles')}</th>
                        <th>{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={item.id}>
                          <td style={{textAlign:'center',fontWeight:'bold'}}>
                            {(currentPage - 1) * 20 + index + 1}
                          </td>
                          <td>
                            <strong>{item.name_id || '-'}</strong>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong>{item.name_en}</strong>
                              {item.color && (
                                <div
                                  style={{
                                    display: 'inline-block',
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: item.color,
                                    borderRadius: '3px',
                                    border: '1px solid #ddd'
                                  }}
                                  title={`Color: ${item.color}`}
                                />
                              )}
                            </div>
                          </td>
                          <td>
                            {(() => {
                              const description = item.description_id || item.description_en || '';
                              return description ? description.substring(0, 50) + (description.length > 50 ? '...' : '') : '-';
                            })()}
                          </td>
                          <td style={{ textAlign: 'center' }}><Badge bg="info">{item.article_count || 0}</Badge></td>
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
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                      <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>
                        {i + 1}
                      </Pagination.Item>
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
                <h5>{t('categories.no_categories')}</h5>
                <p className="text-muted">{t('buttons.create')} {t('categories.add_category')}</p>
              </Card.Body>
            </Card>
          )}
        </Container>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered className={isDarkMode ? 'dark-mode' : ''}>
        <Modal.Header closeButton>
          <Modal.Title>{modalMode === 'create' ? t('categories.add_category') : t('categories.edit_category')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="category-modal-body">
          {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
          <Form onSubmit={handleSubmitForm}>
            {/* Two Column Layout - Indonesian and English */}
            <Row className="g-4 mb-4">
              {/* Column 1: Indonesian Fields */}
              <Col lg={6}>
                <div className="form-column">
                  <h6 className="column-title" style={{ marginBottom: '1.5rem', fontWeight: '600', color: isDarkMode ? '#e0e0e0' : '#2c3e50' }}>
                    {t('categories.indonesian_info') || 'Informasi Bahasa Indonesia'}
                  </h6>
                  
                  {/* Nama Indonesia */}
                  <Form.Group className="mb-4">
                    <Form.Label className="required-label">
                      {t('categories.name_id') || 'Nama (Indonesia)'} <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>*</span>
                    </Form.Label>
                    <Form.Control 
                      type="text" 
                      value={formData.name_id} 
                      onChange={(e) => setFormData({ ...formData, name_id: e.target.value })} 
                      required 
                      placeholder={t('categories.placeholder_name_id') || 'Masukkan nama kategori'}
                    />
                    <Form.Text className="text-muted d-block mt-1">
                      {t('categories.name_id_help') || 'Nama unik untuk kategori'}
                    </Form.Text>
                  </Form.Group>

                  {/* Deskripsi Indonesia */}
                  <Form.Group className="mb-0">
                    <Form.Label>
                      {t('categories.description_id') || 'Deskripsi (Indonesia)'}
                    </Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={2} 
                      value={formData.description_id} 
                      onChange={(e) => setFormData({ ...formData, description_id: e.target.value })} 
                      placeholder={t('categories.placeholder_description_id') || 'Deskripsi kategori ini'}
                    />
                    <Form.Text className="text-muted d-block mt-1">
                      {t('categories.description_help') || 'Deskripsi jelas membantu pengguna memahami kategori ini'}
                    </Form.Text>
                  </Form.Group>
                </div>
              </Col>

              {/* Column 2: English Fields */}
              <Col lg={6}>
                <div className="form-column">
                  <h6 className="column-title" style={{ marginBottom: '1.5rem', fontWeight: '600', color: isDarkMode ? '#e0e0e0' : '#2c3e50' }}>
                    {t('categories.english_info') || 'Informasi Bahasa Inggris'}
                  </h6>
                  
                  {/* Nama Inggris */}
                  <Form.Group className="mb-4">
                    <Form.Label>
                      {t('categories.name_en') || 'Nama (Inggris)'}
                    </Form.Label>
                    <Form.Control 
                      type="text" 
                      value={formData.name_en} 
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} 
                      placeholder={t('categories.placeholder_name_en') || 'Enter category name in English'}
                    />
                    <Form.Text className="text-muted d-block mt-1">
                      {t('categories.name_en_help') || 'English name for this category'}
                    </Form.Text>
                  </Form.Group>

                  {/* Deskripsi Inggris */}
                  <Form.Group className="mb-0">
                    <Form.Label>
                      {t('categories.description_en') || 'Deskripsi (Inggris)'}
                    </Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={2} 
                      value={formData.description_en} 
                      onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} 
                      placeholder={t('categories.placeholder_description_en') || 'Description in English'}
                    />
                    <Form.Text className="text-muted d-block mt-1">
                      {t('categories.description_en_help') || 'English description for clarity'}
                    </Form.Text>
                  </Form.Group>
                </div>
              </Col>
            </Row>

            {/* Image Upload Section */}
            <Form.Group className="mb-4">
              <Form.Label>{t('categories.image_label')}</Form.Label>
              <div style={{ 
                border: '2px dashed #ccc', 
                borderRadius: '4px', 
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDarkMode ? '#333' : '#f9f9f9'
              }}>
                <input
                  type="file"
                  id="category-image"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="category-image" style={{ cursor: 'pointer', margin: 0 }}>
                  <div>
                    {imagePreview ? (
                      <div>
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          loading="lazy"
                          decoding="async"
                          style={{ maxWidth: '100%', maxHeight: '200px', marginBottom: '10px', objectFit: 'cover' }}
                        />
                        <p>{t('categories.change_image')}</p>
                      </div>
                    ) : (
                      <div>
                        <p>📷 {t('categories.upload_image')}</p>
                        <small>{t('categories.image_requirements')}</small>
                      </div>
                    )}
                  </div>
                </label>
              </div>
              {imagePreview && (
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={handleImageRemove}
                  className="mt-2"
                >
                  {t('buttons.remove_image')}
                </Button>
              )}
            </Form.Group>

            {/* Icon & Color Section - Optional Visual Customization */}
            <div className="mb-3">
              <h6 className="text-muted mb-3">
                <small>{t('common.optional')} - {t('categories.customization_help')}</small>
              </h6>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>{t('categories.color')} <small className="text-muted">({t('common.optional')})</small></Form.Label>
                  
                  {/* Color Picker Section */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                    <Form.Control 
                      type="color" 
                      value={formData.color} 
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      style={{ width: '60px', height: '40px', padding: '4px', cursor: 'pointer' }}
                      title={t('categories.select_color') || 'Select category color'}
                    />
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: formData.color,
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: formData.icon ? 'transparent' : '#666'
                      }}
                    >
                      {formData.icon}
                    </div>
                    <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>{formData.color}</span>
                  </div>
                  
                  <Form.Text className="text-muted d-block mb-2">
                    {t('categories.color_help')}
                  </Form.Text>

                  {/* Hex Color Input */}
                  <Form.Label className="mt-3 mb-2"><small>{t('categories.hex_color_input') || 'Or enter hex color'}</small></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="#007bff"
                    value={formData.color}
                    onChange={handleColorChange}
                    maxLength={7}
                    className="hex-color-input"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    title="Format: #RRGGBB"
                  />
                  <Form.Text className="text-muted d-block mt-1">
                    {t('categories.hex_color_help') || 'Format: #RRGGBB (e.g., #007bff)'}
                  </Form.Text>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>{t('categories.icon')} <small className="text-muted">({t('common.optional')})</small></Form.Label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {['📁', '📚', '🎓', '📊', '💼', '🔧', '📱', '🌐', '📝', '⭐', '💡', '📌'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: emoji })}
                        style={{
                          padding: '8px 12px',
                          fontSize: '20px',
                          border: formData.icon === emoji ? '2px solid #007bff' : '1px solid #ddd',
                          borderRadius: '6px',
                          backgroundColor: formData.icon === emoji ? '#e7f3ff' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <Form.Control 
                    type="text" 
                    value={formData.icon} 
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="Or type emoji/text"
                    size="sm"
                  />
                  <Form.Text className="text-muted small">
                    {t('categories.icon_help')}
                  </Form.Text>
                </Form.Group>
              </div>
            </div>

            {/* Status Section */}
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label={t('categories.is_active')}
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>{t('buttons.cancel')}</Button>
          <Button variant="primary" onClick={handleSubmitForm} disabled={submitting}>
            {submitting ? t('common.saving') : t('buttons.save')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleCancelDelete} size="sm" className={isDarkMode ? 'dark-mode' : ''} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <span style={{ color: '#e74c3c' }}>⚠️ {t('categories.delete_confirmation')}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '1rem', fontSize: '1.05rem' }}>
              {t('categories.confirm_delete')}
            </p>
            <div style={{
              backgroundColor: isDarkMode ? '#2c3e50' : '#f8f9fa',
              padding: '1rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              border: '2px solid #e74c3c'
            }}>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem', color: '#e74c3c' }}>
                {deleteCategoryName}
              </p>
            </div>
            <p style={{ fontSize: '0.95rem', color: '#7f8c8d', marginBottom: 0 }}>
              {t('categories.delete_warning') || 'This action cannot be undone.'}
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCancelDelete}
          >
            {t('buttons.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            style={{ backgroundColor: '#e74c3c', borderColor: '#c0392b' }}
          >
            {t('buttons.delete') || 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default CategoryManagementPage;


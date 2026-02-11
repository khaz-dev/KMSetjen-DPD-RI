import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { Container, Table, Button, Modal, Form, Spinner, Alert, Card, Badge, Pagination } from 'react-bootstrap';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';
import './ManagementPage.css';

function CategoryManagementPage({ onLogout }) {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name_en: '', name_id: '', description: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);
  const [deleteCategoryName, setDeleteCategoryName] = useState('');

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/public/categories/?page=${currentPage}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
      );
      setItems(response.data.results || []);
      setTotalPages(Math.ceil((response.data.count || 0) / 20));
    } catch (err) {
      setError(err.response?.data?.detail || t('categories.category_error'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, t]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleOpenModal = (item = null) => {
    if (item) {
      setModalMode('edit');
      setSelectedItem(item);
      setFormData({ name_en: item.name_en, name_id: item.name_id || '', description: item.description || '' });
    } else {
      setModalMode('create');
      setSelectedItem(null);
      setFormData({ name_en: '', name_id: '', description: '' });
    }
    setShowModal(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const endpoint = modalMode === 'create'
        ? `${import.meta.env.VITE_API_URL}/api/v1/public/categories/`
        : `${import.meta.env.VITE_API_URL}/api/v1/public/categories/${selectedItem.id}/`;
      const method = modalMode === 'create' ? 'post' : 'put';
      await axios({ method, url: endpoint, data: formData, headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });
      loadItems();
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.detail || t('categories.category_error'));
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

  const handleConfirmDelete = async () => {
    const categoryId = deleteCategoryId;
    console.log('[CategoryManagement DELETE] User confirmed, sending DELETE request...');
    
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/v1/public/categories/${categoryId}/`;
      const token = localStorage.getItem('access_token');
      
      console.log('[CategoryManagement DELETE] API URL:', apiUrl);
      console.log('[CategoryManagement DELETE] Has token:', !!token);
      
      const response = await axios.delete(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[CategoryManagement DELETE] Success! Response:', response.status, response.data);
      
      // Show success alert
      alert(`Success: ${response.data.detail || 'Category deleted successfully'}`);
      
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
      
      // Show error alert
      alert(`Error: ${errorDetail}`);
      
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
                        <th>{t('categories.name_en')}</th>
                        <th>{t('categories.name_id')}</th>
                        <th>{t('categories.description')}</th>
                        <th>{t('categories.articles')}</th>
                        <th>{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td><strong>{item.name_en}</strong></td>
                          <td>{item.name_id || '-'}</td>
                          <td>{item.description ? item.description.substring(0, 50) + (item.description.length > 50 ? '...' : '') : '-'}</td>
                          <td><Badge bg="info">{item.article_count || 0}</Badge></td>
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

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" className={isDarkMode ? 'dark-mode' : ''}>
        <Modal.Header closeButton>
          <Modal.Title>{modalMode === 'create' ? t('categories.add_category') : t('categories.edit_category')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitForm}>
            <Form.Group className="mb-3">
              <Form.Label>{t('categories.name_en')} *</Form.Label>
              <Form.Control type="text" value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('categories.name_id')}</Form.Label>
              <Form.Control type="text" value={formData.name_id} onChange={(e) => setFormData({ ...formData, name_id: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('categories.description')}</Form.Label>
              <Form.Control as="textarea" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>{t('buttons.cancel')}</Button>
          <Button variant="primary" onClick={handleSubmitForm} disabled={submitting}>{submitting ? t('common.saving') : t('buttons.save')}</Button>
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


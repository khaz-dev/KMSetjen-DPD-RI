import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { Container, Table, Button, Modal, Form, Spinner, Alert, Card, Badge, Pagination } from 'react-bootstrap';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';
import './ManagementPage.css';

function TagManagementPage({ onLogout }) {
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
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/tags/?page=${currentPage}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
      );
      setItems(response.data.results || []);
      setTotalPages(Math.ceil((response.data.count || 0) / 20));
    } catch (err) {
      setError(err.response?.data?.detail || t('tags.error') || 'Failed to load tags');
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
      loadItems();
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.detail || t('tags.error') || 'Failed to save tag');
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

      setShowDeleteModal(false);
      loadItems();
    } catch (err) {
      setError(t('tags.delete_error') || 'Failed to delete tag');
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
                        <th>{t('tags.name_en') || 'Name (English)'}</th>
                        <th>{t('tags.name_id') || 'Name (Indonesian)'}</th>
                        <th>{t('tags.color') || 'Color'}</th>
                        <th>{t('tags.articles') || 'Knowledge'}</th>
                        <th>{t('tags.status') || 'Status'}</th>
                        <th>{t('common.actions') || 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td><strong>{item.name_en}</strong></td>
                          <td>{item.name_id || '-'}</td>
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
                <h5>{t('tags.no_tags') || 'No tags found'}</h5>
                <p className="text-muted">{t('tags.no_tags_description') || 'Create your first tag'}</p>
              </Card.Body>
            </Card>
          )}
        </Container>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" className={isDarkMode ? 'dark-mode' : ''}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? (t('tags.add_tag') || 'Add Tag') : (t('tags.edit_tag') || 'Edit Tag')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitForm}>
            <Form.Group className="mb-3">
              <Form.Label>{t('tags.name_en') || 'Name (English)'} *</Form.Label>
              <Form.Control
                type="text"
                name="name_en"
                value={formData.name_en}
                onChange={handleFormChange}
                required
                placeholder={t('tags.placeholder_name_en') || 'Enter tag name in English'}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('tags.name_id') || 'Name (Indonesian)'}</Form.Label>
              <Form.Control
                type="text"
                name="name_id"
                value={formData.name_id}
                onChange={handleFormChange}
                placeholder={t('tags.placeholder_name_id') || 'Enter tag name in Indonesian'}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('tags.description_en') || 'Description (English)'}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description_en"
                value={formData.description_en}
                onChange={handleFormChange}
                placeholder={t('tags.placeholder_description_en') || 'Enter description in English'}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('tags.description_id') || 'Description (Indonesian)'}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description_id"
                value={formData.description_id}
                onChange={handleFormChange}
                placeholder={t('tags.placeholder_description_id') || 'Enter description in Indonesian'}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('tags.color') || 'Color'}</Form.Label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Form.Control
                  type="color"
                  name="color"
                  value={formData.color}
                  onChange={handleFormChange}
                  style={{ maxWidth: '60px', cursor: 'pointer' }}
                />
                <Form.Control
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleFormChange}
                  placeholder={t('tags.placeholder_color') || '#3498db'}
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="is_active"
                label={t('tags.active') || 'Active'}
                checked={formData.is_active}
                onChange={handleFormChange}
              />
            </Form.Group>

            <div className="form-actions">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                {t('buttons.cancel') || 'Cancel'}
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    {t('common.saving') || 'Saving...'}
                  </>
                ) : (
                  t('buttons.save') || 'Save'
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

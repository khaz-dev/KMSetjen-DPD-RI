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

  const handleDeleteItem = async (id) => {
    if (!window.confirm(t('categories.confirm_delete'))) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/public/categories/${id}/`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });
      loadItems();
    } catch (err) {
      setError(err.response?.data?.detail || t('categories.category_error'));
    }
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

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
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
    </div>
  );
}

export default CategoryManagementPage;


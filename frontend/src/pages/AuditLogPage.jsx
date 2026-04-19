import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../hooks/useLanguage';
import { Container, Table, Spinner, Alert, Card, Badge, Pagination, Form, Button, Modal } from 'react-bootstrap';
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';
import './ManagementPage.css';

function AuditLogPage({ onLogout }) {
  const { t, i18n } = useTranslation();
  const { isDarkMode } = useTheme();
  const { isIndonesian } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterAction, setFilterAction] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sortBy, setSortBy] = useState('timestamp'); // Sort field
  const [sortOrder, setSortOrder] = useState('desc'); // Sort order: 'asc' or 'desc' - desc by default for logs

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `${import.meta.env.VITE_API_URL}/api/v1/admin/audit-logs/?page=${currentPage}`;
      if (filterAction) url += `&action=${filterAction}`;
      if (filterType) url += `&resource_type=${filterType}`;
      
      // Add sorting
      if (sortBy) {
        const orderingValue = sortOrder === 'desc' ? `-${sortBy}` : sortBy;
        url += `&ordering=${orderingValue}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      });
      setLogs(response.data.results || []);
      setTotalPages(Math.ceil((response.data.count || 0) / 20));
    } catch (err) {
      setError(err.response?.data?.detail || 't:errors.failed_load_audit_logs');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterAction, filterType, sortBy, sortOrder]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getActionBadge = (action) => {
    const normalizedAction = (action || '').toLowerCase();
    const colors = {
      create: 'success',
      update: 'info',
      delete: 'danger',
      publish: 'primary',
      unpublish: 'warning',
      review: 'info',
      approve: 'success',
      reject: 'danger',
      login: 'secondary',
      logout: 'secondary',
      view: 'secondary',
    };
    return colors[normalizedAction] || 'secondary';
  };

  const getActionLabel = useCallback((action) => {
    const normalizedAction = (action || '').toLowerCase();
    const labels = {
      'create': t('audit.actions.create'),
      'update': t('audit.actions.update'),
      'delete': t('audit.actions.delete'),
      'publish': t('audit.actions.publish'),
      'unpublish': t('audit.actions.unpublish'),
      'review': t('audit.actions.review'),
      'approve': t('audit.actions.approve'),
      'reject': t('audit.actions.reject'),
      'login': t('audit.actions.login'),
      'logout': t('audit.actions.logout'),
      'view': t('audit.actions.view'),
    };
    return labels[normalizedAction] || normalizedAction;
  }, [t]);

  const getResourceTypeLabel = useCallback((type) => {
    const labels = {
      'Article': t('audit.object_types.Article'),
      'article': t('audit.object_types.Article'),
      'User': t('audit.object_types.User'),
      'user': t('audit.object_types.User'),
      'Role': t('audit.object_types.Role'),
      'role': t('audit.object_types.Role'),
      'Category': t('audit.object_types.Category'),
      'category': t('audit.object_types.Category'),
    };
    return labels[type] || type;
  }, [t]);

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
              <h1>{t('audit.title')}</h1>
              <p className="text-muted">{t('audit.subtitle')}</p>
            </div>
          </div>

          {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

          <Card className="filter-card mb-4">
            <Card.Body>
              <div className="filter-row">
                <Form.Group className="filter-group">
                  <Form.Label>{t('audit.action')}</Form.Label>
                  <Form.Select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1); }}>
                    <option value="">{t('audit.all_actions')}</option>
                    <option value="create">{t('audit.actions.create')}</option>
                    <option value="update">{t('audit.actions.update')}</option>
                    <option value="delete">{t('audit.actions.delete')}</option>
                    <option value="publish">{t('audit.actions.publish')}</option>
                    <option value="unpublish">{t('audit.actions.unpublish')}</option>
                    <option value="review">{t('audit.actions.review')}</option>
                    <option value="approve">{t('audit.actions.approve')}</option>
                    <option value="reject">{t('audit.actions.reject')}</option>
                    <option value="view">{t('audit.actions.view')}</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="filter-group">
                  <Form.Label>{t('audit.resource_type')}</Form.Label>
                  <Form.Select value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}>
                    <option value="">{t('audit.all_types')}</option>
                    <option value="Article">{t('audit.object_types.Article')}</option>
                    <option value="User">{t('audit.object_types.User')}</option>
                    <option value="Role">{t('audit.object_types.Role')}</option>
                    <option value="Category">{t('audit.object_types.Category')}</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </Card.Body>
          </Card>

          {loading ? (
            <div className="loading-container">
              <Spinner animation="border" role="status" />
              <p>{t('audit.loading_logs')}</p>
            </div>
          ) : logs.length > 0 ? (
            <>
              <Card className="table-card">
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-header">
                      <tr>
                        <th style={{cursor:'pointer'}} onClick={() => handleSort('timestamp')}>
                          {t('audit.timestamp')}{getSortIcon('timestamp')}
                        </th>
                        <th style={{cursor:'pointer'}} onClick={() => handleSort('user_name')}>
                          {t('audit.user')}{getSortIcon('user_name')}
                        </th>
                        <th style={{cursor:'pointer'}} onClick={() => handleSort('action')}>
                          {t('audit.action')}{getSortIcon('action')}
                        </th>
                        <th style={{cursor:'pointer'}} onClick={() => handleSort('resource_type')}>
                          {t('audit.resource_type')}{getSortIcon('resource_type')}
                        </th>
                        <th>{t('audit.object_id')}</th>
                        <th>{t('audit.ip_address')}</th>
                        <th>{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td className="date-cell">{new Date(log.timestamp).toLocaleString()}</td>
                          <td>{log.user_name || t('common.unknown_author')}</td>
                          <td><Badge bg={getActionBadge(log.action)}>{getActionLabel(log.action)}</Badge></td>
                          <td>{getResourceTypeLabel(log.resource_type)}</td>
                          <td><code>{log.content_id}</code></td>
                          <td className="ip-cell">{log.ip_address || '-'}</td>
                          <td>
                            <Button 
                              variant="outline-info" 
                              size="sm" 
                              onClick={() => { setSelectedLog(log); setShowDetails(true); }}
                            >
                              {t('audit.view_details')}
                            </Button>
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
                      <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>{i + 1}</Pagination.Item>
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
                <h5>{t('audit.no_logs')}</h5>
                <p className="text-muted">{t('audit.no_activity_match')}</p>
              </Card.Body>
            </Card>
          )}
        </Container>
      </div>

      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg" dialogClassName={isDarkMode ? 'dark-mode' : ''}>
        <Modal.Header closeButton>
          <Modal.Title>{t('audit.view_details')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLog && (
            <div>
              <div className="detail-row mb-3">
                <strong>{t('audit.timestamp')}:</strong>
                <p>{new Date(selectedLog.timestamp).toLocaleString()}</p>
              </div>
              <div className="detail-row mb-3">
                <strong>{t('audit.user')}:</strong>
                <p>{selectedLog.user_name || t('common.unknown_author')}</p>
              </div>
              <div className="detail-row mb-3">
                <strong>{t('audit.action')}:</strong>
                <p><Badge bg={getActionBadge(selectedLog.action)}>{getActionLabel(selectedLog.action)}</Badge></p>
              </div>
              <div className="detail-row mb-3">
                <strong>{t('audit.resource_type')}:</strong>
                <p>{getResourceTypeLabel(selectedLog.resource_type)}</p>
              </div>
              <div className="detail-row mb-3">
                <strong>{t('audit.object_id')}:</strong>
                <p><code>{selectedLog.content_id}</code></p>
              </div>
              <div className="detail-row mb-3">
                <strong>{t('audit.ip_address')}:</strong>
                <p>{selectedLog.ip_address || '-'}</p>
              </div>
              {selectedLog.changes && (
                <div className="detail-row mb-3">
                  <strong>{t('audit.changes')}:</strong>
                  <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                    {typeof selectedLog.changes === 'string' ? selectedLog.changes : JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetails(false)}>
            {t('common.close')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AuditLogPage;


import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Table, Spinner, Alert, Card, Badge, Pagination, Form } from 'react-bootstrap';
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';
import './ManagementPage.css';

function AuditLogPage({ onLogout }) {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterAction, setFilterAction] = useState('');
  const [filterType, setFilterType] = useState('');

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `${process.env.REACT_APP_API_URL}/api/v1/admin/audit-logs/?page=${currentPage}`;
      if (filterAction) url += `&action=${filterAction}`;
      if (filterType) url += `&resource_type=${filterType}`;
      
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
  }, [currentPage, filterAction, filterType]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getActionBadge = (action) => {
    const colors = {
      CREATE: 'success',
      UPDATE: 'info',
      DELETE: 'danger',
      PUBLISH: 'primary',
      APPROVE: 'success',
      REJECT: 'danger',
    };
    return colors[action] || 'secondary';
  };

  return (
    <div className="admin-wrapper">
      <AdminSidebar onLogout={onLogout} />
      <div className="admin-content">
        <Container fluid>
          <div className="admin-header">
            <div>
              <h1>Audit Logs</h1>
              <p className="text-muted">System activity and change tracking</p>
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
                    <option value="CREATE">{t('audit.actions.CREATE')}</option>
                    <option value="UPDATE">{t('audit.actions.UPDATE')}</option>
                    <option value="DELETE">{t('audit.actions.DELETE')}</option>
                    <option value="PUBLISH">{t('audit.actions.PUBLISH')}</option>
                    <option value="APPROVE">{t('audit.actions.APPROVE')}</option>
                    <option value="REJECT">{t('audit.actions.REJECT')}</option>
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
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Resource Type</th>
                        <th>Resource ID</th>
                        <th>IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td className="date-cell">{new Date(log.timestamp).toLocaleString()}</td>
                          <td>{log.user?.username || t('common.unknown_author')}</td>
                          <td><Badge bg={getActionBadge(log.action)}>{log.action}</Badge></td>
                          <td>{log.resource_type}</td>
                          <td><code>{log.resource_id}</code></td>
                          <td className="ip-cell">{log.ip_address || '-'}</td>
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
    </div>
  );
}

export default AuditLogPage;

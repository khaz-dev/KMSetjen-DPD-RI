import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { FiUsers, FiFileText, FiActivity, FiTrendingUp } from 'react-icons/fi';
import AdminSidebar from '../components/AdminSidebar';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import './AdminDashboardPage.css';

/**
 * AdminDashboardPage Component
 * Main admin dashboard with system statistics and KPI cards
 */
function AdminDashboardPage({ onLogout }) {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to translate status values
  const getStatusLabel = (status) => {
    return t(`status.${status}`, status);
  };

  // Helper function to translate role values
  const getRoleLabel = (role) => {
    return t(`roles.${role}`, role);
  };

  // Helper function to translate and normalize audit action values
  const getActionLabel = (action) => {
    // Normalize action name to lowercase for consistent translation lookup
    const normalizedAction = action.toLowerCase();
    return t(`audit_actions.${normalizedAction}`, action);
  };

  // Helper function to normalize and deduplicate audit actions
  const normalizeAuditActions = (auditLogsObj) => {
    const normalized = {};
    Object.entries(auditLogsObj).forEach(([action, count]) => {
      const key = action.toLowerCase();
      normalized[key] = (normalized[key] || 0) + count;
    });
    return normalized;
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/statistics/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      setStats(response.data);
    } catch (err) {
      console.error('Error loading statistics:', err);
      setError(
        err.response?.data?.detail || 'Failed to load statistics. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, subtext, bgColor }) => (
    <Card className={`stat-card stat-card-${bgColor}`}>
      <Card.Body>
        <div className="stat-content">
          <Icon className="stat-icon" />
          <div className="stat-info">
            <h6 className="stat-label">{label}</h6>
            <div className="stat-value">{value}</div>
            {subtext && <small className="stat-subtext">{subtext}</small>}
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className={`admin-dashboard-wrapper ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <AdminSidebar onLogout={onLogout} />

      <div className="admin-content">
        <Container>
          {/* Header */}
          <div className="admin-header">
            <div className="header-content">
              <h1>{t('admin.title')}</h1>
              <p className="text-muted">{t('common.system_overview')}</p>
            </div>
            <button
              className="btn btn-refresh"
              onClick={loadStatistics}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    style={{ marginRight: '0.5rem' }}
                  />
                  {t('common.refreshing')}
                </>
              ) : (
                t('common.refresh')
              )}
            </button>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="loading-container">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p>{t('common.loading')}</p>
            </div>
          ) : stats ? (
            <>
              {/* KPI Cards Row 1 */}
              <Row className="mb-4">
                <Col lg={3} md={6} className="mb-3">
                  <StatCard
                    icon={FiUsers}
                    label={t('admin.total_users')}
                    value={stats.total_users || 0}
                    subtext={`${stats.active_users || 0} ${t('common.active')}`}
                    bgColor="blue"
                  />
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <StatCard
                    icon={FiFileText}
                    label={t('admin.total_articles')}
                    value={stats.total_articles || 0}
                    subtext={`${stats.published_articles || 0} ${t('common.published')}`}
                    bgColor="green"
                  />
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <StatCard
                    icon={FiActivity}
                    label={t('sidebar.audit_log')}
                    value={stats.total_audit_logs || 0}
                    subtext={t('audit.title')}
                    bgColor="purple"
                  />
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <StatCard
                    icon={FiTrendingUp}
                    label={t('moderation.pending_review')}
                    value={stats.in_review_articles || 0}
                    subtext={`${stats.draft_articles || 0} ${t('common.drafts')}`}
                    bgColor="orange"
                  />
                </Col>
              </Row>

              {/* Status Breakdown */}
              <Row className="mb-4">
                <Col lg={6} className="mb-3">
                  <Card className="breakdown-card">
                    <Card.Header>
                      <Card.Title className="mb-0">{t('admin.users_by_role')}</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      {stats.users_by_role && Object.keys(stats.users_by_role).length > 0 ? (
                        <div className="breakdown-list">
                          {Object.entries(stats.users_by_role).map(([role, count]) => (
                            <div key={role} className="breakdown-item">
                              <span className="role-name">{getRoleLabel(role)}</span>
                              <span className="badge bg-primary">{count}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted">{t('admin.no_users_with_roles')}</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={6} className="mb-3">
                  <Card className="breakdown-card">
                    <Card.Header>
                      <Card.Title className="mb-0">{t('admin.articles_by_status')}</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      {stats.articles_by_status && Object.keys(stats.articles_by_status).length > 0 ? (
                        <div className="breakdown-list">
                          {Object.entries(stats.articles_by_status).map(([status, count]) => (
                            <div key={status} className="breakdown-item">
                              <span className="status-name">{getStatusLabel(status)}</span>
                              <span className="badge bg-success">{count}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted">{t('admin.no_articles')}</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Audit Activity */}
              <Row>
                <Col lg={12}>
                  <Card className="activity-card">
                    <Card.Header>
                      <Card.Title className="mb-0">{t('admin.audit_activity_by_action')}</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      {stats.audit_logs_by_action && Object.keys(stats.audit_logs_by_action).length > 0 ? (
                        <div className="breakdown-list">
                          {Object.entries(normalizeAuditActions(stats.audit_logs_by_action))
                            .sort((a, b) => b[1] - a[1])
                            .map(([action, count]) => (
                              <div key={action} className="breakdown-item">
                                <span className="action-name">{getActionLabel(action)}</span>
                                <span className="badge bg-info">{count}</span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-muted">{t('audit.no_logs')}</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          ) : null}
        </Container>
      </div>
    </div>
  );
}

export default AdminDashboardPage;


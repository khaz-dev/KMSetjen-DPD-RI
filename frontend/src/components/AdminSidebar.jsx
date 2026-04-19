import React, { useState } from 'react';
import { Nav, NavLink, Badge } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useArticleCount } from '../contexts/ArticleCountContext';
import {
  FiHome, FiUsers, FiLayers, FiFolder, FiFileText,
  FiActivity, FiMenu, FiX, FiLogOut, FiTag
} from 'react-icons/fi';
import './AdminSidebar.css';

/**
 * AdminSidebar Component
 * Navigation sidebar for admin panel with menu items
 */
function AdminSidebar({ onLogout, pendingReviewCount = 0 }) {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { pendingReviewCount: contextPendingCount } = useArticleCount();

  // Use context count, fall back to prop if not available
  const displayCount = contextPendingCount || pendingReviewCount;

  const menuItems = [
    { path: '/admin', icon: FiHome, label: t('sidebar.dashboard') || 'Dashboard', exact: true },
    { path: '/admin/users', icon: FiUsers, label: t('sidebar.users') || 'Users' },
    { path: '/admin/roles', icon: FiLayers, label: t('sidebar.roles') || 'Roles & Permissions' },
    { path: '/admin/categories', icon: FiFolder, label: t('sidebar.categories') || 'Categories' },
    { path: '/admin/tags', icon: FiTag, label: t('sidebar.tags') || 'Tags' },
    { 
      path: '/admin/articles', 
      icon: FiFileText, 
      label: t('sidebar.articles') || 'Knowledge Moderation',
      badge: displayCount > 0 ? displayCount : null
    },
    { path: '/admin/audit-logs', icon: FiActivity, label: t('sidebar.audit_log') || 'Audit Logs' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Toggle Button */}
      <button
        className="sidebar-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label="Toggle sidebar"
      >
        {isCollapsed ? <FiMenu /> : <FiX />}
      </button>

      {/* Logo/Header */}
      {!isCollapsed && (
        <div className="sidebar-header">
          <h5 className="mb-0">{t('sidebar.admin_panel')}</h5>
        </div>
      )}

      {/* Navigation */}
      <Nav className="flex-column nav-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            as="button"
            onClick={() => navigate(item.path)}
            active={isActive(item.path, item.exact)}
            className={`nav-item ${isActive(item.path, item.exact) ? 'active' : ''}`}
            title={isCollapsed ? item.label : ''}
          >
            <item.icon className="nav-icon" />
            {!isCollapsed && (
              <span className="nav-label">
                {item.label}
                {item.badge && <Badge bg="danger" className="ms-auto">{item.badge}</Badge>}
              </span>
            )}
          </NavLink>
        ))}
      </Nav>

      {/* Logout Button */}
      <div className="sidebar-footer">
        <button
          className="btn btn-logout w-100"
          onClick={onLogout}
          title={isCollapsed ? t('sidebar.logout') : ''}
        >
          <FiLogOut className="nav-icon" />
          {!isCollapsed && <span className="nav-label">{t('sidebar.logout')}</span>}
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;


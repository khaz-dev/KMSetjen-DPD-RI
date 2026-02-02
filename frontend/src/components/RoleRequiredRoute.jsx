import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * RoleRequiredRoute Component
 * Protects routes based on user role(s)
 * 
 * Usage:
 * <RoleRequiredRoute requiredRoles={['ADMIN']} element={<AdminDashboard />} />
 * <RoleRequiredRoute requiredRoles={['EDITOR', 'CONTRIBUTOR']} element={<EditArticle />} />
 */
const RoleRequiredRoute = ({ element, requiredRoles = [] }) => {
  const { user, isAuthenticated } = useAuth();

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // If user role is not in required roles, redirect to 403
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  // User has required role, render element
  return element;
};

export default RoleRequiredRoute;


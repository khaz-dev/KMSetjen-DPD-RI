import { useAuth } from '../contexts/AuthContext';

/**
 * usePermission Hook
 * Provides role-based permission checking
 * 
 * Usage:
 * const { hasRole, can } = usePermission();
 * 
 * if (hasRole('ADMIN')) {
 *   // Show admin features
 * }
 * 
 * if (can(['EDITOR', 'CONTRIBUTOR'])) {
 *   // Show editor features
 * }
 */
export const usePermission = () => {
  const { user } = useAuth();

  /**
   * Check if user has a specific role
   * @param {string} role - The role to check
   * @returns {boolean}
   */
  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

  /**
   * Check if user has any of the specified roles
   * @param {string[]} roles - Array of roles to check
   * @returns {boolean}
   */
  const can = (roles) => {
    if (!user) return false;
    return Array.isArray(roles) ? roles.includes(user.role) : user.role === roles;
  };

  /**
   * Check if user is admin
   * @returns {boolean}
   */
  const isAdmin = () => hasRole('ADMIN');

  /**
   * Check if user can edit
   * @returns {boolean}
   */
  const canEdit = () => can(['ADMIN', 'EDITOR']);

  /**
   * Check if user can contribute
   * @returns {boolean}
   */
  const canContribute = () => can(['ADMIN', 'EDITOR', 'CONTRIBUTOR']);

  /**
   * Check if user can read
   * @returns {boolean}
   */
  const canRead = () => can(['ADMIN', 'EDITOR', 'CONTRIBUTOR', 'READER', 'PUBLIC']);

  return {
    user,
    hasRole,
    can,
    isAdmin,
    canEdit,
    canContribute,
    canRead,
  };
};

export default usePermission;


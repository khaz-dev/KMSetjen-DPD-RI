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
  const { user, loading: authLoading } = useAuth();

  /**
   * Check if user has a specific role
   * @param {string} role - The role to check
   * @returns {boolean}
   */
  const hasRole = (role) => {
    // Return false while auth is loading
    if (authLoading || !user) return false;
    if (!user.roles || !Array.isArray(user.roles)) return false;
    // Case-insensitive comparison with role.toUpperCase()
    return user.roles.some(r => r.toUpperCase() === role.toUpperCase());
  };

  /**
   * Check if user has any of the specified roles
   * @param {string[]} roles - Array of roles to check
   * @returns {boolean}
   */
  const can = (roles) => {
    // Return false while auth is loading
    if (authLoading || !user) return false;
    if (!user.roles || !Array.isArray(user.roles)) return false;
    
    if (!Array.isArray(roles)) {
      return user.roles.some(r => r.toUpperCase() === roles.toUpperCase());
    }
    
    // Case-insensitive comparison with roles.toUpperCase()
    return user.roles.some(userRole =>
      roles.some(requiredRole => userRole.toUpperCase() === requiredRole.toUpperCase())
    );
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


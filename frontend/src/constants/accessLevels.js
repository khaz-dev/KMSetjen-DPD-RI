/**
 * Access Level Constants and Role-Based Permissions
 * Defines what access levels each role can set for articles
 */

// Access Level Codes
export const ACCESS_LEVELS = {
  PUBLIC: 'public',
  INTERNAL: 'internal',
  ROLE_BASED: 'role_based',
};

// Access Level Display Names (for translation keys)
export const ACCESS_LEVEL_LABELS = {
  [ACCESS_LEVELS.PUBLIC]: 'editor.access_public',
  [ACCESS_LEVELS.INTERNAL]: 'editor.access_internal',
  [ACCESS_LEVELS.ROLE_BASED]: 'editor.access_role_based',
};

// Default fallback labels
export const ACCESS_LEVEL_DEFAULTS = {
  [ACCESS_LEVELS.PUBLIC]: 'Public (Umum)',
  [ACCESS_LEVELS.INTERNAL]: 'Internal (Semua ASN)',
  [ACCESS_LEVELS.ROLE_BASED]: 'Role-Based (Peran Tertentu)',
};

/**
 * Role Hierarchy for Content Creation & Access Levels
 * 
 * From docs/01_SYSTEM_ARCHITECTURE.md:
 * | FITUR | PUBLIC | READER | CONTRIBUTOR | EDITOR | ADMIN |
 * |-------|--------|--------|-------------|--------|-------|
 * | Create Draft | - | - | ✓ | ✓ | ✓ |
 * 
 * Only CONTRIBUTOR, EDITOR, ADMIN can create articles.
 * All three (if they can create) can use all access levels:
 * - Public: anyone can read
 * - Internal: only authenticated users (Reader+) can read
 * - Role-Based: specific roles can read
 */
export const ROLE_ACCESS_LEVEL_PERMISSIONS = {
  ADMIN: [
    ACCESS_LEVELS.PUBLIC,
    ACCESS_LEVELS.INTERNAL,
    ACCESS_LEVELS.ROLE_BASED,
  ],
  EDITOR: [
    ACCESS_LEVELS.PUBLIC,
    ACCESS_LEVELS.INTERNAL,
    ACCESS_LEVELS.ROLE_BASED,
  ],
  CONTRIBUTOR: [
    ACCESS_LEVELS.PUBLIC,
    ACCESS_LEVELS.INTERNAL,
    ACCESS_LEVELS.ROLE_BASED,
  ],
  READER: [], // Cannot create articles
  PUBLIC: [], // Cannot create articles
};

/**
 * Get available access levels for a specific role
 * @param {string} primaryRole - User's primary role (e.g., 'admin', 'editor')
 * @returns {string[]} Array of access level codes the user can use
 */
export const getAvailableAccessLevels = (primaryRole) => {
  if (!primaryRole) return [];
  
  const upperRole = primaryRole.toUpperCase();
  return ROLE_ACCESS_LEVEL_PERMISSIONS[upperRole] || [];
};

/**
 * Check if a user with a specific role can set articles to a given access level
 * @param {string} primaryRole - User's primary role
 * @param {string} accessLevel - Desired access level
 * @returns {boolean} True if role can use this access level
 */
export const canUseAccessLevel = (primaryRole, accessLevel) => {
  const availableLevels = getAvailableAccessLevels(primaryRole);
  return availableLevels.includes(accessLevel);
};

/**
 * Check if a user can access the article editor at all
 * @param {string} primaryRole - User's primary role
 * @returns {boolean} True if user can create/edit articles
 */
export const canAccessArticleEditor = (primaryRole) => {
  if (!primaryRole) return false;
  
  const upperRole = primaryRole.toUpperCase();
  const allowedRoles = ['ADMIN', 'EDITOR', 'CONTRIBUTOR'];
  return allowedRoles.includes(upperRole);
};

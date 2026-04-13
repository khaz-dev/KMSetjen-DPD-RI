/**
 * Image Constants and Utilities
 * Centralized configuration for default and fallback images
 */

/**
 * Get app subpath from build-time environment variable.
 * 
 * IMPORTANT: This MUST use import.meta.env.VITE_APP_SUBPATH, not window.location.pathname,
 * because:
 * - The app subpath is a deployment-time configuration constant
 * - window.location.pathname includes BOTH app subpath AND current page route
 * - Cannot reliably distinguish between them (e.g., /knowledges could be a route or subpath)
 * - Bug example: On local dev, /knowledges route was mistakenly detected as the app subpath,
 *   resulting in logo path /knowledges/logo.png instead of /logo.png
 * 
 * Solution: Always use the build-time environment variable
 * @returns {string} App subpath (e.g., '/', '/kms', '/kmsetjendpdri')
 */
export const getAppSubpath = () => {
  // Use environment variable set at build time (more reliable than runtime detection)
  return import.meta.env.VITE_APP_SUBPATH || '/';
};

// Get default images with current subpath - can be called at render time
export const getDefaultImages = () => {
  const appSubpath = getAppSubpath();
  const basePath = appSubpath === '/' ? '' : appSubpath;
  
  return {
    ARTICLE: `${basePath}/default-article-image.svg`,
    CATEGORY: `${basePath}/default-category-image.svg`,
    LOGO: `${basePath}/logo.png`,
    LOGO_NUSA: `${basePath}/logo_nusa.png`
  };
};

// Static export for backward compatibility
const appSubpath = getAppSubpath();
const basePath = appSubpath === '/' ? '' : appSubpath;

export const DEFAULT_IMAGES = {
  ARTICLE: `${basePath}/default-article-image.svg`,
  CATEGORY: `${basePath}/default-category-image.svg`,
  LOGO: `${basePath}/logo.png`,
  LOGO_NUSA: `${basePath}/logo_nusa.png`
};

/**
 * Get the appropriate default image based on image type
 * @param {string} type - Image type ('article', 'category', 'repository', 'logo')
 * @returns {string} - Path to default image
 */
export const getDefaultImage = (type = 'article') => {
  const defaultImages = {
    'article': DEFAULT_IMAGES.ARTICLE,
    'category': DEFAULT_IMAGES.CATEGORY,
    'repository': DEFAULT_IMAGES.CATEGORY, // Use category default for repositories
    'logo': DEFAULT_IMAGES.LOGO
  };
  return defaultImages[type] || DEFAULT_IMAGES.ARTICLE;
};

/**
 * Check if image source is valid and not empty
 * @param {string} imageSrc - Image source URL
 * @returns {boolean} - Whether image source is valid
 */
export const isValidImageSource = (imageSrc) => {
  return imageSrc && 
         typeof imageSrc === 'string' && 
         imageSrc.trim() !== '' && 
         imageSrc.trim() !== '/';
};

/**
 * Handle image load error and fallback
 * @param {Event} event - Image error event
 * @param {string} defaultImageSrc - Default image source to fallback to
 */
export const handleImageError = (event, defaultImageSrc) => {
  if (event && event.target) {
    event.target.src = defaultImageSrc || DEFAULT_IMAGES.ARTICLE;
    event.target.onerror = null; // Prevent infinite loop
  }
};

export default {
  DEFAULT_IMAGES,
  getDefaultImage,
  isValidImageSource,
  handleImageError
};

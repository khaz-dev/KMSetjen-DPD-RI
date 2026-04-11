/**
 * Image Constants and Utilities
 * Centralized configuration for default and fallback images
 */

// Detect app subpath from window location at runtime
// This is the primary method as it's more reliable than build-time environment variables
export const getAppSubpath = () => {
  if (typeof window === 'undefined') return '/';
  
  const path = window.location.pathname;
  // Match /kms, /kmsetjendpdri, etc from the pathname
  const match = path.match(/^(\/[a-z_]+)/);
  if (match && match[1] && match[1] !== '/') {
    return match[1];
  }
  
  // Fallback to environment variable if pathname detection fails
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
 * @param {string} type - Image type ('article', 'category', 'logo')
 * @returns {string} - Path to default image
 */
export const getDefaultImage = (type = 'article') => {
  const defaultImages = {
    'article': DEFAULT_IMAGES.ARTICLE,
    'category': DEFAULT_IMAGES.CATEGORY,
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

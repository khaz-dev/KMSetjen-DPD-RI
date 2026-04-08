/**
 * Image Constants and Utilities
 * Centralized configuration for default and fallback images
 */

// Get app subpath from Vite environment
const appSubpath = import.meta.env.VITE_APP_SUBPATH || '/';
const basePath = appSubpath.replace(/\/$/, '');

export const DEFAULT_IMAGES = {
  ARTICLE: `${basePath}/default-article-image.svg`,
  CATEGORY: `${basePath}/default-category-image.svg`,
  LOGO: `${basePath}/logo.png`
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

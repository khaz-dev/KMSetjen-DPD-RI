import React, { useState } from 'react';
import { DEFAULT_IMAGES, isValidImageSource, getDefaultImage } from '../utils/imageUtils';

/**
 * ImageWithFallback Component
 * Displays an image with automatic fallback to default image on load failure
 * 
 * @param {Object} props - Component props
 * @param {string} props.src - Primary image source URL
 * @param {string} props.alt - Alternative text for the image
 * @param {string} props.className - CSS class names
 * @param {string} props.type - Image type for fallback ('article', 'category', 'logo')
 * @param {function} props.onLoad - Callback when image loads successfully
 * @param {function} props.onError - Callback when image fails to load
 * @param {object} props.style - Inline styles
 * @param {string} props.title - Image title attribute
 * @returns {React.ReactElement} - Image element with fallback handling
 */
const ImageWithFallback = ({
  src,
  alt = 'Image',
  className = '',
  type = 'article',
  onLoad = null,
  onError = null,
  style = {},
  title = ''
}) => {
  const [imageSrc, setImageSrc] = useState(
    isValidImageSource(src) ? src : getDefaultImage(type)
  );
  const [hasError, setHasError] = useState(!isValidImageSource(src));

  const handleImageLoad = (e) => {
    setHasError(false);
    if (onLoad && typeof onLoad === 'function') {
      onLoad(e);
    }
  };

  const handleImageError = (e) => {
    // Prevent infinite error loop
    if (!hasError) {
      setHasError(true);
      setImageSrc(getDefaultImage(type));
    }
    if (onError && typeof onError === 'function') {
      onError(e);
    }
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={style}
      title={title}
      onLoad={handleImageLoad}
      onError={handleImageError}
      crossOrigin="anonymous"
      loading="lazy"
    />
  );
};

export default ImageWithFallback;

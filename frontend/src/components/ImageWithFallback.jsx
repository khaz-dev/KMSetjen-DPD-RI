import React, { useState, useEffect } from 'react';
import { isValidImageSource, getDefaultImage } from '../utils/imageUtils';

/**
 * ImageWithFallback Component
 * Displays an image with automatic fallback to default image on load failure.
 * Optimized for performance with async decoding, customizable loading strategy,
 * and seamless fallback handling.
 * 
 * @param {Object} props - Component props
 * @param {string} props.src - Primary image source URL
 * @param {string} props.alt - Alternative text for the image
 * @param {string} props.className - CSS class names
 * @param {string} props.type - Image type for fallback ('article', 'category', 'repository', 'logo')
 * @param {string} props.loading - Image loading strategy ('lazy' | 'eager')
 * @param {string} props.decoding - Image decoding strategy ('async' | 'sync' | 'auto')
 * @param {string} props.fetchPriority - Fetch priority hint ('auto' | 'high' | 'low')
 * @param {number|string} props.width - Explicit width for aspect ratio / CLS prevention
 * @param {number|string} props.height - Explicit height for aspect ratio / CLS prevention
 * @param {string} props.crossOrigin - CORS setting ('anonymous' | 'use-credentials' | null)
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
  loading = 'lazy',
  decoding = 'async',
  fetchPriority = 'auto',
  width = undefined,
  height = undefined,
  crossOrigin = undefined,
  onLoad = null,
  onError = null,
  style = {},
  title = ''
}) => {
  const [imageSrc, setImageSrc] = useState(
    isValidImageSource(src) ? src : getDefaultImage(type)
  );
  const [hasError, setHasError] = useState(!isValidImageSource(src));

  // Sync state when src or type changes in parent
  useEffect(() => {
    if (isValidImageSource(src)) {
      setImageSrc(src);
      setHasError(false);
    } else {
      setImageSrc(getDefaultImage(type));
      setHasError(true);
    }
  }, [src, type]);

  const handleImageLoad = (e) => {
    setHasError(false);
    if (onLoad && typeof onLoad === 'function') {
      onLoad(e);
    }
  };

  const handleImageError = (e) => {
    // Prevent infinite error loop if default fallback also fails
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
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      fetchpriority={fetchPriority && fetchPriority !== 'auto' ? fetchPriority : undefined}
      crossOrigin={crossOrigin}
      onLoad={handleImageLoad}
      onError={handleImageError}
    />
  );
};

export default ImageWithFallback;

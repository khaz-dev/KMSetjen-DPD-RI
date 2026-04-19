import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './styles/PptxGallery.css';

/**
 * PptxGallery Component
 * Enhanced presentation viewer with:
 * - Slide thumbnails gallery
 * - Full-screen slide viewer
 * - Navigation controls
 * - Beautiful carousel UI
 * - Responsive design
 * 
 * Props:
 *   - fileUrl: URL to the PPTX file
 *   - fileId: ID of the file object (for API calls)
 *   - articleId: ID of the article (for API calls)
 *   - fileName: Name of the file for display
 *   - onError: Optional callback when viewer fails
 */
const PptxGallery = ({ fileUrl, fileId, articleId, fileName, onError }) => {
  const { t } = useTranslation();
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [pptxInfo, setPptxInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('gallery'); // 'gallery' or 'fullscreen'
  const [thumbnailsLoaded, setThumbnailsLoaded] = useState(false);
  const containerRef = useRef(null);

  // Load PPTX info and thumbnails on mount
  useEffect(() => {
    const loadPresentation = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get presentation info
        if (articleId && fileId) {
          try {
            console.log(`[PptxGallery] Loading presentation - articleId: ${articleId}, fileId: ${fileId}`);
            
            // Create axios instance with auth token
            const token = localStorage.getItem('access_token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002/api';
            
            const infoResponse = await axios.get(
              `${baseURL}/v1/internal/articles/${articleId}/files/${fileId}/pptx_info/`,
              config
            );
            console.log('[PptxGallery] pptx_info response:', {
              status: infoResponse.status,
              headers: infoResponse.headers,
              data: infoResponse.data
            });
            setPptxInfo(infoResponse.data);

            // Load all thumbnails
            const thumbResponse = await axios.get(
              `${baseURL}/v1/internal/articles/${articleId}/files/${fileId}/thumbnails_all/`,
              config
            );
            
            console.log(`[PptxGallery] thumbnails_all API Response:`, {
              status: thumbResponse.status,
              url: thumbResponse.config.url,
              headers: {
                'content-type': thumbResponse.headers['content-type'],
                'authorization': thumbResponse.config.headers?.Authorization?.substring(0, 20) + '...'
              },
              data: {
                file_id: thumbResponse.data.file_id,
                total_slides: thumbResponse.data.total_slides,
                thumbnails_count: thumbResponse.data.thumbnails?.length || 0,
                first_thumbnail: thumbResponse.data.thumbnails?.[0]?.thumbnail?.substring(0, 80)
              }
            });
            
            const thumbnailSlides = thumbResponse.data.thumbnails.map(t => ({
              slide: t.slide,
              thumbnail: t.thumbnail
            }));
            
            console.log('[PptxGallery] Thumbnail data received:', {
              total_thumbnails: thumbnailSlides.length,
              first_thumbnail_preview: thumbnailSlides[0]?.thumbnail?.substring(0, 50) + '...',
              all_have_data: thumbnailSlides.every(t => t.thumbnail !== null && t.thumbnail !== undefined),
              thumbnail_types: thumbnailSlides.map(t => ({ slide: t.slide, has_data: !!t.thumbnail, data_type: typeof t.thumbnail, data_prefix: t.thumbnail?.substring(0, 25) })),
              full_response: thumbResponse.data
            });
            
            setSlides(thumbnailSlides);
            setThumbnailsLoaded(true);
            setLoading(false);
          } catch (apiError) {
            console.error('[PptxGallery] ❌ API LOAD FAILED - Full Error Details:', {
              status_code: apiError.response?.status,
              status_text: apiError.response?.statusText,
              error_message: apiError.response?.data?.error || apiError.response?.data?.detail || apiError.message,
              request_url: apiError.config?.url,
              request_method: apiError.config?.method,
              request_headers: apiError.config?.headers,
              response_headers: apiError.response?.headers,
              full_response_data: apiError.response?.data,
              error_code: apiError.code,
              axios_message: apiError.message
            });
            console.warn('[PptxGallery] ⚠️ Falling back to placeholder viewer');
            // Fall back to simple viewer
            setSlides([{ slide: 0, thumbnail: null }]);
            setPptxInfo({ slide_count: 1 });
            setLoading(false);
          }
        } else {
          // No API - use fallback
          console.log('[PptxGallery] No articleId or fileId, using fallback');
          setSlides([{ slide: 0, thumbnail: null }]);
          setPptxInfo({ slide_count: 1 });
          setLoading(false);
        }
      } catch (err) {
        console.error('[PptxGallery] Error loading presentation:', err);
        setError(err.message || 'Failed to load presentation');
        setLoading(false);
        if (onError) onError(err);
      }
    };

    if (fileUrl) {
      loadPresentation();
    }
  }, [fileUrl, fileId, articleId, onError]);

  // Scroll to top of gallery when it loads
  useEffect(() => {
    if (containerRef.current && !loading && thumbnailsLoaded) {
      const scrollableParent = containerRef.current.closest('.file-preview-container') || 
                              containerRef.current.closest('[class*="scroll"]') ||
                              containerRef.current.parentElement;
      
      if (scrollableParent && scrollableParent.scrollTop !== undefined) {
        // Scroll to top with smooth behavior
        scrollableParent.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }
  }, [loading, thumbnailsLoaded]);

  const goToPrevious = useCallback(() => {
    setCurrentSlide(prev => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentSlide(prev => 
      Math.min(slides.length - 1 || 0, prev + 1)
    );
  }, [slides.length]);

  const goToSlide = useCallback((index) => {
    setCurrentSlide(Math.max(0, Math.min(slides.length - 1 || 0, index)));
  }, [slides.length]);

  // Loading state
  if (loading) {
    return (
      <div className="pptx-gallery-container">
        <div className="pptx-gallery-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">{t('common.loading') || 'Loading presentation...'}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !slides.length) {
    return (
      <div className="pptx-gallery-container">
        <div className="pptx-gallery-error">
          <i className="bi bi-exclamation-circle"></i>
          <h5>Preview Unavailable</h5>
          <p>{error || 'Unable to load presentation'}</p>
          <a href={fileUrl} download={fileName} className="btn btn-primary btn-sm mt-3">
            <i className="bi bi-download"></i> Download File
          </a>
        </div>
      </div>
    );
  }

  // Fullscreen mode
  if (viewMode === 'fullscreen') {
    return (
      <div className="pptx-gallery-fullscreen">
        <div className="pptx-gallery-fullscreen-header">
          <h6>{fileName} - Slide {currentSlide + 1} of {slides.length}</h6>
          <button
            className="btn btn-sm btn-close"
            onClick={() => setViewMode('gallery')}
            aria-label="Exit fullscreen"
          />
        </div>

        <div className="pptx-gallery-fullscreen-viewer">
          {slides[currentSlide]?.thumbnail ? (
            <img
              src={slides[currentSlide].thumbnail}
              alt={`Slide ${currentSlide + 1}`}
              className="pptx-gallery-fullscreen-image"
            />
          ) : (
            <div className="pptx-gallery-placeholder">
              <i className="bi bi-image"></i>
              <p>Slide {currentSlide + 1}</p>
            </div>
          )}
        </div>

        <div className="pptx-gallery-fullscreen-controls">
          <button
            className="btn btn-sm btn-outline-light"
            onClick={goToPrevious}
            disabled={currentSlide === 0}
          >
            <i className="bi bi-chevron-left"></i>
          </button>

          <div className="pptx-gallery-slide-counter">
            <input
              type="number"
              min="1"
              max={slides.length}
              value={currentSlide + 1}
              onChange={(e) => {
                const num = parseInt(e.target.value, 10);
                if (!isNaN(num)) goToSlide(num - 1);
              }}
              className="pptx-gallery-slide-input"
            />
            <span>/ {slides.length}</span>
          </div>

          <button
            className="btn btn-sm btn-outline-light"
            onClick={goToNext}
            disabled={currentSlide === slides.length - 1}
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    );
  }

  // Gallery mode (default)
  return (
    <div className="pptx-gallery-container" ref={containerRef}>
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ display: 'none' }} id="pptx-debug">
          {JSON.stringify({
            slides_count: slides.length,
            current_slide: currentSlide,
            current_thumbnail_exists: !!slides[currentSlide]?.thumbnail,
            first_30_chars: slides[currentSlide]?.thumbnail?.substring(0, 30),
            all_thumbnails_preview: slides.map(s => ({ has_thumbnail: !!s.thumbnail, first_20: s.thumbnail?.substring(0, 20) }))
          })}
        </div>
      )}
      
      {/* Main slide viewer */}
      <div className="pptx-gallery-main">
        {/* Current slide */}
        <div className="pptx-gallery-slide-viewer">
          {slides[currentSlide]?.thumbnail ? (
            <>
              {console.log(`[PptxGallery] Rendering image for slide ${currentSlide}:`, slides[currentSlide].thumbnail.substring(0, 50))}
              <img
                src={slides[currentSlide].thumbnail}
                alt={`Slide ${currentSlide + 1}`}
                className="pptx-gallery-slide-image"
                onClick={() => setViewMode('fullscreen')}
                style={{ cursor: 'pointer' }}
                onLoad={() => console.log(`[PptxGallery] ✅ Image loaded successfully for slide ${currentSlide}`)}
                onError={(e) => {
                  console.error(`[PptxGallery] ❌ Image FAILED to load for slide ${currentSlide}:`, {
                    error: e.type,
                    src_length: slides[currentSlide].thumbnail.length,
                    src_preview: slides[currentSlide].thumbnail.substring(0, 100),
                    img_element: e.target,
                    width: e.target.width,
                    height: e.target.height
                  });
                }}
              />
            </>
          ) : (
            <div className="pptx-gallery-placeholder">
              <i className="bi bi-image"></i>
              <p>Slide {currentSlide + 1}</p>
              <small>Click to view fullscreen</small>
            </div>
          )}

          {/* Slide counter overlay */}
          <div className="pptx-gallery-slide-badge">
            {currentSlide + 1} / {slides.length}
          </div>

          {/* Fullscreen button */}
          <button
            className="pptx-gallery-fullscreen-btn"
            onClick={() => setViewMode('fullscreen')}
            title="View fullscreen"
          >
            <i className="bi bi-fullscreen"></i>
          </button>
        </div>

        {/* Navigation arrows */}
        <button
          className="pptx-gallery-nav-btn pptx-gallery-nav-prev"
          onClick={goToPrevious}
          disabled={currentSlide === 0}
          aria-label="Previous slide"
        >
          <i className="bi bi-chevron-left"></i>
        </button>

        <button
          className="pptx-gallery-nav-btn pptx-gallery-nav-next"
          onClick={goToNext}
          disabled={currentSlide === slides.length - 1}
          aria-label="Next slide"
        >
          <i className="bi bi-chevron-right"></i>
        </button>

        {/* Info bar */}
        <div className="pptx-gallery-info-bar">
          <div className="pptx-gallery-info-left">
            <h6>{fileName}</h6>
            {pptxInfo && (
              <small>
                {pptxInfo.slide_count} slides •{' '}
                {pptxInfo.aspect_ratio}
              </small>
            )}
          </div>
          <div className="pptx-gallery-info-right">
            <a href={fileUrl} download={fileName} className="btn btn-sm btn-outline-primary">
              <i className="bi bi-download"></i> Download
            </a>
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      {thumbnailsLoaded && slides.length > 1 && (
        <div className="pptx-gallery-thumbnails">
          <div className="pptx-gallery-thumbnails-scroll">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`pptx-gallery-thumbnail ${
                  index === currentSlide ? 'active' : ''
                }`}
                onClick={() => goToSlide(index)}
                title={`Slide ${index + 1}`}
              >
                {slide.thumbnail ? (
                  <img 
                    src={slide.thumbnail} 
                    alt={`Slide ${index + 1}`}
                    onLoad={() => console.log(`[PptxGallery] ✅ Thumbnail loaded for slide ${index}`)}
                    onError={(e) => {
                      console.error(`[PptxGallery] ❌ THUMBNAIL FAILED to load for slide ${index}:`, {
                        error: e.type,
                        src_length: slide.thumbnail.length,
                        src_preview: slide.thumbnail.substring(0, 80),
                        width: e.target.width,
                        height: e.target.height
                      });
                    }}
                  />
                ) : (
                  <div className="pptx-gallery-thumbnail-placeholder">
                    {index + 1}
                  </div>
                )}
                {index === currentSlide && (
                  <div className="pptx-gallery-thumbnail-indicator"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PptxGallery;

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
import './styles/PdfViewer.css';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    pdfjsWorker ||
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002/api';
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * PdfViewer Component
 *
 * Renders PDF files directly onto an HTML5 <canvas> using Mozilla PDF.js.
 * This completely avoids <iframe> and browser PDF plugins, preventing IDM
 * (Internet Download Manager) and other download managers from intercepting
 * previews with download popups or causing infinite loading.
 *
 * Props:
 *   - fileUrl: Direct URL or preview URL of the file
 *   - fileId: ID of the file (preferred for public preview endpoint)
 *   - fileName: Display name of the file
 *   - className: Class name for the wrapper
 *   - toolbar: Whether to show toolbar (default: 1)
 *   - onError: Callback function on error
 */
const PdfViewer = ({
  fileUrl,
  fileId,
  fileName = 'Dokumen.pdf',
  className = '',
  toolbar = 1,
  onError,
}) => {
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Menghubungkan ke server...');
  const [error, setError] = useState(null);

  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [fitMode, setFitMode] = useState('page-width'); // 'page-width' | 'manual'
  const [isRendering, setIsRendering] = useState(false);
  const [pageInput, setPageInput] = useState('1');
  const [isInternalFullscreen, setIsInternalFullscreen] = useState(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const renderTaskRef = useRef(null);
  const abortControllerRef = useRef(null);

  const isFullscreen = className.includes('fullscreen') || isInternalFullscreen;

  // Stable ref for onError to prevent re-triggering download on parent re-renders
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Resolve direct download URL for fallback / download button
  const directDownloadUrl = useMemo(() => {
    if (fileUrl && (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:'))) {
      return fileUrl;
    }
    if (fileUrl && fileUrl.includes('/preview/')) {
      return fileUrl;
    }
    if (fileId) {
      return `${BACKEND_BASE_URL}/api/v1/public/files/${fileId}/preview/`;
    }
    if (!fileUrl) return null;
    if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
      return `${BACKEND_BASE_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
    }
    return fileUrl;
  }, [fileUrl, fileId]);

  // Resolve binary fetch URL with raw=1 so backend returns application/octet-stream
  // Prefer same-origin /api/ proxy to prevent CORS issues and avoid IDM interception
  const fetchUrl = useMemo(() => {
    // If blob or data URL, return as-is
    if (fileUrl && (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:'))) {
      return fileUrl;
    }

    // Prefer relative /api/ path if fileId is available so it routes through
    // Vite proxy (same-origin), avoiding any cross-origin restrictions
    if (fileId) {
      return `/api/v1/public/files/${fileId}/preview/?raw=1`;
    }

    if (!directDownloadUrl) return null;

    // If direct URL points to /api/v1/..., convert to relative /api/... for same-origin routing
    if (directDownloadUrl.includes('/api/v1/')) {
      const relativePath = directDownloadUrl.substring(directDownloadUrl.indexOf('/api/v1/'));
      const sep = relativePath.includes('?') ? '&' : '?';
      return `${relativePath}${sep}raw=1`;
    }

    const sep = directDownloadUrl.includes('?') ? '&' : '?';
    return `${directDownloadUrl}${sep}raw=1`;
  }, [fileUrl, fileId, directDownloadUrl]);

  // Load PDF document from binary array buffer using native streaming fetch
  useEffect(() => {
    if (!fetchUrl) {
      setError('URL dokumen PDF tidak tersedia.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    setDownloadProgress(0);
    setStatusMessage('Menghubungkan ke server...');
    setPdfDoc(null);
    setPageNum(1);
    setPageInput('1');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const loadDocument = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers = {
          Accept: 'application/json, application/octet-stream, */*',
          'X-Requested-With': 'XMLHttpRequest',
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(fetchUrl, {
          method: 'GET',
          headers,
          credentials: 'include',
          signal: abortController.signal,
        });

        if (!res.ok) {
          throw new Error(`Gagal mengunduh dokumen (HTTP ${res.status})`);
        }

        const contentType = res.headers.get('content-type') || '';
        let uint8Array;

        if (contentType.includes('application/json')) {
          setStatusMessage('Mendekode data pratinjau...');
          const json = await res.json();
          if (!json.data) {
            throw new Error('Data dokumen tidak ditemukan dalam respons.');
          }

          // Decode Base64 to Uint8Array efficiently
          const binaryString = atob(json.data);
          const len = binaryString.length;
          uint8Array = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            uint8Array[i] = binaryString.charCodeAt(i);
          }
        } else {
          const arrayBuffer = await res.arrayBuffer();
          uint8Array = new Uint8Array(arrayBuffer);
        }

        if (!isMounted) return;

        if (!uint8Array || uint8Array.byteLength === 0) {
          throw new Error('Dokumen PDF kosong (0 byte).');
        }

        setStatusMessage('Mempersiapkan pratinjau dokumen...');

        const loadingTask = pdfjsLib.getDocument({
          data: uint8Array,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setPageNum(1);
        setPageInput('1');
        setLoading(false);
      } catch (err) {
        if (err.name === 'AbortError' || err.name === 'CanceledError') {
          return;
        }
        console.error('[PdfViewer] Error loading PDF:', err);
        if (isMounted) {
          setError(err.message || 'Gagal memuat dokumen PDF.');
          setLoading(false);
          onErrorRef.current?.(err);
        }
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
      abortController.abort();
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [fetchUrl]);

  // Render current page onto HTML5 canvas
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

    try {
      setIsRendering(true);

      // Cancel ongoing render task before starting a new one
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // ignore cancellation
        }
        renderTaskRef.current = null;
      }

      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Determine effective scale
      let effectiveScale = scale;
      if (fitMode === 'page-width' && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 48; // padding margin
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        if (containerWidth > 0 && unscaledViewport.width > 0) {
          effectiveScale = Math.min(Math.max(containerWidth / unscaledViewport.width, 0.4), 2.5);
        }
      }

      const viewport = page.getViewport({ scale: effectiveScale });
      const pixelRatio = window.devicePixelRatio || 1;

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.scale(pixelRatio, pixelRatio);

      const renderContext = {
        canvasContext: ctx,
        viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;
      ctx.restore();
      setIsRendering(false);
    } catch (err) {
      if (err?.name === 'RenderingCancelledException') {
        return;
      }
      console.error('[PdfViewer] Render error:', err);
      setIsRendering(false);
    }
  }, [pdfDoc, pageNum, scale, fitMode]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  // Responsive re-render on container resize when fit-width is active
  useEffect(() => {
    if (fitMode !== 'page-width') return;
    let timer;
    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        renderCurrentPage();
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [fitMode, renderCurrentPage]);

  // Page navigation handlers
  const handlePrevPage = () => {
    if (pageNum > 1) {
      const nextP = pageNum - 1;
      setPageNum(nextP);
      setPageInput(String(nextP));
      if (containerRef.current) containerRef.current.scrollTop = 0;
    }
  };

  const handleNextPage = () => {
    if (pageNum < numPages) {
      const nextP = pageNum + 1;
      setPageNum(nextP);
      setPageInput(String(nextP));
      if (containerRef.current) containerRef.current.scrollTop = 0;
    }
  };

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handlePageInputCommit = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      const target = parseInt(pageInput, 10);
      if (!isNaN(target) && target >= 1 && target <= numPages) {
        setPageNum(target);
        if (containerRef.current) containerRef.current.scrollTop = 0;
      } else {
        setPageInput(String(pageNum));
      }
    }
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setFitMode('manual');
    setScale((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 3.0));
  };

  const handleZoomOut = () => {
    setFitMode('manual');
    setScale((prev) => Math.max(Number((prev - 0.25).toFixed(2)), 0.4));
  };

  const handleZoomFit = () => {
    setFitMode('page-width');
    setScale(1.0);
  };

  const handleZoomReset = () => {
    setFitMode('manual');
    setScale(1.0);
  };

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    setIsInternalFullscreen((prev) => !prev);
  };

  // Exit fullscreen on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isInternalFullscreen) {
        setIsInternalFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInternalFullscreen]);

  // Render error state
  if (error) {
    return (
      <div className={`pdf-viewer-error ${isFullscreen ? 'fullscreen' : ''}`}>
        <i className="bi bi-exclamation-triangle text-warning fs-2 mb-2"></i>
        <h6>Pratinjau PDF tidak dapat ditampilkan</h6>
        <p className="text-muted small mb-3">
          {error || 'Silakan unduh dokumen untuk membacanya secara langsung.'}
        </p>
        {directDownloadUrl && (
          <a
            href={directDownloadUrl}
            download={fileName}
            className="btn btn-sm btn-primary d-inline-flex align-items-center gap-2"
          >
            <i className="bi bi-download"></i> Unduh PDF ({fileName})
          </a>
        )}
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`pdf-viewer-wrapper ${className} ${
        isInternalFullscreen ? 'pdf-viewer-internal-fullscreen' : ''
      } ${isFullscreen ? 'fullscreen' : ''}`}
    >
      {/* Sleek PDF Toolbar */}
      {Boolean(toolbar) && (
        <div className="pdf-viewer-toolbar">
          {/* Left section: Document title / info */}
          <div className="pdf-toolbar-section pdf-toolbar-left" title={fileName}>
            <i className="bi bi-file-earmark-pdf-fill text-danger me-1"></i>
            <span className="pdf-toolbar-filename">{fileName}</span>
          </div>

          {/* Center section: Page navigation */}
          {numPages > 0 && (
            <div className="pdf-toolbar-section pdf-toolbar-center">
              <button
                type="button"
                className="btn-pdf-control"
                onClick={handlePrevPage}
                disabled={pageNum <= 1 || isRendering}
                title="Halaman Sebelumnya"
              >
                <i className="bi bi-chevron-left"></i>
              </button>

              <div className="pdf-page-indicator">
                <input
                  type="text"
                  className="pdf-page-input"
                  value={pageInput}
                  onChange={handlePageInputChange}
                  onKeyDown={handlePageInputCommit}
                  onBlur={handlePageInputCommit}
                  aria-label="Nomor halaman"
                />
                <span className="pdf-page-total">/ {numPages}</span>
              </div>

              <button
                type="button"
                className="btn-pdf-control"
                onClick={handleNextPage}
                disabled={pageNum >= numPages || isRendering}
                title="Halaman Selanjutnya"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}

          {/* Right section: Zoom, Fullscreen, and Direct Download */}
          <div className="pdf-toolbar-section pdf-toolbar-right">
            <button
              type="button"
              className="btn-pdf-control"
              onClick={handleZoomOut}
              disabled={loading || scale <= 0.4}
              title="Perkecil (-)"
            >
              <i className="bi bi-zoom-out"></i>
            </button>

            <button
              type="button"
              className="btn-pdf-control btn-pdf-zoom-text"
              onClick={fitMode === 'page-width' ? handleZoomReset : handleZoomFit}
              disabled={loading}
              title={fitMode === 'page-width' ? 'Atur ke 100%' : 'Sesuaikan Lebar'}
            >
              {fitMode === 'page-width' ? 'Pas Lebar' : `${Math.round(scale * 100)}%`}
            </button>

            <button
              type="button"
              className="btn-pdf-control"
              onClick={handleZoomIn}
              disabled={loading || scale >= 3.0}
              title="Perbesar (+)"
            >
              <i className="bi bi-zoom-in"></i>
            </button>

            <div className="pdf-toolbar-divider"></div>

            {/* Toggle Fullscreen button if not in external modal */}
            {!className.includes('fullscreen') && (
              <button
                type="button"
                className="btn-pdf-control"
                onClick={handleToggleFullscreen}
                title={isInternalFullscreen ? 'Keluar Layar Penuh (Esc)' : 'Layar Penuh'}
              >
                <i
                  className={`bi ${
                    isInternalFullscreen ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'
                  }`}
                ></i>
              </button>
            )}

            {/* Direct download button */}
            {directDownloadUrl && (
              <a
                href={directDownloadUrl}
                download={fileName}
                className="btn-pdf-control btn-pdf-download"
                title="Unduh file dokumen asli"
              >
                <i className="bi bi-download"></i>
                <span className="btn-pdf-download-text">Unduh</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Main Canvas Scroll Area */}
      <div
        ref={containerRef}
        className="pdf-canvas-container"
        tabIndex={0}
      >
        {/* Loading overlay with progress indicator */}
        {loading && (
          <div className="pdf-viewer-loading">
            <div className="pdf-viewer-spinner-wrapper">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Memuat...</span>
              </div>
              <p className="pdf-loading-title mb-2">{statusMessage}</p>
              <div className="pdf-loading-filename text-muted small mb-3">{fileName}</div>
              {downloadProgress > 0 && (
                <div className="pdf-loading-progress-bar-container">
                  <div
                    className="pdf-loading-progress-bar"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* HTML5 Canvas Rendering Target */}
        <canvas
          ref={canvasRef}
          className={`pdf-canvas ${isRendering ? 'rendering' : ''}`}
          style={{ display: loading ? 'none' : 'block' }}
        />
      </div>
    </div>
  );
};

export default PdfViewer;

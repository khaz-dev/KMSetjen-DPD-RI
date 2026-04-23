import React, { useState, useEffect } from 'react';
import './styles/PptxViewer.css';

/**
 * PptxViewer Component - SIMPLIFIED
 * Displays PPTX presentations as full slides (not thumbnails)
 * 
 * Uses Microsoft Office Online Viewer for professional rendering.
 * Requires HTTPS URLs - works on production, limited on localhost.
 * 
 * Props:
 *   - fileUrl: URL to the PPTX file (must be HTTPS)
 *   - fileName: Name of the file for display
 *   - onError: Optional callback when viewer fails
 */
const PptxViewer = ({ fileUrl, fileName = 'Presentation', onError }) => {
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    setIsLocalhost(isLocal);
  }, []);

  const getOfficeOnlineUrl = (url) => {
    try {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    } catch (err) {
      console.error('[PptxViewer] Error creating viewer URL:', err);
      return null;
    }
  };

  const viewerUrl = getOfficeOnlineUrl(fileUrl);

  // Localhost limitation notice
  if (isLocalhost && fileUrl.includes('localhost')) {
    return (
      <div className="pptx-viewer-container">
        <div className="pptx-viewer-warning">
          <i className="bi bi-info-circle"></i>
          <h6>Preview not available on local development</h6>
          <p className="text-muted small">
            PPTX viewer requires files to be publicly accessible. 
            Deploy to production to enable online preview.
          </p>
          <a href={fileUrl} download={fileName} className="btn btn-sm btn-primary mt-2">
            <i className="bi bi-download"></i> Download
          </a>
        </div>
      </div>
    );
  }

  // Error state
  if (iframeError || !viewerUrl) {
    return (
      <div className="pptx-viewer-container">
        <div className="pptx-viewer-error">
          <i className="bi bi-exclamation-circle"></i>
          <h6>Unable to display preview</h6>
          <p className="text-muted small">Please download the file to view it offline.</p>
          <a href={fileUrl} download={fileName} className="btn btn-sm btn-primary mt-2">
            <i className="bi bi-download"></i> Download
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="pptx-viewer-container">
      <iframe
        src={viewerUrl}
        className="pptx-viewer-iframe"
        title={fileName}
        allowFullScreen={true}
        onError={(e) => {
          console.error('[PptxViewer] iframe error:', e);
          setIframeError(true);
          onError?.(e);
        }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
};

export default PptxViewer;


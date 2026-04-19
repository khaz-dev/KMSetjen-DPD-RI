import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './styles/PptxViewer.css';

/**
 * PptxViewer Component
 * Displays PPTX presentations using multiple fallback strategies
 * 
 * 1. Primary: Microsoft Office Online Viewer (embed.office.com)
 *    - Works with absolute URLs
 *    - No external JS dependencies
 *    - Supports all Office formats
 *    - Issue: Requires publicly accessible URL
 *    
 * 2. Fallback: Google Docs Viewer
 *    - Backup for production URLs
 *    - Issue: Cannot access localhost files
 *    
 * 3. Last resort: Download link
 *    - Always works
 *    - User can open in their office app
 * 
 * Props:
 *   - fileUrl: URL to the PPTX file
 *   - fileName: Name of the file for display
 *   - onError: Optional callback when viewer fails
 */
const PptxViewer = ({ fileUrl, fileName, onError }) => {
  const { t } = useTranslation();
  const [viewerMethod, setViewerMethod] = useState('office');
  const [isLocalhost, setIsLocalhost] = useState(false);

  // Detect if running on localhost
  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    setIsLocalhost(isLocal);
  }, []);

  // Get the office online viewer URL
  const getOfficeOnlineUrl = (url) => {
    try {
      const encoded = encodeURIComponent(url);
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}`;
    } catch (err) {
      console.error('[PptxViewer] Error encoding URL:', err);
      return null;
    }
  };

  // Get Google Docs Viewer URL (backup)
  const getGoogleDocsUrl = (url) => {
    try {
      return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    } catch (err) {
      console.error('[PptxViewer] Error encoding URL:', err);
      return null;
    }
  };

  const officeViewerUrl = getOfficeOnlineUrl(fileUrl);
  const googleViewerUrl = getGoogleDocsUrl(fileUrl);

  // Localhost warning
  if (isLocalhost && fileUrl.includes('localhost')) {
    return (
      <div className="pptx-viewer-container">
        <div className="pptx-viewer-localhost-warning">
          <i className="bi bi-exclamation-triangle"></i>
          <h5>Preview Not Available on Local Development</h5>
          <p>
            PPTX preview viewers (Microsoft Office Online and Google Docs) require files to be publicly accessible.
            Since this file is on localhost, they cannot fetch it.
          </p>
          <div className="localhost-solutions">
            <div className="solution">
              <strong>Solution 1:</strong> Download and open in your Office application
            </div>
            <div className="solution">
              <strong>Solution 2:</strong> Deploy to production to enable online preview
            </div>
            <div className="solution">
              <strong>Solution 3:</strong> Use a local development server with public URL (ngrok)
            </div>
          </div>
          <div className="mt-3">
            <a href={fileUrl} download={fileName} className="btn btn-primary btn-sm">
              <i className="bi bi-download"></i> Download File
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pptx-viewer-container">
      {/* Primary viewer: Microsoft Office Online */}
      {viewerMethod === 'office' && officeViewerUrl && (
        <div className="pptx-viewer-wrapper">
          <iframe
            src={officeViewerUrl}
            className="pptx-viewer-iframe office-viewer"
            title={fileName}
            allowFullScreen
            onError={() => {
              console.warn('[PptxViewer] Office Online Viewer failed, trying Google Docs...');
              setViewerMethod('google');
            }}
          />
        </div>
      )}

      {/* Fallback viewer: Google Docs Viewer */}
      {viewerMethod === 'google' && googleViewerUrl && (
        <div className="pptx-viewer-wrapper">
          <iframe
            src={googleViewerUrl}
            className="pptx-viewer-iframe google-viewer"
            title={fileName}
            onError={() => {
              console.error('[PptxViewer] All viewers failed');
              setViewerMethod('error');
              if (onError) onError(new Error('All preview methods failed'));
            }}
          />
        </div>
      )}

      {/* Error state */}
      {viewerMethod === 'error' && (
        <div className="pptx-viewer-error">
          <i className="bi bi-file-earmark-ppt"></i>
          <h5>Preview Not Available</h5>
          <p>Unable to preview this presentation file.</p>
          <small>{t('common.download_to_view') || 'Download file to view'}</small>
          <div className="mt-3">
            <a href={fileUrl} download={fileName} className="btn btn-primary btn-sm">
              <i className="bi bi-download"></i> Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default PptxViewer;


import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Container, Row, Col, Alert, Modal, Toast, ToastContainer } from 'react-bootstrap';
import { FiSave, FiSend, FiX, FiClock } from 'react-icons/fi';
import RichTextEditor from '../components/RichTextEditor';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { publicAPI, internalAPI } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import './ArticleEditorPage.css';

/**
 * ArticleEditor Page Component
 * Allows contributors to create and edit articles
 * Routes: /editor (new) and /editor/:id (edit)
 * 
 * Features:
 * - Create new articles (POST)
 * - Edit existing articles (PUT)
 * - Auto-save drafts every 2 minutes
 * - Markdown-based rich text editor
 * - Category and tag selection
 * - SEO metadata (slug, description)
 * - Submit for review workflow
 * - Save as draft functionality
 */
const ArticleEditor = () => {
  const { t } = useTranslation();
  const { isIndonesian } = useLanguage();
  const { theme } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDeleteFileModal, setShowDeleteFileModal] = useState(false);
  const [deleteFileId, setDeleteFileId] = useState(null);
  const [deletingFile, setDeletingFile] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [slugValidation, setSlugValidation] = useState({
    isChecking: false,
    isAvailable: null,
    messageKey: null,
    message: ''
  });

  const [files, setFiles] = useState([]);
  const [fileUploading, setFileUploading] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [expandedFilePreview, setExpandedFilePreview] = useState({});
  const [activeLanguageTab, setActiveLanguageTab] = useState('id'); // 'id' or 'en'

  const [formData, setFormData] = useState({
    id: null,
    // Indonesian fields
    title_id: '',
    description_id: '',
    content_id: '',
    // English fields
    title_en: '',
    description_en: '',
    content_en: '',
    // Common fields
    category_id: '',
    featured_image: '',
    featured_image_file: null,
    slug: '',
    status: 'draft'
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadArticle = useCallback(async () => {
    try {
      setLoading(true);
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiBaseUrl}/v1/internal/articles/${id}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load article');
      }

      const data = await response.json();
      setFormData({
        id: data.id || null,
        // Indonesian fields
        title_id: data.title_id || '',
        description_id: data.summary_id || '',
        content_id: data.content_id || '',
        // English fields
        title_en: data.title_en || '',
        description_en: data.summary_en || '',
        content_en: data.content_en || '',
        // Common fields
        category_id: data.category?.id || data.category_id || '',
        featured_image: data.image || data.image_url || '',
        featured_image_url: data.image_url || '',
        slug: data.slug || '',
        status: data.status || 'draft'
      });
      setSelectedTags(data.tags?.map(t => t.id) || []);
      // Load associated files
      try {
        const filesResponse = await internalAPI.getArticleFiles(id);
        const filesList = filesResponse.data || filesResponse;
        const filesArray = Array.isArray(filesList) ? filesList : (filesList.results || []);
        console.log('[ArticleEditor] Loaded files:', filesArray.length);
        filesArray.forEach((f, i) => {
          console.log(`[ArticleEditor] File ${i}:`, {
            id: f.id,
            filename: f.original_filename,
            file_field: f.file,
            mime_type: f.mime_type
          });
        });
        setFiles(filesArray);
      } catch (filesErr) {
        console.error('Failed to load files:', filesErr);
        setFiles([]);
      }
    } catch (err) {
      console.error('Load article error:', err);
      setError('errors.failed_load_articles');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const saveDraft = useCallback(async () => {
    try {
      // Validate required fields (Indonesian is required, English is optional)
      if (!formData.title_id || !formData.title_id.trim()) {
        setError('t:errors.title_required');
        throw new Error('title_required');
      }

      if (!formData.category_id) {
        setError('t:errors.category_required');
        throw new Error('category_required');
      }

      // Validate slug if present
      if (formData.slug && slugValidation.isAvailable === false) {
        setError(t('errors.slug_duplicate'));
        throw new Error('slug_validation_failed');
      }

      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
      
      // If there's a featured image file, use FormData for multipart upload
      // Otherwise, use JSON
      let requestBody;
      let contentTypeHeader = 'application/json';
      
      if (formData.featured_image_file) {
        // Use FormData for file upload
        const formDataObj = new FormData();
        formDataObj.append('title_id', formData.title_id);
        formDataObj.append('title_en', formData.title_en);
        formDataObj.append('content_id', formData.content_id);
        formDataObj.append('content_en', formData.content_en);
        formDataObj.append('summary_id', formData.description_id);
        formDataObj.append('summary_en', formData.description_en);
        formDataObj.append('category', formData.category_id);
        formDataObj.append('status', 'draft');
        formDataObj.append('slug', formData.slug || '');
        formDataObj.append('image', formData.featured_image_file);
        
        // Add tags
        selectedTags.forEach((tagId, index) => {
          formDataObj.append(`tags`, tagId);
        });
        
        requestBody = formDataObj;
        contentTypeHeader = null; // Let browser set it with boundary
      } else {
        // Use JSON for text-only updates
        const payload = {
          title_id: formData.title_id,
          title_en: formData.title_en,
          content_id: formData.content_id,
          content_en: formData.content_en,
          summary_id: formData.description_id,
          summary_en: formData.description_en,
          tags: selectedTags,
          status: 'draft',
          category: formData.category_id,
          slug: formData.slug
        };
        
        // Add image_url if provided (URL string)
        if (formData.featured_image_url) {
          payload.image_url = formData.featured_image_url;
        }
        
        requestBody = JSON.stringify(payload);
      }

      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      };
      
      if (contentTypeHeader) {
        headers['Content-Type'] = contentTypeHeader;
      }

      const response = await fetch(
        id ? `${apiBaseUrl}/v1/internal/articles/${id}/` : `${apiBaseUrl}/v1/internal/articles/`,
        {
          method: id ? 'PUT' : 'POST',
          headers,
          body: requestBody
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error response:', errorData);
        throw new Error('save_draft_failed');
      }

      const data = await response.json();
      setLastSaved(new Date());
      setShowSaveToast(true); // Show success notification
      
      // Update URL if creating new article
      if (!id) {
        window.history.replaceState(null, '', `/editor/${data.id}`);
      }

      return data;
    } catch (err) {
      console.error('Save draft error:', err);
      // Store the translation key, not the translated string
      // This way ErrorAlert will translate it in the current language
      setError('t:errors.failed_save_draft');
    }
  }, [id, formData, selectedTags, slugValidation, t]);

  // Load categories and tags on mount
  useEffect(() => {
    loadCategories();
    loadTags();
  }, []);

  // Check slug availability when slug changes (debounced)
  useEffect(() => {
    // Don't check if slug is empty
    if (!formData.slug) {
      setSlugValidation({
        isChecking: false,
        isAvailable: null,
        message: ''
      });
      return;
    }

    // Check format first
    const formatValidation = validateSlugFormat(formData.slug);
    if (!formatValidation.valid) {
      const messageKey = formatValidation.messageKey;
      setSlugValidation({
        isChecking: false,
        isAvailable: false,
        messageKey: messageKey,
        message: messageKey
      });
      return;
    }

    // Debounce the slug check (500ms)
    const timeoutId = setTimeout(async () => {
      try {
        setSlugValidation(prev => ({
          ...prev,
          isChecking: true
        }));

        const response = await internalAPI.checkSlug(formData.slug, formData.id);
        const data = response.data || response;
        
        setSlugValidation({
          isChecking: false,
          isAvailable: data.available,
          messageKey: data.available ? 'editor.slug_valid' : 'errors.slug_duplicate',
          message: data.available ? 'valid' : 'duplicate'
        });
      } catch (err) {
        console.error('Slug check error:', err);
        setSlugValidation({
          isChecking: false,
          isAvailable: null,
          messageKey: null,
          message: 'Could not verify slug availability'
        });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.slug, formData.id]);

  // Auto-save draft every 2 minutes
  useEffect(() => {
    if (!id) return; // Don't auto-save for new articles

    const interval = setInterval(() => {
      // Only auto-save if form has meaningful content AND required fields are filled
      if ((formData.title_id && formData.title_id.trim()) || (formData.content_id && formData.content_id.trim())) {
        // Validate that category is selected before saving
        if (formData.category_id) {
          saveDraft();
        }
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [formData, id, saveDraft]);

  // Load article if editing existing article
  useEffect(() => {
    if (id) {
      loadArticle();
    } else {
      setLoading(false);
    }
  }, [id, loadArticle]);

  const loadCategories = async () => {
    try {
      const response = await publicAPI.getCategories();
      const data = response.data || response;
      setCategories(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    }
  };

  const loadTags = async () => {
    try {
      const response = await publicAPI.getTags();
      const data = response.data || response;
      setTags(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error('Failed to load tags:', err);
      setTags([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSlugChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      slug: value
    }));
    // Validation will be triggered by useEffect watching formData.slug
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('t:errors.invalid_file_type');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('t:errors.file_too_large');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          featured_image: reader.result,
          featured_image_file: file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleImageUpload({ target: { files: [file] } });
    }
  };

  const handleImageDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImageRemove = () => {
    setFormData(prev => ({
      ...prev,
      featured_image: '',
      featured_image_file: null
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !id) {
      setError('t:errors.save_article_first');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('t:errors.file_too_large_50mb');
      return;
    }

    try {
      setFileUploading(true);
      const response = await internalAPI.uploadFile(id, file);
      const uploadedFile = response.data || response;
      setFiles(prev => [...prev, uploadedFile]);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('File upload error:', err);
      setError('t:errors.file_upload_failed');
    } finally {
      setFileUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleFileDelete = async (fileId) => {
    setDeleteFileId(fileId);
    setShowDeleteFileModal(true);
  };

  const confirmFileDelete = async () => {
    if (!id || !deleteFileId) return;

    try {
      setDeletingFile(true);
      await internalAPI.deleteFile(id, deleteFileId);
      setFiles(prev => prev.filter(f => f.id !== deleteFileId));
      setShowDeleteFileModal(false);
      setDeleteFileId(null);
    } catch (err) {
      console.error('File delete error:', err);
      setError('t:errors.file_delete_failed');
    } finally {
      setDeletingFile(false);
    }
  };

  const toggleFilePreview = (fileId) => {
    setExpandedFilePreview(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  };

  const handleContentChange = (e) => {
    const fieldName = activeLanguageTab === 'id' ? 'content_id' : 'content_en';
    setFormData(prev => ({
      ...prev,
      [fieldName]: e.target.value
    }));
  };

  const handleTagChange = (tagId) => {
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(t => t !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const validateSlugFormat = (slug) => {
    if (!slug) return { valid: false, messageKey: null };
    
    if (slug.length < 3 || slug.length > 255) {
      return { valid: false, messageKey: 'slug_invalid_length' };
    }
    
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return { valid: false, messageKey: 'slug_invalid_format' };
    }
    
    if (slug.startsWith('-')) {
      return { valid: false, messageKey: 'slug_starts_with_hyphen' };
    }
    
    if (slug.endsWith('-')) {
      return { valid: false, messageKey: 'slug_ends_with_hyphen' };
    }
    
    if (slug.includes('--')) {
      return { valid: false, messageKey: 'slug_consecutive_hyphens' };
    }
    
    return { valid: true, messageKey: null };
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return 'text-secondary';
    if (mimeType.includes('pdf')) return 'bi-file-pdf text-danger';
    if (mimeType.includes('word')) return 'bi-file-word text-primary';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'bi-file-earmark-spreadsheet text-success';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'bi-file-earmark-ppt text-warning';
    if (mimeType.includes('image')) return 'bi-file-image text-info';
    if (mimeType.includes('video')) return 'bi-file-play text-danger';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'bi-file-zip text-secondary';
    return 'text-secondary';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFilePreviewUrl = (file) => {
    if (!file || !file.file) {
      console.warn('[FilePreview] No file or file.file property', file);
      return null;
    }
    // If file.file is a string URL, validate it before returning
    if (typeof file.file === 'string') {
      // Ensure it's not empty and not just root
      if (file.file.trim() === '' || file.file.trim() === '/') {
        console.error('[FilePreview] Invalid file URL: empty or root only', file.file);
        return null;
      }
      console.debug('[FilePreview] Using file URL:', file.file);
      return file.file;
    }
    // If it's a File object, create a blob URL
    if (file.file instanceof File || file.file instanceof Blob) {
      const blobUrl = URL.createObjectURL(file.file);
      console.debug('[FilePreview] Created blob URL:', blobUrl);
      return blobUrl;
    }
    console.warn('[FilePreview] Unhandled file.file type:', typeof file.file, file.file);
    return null;
  };

  const hasPreview = (mimeType) => {
    if (!mimeType) return false;
    // Images
    if (mimeType.includes('image')) return true;
    // PDF
    if (mimeType.includes('pdf')) return true;
    // Video
    if (mimeType.includes('video')) return true;
    // Audio
    if (mimeType.includes('audio')) return true;
    return false;
  };

  const getPreviewType = (mimeType) => {
    if (!mimeType) return null;
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('video')) return 'video';
    if (mimeType.includes('audio')) return 'audio';
    return null;
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    const fieldName = activeLanguageTab === 'id' ? 'title_id' : 'title_en';
    
    // Update the title in state
    setFormData(prev => {
      const updated = { ...prev, [fieldName]: title };
      
      // Auto-generate slug if:
      // 1. This is a new article (no id) OR
      // 2. Article is in draft status and we're editing Indonesian title
      if ((!prev.id || prev.status === 'draft') && activeLanguageTab === 'id') {
        updated.slug = generateSlug(title);
      }
      
      return updated;
    });
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    await saveDraft();
  };

  const handleSubmitForReview = async () => {
    try {
      // Validate required fields (Indonesian required, English optional)
      if (!formData.title_id || !formData.content_id || !formData.category_id) {
        setError('t:errors.fill_required_fields');
        return;
      }

      // Validate slug format
      const formatValidation = validateSlugFormat(formData.slug);
      if (!formatValidation.valid) {
        setError(`t:errors.${formatValidation.messageKey}`);
        return;
      }

      // Validate slug is not duplicated
      if (formData.slug && slugValidation.isAvailable === false) {
        setError('t:errors.slug_duplicate');
        return;
      }

      const payload = {
        title_id: formData.title_id,
        title_en: formData.title_en,
        content_id: formData.content_id,
        content_en: formData.content_en,
        summary_id: formData.description_id,
        summary_en: formData.description_en,
        tags: selectedTags,
        status: 'submitted',
        category: formData.category_id,  // Changed from category_id to category
        slug: formData.slug
      };

      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(
        id ? `${apiBaseUrl}/v1/internal/articles/${id}/` : `${apiBaseUrl}/v1/internal/articles/`,
        {
          method: id ? 'PUT' : 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error('submit_article_failed');
      }

      setShowSubmitModal(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Submit article error:', err);
      setError('t:errors.failed_submit_article');
    }
  };

  if (loading) {
    return <LoadingSpinner message={t('loading.loading_article')} />;
  }

  return (
    <Container className="article-editor-page py-4">
      <div className="editor-header mb-4">
        <h1 className="page-title">{id ? t('editor.edit_article') : t('editor.new_article')}</h1>
        {lastSaved && (
          <small className="text-muted d-flex align-items-center gap-2 mt-2">
            <FiClock size={14} />
            {t('editor.last_saved')}: {lastSaved.toLocaleTimeString()}
          </small>
        )}
      </div>

      {error && (
        <ErrorAlert 
          message={error}
          onDismiss={() => setError('')}
          className="mb-4"
        />
      )}

      {/* Success Toast */}
      <ToastContainer position="top-end" className="p-3" style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
        <Toast
          onClose={() => setShowSaveToast(false)}
          show={showSaveToast}
          delay={3000}
          autohide
          className="article-editor-toast"
        >
          <Toast.Header closeButton className="article-editor-toast-header">
            <i className="bi bi-check-circle-fill me-2 article-editor-toast-icon"></i>
            <strong className="me-auto">{t('editor.draft_saved_success')}</strong>
          </Toast.Header>
          <Toast.Body className="article-editor-toast-body">
            {t('editor.draft_saved')}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <Form onSubmit={handleSaveDraft}>
        {/* Language Tabs */}
        <div className="language-tabs mb-4">
          <div className="btn-group" role="tablist">
            <button
              type="button"
              className={`btn btn-sm ${activeLanguageTab === 'id' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveLanguageTab('id')}
            >
              🇮🇩 Bahasa Indonesia
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeLanguageTab === 'en' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveLanguageTab('en')}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        {/* Title */}
        <Form.Group className="mb-4">
          <Form.Label>
            {activeLanguageTab === 'id' ? t('editor.article_title') : 'Article Title (English)'} *
          </Form.Label>
          <Form.Control
            type="text"
            value={activeLanguageTab === 'id' ? formData.title_id : formData.title_en}
            onChange={handleTitleChange}
            placeholder={activeLanguageTab === 'id' ? t('editor.article_title_placeholder') : 'Enter article title in English'}
            required={activeLanguageTab === 'id'} 
            maxLength={200}
          />
          <Form.Text className="text-muted">
            {(activeLanguageTab === 'id' ? formData.title_id : formData.title_en).length}/200 {t('editor.characters')}
          </Form.Text>
        </Form.Group>

        {/* Category */}
        <Form.Group className="mb-4">
          <Form.Label>{t('editor.category')} *</Form.Label>
          <Form.Select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            required
          >
            <option value="">{t('editor.select_category')}</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{isIndonesian ? cat.name_id : cat.name_en}</option>
            ))}
          </Form.Select>
        </Form.Group>

        {/* Slug */}
        <Form.Group className="mb-4">
          <Form.Label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {t('editor.slug')}
            {formData.id && formData.status !== 'draft' && (
              <span className="slug-locked-badge"> (Locked)</span>
            )}
            {slugValidation.isChecking && (
              <span className="slug-checking-badge">
                <i className="bi bi-hourglass-split"></i> {t('editor.checking') || 'Checking...'}
              </span>
            )}
            {formData.slug && slugValidation.isAvailable === true && !slugValidation.isChecking && (
              <span className="slug-valid-badge">
                <i className="bi bi-check-circle-fill"></i> {t('editor.slug_valid') || 'Valid'}
              </span>
            )}
          </Form.Label>
          <Form.Control
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleSlugChange}
            placeholder={t('editor.slug_placeholder')}
            disabled={formData.id && formData.status !== 'draft'}
            className={`slug-field ${
              !formData.slug ? '' : 
              slugValidation.isAvailable === true ? 'is-valid' :
              slugValidation.isAvailable === false ? 'is-invalid' :
              ''
            }`}
          />
          {formData.id && formData.status !== 'draft' ? (
            <Form.Text className="text-warning slug-locked-warning">
              <i className="bi bi-lock-fill"></i> {t('editor.slug_locked_message')}
            </Form.Text>
          ) : (
            <>
              <Form.Text className="text-muted">
                {t('editor.slug_hint')}
              </Form.Text>
              {formData.slug && slugValidation.isAvailable === false && (
                <div className="slug-validation-message text-danger">
                  <i className="bi bi-exclamation-circle"></i> {slugValidation.messageKey ? t(slugValidation.messageKey) : slugValidation.message}
                </div>
              )}
            </>
          )}
        </Form.Group>

        {/* Description */}
        <Form.Group className="mb-4">
          <Form.Label>
            {activeLanguageTab === 'id' ? t('editor.description') : 'Description (English)'}
          </Form.Label>
          <Form.Control
            type="text"
            value={activeLanguageTab === 'id' ? formData.description_id : formData.description_en}
            onChange={(e) => {
              const fieldName = activeLanguageTab === 'id' ? 'description_id' : 'description_en';
              setFormData(prev => ({
                ...prev,
                [fieldName]: e.target.value
              }));
            }}
            placeholder={activeLanguageTab === 'id' ? t('editor.description_placeholder') : 'Enter description in English'}
            maxLength={160}
            as="textarea"
            rows={2}
          />
          <Form.Text className="text-muted">
            {(activeLanguageTab === 'id' ? formData.description_id : formData.description_en).length}/160 {t('editor.characters')}
          </Form.Text>
        </Form.Group>

        {/* Featured Image */}
        <Form.Group className="mb-4">
          <Form.Label>{t('editor.featured_image')}</Form.Label>
          
          {/* Upload options */}
          <div className="featured-image-upload-container">
            {/* File Upload with drag-and-drop */}
            <div 
              className={`featured-image-upload-area ${formData.featured_image_file ? 'has-file' : ''}`}
              onDrop={handleImageDrop}
              onDragOver={handleImageDragOver}
              onDragLeave={(e) => e.preventDefault()}
            >
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="image-upload" className="upload-label">
                <div className="upload-content">
                  <i className="bi bi-cloud-upload"></i>
                  <p>{t('editor.drag_drop_image') || 'Drag & drop image here or click to browse'}</p>
                  <small>{t('editor.image_size_hint') || 'Max 5MB, PNG/JPG/GIF'}</small>
                  {formData.featured_image_file && (
                    <div className="upload-file-info">
                      <i className="bi bi-check-circle-fill text-success"></i>
                      <span>{formData.featured_image_file.name}</span>
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* URL Input */}
            <div className="featured-image-url-section">
              <Form.Control
                type="url"
                placeholder={t('editor.featured_image_placeholder')}
                value={formData.featured_image_url || ''}
                onChange={(e) => {
                  const url = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    featured_image_url: url,
                    // Only update featured_image if no file is uploaded
                    featured_image: prev.featured_image_file ? prev.featured_image : url
                  }));
                }}
                disabled={!!formData.featured_image_file}
              />
              <small className="text-muted d-block mt-2">
                {formData.featured_image_file 
                  ? t('editor.url_disabled_file_active') || 'URL field disabled (file upload takes priority)'
                  : t('editor.or_enter_image_url') || 'OR enter an image URL'
                }
              </small>
            </div>
          </div>

          {/* Preview */}
          {formData.featured_image && (
            <div className="featured-image-preview-container mt-3">
              <div className="featured-image-preview">
                <img src={formData.featured_image} alt="Featured Preview" />
                <div className="image-source-badge">
                  {formData.featured_image_file ? (
                    <>
                      <i className="bi bi-upload"></i> {t('editor.source_upload') || 'Uploaded'}
                    </>
                  ) : (
                    <>
                      <i className="bi bi-link-45deg"></i> {t('editor.source_url') || 'From URL'}
                    </>
                  )}
                </div>
              </div>
              <div className="image-actions">
                {formData.featured_image_file && (
                  <Button 
                    variant="warning" 
                    size="sm" 
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        featured_image_file: null,
                        featured_image_url: '',
                        featured_image: ''
                      }));
                    }}
                    className="mb-2"
                  >
                    <i className="bi bi-arrow-counterclockwise"></i> {t('buttons.change_image') || 'Change'}
                  </Button>
                )}
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={handleImageRemove}
                >
                  <i className="bi bi-trash"></i> {t('buttons.remove')}
                </Button>
              </div>
            </div>
          )}

          {/* Info text about priority */}
          <Alert variant="info" className="mt-3 py-2">
            <small>
              <i className="bi bi-info-circle"></i> {t('editor.image_priority_hint') || 'File upload takes priority over URL. Upload a file to override URL image.'}
            </small>
          </Alert>
        </Form.Group>

        {/* File Manager */}
        {id && (
          <Form.Group className="mb-4">
            <Form.Label>{t('editor.file_attachments')}</Form.Label>
            
            {/* File Upload */}
            <div className="file-upload-section mb-3">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileUpload}
                disabled={fileUploading}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.mkv"
              />
              <label htmlFor="file-upload" className={`file-upload-label ${fileUploading ? 'uploading' : ''}`}>
                <i className={`bi ${fileUploading ? 'bi-hourglass-split' : 'bi-cloud-upload'}`}></i>
                {fileUploading ? t('editor.uploading_file') : t('editor.upload_file')}
              </label>
              <small className="text-muted d-block mt-2">
                {t('editor.file_upload_hint')} (Max 50MB)
              </small>
            </div>

            {/* Files List */}
            {files.length > 0 ? (
              <div className="file-list">
                {files.map((file, index) => {
                  const fileHasPreview = hasPreview(file.mime_type);
                  const previewType = getPreviewType(file.mime_type);
                  const previewUrl = getFilePreviewUrl(file);
                  const showPreview = expandedFilePreview[file.id] || false;

                  return (
                    <div key={file.id} className="file-item-wrapper">
                      <div className="file-item">
                        <div className="file-info">
                          <i className={`bi ${getFileIcon(file.mime_type)}`}></i>
                          <div className="file-details">
                            <div className="file-name">{file.original_filename}</div>
                            <small className="file-meta">
                              {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                        <div className="file-actions">
                          {fileHasPreview && previewUrl && (
                            <button
                              type="button"
                              className="btn-file-preview"
                              onClick={() => toggleFilePreview(file.id)}
                              title={showPreview ? 'Hide preview' : 'Show preview'}
                            >
                              <i className={`bi ${showPreview ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                              <span className="btn-text">{showPreview ? 'Hide' : 'Preview'}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-file-delete"
                            onClick={() => handleFileDelete(file.id)}
                            title={t('buttons.delete')}
                          >
                            <i className="bi bi-trash"></i>
                            <span className="btn-text">{t('buttons.delete')}</span>
                          </button>
                        </div>
                      </div>
                      {/* File Preview */}
                      {showPreview && fileHasPreview && previewUrl && (
                        <div className="file-preview-container">
                          {previewType === 'image' && (
                            <img 
                              src={previewUrl} 
                              alt={file.original_filename}
                              className="file-preview-image"
                              onError={(e) => {
                                console.error('[FilePreview] Image failed to load:', previewUrl);
                                e.target.style.display = 'none';
                                if (e.target.nextElementSibling) {
                                  e.target.nextElementSibling.style.display = 'flex';
                                }
                              }}
                            />
                          )}
                          {previewType === 'pdf' && previewUrl && (
                            <iframe
                              src={`${previewUrl}#toolbar=0`}
                              className="file-preview-pdf"
                              title={file.original_filename}
                              onLoad={() => console.debug('[FilePreview] PDF iframe loaded successfully')}
                              onError={(e) => console.error('[FilePreview] PDF iframe error - URL may be invalid or inaccessible:', previewUrl, e)}
                            />
                          )}
                          {previewType === 'video' && (
                            <video
                              controls
                              className="file-preview-video"
                              src={previewUrl}
                            >
                              Your browser does not support the video tag.
                            </video>
                          )}
                          {previewType === 'audio' && (
                            <audio
                              controls
                              className="file-preview-audio"
                              src={previewUrl}
                            >
                              Your browser does not support the audio tag.
                            </audio>
                          )}
                          <div className="file-preview-fallback" style={{ display: 'none' }}>
                            <i className="bi bi-image"></i>
                            <p>Preview not available</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-files-message">
                <i className="bi bi-file-earmark"></i>
                <p>{t('editor.no_files_uploaded')}</p>
              </div>
            )}
          </Form.Group>
        )}

        {/* Tags */}
        <Form.Group className="mb-4">
          <Form.Label>{t('editor.tags')}</Form.Label>
          <div className="tags-selection">
            {tags.map(tag => (
              <Form.Check
                key={tag.id}
                type="checkbox"
                id={`tag-${tag.id}`}
                label={isIndonesian ? tag.name_id : tag.name_en}
                checked={selectedTags.includes(tag.id)}
                onChange={() => handleTagChange(tag.id)}
                className="tag-checkbox"
              />
            ))}
          </div>
        </Form.Group>

        {/* Content Editor */}
        <Form.Group className="mb-4">
          <Form.Label>
            {activeLanguageTab === 'id' ? t('editor.content') : 'Content (English)'} *
          </Form.Label>
          <RichTextEditor
            value={activeLanguageTab === 'id' ? formData.content_id : formData.content_en}
            onChange={handleContentChange}
            placeholder={activeLanguageTab === 'id' ? t('editor.write_article_content') : 'Write article content in English'}
            height="400px"
          />
          <Form.Text className="text-muted d-block mb-3">
            {t('editor.markdown_supported')}
          </Form.Text>
          <div className="markdown-guide alert alert-info">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <strong>
                <i className="bi bi-info-circle me-2"></i>
                {t('editor.content_guide')}
              </strong>
            </div>
            <small className="text-muted d-block mb-2">
              {t('editor.content_helper_text')}
            </small>
            <pre className="mb-0 small bg-white p-2 rounded" style={{ 
              fontSize: '0.85rem', 
              maxHeight: '200px', 
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word'
            }}>
{t('editor.content_guide_text').split('\\n').join('\n')}
            </pre>
          </div>
        </Form.Group>

        {/* Action Buttons */}
        <div className="editor-actions">
          <Row className="g-3">
            <Col xs={12} sm="auto">
              <Button
                variant="outline-secondary"
                onClick={() => navigate('/dashboard')}
              >
                <FiX /> {t('editor.cancel')}
              </Button>
            </Col>
            <Col xs={12} sm="auto">
              <Button
                variant="primary"
                type="submit"
              >
                <FiSave /> {t('editor.save_draft')}
              </Button>
            </Col>
            <Col xs={12} sm="auto">
              <Button
                variant="success"
                onClick={() => setShowSubmitModal(true)}
              >
                <FiSend /> {t('editor.submit_review')}
              </Button>
            </Col>
          </Row>
        </div>
      </Form>

      {/* Delete File Confirmation Modal */}
      <Modal show={showDeleteFileModal} onHide={() => !deletingFile && setShowDeleteFileModal(false)} backdrop="static">
        <Modal.Header closeButton={!deletingFile}>
          <Modal.Title>{t('buttons.delete_file')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="mb-3">
            <strong>{t('messages.warning')}</strong>
          </Alert>
          <p>
            {t('messages.confirm_delete_file')}
          </p>
          <p className="text-muted small">
            {t('messages.this_action_cannot_be_undone')}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteFileModal(false)}
            disabled={deletingFile}
          >
            {t('buttons.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={confirmFileDelete}
            disabled={deletingFile}
          >
            {deletingFile ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {t('messages.deleting')}
              </>
            ) : (
              t('buttons.delete')
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Submit Confirmation Modal */}
      <Modal show={showSubmitModal} onHide={() => setShowSubmitModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{t('editor.submit_review')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            {t('moderation.confirm_submission')}
          </p>
          <p className="text-muted small">
            {t('moderation.submission_note')}
          </p>
          {(!formData.title_id || !formData.content_id || !formData.category_id) && (
            <Alert variant="warning" className="mb-0">
              <strong>{t('editor.required_fields')}</strong>
              <ul className="mb-0 mt-2">
                {!formData.title_id && <li>{t('editor.title_required')}</li>}
                {!formData.content_id && <li>{t('editor.content_required')}</li>}
                {!formData.category_id && <li>{t('validation.category_required')}</li>}
              </ul>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowSubmitModal(false)}
          >
            {t('buttons.cancel')}
          </Button>
          <Button
            variant="success"
            onClick={handleSubmitForReview}
            disabled={!formData.title_id || !formData.content_id || !formData.category_id}
          >
            {t('editor.submit_review')}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ArticleEditor;

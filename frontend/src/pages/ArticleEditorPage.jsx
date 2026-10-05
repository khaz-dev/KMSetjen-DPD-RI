import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Container, Row, Col, Alert, Modal, Toast, ToastContainer } from 'react-bootstrap';
import { FiSave, FiSend, FiX, FiClock, FiEye } from 'react-icons/fi';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import RichTextEditor from '../components/RichTextEditor';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EditorTagFilter from '../components/EditorTagFilter';
import PptxViewer from '../components/PptxViewer';
import PdfViewer from '../components/PdfViewer';
import { publicAPI, internalAPI } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { 
  ACCESS_LEVELS, 
  ACCESS_LEVEL_DEFAULTS,
  getAvailableAccessLevels,
  canAccessArticleEditor 
} from '../constants/accessLevels';
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
  const { success, error: showError } = useNotification();
  const { user, loading: authLoading } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState('');
  const [availableAccessLevels, setAvailableAccessLevels] = useState([]);
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
  const [initialFiles, setInitialFiles] = useState([]); // Track initial files for change detection
  const [fileUploading, setFileUploading] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [expandedFilePreview, setExpandedFilePreview] = useState({});
  const [activeLanguageTab, setActiveLanguageTab] = useState('id'); // 'id' or 'en'
  const [initialFormData, setInitialFormData] = useState(null); // Track initial state for change detection
  const [initialSelectedTags, setInitialSelectedTags] = useState([]); // Track initial tags for change detection
  const [imageSource, setImageSource] = useState(null); // Track whether image is from 'upload' or 'url'
  const [isDraggingImage, setIsDraggingImage] = useState(false); // Track drag state for featured image upload
  const [isDraggingFiles, setIsDraggingFiles] = useState(false); // Track drag state for file upload area

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
    status: 'draft',
    access_level: 'public'  // Default to public access
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadArticle = useCallback(async () => {
    try {
      setLoading(true);
      // Use internalAPI instead of native fetch to benefit from token refresh interceptor
      const response = await internalAPI.getArticle(id);
      const data = response.data || response;
      
      // Determine image source: 'upload' if image field exists, 'url' if image_url exists
      let source = null;
      if (data.image) {
        source = 'upload'; // Has uploaded file
      } else if (data.image_url) {
        source = 'url'; // Has URL only
      }
      setImageSource(source);
      
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
        featured_image_file: null,
        featured_image_url: data.image_url || '',
        slug: data.slug || '',
        status: data.status || 'draft',
        access_level: data.access_level || 'public'  // Load access level from API
      });
      const tagsArray = data.tags?.map(t => t.id) || [];
      setSelectedTags(tagsArray);
      
      // Store initial state for change detection
      const initialState = {
        id: data.id || null,
        title_id: data.title_id || '',
        description_id: data.summary_id || '',
        content_id: data.content_id || '',
        title_en: data.title_en || '',
        description_en: data.summary_en || '',
        content_en: data.content_en || '',
        category_id: data.category?.id || data.category_id || '',
        featured_image: data.image || data.image_url || '',
        featured_image_file: null,
        featured_image_url: data.image_url || '',
        slug: data.slug || '',
        status: data.status || 'draft',
        access_level: data.access_level || 'public'
      };
      setInitialFormData(initialState);
      setInitialSelectedTags(tagsArray);
      
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
        setInitialFiles(filesArray.map(f => ({ id: f.id })));
      } catch (filesErr) {
        console.error('Failed to load files:', filesErr);
        setFiles([]);
        setInitialFiles([]);
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
      console.log('[SAVE_DRAFT] Starting save process...');
      console.log('[SAVE_DRAFT] Current form state:', {
        id: formData.id,
        slug: formData.slug,
        title_id: formData.title_id,
        slugValidation: slugValidation
      });
      
      // Validate required fields (Indonesian is required, English is optional)
      if (!formData.title_id || !formData.title_id.trim()) {
        console.log('[SAVE_DRAFT] Validation failed: No Indonesian title');
        setError('t:errors.title_required');
        throw new Error('title_required');
      }

      if (!formData.category_id) {
        console.log('[SAVE_DRAFT] Validation failed: No category');
        setError('t:errors.category_required');
        throw new Error('category_required');
      }

      // Validate slug if present
      if (formData.slug && slugValidation.isAvailable === false) {
        console.log('[SAVE_DRAFT] Validation failed: Slug marked as unavailable');
        setError(t('errors.slug_duplicate'));
        throw new Error('slug_validation_failed');
      }

      // Prepare payload with all fields
      // CRITICAL: Use internalAPI instead of fetch() to get token refresh on 401
      const payload = formData.featured_image_file ? new FormData() : {};
      
      if (formData.featured_image_file) {
        // Use FormData for file upload
        payload.append('title_id', formData.title_id);
        payload.append('title_en', formData.title_en);
        payload.append('content_id', formData.content_id);
        payload.append('content_en', formData.content_en);
        payload.append('summary_id', formData.description_id);
        payload.append('summary_en', formData.description_en);
        payload.append('category', formData.category_id);
        payload.append('access_level', formData.access_level);
        payload.append('status', formData.status || 'draft');
        payload.append('slug', formData.slug || '');
        payload.append('image', formData.featured_image_file);
        
        // Add tags
        selectedTags.forEach((tagId) => {
          payload.append('tags', tagId);
        });
      } else {
        // Use JSON for text-only updates
        payload.title_id = formData.title_id;
        payload.title_en = formData.title_en;
        payload.content_id = formData.content_id;
        payload.content_en = formData.content_en;
        payload.summary_id = formData.description_id;
        payload.summary_en = formData.description_en;
        payload.tags = selectedTags;
        payload.status = formData.status || 'draft';
        payload.category = formData.category_id;
        payload.access_level = formData.access_level;
        payload.slug = formData.slug;
        
        // DEBUG: Log the exact values being sent
        console.log('[SAVE_DRAFT_DEBUG] Payload being sent:');
        console.log(`  - status: ${JSON.stringify(payload.status)} (type: ${typeof payload.status})`);
        console.log(`  - access_level: ${JSON.stringify(payload.access_level)} (type: ${typeof payload.access_level})`);
        console.log(`  - formData.status: ${JSON.stringify(formData.status)} (type: ${typeof formData.status})`);
        console.log(`  - formData.access_level: ${JSON.stringify(formData.access_level)} (type: ${typeof formData.access_level})`);
        console.log('[SAVE_DRAFT_DEBUG] Full payload:', payload);
        
        // ALWAYS send image_url (even if empty) to allow clearing the featured image
        payload.image_url = formData.featured_image_url || null;
        
        // CRITICAL FIX: Send image: null when featured_image is cleared
        if (formData.featured_image === null || formData.featured_image === '') {
          payload.image = null;
          console.log('[SAVE_DRAFT_DEBUG] Image being cleared - sending image: null to backend');
        }
      }

      // Use internalAPI which has token refresh interceptor
      let data;
      if (id) {
        // Existing article - use PATCH for partial update
        const response = await internalAPI.updateArticle(id, payload);
        data = response.data;
      } else {
        // New article - use POST
        const response = await internalAPI.createArticle(payload);
        data = response.data;
      }
      
      // Handle successful response
      if (!data) {
        throw new Error('No response data from server');
      }

      console.log('[SAVE_DRAFT] Save successful! Response data:', {
        id: data.id,
        slug: data.slug,
        status: data.status
      });
      
      setLastSaved(new Date());
      success(t('editor.draft_saved_success'));
      
      // Update form data with returned ID and slug
      console.log('[SAVE_DRAFT] Updating form data with response...');
      console.log('[SAVE_DRAFT] Before setFormData - formData.id:', formData.id, ', formData.slug:', formData.slug);
      console.log('[SAVE_DRAFT] After response - data.id:', data.id, ', data.slug:', data.slug);
      
      setFormData(prev => ({
        ...prev,
        id: data.id,
        slug: data.slug,
        status: data.status,
        featured_image: data.image || prev.featured_image,  // Update with actual saved image URL
        featured_image_file: null,  // CRITICAL: Clear the file reference after successful upload
        featured_image_url: data.image_url || prev.featured_image_url  // Update with saved URL field
      }));
      
      // CRITICAL: Update initialFormData to the newly saved state
      // This ensures hasFormChanged() uses the new saved state as baseline
      // Otherwise buttons would stay disabled even after saving changes
      const newInitialState = {
        id: data.id,
        title_id: formData.title_id,
        description_id: formData.description_id,
        content_id: formData.content_id,
        title_en: formData.title_en,
        description_en: formData.description_en,
        content_en: formData.content_en,
        category_id: formData.category_id,
        featured_image: data.image || formData.featured_image,  // Use actual saved image URL
        featured_image_file: null,  // File is null after save (no File object to track)
        featured_image_url: data.image_url || formData.featured_image_url,  // Use actual saved URL field
        slug: data.slug,
        status: data.status,
        access_level: formData.access_level
      };
      setInitialFormData(newInitialState);
      console.log('[SAVE_DRAFT] Updated initialFormData to newly saved state');
      console.log('[SAVE_DRAFT] New featured_image:', newInitialState.featured_image);
      console.log('[SAVE_DRAFT] New featured_image_file:', newInitialState.featured_image_file);
      
      // Update initialSelectedTags to the currently selected tags
      // This ensures the change detection compares against the saved tags
      setInitialSelectedTags([...selectedTags]);
      console.log('[SAVE_DRAFT] Updated initialSelectedTags to:', selectedTags);
      
      // Update initialFiles to the currently uploaded files
      // This ensures the change detection compares against the saved files
      setInitialFiles(files.map(f => ({ id: f.id })));
      console.log('[SAVE_DRAFT] Updated initialFiles to:', files.length, 'files');

      
      // Update URL if creating new article
      // Use navigate() to keep React Router in sync with URL
      // This ensures useParams() updates and file section renders immediately
      if (!id) {
        navigate(`/editor/${data.id}`, { replace: true });
      }

      return data;
    } catch (err) {
      console.error('=== BACKEND VALIDATION ERROR ===');
      console.error('Save draft error:', err);
      
      // Extract error information from the response
      const errorData = err.response?.data || {};
      const status = err.response?.status;
      
      if (status) {
        console.error('Status Code:', status);
      }
      if (Object.keys(errorData).length > 0) {
        console.error('Error Response:', JSON.stringify(errorData, null, 2));
      }
      console.error('Payload Sent:', {
        title_id: formData.title_id,
        title_en: formData.title_en,
        content_id: formData.content_id,
        content_en: formData.content_en,
        summary_id: formData.description_id,
        summary_en: formData.description_en,
        category: formData.category_id,
        tags: selectedTags,
        status: formData.status || 'draft',
        slug: formData.slug
      });
      console.error('=== END ERROR ===');
      
      // Extract user-friendly error message (with bilingual support)
      let errorMessage = t('errors.failed_save_draft');
      
      // Try bilingual detail_id (Indonesian) first
      if (errorData.detail_id) {
        errorMessage = errorData.detail_id;
      }
      // Fall back to detail (if it's a string, not object)
      else if (errorData.detail && typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      }
      // Special handling for token errors and nested object errors
      else if (errorData.detail && typeof errorData.detail === 'object') {
        if (errorData.detail.code === 'token_not_valid' || errorData.detail.message === 'Token is expired') {
          errorMessage = 'Authorization failed. Please refresh the page and try again.';
          console.warn('[SAVE_DRAFT] Token validation error - token is expired');
        } else {
          // For other field-specific errors (validation errors)
          try {
            const fieldErrors = Object.entries(errorData.detail)
              .map(([field, msgs]) => {
                const fieldLabel = field;
                let errorMsg = 'Unknown error';
                if (Array.isArray(msgs)) {
                  errorMsg = msgs[0];
                } else if (typeof msgs === 'string') {
                  errorMsg = msgs;
                } else if (msgs && typeof msgs === 'object' && msgs.message) {
                  errorMsg = msgs.message;
                }
                return `${fieldLabel}: ${errorMsg}`;
              })
              .join('\n');
            if (fieldErrors) {
              errorMessage = fieldErrors;
            }
          } catch (e) {
            console.warn('[SAVE_DRAFT] Could not extract field errors:', e);
          }
        }
      }
      // Fall back to generic error message
      else if (errorData.error) {
        errorMessage = errorData.error;
      }
      
      setError(errorMessage);
      showError(errorMessage);
    }
  }, [id, formData, selectedTags, slugValidation, t, success, showError]);

  // Load categories and tags on mount
  useEffect(() => {
    loadCategories();
    loadTags();
  }, []);

  // Check slug availability when slug changes (debounced)
  useEffect(() => {
    console.log(`[SLUG_VALIDATION_EFFECT] Triggered - slug: "${formData.slug}", id: ${formData.id}`);
    
    // Don't check if slug is empty
    if (!formData.slug) {
      console.log(`[SLUG_VALIDATION_EFFECT] Slug is empty, clearing validation`);
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
      console.log(`[SLUG_VALIDATION_EFFECT] Format validation failed: ${formatValidation.messageKey}`);
      const messageKey = formatValidation.messageKey;
      setSlugValidation({
        isChecking: false,
        isAvailable: false,
        messageKey: messageKey,
        message: messageKey
      });
      return;
    }

    console.log(`[SLUG_VALIDATION_EFFECT] Format valid, debouncing checkSlug call (500ms)`);
    
    // Debounce the slug check (500ms)
    const timeoutId = setTimeout(async () => {
      console.log(`[SLUG_VALIDATION_EFFECT] Calling checkSlug with: slug="${formData.slug}", excludeId=${formData.id}, version='draft'`);
      try {
        setSlugValidation(prev => ({
          ...prev,
          isChecking: true
        }));

        const response = await internalAPI.checkSlug(formData.slug, formData.id, 'draft');
        const data = response.data || response;
        
        console.log(`[SLUG_VALIDATION_EFFECT] checkSlug response:`, {
          available: data.available,
          slug: data.slug,
          version_type: data.version_type,
          message: data.message
        });
        
        setSlugValidation({
          isChecking: false,
          isAvailable: data.available,
          messageKey: data.available ? 'editor.slug_valid' : 'errors.slug_duplicate',
          message: data.available ? 'valid' : 'duplicate'
        });
      } catch (err) {
        console.error('[SLUG_VALIDATION_EFFECT] Slug check error:', err);
        setSlugValidation({
          isChecking: false,
          isAvailable: null,
          messageKey: null,
          message: 'Could not verify slug availability'
        });
      }
    }, 500);

    return () => {
      console.log(`[SLUG_VALIDATION_EFFECT] Cleanup: clearing timeout`);
      clearTimeout(timeoutId);
    };
  }, [formData.slug, formData.id]);

  // Helper function to detect if form has changed from initial state
  // MUST be defined before useEffect that uses it
  const hasFormChanged = useCallback(() => {
    if (!initialFormData) {
      // During initial load:
      // - If we have an ID, we're loading an EXISTING article → keep buttons disabled
      // - If we DON'T have an ID, we're CREATING a new article → buttons should be enabled
      return !id;
    }
    
    // Compare all form fields
    const fieldsChanged = (
      formData.title_id !== initialFormData.title_id ||
      formData.description_id !== initialFormData.description_id ||
      formData.content_id !== initialFormData.content_id ||
      formData.title_en !== initialFormData.title_en ||
      formData.description_en !== initialFormData.description_en ||
      formData.content_en !== initialFormData.content_en ||
      formData.category_id !== initialFormData.category_id ||
      formData.featured_image !== initialFormData.featured_image ||
      formData.featured_image_file !== initialFormData.featured_image_file ||
      formData.featured_image_url !== initialFormData.featured_image_url ||
      formData.slug !== initialFormData.slug ||
      formData.access_level !== initialFormData.access_level
    );
    
    // Compare tags
    const tagsChanged = selectedTags.length !== initialSelectedTags.length ||
                       selectedTags.some((tag, idx) => tag !== initialSelectedTags[idx]);
    
    // Compare files - check if file count changed or file IDs differ
    const filesChanged = files.length !== initialFiles.length ||
                         files.some((file, idx) => !initialFiles[idx] || file.id !== initialFiles[idx].id);
    
    return fieldsChanged || tagsChanged || filesChanged;
  }, [formData, initialFormData, selectedTags, initialSelectedTags, files, initialFiles, id]);

  // Auto-save draft every 2 minutes (only if there are changes)
  useEffect(() => {
    if (!id) return; // Don't auto-save for new articles

    const interval = setInterval(() => {
      // Only auto-save if there are changes AND form has meaningful content AND required fields are filled
      if (hasFormChanged() && ((formData.title_id && formData.title_id.trim()) || (formData.content_id && formData.content_id.trim()))) {
        // Validate that category is selected before saving
        if (formData.category_id) {
          saveDraft();
        }
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [formData, id, saveDraft, hasFormChanged]);

  // Load article if editing existing article
  useEffect(() => {
    if (id) {
      loadArticle();
    } else {
      setLoading(false);
    }
  }, [id, loadArticle]);

  // Calculate available access levels based on user's primary role
  useEffect(() => {
    if (user && user.primary_role) {
      const levels = getAvailableAccessLevels(user.primary_role);
      setAvailableAccessLevels(levels);
      
      // If current access level is not available, reset to the first available level
      if (!levels.includes(formData.access_level) && levels.length > 0) {
        setFormData(prev => ({
          ...prev,
          access_level: levels[0]
        }));
      }
    }
  }, [user?.primary_role]);

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
      // Request all tags without pagination limit to ensure all tags are available
      const response = await publicAPI.getTags({ limit: 9999 });
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
        setImageSource('upload'); // Mark as uploaded file
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false); // Clear dragging state
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleImageUpload({ target: { files: [file] } });
    }
  };

  const handleImageDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImageDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true); // Show dragging visual feedback
  };

  const handleImageDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear dragging state if we're leaving the upload area itself
    if (e.target.classList.contains('featured-image-upload-area')) {
      setIsDraggingImage(false);
    }
  };

  const handleImageRemove = () => {
    setFormData(prev => ({
      ...prev,
      featured_image: '',
      featured_image_file: null,
      featured_image_url: ''
    }));
    setImageSource(null); // Clear image source
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // If article doesn't exist yet, save it first
    let articleId = id || formData.id;
    if (!articleId) {
      // Auto-save the article first
      try {
        console.log('[FileUpload] No article ID, auto-saving first...');
        const savedData = await saveDraft();
        articleId = savedData?.id;
        if (!articleId) {
          setError('t:errors.failed_create_article_for_upload');
          e.target.value = '';
          return;
        }
        console.log('[FileUpload] Article auto-saved with ID:', articleId);
      } catch (err) {
        console.error('[FileUpload] Auto-save failed:', err);
        // saveDraft already sets error, so just return
        e.target.value = '';
        return;
      }
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('t:errors.file_too_large_50mb');
      return;
    }

    try {
      setFileUploading(true);
      const response = await internalAPI.uploadFile(articleId, file);
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

  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false); // Clear dragging state
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleFileUpload({ target: { files: [file] } });
    }
  };

  const handleFileDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(true); // Show dragging visual feedback
  };

  const handleFileDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear dragging state if we're leaving the upload area itself
    if (e.target.classList.contains('file-upload-section')) {
      setIsDraggingFiles(false);
    }
  };

  const handleFileDelete = async (fileId) => {
    setDeleteFileId(fileId);
    setShowDeleteFileModal(true);
  };

  const confirmFileDelete = async () => {
    const articleId = id || formData.id;
    if (!articleId || !deleteFileId) return;

    try {
      setDeletingFile(true);
      await internalAPI.deleteFile(articleId, deleteFileId);
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
    // Presentations (PPTX, PPT, ODP, etc.)
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint') || mimeType.includes('openxmlformats-officedocument.presentationml')) return true;
    return false;
  };

  const getPreviewType = (mimeType) => {
    if (!mimeType) return null;
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('video')) return 'video';
    if (mimeType.includes('audio')) return 'audio';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint') || mimeType.includes('openxmlformats-officedocument.presentationml')) return 'presentation';
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

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002/api';
      
      // Use the dedicated submit-review endpoint
      const payload = {
        comment: ''  // Optional comment for reviewer
      };

      const response = await fetch(
        `${apiBaseUrl}/v1/internal/articles/${id}/submit-review/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = t('errors.submit_article_failed');
        
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (typeof errorData.detail === 'object') {
            const fieldErrors = Object.entries(errorData.detail)
              .map(([field, msgs]) => {
                const errorMsg = Array.isArray(msgs) ? msgs[0] : msgs;
                return `${field}: ${errorMsg}`;
              })
              .join('\n');
            errorMessage = fieldErrors || errorMessage;
          }
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        setError(errorMessage);
        showError(errorMessage);
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

      {/* Success Toast - Uses Portal to render outside form hierarchy */}
      {ReactDOM.createPortal(
        <ToastContainer 
          position="top-end" 
          className="p-3" 
          style={{ 
            position: 'fixed', 
            top: '20px', 
            right: '20px',
            left: 'auto',
            zIndex: 9999,
            margin: 0,
            padding: '20px',
            pointerEvents: 'auto'
          }}
        >
          <Toast
            onClose={() => setShowSaveToast(false)}
            show={showSaveToast}
            delay={5175}
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
        </ToastContainer>,
        document.body
      )}

      <Form onSubmit={handleSaveDraft}>
        {/* Language Tabs - Enhanced Modern Design */}
        <div className="mb-4">
          <div className="language-tabs">
            <button
              type="button"
              className={`language-tab ${activeLanguageTab === 'id' ? 'active' : ''}`}
              onClick={() => setActiveLanguageTab('id')}
              aria-pressed={activeLanguageTab === 'id'}
            >
              <span>🇮🇩</span> Bahasa Indonesia
            </button>
            <button
              type="button"
              className={`language-tab ${activeLanguageTab === 'en' ? 'active' : ''}`}
              onClick={() => setActiveLanguageTab('en')}
              aria-pressed={activeLanguageTab === 'en'}
            >
              <span>🇬🇧</span> English
            </button>
          </div>
        </div>

        {/* METADATA SECTION */}
        <div className="form-section">
          <div className="form-section-title">
            <i className="bi bi-file-earmark-text"></i>
            <h3>{t('editor.metadata_section') || 'Metadata & SEO'}</h3>
          </div>

          {/* Title */}
          <Form.Group className="mb-4">
            <Form.Label>
              {activeLanguageTab === 'id' ? t('editor.article_title') : 'Knowledge Title (English)'} <strong style={{color: '#ff6b6b'}}>*</strong>
            </Form.Label>
            <Form.Control
              type="text"
              value={activeLanguageTab === 'id' ? formData.title_id : formData.title_en}
              onChange={handleTitleChange}
              placeholder={activeLanguageTab === 'id' ? t('editor.article_title_placeholder') : 'Enter knowledge title in English'}
              required={activeLanguageTab === 'id'} 
              maxLength={200}
            />
            <Form.Text className="text-muted">
              {(activeLanguageTab === 'id' ? formData.title_id : formData.title_en).length}/200 {t('editor.characters')}
            </Form.Text>
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

          {/* Slug */}
          <Form.Group>
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
        </div>

        {/* CATEGORY & ORGANIZATION SECTION */}
        <div className="form-section">
          <div className="form-section-title">
            <i className="bi bi-tag"></i>
            <h3>{t('editor.organization_section') || 'Organization & Access'}</h3>
          </div>

          {/* Category */}
          <Form.Group className="mb-4">
            <Form.Label>{t('editor.category')} <strong style={{color: '#ff6b6b'}}>*</strong></Form.Label>
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

          {/* Access Level */}
          {availableAccessLevels.length > 0 && (
            <Form.Group className="mb-4">
              <Form.Label>{t('editor.access_level') || 'Tingkat Akses'}</Form.Label>
              <Form.Select
                name="access_level"
                value={formData.access_level}
                onChange={handleChange}
              >
                {availableAccessLevels.includes(ACCESS_LEVELS.PUBLIC) && (
                  <option value={ACCESS_LEVELS.PUBLIC}>{t('editor.access_public') || ACCESS_LEVEL_DEFAULTS[ACCESS_LEVELS.PUBLIC]}</option>
                )}
                {availableAccessLevels.includes(ACCESS_LEVELS.INTERNAL) && (
                  <option value={ACCESS_LEVELS.INTERNAL}>{t('editor.access_internal') || ACCESS_LEVEL_DEFAULTS[ACCESS_LEVELS.INTERNAL]}</option>
                )}
              </Form.Select>
              <Form.Text className="text-muted">
                {t('editor.access_level_help') || 'Pilih siapa yang dapat melihat artikel ini'}
              </Form.Text>
            </Form.Group>
          )}
        </div>

        {/* FEATURED IMAGE SECTION */}
        <div className="form-section">
          <div className="form-section-title">
            <i className="bi bi-image"></i>
            <h3>{t('editor.featured_image_section') || 'Featured Image'}</h3>
          </div>

          <Form.Group className="mb-4">
            <Form.Label>{t('editor.featured_image')}</Form.Label>
            
            {/* Upload options */}
            <div className="featured-image-upload-container">
              {/* File Upload with drag-and-drop */}
              <div 
                className={`featured-image-upload-area ${formData.featured_image_file ? 'has-file' : ''} ${isDraggingImage ? 'dragging' : ''}`}
                onDrop={handleImageDrop}
                onDragOver={handleImageDragOver}
                onDragEnter={handleImageDragEnter}
                onDragLeave={handleImageDragLeave}
                onClick={() => document.getElementById('image-upload').click()}
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
                  // Set image source to 'url' when user enters a URL
                  if (url && !formData.featured_image_file) {
                    setImageSource('url');
                  } else if (!url && imageSource === 'url') {
                    setImageSource(null);
                  }
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
                <img 
                  src={formData.featured_image} 
                  alt="Featured Preview"
                  onError={(e) => {
                    console.error('Featured image preview failed to load');
                    e.target.src = '/default-article-image.svg';
                  }}
                />
                <div className="image-source-badge">
                  {imageSource === 'upload' ? (
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
        </div>

        {/* FILE ATTACHMENTS SECTION */}
        <div className="form-section">
          <div className="form-section-title">
            <i className="bi bi-paperclip"></i>
            <h3>{t('editor.attachments_section') || 'Attachments & Files'}</h3>
          </div>
          {(
            <Form.Group className="mb-4">
              <Form.Label>{t('editor.file_attachments')}</Form.Label>
              
              {/* File Upload */}
              <div 
                className={`file-upload-section mb-3 ${isDraggingFiles ? 'dragging' : ''}`}
                onDrop={handleFileDrop}
                onDragOver={handleFileDragOver}
                onDragEnter={handleFileDragEnter}
                onDragLeave={handleFileDragLeave}
                onClick={() => document.getElementById('file-upload').click()}
              >
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
                            <>
                              <img 
                                src={previewUrl} 
                                alt={file.original_filename}
                                className="file-preview-image"
                                onError={(e) => {
                                  console.error('[FilePreview] Image failed to load:', previewUrl);
                                  e.target.style.display = 'none';
                                  const fallback = e.target.parentElement?.querySelector('.file-preview-fallback');
                                  if (fallback) {
                                    fallback.style.display = 'flex';
                                  }
                                }}
                              />
                              <div className="file-preview-fallback" style={{ display: 'none' }}>
                                <i className="bi bi-image"></i>
                                <p>Image preview not available</p>
                              </div>
                            </>
                          )}
                          {previewType === 'pdf' && previewUrl && (
                            <PdfViewer
                              fileUrl={file.preview_url || previewUrl}
                              fileId={file.id}
                              fileName={file.original_filename}
                              className="file-preview-pdf"
                              toolbar={1}
                              onError={(e) => console.error('[FilePreview] PDF error:', previewUrl, e)}
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
                          {previewType === 'presentation' && previewUrl && (
                            <PptxViewer 
                              fileUrl={previewUrl}
                              fileName={file.original_filename}
                              onError={(err) => console.error('[FilePreview] PptxViewer error:', err)}
                            />
                          )}
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
        </div>

        {/* CONTENT SECTION */}
        <div className="form-section">
          <div className="form-section-title">
            <i className="bi bi-pencil-square"></i>
            <h3>{t('editor.content_section') || 'Content'}</h3>
          </div>

          {/* Tags */}
          <Form.Group className="mb-4">
            <Form.Label>
              <i className="bi bi-bookmark"></i> {t('editor.tags')}
            </Form.Label>
            <EditorTagFilter
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              tags={tags}
            />
          </Form.Group>

          {/* Content Editor */}
          <Form.Group>
            <Form.Label>
              {activeLanguageTab === 'id' ? t('editor.content') : 'Content (English)'} <strong style={{color: '#ff6b6b'}}>*</strong>
            </Form.Label>
            <RichTextEditor
              value={activeLanguageTab === 'id' ? formData.content_id : formData.content_en}
              onChange={handleContentChange}
              placeholder={activeLanguageTab === 'id' ? t('editor.write_article_content') : 'Write knowledge content in English'}
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
        </div>

        {/* Action Buttons */}
        <div className="editor-actions">
          <div className="editor-actions-container">
            {/* Left Group - Preview Buttons */}
            <div className="editor-actions-left">
              <Button
                variant="outline-primary"
                onClick={() => {
                  if (id && formData.slug) {
                    window.open(`/knowledges/${formData.slug}?version=draft&from=editor`, '_blank');
                  }
                }}
                disabled={!id || !formData.slug}
                title={!id ? t('editor.save_first') || 'Save article first' : t('editor.preview_draft') || 'Preview draft version'}
                className="preview-btn"
              >
                <FiEye /> {t('editor.preview_draft')}
              </Button>
              
              {formData.status === 'published' && (
                <Button
                  variant="outline-info"
                  onClick={() => {
                    if (id && formData.slug) {
                      window.open(`/knowledges/${formData.slug}?from=editor`, '_blank');
                    }
                  }}
                  className="preview-btn"
                  title={t('editor.preview_published') || 'Preview published version'}
                >
                  <FiEye /> {t('editor.preview_published')}
                </Button>
              )}
            </div>

            {/* Right Group - Action Buttons */}
            <div className="editor-actions-right">
              <Button
                variant="outline-secondary"
                onClick={() => navigate('/dashboard')}
              >
                <FiX /> {t('editor.cancel')}
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={!hasFormChanged()}
                title={!hasFormChanged() ? t('editor.no_changes') || 'No changes to save' : ''}
              >
                <FiSave /> {t('editor.save_draft')}
              </Button>
              <Button
                variant="success"
                onClick={() => setShowSubmitModal(true)}
                disabled={!id || (formData.status === 'review' || formData.status === 'approved')}
                title={
                  !id 
                    ? t('editor.save_first') || 'Save article first'
                    : formData.status === 'review'
                      ? 'Article is already submitted for review'
                      : formData.status === 'approved'
                        ? 'This article has been approved'
                        : ''
                }
              >
                <FiSend /> {t('editor.submit_review')}
              </Button>
            </div>
          </div>
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


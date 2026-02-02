import React, { useState } from 'react';
import './RichTextEditor.css';
import { useTranslation } from 'react-i18next';
import { 
  FiBold, 
  FiItalic, 
  FiUnderline, 
  FiList, 
  FiLink2, 
  FiCode,
  FiHash,
  FiGitBranch
} from 'react-icons/fi';

/**
 * RichTextEditor Component
 * Provides a simple rich text editing interface for article content
 * 
 * Props:
 *   value {string} - Current editor content
 *   onChange {function} - Callback when content changes
 *   placeholder {string} - Placeholder text
 *   height {string} - Editor height (default: 300px)
 */
const RichTextEditor = ({ 
  value = '', 
  onChange, 
  placeholder = 'Write your article content here...',
  height = '300px'
}) => {
  const { t } = useTranslation();
  const [isPreview, setIsPreview] = useState(false);

  // Apply text formatting
  const applyFormat = (formatType) => {
    const textarea = document.querySelector('.editor-textarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || 'text';
    let newText = '';

    switch (formatType) {
      case 'bold':
        newText = value.substring(0, start) + `**${selectedText}**` + value.substring(end);
        break;
      case 'italic':
        newText = value.substring(0, start) + `*${selectedText}*` + value.substring(end);
        break;
      case 'underline':
        newText = value.substring(0, start) + `__${selectedText}__` + value.substring(end);
        break;
      case 'heading1':
        newText = value.substring(0, start) + `\n# ${selectedText}\n` + value.substring(end);
        break;
      case 'heading2':
        newText = value.substring(0, start) + `\n## ${selectedText}\n` + value.substring(end);
        break;
      case 'list':
        newText = value.substring(0, start) + `\n- ${selectedText}\n` + value.substring(end);
        break;
      case 'link':
        newText = value.substring(0, start) + `[${selectedText}](url)` + value.substring(end);
        break;
      case 'code':
        newText = value.substring(0, start) + `\`${selectedText}\`` + value.substring(end);
        break;
      default:
        break;
    }

    if (onChange) {
      onChange({ target: { value: newText } });
    }

    // Refocus and restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + 2;
      textarea.selectionEnd = start + 2;
    }, 0);
  };

  // Convert markdown to basic HTML for preview
  const renderPreview = (text) => {
    let html = text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // bold
      .replace(/\*(.+?)\*/g, '<em>$1</em>') // italic
      .replace(/__(.+?)__/g, '<u>$1</u>') // underline
      .replace(/`(.+?)`/g, '<code>$1</code>') // inline code
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>') // links
      .replace(/^# (.+)$/gm, '<h1>$1</h1>') // h1
      .replace(/^## (.+)$/gm, '<h2>$1</h2>') // h2
      .replace(/^- (.+)$/gm, '<li>$1</li>') // list items
      .replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>') // wrap list items
      .replace(/\n/g, '<br />'); // line breaks

    return html;
  };

  return (
    <div className="rich-text-editor">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-buttons">
          <button
            className="toolbar-btn"
            title={t('editor.bold')}
            onClick={() => applyFormat('bold')}
          >
            <FiBold /> <span>{t('editor.bold')}</span>
          </button>
          <button
            className="toolbar-btn"
            title={t('editor.italic')}
            onClick={() => applyFormat('italic')}
          >
            <FiItalic /> <span>{t('editor.italic')}</span>
          </button>
          <button
            className="toolbar-btn"
            title={t('editor.underline')}
            onClick={() => applyFormat('underline')}
          >
            <FiUnderline /> <span>{t('editor.underline')}</span>
          </button>
          
          <div className="toolbar-separator"></div>
          
          <button
            className="toolbar-btn"
            title={t('editor.heading_1')}
            onClick={() => applyFormat('heading1')}
          >
            <FiHash /> <span>H1</span>
          </button>
          <button
            className="toolbar-btn"
            title={t('editor.heading_2')}
            onClick={() => applyFormat('heading2')}
          >
            <FiGitBranch /> <span>H2</span>
          </button>
          
          <div className="toolbar-separator"></div>
          
          <button
            className="toolbar-btn"
            title={t('editor.bullet_list')}
            onClick={() => applyFormat('list')}
          >
            <FiList /> <span>{t('editor.bullet_list')}</span>
          </button>
          <button
            className="toolbar-btn"
            title={t('editor.link')}
            onClick={() => applyFormat('link')}
          >
            <FiLink2 /> <span>{t('editor.link')}</span>
          </button>
          <button
            className="toolbar-btn"
            title={t('editor.code')}
            onClick={() => applyFormat('code')}
          >
            <FiCode /> <span>{t('editor.code')}</span>
          </button>
        </div>

        <div className="toolbar-right">
          <button
            className={`preview-btn ${isPreview ? 'active' : ''}`}
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? t('editor.write_article_content') : t('editor.preview')}
          </button>
        </div>
      </div>

      {/* Editor or Preview */}
      <div className="editor-content" style={{ height }}>
        {!isPreview ? (
          <textarea
            className="editor-textarea"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            spellCheck="true"
          />
        ) : (
          <div 
            className="editor-preview"
            dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
          />
        )}
      </div>

      {/* Info */}
      <div className="editor-info">
        <small className="text-muted">
          Supports Markdown: **bold**, *italic*, __underline__, # Heading, - List, [Link](url), `code`
        </small>
        <small className="text-muted word-count">
          {value.length} characters • {value.split(/\s+/).filter(w => w).length} words
        </small>
      </div>
    </div>
  );
};

export default RichTextEditor;


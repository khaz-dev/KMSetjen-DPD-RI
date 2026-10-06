import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import { FiEye } from 'react-icons/fi';
import { useLanguage } from '../hooks/useLanguage';
import './ArticleMetaLine.css';

/**
 * ArticleMetaLine
 * Standard metadata display for KMSetjen DPD RI articles:
 * - If creator == publisher:
 *     ✍️ Dibuat dan Diterbitkan oleh: [Nama] | 📅 [Tanggal Publish]
 * - If creator != publisher:
 *     ✍️ Dibuat oleh: [Nama Pembuat] | 🌐 Diterbitkan oleh: [Nama Pengunggah] | 📅 [Tanggal Publish]
 * - Optional showViews:
 *     | 👁️ [view_count] tampilan
 */
const ArticleMetaLine = ({
  article,
  className = '',
  showDate = true,
  compact = false,
  showViews = false,
  children
}) => {
  const { t } = useTranslation();
  const { isIndonesian } = useLanguage();

  if (!article) return null;

  const creatorName =
    article.creator_name ||
    article.author_name ||
    (typeof article.author === 'object'
      ? article.author?.name || article.author?.first_name || article.author?.username
      : null) ||
    'Setjen DPD RI';

  const uploaderName =
    article.uploader_name ||
    article.author_name ||
    (typeof article.author === 'object'
      ? article.author?.name || article.author?.first_name || article.author?.username
      : null) ||
    'Admin KM';

  const cleanStr = (s) => (s || '').trim().toLowerCase();
  const normalizedCreator = cleanStr(creatorName);
  const normalizedUploader = cleanStr(uploaderName);

  // Deteksi multiple creators jika terdapat lebih dari 1 item di array creators_data
  const hasMultipleInArray = Array.isArray(article.creators_data) && article.creators_data.length > 1;

  // Cek apakah creator dan uploader adalah orang yang sama
  const creatorUserId =
    article.creator_user_id ||
    article.creator_user?.id ||
    (Array.isArray(article.creators_data) && article.creators_data.length === 1 && article.creators_data[0].id
      ? article.creators_data[0].id
      : null);
  const authorUserId = article.author?.id || article.uploader_id;
  const isSameUserId = Boolean(creatorUserId && authorUserId && Number(creatorUserId) === Number(authorUserId));

  const isSamePerson =
    !hasMultipleInArray &&
    normalizedCreator !== '' &&
    (normalizedCreator === normalizedUploader || isSameUserId);

  const dateValue = article.published_at || article.updated_at || article.created_at;
  let formattedDate = '-';
  if (dateValue) {
    try {
      formattedDate = format(new Date(dateValue), 'd MMMM yyyy', {
        locale: isIndonesian ? idLocale : enUS
      });
    } catch {
      formattedDate = String(dateValue).split('T')[0];
    }
  }

  return (
    <div className={`article-meta-line ${compact ? 'meta-compact' : ''} ${className}`}>
      {isSamePerson ? (
        <span className="meta-part meta-creator-and-uploader">
          <span className="meta-icon">✍️</span>{' '}
          <span className="meta-label">
            {t('articles.created_and_published_by', 'Dibuat dan Diterbitkan oleh')}:
          </span>{' '}
          <strong className="meta-name">{creatorName}</strong>
        </span>
      ) : (
        <>
          <span className="meta-part meta-creator">
            <span className="meta-icon">✍️</span>{' '}
            <span className="meta-label">{t('articles.created_by', 'Dibuat oleh')}:</span>{' '}
            <strong className="meta-name">{creatorName}</strong>
          </span>
          <span className="meta-separator-pipe">|</span>
          <span className="meta-part meta-uploader">
            <span className="meta-icon">🌐</span>{' '}
            <span className="meta-label">
              {t('articles.published_by', 'Diterbitkan oleh')}:
            </span>{' '}
            <strong className="meta-name">{uploaderName}</strong>
          </span>
        </>
      )}

      {showDate && (
        <>
          <span className="meta-separator-pipe">|</span>
          <span className="meta-part meta-date">
            <span className="meta-icon">📅</span>{' '}
            <span className="meta-date-text">{formattedDate}</span>
          </span>
        </>
      )}

      {showViews && article.view_count !== undefined && (
        <>
          <span className="meta-separator-pipe">|</span>
          <span className="meta-part meta-views">
            <FiEye className="meta-views-icon" size={compact ? 13 : 14} />{' '}
            <span className="meta-views-text">
              {article.view_count}{' '}
              {t('articles.views', isIndonesian ? 'tampilan' : 'views')}
            </span>
          </span>
        </>
      )}

      {children && (
        <>
          <span className="meta-separator-pipe">|</span>
          <span className="meta-part meta-extra">{children}</span>
        </>
      )}
    </div>
  );
};

export default ArticleMetaLine;

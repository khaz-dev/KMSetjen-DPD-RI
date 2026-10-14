/**
 * Media Utilities for Audiovisual and Infographic content.
 * Supports YouTube, Vimeo, Google Drive Video, direct HTML5 video, and audio links.
 */

export const getMediaEmbedInfo = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // YouTube match:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      id: ytMatch[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&autoplay=0`,
      url: trimmed,
      title: 'YouTube Video'
    };
  }

  // Vimeo match:
  // - https://vimeo.com/123456789
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+))/i);
  if (vimeoMatch && vimeoMatch[3]) {
    return {
      type: 'vimeo',
      id: vimeoMatch[3],
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}`,
      url: trimmed,
      title: 'Vimeo Video'
    };
  }

  // Google Drive video preview match:
  // - https://drive.google.com/file/d/FILE_ID/view...
  // - https://drive.google.com/open?id=FILE_ID
  const gdriveMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/([a-zA-Z0-9_-]+)|open\?id=([a-zA-Z0-9_-]+))/i);
  if (gdriveMatch) {
    const fileId = gdriveMatch[1] || gdriveMatch[2];
    return {
      type: 'gdrive',
      id: fileId,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      url: trimmed,
      title: 'Google Drive Video'
    };
  }

  // Direct video file (.mp4, .webm, .ogv, .mov, .m4v)
  if (/\.(mp4|webm|ogv|mov|m4v)(\?.*)?$/i.test(trimmed)) {
    return {
      type: 'video',
      embedUrl: trimmed,
      url: trimmed,
      title: 'Berkas Video'
    };
  }

  // Direct audio file (.mp3, .wav, .ogg, .m4a, .aac)
  if (/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i.test(trimmed)) {
    return {
      type: 'audio',
      embedUrl: trimmed,
      url: trimmed,
      title: 'Berkas Audio / Podcast'
    };
  }

  // Spotify embed match
  // - https://open.spotify.com/episode/...
  // - https://open.spotify.com/show/...
  const spotifyMatch = trimmed.match(/open\.spotify\.com\/(episode|show|track)\/([a-zA-Z0-9]+)/i);
  if (spotifyMatch) {
    return {
      type: 'spotify',
      id: spotifyMatch[2],
      embedUrl: `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}`,
      url: trimmed,
      title: 'Spotify Audio'
    };
  }

  return {
    type: 'generic_link',
    embedUrl: null,
    url: trimmed,
    title: 'Tautan Media Eksternal'
  };
};

/**
 * Format domain or origin from a URL string for friendly badge display
 */
export const extractDomain = (url) => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

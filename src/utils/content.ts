import he from 'he';

export function stripHtml(value?: string | null): string {
  if (!value) return '';
  return he.decode(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export function sanitizeImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  let cleaned = url.trim();

  // Filter out Google News placeholder/logo images
  if (
    cleaned.includes('googleusercontent.com/J6_coFbogxh') ||
    cleaned.includes('googleusercontent.com/proxy') ||
    /googleusercontent\.com.*(?:news|logo)/i.test(cleaned)
  ) {
    return undefined;
  }

  // Fix MGR Online broken CDN domain in RSS feed (mpics-cdn returns 404, while mpics.mgronline.com returns 200 OK)
  cleaned = cleaned.replace(/\/\/mpics-cdn\.mgronline\.com\//i, '//mpics.mgronline.com/');
  // Ensure protocol
  if (cleaned.startsWith('//')) {
    cleaned = 'https:' + cleaned;
  }
  return cleaned;
}

export function extractImage(...sources: Array<string | undefined>): string | undefined {
  for (const source of sources) {
    if (!source) continue;
    const match = source.match(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
    if (match?.[1] && /^https?:\/\/\S+$/i.test(match[1])) {
      return sanitizeImageUrl(he.decode(match[1]));
    }
  }
  return undefined;
}

export function extractOgImage(html: string): string | undefined {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const name = tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (!['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image'].includes(name ?? '')) continue;
    const url = tag.match(/content\s*=\s*["']([^"']+)["']/i)?.[1];
    if (url && /^https?:\/\/\S+$/i.test(url)) {
      return sanitizeImageUrl(he.decode(url));
    }
  }
  return undefined;
}

export function normalizeVideoEmbedUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (url.startsWith('//')) {
    url = 'https:' + url;
  }

  // YouTube watch or short URL
  const ytMatch = url.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
  );
  if (ytMatch?.[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch?.[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return url;
}

export function extractVideoUrl(...sources: Array<string | undefined>): string | undefined {
  for (const source of sources) {
    if (!source) continue;

    // 1. Check iframe embed src (YouTube, Vimeo, Dailymotion, Video files)
    const iframeMatch = source.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
    if (iframeMatch?.[1]) {
      const src = he.decode(iframeMatch[1]).trim();
      if (
        /youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|facebook\.com\/plugins\/video|\.mp4|\.webm/i.test(
          src,
        )
      ) {
        return normalizeVideoEmbedUrl(src);
      }
    }

    // 2. Check HTML5 video or source tags
    const videoTagMatch = source.match(/<(?:video|source)\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
    if (videoTagMatch?.[1]) {
      const src = he.decode(videoTagMatch[1]).trim();
      if (/^https?:\/\/\S+/i.test(src) || src.startsWith('//')) {
        return normalizeVideoEmbedUrl(src);
      }
    }

    // 3. Check og:video in meta tags
    const ogVideoMatch =
      source.match(
        /<meta\b[^>]*property\s*=\s*["']og:video(?::url|:secure_url)?["'][^>]*content\s*=\s*["']([^"']+)["']/i,
      ) ||
      source.match(
        /<meta\b[^>]*content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["']og:video(?::url|:secure_url)?["']/i,
      );
    if (ogVideoMatch?.[1]) {
      const src = he.decode(ogVideoMatch[1]).trim();
      if (/^https?:\/\/\S+/i.test(src) || src.startsWith('//')) {
        return normalizeVideoEmbedUrl(src);
      }
    }

    // 4. Check explicit YouTube link inside content
    const ytLinkMatch = source.match(
      /(?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
    );
    if (ytLinkMatch?.[1]) {
      return `https://www.youtube.com/embed/${ytLinkMatch[1]}`;
    }
  }
  return undefined;
}

export function estimateReadingTime(text: string): number {
  const plain = stripHtml(text);
  if (!plain) return 1;
  const spacedWords = plain.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(Math.max(spacedWords, Math.floor(plain.length / 6)) / 200));
}

export function parseDate(raw?: string): number | undefined {
  if (!raw) return undefined;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function formatRelative(millis?: number): string {
  if (!millis) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - millis) / 60_000));
  if (minutes < 1) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  if (minutes < 1_440) return `${Math.floor(minutes / 60)} ชั่วโมงที่แล้ว`;
  if (minutes < 10_080) return `${Math.floor(minutes / 1_440)} วันที่แล้ว`;
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(millis));
}

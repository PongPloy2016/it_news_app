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

  // Filter out promotional/subscription banners (e.g. Thairath Home Delivery)
  if (/homedelivery|home-delivery|subscription|enews-01|premium-01|homedelivery-01/i.test(cleaned)) {
    return undefined;
  }

  // Fix MGR Online broken CDN domain in RSS feed (mpics-cdn returns 404, while mpics.mgronline.com returns 200 OK)
  cleaned = cleaned.replace(/\/\/mpics-cdn\.mgronline\.com\//i, '//mpics.mgronline.com/');
  // Ensure protocol
  if (cleaned.startsWith('//')) {
    cleaned = 'https:' + cleaned;
  }
  // Upgrade insecure http to https for known domains that support SSL
  if (
    /^http:\/\/(?:www\.)?(?:blognone|brandinside|droidsans|beartai|techsauce|techtalkthai|it24hrs|techhub|sanook|mgronline|manager|thestandard|thaipbs|thairath|matichon|khaosod|dailynews|thaiware)/i.test(
      cleaned,
    )
  ) {
    cleaned = cleaned.replace(/^http:\/\//i, 'https://');
  }
  return cleaned;
}

export function cleanLeadText(raw?: string | null): string {
  if (!raw) return '';
  let text = stripHtml(raw);
  text = text.replace(/\[\.\.\.\]/g, ' ');
  text = text.replace(/The post .*?(?:appeared first on|first appeared on).*$/gi, '');
  text = text.replace(/appeared first on .*$/gi, '');
  text = text.replace(/first appeared on .*$/gi, '');
  text = text.replace(/บทความนี้เผยแพร่ครั้งแรกที่.*$/gi, '');
  text = text.replace(/อ่านเพิ่มเติมได้ที่.*$/gi, '');
  text = text.replace(/อ่านต่อที่.*$/gi, '');
  text = text.replace(/source:.*$/gi, '');
  text = text.replace(/https?:\/\/\S+/gi, '');
  return text.replace(/\s+/g, ' ').trim();
}

export function extractImage(...sources: Array<string | undefined>): string | undefined {
  const images = extractImages(...sources);
  return images[0] || undefined;
}

export function extractImages(...sources: Array<string | undefined>): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    if (!source) continue;
    // Match <img> tags and extract highest resolution from srcset, data-*, or src
    const imgTagMatches = source.matchAll(/<img\b[^>]*>/gi);
    for (const match of imgTagMatches) {
      const tag = match[0];
      let rawCandidate: string | undefined;

      // 1. Check srcset first for highest resolution candidate
      const srcsetMatch = tag.match(/\bsrcset\s*=\s*["']([^"']+)["']/i);
      if (srcsetMatch?.[1]) {
        const parts = srcsetMatch[1].split(',');
        let maxW = 0;
        for (const part of parts) {
          const tokens = part.trim().split(/\s+/);
          if (tokens.length > 0 && (/^https?:\/\//i.test(tokens[0]) || tokens[0].startsWith('//'))) {
            let w = 0;
            if (tokens.length > 1 && tokens[1].endsWith('w')) {
              w = parseInt(tokens[1].slice(0, -1), 10) || 0;
            }
            if (w >= maxW) {
              maxW = w;
              rawCandidate = tokens[0];
            }
          }
        }
      }

      // 2. Fallback to data attributes or src
      if (!rawCandidate) {
        const srcMatch = tag.match(
          /\b(?:data-original|data-orig-file|data-large-file|data-src|data-lazy-src|src)\s*=\s*["']([^"']+)["']/i,
        );
        rawCandidate = srcMatch?.[1];
      }

      if (rawCandidate) {
        const raw = he.decode(rawCandidate).trim();
        // Ignore relative paths without protocol
        if (!/^https?:\/\//i.test(raw) && !raw.startsWith('//')) {
          continue;
        }
        const sanitized = sanitizeImageUrl(raw);
        if (sanitized && !seen.has(sanitized)) {
          // Exclude tracker pixels, spacer GIFs, avatars, badges, and layout banners
          if (
            !/feedsportal|feedburner|statcounter|doubleclick|googletagmanager|avatar|gravatar|badge|banner|\/jobs\/|homedelivery|home-delivery|subscription|enews-01|premium-01|homedelivery-01/i.test(
              sanitized,
            ) &&
            !/\.(?:ico|svg)(?:\?.*)?$/i.test(sanitized)
          ) {
            seen.add(sanitized);
            images.push(sanitized);
          }
        }
      }
    }
  }

  return images.slice(0, 6);
}

export function extractOgImage(html: string, pageUrl?: string): string | undefined {
  const images = extractOgImages(html, pageUrl);
  return images[0] || undefined;
}

export function extractOgImages(html: string, pageUrl?: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  const addUrl = (raw?: string) => {
    if (!raw) return;
    let url = he.decode(String(raw)).trim();
    if (!url || url.startsWith('data:')) return;
    if (url.startsWith('//')) url = 'https:' + url;
    if (pageUrl && (url.startsWith('/') || !/^https?:\/\//i.test(url))) {
      try {
        url = new URL(url, pageUrl).href;
      } catch {
        return;
      }
    }
    const sanitized = sanitizeImageUrl(url);
    if (sanitized && !seen.has(sanitized)) {
      if (
        !/feedsportal|feedburner|statcounter|doubleclick|googletagmanager|avatar|gravatar|badge|banner|\/jobs\//i.test(
          sanitized,
        ) &&
        !/\.(?:ico|svg)(?:\?.*)?$/i.test(sanitized)
      ) {
        seen.add(sanitized);
        images.push(sanitized);
      }
    }
  };

  // 1. Meta tags (og:image, twitter:image, thumbnail)
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const name = tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (
      ![
        'og:image',
        'og:image:url',
        'og:image:secure_url',
        'twitter:image',
        'twitter:image:src',
        'thumbnail',
      ].includes(name ?? '')
    ) {
      continue;
    }
    const content = tag.match(/content\s*=\s*["']([^"']+)["']/i)?.[1];
    if (content) addUrl(content);
  }

  // 2. Link rel="image_src"
  for (const match of html.matchAll(
    /<link\b[^>]*rel\s*=\s*["']image_src["'][^>]*href\s*=\s*["']([^"']+)["']/gi,
  )) {
    if (match[1]) addUrl(match[1]);
  }

  // 3. Schema.org JSON-LD
  for (const match of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : data['@graph'] || [data];
      for (const item of items) {
        if (!item) continue;
        const img = item.image || item.thumbnailUrl;
        if (typeof img === 'string') addUrl(img);
        else if (Array.isArray(img) && typeof img[0] === 'string') addUrl(img[0]);
        else if (img && typeof img.url === 'string') addUrl(img.url);
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  return images;
}

export function extractArticleImagesFromHtml(html: string, pageUrl: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  const addUrl = (raw?: string) => {
    if (!raw) return;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('data:')) return;
    try {
      const resolved = new URL(trimmed, pageUrl).href;
      if (
        !seen.has(resolved) &&
        !/badge|banner|gtag|doubleclick|feedburner|feedsportal|statcounter|avatar|gravatar|defaultcover|\/jobs\/|emoji|logo|icon|tracking|homedelivery|home-delivery|subscription|enews-01|premium-01|homedelivery-01/i.test(
          resolved,
        ) &&
        !/\.(?:ico|svg)(?:\?.*)?$/i.test(resolved)
      ) {
        seen.add(resolved);
        images.push(resolved);
      }
    } catch {
      // Ignore invalid URL
    }
  };

  // 1. og:image tags (featured image)
  const ogMatches = html.matchAll(
    /<meta\b[^>]*property\s*=\s*["']og:image(?::url|:secure_url)?["'][^>]*content\s*=\s*["']([^"']+)["']/gi,
  );
  for (const m of ogMatches) {
    addUrl(he.decode(m[1]));
  }
  const ogNameMatches = html.matchAll(
    /<meta\b[^>]*name\s*=\s*["'](?:twitter:image|thumbnail)["'][^>]*content\s*=\s*["']([^"']+)["']/gi,
  );
  for (const m of ogNameMatches) {
    addUrl(he.decode(m[1]));
  }

  // 2. Isolate article body: <article>, <main>, or common article content containers
  let bodyHtml = '';
  const articleMatch = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    bodyHtml = articleMatch[1];
  } else {
    const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
      bodyHtml = mainMatch[1];
    } else {
      const contentMatch = html.match(
        /<div\b[^>]*class=["'][^"']*(?:entry-content|post-content|article-body|story-body|detail-content|article-content|field-item)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      );
      if (contentMatch) {
        bodyHtml = contentMatch[1];
      }
    }
  }

  // 3. Extract images inside the isolated article body
  if (bodyHtml) {
    const allImgMatches = bodyHtml.matchAll(/<img\b[^>]*>/gi);
    for (const m of allImgMatches) {
      const tag = m[0];
      let candUrl: string | undefined;

      const srcsetMatch = tag.match(/\bsrcset\s*=\s*["']([^"']+)["']/i);
      if (srcsetMatch?.[1]) {
        const parts = srcsetMatch[1].split(',');
        let maxW = 0;
        for (const part of parts) {
          const tokens = part.trim().split(/\s+/);
          if (tokens.length > 0 && (/^https?:\/\//i.test(tokens[0]) || tokens[0].startsWith('//') || tokens[0].startsWith('/'))) {
            let w = 0;
            if (tokens.length > 1 && tokens[1].endsWith('w')) {
              w = parseInt(tokens[1].slice(0, -1), 10) || 0;
            }
            if (w >= maxW) {
              maxW = w;
              candUrl = tokens[0];
            }
          }
        }
      }

      if (!candUrl) {
        const attrMatch = tag.match(
          /\b(?:data-original|data-orig-file|data-large-file|data-src|data-lazy-src|src)\s*=\s*["']([^"']+)["']/i,
        );
        candUrl = attrMatch?.[1];
      }

      if (candUrl) {
        addUrl(he.decode(candUrl));
      }
    }
  }

  return images.slice(0, 10);
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

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

/**
 * Format timestamp into Thai Buddhist date (e.g. "20 ต.ค. 2569" or "20 ต.ค. 69")
 */
export function formatThaiDate(
  millis?: number,
  options?: { shortYear?: boolean; noYear?: boolean },
): string {
  if (!millis) return '';
  const d = new Date(millis);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = THAI_MONTHS_SHORT[d.getMonth()] || '';
  if (options?.noYear) {
    return `${day} ${month}`;
  }
  const beYear = d.getFullYear() + 543;
  if (options?.shortYear) {
    return `${day} ${month} ${String(beYear).slice(-2)}`;
  }
  return `${day} ${month} ${beYear}`;
}

export function formatDateWithRelative(
  millis?: number,
  options?: { shortYear?: boolean },
): string {
  if (!millis) return '';
  const dateStr = formatThaiDate(millis, options);
  const relStr = formatRelative(millis);
  if (!dateStr) return relStr || '';
  if (!relStr || relStr === dateStr) return dateStr;
  return `${dateStr} • ${relStr}`;
}

export function formatRelative(millis?: number): string {
  if (!millis) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - millis) / 60_000));
  if (minutes < 1) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  if (minutes < 1_440) return `${Math.floor(minutes / 60)} ชั่วโมงที่แล้ว`;
  if (minutes < 10_080) return `${Math.floor(minutes / 1_440)} วันที่แล้ว`;
  return formatThaiDate(millis);
}


import AsyncStorage from '@react-native-async-storage/async-storage';
import he from 'he';
import { resolveGoogleNewsUrl } from './imageService';
import { sanitizeImageUrl } from '../utils/content';

export interface ArticleContentBlock {
  type: 'paragraph' | 'heading' | 'quote' | 'list' | 'image';
  text?: string;
  level?: number;
  url?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
}

export interface FullArticleResult {
  paragraphs: string[];
  blocks: ArticleContentBlock[];
  fullText: string;
  images?: string[];
  paragraphCount: number;
  source: 'cache' | 'network';
}

const CACHE_PREFIX = '@it_news_full_content_';
const memoryCache = new Map<string, FullArticleResult>();

function hashUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash * 31 + url.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash).toString(36);
}

const JUNK_REGEX =
  /^(แชร์|แชร์บทความ|แชร์หน้านี้|กดติดตาม|ติดตามเรา|ข่าวที่เกี่ยวข้อง|อ่านเพิ่มเติม|อ่านต่อ|ดูเพิ่มเติม|topics:|tags:|แท็ก:|เครดิตภาพ:|ที่มาภาพ:|ที่มา:|ภาพจาก:|advertisement|โฆษณา|สงวนลิขสิทธิ์|privacy policy|terms of service|newsletter|subscribe)/i;

/**
 * Supercharged Readability extractor for Thai & International news HTML
 * Extracts structured blocks (headings, paragraphs, blockquotes, lists, and inline images)
 * in their exact sequential order matching the original web article ("ตามต้นฉบับ").
 */
export function extractArticleContentFromHtml(
  html: string,
  pageUrl?: string,
): { blocks: ArticleContentBlock[]; paragraphs: string[]; fullText: string; images?: string[] } | null {
  if (!html) return null;

  // 1. Remove non-content elements
  const clean = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // 2. Locate candidate article container
  let container = '';
  const articleMatch = clean.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    container = articleMatch[1];
  } else {
    const classMatch = clean.match(
      /<div\b[^>]*class=["']\s*[^"']*(?:entry-content|post-content|article-content|story-body|detail-content|content-feed|news-content|article-body|read-content|main-content|detail|content-item__body|td-post-content|elementor-widget-theme-post-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    );
    if (classMatch) {
      container = classMatch[1];
    } else {
      const mainMatch = clean.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
      container = mainMatch ? mainMatch[1] : clean;
    }
  }

  const seenImages = new Set<string>();

  // Helper to parse <img> tag and extract highest resolution URL, dimensions, and captions
  const parseImgTag = (tag: string, caption?: string): ArticleContentBlock | null => {
    let bestUrl: string | undefined;

    // Check srcset first for highest resolution image
    const srcsetMatch = tag.match(/\bsrcset\s*=\s*["']([^"']+)["']/i);
    if (srcsetMatch?.[1]) {
      const parts = srcsetMatch[1].split(',');
      let maxW = 0;
      for (const part of parts) {
        const tokens = part.trim().split(/\s+/);
        if (tokens.length > 0) {
          let u = tokens[0];
          if (u.startsWith('//')) u = 'https:' + u;
          if (pageUrl && u.startsWith('/')) {
            try {
              u = new URL(u, pageUrl).href;
            } catch {
              // Ignore
            }
          }
          if (/^https?:\/\//i.test(u)) {
            let w = 0;
            if (tokens.length > 1 && tokens[1].endsWith('w')) {
              w = parseInt(tokens[1].slice(0, -1), 10) || 0;
            }
            if (w >= maxW) {
              maxW = w;
              bestUrl = u;
            }
          }
        }
      }
    }

    if (!bestUrl) {
      const srcMatch = tag.match(
        /\b(?:data-original|data-orig-file|data-large-file|data-src|data-lazy-src|src)\s*=\s*["']([^"']+)["']/i,
      );
      if (srcMatch?.[1]) {
        let u = srcMatch[1].trim();
        if (u.startsWith('//')) u = 'https:' + u;
        if (pageUrl && u.startsWith('/')) {
          try {
            u = new URL(u, pageUrl).href;
          } catch {
            // Ignore
          }
        }
        bestUrl = u;
      }
    }

    if (!bestUrl || !/^https?:\/\//i.test(bestUrl)) return null;

    const sanitized = sanitizeImageUrl(bestUrl);
    if (!sanitized) return null;

    // Exclude trackers, avatars, icons, badges, banners, doubleclick
    if (
      /avatar|gravatar|logo|icon|tracking|badge|emoji|pixel|banner|doubleclick|feedsportal|feedburner|statcounter|1x1/i.test(
        sanitized,
      ) ||
      /\.(?:ico|svg)(?:\?.*)?$/i.test(sanitized)
    ) {
      return null;
    }

    if (seenImages.has(sanitized)) return null;
    seenImages.add(sanitized);

    const altMatch = tag.match(/\balt\s*=\s*["']([^"']*)["']/i);
    const alt = altMatch?.[1] ? he.decode(altMatch[1]).trim() : undefined;

    const wMatch = tag.match(/\bwidth\s*=\s*["']?(\d+)["']?/i);
    const hMatch = tag.match(/\bheight\s*=\s*["']?(\d+)["']?/i);
    const width = wMatch ? parseInt(wMatch[1], 10) : undefined;
    const height = hMatch ? parseInt(hMatch[1], 10) : undefined;
    const aspectRatio = width && height && width > 0 && height > 0 ? width / height : undefined;

    return {
      type: 'image',
      url: sanitized,
      alt,
      caption,
      width,
      height,
      aspectRatio,
    };
  };

  const blocks: ArticleContentBlock[] = [];
  const inArticleImages: string[] = [];

  // Match blocks in sequence: <figure>, <h1-6>, <blockquote>, <li>, <p>, or standalone <img>
  const pattern =
    /<figure\b[^>]*>([\s\S]*?)<\/figure>|<(h[1-6]|blockquote|li)\b[^>]*>([\s\S]*?)<\/\2>|<p\b[^>]*>([\s\S]*?)<\/p>|<img\b[^>]*\/?>/gi;

  for (const match of container.matchAll(pattern)) {
    const figInner = match[1];
    const tagName = match[2];
    const tagInner = match[3];
    const pInner = match[4];
    const fullTag = match[0];

    if (figInner !== undefined) {
      // <figure>
      const imgMatch = figInner.match(/<img\b[^>]*\/?>/i);
      const capMatch = figInner.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i);
      const caption = capMatch ? he.decode(capMatch[1].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim() : undefined;
      if (imgMatch) {
        const imgBlock = parseImgTag(imgMatch[0], caption);
        if (imgBlock?.url) {
          blocks.push(imgBlock);
          if (!inArticleImages.includes(imgBlock.url)) inArticleImages.push(imgBlock.url);
        }
      }
    } else if (tagName !== undefined) {
      // <h1-6>, <blockquote>, <li>
      const rawText = tagInner.replace(/<[^>]*>/g, ' ');
      const text = he.decode(rawText).replace(/\s+/g, ' ').trim();
      if (text.length >= 6 && !JUNK_REGEX.test(text)) {
        const lowerTag = tagName.toLowerCase();
        if (lowerTag.startsWith('h')) {
          const level = parseInt(lowerTag.slice(1), 10) || 2;
          blocks.push({ type: 'heading', text, level });
        } else if (lowerTag === 'blockquote') {
          blocks.push({ type: 'quote', text });
        } else if (lowerTag === 'li') {
          blocks.push({ type: 'list', text });
        }
      }
    } else if (pInner !== undefined) {
      // <p> might contain <img> tags
      const imgMatches = Array.from(pInner.matchAll(/<img\b[^>]*\/?>/gi));
      for (const im of imgMatches) {
        const imgBlock = parseImgTag(im[0]);
        if (imgBlock?.url) {
          blocks.push(imgBlock);
          if (!inArticleImages.includes(imgBlock.url)) inArticleImages.push(imgBlock.url);
        }
      }
      // Text inside <p>
      const rawText = pInner.replace(/<[^>]*>/g, ' ');
      const text = he.decode(rawText).replace(/\s+/g, ' ').trim();
      if (
        text.length >= 15 &&
        !JUNK_REGEX.test(text) &&
        !/^The post .*(?:first appeared|appeared first)/i.test(text) &&
        !/^ติดตามข่าวสาร/i.test(text)
      ) {
        blocks.push({ type: 'paragraph', text });
      }
    } else if (fullTag.toLowerCase().startsWith('<img')) {
      const imgBlock = parseImgTag(fullTag);
      if (imgBlock?.url) {
        blocks.push(imgBlock);
        if (!inArticleImages.includes(imgBlock.url)) inArticleImages.push(imgBlock.url);
      }
    }
  }

  // Fallback: If no structured blocks, extract substantive <div> blocks or plain text lines
  if (blocks.length === 0) {
    const divMatches = container.matchAll(/<div\b[^>]*>([\s\S]*?)<\/div>/gi);
    for (const m of divMatches) {
      if (m[1].includes('<div') || m[1].includes('<p')) continue;
      const text = he.decode(m[1].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
      if (text.length >= 35 && !JUNK_REGEX.test(text)) {
        blocks.push({ type: 'paragraph', text });
      }
    }
  }

  if (blocks.length === 0) {
    const lines = clean
      .split(/\n+/)
      .map((l) => he.decode(l.replace(/<[^>]*>/g, '')).trim())
      .filter((l) => l.length >= 20 && !JUNK_REGEX.test(l));
    for (const l of lines) {
      blocks.push({ type: 'paragraph', text: l });
    }
  }

  if (blocks.length === 0) return null;

  // Build paragraphs and fullText for TTS and AI summary
  const paragraphs: string[] = [];
  for (const b of blocks) {
    if (b.type === 'heading' && b.text) {
      paragraphs.push(`📌 ${b.text}`);
    } else if (b.type === 'quote' && b.text) {
      paragraphs.push(`“${b.text}”`);
    } else if (b.type === 'list' && b.text) {
      paragraphs.push(`• ${b.text}`);
    } else if (b.type === 'paragraph' && b.text) {
      paragraphs.push(b.text);
    }
  }

  return {
    blocks,
    paragraphs,
    fullText: paragraphs.join('\n\n'),
    images: inArticleImages.slice(0, 10),
  };
}

export const articleContentService = {
  /**
   * Fetch full article content from web, returning cached version if available.
   */
  async getFullArticle(
    url: string,
    articleId?: string,
    forceRefresh: boolean = false,
  ): Promise<FullArticleResult | null> {
    if (!url || !/^https?:\/\//i.test(url)) return null;

    const cacheKey = `${CACHE_PREFIX}${articleId || hashUrl(url)}`;

    // 1. Check in-memory cache (unless forcing refresh)
    if (!forceRefresh && memoryCache.has(cacheKey)) {
      return memoryCache.get(cacheKey)!;
    }

    // 2. Check AsyncStorage (unless forcing refresh)
    if (!forceRefresh) {
      try {
        const cachedJson = await AsyncStorage.getItem(cacheKey);
        if (cachedJson) {
          const parsed = JSON.parse(cachedJson) as FullArticleResult;
          parsed.source = 'cache';
          // Ensure blocks exist in cached result (upgrade old cache schema)
          if (!parsed.blocks || parsed.blocks.length === 0) {
            const upgraded = extractArticleContentFromHtml(
              parsed.fullText || parsed.paragraphs?.join('\n\n') || '',
              url,
            );
            if (upgraded && upgraded.blocks.length > 0) {
              parsed.blocks = upgraded.blocks;
            }
          }
          memoryCache.set(cacheKey, parsed);
          return parsed;
        }
      } catch {
        // Fallback to network
      }
    }

    // 3. Network fetch
    try {
      let targetUrl = url;
      if (targetUrl.includes('news.google.com/rss/articles/')) {
        const resolved = await resolveGoogleNewsUrl(targetUrl);
        if (resolved) {
          targetUrl = resolved;
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'th,en-US;q=0.9,en;q=0.8',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) return null;

      const html = await response.text();
      const extracted = extractArticleContentFromHtml(html, targetUrl);
      if (!extracted || extracted.paragraphs.length === 0) return null;

      const result: FullArticleResult = {
        paragraphs: extracted.paragraphs,
        blocks: extracted.blocks,
        fullText: extracted.fullText,
        images: extracted.images,
        paragraphCount: extracted.paragraphs.length,
        source: 'network',
      };

      // Save to memory cache & AsyncStorage
      memoryCache.set(cacheKey, result);
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
      } catch {
        // Non-critical cache write failure
      }

      return result;
    } catch {
      return null;
    }
  },

  /**
   * Pre-fetch top articles in background so they open instantly!
   */
  async prefetchArticles(
    articles: Array<{ link: string; id?: string; content?: string; description?: string }>,
    limit: number = 8,
  ): Promise<void> {
    if (!articles || articles.length === 0) return;

    // Filter articles that need prefetching
    const targets = articles
      .filter((a) => {
        if (!a?.link || !/^https?:\/\//i.test(a.link)) return false;
        const cacheKey = `${CACHE_PREFIX}${a.id || hashUrl(a.link)}`;
        if (memoryCache.has(cacheKey)) return false;
        // Skip if already has long multi-paragraph content
        const text = a.content || a.description || '';
        return !(text.length > 500 && text.includes('\n'));
      })
      .slice(0, limit);

    // Fetch with gentle concurrency (2 at a time)
    for (let i = 0; i < targets.length; i += 2) {
      const batch = targets.slice(i, i + 2);
      await Promise.all(
        batch.map((art) => this.getFullArticle(art.link, art.id).catch(() => null)),
      );
    }
  },

  /**
   * Clear cached article contents
   */
  async clearCache(): Promise<void> {
    memoryCache.clear();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const articleKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
      if (articleKeys.length > 0) {
        await AsyncStorage.multiRemove(articleKeys);
      }
    } catch {
      // Ignore
    }
  },
};

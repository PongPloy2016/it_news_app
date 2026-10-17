import AsyncStorage from '@react-native-async-storage/async-storage';
import he from 'he';
import { resolveGoogleNewsUrl } from './imageService';

export interface FullArticleResult {
  paragraphs: string[];
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
 * Extracts paragraphs, subheadings, blockquotes, lists, and in-article images.
 */
export function extractArticleContentFromHtml(
  html: string,
): { paragraphs: string[]; fullText: string; images?: string[] } | null {
  if (!html) return null;

  // 1. Try Schema.org JSON-LD articleBody first
  const jsonLdMatches = html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const m of jsonLdMatches) {
    try {
      const data = JSON.parse(m[1]);
      const graph = Array.isArray(data['@graph']) ? data['@graph'] : [data];
      for (const item of graph) {
        if (item.articleBody && typeof item.articleBody === 'string' && item.articleBody.length > 250) {
          const rawParas = item.articleBody
            .split(/\n+/)
            .map((p: string) => he.decode(p).replace(/\s+/g, ' ').trim())
            .filter((p: string) => p.length >= 25 && !JUNK_REGEX.test(p));
          if (rawParas.length >= 2) {
            return {
              paragraphs: rawParas,
              fullText: rawParas.join('\n\n'),
            };
          }
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  // 2. DOM HTML Extraction: Remove non-content elements
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

  // 3. Locate candidate article container
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

  // 4. Extract <p>, <h2>, <h3>, <h4>, <blockquote>, <li>
  const blockMatches = container.matchAll(/<(p|h2|h3|h4|blockquote|li)\b[^>]*>([\s\S]*?)<\/\1>/gi);
  const paragraphs: string[] = [];

  for (const m of blockMatches) {
    const tag = m[1].toLowerCase();
    const raw = m[2].replace(/<[^>]*>/g, ' ');
    const text = he.decode(raw).replace(/\s+/g, ' ').trim();
    if (text.length >= 20 && !JUNK_REGEX.test(text)) {
      if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
        paragraphs.push(`📌 ${text}`);
      } else if (tag === 'blockquote') {
        paragraphs.push(`“${text}”`);
      } else if (tag === 'li') {
        paragraphs.push(`• ${text}`);
      } else {
        paragraphs.push(text);
      }
    }
  }

  // Fallback: If no structured tags found, extract substantive <div> blocks
  if (paragraphs.length === 0) {
    const divMatches = container.matchAll(/<div\b[^>]*>([\s\S]*?)<\/div>/gi);
    for (const m of divMatches) {
      if (m[1].includes('<div') || m[1].includes('<p')) continue;
      const text = he.decode(m[1].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
      if (text.length >= 40 && !JUNK_REGEX.test(text)) {
        paragraphs.push(text);
      }
    }
  }

  if (paragraphs.length === 0) return null;

  // 5. Extract in-article images
  const inArticleImages: string[] = [];
  const imgMatches = container.matchAll(/<img\b[^>]*src=["']([^"']+)["']/gi);
  for (const im of imgMatches) {
    const src = im[1].trim();
    if (
      /^https?:\/\//i.test(src) &&
      !/avatar|gravatar|logo|icon|tracking|badge|emoji|pixel|banner|doubleclick/i.test(src) &&
      !/\.(?:ico|svg)(?:\?.*)?$/i.test(src)
    ) {
      if (!inArticleImages.includes(src)) {
        inArticleImages.push(src);
      }
    }
  }

  return {
    paragraphs,
    fullText: paragraphs.join('\n\n'),
    images: inArticleImages.slice(0, 8),
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
      const extracted = extractArticleContentFromHtml(html);
      if (!extracted || extracted.paragraphs.length === 0) return null;

      const result: FullArticleResult = {
        paragraphs: extracted.paragraphs,
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

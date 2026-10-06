import he from 'he';
import { NewsArticle } from '../types';
import {
  extractArticleImagesFromHtml,
  extractOgImage,
  extractVideoUrl,
  sanitizeImageUrl,
} from '../utils/content';

export async function resolveGoogleNewsUrl(googleUrl: string): Promise<string | null> {
  if (!googleUrl.includes('news.google.com/rss/articles/')) return googleUrl;
  try {
    const res = await fetch(googleUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const html = await res.text();
    const match = html.match(/data-p="([^"]+)"/);
    if (!match) return null;
    const decoded = he.decode(match[1]);
    const obj = JSON.parse(decoded.replace('%.@.', '["garturlreq",'));
    const payload = {
      'f.req': JSON.stringify([
        [['Fbv4je', JSON.stringify([...obj.slice(0, -6), ...obj.slice(-2)]), 'null', 'generic']],
      ]),
    };
    const postRes = await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute', {
      method: 'POST',
      body: new URLSearchParams(payload),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const text = await postRes.text();
    const clean = text.replace(")]}'", '').trim();
    const parsed = JSON.parse(clean);
    const arrayString = parsed[0][2];
    const articleUrl = JSON.parse(arrayString)[1];
    return typeof articleUrl === 'string' && articleUrl.startsWith('http') ? articleUrl : null;
  } catch {
    return null;
  }
}

export const imageService = {
  async fetchArticleImagesFromLink(link: string): Promise<string[]> {
    if (!link || !/^https?:\/\//i.test(link)) return [];
    try {
      let targetUrl = link;
      if (targetUrl.includes('news.google.com/rss/articles/')) {
        const resolved = await resolveGoogleNewsUrl(targetUrl);
        if (resolved) {
          targetUrl = resolved;
        }
      }

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ITNewsApp/1.0)',
        },
      });
      if (!response.ok) return [];
      const html = await response.text();
      return extractArticleImagesFromHtml(html, targetUrl);
    } catch {
      return [];
    }
  },

  async enrichArticlesWithOgImage(
    articles: NewsArticle[],
    onUpdate: (updatedArticles: NewsArticle[]) => void,
    limit: number = 20,
  ): Promise<void> {
    const pending = articles.filter((item) => !sanitizeImageUrl(item.imageUrl)).slice(0, limit);
    if (pending.length === 0) return;

    let current = [...articles];

    await Promise.all(
      pending.map(async (article) => {
        try {
          let targetUrl = article.link;
          if (targetUrl.includes('news.google.com/rss/articles/')) {
            const resolved = await resolveGoogleNewsUrl(targetUrl);
            if (resolved) {
              targetUrl = resolved;
            }
          }

          const response = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ITNewsApp/1.0)' },
          });
          if (!response.ok) return;

          const html = await response.text();
          const imageUrl = extractOgImage(html);
          const videoUrl = !article.videoUrl ? extractVideoUrl(html) : undefined;
          if (!imageUrl && !videoUrl && targetUrl === article.link) return;

          current = current.map((item) =>
            item.id === article.id
              ? {
                  ...item,
                  ...(targetUrl !== article.link ? { link: targetUrl } : {}),
                  ...(imageUrl && !sanitizeImageUrl(item.imageUrl) ? { imageUrl } : {}),
                  ...(videoUrl && !item.videoUrl ? { videoUrl } : {}),
                }
              : item,
          );
          onUpdate(current);
        } catch {
          // Best effort image enrichment
        }
      }),
    );
  },
};

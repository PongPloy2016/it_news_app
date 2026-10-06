import { NewsArticle } from '../types';
import {
  extractArticleImagesFromHtml,
  extractOgImage,
  extractVideoUrl,
  sanitizeImageUrl,
} from '../utils/content';

export const imageService = {
  async fetchArticleImagesFromLink(link: string): Promise<string[]> {
    if (!link || !/^https?:\/\//i.test(link)) return [];
    try {
      const response = await fetch(link, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ITNewsApp/1.0)',
        },
      });
      if (!response.ok) return [];
      const html = await response.text();
      return extractArticleImagesFromHtml(html, link);
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
          const response = await fetch(article.link, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ITNewsApp/1.0)' },
          });
          if (!response.ok) return;

          const html = await response.text();
          const imageUrl = extractOgImage(html);
          const videoUrl = !article.videoUrl ? extractVideoUrl(html) : undefined;
          if (!imageUrl && !videoUrl) return;

          current = current.map((item) =>
            item.id === article.id
              ? {
                  ...item,
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

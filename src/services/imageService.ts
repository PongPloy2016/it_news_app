import { NewsArticle } from '../types';
import { extractOgImage } from '../utils/content';

export const imageService = {
  async enrichArticlesWithOgImage(
    articles: NewsArticle[],
    onUpdate: (updatedArticles: NewsArticle[]) => void,
    limit: number = 20,
  ): Promise<void> {
    const pending = articles.filter((item) => !item.imageUrl).slice(0, limit);
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
          if (!imageUrl) return;

          current = current.map((item) =>
            item.id === article.id && !item.imageUrl ? { ...item, imageUrl } : item,
          );
          onUpdate(current);
        } catch {
          // Best effort image enrichment
        }
      }),
    );
  },
};

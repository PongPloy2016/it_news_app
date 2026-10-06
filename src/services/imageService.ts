import { NewsArticle } from '../types';
import { extractImages, extractOgImages, extractVideoUrl, sanitizeImageUrl } from '../utils/content';

export const imageService = {
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
          const ogImages = extractOgImages(html);
          const bodyImages = extractImages(html);
          const allExtracted = Array.from(new Set([...ogImages, ...bodyImages]));
          const imageUrl = allExtracted[0] || undefined;
          const videoUrl = !article.videoUrl ? extractVideoUrl(html) : undefined;
          if (!imageUrl && !videoUrl) return;

          current = current.map((item) =>
            item.id === article.id
              ? {
                  ...item,
                  ...(imageUrl && !sanitizeImageUrl(item.imageUrl) ? { imageUrl } : {}),
                  ...(allExtracted.length > 1 && (!item.images || item.images.length <= 1)
                    ? { images: allExtracted }
                    : {}),
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

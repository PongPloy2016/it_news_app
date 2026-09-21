import { NewsArticle } from '../../types';

export function dedupeAndSortArticles(articles: NewsArticle[]): NewsArticle[] {
  const unique = new Map<string, NewsArticle>();

  for (const article of articles) {
    if (!article) continue;
    const dedupeKey = article.link?.trim() || article.id?.trim();
    if (!dedupeKey) continue;
    // Prefer article with image if duplicate key
    const existing = unique.get(dedupeKey);
    if (!existing || (!existing.imageUrl && article.imageUrl)) {
      unique.set(dedupeKey, article);
    }
  }

  return [...unique.values()].sort((a, b) => (b.publishedMillis ?? 0) - (a.publishedMillis ?? 0));
}

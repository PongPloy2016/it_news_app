import { NewsArticle } from '../../types';

export function dedupeAndSortArticles(articles: NewsArticle[]): NewsArticle[] {
  const unique = new Map<string, NewsArticle>();

  for (const article of articles) {
    if (!article || !article.id) continue;
    // Prefer article with image if duplicate key
    const existing = unique.get(article.id);
    if (!existing || (!existing.imageUrl && article.imageUrl)) {
      unique.set(article.id, article);
    }
  }

  return [...unique.values()].sort((a, b) => (b.publishedMillis ?? 0) - (a.publishedMillis ?? 0));
}

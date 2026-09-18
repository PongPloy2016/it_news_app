import { NewsArticle } from '../../types';
import { dedupeAndSortArticles } from './dedupe';
import { fetchFeedXml } from './fetcher';
import { normalizeRawEntry } from './normalizer';
import { asArray, parseRawXml } from './parser';

export * from './fetcher';
export * from './parser';
export * from './normalizer';
export * from './dedupe';

export function parseFeed(xml: string): NewsArticle[] {
  const document = parseRawXml(xml);
  const feed = document.feed as Record<string, unknown> | undefined;
  const channel = (document.rss as Record<string, unknown> | undefined)?.channel as Record<string, unknown> | undefined;
  const entries = feed ? asArray(feed.entry) : asArray(channel?.item);

  const rawArticles: NewsArticle[] = [];
  for (const raw of entries) {
    if (!raw || typeof raw !== 'object') continue;
    const article = normalizeRawEntry(raw as Record<string, unknown>, Boolean(feed));
    if (article) rawArticles.push(article);
  }

  return dedupeAndSortArticles(rawArticles);
}

export async function fetchAndParseFeed(feedUrl: string): Promise<NewsArticle[]> {
  const xml = await fetchFeedXml(feedUrl);
  return parseFeed(xml);
}

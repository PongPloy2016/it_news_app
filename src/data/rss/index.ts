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

import { isThaiMojibake, repairMojibakeArticles } from '../../utils/content';

async function enrichEjanArticles(articles: NewsArticle[]): Promise<NewsArticle[]> {
  const ejanArticles = articles.filter(
    (a) => a.link && a.link.includes('ejan.co') && !a.imageUrl,
  );
  if (ejanArticles.length === 0) return articles;

  const imageMap = new Map<string, string>();
  await Promise.allSettled(
    ejanArticles.slice(0, 15).map(async (article) => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`https://r.jina.ai/${article.link}`, {
          signal: controller.signal,
          headers: { 'X-Return-Format': 'html' },
        });
        clearTimeout(timer);
        if (!res.ok) return;
        const html = await res.text();
        const m =
          html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
          html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:image["']/i);
        const img = m ? (m[1] || m[2]) : undefined;
        if (img) {
          imageMap.set(article.id, img);
        }
      } catch {
        // ignore individual image enrichment error
      }
    }),
  );

  if (imageMap.size === 0) return articles;

  return articles.map((article) => {
    const img = imageMap.get(article.id);
    return img ? { ...article, imageUrl: img } : article;
  });
}

export async function fetchAndParseFeed(feedUrl: string): Promise<NewsArticle[]> {
  const xml = await fetchFeedXml(feedUrl);
  let articles = parseFeed(xml);
  if (articles.some((a) => isThaiMojibake(a.title))) {
    articles = await repairMojibakeArticles(articles);
  }
  if (articles.some((a) => a.link && a.link.includes('ejan.co') && !a.imageUrl)) {
    articles = await enrichEjanArticles(articles);
  }
  return articles;
}

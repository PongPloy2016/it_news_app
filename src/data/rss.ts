import { XMLParser } from 'fast-xml-parser';
import { NewsArticle } from '../types';
import { estimateReadingTime, extractImage, parseDate, stripHtml } from '../utils/content';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  cdataPropName: '#cdata',
  trimValues: false,
});

const asArray = <T>(value: T | T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

function text(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    const node = value as Record<string, unknown>;
    return text(node['#cdata'] ?? node['#text'] ?? '');
  }
  return '';
}

function toArticle(entry: Record<string, unknown>, atom: boolean): NewsArticle | undefined {
  const links = asArray<Record<string, unknown> | string>(
    entry.link as Record<string, unknown> | string | undefined,
  );
  const link = atom
    ? links.map((item) => typeof item === 'string' ? item : String(item['@_href'] ?? ''))
        .find((url) => /^https?:\/\//.test(url))
    : text(entry.link);
  if (!link) return undefined;

  const title = stripHtml(text(entry.title)) || link;
  const summary = text(entry.summary ?? entry.description);
  const content = text(entry.content ?? entry['content:encoded']);
  const fullText = summary || content;
  const publishedAt = text(entry.published ?? entry.updated ?? entry.pubDate);
  const authorNode = entry.author as Record<string, unknown> | undefined;
  const author = stripHtml(text(authorNode?.name ?? entry['dc:creator'] ?? entry.author));
  const media = (entry['media:content'] ?? entry['media:thumbnail']) as Record<string, unknown> | undefined;
  const imageUrl = String(media?.['@_url'] ?? '') || extractImage(fullText, content);

  return {
    id: text(entry.id ?? entry.guid) || link,
    title, link,
    description: stripHtml(fullText),
    content: content || fullText || undefined,
    imageUrl: imageUrl || undefined,
    author: author || undefined,
    publishedAt: publishedAt || undefined,
    publishedMillis: parseDate(publishedAt),
    readingTime: estimateReadingTime(fullText),
  };
}

export function parseFeed(xml: string): NewsArticle[] {
  const document = parser.parse(xml) as Record<string, unknown>;
  const feed = document.feed as Record<string, unknown> | undefined;
  const channel = (document.rss as Record<string, unknown> | undefined)?.channel as Record<string, unknown> | undefined;
  const entries = feed ? asArray(feed.entry) : asArray(channel?.item);
  const unique = new Map<string, NewsArticle>();
  for (const raw of entries) {
    if (!raw || typeof raw !== 'object') continue;
    const article = toArticle(raw as Record<string, unknown>, Boolean(feed));
    if (article) unique.set(article.id, article);
  }
  return [...unique.values()].sort((a, b) => (b.publishedMillis ?? 0) - (a.publishedMillis ?? 0));
}

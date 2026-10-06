import { NewsArticle } from '../../types';
import {
  estimateReadingTime,
  extractImage,
  extractVideoUrl,
  parseDate,
  sanitizeImageUrl,
  stripHtml,
} from '../../utils/content';
import { asArray, extractNodeText } from './parser';

export function normalizeRawEntry(
  entry: Record<string, unknown>,
  isAtom: boolean,
): NewsArticle | undefined {
  const links = asArray<Record<string, unknown> | string>(
    entry.link as Record<string, unknown> | string | undefined,
  );

  const link = isAtom
    ? links
        .map((item) => (typeof item === 'string' ? item : String(item['@_href'] ?? '')))
        .find((url) => /^https?:\/\//.test(url))
    : extractNodeText(entry.link);

  if (!link) return undefined;

  const title = stripHtml(extractNodeText(entry.title)) || link;
  const summary = extractNodeText(entry.summary ?? entry.description);
  const content = extractNodeText(entry.content ?? entry['content:encoded']);
  const fullText = summary || content;
  const publishedAt = extractNodeText(entry.published ?? entry.updated ?? entry.pubDate);
  const authorNode = entry.author as Record<string, unknown> | undefined;
  const author = stripHtml(extractNodeText(authorNode?.name ?? entry['dc:creator'] ?? entry.author));

  // Media image extraction
  const media = (entry['media:content'] ?? entry['media:thumbnail']) as Record<string, unknown> | undefined;
  const rawMedia = String(media?.['@_url'] ?? '');
  const imageUrl = sanitizeImageUrl(rawMedia) || extractImage(fullText, content);

  // Video extraction (enclosure, media:content, or embedded video in content/description)
  const enclosure = entry.enclosure as Record<string, unknown> | undefined;
  const enclosureType = String(enclosure?.['@_type'] ?? '');
  const enclosureUrl = String(enclosure?.['@_url'] ?? '');
  const isEnclosureVideo = enclosureType.startsWith('video/') ? enclosureUrl : undefined;

  const mediaContent = entry['media:content'] as Record<string, unknown> | undefined;
  const mediaMedium = String(mediaContent?.['@_medium'] ?? '');
  const mediaUrl = String(mediaContent?.['@_url'] ?? '');
  const isMediaVideo = mediaMedium === 'video' ? mediaUrl : undefined;

  const videoUrl = isEnclosureVideo || isMediaVideo || extractVideoUrl(fullText, content, summary);

  return {
    id: extractNodeText(entry.id ?? entry.guid) || link,
    title,
    link,
    description: stripHtml(fullText),
    content: content || fullText || undefined,
    imageUrl: imageUrl || undefined,
    videoUrl: videoUrl || undefined,
    author: author || undefined,
    publishedAt: publishedAt || undefined,
    publishedMillis: parseDate(publishedAt),
    readingTime: estimateReadingTime(fullText),
  };
}

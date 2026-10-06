import { NewsArticle } from '../../types';
import {
  estimateReadingTime,
  extractImage,
  extractImages,
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

  // Multi-image extraction (Media RSS, enclosures, and content HTML)
  const mediaNodes = [
    ...asArray<Record<string, unknown>>(entry['media:content'] as Record<string, unknown> | undefined),
    ...asArray<Record<string, unknown>>(entry['media:thumbnail'] as Record<string, unknown> | undefined),
    ...asArray<Record<string, unknown>>(entry.enclosure as Record<string, unknown> | undefined),
  ];

  const mediaImages: string[] = [];
  for (const node of mediaNodes) {
    const type = String(node?.['@_type'] ?? '');
    const medium = String(node?.['@_medium'] ?? '');
    const url = String(node?.['@_url'] ?? '');
    if ((type.startsWith('image/') || medium === 'image' || (!type && !medium && /\.(jpg|jpeg|png|webp|avif)/i.test(url))) && url) {
      const sanitized = sanitizeImageUrl(url);
      if (sanitized && !mediaImages.includes(sanitized)) {
        mediaImages.push(sanitized);
      }
    }
  }

  const contentImages = extractImages(fullText, content, summary);
  const combinedImages = Array.from(new Set([...mediaImages, ...contentImages]));
  const imageUrl = combinedImages[0] || undefined;
  const images = combinedImages.length > 0 ? combinedImages : undefined;

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
    imageUrl,
    images,
    videoUrl: videoUrl || undefined,
    author: author || undefined,
    publishedAt: publishedAt || undefined,
    publishedMillis: parseDate(publishedAt),
    readingTime: estimateReadingTime(fullText),
  };
}

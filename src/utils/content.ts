import he from 'he';

export function stripHtml(value?: string | null): string {
  if (!value) return '';
  return he.decode(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export function extractImage(...sources: Array<string | undefined>): string | undefined {
  for (const source of sources) {
    if (!source) continue;
    const match = source.match(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
    if (match?.[1] && /^https?:\/\/\S+$/i.test(match[1])) return he.decode(match[1]);
  }
  return undefined;
}

export function extractOgImage(html: string): string | undefined {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const name = tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (!['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image'].includes(name ?? '')) continue;
    const url = tag.match(/content\s*=\s*["']([^"']+)["']/i)?.[1];
    if (url && /^https?:\/\/\S+$/i.test(url)) return he.decode(url);
  }
  return undefined;
}

export function estimateReadingTime(text: string): number {
  const plain = stripHtml(text);
  if (!plain) return 1;
  const spacedWords = plain.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(Math.max(spacedWords, Math.floor(plain.length / 6)) / 200));
}

export function parseDate(raw?: string): number | undefined {
  if (!raw) return undefined;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function formatRelative(millis?: number): string {
  if (!millis) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - millis) / 60_000));
  if (minutes < 1) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  if (minutes < 1_440) return `${Math.floor(minutes / 60)} ชั่วโมงที่แล้ว`;
  if (minutes < 10_080) return `${Math.floor(minutes / 1_440)} วันที่แล้ว`;
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(millis));
}

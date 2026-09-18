import { PROXY_URL } from '../../config/constants';

export function resolveFeedUrl(feedUrl: string): string {
  if (!PROXY_URL) return feedUrl;
  const encoded = encodeURIComponent(feedUrl);
  if (PROXY_URL.includes('{url}')) return PROXY_URL.replace('{url}', encoded);
  return `${PROXY_URL}${PROXY_URL.includes('?') ? '&' : '?'}url=${encoded}`;
}

export async function fetchFeedXml(feedUrl: string, timeoutMs: number = 10000): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(resolveFeedUrl(feedUrl), {
      signal: controller.signal,
      headers: {
        Accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml',
        'User-Agent': 'Mozilla/5.0 (compatible; ITNewsApp/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

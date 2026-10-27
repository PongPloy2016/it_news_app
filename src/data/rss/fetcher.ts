import { PROXY_URL } from '../../config/constants';

export function resolveFeedUrl(feedUrl: string): string {
  let url = feedUrl.trim();
  // Normalize Ejan RSS URL: ejan.co/rss returns 403 on Cloudflare, but ejan.co/feed works directly
  if (/ejan\.co\/rss\/?$/i.test(url)) {
    url = url.replace(/ejan\.co\/rss\/?$/i, 'ejan.co/feed');
  }

  if (!PROXY_URL) return url;
  const encoded = encodeURIComponent(url);
  if (PROXY_URL.includes('{url}')) return PROXY_URL.replace('{url}', encoded);
  return `${PROXY_URL}${PROXY_URL.includes('?') ? '&' : '?'}url=${encoded}`;
}

export async function fetchFeedXml(feedUrl: string, timeoutMs: number = 7000): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(resolveFeedUrl(feedUrl), {
      signal: controller.signal,
      headers: {
        Accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml',
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
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

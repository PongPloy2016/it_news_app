import { Share } from 'react-native';
import { NewsArticle } from '../types';

export async function shareArticle(article: NewsArticle, sourceLabel?: string): Promise<void> {
  const parts: string[] = [];
  parts.push(`📰 ${article.title}`);
  if (sourceLabel || article.author) {
    parts.push(`📡 แหล่งข่าว: ${sourceLabel || article.author}`);
  }
  if (article.description) {
    const preview = article.description.slice(0, 140).trim();
    parts.push(`\n📝 ${preview}...`);
  }
  parts.push(`\n🔗 อ่านต่อได้ที่: ${article.link}`);

  const message = parts.join('\n');

  try {
    await Share.share({
      title: article.title,
      message,
      url: article.link,
    });
  } catch {
    // Share cancelled or dismissed gracefully
  }
}

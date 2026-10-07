import { supabase } from '../config/supabase';
import { NewsArticle } from '../types';
import { getDeviceId } from './deviceIdService';

export interface RemoteBookmarkRow {
  id?: string;
  device_id: string;
  article_id: string;
  title: string;
  link: string;
  description: string | null;
  content: string | null;
  image_url: string | null;
  author: string | null;
  source: string | null;
  category: string | null;
  published_millis: number | null;
  reading_time: number | null;
  images: string[] | null;
  created_at?: string;
  updated_at?: string;
}

function mapRowToArticle(row: RemoteBookmarkRow): NewsArticle {
  return {
    id: row.article_id,
    title: row.title,
    link: row.link,
    description: row.description || '',
    content: row.content || undefined,
    imageUrl: row.image_url || undefined,
    images: Array.isArray(row.images) && row.images.length > 0 ? row.images : undefined,
    author: row.author || undefined,
    publishedMillis: row.published_millis ? Number(row.published_millis) : undefined,
    readingTime: row.reading_time || 1,
  };
}

export const supabaseBookmarkService = {
  /**
   * Fetch all bookmarked articles from Supabase user_bookmarks table.
   * By default (pullAll = true), fetches all bookmarked articles in the table.
   */
  async fetchRemoteBookmarks(pullAll = true): Promise<{ success: boolean; articles: NewsArticle[]; error?: string }> {
    try {
      let query = supabase
        .from('user_bookmarks')
        .select('*')
        .order('created_at', { ascending: false });

      if (!pullAll) {
        const deviceId = await getDeviceId();
        query = query.eq('device_id', deviceId);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST205') {
          console.warn('[supabaseBookmarkService] Table public.user_bookmarks not found in Supabase yet.');
        } else {
          console.warn('[supabaseBookmarkService] Fetch error:', error.message);
        }
        return { success: false, articles: [], error: error.message };
      }

      const articles: NewsArticle[] = (data || []).map((row: RemoteBookmarkRow) => mapRowToArticle(row));
      console.log(`[supabaseBookmarkService] ✓ Fetched ${articles.length} bookmarks from Supabase (pullAll=${pullAll})`);
      return { success: true, articles };
    } catch (err: any) {
      console.warn('[supabaseBookmarkService] Unexpected fetch exception:', err?.message);
      return { success: false, articles: [], error: err?.message || 'Network error' };
    }
  },

  /**
   * Fetch bookmarks belonging to a specific device ID (e.g. for import/syncing from another device).
   */
  async fetchBookmarksByDeviceId(targetDeviceId: string): Promise<{ success: boolean; articles: NewsArticle[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_bookmarks')
        .select('*')
        .eq('device_id', targetDeviceId.trim())
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, articles: [], error: error.message };
      }

      const articles: NewsArticle[] = (data || []).map((row: RemoteBookmarkRow) => mapRowToArticle(row));
      return { success: true, articles };
    } catch (err: any) {
      return { success: false, articles: [], error: err?.message || 'Network error' };
    }
  },

  /**
   * Save / Upsert a single bookmarked article to Supabase user_bookmarks table.
   */
  async saveRemoteBookmark(article: NewsArticle): Promise<{ success: boolean; error?: string }> {
    try {
      const deviceId = await getDeviceId();
      const payload: RemoteBookmarkRow = {
        device_id: deviceId,
        article_id: article.id,
        title: article.title,
        link: article.link,
        description: article.description || null,
        content: article.content || null,
        image_url: article.imageUrl || null,
        author: article.author || null,
        source: null,
        category: null,
        published_millis: article.publishedMillis ?? null,
        reading_time: article.readingTime ?? 1,
        images: article.images && article.images.length > 0 ? article.images : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_bookmarks')
        .upsert(payload, { onConflict: 'device_id,article_id' });

      if (error) {
        console.warn('[supabaseBookmarkService] Save error:', error.message);
        return { success: false, error: error.message };
      }

      console.log(`[supabaseBookmarkService] ✓ Saved "${article.title.substring(0, 30)}..." to Supabase user_bookmarks`);
      return { success: true };
    } catch (err: any) {
      console.warn('[supabaseBookmarkService] Unexpected save exception:', err?.message);
      return { success: false, error: err?.message || 'Network error' };
    }
  },

  /**
   * Remove a single bookmark from Supabase by articleId.
   */
  async removeRemoteBookmark(articleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('article_id', articleId);

      if (error) {
        if (error.code !== 'PGRST205') {
          console.warn('[supabaseBookmarkService] Remove error:', error.message);
        }
        return { success: false, error: error.message };
      }

      console.log(`[supabaseBookmarkService] ✓ Removed bookmark ${articleId} from Supabase`);
      return { success: true };
    } catch (err: any) {
      console.warn('[supabaseBookmarkService] Unexpected remove exception:', err?.message);
      return { success: false, error: err?.message || 'Network error' };
    }
  },

  /**
   * Clear all bookmarks for this device from Supabase.
   */
  async clearRemoteBookmarks(): Promise<{ success: boolean; error?: string }> {
    try {
      const deviceId = await getDeviceId();
      const { error } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('device_id', deviceId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error' };
    }
  },
};

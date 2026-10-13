import { getAnalytics } from '@react-native-firebase/analytics';

export interface ArticleAnalyticsParams {
  articleId: string;
  title: string;
  category?: string;
  source?: string;
  url?: string;
}

/**
 * Service to manage Google Analytics for Firebase tracking.
 * Feeds real-time event stream in Firebase Console (Streamview & GA4 reports).
 */
export const analyticsService = {
  /**
   * Log app open event
   */
  async logAppOpen(): Promise<void> {
    try {
      await getAnalytics().logAppOpen();
    } catch (err) {
      console.warn('[Analytics] Failed to log app open:', err);
    }
  },

  /**
   * Log screen transitions
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      if (!screenName) return;
      await getAnalytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (err) {
      console.warn('[Analytics] Failed to log screen view:', err);
    }
  },

  /**
   * Log custom analytics event with parameters
   */
  async logEvent(name: string, params: Record<string, any> = {}): Promise<void> {
    try {
      // Firebase event names must contain only alphanumeric characters and underscores
      const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
      await getAnalytics().logEvent(sanitizedName, params);
    } catch (err) {
      console.warn(`[Analytics] Failed to log event "${name}":`, err);
    }
  },

  /**
   * Log article view event
   */
  async logArticleView(article: ArticleAnalyticsParams): Promise<void> {
    try {
      await getAnalytics().logSelectContent({
        content_type: 'article',
        item_id: article.articleId || 'unknown',
      });

      // Also send a descriptive custom event for deeper reporting
      await getAnalytics().logEvent('view_article', {
        article_id: article.articleId || 'unknown',
        article_title: (article.title || '').slice(0, 100),
        category: (article.category || 'general').slice(0, 50),
        source: (article.source || '').slice(0, 50),
      });
    } catch (err) {
      console.warn('[Analytics] Failed to log article view:', err);
    }
  },

  /**
   * Log category selection / visit
   */
  async logCategoryView(categoryKey: string, categoryTitle?: string): Promise<void> {
    try {
      await getAnalytics().logSelectContent({
        content_type: 'category',
        item_id: categoryKey,
      });

      await getAnalytics().logEvent('view_category', {
        category_key: categoryKey,
        category_title: categoryTitle || categoryKey,
      });
    } catch (err) {
      console.warn('[Analytics] Failed to log category view:', err);
    }
  },

  /**
   * Log search query
   */
  async logSearch(searchTerm: string): Promise<void> {
    try {
      if (!searchTerm.trim()) return;
      await getAnalytics().logSearch({
        search_term: searchTerm.trim(),
      });
    } catch (err) {
      console.warn('[Analytics] Failed to log search:', err);
    }
  },

  /**
   * Log article share
   */
  async logShare(articleId: string, title?: string, method = 'system_dialog'): Promise<void> {
    try {
      await getAnalytics().logShare({
        content_type: 'article',
        item_id: articleId,
        method,
      });
    } catch (err) {
      console.warn('[Analytics] Failed to log share:', err);
    }
  },

  /**
   * Log bookmark action
   */
  async logBookmarkToggle(articleId: string, title: string, bookmarked: boolean): Promise<void> {
    try {
      await getAnalytics().logEvent(bookmarked ? 'bookmark_add' : 'bookmark_remove', {
        article_id: articleId,
        article_title: (title || '').slice(0, 100),
      });
    } catch (err) {
      console.warn('[Analytics] Failed to log bookmark toggle:', err);
    }
  },

  /**
   * Set user identifier
   */
  async setUserId(userId: string | null): Promise<void> {
    try {
      await getAnalytics().setUserId(userId);
    } catch (err) {
      console.warn('[Analytics] Failed to set user ID:', err);
    }
  },

  /**
   * Set user property for audience segmentation
   */
  async setUserProperty(name: string, value: string | null): Promise<void> {
    try {
      await getAnalytics().setUserProperty(name, value);
    } catch (err) {
      console.warn(`[Analytics] Failed to set user property "${name}":`, err);
    }
  },
};

export default analyticsService;

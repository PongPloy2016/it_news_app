import { getAnalytics } from '@react-native-firebase/analytics';

export interface ArticleAnalyticsParams {
  articleId: string;
  title: string;
  category?: string;
  categoryId?: string;
  source?: string;
  url?: string;
}

let lastScreenViewName = '';
let lastScreenViewTime = 0;

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
   * Log screen transitions (Feeds "Views by Page title and screen name" in GA4 / Streamview)
   */
  async logScreenView(
    screenName: string,
    screenClass?: string,
    extraParams: Record<string, any> = {},
  ): Promise<void> {
    try {
      if (!screenName) return;

      const now = Date.now();
      // Debounce exact duplicate calls within 1 second to avoid duplicate counts
      if (lastScreenViewName === screenName && now - lastScreenViewTime < 1000) {
        return;
      }
      lastScreenViewName = screenName;
      lastScreenViewTime = now;

      const pageTitle = (extraParams.page_title || screenName).slice(0, 100);
      const cleanClass = (screenClass || screenName).slice(0, 100);
      const cleanName = screenName.slice(0, 100);

      await getAnalytics().logScreenView({
        screen_name: cleanName,
        screen_class: cleanClass,
        page_title: pageTitle,
        ...extraParams,
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
      // Firebase event names must contain only alphanumeric characters and underscores (max 40 chars)
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

      const categoryName = (article.category || 'general').slice(0, 50);
      const categoryId = (article.categoryId || 'general').slice(0, 50);

      // Send a descriptive custom event for deeper reporting
      await getAnalytics().logEvent('view_article', {
        article_id: article.articleId || 'unknown',
        article_title: (article.title || '').slice(0, 100),
        category: categoryName,
        category_id: categoryId,
        source: (article.source || '').slice(0, 50),
      });

      // Also log read count per category for instant visibility in Streamview Realtime
      if (article.categoryId && article.categoryId !== 'general') {
        const sanitizedCat = article.categoryId.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
        const readEventName = `read_${sanitizedCat}`.slice(0, 40);
        await getAnalytics().logEvent(readEventName, {
          article_id: article.articleId || 'unknown',
          category: categoryName,
        });
      }
    } catch (err) {
      console.warn('[Analytics] Failed to log article view:', err);
    }
  },

  /**
   * Log category selection / visit.
   * Feeds:
   * 1. Google standard `select_content` (content_type='category', item_id=categoryKey)
   * 2. Consolidated `view_category` (with category_id, category_name, source)
   * 3. Direct category event `category_<key>` so Realtime Overview / Streamview
   *    "Event count by Event name" shows individual category counts immediately!
   * 4. User property `last_category` for audience segmentation in Realtime.
   */
  async logCategoryView(
    categoryKey: string,
    categoryTitle?: string,
    source: string = 'general',
  ): Promise<void> {
    try {
      if (!categoryKey) return;
      const title = (categoryTitle || categoryKey).slice(0, 100);
      const cleanKey = categoryKey.slice(0, 50);
      const cleanSource = source.slice(0, 50);

      // 1. Firebase standard recommended select_content
      await getAnalytics().logSelectContent({
        content_type: 'category',
        item_id: cleanKey,
      });

      // 2. Consolidated event for GA4 Reports and Custom Dimensions
      await getAnalytics().logEvent('view_category', {
        category_id: cleanKey,
        category_key: cleanKey,
        category_name: title,
        category_title: title,
        source: cleanSource,
      });

      // 3. Direct event name per category (e.g., category_ai_innovation, category_mobile)
      // This is crucial for Streamview Realtime Overview where the primary dashboard
      // displays "Event count by Event name" directly without requiring drill-downs!
      const sanitizedKey = cleanKey.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      const directEventName = `category_${sanitizedKey}`.slice(0, 40);
      await getAnalytics().logEvent(directEventName, {
        category_id: cleanKey,
        category_title: title,
        source: cleanSource,
      });

      // 4. Update user property so Streamview "Users by User Property" card reflects latest category
      await getAnalytics().setUserProperty('last_category', cleanKey.slice(0, 36));
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

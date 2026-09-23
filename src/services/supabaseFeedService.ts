import {
  FeedGroup,
  FEED_GROUPS as LOCAL_FEED_GROUPS,
  FEED_SOURCES as LOCAL_FEED_SOURCES,
  createAggregateSource,
} from '../config/categories';
import { FeedSource } from '../config/feeds';
import { supabase } from '../config/supabase';
import { storage } from '../data/database';

export interface RemoteFeedGroup {
  id: string;
  key: string;
  label: string;
  color: string;
  order_index: number;
}

export interface RemoteFeedSource {
  id: string;
  key: string;
  label: string;
  url: string;
  homepage: string;
  type: 'rss' | 'atom' | 'html' | 'aggregate';
  group_key: string;
  order_index: number;
  is_active: boolean;
}

export interface FeedConfigurationResult {
  groups: FeedGroup[];
  sources: FeedSource[];
  isFromSupabase: boolean;
}

const CACHE_KEY_GROUPS = 'it_news.supabase_feed_groups';
const SUPABASE_TIMEOUT_MS = 5000;

function timeoutPromise<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMsg)), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function extractFeedSources(groups: FeedGroup[]): FeedSource[] {
  const seen = new Set<string>();
  const list: FeedSource[] = [];

  for (const group of groups) {
    for (const s of group.sources) {
      if (!seen.has(s.key)) {
        seen.add(s.key);
        list.push(s);
      }
    }
  }

  return list.length > 0 ? list : (LOCAL_FEED_SOURCES as FeedSource[]);
}

/**
 * Fetch feeds from Supabase if online; otherwise fall back to local categories.ts and feeds.ts
 */
export async function loadFeedConfiguration(): Promise<FeedConfigurationResult> {
  try {
    const fetchRemote = async (): Promise<FeedGroup[]> => {
      const { data: groups, error: groupErr } = await supabase
        .from('feed_groups')
        .select('*')
        .order('order_index', { ascending: true });

      if (groupErr || !groups || groups.length === 0) {
        throw new Error(groupErr?.message || 'Empty feed_groups returned from Supabase');
      }

      const { data: sources, error: sourceErr } = await supabase
        .from('feed_sources')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (sourceErr || !sources || sources.length === 0) {
        throw new Error(sourceErr?.message || 'Empty feed_sources returned from Supabase');
      }

      const parsedGroups: FeedGroup[] = groups.map((g: RemoteFeedGroup) => {
        const groupSources: FeedSource[] = sources
          .filter((s: RemoteFeedSource) => s.group_key === g.key)
          .map((s: RemoteFeedSource) => ({
            key: s.key,
            label: s.label,
            url: s.url,
            homepage: s.homepage,
            type: s.type,
          }));

        return {
          key: g.key,
          label: g.label,
          color: g.color || '#2F6FED',
          sources: [createAggregateSource(g.key, g.label), ...groupSources],
        };
      });

      return parsedGroups;
    };

    // Attempt online fetch from Supabase with timeout
    const remoteGroups = await timeoutPromise(
      fetchRemote(),
      SUPABASE_TIMEOUT_MS,
      'Supabase fetch timed out (offline or slow network)',
    );

    if (remoteGroups && remoteGroups.length > 0) {
      // Cache latest remote groups for subsequent offline runs
      await storage.set(CACHE_KEY_GROUPS, remoteGroups);
      return {
        groups: remoteGroups,
        sources: extractFeedSources(remoteGroups),
        isFromSupabase: true,
      };
    }
  } catch (error) {
    console.info('[SupabaseFeedService] Offline or connection error, using fallback:', (error as Error).message);
  }

  // Offline Fallback Step 1: Check previously cached remote groups
  try {
    const cached = await storage.get<FeedGroup[]>(CACHE_KEY_GROUPS);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return {
        groups: cached,
        sources: extractFeedSources(cached),
        isFromSupabase: true,
      };
    }
  } catch {
    // Ignore cache reading error
  }

  // Offline Fallback Step 2: Strict fallback to local categories.ts and feeds.ts
  return {
    groups: LOCAL_FEED_GROUPS,
    sources: LOCAL_FEED_SOURCES as FeedSource[],
    isFromSupabase: false,
  };
}

/**
 * Backward compatibility helpers
 */
export async function getFeedGroupsWithFallback(): Promise<FeedGroup[]> {
  const result = await loadFeedConfiguration();
  return result.groups;
}

export async function getFeedSourcesWithFallback(): Promise<FeedSource[]> {
  const result = await loadFeedConfiguration();
  return result.sources;
}

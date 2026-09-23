import {
  FeedGroup,
  FEED_GROUPS as LOCAL_FEED_GROUPS,
  FEED_SOURCES as LOCAL_FEED_SOURCES,
  createAggregateSource,
} from '../config/categories';
import { FeedSource } from '../config/feeds';
import { supabase } from '../config/supabase';

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

/**
 * Fetch dynamic feed groups from Supabase, falling back to local config on failure.
 */
export async function getFeedGroupsWithFallback(): Promise<FeedGroup[]> {
  try {
    const { data: groups, error: groupErr } = await supabase
      .from('feed_groups')
      .select('*')
      .order('order_index', { ascending: true });

    if (groupErr || !groups || groups.length === 0) {
      return LOCAL_FEED_GROUPS;
    }

    const { data: sources, error: sourceErr } = await supabase
      .from('feed_sources')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (sourceErr || !sources || sources.length === 0) {
      return LOCAL_FEED_GROUPS;
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
        sources: [
          createAggregateSource(g.key, g.label),
          ...groupSources,
        ],
      };
    });

    return parsedGroups.length > 0 ? parsedGroups : LOCAL_FEED_GROUPS;
  } catch (error) {
    console.warn('[Supabase] Failed to fetch remote feed groups, using local defaults:', error);
    return LOCAL_FEED_GROUPS;
  }
}

/**
 * Fetch all active feed sources from Supabase, falling back to local config on failure.
 */
export async function getFeedSourcesWithFallback(): Promise<FeedSource[]> {
  try {
    const groups = await getFeedGroupsWithFallback();
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

    return list.length > 0 ? list : (LOCAL_FEED_SOURCES as unknown as FeedSource[]);
  } catch {
    return LOCAL_FEED_SOURCES as unknown as FeedSource[];
  }
}

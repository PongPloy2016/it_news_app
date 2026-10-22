import React from 'react';
import { useLatestViewModel } from './useLatestViewModel';
import { AllCategoriesView } from './components/AllCategoriesView';
import { CategoryFeedView } from './components/CategoryFeedView';
import { HtmlFeedView } from './components/HtmlFeedView';

export function LatestScreen() {
  const vm = useLatestViewModel();

  // 1. HTML / WebView Feeds (e.g. Weather, Radar)
  if (vm.isHtmlFeed) {
    return <HtmlFeedView vm={vm} />;
  }

  // 2. Editorial Home View ("รวมทุกหมวด" - All Categories)
  if (vm.activeGroupKey === 'all') {
    return <AllCategoriesView vm={vm} />;
  }

  // 3. Individual Category Feed (Single Category with FlatList)
  return <CategoryFeedView vm={vm} />;
}

import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { AdBanner } from '../../../components/AdBanner';
import { CustomRefreshHeader } from '../../../components/CustomRefreshIndicator';
import { TopProgressBar, HomeLoadingProgressCard } from '../../../components/LoadingProgressBar';
import { HomeEditorialSkeleton } from '../../../components/SkeletonCard';
import { FlashDispatchTicker } from '../../../components/home/FlashDispatchTicker';
import { HeroShowcase } from '../../../components/home/HeroShowcase';
import { CategoryQuickNav } from '../../../components/home/CategoryQuickNav';
import { CategorySectionBlock } from '../../../components/home/CategorySectionBlock';
import { CategoryTabBar } from './CategoryTabBar';
import { LatestViewModel } from '../types';

interface AllCategoriesViewProps {
  vm: LatestViewModel;
}

export function AllCategoriesView({ vm }: AllCategoriesViewProps) {
  const {
    colors,
    isSectionsLoading,
    categorySections,
    loadProgress,
    loadingStageText,
    isRefreshing,
    homeScrollRef,
    tickerArticles,
    heroArticles,
    highlightArticles,
    feedGroups,
    totalAllArticlesCount,
    handleRefreshAll,
    handlePressArticle,
    handleViewAllCategory,
    handleSelectCategoryQuickNav,
    setCategoryLayout,
  } = vm;

  // Initial Skeleton Loading State
  if (isSectionsLoading && Object.keys(categorySections).length === 0) {
    return (
      <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
        <TopProgressBar progress={loadProgress} visible={true} color="#0EA5E9" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { paddingBottom: 24 }]}
        >
          <CategoryTabBar vm={vm} />
          <HomeLoadingProgressCard
            progress={loadProgress}
            statusText={loadingStageText}
            color="#0EA5E9"
          />
          <HomeEditorialSkeleton />
        </ScrollView>
        <AdBanner
          style={[
            styles.bottomAdBanner,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        />
      </View>
    );
  }

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
      <TopProgressBar progress={loadProgress} visible={isRefreshing} color="#0EA5E9" />
      <ScrollView
        ref={homeScrollRef}
        contentContainerStyle={[styles.list, { paddingBottom: 24 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void handleRefreshAll(true)}
            tintColor="#0EA5E9"
            colors={['#0EA5E9']}
          />
        }
      >
        <CategoryTabBar vm={vm} />

        {isRefreshing && (
          <HomeLoadingProgressCard
            progress={loadProgress}
            statusText={loadingStageText}
            color="#0EA5E9"
          />
        )}

        <CustomRefreshHeader
          visible={isRefreshing}
          label="กำลังอัปเดตข่าวทุกหมวดหมู่..."
          color="#0EA5E9"
        />

        {/* 1. Flash Dispatch Ticker (ข่าวด่วนหมุนเวียน) */}
        <FlashDispatchTicker
          articles={tickerArticles}
          onPressArticle={handlePressArticle}
        />

        {/* 2. Hero Showcase Slider + Trending Highlights */}
        <HeroShowcase
          heroArticles={heroArticles}
          highlightArticles={highlightArticles}
          onPressArticle={handlePressArticle}
        />

        {/* 3. Quick Category Jump Bar (แถบทางลัดหมวดหมู่) */}
        <CategoryQuickNav
          groups={feedGroups}
          totalArticlesCount={totalAllArticlesCount}
          onSelectCategory={handleSelectCategoryQuickNav}
        />

        {/* 4. Category Section Blocks (รวมทุกหมวดในหน้าเดียว) */}
        {feedGroups.map((group) => {
          const groupArticles = categorySections[group.key] || [];
          if (groupArticles.length === 0) return null;

          return (
            <View
              key={`cat-section-${group.key}`}
              onLayout={(e) => {
                const y = e.nativeEvent.layout.y;
                setCategoryLayout(group.key, y);
              }}
            >
              <CategorySectionBlock
                group={group}
                articles={groupArticles}
                onPressArticle={handlePressArticle}
                onViewAll={handleViewAllCategory}
              />
            </View>
          );
        })}
      </ScrollView>

      <AdBanner
        style={[
          styles.bottomAdBanner,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 96,
  },
  bottomAdBanner: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 2,
  },
});

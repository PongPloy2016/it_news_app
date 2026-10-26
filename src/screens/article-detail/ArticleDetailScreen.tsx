import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Platform, StyleSheet, View } from 'react-native';
import { ArticleDetailItem } from '../../components/ArticleDetailItem';
import { ImageViewerModal } from '../../components/ImageViewerModal';
import { ScreenState } from '../../components/ScreenState';
import { RootStackParamList } from '../../types';
import { ArticleToast } from './components/ArticleToast';
import { FloatingSlideBar } from './components/FloatingSlideBar';
import { useArticleDetailViewModel } from './useArticleDetailViewModel';

type Props = NativeStackScreenProps<RootStackParamList, 'Article'>;

export function ArticleDetailScreen({ route, navigation }: Props) {
  const vm = useArticleDetailViewModel({ route, navigation });

  if (!vm.initialArticle) {
    return (
      <ScreenState
        icon="newspaper-remove"
        title="ไม่พบข่าวนี้"
        subtitle="ข่าวอาจถูกลบออกจากแคชแล้ว ลองกลับไปหน้ารายการและเปิดใหม่อีกครั้ง"
      />
    );
  }

  return (
    <View style={[styles.rootContainer, { backgroundColor: vm.colors.background }]}>
      {/* 1. Native Horizontal Pager FlatList (Smooth 120fps Real-Time Finger Sliding) */}
      <FlatList
        ref={vm.flatListRef}
        data={vm.resolvedArticleList}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        getItemLayout={(_, index) => ({
          length: vm.screenWidth,
          offset: vm.screenWidth * index,
          index,
        })}
        initialScrollIndex={
          vm.initialIndex >= 0 && vm.initialIndex < vm.resolvedArticleList.length
            ? vm.initialIndex
            : 0
        }
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            vm.flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
          }, 40);
        }}
        onMomentumScrollEnd={vm.onMomentumScrollEnd}
        windowSize={3}
        maxToRenderPerBatch={1}
        initialNumToRender={Math.max(vm.initialIndex + 1, 2)}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={({ item, index }) => (
          <View style={{ width: vm.screenWidth, height: '100%' }}>
            <ArticleDetailItem
              article={item}
              isActive={index === vm.currentIndex}
              navigation={vm.navigation}
              insets={vm.insets}
              screenWidth={vm.screenWidth}
              screenHeight={vm.screenHeight}
              heroHeight={vm.heroHeight}
              articleCategory={vm.articleCategory}
              fontScaleMultiplier={vm.fontScaleMultiplier}
              setFontScaleMultiplier={vm.setFontScaleMultiplier}
              onOpenViewer={(images, idx) => {
                vm.setViewerImages(images);
                vm.setViewerInitialIndex(idx);
                vm.setViewerVisible(true);
              }}
              onNextArticlePress={vm.handleNext}
              onSelectRelatedArticle={(targetArticle) => {
                const targetIdx = vm.resolvedArticleList.findIndex((a) => a.id === targetArticle.id);
                if (targetIdx >= 0) {
                  vm.hasUserNavigatedRef.current = true;
                  vm.flatListRef.current?.scrollToIndex({ index: targetIdx, animated: true });
                } else {
                  vm.navigation.push('Article', {
                    articleId: targetArticle.id,
                    articles: vm.resolvedArticleList,
                    categoryKey: vm.articleCategory.key,
                    categoryLabel: vm.articleCategory.label,
                  });
                }
              }}
              showToast={vm.showToast}
            />
          </View>
        )}
      />

      {/* 2. Floating Bottom Quick Slide Navigator */}
      <FloatingSlideBar vm={vm} />

      {/* 3. Full Screen Image Viewer Modal */}
      {vm.viewerImages.length > 0 && (
        <ImageViewerModal
          visible={vm.viewerVisible}
          images={vm.viewerImages}
          initialIndex={vm.viewerInitialIndex}
          onIndexChange={(newIdx) => vm.setViewerInitialIndex(newIdx)}
          onClose={() => vm.setViewerVisible(false)}
        />
      )}

      {/* 4. Animated Toast Feedback */}
      <ArticleToast
        message={vm.toastMessage}
        anim={vm.toastAnim}
        bottomOffset={vm.insets.bottom + 76}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
});

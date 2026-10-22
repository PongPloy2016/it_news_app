import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';
import { CategoryTabBar } from './CategoryTabBar';
import { SourceTabBar } from './SourceTabBar';
import { LatestViewModel } from '../types';

interface HtmlFeedViewProps {
  vm: LatestViewModel;
}

export function HtmlFeedView({ vm }: HtmlFeedViewProps) {
  const { colors, selectedFeed } = vm;

  return (
    <View style={[styles.htmlScreen, { backgroundColor: colors.background }]}>
      <View style={styles.tabContainer}>
        <CategoryTabBar vm={vm} />
        <SourceTabBar vm={vm} />
      </View>

      <View style={styles.webViewWrap}>
        <WebView
          source={{ uri: selectedFeed.url }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  htmlScreen: {
    flex: 1,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  webViewWrap: {
    flex: 1,
    minHeight: 320,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
});

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNews } from '../store/NewsContext';
import { normalizeVideoEmbedUrl } from '../utils/content';

interface Props {
  videoUrl: string;
  title?: string;
}

export function ArticleVideoPlayer({ videoUrl, title }: Props) {
  const { colors, isDark } = useNews();
  const embedUrl = normalizeVideoEmbedUrl(videoUrl);
  const isYouTube = /youtube\.com|youtu\.be/i.test(videoUrl);

  const handleOpenExternal = () => {
    let target = videoUrl;
    // If it's an embed url like https://www.youtube.com/embed/VIDEO_ID, open in normal youtube watch url
    const ytIdMatch = videoUrl.match(/embed\/([a-zA-Z0-9_-]+)/i);
    if (ytIdMatch?.[1]) {
      target = `https://www.youtube.com/watch?v=${ytIdMatch[1]}`;
    }
    Linking.openURL(target).catch(() => {});
  };

  const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
      * { box-sizing: border-box; }
      body, html {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background-color: #000000;
        overflow: hidden;
      }
      .wrapper {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      iframe, video {
        width: 100%;
        height: 100%;
        border: none;
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      ${
        embedUrl.endsWith('.mp4') || embedUrl.endsWith('.webm')
          ? `<video src="${embedUrl}" controls playsinline></video>`
          : `<iframe src="${embedUrl}${embedUrl.includes('?') ? '&' : '?'}playsinline=1&rel=0&modestbranding=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
      }
    </div>
  </body>
</html>
`;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
          borderColor: colors.border,
        },
      ]}
    >
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isYouTube ? '#FF0000' : colors.primary },
            ]}
          >
            <MaterialCommunityIcons
              name={isYouTube ? 'youtube' : 'play-circle-outline'}
              size={16}
              color="#FFFFFF"
            />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isYouTube ? 'วิดีโอ YouTube ประกอบข่าว' : 'วิดีโอประกอบข่าว'}
          </Text>
        </View>

        <Pressable
          hitSlop={8}
          onPress={handleOpenExternal}
          style={[styles.openBtn, { backgroundColor: isDark ? '#1E293B' : '#EDF2F7' }]}
        >
          <Text style={[styles.openBtnText, { color: isYouTube ? '#EF4444' : colors.primary }]}>
            เปิดดูในแอป
          </Text>
          <MaterialCommunityIcons
            name="open-in-new"
            size={13}
            color={isYouTube ? '#EF4444' : colors.primary}
          />
        </Pressable>
      </View>

      {/* 16:9 WebView Video Player */}
      <View style={styles.playerWrapper}>
        <WebView
          source={{ html: htmlContent }}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          style={styles.webView}
          scrollEnabled={false}
          bounces={false}
        />
      </View>

      {title ? (
        <Text numberOfLines={1} style={[styles.videoCaption, { color: colors.muted }]}>
          ▶ {title}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 18,
    marginBottom: 20,
    overflow: 'hidden',
    padding: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: 999,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  headerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  openBtn: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
  },
  openBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  playerWrapper: {
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
  },
  webView: {
    backgroundColor: '#000000',
    flex: 1,
  },
  videoCaption: {
    fontSize: 11.5,
    marginTop: 8,
    paddingHorizontal: 2,
  },
});

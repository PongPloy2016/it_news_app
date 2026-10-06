import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { normalizeVideoEmbedUrl } from '../utils/content';

interface Props {
  videoUrl: string;
}

export function ArticleVideoPlayer({ videoUrl }: Props) {
  const embedUrl = normalizeVideoEmbedUrl(videoUrl);

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
  );
}

const styles = StyleSheet.create({
  playerWrapper: {
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    borderRadius: 14,
    marginVertical: 12,
    overflow: 'hidden',
    width: '100%',
  },
  webView: {
    backgroundColor: '#000000',
    flex: 1,
  },
});

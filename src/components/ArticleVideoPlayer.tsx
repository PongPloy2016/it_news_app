import { Linking, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { normalizeVideoEmbedUrl } from '../utils/content';

interface Props {
  videoUrl: string;
}

export function ArticleVideoPlayer({ videoUrl }: Props) {
  const embedUrl = normalizeVideoEmbedUrl(videoUrl);
  const isYouTube = /youtube(?:-nocookie)?\.com|youtu\.be/i.test(embedUrl);

  const finalSrc = isYouTube
    ? `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}playsinline=1&rel=0&modestbranding=1&enablejsapi=1`
    : embedUrl;

  const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        width: 100%;
        height: 100%;
        background-color: #000000;
        overflow: hidden;
      }
      .wrapper {
        position: relative;
        width: 100%;
        height: 100%;
      }
      iframe, video {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: 0;
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      ${
        embedUrl.endsWith('.mp4') || embedUrl.endsWith('.webm')
          ? `<video src="${embedUrl}" controls playsinline></video>`
          : `<iframe
              src="${finalSrc}"
              referrerpolicy="strict-origin-when-cross-origin"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen>
            </iframe>`
      }
    </div>
  </body>
</html>
`;

  return (
    <View style={styles.playerWrapper}>
      <WebView
        originWhitelist={['*']}
        source={{
          html: htmlContent,
          baseUrl: isYouTube ? 'https://www.youtube-nocookie.com' : undefined,
        }}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        userAgent="Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        style={styles.webView}
        scrollEnabled={false}
        bounces={false}
        onShouldStartLoadWithRequest={(request) => {
          if (
            request.url === 'about:blank' ||
            request.url.startsWith('data:') ||
            request.url.includes('youtube-nocookie.com') ||
            request.url.includes('youtube.com/embed') ||
            request.url.includes('googlevideo.com') ||
            request.url.includes('player.vimeo.com')
          ) {
            return true;
          }
          if (request.url.startsWith('http')) {
            Linking.openURL(request.url).catch(() => {});
            return false;
          }
          return true;
        }}
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

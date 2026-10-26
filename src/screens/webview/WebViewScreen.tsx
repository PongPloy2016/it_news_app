import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { RootStackParamList } from '../../types';
import { WebViewLoadingIndicator } from './components/WebViewLoadingIndicator';
import { useWebViewModel } from './useWebViewModel';

type Props = NativeStackScreenProps<RootStackParamList, 'WebView'>;

export function WebViewScreen({ route }: Props) {
  const vm = useWebViewModel({ route });

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: vm.url }}
        startInLoadingState
        renderLoading={() => <WebViewLoadingIndicator />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

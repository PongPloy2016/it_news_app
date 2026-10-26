import { RouteProp } from '@react-navigation/native';
import { useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { RootStackParamList } from '../../types';
import { WebViewModel } from './types';

interface UseWebViewModelProps {
  route: RouteProp<RootStackParamList, 'WebView'>;
}

export function useWebViewModel({ route }: UseWebViewModelProps): WebViewModel {
  const { url, title } = route.params;

  useEffect(() => {
    const pageTitle = title ? `เว็บต้นฉบับ: ${title.slice(0, 50)}` : 'เว็บต้นฉบับข่าว';
    void analyticsService.logScreenView('เว็บต้นฉบับข่าว', 'WebViewScreen', {
      page_title: pageTitle,
      url,
    });
  }, [title, url]);

  return {
    url,
    title,
  };
}

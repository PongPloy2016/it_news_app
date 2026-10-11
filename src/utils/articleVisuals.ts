import { NewsArticle } from '../types';
import { sanitizeImageUrl } from './content';

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

const THEME_POOLS = {
  gaming: [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80', // esports pc
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80', // retro gaming
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80', // console setup
    'https://images.unsplash.com/photo-1612287232258-7521c7849ff0?w=800&auto=format&fit=crop&q=80', // switch / portable
    'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=800&auto=format&fit=crop&q=80', // dualshock gamepad
  ],
  mobile: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80', // sleek phone
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80', // smartphone ui
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&auto=format&fit=crop&q=80', // mobile device
    'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80', // app screen
    'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=800&auto=format&fit=crop&q=80', // phone tablet
  ],
  security: [
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80', // cyber security
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80', // lock network
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80', // matrix code
    'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=800&auto=format&fit=crop&q=80', // digital shield
    'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&auto=format&fit=crop&q=80', // data security
  ],
  ai: [
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80', // neural network
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', // modern ai
    'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=80', // ai brain
    'https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=800&auto=format&fit=crop&q=80', // deep learning
  ],
  weather: [
    'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&auto=format&fit=crop&q=80', // blue sky clouds
    'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&auto=format&fit=crop&q=80', // rain droplets
    'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&auto=format&fit=crop&q=80', // storm lightning
    'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800&auto=format&fit=crop&q=80', // flood relief rain
  ],
  agriculture: [
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80', // green farm
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=80', // smart agriculture
    'https://images.unsplash.com/photo-1523348837708-842521106757?w=800&auto=format&fit=crop&q=80', // crops plant
    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&auto=format&fit=crop&q=80', // rice field
  ],
  crypto: [
    'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&auto=format&fit=crop&q=80', // bitcoin crypto
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=80', // web3 fintech
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80', // chip hardware
  ],
  generalTech: [
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80', // team work tech
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80', // global earth tech
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&auto=format&fit=crop&q=80', // coding laptop
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80', // source code
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80', // cpu board
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80', // developer desk
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&auto=format&fit=crop&q=80', // futuristic laptop
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80', // data streams
  ],
};

/**
 * Returns a high-quality, topic-relevant, deterministic and unique image for an article.
 * If the article has its own valid imageUrl, that is returned.
 * If not, selects a distinct thematic image so no two cards look identical.
 */
export function getDiverseArticleImage(
  article: NewsArticle,
  fallbackCategoryKey?: string
): string {
  const sanitized = sanitizeImageUrl(article.imageUrl);
  if (sanitized) return sanitized;

  const textToScan = `${article.title} ${article.description || ''} ${article.author || ''}`.toLowerCase();
  const hash = Math.abs(hashString(article.id || article.title));

  let pool = THEME_POOLS.generalTech;

  if (
    /เกม|game|vita|ps5|playstation|switch|nintendo|steam|xbox|esport|rpg|gamer/i.test(textToScan) ||
    fallbackCategoryKey === 'computer-games'
  ) {
    pool = THEME_POOLS.gaming;
  } else if (
    /มือถือ|phone|oneui|samsung|apple|iphone|ipad|android|xiaomi|oppo|vivo|gadget|smart/i.test(textToScan) ||
    fallbackCategoryKey === 'mobile'
  ) {
    pool = THEME_POOLS.mobile;
  } else if (
    /ไซเบอร์|cyber|แฮก|hack|เจาะระบบ|ความปลอดภัย|security|มัลแวร์|รั่วไหล|call center/i.test(textToScan) ||
    fallbackCategoryKey === 'cybersecurity'
  ) {
    pool = THEME_POOLS.security;
  } else if (
    /ai|gpt|chatgpt|intelligence|โมเดล|หุ่นยนต์|robot|ปัญญาประดิษฐ์/i.test(textToScan) ||
    fallbackCategoryKey === 'ai-innovation'
  ) {
    pool = THEME_POOLS.ai;
  } else if (
    /ฝน|น้ำท่วม|พายุ|อากาศ|pm2\.5|tmd|อุตุนิยมวิทยา|ภัยพิบัติ|สภาพอากาศ/i.test(textToScan) ||
    fallbackCategoryKey === 'weather-forecast'
  ) {
    pool = THEME_POOLS.weather;
  } else if (
    /เกษตร|ชาวนา|พืช|ปศุสัตว์|ข้าว|สวน|เพาะปลูก/i.test(textToScan) ||
    fallbackCategoryKey === 'agriculture'
  ) {
    pool = THEME_POOLS.agriculture;
  } else if (
    /บิตคอยน์|bitcoin|crypto|คริปโท|blockchain|เหรียญ|fintech|การเงิน/i.test(textToScan) ||
    fallbackCategoryKey === 'fintech-crypto'
  ) {
    pool = THEME_POOLS.crypto;
  } else if (fallbackCategoryKey) {
    switch (fallbackCategoryKey) {
      case 'mobile':
        pool = THEME_POOLS.mobile;
        break;
      case 'computer-games':
        pool = THEME_POOLS.gaming;
        break;
      case 'cybersecurity':
        pool = THEME_POOLS.security;
        break;
      case 'weather-forecast':
        pool = THEME_POOLS.weather;
        break;
      case 'agriculture':
        pool = THEME_POOLS.agriculture;
        break;
      default:
        pool = THEME_POOLS.generalTech;
    }
  }

  const index = hash % pool.length;
  return pool[index];
}

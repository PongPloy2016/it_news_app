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
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=75', // esports pc
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=75', // retro gaming
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=75', // console setup
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=75', // gamepad
    'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=600&auto=format&fit=crop&q=75', // dualshock gamepad
  ],
  mobile: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=75', // sleek phone
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=75', // smartphone ui
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&auto=format&fit=crop&q=75', // mobile device
    'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=75', // app screen
    'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=600&auto=format&fit=crop&q=75', // phone tablet
  ],
  security: [
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=75', // cyber security
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=75', // lock network
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=75', // matrix code
    'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=600&auto=format&fit=crop&q=75', // digital shield
    'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&auto=format&fit=crop&q=75', // data security
  ],
  ai: [
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop&q=75', // neural network
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=75', // modern ai
    'https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=600&auto=format&fit=crop&q=75', // deep learning
    'https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=600&auto=format&fit=crop&q=75', // generative ai
  ],
  ev: [
    'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=75', // electric car charging
    'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&auto=format&fit=crop&q=75', // modern vehicle dashboard
    'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600&auto=format&fit=crop&q=75', // ev tech
  ],
  weather: [
    'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=600&auto=format&fit=crop&q=75', // blue sky clouds
    'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&auto=format&fit=crop&q=75', // rain droplets
    'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=600&auto=format&fit=crop&q=75', // storm lightning
    'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=600&auto=format&fit=crop&q=75', // flood relief rain
  ],
  agriculture: [
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=75', // green farm
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&auto=format&fit=crop&q=75', // smart agriculture
    'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=600&auto=format&fit=crop&q=75', // greenhouse agriculture
    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=600&auto=format&fit=crop&q=75', // rice field
  ],
  crypto: [
    'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=600&auto=format&fit=crop&q=75', // bitcoin crypto
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&auto=format&fit=crop&q=75', // web3 fintech
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=75', // chip hardware
  ],
  developer: [
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=75', // developer desk
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=75', // source code
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&auto=format&fit=crop&q=75', // coding laptop
  ],
  science: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=75', // space earth
    'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=75', // science lab
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=75', // research flask
  ],
  generalTech: [
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=75', // team work tech
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&auto=format&fit=crop&q=75', // futuristic laptop
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=75', // data streams
  ],
};

/**
 * Returns a high-quality, topic-relevant, deterministic and unique image for an article.
 * If the article has its own valid imageUrl and attemptIndex === 0, that is returned.
 * If not, selects a distinct thematic image so cards look professional and varied.
 * If an image fails to load, attemptIndex > 0 will rotate to another image in the pool.
 */
export function getDiverseArticleImage(
  article: NewsArticle,
  fallbackCategoryKey?: string,
  attemptIndex: number = 0,
): string {
  if (attemptIndex === 0) {
    const sanitized = sanitizeImageUrl(article.imageUrl);
    if (sanitized) return sanitized;
  }

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
    /รถยนต์ไฟฟ้า|ev|tesla|byd|charger|แบตเตอรี่รถ/i.test(textToScan) ||
    fallbackCategoryKey === 'ev-vehicles'
  ) {
    pool = THEME_POOLS.ev;
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
  } else if (
    /โค้ด|เขียนโปรแกรม|developer|github|python|javascript|typescript|api|docker/i.test(textToScan) ||
    fallbackCategoryKey === 'developer'
  ) {
    pool = THEME_POOLS.developer;
  } else if (
    /อวกาศ|ดาราศาสตร์|นาซา|nasa|ดาว|ฟิสิกส์|วิทยาศาสตร์|science/i.test(textToScan) ||
    fallbackCategoryKey === 'science-space'
  ) {
    pool = THEME_POOLS.science;
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
      case 'ai-innovation':
        pool = THEME_POOLS.ai;
        break;
      case 'ev-vehicles':
        pool = THEME_POOLS.ev;
        break;
      case 'weather-forecast':
        pool = THEME_POOLS.weather;
        break;
      case 'agriculture':
        pool = THEME_POOLS.agriculture;
        break;
      case 'fintech-crypto':
        pool = THEME_POOLS.crypto;
        break;
      case 'developer':
        pool = THEME_POOLS.developer;
        break;
      case 'science-space':
        pool = THEME_POOLS.science;
        break;
      default:
        pool = THEME_POOLS.generalTech;
    }
  }

  const index = (hash + attemptIndex) % pool.length;
  return pool[index];
}

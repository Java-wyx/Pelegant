import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 导入语言资源
import enTranslation from './locales/en.json';
import zhTranslation from './locales/zh.json';
import frTranslation from './locales/fr.json';
import hiTranslation from './locales/hi.json';
import esTranslation from './locales/es.json';
import arTranslation from './locales/ar.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      zh: { translation: zhTranslation },
      fr: { translation: frTranslation },
      hi: { translation: hiTranslation },
      es: { translation: esTranslation },
      ar: { translation: arTranslation }
    },
    lng: 'en', // 默认语言
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

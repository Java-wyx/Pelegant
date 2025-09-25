import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'

// 约定：/public/locales/{lng}/translation.json
i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'zh',
    supportedLngs: ['en', 'zh'],
    debug: import.meta.env.DEV,
    interpolation: { escapeValue: false },
    backend: {
      // Vite 静态文件根路径
      loadPath: '/locales/{{lng}}/translation.json'
    },
    detection: {
      // 浏览器语言、本地存储、html lang
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  })

export default i18n

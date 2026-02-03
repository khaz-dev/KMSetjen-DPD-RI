import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import idTranslation from '../locales/id/translation.json';
import enTranslation from '../locales/en/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'id',  // Set default language to Indonesian
    fallbackLng: 'id',
    defaultNS: 'translation',
    ns: ['translation'],
    supportedLngs: ['id', 'en'],  // Only support these languages
    
    resources: {
      id: { translation: idTranslation },
      en: { translation: enTranslation }
    },

    interpolation: {
      escapeValue: false
    },

    detection: {
      order: ['localStorage', 'querystring'],  // Prioritize localStorage, ignore navigator
      caches: ['localStorage']
    }
  });

export default i18n;

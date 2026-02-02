import { useTranslation } from 'react-i18next';

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    document.documentElement.lang = lng;
  };

  return {
    language: i18n.language,
    changeLanguage,
    t,
    isIndonesian: i18n.language === 'id',
    isEnglish: i18n.language === 'en'
  };
};


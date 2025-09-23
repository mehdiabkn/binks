import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import fr from './locales/fr';
import en from './locales/en';

// Fonction pour détecter la langue du système
const getDeviceLanguage = () => {
  const { Platform, NativeModules } = require('react-native');
  
  let deviceLanguage = 'fr'; // Langue par défaut
  
  if (Platform.OS === 'ios') {
    deviceLanguage = NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
                    NativeModules.SettingsManager?.settings?.AppleLocale;
  } else if (Platform.OS === 'android') {
    deviceLanguage = NativeModules.I18nManager?.localeIdentifier;
  }
  
  // Extraire les 2 premières lettres (ex: 'en-US' -> 'en')
  if (deviceLanguage) {
    deviceLanguage = deviceLanguage.substring(0, 2);
  }
  
  // Vérifier si la langue est supportée
  const supportedLanguages = ['fr', 'en'];
  if (!supportedLanguages.includes(deviceLanguage)) {
    deviceLanguage = 'fr'; // Fallback vers le français
  }
  
  return deviceLanguage;
};

// Configuration de base de i18n
const i18nConfig = {
  compatibilityJSON: 'v3', // ✅ Important pour React Native
  lng: 'fr', // Langue par défaut temporaire
  fallbackLng: 'fr',
  
  // ✅ Ressources de traductions
  resources: {
    fr: { 
      translation: fr 
    },
    en: { 
      translation: en 
    },
  },
  
  // ✅ Configuration de l'interpolation
  interpolation: {
    escapeValue: false, // React s'occupe déjà de l'échappement
  },
  
  // ✅ Configuration du cache
  cache: {
    enabled: true,
  },
  
  // ✅ Configuration de la détection de langue
  detection: {
    // Ordre de détection : AsyncStorage > système > défaut
    order: ['asyncStorage', 'navigator', 'fallback'],
    
    // Configuration AsyncStorage
    caches: ['asyncStorage'],
    asyncStorage: AsyncStorage,
    asyncStorageKey: 'habitus_language',
    
    // Configuration pour le fallback
    checkWhitelist: true,
  },
  
  // ✅ Debug en développement
  debug: __DEV__,
  
  // ✅ Configuration React
  react: {
    useSuspense: false, // Important pour React Native
  },
};

// ✅ Fonction d'initialisation asynchrone
const initI18n = async () => {
  try {
    // Essayer de récupérer la langue sauvegardée
    const savedLanguage = await AsyncStorage.getItem('habitus_language');
    
    let initialLanguage = 'fr';
    
    if (savedLanguage && ['fr', 'en'].includes(savedLanguage)) {
      // Utiliser la langue sauvegardée
      initialLanguage = savedLanguage;
      console.log('🌍 Langue chargée depuis AsyncStorage:', savedLanguage);
    } else {
      // Détecter la langue du système
      const deviceLanguage = getDeviceLanguage();
      initialLanguage = deviceLanguage;
      
      // Sauvegarder la langue détectée
      await AsyncStorage.setItem('habitus_language', deviceLanguage);
      console.log('🌍 Langue détectée du système:', deviceLanguage);
    }
    
    // Mettre à jour la configuration avec la langue détectée
    i18nConfig.lng = initialLanguage;
    
    // Initialiser i18n
    await i18n
      .use(initReactI18next)
      .init(i18nConfig);
    
    console.log('✅ i18n initialisé avec succès en', initialLanguage);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de i18n:', error);
    
    // Fallback en cas d'erreur
    await i18n
      .use(initReactI18next)
      .init({
        ...i18nConfig,
        lng: 'fr'
      });
  }
};

// ✅ Fonction pour changer de langue
export const changeLanguage = async (languageCode) => {
  try {
    if (!['fr', 'en'].includes(languageCode)) {
      console.warn('⚠️ Langue non supportée:', languageCode);
      return false;
    }
    
    // Changer la langue dans i18n
    await i18n.changeLanguage(languageCode);
    
    // Sauvegarder dans AsyncStorage
    await AsyncStorage.setItem('habitus_language', languageCode);
    
    console.log('✅ Langue changée vers:', languageCode);
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors du changement de langue:', error);
    return false;
  }
};

// ✅ Fonction pour obtenir la langue actuelle
export const getCurrentLanguage = () => {
  return i18n.language || 'fr';
};

// ✅ Fonction pour obtenir les langues disponibles
export const getAvailableLanguages = () => {
  return [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];
};

// ✅ Initialiser i18n au chargement du module
initI18n();

export default i18n;
// FICHIER: ./services/ratingService.js

import { Platform, Linking, Alert } from 'react-native';
import Rate from 'react-native-rate';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  RATING_REQUESTED: '@habitus_rating_requested',
  RATING_GIVEN: '@habitus_rating_given',
  RATING_DECLINED: '@habitus_rating_declined',
  RATING_LAST_REQUEST: '@habitus_rating_last_request',
};

export class RatingService {

  // Configuration de l'app pour le rating
  static getAppConfig() {
    return {
      AppleAppID: "YOUR_APPLE_APP_ID", // 🔥 À remplacer par votre vrai App ID
      GooglePackageName: "com.yourcompany.habitus", // 🔥 À remplacer
      AmazonPackageName: "com.yourcompany.habitus",
      OtherAndroidURL: "http://www.randomappstore.com/app/47172391",
      preferredAndroidMarket: 'google',
      preferInApp: false, // true = popup in-app, false = redirige vers App Store
      openAppStoreIfInAppFails: true,
      fallbackPlatformURL: "https://apps.apple.com/app/YOUR_APP_ID", // 🔥 À remplacer
    };
  }

  // Vérifier si on peut demander un avis
  static async canRequestRating() {
    try {
      const hasRequested = await AsyncStorage.getItem(STORAGE_KEYS.RATING_REQUESTED);
      const hasGiven = await AsyncStorage.getItem(STORAGE_KEYS.RATING_GIVEN);
      const hasDeclined = await AsyncStorage.getItem(STORAGE_KEYS.RATING_DECLINED);
      
      // Si l'utilisateur a déjà donné un avis ou refusé, ne pas redemander
      if (hasGiven === 'true' || hasDeclined === 'true') {
        return {
          canRequest: false,
          reason: hasGiven === 'true' ? 'already_rated' : 'declined'
        };
      }

      return { canRequest: true };
    } catch (error) {
      console.error('Erreur vérification rating:', error);
      return { canRequest: true }; // En cas d'erreur, on permet la demande
    }
  }

  // Marquer qu'on a demandé un avis
  static async markRatingRequested() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RATING_REQUESTED, 'true');
      await AsyncStorage.setItem(STORAGE_KEYS.RATING_LAST_REQUEST, new Date().toISOString());
      console.log('📝 Demande d\'avis marquée');
    } catch (error) {
      console.error('Erreur marquage demande rating:', error);
    }
  }

  // Marquer qu'un avis a été donné
  static async markRatingGiven() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RATING_GIVEN, 'true');
      console.log('⭐ Avis donné marqué');
    } catch (error) {
      console.error('Erreur marquage avis donné:', error);
    }
  }

  // Marquer qu'un avis a été refusé
  static async markRatingDeclined() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RATING_DECLINED, 'true');
      console.log('❌ Avis refusé marqué');
    } catch (error) {
      console.error('Erreur marquage avis refusé:', error);
    }
  }

  // Ouvrir l'App Store pour noter (méthode principale)
  static async openAppStoreForRating() {
    try {
      console.log('🏪 Ouverture App Store pour notation...');
      
      const config = this.getAppConfig();
      
      await this.markRatingRequested();
      
      // Utiliser react-native-rate pour ouvrir l'App Store
      Rate.rate(config, (success, errorMessage) => {
        if (success) {
          console.log('✅ App Store ouvert avec succès');
          this.markRatingGiven();
        } else {
          console.error('❌ Erreur ouverture App Store:', errorMessage);
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur ouverture App Store:', error);
      return { success: false, error: error.message };
    }
  }

  // Méthode alternative pour ouvrir directement l'App Store (sans react-native-rate)
  static async openAppStoreDirectly() {
    try {
      const config = this.getAppConfig();
      let url;

      if (Platform.OS === 'ios') {
        // URL directe App Store iOS
        url = `https://apps.apple.com/app/id${config.AppleAppID}?action=write-review`;
      } else {
        // URL directe Play Store Android
        url = `market://details?id=${config.GooglePackageName}`;
      }

      console.log('🔗 Ouverture URL directe:', url);
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        await this.markRatingGiven();
        return { success: true };
      } else {
        throw new Error('Impossible d\'ouvrir l\'App Store');
      }
    } catch (error) {
      console.error('Erreur ouverture directe App Store:', error);
      return { success: false, error: error.message };
    }
  }

  // Afficher une alerte de demande d'avis (méthode simple)
  static async showRatingAlert() {
    try {
      const { canRequest, reason } = await this.canRequestRating();
      
      if (!canRequest) {
        console.log('🚫 Ne peut pas demander d\'avis:', reason);
        return { success: false, reason };
      }

      return new Promise((resolve) => {
        Alert.alert(
          "⭐ Vous aimez Habitus ?",
          "Votre avis nous aide énormément ! Une note de 5 étoiles fait toute la différence pour notre référencement. 🙏",
          [
            {
              text: "Plus tard",
              style: "cancel",
              onPress: () => {
                console.log('⏰ Avis reporté');
                resolve({ success: false, action: 'later' });
              }
            },
            {
              text: "Non merci",
              style: "destructive",
              onPress: async () => {
                await this.markRatingDeclined();
                console.log('❌ Avis refusé');
                resolve({ success: false, action: 'declined' });
              }
            },
            {
              text: "⭐ Noter 5 étoiles",
              onPress: async () => {
                console.log('⭐ Utilisateur accepte de noter');
                const result = await this.openAppStoreForRating();
                resolve({ success: true, action: 'accepted', result });
              }
            }
          ],
          { cancelable: false }
        );
      });
    } catch (error) {
      console.error('Erreur alert rating:', error);
      return { success: false, error: error.message };
    }
  }

  // Demander un avis avec délai (pour une meilleure UX)
  static async requestRatingWithDelay(delayMs = 1000) {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const result = await this.showRatingAlert();
        resolve(result);
      }, delayMs);
    });
  }

  // Récupérer les statistiques de rating
  static async getRatingStats() {
    try {
      const requested = await AsyncStorage.getItem(STORAGE_KEYS.RATING_REQUESTED);
      const given = await AsyncStorage.getItem(STORAGE_KEYS.RATING_GIVEN);
      const declined = await AsyncStorage.getItem(STORAGE_KEYS.RATING_DECLINED);
      const lastRequest = await AsyncStorage.getItem(STORAGE_KEYS.RATING_LAST_REQUEST);

      return {
        hasRequested: requested === 'true',
        hasGiven: given === 'true',
        hasDeclined: declined === 'true',
        lastRequestDate: lastRequest ? new Date(lastRequest) : null,
      };
    } catch (error) {
      console.error('Erreur récupération stats rating:', error);
      return {
        hasRequested: false,
        hasGiven: false,
        hasDeclined: false,
        lastRequestDate: null,
      };
    }
  }

  // Reset des données de rating (pour debug/tests)
  static async resetRatingData() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.RATING_REQUESTED,
        STORAGE_KEYS.RATING_GIVEN,
        STORAGE_KEYS.RATING_DECLINED,
        STORAGE_KEYS.RATING_LAST_REQUEST,
      ]);
      console.log('🔄 Données de rating réinitialisées');
      return { success: true };
    } catch (error) {
      console.error('Erreur reset rating:', error);
      return { success: false, error: error.message };
    }
  }
}
// services/fallbackStorageService.js

import AsyncStorage from '@react-native-async-storage/async-storage';

export class FallbackStorageService {
  static STORAGE_KEYS = {
    USER_PROFILE: '@habitus_user_profile',
    USER_SETTINGS: '@habitus_user_settings',
    USER_STATS: '@habitus_user_stats',
    SYNC_QUEUE: '@habitus_sync_queue'
  };

  /**
   * Sauvegarde les données utilisateur en AsyncStorage
   */
  static async saveUserProfile(userProfile) {
    try {
      console.log('💾 Sauvegarde userProfile en AsyncStorage...', userProfile);
      
      // Ajouter un ID local si pas de supabaseId
      const profileWithId = {
        ...userProfile,
        localId: userProfile.localId || `local_${Date.now()}`,
        supabaseId: userProfile.supabaseId || null,
        isLocal: !userProfile.supabaseId, // Flag pour savoir si c'est local
        lastSync: null,
        createdAt: userProfile.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.USER_PROFILE, 
        JSON.stringify(profileWithId)
      );

      console.log('✅ UserProfile sauvegardé en AsyncStorage');
      return { success: true, profile: profileWithId };

    } catch (error) {
      console.error('❌ Erreur sauvegarde AsyncStorage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupère le profil utilisateur depuis AsyncStorage
   */
  static async getUserProfile() {
    try {
      const profileData = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_PROFILE);
      
      if (!profileData) {
        console.log('ℹ️ Aucun profil trouvé en AsyncStorage');
        return { success: false, profile: null };
      }

      const profile = JSON.parse(profileData);
      console.log('✅ Profil récupéré depuis AsyncStorage:', profile);
      
      return { success: true, profile };

    } catch (error) {
      console.error('❌ Erreur lecture AsyncStorage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sauvegarde les paramètres utilisateur
   */
  static async saveUserSettings(settings) {
    try {
      const settingsWithMeta = {
        ...settings,
        updatedAt: new Date().toISOString(),
        isLocal: true
      };

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.USER_SETTINGS,
        JSON.stringify(settingsWithMeta)
      );

      console.log('✅ Paramètres sauvegardés en AsyncStorage');
      return { success: true };

    } catch (error) {
      console.error('❌ Erreur sauvegarde paramètres AsyncStorage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupère les paramètres utilisateur
   */
  static async getUserSettings() {
    try {
      const settingsData = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_SETTINGS);
      
      if (!settingsData) {
        // Retourner des paramètres par défaut
        const defaultSettings = {
          notifications: true,
          dailyReminder: true,
          weeklyReport: false,
          darkMode: true,
          hapticFeedback: true,
          analyticsTracking: true,
          autoBackup: false,
          isLocal: true,
          createdAt: new Date().toISOString()
        };

        await this.saveUserSettings(defaultSettings);
        return { success: true, settings: defaultSettings };
      }

      const settings = JSON.parse(settingsData);
      return { success: true, settings };

    } catch (error) {
      console.error('❌ Erreur lecture paramètres AsyncStorage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ajoute une action à la queue de synchronisation
   */
  static async addToSyncQueue(action) {
    try {
      const queueData = await AsyncStorage.getItem(this.STORAGE_KEYS.SYNC_QUEUE);
      let queue = queueData ? JSON.parse(queueData) : [];

      const actionWithMeta = {
        ...action,
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        retryCount: 0
      };

      queue.push(actionWithMeta);

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SYNC_QUEUE,
        JSON.stringify(queue)
      );

      console.log('📝 Action ajoutée à la queue de sync:', actionWithMeta);
      return { success: true, actionId: actionWithMeta.id };

    } catch (error) {
      console.error('❌ Erreur ajout queue sync:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Tente de synchroniser la queue avec Supabase
   */
  static async processSyncQueue() {
    try {
      const queueData = await AsyncStorage.getItem(this.STORAGE_KEYS.SYNC_QUEUE);
      if (!queueData) return { success: true, processed: 0 };

      const queue = JSON.parse(queueData);
      if (queue.length === 0) return { success: true, processed: 0 };

      console.log(`🔄 Traitement de ${queue.length} actions en queue...`);

      let processedCount = 0;
      const remainingQueue = [];

      for (const action of queue) {
        try {
          // Ici on pourra ajouter la logique de sync avec Supabase
          // Pour l'instant, on log juste
          console.log('🔄 Traitement action:', action);
          processedCount++;
        } catch (actionError) {
          console.error('❌ Erreur traitement action:', action, actionError);
          
          // Réessayer jusqu'à 3 fois
          if (action.retryCount < 3) {
            action.retryCount++;
            remainingQueue.push(action);
          } else {
            console.log('❌ Action abandonnée après 3 tentatives:', action);
          }
        }
      }

      // Mettre à jour la queue
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SYNC_QUEUE,
        JSON.stringify(remainingQueue)
      );

      console.log(`✅ ${processedCount} actions traitées, ${remainingQueue.length} en attente`);
      return { 
        success: true, 
        processed: processedCount, 
        remaining: remainingQueue.length 
      };

    } catch (error) {
      console.error('❌ Erreur traitement queue sync:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Nettoie toutes les données AsyncStorage (pour reset)
   */
  static async clearAllData() {
    try {
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.USER_PROFILE,
        this.STORAGE_KEYS.USER_SETTINGS,
        this.STORAGE_KEYS.USER_STATS,
        this.STORAGE_KEYS.SYNC_QUEUE
      ]);

      console.log('🧹 Toutes les données AsyncStorage nettoyées');
      return { success: true };

    } catch (error) {
      console.error('❌ Erreur nettoyage AsyncStorage:', error);
      return { success: false, error: error.message };
    }
  }
}
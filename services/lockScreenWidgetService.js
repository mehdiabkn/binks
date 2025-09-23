// services/lockScreenWidgetService.js

import { Platform, NativeModules, DeviceEventEmitter, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundTimer from 'react-native-background-timer';

// Clés de stockage pour les widgets
const WIDGET_STORAGE_KEYS = {
  MIT_PROGRESS: '@habitus_widget_mit_progress',
  MET_PROGRESS: '@habitus_widget_met_progress',
  DAILY_STATS: '@habitus_widget_daily_stats',
  LAST_UPDATE: '@habitus_widget_last_update'
};

export class LockScreenWidgetService {
  static isInitialized = false;
  static updateInterval = null;

  /**
   * Initialise le service de widgets
   */
  static async initialize() {
    try {
      console.log('🔧 Initialisation service widgets...');

      // Vérifier les permissions
      const hasPermissions = await this.requestWidgetPermissions();
      if (!hasPermissions) {
        console.log('❌ Permissions widgets non accordées');
        return { success: false, error: 'Permissions manquantes' };
      }

      // Écouter les changements d'état de l'app
      this.setupAppStateListener();

      // Démarrer les mises à jour automatiques
      await this.startPeriodicUpdates();

      // Mettre à jour immédiatement
      await this.updateAllWidgets();

      this.isInitialized = true;
      console.log('✅ Service widgets initialisé');

      return { success: true };

    } catch (error) {
      console.error('❌ Erreur initialisation widgets:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Demande les permissions pour les widgets
   */
  static async requestWidgetPermissions() {
    try {
      if (Platform.OS === 'ios') {
        // iOS: Vérifier si WidgetKit est disponible
        const { WidgetKit } = NativeModules;
        if (WidgetKit) {
          const result = await WidgetKit.requestPermissions();
          return result.granted;
        }
      } else if (Platform.OS === 'android') {
        // Android: Vérifier les permissions de widget
        const { AndroidWidgetModule } = NativeModules;
        if (AndroidWidgetModule) {
          const result = await AndroidWidgetModule.requestPermissions();
          return result.granted;
        }
      }

      // Fallback: simuler l'autorisation
      console.log('⚠️ Modules natifs non disponibles, simulation widgets');
      return true;

    } catch (error) {
      console.error('❌ Erreur permissions widgets:', error);
      return false;
    }
  }

  /**
   * Met à jour tous les widgets avec les dernières données
   */
  static async updateAllWidgets() {
    try {
      console.log('🔄 Mise à jour widgets...');

      // Récupérer les données MIT/MET du jour
      const dailyData = await this.getDailyProgress();
      
      // Préparer les données du widget
      const widgetData = {
        mitProgress: dailyData.mitProgress,
        metProgress: dailyData.metProgress,
        mitPercentage: Math.round(dailyData.mitProgress * 100),
        metPercentage: Math.round(dailyData.metProgress * 100),
        lastUpdate: new Date().toISOString(),
        displayText: this.formatDisplayText(dailyData)
      };

      // Sauvegarder les données pour les widgets
      await this.saveWidgetData(widgetData);

      // Envoyer aux widgets natifs
      await this.updateNativeWidgets(widgetData);

      console.log('✅ Widgets mis à jour:', widgetData);
      return { success: true, data: widgetData };

    } catch (error) {
      console.error('❌ Erreur mise à jour widgets:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupère les progrès MIT/MET du jour
   */
  static async getDailyProgress() {
    try {
      // Récupérer les tâches du jour depuis AsyncStorage
      const today = new Date().toISOString().split('T')[0];
      
      // Données MIT
      const mitDataRaw = await AsyncStorage.getItem(`@habitus_mits_${today}`);
      const mitData = mitDataRaw ? JSON.parse(mitDataRaw) : [];
      
      // Données MET  
      const metDataRaw = await AsyncStorage.getItem(`@habitus_mets_${today}`);
      const metData = metDataRaw ? JSON.parse(metDataRaw) : [];

      // Calculer les progrès
      const totalMits = mitData.length;
      const completedMits = mitData.filter(mit => mit.completed).length;
      const mitProgress = totalMits > 0 ? completedMits / totalMits : 0;

      const totalMets = metData.length;
      const completedMets = metData.filter(met => met.completed).length; 
      const metProgress = totalMets > 0 ? completedMets / totalMets : 0;

      return {
        mitProgress,
        metProgress,
        totalMits,
        completedMits,
        totalMets,
        completedMets,
        date: today
      };

    } catch (error) {
      console.error('❌ Erreur récupération progrès:', error);
      return {
        mitProgress: 0,
        metProgress: 0,
        totalMits: 0,
        completedMits: 0,
        totalMets: 0,
        completedMets: 0,
        date: new Date().toISOString().split('T')[0]
      };
    }
  }

  /**
   * Formate le texte d'affichage pour le widget
   */
  static formatDisplayText(dailyData) {
    const mitPercentage = Math.round(dailyData.mitProgress * 100);
    const metPercentage = Math.round(dailyData.metProgress * 100);

    // Format compact pour l'écran de verrouillage
    return {
      compact: `${mitPercentage}% MIT • ${metPercentage}% MET`,
      detailed: `MIT: ${dailyData.completedMits}/${dailyData.totalMits} (${mitPercentage}%)\nMET: ${dailyData.completedMets}/${dailyData.totalMets} (${metPercentage}%)`,
      motivational: this.getMotivationalMessage(mitPercentage, metPercentage)
    };
  }

  /**
   * Génère un message motivationnel basé sur les progrès
   */
  static getMotivationalMessage(mitPercentage, metPercentage) {
    const avgProgress = (mitPercentage + metPercentage) / 2;

    if (avgProgress >= 100) {
      return "🏆 Journée parfaite !";
    } else if (avgProgress >= 80) {
      return "🔥 Excellent travail !";
    } else if (avgProgress >= 60) {
      return "💪 Continue ainsi !";
    } else if (avgProgress >= 40) {
      return "⚡ Tu peux y arriver !";
    } else if (avgProgress >= 20) {
      return "🎯 Reste concentré !";
    } else {
      return "🌟 C'est parti !";
    }
  }

  /**
   * Sauvegarde les données pour les widgets
   */
  static async saveWidgetData(widgetData) {
    try {
      await AsyncStorage.multiSet([
        [WIDGET_STORAGE_KEYS.MIT_PROGRESS, JSON.stringify({
          progress: widgetData.mitProgress,
          percentage: widgetData.mitPercentage,
          lastUpdate: widgetData.lastUpdate
        })],
        [WIDGET_STORAGE_KEYS.MET_PROGRESS, JSON.stringify({
          progress: widgetData.metProgress,
          percentage: widgetData.metPercentage,
          lastUpdate: widgetData.lastUpdate
        })],
        [WIDGET_STORAGE_KEYS.DAILY_STATS, JSON.stringify(widgetData)],
        [WIDGET_STORAGE_KEYS.LAST_UPDATE, widgetData.lastUpdate]
      ]);

      console.log('💾 Données widget sauvegardées');

    } catch (error) {
      console.error('❌ Erreur sauvegarde widget:', error);
    }
  }

  /**
   * Met à jour les widgets natifs iOS/Android
   */
  static async updateNativeWidgets(widgetData) {
    try {
      if (Platform.OS === 'ios') {
        // iOS WidgetKit
        const { WidgetKit } = NativeModules;
        if (WidgetKit) {
          await WidgetKit.reloadAllTimelines();
          await WidgetKit.updateWidget('HabitusProgressWidget', widgetData);
        }
      } else if (Platform.OS === 'android') {
        // Android App Widgets
        const { AndroidWidgetModule } = NativeModules;
        if (AndroidWidgetModule) {
          await AndroidWidgetModule.updateWidget(widgetData);
        }
      }

      // Notification locale comme fallback
      await this.updateLocalNotificationWidget(widgetData);

    } catch (error) {
      console.error('❌ Erreur mise à jour widgets natifs:', error);
    }
  }

  /**
   * Met à jour une notification persistante comme widget de fallback
   */
  static async updateLocalNotificationWidget(widgetData) {
    try {
      // Import conditionnel pour éviter les erreurs
      const PushNotification = await import('react-native-push-notification').then(module => module.default).catch(() => null);
      
      if (PushNotification) {
        // Annuler la notification précédente
        PushNotification.cancelLocalNotifications({ id: 'habitus_progress' });

        // Créer une nouvelle notification persistante
        PushNotification.localNotification({
          id: 'habitus_progress',
          channelId: 'habitus-progress-channel',
          title: 'Habitus Progress',
          message: widgetData.displayText.compact,
          subText: widgetData.displayText.motivational,
          ongoing: true, // Notification persistante
          priority: 'min', // Priorité minimale pour ne pas déranger
          visibility: 'public', // Visible sur l'écran de verrouillage
          smallIcon: 'ic_notification',
          largeIcon: 'ic_launcher',
          actions: ['OPEN_APP'],
          invokeApp: false
        });

        console.log('📱 Notification widget mise à jour');
      }

    } catch (error) {
      console.error('❌ Erreur notification widget:', error);
    }
  }

  /**
   * Démarre les mises à jour périodiques
   */
  static async startPeriodicUpdates() {
    try {
      // Arrêter l'interval précédent s'il existe
      if (this.updateInterval) {
        BackgroundTimer.clearInterval(this.updateInterval);
      }

      // Mettre à jour toutes les 15 minutes
      this.updateInterval = BackgroundTimer.setInterval(async () => {
        console.log('🔄 Mise à jour automatique widgets...');
        await this.updateAllWidgets();
      }, 15 * 60 * 1000); // 15 minutes

      console.log('⏰ Mises à jour périodiques démarrées');

    } catch (error) {
      console.error('❌ Erreur mises à jour périodiques:', error);
    }
  }

  /**
   * Configure l'écoute des changements d'état de l'app
   */
  static setupAppStateListener() {
    AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App passe en arrière-plan, mettre à jour les widgets
        console.log('📱 App en arrière-plan, mise à jour widgets');
        await this.updateAllWidgets();
      }
    });
  }

  /**
   * Force une mise à jour immédiate (appelé depuis l'app)
   */
  static async forceUpdate() {
    console.log('🔄 Mise à jour forcée widgets...');
    return await this.updateAllWidgets();
  }

  /**
   * Arrête le service de widgets
   */
  static stop() {
    if (this.updateInterval) {
      BackgroundTimer.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isInitialized = false;
    console.log('🛑 Service widgets arrêté');
  }

  /**
   * Récupère les données actuelles du widget
   */
  static async getWidgetData() {
    try {
      const dailyStatsRaw = await AsyncStorage.getItem(WIDGET_STORAGE_KEYS.DAILY_STATS);
      return dailyStatsRaw ? JSON.parse(dailyStatsRaw) : null;
    } catch (error) {
      console.error('❌ Erreur récupération données widget:', error);
      return null;
    }
  }

  /**
   * Configure les widgets lors du premier lancement
   */
  static async setupInitialWidgets() {
    try {
      console.log('🏗️ Configuration initiale widgets...');
      
      // Créer les données initiales
      const initialData = {
        mitProgress: 0,
        metProgress: 0,
        mitPercentage: 0,
        metPercentage: 0,
        lastUpdate: new Date().toISOString(),
        displayText: {
          compact: '0% MIT • 0% MET',
          detailed: 'MIT: 0/0 (0%)\nMET: 0/0 (0%)',
          motivational: '🌟 C\'est parti !'
        }
      };

      await this.saveWidgetData(initialData);
      await this.updateNativeWidgets(initialData);

      console.log('✅ Widgets initiaux configurés');
      return { success: true };

    } catch (error) {
      console.error('❌ Erreur configuration initiale widgets:', error);
      return { success: false, error: error.message };
    }
  }
}
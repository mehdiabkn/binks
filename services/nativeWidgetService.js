// services/nativeWidgetService.js

import { NativeModules, Platform } from 'react-native';

const { RNWidgetBridge } = NativeModules;

export class NativeWidgetService {
  static isSupported = false;
  static hasCheckedSupport = false;

  /**
   * Vérifie si les widgets sont supportés sur cette plateforme
   */
  static async checkWidgetSupport() {
    if (this.hasCheckedSupport) {
      return this.isSupported;
    }

    try {
      if (!RNWidgetBridge) {
        console.log('❌ Module bridge widget non disponible');
        this.isSupported = false;
        this.hasCheckedSupport = true;
        return false;
      }

      if (Platform.OS === 'ios') {
        const result = await RNWidgetBridge.isWidgetSupported();
        this.isSupported = result.supported;
        console.log(`📱 Support widgets iOS: ${this.isSupported}`, result);
      } else if (Platform.OS === 'android') {
        // TODO: Implémenter pour Android
        this.isSupported = false;
        console.log('🤖 Widgets Android pas encore implémentés');
      } else {
        this.isSupported = false;
      }

      this.hasCheckedSupport = true;
      return this.isSupported;

    } catch (error) {
      console.error('❌ Erreur vérification support widgets:', error);
      this.isSupported = false;
      this.hasCheckedSupport = true;
      return false;
    }
  }

  /**
   * Met à jour les données du widget
   */
  static async updateWidget(mitProgress, metProgress, additionalData = {}) {
    try {
      const isSupported = await this.checkWidgetSupport();
      if (!isSupported) {
        return { 
          success: false, 
          error: 'Widgets non supportés',
          platform: Platform.OS 
        };
      }

      // Générer le message motivationnel
      const motivationalMessage = this.generateMotivationalMessage(mitProgress, metProgress);

      const widgetData = {
        mitProgress: Math.round(mitProgress * 100),
        metProgress: Math.round(metProgress * 100),
        motivationalMessage,
        timestamp: new Date().toISOString(),
        ...additionalData
      };

      console.log('🔄 Mise à jour widget natif...', widgetData);

      const result = await RNWidgetBridge.updateWidgetData(widgetData);
      
      if (result.success) {
        console.log('✅ Widget natif mis à jour avec succès');
        return { success: true, data: widgetData };
      } else {
        throw new Error(result.message || 'Échec mise à jour widget');
      }

    } catch (error) {
      console.error('❌ Erreur mise à jour widget natif:', error);
      return { 
        success: false, 
        error: error.message,
        platform: Platform.OS 
      };
    }
  }

  /**
   * Génère un message motivationnel basé sur les progrès
   */
  static generateMotivationalMessage(mitProgress, metProgress) {
    const mitPercentage = Math.round(mitProgress * 100);
    const metPercentage = Math.round(metProgress * 100);
    const avgProgress = (mitPercentage + metPercentage) / 2;

    const messages = {
      perfect: ["🏆 Journée parfaite !", "💎 Performance excellente !", "⭐ Objectifs atteints !"],
      excellent: ["🔥 Excellent travail !", "💪 Tu assures !", "🚀 Continue ainsi !"],
      good: ["👍 Bon rythme !", "⚡ Tu progresses bien !", "🎯 Reste concentré !"],
      moderate: ["💫 Tu peux y arriver !", "🌟 Allez, encore un effort !", "⚔️ Donne tout !"],
      low: ["🌅 C'est un nouveau jour !", "🎯 Concentre-toi !", "💎 Chaque effort compte !"],
      start: ["🌟 C'est parti !", "🚀 Lance-toi !", "💪 Tu peux le faire !"]
    };

    let category;
    if (avgProgress >= 100) category = 'perfect';
    else if (avgProgress >= 80) category = 'excellent';
    else if (avgProgress >= 60) category = 'good';
    else if (avgProgress >= 40) category = 'moderate';
    else if (avgProgress >= 20) category = 'low';
    else category = 'start';

    const categoryMessages = messages[category];
    return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
  }

  /**
   * Demande à l'utilisateur d'ajouter le widget
   */
  static async promptUserToAddWidget() {
    try {
      const isSupported = await this.checkWidgetSupport();
      if (!isSupported) {
        return { 
          success: false, 
          error: 'Widgets non supportés sur cette plateforme' 
        };
      }

      console.log('📱 Ouverture des paramètres de widgets...');
      const result = await RNWidgetBridge.promptUserToAddWidget();
      
      return { 
        success: result.opened, 
        fallback: result.fallback || false 
      };

    } catch (error) {
      console.error('❌ Erreur ouverture paramètres widgets:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Récupère les données actuelles du widget
   */
  static async getWidgetData() {
    try {
      const isSupported = await this.checkWidgetSupport();
      if (!isSupported) {
        return { success: false, error: 'Widgets non supportés' };
      }

      const data = await RNWidgetBridge.getWidgetData();
      return { success: true, data };

    } catch (error) {
      console.error('❌ Erreur récupération données widget:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Force le rechargement de tous les widgets
   */
  static async reloadAllWidgets() {
    try {
      const isSupported = await this.checkWidgetSupport();
      if (!isSupported) {
        return { success: false, error: 'Widgets non supportés' };
      }

      console.log('🔄 Rechargement forcé des widgets...');
      const result = await RNWidgetBridge.reloadAllWidgets();
      return { success: result.success };

    } catch (error) {
      console.error('❌ Erreur rechargement widgets:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtient les informations de support des widgets
   */
  static async getWidgetInfo() {
    const isSupported = await this.checkWidgetSupport();
    
    return {
      supported: isSupported,
      platform: Platform.OS,
      requiresSetup: Platform.OS === 'ios' ? 'L\'utilisateur doit ajouter le widget manuellement' : 'Non implémenté',
      features: {
        lockScreen: Platform.OS === 'ios' && parseFloat(Platform.Version) >= 16,
        homeScreen: isSupported,
        autoUpdate: isSupported
      }
    };
  }

  /**
   * Planifie une mise à jour automatique basée sur les changements de données
   */
  static async scheduleAutoUpdate(mitProgress, metProgress) {
    // Mise à jour seulement si les données ont vraiment changé
    try {
      const currentData = await this.getWidgetData();
      
      if (currentData.success) {
        const currentMit = currentData.data.mitProgress || 0;
        const currentMet = currentData.data.metProgress || 0;
        const newMit = Math.round(mitProgress * 100);
        const newMet = Math.round(metProgress * 100);
        
        // Mise à jour seulement si différence significative (>= 5%)
        if (Math.abs(currentMit - newMit) >= 5 || Math.abs(currentMet - newMet) >= 5) {
          console.log('📊 Changement significatif détecté, mise à jour widget...');
          return await this.updateWidget(mitProgress, metProgress);
        } else {
          console.log('📊 Pas de changement significatif, widget non mis à jour');
          return { success: true, skipped: true };
        }
      } else {
        // Première mise à jour
        return await this.updateWidget(mitProgress, metProgress);
      }

    } catch (error) {
      console.error('❌ Erreur planification auto-update:', error);
      return { success: false, error: error.message };
    }
  }
}
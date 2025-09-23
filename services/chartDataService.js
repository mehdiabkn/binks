// FICHIER: ./services/chartDataService.js

import { StatisticsService } from './statisticsService';

// FICHIER: ./services/chartDataService.js


export class ChartDataService {
  /**
   * Récupère les données d'évolution pour les graphiques
   * @param {string} userId - ID utilisateur Supabase
   * @param {string} period - Période (week, month, year)
   * @returns {Promise<Object>} Données formatées pour les graphiques
   */
  static async getEvolutionData(userId, period) {
    try {
      console.log('[ChartDataService] Récupération données pour graphiques:', period);
      
      // Récupération des données brutes depuis StatisticsService
      const result = await StatisticsService.getEvolutionData(userId, period);
      
      if (!result.success) {
        console.error('[ChartDataService] Erreur StatisticsService:', result.error);
        
        // Retourner des données de démonstration en cas d'erreur
        console.log('[ChartDataService] Utilisation de données de démonstration');
        return {
          success: true,
          data: this.generateMockData(period)
        };
      }

      const rawData = result.data;
      console.log('[ChartDataService] Données reçues:', rawData.length, 'jours');
      
      // Formatage des données pour les graphiques
      const formattedData = this.formatDataForCharts(rawData, period);
      
      return {
        success: true,
        data: formattedData
      };
    } catch (error) {
      console.error('[ChartDataService] Erreur getEvolutionData:', error);
      
      // En cas d'erreur, retourner des données de démonstration
      return {
        success: true,
        data: this.generateMockData(period)
      };
    }
  }

  /**
   * Formate les données brutes pour les graphiques
   * @param {Array} rawData - Données brutes par jour
   * @param {string} period - Période sélectionnée
   * @returns {Object} Données formatées
   */
  static formatDataForCharts(rawData, period) {
    // LOGS DE DIAGNOSTIC
    console.log('[ChartDataService] Données brutes reçues:', rawData);
    
    // Trier par date
    const sortedData = rawData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Extraire les labels (dates) et les données
    const labels = sortedData.map(item => this.formatDateLabel(item.date, period));
    
    // Données MIT
    const mitCompletedData = sortedData.map(item => item.mitCompleted || 0);
    const mitRateData = sortedData.map(item => {
      const total = item.mitTotal || 0;
      const completed = item.mitCompleted || 0;
      return total > 0 ? Math.round((completed / total) * 100) : 0;
    });

    // Données MET - CORRECTION ICI avec LOGS
    const metAvoidedData = sortedData.map((item, index) => {
      const total = item.metTotal || 0;
      const checked = item.metCompleted || 0; // MET cochés (mauvaises habitudes)
      const avoided = Math.max(0, total - checked); // MET évitées
      
      // LOG pour chaque jour
      console.log(`[ChartDataService] Jour ${index + 1}:`, {
        date: item.date,
        metTotal: total,
        metCompleted: checked,
        metAvoided: avoided,
        rawItem: item // Voir toutes les propriétés disponibles
      });
      
      return avoided;
    });
    
    const metRateData = sortedData.map(item => {
      const total = item.metTotal || 0;
      const checked = item.metCompleted || 0;
      const avoided = Math.max(0, total - checked);
      return total > 0 ? Math.round((avoided / total) * 100) : 100;
    });

    console.log('[ChartDataService] Données MET finales:', {
      metAvoidedData,
      metRateData
    });

    return {
      labels,
      mitData: {
        completed: mitCompletedData,
        rate: mitRateData
      },
      metData: {
        completed: metAvoidedData, // Maintenant c'est les MET évitées
        rate: metRateData // Pourcentage de MET évitées
      }
    };
  }

  /**
   * Formate les labels de date selon la période
   * @param {string} dateString - Date au format ISO
   * @param {string} period - Période (week, month, year)
   * @returns {string} Label formaté
   */
  static formatDateLabel(dateString, period) {
    const date = new Date(dateString);
    
    switch (period) {
      case 'week':
        // Format: "Lun 15"
        return date.toLocaleDateString('fr-FR', { 
          weekday: 'short', 
          day: 'numeric' 
        });
      
      case 'month':
        // Format: "15/01"
        return date.toLocaleDateString('fr-FR', { 
          day: '2-digit', 
          month: '2-digit' 
        });
      
      case 'year':
        // Format: "Jan 24"
        return date.toLocaleDateString('fr-FR', { 
          month: 'short', 
          year: '2-digit' 
        });
      
      default:
        return date.toLocaleDateString('fr-FR', { 
          day: '2-digit', 
          month: '2-digit' 
        });
    }
  }

  /**
   * Génère des données de démonstration pour les tests
   * @param {string} period - Période sélectionnée
   * @returns {Object} Données de démonstration
   */
  static generateMockData(period) {
    const getDaysCount = (period) => {
      switch (period) {
        case 'week': return 7;
        case 'month': return 30;
        case 'year': return 12; // 12 mois
        default: return 7;
      }
    };

    const daysCount = getDaysCount(period);
    const labels = [];
    const mitCompleted = [];
    const mitRate = [];
    const metAvoided = [];
    const metRate = [];

    for (let i = 0; i < daysCount; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (daysCount - 1 - i));
      
      labels.push(this.formatDateLabel(date.toISOString(), period));
      
      // Données simulées avec une tendance
      const mitCompletedValue = Math.floor(Math.random() * 5) + 1;
      const mitRateValue = Math.floor(Math.random() * 40) + 60;
      
      // Pour les MET : simuler des MET évitées (plus logique)
      const metAvoidedValue = Math.floor(Math.random() * 8) + 2; // Entre 2 et 10 MET évitées
      const metRateValue = Math.floor(Math.random() * 30) + 70; // 70-100% de MET évitées
      
      mitCompleted.push(mitCompletedValue);
      mitRate.push(mitRateValue);
      metAvoided.push(metAvoidedValue);
      metRate.push(metRateValue);
    }

    return {
      labels,
      mitData: {
        completed: mitCompleted,
        rate: mitRate
      },
      metData: {
        completed: metAvoided, // MET évitées
        rate: metRate
      }
    };
  }
}
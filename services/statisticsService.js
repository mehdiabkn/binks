// FICHIER: ./services/statisticsService.js
// VERSION PROPRE ET COMPLÈTE

import { supabase } from './supabase';

export class StatisticsService {

  /**
   * MIT réalisées (depuis mit_completions)
   */
  static async getMITsRealisees(userId, startDate, endDate) {
    try {
      console.log('[StatisticsService] MIT réalisées - requête mit_completions');

      const { data: completions, error } = await supabase
        .from('mit_completions')
        .select(`
          id,
          date,
          mit_id,
          mits!inner(text, is_active)
        `)
        .eq('user_id', userId)
        .eq('mits.is_active', true)  // ← AJOUT DU FILTRE is_active
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      console.log('[StatisticsService] MIT réalisées trouvées:', completions?.length || 0);
      completions?.forEach((c, i) => {
        console.log(`[StatisticsService] ${i+1}. ${c.mits.text} le ${c.date}`);
      });

      return {
        success: true,
        count: completions?.length || 0,
        list: completions || []
      };

    } catch (error) {
      console.error('[StatisticsService] ERREUR MIT réalisées:', error);
      return { success: false, count: 0, list: [] };
    }
  }

  /**
   * MIT total attendues (calcul jour par jour)
   */
  static async getMITsTotal(userId, startDate, endDate) {
    try {
      console.log('[StatisticsService] MIT total - requête mits actives');

      const { data: mits, error } = await supabase
        .from('mits')
        .select('id, text, start_date, end_date, is_recurring')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      console.log('[StatisticsService] MIT actives trouvées:', mits?.length || 0);

      // Calcul jour par jour
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      console.log('[StatisticsService] Période:', startDate, '→', endDate, `(${totalDays} jours)`);

      let totalExpected = 0;

      for (let d = 0; d < totalDays; d++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + d);
        const dateStr = currentDate.toISOString().split('T')[0];

        const dailyMits = (mits || []).filter(mit => {
          const mitStart = new Date(mit.start_date);
          const mitEnd = mit.end_date ? new Date(mit.end_date) : null;
          
          // Pour MIT RÉCURRENTE : active entre start_date et end_date
          if (mit.is_recurring) {
            return mitStart <= currentDate && (!mitEnd || mitEnd >= currentDate);
          } 
          
          // Pour MIT PONCTUELLE : SEULEMENT le jour de start_date
          else {
            const mitStartStr = mitStart.toISOString().split('T')[0];
            const currentDateStr = currentDate.toISOString().split('T')[0];
            return mitStartStr === currentDateStr;
          }
        });

        totalExpected += dailyMits.length;
      }

      console.log('[StatisticsService] MIT total attendues:', totalExpected);

      return {
        success: true,
        count: totalExpected,
        list: mits || []
      };

    } catch (error) {
      console.error('[StatisticsService] ERREUR MIT total:', error);
      return { success: false, count: 0, list: [] };
    }
  }

  /**
   * MET cochées (depuis met_checks)
   */
  static async getMETsCochees(userId, startDate, endDate) {
    try {
      console.log('[StatisticsService] MET cochées - requête met_checks');

      const { data: checks, error } = await supabase
          .from('met_checks')
          .select(`
            id,
            date,
            met_id,
            mets!inner(text, is_active)
          `)
          .eq('user_id', userId)
          .eq('mets.is_active', true)  // ← AJOUT DU FILTRE is_active
          .gte('date', startDate)
          .lte('date', endDate);


      if (error) throw error;

      console.log('[StatisticsService] MET cochées trouvées:', checks?.length || 0);
      checks?.forEach((c, i) => {
        console.log(`[StatisticsService] ${i+1}. ${c.mets.text} le ${c.date}`);
      });

      return {
        success: true,
        count: checks?.length || 0,
        list: checks || []
      };

    } catch (error) {
      console.error('[StatisticsService] ERREUR MET cochées:', error);
      return { success: false, count: 0, list: [] };
    }
  }

  /**
   * MET total attendues (calcul jour par jour)
   */
  static async getMETsTotal(userId, startDate, endDate) {
    try {
      console.log('[StatisticsService] MET total - requête mets actives');

      const { data: mets, error } = await supabase
        .from('mets')
        .select('id, text, start_date, end_date, is_recurring')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      console.log('[StatisticsService] MET actives trouvées:', mets?.length || 0);

      // Calcul jour par jour (même logique que MIT)
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      let totalExpected = 0;

      for (let d = 0; d < totalDays; d++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + d);
        const dateStr = currentDate.toISOString().split('T')[0];

        const dailyMets = (mets || []).filter(met => {
          const metStart = new Date(met.start_date);
          const metEnd = met.end_date ? new Date(met.end_date) : null;
          
          // Pour MET RÉCURRENTE : active entre start_date et end_date
          if (met.is_recurring) {
            return metStart <= currentDate && (!metEnd || metEnd >= currentDate);
          } 
          
          // Pour MET PONCTUELLE : SEULEMENT le jour de start_date
          else {
            const metStartStr = metStart.toISOString().split('T')[0];
            const currentDateStr = currentDate.toISOString().split('T')[0];
            return metStartStr === currentDateStr;
          }
        });

        totalExpected += dailyMets.length;
      }

      console.log('[StatisticsService] MET total attendues:', totalExpected);

      return {
        success: true,
        count: totalExpected,
        list: mets || []
      };

    } catch (error) {
      console.error('[StatisticsService] ERREUR MET total:', error);
      return { success: false, count: 0, list: [] };
    }
  }

  /**
   * Récupère les données jour par jour pour la période donnée
   */
  static async getDailyEvolutionData(userId, startDateStr, endDateStr) {
    try {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      // Récupérer toutes les MIT actives
      const { data: mits, error: mitsError } = await supabase
        .from('mits')
        .select('id, text, start_date, end_date, is_recurring')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (mitsError) throw mitsError;

      // Récupérer toutes les MET actives
      const { data: mets, error: metsError } = await supabase
        .from('mets')
        .select('id, text, start_date, end_date, is_recurring')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (metsError) throw metsError;

      // Récupérer toutes les complétions MIT pour la période
      // PAR :
      const { data: mitCompletions, error: completionsError } = await supabase
        .from('mit_completions')
        .select(`
          date, 
          mit_id,
          mits!inner(is_active)
        `)
        .eq('user_id', userId)
        .eq('mits.is_active', true)  // ← FILTRE is_active
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      if (completionsError) throw completionsError;

      // Récupérer toutes les complétions MET pour la période
      const { data: metCompletions, error: metCompletionsError } = await supabase
        .from('met_checks')
        .select(`
          date, 
          met_id,
          mets!inner(is_active)
        `)
        .eq('user_id', userId)
        .eq('mets.is_active', true)  // ← FILTRE is_active
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      if (metCompletionsError) throw metCompletionsError;

      // Grouper les complétions MIT par date
      const mitCompletionsByDate = {};
      (mitCompletions || []).forEach(completion => {
        if (!mitCompletionsByDate[completion.date]) {
          mitCompletionsByDate[completion.date] = [];
        }
        mitCompletionsByDate[completion.date].push(completion.mit_id);
      });

      // Grouper les complétions MET par date
      const metCompletionsByDate = {};
      (metCompletions || []).forEach(completion => {
        if (!metCompletionsByDate[completion.date]) {
          metCompletionsByDate[completion.date] = [];
        }
        metCompletionsByDate[completion.date].push(completion.met_id);
      });

      // Calculer jour par jour
      const dailyData = [];

      for (let d = 0; d < totalDays; d++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + d);
        const dateStr = currentDate.toISOString().split('T')[0];

        // MIT attendues ce jour
        const dailyMits = (mits || []).filter(mit => {
          const mitStart = new Date(mit.start_date);
          const mitEnd = mit.end_date ? new Date(mit.end_date) : null;
          
          if (mit.is_recurring) {
            return mitStart <= currentDate && (!mitEnd || mitEnd >= currentDate);
          } else {
            const mitStartStr = mitStart.toISOString().split('T')[0];
            return mitStartStr === dateStr;
          }
        });

        // MET attendues ce jour
        const dailyMets = (mets || []).filter(met => {
          const metStart = new Date(met.start_date);
          const metEnd = met.end_date ? new Date(met.end_date) : null;
          
          if (met.is_recurring) {
            return metStart <= currentDate && (!metEnd || metEnd >= currentDate);
          } else {
            const metStartStr = metStart.toISOString().split('T')[0];
            return metStartStr === dateStr;
          }
        });

        // Complétions MIT ce jour
        const mitCompletedToday = mitCompletionsByDate[dateStr]?.length || 0;
        
        // Complétions MET ce jour
        const metCompletedToday = metCompletionsByDate[dateStr]?.length || 0;

        dailyData.push({
          date: dateStr,
          mitTotal: dailyMits.length,
          mitCompleted: mitCompletedToday,
          metTotal: dailyMets.length,
          metCompleted: metCompletedToday
        });
      }

      return dailyData;
    } catch (error) {
      console.error('[StatisticsService] Erreur getDailyEvolutionData:', error);
      throw error;
    }
  }

  /**
   * Récupère les données d'évolution jour par jour pour les graphiques
   */
  static async getEvolutionData(userId, period) {
    try {
      console.log('[StatisticsService] Récupération données évolution pour:', period);
      
      // Calculer les dates selon la période
      const today = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'week':
          const dayOfWeek = today.getDay();
          const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          startDate.setDate(today.getDate() - daysFromMonday);
          break;
        case 'month':
          startDate.setDate(today.getDate() - 30);
          break;
        case 'year':
          startDate.setDate(today.getDate() - 365);
          break;
        default:
          startDate.setDate(today.getDate() - 30);
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];

      // Récupérer les données brutes jour par jour
      const dailyData = await this.getDailyEvolutionData(userId, startDateStr, endDateStr);
      
      return {
        success: true,
        data: dailyData
      };
    } catch (error) {
      console.error('[StatisticsService] Erreur getEvolutionData:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calcule le streak actuel et le meilleur streak de l'utilisateur (100% MIT completion requis)
   */
  static async calculateStreaks(userId) {
    try {
      console.log('[StatisticsService] Calcul des streaks pour:', userId);
      
      // Récupérer les données des 90 derniers jours pour avoir assez d'historique
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() - 90);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];
      
      // Récupérer les données jour par jour
      const dailyData = await this.getDailyEvolutionData(userId, startDateStr, endDateStr);
      
      // Trier par date décroissante (du plus récent au plus ancien)
      const sortedData = dailyData.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;
      
      console.log('[STREAK] Analyse des derniers jours:');
      
      // Calculer le streak actuel (en partant d'aujourd'hui)
      for (let i = 0; i < sortedData.length; i++) {
        const dayData = sortedData[i];
        
        const mitCompleted = dayData.mitCompleted || 0;
        const mitTotal = dayData.mitTotal || 0;
        
        // NOUVELLE LOGIQUE: Un jour est "réussi" si TOUTES les MIT sont faites
        let daySuccess = false;
        
        if (mitTotal === 0) {
          // Pas de MIT ce jour = jour neutre (ne casse pas le streak mais ne le continue pas)
          daySuccess = null; // neutre
        } else {
          // Il y a des MIT: succès seulement si 100% faites
          daySuccess = mitCompleted === mitTotal;
        }
        
        console.log(`[STREAK] ${dayData.date}: ${mitCompleted}/${mitTotal} MIT`, {
          success: daySuccess,
          status: daySuccess === null ? 'NEUTRE' : (daySuccess ? 'RÉUSSI' : 'RATÉ')
        });
        
        // Gestion du streak actuel
        if (daySuccess === true) {
          // Jour réussi
          if (i === currentStreak) {
            currentStreak++; // Continuer le streak actuel
          }
          tempStreak++;
          
          if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
          }
        } else if (daySuccess === false) {
          // Jour raté (MIT non complétées)
          tempStreak = 0;
          
          if (i === currentStreak) {
            // Le streak actuel s'arrête ici
            break;
          }
        } else {
          // Jour neutre (pas de MIT) - ne fait rien au streak
          // Le streak continue à travers les jours neutres
          continue;
        }
      }
      
      console.log('[StatisticsService] Streaks calculés:', { 
        currentStreak, 
        bestStreak,
        interpretation: `${currentStreak} jours consécutifs avec 100% MIT complétées`
      });
      
      return { currentStreak, bestStreak };
      
    } catch (error) {
      console.error('[StatisticsService] Erreur calcul streaks:', error);
      return { currentStreak: 0, bestStreak: 0 };
    }
  }

  /**
   * Récupère toutes les statistiques complètes pour l'utilisateur (utilisé par SettingsScreen)
   */
  static async getCompleteStatistics(userId) {
    try {
      console.log('[StatisticsService] Récupération statistiques complètes pour:', userId);
      
      // Récupérer le profil utilisateur pour member_since
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('[StatisticsService] Erreur récupération profil:', profileError);
      }

      // Calculer les streaks
      const streaksData = await this.calculateStreaks(userId);
      
      // Récupérer les données du mois dernier pour les stats
      const lastMonthData = await this.getDebugData(userId, 'month');
      
      // Calculer le score moyen (basé sur le taux de réussite du mois)
      let averageScore = 0;
      if (lastMonthData?.success && lastMonthData?.data) {
        const mitsTotal = lastMonthData.data.mitsTotal?.count || 0;
        const mitsRealisees = lastMonthData.data.mitsRealisees?.count || 0;
        const metsTotal = lastMonthData.data.metsTotal?.count || 0;
        const metsCochees = lastMonthData.data.metsCochees?.count || 0;
        
        const totalObjectifs = mitsTotal + metsTotal;
        const totalReussis = mitsRealisees + (metsTotal - metsCochees); // MET évitées
        
        if (totalObjectifs > 0) {
          averageScore = Math.round((totalReussis / totalObjectifs) * 100);
        }
      }

      // Calculer les statistiques
      const statistics = {
        member_since: userProfile?.created_at || new Date().toISOString(),
        total_login_days: 0, // TODO: implémenter si vous trackez les connexions
        total_tasks_completed: (lastMonthData?.data?.mitsRealisees?.count || 0) + (lastMonthData?.data?.metsCochees?.count || 0),
        currentStreak: streaksData.currentStreak,
        best_streak: streaksData.bestStreak,
        average_daily_score: averageScore,
        favorite_category: 'Productivité', // TODO: déterminer la vraie catégorie favorite
        objectives: {
          total: (lastMonthData?.data?.mitsTotal?.count || 0) + (lastMonthData?.data?.metsTotal?.count || 0),
          completed: (lastMonthData?.data?.mitsRealisees?.count || 0) + Math.max(0, (lastMonthData?.data?.metsTotal?.count || 0) - (lastMonthData?.data?.metsCochees?.count || 0))
        },
        mitCompletionsLastMonth: lastMonthData?.data?.mitsRealisees?.count || 0,
        metChecksLastMonth: lastMonthData?.data?.metsCochees?.count || 0,
      };

      console.log('[StatisticsService] Statistiques calculées:', statistics);

      return {
        success: true,
        statistics: statistics
      };

    } catch (error) {
      console.error('[StatisticsService] Erreur getCompleteStatistics:', error);
      return {
        success: false,
        error: error.message,
        statistics: null
      };
    }
  }

  /**
   * Fonction principale pour debug et calculs globaux
   */
  static async getDebugData(userId, selectedPeriod) {
    try {
      console.log('[StatisticsService] ========== DÉBUT CALCUL ==========');
      console.log('[StatisticsService] Utilisateur:', userId);
      console.log('[StatisticsService] Période:', selectedPeriod);

      // Calculer les dates
      const today = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case 'week':
          const dayOfWeek = today.getDay();
          const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          startDate.setDate(today.getDate() - daysFromMonday);
          break;
        case 'month':
          startDate.setDate(today.getDate() - 30);
          break;
        case 'year':
          startDate.setDate(today.getDate() - 365);
          break;
        default:
          startDate.setDate(today.getDate() - 30);
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];

      console.log('[StatisticsService] Dates calculées:', startDateStr, '→', endDateStr);

      // Récupérer toutes les données
      const [mitsRealisees, mitsTotal, metsCochees, metsTotal] = await Promise.all([
        this.getMITsRealisees(userId, startDateStr, endDateStr),
        this.getMITsTotal(userId, startDateStr, endDateStr),
        this.getMETsCochees(userId, startDateStr, endDateStr),
        this.getMETsTotal(userId, startDateStr, endDateStr)
      ]);

      console.log('[StatisticsService] ========== RÉSULTATS ==========');
      console.log('[StatisticsService] MIT réalisées:', mitsRealisees.count);
      console.log('[StatisticsService] MIT attendues:', mitsTotal.count);
      console.log('[StatisticsService] MET cochées:', metsCochees.count);
      console.log('[StatisticsService] MET attendues:', metsTotal.count);
      
      const totalReussi = mitsRealisees.count + (metsTotal.count - metsCochees.count); // MIT faites + MET évitées
      const totalAttendu = mitsTotal.count + metsTotal.count;
      const tauxReussite = totalAttendu > 0 ? Math.round((totalReussi / totalAttendu) * 100) : 0;
      
      console.log('[StatisticsService] TOTAL:', totalReussi, '/', totalAttendu, '=', tauxReussite + '%');
      console.log('[StatisticsService] ========== FIN ==========');

      return {
        success: true,
        data: {
          periode: selectedPeriod,
          dateDebut: startDateStr,
          dateFin: endDateStr,
          mitsRealisees,
          mitsTotal,
          metsCochees,
          metsTotal
        }
      };

    } catch (error) {
      console.error('[StatisticsService] ERREUR GÉNÉRALE:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}
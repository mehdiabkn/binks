// FICHIER: ./services/dailyService.js

import { supabase } from './supabase';

export class DailyService {

  // ✅ CORRIGÉ: Récupérer ou créer le score du jour pour un utilisateur
  static async getTodayScore(userId) {
    try {
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      console.log('📊 Récupération score du jour...', { userId, today });
      
      // ✅ CORRECTION: Gestion d'erreur plus robuste
      let existingScore = null;
      
      try {
        // Essayer de récupérer le score existant
        const { data, error: fetchError } = await supabase
          .from('daily_scores')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today)
          .single();

        if (fetchError) {
          // PGRST116 = "No rows found" - c'est normal, on va créer
          if (fetchError.code !== 'PGRST116') {
            console.warn('⚠️ Erreur fetch score (non-critique):', fetchError);
            // Continuer pour essayer de créer au lieu de throw
          }
        } else {
          existingScore = data;
        }
      } catch (fetchErr) {
        console.warn('⚠️ Erreur fetch score (fallback):', fetchErr);
        // Continuer pour essayer de créer
      }

      if (existingScore) {
        console.log('✅ Score du jour trouvé:', existingScore);
        return {
          success: true,
          score: existingScore
        };
      }

      // ✅ CORRECTION: Création plus robuste avec retry
      console.log('🆕 Création nouveau score du jour...');
      
      try {
        const { data: newScore, error: createError } = await supabase
          .from('daily_scores')
          .insert([{
            user_id: userId,
            date: today,
            score: 0,
            mits_completed: 0,
            total_mits: 0,
            mets_avoided: 0,
            total_mets: 0,
            tasks_completed: 0,
            total_tasks: 0,
            objectives_updated: 0
          }])
          .select()
          .single();

        if (createError) {
          // Si l'erreur est "déjà existe", essayer de récupérer à nouveau
          if (createError.code === '23505') { // Duplicate key
            console.log('🔄 Score déjà créé par un autre processus, récupération...');
            
            const { data: retryData, error: retryError } = await supabase
              .from('daily_scores')
              .select('*')
              .eq('user_id', userId)
              .eq('date', today)
              .single();

            if (!retryError && retryData) {
              console.log('✅ Score récupéré après retry:', retryData);
              return {
                success: true,
                score: retryData
              };
            }
          }
          
          throw createError;
        }

        console.log('✅ Nouveau score créé:', newScore);
        return {
          success: true,
          score: newScore
        };

      } catch (createErr) {
        console.error('❌ Erreur création score:', createErr);
        
        // ✅ FALLBACK: Si échec de création, essayer une dernière récupération
        console.log('🔄 Tentative de récupération fallback...');
        
        try {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('daily_scores')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .single();

          if (!fallbackError && fallbackData) {
            console.log('✅ Score récupéré en fallback:', fallbackData);
            return {
              success: true,
              score: fallbackData
            };
          }
        } catch (fallbackErr) {
          console.error('❌ Fallback failed:', fallbackErr);
        }
        
        throw createErr;
      }

    } catch (error) {
      console.error('❌ Erreur récupération score du jour:', error);
      return {
        success: false,
        error: error.message,
        score: null
      };
    }
  }

  // ✅ CORRIGÉ: Mettre à jour le score du jour avec retry
  static async updateTodayScore(userId, updates) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      console.log('🔄 Mise à jour score du jour...', { userId, updates });

      // ✅ AMÉLIORATION: Essayer la mise à jour directement d'abord
      let updateResult;
      
      try {
        updateResult = await supabase
          .from('daily_scores')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('date', today)
          .select()
          .single();

        if (!updateResult.error) {
          console.log('✅ Score mis à jour directement:', updateResult.data);
          return {
            success: true,
            score: updateResult.data
          };
        }
      } catch (directUpdateErr) {
        console.log('⚠️ Mise à jour directe échouée, initialisation...');
      }

      // Si la mise à jour directe échoue, s'assurer que le score existe d'abord
      const { success: initSuccess, score: currentScore } = await this.getTodayScore(userId);
      if (!initSuccess || !currentScore) {
        throw new Error('Impossible d\'initialiser le score du jour');
      }

      // Réessayer la mise à jour
      const { data, error } = await supabase
        .from('daily_scores')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('date', today)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ Score mis à jour après init:', data);
      return {
        success: true,
        score: data
      };

    } catch (error) {
      console.error('❌ Erreur mise à jour score:', error);
      return {
        success: false,
        error: error.message,
        score: null
      };
    }
  }

  // ✅ CORRIGÉ: Ajouter des points au score avec meilleure gestion d'erreur
  static async addPoints(userId, points, source = 'manual') {
    try {
      console.log('➕ Ajout de points...', { userId, points, source });

      if (!userId) {
        throw new Error('userId requis pour ajouter des points');
      }

      if (typeof points !== 'number' || isNaN(points)) {
        throw new Error('Points doit être un nombre valide');
      }

      const { success, score: currentScore, error: scoreError } = await this.getTodayScore(userId);
      if (!success) {
        console.error('❌ Impossible de récupérer le score:', scoreError);
        throw new Error(`Impossible de récupérer le score actuel: ${scoreError}`);
      }

      if (!currentScore) {
        throw new Error('Score actuel non trouvé');
      }

      const newScore = (currentScore.score || 0) + points;

      console.log(`📊 Points: ${currentScore.score || 0} + ${points} = ${newScore}`);

      const result = await this.updateTodayScore(userId, {
        score: Math.max(0, newScore) // S'assurer que le score ne devient pas négatif
      });

      if (result.success) {
        console.log(`✅ +${points} points ajoutés (${source}). Score: ${currentScore.score || 0} → ${newScore}`);
      } else {
        throw new Error(`Erreur mise à jour score: ${result.error}`);
      }

      return result;

    } catch (error) {
      console.error('❌ Erreur ajout points:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ CORRIGÉ: Marquer une tâche comme terminée dans les stats quotidiennes
  static async completeTask(userId, taskCategory = 'general') {
    try {
      console.log('✅ Marquage tâche terminée...', { userId, taskCategory });

      const { success, score: currentScore } = await this.getTodayScore(userId);
      if (!success || !currentScore) {
        throw new Error('Impossible de récupérer le score actuel');
      }

      // Ajouter des points selon la catégorie
      const pointsMap = {
        work: 25,
        health: 30,
        personal: 20,
        learning: 35,
        general: 20
      };

      const points = pointsMap[taskCategory] || 20;
      const newScore = (currentScore.score || 0) + points;
      const newTasksCompleted = (currentScore.tasks_completed || 0) + 1;
      const newTotalTasks = Math.max(currentScore.total_tasks || 0, newTasksCompleted);

      const result = await this.updateTodayScore(userId, {
        score: newScore,
        tasks_completed: newTasksCompleted,
        total_tasks: newTotalTasks
      });

      if (result.success) {
        console.log(`🎯 Tâche ${taskCategory} terminée! +${points} points`);
      }

      return result;

    } catch (error) {
      console.error('❌ Erreur completion tâche:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ Récupérer ou créer l'achievement du jour
  static async getTodayAchievement(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      console.log('🏆 Récupération achievement du jour...', { userId, today });
      
      const { data, error } = await supabase
        .from('daily_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        success: true,
        achievement: data || null
      };

    } catch (error) {
      console.error('❌ Erreur récupération achievement:', error);
      return {
        success: false,
        error: error.message,
        achievement: null
      };
    }
  }

  // ✅ Sauvegarder l'achievement du jour
  static async saveTodayAchievement(userId, achievementText) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      console.log('💾 Sauvegarde achievement du jour...', { userId, achievementText });

      // Vérifier si un achievement existe déjà
      const { achievement: existing } = await this.getTodayAchievement(userId);

      let data, error;

      if (existing) {
        // Mettre à jour l'achievement existant
        ({ data, error } = await supabase
          .from('daily_achievements')
          .update({
            achievement_text: achievementText,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('date', today)
          .select()
          .single());
      } else {
        // Créer un nouvel achievement
        ({ data, error } = await supabase
          .from('daily_achievements')
          .insert([{
            user_id: userId,
            date: today,
            achievement_text: achievementText
          }])
          .select()
          .single());
      }

      if (error) {
        throw error;
      }

      console.log('✅ Achievement sauvegardé:', data);
      return {
        success: true,
        achievement: data
      };

    } catch (error) {
      console.error('❌ Erreur sauvegarde achievement:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ Récupérer les stats de la semaine
  static async getWeeklyStats(userId) {
    try {
      console.log('📅 Récupération stats hebdomadaires...', { userId });

      // Calculer les dates de début et fin de semaine
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Dimanche
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Samedi

      const startDate = startOfWeek.toISOString().split('T')[0];
      const endDate = endOfWeek.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_scores')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }

      // Calculer les totaux
      const weeklyStats = {
        totalScore: 0,
        totalTasks: 0,
        averageScore: 0,
        daysActive: 0,
        scores: data || []
      };

      if (data && data.length > 0) {
        weeklyStats.totalScore = data.reduce((sum, day) => sum + (day.score || 0), 0);
        weeklyStats.totalTasks = data.reduce((sum, day) => sum + (day.tasks_completed || 0), 0);
        weeklyStats.daysActive = data.filter(day => (day.score || 0) > 0).length;
        weeklyStats.averageScore = weeklyStats.totalScore / data.length;
      }

      console.log('✅ Stats hebdomadaires récupérées:', weeklyStats);
      return {
        success: true,
        stats: weeklyStats
      };

    } catch (error) {
      console.error('❌ Erreur stats hebdomadaires:', error);
      return {
        success: false,
        error: error.message,
        stats: null
      };
    }
  }

  // ✅ Récupérer l'historique des scores (pour graphiques)
  static async getScoreHistory(userId, days = 30) {
    try {
      console.log('📈 Récupération historique scores...', { userId, days });

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_scores')
        .select('date, score, tasks_completed, mits_completed, mets_avoided')
        .eq('user_id', userId)
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }

      console.log(`✅ Historique ${data?.length || 0} jours récupéré`);
      return {
        success: true,
        history: data || []
      };

    } catch (error) {
      console.error('❌ Erreur historique scores:', error);
      return {
        success: false,
        error: error.message,
        history: []
      };
    }
  }

  // ✅ NOUVEAU: Fonction de debug pour vérifier l'état des données
  static async debugUserData(userId) {
    try {
      console.log('🔍 Debug données utilisateur...', { userId });

      const today = new Date().toISOString().split('T')[0];

      // Vérifier l'utilisateur
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // Vérifier le score du jour
      const { data: score, error: scoreError } = await supabase
        .from('daily_scores')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      console.log('🔍 Debug résultats:', {
        user: user ? 'trouvé' : 'non trouvé',
        userError: userError?.message,
        score: score ? 'trouvé' : 'non trouvé',
        scoreError: scoreError?.message,
        today
      });

      return {
        user,
        score,
        today,
        userError,
        scoreError
      };

    } catch (error) {
      console.error('❌ Erreur debug:', error);
      return { error: error.message };
    }
  }
}
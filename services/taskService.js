// FICHIER: ./services/taskService.js

import { supabase } from './supabase';

export class TaskService {

  // ================================
  // GESTION DES TÂCHES CLASSIQUES
  // ================================

  // ✅ Récupérer les tâches du jour pour un utilisateur
  static async getTodayTasks(userId) {
    try {
      console.log('📋 Récupération tâches du jour...', { userId });
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'current')
        .order('priority', { ascending: false })  // high, medium, low
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      console.log(`✅ ${data?.length || 0} tâches trouvées`);
      return {
        success: true,
        tasks: data || []
      };

    } catch (error) {
      console.error('❌ Erreur récupération tâches:', error);
      return {
        success: false,
        error: error.message,
        tasks: []
      };
    }
  }

  // ✅ Récupérer les tâches terminées
  static async getCompletedTasks(userId, limit = 10) {
    try {
      console.log('✅ Récupération tâches terminées...', { userId, limit });
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      console.log(`✅ ${data?.length || 0} tâches terminées trouvées`);
      return {
        success: true,
        tasks: data || []
      };

    } catch (error) {
      console.error('❌ Erreur récupération tâches terminées:', error);
      return {
        success: false,
        error: error.message,
        tasks: []
      };
    }
  }

  // ✅ Créer une nouvelle tâche
  static async createTask(userId, taskData) {
    try {
      console.log('🆕 Création nouvelle tâche...', { userId, taskData });

      const newTask = {
        user_id: userId,
        title: taskData.title,
        description: taskData.description || null,
        category: taskData.category || 'personal',
        priority: taskData.priority || 'medium',
        progress: 0,
        estimated_time: taskData.estimatedTime || null,
        status: 'current'
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ Tâche créée:', data);
      return {
        success: true,
        task: data
      };

    } catch (error) {
      console.error('❌ Erreur création tâche:', error);
      return {
        success: false,
        error: error.message,
        task: null
      };
    }
  }

  // ✅ Mettre à jour le progrès d'une tâche
  static async updateTaskProgress(taskId, progress) {
    try {
      console.log('🔄 Mise à jour progrès tâche...', { taskId, progress });

      const updates = {
        progress: Math.max(0, Math.min(100, progress)),
        updated_at: new Date().toISOString()
      };

      // Si la tâche atteint 100%, la marquer comme terminée
      if (progress >= 100) {
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ Progrès mis à jour:', data);
      return {
        success: true,
        task: data
      };

    } catch (error) {
      console.error('❌ Erreur mise à jour progrès:', error);
      return {
        success: false,
        error: error.message,
        task: null
      };
    }
  }

  // ✅ Marquer une tâche comme terminée
  static async completeTask(taskId) {
    try {
      console.log('✅ Marquage tâche terminée...', { taskId });

      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          progress: 100,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ Tâche marquée terminée:', data);
      return {
        success: true,
        task: data
      };

    } catch (error) {
      console.error('❌ Erreur completion tâche:', error);
      return {
        success: false,
        error: error.message,
        task: null
      };
    }
  }

  // ✅ Restaurer une tâche terminée (la remettre en cours)
  static async restoreTask(taskId, newProgress = 75) {
    try {
      console.log('🔄 Restauration tâche...', { taskId, newProgress });

      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: 'current',
          progress: newProgress,
          completed_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ Tâche restaurée:', data);
      return {
        success: true,
        task: data
      };

    } catch (error) {
      console.error('❌ Erreur restauration tâche:', error);
      return {
        success: false,
        error: error.message,
        task: null
      };
    }
  }

  // ================================
  // GESTION DES MIT (Most Important Tasks)
  // ================================

  // ✅ Récupérer les MIT actives d'un utilisateur
  static async getActiveMITs(userId) {
    try {
      console.log('⚡ Récupération MIT actives...', { userId });
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('mits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .lte('start_date', today)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      console.log(`✅ ${data?.length || 0} MIT actives trouvées`);
      console.log('🔍 Exemple MIT avec is_recurring:', data?.[0]?.is_recurring);
      
      return {
        success: true,
        mits: data || []
      };

    } catch (error) {
      console.error('❌ Erreur récupération MIT:', error);
      return {
        success: false,
        error: error.message,
        mits: []
      };
    }
  }

  // ✅ CORRIGÉ: Créer une nouvelle MIT avec gestion is_recurring
  static async createMIT(userId, mitData) {
    try {
      console.log('⚡ Création nouvelle MIT...', { userId, mitData });
      console.log('🔧 isRecurring reçu:', mitData.isRecurring, typeof mitData.isRecurring);

      const newMIT = {
        user_id: userId,
        text: mitData.text,
        priority: mitData.priority || 'medium',
        estimated_time: mitData.estimatedTime || null,
        is_recurring: Boolean(mitData.isRecurring), // ✅ NOUVEAU: Conversion explicite en booléen
        start_date: mitData.startDate || new Date().toISOString().split('T')[0],
        end_date: mitData.endDate || null,
        is_active: true
      };

      console.log('📝 Données MIT à insérer:', newMIT);

      const { data, error } = await supabase
        .from('mits')
        .insert([newMIT])
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur Supabase createMIT:', error);
        throw error;
      }

      console.log('✅ MIT créée avec is_recurring:', data.is_recurring);
      return {
        success: true,
        mit: data
      };

    } catch (error) {
      console.error('❌ Erreur création MIT:', error);
      return {
        success: false,
        error: error.message,
        mit: null
      };
    }
  }

  // ✅ ANCIEN: Marquer une MIT comme terminée pour aujourd'hui (conservé pour compatibilité)
  static async completeMITToday(userId, mitId) {
    const today = new Date().toISOString().split('T')[0];
    return this.completeMITForDate(userId, mitId, today);
  }

  // ✅ NOUVEAU: Marquer une MIT comme terminée pour une date spécifique
  static async completeMITForDate(userId, mitId, targetDate) {
    try {
      console.log('✅ Marquage MIT terminée pour date...', { userId, mitId, targetDate });

      // Vérifier si déjà marquée comme terminée pour cette date
      const { data: existing } = await supabase
        .from('mit_completions')
        .select('id')
        .eq('user_id', userId)
        .eq('mit_id', mitId)
        .eq('date', targetDate)
        .single();

      if (existing) {
        console.log('⚠️ MIT déjà marquée terminée pour cette date');
        return {
          success: true,
          completion: existing,
          alreadyCompleted: true
        };
      }

      // Créer la completion pour la date spécifiée
      const { data, error } = await supabase
        .from('mit_completions')
        .insert([{
          user_id: userId,
          mit_id: mitId,
          date: targetDate,
          completed_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`✅ MIT marquée terminée pour ${targetDate}:`, data);
      return {
        success: true,
        completion: data,
        alreadyCompleted: false
      };

    } catch (error) {
      console.error('❌ Erreur completion MIT pour date:', error);
      return {
        success: false,
        error: error.message,
        completion: null
      };
    }
  }

  // ✅ NOUVEAU: Décocher une MIT pour une date spécifique
  static async uncompleteMITForDate(userId, mitId, targetDate) {
    try {
      console.log('↩️ Décocher MIT pour date...', { userId, mitId, targetDate });

      const { error } = await supabase
        .from('mit_completions')
        .delete()
        .eq('user_id', userId)
        .eq('mit_id', mitId)
        .eq('date', targetDate);

      if (error) {
        throw error;
      }

      console.log(`✅ MIT décochée pour ${targetDate}`);
      return {
        success: true
      };

    } catch (error) {
      console.error('❌ Erreur décocher MIT:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ Vérifier si une MIT est terminée aujourd'hui
  static async isMITCompletedToday(userId, mitId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('mit_completions')
        .select('id')
        .eq('user_id', userId)
        .eq('mit_id', mitId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        success: true,
        isCompleted: !!data
      };

    } catch (error) {
      console.error('❌ Erreur vérification MIT:', error);
      return {
        success: false,
        error: error.message,
        isCompleted: false
      };
    }
  }

  // ================================
  // GESTION DES MET (Most Emotional Tasks)
  // ================================

  // ✅ Récupérer les MET actives d'un utilisateur
  static async getActiveMETs(userId) {
    try {
      console.log('🚫 Récupération MET actives...', { userId });
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('mets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .lte('start_date', today)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      console.log(`✅ ${data?.length || 0} MET actives trouvées`);
      console.log('🔍 Exemple MET avec is_recurring:', data?.[0]?.is_recurring);
      
      return {
        success: true,
        mets: data || []
      };

    } catch (error) {
      console.error('❌ Erreur récupération MET:', error);
      return {
        success: false,
        error: error.message,
        mets: []
      };
    }
  }

  // ✅ CORRIGÉ: Créer une nouvelle MET avec gestion is_recurring
  static async createMET(userId, metData) {
    try {
      console.log('🚫 Création nouvelle MET...', { userId, metData });
      console.log('🔧 isRecurring reçu:', metData.isRecurring, typeof metData.isRecurring);

      const newMET = {
        user_id: userId,
        text: metData.text,
        is_recurring: Boolean(metData.isRecurring), // ✅ NOUVEAU: Conversion explicite en booléen
        start_date: metData.startDate || new Date().toISOString().split('T')[0],
        end_date: metData.endDate || null,
        is_active: true
      };

      console.log('📝 Données MET à insérer:', newMET);

      const { data, error } = await supabase
        .from('mets')
        .insert([newMET])
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur Supabase createMET:', error);
        throw error;
      }

      console.log('✅ MET créée avec is_recurring:', data.is_recurring);
      return {
        success: true,
        met: data
      };

    } catch (error) {
      console.error('❌ Erreur création MET:', error);
      return {
        success: false,
        error: error.message,
        met: null
      };
    }
  }

  // ✅ ANCIEN: Marquer une MET comme "faite" pour aujourd'hui (conservé pour compatibilité)
  static async checkMETToday(userId, metId) {
    const today = new Date().toISOString().split('T')[0];
    return this.checkMETForDate(userId, metId, today);
  }

  // ✅ NOUVEAU: Marquer une MET comme "faite" pour une date spécifique
  static async checkMETForDate(userId, metId, targetDate) {
    try {
      console.log('🚫 Marquage MET faite pour date...', { userId, metId, targetDate });

      // Vérifier si déjà marquée pour cette date
      const { data: existing } = await supabase
        .from('met_checks')
        .select('id')
        .eq('user_id', userId)
        .eq('met_id', metId)
        .eq('date', targetDate)
        .single();

      if (existing) {
        console.log('⚠️ MET déjà marquée pour cette date');
        return {
          success: true,
          check: existing,
          alreadyChecked: true
        };
      }

      // Créer le check pour la date spécifiée
      const { data, error } = await supabase
        .from('met_checks')
        .insert([{
          user_id: userId,
          met_id: metId,
          date: targetDate,
          checked_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`✅ MET marquée faite pour ${targetDate}:`, data);
      return {
        success: true,
        check: data,
        alreadyChecked: false
      };

    } catch (error) {
      console.error('❌ Erreur check MET pour date:', error);
      return {
        success: false,
        error: error.message,
        check: null
      };
    }
  }

  // ✅ NOUVEAU: Décocher une MET pour une date spécifique
  static async uncheckMETForDate(userId, metId, targetDate) {
    try {
      console.log('↩️ Décocher MET pour date...', { userId, metId, targetDate });

      const { error } = await supabase
        .from('met_checks')
        .delete()
        .eq('user_id', userId)
        .eq('met_id', metId)
        .eq('date', targetDate);

      if (error) {
        throw error;
      }

      console.log(`✅ MET décochée pour ${targetDate}`);
      return {
        success: true
      };

    } catch (error) {
      console.error('❌ Erreur décocher MET:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ Récupérer les stats MIT/MET du jour
  static async getTodayMITMETStats(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      console.log('📊 Récupération stats MIT/MET du jour...', { userId, today });

      // Récupérer toutes les MIT actives
      const { mits } = await this.getActiveMITs(userId);
      
      // Récupérer toutes les MET actives
      const { mets } = await this.getActiveMETs(userId);

      // Récupérer les completions MIT du jour
      const { data: mitCompletions, error: mitError } = await supabase
        .from('mit_completions')
        .select('mit_id')
        .eq('user_id', userId)
        .eq('date', today);

      if (mitError) throw mitError;

      // Récupérer les checks MET du jour
      const { data: metChecks, error: metError } = await supabase
        .from('met_checks')
        .select('met_id')
        .eq('user_id', userId)
        .eq('date', today);

      if (metError) throw metError;

      const stats = {
        totalMITs: mits.length,
        completedMITs: mitCompletions?.length || 0,
        totalMETs: mets.length,
        checkedMETs: metChecks?.length || 0,
        mitCompletionRate: mits.length > 0 ? (mitCompletions?.length || 0) / mits.length : 0,
        metAvoidanceRate: mets.length > 0 ? 1 - ((metChecks?.length || 0) / mets.length) : 1,
        // ✅ NOUVEAU: Stats pour les tâches récurrentes
        recurringMITs: mits.filter(mit => mit.is_recurring).length,
        recurringMETs: mets.filter(met => met.is_recurring).length
      };

      console.log('✅ Stats MIT/MET calculées:', stats);
      return {
        success: true,
        stats
      };

    } catch (error) {
      console.error('❌ Erreur stats MIT/MET:', error);
      return {
        success: false,
        error: error.message,
        stats: null
      };
    }
  }

  // ✅ Récupérer les tâches avec filtres
  static async getTasksWithFilters(userId, filters = {}) {
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId);

      // Appliquer les filtres
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      // Tri
      if (filters.orderBy) {
        query = query.order(filters.orderBy, { 
          ascending: filters.ascending !== false 
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Limite
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      console.log(`✅ ${data?.length || 0} tâches récupérées avec filtres:`, filters);
      return {
        success: true,
        tasks: data || []
      };

    } catch (error) {
      console.error('❌ Erreur récupération tâches filtrées:', error);
      return {
        success: false,
        error: error.message,
        tasks: []
      };
    }
  }

  // ✅ NOUVEAU: Récupérer les MIT/MET récurrentes pour mise à jour automatique
  static async getRecurringTasks(userId) {
    try {
      console.log('🔄 Récupération tâches récurrentes...', { userId });

      const [mitsResult, metsResult] = await Promise.all([
        supabase
          .from('mits')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .eq('is_recurring', true),
        
        supabase
          .from('mets')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .eq('is_recurring', true)
      ]);

      if (mitsResult.error) throw mitsResult.error;
      if (metsResult.error) throw metsResult.error;

      const recurringTasks = {
        mits: mitsResult.data || [],
        mets: metsResult.data || []
      };

      console.log('✅ Tâches récurrentes trouvées:', {
        mits: recurringTasks.mits.length,
        mets: recurringTasks.mets.length
      });

      return {
        success: true,
        recurringTasks
      };

    } catch (error) {
      console.error('❌ Erreur récupération tâches récurrentes:', error);
      return {
        success: false,
        error: error.message,
        recurringTasks: { mits: [], mets: [] }
      };
    }
  }

  // ✅ NOUVEAU: Récupérer les completions/checks pour une date spécifique
  static async getTaskDataForDate(userId, targetDate) {
    try {
      console.log('📅 Récupération données tâches pour date...', { userId, targetDate });

      const [mitCompletions, metChecks] = await Promise.all([
        supabase
          .from('mit_completions')
          .select('mit_id')
          .eq('user_id', userId)
          .eq('date', targetDate),
        
        supabase
          .from('met_checks')
          .select('met_id')
          .eq('user_id', userId)
          .eq('date', targetDate)
      ]);

      if (mitCompletions.error) throw mitCompletions.error;
      if (metChecks.error) throw metChecks.error;

      return {
        success: true,
        mitCompletions: mitCompletions.data?.map(c => c.mit_id) || [],
        metChecks: metChecks.data?.map(c => c.met_id) || []
      };

    } catch (error) {
      console.error('❌ Erreur récupération données date:', error);
      return {
        success: false,
        error: error.message,
        mitCompletions: [],
        metChecks: []
      };
    }
  }
}
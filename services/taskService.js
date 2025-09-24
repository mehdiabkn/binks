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


  // NOUVELLES MÉTHODES À AJOUTER DANS ./services/taskService.js

// ================================
// GESTION DES TEMPLATES RÉCURRENTS
// ================================

/**
 * Créer un template récurrent (remplace createMIT/createMET pour les tâches récurrentes)
 */
// MODIFICATION DANS ./services/taskService.js

/**
 * Créer un template récurrent avec génération immédiate si applicable
 */
static async createRecurringTemplate(userId, templateData) {
  try {
    console.log('🔄 Création template récurrent...', { userId, templateData });

    // Validation des données (gardée identique)
    if (!templateData.text?.trim()) {
      throw new Error('Le texte de la tâche est requis');
    }

    if (!templateData.type || !['MIT', 'MET'].includes(templateData.type)) {
      throw new Error('Le type doit être MIT ou MET');
    }

    if (!templateData.selectedDays || templateData.selectedDays.length === 0) {
      throw new Error('Au moins un jour doit être sélectionné');
    }

    const newTemplate = {
      user_id: userId,
      type: templateData.type,
      text: templateData.text.trim(),
      days_of_week: templateData.selectedDays, // Array [1,2,3,4,5]
      is_active: true
    };

    // Ajouter les champs spécifiques aux MIT
    if (templateData.type === 'MIT') {
      newTemplate.priority = templateData.priority || 'medium';
      newTemplate.estimated_time = templateData.estimatedTime || '30min';
    }

    console.log('📝 Données template à insérer:', newTemplate);

    // 1. Créer le template
    const { data, error } = await supabase
      .from('recurring_templates')
      .insert([newTemplate])
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur Supabase createRecurringTemplate:', error);
      throw error;
    }

    console.log('✅ Template récurrent créé:', data);

    // 2. ✅ NOUVEAU: Vérifier si on doit générer la tâche aujourd'hui
    const today = new Date();
    const dayOfWeek = today.getDay();
    const normalizedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Dimanche = 7
    const todayDateStr = today.toISOString().split('T')[0];

    console.log('🗓️ Vérification génération immédiate:', {
      today: todayDateStr,
      dayOfWeek: normalizedDayOfWeek,
      selectedDays: templateData.selectedDays,
      shouldGenerate: templateData.selectedDays.includes(normalizedDayOfWeek)
    });

    let generatedTask = null;

    // Si aujourd'hui fait partie des jours sélectionnés, générer la tâche
    if (templateData.selectedDays.includes(normalizedDayOfWeek)) {
      console.log('⚡ Génération immédiate de la tâche pour aujourd\'hui...');

      try {
        if (templateData.type === 'MIT') {
          // Vérifier qu'une MIT n'existe pas déjà pour aujourd'hui
          const { data: existingMIT } = await supabase
            .from('mits')
            .select('id')
            .eq('user_id', userId)
            .eq('text', templateData.text)
            .eq('start_date', todayDateStr)
            .single();

          if (!existingMIT) {
            const { data: newMIT, error: mitError } = await supabase
              .from('mits')
              .insert([{
                user_id: userId,
                text: templateData.text,
                priority: templateData.priority,
                estimated_time: templateData.estimatedTime,
                is_recurring: false, // Tâche générée, pas récurrente
                start_date: todayDateStr,
                end_date: todayDateStr,
                is_active: true
              }])
              .select()
              .single();

            if (!mitError) {
              generatedTask = newMIT;
              console.log('✅ MIT générée immédiatement:', newMIT.text);
            } else {
              console.error('❌ Erreur génération MIT immédiate:', mitError);
            }
          } else {
            console.log('⚠️ MIT existe déjà pour aujourd\'hui');
          }

        } else if (templateData.type === 'MET') {
          // Vérifier qu'une MET n'existe pas déjà pour aujourd'hui
          const { data: existingMET } = await supabase
            .from('mets')
            .select('id')
            .eq('user_id', userId)
            .eq('text', templateData.text)
            .eq('start_date', todayDateStr)
            .single();

          if (!existingMET) {
            const { data: newMET, error: metError } = await supabase
              .from('mets')
              .insert([{
                user_id: userId,
                text: templateData.text,
                is_recurring: false, // Tâche générée, pas récurrente
                start_date: todayDateStr,
                end_date: todayDateStr,
                is_active: true
              }])
              .select()
              .single();

            if (!metError) {
              generatedTask = newMET;
              console.log('✅ MET générée immédiatement:', newMET.text);
            } else {
              console.error('❌ Erreur génération MET immédiate:', metError);
            }
          } else {
            console.log('⚠️ MET existe déjà pour aujourd\'hui');
          }
        }

      } catch (generationError) {
        console.error('❌ Erreur lors de la génération immédiate:', generationError);
        // Ne pas faire échouer la création du template pour autant
      }
    }

    // 3. Retourner le résultat avec template ET tâche générée si applicable
    return {
      success: true,
      template: data,
      generatedTask: generatedTask, // ✅ NOUVEAU: Inclure la tâche générée
      wasGeneratedToday: !!generatedTask
    };

  } catch (error) {
    console.error('❌ Erreur création template récurrent:', error);
    return {
      success: false,
      error: error.message,
      template: null,
      generatedTask: null,
      wasGeneratedToday: false
    };
  }
}

/**
 * Récupérer tous les templates récurrents actifs d'un utilisateur
 */
static async getActiveRecurringTemplates(userId) {
  try {
    console.log('🔄 Récupération templates récurrents...', { userId });

    const { data, error } = await supabase
      .from('recurring_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    console.log(`✅ ${data?.length || 0} templates récurrents trouvés`);
    
    return {
      success: true,
      templates: data || []
    };

  } catch (error) {
    console.error('❌ Erreur récupération templates récurrents:', error);
    return {
      success: false,
      error: error.message,
      templates: []
    };
  }
}

/**
 * Désactiver un template récurrent (au lieu de le supprimer)
 */
static async deactivateRecurringTemplate(templateId) {
  try {
    console.log('🔄 Désactivation template récurrent...', { templateId });

    const { data, error } = await supabase
      .from('recurring_templates')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Template récurrent désactivé:', data);
    return {
      success: true,
      template: data
    };

  } catch (error) {
    console.error('❌ Erreur désactivation template récurrent:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Générer les tâches quotidiennes depuis les templates (pour GitHub Action)
 */
static async generateDailyTasksFromTemplates(targetDate) {
  try {
    console.log('🤖 Génération tâches quotidiennes...', { targetDate });

    // Obtenir le jour de la semaine (1=Lundi, 7=Dimanche)
    const date = new Date(targetDate);
    const dayOfWeek = date.getDay();
    const normalizedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Dimanche = 7

    console.log(`📅 Date: ${targetDate}, Jour de semaine: ${normalizedDayOfWeek}`);

    // Récupérer tous les templates actifs qui correspondent à ce jour
    const { data: templates, error } = await supabase
      .from('recurring_templates')
      .select('*')
      .eq('is_active', true)
      .contains('days_of_week', [normalizedDayOfWeek]);

    if (error) {
      throw error;
    }

    console.log(`🔄 ${templates?.length || 0} templates trouvés pour ce jour`);

    if (!templates || templates.length === 0) {
      return {
        success: true,
        generated: {
          mits: [],
          mets: []
        }
      };
    }

    const generatedMITs = [];
    const generatedMETs = [];

    // Générer les tâches pour chaque template
    for (const template of templates) {
      try {
        if (template.type === 'MIT') {
          // Vérifier si une MIT existe déjà pour cette date
          const { data: existingMIT } = await supabase
            .from('mits')
            .select('id')
            .eq('user_id', template.user_id)
            .eq('text', template.text)
            .eq('start_date', targetDate)
            .single();

          if (!existingMIT) {
            const { data: newMIT, error: mitError } = await supabase
              .from('mits')
              .insert([{
                user_id: template.user_id,
                text: template.text,
                priority: template.priority,
                estimated_time: template.estimated_time,
                is_recurring: false, // Les tâches générées ne sont PAS récurrentes
                start_date: targetDate,
                end_date: targetDate, // Tâche pour ce jour seulement
                is_active: true
              }])
              .select()
              .single();

            if (!mitError) {
              generatedMITs.push(newMIT);
              console.log(`✅ MIT générée: ${template.text}`);
            }
          }

        } else if (template.type === 'MET') {
          // Vérifier si une MET existe déjà pour cette date
          const { data: existingMET } = await supabase
            .from('mets')
            .select('id')
            .eq('user_id', template.user_id)
            .eq('text', template.text)
            .eq('start_date', targetDate)
            .single();

          if (!existingMET) {
            const { data: newMET, error: metError } = await supabase
              .from('mets')
              .insert([{
                user_id: template.user_id,
                text: template.text,
                is_recurring: false, // Les tâches générées ne sont PAS récurrentes
                start_date: targetDate,
                end_date: targetDate, // Tâche pour ce jour seulement
                is_active: true
              }])
              .select()
              .single();

            if (!metError) {
              generatedMETs.push(newMET);
              console.log(`✅ MET générée: ${template.text}`);
            }
          }
        }

      } catch (templateError) {
        console.error(`❌ Erreur génération template ${template.id}:`, templateError);
      }
    }

    console.log(`🎯 Génération terminée: ${generatedMITs.length} MIT, ${generatedMETs.length} MET`);

    return {
      success: true,
      generated: {
        mits: generatedMITs,
        mets: generatedMETs
      }
    };

  } catch (error) {
    console.error('❌ Erreur génération tâches quotidiennes:', error);
    return {
      success: false,
      error: error.message,
      generated: {
        mits: [],
        mets: []
      }
    };
  }
}

/**
 * Récupérer les statistiques des templates récurrents
 */
static async getRecurringTemplateStats(userId) {
  try {
    console.log('📊 Récupération stats templates récurrents...', { userId });

    const { data: templates, error } = await supabase
      .from('recurring_templates')
      .select('type, days_of_week')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    const stats = {
      totalTemplates: templates?.length || 0,
      mitTemplates: templates?.filter(t => t.type === 'MIT').length || 0,
      metTemplates: templates?.filter(t => t.type === 'MET').length || 0,
      dailyTemplates: templates?.filter(t => t.days_of_week?.length === 7).length || 0,
      weekdayTemplates: templates?.filter(t => 
        t.days_of_week?.length === 5 && 
        t.days_of_week?.every(day => day >= 1 && day <= 5)
      ).length || 0,
      weekendTemplates: templates?.filter(t => 
        t.days_of_week?.length === 2 && 
        t.days_of_week?.includes(6) && 
        t.days_of_week?.includes(7)
      ).length || 0
    };

    console.log('✅ Stats templates calculées:', stats);
    return {
      success: true,
      stats
    };

  } catch (error) {
    console.error('❌ Erreur stats templates récurrents:', error);
    return {
      success: false,
      error: error.message,
      stats: null
    };
  }
}

// ================================
// MÉTHODES MODIFIÉES POUR COMPATIBILITÉ
// ================================

/**
 * NOUVEAU: Créer une MIT - distingue entre ponctuelle et récurrente
 */
static async createMIT(userId, mitData) {
  try {
    console.log('⚡ Création MIT...', { userId, mitData });

    // Si c'est récurrent, créer un template au lieu d'une tâche
    if (mitData.isRecurring && mitData.selectedDays?.length > 0) {
      console.log('🔄 MIT récurrente détectée, création template...');
      
      return await this.createRecurringTemplate(userId, {
        ...mitData,
        type: 'MIT'
      });
    }

    // Sinon, créer une MIT ponctuelle traditionnelle
    console.log('📅 MIT ponctuelle, création normale...');
    
    const newMIT = {
      user_id: userId,
      text: mitData.text,
      priority: mitData.priority || 'medium',
      estimated_time: mitData.estimatedTime || null,
      is_recurring: false, // Toujours false maintenant
      start_date: mitData.startDate || new Date().toISOString().split('T')[0],
      end_date: mitData.endDate || null,
      is_active: true
    };

    const { data, error } = await supabase
      .from('mits')
      .insert([newMIT])
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ MIT ponctuelle créée:', data);
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

/**
 * NOUVEAU: Créer une MET - distingue entre ponctuelle et récurrente
 */
static async createMET(userId, metData) {
  try {
    console.log('🚫 Création MET...', { userId, metData });

    // Si c'est récurrent, créer un template au lieu d'une tâche
    if (metData.isRecurring && metData.selectedDays?.length > 0) {
      console.log('🔄 MET récurrente détectée, création template...');
      
      return await this.createRecurringTemplate(userId, {
        ...metData,
        type: 'MET'
      });
    }

    // Sinon, créer une MET ponctuelle traditionnelle
    console.log('📅 MET ponctuelle, création normale...');
    
    const newMET = {
      user_id: userId,
      text: metData.text,
      is_recurring: false, // Toujours false maintenant
      start_date: metData.startDate || new Date().toISOString().split('T')[0],
      end_date: metData.endDate || null,
      is_active: true
    };

    const { data, error } = await supabase
      .from('mets')
      .insert([newMET])
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ MET ponctuelle créée:', data);
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
    
    const { data, error } = await supabase
      .from('mits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      // ✅ SUPPRIMÉ: .lte('start_date', today)
      // ✅ SUPPRIMÉ: .or(`end_date.is.null,end_date.gte.${today}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    console.log(`✅ ${data?.length || 0} MIT actives trouvées (toutes dates confondues)`);
    
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
    
    const { data, error } = await supabase
      .from('mets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      // ✅ SUPPRIMÉ: .lte('start_date', today)
      // ✅ SUPPRIMÉ: .or(`end_date.is.null,end_date.gte.${today}`)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    console.log(`✅ ${data?.length || 0} MET actives trouvées (toutes dates confondues)`);
    
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
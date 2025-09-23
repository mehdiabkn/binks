// FICHIER: ./services/objectivesService.js

import { supabase } from './supabase';
import { DailyService } from './dailyService';

export class ObjectivesService {

  // ✅ Récupérer tous les objectifs d'un utilisateur
  static async getUserObjectives(userId) {
    try {
      console.log('🎯 Récupération objectifs utilisateur...', { userId });
      
      const { data: objectives, error } = await supabase
        .from('objectives')
        .select(`
          *,
          objective_milestones (
            id,
            label,
            value,
            completed,
            completed_at,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Formater les données pour correspondre au format attendu
      const formattedObjectives = objectives?.map(obj => ({
        id: obj.id,
        title: obj.title,
        description: obj.description,
        category: obj.category,
        priority: obj.priority,
        progressType: obj.progress_type,
        hasTarget: obj.has_target,
        targetValue: obj.target_value,
        currentValue: obj.current_value,
        unit: obj.unit,
        deadline: obj.deadline,
        completed: obj.completed,
        completedAt: obj.completed_at,
        createdAt: obj.created_at,
        updatedAt: obj.updated_at,
        milestones: obj.objective_milestones?.map(m => ({
          id: m.id,
          value: m.value,
          label: m.label,
          completed: m.completed,
          completedAt: m.completed_at,
          createdAt: m.created_at
        })) || []
      })) || [];

      console.log('✅ Objectifs récupérés:', formattedObjectives.length);
      return {
        success: true,
        objectives: formattedObjectives
      };

    } catch (error) {
      console.error('❌ Erreur récupération objectifs:', error);
      return {
        success: false,
        error: error.message,
        objectives: []
      };
    }
  }

  // ✅ Créer un nouvel objectif
  static async createObjective(userId, objectiveData) {
    try {
      console.log('➕ Création objectif...', { userId, objectiveData });

      const { milestones, ...objectiveFields } = objectiveData;

      // 1. Créer l'objectif principal
      const { data: objective, error: objectiveError } = await supabase
        .from('objectives')
        .insert([{
          user_id: userId,
          title: objectiveFields.title,
          description: objectiveFields.description || '',
          category: objectiveFields.category,
          priority: objectiveFields.priority || 'medium',
          progress_type: objectiveFields.progressType,
          has_target: objectiveFields.hasTarget !== false,
          target_value: objectiveFields.targetValue || 1,
          current_value: 0,
          unit: objectiveFields.unit || '',
          deadline: objectiveFields.deadline || null
        }])
        .select()
        .single();

      if (objectiveError) {
        throw objectiveError;
      }

      console.log('✅ Objectif créé:', objective);

      // 2. Créer les milestones si fournies
      let createdMilestones = [];
      if (milestones && milestones.length > 0) {
        const milestonesData = milestones.map(milestone => ({
          objective_id: objective.id,
          label: milestone.label,
          value: milestone.value,
          completed: false
        }));

        const { data: milestonesResult, error: milestonesError } = await supabase
          .from('objective_milestones')
          .insert(milestonesData)
          .select();

        if (milestonesError) {
          console.error('⚠️ Erreur création milestones:', milestonesError);
        } else {
          createdMilestones = milestonesResult || [];
          console.log('✅ Milestones créées:', createdMilestones.length);
        }
      }

      // 3. Formater la réponse
      const formattedObjective = {
        id: objective.id,
        title: objective.title,
        description: objective.description,
        category: objective.category,
        priority: objective.priority,
        progressType: objective.progress_type,
        hasTarget: objective.has_target,
        targetValue: objective.target_value,
        currentValue: objective.current_value,
        unit: objective.unit,
        deadline: objective.deadline,
        completed: objective.completed,
        completedAt: objective.completed_at,
        createdAt: objective.created_at,
        updatedAt: objective.updated_at,
        milestones: createdMilestones.map(m => ({
          id: m.id,
          value: m.value,
          label: m.label,
          completed: m.completed,
          completedAt: m.completed_at
        }))
      };

      return {
        success: true,
        objective: formattedObjective
      };

    } catch (error) {
      console.error('❌ Erreur création objectif:', error);
      return {
        success: false,
        error: error.message,
        objective: null
      };
    }
  }

  // ✅ Mettre à jour la progression d'un objectif
  static async updateObjectiveProgress(userId, objectiveId, newValue, addPoints = true) {
    try {
      console.log('📈 Mise à jour progression...', { userId, objectiveId, newValue });

      // 1. Récupérer l'objectif actuel
      const { data: currentObjective, error: fetchError } = await supabase
        .from('objectives')
        .select('*, objective_milestones(*)')
        .eq('id', objectiveId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!currentObjective) {
        throw new Error('Objectif non trouvé');
      }

      const oldValue = currentObjective.current_value;
      const isCompleted = newValue >= currentObjective.target_value;
      const wasCompleted = currentObjective.completed;

      // 2. Mettre à jour l'objectif
      const updateData = {
        current_value: newValue,
        updated_at: new Date().toISOString()
      };

      // Si l'objectif est maintenant complété
      if (isCompleted && !wasCompleted) {
        updateData.completed = true;
        updateData.completed_at = new Date().toISOString();
      }

      const { data: updatedObjective, error: updateError } = await supabase
        .from('objectives')
        .update(updateData)
        .eq('id', objectiveId)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      console.log('✅ Objectif mis à jour:', updatedObjective);

      // 3. Mettre à jour les milestones
      const milestones = currentObjective.objective_milestones || [];
      let updatedMilestones = [];

      if (milestones.length > 0) {
        // Déterminer quelles milestones sont maintenant complétées
        const milestonesToUpdate = milestones.filter(m => 
          m.value <= newValue && !m.completed
        );

        if (milestonesToUpdate.length > 0) {
          const { data: milestonesResult, error: milestonesError } = await supabase
            .from('objective_milestones')
            .update({ 
              completed: true, 
              completed_at: new Date().toISOString() 
            })
            .in('id', milestonesToUpdate.map(m => m.id))
            .select();

          if (milestonesError) {
            console.error('⚠️ Erreur mise à jour milestones:', milestonesError);
          } else {
            console.log('✅ Milestones mises à jour:', milestonesResult?.length || 0);
          }
        }

        // Récupérer toutes les milestones mises à jour
        const { data: allMilestones, error: allMilestonesError } = await supabase
          .from('objective_milestones')
          .select('*')
          .eq('objective_id', objectiveId)
          .order('value', { ascending: true });

        if (!allMilestonesError) {
          updatedMilestones = allMilestones || [];
        }
      }

      // 4. Ajouter des points si demandé
      if (addPoints && newValue > oldValue) {
        const progressDifference = newValue - oldValue;
        const progressPercentage = progressDifference / currentObjective.target_value;
        const points = Math.round(progressPercentage * 50); // Max 50 points par objectif

        if (points > 0) {
          await DailyService.addPoints(userId, points, 'objective_progress');
          console.log(`✅ Points ajoutés: ${points} pour progression objectif`);
        }
      }

      // 5. Points bonus si objectif complété
      if (isCompleted && !wasCompleted && addPoints) {
        const bonusPoints = 100; // Bonus de completion
        await DailyService.addPoints(userId, bonusPoints, 'objective_completed');
        console.log(`🎉 Bonus completion: ${bonusPoints} points`);
      }

      // 6. Formater la réponse
      const formattedObjective = {
        id: updatedObjective.id,
        title: updatedObjective.title,
        description: updatedObjective.description,
        category: updatedObjective.category,
        priority: updatedObjective.priority,
        progressType: updatedObjective.progress_type,
        hasTarget: updatedObjective.has_target,
        targetValue: updatedObjective.target_value,
        currentValue: updatedObjective.current_value,
        unit: updatedObjective.unit,
        deadline: updatedObjective.deadline,
        completed: updatedObjective.completed,
        completedAt: updatedObjective.completed_at,
        createdAt: updatedObjective.created_at,
        updatedAt: updatedObjective.updated_at,
        milestones: updatedMilestones.map(m => ({
          id: m.id,
          value: m.value,
          label: m.label,
          completed: m.completed,
          completedAt: m.completed_at
        }))
      };

      return {
        success: true,
        objective: formattedObjective,
        wasCompleted: isCompleted && !wasCompleted // Pour déclencher la célébration
      };

    } catch (error) {
      console.error('❌ Erreur mise à jour progression:', error);
      return {
        success: false,
        error: error.message,
        objective: null,
        wasCompleted: false
      };
    }
  }

  // ✅ Marquer un objectif simple comme terminé
  static async completeSimpleObjective(userId, objectiveId) {
    try {
      console.log('✅ Completion objectif simple...', { userId, objectiveId });

      // Récupérer l'objectif
      const { data: objective, error: fetchError } = await supabase
        .from('objectives')
        .select('*')
        .eq('id', objectiveId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !objective) {
        throw new Error('Objectif non trouvé');
      }

      if (objective.completed) {
        return {
          success: false,
          error: 'Objectif déjà complété',
          objective: null
        };
      }

      // Marquer comme complété
      const { data: updatedObjective, error: updateError } = await supabase
        .from('objectives')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          current_value: objective.target_value,
          updated_at: new Date().toISOString()
        })
        .eq('id', objectiveId)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Ajouter des points bonus
      const bonusPoints = 100;
      await DailyService.addPoints(userId, bonusPoints, 'objective_completed');
      console.log(`🎉 Objectif simple complété: ${bonusPoints} points`);

      return {
        success: true,
        objective: {
          id: updatedObjective.id,
          title: updatedObjective.title,
          description: updatedObjective.description,
          category: updatedObjective.category,
          priority: updatedObjective.priority,
          progressType: updatedObjective.progress_type,
          hasTarget: updatedObjective.has_target,
          targetValue: updatedObjective.target_value,
          currentValue: updatedObjective.current_value,
          unit: updatedObjective.unit,
          deadline: updatedObjective.deadline,
          completed: updatedObjective.completed,
          completedAt: updatedObjective.completed_at,
          createdAt: updatedObjective.created_at,
          updatedAt: updatedObjective.updated_at,
          milestones: []
        },
        wasCompleted: true
      };

    } catch (error) {
      console.error('❌ Erreur completion objectif simple:', error);
      return {
        success: false,
        error: error.message,
        objective: null,
        wasCompleted: false
      };
    }
  }

  // ✅ Supprimer un objectif
  static async deleteObjective(userId, objectiveId) {
    try {
      console.log('🗑️ Suppression objectif...', { userId, objectiveId });

      // 1. Supprimer les milestones (cascade devrait le faire, mais on s'assure)
      await supabase
        .from('objective_milestones')
        .delete()
        .eq('objective_id', objectiveId);

      // 2. Supprimer l'objectif
      const { error } = await supabase
        .from('objectives')
        .delete()
        .eq('id', objectiveId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      console.log('✅ Objectif supprimé');
      return {
        success: true
      };

    } catch (error) {
      console.error('❌ Erreur suppression objectif:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ Mettre à jour un objectif existant
  static async updateObjective(userId, objectiveId, objectiveData) {
    try {
      console.log('📝 Mise à jour objectif...', { userId, objectiveId, objectiveData });

      const { milestones, ...objectiveFields } = objectiveData;

      // 1. Mettre à jour l'objectif principal
      const { data: updatedObjective, error: updateError } = await supabase
        .from('objectives')
        .update({
          title: objectiveFields.title,
          description: objectiveFields.description,
          category: objectiveFields.category,
          priority: objectiveFields.priority,
          deadline: objectiveFields.deadline,
          updated_at: new Date().toISOString()
        })
        .eq('id', objectiveId)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // 2. Gérer les milestones si fournies
      if (milestones) {
        // Supprimer les anciennes milestones
        await supabase
          .from('objective_milestones')
          .delete()
          .eq('objective_id', objectiveId);

        // Créer les nouvelles milestones
        if (milestones.length > 0) {
          const milestonesData = milestones.map(milestone => ({
            objective_id: objectiveId,
            label: milestone.label,
            value: milestone.value,
            completed: milestone.completed || false
          }));

          await supabase
            .from('objective_milestones')
            .insert(milestonesData);
        }
      }

      console.log('✅ Objectif mis à jour');
      return {
        success: true,
        objective: updatedObjective
      };

    } catch (error) {
      console.error('❌ Erreur mise à jour objectif:', error);
      return {
        success: false,
        error: error.message,
        objective: null
      };
    }
  }

  // ✅ Obtenir les statistiques des objectifs
  static async getObjectivesStats(userId) {
    try {
      console.log('📊 Récupération stats objectifs...', { userId });

      const { data: objectives, error } = await supabase
        .from('objectives')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      const total = objectives?.length || 0;
      const completed = objectives?.filter(obj => obj.completed).length || 0;
      const active = total - completed;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Statistiques par catégorie
      const byCategory = objectives?.reduce((acc, obj) => {
        if (!acc[obj.category]) {
          acc[obj.category] = { total: 0, completed: 0 };
        }
        acc[obj.category].total++;
        if (obj.completed) {
          acc[obj.category].completed++;
        }
        return acc;
      }, {}) || {};

      // Statistiques par priorité
      const byPriority = objectives?.reduce((acc, obj) => {
        if (!acc[obj.priority]) {
          acc[obj.priority] = { total: 0, completed: 0 };
        }
        acc[obj.priority].total++;
        if (obj.completed) {
          acc[obj.priority].completed++;
        }
        return acc;
      }, {}) || {};

      // Progression moyenne
      const averageProgress = objectives?.length > 0 
        ? objectives.reduce((sum, obj) => {
            const progress = obj.target_value > 0 ? (obj.current_value / obj.target_value) : 0;
            return sum + Math.min(progress, 1);
          }, 0) / objectives.length
        : 0;

      const stats = {
        total,
        completed,
        active,
        completionRate,
        averageProgress: Math.round(averageProgress * 100),
        byCategory,
        byPriority,
        lastUpdated: new Date().toISOString()
      };

      console.log('✅ Stats objectifs récupérées:', stats);
      return {
        success: true,
        stats
      };

    } catch (error) {
      console.error('❌ Erreur stats objectifs:', error);
      return {
        success: false,
        error: error.message,
        stats: null
      };
    }
  }

  // ✅ Récupérer les objectifs proches de l'échéance
  static async getUpcomingDeadlines(userId, daysAhead = 7) {
    try {
      console.log('⏰ Récupération échéances proches...', { userId, daysAhead });

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);
      const endDateStr = endDate.toISOString().split('T')[0];

      const { data: objectives, error } = await supabase
        .from('objectives')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false)
        .not('deadline', 'is', null)
        .lte('deadline', endDateStr)
        .order('deadline', { ascending: true });

      if (error) {
        throw error;
      }

      const upcomingObjectives = objectives?.map(obj => ({
        id: obj.id,
        title: obj.title,
        deadline: obj.deadline,
        category: obj.category,
        priority: obj.priority,
        currentValue: obj.current_value,
        targetValue: obj.target_value,
        progressPercentage: obj.target_value > 0 ? Math.round((obj.current_value / obj.target_value) * 100) : 0
      })) || [];

      console.log('✅ Échéances proches récupérées:', upcomingObjectives.length);
      return {
        success: true,
        objectives: upcomingObjectives
      };

    } catch (error) {
      console.error('❌ Erreur échéances proches:', error);
      return {
        success: false,
        error: error.message,
        objectives: []
      };
    }
  }

  // ✅ Récupérer les objectifs récemment complétés
  static async getRecentlyCompleted(userId, daysBack = 30) {
    try {
      console.log('🎉 Récupération objectifs récemment complétés...', { userId, daysBack });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data: objectives, error } = await supabase
        .from('objectives')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('completed_at', startDateStr)
        .order('completed_at', { ascending: false });

      if (error) {
        throw error;
      }

      const recentlyCompleted = objectives?.map(obj => ({
        id: obj.id,
        title: obj.title,
        category: obj.category,
        completedAt: obj.completed_at,
        targetValue: obj.target_value,
        unit: obj.unit
      })) || [];

      console.log('✅ Objectifs récemment complétés récupérés:', recentlyCompleted.length);
      return {
        success: true,
        objectives: recentlyCompleted
      };

    } catch (error) {
      console.error('❌ Erreur objectifs récemment complétés:', error);
      return {
        success: false,
        error: error.message,
        objectives: []
      };
    }
  }
}
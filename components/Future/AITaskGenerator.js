// Service pour générer des suggestions de tâches avec l'IA
import i18next from 'i18next';

export class AITaskGenerator {
  
  static async generateMITSuggestion(userProfile, selectedDate, existingTasks = []) {
    // Simulation d'appel IA - à remplacer par votre service IA réel
    return new Promise((resolve) => {
      setTimeout(() => {
        const suggestions = AITaskGenerator.getMITSuggestions(userProfile, selectedDate, existingTasks);
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        resolve(randomSuggestion);
      }, 1500); // Simulation du délai d'API
    });
  }
  
  static async generateMETSuggestion(userProfile, selectedDate, existingTasks = []) {
    // Simulation d'appel IA - à remplacer par votre service IA réel
    return new Promise((resolve) => {
      setTimeout(() => {
        const suggestions = AITaskGenerator.getMETSuggestions(userProfile, selectedDate, existingTasks);
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        resolve(randomSuggestion);
      }, 1500); // Simulation du délai d'API
    });
  }

  // Suggestions MIT basées sur le profil utilisateur et le contexte
  static getMITSuggestions(userProfile, selectedDate, existingTasks) {
    const dayOfWeek = selectedDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isMonday = dayOfWeek === 1;
    const isFriday = dayOfWeek === 5;
    
    const firstName = userProfile?.firstName || i18next.t('settings.defaultName');
    
    const baseSuggestions = [
      // Travail / Productivité
      i18next.t('ai.mit.work.finishReport'),
      i18next.t('ai.mit.work.preparePresentation'),
      i18next.t('ai.mit.work.replyEmails'),
      i18next.t('ai.mit.work.teamMeeting'),
      i18next.t('ai.mit.work.finishProject'),
      i18next.t('ai.mit.work.planWeek'),
      i18next.t('ai.mit.work.reviewBudget'),
      
      // Développement personnel
      i18next.t('ai.mit.personal.read30min'),
      i18next.t('ai.mit.personal.practiceSkill'),
      i18next.t('ai.mit.personal.reviewGoals'),
      i18next.t('ai.mit.personal.meditate'),
      i18next.t('ai.mit.personal.writeJournal'),
      
      // Santé & Bien-être
      i18next.t('ai.mit.health.exercise45min'),
      i18next.t('ai.mit.health.prepareMeals'),
      i18next.t('ai.mit.health.doctorAppointment'),
      i18next.t('ai.mit.health.walk30min'),
      i18next.t('ai.mit.health.drink2L'),
      
      // Relations & Social
      i18next.t('ai.mit.social.callFriend'),
      i18next.t('ai.mit.social.planFamily'),
      i18next.t('ai.mit.social.replyMessages'),
      i18next.t('ai.mit.social.organizeDinner'),
      
      // Organisation & Maison
      i18next.t('ai.mit.organization.cleanWorkspace'),
      i18next.t('ai.mit.organization.sortEmails'),
      i18next.t('ai.mit.organization.organizeSchedule'),
      i18next.t('ai.mit.organization.prepareThings'),
      i18next.t('ai.mit.organization.grocery'),
    ];

    // Suggestions contextuelles
    const contextualSuggestions = [];
    
    if (isMonday) {
      contextualSuggestions.push(
        i18next.t('ai.mit.contextual.monday.priorities'),
        i18next.t('ai.mit.contextual.monday.weekendReview'),
        i18next.t('ai.mit.contextual.monday.weeklyTasks')
      );
    }
    
    if (isFriday) {
      contextualSuggestions.push(
        i18next.t('ai.mit.contextual.friday.weekReview'),
        i18next.t('ai.mit.contextual.friday.prepareWeekend'),
        i18next.t('ai.mit.contextual.friday.closeProjects')
      );
    }
    
    if (isWeekend) {
      contextualSuggestions.push(
        i18next.t('ai.mit.contextual.weekend.selfTime'),
        i18next.t('ai.mit.contextual.weekend.creative'),
        i18next.t('ai.mit.contextual.weekend.planWeek'),
        i18next.t('ai.mit.contextual.weekend.familyTime')
      );
    }

    // Suggestions personnalisées selon le profil
    const personalizedSuggestions = [];
    if (userProfile?.interests) {
      if (userProfile.interests.includes('sport')) {
        personalizedSuggestions.push(i18next.t('ai.mit.personalized.sport'));
      }
      if (userProfile.interests.includes('lecture')) {
        personalizedSuggestions.push(i18next.t('ai.mit.personalized.reading'));
      }
      if (userProfile.interests.includes('cuisine')) {
        personalizedSuggestions.push(i18next.t('ai.mit.personalized.cooking'));
      }
    }

    return [...baseSuggestions, ...contextualSuggestions, ...personalizedSuggestions];
  }

  // Suggestions MET basées sur le profil utilisateur et le contexte
  static getMETSuggestions(userProfile, selectedDate, existingTasks) {
    const dayOfWeek = selectedDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const baseSuggestions = [
      // Distractions digitales
      i18next.t('ai.met.digital.socialMedia'),
      i18next.t('ai.met.digital.youtube'),
      i18next.t('ai.met.digital.mobileGames'),
      i18next.t('ai.met.digital.emails'),
      i18next.t('ai.met.digital.tiktok'),
      i18next.t('ai.met.digital.browsing'),
      
      // Habitudes alimentaires
      i18next.t('ai.met.food.snacking'),
      i18next.t('ai.met.food.eatScreen'),
      i18next.t('ai.met.food.coffee'),
      i18next.t('ai.met.food.orderFood'),
      i18next.t('ai.met.food.skipMeals'),
      
      // Procrastination
      i18next.t('ai.met.procrastination.postpone'),
      i18next.t('ai.met.procrastination.avoidTasks'),
      i18next.t('ai.met.procrastination.watchSeries'),
      i18next.t('ai.met.procrastination.stayBed'),
      i18next.t('ai.met.procrastination.postponeAppointments'),
      
      // Négativité & Mental
      i18next.t('ai.met.mental.complain'),
      i18next.t('ai.met.mental.compare'),
      i18next.t('ai.met.mental.ruminate'),
      i18next.t('ai.met.mental.criticize'),
      i18next.t('ai.met.mental.pressure'),
      
      // Mauvaises habitudes sociales
      i18next.t('ai.met.social.cancelPlans'),
      i18next.t('ai.met.social.avoidConversations'),
      i18next.t('ai.met.social.criticizeWork'),
      i18next.t('ai.met.social.interrupt'),
      
      // Argent & Consommation
      i18next.t('ai.met.money.impulsiveShopping'),
      i18next.t('ai.met.money.buyUnnecessary'),
      i18next.t('ai.met.money.ignoreFinances'),
      i18next.t('ai.met.money.onlineOrders'),
    ];

    // Suggestions contextuelles
    const contextualSuggestions = [];
    
    if (isWeekend) {
      contextualSuggestions.push(
        i18next.t('ai.met.contextual.weekend.pajamas'),
        i18next.t('ai.met.contextual.weekend.binge'),
        i18next.t('ai.met.contextual.weekend.eatBadly')
      );
    } else {
      contextualSuggestions.push(
        i18next.t('ai.met.contextual.weekday.late'),
        i18next.t('ai.met.contextual.weekday.procrastinate'),
        i18next.t('ai.met.contextual.weekday.socialMedia')
      );
    }

    return [...baseSuggestions, ...contextualSuggestions];
  }

  // Fonction utilitaire pour filtrer les suggestions déjà existantes
  static filterExistingSuggestions(suggestions, existingTasks) {
    const existingTexts = existingTasks.map(task => task.text.toLowerCase());
    return suggestions.filter(suggestion => 
      !existingTexts.some(existing => 
        existing.includes(suggestion.toLowerCase()) || 
        suggestion.toLowerCase().includes(existing)
      )
    );
  }

  // Fonction pour obtenir une suggestion contextuelle intelligente
  static async getSmartSuggestion(type, userProfile, selectedDate, existingTasks) {
    if (type === 'MIT') {
      return await AITaskGenerator.generateMITSuggestion(userProfile, selectedDate, existingTasks);
    } else {
      return await AITaskGenerator.generateMETSuggestion(userProfile, selectedDate, existingTasks);
    }
  }
}
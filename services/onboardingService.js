// services/onboardingService.js

import { supabase } from './supabase';
import { getDeviceId } from './identity';
// Note: Import conditionnel pour éviter les erreurs de dépendances circulaires
let NetworkDiagnosticService = null;
let FallbackStorageService = null;

// Importation lazy pour éviter les erreurs
const lazyImports = async () => {
  if (!NetworkDiagnosticService) {
    try {
      const { NetworkDiagnosticService: NDService } = await import('./networkDiagnosticService');
      NetworkDiagnosticService = NDService;
    } catch (error) {
      console.log('⚠️ NetworkDiagnosticService non disponible');
    }
  }
  
  if (!FallbackStorageService) {
    try {
      const { FallbackStorageService: FSService } = await import('./fallbackStorageService');
      FallbackStorageService = FSService;
    } catch (error) {
      console.log('⚠️ FallbackStorageService non disponible');
    }
  }
};

export class OnboardingService {

  // Créer un utilisateur complet avec fallback automatique
  static async createUserFromOnboarding(onboardingData, appleSignInData = null) {
    try {
      console.log('📝 Création utilisateur depuis onboarding...');
      console.log('Données reçues:', onboardingData);

      // 1. Charger les services de manière lazy
      await lazyImports();

      // 2. Tester la connectivité Supabase si le service est disponible
      let shouldUseSupabase = true;
      
      if (NetworkDiagnosticService) {
        try {
          const diagnostic = await NetworkDiagnosticService.runFullDiagnostic();
          console.log('🏥 Diagnostic réseau:', diagnostic);
          shouldUseSupabase = !diagnostic.shouldUseAsyncStorage;
        } catch (diagError) {
          console.log('⚠️ Erreur diagnostic, tentative Supabase directe');
        }
      }

      // 3. Essayer Supabase d'abord si possible
      if (shouldUseSupabase) {
        try {
          const supabaseResult = await this.createUserSupabase(onboardingData, appleSignInData);
          console.log('✅ Utilisateur créé dans Supabase avec succès');
          
          // Sauvegarder aussi en local comme backup si le service est disponible
          if (FallbackStorageService) {
            await this.createUserLocalStorage(onboardingData, appleSignInData, supabaseResult.user);
          }
          
          return supabaseResult;

        } catch (supabaseError) {
          console.error('❌ Erreur création Supabase, fallback AsyncStorage:', supabaseError);
          shouldUseSupabase = false;
        }
      }

      // 4. Fallback vers AsyncStorage
      if (!shouldUseSupabase) {
        console.log('⚠️ Utilisation fallback AsyncStorage');
        const localResult = await this.createUserLocalStorage(onboardingData, appleSignInData);
        
        // Ajouter l'action à la queue de sync si le service est disponible
        if (FallbackStorageService) {
          await FallbackStorageService.addToSyncQueue({
            type: 'create_user',
            data: onboardingData,
            appleSignInData,
            timestamp: new Date().toISOString()
          });
        }

        return {
          ...localResult,
          isLocal: true,
          needsSync: true,
          fallbackReason: 'Supabase indisponible'
        };
      }

    } catch (error) {
      console.error('❌ Erreur création onboarding complète:', error);
      
      // Dernier fallback : créer un utilisateur minimal en AsyncStorage
      try {
        return await this.createUserLocalStorage(onboardingData, appleSignInData);
      } catch (fallbackError) {
        return {
          success: false,
          error: error.message,
          fallbackError: fallbackError.message
        };
      }
    }
  }

  // Créer utilisateur dans Supabase (méthode originale)
  static async createUserSupabase(onboardingData, appleSignInData = null) {
    // 1. Générer un device_id unique
    const deviceId = await getDeviceId();
    
    // 2. Générer un fake Apple ID si pas de vraie connexion Apple
    const fakeAppleId = appleSignInData?.user || `apple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 3. Extraire les données importantes de l'onboarding
    const firstName = onboardingData[1] || 'Champion';
    const categories = onboardingData[3] || [];
    const currentLevel = onboardingData[4] || 'c_player';
    const targetLevel = onboardingData[5] || 'a_player';
    const timeline = onboardingData[6] || '6mois';
    const distance = onboardingData[7] || 'pasloin';
    const motivation = onboardingData[9] || '';
    const mit = onboardingData[11] || '';
    const met = onboardingData[12] || '';
    const signature = onboardingData[13] || '';
    const pricingChoice = onboardingData[14] || 'free';

    // 4. Calculer le niveau initial basé sur les réponses
    const initialLevel = this.calculateInitialLevel(currentLevel, targetLevel);
    const initialXP = (initialLevel - 1) * 100;

    // 5. Créer l'utilisateur dans Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{
        device_id: deviceId,
        apple_id: fakeAppleId,
        first_name: firstName,
        level: initialLevel,
        xp: initialXP,
        current_streak: 0,
        is_premium: appleSignInData?.isPremium || false,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (userError) {
      console.error('❌ Erreur création utilisateur:', userError);
      throw userError;
    }

    console.log('✅ Utilisateur créé:', user);

    // 6. Créer les réponses d'onboarding
    const { data: responses, error: responsesError } = await supabase
      .from('onboarding_responses')
      .insert([{
        user_id: user.id,
        question_1_name: firstName,
        question_3_categories: categories,
        question_4_current_level: currentLevel,
        question_5_target_level: targetLevel,
        question_6_timeline: timeline,
        question_7_distance: distance,
        question_9_motivation: motivation,
        question_11_mit: mit,
        question_12_met: met,
        question_13_signature: signature,
        question_14_pricing_choice: pricingChoice,
        completed_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (responsesError) {
      console.error('❌ Erreur création réponses:', responsesError);
      // Pas critique, on continue
    }

    // 7. Créer les paramètres par défaut
    await this.createDefaultSettings(user.id);

    // 8. Créer les statistiques initiales
    await this.createInitialStats(user.id);

    // 9. Créer MIT/MET initiales si fournies
    if (mit) {
      await this.createInitialMIT(user.id, mit);
    }
    if (met) {
      await this.createInitialMET(user.id, met);
    }

    console.log('🎉 Onboarding complet sauvegardé dans Supabase !');

    return {
      success: true,
      user: user,
      responses: responses,
      deviceId: deviceId,
      isLocal: false
    };
  }

  // Créer utilisateur en AsyncStorage
  static async createUserLocalStorage(onboardingData, appleSignInData = null, supabaseUser = null) {
    try {
      console.log('💾 Création utilisateur en AsyncStorage...');

      // Import AsyncStorage directement pour éviter les dépendances
      const AsyncStorage = await import('@react-native-async-storage/async-storage').then(module => module.default);

      // 1. Générer un device_id unique
      const deviceId = await getDeviceId();
      
      // 2. Extraire les données
      const firstName = onboardingData[1] || 'Champion';
      const categories = onboardingData[3] || [];
      const currentLevel = onboardingData[4] || 'c_player';
      const targetLevel = onboardingData[5] || 'a_player';
      const timeline = onboardingData[6] || '6mois';
      const distance = onboardingData[7] || 'pasloin';
      const motivation = onboardingData[9] || '';
      const mit = onboardingData[11] || '';
      const met = onboardingData[12] || '';
      const signature = onboardingData[13] || '';
      const pricingChoice = onboardingData[14] || 'free';

      // 3. Calculer le niveau initial
      const initialLevel = this.calculateInitialLevel(currentLevel, targetLevel);
      const initialXP = (initialLevel - 1) * 100;

      // 4. Créer l'objet utilisateur local
      const localUser = {
        id: supabaseUser?.id || `local_${deviceId}_${Date.now()}`,
        supabaseId: supabaseUser?.id || null,
        localId: `local_${deviceId}_${Date.now()}`,
        deviceId: deviceId,
        firstName: firstName,
        level: initialLevel,
        xp: initialXP,
        currentStreak: 0,
        isPremium: appleSignInData?.isPremium || false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        
        // Données d'onboarding
        onboardingData: {
          categories,
          currentLevel,
          targetLevel,
          timeline,
          distance,
          motivation,
          mit,
          met,
          signature,
          pricingChoice,
          completedAt: new Date().toISOString()
        },
        
        // Métadonnées
        isLocal: !supabaseUser,
        needsSync: !supabaseUser,
        lastSync: supabaseUser ? new Date().toISOString() : null
      };

      // 5. Sauvegarder le profil utilisateur
      await AsyncStorage.setItem(
        '@habitus_user_profile', 
        JSON.stringify(localUser)
      );

      // 6. Créer les paramètres par défaut
      const defaultSettings = {
        notifications: true,
        dailyReminder: true,
        weeklyReport: false,
        darkMode: true,
        hapticFeedback: true,
        analyticsTracking: true,
        autoBackup: false,
        updatedAt: new Date().toISOString(),
        isLocal: true
      };

      await AsyncStorage.setItem(
        '@habitus_user_settings',
        JSON.stringify(defaultSettings)
      );

      console.log('✅ Utilisateur créé en AsyncStorage:', localUser);

      return {
        success: true,
        user: localUser,
        deviceId: deviceId,
        isLocal: true,
        needsSync: !supabaseUser
      };

    } catch (error) {
      console.error('❌ Erreur création utilisateur local:', error);
      throw error;
    }
  }

  // Récupérer un utilisateur (Supabase ou AsyncStorage)
  static async getUserByDeviceId(deviceId) {
    try {
      console.log('🔍 Recherche utilisateur par deviceId:', deviceId);

      // 1. Essayer Supabase d'abord
      try {
        const { data: user, error } = await supabase
          .from('users')
          .select(`
            *,
            onboarding_responses(*),
            notification_settings(*),
            app_settings(*),
            user_statistics(*)
          `)
          .eq('device_id', deviceId)
          .single();

        if (!error && user) {
          console.log('✅ Utilisateur trouvé dans Supabase:', user.id);
          
          // Synchroniser avec AsyncStorage
          await this.syncUserToLocal(user);
          
          return {
            success: true,
            user: this.formatSupabaseUser(user),
            source: 'supabase'
          };
        }
      } catch (supabaseError) {
        console.log('⚠️ Erreur recherche Supabase, essai AsyncStorage:', supabaseError);
      }

      // 2. Fallback vers AsyncStorage
      try {
        const AsyncStorage = await import('@react-native-async-storage/async-storage').then(module => module.default);
        const profileData = await AsyncStorage.getItem('@habitus_user_profile');
        
        if (profileData) {
          const profile = JSON.parse(profileData);
          console.log('✅ Utilisateur trouvé en AsyncStorage');
          
          // Tenter sync en arrière-plan si possible
          this.attemptBackgroundSync(profile);
          
          return {
            success: true,
            user: profile,
            source: 'localStorage'
          };
        }
      } catch (localError) {
        console.log('⚠️ Erreur lecture AsyncStorage:', localError);
      }

      console.log('❌ Aucun utilisateur trouvé');
      return {
        success: false,
        error: 'Utilisateur non trouvé'
      };

    } catch (error) {
      console.error('❌ Erreur récupération utilisateur:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Formater un utilisateur Supabase pour l'usage local
  static formatSupabaseUser(supabaseUser) {
    return {
      id: supabaseUser.id,
      supabaseId: supabaseUser.id,
      deviceId: supabaseUser.device_id,
      firstName: supabaseUser.first_name,
      level: supabaseUser.level,
      xp: supabaseUser.xp,
      currentStreak: supabaseUser.current_streak,
      isPremium: supabaseUser.is_premium,
      createdAt: supabaseUser.created_at,
      lastLoginAt: supabaseUser.last_login_at,
      
      // Données liées
      onboardingData: supabaseUser.onboarding_responses?.[0] || null,
      notificationSettings: supabaseUser.notification_settings?.[0] || null,
      appSettings: supabaseUser.app_settings?.[0] || null,
      statistics: supabaseUser.user_statistics?.[0] || null,
      
      // Métadonnées
      isLocal: false,
      needsSync: false,
      lastSync: new Date().toISOString()
    };
  }

  // Synchroniser un utilisateur Supabase vers AsyncStorage
  static async syncUserToLocal(supabaseUser) {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage').then(module => module.default);
      const formattedUser = this.formatSupabaseUser(supabaseUser);
      
      await AsyncStorage.setItem(
        '@habitus_user_profile',
        JSON.stringify(formattedUser)
      );
      
      console.log('✅ Utilisateur synchronisé vers AsyncStorage');
    } catch (error) {
      console.error('❌ Erreur sync vers local:', error);
    }
  }

  // Tenter une sync en arrière-plan
  static async attemptBackgroundSync(localUser) {
    try {
      if (!localUser.needsSync) return;
      
      console.log('🔄 Tentative sync arrière-plan...');
      
      // Charger les services si disponibles
      await lazyImports();
      
      if (NetworkDiagnosticService) {
        const diagnostic = await NetworkDiagnosticService.testSupabaseConnection();
        if (diagnostic.success && FallbackStorageService) {
          console.log('🔄 Réseau disponible, traitement queue sync...');
          await FallbackStorageService.processSyncQueue();
        }
      }
    } catch (error) {
      console.log('⚠️ Sync arrière-plan échouée:', error);
    }
  }

  // Vérifier si l'onboarding a été fait pour un device
  static async isOnboardingCompleted(deviceId) {
    try {
      const result = await this.getUserByDeviceId(deviceId);
      return result.success && result.user !== null;
    } catch (error) {
      console.error('Erreur vérification onboarding:', error);
      return false;
    }
  }

  // Calculer le niveau initial basé sur les réponses
  static calculateInitialLevel(currentLevel, targetLevel) {
    const levelMapping = {
      'c_player': 1,
      'b_player': 2,
      'a_player': 3,
      's_player': 4
    };

    const current = levelMapping[currentLevel] || 1;
    const target = levelMapping[targetLevel] || 3;
    
    // Niveau initial = moyenne entre current et target, minimum 1
    return Math.max(1, Math.floor((current + target) / 2));
  }

  // Créer les paramètres par défaut (Supabase)
  static async createDefaultSettings(userId) {
    try {
      // Paramètres de notifications
      await supabase.from('notification_settings').insert([{
        user_id: userId,
        notifications_enabled: true,
        daily_reminder: true,
        weekly_report: false,
        objective_reminders: true,
        celebration_notifications: true,
        daily_reminder_time: '09:00:00',
        weekly_report_day: 7
      }]);

      // Paramètres de l'app
      await supabase.from('app_settings').insert([{
        user_id: userId,
        dark_mode: true,
        haptic_feedback: true,
        language: 'fr',
        analytics_tracking: true,
        auto_backup: false
      }]);

      console.log('⚙️ Paramètres par défaut créés');
    } catch (error) {
      console.error('Erreur création paramètres:', error);
    }
  }

  // Créer les statistiques initiales (Supabase)
  static async createInitialStats(userId) {
    try {
      await supabase.from('user_statistics').insert([{
        user_id: userId,
        total_login_days: 1,
        total_tasks_completed: 0,
        total_objectives_completed: 0,
        average_daily_score: 0,
        best_streak: 0,
        member_since: new Date().toISOString().split('T')[0]
      }]);

      console.log('📊 Statistiques initiales créées');
    } catch (error) {
      console.error('Erreur création stats:', error);
    }
  }

  // Créer la MIT initiale depuis l'onboarding (Supabase)
  static async createInitialMIT(userId, mitText) {
    try {
      const { data, error } = await supabase
        .from('mits')
        .insert([{
          user_id: userId,
          text: mitText,
          priority: 'high',
          estimated_time: '60min',
          is_recurring: true,
          start_date: new Date().toISOString().split('T')[0],
          end_date: null,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;
      
      console.log('🎯 MIT initiale créée:', data);
      return data;
    } catch (error) {
      console.error('Erreur création MIT initiale:', error);
    }
  }

  // Créer la MET initiale depuis l'onboarding (Supabase)
  static async createInitialMET(userId, metText) {
    try {
      const { data, error } = await supabase
        .from('mets')
        .insert([{
          user_id: userId,
          text: metText,
          is_recurring: true,
          start_date: new Date().toISOString().split('T')[0],
          end_date: null,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;
      
      console.log('🚫 MET initiale créée:', data);
      return data;
    } catch (error) {
      console.error('Erreur création MET initiale:', error);
    }
  }
}
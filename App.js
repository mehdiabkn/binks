  import React, { useState, useEffect } from 'react';
  import {
    StatusBar,
  } from 'react-native';
  import AsyncStorage from '@react-native-async-storage/async-storage';

  // ✅ IMPORTANT: Importer i18n AVANT tout le reste
  import './i18n';

  // ✅ NOUVEAU: Import manquant pour Supabase direct
  import { OnboardingService } from './services/onboardingService';
  import { UserService } from './services/userService';
  import { supabase } from './services/supabase';

  // ✅ Services existants
  import { initPurchases, checkPremiumStatus, getCustomerInfo, isPremium } from './services/revenuecat';
  import { getDeviceId } from './services/identity';

  import WelcomePage from './screens/WelcomePage';
  import OnboardingScreen from './screens/OnboardingScreen';
  import WelcomeToDashboard from './screens/WelcomeToDashboard';
  import MainNavigator from './screens/MainNavigator';

  // ✅ NOUVEAU: Clés pour AsyncStorage (fallback uniquement)
  const STORAGE_KEYS = {
    FALLBACK_MODE: '@habitus_fallback_mode',
    ONBOARDING_COMPLETED: '@habitus_onboarding_completed',
    USER_PROFILE: '@habitus_user_profile',
    ONBOARDING_DATA: '@habitus_onboarding_data',
  };

  export default function App() {
    const [currentScreen, setCurrentScreen] = useState('loading');
    const [onboardingData, setOnboardingData] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isI18nInitialized, setIsI18nInitialized] = useState(false);
    const [isAppReady, setIsAppReady] = useState(false);
    
    // ✅ États RevenueCat
    const [isPremiumUser, setIsPremiumUser] = useState(false);
    const [isRevenueCatReady, setIsRevenueCatReady] = useState(false);
    const [deviceId, setDeviceId] = useState(null);

    // ✅ NOUVEAU: États Supabase
    const [isSupabaseMode, setIsSupabaseMode] = useState(true);
    const [supabaseError, setSupabaseError] = useState(null);

    // ✅ MODIFIÉ: Initialisation avec Supabase en priorité
    useEffect(() => {
      const initializeApp = async () => {
        try {
          console.log('🔄 Initialisation de l\'app...');

          // 1. Initialiser l'identité (deviceId)
          const id = await getDeviceId();
          setDeviceId(id);
          console.log('🆔 Device ID:', id);

          // 2. Initialiser RevenueCat (TEMPORAIREMENT DÉSACTIVÉ)
          setIsRevenueCatReady(false);
          setIsPremiumUser(false);
          console.log('⚠️ RevenueCat temporairement désactivé');

          // 3. Attendre l'initialisation i18n
          await new Promise(resolve => setTimeout(resolve, 200));
          console.log('🌍 i18n initialisé');
          setIsI18nInitialized(true);

          // 4. ✅ NOUVEAU: Vérifier l'utilisateur via Supabase d'abord
          await checkUserStatusWithSupabase(id);

        } catch (error) {
          console.error('❌ Erreur initialisation app:', error);
          setCurrentScreen('welcome');
        } finally {
          setIsAppReady(true);
          console.log('✅ App prête');
        }
      };

      initializeApp();
    }, []);

    // ✅ NOUVEAU: Fonction pour vérifier l'utilisateur via Supabase
// ✅ NOUVEAU: Fonction pour vérifier l'utilisateur via Supabase (VERSION SIMPLIFIÉE)
const checkUserStatusWithSupabase = async (deviceId) => {
  try {
    console.log('🔍 Vérification utilisateur Supabase...');
    
    // TEST SIMPLE D'ABORD : juste vérifier la connexion
    const { data: testConnection, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      throw new Error(`Erreur connexion Supabase: ${connectionError.message}`);
    }
    
    console.log('✅ Connexion Supabase OK');
    
    // Ensuite, essayer de récupérer l'utilisateur (requête simple)
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, device_id, first_name, level, xp, current_streak, is_premium, created_at')
      .eq('device_id', deviceId)
      .limit(1);
    
    if (userError) {
      throw new Error(`Erreur requête utilisateur: ${userError.message}`);
    }
    
    if (users && users.length > 0) {
      const user = users[0];
      
      // ✅ Utilisateur existant trouvé dans Supabase
      console.log('👤 Utilisateur existant trouvé dans Supabase:', user.first_name);
      
      const userProfile = {
        deviceId: deviceId,
        appleId: `apple_${deviceId}`, // Valeur par défaut
        firstName: user.first_name,
        isPremium: user.is_premium || isPremiumUser,
        level: user.level,
        xp: user.xp,
        streak: user.current_streak,
        createdAt: user.created_at,
        lastLoginAt: new Date().toISOString(),
        // Données Supabase
        supabaseId: user.id,
        onboardingData: null // On récupérera plus tard si nécessaire
      };

      setUserProfile(userProfile);
      setOnboardingData(null); // Pour l'instant, on laisse vide
      setIsSupabaseMode(true);
      setCurrentScreen('main_app');
      
      // Analytics
      trackEvent('app_opened_existing_user_supabase', {
        user_id: deviceId,
        supabase_id: user.id,
        is_premium: user.is_premium,
        last_opened: new Date().toISOString()
      });

      // ✅ NOUVEAU: Mettre à jour le last_login_at dans Supabase
      await updateLastLogin(user.id);
      
    } else {
      // ❌ Utilisateur non trouvé dans Supabase, vérifier AsyncStorage comme fallback
      console.log('👻 Utilisateur non trouvé dans Supabase, vérification AsyncStorage...');
      await checkUserStatusWithAsyncStorage(deviceId);
    }
    
  } catch (error) {
    console.error('❌ Erreur Supabase, fallback vers AsyncStorage:', error);
    setSupabaseError(error.message);
    setIsSupabaseMode(false);
    
    // Fallback vers AsyncStorage
    await checkUserStatusWithAsyncStorage(deviceId);
  }
};

    // ✅ MODIFIÉ: Fonction fallback AsyncStorage (code existant)
    const checkUserStatusWithAsyncStorage = async (deviceId) => {
      try {
        console.log('💾 Mode fallback AsyncStorage...');
        
        const onboardingCompleted = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
        const storedUserProfile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        const storedOnboardingData = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DATA);

        console.log('📱 Statut AsyncStorage:');
        console.log('- Onboarding completed:', onboardingCompleted);
        console.log('- User profile exists:', !!storedUserProfile);

        if (onboardingCompleted === 'true' && storedUserProfile) {
          // ✅ Utilisateur existant en AsyncStorage
          console.log('👤 Utilisateur existant détecté en AsyncStorage');
          
          const parsedProfile = JSON.parse(storedUserProfile);
          const parsedOnboardingData = storedOnboardingData ? JSON.parse(storedOnboardingData) : null;
          
          // Ajouter les infos manquantes
          parsedProfile.deviceId = deviceId;
          parsedProfile.isPremium = isPremiumUser;
          
          setUserProfile(parsedProfile);
          setOnboardingData(parsedOnboardingData);
          setIsSupabaseMode(false);
          setCurrentScreen('main_app');
          
          // Analytics
          trackEvent('app_opened_existing_user_asyncstorage', {
            user_id: deviceId,
            is_premium: isPremiumUser,
            last_opened: new Date().toISOString()
          });
        } else {
          // ✅ Nouvel utilisateur
          console.log('🆕 Nouvel utilisateur détecté');
          setCurrentScreen('welcome');
          
          // Analytics
          trackEvent('app_opened_new_user', {
            device_id: deviceId,
            timestamp: new Date().toISOString()
          });
        }
        
      } catch (error) {
        console.error('❌ Erreur AsyncStorage fallback:', error);
        setCurrentScreen('welcome');
      }
    };

    // ✅ NOUVEAU: Mettre à jour le last_login_at dans Supabase
    const updateLastLogin = async (supabaseUserId) => {
      try {
        await supabase
          .from('users')
          .update({ 
            last_login_at: new Date().toISOString() 
          })
          .eq('id', supabaseUserId);
        
        console.log('✅ Last login mis à jour');
      } catch (error) {
        console.error('⚠️ Erreur mise à jour last login:', error);
        // Non critique, on continue
      }
    };

    // ✅ Listener pour les changements de statut premium (code existant)
    useEffect(() => {
      if (!isRevenueCatReady) return;

      import('react-native-purchases').then(({ default: Purchases }) => {
        const listener = Purchases.addCustomerInfoUpdateListener((customerInfo) => {
          const newPremiumStatus = isPremium(customerInfo);
          console.log('🔄 Statut premium mis à jour:', newPremiumStatus);
          setIsPremiumUser(newPremiumStatus);
          
          if (userProfile) {
            const updatedProfile = { ...userProfile, isPremium: newPremiumStatus };
            setUserProfile(updatedProfile);
            
            // ✅ NOUVEAU: Sauvegarder dans Supabase si disponible
            if (isSupabaseMode && userProfile.supabaseId) {
              updatePremiumStatusInSupabase(userProfile.supabaseId, newPremiumStatus);
            } else {
              // Fallback AsyncStorage
              saveToStorage(STORAGE_KEYS.USER_PROFILE, updatedProfile);
            }
          }
        });

        return () => {
          if (listener && typeof listener.remove === 'function') {
            listener.remove();
          }
        };
      });
    }, [isRevenueCatReady, userProfile, isSupabaseMode]);

    // ✅ NOUVEAU: Mettre à jour le statut premium dans Supabase
    const updatePremiumStatusInSupabase = async (supabaseUserId, isPremium) => {
      try {
        await supabase
          .from('users')
          .update({ 
            is_premium: isPremium,
            premium_updated_at: new Date().toISOString()
          })
          .eq('id', supabaseUserId);
        
        console.log('✅ Statut premium mis à jour dans Supabase');
      } catch (error) {
        console.error('⚠️ Erreur mise à jour premium Supabase:', error);
      }
    };

    // ✅ Fonction utilitaire AsyncStorage (pour fallback)
    const saveToStorage = async (key, data) => {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(data));
        console.log(`💾 Sauvegardé ${key} (AsyncStorage fallback)`);
      } catch (error) {
        console.error(`❌ Erreur sauvegarde ${key}:`, error);
      }
    };

    // ✅ Handlers existants (à modifier dans les prochaines étapes)
    const handleStartQuiz = () => {
      console.log('🎯 Quiz démarré par', getCurrentUser());
      
      trackEvent('quiz_started', {
        source: 'welcome_page',
        device_id: deviceId,
        supabase_mode: isSupabaseMode,
        timestamp: new Date().toISOString()
      });
      
      setCurrentScreen('onboarding');
    };

    const handleOnboardingComplete = async (answers) => {
      console.log('📝 Onboarding terminé:', answers);
      
      setOnboardingData(answers);
      
      // ✅ NOUVEAU: Sauvegarder dans Supabase + fallback AsyncStorage
      try {
        if (isSupabaseMode) {
          console.log('💾 Sauvegarde onboarding dans Supabase...');
          
          // Créer un fake Apple ID pour simuler la connexion
          const fakeAppleSignInData = {
            user: `apple_${deviceId}_${Date.now()}`,
            email: null,
            fullName: { givenName: answers[1] || 'Champion', familyName: null },
            isPremium: isPremiumUser
          };
          
          const result = await OnboardingService.createUserFromOnboarding(answers, fakeAppleSignInData);
          
          if (result.success) {
            console.log('✅ Utilisateur créé dans Supabase:', result.user);
            
            // Mettre à jour le state avec les données Supabase
            const supabaseProfile = {
              deviceId: deviceId,
              appleId: fakeAppleSignInData.user,
              firstName: result.user.first_name,
              isPremium: result.user.is_premium || isPremiumUser,
              level: result.user.level,
              xp: result.user.xp,
              streak: result.user.current_streak,
              createdAt: result.user.created_at,
              lastLoginAt: result.user.last_login_at,
              supabaseId: result.user.id,
              onboardingData: answers
            };
            
            setUserProfile(supabaseProfile);
            
            trackEvent('onboarding_completed_supabase', {
              answers_count: Object.keys(answers).length,
              device_id: deviceId,
              supabase_id: result.user.id,
              fake_apple_id: fakeAppleSignInData.user,
              timestamp: new Date().toISOString()
            });
            
          } else {
            throw new Error(result.error || 'Erreur création utilisateur Supabase');
          }
          
        } else {
          // Fallback AsyncStorage si Supabase non disponible
          console.log('💾 Sauvegarde onboarding en AsyncStorage (fallback)...');
          await saveToStorage(STORAGE_KEYS.ONBOARDING_DATA, answers);
          
          trackEvent('onboarding_completed_asyncstorage', {
            answers_count: Object.keys(answers).length,
            device_id: deviceId,
            fallback_reason: supabaseError || 'supabase_disabled',
            timestamp: new Date().toISOString()
          });
        }
        
      } catch (error) {
        console.error('❌ Erreur sauvegarde onboarding Supabase, fallback AsyncStorage:', error);
        
        // Fallback vers AsyncStorage en cas d'erreur
        setIsSupabaseMode(false);
        setSupabaseError(error.message);
        await saveToStorage(STORAGE_KEYS.ONBOARDING_DATA, answers);
        
        trackEvent('onboarding_completed_fallback', {
          answers_count: Object.keys(answers).length,
          device_id: deviceId,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log('🎉 Redirection vers félicitations');
      setCurrentScreen('welcome_to_dashboard');
    };

    const handleReturnToWelcome = () => {
      console.log('🔙 Retour vers WelcomeScreen depuis onboarding');
      
      trackEvent('onboarding_back_to_welcome', {
        current_screen: currentScreen,
        device_id: deviceId,
        supabase_mode: isSupabaseMode,
        timestamp: new Date().toISOString()
      });
      
      setCurrentScreen('welcome');
    };

    const handleWelcomeToDashboardComplete = async () => {
      console.log('🏠 Passage au Dashboard');
      
      // ✅ NOUVEAU: Différencier selon le mode (Supabase vs AsyncStorage)
      try {
        if (isSupabaseMode && userProfile?.supabaseId) {
          // ✅ Mode Supabase : L'utilisateur a déjà été créé dans handleOnboardingComplete
          console.log('✅ Utilisateur Supabase déjà créé, passage au dashboard...');
          
          // Mettre à jour seulement le last_login_at
          await updateLastLogin(userProfile.supabaseId);
          
          trackEvent('dashboard_entered_supabase', {
            firstName: userProfile.firstName,
            device_id: deviceId,
            supabase_id: userProfile.supabaseId,
            is_premium: isPremiumUser,
            timestamp: new Date().toISOString()
          });
          
        } else {
          // ✅ Mode AsyncStorage : Créer le profil comme avant
          console.log('💾 Création profil AsyncStorage...');
          
          const completeProfile = {
            deviceId: deviceId,
            appleId: deviceId,
            firstName: onboardingData?.[1] || 'Champion',
            onboardingData: onboardingData,
            isPremium: isPremiumUser,
            createdAt: new Date().toISOString(),
            level: 1,
            xp: 0,
            streak: 0,
            lastLoginAt: new Date().toISOString()
          };
          
          setUserProfile(completeProfile);
          
          await saveToStorage(STORAGE_KEYS.USER_PROFILE, completeProfile);
          await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
          
          console.log('💾 Données utilisateur sauvegardées en AsyncStorage');
          
          trackEvent('dashboard_entered_asyncstorage', {
            firstName: completeProfile.firstName,
            device_id: deviceId,
            is_premium: isPremiumUser,
            fallback_reason: supabaseError || 'supabase_disabled',
            timestamp: new Date().toISOString()
          });
        }
        
      } catch (error) {
        console.error('❌ Erreur passage dashboard:', error);
        
        // En cas d'erreur, créer quand même un profil basique pour continuer
        const emergencyProfile = {
          deviceId: deviceId,
          appleId: deviceId,
          firstName: onboardingData?.[1] || 'Champion',
          onboardingData: onboardingData,
          isPremium: isPremiumUser,
          createdAt: new Date().toISOString(),
          level: 1,
          xp: 0,
          streak: 0,
          lastLoginAt: new Date().toISOString()
        };
        
        setUserProfile(emergencyProfile);
        
        trackEvent('dashboard_entered_emergency', {
          device_id: deviceId,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log('🏠 Navigation vers Main App');
      setCurrentScreen('main_app');
    };

    const handleSubscriptionSuccess = async (packagePurchased = null) => {
      console.log('🎉 Abonnement réussi!', packagePurchased?.identifier);
      
      setIsPremiumUser(true);
      
      if (userProfile) {
        const updatedProfile = { 
          ...userProfile, 
          isPremium: true,
          subscriptionDate: new Date().toISOString(),
          packagePurchased: packagePurchased?.identifier
        };
        setUserProfile(updatedProfile);
        
        // ✅ NOUVEAU: Sauvegarder dans Supabase ou AsyncStorage selon le mode
        try {
          if (isSupabaseMode && userProfile.supabaseId) {
            console.log('💳 Mise à jour premium dans Supabase...');
            
            await supabase
              .from('users')
              .update({ 
                is_premium: true,
                premium_updated_at: new Date().toISOString(),
                subscription_package: packagePurchased?.identifier || null
              })
              .eq('id', userProfile.supabaseId);
            
            console.log('✅ Statut premium mis à jour dans Supabase');
            
            trackEvent('subscription_success_supabase', {
              device_id: deviceId,
              supabase_id: userProfile.supabaseId,
              package: packagePurchased?.identifier,
              timestamp: new Date().toISOString()
            });
            
          } else {
            // Fallback AsyncStorage
            console.log('💳 Mise à jour premium dans AsyncStorage...');
            await saveToStorage(STORAGE_KEYS.USER_PROFILE, updatedProfile);
            
            trackEvent('subscription_success_asyncstorage', {
              device_id: deviceId,
              package: packagePurchased?.identifier,
              fallback_reason: supabaseError || 'supabase_disabled',
              timestamp: new Date().toISOString()
            });
          }
          
        } catch (error) {
          console.error('❌ Erreur mise à jour premium:', error);
          
          // Fallback vers AsyncStorage en cas d'erreur Supabase
          await saveToStorage(STORAGE_KEYS.USER_PROFILE, updatedProfile);
          
          trackEvent('subscription_success_fallback', {
            device_id: deviceId,
            package: packagePurchased?.identifier,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    };

    const handleBackToWelcome = () => {
      console.log('🔙 Retour aux félicitations');
      setCurrentScreen('welcome_to_dashboard');
    };

    const handleResetApp = async () => {
      try {
        console.log('🔄 Réinitialisation de l\'app...');
        
        // ✅ NOUVEAU: Reset Supabase + AsyncStorage
        if (isSupabaseMode && userProfile?.supabaseId) {
          console.log('🗑️ Suppression utilisateur Supabase...');
          
          try {
            // Supprimer l'utilisateur et toutes ses données liées (cascade)
            const { error } = await supabase
              .from('users')
              .delete()
              .eq('id', userProfile.supabaseId);
            
            if (error) {
              console.error('⚠️ Erreur suppression Supabase:', error);
              // Continuer quand même avec le reset local
            } else {
              console.log('✅ Utilisateur supprimé de Supabase');
            }
            
            trackEvent('app_reset_supabase', {
              device_id: deviceId,
              supabase_id: userProfile.supabaseId,
              timestamp: new Date().toISOString()
            });
            
          } catch (error) {
            console.error('❌ Erreur suppression Supabase:', error);
            
            trackEvent('app_reset_supabase_error', {
              device_id: deviceId,
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        // Reset AsyncStorage (pour nettoyer les données locales et fallback)
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.ONBOARDING_COMPLETED,
          STORAGE_KEYS.USER_PROFILE,
          STORAGE_KEYS.ONBOARDING_DATA,
          STORAGE_KEYS.FALLBACK_MODE
        ]);
        
        console.log('✅ AsyncStorage nettoyé');
        
        // Reset des states
        setUserProfile(null);
        setOnboardingData(null);
        setIsSupabaseMode(true); // Réactiver Supabase pour le prochain onboarding
        setSupabaseError(null);
        setCurrentScreen('welcome');
        
        trackEvent('app_reset_complete', {
          device_id: deviceId,
          timestamp: new Date().toISOString()
        });
        
        console.log('🔄 App complètement réinitialisée');
        
      } catch (error) {
        console.error('❌ Erreur reset app:', error);
        
        // Reset minimal en cas d'erreur
        setUserProfile(null);
        setOnboardingData(null);
        setCurrentScreen('welcome');
        
        trackEvent('app_reset_partial', {
          device_id: deviceId,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Helper functions
    const getCurrentUser = () => {
      return deviceId || userProfile?.deviceId || 'unknown_device';
    };

    const trackEvent = (eventName, properties) => {
      console.log('📊 Event:', eventName, properties);
      // TODO: Intégrer avec Mixpanel, Amplitude, etc.
    };

    const renderScreen = () => {
      if (!isAppReady || !isI18nInitialized) {
        return null; // ou un écran de chargement personnalisé
      }

      // ✅ NOUVEAU: Afficher les erreurs Supabase si nécessaire
      if (supabaseError && !isSupabaseMode) {
        console.log('⚠️ Mode fallback activé:', supabaseError);
      }

      switch (currentScreen) {
        case 'welcome':
          return (
            <WelcomePage 
              onStartQuiz={handleStartQuiz} 
            />
          );
        
        case 'onboarding':
          return (
            <OnboardingScreen 
              onComplete={handleOnboardingComplete}
              onReturnToWelcome={handleReturnToWelcome}
            />
          );
        
        case 'welcome_to_dashboard':
          return (
            <WelcomeToDashboard
              onComplete={handleWelcomeToDashboardComplete}
              onboardingData={onboardingData}
            />
          );
        
        case 'main_app':
          return (
            <MainNavigator
              userProfile={userProfile}
              isPremium={isPremiumUser}
              deviceId={deviceId}
              isSupabaseMode={isSupabaseMode} // ✅ NOUVEAU
              supabaseError={supabaseError} // ✅ NOUVEAU
              onSubscriptionSuccess={handleSubscriptionSuccess}
              onResetApp={handleResetApp}
            />
          );
        
        default:
          return (
            <WelcomePage 
              onStartQuiz={handleStartQuiz} 
            />
          );
      }
    };

    return (
      <>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor="transparent" 
          translucent 
          hidden={false}
        />
        {renderScreen()}
      </>
    );
  }
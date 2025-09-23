import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import HapticFeedback from 'react-native-haptic-feedback';

// Services
import { supabase } from '../services/supabase';
import { StatisticsService } from '../services/statisticsService';
import { RatingService } from '../services/ratingService';
import { FallbackStorageService } from '../services/fallbackStorageService';
import { NetworkDiagnosticService } from '../services/networkDiagnosticService';
import { OnboardingService } from '../services/onboardingService';
import { getDeviceId } from '../services/identity';

// Import des composants modulaires
import ProfileHeader from '../components/Settings/ProfileHeader';
import StatsCardsSection from '../components/Settings/StatsCardsSection';
import NotificationSettings from '../components/Settings/NotificationSettings';
import AppSettings from '../components/Settings/AppSettings';
import ActionsSection from '../components/Settings/ActionsSection';
import AboutSection from '../components/Settings/AboutSection';
import DangerZone from '../components/Settings/DangerZone';
import LevelModal from '../components/Settings/LevelModal';
import StreakModal from '../components/Settings/StreakModal';
import LanguageSelector from '../components/LanguageSelector';

const { width, height } = Dimensions.get('window');

export default function SettingsScreen({ userProfile: propUserProfile, onResetApp, isPremium }) {
  const { t } = useTranslation();
  
  // États pour les données
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(propUserProfile);
  const [userStats, setUserStats] = useState(null);
  const [dataSource, setDataSource] = useState('unknown'); // 'supabase', 'localStorage', 'props'
  
  // États pour les paramètres
  const [settings, setSettings] = useState({
    notifications: true,
    dailyReminder: true,
    weeklyReport: false,
    darkMode: true,
    hapticFeedback: true,
    analyticsTracking: true,
    autoBackup: false,
  });

  // États pour les modales
  const [isLevelModalVisible, setIsLevelModalVisible] = useState(false);
  const [isStreakModalVisible, setIsStreakModalVisible] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Charger les données utilisateur au montage
  useEffect(() => {
    loadUserData();
  }, []);

  // Fonction principale pour charger les données utilisateur
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Chargement données utilisateur...');
      console.log('Props userProfile reçu:', propUserProfile);

      let finalUserProfile = null;
      let finalDataSource = 'unknown';

      // 1. Essayer d'abord avec les props si elles contiennent un ID
      if (propUserProfile && (propUserProfile.supabaseId || propUserProfile.id || propUserProfile.localId)) {
        console.log('✅ UserProfile trouvé dans les props');
        finalUserProfile = propUserProfile;
        finalDataSource = 'props';
      } 
      // 2. Sinon, chercher par deviceId
      else {
        console.log('🔍 Recherche utilisateur par deviceId...');
        const deviceId = await getDeviceId();
        const userResult = await OnboardingService.getUserByDeviceId(deviceId);
        
        if (userResult.success && userResult.user) {
          console.log('✅ Utilisateur trouvé par deviceId:', userResult.source);
          finalUserProfile = userResult.user;
          finalDataSource = userResult.source;
        } else {
          throw new Error('Aucun utilisateur trouvé');
        }
      }

      // 3. Mettre à jour l'état
      setUserProfile(finalUserProfile);
      setDataSource(finalDataSource);

      // 4. Charger les paramètres en fonction de la source
      await loadUserSettings(finalUserProfile, finalDataSource);

      console.log('✅ Données utilisateur chargées avec succès');

    } catch (error) {
      console.error('❌ Erreur chargement données utilisateur:', error);
      setError(t('settings.errors.userNotFound') + ': ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les paramètres utilisateur selon la source
  const loadUserSettings = async (userProfile, source) => {
    try {
      console.log('⚙️ Chargement paramètres...', { source, userId: userProfile.id || userProfile.supabaseId });

      if (source === 'supabase' || source === 'props') {
        // Charger depuis Supabase
        await loadSettingsFromSupabase(userProfile.supabaseId || userProfile.id);
      } else if (source === 'localStorage') {
        // Charger depuis AsyncStorage
        await loadSettingsFromAsyncStorage();
      }

      // Charger les statistiques
      await loadUserStatistics(userProfile, source);

    } catch (error) {
      console.error('❌ Erreur chargement paramètres:', error);
      // Pas critique, on continue avec les valeurs par défaut
    }
  };

  // Charger les paramètres depuis Supabase
  const loadSettingsFromSupabase = async (userId) => {
    try {
      console.log('📡 Chargement paramètres Supabase...', userId);

      const [notifResult, appResult] = await Promise.all([
        loadNotificationSettings(userId),
        loadAppSettings(userId)
      ]);

      updateLocalSettings(notifResult, appResult);
      console.log('✅ Paramètres Supabase chargés');

    } catch (error) {
      console.error('❌ Erreur paramètres Supabase:', error);
      // Fallback vers AsyncStorage
      await loadSettingsFromAsyncStorage();
    }
  };

  // Charger les paramètres depuis AsyncStorage
  const loadSettingsFromAsyncStorage = async () => {
    try {
      console.log('💾 Chargement paramètres AsyncStorage...');

      const settingsResult = await FallbackStorageService.getUserSettings();
      
      if (settingsResult.success) {
        const loadedSettings = settingsResult.settings;
        setSettings({
          notifications: loadedSettings.notifications ?? true,
          dailyReminder: loadedSettings.dailyReminder ?? true,
          weeklyReport: loadedSettings.weeklyReport ?? false,
          darkMode: loadedSettings.darkMode ?? true,
          hapticFeedback: loadedSettings.hapticFeedback ?? true,
          analyticsTracking: loadedSettings.analyticsTracking ?? true,
          autoBackup: loadedSettings.autoBackup ?? false,
        });
        console.log('✅ Paramètres AsyncStorage chargés');
      }

    } catch (error) {
      console.error('❌ Erreur paramètres AsyncStorage:', error);
      // Garder les valeurs par défaut
    }
  };

  // Charger les statistiques utilisateur
  const loadUserStatistics = async (userProfile, source) => {
    try {
      console.log('📊 Chargement statistiques...', { source });

      if (source === 'supabase' || source === 'props') {
        // Essayer Supabase
        try {
          const statsResult = await StatisticsService.getCompleteStatistics(userProfile.supabaseId || userProfile.id);
          
          if (statsResult.success && statsResult.statistics) {
            const stats = statsResult.statistics;
            setUserStats({
              memberSince: stats.member_since ? new Date(stats.member_since).toLocaleDateString('fr-FR') : t('settings.stats.recently'),
              totalLoginDays: stats.total_login_days || 0,
              totalTasksCompleted: stats.total_tasks_completed || 0,
              currentStreak: stats.currentStreak || userProfile.currentStreak || 0,
              bestStreak: stats.best_streak || 0,
              averageScore: Math.round(stats.average_daily_score || 0),
              favoriteCategory: stats.favorite_category || t('settings.stats.none'),
              totalObjectives: stats.objectives?.total || 0,
              completedObjectives: stats.objectives?.completed || 0,
              mitCompletionsLastMonth: stats.mitCompletionsLastMonth || 0,
              metChecksLastMonth: stats.metChecksLastMonth || 0,
            });
            console.log('✅ Statistiques Supabase chargées');
            return;
          }
        } catch (error) {
          console.log('⚠️ Échec Supabase, statistiques par défaut');
        }
      }

      // Statistiques par défaut ou depuis userProfile local
      setUserStats({
        memberSince: userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('fr-FR') : t('settings.stats.recently'),
        totalLoginDays: 1,
        totalTasksCompleted: 0,
        currentStreak: userProfile.currentStreak || 0,
        bestStreak: userProfile.currentStreak || 0,
        averageScore: 0,
        favoriteCategory: t('settings.stats.none'),
        totalObjectives: 0,
        completedObjectives: 0,
        mitCompletionsLastMonth: 0,
        metChecksLastMonth: 0,
      });
      console.log('✅ Statistiques par défaut définies');

    } catch (error) {
      console.error('❌ Erreur statistiques:', error);
    }
  };

  // Charger les paramètres de notifications depuis Supabase
  const loadNotificationSettings = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Erreur chargement paramètres notifications:', error);
      return null;
    }
  };

  // Charger les paramètres de l'app depuis Supabase
  const loadAppSettings = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Erreur chargement paramètres app:', error);
      return null;
    }
  };

  // Synchroniser les paramètres locaux
  const updateLocalSettings = (notifSettings, appSettings) => {
    setSettings(prev => ({
      ...prev,
      notifications: notifSettings?.notifications_enabled ?? prev.notifications,
      dailyReminder: notifSettings?.daily_reminder ?? prev.dailyReminder,
      weeklyReport: notifSettings?.weekly_report ?? prev.weeklyReport,
      darkMode: appSettings?.dark_mode ?? prev.darkMode,
      hapticFeedback: appSettings?.haptic_feedback ?? prev.hapticFeedback,
      analyticsTracking: appSettings?.analytics_tracking ?? prev.analyticsTracking,
      autoBackup: appSettings?.auto_backup ?? prev.autoBackup,
    }));
  };

  // Sauvegarder un paramètre
  const saveSettingToSupabase = async (key, value) => {
    const userId = userProfile?.supabaseId || userProfile?.id;
    
    if (!userId) {
      console.log('⚠️ Pas d\'ID Supabase, sauvegarde AsyncStorage uniquement');
      await saveSettingToAsyncStorage(key, value);
      return;
    }

    try {
      console.log('💾 Sauvegarde paramètre Supabase...', { key, value, userId });

      const notificationKeys = ['notifications', 'dailyReminder', 'weeklyReport'];
      const appKeys = ['darkMode', 'hapticFeedback', 'analyticsTracking', 'autoBackup'];

      if (notificationKeys.includes(key)) {
        const column = {
          notifications: 'notifications_enabled',
          dailyReminder: 'daily_reminder',
          weeklyReport: 'weekly_report'
        }[key];

        const { error } = await supabase
          .from('notification_settings')
          .update({
            [column]: value,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) throw error;

      } else if (appKeys.includes(key)) {
        const column = {
          darkMode: 'dark_mode',
          hapticFeedback: 'haptic_feedback',
          analyticsTracking: 'analytics_tracking',
          autoBackup: 'auto_backup'
        }[key];

        const { error } = await supabase
          .from('app_settings')
          .update({
            [column]: value,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) throw error;
      }

      console.log('✅ Paramètre sauvegardé dans Supabase');
      
      // Sauvegarder aussi en AsyncStorage comme backup
      await saveSettingToAsyncStorage(key, value);

    } catch (error) {
      console.error('❌ Erreur sauvegarde Supabase, fallback AsyncStorage:', error);
      await saveSettingToAsyncStorage(key, value);
      
      // Ajouter à la queue de sync
      await FallbackStorageService.addToSyncQueue({
        type: 'update_setting',
        key,
        value,
        userId,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Sauvegarder un paramètre en AsyncStorage
  const saveSettingToAsyncStorage = async (key, value) => {
    try {
      const currentSettings = await FallbackStorageService.getUserSettings();
      const updatedSettings = {
        ...(currentSettings.success ? currentSettings.settings : {}),
        [key]: value,
        updatedAt: new Date().toISOString()
      };

      await FallbackStorageService.saveUserSettings(updatedSettings);
      console.log('✅ Paramètre sauvegardé en AsyncStorage');

    } catch (error) {
      console.error('❌ Erreur sauvegarde AsyncStorage:', error);
      Alert.alert(t('common.error'), t('settings.errors.saveError'));
    }
  };

  // Animation d'entrée
  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading]);

  // Fonction de feedback haptique
  const triggerHapticFeedback = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger('selection', options);
  };

  // Toggle d'un paramètre
  const toggleSetting = async (key) => {
    triggerHapticFeedback();
    
    const newValue = !settings[key];
    
    // Mettre à jour localement immédiatement
    setSettings(prev => ({
      ...prev,
      [key]: newValue
    }));
    
    console.log(`⚙️ Paramètre ${key} changé:`, newValue);
    
    // Sauvegarder en arrière-plan
    await saveSettingToSupabase(key, newValue);
  };

  // Actions des boutons
  const handleAction = async (action) => {
    triggerHapticFeedback();
    
    switch (action) {
      case 'edit_profile':
        console.log('👤 Édition du profil');
        Alert.alert(t('settings.alerts.editProfile.title'), t('settings.alerts.editProfile.message'));
        break;
        
      case 'export_data':
        console.log('📊 Export des données');
        Alert.alert(
          t('settings.alerts.exportData.title'),
          t('settings.alerts.exportData.message'),
          [{ text: 'OK' }]
        );
        break;
        
      case 'contact_support':
        console.log('💬 Contact support');
        Alert.alert(
          t('settings.alerts.support.title'),
          t('settings.alerts.support.message'),
          [{ text: 'OK' }]
        );
        break;
        
      case 'rate_app':
        console.log('⭐ Noter l\'app');
        try {
          const result = await RatingService.showRatingAlert();
          console.log('Résultat rating:', result);
        } catch (error) {
          console.error('Erreur rating:', error);
          Alert.alert(
            t('settings.alerts.rateApp.title'),
            t('settings.alerts.rateApp.message'),
            [
              { text: t('settings.alerts.rateApp.later') },
              { text: t('settings.alerts.rateApp.rateNow') }
            ]
          );
        }
        break;
        
      case 'privacy_policy':
        console.log('🔒 Politique de confidentialité');
        Alert.alert(t('settings.alerts.privacy.title'), t('settings.alerts.privacy.message'));
        break;
        
      case 'terms':
        console.log('📋 Conditions d\'utilisation');
        Alert.alert(t('settings.alerts.terms.title'), t('settings.alerts.terms.message'));
        break;
        
      case 'reset_app':
        Alert.alert(
          t('settings.alerts.resetApp.title'),
          t('settings.alerts.resetApp.message'),
          [
            { text: t('settings.alerts.resetApp.cancel'), style: 'cancel' },
            { 
              text: t('settings.alerts.resetApp.reset'), 
              style: 'destructive',
              onPress: async () => {
                console.log('🔄 Réinitialisation app...');
                await FallbackStorageService.clearAllData();
                if (onResetApp) {
                  await onResetApp();
                }
              }
            }
          ]
        );
        break;
        
      default:
        console.log(`🔧 Action: ${action}`);
    }
  };

  // Calculer le multiplicateur de streak
  const getStreakMultiplier = (streak) => {
    if (streak >= 30) return 3.0;
    if (streak >= 21) return 2.5;
    if (streak >= 14) return 2.0;
    if (streak >= 7) return 1.5;
    if (streak >= 3) return 1.2;
    return 1.0;
  };

  // Handlers pour les modales
  const toggleLevelModal = () => {
    triggerHapticFeedback();
    setIsLevelModalVisible(!isLevelModalVisible);
  };

  const toggleStreakModal = () => {
    triggerHapticFeedback();
    setIsStreakModalVisible(!isStreakModalVisible);
  };

  // Données d'affichage
  const firstName = userProfile?.firstName || userProfile?.first_name || t('settings.defaultName');
  const currentLevel = userProfile?.level || 1;
  const currentXP = userProfile?.xp || 0;

  // Affichage de loading
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>{t('settings.loading')}</Text>
      </View>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text style={styles.errorTitle}>⚙️❌</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.debugInfo}>Source: {dataSource}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserData}>
          <Text style={styles.retryButtonText}>{t('settings.error.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Header avec profil */}
      <ProfileHeader
        firstName={firstName}
        currentLevel={currentLevel}
        currentXP={currentXP}
        memberSince={userStats?.memberSince || t('settings.stats.recently')}
        isPremium={isPremium || userProfile?.isPremium}
        onEditProfile={() => handleAction('edit_profile')}
        onLevelPress={toggleLevelModal}
      />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Badge de statut de données */}
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            📡 {dataSource === 'supabase' ? 'En ligne' : dataSource === 'localStorage' ? 'Hors ligne' : 'Local'}
          </Text>
        </View>

        {/* Section des cartes de statistiques */}
        {userStats && (
          <StatsCardsSection
            userStats={userStats}
            onStreakPress={toggleStreakModal}
          />
        )}

        {/* Paramètres de notifications */}
        <NotificationSettings
          settings={settings}
          onToggleSetting={toggleSetting}
        />

        {/* Paramètres de l'app */}
        <AppSettings
          settings={settings}
          onToggleSetting={toggleSetting}
        />

        {/* Section Langue */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('settings.language.title')}</Text>
          </View>
          
          <View style={styles.settingCard}>
            <View style={styles.languageRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('settings.language.interface.label')}</Text>
                <Text style={styles.settingDescription}>
                  {t('settings.language.interface.description')}
                </Text>
              </View>
              
              <LanguageSelector 
                size="medium"
                showFlag={true}
                showText={true}
                style={styles.languageSelectorButton}
              />
            </View>
          </View>
        </View>

        {/* Actions utilisateur */}
        <ActionsSection onAction={handleAction} />

        {/* À propos */}
        <AboutSection onAction={handleAction} />

        {/* Zone de danger */}
        <DangerZone onAction={handleAction} />
      </ScrollView>

      {/* Modales */}
      <LevelModal
        isVisible={isLevelModalVisible}
        onClose={toggleLevelModal}
        currentLevel={currentLevel}
        currentXP={currentXP}
      />

      <StreakModal
        isVisible={isStreakModalVisible}
        onClose={toggleStreakModal}
        currentStreak={userStats?.currentStreak || 0}
        bestStreak={userStats?.bestStreak || 0}
        getStreakMultiplier={getStreakMultiplier}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  errorTitle: {
    fontSize: 48,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 10,
  },
  debugInfo: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#000000',
  },
  
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  
  statusBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  statusText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#FFD700',
  },
  
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  languageSelectorButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
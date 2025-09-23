import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import HapticFeedback from 'react-native-haptic-feedback';

// ✅ NOUVEAU: Import des services Supabase
import { DailyService } from '../services/dailyService';
import { StatisticsService } from '../services/statisticsService';
import { TaskService } from '../services/taskService';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen({ userProfile, onBackToWelcome, isPremium, onNavigateToTab }) {
  const { t } = useTranslation();
  
  // ✅ NOUVEAU: États pour les données Supabase
  const [isLoading, setIsLoading] = useState(true);
  const [todayScore, setTodayScore] = useState(0);
  const [dailyData, setDailyData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [activeMITs, setActiveMITs] = useState([]);
  const [todayAchievement, setTodayAchievement] = useState('');
  const [error, setError] = useState(null);
  
  // États déduits des données Supabase
  const [completedTasks, setCompletedTasks] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [streak, setStreak] = useState(0);
  const [currentXP, setCurrentXP] = useState(userProfile?.xp || 0);
  const [currentLevel, setCurrentLevel] = useState(userProfile?.level || 1);
  
  // Animations (conservées)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ✅ NOUVEAU: Charger les données Supabase au montage
  useEffect(() => {
    if (userProfile?.supabaseId) {
      loadDashboardData();
    } else {
setError(t('objectives.errors.userNotFound'));
      setIsLoading(false);
    }
  }, [userProfile?.supabaseId]);

  // ✅ NOUVEAU: Fonction principale pour charger toutes les données
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📊 Chargement données dashboard...', { userId: userProfile.supabaseId });

      // Charger toutes les données en parallèle pour la performance
      const [
        dailyResult,
        statsResult,
        mitsResult,
        achievementResult
      ] = await Promise.all([
        DailyService.getTodayScore(userProfile.supabaseId),
        StatisticsService.getDashboardSummary(userProfile.supabaseId),
        TaskService.getActiveMITs(userProfile.supabaseId),
        DailyService.getTodayAchievement(userProfile.supabaseId)
      ]);

      // Traiter les résultats
      if (dailyResult.success && dailyResult.score) {
        setDailyData(dailyResult.score);
        setTodayScore(dailyResult.score.score);
        setCompletedTasks(dailyResult.score.tasks_completed);
        setTotalTasks(Math.max(dailyResult.score.total_tasks, dailyResult.score.tasks_completed));
      }

      if (statsResult.success && statsResult.summary) {
        setStatistics(statsResult.summary.statistics);
        setStreak(statsResult.summary.statistics?.best_streak || 0);
        
        // Mettre à jour XP et niveau depuis Supabase si disponible
        if (statsResult.summary.statistics) {
          // Le niveau et XP sont stockés dans la table users, pas dans statistics
          // On garde les valeurs du userProfile pour l'instant
          setCurrentXP(userProfile.xp || 0);
          setCurrentLevel(userProfile.level || 1);
        }
      }

      if (mitsResult.success) {
        setActiveMITs(mitsResult.mits || []);
      }

      if (achievementResult.success && achievementResult.achievement) {
        setTodayAchievement(achievementResult.achievement.achievement_text || '');
      }

      console.log('✅ Données dashboard chargées avec succès');

    } catch (error) {
      console.error('❌ Erreur chargement dashboard:', error);
      setError(t('objectives.errors.loadingError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Animation d'entrée (conservée)
  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // Animation de la barre de progression
      setTimeout(() => {
        const progressValue = totalTasks > 0 ? completedTasks / totalTasks : 0;
        Animated.timing(progressAnim, {
          toValue: progressValue,
          duration: 1000,
          useNativeDriver: false,
        }).start();
      }, 500);

      // Animation de pulsation pour les éléments interactifs
      const pulsing = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      
      setTimeout(() => pulsing.start(), 1000);
      return () => pulsing.stop();
    }
  }, [isLoading, completedTasks, totalTasks]);

  // Fonction de feedback haptique (conservée)
  const triggerHapticFeedback = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger('selection', options);
  };

  // Calculer le XP nécessaire pour le prochain niveau (conservé)
  const getXPForLevel = (level) => level * 100;
  const xpForNextLevel = getXPForLevel(currentLevel + 1);
  const xpProgress = currentXP / xpForNextLevel;

  // Obtenir la date d'aujourd'hui formatée (conservé)
  const getTodayDate = () => {
    const today = new Date();
    return today.toLocaleDateString('fr-FR', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  // ✅ NOUVEAU: Actions rapides connectées à Supabase
  const handleQuickAction = async (action) => {
    triggerHapticFeedback();
    console.log(`🎯 Action: ${action}`);
    
    // Animation de feedback
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(pulseAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      switch (action) {
        case 'add_task':
          // Naviguer vers l'écran de création de tâches
          if (onNavigateToTab) {
            onNavigateToTab('Present');
          }
          break;

        case 'start_timer':
          // TODO: Implémenter timer/focus session
          Alert.alert(t('settings.alerts.editProfile.title'), t('settings.alerts.editProfile.message'));
          break;

        case 'view_progress':
          // Naviguer vers les statistiques
          if (onNavigateToTab) {
            onNavigateToTab('Statistics');
          }
          break;

        case 'settings':
          // Naviguer vers les paramètres
          if (onNavigateToTab) {
            onNavigateToTab('Settings');
          }
          break;

        case 'edit_mit':
          // Naviguer vers la gestion des MIT
          if (onNavigateToTab) {
            onNavigateToTab('Future');
          }
          break;

        default:
          console.log('Action non reconnue:', action);
      }
    } catch (error) {
      console.error('❌ Erreur action rapide:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  // ✅ NOUVEAU: Marquer une tâche comme terminée avec Supabase
  const handleCompleteTask = async () => {
    if (!userProfile?.supabaseId) return;
    
    triggerHapticFeedback();
    
    try {
      // Simulation d'ajout d'une tâche fictive pour le demo
      const result = await DailyService.completeTask(userProfile.supabaseId, 'general');
      
      if (result.success) {
        // Mettre à jour l'affichage local
        setCompletedTasks(prev => Math.min(prev + 1, totalTasks || 3));
        setTodayScore(result.score.score);
        
        // Animation de la barre de progression
        const newProgress = Math.min((completedTasks + 1) / (totalTasks || 3), 1);
        Animated.timing(progressAnim, {
          toValue: newProgress,
          duration: 500,
          useNativeDriver: false,
        }).start();

        // Feedback XP
        const xpGained = 20;
        setCurrentXP(prev => prev + xpGained);
        
        console.log(`✅ Tâche terminée! Score: ${result.score.score}, +${xpGained} XP`);
        
        // Recharger les données après un délai
        setTimeout(() => {
          loadDashboardData();
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Erreur completion tâche:', error);
      Alert.alert('Erreur', 'Impossible de marquer la tâche comme terminée');
    }
  };

  // ✅ NOUVEAU: Sauvegarder l'achievement du jour
  const handleSaveAchievement = async (achievementText) => {
    if (!userProfile?.supabaseId || !achievementText.trim()) return;

    try {
      const result = await DailyService.saveTodayAchievement(userProfile.supabaseId, achievementText.trim());
      
      if (result.success) {
        setTodayAchievement(achievementText.trim());
        console.log('✅ Achievement sauvegardé:', achievementText);
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde achievement:', error);
    }
  };

  const firstName = userProfile?.firstName || 'Champion';

  // ✅ NOUVEAU: Affichage de loading
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Text style={styles.loadingText}>Chargement de votre dashboard... ⚡</Text>
      </View>
    );
  }

  // ✅ NOUVEAU: Affichage d'erreur
  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Text style={styles.errorTitle}>{t('objectives.error.title')}</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
        <Text style={styles.retryButtonText}>{t('objectives.error.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>
        {/* Header avec profil */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.profileSection}>
            <View style={styles.profileInfo}>
              <Text style={styles.greeting}>
                {t('dashboard.greeting', { firstName })}
              </Text>
              <Text style={styles.dateText}>{getTodayDate()}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Niv. {currentLevel}</Text>
            </View>
          </View>

          {/* Barre d'XP */}
          <View style={styles.xpSection}>
            <View style={styles.xpBar}>
              <Animated.View 
                style={[
                  styles.xpFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${Math.min(xpProgress * 100, 100)}%`],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.xpText}>
              {currentXP}/{xpForNextLevel} XP
            </Text>
          </View>
        </Animated.View>

        {/* Contenu principal */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Score du jour */}
          <Animated.View 
            style={[
              styles.scoreCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.scoreHeader}>
              <Text style={styles.scoreTitle}>Score du jour</Text>
              <Text style={styles.scoreEmoji}>🎯</Text>
            </View>
            <Text style={styles.scoreValue}>{todayScore}</Text>
            <Text style={styles.scoreSubtext}>
              {todayScore >= 50 ? '🔥 En feu!' : todayScore > 0 ? 'Continue comme ça!' : 'À toi de jouer!'}
            </Text>
          </Animated.View>

          {/* Progression des objectifs */}
          <Animated.View 
            style={[
              styles.progressCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Tâches du jour</Text>
              <Text style={styles.progressCounter}>
                {completedTasks}/{totalTasks || 3}
              </Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.addTaskButton, completedTasks >= (totalTasks || 3) && styles.addTaskButtonDisabled]}
              onPress={handleCompleteTask}
              disabled={completedTasks >= (totalTasks || 3)}
            >
              <Text style={styles.addTaskButtonText}>
                {completedTasks >= (totalTasks || 3) ? '✅ Terminé!' : '+ Marquer comme fait'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* MIT (Most Important Task) */}
          <Animated.View 
            style={[
              styles.mitCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.mitHeader}>
              <Text style={styles.mitTitle}>MIT du jour</Text>
              <Text style={styles.mitEmoji}>⚡</Text>
            </View>
            <Text style={styles.mitSubtitle}>Most Important Task</Text>
            
            <TouchableOpacity
              style={styles.mitInput}
              onPress={() => handleQuickAction('edit_mit')}
            >
              <Text style={styles.mitInputText}>
                {activeMITs.length > 0 
                  ? activeMITs[0].text 
                  : 'Définir ma tâche la plus importante'
                }
              </Text>
            </TouchableOpacity>

            {activeMITs.length > 1 && (
              <Text style={styles.mitCountText}>
                +{activeMITs.length - 1} autres MIT actives
              </Text>
            )}
          </Animated.View>

          {/* Streak */}
          <Animated.View 
            style={[
              styles.streakCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.streakContent}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <View style={styles.streakInfo}>
                <Text style={styles.streakValue}>{streak}</Text>
                <Text style={styles.streakLabel}>
                  {streak <= 1 ? 'jour consécutif' : 'jours consécutifs'}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Actions rapides */}
          <Animated.View 
            style={[
              styles.quickActionsSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.quickActionsTitle}>Actions rapides</Text>
            
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => handleQuickAction('add_task')}
              >
                <Text style={styles.quickActionEmoji}>✅</Text>
                <Text style={styles.quickActionText}>Nouvelle tâche</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => handleQuickAction('start_timer')}
              >
                <Text style={styles.quickActionEmoji}>⏱️</Text>
                <Text style={styles.quickActionText}>Démarrer timer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => handleQuickAction('view_progress')}
              >
                <Text style={styles.quickActionEmoji}>📊</Text>
                <Text style={styles.quickActionText}>Mes stats</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => handleQuickAction('settings')}
              >
                <Text style={styles.quickActionEmoji}>⚙️</Text>
                <Text style={styles.quickActionText}>Paramètres</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  
  // ✅ NOUVEAU: Styles pour loading et erreur
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#FFD700',
    textAlign: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
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
    marginBottom: 30,
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
  
  // Header (conservé)
  header: {
    paddingTop: height * 0.06,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(15, 15, 35, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileInfo: {
    flex: 1,
  },
  greeting: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dateText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'capitalize',
  },
  levelBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  levelText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#000000',
  },
  
  // XP Section (conservé)
  xpSection: {
    marginBottom: 5,
  },
  xpBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  xpText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },

  // Content (conservé)
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },

  // Score Card (conservé)
  scoreCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 20,
    padding: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: 20,
    alignItems: 'center',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFD700',
    marginRight: 8,
  },
  scoreEmoji: {
    fontSize: 20,
  },
  scoreValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 48,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  scoreSubtext: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Progress Card (conservé avec ajouts)
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  progressCounter: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#4CD964',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CD964',
    borderRadius: 3,
  },
  addTaskButton: {
    backgroundColor: 'rgba(76, 217, 100, 0.2)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CD964',
  },
  addTaskButtonDisabled: {
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    borderColor: 'rgba(76, 217, 100, 0.3)',
  },
  addTaskButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#4CD964',
  },

  // MIT Card (conservé avec ajouts)
  mitCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  mitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  mitTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 8,
  },
  mitEmoji: {
    fontSize: 18,
  },
  mitSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 15,
  },
  mitInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mitInputText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // ✅ NOUVEAU: Style pour afficher le nombre de MIT
  mitCountText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 8,
    textAlign: 'center',
  },

  // Streak Card (conservé)
  streakCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    marginBottom: 20,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakEmoji: {
    fontSize: 40,
    marginRight: 15,
  },
  streakInfo: {
    alignItems: 'center',
  },
  streakValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: '#FF6B6B',
  },
  streakLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Quick Actions (conservé)
  quickActionsSection: {
    marginBottom: 20,
  },
  quickActionsTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    width: (width - 60) / 2,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickActionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
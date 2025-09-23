import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import HapticFeedback from 'react-native-haptic-feedback';

const { width, height } = Dimensions.get('window');

export default function PastScreen({ userProfile, onResetApp }) {
  const { t } = useTranslation();
  
  // États pour les données historiques
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, all
  const [stats, setStats] = useState({
    totalTasks: 127,
    completedTasks: 95,
    totalScore: 2840,
    bestStreak: 12,
    currentLevel: userProfile?.level || 3,
    totalXP: userProfile?.xp || 850,
    daysActive: 23,
  });
  
  // Données simulées pour les graphiques
  const weeklyScores = [42, 67, 58, 73, 81, 55, 69]; // 7 derniers jours
  const monthlyProgress = [
    { month: 'Jan', score: 580, tasks: 32 },
    { month: 'Fév', score: 720, tasks: 41 },
    { month: 'Mar', score: 845, tasks: 38 },
    { month: 'Avr', score: 920, tasks: 45 },
  ];

  // Achievements débloqués
  const achievements = [
    { 
      id: 1, 
      name: 'Premier pas', 
      description: 'Compléter ta première tâche',
      icon: '🎯',
      unlocked: true,
      date: '15 Mars 2024'
    },
    { 
      id: 2, 
      name: 'Machine de guerre', 
      description: 'Streak de 7 jours consécutifs',
      icon: '🔥',
      unlocked: true,
      date: '22 Mars 2024'
    },
    { 
      id: 3, 
      name: 'Productivité maximale', 
      description: 'Score de 100 points en un jour',
      icon: '⚡',
      unlocked: false,
      date: null
    },
    { 
      id: 4, 
      name: 'Maître du focus', 
      description: '10h de sessions focus',
      icon: '🎧',
      unlocked: true,
      date: '28 Mars 2024'
    },
    { 
      id: 5, 
      name: 'Champion', 
      description: 'Atteindre le niveau 5',
      icon: '👑',
      unlocked: false,
      date: null
    },
  ];
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Animation d'entrée
  useEffect(() => {
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

    // Animation des barres de progression
    setTimeout(() => {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }, 500);
  }, []);

  // Fonction de feedback haptique
  const triggerHapticFeedback = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger('selection', options);
  };

  // Changer de période d'affichage
  const handlePeriodChange = (period) => {
    if (period === selectedPeriod) return;
    
    triggerHapticFeedback();
    setSelectedPeriod(period);
    console.log(`📊 Période changée: ${period}`);
  };

  // Calculer le taux de completion
  const getCompletionRate = () => {
    return Math.round((stats.completedTasks / stats.totalTasks) * 100);
  };

  // Calculer la position dans le niveau actuel
  const getLevelProgress = () => {
    const xpForCurrentLevel = stats.currentLevel * 100;
    const xpForNextLevel = (stats.currentLevel + 1) * 100;
    const progressInLevel = (stats.totalXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel);
    return Math.max(0, Math.min(1, progressInLevel));
  };

  const firstName = userProfile?.firstName || 'Champion';
  const completionRate = getCompletionRate();
  const levelProgress = getLevelProgress();

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Ta progression</Text>
          <Text style={styles.subtitle}>Analyse de tes performances, {firstName}</Text>
        </View>
        
        <View style={styles.levelBadge}>
          <Text style={styles.levelEmoji}>⭐</Text>
          <Text style={styles.levelText}>Niv. {stats.currentLevel}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Sélecteur de période */}
        <View style={styles.periodSelector}>
          {[
            { id: 'week', label: '7 jours' },
            { id: 'month', label: '30 jours' },
            { id: 'all', label: 'Tout' }
          ].map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                selectedPeriod === period.id && styles.periodButtonActive
              ]}
              onPress={() => handlePeriodChange(period.id)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.id && styles.periodButtonTextActive
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Statistiques générales */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>✅</Text>
            <Text style={styles.statValue}>{stats.completedTasks}</Text>
            <Text style={styles.statLabel}>Tâches complétées</Text>
            <Text style={styles.statSubtext}>{completionRate}% de réussite</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statValue}>{stats.totalScore}</Text>
            <Text style={styles.statLabel}>Points totaux</Text>
            <Text style={styles.statSubtext}>Moy. {Math.round(stats.totalScore / stats.daysActive)}/jour</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{stats.bestStreak}</Text>
            <Text style={styles.statLabel}>Meilleur streak</Text>
            <Text style={styles.statSubtext}>Record personnel</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📅</Text>
            <Text style={styles.statValue}>{stats.daysActive}</Text>
            <Text style={styles.statLabel}>Jours actifs</Text>
            <Text style={styles.statSubtext}>Depuis le début</Text>
          </View>
        </View>

        {/* Progression du niveau */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelTitle}>Progression niveau {stats.currentLevel}</Text>
            <Text style={styles.levelXP}>{stats.totalXP} XP</Text>
          </View>
          
          <View style={styles.levelProgressContainer}>
            <Animated.View 
              style={[
                styles.levelProgressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', `${levelProgress * 100}%`],
                  }),
                },
              ]}
            />
          </View>
          
          <Text style={styles.levelProgressText}>
            {Math.round(levelProgress * 100)}% vers le niveau {stats.currentLevel + 1}
          </Text>
        </View>

        {/* Graphique des scores hebdomadaires */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Scores des 7 derniers jours</Text>
          
          <View style={styles.chartContainer}>
            <View style={styles.chart}>
              {weeklyScores.map((score, index) => (
                <View key={index} style={styles.chartBar}>
                  <Animated.View 
                    style={[
                      styles.chartBarFill,
                      {
                        height: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, (score / 100) * 80], // Max 80px
                        }),
                      },
                    ]}
                  />
                  <Text style={styles.chartBarValue}>{score}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.chartLabels}>
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => (
                <Text key={index} style={styles.chartLabel}>{day}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.achievementsCard}>
          <Text style={styles.achievementsTitle}>Succès débloqués</Text>
          
          <View style={styles.achievementsList}>
            {achievements.map((achievement) => (
              <View 
                key={achievement.id} 
                style={[
                  styles.achievementItem,
                  !achievement.unlocked && styles.achievementItemLocked
                ]}
              >
                <View style={styles.achievementIcon}>
                  <Text style={[
                    styles.achievementIconText,
                    !achievement.unlocked && styles.achievementIconLocked
                  ]}>
                    {achievement.unlocked ? achievement.icon : '🔒'}
                  </Text>
                </View>
                
                <View style={styles.achievementContent}>
                  <Text style={[
                    styles.achievementName,
                    !achievement.unlocked && styles.achievementNameLocked
                  ]}>
                    {achievement.name}
                  </Text>
                  <Text style={[
                    styles.achievementDescription,
                    !achievement.unlocked && styles.achievementDescriptionLocked
                  ]}>
                    {achievement.description}
                  </Text>
                  {achievement.unlocked && achievement.date && (
                    <Text style={styles.achievementDate}>
                      Débloqué le {achievement.date}
                    </Text>
                  )}
                </View>
                
                {achievement.unlocked && (
                  <View style={styles.achievementBadge}>
                    <Text style={styles.achievementBadgeText}>✓</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Actions historiques */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Historique</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => console.log('📊 Export des données')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Exporter mes données</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => console.log('📈 Rapport détaillé')}
          >
            <Text style={styles.actionIcon}>📈</Text>
            <Text style={styles.actionText}>Rapport détaillé</Text>
          </TouchableOpacity>

          {onResetApp && (
            <TouchableOpacity
              style={[styles.actionButton, styles.resetButton]}
              onPress={onResetApp}
            >
              <Text style={styles.actionIcon}>🔄</Text>
              <Text style={[styles.actionText, styles.resetText]}>Reset app (debug)</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },

  // Header
  header: {
    paddingTop: height * 0.06,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  levelEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  levelText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFD700',
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#FFD700',
  },
  periodButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  periodButtonTextActive: {
    fontFamily: 'Poppins-Bold',
    color: '#000000',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    width: (width - 52) / 2, // 2 colonnes avec gap
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 4,
  },
  statSubtext: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },

  // Level Card
  levelCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  levelTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFD700',
  },
  levelXP: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  levelProgressContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  levelProgressBar: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  levelProgressText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },

  // Chart Card
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  chartTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    marginBottom: 10,
    gap: 8,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarFill: {
    backgroundColor: '#4CD964',
    borderRadius: 4,
    minHeight: 4,
    width: '100%',
    marginBottom: 8,
  },
  chartBarValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  chartLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    flex: 1,
    textAlign: 'center',
  },

  // Achievements
  achievementsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  achievementsTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#4CD964',
  },
  achievementItemLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  achievementIcon: {
    marginRight: 15,
  },
  achievementIconText: {
    fontSize: 24,
  },
  achievementIconLocked: {
    opacity: 0.5,
  },
  achievementContent: {
    flex: 1,
  },
  achievementName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  achievementNameLocked: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  achievementDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  achievementDescriptionLocked: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  achievementDate: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: '#4CD964',
  },
  achievementBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CD964',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#000000',
  },

  // Actions
  actionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionsTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  resetButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  actionText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  resetText: {
    color: '#FF6B6B',
  },
});
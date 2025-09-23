import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import HapticFeedback from 'react-native-haptic-feedback';
import { 
  Flame, 
  CheckCircle2, 
  TrendingUp, 
  Calendar,
  Trophy,
  Zap
} from 'lucide-react-native';
import StreakModal from './StreakModal';

const { width } = Dimensions.get('window');

export default function StatsCardsSection({ userStats }) {
  const [isStreakModalVisible, setIsStreakModalVisible] = useState(false);

  // Fonction de feedback haptique
  const triggerHapticFeedback = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger('selection', options);
  };

  // Ouvrir/fermer la modale des streaks
  const toggleStreakModal = () => {
    triggerHapticFeedback();
    setIsStreakModalVisible(!isStreakModalVisible);
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

  // Calculer l'XP total des tâches
  const getTotalTasksXP = (completedTasks) => {
    return completedTasks * 25; // 25 XP par tâche
  };

  // Configuration des cards
  const statsCards = [
    {
      id: 'streak',
      icon: Flame,
      iconColor: '#FF6B47',
      value: userStats.currentStreak,
      label: 'Streak',
      extra: `x${getStreakMultiplier(userStats.currentStreak)}`,
      extraColor: '#FF6B47',
      onPress: toggleStreakModal,
      gradient: ['#FF6B47', '#FF8E53']
    },
    {
      id: 'tasks',
      icon: CheckCircle2,
      iconColor: '#4ECDC4',
      value: userStats.totalTasksCompleted,
      label: 'Complétées',
      extra: `+${getTotalTasksXP(userStats.totalTasksCompleted)} XP`,
      extraColor: '#4ECDC4',
      gradient: ['#4ECDC4', '#44A08D']
    },
    {
      id: 'score',
      icon: TrendingUp,
      iconColor: '#A8E6CF',
      value: `${userStats.averageScore}%`,
      label: 'Score moyen',
      gradient: ['#A8E6CF', '#88D8A3']
    },
    {
      id: 'days',
      icon: Calendar,
      iconColor: '#FFD93D',
      value: userStats.totalLoginDays,
      label: 'Jours actifs',
      gradient: ['#FFD93D', '#F6C23E']
    },
    {
      id: 'category',
      icon: Trophy,
      iconColor: '#C471F5',
      value: userStats.favoriteCategory,
      label: 'Top catégorie',
      isText: true,
      gradient: ['#C471F5', '#A855F7']
    }
  ];

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Statistiques</Text>
          <View style={styles.titleAccent}>
            <Zap size={16} color="#FFD700" />
          </View>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          {statsCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[styles.statCard, { opacity: card.onPress ? 1 : 0.95 }]}
              onPress={card.onPress}
              activeOpacity={0.85}
              disabled={!card.onPress}
            >
              {/* Gradient background effect */}
              <View style={[styles.cardGradient, { 
                backgroundColor: card.gradient[0],
                opacity: 0.15
              }]} />
              
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: `${card.iconColor}20` }]}>
                <card.icon size={18} color={card.iconColor} strokeWidth={2.5} />
              </View>
              
              {/* Content */}
              <View style={styles.cardContent}>
                <Text style={[styles.cardValue, card.isText && styles.cardValueText]}>
                  {card.value}
                </Text>
                <Text style={styles.cardLabel}>{card.label}</Text>
                
                {card.extra && (
                  <View style={[styles.extraContainer, { borderColor: `${card.extraColor}40` }]}>
                    <Text style={[styles.extraText, { color: card.extraColor }]}>
                      {card.extra}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Interactive indicator */}
              {card.onPress && (
                <View style={styles.interactiveIndicator}>
                  <View style={[styles.indicatorDot, { backgroundColor: card.iconColor }]} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Modale des multiplicateurs de streak */}
      <StreakModal
        isVisible={isStreakModalVisible}
        onClose={toggleStreakModal}
        currentStreak={userStats.currentStreak}
        bestStreak={userStats.bestStreak}
        getStreakMultiplier={getStreakMultiplier}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    marginRight: 8,
  },
  titleAccent: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Scroll
  scrollView: {
    marginHorizontal: -4,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 12,
  },
  
  // Cards
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 16,
    width: 110,
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 15,
  },
  
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  
  cardValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 24,
  },
  
  cardValueText: {
    fontSize: 13,
    lineHeight: 16,
  },
  
  cardLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  
  extraContainer: {
    borderRadius: 6,
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  
  extraText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 9,
    letterSpacing: 0.2,
  },
  
  // Interactive indicator
  interactiveIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
});
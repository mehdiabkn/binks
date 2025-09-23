import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { 
  Flame,
  Calendar,
  Trophy,
  Target,
  Zap,
  CheckCircle2,
  AlertCircle,
  Star
} from 'lucide-react-native';

export default function StreakSection({ 
  currentStreak, 
  selectedPeriod, 
  data 
}) {
  const { t } = useTranslation();

  // Génération des données de série factices pour l'historique
  const generateStreakHistory = () => {
    switch (selectedPeriod) {
      case 'week':
        return [
          { day: t('statistics.charts.days.mon'), completed: true, type: 'mit' },
          { day: t('statistics.charts.days.tue'), completed: true, type: 'both' },
          { day: t('statistics.charts.days.wed'), completed: true, type: 'mit' },
          { day: t('statistics.charts.days.thu'), completed: true, type: 'both' },
          { day: t('statistics.charts.days.fri'), completed: true, type: 'met' },
          { day: t('statistics.charts.days.sat'), completed: false, type: 'none' },
          { day: t('statistics.charts.days.sun'), completed: false, type: 'none' },
        ];
      case 'month':
        // Générer 30 jours avec des patterns réalistes
        const monthData = [];
        for (let i = 1; i <= 30; i++) {
          const completed = Math.random() > 0.3; // 70% de chance de complétion
          const typeRand = Math.random();
          let type = 'none';
          if (completed) {
            if (typeRand > 0.6) type = 'both';
            else if (typeRand > 0.3) type = 'mit';
            else type = 'met';
          }
          monthData.push({
            day: i.toString(),
            completed,
            type
          });
        }
        return monthData;
      case 'year':
        // Générer 52 semaines
        const yearData = [];
        for (let i = 1; i <= 52; i++) {
          const completed = Math.random() > 0.25; // 75% de chance de complétion
          const typeRand = Math.random();
          let type = 'none';
          if (completed) {
            if (typeRand > 0.5) type = 'both';
            else if (typeRand > 0.25) type = 'mit';
            else type = 'met';
          }
          yearData.push({
            day: `S${i}`,
            completed,
            type
          });
        }
        return yearData;
      default:
        return [];
    }
  };

  // Calculs des statistiques de série
  const getStreakStats = () => {
    const history = generateStreakHistory();
    let currentStreakCount = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let totalCompletedDays = 0;

    // Calculer depuis la fin (aujourd'hui vers le passé)
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].completed) {
        tempStreak++;
        totalCompletedDays++;
        if (i === history.length - 1) {
          currentStreakCount = tempStreak;
        }
      } else {
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        tempStreak = 0;
      }
    }

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    const completionRate = history.length > 0 ? Math.round((totalCompletedDays / history.length) * 100) : 0;

    return {
      currentStreak: currentStreakCount,
      longestStreak,
      completionRate,
      totalDays: totalCompletedDays,
      history
    };
  };

  // Messages motivationnels selon la série
  const getMotivationMessage = (streak) => {
    if (streak === 0) {
      return {
        title: t('statistics.streak.motivation.newStart.title'),
        message: t('statistics.streak.motivation.newStart.message'),
        color: '#FFD700'
      };
    }
    if (streak === 1) {
      return {
        title: t('statistics.streak.motivation.firstStep.title'),
        message: t('statistics.streak.motivation.firstStep.message'),
        color: '#4CD964'
      };
    }
    if (streak < 7) {
      return {
        title: t('statistics.streak.motivation.weekProgress.title', { days: streak }),
        message: t('statistics.streak.motivation.weekProgress.message'),
        color: '#FF9500'
      };
    }
    if (streak < 30) {
      return {
        title: t('statistics.streak.motivation.impressive.title', { days: streak }),
        message: t('statistics.streak.motivation.impressive.message'),
        color: '#007AFF'
      };
    }
    return {
      title: t('statistics.streak.motivation.legendary.title', { days: streak }),
      message: t('statistics.streak.motivation.legendary.message'),
      color: '#FF6B6B'
    };
  };

  // Rendu d'un jour dans l'historique
  const renderHistoryDay = (dayData, index) => {
    const getColor = () => {
      if (!dayData.completed) return 'rgba(255, 255, 255, 0.1)';
      switch (dayData.type) {
        case 'both': return '#4CD964'; // MIT + MET
        case 'mit': return '#007AFF';  // MIT seulement
        case 'met': return '#FF9500';  // MET seulement
        default: return 'rgba(255, 255, 255, 0.1)';
      }
    };

    const getIcon = () => {
      if (!dayData.completed) return null;
      switch (dayData.type) {
        case 'both': return <Star size={8} color="#FFFFFF" strokeWidth={2} />;
        case 'mit': return <Target size={8} color="#FFFFFF" strokeWidth={2} />;
        case 'met': return <Zap size={8} color="#FFFFFF" strokeWidth={2} />;
        default: return <CheckCircle2 size={8} color="#FFFFFF" strokeWidth={2} />;
      }
    };

    return (
      <View
        key={index}
        style={[
          styles.historyDay,
          { backgroundColor: getColor() }
        ]}
      >
        {getIcon()}
      </View>
    );
  };

  const streakStats = getStreakStats();
  const motivation = getMotivationMessage(currentStreak);

  return (
    <View style={styles.container}>
      {/* Titre de section */}
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>{t('statistics.streak.title')}</Text>
        <Text style={styles.sectionSubtitle}>{t('statistics.streak.subtitle')}</Text>
      </View>

      {/* Carte principale de série */}
      <View style={[styles.mainStreakCard, { backgroundColor: `${motivation.color}15`, borderColor: `${motivation.color}30` }]}>
        <View style={styles.streakHeader}>
          <View style={[styles.streakIcon, { backgroundColor: motivation.color }]}>
            <Flame size={32} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <View style={styles.streakContent}>
            <Text style={styles.streakTitle}>{motivation.title}</Text>
            <Text style={styles.streakMessage}>{motivation.message}</Text>
          </View>
        </View>
      </View>

      {/* Statistiques de série */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Flame size={20} color="#FF6B6B" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>{streakStats.currentStreak}</Text>
          <Text style={styles.statLabel}>{t('statistics.streak.stats.current')}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Trophy size={20} color="#FFD700" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>{streakStats.longestStreak}</Text>
          <Text style={styles.statLabel}>{t('statistics.streak.stats.record')}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Calendar size={20} color="#4CD964" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>{streakStats.totalDays}</Text>
          <Text style={styles.statLabel}>{t('statistics.streak.stats.successful')}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <CheckCircle2 size={20} color="#007AFF" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>{streakStats.completionRate}%</Text>
          <Text style={styles.statLabel}>{t('statistics.streak.stats.successRate')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  
  // Header de section
  headerContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  
  // Carte principale de série
  mainStreakCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  streakContent: {
    flex: 1,
  },
  streakTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  streakMessage: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  
  // Grille des statistiques
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  
  // Historique
  historyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  historyHeader: {
    marginBottom: 16,
  },
  historyTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  historyScroll: {
    marginBottom: 8,
  },
  historyGrid: {
    flexDirection: 'row',
    gap: 4,
    paddingRight: 20,
  },
  historyDay: {
    width: 16,
    height: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { 
  Calendar,
  Clock,
  Target,
  Zap,
  TrendingUp,
  Award,
  BarChart3,
  CheckCircle2
} from 'lucide-react-native';

export default function TasksAnalysis({ 
  selectedPeriod, 
  data, 
  bestDay, 
  averageCompletionTime 
}) {
  const { t } = useTranslation();

  // Calculs d'analyse
  const mitCompletionRate = data.mitTotal > 0 ? Math.round((data.mitCompleted / data.mitTotal) * 100) : 0;
  const metAvoidanceRate = data.metTotal > 0 ? Math.round((data.metCompleted / data.metTotal) * 100) : 0;
  const totalTasks = data.mitTotal + data.metTotal;
  const completedTasks = data.mitCompleted + data.metCompleted;
  const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Analyse de performance
  const getPerformanceLevel = () => {
    if (overallRate >= 90) return { level: t('statistics.analysis.performance.exceptional'), color: '#4CD964', icon: Award };
    if (overallRate >= 80) return { level: t('statistics.analysis.performance.excellent'), color: '#4CD964', icon: TrendingUp };
    if (overallRate >= 70) return { level: t('statistics.analysis.performance.veryGood'), color: '#FFD700', icon: CheckCircle2 };
    if (overallRate >= 60) return { level: t('statistics.analysis.performance.good'), color: '#FF9500', icon: Target };
    if (overallRate >= 50) return { level: t('statistics.analysis.performance.average'), color: '#FF9500', icon: BarChart3 };
    return { level: t('statistics.analysis.performance.needsImprovement'), color: '#FF6B6B', icon: TrendingUp };
  };

  // Conseils basés sur les performances
  const getAdvice = () => {
    if (mitCompletionRate < 60 && metAvoidanceRate > 70) {
      return {
        title: t('statistics.analysis.advice.focusMIT.title'),
        description: t('statistics.analysis.advice.focusMIT.description'),
        icon: Target,
        color: '#007AFF'
      };
    }
    
    if (mitCompletionRate > 80 && metAvoidanceRate < 50) {
      return {
        title: t('statistics.analysis.advice.reduceDistractions.title'),
        description: t('statistics.analysis.advice.reduceDistractions.description'),
        icon: Zap,
        color: '#FF9500'
      };
    }
    
    if (overallRate > 85) {
      return {
        title: t('statistics.analysis.advice.excellentPerformance.title'),
        description: t('statistics.analysis.advice.excellentPerformance.description'),
        icon: Award,
        color: '#4CD964'
      };
    }
    
    return {
      title: t('statistics.analysis.advice.balanceMITMET.title'),
      description: t('statistics.analysis.advice.balanceMITMET.description'),
      icon: BarChart3,
      color: '#FFD700'
    };
  };

  // Texte de période
  const getPeriodText = () => {
    return t(`statistics.analysis.periods.${selectedPeriod}`);
  };

  const performance = getPerformanceLevel();
  const advice = getAdvice();
  const PerformanceIcon = performance.icon;
  const AdviceIcon = advice.icon;

  return (
    <View style={styles.container}>
      {/* Titre de section */}
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>{t('statistics.analysis.title')}</Text>
        <Text style={styles.sectionSubtitle}>{t('statistics.analysis.subtitle')}</Text>
      </View>

      {/* Métriques principales */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricRow}>
          {/* MIT Performance */}
          <View style={[styles.metricCard, { borderLeftColor: '#007AFF' }]}>
            <View style={styles.metricHeader}>
              <Target size={18} color="#007AFF" strokeWidth={2} />
              <Text style={styles.metricTitle}>{t('statistics.analysis.metrics.mitCompleted')}</Text>
            </View>
            <Text style={styles.metricValue}>{data.mitCompleted}/{data.mitTotal}</Text>
            <Text style={[styles.metricPercentage, { color: '#007AFF' }]}>
              {t('statistics.analysis.metrics.successRate', { rate: mitCompletionRate })}
            </Text>
          </View>

          {/* MET Performance */}
          <View style={[styles.metricCard, { borderLeftColor: '#FF9500' }]}>
            <View style={styles.metricHeader}>
              <Zap size={18} color="#FF9500" strokeWidth={2} />
              <Text style={styles.metricTitle}>{t('statistics.analysis.metrics.metAvoided')}</Text>
            </View>
            <Text style={styles.metricValue}>{data.metCompleted}/{data.metTotal}</Text>
            <Text style={[styles.metricPercentage, { color: '#FF9500' }]}>
              {t('statistics.analysis.metrics.avoidedRate', { rate: metAvoidanceRate })}
            </Text>
          </View>
        </View>

        {/* Temps et meilleur jour */}
        <View style={styles.metricRow}>
          {/* Temps moyen */}
          <View style={[styles.metricCard, { borderLeftColor: '#4CD964' }]}>
            <View style={styles.metricHeader}>
              <Clock size={18} color="#4CD964" strokeWidth={2} />
              <Text style={styles.metricTitle}>{t('statistics.analysis.metrics.averageTime')}</Text>
            </View>
            <Text style={styles.metricValue}>{averageCompletionTime}</Text>
            <Text style={[styles.metricPercentage, { color: '#4CD964' }]}>
              {t('statistics.analysis.metrics.perSession')}
            </Text>
          </View>

          {/* Meilleur jour */}
          <View style={[styles.metricCard, { borderLeftColor: '#FFD700' }]}>
            <View style={styles.metricHeader}>
              <Calendar size={18} color="#FFD700" strokeWidth={2} />
              <Text style={styles.metricTitle}>{t('statistics.analysis.metrics.bestDay')}</Text>
            </View>
            <Text style={styles.metricValue}>{bestDay}</Text>
            <Text style={[styles.metricPercentage, { color: '#FFD700' }]}>
              {getPeriodText()}
            </Text>
          </View>
        </View>
      </View>

      {/* Niveau de performance */}
      <TouchableOpacity style={[styles.performanceCard, { backgroundColor: `${performance.color}15`, borderColor: `${performance.color}30` }]}>
        <View style={styles.performanceHeader}>
          <View style={[styles.performanceIcon, { backgroundColor: performance.color }]}>
            <PerformanceIcon size={24} color="#FFFFFF" strokeWidth={2} />
          </View>
          <View style={styles.performanceTextContainer}>
            <Text style={styles.performanceLevel}>{performance.level}</Text>
            <Text style={[styles.performanceRate, { color: performance.color }]}>
              {t('statistics.analysis.overallSuccessRate', { rate: overallRate })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Conseil personnalisé */}
      <TouchableOpacity style={[styles.adviceCard, { backgroundColor: `${advice.color}15`, borderColor: `${advice.color}30` }]}>
        <View style={styles.adviceHeader}>
          <View style={[styles.adviceIcon, { backgroundColor: advice.color }]}>
            <AdviceIcon size={20} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text style={styles.adviceTitle}>{advice.title}</Text>
        </View>
        <Text style={styles.adviceDescription}>{advice.description}</Text>
      </TouchableOpacity>
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
  
  // Grille des métriques
  metricsGrid: {
    marginBottom: 20,
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  metricTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  metricValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metricPercentage: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    opacity: 0.9,
  },
  
  // Carte de performance
  performanceCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  performanceTextContainer: {
    flex: 1,
  },
  performanceLevel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  performanceRate: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },
  
  // Carte de conseil
  adviceCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  adviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  adviceTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  adviceDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
});
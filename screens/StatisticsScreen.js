// FICHIER: ./screens/StatisticsScreen.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Calendar, TrendingUp, BarChart3 } from 'lucide-react-native';

// Services
import { StatisticsService } from '../services/statisticsService';
import { ChartDataService } from '../services/chartDataService';

// Composants
import StatisticsHeader from '../components/Statistics/StatisticsHeader';
import MITEvolutionChart from '../components/Statistics/MITEvolutionChart';
import METEvolutionChart from '../components/Statistics/METEvolutionChart';

export default function StatisticsScreen({ userProfile }) {
  const { t } = useTranslation();
  
  // États existants
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Nouveaux états pour les graphiques
  const [chartData, setChartData] = useState(null);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [chartError, setChartError] = useState(null);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Chargement initial
  useEffect(() => {
    if (userProfile?.supabaseId) {
      loadAllData();
    }
  }, [userProfile?.supabaseId]);

  // Chargement de toutes les données (stats + graphiques)
  const loadAllData = useCallback(async () => {
    if (!userProfile?.supabaseId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setChartError(null);
      
      // Chargement en parallèle des stats et graphiques
      const [statsResult, chartResult] = await Promise.all([
        StatisticsService.getDebugData(userProfile.supabaseId, selectedPeriod),
        ChartDataService.getEvolutionData(userProfile.supabaseId, selectedPeriod)
      ]);

      // Traitement des stats
      if (statsResult.success) {
        setData(statsResult.data);
      } else {
        setError(t('statistics.errors.loadingStats'));
      }

      // Traitement des graphiques
      if (chartResult.success) {
        setChartData(chartResult.data);
      } else {
        setChartError(t('statistics.errors.loadingCharts'));
        console.warn('Chart loading error:', chartResult.error);
      }

    } catch (error) {
      setError(t('statistics.errors.general', { message: error.message }));
      console.error('LoadAllData error:', error);
    } finally {
      setIsLoading(false);
      setIsChartLoading(false);
    }
  }, [userProfile?.supabaseId, selectedPeriod, t]);

  // Chargement des données simple (stats seulement)
  const loadData = useCallback(async () => {
    if (!userProfile?.supabaseId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await StatisticsService.getDebugData(
        userProfile.supabaseId, 
        selectedPeriod
      );

      if (result.success) {
        setData(result.data);
      } else {
        setError(t('statistics.errors.loadingData'));
      }
    } catch (error) {
      setError(t('statistics.errors.general', { message: error.message }));
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.supabaseId, selectedPeriod, t]);

  // Chargement des graphiques seulement
  const loadChartData = useCallback(async () => {
    if (!userProfile?.supabaseId) return;
    
    try {
      setIsChartLoading(true);
      setChartError(null);
      
      const result = await ChartDataService.getEvolutionData(
        userProfile.supabaseId, 
        selectedPeriod
      );

      if (result.success) {
        setChartData(result.data);
      } else {
        setChartError(t('statistics.errors.loadingCharts'));
        console.warn('Chart loading error:', result.error);
      }
    } catch (error) {
      setChartError(t('statistics.errors.chartsGeneral', { message: error.message }));
      console.error('LoadChartData error:', error);
    } finally {
      setIsChartLoading(false);
    }
  }, [userProfile?.supabaseId, selectedPeriod, t]);

  // Changement de période
  const handlePeriodChange = useCallback(async (period) => {
    setSelectedPeriod(period);
    
    if (userProfile?.supabaseId) {
      setIsRefreshing(true);
      setIsChartLoading(true);
      
      try {
        // Rechargement en parallèle
        const [statsResult, chartResult] = await Promise.all([
          StatisticsService.getDebugData(userProfile.supabaseId, period),
          ChartDataService.getEvolutionData(userProfile.supabaseId, period)
        ]);

        // Traitement des stats
        if (statsResult.success) {
          setData(statsResult.data);
        }

        // Traitement des graphiques
        if (chartResult.success) {
          setChartData(chartResult.data);
          setChartError(null);
        } else {
          setChartError(t('statistics.errors.loadingCharts'));
        }

      } catch (error) {
        console.error('Erreur refresh:', error);
      } finally {
        setIsRefreshing(false);
        setIsChartLoading(false);
      }
    }
  }, [userProfile?.supabaseId, t]);

  // Calcul des statistiques
  const getStats = () => {
    if (!data) {
      return {
        globalRate: 0,
        mitRate: 0,
        metRate: 0,
        mitCompleted: 0,
        mitTotal: 0,
        metCompleted: 0,
        metTotal: 0,
        totalCompleted: 0,
        totalPossible: 0
      };
    }

    const mitCompleted = data.mitsRealisees.count || 0;
    const mitTotal = data.mitsTotal.count || 0;
    const metCompleted = data.metsCochees.count || 0;
    const metTotal = data.metsTotal.count || 0;

    const totalCompleted = mitCompleted + metCompleted;
    const totalPossible = mitTotal + metTotal;

    return {
      globalRate: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
      mitRate: mitTotal > 0 ? Math.round((mitCompleted / mitTotal) * 100) : 0,
      metRate: metTotal > 0 ? Math.round((metCompleted / metTotal) * 100) : 100,
      mitCompleted,
      mitTotal,
      metCompleted,
      metTotal,
      totalCompleted,
      totalPossible
    };
  };

  // Fonction pour la couleur de progression
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#10B981';
    if (percentage >= 60) return '#F59E0B';
    if (percentage >= 40) return '#F97316';
    return '#EF4444';
  };

  const stats = getStats();

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

  // Loading écran complet
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>{t('statistics.loading')}</Text>
      </View>
    );
  }

  // Erreur
  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <XCircle size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAllData}>
          <Text style={styles.retryButtonText}>{t('statistics.retry')}</Text>
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
      {/* Header intégré */}
      <StatisticsHeader 
        firstName={userProfile?.firstName || t('statistics.header.defaultName')}
        selectedPeriod={selectedPeriod}
        completionRate={stats.globalRate}
        currentStreak={0}
        totalLoginDays={0}
      />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Sélecteur de période */}
        <View style={styles.periodSelector}>
          {[
            { key: 'week', labelKey: 'periods.week.shortLabel', icon: Calendar },
            { key: 'month', labelKey: 'periods.month.shortLabel', icon: TrendingUp },
            { key: 'year', labelKey: 'periods.year.shortLabel', icon: BarChart3 },
          ].map((period) => {
            const Icon = period.icon;
            const isSelected = selectedPeriod === period.key;
            
            return (
              <TouchableOpacity
                key={period.key}
                style={[
                  styles.periodButton,
                  isSelected && styles.periodButtonSelected
                ]}
                onPress={() => handlePeriodChange(period.key)}
                activeOpacity={0.7}
              >
                <Icon 
                  size={20} 
                  color={isSelected ? '#6366F1' : 'rgba(255, 255, 255, 0.6)'} 
                />
                <Text style={[
                  styles.periodLabel,
                  isSelected && styles.periodLabelSelected
                ]}>
                  {t(`statistics.${period.labelKey}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Cards MIT et MET - Layout vertical */}
        <View style={styles.cardsContainer}>
          {/* Card MIT */}
          <View style={[styles.card, styles.mitCard]}>
            {isRefreshing ? (
              <View style={styles.cardLoading}>
                <ActivityIndicator size="small" color="#10B981" />
              </View>
            ) : (
              <>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconContainer}>
                    <CheckCircle size={24} color="#10B981" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>MIT</Text>
                    <Text style={styles.cardSubtitle}>{t('statistics.overview.mit.description')}</Text>
                  </View>
                  <View style={styles.cardMetricsHorizontal}>
                    <Text style={[styles.cardPercentageSmall, { color: '#10B981' }]}>
                      {stats.mitRate}%
                    </Text>
                    <Text style={styles.cardProgressSmall}>
                      {stats.mitCompleted}/{stats.mitTotal}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.cardProgressBar}>
                  <View 
                    style={[
                      styles.cardProgressFill,
                      { 
                        width: `${stats.mitRate}%`,
                        backgroundColor: '#10B981'
                      }
                    ]}
                  />
                </View>
              </>
            )}
          </View>

          {/* Card MET */}
          <View style={[styles.card, styles.metCard]}>
            {isRefreshing ? (
              <View style={styles.cardLoading}>
                <ActivityIndicator size="small" color="#EF4444" />
              </View>
            ) : (
              <>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconContainer}>
                    <XCircle size={24} color="#EF4444" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>MET</Text>
                    <Text style={styles.cardSubtitle}>{t('statistics.overview.met.description')}</Text>
                  </View>
                  <View style={styles.cardMetricsHorizontal}>
                    <Text style={[styles.cardPercentageSmall, { color: '#EF4444' }]}>
                      {stats.metRate}%
                    </Text>
                    <Text style={styles.cardProgressSmall}>
                      {stats.metCompleted}/{stats.metTotal}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.cardProgressBar}>
                  <View 
                    style={[
                      styles.cardProgressFill,
                      { 
                        width: `${stats.metRate}%`,
                        backgroundColor: '#EF4444'
                      }
                    ]}
                  />
                </View>
              </>
            )}
          </View>
        </View>

        {/* Graphiques d'évolution */}
        <View style={styles.chartsSection}>
          <Text style={styles.sectionTitle}>{t('statistics.charts.title')}</Text>
          
          {/* Graphique MIT */}
          <MITEvolutionChart
            data={chartData}
            isLoading={isChartLoading}
            period={selectedPeriod}
          />

          {/* Graphique MET */}
          <METEvolutionChart
            data={chartData}
            isLoading={isChartLoading}
            period={selectedPeriod}
          />

          {/* Message d'erreur graphiques si nécessaire */}
          {chartError && (
            <View style={styles.chartErrorContainer}>
              <Text style={styles.chartErrorText}>{chartError}</Text>
              <TouchableOpacity 
                style={styles.chartRetryButton} 
                onPress={loadChartData}
              >
                <Text style={styles.chartRetryText}>{t('statistics.charts.retry')}</Text>
              </TouchableOpacity>
            </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  
  // Progress bar
  progressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    minWidth: 2,
  },
  progressText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  
  // Sélecteur de période
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  periodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  periodButtonSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  periodLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  periodLabelSelected: {
    color: '#6366F1',
  },
  
  // Cards - Layout vertical
  cardsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 100,
  },
  mitCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  metCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  cardMetricsHorizontal: {
    alignItems: 'flex-end',
  },
  cardPercentageSmall: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    lineHeight: 28,
    marginBottom: 2,
  },
  cardProgressSmall: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  cardProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  cardProgressFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 2,
  },
  cardLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 60,
  },

  // Section graphiques
  chartsSection: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },

  // Erreurs graphiques
  chartErrorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  chartErrorText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  chartRetryButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  chartRetryText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  
  // Loading/Error
  loadingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  errorText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  retryButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
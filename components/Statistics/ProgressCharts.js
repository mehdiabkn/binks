import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { 
  LineChart, 
  BarChart,
  PieChart 
} from 'react-native-chart-kit';
import { 
  Activity, 
  Target, 
  Clock,
  ChevronLeft,
  ChevronRight 
} from 'lucide-react-native';
import HapticFeedback from 'react-native-haptic-feedback';

const { width } = Dimensions.get('window');
const chartWidth = width - 80; // Plus de marge pour éviter le débordement

const METRICS = [
  {
    id: 'completion',
    icon: Target,
    color: '#4CD964',
  },
  {
    id: 'productivity',
    icon: Activity,
    color: '#007AFF',
  },
  {
    id: 'consistency',
    icon: Clock,
    color: '#FF9500',
  },
];

export default function ProgressCharts({ 
  selectedPeriod, 
  selectedMetric, 
  onMetricChange, 
  data 
}) {
  const { t } = useTranslation();
  
  // État pour le sélecteur MIT/MET
  const [selectedChart, setSelectedChart] = useState('MIT');

  // ✅ FONCTION HELPER: Protection contre NaN/Infinity
  const safeValue = (value, defaultValue = 0) => {
    if (value === null || value === undefined || !isFinite(value) || isNaN(value)) {
      return defaultValue;
    }
    return Math.max(0, Math.round(value));
  };

  // ✅ FONCTION HELPER: Calcul de pourcentage safe
  const safePercentage = (completed, total, defaultValue = 0) => {
    const safeCompleted = safeValue(completed, 0);
    const safeTotal = safeValue(total, 0);
    
    if (safeTotal === 0) return defaultValue;
    
    const result = (safeCompleted / safeTotal) * 100;
    return safeValue(result, defaultValue);
  };

  // Configuration des graphiques
  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'rgba(255, 255, 255, 0.05)',
    backgroundGradientTo: 'rgba(255, 255, 255, 0.05)',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#4CD964"
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: "rgba(255, 255, 255, 0.1)",
      strokeWidth: 1
    },
    fillShadowGradient: '#4CD964',
    fillShadowGradientOpacity: 0.3,
  };

  // Fonction de feedback haptique
  const triggerHapticFeedback = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger('selection', options);
  };

  // Gestion du changement de métrique
  const handleMetricChange = (metricId) => {
    if (metricId === selectedMetric) return;
    
    triggerHapticFeedback();
    onMetricChange(metricId);
    console.log('📈 Métrique changée vers:', metricId);
  };

  // Gestion du changement MIT/MET
  const handleChartTypeChange = (chartType) => {
    if (chartType === selectedChart) return;
    
    triggerHapticFeedback();
    setSelectedChart(chartType);
    console.log('📊 Type de graphique changé vers:', chartType);
  };

  // ✅ CORRIGÉ: Préparation des données avec protection contre Infinity
  const getChartData = () => {
    const getMetricValue = (item) => {
      // ✅ Protection: S'assurer que item existe et a des valeurs valides
      if (!item) return 0;
      
      const mitCompleted = safeValue(item.mitCompleted, 0);
      const mitTotal = safeValue(item.mitTotal, 0);
      const metCompleted = safeValue(item.metCompleted, 0);
      const metTotal = safeValue(item.metTotal, 0);
      
      const total = mitTotal + metTotal;
      const completed = mitCompleted + metCompleted;
      
      console.log('🔍 getMetricValue - item:', { mitCompleted, mitTotal, metCompleted, metTotal, total, completed });
      
      switch (selectedMetric) {
        case 'completion':
          return safePercentage(completed, total, 0);
        case 'productivity':
          // Score de productivité basé sur les MIT (plus important)
          return safePercentage(mitCompleted, mitTotal, 0);
        case 'consistency':
          // Régularité basée sur le fait d'avoir fait au moins quelque chose
          return (mitCompleted > 0 || metCompleted > 0) ? 100 : 0;
        default:
          return safePercentage(completed, total, 0);
      }
    };

    // ✅ Protection: Vérifier que data existe
    if (!data) {
      console.log('⚠️ ProgressCharts - data is null/undefined');
      return {
        labels: [''],
        datasets: [{ data: [0] }]
      };
    }

    switch (selectedPeriod) {
      case 'week':
        const weeklyLabels = [t('statistics.charts.days.mon'), t('statistics.charts.days.tue'), t('statistics.charts.days.wed'), t('statistics.charts.days.thu'), t('statistics.charts.days.fri'), t('statistics.charts.days.sat'), t('statistics.charts.days.sun')];
        const weeklyData = data.dailyData && Array.isArray(data.dailyData) ? 
          data.dailyData.map(getMetricValue) : 
          [0, 0, 0, 0, 0, 0, 0];
        
        console.log('📊 Week chart data:', weeklyData);
        
        return {
          labels: weeklyLabels,
          datasets: [{
            data: weeklyData.length > 0 ? weeklyData : [0, 0, 0, 0, 0, 0, 0],
            color: (opacity = 1) => `rgba(76, 217, 100, ${opacity})`,
            strokeWidth: 3
          }]
        };
      
      case 'month':
        const monthlyLabels = [t('statistics.charts.weeks.w1'), t('statistics.charts.weeks.w2'), t('statistics.charts.weeks.w3'), t('statistics.charts.weeks.w4')];
        const monthlyData = data.weeklyData && Array.isArray(data.weeklyData) ? 
          data.weeklyData.map(getMetricValue) : 
          [0, 0, 0, 0];
        
        console.log('📊 Month chart data:', monthlyData);
        
        return {
          labels: monthlyLabels,
          datasets: [{
            data: monthlyData.length > 0 ? monthlyData : [0, 0, 0, 0],
            color: (opacity = 1) => `rgba(76, 217, 100, ${opacity})`,
            strokeWidth: 3
          }]
        };
      
      case 'year':
        const yearlyLabels = [t('statistics.charts.months.jan'), t('statistics.charts.months.feb'), t('statistics.charts.months.mar'), t('statistics.charts.months.apr'), t('statistics.charts.months.may'), t('statistics.charts.months.jun'), t('statistics.charts.months.jul'), t('statistics.charts.months.aug')];
        const yearlyData = data.monthlyData && Array.isArray(data.monthlyData) ? 
          data.monthlyData.map(getMetricValue) : 
          [0, 0, 0, 0, 0, 0, 0, 0];
        
        console.log('📊 Year chart data:', yearlyData);
        
        return {
          labels: yearlyLabels,
          datasets: [{
            data: yearlyData.length > 0 ? yearlyData : [0, 0, 0, 0, 0, 0, 0, 0],
            color: (opacity = 1) => `rgba(76, 217, 100, ${opacity})`,
            strokeWidth: 3
          }]
        };
      
      default:
        return {
          labels: [''],
          datasets: [{ data: [0] }]
        };
    }
  };

  // ✅ CORRIGÉ: Données pour le graphique MIT ou MET avec protection
  const getCompletionPieData = () => {
    // ✅ Protection: Vérifier que data existe
    if (!data) {
      return [
        {
          name: t('statistics.charts.pie.noData'),
          population: 100,
          color: 'rgba(255, 255, 255, 0.3)',
          legendFontColor: 'rgba(255, 255, 255, 0.7)',
          legendFontSize: 12,
        }
      ];
    }

    let completed, total, completedLabel, notCompletedLabel, mainColor;
    
    if (selectedChart === 'MIT') {
      completed = safeValue(data.mitCompleted, 0);
      total = safeValue(data.mitTotal, 0);
      completedLabel = t('statistics.charts.pie.mitCompleted');
      notCompletedLabel = t('statistics.charts.pie.mitNotCompleted');
      mainColor = '#007AFF';
    } else {
      completed = safeValue(data.metCompleted, 0);
      total = safeValue(data.metTotal, 0);
      completedLabel = t('statistics.charts.pie.metCompleted');
      notCompletedLabel = t('statistics.charts.pie.metNotCompleted');
      mainColor = '#FF9500';
    }
    
    const notCompleted = Math.max(0, total - completed);
    
    console.log('🥧 Pie chart data:', { selectedChart, completed, total, notCompleted });
    
    if (total === 0) {
      return [
        {
          name: t('statistics.charts.pie.noData'),
          population: 100,
          color: 'rgba(255, 255, 255, 0.3)',
          legendFontColor: 'rgba(255, 255, 255, 0.7)',
          legendFontSize: 12,
        }
      ];
    }
    
    return [
      {
        name: completedLabel,
        population: completed > 0 ? completed : 1, // ✅ Éviter 0 dans les pie charts
        color: mainColor,
        legendFontColor: '#FFFFFF',
        legendFontSize: 12,
      },
      {
        name: notCompletedLabel,
        population: notCompleted > 0 ? notCompleted : 1, // ✅ Éviter 0 dans les pie charts
        color: 'rgba(255, 255, 255, 0.3)',
        legendFontColor: '#FFFFFF',
        legendFontSize: 12,
      }
    ];
  };

  // Rendu du sélecteur de métriques
  const renderMetricSelector = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.metricSelector}
        contentContainerStyle={styles.metricSelectorContent}
      >
        {METRICS.map((metric) => {
          const isSelected = metric.id === selectedMetric;
          const IconComponent = metric.icon;
          
          return (
            <TouchableOpacity
              key={metric.id}
              style={[
                styles.metricButton,
                isSelected && [
                  styles.metricButtonSelected,
                  { backgroundColor: `${metric.color}20`, borderColor: metric.color }
                ],
              ]}
              onPress={() => handleMetricChange(metric.id)}
              activeOpacity={0.7}
            >
              <IconComponent 
                size={16} 
                color={isSelected ? metric.color : 'rgba(255, 255, 255, 0.6)'} 
                strokeWidth={2}
              />
              <Text style={[
                styles.metricLabel,
                isSelected && [styles.metricLabelSelected, { color: metric.color }],
              ]}>
                {t(`statistics.charts.metrics.${metric.id}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  // Rendu du sélecteur MIT/MET
  const renderChartTypeSelector = () => {
    const chartTypes = [
      { id: 'MIT', label: 'MIT', color: '#007AFF' },
      { id: 'MET', label: 'MET', color: '#FF9500' }
    ];
    
    return (
      <View style={styles.chartTypeSelector}>
        {chartTypes.map((type) => {
          const isSelected = type.id === selectedChart;
          
          return (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.chartTypeButton,
                isSelected && [
                  styles.chartTypeButtonSelected,
                  { backgroundColor: `${type.color}20`, borderColor: type.color }
                ],
              ]}
              onPress={() => handleChartTypeChange(type.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.chartTypeLabel,
                isSelected && [styles.chartTypeLabelSelected, { color: type.color }],
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const chartData = getChartData();
  const pieData = getCompletionPieData();

  // ✅ DEBUG: Logs pour vérifier les données finales
  console.log('📊 ProgressCharts - Final data:', { chartData, pieData });

  return (
    <View style={styles.container}>
      {/* Titre de section */}
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>{t('statistics.charts.title')}</Text>
        <Text style={styles.sectionSubtitle}>{t('statistics.charts.subtitle')}</Text>
      </View>

      {/* Sélecteur de métriques */}
      {renderMetricSelector()}

      {/* Graphique principal en ligne */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>
          {t(`statistics.charts.metrics.${selectedMetric}`)} - {t(`statistics.charts.periods.${selectedPeriod}`)}
        </Text>
        
        <View style={styles.chartWrapper}>
          <LineChart
            data={chartData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withVerticalLines={false}
            withHorizontalLines={true}
            withDots={true}
            withShadow={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            yAxisSuffix="%"
            segments={4}
          />
        </View>
      </View>

      {/* Graphique circulaire de completion */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{t('statistics.charts.pieTitle')}</Text>
        
        {/* Sélecteur MIT/MET */}
        {renderChartTypeSelector()}
        
        <View style={styles.chartWrapper}>
          <PieChart
            data={pieData}
            width={chartWidth}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
            hasLegend={true}
          />
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
  
  // Sélecteur de métriques
  metricSelector: {
    marginBottom: 20,
  },
  metricSelectorContent: {
    paddingRight: 20,
    gap: 12,
  },
  metricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  metricButtonSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  metricLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  metricLabelSelected: {
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  
  // Containers des graphiques
  chartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  
  // Sélecteur MIT/MET
  chartTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  chartTypeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chartTypeButtonSelected: {
    borderWidth: 2,
  },
  chartTypeLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  chartTypeLabelSelected: {
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
});
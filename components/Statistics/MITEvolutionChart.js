// FICHIER: ./components/Statistics/MITEvolutionChart.js

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { TrendingUp, BarChart3, CheckCircle } from 'lucide-react-native';

const screenWidth = Dimensions.get('window').width;

export default function MITEvolutionChart({ 
  data, 
  isLoading = false,
  period = 'month' 
}) {
  // Plus de sélecteur de vue - on affiche seulement le nombre de MIT
  
  // Configuration du graphique
  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10,
      fontFamily: 'Poppins-Medium',
      fill: 'rgba(255, 255, 255, 0.6)',
    },
    propsForBackgroundLines: {
      stroke: 'rgba(255, 255, 255, 0.1)',
      strokeWidth: 1,
    },
    propsForDots: {
      r: '3',
      strokeWidth: '1',
      stroke: '#10B981',
      fill: '#10B981',
    },
  };

  // Données par défaut si pas de données
  const defaultData = {
    labels: ['...'],
    datasets: [{
      data: [0],
      color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
      strokeWidth: 2,
    }]
  };

  // Filtrage des labels selon la période pour éviter la saturation
  const getFilteredLabelsAndData = () => {
    if (!data || !data.labels || data.labels.length === 0) {
      return {
        labels: ['...'],
        data: [0]
      };
    }

    const originalLabels = data.labels;
    const originalData = data.mitData.completed;
    
    let filteredLabels = [];
    let filteredData = [];
    
    switch (period) {
      case 'week':
        // Semaine : afficher tous les jours
        filteredLabels = originalLabels;
        filteredData = originalData;
        break;
        
      case 'month':
        // Mois : afficher tous les 5 jours
        originalLabels.forEach((label, index) => {
          if (index === 0 || index === originalLabels.length - 1 || index % 5 === 0) {
            filteredLabels.push(label);
            filteredData.push(originalData[index] || 0);
          }
        });
        break;
        
      case 'year':
        // Année : afficher 1 mois sur 2 en partant de la droite (mois actuel)
        const seenLabels = new Set();
        
        // Parcourir de droite à gauche (du plus récent au plus ancien)
        for (let index = originalLabels.length - 1; index >= 0; index--) {
          const label = originalLabels[index];
          const distanceFromEnd = originalLabels.length - 1 - index;
          
          // Prendre le dernier (mois actuel) puis 1 mois sur 2 (tous les 60 jours environ)
          const shouldInclude = index === originalLabels.length - 1 || // dernier (actuel)
                               index === 0 || // premier (début période)
                               distanceFromEnd % 60 === 0; // tous les 60 jours depuis la fin
          
          if (shouldInclude && !seenLabels.has(label)) {
            seenLabels.add(label);
            filteredLabels.unshift(label); // Ajouter au début pour maintenir l'ordre chronologique
            filteredData.unshift(originalData[index] || 0);
          }
        }
        break;
        
      default:
        filteredLabels = originalLabels;
        filteredData = originalData;
    }

    return {
      labels: filteredLabels.length > 0 ? filteredLabels : ['...'],
      data: filteredData.length > 0 ? filteredData : [0]
    };
  };

  // Préparation des données pour le graphique
  const getChartData = () => {
    const { labels, data: chartData } = getFilteredLabelsAndData();

    return {
      labels: labels,
      datasets: [{
        data: chartData,
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2,
      }]
    };
  };

  // Métriques d'en-tête simplifiées
  const getHeaderMetrics = () => {
    if (!data || !data.mitData) {
      return { total: 0, average: 0 };
    }

    const values = data.mitData.completed;

    if (values.length === 0) {
      return { total: 0, average: 0 };
    }

    const total = values.reduce((a, b) => a + b, 0);
    const average = Math.round(total / values.length);

    return { total, average };
  };

  const metrics = getHeaderMetrics();

  // Titre selon la période
  const getPeriodTitle = () => {
    switch (period) {
      case 'week': return 'Cette semaine';
      case 'month': return 'Ce mois';
      case 'year': return 'Cette année';
      default: return 'Période';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement du graphique MIT...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <CheckCircle size={24} color="#10B981" />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>MIT réalisées</Text>
            <Text style={styles.subtitle}>{getPeriodTitle()}</Text>
          </View>
        </View>
        
        <View style={styles.metricsContainer}>
          <Text style={styles.mainMetric}>
            {metrics.total}
          </Text>
          <Text style={styles.subMetric}>
            {metrics.average}/jour
          </Text>
        </View>
      </View>

      {/* Graphique */}
      <View style={styles.chartContainer}>
        <LineChart
          data={getChartData()}
          width={screenWidth - 60}
          height={180}
          chartConfig={chartConfig}
          style={styles.chart}
          withHorizontalLabels={true}
          withVerticalLabels={true}
          withDots={true}
          withShadow={false}
          withScrollableDot={false}
          withInnerLines={false}
          withOuterLines={false}
          segments={3}
          fromZero={true}
        />
      </View>

      {/* Légende */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>
            Nombre de MIT réalisées par jour
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  
  // Loading
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  
  // En-tête
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleContainer: {
    marginLeft: 12,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  metricsContainer: {
    alignItems: 'flex-end',
  },
  mainMetric: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#10B981',
    lineHeight: 28,
  },
  subMetric: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  
  // Graphique
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  chart: {
    borderRadius: 12,
  },
  
  // Légende
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
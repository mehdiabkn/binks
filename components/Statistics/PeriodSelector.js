import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, BarChart2 } from 'lucide-react-native';
import HapticFeedback from 'react-native-haptic-feedback';

export default function PeriodSelector({ selectedPeriod, onPeriodChange }) {
  const { t } = useTranslation();

  const PERIODS = [
    {
      id: 'week',
      label: t('statistics.periods.week.label'),
      shortLabel: t('statistics.periods.week.shortLabel'),
      icon: Clock,
      color: '#4CD964',
    },
    {
      id: 'month',
      label: t('statistics.periods.month.label'),
      shortLabel: t('statistics.periods.month.shortLabel'),
      icon: Calendar,
      color: '#007AFF',
    },
    {
      id: 'year',
      label: t('statistics.periods.year.label'),
      shortLabel: t('statistics.periods.year.shortLabel'),
      icon: BarChart2,
      color: '#FF9500',
    },
  ];
  
  // Fonction de feedback haptique
  const triggerHapticFeedback = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger('selection', options);
  };

  // Gestion du changement de période
  const handlePeriodPress = (periodId) => {
    if (periodId === selectedPeriod) return;
    
    triggerHapticFeedback();
    onPeriodChange(periodId);
    console.log('📊 Période changée vers:', periodId);
  };

  // Rendu d'un bouton de période
  const renderPeriodButton = (period) => {
    const isSelected = period.id === selectedPeriod;
    const IconComponent = period.icon;
    
    return (
      <TouchableOpacity
        key={period.id}
        style={[
          styles.periodButton,
          isSelected && [
            styles.periodButtonSelected,
            { backgroundColor: `${period.color}20`, borderColor: period.color }
          ],
        ]}
        onPress={() => handlePeriodPress(period.id)}
        activeOpacity={0.7}
      >
        {/* Container icône */}
        <View style={[
          styles.iconContainer,
          isSelected && {
            backgroundColor: period.color,
            shadowColor: period.color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
          }
        ]}>
          <IconComponent 
            size={isSelected ? 18 : 16} 
            color={isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'} 
            strokeWidth={2}
          />
        </View>

        {/* Labels */}
        <View style={styles.labelContainer}>
          <Text style={[
            styles.periodLabel,
            isSelected && [styles.periodLabelSelected, { color: period.color }],
          ]}>
            {period.label}
          </Text>
          <Text style={[
            styles.periodShortLabel,
            isSelected && { color: 'rgba(255, 255, 255, 0.8)' },
          ]}>
            {period.shortLabel}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Titre de section */}
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>{t('statistics.periods.title')}</Text>
        <Text style={styles.sectionSubtitle}>{t('statistics.periods.subtitle')}</Text>
      </View>

      {/* Boutons de période */}
      <View style={styles.buttonsContainer}>
        {PERIODS.map(period => renderPeriodButton(period))}
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
  
  // Container des boutons
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  
  // Bouton de période
  periodButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    position: 'relative',
    minHeight: 90,
    justifyContent: 'center',
  },
  periodButtonSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  
  // Container icône
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  
  // Labels
  labelContainer: {
    alignItems: 'center',
  },
  periodLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  periodLabelSelected: {
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  periodShortLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
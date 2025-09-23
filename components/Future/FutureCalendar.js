// FutureCalendar.js

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
import HapticFeedback from 'react-native-haptic-feedback';

const { width } = Dimensions.get('window');

export default function FutureCalendar({ 
  selectedDate, 
  onDateChange, 
  calendarView, 
  onViewChange, 
  dailyData 
}) {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const triggerHapticFeedback = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger('selection', options);
  };

  // Navigation mois précédent/suivant
  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
    triggerHapticFeedback();
  };

  // Navigation semaine précédente/suivante
  const navigateWeek = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction * 7));
    onDateChange(newDate);
    setCurrentMonth(new Date(newDate));
    triggerHapticFeedback();
  };

  // Obtenir les jours du mois
  const getMonthDays = () => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    
    // Commencer au lundi de la semaine
    startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7));
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // 6 semaines maximum
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        weekDays.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      days.push(weekDays);
      
      // Arrêter si on a dépassé le mois et qu'on est sur une nouvelle semaine
      if (currentDate.getMonth() !== currentMonth.getMonth() && week >= 4) {
        break;
      }
    }
    
    return days;
  };

  // Obtenir les jours de la semaine
  const getWeekDays = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - ((selectedDate.getDay() + 6) % 7));
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  // ✅ SYSTÈME COULEUR ROUGE/ORANGE/VERT avec les données daily_scores
  const getDateStatus = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    const data = dailyData[dateKey];
    
    // Si pas de données pour cette date, pas d'indicateur
    if (!data || !data.hasActivity) return null;
    
    const { mitCompletion, metAvoidance } = data;
    
    // Calculer le score global de performance
    let performanceScore = 0;
    
    if (mitCompletion !== undefined && metAvoidance !== undefined) {
      // Si on a les deux : MIT compte pour 70%, MET pour 30%
      performanceScore = (mitCompletion * 0.7) + (metAvoidance * 0.3);
    } else if (mitCompletion !== undefined) {
      // Seulement MIT
      performanceScore = mitCompletion;
    } else if (metAvoidance !== undefined) {
      // Seulement MET  
      performanceScore = metAvoidance;
    }
    
    // Système Rouge/Orange/Vert
    if (performanceScore === 0) {
      return 'failed';  // 🔴 Rouge - 0%
    } else if (performanceScore === 1) {
      return 'perfect'; // 🟢 Vert - 100%
    } else {
      return 'partial'; // 🟠 Orange - 1-99%
    }
  };

  const renderDayCell = (date, isCurrentMonth = true) => {
    const isSelected = date.toDateString() === selectedDate.toDateString();
    const isToday = date.toDateString() === new Date().toDateString();
    const status = getDateStatus(date);
    
    return (
      <TouchableOpacity
        key={date.toISOString()}
        style={[
          styles.dayCell,
          isSelected && styles.selectedDay,
          isToday && styles.todayBorder,
          !isCurrentMonth && styles.otherMonthDay,
        ]}
        onPress={() => {
          triggerHapticFeedback();
          onDateChange(date);
          
          // Si on est en vue mois, passer automatiquement en vue semaine
          if (calendarView === 'month') {
            onViewChange('week');
          }
        }}
      >
        <Text style={[
          styles.dayText,
          isSelected && styles.selectedDayText,
          isToday && !isSelected && styles.todayText,
          !isCurrentMonth && styles.otherMonthText,
        ]}>
          {date.getDate()}
        </Text>
        
        {/* Indicateurs colorés Rouge/Orange/Vert */}
        {status && (
          <View style={[
            styles.statusIndicator,
            status === 'perfect' && styles.perfectIndicator, // 🟢 Vert
            status === 'partial' && styles.partialIndicator, // 🟠 Orange
            status === 'failed' && styles.failedIndicator,   // 🔴 Rouge
          ]} />
        )}
      </TouchableOpacity>
    );
  };

  // Fonction pour obtenir le texte à afficher selon la vue
  const getDisplayText = () => {
    if (calendarView === 'month') {
      const currentYear = new Date().getFullYear();
      const viewYear = currentMonth.getFullYear();
      
      if (currentYear !== viewYear) {
        // Afficher mois + année si différent de l'année courante
        return currentMonth.toLocaleDateString(t('calendar.locale'), { 
          month: 'long', 
          year: 'numeric' 
        });
      } else {
        // Afficher seulement le mois si même année
        return currentMonth.toLocaleDateString(t('calendar.locale'), { 
          month: 'long'
        });
      }
    }
    // Pour la vue semaine, ne rien afficher
    return null;
  };

  // En-têtes des jours traduits
  const weekDayHeaders = [
    t('calendar.days.short.mon'),
    t('calendar.days.short.tue'),
    t('calendar.days.short.wed'),
    t('calendar.days.short.thu'),
    t('calendar.days.short.fri'),
    t('calendar.days.short.sat'),
    t('calendar.days.short.sun')
  ];

  return (
    <View style={styles.container}>
      {/* Header avec navigation */}
      <View style={styles.header}>
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              if (calendarView === 'week') {
                navigateWeek(-1);
              } else {
                navigateMonth(-1);
              }
            }}
          >
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
          
          {/* Sélecteur de vue */}
          <View style={styles.viewSelector}>
            <TouchableOpacity
              style={[
                styles.viewButton,
                calendarView === 'week' && styles.activeViewButton
              ]}
              onPress={() => {
                triggerHapticFeedback();
                onViewChange('week');
              }}
            >
              <Text style={[
                styles.viewButtonText,
                calendarView === 'week' && styles.activeViewButtonText
              ]}>
                {t('calendar.views.week')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.viewButton,
                calendarView === 'month' && styles.activeViewButton
              ]}
              onPress={() => {
                triggerHapticFeedback();
                onViewChange('month');
              }}
            >
              <Text style={[
                styles.viewButtonText,
                calendarView === 'month' && styles.activeViewButtonText
              ]}>
                {t('calendar.views.month')}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              if (calendarView === 'week') {
                navigateWeek(1);
              } else {
                navigateMonth(1);
              }
            }}
          >
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </View>
        
        {/* Affichage conditionnel du mois/année */}
        {getDisplayText() && (
          <Text style={styles.monthTitle}>
            {getDisplayText()}
          </Text>
        )}
      </View>

      {/* En-têtes des jours */}
      <View style={styles.weekHeader}>
        {weekDayHeaders.map((day, index) => (
          <Text key={index} style={styles.weekHeaderText}>{day}</Text>
        ))}
      </View>

      {/* Grille du calendrier */}
      <View style={styles.calendar}>
        {calendarView === 'month' ? (
          // Vue mois
          getMonthDays().map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map(date => 
                renderDayCell(
                  date, 
                  date.getMonth() === currentMonth.getMonth()
                )
              )}
            </View>
          ))
        ) : (
          // Vue semaine
          <View style={styles.weekRow}>
            {getWeekDays().map(date => renderDayCell(date, true))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  header: {
    marginBottom: 16,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginTop: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 2,
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
  },
  activeViewButton: {
    backgroundColor: '#FFD700',
  },
  viewButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeViewButtonText: {
    color: '#000000',
    fontFamily: 'Poppins-Bold',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  calendar: {
    gap: 4,
  },
  weekRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative',
  },
  selectedDay: {
    backgroundColor: '#FFD700',
  },
  todayBorder: {
    borderWidth: 2,
    borderColor: '#4CD964',
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  dayText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  selectedDayText: {
    color: '#000000',
    fontFamily: 'Poppins-Bold',
  },
  todayText: {
    color: '#4CD964',
    fontFamily: 'Poppins-Bold',
  },
  otherMonthText: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // Système de couleurs Rouge/Orange/Vert
  perfectIndicator: {
    backgroundColor: '#4CD964', // 🟢 Vert - 100% réussite
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  partialIndicator: {
    backgroundColor: '#FF8C42', // 🟠 Orange - Performance partielle
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  failedIndicator: {
    backgroundColor: '#FF453A', // 🔴 Rouge - Aucune réussite
    shadowColor: '#FF453A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
});
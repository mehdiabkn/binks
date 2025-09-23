import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { 
  Plus,
  Target,
  TrendingUp,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react-native';
import HapticFeedback from 'react-native-haptic-feedback';

export default function ProgressSummary({ objectives, onAddObjective }) {
  const { t } = useTranslation();
  
  // Fonction de feedback haptique
  const triggerHapticFeedback = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger('selection', options);
  };

  // Calculs des statistiques
  const totalObjectives = objectives.length;
  const completedObjectives = objectives.filter(obj => obj.completed).length;
  const activeObjectives = totalObjectives - completedObjectives;
  const completionRate = totalObjectives > 0 ? Math.round((completedObjectives / totalObjectives) * 100) : 0;

  // Objectifs par priorité
  const highPriorityActive = objectives.filter(obj => !obj.completed && obj.priority === 'high').length;
  const mediumPriorityActive = objectives.filter(obj => !obj.completed && obj.priority === 'medium').length;
  const lowPriorityActive = objectives.filter(obj => !obj.completed && obj.priority === 'low').length;

  // Objectifs urgents (deadline < 30 jours)
  const urgentObjectives = objectives.filter(obj => {
    if (obj.completed) return false;
    const today = new Date();
    const deadline = new Date(obj.deadline);
    const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    return daysRemaining <= 30 && daysRemaining > 0;
  }).length;

  // Progression moyenne
  const averageProgress = objectives.length > 0 ? 
    Math.round(objectives.reduce((sum, obj) => {
      const progress = (obj.currentValue / obj.targetValue) * 100;
      return sum + Math.min(progress, 100);
    }, 0) / objectives.length) : 0;

  // Gestion de l'ajout d'objectif
  const handleAddObjective = () => {
    triggerHapticFeedback();
    onAddObjective();
  };

  // Configuration des cartes de statistiques
  const statsCards = [
    {
      id: 'completion',
      title: t('objectives.summary.cards.completion.title'),
      value: `${completionRate}%`,
      subtitle: t('objectives.summary.cards.completion.subtitle', { 
        completed: completedObjectives, 
        total: totalObjectives 
      }),
      icon: CheckCircle2,
      color: '#4CD964',
      backgroundColor: 'rgba(76, 217, 100, 0.15)',
    },
    {
      id: 'active',
      title: t('objectives.summary.cards.active.title'),
      value: activeObjectives.toString(),
      subtitle: t('objectives.summary.cards.active.subtitle'),
      icon: Target,
      color: '#007AFF',
      backgroundColor: 'rgba(0, 122, 255, 0.15)',
    },
    {
      id: 'urgent',
      title: t('objectives.summary.cards.urgent.title'),
      value: urgentObjectives.toString(),
      subtitle: t('objectives.summary.cards.urgent.subtitle'),
      icon: Clock,
      color: urgentObjectives > 0 ? '#FF6B6B' : '#FFD700',
      backgroundColor: urgentObjectives > 0 ? 'rgba(255, 107, 107, 0.15)' : 'rgba(255, 215, 0, 0.15)',
    },
    {
      id: 'average',
      title: t('objectives.summary.cards.average.title'),
      value: `${averageProgress}%`,
      subtitle: t('objectives.summary.cards.average.subtitle'),
      icon: TrendingUp,
      color: '#FF9500',
      backgroundColor: 'rgba(255, 149, 0, 0.15)',
    },
  ];

  // Rendu d'une carte de statistique
  const renderStatsCard = (card, index) => {
    const IconComponent = card.icon;
    const isLargeCard = index < 2; // Les 2 premières cartes sont plus grandes
    
    return (
      <View
        key={card.id}
        style={[
          styles.statsCard,
          isLargeCard ? styles.largeStatsCard : styles.smallStatsCard,
          { backgroundColor: card.backgroundColor, borderColor: `${card.color}30` }
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: card.color }]}>
            <IconComponent size={isLargeCard ? 20 : 18} color="#FFFFFF" strokeWidth={2} />
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={[styles.cardValue, isLargeCard && styles.largeCardValue]}>
            {card.value}
          </Text>
          <Text style={[styles.cardTitle, isLargeCard && styles.largeCardTitle]}>
            {card.title}
          </Text>
          <Text style={styles.cardSubtitle}>
            {card.subtitle}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header avec bouton d'ajout */}
      <View style={styles.headerContainer}>
        <View style={styles.titleSection}>
          <Text style={styles.sectionTitle}>
            {t('objectives.summary.title')}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {t('objectives.summary.subtitle')}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddObjective}
          activeOpacity={0.8}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addButtonText}>
            {t('objectives.summary.addButton')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Grille des cartes de statistiques */}
      <View style={styles.statsGrid}>
        {/* Première ligne - cartes principales */}
        <View style={styles.statsRow}>
          {statsCards.slice(0, 2).map((card, index) => renderStatsCard(card, index))}
        </View>
        
        {/* Deuxième ligne - cartes secondaires */}
        <View style={styles.statsRow}>
          {statsCards.slice(2, 4).map((card, index) => renderStatsCard(card, index + 2))}
        </View>
      </View>

      {/* Section de répartition par priorité */}
      {activeObjectives > 0 && (
        <View style={styles.prioritySection}>
          <Text style={styles.priorityTitle}>
            {t('objectives.summary.priorityBreakdown.title')}
          </Text>
          
          <View style={styles.priorityGrid}>
            <View style={styles.priorityItem}>
              <View style={[styles.priorityIndicator, { backgroundColor: '#FF6B6B' }]} />
              <Text style={styles.priorityLabel}>
                {t('objectives.summary.priorityBreakdown.high')}
              </Text>
              <Text style={styles.priorityValue}>{highPriorityActive}</Text>
            </View>
            
            <View style={styles.priorityItem}>
              <View style={[styles.priorityIndicator, { backgroundColor: '#FFD700' }]} />
              <Text style={styles.priorityLabel}>
                {t('objectives.summary.priorityBreakdown.medium')}
              </Text>
              <Text style={styles.priorityValue}>{mediumPriorityActive}</Text>
            </View>
            
            <View style={styles.priorityItem}>
              <View style={[styles.priorityIndicator, { backgroundColor: '#4CD964' }]} />
              <Text style={styles.priorityLabel}>
                {t('objectives.summary.priorityBreakdown.low')}
              </Text>
              <Text style={styles.priorityValue}>{lowPriorityActive}</Text>
            </View>
          </View>
        </View>
      )}

     
     
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  
  // Header
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleSection: {
    flex: 1,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  
  // Grille des statistiques
  statsGrid: {
    marginBottom: 20,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  largeStatsCard: {
    flex: 1,
    minHeight: 100,
  },
  smallStatsCard: {
    flex: 1,
    minHeight: 85,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardValue: {
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  largeCardValue: {
    fontSize: 24,
  },
  cardTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  largeCardTitle: {
    fontSize: 13,
  },
  cardSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 14,
  },
  
  // Section priorités
  prioritySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  priorityTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  priorityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityItem: {
    alignItems: 'center',
    flex: 1,
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  priorityLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  priorityValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  
  // Section motivation
  motivationSection: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  motivationIcon: {
    marginRight: 12,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  motivationContent: {
    flex: 1,
  },
  motivationTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  motivationText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
});
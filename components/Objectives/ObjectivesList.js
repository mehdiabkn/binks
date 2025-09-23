import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Minus, 
  Target,
  CheckCircle,
  Trash2
} from 'lucide-react-native';
import HapticFeedback from 'react-native-haptic-feedback';

import ContinuousProgressUpdater from './ContinuousProgressUpdater';

const CATEGORY_COLORS = {
  personal: '#4CD964',
  professional: '#007AFF', 
  health: '#FF6B6B',
  learning: '#FF9500',
};

const PRIORITY_COLORS = {
  high: '#FF6B6B',
  medium: '#FFD700',
  low: '#4CD964',
};

export default function ObjectivesList({ 
  objectives, 
  onUpdateProgress, 
  onDeleteObjective,
  selectedCategory 
}) {
  const { t } = useTranslation();
  const [expandedObjective, setExpandedObjective] = useState(null);

  // Fonction de feedback haptique
  const triggerHapticFeedback = (type = 'selection') => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger(type, options);
  };

  // Gestion de l'expansion/collapse d'un objectif
  const toggleObjectiveExpansion = (objectiveId) => {
    triggerHapticFeedback();
    setExpandedObjective(prev => prev === objectiveId ? null : objectiveId);
  };

  // Gestion de la progression incrémentale (+ et -)
  const handleIncrementalProgress = (objective, increment) => {
    const newValue = Math.max(0, Math.min(objective.targetValue, objective.currentValue + increment));
    triggerHapticFeedback(increment > 0 ? 'impactLight' : 'impactMedium');
    onUpdateProgress(objective.id, newValue);
  };

  // Gestion de la suppression
  const handleDeleteObjective = (objective) => {
    triggerHapticFeedback('notificationWarning');
    Alert.alert(
      t('objectives.list.deleteConfirm.title'),
      t('objectives.list.deleteConfirm.message', { title: objective.title }),
      [
        {
          text: t('objectives.list.deleteConfirm.cancel'),
          style: 'cancel',
        },
        {
          text: t('objectives.list.deleteConfirm.delete'),
          style: 'destructive',
          onPress: () => {
            triggerHapticFeedback('notificationSuccess');
            onDeleteObjective(objective.id);
          },
        },
      ]
    );
  };

  // Calcul du pourcentage de progression
  const getProgressPercentage = (objective) => {
    if (!objective.hasTarget) {
      // Objectif simple : 0% ou 100%
      return objective.completed ? 100 : 0;
    }
    return Math.round((objective.currentValue / objective.targetValue) * 100);
  };

  // Rendu des contrôles de progression selon le type
  const renderProgressControls = (objective) => {
    const isExpanded = expandedObjective === objective.id;
    
    if (objective.progressType === 'continuous') {
      // Progression continue : bouton d'ajout personnalisé
      return (
        <View style={styles.progressControlsContainer}>
          <ContinuousProgressUpdater
            objective={objective}
            onUpdateProgress={onUpdateProgress}
            style={styles.continuousProgressButton}
          />
        </View>
      );
    } else {
      // Progression incrémentale : boutons + et - ALIGNÉS HORIZONTALEMENT
      return (
        <View style={styles.progressControlsContainer}>
          <View style={styles.incrementalControls}>
            <TouchableOpacity
              style={[
                styles.incrementButton,
                objective.currentValue <= 0 && styles.incrementButtonDisabled,
              ]}
              onPress={() => handleIncrementalProgress(objective, -1)}
              disabled={objective.currentValue <= 0}
              activeOpacity={0.7}
            >
              <Minus size={18} color={objective.currentValue <= 0 ? 'rgba(255, 255, 255, 0.3)' : '#FFFFFF'} strokeWidth={2} />
            </TouchableOpacity>
            
            <View style={styles.currentValueContainer}>
              <Text style={styles.currentValueText}>
                {objective.currentValue}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.incrementButton,
                objective.currentValue >= objective.targetValue && styles.incrementButtonDisabled,
              ]}
              onPress={() => handleIncrementalProgress(objective, 1)}
              disabled={objective.currentValue >= objective.targetValue}
              activeOpacity={0.7}
            >
              <Plus size={18} color={objective.currentValue >= objective.targetValue ? 'rgba(255, 255, 255, 0.3)' : '#FFFFFF'} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  };

  // Rendu des milestones
  const renderMilestones = (objective) => {
    if (!objective.milestones || objective.milestones.length === 0) return null;
    
    return (
      <View style={styles.milestonesContainer}>
        <Text style={styles.milestonesTitle}>
          {t('objectives.list.milestones')}
        </Text>
        {objective.milestones.map((milestone, index) => (
          <View key={index} style={styles.milestoneItem}>
            <CheckCircle 
              size={16} 
              color={milestone.completed ? '#4CD964' : 'rgba(255, 255, 255, 0.3)'} 
              strokeWidth={2}
              fill={milestone.completed ? '#4CD964' : 'transparent'}
            />
            <Text style={[
              styles.milestoneText,
              milestone.completed && styles.milestoneTextCompleted,
            ]}>
              {milestone.label} ({milestone.value} {objective.unit})
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (objectives.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Target size={48} color="rgba(255, 255, 255, 0.3)" strokeWidth={1} />
        <Text style={styles.emptyTitle}>
          {t('objectives.list.empty.title')}
        </Text>
        <Text style={styles.emptySubtitle}>
          {selectedCategory === 'all' 
            ? t('objectives.list.empty.subtitleAll')
            : t('objectives.list.empty.subtitleCategory', { category: t(`objectives.categories.${selectedCategory}`) })
          }
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {objectives.map((objective) => {
        const isExpanded = expandedObjective === objective.id;
        const progressPercentage = getProgressPercentage(objective);
        const categoryColor = CATEGORY_COLORS[objective.category];
        const priorityColor = PRIORITY_COLORS[objective.priority];

        return (
          <View key={objective.id} style={styles.objectiveCard}>
            {/* Header de la carte */}
            <TouchableOpacity
              style={styles.objectiveHeader}
              onPress={() => toggleObjectiveExpansion(objective.id)}
              activeOpacity={0.8}
            >
              <View style={styles.objectiveMainInfo}>
                {/* Titre et catégorie */}
                <View style={styles.objectiveTitleRow}>
                  <Text style={styles.objectiveTitle} numberOfLines={isExpanded ? undefined : 2}>
                    {objective.title}
                  </Text>
                  <View style={[styles.categoryIndicator, { backgroundColor: categoryColor }]} />
                </View>

                {/* Progression */}
                <View style={styles.objectiveMetaRow}>
                  <View style={styles.progressInfo}>
                    {objective.hasTarget ? (
                      <>
                        <Text style={styles.progressText}>
                          {objective.currentValue} / {objective.targetValue} {objective.unit}
                        </Text>
                        <Text style={styles.progressPercentage}>
                          ({progressPercentage}%)
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.simpleProgressText}>
                        {objective.completed ? t('objectives.list.completed') : t('objectives.list.pending')}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Barre de progression */}
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { 
                          width: `${progressPercentage}%`,
                          backgroundColor: categoryColor,
                        }
                      ]} 
                    />
                  </View>
                  <View style={[styles.priorityIndicator, { backgroundColor: priorityColor }]} />
                </View>
              </View>

              {/* Actions à droite */}
              <View style={styles.actionsContainer}>
                {/* Bouton de validation directe pour objectifs simples */}
                {!objective.hasTarget ? (
                  <TouchableOpacity
                    style={styles.quickCompleteButton}
                    onPress={(e) => {
                      e.stopPropagation(); // Empêcher l'expansion de la carte
                      triggerHapticFeedback('notificationSuccess');
                      onUpdateProgress(objective.id, 1);
                    }}
                    activeOpacity={0.8}
                  >
                    <CheckCircle size={20} color="#FFFFFF" strokeWidth={2} />
                  </TouchableOpacity>
                ) : (
                  // Menu de suppression pour objectifs avec cible
                  <TouchableOpacity
                    style={styles.menuButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteObjective(objective);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={18} color="rgba(255, 255, 255, 0.6)" strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>

            {/* Contenu étendu */}
            {isExpanded && (
              <View style={styles.objectiveExpandedContent}>
                {/* Description */}
                {objective.description && (
                  <Text style={styles.objectiveDescription}>
                    {objective.description}
                  </Text>
                )}

                {/* Contrôles de progression - SEULEMENT pour objectifs avec target */}
                {objective.hasTarget && renderProgressControls(objective)}

                {/* Milestones */}
                {renderMilestones(objective)}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
  },

  // État vide
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Carte d'objectif
  objectiveCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  objectiveHeader: {
    flexDirection: 'row',
    padding: 20,
  },
  objectiveMainInfo: {
    flex: 1,
  },

  // Titre et métadonnées
  objectiveTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  objectiveTitle: {
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  categoryIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
    marginTop: 7,
  },

  objectiveMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  simpleProgressText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressPercentage: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // Barre de progression
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Actions à droite de la carte
  actionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bouton de validation rapide (objectifs simples)
  quickCompleteButton: {
    backgroundColor: '#4CD964',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CD964',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // Menu button
  menuButton: {
    padding: 8,
  },

  // Contenu étendu
  objectiveExpandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  objectiveDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    marginBottom: 20,
  },

  // Contrôles de progression
  progressControlsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },

  // Contrôles incrémentaux - ALIGNÉS HORIZONTALEMENT
  incrementalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 4,
    gap: 0,
  },
  incrementButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 12,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incrementButtonDisabled: {
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  currentValueContainer: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  currentValueText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },

  // Contrôle continu
  continuousProgressButton: {
    // Les styles sont dans le composant ContinuousProgressUpdater
  },

  // Milestones
  milestonesContainer: {
    marginTop: 8,
  },
  milestonesTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  milestoneText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  milestoneTextCompleted: {
    color: '#4CD964',
    textDecorationLine: 'line-through',
  },
});
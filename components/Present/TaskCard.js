import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 80;

export default function TaskCard({ 
  task, 
  onPress,
  onDragRelease,
  isCompleted = false,
  completedSectionY = 400,
  currentSectionY = 200,
}) {

  // Obtenir la couleur de la catégorie
  const getCategoryColor = (category) => {
    switch (category) {
      case 'work': return '#FFD700';
      case 'health': return '#4CD964';
      case 'personal': return '#FF6B6B';
      default: return '#999999';
    }
  };

  // Obtenir l'emoji de la catégorie
  const getCategoryEmoji = (category) => {
    switch (category) {
      case 'work': return '💼';
      case 'health': return '💪';
      case 'personal': return '🏠';
      default: return '📋';
    }
  };

  // Obtenir l'emoji de priorité
  const getPriorityEmoji = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: getCategoryColor(task.category),
        },
        isCompleted && styles.completedContainer,
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          console.log('🔍 Clic sur carte:', task.title, 'isCompleted:', isCompleted);
          // Seulement ouvrir la modale si pas terminée
          if (!isCompleted && onPress) {
            onPress();
          }
        }}
        activeOpacity={0.9}
      >
        {/* Badge selon l'état */}
        {!isCompleted && task.progress > 0 && (
          <View style={[
            styles.progressBadge,
            { backgroundColor: getCategoryColor(task.category) }
          ]}>
            <Text style={styles.progressBadgeText}>En cours</Text>
          </View>
        )}
        
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>Terminé</Text>
          </View>
        )}

        {/* En-tête de la carte - HEIGHT FIXE */}
        <View style={styles.cardHeader}>
          <View style={styles.categorySection}>
            <Text style={styles.categoryEmoji}>
              {getCategoryEmoji(task.category)}
            </Text>
            <Text style={[
              styles.categoryText,
              { color: getCategoryColor(task.category) },
              isCompleted && styles.completedText,
            ]}>
              {task.category}
            </Text>
          </View>
          
          <View style={styles.prioritySection}>
            <Text style={styles.priorityEmoji}>
              {isCompleted ? '✅' : getPriorityEmoji(task.priority)}
            </Text>
          </View>
        </View>

        {/* Titre de la tâche - HEIGHT FIXE */}
        <View style={styles.titleSection}>
          <Text style={[
            styles.taskTitle,
            isCompleted && styles.completedTaskTitle,
          ]} numberOfLines={2}>
            {task.title}
          </Text>
        </View>

        {/* Description - HEIGHT FIXE */}
        <View style={styles.descriptionSection}>
          {task.description ? (
            <Text style={[
              styles.taskDescription,
              isCompleted && styles.completedText,
            ]} numberOfLines={2}>
              {task.description}
            </Text>
          ) : (
            <Text style={styles.noDescription}>Aucune description</Text>
          )}
        </View>

        {/* Barre de progression - HEIGHT FIXE */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar,
                { 
                  width: isCompleted ? '100%' : `${task.progress}%`,
                  backgroundColor: getCategoryColor(task.category),
                }
              ]}
            />
          </View>
          <Text style={[
            styles.progressText,
            isCompleted && styles.completedText,
          ]}>
            {isCompleted ? '100%' : `${task.progress}%`}
          </Text>
        </View>

        {/* Footer avec temps estimé - HEIGHT FIXE */}
        <View style={styles.cardFooter}>
          <View style={styles.timeSection}>
            <Text style={styles.timeEmoji}>
              {isCompleted ? '🕐' : '⏱️'}
            </Text>
            <Text style={[
              styles.timeText,
              isCompleted && styles.completedText,
            ]}>
              {task.estimatedTime} min
              {isCompleted && task.completedAt && (
                <Text style={styles.completedTime}>
                  {' • '}
                  {new Date(task.completedAt).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              )}
            </Text>
          </View>
          
          {/* Actions selon l'état */}
          <View style={styles.actionsContainer}>
            {!isCompleted ? (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  console.log('🔍 Bouton Ouvrir cliqué:', task.title);
                  onPress && onPress();
                }}
              >
                <Text style={styles.actionButtonText}>Ouvrir</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.completedLabel}>✓ Fait</Text>
            )}
          </View>
        </View>

        {/* Bouton de changement de section - HEIGHT FIXE */}
        <View style={styles.switchSection}>
          <TouchableOpacity 
            style={[
              styles.switchButton,
              isCompleted && styles.switchButtonCompleted
            ]}
            onPress={() => {
              console.log('🔄 Switch section:', task.title);
              onDragRelease && onDragRelease(task.id, isCompleted ? 'current' : 'completed');
            }}
          >
            <Text style={[
              styles.switchButtonText,
              isCompleted && { color: '#4CD964' }
            ]}>
              {isCompleted ? '↶ Reprendre' : '✓ Terminer'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Message simple - HEIGHT FIXE */}
        <View style={styles.dragHint}>
          <Text style={styles.dragHintText}>
            Utilise les boutons pour changer de section
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // ✅ CONTAINER AVEC HEIGHT FIXE - SOLUTION PRINCIPALE
  container: {
    width: CARD_WIDTH,
    height: 320, // ✅ HEIGHT FIXE pour toutes les cartes
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    marginBottom: 0, // ✅ Pas de margin bottom pour éviter les collisions
  },
  completedContainer: {
    backgroundColor: '#0F2F1F',
    borderColor: '#4CD964',
  },
  
  // ✅ CARD AVEC FLEXBOX POUR DISTRIBUER L'ESPACE
  card: {
    flex: 1,
    padding: 20,
    position: 'relative',
    justifyContent: 'space-between', // ✅ Distribue l'espace uniformément
  },

  // Badges
  progressBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    zIndex: 10,
    borderTopRightRadius: 18,
  },
  progressBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: '#000000',
  },
  completedBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: '#4CD964',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    zIndex: 10,
    borderTopRightRadius: 18,
  },
  completedBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: '#000000',
  },

  // ✅ HEADER AVEC HEIGHT FIXE
  cardHeader: {
    height: 30, // ✅ Height fixe
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  prioritySection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityEmoji: {
    fontSize: 14,
  },

  // ✅ TITRE AVEC HEIGHT FIXE
  titleSection: {
    height: 50, // ✅ Height fixe pour 2 lignes max
    justifyContent: 'center',
  },
  taskTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // ✅ DESCRIPTION AVEC HEIGHT FIXE
  descriptionSection: {
    height: 40, // ✅ Height fixe pour 2 lignes max
    justifyContent: 'flex-start',
  },
  taskDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  noDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
  },

  // Styles pour tâches terminées
  completedText: {
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // ✅ PROGRESSION AVEC HEIGHT FIXE
  progressSection: {
    height: 25, // ✅ Height fixe
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginRight: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#FFFFFF',
    minWidth: 35,
    textAlign: 'right',
  },

  // ✅ FOOTER AVEC HEIGHT FIXE
  cardFooter: {
    height: 35, // ✅ Height fixe
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  timeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  completedTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  
  // Actions
  actionsContainer: {
    alignItems: 'flex-end',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  actionButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#FFD700',
  },
  completedLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#4CD964',
  },

  // ✅ SECTION SWITCH AVEC HEIGHT FIXE
  switchSection: {
    height: 40, // ✅ Height fixe
    justifyContent: 'center',
  },
  switchButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  switchButtonCompleted: {
    backgroundColor: 'rgba(76, 217, 100, 0.2)',
    borderColor: '#4CD964',
  },
  switchButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#FFD700',
  },

  // ✅ DRAG HINT AVEC HEIGHT FIXE
  dragHint: {
    height: 20, // ✅ Height fixe
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHintText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});
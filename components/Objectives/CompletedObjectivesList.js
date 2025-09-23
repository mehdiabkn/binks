import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Briefcase, 
  Heart, 
  BookOpen,
  Trash2,
  CheckCircle2,
  ChevronRight
} from 'lucide-react-native';
import HapticFeedback from 'react-native-haptic-feedback';

const CATEGORY_ICONS = {
  personal: User,
  professional: Briefcase,
  health: Heart,
  learning: BookOpen,
};

const CATEGORY_COLORS = {
  personal: '#4CD964',
  professional: '#007AFF',
  health: '#FF6B6B',
  learning: '#FF9500',
};

export default function CompletedObjectivesList({ 
  completedObjectives, 
  onDeleteObjective,
  isExpanded,
  onToggleExpanded
}) {
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

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(t('calendar.locale'), {
      day: 'numeric',
      month: 'short'
    });
  };

  // Gestion de la suppression
  const handleDelete = (objective) => {
    Alert.alert(
      t('objectives.completed.deleteConfirm.title'),
      t('objectives.completed.deleteConfirm.message', { title: objective.title }),
      [
        {
          text: t('objectives.completed.deleteConfirm.cancel'),
          style: 'cancel'
        },
        {
          text: t('objectives.completed.deleteConfirm.delete'),
          style: 'destructive',
          onPress: () => {
            triggerHapticFeedback();
            onDeleteObjective(objective.id);
          }
        }
      ]
    );
  };

  // Toggle de l'expansion
  const handleToggleExpanded = () => {
    triggerHapticFeedback();
    onToggleExpanded();
  };

  // Rendu d'une ligne d'objectif terminé
  const renderCompletedObjective = (objective) => {
    const IconComponent = CATEGORY_ICONS[objective.category];
    const categoryColor = CATEGORY_COLORS[objective.category];
    
    return (
      <View key={objective.id} style={styles.completedItem}>
        <View style={styles.completedItemLeft}>
          <View style={[styles.completedIcon, { backgroundColor: categoryColor }]}>
            <IconComponent size={14} color="#FFFFFF" strokeWidth={2} />
          </View>
          
          <View style={styles.completedInfo}>
            <Text style={styles.completedTitle}>
              {objective.title}
            </Text>
            <View style={styles.completedMeta}>
              <CheckCircle2 size={12} color="#4CD964" strokeWidth={2} />
              <Text style={styles.completedDate}>
                {t('objectives.completed.completedOn', { 
                  date: formatDate(objective.completedAt || objective.deadline) 
                })}
              </Text>
              {objective.targetValue && objective.unit && (
                <Text style={styles.completedProgress}>
                  {objective.targetValue} {objective.unit}
                </Text>
              )}
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.completedDeleteButton}
          onPress={() => handleDelete(objective)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Trash2 size={14} color="#FF6B6B" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    );
  };

  if (completedObjectives.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header avec toggle */}
      <TouchableOpacity 
        style={styles.header}
        onPress={handleToggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <CheckCircle2 size={18} color="#4CD964" strokeWidth={2} />
          <Text style={styles.headerTitle}>
            {t('objectives.completed.sectionTitle', { count: completedObjectives.length })}
          </Text>
        </View>
        
        <View style={[
          styles.toggleIcon, 
          { transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }
        ]}>
          <ChevronRight size={16} color="rgba(255, 255, 255, 0.6)" strokeWidth={2} />
        </View>
      </TouchableOpacity>

      {/* Liste des objectifs terminés (collapsible) */}
      {isExpanded && (
        <View style={styles.completedList}>
          {completedObjectives.length === 0 ? (
            <View style={styles.emptyCompletedState}>
              <Text style={styles.emptyCompletedText}>
                {t('objectives.completed.empty')}
              </Text>
            </View>
          ) : (
            <>
              {completedObjectives.map(renderCompletedObjective)}
              <View style={styles.completedFooter}>
                <Text style={styles.completedFooterText}>
                  {t('objectives.completed.footer', { count: completedObjectives.length })}
                </Text>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  toggleIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Liste terminée
  completedList: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  
  // Item terminé
  completedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  completedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  completedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  completedInfo: {
    flex: 1,
  },
  completedTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  completedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  completedDate: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 6,
    marginRight: 12,
  },
  completedProgress: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  completedDeleteButton: {
    padding: 8,
    borderRadius: 6,
  },
  
  // États vides
  emptyCompletedState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyCompletedText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  
  // Footer
  completedFooter: {
    paddingTop: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 8,
  },
  completedFooterText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },
});
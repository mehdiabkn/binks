import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import HapticFeedback from 'react-native-haptic-feedback';
import { 
  Target, 
  Plus, 
  X, 
  Edit3, 
  Trophy, 
  Clock,
  Check,
  Lightbulb
} from 'lucide-react-native';

import TaskModal from './TaskModal';
import { AITaskGenerator } from '../services/AITaskGenerator';

const { height } = Dimensions.get('window');

export default function MITTab({ 
  items, 
  onToggle, 
  onAdd, 
  onDelete, 
  selectedDate,
  achievement,
  onAchievementAdd,
  onAchievementRemove,
  userProfile
}) {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const triggerHapticFeedback = (type = 'selection') => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger(type, options);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsModalVisible(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalVisible(true);
  };


// CORRECTIONS DANS ./components/Future/MITTab.js ET METTab.js

// ✅ DANS MITTab.js - CORRIGER handleSaveTask (ligne ~55)
const handleSaveTask = (taskData) => {
  console.log('MITTab - Données reçues:', taskData);
  
  if (editingTask) {
    console.log('Édition de tâche:', taskData);
  } else {
    // ✅ PASSER TOUTES LES DONNÉES incluant selectedDays
    onAdd(
      taskData.text, 
      taskData.priority, 
      taskData.estimatedTime, 
      taskData.isRecurring,
      taskData.selectedDays // ✅ AJOUT
    );
  }
  setIsModalVisible(false);
  setEditingTask(null);
};

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingTask(null);
  };

  const handleAIGenerate = (type, userProfile, selectedDate) => {
    const suggestions = [
      t('ai.mit.work.finishReport'),
      t('ai.mit.work.preparePresentation'),
      t('ai.mit.work.finishProject'),
      t('ai.mit.work.teamMeeting'),
      t('ai.mit.personal.read30min'),
      t('ai.mit.personal.practiceSkill'),
      t('ai.mit.health.exercise45min'),
      t('ai.mit.organization.cleanWorkspace')
    ];
    
    const randomIndex = Math.floor(Math.random() * suggestions.length);
    return suggestions[randomIndex];
  };

  const handleToggleItem = async (itemId) => {
    triggerHapticFeedback();
    onToggle(itemId);
      // Si la tâche vient d'être complétée (n'était pas complétée avant)
  if (!wasCompleted) {
    console.log('🎵 MIT complétée - jouer son de succès');
    await SoundService.playMITComplete();
  }
  };

  const handleDeleteItem = (itemId) => {
    triggerHapticFeedback();
    onDelete(itemId);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFD700';
      case 'low': return '#4CD964';
      default: return '#FFD700';
    }
  };

  const getPriorityLabel = (priority) => {
    return t(`tasks.mit.priority.${priority}`);
  };

  const formatDate = (date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    if (isToday) return t('dates.today');
    if (isTomorrow) return t('dates.tomorrow');
    
    return date.toLocaleDateString(t('calendar.locale'), { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  // ✅ EXACTEMENT comme METTab : calculs de statistiques
  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const completionRate = totalCount > 0 ? ((completedCount) / totalCount) * 100 : 0;

  // ✅ EXACTEMENT comme METTab : Messages d'encouragement selon le taux
  const getEncouragementMessage = () => {
    if (totalCount === 0) return t('tasks.mit.stats.encouragement.noTasks');
    if (completedCount === totalCount) return t('tasks.mit.stats.encouragement.excellent');
    if (completionRate >= 70) return t('tasks.mit.stats.encouragement.good');
    if (completionRate >= 50) return t('tasks.mit.stats.encouragement.keepGoing');
    return t('tasks.mit.stats.encouragement.getStarted');
  };

  // ✅ EXACTEMENT comme METTab : styles dynamiques selon le taux
  const getStatsStyle = () => {
    if (completionRate >= 70) return styles.goodStats;
    if (completionRate >= 50) return styles.warningStats;
    return styles.badStats;
  };

  const getEncouragementStyle = () => {
    if (completionRate >= 70) return styles.goodEncouragement;
    if (completionRate >= 50) return styles.warningEncouragement;
    return styles.badEncouragement;
  };

  return (
    <View style={styles.container}>
      {/* ✅ EXACTEMENT comme METTab : En-tête de section */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.sectionIconContainer}>
            <Target size={24} color="#4CD964" strokeWidth={2.5} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>
              {t('tasks.mit.title')}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {t('tasks.mit.subtitle', { date: formatDate(selectedDate) })}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddTask}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* ✅ EXACTEMENT comme METTab : Statistiques de completion */}
      {totalCount > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.completionBar}>
            <View 
              style={[
                styles.completionFill, 
                { width: `${completionRate}%` }
              ]} 
            />
          </View>
          <Text style={[styles.statsText, getStatsStyle()]}>
            {t('tasks.mit.stats.completed', { 
              percentage: Math.round(completionRate),
              completed: completedCount,
              total: totalCount
            })}
          </Text>
          <Text style={[styles.encouragementText, getEncouragementStyle()]}>
            {getEncouragementMessage()}
          </Text>
        </View>
      )}

      {/* ✅ EXACTEMENT comme METTab : Liste des tâches */}
      <View style={styles.itemsContainer}>
        {items.length > 0 ? (
          items.map((item, index) => (
            <View key={item.id} style={[
              styles.itemCard,
              item.completed && styles.itemCardCompleted
            ]}>
            <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => handleToggleItem(item.id)}
                >
                  {item.completed ? (
                    // ✅ État coché : cercle vert avec checkmark
                    <View style={styles.completedCheckbox}>
                      <Check size={16} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  ) : (
                    // ❌ État non coché : cercle vide avec bordure colorée selon priorité
                    <View style={[
                      styles.emptyCheckbox,
                      { borderColor: getPriorityColor(item.priority) }
                    ]}>
                      {/* Petit point central pour indiquer qu'on peut cliquer */}
                      <View style={[
                        styles.checkboxDot,
                        { backgroundColor: getPriorityColor(item.priority) }
                      ]} />
                    </View>
                  )}
            </TouchableOpacity>
              
              <View style={styles.itemContent}>
                <TouchableOpacity 
                  onPress={() => handleEditTask(item)}
                  style={styles.editableContent}
                >
                  <Text style={[
                    styles.itemText,
                    item.completed && styles.completedItemText
                  ]}>
                    {item.text}
                    {item.category && (
                      <Text style={styles.categoryIndicator}> • {item.category}</Text>
                    )}
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.itemMeta}>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: `${getPriorityColor(item.priority)}20` }
                  ]}>
                    <Text style={[
                      styles.priorityText,
                      { color: getPriorityColor(item.priority) }
                    ]}>
                      {getPriorityLabel(item.priority)}
                    </Text>
                  </View>
                  
                  {item.estimatedTime && (
                    <View style={styles.timeBadge}>
                      <Clock size={10} color="#4CD964" strokeWidth={2} />
                      <Text style={styles.timeText}>{item.estimatedTime}</Text>
                    </View>
                  )}
                </View>
                
                {item.completed && (
                  <Text style={styles.completedLabel}>
                    {t('mit.completed')}
                  </Text>
                )}
              </View>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteItem(item.id)}
              >
                <X size={16} color="#FF6B6B" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Target size={48} color="rgba(76, 217, 100, 0.3)" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>
              {t('tasks.mit.emptyTitle')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {t('tasks.mit.emptySubtitle', { date: formatDate(selectedDate).toLowerCase() })}
            </Text>
          </View>
        )}
      </View>

      {/* ✅ EXACTEMENT comme METTab : Conseils */}
      <View style={styles.tipsContainer}>
        <View style={styles.tipsHeader}>
          <Lightbulb size={16} color="#4CD964" strokeWidth={2.5} />
          <Text style={styles.tipsTitle}>{t('tasks.mit.tips.title')}</Text>
        </View>
        <Text style={styles.tipsText}>
          {t('tasks.mit.tips.content')}
        </Text>
      </View>

      {/* Modal de tâche */}
      <TaskModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        onAIGenerate={handleAIGenerate}
        type="MIT"
        editingTask={editingTask}
        selectedDate={selectedDate}
        userProfile={userProfile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // ✅ EXACTEMENT comme METTab
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 217, 100, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CD964',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // ✅ EXACTEMENT comme METTab : statistiques
  statsContainer: {
    marginBottom: 20,
  },
  completionBar: {
    height: 6,
    backgroundColor: 'rgba(76, 217, 100, 0.2)',
    borderRadius: 3,
    marginBottom: 8,
  },
  completionFill: {
    height: '100%',
    backgroundColor: '#4CD964',
    borderRadius: 3,
  },
  statsText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  goodStats: {
    color: '#4CD964',
  },
  warningStats: {
    color: '#FFD700',
  },
  badStats: {
    color: '#FF6B6B',
  },
  encouragementText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    textAlign: 'center',
  },
  goodEncouragement: {
    color: '#4CD964',
  },
  warningEncouragement: {
    color: '#FFD700',
  },
  badEncouragement: {
    color: '#FF6B6B',
  },

  // ✅ EXACTEMENT comme METTab : items
  itemsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 217, 100, 0.2)',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemCardCompleted: {
    backgroundColor: 'rgba(76, 217, 100, 0.2)',
    borderColor: 'rgba(76, 217, 100, 0.4)',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  completedIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(76, 217, 100, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  editableContent: {
    flex: 1,
  },
  itemText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 4,
  },
  completedItemText: {
    color: 'rgba(255, 255, 255, 0.7)',
    textDecorationLine: 'line-through',
  },
  categoryIndicator: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(76, 217, 100, 0.8)',
    fontStyle: 'italic',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(76, 217, 100, 0.2)',
    gap: 4,
  },
  timeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    color: '#4CD964',
  },
  completedLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: '#4CD964',
    marginTop: 4,
    fontStyle: 'italic',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  // ✅ EXACTEMENT comme METTab : empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },

  // ✅ EXACTEMENT comme METTab : conseils
  tipsContainer: {
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 217, 100, 0.2)',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipsTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#4CD964',
  },
  tipsText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
});
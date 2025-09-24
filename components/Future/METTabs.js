import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { 
  Ban, 
  Plus, 
  X, 
  Shield, 
  Lightbulb, 
  Frown, 
  Target,
  Edit3
} from 'lucide-react-native';
import HapticFeedback from 'react-native-haptic-feedback';

import METModal from '../Modals/METModal';

const { height } = Dimensions.get('window');

export default function METTab({ 
  items, 
  onToggle, 
  onAdd, 
  onDelete, 
  selectedDate,
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

  // ✅ DANS METTab.js - CORRIGER handleSaveTask (même logique)
const handleSaveTask = (taskData) => {
  console.log('METTab - Données reçues:', taskData);
  
  if (editingTask) {
    console.log('Édition de tâche:', taskData);
  } else {
    // ✅ PASSER TOUTES LES DONNÉES incluant selectedDays
    onAdd(
      taskData.text, 
      taskData.isRecurring,
      taskData.selectedDays // ✅ AJOUT
    );
  }
  setIsModalVisible(false);
  setEditingTask(null);
};
  const handleCloseModal = () => {
    console.log("METTab - Fermeture de la modale");
    setIsModalVisible(false);
    setEditingTask(null);
  };

  const handleAIGenerate = (userProfile, selectedDate) => {
    // Génération spécifique pour MET
    const suggestions = [
      t('ai.met.digital.socialMedia'),
      t('ai.met.procrastination.postpone'),
      t('ai.met.food.snacking'),
      t('ai.met.digital.youtube'),
      t('ai.met.digital.mobileGames'),
      t('ai.met.procrastination.postponeAppointments'),
      t('ai.met.procrastination.avoidTasks'),
      t('ai.met.procrastination.stayBed'),
      t('ai.met.digital.emails'),
      t('ai.met.procrastination.watchSeries'),
      t('ai.met.money.impulsiveShopping'),
      t('ai.met.mental.ruminate'),
      t('ai.met.food.eatScreen'),
      t('ai.met.social.avoidConversations')
    ];
    
    const randomIndex = Math.floor(Math.random() * suggestions.length);
    return suggestions[randomIndex];
  };

  const handleToggleItem = (itemId) => {
    triggerHapticFeedback();
    onToggle(itemId);
  };

  const handleDeleteItem = (itemId) => {
    triggerHapticFeedback();
    onDelete(itemId);
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

  const checkedCount = items.filter(item => item.checked).length;
  const totalCount = items.length;
  const avoidanceRate = totalCount > 0 ? ((totalCount - checkedCount) / totalCount) * 100 : 100;

  // Messages d'encouragement selon le taux d'évitement
  const getEncouragementMessage = () => {
    if (totalCount === 0) return t('tasks.met.stats.encouragement.perfect');
    if (checkedCount === 0) return t('tasks.met.stats.encouragement.excellent');
    if (avoidanceRate >= 70) return t('tasks.met.stats.encouragement.good');
    if (avoidanceRate >= 50) return t('tasks.met.stats.encouragement.warning');
    return t('tasks.met.stats.encouragement.bad');
  };

  const getStatsStyle = () => {
    if (avoidanceRate >= 70) return styles.goodStats;
    if (avoidanceRate >= 50) return styles.warningStats;
    return styles.badStats;
  };

  const getEncouragementStyle = () => {
    if (avoidanceRate >= 70) return styles.goodEncouragement;
    if (avoidanceRate >= 50) return styles.warningEncouragement;
    return styles.badEncouragement;
  };

  return (
    <View style={styles.container}>
      {/* En-tête de section */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.sectionIconContainer}>
            <Ban size={24} color="#FF6B6B" strokeWidth={2.5} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>
              {t('tasks.met.title')}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {t('tasks.met.subtitle', { date: formatDate(selectedDate) })}
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

      {/* Statistiques d'évitement */}
      {totalCount > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.avoidanceBar}>
            <View 
              style={[
                styles.avoidanceFill, 
                { width: `${avoidanceRate}%` }
              ]} 
            />
          </View>
          <Text style={[styles.statsText, getStatsStyle()]}>
            {t('tasks.met.stats.avoided', { 
              percentage: Math.round(avoidanceRate),
              avoided: totalCount - checkedCount,
              total: totalCount
            })}
          </Text>
          <Text style={[styles.encouragementText, getEncouragementStyle()]}>
            {getEncouragementMessage()}
          </Text>
        </View>
      )}

      {/* Liste des choses à éviter */}
      <View style={styles.itemsContainer}>
        {items.length > 0 ? (
          items.map((item, index) => (
            <View key={item.id} style={[
              styles.itemCard,
              item.checked && styles.itemCardChecked
            ]}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleToggleItem(item.id)}
              >
                {item.checked ? (
                  <View style={styles.checkedIcon}>
                    <Frown size={16} color="#FF6B6B" strokeWidth={2} />
                  </View>
                ) : (
                  <View style={styles.emptyCheckbox}>
                    <Target size={12} color="#FF6B6B" strokeWidth={0} />
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
                    item.checked && styles.checkedItemText
                  ]}>
                    {item.text}
                  </Text>
                </TouchableOpacity>
                
                {item.checked && (
                  <Text style={styles.checkedLabel}>
                    {t('tasks.met.checkedLabel')}
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
              <Shield size={48} color="rgba(255, 107, 107, 0.3)" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>
              {t('tasks.met.emptyTitle')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {t('tasks.met.emptySubtitle', { date: formatDate(selectedDate).toLowerCase() })}
            </Text>
            <View style={styles.emptyExample}>
              <Lightbulb size={14} color="#FFD700" strokeWidth={2} />
              <Text style={styles.emptyExampleText}>
                {t('tasks.met.emptyExample')}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Conseils */}
      <View style={styles.tipsContainer}>
        <View style={styles.tipsHeader}>
          <Lightbulb size={16} color="#FFD700" strokeWidth={2.5} />
          <Text style={styles.tipsTitle}>{t('tasks.met.tips.title')}</Text>
        </View>
        <Text style={styles.tipsText}>
          {t('tasks.met.tips.text')}
        </Text>
      </View>

      {/* METModal */}
      <METModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        onAIGenerate={handleAIGenerate}
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
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
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
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statsContainer: {
    marginBottom: 20,
  },
  avoidanceBar: {
    height: 6,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 3,
    marginBottom: 8,
  },
  avoidanceFill: {
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
  itemsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemCardChecked: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderColor: 'rgba(255, 107, 107, 0.4)',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkedIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF6B6B',
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
  checkedItemText: {
    color: 'rgba(255, 255, 255, 0.7)',
    textDecorationLine: 'line-through',
  },
  checkedLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: '#FF6B6B',
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
  emptyExample: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyExampleText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 215, 0, 0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
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
    color: '#FFD700',
  },
  tipsText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { 
  X,
  User, 
  Briefcase, 
  Heart, 
  BookOpen,
  Plus,
  FileText,
  Target,
  Hash,
  DollarSign
} from 'lucide-react-native';
import HapticFeedback from 'react-native-haptic-feedback';

const CATEGORIES = [
  { id: 'personal', icon: User, color: '#4CD964' },
  { id: 'professional', icon: Briefcase, color: '#007AFF' },
  { id: 'health', icon: Heart, color: '#FF6B6B' },
  { id: 'learning', icon: BookOpen, color: '#FF9500' },
];

const PRIORITIES = [
  { id: 'high', color: '#FF6B6B' },
  { id: 'medium', color: '#FFD700' },
  { id: 'low', color: '#4CD964' },
];

export default function AddObjectiveModal({ visible, onClose, onAdd }) {
  const { t } = useTranslation();
  
  // État du formulaire
  const [formData, setFormData] = useState({
    title: '',
    category: 'personal',
    priority: 'medium',
    hasTarget: false,
    targetValue: '',
    unit: '',
    progressType: 'incremental',
  });

  // Fonction de feedback haptique
  const triggerHapticFeedback = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger('selection', options);
  };

  // Reset du formulaire quand la modal s'ouvre
  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'personal',
      priority: 'medium',
      hasTarget: false,
      targetValue: '',
      unit: '',
      progressType: 'incremental',
    });
  };

  // Gestion des changements dans le formulaire
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Gestion de la soumission
  const handleSubmit = () => {
    if (!formData.title.trim()) {
      triggerHapticFeedback();
      return;
    }
    
    // Si hasTarget mais pas de valeur, erreur
    if (formData.hasTarget && (!formData.targetValue || parseInt(formData.targetValue) <= 0)) {
      triggerHapticFeedback();
      return;
    }
    
    const newObjective = {
      ...formData,
      // Valeurs conditionnelles selon hasTarget
      targetValue: formData.hasTarget ? parseInt(formData.targetValue) : 1,
      currentValue: 0,
      unit: formData.hasTarget ? formData.unit || 'unité' : 'objectif',
      // Valeurs par défaut pour la compatibilité
      description: '',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      milestones: [],
    };
    
    triggerHapticFeedback();
    onAdd(newObjective);
  };

  // Gestion de la fermeture
  const handleClose = () => {
    triggerHapticFeedback();
    onClose();
  };

  // Validation pour le bouton submit
  const isFormValid = () => {
    if (!formData.title.trim()) return false;
    if (formData.hasTarget && (!formData.targetValue || parseInt(formData.targetValue) <= 0)) return false;
    return true;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('objectives.addModal.title')}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Contenu */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Titre de l'objectif */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              {t('objectives.addModal.titleField.label')}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('objectives.addModal.titleField.placeholder')}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              multiline
              numberOfLines={3}
              returnKeyType="done"
              blurOnSubmit={true}
            />
          </View>

          {/* Type d'objectif */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              {t('objectives.addModal.objectiveType.title')}
            </Text>
            <View style={styles.targetTypeGrid}>
              <TouchableOpacity
                style={[
                  styles.targetTypeOption,
                  !formData.hasTarget && styles.targetTypeOptionSelected,
                ]}
                onPress={() => {
                  triggerHapticFeedback();
                  handleInputChange('hasTarget', false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.targetTypeIconContainer}>
                  <FileText size={20} color={!formData.hasTarget ? '#007AFF' : 'rgba(255, 255, 255, 0.6)'} strokeWidth={2} />
                </View>
                <Text style={[
                  styles.targetTypeLabel,
                  !formData.hasTarget && styles.targetTypeLabelSelected,
                ]}>
                  {t('objectives.addModal.objectiveType.simple.label')}
                </Text>
                <Text style={styles.targetTypeDescription}>
                  {t('objectives.addModal.objectiveType.simple.description')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.targetTypeOption,
                  formData.hasTarget && styles.targetTypeOptionSelected,
                ]}
                onPress={() => {
                  triggerHapticFeedback();
                  handleInputChange('hasTarget', true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.targetTypeIconContainer}>
                  <Target size={20} color={formData.hasTarget ? '#007AFF' : 'rgba(255, 255, 255, 0.6)'} strokeWidth={2} />
                </View>
                <Text style={[
                  styles.targetTypeLabel,
                  formData.hasTarget && styles.targetTypeLabelSelected,
                ]}>
                  {t('objectives.addModal.objectiveType.target.label')}
                </Text>
                <Text style={styles.targetTypeDescription}>
                  {t('objectives.addModal.objectiveType.target.description')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Paramètres de cible (si hasTarget = true) */}
          {formData.hasTarget && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                {t('objectives.addModal.targetSettings.title')}
              </Text>
              
              {/* Valeur cible et unité */}
              <View style={styles.targetRow}>
                <View style={styles.targetValueContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={t('objectives.addModal.targetSettings.valuePlaceholder')}
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={formData.targetValue}
                    onChangeText={(value) => handleInputChange('targetValue', value)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.unitContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={t('objectives.addModal.targetSettings.unitPlaceholder')}
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={formData.unit}
                    onChangeText={(value) => handleInputChange('unit', value)}
                  />
                </View>
              </View>
              
              {/* Type de progression */}
              <View style={styles.progressTypeContainer}>
                <Text style={styles.progressTypeTitle}>
                  {t('objectives.addModal.targetSettings.progressType.title')}
                </Text>
                <View style={styles.progressTypeGrid}>
                  <TouchableOpacity
                    style={[
                      styles.progressTypeOption,
                      formData.progressType === 'incremental' && styles.progressTypeOptionSelected,
                    ]}
                    onPress={() => {
                      triggerHapticFeedback();
                      handleInputChange('progressType', 'incremental');
                    }}
                    activeOpacity={0.7}
                  >
                    <Hash 
                      size={16} 
                      color={formData.progressType === 'incremental' ? '#FFD700' : 'rgba(255, 255, 255, 0.6)'} 
                      strokeWidth={2} 
                      style={styles.progressTypeIcon}
                    />
                    <Text style={[
                      styles.progressTypeLabel,
                      formData.progressType === 'incremental' && styles.progressTypeLabelSelected,
                    ]}>
                      {t('objectives.addModal.targetSettings.progressType.incremental.label')}
                    </Text>
                    <Text style={styles.progressTypeDescription}>
                      {t('objectives.addModal.targetSettings.progressType.incremental.description')}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.progressTypeOption,
                      formData.progressType === 'continuous' && styles.progressTypeOptionSelected,
                    ]}
                    onPress={() => {
                      triggerHapticFeedback();
                      handleInputChange('progressType', 'continuous');
                    }}
                    activeOpacity={0.7}
                  >
                    <DollarSign 
                      size={16} 
                      color={formData.progressType === 'continuous' ? '#FFD700' : 'rgba(255, 255, 255, 0.6)'} 
                      strokeWidth={2} 
                      style={styles.progressTypeIcon}
                    />
                    <Text style={[
                      styles.progressTypeLabel,
                      formData.progressType === 'continuous' && styles.progressTypeLabelSelected,
                    ]}>
                      {t('objectives.addModal.targetSettings.progressType.continuous.label')}
                    </Text>
                    <Text style={styles.progressTypeDescription}>
                      {t('objectives.addModal.targetSettings.progressType.continuous.description')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Catégorie */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              {t('objectives.addModal.category.title')}
            </Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map(category => {
                const IconComponent = category.icon;
                const isSelected = formData.category === category.id;
                
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      isSelected && [
                        styles.categoryOptionSelected,
                        { backgroundColor: `${category.color}20`, borderColor: category.color }
                      ],
                    ]}
                    onPress={() => {
                      triggerHapticFeedback();
                      handleInputChange('category', category.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.categoryIcon,
                      { backgroundColor: isSelected ? category.color : 'rgba(255, 255, 255, 0.1)' }
                    ]}>
                      <IconComponent 
                        size={16} 
                        color={isSelected ? '#FFFFFF' : category.color} 
                        strokeWidth={2}
                      />
                    </View>
                    <Text style={[
                      styles.categoryLabel,
                      isSelected && { color: category.color, fontFamily: 'Poppins-SemiBold' }
                    ]}>
                      {t(`objectives.categories.${category.id}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Priorité */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              {t('objectives.addModal.priority.title')}
            </Text>
            <View style={styles.prioritiesGrid}>
              {PRIORITIES.map(priority => {
                const isSelected = formData.priority === priority.id;
                
                return (
                  <TouchableOpacity
                    key={priority.id}
                    style={[
                      styles.priorityOption,
                      isSelected && [
                        styles.priorityOptionSelected,
                        { backgroundColor: `${priority.color}20`, borderColor: priority.color }
                      ],
                    ]}
                    onPress={() => {
                      triggerHapticFeedback();
                      handleInputChange('priority', priority.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.priorityIndicator,
                      { backgroundColor: priority.color }
                    ]} />
                    <Text style={[
                      styles.priorityLabel,
                      isSelected && { color: priority.color, fontFamily: 'Poppins-SemiBold' }
                    ]}>
                      {t(`objectives.list.priority.${priority.id}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Footer avec boutons */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleClose}
          >
            <Text style={styles.cancelButtonText}>
              {t('objectives.addModal.buttons.cancel')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.submitButton,
              !isFormValid() && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid()}
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.submitButtonText}>
              {t('objectives.addModal.buttons.create')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  
  // Contenu
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  
  // Champ de saisie
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  // Type d'objectif
  targetTypeGrid: {
    gap: 16,
  },
  targetTypeOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  targetTypeOptionSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  targetTypeIconContainer: {
    marginBottom: 8,
  },
  targetTypeLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    textAlign: 'center',
  },
  targetTypeLabelSelected: {
    color: '#007AFF',
  },
  targetTypeDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  
  // Paramètres de cible
  targetRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  targetValueContainer: {
    flex: 2,
  },
  unitContainer: {
    flex: 1,
  },
  
  // Type de progression
  progressTypeContainer: {
    marginTop: 8,
  },
  progressTypeTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  progressTypeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  progressTypeOption: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  progressTypeOptionSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  progressTypeIcon: {
    marginBottom: 6,
  },
  progressTypeLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
    textAlign: 'center',
  },
  progressTypeLabelSelected: {
    color: '#FFD700',
  },
  progressTypeDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  
  // Sélecteurs de catégorie
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  categoryOptionSelected: {
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  
  // Sélecteurs de priorité
  prioritiesGrid: {
    gap: 16,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  priorityOptionSelected: {
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  priorityIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 16,
  },
  priorityLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(0, 122, 255, 0.5)',
  },
  submitButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
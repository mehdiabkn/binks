import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Plus, X, TrendingUp, Save } from 'lucide-react-native';
import HapticFeedback from 'react-native-haptic-feedback';

export default function ContinuousProgressUpdater({ 
  objective,
  onUpdateProgress,
  style 
}) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(true); // true = ajouter, false = définir valeur absolue
  
  // Animation
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Fonction de feedback haptique
  const triggerHapticFeedback = (type = 'selection') => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger(type, options);
  };

  // Animation du bouton
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Ouvrir la modal
  const handleOpenModal = () => {
    triggerHapticFeedback();
    animateButton();
    setShowModal(true);
    setInputValue('');
    setIsAdding(true);
  };

  // Fermer la modal
  const handleCloseModal = () => {
    triggerHapticFeedback();
    setShowModal(false);
    setInputValue('');
  };

  // Gestion de la soumission
  const handleSubmit = () => {
    const value = parseFloat(inputValue);
    
    if (isNaN(value) || value <= 0) {
      triggerHapticFeedback('notificationError');
      return;
    }

    let newValue;
    if (isAdding) {
      // Ajouter à la valeur actuelle
      newValue = Math.min(objective.currentValue + value, objective.targetValue);
    } else {
      // Définir une valeur absolue
      newValue = Math.min(value, objective.targetValue);
    }

    triggerHapticFeedback('notificationSuccess');
    onUpdateProgress(objective.id, newValue);
    handleCloseModal();
  };

  // Validation de l'input
  const isValidInput = () => {
    const value = parseFloat(inputValue);
    if (isNaN(value) || value <= 0) return false;
    
    if (isAdding) {
      return objective.currentValue + value <= objective.targetValue;
    } else {
      return value <= objective.targetValue;
    }
  };

  // Calcul de l'aperçu de la nouvelle valeur
  const getPreviewValue = () => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) return objective.currentValue;
    
    if (isAdding) {
      return Math.min(objective.currentValue + value, objective.targetValue);
    } else {
      return Math.min(value, objective.targetValue);
    }
  };

  // Fonction pour générer des suggestions intelligentes
  const getSuggestions = () => {
    const remaining = objective.targetValue - objective.currentValue;
    const suggestions = [];
    
    // Suggestions basées sur l'unité et la valeur restante
    if (objective.unit === '€' || objective.unit === '$') {
      // Pour l'argent : 10, 50, 100, 500
      const moneySuggestions = [10, 50, 100, 500].filter(val => val <= remaining);
      suggestions.push(...moneySuggestions.slice(0, 3));
    } else if (objective.unit === 'km' || objective.unit === 'miles') {
      // Pour les distances : 1, 5, 10
      const distanceSuggestions = [1, 5, 10].filter(val => val <= remaining);
      suggestions.push(...distanceSuggestions);
    } else if (objective.unit === 'jours' || objective.unit === 'days') {
      // Pour les jours : 1, 7, 30
      const daySuggestions = [1, 7, 30].filter(val => val <= remaining);
      suggestions.push(...daySuggestions);
    } else {
      // Suggestions génériques basées sur la valeur restante
      const genericSuggestions = [1, 5, 10].filter(val => val <= remaining);
      if (remaining > 10) {
        genericSuggestions.push(Math.floor(remaining / 4)); // 25% du restant
      }
      suggestions.push(...genericSuggestions.slice(0, 3));
    }
    
    // S'assurer qu'on a au moins une suggestion
    if (suggestions.length === 0 && remaining > 0) {
      suggestions.push(Math.min(1, remaining));
    }
    
    return suggestions.slice(0, 4); // Maximum 4 suggestions
  };

  return (
    <>
      {/* Bouton principal */}
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleOpenModal}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.addButtonText}>
            {t('objectives.continuousProgress.addButton')}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal de saisie */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleCloseModal}
            >
              <X size={24} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {t('objectives.continuousProgress.title')}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Contenu */}
          <View style={styles.modalContent}>
            {/* Info sur l'objectif */}
            <View style={styles.objectiveInfo}>
              <Text style={styles.objectiveTitle} numberOfLines={2}>
                {objective.title}
              </Text>
              <Text style={styles.objectiveProgress}>
                {objective.currentValue} / {objective.targetValue} {objective.unit}
              </Text>
            </View>

            {/* Mode de saisie */}
            <View style={styles.modeSelector}>
              <TouchableOpacity
                style={[
                  styles.modeOption,
                  isAdding && styles.modeOptionSelected,
                ]}
                onPress={() => {
                  triggerHapticFeedback();
                  setIsAdding(true);
                  setInputValue('');
                }}
                activeOpacity={0.7}
              >
                <Plus size={16} color={isAdding ? '#007AFF' : 'rgba(255, 255, 255, 0.6)'} strokeWidth={2} />
                <Text style={[
                  styles.modeOptionText,
                  isAdding && styles.modeOptionTextSelected,
                ]}>
                  {t('objectives.continuousProgress.modes.add')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modeOption,
                  !isAdding && styles.modeOptionSelected,
                ]}
                onPress={() => {
                  triggerHapticFeedback();
                  setIsAdding(false);
                  setInputValue('');
                }}
                activeOpacity={0.7}
              >
                <TrendingUp size={16} color={!isAdding ? '#007AFF' : 'rgba(255, 255, 255, 0.6)'} strokeWidth={2} />
                <Text style={[
                  styles.modeOptionText,
                  !isAdding && styles.modeOptionTextSelected,
                ]}>
                  {t('objectives.continuousProgress.modes.set')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Champ de saisie */}
            <View style={styles.inputContainer}>
              <View style={styles.inputRow}>
                {isAdding && (
                  <Text style={styles.inputPrefix}>
                    {objective.currentValue} +
                  </Text>
                )}
                <TextInput
                  style={styles.valueInput}
                  placeholder={isAdding ? t('objectives.continuousProgress.placeholders.add') : t('objectives.continuousProgress.placeholders.set')}
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={inputValue}
                  onChangeText={setInputValue}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  autoFocus={false}
                />
                <Text style={styles.inputSuffix}>
                  {objective.unit}
                </Text>
              </View>
              
              {/* Aperçu du résultat */}
              {inputValue && (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewLabel}>
                    {t('objectives.continuousProgress.preview.label')}
                  </Text>
                  <Text style={[
                    styles.previewValue,
                    !isValidInput() && styles.previewValueError,
                  ]}>
                    {getPreviewValue()} / {objective.targetValue} {objective.unit}
                  </Text>
                </View>
              )}
              
              {/* Message d'erreur */}
              {inputValue && !isValidInput() && (
                <Text style={styles.errorMessage}>
                  {isAdding 
                    ? t('objectives.continuousProgress.errors.exceedsTargetAdd')
                    : t('objectives.continuousProgress.errors.exceedsTargetSet')
                  }
                </Text>
              )}
            </View>

            {/* Bouton "Marquer comme terminé" - VERSION CELEBRATION */}
            <View style={styles.completeSection}>
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => {
                  triggerHapticFeedback('notificationSuccess');
                  onUpdateProgress(objective.id, objective.targetValue);
                  handleCloseModal();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.completeBadge}>
                  <Text style={styles.completeBadgeEmoji}>🎉</Text>
                </View>
                <View style={styles.completeTextContainer}>
                  <Text style={styles.completeButtonText}>
                    Marquer comme terminé
                  </Text>
                  <Text style={styles.completeButtonSubtext}>
                    Définir à {objective.targetValue} {objective.unit}
                  </Text>
                </View>
                <View style={styles.completeArrow}>
                  <Text style={styles.completeArrowText}>→</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Suggestions rapides */}
            <View style={styles.quickSuggestions}>
              <Text style={styles.suggestionsTitle}>
                {t('objectives.continuousProgress.suggestions.title')}
              </Text>
              <View style={styles.suggestionsRow}>
                {getSuggestions().map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionButton}
                    onPress={() => {
                      triggerHapticFeedback();
                      setInputValue(suggestion.toString());
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionText}>
                      +{suggestion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCloseModal}
            >
              <Text style={styles.cancelButtonText}>
                {t('objectives.continuousProgress.buttons.cancel')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.saveButton,
                !isValidInput() && styles.saveButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!isValidInput()}
            >
              <Save size={18} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.saveButtonText}>
                {t('objectives.continuousProgress.buttons.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Bouton principal
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 100,
    justifyContent: 'center',
  },
  addButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  modalHeader: {
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
  modalTitle: {
    flex: 1,
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },

  // Contenu modal
  modalContent: {
    flex: 1,
    padding: 20,
  },
  objectiveInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  objectiveTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  objectiveProgress: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Sélecteur de mode
  modeSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
  },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  modeOptionSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  modeOptionText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modeOptionTextSelected: {
    color: '#007AFF',
    fontFamily: 'Poppins-SemiBold',
  },

  // Champ de saisie
  inputContainer: {
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  inputPrefix: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#007AFF',
  },
  valueInput: {
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  inputSuffix: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Aperçu
  previewContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  previewLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  previewValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#007AFF',
  },
  previewValueError: {
    color: '#FF6B6B',
  },

  // Message d'erreur
  errorMessage: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#FF6B6B',
    marginTop: 8,
    textAlign: 'center',
  },

  // Bouton "Marquer comme terminé" - VERSION CELEBRATION
  completeSection: {
    marginBottom: 24,
  },
  completeButton: {
    backgroundColor: 'linear-gradient(135deg, #4CD964, #34C759)',
    borderRadius: 20,
    padding: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: '#4CD964',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  completeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 12,
  },
  completeBadgeEmoji: {
    fontSize: 24,
  },
  completeTextContainer: {
    flex: 1,
    paddingVertical: 16,
  },
  completeButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  completeButtonSubtext: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  completeArrow: {
    paddingRight: 20,
  },
  completeArrowText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: 'bold',
  },

  // Suggestions rapides
  quickSuggestions: {
    marginBottom: 24,
  },
  suggestionsTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  suggestionsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  suggestionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  suggestionText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#FFD700',
  },

  // Footer
  modalFooter: {
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
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(0, 122, 255, 0.5)',
  },
  saveButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
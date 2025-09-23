import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import HapticFeedback from 'react-native-haptic-feedback';
import { 
  Brain, 
  Ban, 
  Lightbulb, 
  Shield,
  Smartphone,
  Gamepad2,
  Tv,
  Candy,
  X,
  Check
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const { height } = Dimensions.get('window');

export default function METModal({
  visible,
  onClose,
  onSave,
  onAIGenerate,
  editingTask = null,
  selectedDate,
  userProfile
}) {
  const [taskText, setTaskText] = useState('');
  const [isRecurring, setIsRecurring] = useState(false); // ✅ État pour la récurrence
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [hasUsedAI, setHasUsedAI] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [aiContext, setAiContext] = useState('');
  const { t } = useTranslation();

  // Animations pour les points de chargement
  const dot1Anim = useRef(new Animated.Value(0.4)).current;
  const dot2Anim = useRef(new Animated.Value(0.7)).current;
  const dot3Anim = useRef(new Animated.Value(1)).current;
  
  // Animation pour l'effet shimmer/brillant
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  // Animation pour la barre de cooldown
  const cooldownAnim = useRef(new Animated.Value(0)).current;

  const triggerHapticFeedback = (type = 'selection') => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger(type, options);
  };

  // ✅ CORRIGÉ: Initialiser avec les données de la tâche à modifier (+ récurrence)
  useEffect(() => {
    try {
      if (editingTask) {
        setTaskText(editingTask.text || '');
        setIsRecurring(Boolean(editingTask.isRecurring)); // ✅ FORCE la conversion en booléen
        console.log('📝 METModal - Édition MET avec isRecurring:', Boolean(editingTask.isRecurring));
      } else {
        setTaskText('');
        setIsRecurring(false);
        console.log('📝 METModal - Nouvelle MET, isRecurring défaut:', false);
      }
    } catch (error) {
      console.error('Erreur dans useEffect METModal:', error);
    }
  }, [editingTask, visible]);

  // Animation shimmer continue
  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    shimmerAnimation.start();
    
    return () => shimmerAnimation.stop();
  }, []);

  // ✅ CORRIGÉ: handleSave avec transmission EXPLICITE et logs détaillés
  const handleSave = () => {
    if (!taskText || !taskText.trim()) return;
    
    triggerHapticFeedback('impactMedium');
    
    // ✅ TRANSMISSION EXPLICITE avec logs de debug
    const taskData = {
      text: taskText.trim(),
      isRecurring: Boolean(isRecurring) // ✅ FORCE la conversion en booléen
    };
    
    console.log('📤 METModal - handleSave appelé avec:', {
      taskText: taskText.trim(),
      isRecurring: isRecurring,
      isRecurringType: typeof isRecurring,
      isRecurringBool: Boolean(isRecurring),
      finalTaskData: taskData
    });
    
    // ✅ Appel de onSave avec données vérifiées
    if (onSave && typeof onSave === 'function') {
      onSave(taskData);
      console.log('✅ METModal - onSave appelé avec succès');
    } else {
      console.error('❌ METModal - onSave n\'est pas une fonction:', typeof onSave);
    }
    
    resetForm();
    handleClose();
  };

  const handleAIGenerate = async () => {
    if (cooldownSeconds > 0) return;
    
    setIsGeneratingAI(true);
    triggerHapticFeedback('selection');
    
    // Démarrer l'animation des points
    startLoadingAnimation();
    
    try {
      // Mock chargement de 2 secondes
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Suggestions spécifiques pour MET
      const suggestions = [
        'Scroller sans but sur les réseaux sociaux',
        'Procrastiner sur les tâches importantes',
        'Grignoter des sucreries toute la journée',
        'Regarder des vidéos aléatoires pendant des heures',
        'Jouer aux jeux vidéo au lieu de travailler',
        'Reporter les appels importants',
        'Éviter les exercices physiques',
        'Rester au lit trop longtemps le matin',
        'Consulter compulsivement les notifications',
        'Remettre à plus tard les corvées ménagères',
        'Acheter impulsivement en ligne',
        'Perdre du temps sur des débats inutiles',
        'Manger devant un écran sans attention',
        'Négliger les relations importantes'
      ];
      
      // Adaptation selon le contexte
      let result;
      if (aiContext.trim()) {
        const contextLower = aiContext.toLowerCase();
        if (contextLower.includes('travail') || contextLower.includes('productivité')) {
          result = 'Procrastiner au lieu de me concentrer sur mes priorités';
        } else if (contextLower.includes('santé') || contextLower.includes('sport')) {
          result = 'Éviter l\'exercice physique et rester sédentaire';
        } else if (contextLower.includes('social') || contextLower.includes('réseau')) {
          result = 'Scroller compulsivement sur les réseaux sociaux';
        } else if (contextLower.includes('nourriture') || contextLower.includes('manger')) {
          result = 'Grignoter sans faim par ennui ou stress';
        } else {
          result = `Éviter ${aiContext.toLowerCase()} par flemme ou peur`;
        }
      } else {
        const randomIndex = Math.floor(Math.random() * suggestions.length);
        result = suggestions[randomIndex];
      }
      
      setTaskText(result);
      setHasUsedAI(true);
      
      // Démarrer le cooldown de 30 secondes
      startCooldown();
    } catch (error) {
      console.error('Erreur génération IA:', error);
      setTaskText('Procrastiner sur les tâches importantes');
    } finally {
      setIsGeneratingAI(false);
      stopLoadingAnimation();
    }
  };

  // Fonction pour démarrer le cooldown
  const startCooldown = () => {
    setCooldownSeconds(30);
    
    // Animation de la barre de progression inverse
    cooldownAnim.setValue(1);
    Animated.timing(cooldownAnim, {
      toValue: 0,
      duration: 30000, // 30 secondes
      useNativeDriver: false,
    }).start();
    
    // Décompte des secondes
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Animation des points de chargement
  const startLoadingAnimation = () => {
    const createPulse = (animValue, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0.4,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      createPulse(dot1Anim, 0),
      createPulse(dot2Anim, 200),
      createPulse(dot3Anim, 400),
    ]).start();
  };

  const stopLoadingAnimation = () => {
    dot1Anim.stopAnimation();
    dot2Anim.stopAnimation();
    dot3Anim.stopAnimation();
    dot1Anim.setValue(0.4);
    dot2Anim.setValue(0.7);
    dot3Anim.setValue(1);
  };

  // ✅ CORRIGÉ: Reset isRecurring dans resetForm
  const resetForm = () => {
    setTaskText('');
    setIsRecurring(false); // ✅ Reset isRecurring
    setIsGeneratingAI(false);
    setHasUsedAI(false);
    setCooldownSeconds(0);
    setAiContext('');
    cooldownAnim.setValue(0);
    console.log('🔄 METModal - Formulaire réinitialisé, isRecurring:', false);
  };

  const handleCancel = () => {
    console.log('METModal - handleCancel appelé');
    triggerHapticFeedback();
    handleClose();
  };

  const handleClose = () => {
    console.log('METModal - handleClose appelé');
    resetForm();
    if (onClose && typeof onClose === 'function') {
      onClose();
    } else {
      console.error('METModal - onClose n\'est pas une fonction !');
    }
  };

  const formatDate = (date) => {
    try {
      if (!date) {
        console.log('formatDate: date is null/undefined');
        return t('dates.today');
      }
      
      const dateObj = date instanceof Date ? date : new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        console.log('formatDate: invalid date');
        return t('dates.today');

      }
      
      const today = new Date();
      const isToday = dateObj.toDateString() === today.toDateString();
      const isTomorrow = dateObj.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();
      
      if (isToday) return t('dates.today');
      if (isTomorrow) return t('dates.tomorrow');
      
      return dateObj.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
    } catch (error) {
      console.error('Erreur dans formatDate:', error);
      return t('dates.today');
    }
  };

  const handleQuickSuggestion = (suggestion) => {
    triggerHapticFeedback();
    setTaskText(suggestion);
  };

  const dateText = selectedDate ? formatDate(selectedDate) : t('dates.today');

  // Suggestions rapides avec icônes
const quickSuggestions = [
  { icon: Smartphone, text: t('modals.taskModal.quickSuggestions.socialMedia'), color: '#3B82F6' },
  { icon: Gamepad2, text: t('modals.taskModal.quickSuggestions.videoGames'), color: '#8B5CF6' },
  { icon: Tv, text: t('modals.taskModal.quickSuggestions.streaming'), color: '#EF4444' },
  { icon: Candy, text: t('modals.taskModal.quickSuggestions.snacking'), color: '#F59E0B' }
];

  // ✅ Log pour debug de l'état isRecurring
  console.log('🔍 METModal - État actuel isRecurring:', isRecurring, typeof isRecurring);

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={handleClose}
      animationType="slide"
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity 
          style={styles.modalBackdropTouchable}
          onPress={handleClose}
        />
        
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalEmoji}>🚫</Text>
            <Text style={styles.modalTitle}>
{editingTask ? t('modals.taskModal.met.editTitle') : t('modals.taskModal.met.newTitle')}
            </Text>
            <Text style={styles.modalSubtitle}>
  {t('modals.taskModal.met.subtitle', { date: dateText })}
            </Text>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Input principal */}
            <TextInput
              style={styles.modalInput}
              placeholder={t('modals.taskModal.met.placeholder')}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={taskText}
              onChangeText={setTaskText}
              multiline
              autoFocus={false}
              maxLength={200}
              returnKeyType="done"
              blurOnSubmit={true}
            />
            
            {/* Compteur de caractères */}
            <Text style={styles.characterCount}>
              {taskText ? taskText.length : 0}/200 caractères
            </Text>
            
            {/* ✅ Option de récurrence pour MET */}
            <TouchableOpacity
              style={styles.recurringOption}
              onPress={() => {
                triggerHapticFeedback();
                const newValue = !isRecurring;
                setIsRecurring(newValue);
                console.log('📱 METModal - Toggle isRecurring:', isRecurring, '->', newValue);
              }}
            >
              <View style={styles.recurringContent}>
                <View style={styles.recurringText}>
<Text style={styles.recurringLabel}>{t('modals.taskModal.recurring.metLabel')}</Text>
<Text style={styles.recurringDescription}>{t('modals.taskModal.recurring.metDescription')}</Text>
                </View>
                <View style={[
                  styles.checkbox,
                  isRecurring && styles.checkboxChecked,
                  isRecurring && { backgroundColor: '#EF4444' } // Rouge pour MET
                ]}>
                  {isRecurring && (
                    <Check size={16} color="#FFFFFF" strokeWidth={3} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
            
            {/* Suggestions rapides */}
            {!editingTask && (
              <View style={styles.quickSuggestionsSection}>
                <View style={styles.quickSuggestionsHeader}>
                  <Lightbulb size={14} color="#FFD700" strokeWidth={2} />
                  <Text style={styles.quickSuggestionsTitle}>
                    {t('modals.taskModal.quickSuggestions.title')}
                  </Text>
                </View>
                <View style={styles.quickSuggestionsGrid}>
                  {quickSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickSuggestionButton}
                      onPress={() => handleQuickSuggestion(suggestion.text)}
                    >
                      <suggestion.icon 
                        size={16} 
                        color={suggestion.color} 
                        strokeWidth={2}
                      />
                      <Text style={styles.quickSuggestionText}>
                        {suggestion.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {/* Bouton IA */}
            {!editingTask && (
              <TouchableOpacity
                style={[
                  styles.aiButton,
                  (cooldownSeconds > 0) && styles.aiButtonDisabled
                ]}
                onPress={handleAIGenerate}
                disabled={isGeneratingAI || cooldownSeconds > 0}
              >
                <Animated.View 
                  style={[
                    styles.aiButtonGradient,
                    isGeneratingAI && styles.aiButtonLoading
                  ]}
                >
                  {/* Barre de cooldown */}
                  {cooldownSeconds > 0 && (
                    <Animated.View 
                      style={[
                        styles.cooldownOverlay,
                        {
                          width: cooldownAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          })
                        }
                      ]}
                    />
                  )}
                  
                  {/* Effet shimmer animé */}
                  {cooldownSeconds === 0 && (
                    <Animated.View 
                      style={[
                        styles.shimmerOverlay,
                        {
                          transform: [{
                            translateX: shimmerAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-300, 300],
                            })
                          }]
                        }
                      ]}
                    />
                  )}
                  
                  <View style={styles.aiButtonContent}>
                    <View style={styles.aiIconContainer}>
                      <Brain 
                        size={24} 
                        color="#FFFFFF"
                        strokeWidth={2.5}
                      />
                    </View>
                    <Text style={styles.aiButtonText}>
                      {isGeneratingAI 
                    ? t('modals.taskModal.ai.buttonLoading')
                    : cooldownSeconds > 0 
                      ? t('modals.taskModal.ai.buttonCooldown', { seconds: cooldownSeconds })
                      : hasUsedAI 
                        ? t('modals.taskModal.ai.buttonUsed')
                        : t('modals.taskModal.ai.buttonDefault')
                  }
                    </Text>
                    {isGeneratingAI && (
                      <View style={styles.loadingDots}>
                        <Animated.View style={[styles.dot, { opacity: dot1Anim }]} />
                        <Animated.View style={[styles.dot, { opacity: dot2Anim }]} />
                        <Animated.View style={[styles.dot, { opacity: dot3Anim }]} />
                      </View>
                    )}
                  </View>
                </Animated.View>
              </TouchableOpacity>
            )}
            
            {/* Champ de contexte IA (apparaît après première utilisation) */}
            {!editingTask && hasUsedAI && (
              <View style={styles.aiContextSection}>
                {t('modals.taskModal.ai.contextLabel')}

                <TextInput
                  style={styles.aiContextInput}
                  placeholder={t('modals.taskModal.ai.contextPlaceholderMet')}
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={aiContext}
                  onChangeText={setAiContext}
                  multiline
                  maxLength={100}
                  returnKeyType="done"
                />
                <Text style={styles.aiContextCount}>
                  {t('modals.taskModal.characterCount', { count: aiContext.length, max: 100 })}
                </Text>
              </View>
            )}
          </ScrollView>
          
          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={handleCancel}
            >
        <Text style={styles.modalCancelText}>{t('modals.taskModal.actions.cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modalSaveButton,
                styles.metSaveButton, // Couleur rouge pour MET
                (!taskText || !taskText.trim()) && styles.modalSaveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={!taskText || !taskText.trim()}
            >
              <Text style={styles.modalSaveText}>
          {editingTask ? t('modals.taskModal.actions.edit') : t('modals.taskModal.actions.add')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: 'rgba(20, 20, 30, 0.98)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: height * 0.85,
    marginTop: 80,
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    maxHeight: height * 0.5,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  characterCount: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 20,
  },
  
  // ✅ Styles pour l'option de récurrence (identiques)
  recurringOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  recurringContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recurringText: {
    flex: 1,
    marginRight: 16,
  },
  recurringLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  recurringDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: 'transparent',
  },
  
  // Suggestions rapides
  quickSuggestionsSection: {
    marginBottom: 24,
  },
  quickSuggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  quickSuggestionsTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  quickSuggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickSuggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flex: 1,
    minWidth: '48%',
    maxWidth: '48%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  quickSuggestionText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#FFFFFF',
    flex: 1,
  },
  
  // Bouton IA (thème rouge pour MET)
  aiButton: {
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 16,
  },
  aiButtonGradient: {
    borderRadius: 20,
    padding: 3,
    backgroundColor: '#EF4444', // Rouge pour MET
    position: 'relative',
    overflow: 'hidden',
  },
  aiButtonLoading: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  aiButtonDisabled: {
    opacity: 0.6,
  },
  cooldownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(100, 100, 100, 0.8)',
    borderRadius: 20,
    zIndex: 2,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderRadius: 20,
    width: 100,
    height: '100%',
    zIndex: 1,
  },
  aiButtonContent: {
    backgroundColor: '#EF4444', // Rouge pour MET
    borderRadius: 17,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#FFFFFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  aiButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 2,
    shadowColor: '#FFFFFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  
  // Section contexte IA
  aiContextSection: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // Rouge pour MET
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  aiContextLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#EF4444', // Rouge pour MET
    marginBottom: 12,
  },
  aiContextInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    minHeight: 60,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 8,
  },
  aiContextCount: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: 'rgba(239, 68, 68, 0.7)',
    textAlign: 'right',
  },
  
  // Actions
  modalActions: {
    flexDirection: 'row',
    gap: 16,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  metSaveButton: {
    backgroundColor: '#EF4444', // Rouge pour MET
  },
  modalSaveButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalSaveText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  ScrollView,
  Modal,
  Alert,
  Keyboard,
  Platform,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const { height: screenHeight } = Dimensions.get('window');

const OBJECTIVE_CATEGORIES = {
  scolaires: { emoji: "📚", color: "#4ECDC4" },
  sportifs: { emoji: "💪", color: "#45B7D1" },
  business: { emoji: "💼", color: "#FFA726" },
  personnels: { emoji: "🎯", color: "#AB47BC" }
};

export default function MITInputQuestion({ 
  question, 
  value, 
  onChangeText, 
  triggerHaptic,
  firstName,
  selectedObjectives = [] // Les objectifs sélectionnés à la question 3
}) {
  const { t } = useTranslation();
  const [mits, setMits] = useState(
    value ? (Array.isArray(value) ? value : [{ text: value, category: null }]) : [{ text: '', category: null }]
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const scrollViewRef = useRef(null);
  const inputRefs = useRef({});

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Écouter les événements du clavier
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        if (focusedIndex >= 0) {
          // Scroll après que le clavier soit apparu
          setTimeout(() => scrollToInput(focusedIndex), 100);
        }
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setFocusedIndex(-1);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [focusedIndex]);

  useEffect(() => {
    // Synchroniser avec le parent
    onChangeText(mits);
  }, [mits]);

  // Fonction pour scroller vers un input spécifique avec des valeurs personnalisées
  const scrollToInput = (index) => {
    console.log(`Scrolling to input ${index}...`);
    
    if (scrollViewRef.current) {
      let scrollOffset = 0;
      
      // Définir l'offset selon l'index
      switch(index) {
        case 0:
          scrollOffset = 0; // Pas de scroll pour le premier MIT
          break;
        case 1:
          scrollOffset = 125;
          break;
        case 2:
          scrollOffset = 275;
          break;
        case 3:
          scrollOffset = 450;
          break;
        case 4:
          scrollOffset = 660;
          break;
        default:
          scrollOffset = 0;
      }
      
      console.log(`Scrolling by: ${scrollOffset}px for index ${index}`);
      
      if (scrollOffset > 0) {
        scrollViewRef.current.scrollTo({
          y: scrollOffset,
          animated: true
        });
      }
    } else {
      console.log('ScrollView ref not found');
    }
  };

  const handleInputFocus = (index) => {
    console.log(`Input ${index} focused`);
    setFocusedIndex(index);
    
    if (keyboardHeight > 0) {
      // Si le clavier est déjà ouvert, scroll immédiatement
      setTimeout(() => scrollToInput(index), 100);
    }
  };

  const addMIT = () => {
    if (mits.length < 5) {
      triggerHaptic();
      const newIndex = mits.length;
      setMits(prev => [...prev, { text: '', category: null }]);
      
      // Focus automatiquement sur le nouveau MIT après un court délai
      setTimeout(() => {
        const newInputRef = inputRefs.current[newIndex];
        if (newInputRef) {
          newInputRef.focus();
        }
      }, 100);
    }
  };

  const removeMIT = (index) => {
    if (mits.length > 1) {
      triggerHaptic();
      setMits(prev => prev.filter((_, i) => i !== index));
      
      // Nettoyer les références
      const newRefs = {};
      Object.keys(inputRefs.current).forEach(key => {
        const keyIndex = parseInt(key);
        if (keyIndex < index) {
          newRefs[keyIndex] = inputRefs.current[keyIndex];
        } else if (keyIndex > index) {
          newRefs[keyIndex - 1] = inputRefs.current[keyIndex];
        }
      });
      inputRefs.current = newRefs;
      
      // Reset focus
      setFocusedIndex(-1);
    }
  };

  const updateMITText = (index, text) => {
    setMits(prev => prev.map((mit, i) => 
      i === index ? { ...mit, text } : mit
    ));
  };

  const updateMITCategory = (index, category) => {
    triggerHaptic();
    setMits(prev => prev.map((mit, i) => 
      i === index ? { ...mit, category } : mit
    ));
  };

  const getAvailableCategories = () => {
    return selectedObjectives.filter(cat => OBJECTIVE_CATEGORIES[cat]);
  };

  const handleValidation = () => {
    const filledMits = mits.filter(mit => mit.text.trim() !== '');
    if (filledMits.length === 0) {
      Alert.alert(t('mitInput.validation.alertTitle'), t('mitInput.validation.alertMessage'));
      return;
    }

    if (filledMits.length > 3) {
      setShowConfirmModal(true);
    } else {
      // Validation directe si 3 MIT ou moins
      triggerHaptic();
    }
  };

  const confirmValidation = () => {
    setShowConfirmModal(false);
    triggerHaptic();
  };

  const availableCategories = getAvailableCategories();

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 20 }
        ]}
        keyboardShouldPersistTaps="handled"
      >

        {/* Liste des MIT */}
        <View style={styles.mitsContainer}>
          {mits.map((mit, index) => (
            <MITItem
              key={`mit-${index}`}
              index={index}
              mit={mit}
              availableCategories={availableCategories}
              onTextChange={(text) => updateMITText(index, text)}
              onCategoryChange={(category) => updateMITCategory(index, category)}
              onRemove={() => removeMIT(index)}
              canRemove={mits.length > 1}
              triggerHaptic={triggerHaptic}
              onFocus={() => handleInputFocus(index)}
              onBlur={() => setFocusedIndex(-1)}
              setInputRef={(ref) => {
                if (ref) {
                  inputRefs.current[index] = ref;
                  console.log(`Input ref ${index} set:`, !!ref);
                } else {
                  delete inputRefs.current[index];
                }
              }}
            />
          ))}
        </View>

        {/* Bouton pour ajouter un MIT */}
        {mits.length < 5 && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={addMIT}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>{t('mitInput.addButton')}</Text>
          </TouchableOpacity>
        )}

        {/* Compteur */}
        <Text style={styles.counterText}>
          {t('mitInput.counter', { 
            count: mits.filter(mit => mit.text.trim() !== '').length,
            total: 5
          })}
        </Text>

        {/* Modal de confirmation */}
        <Modal
          visible={showConfirmModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowConfirmModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('mitInput.modal.title')}</Text>
              <Text style={styles.modalText}>
                {t('mitInput.modal.message')}
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setShowConfirmModal(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonTextSecondary}>{t('mitInput.modal.revise')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={confirmValidation}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonTextPrimary}>{t('mitInput.modal.confirm')}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </ScrollView>
    </Animated.View>
  );
}

// Composant pour chaque MIT individuel
function MITItem({ 
  index, 
  mit, 
  availableCategories, 
  onTextChange, 
  onCategoryChange, 
  onRemove, 
  canRemove,
  triggerHaptic,
  onFocus,
  onBlur,
  setInputRef
}) {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur();
  };

  return (
    <View style={styles.mitItem}>
      {/* Numéro et input */}
      <View style={styles.mitHeader}>
        <View style={styles.mitNumber}>
          <Text style={styles.mitNumberText}>{index + 1}</Text>
        </View>
        
        <TextInput
          ref={setInputRef}
          style={[
            styles.mitInput,
            isFocused && styles.mitInputFocused
          ]}
          value={mit.text}
          onChangeText={onTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={t('mitInput.placeholder', { number: index + 1 })}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          maxLength={100}
          returnKeyType="done"
          blurOnSubmit={true}
        />
        
        {canRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemove}
            activeOpacity={0.8}
          >
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sélecteur de catégorie */}
      {availableCategories.length > 0 && (
        <View style={styles.categorySelector}>
          <Text style={styles.categoryLabel}>{t('mitInput.categoryLabel')}</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContainer}
          >
            {availableCategories.map(categoryId => {
              const category = OBJECTIVE_CATEGORIES[categoryId];
              const isSelected = mit.category === categoryId;
              
              return (
                <TouchableOpacity
                  key={categoryId}
                  style={[
                    styles.categoryChip,
                    isSelected && { 
                      backgroundColor: category.color + '30',
                      borderColor: category.color 
                    }
                  ]}
                  onPress={() => onCategoryChange(isSelected ? null : categoryId)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={[
                    styles.categoryText,
                    isSelected && { color: category.color }
                  ]}>
                    {t(`onboarding.options.${categoryId}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  instructionText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subInstructionText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  mitsContainer: {
    gap: 16,
  },
  mitItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mitNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mitNumberText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#000',
  },
  mitInput: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  mitInputFocused: {
    borderColor: '#FFD700',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  categorySelector: {
    marginTop: 12,
  },
  categoryLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  categoryScrollContainer: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 6,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderStyle: 'dashed',
    marginTop: 16,
  },
  addButtonIcon: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#FFD700',
    marginRight: 8,
  },
  addButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFD700',
  },
  counterText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E2E',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 350,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  modalTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalButtonPrimary: {
    backgroundColor: '#FFD700',
  },
  modalButtonTextSecondary: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  modalButtonTextPrimary: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#000',
  },
});
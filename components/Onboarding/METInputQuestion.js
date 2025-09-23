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

const { height: screenHeight } = Dimensions.get('window');

const AVOID_CATEGORIES = {
  digital: { text: "Digital", emoji: "📱", color: "#FF6B6B" },
  social: { text: "Social", emoji: "👥", color: "#FF8C42" },
  habits: { text: "Habitudes", emoji: "🚫", color: "#FFA726" },
  entertainment: { text: "Divertissement", emoji: "🎮", color: "#AB47BC" },
  food: { text: "Alimentation", emoji: "🍕", color: "#66BB6A" },
  procrastination: { text: "Procrastination", emoji: "⏰", color: "#42A5F5" }
};

export default function METInputQuestion({ 
  question, 
  value, 
  onChangeText, 
  triggerHaptic,
  firstName,
  selectedObjectives = [] // Les objectifs sélectionnés à la question 3
}) {
  const [mets, setMets] = useState(
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
    onChangeText(mets);
  }, [mets]);

  // Fonction pour scroller vers un input spécifique avec des valeurs personnalisées
  const scrollToInput = (index) => {
    console.log(`Scrolling to input ${index}...`);
    
    if (scrollViewRef.current) {
      let scrollOffset = 0;
      
      // Définir l'offset selon l'index
      switch(index) {
        case 0:
          scrollOffset = 0; // Pas de scroll pour le premier MET
          break;
        case 1:
          scrollOffset = 125;
          break;
        case 2:
          scrollOffset = 275;
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

  const addMET = () => {
    if (mets.length < 3) {
      triggerHaptic();
      const newIndex = mets.length;
      setMets(prev => [...prev, { text: '', category: null }]);
      
      // Focus automatiquement sur le nouveau MET après un court délai
      setTimeout(() => {
        const newInputRef = inputRefs.current[newIndex];
        if (newInputRef) {
          newInputRef.focus();
        }
      }, 100);
    }
  };

  const removeMET = (index) => {
    if (mets.length > 1) {
      triggerHaptic();
      setMets(prev => prev.filter((_, i) => i !== index));
      
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

  const updateMETText = (index, text) => {
    setMets(prev => prev.map((met, i) => 
      i === index ? { ...met, text } : met
    ));
  };

  const updateMETCategory = (index, category) => {
    triggerHaptic();
    setMets(prev => prev.map((met, i) => 
      i === index ? { ...met, category } : met
    ));
  };

  const getAvailableCategories = () => {
    return Object.keys(AVOID_CATEGORIES);
  };

  const handleValidation = () => {
    const filledMets = mets.filter(met => met.text.trim() !== '');
    if (filledMets.length === 0) {
      Alert.alert("Attention", "Ajoutez au moins un MET pour continuer !");
      return;
    }

    if (filledMets.length > 3) {
      setShowConfirmModal(true);
    } else {
      // Validation directe si 3 MET ou moins
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

        {/* Liste des MET */}
        <View style={styles.metsContainer}>
          {mets.map((met, index) => (
            <METItem
              key={`met-${index}`}
              index={index}
              met={met}
              availableCategories={availableCategories}
              onTextChange={(text) => updateMETText(index, text)}
              onCategoryChange={(category) => updateMETCategory(index, category)}
              onRemove={() => removeMET(index)}
              canRemove={mets.length > 1}
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

        {/* Bouton pour ajouter un MET */}
        {mets.length < 3 && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={addMET}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>Ajouter un MET</Text>
          </TouchableOpacity>
        )}

        {/* Compteur */}
        <Text style={styles.counterText}>
          {mets.filter(met => met.text.trim() !== '').length} / 3 MET créés
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
              <Text style={styles.modalTitle}>⚠️ Attention !</Text>
              <Text style={styles.modalText}>
                Vous avez plus de 3 MET. L'objectif est d'éviter tout ! 
                {'\n\n'}
                Êtes-vous sûr de pouvoir éviter tout cela demain ?
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setShowConfirmModal(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonTextSecondary}>Réviser</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={confirmValidation}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonTextPrimary}>Je confirme</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </ScrollView>
    </Animated.View>
  );
}

// Composant pour chaque MET individuel
function METItem({ 
  index, 
  met, 
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
    <View style={styles.metItem}>
      {/* Numéro et input */}
      <View style={styles.metHeader}>
        <View style={styles.metNumber}>
          <Text style={styles.metNumberText}>{index + 1}</Text>
        </View>
        
        <TextInput
          ref={setInputRef}
          style={[
            styles.metInput,
            isFocused && styles.metInputFocused
          ]}
          value={met.text}
          onChangeText={onTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={`MET ${index + 1}...`}
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
          <Text style={styles.categoryLabel}>Catégorie :</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContainer}
          >
            {availableCategories.map(categoryId => {
              const category = AVOID_CATEGORIES[categoryId];
              const isSelected = met.category === categoryId;
              
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
                    {category.text}
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
  metsContainer: {
    gap: 16,
  },
  metItem: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  metHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metNumberText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  metInput: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  metInputFocused: {
    borderColor: '#FF6B6B',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF4444',
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
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
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
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderStyle: 'dashed',
    marginTop: 16,
  },
  addButtonIcon: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#FF6B6B',
    marginRight: 8,
  },
  addButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FF6B6B',
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
    borderColor: '#FF6B6B',
  },
  modalTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FF6B6B',
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
    backgroundColor: '#FF6B6B',
  },
  modalButtonTextSecondary: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  modalButtonTextPrimary: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
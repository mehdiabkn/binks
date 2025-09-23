import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';

export default function MultipleChoiceQuestion({ 
  question, 
  selectedAnswer, 
  onSelect, 
  triggerHaptic 
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const { t } = useTranslation();

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
  }, []);

  const handleOptionPress = (optionId) => {
    triggerHaptic();
    
    if (!question.multiSelect) {
      // Mode sélection unique
      onSelect(optionId);
    } else {
      // Mode sélection multiple
      const currentSelections = selectedAnswer || [];
      let newSelections;
      
      if (currentSelections.includes(optionId)) {
        // Désélectionner
        newSelections = currentSelections.filter(id => id !== optionId);
      } else {
        // Sélectionner
        newSelections = [...currentSelections, optionId];
      }
      
      onSelect(newSelections.length > 0 ? newSelections : null);
    }
  };

  const isSelected = (optionId) => {
    if (!question.multiSelect) {
      return selectedAnswer === optionId;
    } else {
      return selectedAnswer && selectedAnswer.includes(optionId);
    }
  };

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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >


        {/* Options */}
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => {
            const selected = isSelected(option.id);
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  selected && styles.selectedOption,
                ]}
                onPress={() => handleOptionPress(option.id)}
                activeOpacity={0.8}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionEmoji}>
                    {option.emoji}
                  </Text>
                  
                  <Text style={[
                    styles.optionText,
                    selected && styles.selectedOptionText,
                  ]}>
                    {option.text}
                  </Text>
                  
                  {/* Indicateur de sélection */}
                  <View style={[
                    styles.selectionIndicator,
                    selected && styles.selectedIndicator,
                  ]}>
                    {selected && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Compte des sélections multiples */}
        {question.multiSelect && selectedAnswer && selectedAnswer.length > 0 && (
          <Text style={styles.selectionCount}>
                        {t('multipleChoice.selectionCount', { count: selectedAnswer.length })}

          </Text>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  scrollContent: {
    paddingVertical: 10,
  },
  multiSelectHint: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedOption: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.3,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  selectedOptionText: {
    color: '#FFD700',
    fontFamily: 'Poppins-SemiBold',
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicator: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  checkmark: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  selectionCount: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 13,
  },
});
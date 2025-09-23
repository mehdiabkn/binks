import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Animated,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function TextInputQuestion({ 
  question, 
  value, 
  onChangeText, 
  triggerHaptic,
  firstName 
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [characterCount, setCharacterCount] = useState(value?.length || 0);
    const { t } = useTranslation();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  
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

  useEffect(() => {
    // Animation du focus
    Animated.timing(borderAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const handleTextChange = (text) => {
    if (text.length <= question.maxLength) {
      setCharacterCount(text.length);
      onChangeText(text);
      // Haptic retiré - seulement sur les boutons
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Haptic retiré - seulement sur les boutons
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleValidate = () => {
    Keyboard.dismiss();
    setIsFocused(false);
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.3)', '#FFD700'],
  });

  const progressWidth = (characterCount / question.maxLength) * 100;

  // Personnaliser le texte avec le prénom si disponible
  const getPersonalizedText = (text) => {
    if (firstName && text) {
      return text.replace(/\[prénom\]/g, firstName);
    }
    return text;
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustContentInsets={false}
        scrollEventThrottle={16}
      >
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Zone de saisie */}
          <Animated.View 
            style={[
              styles.inputContainer,
              {
                borderColor: borderColor,
              },
            ]}
          >
            <TextInput
              style={styles.textInput}
              value={value || ''}
              onChangeText={handleTextChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={getPersonalizedText(question.placeholder)}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              multiline={true}
              maxLength={question.maxLength}
              textAlignVertical="top"
              selectionColor="#FFD700"
              autoFocus={false}
              blurOnSubmit={true}
              returnKeyType="done"
              onSubmitEditing={handleValidate}
            />
          </Animated.View>

          {/* Compteur de caractères et barre de progression */}
          <View style={styles.counterContainer}>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <Animated.View 
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progressWidth}%`,
                      backgroundColor: progressWidth > 90 ? '#FF6B6B' : 
                                      progressWidth > 70 ? '#FFD700' : '#4ECDC4',
                    }
                  ]}
                />
              </View>
            </View>
            
            <Text style={[
              styles.characterCount,
              {
                color: characterCount > question.maxLength * 0.9 ? '#FF6B6B' : 
                       characterCount > question.maxLength * 0.7 ? '#FFD700' : 
                       'rgba(255, 255, 255, 0.7)'
              }
            ]}>
              {characterCount} / {question.maxLength}
            </Text>
          </View>

          {/* Indication d'aide personnalisée */}

            <Text style={styles.helpText}>
        💡 {firstName ? t('textInput.helpTextWithName', { firstName }) : t('textInput.helpTextNoName')}
        </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 280,
    justifyContent: 'flex-start',
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  textInput: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: 120,
    maxHeight: 160,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBarContainer: {
    flex: 1,
    marginRight: 12,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  characterCount: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    minWidth: 80,
    textAlign: 'right',
  },
  helpText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
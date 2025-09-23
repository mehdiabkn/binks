import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useTranslation } from 'react-i18next';

export default function NameInputQuestion({ 
  question, 
  value, 
  onChangeText, 
  triggerHaptic 
}) {
  const [isFocused, setIsFocused] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
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

  useEffect(() => {
    // Animation du focus
    Animated.timing(borderAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const handleTextChange = (text) => {
    // Nettoyer le texte : enlever les chiffres et caractères spéciaux
    const cleanText = text.replace(/[^a-zA-Z\s\u00C0-\u017F]/g, '');
    
    if (cleanText.length <= question.maxLength) {
      onChangeText(cleanText);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setIsFocused(false);
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.3)', '#FFD700'],
  });

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
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
            <View style={styles.emojiContainer}>
              <Text style={styles.inputEmoji}>👋</Text>
            </View>
            
            <TextInput
              style={styles.textInput}
              value={value}
              onChangeText={handleTextChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={question.placeholder}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              maxLength={question.maxLength}
              selectionColor="#FFD700"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              textContentType="givenName"
              onSubmitEditing={dismissKeyboard}
            />
          </Animated.View>

        {/* Indication d'aide */}
        <Text style={styles.helpText}>
        {t('nameInput.helpText')}
        </Text>
                  
          {/* Compteur de caractères */}
          <Text style={styles.characterCount}>
            {value?.length || 0 } / {question.maxLength}
          </Text>
        </Animated.View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emojiContainer: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  inputEmoji: {
    fontSize: 24,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#FFFFFF',
    paddingVertical: 18,
    paddingRight: 20,
  },
  helpText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  characterCount: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});
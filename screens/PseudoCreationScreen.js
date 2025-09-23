import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import HapticFeedback from 'react-native-haptic-feedback';
import StarryBackground from '../components/Welcome/StarryBackground';

const { width, height } = Dimensions.get('window');

// Avatars disponibles
const AVATAR_OPTIONS = [
  ' ', '⚡', '🔥', '💎', '🎯', '🏆', 
  '🦄', '🐉', '🦅', '🦁', '🐺', '🐯',
  '🌟', '💫', '✨', '🌙', '☄️', '🌈',
  '🎮', '🎪', '🎨', '🎵', '🎲', '🎭'
];

export default function PseudoCreationScreen({ onComplete, onboardingData }) {
  const { t } = useTranslation();
  
  // States
  const [pseudo, setPseudo] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(' ');
  const [isValidPseudo, setIsValidPseudo] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const avatarScaleAnim = useRef(new Animated.Value(1)).current;

  // Animation d'entrée
  useEffect(() => {
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // Validation du pseudo
  useEffect(() => {
    const trimmedPseudo = pseudo.trim();
    const valid = trimmedPseudo.length >= 2 && trimmedPseudo.length <= 20;
    setIsValidPseudo(valid);
    
    if (valid) {
      // Animation de validation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [pseudo]);

  // Fonction de feedback haptique
  const triggerHapticFeedback = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger('selection', options);
  };

  // Sélection d'avatar
  const handleAvatarSelect = (avatar) => {
    triggerHapticFeedback();
    setSelectedAvatar(avatar);
    
    // Animation de sélection d'avatar
    Animated.sequence([
      Animated.timing(avatarScaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(avatarScaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Finaliser la création
  const handleComplete = () => {
    if (!isValidPseudo) {
      // Feedback d'erreur
      HapticFeedback.trigger('notificationError');
      return;
    }
    
    triggerHapticFeedback();
    
    // Animation de succès
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Données à retourner
      const pseudoData = {
        pseudo: pseudo.trim(),
        avatar: selectedAvatar,
        createdAt: new Date().toISOString()
      };
      
      console.log('🎯 Données pseudo créées:', pseudoData);
      onComplete(pseudoData);
    });
  };

  // Obtenir le prénom depuis l'onboarding
  const firstName = onboardingData?.[1] || 'Champion';

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <StarryBackground>
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>{t('common.appName')}</Text>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
          </View>

          {/* Contenu principal */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Message de bienvenue */}
            <Animated.View 
              style={[
                styles.welcomeSection,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Text style={styles.welcomeTitle}>
                {t('pseudoCreation.welcome', { firstName })}
              </Text>
              <Text style={styles.welcomeSubtitle}>
                {t('pseudoCreation.subtitle')}
              </Text>
            </Animated.View>

            {/* Sélection d'avatar */}
            <View style={styles.avatarSection}>
              <Text style={styles.sectionTitle}>
                {t('pseudoCreation.chooseAvatar')}
              </Text>
              
              <View style={styles.selectedAvatarContainer}>
                <Animated.View 
                  style={[
                    styles.selectedAvatar,
                    { transform: [{ scale: avatarScaleAnim }] },
                  ]}
                >
                  <Text style={styles.selectedAvatarText}>{selectedAvatar}</Text>
                </Animated.View>
              </View>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.avatarGrid}
              >
                {AVATAR_OPTIONS.map((avatar, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.avatarOption,
                      selectedAvatar === avatar && styles.avatarOptionSelected,
                    ]}
                    onPress={() => handleAvatarSelect(avatar)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.avatarOptionText}>{avatar}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Input pseudo */}
            <View style={styles.pseudoSection}>
              <Text style={styles.sectionTitle}>
                {t('pseudoCreation.choosePseudo')}
              </Text>
              
              <View style={[
                styles.inputContainer,
                isValidPseudo && styles.inputContainerValid,
                pseudo.length > 0 && !isValidPseudo && styles.inputContainerInvalid,
              ]}>
                <TextInput
                  style={styles.pseudoInput}
                  placeholder={t('pseudoCreation.pseudoPlaceholder')}
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={pseudo}
                  onChangeText={setPseudo}
                  maxLength={20}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleComplete}
                />
                <View style={styles.inputCounter}>
                  <Text style={[
                    styles.counterText,
                    isValidPseudo && styles.counterTextValid,
                    pseudo.length > 0 && !isValidPseudo && styles.counterTextInvalid,
                  ]}>
                    {pseudo.length}/20
                  </Text>
                </View>
              </View>

              <Text style={styles.inputHint}>
                {t('pseudoCreation.pseudoHint')}
              </Text>
            </View>

            {/* Preview du profil */}
            <View style={styles.previewSection}>
              <Text style={styles.sectionTitle}>
                {t('pseudoCreation.preview')}
              </Text>
              
              <View style={styles.previewCard}>
                <View style={styles.previewAvatar}>
                  <Text style={styles.previewAvatarText}>{selectedAvatar}</Text>
                </View>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewPseudo}>
                    {pseudo || t('pseudoCreation.pseudoPlaceholder')}
                  </Text>
                  <Text style={styles.previewLevel}>
                    {t('pseudoCreation.level', { level: 1 })}
                  </Text>
                </View>
                <View style={styles.previewBadge}>
                  <Text style={styles.previewBadgeText}>🌟</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Bouton de validation */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.completeButton,
                isValidPseudo && styles.completeButtonActive,
              ]}
              onPress={handleComplete}
              disabled={!isValidPseudo}
              activeOpacity={0.9}
            >
              <Text style={[
                styles.completeButtonText,
                isValidPseudo && styles.completeButtonTextActive,
              ]}>
                {t('pseudoCreation.startAdventure')}
              </Text>
              <Text style={styles.completeButtonIcon}> </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </StarryBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: height * 0.06,
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: 15,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  progressBar: {
    width: width * 0.7,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Welcome section
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Avatar section
  avatarSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 15,
    textAlign: 'center',
  },
  selectedAvatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 3,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedAvatarText: {
    fontSize: 40,
  },
  avatarGrid: {
    paddingHorizontal: 10,
  },
  avatarOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  avatarOptionSelected: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  avatarOptionText: {
    fontSize: 24,
  },

  // Pseudo section
  pseudoSection: {
    marginBottom: 30,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 8,
    position: 'relative',
  },
  inputContainerValid: {
    borderColor: '#4CD964',
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
  },
  inputContainerInvalid: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  pseudoInput: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingRight: 60,
  },
  inputCounter: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  counterText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  counterTextValid: {
    color: '#4CD964',
  },
  counterTextInvalid: {
    color: '#FF6B6B',
  },
  inputHint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },

  // Preview section
  previewSection: {
    marginBottom: 20,
  },
  previewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  previewAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  previewAvatarText: {
    fontSize: 24,
  },
  previewInfo: {
    flex: 1,
  },
  previewPseudo: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  previewLevel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  previewBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBadgeText: {
    fontSize: 16,
  },

  // Footer
  footer: {
    paddingBottom: 34,
  },
  completeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  completeButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  completeButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.5)',
    marginRight: 8,
  },
  completeButtonTextActive: {
    color: '#000000',
  },
  completeButtonIcon: {
    fontSize: 20,
  },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage, getAvailableLanguages } from '../i18n';

const { width, height } = Dimensions.get('window');

export default function LanguageSelector({ 
  style, 
  showFlag = true, 
  showText = true, 
  size = 'medium' 
}) {
  const { t, i18n } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  
  const currentLanguage = getCurrentLanguage();
  const availableLanguages = getAvailableLanguages();
  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage);

  const handleLanguageChange = async (languageCode) => {
    if (languageCode === currentLanguage || isChanging) return;
    
    setIsChanging(true);
    
    try {
      const success = await changeLanguage(languageCode);
      
      if (success) {
        console.log('✅ Langue changée vers:', languageCode);
        
        // Petite vibration pour confirmer le changement
        const HapticFeedback = require('react-native-haptic-feedback');
        HapticFeedback.trigger('selection', {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
      }
    } catch (error) {
      console.error('❌ Erreur changement de langue:', error);
    } finally {
      setIsChanging(false);
      setIsModalVisible(false);
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { paddingHorizontal: 8, paddingVertical: 4 },
          flag: { fontSize: 16 },
          text: { fontSize: 12 }
        };
      case 'large':
        return {
          container: { paddingHorizontal: 16, paddingVertical: 8 },
          flag: { fontSize: 24 },
          text: { fontSize: 16 }
        };
      default: // medium
        return {
          container: { paddingHorizontal: 12, paddingVertical: 6 },
          flag: { fontSize: 20 },
          text: { fontSize: 14 }
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <>
      {/* Bouton pour ouvrir le sélecteur */}
      <TouchableOpacity
        style={[styles.selectorButton, sizeStyles.container, style]}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.7}
      >
        {showFlag && (
          <Text style={[styles.flag, sizeStyles.flag]}>
            {currentLang?.flag || '🌍'}
          </Text>
        )}
        {showText && (
          <Text style={[styles.languageText, sizeStyles.text]}>
            {currentLang?.code.toUpperCase() || 'FR'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Modal pour sélectionner la langue */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Choisir la langue / Choose language
            </Text>
            
            {availableLanguages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  currentLanguage === language.code && styles.selectedLanguage,
                  isChanging && styles.disabledOption
                ]}
                onPress={() => handleLanguageChange(language.code)}
                disabled={isChanging}
                activeOpacity={0.7}
              >
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <Text style={[
                  styles.languageName,
                  currentLanguage === language.code && styles.selectedLanguageName
                ]}>
                  {language.name}
                </Text>
                {currentLanguage === language.code && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>
                {currentLanguage === 'fr' ? 'Fermer' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  flag: {
    marginRight: 4,
  },
  languageText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    width: width * 0.8,
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedLanguage: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  disabledOption: {
    opacity: 0.5,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    flex: 1,
  },
  selectedLanguageName: {
    color: '#FFD700',
    fontFamily: 'Poppins-SemiBold',
  },
  checkmark: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
});
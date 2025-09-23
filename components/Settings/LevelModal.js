import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function LevelModal({ isVisible, onClose, currentLevel, currentXP }) {
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  // ✅ Valeurs par défaut pour éviter les erreurs
  const safeLevel = currentLevel || 1;
  const safeXP = currentXP || 0;

  // ✅ Debug - tu peux enlever ces console.log après
  // console.log('🔍 LevelModal props:', { currentLevel, currentXP, safeLevel, safeXP });

  // Animation de la modale
  useEffect(() => {
    if (isVisible) {
      Animated.spring(modalSlideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalSlideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  // Obtenir les infos du niveau actuel
  const getLevelInfo = () => {
    const levels = [
      { range: [1, 2], name: 'Débutant', icon: ' ', description: 'Tu commences ton aventure productivité !' },
      { range: [3, 4], name: 'Motivé', icon: '🎯', description: 'Tu prends le rythme, continue !' },
      { range: [5, 6], name: 'Expert', icon: '⭐', description: 'Tu maîtrises tes habitudes !' },
      { range: [7, 9], name: 'Champion', icon: '🏆', description: 'Impressionnant ! Tu es un exemple !' },
      { range: [10, 99], name: 'Légende', icon: '👑', description: 'Productivité maximale atteinte !' },
    ];
    
    return levels.find(l => safeLevel >= l.range[0] && safeLevel <= l.range[1]) || levels[0];
  };

  const xpMethods = [
    {
      icon: '✅',
      text: 'Compléter une tâche',
      reward: '+25 XP',
    },
    {
      icon: '🎯',
      text: 'Terminer ton MIT du jour',
      reward: '+50 XP',
    },
    {
      icon: '🔥',
      text: 'Maintenir ton streak quotidien',
      reward: '+10 XP/jour',
    },
    {
      icon: '📊',
      text: 'Atteindre 80+ points/jour',
      reward: '+30 XP bonus',
    },
    {
      icon: ' ',
      text: 'Atteindre un objectif futur',
      reward: '+100 XP',
    },
  ];

  const levelsPreviews = [
    { level: '1-2', name: 'Débutant', icon: ' ', color: '#4CD964' },
    { level: '3-4', name: 'Motivé', icon: '🎯', color: '#FFD700' },
    { level: '5-6', name: 'Expert', icon: '⭐', color: '#FF9500' },
    { level: '7-9', name: 'Champion', icon: '🏆', color: '#FF6B6B' },
    { level: '10+', name: 'Légende', icon: '👑', color: '#FF6B6B' },
  ];

  return (
    <Modal
      transparent
      visible={isVisible}
      onRequestClose={onClose}
      animationType="none"
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity 
          style={styles.modalBackdropTouchable}
          onPress={onClose}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: modalSlideAnim }],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Système de niveaux</Text>
            <Text style={styles.modalSubtitle}>Comment gagner de l'XP</Text>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Niveau actuel */}
            <View style={styles.currentLevelSection}>
              <View style={styles.currentLevelInfo}>
                <Text style={styles.currentLevelIcon}>{getLevelInfo().icon}</Text>
                <View style={styles.currentLevelText}>
                  <Text style={styles.currentLevelName}>
                    Niveau {safeLevel} - {getLevelInfo().name}
                  </Text>
                  <Text style={styles.currentLevelDescription}>
                    {getLevelInfo().description}
                  </Text>
                </View>
              </View>
              
              <View style={styles.xpProgress}>
                <Text style={styles.xpText}>{safeXP} XP</Text>
                <View style={styles.xpBar}>
                  <View 
                    style={[
                      styles.xpBarFill,
                      { width: `${((safeXP % 100) / 100) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.xpNextLevel}>
                  {100 - (safeXP % 100)} XP pour le niveau {safeLevel + 1}
                </Text>
              </View>
            </View>

            {/* Comment gagner de l'XP */}
            <View style={styles.xpMethodsSection}>
              <Text style={styles.xpMethodsTitle}>💎 Comment gagner de l'XP :</Text>
              
              {xpMethods.map((method, index) => (
                <View key={index} style={styles.xpMethod}>
                  <Text style={styles.xpMethodIcon}>{method.icon}</Text>
                  <View style={styles.xpMethodContent}>
                    <Text style={styles.xpMethodText}>{method.text}</Text>
                    <Text style={styles.xpMethodReward}>{method.reward}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Aperçu des niveaux */}
            <View style={styles.levelsPreviewSection}>
              <Text style={styles.levelsPreviewTitle}>🏆 Aperçu des niveaux :</Text>
              
              {levelsPreviews.map((levelInfo, index) => (
                <View key={index} style={styles.levelPreview}>
                  <Text style={styles.levelPreviewIcon}>{levelInfo.icon}</Text>
                  <View style={styles.levelPreviewContent}>
                    <Text style={styles.levelPreviewName}>
                      Niveau {levelInfo.level} - {levelInfo.name}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={onClose}
          >
            <Text style={styles.modalCloseText}>Fermer</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    minHeight: 400,
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Niveau actuel
  currentLevelSection: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  currentLevelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  currentLevelIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  currentLevelText: {
    flex: 1,
  },
  currentLevelName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  currentLevelDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  xpProgress: {
    alignItems: 'center',
  },
  xpText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 8,
  },
  xpBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginBottom: 8,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  xpNextLevel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Méthodes XP
  xpMethodsSection: {
    marginBottom: 20,
  },
  xpMethodsTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 15,
  },
  xpMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  xpMethodIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  xpMethodContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpMethodText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#FFFFFF',
  },
  xpMethodReward: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#4CD964',
  },

  // Aperçu des niveaux
  levelsPreviewSection: {
    marginBottom: 20,
  },
  levelsPreviewTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 15,
  },
  levelPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  levelPreviewIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  levelPreviewContent: {
    flex: 1,
  },
  levelPreviewName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },

  // Bouton fermer
  modalCloseButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 15,
    margin: 20,
    alignItems: 'center',
  },
  modalCloseText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#000000',
  },
});
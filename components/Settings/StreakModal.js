import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function StreakModal({ 
  isVisible, 
  onClose, 
  currentStreak, 
  getStreakMultiplier 
}) {

  // ✅ Valeurs par défaut pour éviter les erreurs
  const safeStreak = currentStreak || 1;
  const safeGetMultiplier = getStreakMultiplier || ((streak) => 1.0);

  // Paliers de multiplicateurs
  const streakLevels = [
    { days: '1-2 jours', multiplier: 'x1.0', color: '#999', description: 'Début de streak' },
    { days: '3-6 jours', multiplier: 'x1.2', color: '#4CD964', description: 'Bon début !' },
    { days: '7-13 jours', multiplier: 'x1.5', color: '#FFD700', description: 'Une semaine !' },
    { days: '14-20 jours', multiplier: 'x2.0', color: '#FF9500', description: 'Deux semaines !' },
    { days: '21-29 jours', multiplier: 'x2.5', color: '#FF6B6B', description: 'Trois semaines !' },
    { days: '30+ jours', multiplier: 'x3.0', color: '#FF6B6B', description: 'Légende absolue !' },
  ];

  // Déterminer le palier actif
  const getActiveLevelIndex = () => {
    if (safeStreak >= 30) return 5;
    if (safeStreak >= 21) return 4;
    if (safeStreak >= 14) return 3;
    if (safeStreak >= 7) return 2;
    if (safeStreak >= 3) return 1;
    return 0;
  };

  const activeLevelIndex = getActiveLevelIndex();

  return (
    <Modal
      transparent
      visible={isVisible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <View style={styles.backdrop}>
        <TouchableOpacity 
          style={styles.backdropTouchable}
          onPress={onClose}
        />
        
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>🔥 Multiplicateurs de Streak</Text>
            <Text style={styles.subtitle}>Plus tu enchaînes, plus tu gagnes !</Text>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Info streak actuel */}
            <View style={styles.currentStreakInfo}>
              <Text style={styles.currentStreakText}>
                Ton streak actuel : {safeStreak} jours
              </Text>
              <Text style={styles.currentMultiplierText}>
                Multiplicateur : x{safeGetMultiplier(safeStreak)}
              </Text>
            </View>

            <Text style={styles.levelsTitle}>Paliers de multiplicateurs :</Text>
            
            {/* Liste des paliers */}
            {streakLevels.map((level, index) => {
              const isActive = index === activeLevelIndex;
              
              return (
                <View 
                  key={index} 
                  style={[
                    styles.level,
                    isActive && styles.levelActive
                  ]}
                >
                  <View style={styles.levelInfo}>
                    <Text style={[
                      styles.levelDays,
                      isActive && styles.levelDaysActive
                    ]}>
                      {level.days}
                    </Text>
                    <Text style={styles.levelDescription}>{level.description}</Text>
                  </View>
                  <Text style={[
                    styles.levelMultiplier,
                    { color: level.color },
                    isActive && styles.levelMultiplierActive
                  ]}>
                    {level.multiplier}
                  </Text>
                </View>
              );
            })}
            
            {/* Explication */}
            <View style={styles.explanation}>
              <Text style={styles.explanationTitle}>💡 Comment ça marche ?</Text>
              <Text style={styles.explanationText}>
                Chaque jour où tu complètes au moins une tâche, ton streak augmente. 
                Plus ton streak est long, plus l'XP que tu gagnes est multiplié !
              </Text>
              <Text style={styles.explanationExample}>
                Exemple : Avec un streak de 7 jours, compléter une tâche te donne 25 × 1.5 = 37 XP !
              </Text>
            </View>
          </ScrollView>

          {/* Bouton fermer */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    backgroundColor: 'rgba(20, 20, 30, 0.98)',
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: height * 0.8,
    minHeight: 400, // ✅ AJOUTÉ: Hauteur minimum pour garantir la visibilité
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  
  // Current streak info
  currentStreakInfo: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  currentStreakText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  currentMultiplierText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FF6B6B',
  },
  
  // Levels
  levelsTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 15,
  },
  level: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  levelActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: '#FFD700',
  },
  levelInfo: {
    flex: 1,
  },
  levelDays: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  levelDaysActive: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  levelDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  levelMultiplier: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
  },
  levelMultiplierActive: {
    fontSize: 16,
  },
  
  // Explanation
  explanation: {
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    marginBottom: 20, // ✅ AJOUTÉ: Marge en bas pour éviter le cut-off
    borderWidth: 1,
    borderColor: 'rgba(76, 217, 100, 0.3)',
  },
  explanationTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#4CD964',
    marginBottom: 8,
  },
  explanationText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
    marginBottom: 8,
  },
  explanationExample: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: '#4CD964',
    fontStyle: 'italic',
  },
  
  // Close button
  closeButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 12,
    margin: 20,
    alignItems: 'center'
  },
  closeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#000000',
  },
});
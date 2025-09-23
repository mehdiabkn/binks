import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import HapticFeedback from 'react-native-haptic-feedback';
import { Target, Ban } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function TabNavigation({ 
  activeTab, 
  onTabChange, 
  mitCount = 0, 
  metCount = 0 
}) {
  const { t } = useTranslation();
  
  // Animation pour la barre d'indicateur seulement
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const triggerHapticFeedback = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger('selection', options);
  };

  // Animation de la barre d'indicateur
  useEffect(() => {
    Animated.timing(indicatorAnim, {
      toValue: activeTab === 'MIT' ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [activeTab]);

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    
    triggerHapticFeedback();
    
    // Changement direct sans animation de contenu
    onTabChange(tab);
  };

  // Calculer la largeur et position exactes
  const containerWidth = width - 40; // Largeur totale moins les marges horizontales de l'écran
  const containerPadding = 8; // padding total du container (4px * 2)
  const availableWidth = containerWidth - containerPadding;
  const tabWidth = availableWidth / 2;
  
  // Position de la barre d'indicateur - elle doit aller exactement sur l'onglet de droite
  const indicatorTranslateX = indicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tabWidth], // Position exacte du deuxième onglet
  });

  return (
    <View style={styles.container}>
      {/* Container des onglets */}
      <View style={styles.tabsContainer}>
        {/* Barre d'indicateur animée */}
        <Animated.View
          style={[
            styles.indicator,
            {
              transform: [{ translateX: indicatorTranslateX }],
              backgroundColor: activeTab === 'MIT' ? '#4CD964' : '#FF6B6B',
            },
            { width: tabWidth }
          ]}
        />
        
        {/* Onglet MIT */}
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabChange('MIT')}
          activeOpacity={0.8}
        >
          <View style={styles.tabContent}>
            <View style={[
              styles.iconContainer,
              activeTab === 'MIT' && styles.activeIconContainer
            ]}>
              <Target 
                size={18} 
                color={activeTab === 'MIT' ? '#FFFFFF' : '#4CD964'} 
                strokeWidth={2.5}
              />
            </View>
            <Text style={[
              styles.tabText,
              activeTab === 'MIT' && styles.activeTabText
            ]}>
              {t('tabs.mit.label')}
            </Text>
            {mitCount > 0 && (
              <View style={[
                styles.badge,
                activeTab === 'MIT' && styles.activeBadge
              ]}>
                <Text style={[
                  styles.badgeText,
                  activeTab === 'MIT' && styles.activeBadgeText
                ]}>
                  {mitCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        {/* Onglet MET */}
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabChange('MET')}
          activeOpacity={0.8}
        >
          <View style={styles.tabContent}>
            <View style={[
              styles.iconContainer,
              activeTab === 'MET' && styles.activeIconContainerMET
            ]}>
              <Ban 
                size={18} 
                color={activeTab === 'MET' ? '#FFFFFF' : '#FF6B6B'} 
                strokeWidth={2.5}
              />
            </View>
            <Text style={[
              styles.tabText,
              activeTab === 'MET' && styles.activeTabTextMET
            ]}>
              {t('tabs.met.label')}
            </Text>
            {metCount > 0 && (
              <View style={[
                styles.badge,
                activeTab === 'MET' && styles.activeBadgeMET
              ]}>
                <Text style={[
                  styles.badgeText,
                  activeTab === 'MET' && styles.activeBadgeText
                ]}>
                  {metCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Descriptions des onglets */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.description}>
          {activeTab === 'MIT' 
            ? t('tabs.mit.description')
            : t('tabs.met.description')
          }
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 4,
    position: 'relative',
    marginBottom: 8,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tab: {
    flex: 1, // Utiliser flex au lieu de width fixe
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 1,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 217, 100, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeIconContainerMET: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeTabText: {
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  activeTabTextMET: {
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: 'rgba(76, 217, 100, 0.3)',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  activeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeBadgeMET: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#4CD964',
  },
  activeBadgeText: {
    color: '#FFFFFF',
  },
  descriptionContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  description: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});
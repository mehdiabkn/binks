import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import HapticFeedback from 'react-native-haptic-feedback';
import { 
  BookOpen,
  BarChart3, 
  Target, 
  Settings 
} from 'lucide-react-native';

// Import des écrans (à renommer selon la nouvelle structure)
import JournalScreen from './JournalScreen'; // Ancien FutureScreen
import StatisticsScreen from './StatisticsScreen'; // Ancien PastScreen
import ObjectivesScreen from './ObjectivesScreen'; // Ancien PresentScreen
import SettingsScreen from './SettingsScreen';

const { width, height } = Dimensions.get('window');

export default function MainNavigator({ userProfile, onResetApp }) {
  const { t } = useTranslation();
  
  // Configuration des onglets avec la nouvelle structure
  const TABS = [
    {
      id: 'journal',
      name: t('navigation.tabs.journal'),
      icon: BookOpen,
      component: JournalScreen,
      isDefault: true, // Journal devient l'onglet par défaut
    },
    {
      id: 'statistics',
      name: t('navigation.tabs.statistics'),
      icon: BarChart3,
      component: StatisticsScreen,
    },
    {
      id: 'objectives',
      name: t('navigation.tabs.objectives'),
      icon: Target,
      component: ObjectivesScreen,
    },
    {
      id: 'settings',
      name: t('navigation.tabs.settings'),
      icon: Settings,
      component: SettingsScreen,
    },
  ];
  
  // État de l'onglet actif (commence par Journal)
  const defaultTabIndex = TABS.findIndex(tab => tab.isDefault);
  const [activeTabIndex, setActiveTabIndex] = useState(defaultTabIndex);
  
  // Animation pour la transition des onglets
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Fonction de feedback haptique
  const triggerHapticFeedback = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger('selection', options);
  };
  
  // ✅ Navigation vers Journal depuis ObjectivesScreen (ex-PresentScreen)
  const handleNavigateToJournal = () => {
    const journalTabIndex = TABS.findIndex(tab => tab.id === 'journal');
    console.log('📖 Navigation forcée vers JournalScreen depuis célébration');
    
    triggerHapticFeedback();
    
    // Animation de transition vers Journal
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    setActiveTabIndex(journalTabIndex);
    
    // Analytics
    console.log('📊 Navigation: Objectives → Journal via celebration CTA');
  };
  
  // Changer d'onglet avec animation
  const handleTabChange = (tabIndex) => {
    if (tabIndex === activeTabIndex) return;
    
    triggerHapticFeedback();
    
    // Animation de sortie puis d'entrée
    Animated.sequence([
      // Fade out rapide
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      // Changer l'onglet et fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    setActiveTabIndex(tabIndex);
    console.log('📱 Navigation vers:', TABS[tabIndex].name);
  };
  
  // Rendu de l'écran actif
  const renderActiveScreen = () => {
    const ActiveComponent = TABS[activeTabIndex].component;
    
    // ✅ Props spécifiques selon l'écran
    const screenProps = {
      userProfile,
      onResetApp,
      // ✅ Ajouter la fonction de navigation pour ObjectivesScreen (ex-PresentScreen)
      ...(TABS[activeTabIndex].id === 'objectives' && {
        onNavigateToJournal: handleNavigateToJournal
      })
    };
    
    return (
      <Animated.View
        style={[
          styles.screenContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <ActiveComponent {...screenProps} />
      </Animated.View>
    );
  };
  
  // Couleurs des icônes selon l'onglet
  const getTabIconColor = (tabId, isActive) => {
    if (isActive) {
      switch (tabId) {
        case 'journal': return '#4CD964';
        case 'statistics': return '#FF6B6B';
        case 'objectives': return '#007AFF';
        case 'settings': return '#FFD700';
        default: return '#FFD700';
      }
    }
    return 'rgba(255, 255, 255, 0.6)';
  };
  
  // Rendu d'un bouton d'onglet
  const renderTabButton = (tab, index) => {
    const isActive = index === activeTabIndex;
    const IconComponent = tab.icon;
    const iconColor = getTabIconColor(tab.id, isActive);
    
    return (
      <TouchableOpacity
        key={tab.id}
        style={[
          styles.tabButton,
          isActive && styles.tabButtonActive,
        ]}
        onPress={() => handleTabChange(index)}
        activeOpacity={0.7}
      >
        {/* Indicateur d'onglet actif */}
        {isActive && (
          <View style={[
            styles.activeIndicator,
            { backgroundColor: iconColor }
          ]} />
        )}
        
        {/* Container pour l'icône avec effet de glow si actif */}
        <View style={[
          styles.iconContainer,
          isActive && {
            backgroundColor: `${iconColor}20`,
            shadowColor: iconColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
          }
        ]}>
          <IconComponent 
            size={isActive ? 22 : 20} 
            color={iconColor} 
            strokeWidth={isActive ? 2.5 : 2}
          />
        </View>
        
        {/* Label */}
        <Text style={[
          styles.tabLabel,
          isActive && [styles.tabLabelActive, { color: iconColor }],
        ]}>
          {tab.name}
        </Text>
      </TouchableOpacity>
    );
  };
  
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>
        {/* Contenu principal */}
        <View style={styles.content}>
          {renderActiveScreen()}
        </View>
        
        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <View style={styles.tabBarInner}>
            {TABS.map((tab, index) => renderTabButton(tab, index))}
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  content: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  
  // Tab Bar
  tabBar: {
    backgroundColor: 'rgba(15, 15, 35, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 34, // Safe area pour iPhone
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  tabBarInner: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  
  // Tab Button
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    position: 'relative',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  
  // Indicateur actif
  activeIndicator: {
    position: 'absolute',
    top: -2,
    width: 28,
    height: 3,
    borderRadius: 2,
  },
  
  // Container icône
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  
  // Label
  tabLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  tabLabelActive: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
  },
});
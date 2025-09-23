import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3,
  Target,
  CheckCircle2
} from 'lucide-react-native';
import HapticFeedback from 'react-native-haptic-feedback';

const TAB_ICONS = {
  overview: BarChart3,
  active: Target,
  completed: CheckCircle2,
};

export default function TabSelector({ 
  selectedTab, 
  onTabChange, 
  activeCount, 
  completedCount 
}) {
  const { t } = useTranslation();
  
  // Fonction de feedback haptique
  const triggerHapticFeedback = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger('selection', options);
  };

  // Configuration des onglets
  const tabs = [
    {
      id: 'overview',
      label: t('objectives.tabs.overview'),
      icon: TAB_ICONS.overview,
      count: null,
    },
    {
      id: 'active',
      label: t('objectives.tabs.active'),
      icon: TAB_ICONS.active,
      count: activeCount,
    },
    {
      id: 'completed',
      label: t('objectives.tabs.completed'),
      icon: TAB_ICONS.completed,
      count: completedCount,
    },
  ];

  // Gestion du changement d'onglet
  const handleTabPress = (tabId) => {
    if (tabId !== selectedTab) {
      triggerHapticFeedback();
      onTabChange(tabId);
    }
  };

  // Rendu d'un onglet
  const renderTab = (tab) => {
    const isSelected = selectedTab === tab.id;
    const IconComponent = tab.icon;
    
    return (
      <TouchableOpacity
        key={tab.id}
        style={[
          styles.tab,
          isSelected && styles.selectedTab
        ]}
        onPress={() => handleTabPress(tab.id)}
        activeOpacity={0.7}
      >
        <View style={styles.tabContent}>
          <View style={[
            styles.tabIcon,
            isSelected && styles.selectedTabIcon
          ]}>
            <IconComponent 
              size={18} 
              color={isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'} 
              strokeWidth={2} 
            />
          </View>
          
          <Text style={[
            styles.tabLabel,
            isSelected && styles.selectedTabLabel
          ]}>
            {tab.label}
          </Text>
          
          {tab.count !== null && tab.count > 0 && (
            <View style={[
              styles.tabBadge,
              isSelected && styles.selectedTabBadge
            ]}>
              <Text style={[
                styles.tabBadgeText,
                isSelected && styles.selectedTabBadgeText
              ]}>
                {tab.count}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        style={styles.tabsScrollView}
      >
        {tabs.map(renderTab)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    marginHorizontal: -20, // Déborde du padding de l'écran
  },
  tabsScrollView: {
    flexGrow: 0,
  },
  tabsContainer: {
    paddingHorizontal: 20, // Remet le padding pour le contenu
    gap: 8,
    flexGrow: 1,
    justifyContent: 'space-around', // Répartit équitablement
  },
  
  // Tab
  tab: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flex: 1, // Prend toute la largeur disponible
    maxWidth: 120, // Largeur max pour éviter que ce soit trop large
    marginHorizontal: 4,
  },
  selectedTab: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Tab Icon
  tabIcon: {
    marginRight: 6,
  },
  selectedTabIcon: {
    // Pas de style supplémentaire nécessaire
  },
  
  // Tab Label
  tabLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  selectedTabLabel: {
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  
  // Tab Badge
  tabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  selectedTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectedTabBadgeText: {
    color: '#FFFFFF',
  },
});
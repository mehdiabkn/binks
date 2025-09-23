import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { 
  Filter,
  Grid3X3,
  User, 
  Briefcase, 
  Heart, 
  BookOpen,
  ChevronDown,
  Check
} from 'lucide-react-native';
import HapticFeedback from 'react-native-haptic-feedback';

const CATEGORY_ICONS = {
  all: Grid3X3,
  personal: User,
  professional: Briefcase,
  health: Heart,
  learning: BookOpen,
};

const CATEGORY_COLORS = {
  all: '#8E8E93',
  personal: '#4CD964',
  professional: '#007AFF',
  health: '#FF6B6B',
  learning: '#FF9500',
};

export default function CategoryFilter({ 
  selectedCategory, 
  onCategoryChange, 
  objectives 
}) {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Fonction de feedback haptique
  const triggerHapticFeedback = () => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger('selection', options);
  };

  // Calculer le nombre d'objectifs par catégorie
  const getCategoryCount = (category) => {
    if (category === 'all') {
      return objectives.length;
    }
    return objectives.filter(obj => obj.category === category).length;
  };

  // Configuration des catégories
  const categories = [
    {
      id: 'all',
      label: t('objectives.categories.all'),
      icon: CATEGORY_ICONS.all,
      color: CATEGORY_COLORS.all,
      count: getCategoryCount('all'),
    },
    {
      id: 'personal',
      label: t('objectives.categories.personal'),
      icon: CATEGORY_ICONS.personal,
      color: CATEGORY_COLORS.personal,
      count: getCategoryCount('personal'),
    },
    {
      id: 'professional',
      label: t('objectives.categories.professional'),
      icon: CATEGORY_ICONS.professional,
      color: CATEGORY_COLORS.professional,
      count: getCategoryCount('professional'),
    },
    {
      id: 'health',
      label: t('objectives.categories.health'),
      icon: CATEGORY_ICONS.health,
      color: CATEGORY_COLORS.health,
      count: getCategoryCount('health'),
    },
    {
      id: 'learning',
      label: t('objectives.categories.learning'),
      icon: CATEGORY_ICONS.learning,
      color: CATEGORY_COLORS.learning,
      count: getCategoryCount('learning'),
    },
  ];

  // Récupérer la catégorie sélectionnée
  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  // Gestion de l'ouverture/fermeture du dropdown
  const handleToggleDropdown = () => {
    triggerHapticFeedback();
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Gestion du changement de catégorie
  const handleCategorySelect = (categoryId) => {
    triggerHapticFeedback();
    onCategoryChange(categoryId);
    setIsDropdownOpen(false);
  };

  // Rendu d'une option de catégorie
  const renderCategoryOption = (category) => {
    const isSelected = selectedCategory === category.id;
    const IconComponent = category.icon;
    
    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.dropdownItem,
          isSelected && styles.selectedDropdownItem
        ]}
        onPress={() => handleCategorySelect(category.id)}
        activeOpacity={0.7}
      >
        <View style={styles.dropdownItemLeft}>
          <View style={[styles.dropdownIcon, { backgroundColor: category.color }]}>
            <IconComponent size={14} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text style={[styles.dropdownLabel, isSelected && styles.selectedDropdownLabel]}>
            {category.label}
          </Text>
        </View>
        
        <View style={styles.dropdownItemRight}>
          <Text style={[styles.dropdownCount, { color: category.color }]}>
            {category.count}
          </Text>
          {isSelected && (
            <Check size={16} color="#4CD964" strokeWidth={2} style={styles.checkIcon} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Bouton filtre */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={handleToggleDropdown}
        activeOpacity={0.7}
      >
        <View style={styles.filterButtonContent}>
          <Filter size={16} color="rgba(255, 255, 255, 0.7)" strokeWidth={2} />
          <Text style={styles.filterButtonText}>
            {selectedCategoryData?.label || t('objectives.filter.defaultLabel')}
          </Text>
          <ChevronDown 
            size={14} 
            color="rgba(255, 255, 255, 0.5)" 
            strokeWidth={2}
            style={[
              styles.chevronIcon,
              { transform: [{ rotate: isDropdownOpen ? '180deg' : '0deg' }] }
            ]}
          />
        </View>
      </TouchableOpacity>

      {/* Modal dropdown */}
      <Modal
        visible={isDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setIsDropdownOpen(false)}
        >
          <View style={styles.dropdown}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>
                {t('objectives.filter.title')}
              </Text>
            </View>
            
            {categories.map(renderCategoryOption)}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  
  // Bouton filtre
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'flex-start',
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 6,
    marginRight: 4,
  },
  chevronIcon: {
    marginLeft: 2,
  },
  
  // Modal et dropdown
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dropdown: {
    backgroundColor: '#1C1C2E',
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 250,
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  
  // Items du dropdown
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedDropdownItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dropdownLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  selectedDropdownLabel: {
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  dropdownCount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    marginRight: 8,
  },
  checkIcon: {
    marginLeft: 4,
  },
});
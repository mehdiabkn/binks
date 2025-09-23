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
  Target, 
  User, 
  Briefcase, 
  Heart, 
  BookOpen,
  Filter
} from 'lucide-react-native';
import HapticFeedback from 'react-native-haptic-feedback';

const CATEGORIES = [
  {
    id: 'all',
    icon: Filter,
    color: '#FFFFFF',
  },
  {
    id: 'personal',
    icon: User,
    color: '#4CD964',
  },
  {
    id: 'professional',
    icon: Briefcase,
    color: '#007AFF',
  },
  {
    id: 'health',
    icon: Heart,
    color: '#FF6B6B',
  },
  {
    id: 'learning',
    icon: BookOpen,
    color: '#FF9500',
  },
];

export default function CategorySelector({ 
  selectedCategory, 
  onCategoryChange, 
  objectives 
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

  // Compter les objectifs par catégorie
  const getCategoryCount = (categoryId) => {
    if (categoryId === 'all') {
      return objectives.length;
    }
    return objectives.filter(obj => obj.category === categoryId).length;
  };

  // Compter les objectifs complétés par catégorie
  const getCompletedCount = (categoryId) => {
    if (categoryId === 'all') {
      return objectives.filter(obj => obj.completed).length;
    }
    return objectives.filter(obj => obj.category === categoryId && obj.completed).length;
  };

  // Gestion du changement de catégorie
  const handleCategoryPress = (categoryId) => {
    if (categoryId === selectedCategory) return;
    
    triggerHapticFeedback();
    onCategoryChange(categoryId);
    console.log('📂 Catégorie changée vers:', categoryId);
  };

  // Rendu d'un bouton de catégorie
  const renderCategoryButton = (category) => {
    const isSelected = category.id === selectedCategory;
    const IconComponent = category.icon;
    const totalCount = getCategoryCount(category.id);
    const completedCount = getCompletedCount(category.id);
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.categoryButton,
          isSelected && [
            styles.categoryButtonSelected,
            { backgroundColor: `${category.color}20`, borderColor: category.color }
          ],
        ]}
        onPress={() => handleCategoryPress(category.id)}
        activeOpacity={0.7}
      >
        {/* Container icône */}
        <View style={[
          styles.iconContainer,
          isSelected && {
            backgroundColor: category.color,
            shadowColor: category.color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
          }
        ]}>
          <IconComponent 
            size={isSelected ? 20 : 18} 
            color={isSelected ? '#FFFFFF' : category.color} 
            strokeWidth={2}
          />
        </View>

        {/* Labels et statistiques */}
        <View style={styles.labelContainer}>
          <Text style={[
            styles.categoryLabel,
            isSelected && [styles.categoryLabelSelected, { color: category.color }],
          ]}>
            {t(`objectives.categories.${category.id}`)}
          </Text>
          
          {/* Compteur d'objectifs */}
          <View style={styles.countContainer}>
            <Text style={[
              styles.countText,
              isSelected && { color: 'rgba(255, 255, 255, 0.9)' },
            ]}>
              {completedCount}/{totalCount}
            </Text>
            
            {/* Barre de progression mini */}
            {totalCount > 0 && (
              <View style={styles.miniProgressContainer}>
                <View style={styles.miniProgressBackground}>
                  <View 
                    style={[
                      styles.miniProgressFill, 
                      { 
                        width: `${completionRate}%`,
                        backgroundColor: isSelected ? category.color : 'rgba(255, 255, 255, 0.3)'
                      }
                    ]} 
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Indicateur de sélection */}
        {isSelected && (
          <View style={[
            styles.selectionIndicator,
            { backgroundColor: category.color }
          ]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Titre de section */}
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>
          {t('objectives.categorySelector.title')}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {t('objectives.categorySelector.subtitle')}
        </Text>
      </View>

      {/* Boutons de catégorie */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map(category => renderCategoryButton(category))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  
  // Header de section
  headerContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  
  // Container des catégories
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesContent: {
    paddingRight: 20,
    gap: 12,
  },
  
  // Bouton de catégorie
  categoryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    position: 'relative',
    minWidth: 120,
    minHeight: 100,
    justifyContent: 'center',
  },
  categoryButtonSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  
  // Container icône
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  
  // Labels et compteurs
  labelContainer: {
    alignItems: 'center',
    flex: 1,
  },
  categoryLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
    textAlign: 'center',
  },
  categoryLabelSelected: {
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  countContainer: {
    alignItems: 'center',
    width: '100%',
  },
  countText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  
  // Mini barre de progression
  miniProgressContainer: {
    width: '100%',
  },
  miniProgressBackground: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  
  // Indicateur de sélection
  selectionIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
});
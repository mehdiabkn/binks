import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { 
  Target, 
  Zap, 
  Flame, 
  Star, 
  Trophy,
  TrendingUp,
  CheckCircle2 
} from 'lucide-react-native';

export default function OverviewCards({ 
  mitCompletionRate, 
  metCompletionRate, 
  streakDays, 
  productivityScore, 
  achievements 
}) {
  const { t } = useTranslation();

  // Configuration des cartes avec leurs données
  const cards = [
    {
      id: 'mit',
      title: t('statistics.overview.mit.title'),
      value: `${mitCompletionRate}%`,
      icon: Target,
      color: '#007AFF',
      backgroundColor: 'rgba(0, 122, 255, 0.15)',
      description: t('statistics.overview.mit.description'),
      trend: mitCompletionRate >= 70 ? 'up' : mitCompletionRate >= 50 ? 'stable' : 'down',
    },
    {
      id: 'met',
      title: t('statistics.overview.met.title'),
      value: `${metCompletionRate}%`,
      icon: Zap,
      color: '#FF9500',
      backgroundColor: 'rgba(255, 149, 0, 0.15)',
      description: t('statistics.overview.met.description'),
      trend: metCompletionRate >= 60 ? 'up' : metCompletionRate >= 40 ? 'stable' : 'down',
    },
    {
      id: 'streak',
      title: t('statistics.overview.streak.title'),
      value: `${streakDays}`,
      unit: streakDays > 1 ? t('statistics.overview.streak.days') : t('statistics.overview.streak.day'),
      icon: Flame,
      color: '#FF6B6B',
      backgroundColor: 'rgba(255, 107, 107, 0.15)',
      description: t('statistics.overview.streak.description'),
      trend: streakDays >= 7 ? 'up' : streakDays >= 3 ? 'stable' : 'down',
    },
    {
      id: 'productivity',
      title: t('statistics.overview.productivity.title'),
      value: `${productivityScore}`,
      unit: '/100',
      icon: Star,
      color: '#4CD964',
      backgroundColor: 'rgba(76, 217, 100, 0.15)',
      description: t('statistics.overview.productivity.description'),
      trend: productivityScore >= 80 ? 'up' : productivityScore >= 60 ? 'stable' : 'down',
    },
    {
      id: 'achievements',
      title: t('statistics.overview.achievements.title'),
      value: `${achievements}`,
      icon: Trophy,
      color: '#FFD700',
      backgroundColor: 'rgba(255, 215, 0, 0.15)',
      description: t('statistics.overview.achievements.description'),
      trend: achievements >= 5 ? 'up' : achievements >= 2 ? 'stable' : 'down',
    },
  ];

  // Obtenir l'icône de tendance
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={12} color="#4CD964" strokeWidth={2} />;
      case 'stable':
        return <CheckCircle2 size={12} color="#FFD700" strokeWidth={2} />;
      case 'down':
        return <TrendingUp size={12} color="#FF6B6B" strokeWidth={2} style={{ transform: [{ rotate: '180deg' }] }} />;
      default:
        return null;
    }
  };

  // Rendu d'une carte
  const renderCard = (card, index) => {
    const IconComponent = card.icon;
    const isLargeCard = index === 0 || index === 1; // MIT et MET en grand
    
    return (
      <TouchableOpacity
        key={card.id}
        style={[
          styles.card,
          isLargeCard ? styles.largeCard : styles.smallCard,
          { backgroundColor: card.backgroundColor, borderColor: `${card.color}30` }
        ]}
        activeOpacity={0.8}
      >
        {/* Header de la carte */}
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: card.color }]}>
            <IconComponent size={isLargeCard ? 20 : 18} color="#FFFFFF" strokeWidth={2} />
          </View>
          
          <View style={styles.trendContainer}>
            {getTrendIcon(card.trend)}
          </View>
        </View>

        {/* Contenu principal */}
        <View style={styles.cardContent}>
          <View style={styles.valueContainer}>
            <Text style={[styles.cardValue, isLargeCard && styles.largeCardValue]}>
              {card.value}
            </Text>
            {card.unit && (
              <Text style={[styles.cardUnit, { color: card.color }]}>
                {card.unit}
              </Text>
            )}
          </View>
          
          <Text style={[styles.cardTitle, isLargeCard && styles.largeCardTitle]}>
            {card.title}
          </Text>
          <Text style={styles.cardDescription}>
            {card.description}
          </Text>
        </View>

        {/* Barre de progression pour les pourcentages */}
        {(card.id === 'mit' || card.id === 'met') && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${card.id === 'mit' ? mitCompletionRate : metCompletionRate}%`,
                    backgroundColor: card.color 
                  }
                ]} 
              />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Titre de section */}
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>{t('statistics.overview.title')}</Text>
        <Text style={styles.sectionSubtitle}>{t('statistics.overview.subtitle')}</Text>
      </View>

      {/* Grille des cartes */}
      <View style={styles.cardsGrid}>
        {/* Première ligne - MIT et MET (grandes cartes) */}
        <View style={styles.row}>
          {cards.slice(0, 2).map((card, index) => renderCard(card, index))}
        </View>
        
        {/* Deuxième ligne - Streak, Productivité, Accomplissements (petites cartes) */}
        <View style={styles.row}>
          {cards.slice(2, 5).map((card, index) => renderCard(card, index + 2))}
        </View>
      </View>
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
  
  // Grille des cartes
  cardsGrid: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  
  // Styles des cartes
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  largeCard: {
    flex: 1,
    minHeight: 120,
  },
  smallCard: {
    flex: 1,
    minHeight: 100,
  },
  
  // Header de carte
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  trendContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Contenu de carte
  cardContent: {
    flex: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  cardValue: {
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 24,
    color: '#FFFFFF',
  },
  largeCardValue: {
    fontSize: 28,
  },
  cardUnit: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    marginLeft: 4,
    opacity: 0.8,
  },
  cardTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  largeCardTitle: {
    fontSize: 14,
  },
  cardDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  
  // Barre de progression
  progressContainer: {
    marginTop: 12,
  },
  progressBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
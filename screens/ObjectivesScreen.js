import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { CheckCircle } from 'lucide-react-native';
import HapticFeedback from 'react-native-haptic-feedback';

// ✅ NOUVEAU: Import du service Supabase
import { ObjectivesService } from '../services/objectivesService';

import ObjectivesHeader from '../components/Objectives/ObjectivesHeader';
import CategoryFilter from '../components/Objectives/CategoryFilter';
import TabSelector from '../components/Objectives/TabSelector';
import ObjectivesList from '../components/Objectives/ObjectivesList';
import CompletedObjectivesList from '../components/Objectives/CompletedObjectivesList';
import ProgressSummary from '../components/Objectives/ProgressSummary';
import AddObjectiveModal from '../components/Modals/AddObjectiveModal';
import CelebrationModal from '../components/Modals/CelebrationModal';

export default function ObjectivesScreen({ userProfile, onNavigateToJournal }) {
  const { t } = useTranslation();
  
  // ✅ NOUVEAU: États pour les données Supabase
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // État principal
  const [selectedCategory, setSelectedCategory] = useState('all'); // all, personal, professional, health, learning
  const [selectedTab, setSelectedTab] = useState('overview'); // overview, active, completed
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedObjectiveId, setCompletedObjectiveId] = useState(null);
  
  // État pour la confirmation d'ajout
  const [showAddConfirmation, setShowAddConfirmation] = useState(false);
  const [addedObjectiveTitle, setAddedObjectiveTitle] = useState('');
  
  // ✅ NOUVEAU: États pour les vraies données depuis Supabase
  const [objectives, setObjectives] = useState([]);
  const [objectivesStats, setObjectivesStats] = useState(null);
  
  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Animation pour la confirmation d'ajout
  const confirmationOpacity = useRef(new Animated.Value(0)).current;
  const confirmationScale = useRef(new Animated.Value(0.8)).current;
  const confirmationTranslateY = useRef(new Animated.Value(-20)).current;

  // ✅ NOUVEAU: Charger les données au montage
  useEffect(() => {
    if (userProfile?.supabaseId) {
      loadObjectivesData();
    } else {
      setError(t('objectives.errors.userNotFound'));
      setIsLoading(false);
    }
  }, [userProfile?.supabaseId]);

  // ✅ NOUVEAU: Fonction principale pour charger toutes les données
  const loadObjectivesData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🎯 Chargement données objectifs...', { userId: userProfile.supabaseId });

      // Charger en parallèle : objectifs et statistiques
      const [objectivesResult, statsResult] = await Promise.all([
        ObjectivesService.getUserObjectives(userProfile.supabaseId),
        ObjectivesService.getObjectivesStats(userProfile.supabaseId)
      ]);

      if (objectivesResult.success) {
        setObjectives(objectivesResult.objectives);
        console.log('✅ Objectifs chargés:', objectivesResult.objectives.length);
      } else {
        throw new Error(objectivesResult.error || 'Erreur chargement objectifs');
      }

      if (statsResult.success) {
        setObjectivesStats(statsResult.stats);
        console.log('✅ Stats objectifs chargées:', statsResult.stats);
      } else {
        console.warn('⚠️ Erreur stats objectifs:', statsResult.error);
        // Les stats ne sont pas critiques, on continue sans
      }

    } catch (error) {
      console.error('❌ Erreur chargement objectifs:', error);
      setError(t('objectives.errors.loadingError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Animation d'entrée
  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading]);

  // Animation de confirmation d'ajout
  useEffect(() => {
    if (showAddConfirmation) {
      Animated.parallel([
        Animated.spring(confirmationOpacity, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(confirmationScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(confirmationTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();

      // Auto-hide après 3 secondes
      const timer = setTimeout(() => {
        hideAddConfirmation();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showAddConfirmation]);

  const hideAddConfirmation = () => {
    Animated.parallel([
      Animated.timing(confirmationOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(confirmationScale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(confirmationTranslateY, {
        toValue: -20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowAddConfirmation(false);
      // Reset pour la prochaine fois
      confirmationOpacity.setValue(0);
      confirmationScale.setValue(0.8);
      confirmationTranslateY.setValue(-20);
    });
  };

  // Fonction de feedback haptique
  const triggerHapticFeedback = (type = 'success') => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
      ignoreIOSSystemSettings: false
    };
    HapticFeedback.trigger(type, options);
  };

  // Séparation des objectifs actifs et terminés avec filtrage par catégorie
  const getActiveObjectives = () => {
    const active = objectives.filter(obj => !obj.completed);
    if (selectedCategory === 'all') {
      return active;
    }
    return active.filter(obj => obj.category === selectedCategory);
  };

  const getCompletedObjectives = () => {
    const completed = objectives.filter(obj => obj.completed);
    if (selectedCategory === 'all') {
      return completed;
    }
    return completed.filter(obj => obj.category === selectedCategory);
  };

  // ✅ NOUVEAU: Gestion de l'ajout d'objectif avec Supabase
  const handleAddObjective = async (newObjective) => {
    if (!userProfile?.supabaseId) return;

    try {
      console.log('➕ Ajout nouvel objectif...', newObjective);

      const result = await ObjectivesService.createObjective(userProfile.supabaseId, newObjective);
      
      if (result.success) {
        // Ajouter à la liste locale
        setObjectives(prev => [result.objective, ...prev]);
        setShowAddModal(false);
        
        // Haptic feedback de succès
        triggerHapticFeedback('notificationSuccess');
        
        // Afficher la confirmation
        setAddedObjectiveTitle(result.objective.title);
        setShowAddConfirmation(true);
        
        // Recharger les stats
        const statsResult = await ObjectivesService.getObjectivesStats(userProfile.supabaseId);
        if (statsResult.success) {
          setObjectivesStats(statsResult.stats);
        }

        console.log('✅ Nouvel objectif ajouté:', result.objective.title);
      } else {
        Alert.alert(t('common.error'), result.error || t('objectives.errors.createError'));
      }
    } catch (error) {
      console.error('❌ Erreur ajout objectif:', error);
      Alert.alert(t('common.error'), t('objectives.errors.createError'));
    }
  };

  // ✅ NOUVEAU: Gestion de la mise à jour de progression avec Supabase
  const handleUpdateProgress = async (objectiveId, newValue, milestone = null) => {
    if (!userProfile?.supabaseId) return;

    try {
      console.log('📈 Mise à jour progression...', { objectiveId, newValue });

      const result = await ObjectivesService.updateObjectiveProgress(
        userProfile.supabaseId, 
        objectiveId, 
        newValue
      );
      
      if (result.success) {
        // Mettre à jour la liste locale
        setObjectives(prev => prev.map(obj => 
          obj.id === objectiveId ? result.objective : obj
        ));

        // Si l'objectif vient d'être complété, déclencher la célébration
        if (result.wasCompleted) {
          setCompletedObjectiveId(objectiveId);
          setShowCelebration(true);
          triggerHapticFeedback('notificationSuccess');
          console.log('🎉 Objectif complété:', result.objective.title);
        }

        // Recharger les stats
        const statsResult = await ObjectivesService.getObjectivesStats(userProfile.supabaseId);
        if (statsResult.success) {
          setObjectivesStats(statsResult.stats);
        }

      } else {
        Alert.alert(t('common.error'), result.error || t('objectives.errors.updateError'));
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour progression:', error);
      Alert.alert(t('common.error'), t('objectives.errors.updateError'));
    }
  };

  // ✅ NOUVEAU: Gestion de la completion d'objectif simple avec Supabase
  const handleCompleteSimpleObjective = async (objectiveId) => {
    if (!userProfile?.supabaseId) return;

    try {
      console.log('✅ Completion objectif simple...', { objectiveId });

      const result = await ObjectivesService.completeSimpleObjective(
        userProfile.supabaseId, 
        objectiveId
      );
      
      if (result.success) {
        // Mettre à jour la liste locale
        setObjectives(prev => prev.map(obj => 
          obj.id === objectiveId ? result.objective : obj
        ));

        // Déclencher la célébration
        if (result.wasCompleted) {
          setCompletedObjectiveId(objectiveId);
          setShowCelebration(true);
          triggerHapticFeedback('notificationSuccess');
          console.log('🎉 Objectif simple complété:', result.objective.title);
        }

        // Recharger les stats
        const statsResult = await ObjectivesService.getObjectivesStats(userProfile.supabaseId);
        if (statsResult.success) {
          setObjectivesStats(statsResult.stats);
        }

      } else {
        Alert.alert(t('common.error'), result.error || t('objectives.errors.completeError'));
      }
    } catch (error) {
      console.error('❌ Erreur completion objectif simple:', error);
      Alert.alert(t('common.error'), t('objectives.errors.completeError'));
    }
  };

  // ✅ NOUVEAU: Gestion de la suppression d'objectif avec Supabase
  const handleDeleteObjective = async (objectiveId) => {
    if (!userProfile?.supabaseId) return;

    const objective = objectives.find(obj => obj.id === objectiveId);
    if (!objective) return;

    try {
      Alert.alert(
        t('objectives.delete.title'),
        t('objectives.delete.message', { title: objective.title }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              const result = await ObjectivesService.deleteObjective(
                userProfile.supabaseId, 
                objectiveId
              );
              
              if (result.success) {
                // Supprimer de la liste locale
                setObjectives(prev => prev.filter(obj => obj.id !== objectiveId));
                
                // Recharger les stats
                const statsResult = await ObjectivesService.getObjectivesStats(userProfile.supabaseId);
                if (statsResult.success) {
                  setObjectivesStats(statsResult.stats);
                }

                console.log('🗑️ Objectif supprimé:', objective.title);
              } else {
                Alert.alert(t('common.error'), result.error || t('objectives.errors.deleteError'));
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Erreur suppression objectif:', error);
      Alert.alert(t('common.error'), t('objectives.errors.deleteError'));
    }
  };

  // ✅ NOUVEAU: Fonction pour rafraîchir les données
  const handleRefresh = async () => {
    await loadObjectivesData();
  };

  // Gestion de la célébration
  const handleCelebrationClose = () => {
    setShowCelebration(false);
    setCompletedObjectiveId(null);
  };

  // Navigation vers Journal après célébration
  const handleNavigateToJournalFromCelebration = () => {
    setShowCelebration(false);
    setCompletedObjectiveId(null);
    
    if (onNavigateToJournal) {
      onNavigateToJournal();
    }
  };

  // Gestion du changement d'onglet
  const handleTabChange = (tabId) => {
    setSelectedTab(tabId);
  };

  // ✅ NOUVEAU: Calculs de statistiques avec données réelles ou fallback
  const totalObjectives = objectives.length;
  const completedObjectives = objectives.filter(obj => obj.completed).length;
  const activeObjectives = objectives.filter(obj => !obj.completed).length;
  const completionRate = totalObjectives > 0 ? Math.round((completedObjectives / totalObjectives) * 100) : 0;

  // Listes filtrées
  const activeObjectivesList = getActiveObjectives();
  const completedObjectivesList = getCompletedObjectives();
  
  // Données pour les composants
  const firstName = userProfile?.firstName || t('objectives.header.defaultName', 'Champion');
  const completedObjective = objectives.find(obj => obj.id === completedObjectiveId);

  // Rendu du contenu selon l'onglet sélectionné
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return (
          <>
            {/* Résumé de progression */}
            <ProgressSummary
              objectives={objectives}
              onAddObjective={() => setShowAddModal(true)}
            />
          </>
        );
      
      case 'active':
        return (
          <>
            {/* Filtre de catégorie */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              objectives={objectives}
            />
            
            {/* Liste des objectifs actifs */}
            <ObjectivesList
              objectives={activeObjectivesList}
              onUpdateProgress={handleUpdateProgress}
              onCompleteSimple={handleCompleteSimpleObjective} // ✅ NOUVEAU: Fonction pour objectifs simples
              onDeleteObjective={handleDeleteObjective}
              selectedCategory={selectedCategory}
            />
          </>
        );
      
      case 'completed':
        return (
          <>
            {/* Filtre de catégorie */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              objectives={objectives}
            />
            
            {/* Liste des objectifs terminés (toujours expanded) */}
            <CompletedObjectivesList
              completedObjectives={completedObjectivesList}
              onDeleteObjective={handleDeleteObjective}
              isExpanded={true}
              onToggleExpanded={() => {}} // Pas de toggle dans cet onglet
            />
          </>
        );
      
      default:
        return null;
    }
  };

  // ✅ AFFICHAGE DE LOADING
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>{t('objectives.loading')}</Text>
      </View>
    );
  }

  // ✅ AFFICHAGE D'ERREUR
  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text style={styles.errorTitle}>😞</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>{t('objectives.error.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
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
      <ObjectivesHeader 
        firstName={firstName}
        completionRate={completionRate}
        totalObjectives={totalObjectives}
        completedObjectives={completedObjectives}
      />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Sélecteur d'onglets */}
        <TabSelector
          selectedTab={selectedTab}
          onTabChange={handleTabChange}
          activeCount={activeObjectives}
          completedCount={completedObjectives}
        />

        {/* Contenu selon l'onglet sélectionné */}
        {renderTabContent()}
      </ScrollView>

      {/* Confirmation d'ajout d'objectif */}
      {showAddConfirmation && (
        <Animated.View 
          style={[
            styles.addConfirmationContainer,
            {
              opacity: confirmationOpacity,
              transform: [
                { scale: confirmationScale },
                { translateY: confirmationTranslateY }
              ],
            }
          ]}
        >
          <View style={styles.addConfirmationContent}>
            <CheckCircle size={24} color="#4CD964" strokeWidth={2} />
            <View style={styles.addConfirmationTextContainer}>
              <Text style={styles.addConfirmationTitle}>
                {t('objectives.confirmations.created')}
              </Text>
              <Text style={styles.addConfirmationSubtitle} numberOfLines={2}>
                "{addedObjectiveTitle}"
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Modal d'ajout d'objectif */}
      <AddObjectiveModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddObjective}
      />

      {/* Modal de célébration */}
      <CelebrationModal
        visible={showCelebration}
        objective={completedObjective}
        onClose={handleCelebrationClose}
        onNavigateToJournal={handleNavigateToJournalFromCelebration}
        userProfile={userProfile}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  
  // ✅ STYLES POUR LOADING ET ERREUR
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  errorTitle: {
    fontSize: 48,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#000000',
  },
  
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  
  // Confirmation d'ajout
  addConfirmationContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  addConfirmationContent: {
    backgroundColor: 'rgba(15, 15, 35, 0.95)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CD964',
    shadowColor: '#4CD964',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addConfirmationTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  addConfirmationTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#4CD964',
    marginBottom: 2,
  },
  addConfirmationSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
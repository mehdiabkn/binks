import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';

// ✅ Import des services Supabase
import { TaskService } from '../services/taskService';
import { DailyService } from '../services/dailyService';
import { supabase } from '../services/supabase';

// Import des composants modulaires (conservés)
import FutureHeader from '../components/Future/FutureHeader';
import FutureCalendar from '../components/Future/FutureCalendar';
import TabNavigation from '../components/Future/TabNavigation';
import MITTab from '../components/Future/MITTabs';
import METTab from '../components/Future/METTabs';
import TaskSuccessAnimation from '../components/Future/TaskSuccessAnimation';
import WidgetManager from '../components/Widgets/WidgetManager';

const { height } = Dimensions.get('window');

export default function JournalScreen({ userProfile }) {
  const { t } = useTranslation();
  
  // ✅ États pour les données Supabase
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // État principal (conservé)
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('MIT'); // MIT ou MET
  const [calendarView, setCalendarView] = useState('week'); // week, month
  
  // État pour l'animation de succès (conservé)
  const [successAnimation, setSuccessAnimation] = useState({
    visible: false,
    taskText: '',
    type: 'MIT',
    isSuccess: true
  });
  
  // ✅ États pour les données réelles depuis Supabase
  const [activeMITs, setActiveMITs] = useState([]);
  const [activeMETs, setActiveMETs] = useState([]);
  const [dailyAchievements, setDailyAchievements] = useState({});
  const [mitCompletions, setMitCompletions] = useState({});
  const [metChecks, setMetChecks] = useState({});
  const [calendarData, setCalendarData] = useState({});
  
  // Animation (conservée)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // ✅ Fonction helper pour parser intelligemment les textes de tâches
  const parseTaskText = (taskText) => {
    if (typeof taskText === 'string') {
      try {
        // Essayer de parser si c'est du JSON de l'onboarding
        const parsed = JSON.parse(taskText);
        
        // Si c'est un array (depuis l'onboarding), prendre le premier élément
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].text || taskText;
        }
        
        // Si c'est un objet simple
        return parsed.text || taskText;
      } catch {
        // Si ce n'est pas du JSON, retourner tel quel
        return taskText;
      }
    }
    // Si c'est déjà un objet
    return taskText?.text || taskText || '';
  };

  // ✅ Fonction helper pour extraire la catégorie des tâches d'onboarding
  const parseTaskCategory = (taskText) => {
    if (typeof taskText === 'string') {
      try {
        const parsed = JSON.parse(taskText);
        
        // Si c'est un array (depuis l'onboarding), prendre le premier élément
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].category || null;
        }
        
        // Si c'est un objet simple
        return parsed.category || null;
      } catch {
        return null;
      }
    }
    return taskText?.category || null;
  };

  // ✅ CORRIGÉ URGENT: Fonction pour vérifier si une tâche doit être affichée pour une date donnée
  // CORRECTION DANS ./screens/JournalScreen.js

// ✅ REMPLACER la fonction shouldShowTaskForDate par ceci :
const shouldShowTaskForDate = (task, targetDate) => {
  const taskStartDate = new Date(task.start_date || task.created_at);
  const taskEndDate = task.end_date ? new Date(task.end_date) : null;
  const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const taskStartDateOnly = new Date(taskStartDate.getFullYear(), taskStartDate.getMonth(), taskStartDate.getDate());
  const taskEndDateOnly = taskEndDate ? new Date(taskEndDate.getFullYear(), taskEndDate.getMonth(), taskEndDate.getDate()) : null;

  console.log(`🔧 shouldShowTaskForDate: "${parseTaskText(task.text)}" | recurring: ${task.is_recurring} | start: ${taskStartDateOnly.toISOString().split('T')[0]} | end: ${taskEndDateOnly?.toISOString().split('T')[0] || 'null'} | target: ${targetDateOnly.toISOString().split('T')[0]}`);
  
  // 1. Si la date cible est avant la date de création, ne jamais afficher
  if (targetDateOnly < taskStartDateOnly) {
    console.log('❌ Date cible avant création');
    return false;
  }

  // 2. ✅ NOUVEAU: Si la tâche a une end_date ET n'est pas récurrente
  // C'est probablement une tâche générée par GitHub Action
  if (!task.is_recurring && taskEndDateOnly) {
    const show = targetDateOnly >= taskStartDateOnly && targetDateOnly <= taskEndDateOnly;
    console.log(`✅ Tâche générée (start=end): ${show ? 'AFFICHER' : 'MASQUER'}`);
    return show;
  }

  // 3. Si la tâche n'est PAS récurrente et pas de end_date - afficher SEULEMENT le jour de création
  if (!task.is_recurring && !taskEndDateOnly) {
    const show = targetDateOnly.getTime() === taskStartDateOnly.getTime();
    console.log(`📅 Tâche ponctuelle: ${show ? 'AFFICHER' : 'MASQUER'}`);
    return show;
  }

  // 4. Si la tâche EST récurrente - afficher TOUS les jours à partir de la création jusqu'à end_date
  if (task.is_recurring) {
    let show = targetDateOnly >= taskStartDateOnly;
    
    // Vérifier la date de fin si elle existe
    if (taskEndDateOnly) {
      show = show && targetDateOnly <= taskEndDateOnly;
    }
    
    console.log(`🔄 Tâche récurrente: ${show ? 'AFFICHER' : 'MASQUER'}`);
    return show;
  }

  console.log('❓ Cas non géré, masquer par défaut');
  return false;
};

  // ✅ Charger les données au montage et quand la date change
  useEffect(() => {
    if (userProfile?.supabaseId) {
      loadJournalData();
    } else {
      setError(t('future.journal.errors.userNotFound'));
      setIsLoading(false);
    }
  }, [userProfile?.supabaseId, t]);

  // ✅ Recharger les données quand la date sélectionnée change
  useEffect(() => {
    if (userProfile?.supabaseId && !isLoading) {
      loadDateSpecificData(selectedDate);
    }
  }, [selectedDate, userProfile?.supabaseId]);

  // ✅ Fonction principale pour charger toutes les données du journal
  const loadJournalData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Chargement données journal...', { userId: userProfile.supabaseId });

      // Charger en parallèle : MIT actives, MET actives, données du calendrier
      const [mitsResult, metsResult] = await Promise.all([
        TaskService.getActiveMITs(userProfile.supabaseId),
        TaskService.getActiveMETs(userProfile.supabaseId)
      ]);

      // Traiter les MIT
      if (mitsResult.success) {
        setActiveMITs(mitsResult.mits || []);
        console.log('MIT actives chargées:', mitsResult.mits?.length || 0);
        console.log('MIT avec récurrence:', mitsResult.mits?.filter(m => m.is_recurring).length || 0);
      }

      // Traiter les MET
      if (metsResult.success) {
        setActiveMETs(metsResult.mets || []);
        console.log('MET actives chargées:', metsResult.mets?.length || 0);
        console.log('MET avec récurrence:', metsResult.mets?.filter(m => m.is_recurring).length || 0);
      }

      // Charger les données pour la date sélectionnée
      await loadDateSpecificData(selectedDate);

      // Charger les données du calendrier (historique)
      await loadCalendarData();

    } catch (error) {
      console.error('Erreur chargement journal:', error);
      setError(t('future.journal.errors.loadingData'));
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ CORRIGÉ URGENT: Charger les données spécifiques à une date
  const loadDateSpecificData = async (date) => {
    if (!userProfile?.supabaseId) return;

    try {
      const dateKey = getDateKey(date);
      console.log('CHARGEMENT DONNÉES POUR DATE:', dateKey);

      // ✅ FORCER le rechargement des completions MIT pour LA DATE SÉLECTIONNÉE
      console.log('Recherche MIT completions pour:', dateKey);
      const { data: mitCompletionsData, error: mitError } = await supabase
        .from('mit_completions')
        .select('mit_id')
        .eq('user_id', userProfile.supabaseId)
        .eq('date', dateKey);

      if (mitError) {
        console.error('Erreur MIT completions:', mitError);
      } else {
        const completedMitIds = mitCompletionsData?.map(c => c.mit_id) || [];
        console.log(`MIT completions trouvées pour ${dateKey}:`, completedMitIds);
        
        // ✅ FORCER la mise à jour de l'état
        setMitCompletions(prev => {
          const newState = { ...prev, [dateKey]: completedMitIds };
          console.log('Nouvel état MIT completions:', newState);
          return newState;
        });
      }

      // ✅ FORCER le rechargement des checks MET pour LA DATE SÉLECTIONNÉE
      console.log('Recherche MET checks pour:', dateKey);
      const { data: metChecksData, error: metError } = await supabase
        .from('met_checks')
        .select('met_id')
        .eq('user_id', userProfile.supabaseId)
        .eq('date', dateKey);

      if (metError) {
        console.error('Erreur MET checks:', metError);
      } else {
        const checkedMetIds = metChecksData?.map(c => c.met_id) || [];
        console.log(`MET checks trouvées pour ${dateKey}:`, checkedMetIds);
        
        // ✅ FORCER la mise à jour de l'état
        setMetChecks(prev => {
          const newState = { ...prev, [dateKey]: checkedMetIds };
          console.log('Nouvel état MET checks:', newState);
          return newState;
        });
      }

      // ✅ Charger l'achievement SEULEMENT si c'est aujourd'hui
      const today = getDateKey(new Date());
      if (dateKey === today) {
        const achievementResult = await DailyService.getTodayAchievement(userProfile.supabaseId);
        if (achievementResult.success && achievementResult.achievement) {
          setDailyAchievements(prev => ({
            ...prev,
            [dateKey]: achievementResult.achievement.achievement_text
          }));
        }
      }

    } catch (error) {
      console.error('Erreur chargement données date:', error);
    }
  };

  // ✅ Charger les données du calendrier pour afficher les indicateurs
  const loadCalendarData = async () => {
    if (!userProfile?.supabaseId) return;

    try {
      console.log('Chargement données calendrier...');
      
      // Charger les 30 derniers jours de données depuis daily_scores (rapide et fiable)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const { data: scores, error } = await supabase
        .from('daily_scores')
        .select('date, mits_completed, total_mits, mets_avoided, total_mets')
        .eq('user_id', userProfile.supabaseId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (error) throw error;

      // ✅ Convertir en format pour le calendrier
      const calendarDataFormatted = {};
      scores?.forEach(day => {
        // Calculer le taux de completion MIT (prioritaire)
        let completionRate = 0;
        let hasActivity = false;
        
        if (day.total_mits > 0) {
          // Si on a des MIT, utiliser leur taux de completion
          completionRate = day.mits_completed / day.total_mits;
          hasActivity = true;
        } else if (day.total_mets > 0) {
          // Si on a seulement des MET, utiliser leur taux d'évitement
          completionRate = (day.total_mets - day.mets_avoided) / day.total_mets;
          hasActivity = true;
        }
        
        // ✅ SEULEMENT ajouter si il y a de l'activité
        if (hasActivity) {
          calendarDataFormatted[day.date] = {
            mitCompletion: completionRate,
            metAvoidance: day.total_mets > 0 ? (day.total_mets - day.mets_avoided) / day.total_mets : 1,
            hasActivity: true
          };
        }
      });

      setCalendarData(calendarDataFormatted);
      console.log('Données calendrier chargées:', Object.keys(calendarDataFormatted).length, 'jours');

    } catch (error) {
      console.error('Erreur chargement calendrier:', error);
    }
  };

  // Animation d'entrée (conservée)
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

  // Formatage de la date pour la clé (conservé)
  const getDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  // ✅ Données du jour sélectionné depuis Supabase
  const currentDateKey = getDateKey(selectedDate);
  const currentDayMitCompletions = mitCompletions[currentDateKey] || [];
  const currentDayMetChecks = metChecks[currentDateKey] || [];
  const currentDayAchievement = dailyAchievements[currentDateKey] || null;

  // ✅ CORRIGÉ: Formatter les MIT avec filtrage par date et parsing intelligent du texte
  const currentDayMITs = activeMITs
    .filter(mit => {
      const shouldShow = shouldShowTaskForDate(mit, selectedDate);
      console.log(`MIT "${parseTaskText(mit.text)}" (recurring: ${mit.is_recurring}) pour ${currentDateKey}: ${shouldShow ? 'AFFICHER' : 'MASQUER'}`);
      return shouldShow;
    })
    .map(mit => ({
      id: mit.id,
      text: parseTaskText(mit.text),
      completed: currentDayMitCompletions.includes(mit.id),
      priority: mit.priority,
      estimatedTime: mit.estimated_time || '30min',
      category: parseTaskCategory(mit.text),
      isRecurring: mit.is_recurring || false,
      startDate: mit.start_date || mit.created_at
    }));

  // ✅ CORRIGÉ: Formatter les MET avec filtrage par date et parsing intelligent du texte
  const currentDayMETs = activeMETs
    .filter(met => {
      const shouldShow = shouldShowTaskForDate(met, selectedDate);
      console.log(`MET "${parseTaskText(met.text)}" (recurring: ${met.is_recurring}) pour ${currentDateKey}: ${shouldShow ? 'AFFICHER' : 'MASQUER'}`);
      return shouldShow;
    })
    .map(met => ({
      id: met.id,
      text: parseTaskText(met.text),
      checked: currentDayMetChecks.includes(met.id),
      category: parseTaskCategory(met.text),
      isRecurring: met.is_recurring || false,
      startDate: met.start_date || met.created_at
    }));

  // ✅ Debug log pour voir les données formatées
  console.log('MIT FINALES pour', currentDateKey, ':', currentDayMITs.map(m => `"${m.text}" (completed: ${m.completed})`));
  console.log('MET FINALES pour', currentDateKey, ':', currentDayMETs.map(m => `"${m.text}" (checked: ${m.checked})`));

  // Gestion du changement de date (conservée)
  const handleDateChange = (date) => {
    setSelectedDate(date);
    console.log('Date sélectionnée changée vers:', getDateKey(date));
  };

  // Fonction pour déclencher l'animation de succès (conservée)
  const triggerSuccessAnimation = (taskText, type, isSuccess = true) => {
    setSuccessAnimation({
      visible: true,
      taskText,
      type,
      isSuccess
    });
  };

  // Fonction pour terminer l'animation de succès (conservée)
  const handleSuccessAnimationComplete = () => {
    setSuccessAnimation({
      visible: false,
      taskText: '',
      type: 'MIT',
      isSuccess: true
    });
  };

  // ✅ CORRIGÉ: Gestion des MIT avec Supabase - utilise la date sélectionnée
  const handleMITToggle = async (itemId) => {
    if (!userProfile?.supabaseId) return;

    const task = currentDayMITs.find(item => item.id === itemId);
    if (!task) return;

    const targetDate = getDateKey(selectedDate);
    const today = getDateKey(new Date());

    // ✅ NOUVELLE VÉRIFICATION: Empêcher les actions sur les dates futures
    if (targetDate > today) {
      Alert.alert(
        t('future.journal.alerts.futureAction.title'),
        t('future.journal.alerts.futureAction.message'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    try {
      if (!task.completed) {
        // Marquer comme terminé - déclencher l'animation
        triggerSuccessAnimation(task.text, 'MIT', true);
        
        // ✅ CORRIGÉ: Sauvegarder pour la date sélectionnée (pas forcément aujourd'hui)
        const result = await TaskService.completeMITForDate(userProfile.supabaseId, itemId, targetDate);
        
        if (result.success) {
          // Mettre à jour l'état local pour la date sélectionnée
          setMitCompletions(prev => ({
            ...prev,
            [targetDate]: [...(prev[targetDate] || []), itemId]
          }));

          // ✅ Ajouter des points SEULEMENT si c'est aujourd'hui
          if (targetDate === today) {
            await DailyService.addPoints(userProfile.supabaseId, 30, 'mit_completion');
          }
          
          console.log(`MIT marquée terminée pour ${targetDate}:`, task.text);
        }
      } else {
        // ✅ PERMETTRE de décocher (utile pour les corrections)
        Alert.alert(
          t('future.journal.alerts.uncheckMIT.title'),
          t('future.journal.alerts.uncheckMIT.message'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('future.journal.alerts.uncheckMIT.confirm'),
              onPress: async () => {
                const result = await TaskService.uncompleteMITForDate(userProfile.supabaseId, itemId, targetDate);
                if (result.success) {
                  setMitCompletions(prev => ({
                    ...prev,
                    [targetDate]: (prev[targetDate] || []).filter(id => id !== itemId)
                  }));
                  console.log(`MIT décochée pour ${targetDate}:`, task.text);
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erreur toggle MIT:', error);
      Alert.alert(t('future.journal.alerts.error'), t('future.journal.alerts.mitUpdateError'));
    }
  };

  // CORRECTIONS DANS ./screens/JournalScreen.js

// ✅ CORRIGER handleMITAdd - ligne ~275
const handleMITAdd = async (text, priority = 'medium', estimatedTime = '30min', isRecurring = false, selectedDays = []) => {
  if (!userProfile?.supabaseId || !text.trim()) return;

  try {
    console.log('Création MIT avec données complètes:', {
      text: text.trim(),
      priority,
      estimatedTime,
      isRecurring,
      selectedDays,
    });

    const mitData = {
      text: text.trim(),
      priority,
      estimatedTime,
      isRecurring: isRecurring,
      selectedDays: selectedDays,
      startDate: getDateKey(selectedDate)
    };

    const result = await TaskService.createMIT(userProfile.supabaseId, mitData);
    
    if (result.success) {
      // Si c'est une tâche ponctuelle OU un template qui a généré une tâche aujourd'hui
      if (!isRecurring || selectedDays.length === 0) {
        // Tâche ponctuelle - ajouter aux MIT locales
        setActiveMITs(prev => [...prev, result.mit]);
        console.log('MIT ponctuelle ajoutée aux MIT locales');
      } else if (result.wasGeneratedToday && result.generatedTask) {
        // Template récurrent avec génération immédiate - ajouter la tâche générée
        setActiveMITs(prev => [...prev, result.generatedTask]);
        console.log('Template créé ET tâche générée immédiatement ajoutée aux MIT locales');
      } else {
        // Template récurrent sans génération aujourd'hui
        console.log('Template MIT créé, pas de génération pour aujourd\'hui');
      }
    } else {
      Alert.alert(t('future.journal.alerts.error'), t('future.journal.alerts.mitCreateError'));
    }
  } catch (error) {
    console.error('Erreur création MIT:', error);
    Alert.alert(t('future.journal.alerts.error'), t('future.journal.alerts.mitCreateError'));
  }
};


// ✅ MODIFICATION du handleMETAdd pour traiter la génération immédiate
const handleMETAdd = async (text, isRecurring = true, selectedDays = []) => {
  if (!userProfile?.supabaseId || !text.trim()) return;

  try {
    console.log('Création MET avec données complètes:', {
      text: text.trim(),
      isRecurring,
      selectedDays,
    });

    const metData = {
      text: text.trim(),
      isRecurring: isRecurring,
      selectedDays: selectedDays,
      startDate: getDateKey(selectedDate)
    };

    const result = await TaskService.createMET(userProfile.supabaseId, metData);
    
    if (result.success) {
      // Si c'est une tâche ponctuelle OU un template qui a généré une tâche aujourd'hui
      if (!isRecurring || selectedDays.length === 0) {
        // Tâche ponctuelle - ajouter aux MET locales
        setActiveMETs(prev => [...prev, result.met]);
        console.log('MET ponctuelle ajoutée aux MET locales');
      } else if (result.wasGeneratedToday && result.generatedTask) {
        // Template récurrent avec génération immédiate - ajouter la tâche générée
        setActiveMETs(prev => [...prev, result.generatedTask]);
        console.log('Template créé ET tâche générée immédiatement ajoutée aux MET locales');
      } else {
        // Template récurrent sans génération aujourd'hui
        console.log('Template MET créé, pas de génération pour aujourd\'hui');
      }
    } else {
      Alert.alert(t('future.journal.alerts.error'), t('future.journal.alerts.metCreateError'));
    }
  } catch (error) {
    console.error('Erreur création MET:', error);
    Alert.alert(t('future.journal.alerts.error'), t('future.journal.alerts.metCreateError'));
  }
};
  // ✅ Supprimer une MIT (désactiver plutôt que supprimer)
  const handleMITDelete = async (itemId) => {
    if (!userProfile?.supabaseId) return;

    try {
      Alert.alert(
        t('future.journal.alerts.deleteMIT.title'),
        t('future.journal.alerts.deleteMIT.message'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              // Désactiver la MIT dans Supabase
              const { error } = await supabase
                .from('mits')
                .update({ is_active: false })
                .eq('id', itemId);

              if (!error) {
                setActiveMITs(prev => prev.filter(mit => mit.id !== itemId));
                console.log('MIT désactivée');
              } else {
                Alert.alert(t('future.journal.alerts.error'), t('future.journal.alerts.mitDeleteError'));
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur suppression MIT:', error);
    }
  };

  // ✅ CORRIGÉ: Gestion des MET avec Supabase - utilise la date sélectionnée
  const handleMETToggle = async (itemId) => {
    if (!userProfile?.supabaseId) return;

    const task = currentDayMETs.find(item => item.id === itemId);
    if (!task) return;

    const targetDate = getDateKey(selectedDate);
    const today = getDateKey(new Date());

    // ✅ NOUVELLE VÉRIFICATION: Empêcher les actions sur les dates futures
    if (targetDate > today) {
      Alert.alert(
        t('future.journal.alerts.futureAction.title'),
        t('future.journal.alerts.futureAction.message'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    try {
      if (!task.checked) {
        // Marquer comme fait (échec) - déclencher l'animation
        triggerSuccessAnimation(task.text, 'MET', false);
        
        // ✅ CORRIGÉ: Sauvegarder pour la date sélectionnée (pas forcément aujourd'hui)
        const result = await TaskService.checkMETForDate(userProfile.supabaseId, itemId, targetDate);
        
        if (result.success) {
          // Mettre à jour l'état local pour la date sélectionnée
          setMetChecks(prev => ({
            ...prev,
            [targetDate]: [...(prev[targetDate] || []), itemId]
          }));

          // ✅ Déduire des points SEULEMENT si c'est aujourd'hui
          if (targetDate === today) {
            await DailyService.addPoints(userProfile.supabaseId, -10, 'met_failed');
          }
          
          console.log(`MET marquée échouée pour ${targetDate}:`, task.text);
        }
      } else {
        // ✅ PERMETTRE de décocher (utile pour les corrections)
        Alert.alert(
          t('future.journal.alerts.uncheckMET.title'),
          t('future.journal.alerts.uncheckMET.message'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('future.journal.alerts.uncheckMET.confirm'),
              onPress: async () => {
                const result = await TaskService.uncheckMETForDate(userProfile.supabaseId, itemId, targetDate);
                if (result.success) {
                  setMetChecks(prev => ({
                    ...prev,
                    [targetDate]: (prev[targetDate] || []).filter(id => id !== itemId)
                  }));
                  console.log(`MET décochée pour ${targetDate}:`, task.text);
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erreur toggle MET:', error);
      Alert.alert(t('future.journal.alerts.error'), t('future.journal.alerts.metUpdateError'));
    }
  };


  // ✅ Supprimer une MET
  const handleMETDelete = async (itemId) => {
    if (!userProfile?.supabaseId) return;

    try {
      Alert.alert(
        t('future.journal.alerts.deleteMET.title'),
        t('future.journal.alerts.deleteMET.message'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              // Désactiver la MET dans Supabase
              const { error } = await supabase
                .from('mets')
                .update({ is_active: false })
                .eq('id', itemId);

              if (!error) {
                setActiveMETs(prev => prev.filter(met => met.id !== itemId));
                console.log('MET désactivée');
              } else {
                Alert.alert(t('future.journal.alerts.error'), t('future.journal.alerts.metDeleteError'));
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur suppression MET:', error);
    }
  };

  // ✅ Gestion des accomplissements avec Supabase
  const handleAchievementAdd = async (text) => {
    if (!userProfile?.supabaseId || !text.trim()) return;

    try {
      const result = await DailyService.saveTodayAchievement(userProfile.supabaseId, text.trim());
      
      if (result.success) {
        setDailyAchievements(prev => ({
          ...prev,
          [currentDateKey]: text.trim()
        }));
        console.log('Achievement sauvegardé:', text);
      }
    } catch (error) {
      console.error('Erreur sauvegarde achievement:', error);
      Alert.alert(t('future.journal.alerts.error'), t('future.journal.alerts.achievementSaveError'));
    }
  };

  // ✅ Supprimer un accomplissement
  const handleAchievementRemove = async () => {
    if (!userProfile?.supabaseId) return;

    try {
      const result = await DailyService.saveTodayAchievement(userProfile.supabaseId, '');
      
      if (result.success) {
        setDailyAchievements(prev => ({
          ...prev,
          [currentDateKey]: null
        }));
        console.log('Achievement supprimé');
      }
    } catch (error) {
      console.error('Erreur suppression achievement:', error);
    }
  };

  const firstName = userProfile?.firstName || t('future.header.defaultName');

  // ✅ Affichage de loading
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>{t('future.journal.loading')}</Text>
      </View>
    );
  }

  // ✅ Affichage d'erreur
  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorTitle}>{t('future.journal.error.title')}</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadJournalData}>
          <Text style={styles.retryButtonText}>{t('future.journal.error.retry')}</Text>
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
      <FutureHeader 
        firstName={firstName}
        selectedDate={selectedDate}
      />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Calendrier */}
        <FutureCalendar
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          calendarView={calendarView}
          onViewChange={setCalendarView}
          dailyData={calendarData} // ✅ Données réelles du calendrier
        />

        {/* Navigation par onglets */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          mitCount={currentDayMITs.length}
          metCount={currentDayMETs.length}
        />

        {/* Contenu des onglets */}
        {activeTab === 'MIT' ? (
          <MITTab
            items={currentDayMITs} // ✅ CORRIGÉ: MIT filtrées par date avec texte parsé et is_recurring
            onToggle={handleMITToggle}
            onAdd={handleMITAdd}
            onDelete={handleMITDelete}
            selectedDate={selectedDate}
            achievement={currentDayAchievement} // ✅ Achievement réel
            onAchievementAdd={handleAchievementAdd}
            onAchievementRemove={handleAchievementRemove}
            userProfile={userProfile}
          />
        ) : (
          <METTab
            items={currentDayMETs} // ✅ CORRIGÉ: MET filtrées par date avec texte parsé et is_recurring
            onToggle={handleMETToggle}
            onAdd={handleMETAdd}
            onDelete={handleMETDelete}
            selectedDate={selectedDate}
            userProfile={userProfile}
          />
        )}
 
      </ScrollView>

      {/* Animation de succès - Positionnée au niveau de l'écran */}
      <TaskSuccessAnimation
        visible={successAnimation.visible}
        onComplete={handleSuccessAnimationComplete}
        taskText={successAnimation.taskText}
        type={successAnimation.type}
        isSuccess={successAnimation.isSuccess}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  
  // ✅ Styles pour loading et erreur
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#FFD700',
    textAlign: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
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
});
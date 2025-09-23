import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { getCurrentOffering, purchasePackage, restorePurchases } from '../../services/revenuecat';

const { width, height } = Dimensions.get('window');

export default function PaywallModal({ 
  isVisible, 
  onClose, 
  onSubscribe,
  firstName,
  triggerHaptic 
}) {
  const { t } = useTranslation();
  
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  
  // États RevenueCat
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Charger les packages RevenueCat au montage
  useEffect(() => {
    if (isVisible) {
      loadOfferings();
    }
  }, [isVisible]);

  const loadOfferings = async () => {
    try {
      setLoading(true);
      const offering = await getCurrentOffering();
      
      if (offering && offering.availablePackages) {
        setPackages(offering.availablePackages);
        // Sélectionner le package annuel par défaut (ou le premier)
        const yearlyPackage = offering.availablePackages.find(pkg => 
          pkg.packageType === 'ANNUAL' || pkg.identifier.includes('yearly')
        );
        setSelectedPackage(yearlyPackage || offering.availablePackages[0]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des offerings:', error);
      Alert.alert(
        t('paywall.error.title'),
        t('paywall.error.loadingPackages'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour obtenir le nom lisible du package
  const getPackageDisplayName = (pkg) => {
    if (pkg.packageType === 'WEEKLY') return t('paywall.plans.weekly.duration');
    if (pkg.packageType === 'MONTHLY') return t('paywall.plans.monthly.duration');
    if (pkg.packageType === 'ANNUAL') return t('paywall.plans.yearly.duration');
    return pkg.identifier;
  };

  // Fonction pour calculer le prix par jour
  const getPricePerDay = (pkg) => {
    const price = parseFloat(pkg.product.price);
    let days = 30; // Par défaut
    
    if (pkg.packageType === 'WEEKLY') days = 7;
    else if (pkg.packageType === 'MONTHLY') days = 30;
    else if (pkg.packageType === 'ANNUAL') days = 365;
    
    return (price / days).toFixed(2);
  };

  // Fonction pour déterminer si c'est le plan populaire
  const isPopularPlan = (pkg) => {
    return pkg.packageType === 'ANNUAL';
  };

  // Animation d'ouverture
  useEffect(() => {
    if (isVisible) {
      slideAnim.setValue(height);
      backdropAnim.setValue(0);
      contentOpacity.setValue(0);
      
      Animated.sequence([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 80,
            friction: 10,
            useNativeDriver: true,
          }),
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 400,
            delay: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      slideAnim.setValue(height);
      backdropAnim.setValue(0);
      contentOpacity.setValue(0);
    }
  }, [isVisible]);

  // Animation de fermeture
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Gestion de la sélection d'un package
  const handlePackageSelect = (pkg) => {
    triggerHaptic();
    setSelectedPackage(pkg);
    
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ✅ CORRIGÉ: Gestion de l'achat
  const handlePurchase = async () => {
    if (!selectedPackage || purchasing) return;

    try {
      triggerHaptic();
      setPurchasing(true);

      const success = await purchasePackage(selectedPackage);
      
      if (success) {
        // Animation de succès
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 0.95,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(bounceAnim, {
            toValue: 1,
            tension: 200,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();

        // ✅ Notifier directement le parent SANS fermer le modal
        onSubscribe(selectedPackage);
      }
    } catch (error) {
      console.error('Erreur lors de l\'achat:', error);
      Alert.alert(
        t('paywall.error.title'),
        t('paywall.error.purchase'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setPurchasing(false);
    }
  };

  // ✅ CORRIGÉ: Gestion de la restauration
  const handleRestore = async () => {
    if (restoring) return;

    try {
      setRestoring(true);
      const success = await restorePurchases();
      
      if (success) {
        // ✅ Notifier directement le parent SANS fermer le modal
        onSubscribe({ identifier: 'restored', product: { priceString: 'Restored' } });
      } else {
        Alert.alert(
          t('paywall.restore.title'),
          t('paywall.restore.noPurchases'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      Alert.alert(
        t('paywall.error.title'),
        t('paywall.error.restore'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setRestoring(false);
    }
  };

  // ✅ NOUVEAU: Gestion du bypass dev
  const handleDevBypass = () => {
    triggerHaptic();
    console.log('🚧 Bypass dev activé');
    
    // ✅ Notifier directement le parent SANS fermer le modal
    onSubscribe({ 
      identifier: 'dev_bypass', 
      product: { priceString: 'DEV' } 
    });
  };

  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      onRequestClose={handleClose}
      animationType="none"
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View 
        style={[
          styles.backdrop,
          {
            opacity: backdropAnim,
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />
      </Animated.View>

      {/* Modale principale */}
      <Animated.View 
        style={[
          styles.modalContainer,
          {
            transform: [
              { translateY: slideAnim },
              { scale: bounceAnim }
            ],
          },
        ]}
      >
        {/* Handle */}
        <Animated.View 
          style={[
            styles.handle,
            { opacity: contentOpacity }
          ]} 
        />

        <Animated.View style={{ opacity: contentOpacity }}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.welcomeText}>
                {t('paywall.welcome', { firstName })}
              </Text>
              <Text style={styles.subtitle}>
                {t('paywall.subtitle')}
              </Text>
            </View>

            {/* Avantages principaux */}
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>
                {t('paywall.benefits.title')}
              </Text>
              
              {['tracking', 'ai_coaching', 'gamification', 'analytics'].map((benefit) => (
                <View key={benefit} style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <Text style={styles.benefitIconText}>
                      {t(`paywall.benefits.${benefit}.icon`)}
                    </Text>
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>
                      {t(`paywall.benefits.${benefit}.title`)}
                    </Text>
                    <Text style={styles.benefitDescription}>
                      {t(`paywall.benefits.${benefit}.description`)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Plans d'abonnement */}
            <View style={styles.plansContainer}>
              <Text style={styles.plansTitle}>
                {t('paywall.choosePlan')}
              </Text>
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FFD700" />
                  <Text style={styles.loadingText}>
                    {t('paywall.loadingPlans')}
                  </Text>
                </View>
              ) : (
                packages.map((pkg) => (
                  <TouchableOpacity
                    key={pkg.identifier}
                    style={[
                      styles.planCard,
                      selectedPackage?.identifier === pkg.identifier && styles.planCardSelected,
                      isPopularPlan(pkg) && styles.planCardPopular,
                    ]}
                    onPress={() => handlePackageSelect(pkg)}
                    activeOpacity={0.8}
                  >
                    {isPopularPlan(pkg) && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>
                          {t('paywall.mostPopular')}
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.planHeader}>
                      <View style={styles.planInfo}>
                        <Text style={styles.planDuration}>
                          {getPackageDisplayName(pkg)}
                        </Text>
                        <Text style={styles.planPricePerDay}>
                          {t('paywall.perDay', { price: getPricePerDay(pkg) })}
                        </Text>
                      </View>
                      
                      <View style={styles.planPricing}>
                        <Text style={styles.planPrice}>
                          {pkg.product.priceString}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Radio button */}
                    <View style={styles.radioContainer}>
                      <View style={[
                        styles.radioButton,
                        selectedPackage?.identifier === pkg.identifier && styles.radioButtonSelected
                      ]}>
                        {selectedPackage?.identifier === pkg.identifier && (
                          <View style={styles.radioButtonInner} />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              style={[
                styles.subscribeButton,
                (loading || purchasing) && styles.subscribeButtonDisabled
              ]}
              onPress={handlePurchase}
              activeOpacity={0.9}
              disabled={loading || purchasing}
            >
              {purchasing ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <Text style={styles.subscribeButtonText}>
                    {t('paywall.startJourney')}
                  </Text>
                  <Text style={styles.subscribeButtonSubtext}>
                    {t('paywall.noCommitment')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* ✅ BOUTON DEV - Visible seulement en développement */}
            {__DEV__ && (
              <TouchableOpacity
                style={styles.devButton}
                onPress={handleDevBypass}
              >
                <Text style={styles.devButtonText}>
                  🚧 DEV: Accéder sans payer
                </Text>
              </TouchableOpacity>
            )}

            {/* Bouton Restaurer */}
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={restoring}
            >
              {restoring ? (
                <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.7)" />
              ) : (
                <Text style={styles.restoreButtonText}>
                  {t('paywall.restore.button')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Footer légal */}
            <Text style={styles.legalText}>
              {t('paywall.legal')}
            </Text>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: height * 0.85,
    backgroundColor: 'rgba(20, 20, 30, 0.98)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: 'transparent',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  
  // Header
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 8,
  },
  welcomeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Benefits
  benefitsContainer: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  benefitIconText: {
    fontSize: 18,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  benefitDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 12,
  },

  // Plans
  plansContainer: {
    marginBottom: 24,
  },
  plansTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  planCardPopular: {
    borderColor: '#4CD964',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 16,
    backgroundColor: '#4CD964',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  popularBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#000000',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 45,
  },
  planInfo: {
    flex: 1,
  },
  planDuration: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  planPricePerDay: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  planPricing: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  radioContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#FFD700',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
  },

  // CTA
  subscribeButton: {
    backgroundColor: '#FFD700',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  subscribeButtonDisabled: {
    backgroundColor: 'rgba(255, 215, 0, 0.5)',
  },
  subscribeButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#000000',
    marginBottom: 2,
  },
  subscribeButtonSubtext: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.7)',
  },

  // ✅ Dev Button
  devButton: {
    backgroundColor: 'rgba(255, 69, 58, 0.8)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  devButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },

  // Restore
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  restoreButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textDecorationLine: 'underline',
  },

  // Legal
  legalText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 16,
  },
});
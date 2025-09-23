// services/revenuecat.js
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { getDeviceId } from './identity';

// ⚠️ REMPLACE PAR TES VRAIES CLÉS REVENUECAT
const RC_IOS_API_KEY = 'appl_YOUR_IOS_API_KEY_HERE';
const RC_ANDROID_API_KEY = 'goog_YOUR_ANDROID_API_KEY_HERE';

// Nom de l'entitlement dans RevenueCat Dashboard
const PREMIUM_ENTITLEMENT = 'premium';

/**
 * Initialise RevenueCat au démarrage de l'app
 * À appeler dans App.js
 */
export async function initPurchases() {
  try {
    const deviceId = await getDeviceId();
    
    // Configuration RevenueCat
    await Purchases.configure({
      apiKey: RC_IOS_API_KEY, // RevenueCat détecte automatiquement la plateforme
      appUserID: deviceId,    // Utilisateur anonyme mais stable
      observerMode: false,    // RevenueCat gère les achats
    });

    // Attributs pour analytics (optionnel)
    await Purchases.setAttributes({ 
      deviceId: deviceId,
      platform: 'react-native'
    });

    // Log level pour debug (change en WARN en production)
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    
    console.log('✅ RevenueCat initialisé avec deviceId:', deviceId);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation RevenueCat:', error);
    throw error;
  }
}

/**
 * Récupère l'offering courant (packages disponibles)
 * Pour afficher dans ton PaywallModal
 */
export async function getCurrentOffering() {
  try {
    const offerings = await Purchases.getOfferings();
    console.log('✅ Offerings récupérés:', offerings.current?.identifier);
    return offerings.current;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des offerings:', error);
    return null;
  }
}

/**
 * Effectue un achat
 * @param {Package} packageToPurchase - Package RevenueCat à acheter
 * @returns {boolean} - True si l'utilisateur est maintenant premium
 */
export async function purchasePackage(packageToPurchase) {
  try {
    console.log('🛒 Tentative d\'achat:', packageToPurchase.identifier);
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    const isPremiumNow = isPremium(customerInfo);
    
    console.log('✅ Achat effectué, premium:', isPremiumNow);
    return isPremiumNow;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'achat:', error);
    
    // Gestion des erreurs communes
    if (error.userCancelled) {
      console.log('🚫 Achat annulé par l\'utilisateur');
      return false;
    }
    
    throw error;
  }
}

/**
 * Restaure les achats existants
 * @returns {boolean} - True si l'utilisateur est premium après restauration
 */
export async function restorePurchases() {
  try {
    console.log('🔄 Tentative de restauration...');
    const customerInfo = await Purchases.restorePurchases();
    const isPremiumNow = isPremium(customerInfo);
    
    console.log('✅ Restauration effectuée, premium:', isPremiumNow);
    return isPremiumNow;
    
  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
    throw error;
  }
}

/**
 * Vérifie si l'utilisateur a l'entitlement premium
 * @param {CustomerInfo} customerInfo - Infos client RevenueCat
 * @returns {boolean} - True si premium actif
 */
export function isPremium(customerInfo) {
  if (!customerInfo) return false;
  
  const premiumEntitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT];
  return !!premiumEntitlement;
}

/**
 * Récupère les infos client actuelles
 * @returns {CustomerInfo} - Infos client RevenueCat
 */
export async function getCustomerInfo() {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des infos client:', error);
    return null;
  }
}

/**
 * Vérifie rapidement si l'utilisateur est premium
 * @returns {boolean} - Statut premium actuel
 */
export async function checkPremiumStatus() {
  try {
    const customerInfo = await getCustomerInfo();
    return isPremium(customerInfo);
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du statut premium:', error);
    return false;
  }
}
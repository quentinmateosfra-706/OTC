/**
 * Service RevenueCat — achats in-app iOS/Android.
 *
 * Gère :
 * - Initialisation du SDK (une seule fois au démarrage).
 * - Achat d'une course à l'unité (entitlement par raceId).
 * - Achat d'un abonnement mensuel ou annuel.
 * - Restauration des achats.
 *
 * ⚠️ react-native-purchases nécessite un dev build EAS (module natif).
 *    En Expo Go, tous les appels renvoient des erreurs gracieuses.
 *
 * Architecture :
 * - RevenueCat envoie un webhook à notre Cloud Function `revenuecatWebhook`
 *   qui écrit le document `purchases/{id}` ou `subscriptions/{uid}` en Firestore.
 * - Le client ne doit pas écrire ces documents directement.
 */
import { config } from '@/constants/config';

type PurchasesType = typeof import('react-native-purchases').default;

let Purchases: PurchasesType | null = null;

/** Initialise RevenueCat. À appeler une seule fois au démarrage de l'app. */
export async function initRevenueCat(userId: string): Promise<void> {
  if (!config.revenueCat.iosKey || config.revenueCat.iosKey === 'TODO') return;

  try {
    const rc = await import('react-native-purchases');
    Purchases = rc.default;
    await Purchases.configure({ apiKey: config.revenueCat.iosKey });
    await Purchases.logIn(userId);
  } catch {
    // Module natif absent (Expo Go) — silencieux.
  }
}

/** Déconnecte l'utilisateur de RevenueCat (à la déconnexion Firebase). */
export async function logoutRevenueCat(): Promise<void> {
  try {
    await Purchases?.logOut();
  } catch {
    // Silencieux.
  }
}

/** Identifiant de l'entitlement RevenueCat pour le pass illimité. */
export const RC_ENTITLEMENT_PASS = 'unlimited_pass';

/** Identifiant du produit mensuel (à configurer dans le dashboard RC). */
export const RC_PRODUCT_MONTHLY = 'otc_pass_monthly';

/** Identifiant du produit annuel. */
export const RC_PRODUCT_ANNUAL = 'otc_pass_annual';

/**
 * Retourne les offres disponibles (produits RevenueCat).
 * Null si le SDK n'est pas disponible.
 */
export async function getOfferings() {
  if (!Purchases) return null;
  try {
    return await Purchases.getOfferings();
  } catch {
    return null;
  }
}

/**
 * Déclenche l'achat d'un package RevenueCat (mensuel ou annuel).
 * Retourne true si l'achat est validé (entitlement actif).
 */
export async function purchasePackage(
  packageToBuy: import('react-native-purchases').PurchasesPackage,
): Promise<boolean> {
  if (!Purchases) return false;
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
    return !!customerInfo.entitlements.active[RC_ENTITLEMENT_PASS];
  } catch (err: unknown) {
    // L'utilisateur a annulé — ne pas lancer d'erreur.
    if ((err as { userCancelled?: boolean }).userCancelled) return false;
    throw err;
  }
}

/**
 * Restaure les achats précédents (obligatoire App Store / Play Store).
 * Retourne true si un entitlement actif est trouvé.
 */
export async function restorePurchases(): Promise<boolean> {
  if (!Purchases) return false;
  try {
    const customerInfo = await Purchases.restorePurchases();
    return !!customerInfo.entitlements.active[RC_ENTITLEMENT_PASS];
  } catch {
    return false;
  }
}

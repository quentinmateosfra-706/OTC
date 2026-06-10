/**
 * Service Stripe — paiement web (hors App Store).
 *
 * Fonctionnement :
 * 1. Le client appelle la Cloud Function `createStripeCheckout`.
 * 2. La Function crée une session Stripe Checkout et retourne l'URL.
 * 3. On ouvre l'URL dans le navigateur (expo-web-browser).
 * 4. Stripe redirige vers `otc://purchase-success?session_id=...`
 * 5. Notre webhook Cloud Function `stripeWebhook` capte l'événement
 *    `checkout.session.completed` et écrit le document `purchases/{id}`.
 *
 * Ce flux ne nécessite pas de SDK Stripe natif — juste expo-web-browser.
 */
import { httpsCallable } from 'firebase/functions';
import { openAuthSessionAsync } from 'expo-web-browser';
import { functions } from './firebase';

interface CreateCheckoutParams {
  raceId: string;
  season: string;
  /** 'race' pour achat unitaire, 'monthly'/'annual' pour abonnement. */
  type: 'race' | 'monthly' | 'annual';
}

interface CheckoutResult {
  url: string;
  sessionId: string;
}

/**
 * Crée une session Stripe Checkout et ouvre le navigateur.
 * Retourne 'success', 'cancel', ou 'error'.
 */
export async function openStripeCheckout(
  params: CreateCheckoutParams,
): Promise<'success' | 'cancel' | 'error'> {
  try {
    const fn = httpsCallable<CreateCheckoutParams, CheckoutResult>(
      functions,
      'createStripeCheckout',
    );
    const { data } = await fn(params);

    const result = await openAuthSessionAsync(
      data.url,
      'otc://purchase-success',
    );

    if (result.type === 'success') return 'success';
    if (result.type === 'cancel' || result.type === 'dismiss') return 'cancel';
    return 'error';
  } catch {
    return 'error';
  }
}

/**
 * Cloud Function — createStripeCheckout.
 *
 * Crée une session Stripe Checkout pour :
 * - L'achat unitaire d'une course (type 'race').
 * - L'abonnement mensuel ou annuel (type 'monthly' | 'annual').
 *
 * Retourne l'URL de la session à ouvrir dans le navigateur.
 * Le webhook `stripeWebhook` gère ensuite la confirmation de paiement.
 *
 * Variables d'environnement requises :
 *   STRIPE_SECRET_KEY    — clé secrète Stripe (sk_live_* ou sk_test_*)
 *   STRIPE_PRICE_MONTHLY — ID du prix Stripe pour l'abonnement mensuel
 *   STRIPE_PRICE_ANNUAL  — ID du prix Stripe pour l'abonnement annuel
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const region = 'europe-west1';

interface CheckoutParams {
  raceId: string;
  season: string;
  type: 'race' | 'monthly' | 'annual';
}

interface CheckoutResult {
  url: string;
  sessionId: string;
}

export const createStripeCheckout = functions
  .region(region)
  .https.onCall(async (data: CheckoutParams, context): Promise<CheckoutResult> => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentification requise.');
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new functions.https.HttpsError('internal', 'Stripe non configuré.');
    }

    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });

    const uid = context.auth.uid;
    const userSnap = await db.collection('users').doc(uid).get();
    const email = userSnap.data()?.email as string | undefined;

    // ─── Achat unitaire course ────────────────────────────────────────────
    if (data.type === 'race') {
      // Récupère le prix depuis Firestore.
      const raceSnap = await db.collection('races').doc(data.raceId).get();
      if (!raceSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Course introuvable.');
      }
      const race = raceSnap.data()!;

      // Calcul du prix selon la distance (en centimes).
      const pricingSnap = await db.collection('pricing').doc('current').get();
      const tiers = pricingSnap.data()?.tiers as Array<{
        maxKm: number | null;
        priceEur: number;
      }> | undefined ?? [
        { maxKm: 15, priceEur: 4.99 },
        { maxKm: 30, priceEur: 7.99 },
        { maxKm: 50, priceEur: 12.99 },
        { maxKm: 80, priceEur: 19.99 },
        { maxKm: null, priceEur: 29.99 },
      ];
      const distanceKm = race.distanceKm as number;
      let priceEur = tiers[tiers.length - 1].priceEur;
      for (const tier of tiers) {
        if (tier.maxKm === null || distanceKm < tier.maxKm) {
          priceEur = tier.priceEur;
          break;
        }
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: 'eur',
              unit_amount: Math.round(priceEur * 100),
              product_data: {
                name: `${race.name as string} — Saison ${data.season}`,
                description: `Accès illimité sur la saison ${data.season}`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          uid,
          raceId: data.raceId,
          season: data.season,
          type: 'race',
        },
        success_url: 'otc://purchase-success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'otc://purchase-cancel',
      });

      return { url: session.url!, sessionId: session.id };
    }

    // ─── Abonnement pass illimité ─────────────────────────────────────────
    const priceId = data.type === 'monthly'
      ? process.env.STRIPE_PRICE_MONTHLY
      : process.env.STRIPE_PRICE_ANNUAL;

    if (!priceId) {
      throw new functions.https.HttpsError('internal', 'Prix Stripe non configuré.');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { uid, type: data.type },
      success_url: 'otc://purchase-success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'otc://purchase-cancel',
    });

    return { url: session.url!, sessionId: session.id };
  });

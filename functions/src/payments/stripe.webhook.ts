/**
 * Cloud Function — stripeWebhook.
 *
 * Reçoit les événements Stripe (HTTPS, non callable).
 * Événements traités :
 * - `checkout.session.completed` : achat unitaire ou abonnement confirmé.
 * - `customer.subscription.deleted` : abonnement résilié.
 * - `invoice.payment_failed` : renouvellement échoué.
 *
 * La signature Stripe est vérifiée (`STRIPE_WEBHOOK_SECRET`).
 * Toute écriture Firestore se fait ici, jamais côté client.
 *
 * Variables d'environnement :
 *   STRIPE_SECRET_KEY       — clé secrète Stripe
 *   STRIPE_WEBHOOK_SECRET   — secret de signature du webhook
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const region = 'europe-west1';

export const stripeWebhook = functions
  .region(region)
  .https.onRequest(async (req, res) => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secretKey || !webhookSecret) {
      res.status(500).send('Stripe non configuré.');
      return;
    }

    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });

    let event: import('stripe').Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        req.headers['stripe-signature'] as string,
        webhookSecret,
      );
    } catch {
      functions.logger.warn('Stripe webhook signature invalide');
      res.status(400).send('Signature invalide.');
      return;
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as import('stripe').Stripe.Checkout.Session;
        const meta = session.metadata ?? {};
        const uid = meta.uid;
        const type = meta.type;

        if (!uid) break;

        if (type === 'race') {
          // Achat unitaire → document `purchases`.
          const purchaseId = `stripe_${session.id}`;
          await db.collection('purchases').doc(purchaseId).set({
            userId: uid,
            raceId: meta.raceId,
            season: meta.season,
            purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
            amount: session.amount_total ?? 0,
            currency: 'EUR',
            source: 'stripe',
            transactionId: session.id,
            status: 'completed',
          });
          functions.logger.info('Purchase created', { uid, raceId: meta.raceId });

          // Calcul et enregistrement du reversement organisateur (best effort).
          await recordOrganizerPayout(db, meta.raceId, purchaseId, session.amount_total ?? 0);
        }

        if (type === 'monthly' || type === 'annual') {
          // Abonnement → document `subscriptions/{uid}`.
          const sub = session.subscription as string;
          await db.collection('subscriptions').doc(uid).set({
            plan: type,
            status: 'active',
            startDate: admin.firestore.FieldValue.serverTimestamp(),
            renewalDate: null, // sera mis à jour via invoice.paid
            source: 'stripe',
            entitlementId: sub,
          });
          functions.logger.info('Subscription created', { uid, plan: type });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as import('stripe').Stripe.Subscription;
        // Retrouve l'uid via entitlementId.
        const snap = await db
          .collection('subscriptions')
          .where('entitlementId', '==', sub.id)
          .limit(1)
          .get();
        if (!snap.empty) {
          await snap.docs[0].ref.update({ status: 'cancelled' });
          functions.logger.info('Subscription cancelled', { subId: sub.id });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object as import('stripe').Stripe.Invoice;
        const subId = typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id;
        if (subId) {
          const snap = await db
            .collection('subscriptions')
            .where('entitlementId', '==', subId)
            .limit(1)
            .get();
          if (!snap.empty) {
            await snap.docs[0].ref.update({ status: 'expired' });
          }
        }
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  });

/** Calcule et stocke le montant de reversement à l'organisateur. */
async function recordOrganizerPayout(
  db: admin.firestore.Firestore,
  raceId: string,
  purchaseId: string,
  amountCents: number,
): Promise<void> {
  try {
    const raceSnap = await db.collection('races').doc(raceId).get();
    if (!raceSnap.exists) return;
    const race = raceSnap.data()!;
    const fixedPayout = race.organizerPayout as number ?? 0;

    if (fixedPayout <= 0) return;

    await db.collection('_payouts').add({
      purchaseId,
      raceId,
      organizerId: race.organizerId,
      amountCents: Math.min(fixedPayout, amountCents),
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    functions.logger.warn('recordOrganizerPayout failed', e);
  }
}

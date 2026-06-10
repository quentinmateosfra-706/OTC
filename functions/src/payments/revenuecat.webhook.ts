/**
 * Cloud Function — revenuecatWebhook.
 *
 * Reçoit les événements RevenueCat V2 (HTTPS, non callable).
 * Événements traités :
 * - INITIAL_PURCHASE       : premier abonnement ou achat.
 * - RENEWAL                : renouvellement réussi.
 * - CANCELLATION           : résiliation (fin de période en cours).
 * - EXPIRATION             : abonnement expiré.
 * - SUBSCRIBER_ALIAS       : fusion de comptes (ignoré).
 *
 * La clé secrète RC est vérifiée dans l'en-tête `Authorization`.
 *
 * Variables d'environnement :
 *   REVENUECAT_WEBHOOK_SECRET — secret configuré dans le dashboard RC
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const region = 'europe-west1';

export const revenuecatWebhook = functions
  .region(region)
  .https.onRequest(async (req, res) => {
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
    if (secret && req.headers.authorization !== `Bearer ${secret}`) {
      res.status(401).send('Non autorisé.');
      return;
    }

    const event = req.body as {
      event: {
        type: string;
        app_user_id: string; // = Firebase uid
        product_id: string;
        period_type?: string;
        expiration_at_ms?: number;
        purchased_at_ms?: number;
        entitlement_ids?: string[];
      };
    };

    const { type, app_user_id: uid, product_id } = event.event;
    if (!uid) { res.json({ ok: true }); return; }

    const isPass = product_id?.includes('pass');

    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL': {
        if (isPass) {
          const plan = product_id.includes('annual') ? 'annual' : 'monthly';
          const renewalMs = event.event.expiration_at_ms;
          await db.collection('subscriptions').doc(uid).set(
            {
              plan,
              status: 'active',
              startDate: admin.firestore.FieldValue.serverTimestamp(),
              renewalDate: renewalMs
                ? admin.firestore.Timestamp.fromMillis(renewalMs)
                : null,
              source: 'revenuecat',
              entitlementId: product_id,
            },
            { merge: true },
          );
          functions.logger.info('RC subscription active', { uid, plan });
        }
        break;
      }

      case 'CANCELLATION': {
        // L'accès reste valide jusqu'à expiration (status → 'cancelled' seulement).
        const snap = await db.collection('subscriptions').doc(uid).get();
        if (snap.exists) {
          await snap.ref.update({ status: 'cancelled' });
        }
        break;
      }

      case 'EXPIRATION': {
        const snap = await db.collection('subscriptions').doc(uid).get();
        if (snap.exists) {
          await snap.ref.update({ status: 'expired' });
        }
        break;
      }

      default:
        break;
    }

    res.json({ ok: true });
  });

/** Source d'un achat / abonnement. */
export type PaymentSource = 'stripe' | 'revenuecat';

/** Statut d'un achat unitaire. */
export type PurchaseStatus = 'pending' | 'completed' | 'refunded';

/** Document `purchases/{purchaseId}`. */
export interface Purchase {
  id: string;
  userId: string;
  raceId: string;
  season: string;
  purchasedAt: string; // ISO
  amount: number; // en centimes
  currency: 'EUR';
  source: PaymentSource;
  transactionId: string;
  status: PurchaseStatus;
}

/** Formule d'abonnement. */
export type SubscriptionPlan = 'monthly' | 'annual';

/** Statut d'abonnement. */
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

/** Document `subscriptions/{userId}`. */
export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string; // ISO
  renewalDate: string; // ISO
  source: PaymentSource;
  entitlementId: string;
}

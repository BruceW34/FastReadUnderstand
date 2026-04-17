/**
 * ✅ PAYMENT CLOUD FUNCTIONS - Backend Templates
 * Deploy to Firebase Cloud Functions for payment processing
 */

// ===============================================
// 1️⃣ STRIPE WEBHOOK HANDLER
// ===============================================

/*
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, transactionId } = session.metadata as any;

        // Get package info from Stripe line items
        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id
        );

        const packageId = lineItems.data[0].description || 'unknown';

        // Complete transaction in Firestore
        await admin
          .firestore()
          .collection(`users/${userId}/transactions`)
          .doc(transactionId)
          .update({
            status: 'completed',
            externalId: session.payment_intent,
          });

        // Award diamonds
        const diamondPackages: any = {
          // Map price IDs to packages
          'price_diamonds_100': { diamonds: 100, bonus: 0 },
          'price_diamonds_500': { diamonds: 500, bonus: 50 },
          'price_diamonds_1200': { diamonds: 1200, bonus: 200 },
          'price_diamonds_2600': { diamonds: 2600, bonus: 600 },
          'price_diamonds_6500': { diamonds: 6500, bonus: 1500 },
        };

        const pkg = diamondPackages[lineItems.data[0].price?.id || ''];
        const totalDiamonds = (pkg?.diamonds || 0) + (pkg?.bonus || 0);

        await admin
          .firestore()
          .collection('users')
          .doc(userId)
          .update({
            diamonds: admin.firestore.FieldValue.increment(totalDiamonds),
          });

        break;
      }

      case 'charge.refunded': {
        // Handle refund
        const charge = event.data.object as Stripe.Charge;
        console.log(`Refund processed: ${charge.id}`);
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(error);
  }
});

// Create Stripe Checkout Session
export const createCheckoutSession = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be authenticated'
      );
    }

    const { packageId, transactionId, priceId } = data;
    const userId = context.auth.uid;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.APP_URL}/shop?success=true`,
        cancel_url: `${process.env.APP_URL}/shop?canceled=true`,
        metadata: {
          userId,
          transactionId,
          packageId,
        },
      });

      return { sessionUrl: session.url };
    } catch (error) {
      console.error('Checkout session error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to create checkout');
    }
  }
);
*/

// ===============================================
// 2️⃣ APPLE APP STORE RECEIPT VERIFICATION
// ===============================================

/*
export const verifyAppleReceipt = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
    );
  }

  const { receiptData, transactionId } = data;
  const userId = context.auth.uid;

  try {
    // Verify with Apple
    const response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
      method: 'POST',
      body: JSON.stringify({
        'receipt-data': receiptData,
        password: process.env.APPLE_SHARED_SECRET,
      }),
    });

    const result = await response.json();

    if (result.status !== 0) {
      throw new Error('Invalid receipt');
    }

    const receipt = result.receipt;
    const packageIdToPackage: any = {
      'com.superread.diamonds100': { id: 'starter', diamonds: 100, bonus: 0 },
      'com.superread.diamonds500': { id: 'basic', diamonds: 500, bonus: 50 },
      'com.superread.diamonds1200': { id: 'popular', diamonds: 1200, bonus: 200 },
      'com.superread.diamonds2600': { id: 'premium', diamonds: 2600, bonus: 600 },
      'com.superread.diamonds6500': { id: 'ultimate', diamonds: 6500, bonus: 1500 },
    };

    const pkg =
      packageIdToPackage[receipt.bundle_id] ||
      packageIdToPackage[receipt.in_app[0].product_id];

    if (!pkg) {
      throw new Error('Unknown product');
    }

    const totalDiamonds = pkg.diamonds + pkg.bonus;

    // Complete transaction
    await admin
      .firestore()
      .collection(`users/${userId}/transactions`)
      .doc(transactionId)
      .update({
        status: 'completed',
        externalId: receipt.transaction_id,
      });

    // Award diamonds
    await admin
      .firestore()
      .collection('users')
      .doc(userId)
      .update({
        diamonds: admin.firestore.FieldValue.increment(totalDiamonds),
      });

    return { success: true, diamonds: totalDiamonds };
  } catch (error) {
    console.error('Apple verification error:', error);
    throw new functions.https.HttpsError('internal', 'Verification failed');
  }
});
*/

// ===============================================
// 3️⃣ GOOGLE PLAY BILLING VERIFICATION
// ===============================================

/*
export const verifyGooglePlayPurchase = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be authenticated'
      );
    }

    const { packageName, sku, token, transactionId } = data;
    const userId = context.auth.uid;

    try {
      // Get OAuth2 token
      const auth = new google.auth.GoogleAuth({
        projectId: process.env.GCLOUD_PROJECT,
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      });

      const androidpublisher = google.androidpublisher({
        version: 'v3',
        auth,
      });

      // Verify purchase
      const result = await androidpublisher.purchases.products.get({
        packageName,
        productId: sku,
        token,
      });

      const purchase = result.data;

      if (purchase.purchaseState !== 0) {
        // 0 = purchased
        throw new Error('Purchase not completed');
      }

      const skuToPackage: any = {
        diamonds_100: { id: 'starter', diamonds: 100, bonus: 0 },
        diamonds_500: { id: 'basic', diamonds: 500, bonus: 50 },
        diamonds_1200: { id: 'popular', diamonds: 1200, bonus: 200 },
        diamonds_2600: { id: 'premium', diamonds: 2600, bonus: 600 },
        diamonds_6500: { id: 'ultimate', diamonds: 6500, bonus: 1500 },
      };

      const pkg = skuToPackage[sku];
      const totalDiamonds = pkg.diamonds + pkg.bonus;

      // Complete transaction
      await admin
        .firestore()
        .collection(`users/${userId}/transactions`)
        .doc(transactionId)
        .update({
          status: 'completed',
          externalId: purchase.orderId,
        });

      // Award diamonds
      await admin
        .firestore()
        .collection('users')
        .doc(userId)
        .update({
          diamonds: admin.firestore.FieldValue.increment(totalDiamonds),
        });

      return { success: true, diamonds: totalDiamonds };
    } catch (error) {
      console.error('Google Play verification error:', error);
      throw new functions.https.HttpsError('internal', 'Verification failed');
    }
  }
);
*/

// ===============================================
// 4️⃣ DIAMOND SPENDING (In-Game Purchases)
// ===============================================

/*
export const spendDiamonds = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
    );
  }

  const { amount, reason } = data;
  const userId = context.auth.uid;

  try {
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    if ((userData?.diamonds || 0) < amount) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient diamonds');
    }

    await userRef.update({
      diamonds: admin.firestore.FieldValue.increment(-amount),
    });

    // Log transaction
    await admin
      .firestore()
      .collection(`users/${userId}/analytics`)
      .add({
        type: 'diamond_spend',
        amount,
        reason,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        date: new Date().toISOString().split('T')[0],
      });

    return { success: true, remaining: (userData?.diamonds || 0) - amount };
  } catch (error) {
    console.error('Diamond spend error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to spend diamonds');
  }
});
*/

// ===============================================
// 5️⃣ ANALYTICS - REVENUE TRACKING
// ===============================================

/*
export const getDashboardMetrics = functions.https.onCall(
  async (data, context) => {
    // Admin only
    const { month } = data;

    try {
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;

      const snapshot = await admin
        .firestore()
        .collectionGroup('transactions')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .where('status', '==', 'completed')
        .get();

      let totalRevenue = 0;
      let totalPurchases = 0;
      let totalDiamonds = 0;

      snapshot.forEach((doc) => {
        const txn = doc.data();
        totalRevenue += txn.amount;
        totalPurchases++;
        totalDiamonds += txn.diamondsReceived;
      });

      const avgOrderValue = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;

      return {
        totalRevenue,
        totalPurchases,
        totalDiamonds,
        avgOrderValue,
        month,
      };
    } catch (error) {
      console.error('Dashboard metrics error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to get metrics');
    }
  }
);
*/

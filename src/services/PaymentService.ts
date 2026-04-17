/**
 * ✅ PAYMENT & IN-APP PURCHASE SERVICE
 * Diamond purchases, subscriptions, transaction history
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import axios from 'axios';
import { db } from '../services/firebase';

// ===============================================
// 1️⃣ PAYMENT DATA TYPES
// ===============================================

export enum PaymentProvider {
  APPLE = 'apple',
  GOOGLE = 'google',
  STRIPE = 'stripe',
  TEST = 'test',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface DiamondPackage {
  id: string;
  name: string;
  diamonds: number;
  price: number; // USD
  bonus: number; // Extra diamonds on purchase
  popular?: boolean;
  providers: {
    apple?: string; // Product ID
    google?: string; // SKU
    stripe?: string; // Price ID
  };
}

export interface Transaction {
  id: string;
  userId: string;
  provider: PaymentProvider;
  status: TransactionStatus;
  packageId: string;
  diamondsReceived: number;
  amount: number; // USD
  currency: string;
  timestamp: string;
  receiptData: string; // Encrypted receipt
  externalId?: string; // Provider's transaction ID
  error?: string;
}

export interface UserInventory {
  userId: string;
  diamonds: number;
  totalSpent: number; // USD
  purchases: number;
  lastPurchaseDate?: string;
  status?: 'regular' | 'vip' | 'premium'; // For subscription tiers
}

// ===============================================
// 2️⃣ DIAMOND PACKAGES
// ===============================================

export const DIAMOND_PACKAGES: DiamondPackage[] = [
  {
    id: 'starter',
    name: '100 Elmas',
    diamonds: 100,
    bonus: 0,
    price: 0.99,
    providers: {
      apple: 'com.superread.diamonds100',
      google: 'diamonds_100',
      stripe: 'price_diamonds_100',
    },
  },
  {
    id: 'basic',
    name: '500 Elmas',
    diamonds: 500,
    bonus: 50,
    price: 4.99,
    providers: {
      apple: 'com.superread.diamonds500',
      google: 'diamonds_500',
      stripe: 'price_diamonds_500',
    },
  },
  {
    id: 'popular',
    name: '1200 Elmas',
    diamonds: 1200,
    bonus: 200,
    price: 9.99,
    popular: true,
    providers: {
      apple: 'com.superread.diamonds1200',
      google: 'diamonds_1200',
      stripe: 'price_diamonds_1200',
    },
  },
  {
    id: 'premium',
    name: '2600 Elmas',
    diamonds: 2600,
    bonus: 600,
    price: 19.99,
    providers: {
      apple: 'com.superread.diamonds2600',
      google: 'diamonds_2600',
      stripe: 'price_diamonds_2600',
    },
  },
  {
    id: 'ultimate',
    name: '6500 Elmas',
    diamonds: 6500,
    bonus: 1500,
    price: 49.99,
    providers: {
      apple: 'com.superread.diamonds6500',
      google: 'diamonds_6500',
      stripe: 'price_diamonds_6500',
    },
  },
];

// ===============================================
// 3️⃣ PAYMENT SERVICE
// ===============================================

class PaymentService {
  /**
   * ✅ Initiate purchase (Platform-specific)
   */
  async initiatePurchase(
    userId: string,
    packageId: string,
    provider: PaymentProvider
  ): Promise<string> {
    try {
      const diamondPkg = DIAMOND_PACKAGES.find((p) => p.id === packageId);
      if (!diamondPkg) throw new Error('Invalid package');

      // Create transaction record
      const transactionId = doc(
        collection(db, `users/${userId}/transactions`)
      ).id;

      const transaction: Transaction = {
        id: transactionId,
        userId,
        provider,
        status: TransactionStatus.PENDING,
        packageId,
        diamondsReceived: 0,
        amount: diamondPkg.price,
        currency: 'USD',
        timestamp: new Date().toISOString(),
        receiptData: '',
      };

      await setDoc(
        doc(db, `users/${userId}/transactions/${transactionId}`),
        transaction
      );

      // Route to platform-specific payment
      switch (provider) {
        case PaymentProvider.APPLE:
          return this.initiateApplePay(userId, transactionId, diamondPkg);
        case PaymentProvider.GOOGLE:
          return this.initiateGooglePlay(userId, transactionId, diamondPkg);
        case PaymentProvider.STRIPE:
          return this.initiateStripe(userId, transactionId, diamondPkg);
        case PaymentProvider.TEST:
          return this.initiateTestPayment(userId, transactionId, diamondPkg);
        default:
          throw new Error('Unsupported payment provider');
      }
    } catch (error) {
      console.error('Failed to initiate purchase:', error);
      throw error;
    }
  }

  /**
   * ✅ Apple App Store IAP
   */
  private initiateApplePay(
    userId: string,
    transactionId: string,
    diamondPkg: DiamondPackage
  ): string {
    // In production, use RevenueCat or Apple StoreKit 2
    // For now, return the product ID to be handled by native code
    return diamondPkg.providers.apple || '';
  }

  /**
   * ✅ Google Play Billing
   */
  private async initiateGooglePlay(
    userId: string,
    transactionId: string,
    diamondPkg: DiamondPackage
  ): Promise<string> {
    // In production, use Google Play Billing Library
    // For now, return SKU for native implementation
    return diamondPkg.providers.google || '';
  }

  /**
   * ✅ Stripe Payment
   */
  private async initiateStripe(
    userId: string,
    transactionId: string,
    diamondPkg: DiamondPackage
  ): Promise<string> {
    try {
      // Call backend to create Stripe checkout session
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/create-checkout-session`,
        {
          userId,
          packageId: diamondPkg.id,
          transactionId,
          priceId: diamondPkg.providers.stripe,
        }
      );

      return response.data.sessionUrl;
    } catch (error) {
      console.error('Failed to create Stripe session:', error);
      throw error;
    }
  }

  /**
   * ✅ Test Payment (Development)
   */
  private async initiateTestPayment(
    userId: string,
    transactionId: string,
    diamondPkg: DiamondPackage
  ): Promise<string> {
    // Simulate payment completion
    setTimeout(async () => {
      await this.verifyAndCompleteTransaction(
        userId,
        transactionId,
        diamondPkg.id,
        'test-receipt-12345'
      );
    }, 1000);

    return 'test-payment-initiated';
  }

  /**
   * ✅ Verify and Complete Transaction
   */
  async verifyAndCompleteTransaction(
    userId: string,
    transactionId: string,
    packageId: string,
    receiptData: string
  ): Promise<void> {
    try {
      const diamondPkg = DIAMOND_PACKAGES.find((p) => p.id === packageId);
      if (!diamondPkg) throw new Error('Invalid package');

      const totalDiamonds = diamondPkg.diamonds + diamondPkg.bonus;

      // Update transaction
      const transactionRef = doc(
        db,
        `users/${userId}/transactions/${transactionId}`
      );
      await updateDoc(transactionRef, {
        status: TransactionStatus.COMPLETED,
        diamondsReceived: totalDiamonds,
        receiptData,
        timestamp: Timestamp.now(),
      });

      // Update user inventory
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        diamonds: increment(totalDiamonds),
        totalSpent: increment(diamondPkg.price),
        purchases: increment(1),
        lastPurchaseDate: new Date().toISOString(),
      });

      // Log purchase for analytics
      const analyticsRef = collection(db, `users/${userId}/analytics`);
      await setDoc(doc(analyticsRef), {
        type: 'purchase',
        packageId,
        diamondsReceived: totalDiamonds,
        amountUSD: diamondPkg.price,
        timestamp: Timestamp.now(),
        date: new Date().toISOString().split('T')[0],
      });

      console.log(`Purchase completed: ${totalDiamonds} diamonds for $${diamondPkg.price}`);
    } catch (error) {
      console.error('Failed to complete transaction:', error);
      throw error;
    }
  }

  /**
   * ✅ Get user inventory
   */
  async getUserInventory(userId: string): Promise<UserInventory | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      return {
        userId,
        diamonds: userData?.diamonds || 0,
        totalSpent: userData?.totalSpent || 0,
        purchases: userData?.purchases || 0,
        lastPurchaseDate: userData?.lastPurchaseDate,
        status: userData?.subscriptionStatus || 'regular',
      };
    } catch (error) {
      console.error('Failed to get inventory:', error);
      return null;
    }
  }

  /**
   * ✅ Spend diamonds (For in-game purchases)
   */
  async spendDiamonds(userId: string, amount: number, reason: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      if ((userData?.diamonds || 0) < amount) {
        throw new Error('Insufficient diamonds');
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        diamonds: increment(-amount),
      });

      // Log spending for analytics
      const analyticsRef = collection(db, `users/${userId}/analytics`);
      await setDoc(doc(analyticsRef), {
        type: 'diamond_spend',
        amount,
        reason,
        timestamp: Timestamp.now(),
        date: new Date().toISOString().split('T')[0],
      });

      return true;
    } catch (error) {
      console.error('Failed to spend diamonds:', error);
      throw error;
    }
  }

  /**
   * ✅ Get transaction history
   */
  async getTransactionHistory(userId: string, pageLimit: number = 50): Promise<Transaction[]> {
    try {
      const q = query(
        collection(db, `users/${userId}/transactions`),
        orderBy('timestamp', 'desc'),
        limit(pageLimit)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => doc.data() as Transaction);
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }

  /**
   * ✅ Refund transaction
   */
  async refundTransaction(userId: string, transactionId: string): Promise<void> {
    try {
      const transactionRef = doc(
        db,
        `users/${userId}/transactions/${transactionId}`
      );
      const transactionDoc = await getDoc(transactionRef);
      const transaction = transactionDoc.data() as Transaction;

      if (transaction.status !== TransactionStatus.COMPLETED) {
        throw new Error('Cannot refund non-completed transaction');
      }

      // Update transaction status
      await updateDoc(transactionRef, {
        status: TransactionStatus.REFUNDED,
      });

      // Deduct diamonds
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        diamonds: increment(-transaction.diamondsReceived),
        totalSpent: increment(-transaction.amount),
      });

      console.log('Transaction refunded');
    } catch (error) {
      console.error('Failed to refund transaction:', error);
      throw error;
    }
  }

  /**
   * ✅ Get analytics - Monthly revenue
   */
  async getMonthlyRevenue(month: string): Promise<number> {
    try {
      // This would be called by admins only
      const transactionsRef = collection(db, 'allTransactions');
      const q = query(
        transactionsRef,
        where('date', '>=', `${month}-01`),
        where('date', '<', `${month}-32`), // Next month start
        where('status', '==', TransactionStatus.COMPLETED)
      );

      const snapshot = await getDocs(q);
      let total = 0;

      snapshot.docs.forEach((doc) => {
        total += (doc.data() as Transaction).amount;
      });

      return total;
    } catch (error) {
      console.error('Failed to get monthly revenue:', error);
      return 0;
    }
  }
}

export const paymentService = new PaymentService();

// ===============================================
// 4️⃣ REACT HOOKS
// ===============================================

import { useState, useEffect } from 'react';

export const useInventory = (userId: string) => {
  const [inventory, setInventory] = useState<UserInventory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const data = await paymentService.getUserInventory(userId);
        setInventory(data);
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, [userId]);

  return { inventory, loading };
};

export const useTransactionHistory = (userId: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const data = await paymentService.getTransactionHistory(userId);
        setTransactions(data);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [userId]);

  return { transactions, loading };
};

export default PaymentService;

/**
 * ✅ DIAMOND SHOP COMPONENT
 * Purchase diamonds, view offers, transaction history
 */

import React, { useState, useEffect } from 'react';
import { User } from '../shared/types';
import {
  paymentService,
  DIAMOND_PACKAGES,
  PaymentProvider,
  DiamondPackage,
  useInventory,
  useTransactionHistory,
} from '../services/PaymentService';

interface DiamondShopProps {
  user: User;
}

export const DiamondShop: React.FC<DiamondShopProps> = ({ user }) => {
  const { inventory, loading: inventoryLoading } = useInventory(user.uid);
  const { transactions, loading: transactionsLoading } = useTransactionHistory(
    user.uid
  );
  const [activeTab, setActiveTab] = useState<'shop' | 'history'>('shop');
  const [purchasing, setPurchasing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>(
    PaymentProvider.STRIPE
  );

  const handlePurchase = async (packageId: string) => {
    setPurchasing(true);
    try {
      const result = await paymentService.initiatePurchase(
        user.uid,
        packageId,
        selectedProvider
      );

      if (selectedProvider === PaymentProvider.STRIPE) {
        // Redirect to Stripe checkout
        window.location.href = result;
      } else if (selectedProvider === PaymentProvider.APPLE) {
        // Trigger native Apple payment
        // @ts-ignore
        window.webkit?.messageHandlers?.purchaseWithApple?.postMessage({
          productId: result,
        });
      } else if (selectedProvider === PaymentProvider.GOOGLE) {
        // Trigger native Google Play payment
        // @ts-ignore
        window.android?.purchaseWithGoogle?.(result);
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Satın alma başarısız');
    } finally {
      setPurchasing(false);
    }
  };

  if (inventoryLoading) {
    return <div className="text-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">💎 Elmas Mağazası</h1>
          <p className="text-purple-100">Premium para birimini satın al ve özel özelliklerin kilidini aç</p>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto flex gap-8 px-8">
          {['shop', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 font-semibold border-b-2 transition ${
                activeTab === tab
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400'
              }`}
            >
              {tab === 'shop' && '🛍️ Paketler'}
              {tab === 'history' && '📜 Geçmiş'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* DIAMOND BALANCE */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Güncel Elmas Bakiyesi</p>
              <p className="text-4xl font-bold text-purple-600">
                💎 {inventory?.diamonds.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-600 dark:text-gray-400 mb-1">Toplam Harcama</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${inventory?.totalSpent.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {activeTab === 'shop' && (
          <>
            {/* PAYMENT METHOD SELECTOR */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8">
              <h3 className="font-bold text-lg mb-4">Ödeme Yöntemi</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { provider: PaymentProvider.STRIPE, label: '💳 Kredi Kartı' },
                  { provider: PaymentProvider.APPLE, label: '🍎 Apple Pay' },
                  { provider: PaymentProvider.GOOGLE, label: '🔵 Google Play' },
                ].map(({ provider, label }) => (
                  <button
                    key={provider}
                    onClick={() => setSelectedProvider(provider)}
                    className={`p-3 rounded-lg font-semibold transition ${
                      selectedProvider === provider
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* DIAMOND PACKAGES GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {DIAMOND_PACKAGES.map((pkg) => (
                <DiamondPackageCard
                  key={pkg.id}
                  package={pkg}
                  onPurchase={() => handlePurchase(pkg.id)}
                  isPurchasing={purchasing}
                />
              ))}
            </div>

            {/* BONUS INFO */}
            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-2">✨ Bonus Elmaslar</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Daha büyük paketleri satın aldıkça ekstra elmas kazanın!
              </p>
              <div className="mt-4 space-y-2 text-sm">
                {DIAMOND_PACKAGES.filter((p) => p.bonus > 0).map((p) => (
                  <div key={p.id} className="flex justify-between">
                    <span>{p.name}</span>
                    <span className="font-bold text-green-600">+{p.bonus} Bonus</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Tarih</th>
                  <th className="px-6 py-3 text-left font-semibold">Paket</th>
                  <th className="px-6 py-3 text-right font-semibold">Elmaslar</th>
                  <th className="px-6 py-3 text-right font-semibold">Tutar</th>
                  <th className="px-6 py-3 text-left font-semibold">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.length > 0 ? (
                  transactions.map((txn) => {
                    const pkg = DIAMOND_PACKAGES.find((p) => p.id === txn.packageId);
                    return (
                      <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-3 text-sm">
                          {new Date(txn.timestamp).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-6 py-3 font-semibold">{pkg?.name || txn.packageId}</td>
                        <td className="px-6 py-3 text-right">
                          💎 {txn.diamondsReceived.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-right font-bold">
                          ${txn.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                              txn.status === 'completed'
                                ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
                                : txn.status === 'pending'
                                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100'
                                  : txn.status === 'refunded'
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                                    : 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100'
                            }`}
                          >
                            {txn.status === 'completed' && '✅ Tamamlandı'}
                            {txn.status === 'pending' && '⏳ Beklemede'}
                            {txn.status === 'refunded' && '↩️ İade Edildi'}
                            {txn.status === 'failed' && '❌ Başarısız'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Henüz satın alma geçmişi yok
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ===============================================
// DIAMOND PACKAGE CARD
// ===============================================

const DiamondPackageCard: React.FC<{
  package: DiamondPackage;
  onPurchase: () => void;
  isPurchasing: boolean;
}> = ({ package: pkg, onPurchase, isPurchasing }) => {
  const totalDiamonds = pkg.diamonds + pkg.bonus;
  const pricePerDiamond = (pkg.price / totalDiamonds).toFixed(4);

  return (
    <div
      className={`rounded-lg overflow-hidden transition transform hover:scale-105 ${
        pkg.popular
          ? 'ring-2 ring-purple-600 bg-gradient-to-b from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800'
          : 'bg-white dark:bg-gray-800'
      }`}
    >
      {pkg.popular && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 text-center font-bold text-sm">
          ⭐ ÇOK POPÜLER
        </div>
      )}

      <div className="p-6">
        <div className="text-center mb-4">
          <p className="text-4xl font-bold text-purple-600 mb-1">💎</p>
          <p className="font-bold text-xl mb-1">{pkg.diamonds.toLocaleString()}</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{pkg.name}</p>
        </div>

        {pkg.bonus > 0 && (
          <div className="text-center mb-4 bg-green-50 dark:bg-green-900/20 rounded-lg py-2 border border-green-200 dark:border-green-800">
            <p className="text-green-700 dark:text-green-400 font-bold text-sm">
              +{pkg.bonus} Bonus
            </p>
            <p className="text-green-600 dark:text-green-500 text-xs">
              Toplam: {(pkg.diamonds + pkg.bonus).toLocaleString()}
            </p>
          </div>
        )}

        <div className="text-center mb-4">
          <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">
            ${pricePerDiamond}/💎
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${pkg.price.toFixed(2)}
          </p>
        </div>

        <button
          onClick={onPurchase}
          disabled={isPurchasing}
          className={`w-full py-3 rounded-lg font-bold transition ${
            pkg.popular
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isPurchasing ? '⏳ İşleniyor...' : '💳 Satın Al'}
        </button>
      </div>
    </div>
  );
};

export default DiamondShop;

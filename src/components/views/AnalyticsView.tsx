/**
 * ✅ ANALYTICS COMPONENT - React Implementation
 */

import React from 'react';
import { AnalyticsDashboard } from '../services/AnalyticsService';
import { User } from '../shared/types';

export const AnalyticsView: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Analytics Panosu
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Detaylı istatistikler ve performans analizi
          </p>
        </div>

        <AnalyticsDashboard user={user} />

        {/* ADDITIONAL INFO */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-2">💡 İpucu</h3>
          <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>• Tutarlılık, puanlarınızın istikrarını gösterir</li>
            <li>• En iyi skor, herhangi bir modülde ulaştığınız en yüksek puan</li>
            <li>• Haftalık aktivite, eğitim ve duel performansını gösterir</li>
            <li>• Strekinizi koruduğunuz sürece günlük bonuslar alırsınız</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;

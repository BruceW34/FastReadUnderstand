/**
 * ✅ ADVANCED ANALYTICS DASHBOARD
 * Real-time stats, trends, performance metrics
 */

import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  limit,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { User } from '../shared/types';

// ===============================================
// 1️⃣ ANALYTICS DATA TYPES
// ===============================================

export interface AnalyticsMetrics {
  totalWPM: number;
  averageWPM: number;
  maxWPM: number;
  totalXP: number;
  totalDuels: number;
  duelWinRate: number;
  totalTrainings: number;
  streakDays: number;
  achievements: number;
  level: number;
}

export interface DailyStats {
  date: string;
  trainings: number;
  xpGained: number;
  duelsPlayed: number;
  duelsWon: number;
  averageWPM: number;
}

export interface ActivityTrend {
  week: number;
  trainings: number;
  xp: number;
  duels: number;
}

export interface PerformanceMetric {
  moduleType: string;
  avgWPM: number;
  attempts: number;
  bestScore: number;
  consistency: number; // 0-100
}

// ===============================================
// 2️⃣ ANALYTICS SERVICE
// ===============================================

class AnalyticsService {
  /**
   * ✅ Get user metrics
   */
  async getUserMetrics(userId: string): Promise<AnalyticsMetrics> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      // Get training stats
      const trainingsRef = collection(db, `users/${userId}/trainings`);
      const trainingsSnap = await getDocs(query(trainingsRef, limit(1000)));
      const trainings = trainingsSnap.docs.map((doc) => doc.data());

      // Get duel stats
      const duelsRef = collection(db, `users/${userId}/duels`);
      const duelsSnap = await getDocs(query(duelsRef, limit(500)));
      const duels = duelsSnap.docs.map((doc) => doc.data());

      // Calculate metrics
      const avgWPM =
        trainings.length > 0
          ? trainings.reduce((sum, t) => sum + (t.wpm || 0), 0) / trainings.length
          : 0;

      const maxWPM = trainings.length > 0
        ? Math.max(...trainings.map((t) => t.wpm || 0))
        : 0;

      const duelWinRate =
        duels.length > 0
          ? (duels.filter((d) => d.result === 'win').length / duels.length) * 100
          : 0;

      return {
        totalWPM: userData?.totalWPM || 0,
        averageWPM: Math.round(avgWPM),
        maxWPM: Math.round(maxWPM),
        totalXP: userData?.xp || 0,
        totalDuels: duels.length,
        duelWinRate: Math.round(duelWinRate),
        totalTrainings: trainings.length,
        streakDays: userData?.streak || 0,
        achievements: userData?.achievements?.length || 0,
        level: userData?.level || 1,
      };
    } catch (error) {
      console.error('Failed to get user metrics:', error);
      throw error;
    }
  }

  /**
   * ✅ Get daily statistics (last 30 days)
   */
  async getDailyStats(userId: string): Promise<DailyStats[]> {
    const dailyStats: DailyStats[] = [];
    const today = new Date();

    try {
      const analyticsRef = collection(db, `users/${userId}/analytics`);
      const analyticsSnap = await getDocs(analyticsRef);

      // Group by date
      const byDate: Record<string, any> = {};
      analyticsSnap.forEach((doc) => {
        const data = doc.data();
        const date = new Date(data.timestamp).toISOString().split('T')[0];

        if (!byDate[date]) {
          byDate[date] = {
            date,
            trainings: 0,
            xpGained: 0,
            duelsPlayed: 0,
            duelsWon: 0,
            wpmScores: [],
          };
        }

        if (data.type === 'training') {
          byDate[date].trainings++;
          byDate[date].xpGained += data.xp || 0;
          byDate[date].wpmScores.push(data.wpm || 0);
        } else if (data.type === 'duel') {
          byDate[date].duelsPlayed++;
          if (data.result === 'win') byDate[date].duelsWon++;
        }
      });

      // Convert to array with averages
      Object.values(byDate).forEach((day: any) => {
        dailyStats.push({
          date: day.date,
          trainings: day.trainings,
          xpGained: day.xpGained,
          duelsPlayed: day.duelsPlayed,
          duelsWon: day.duelsWon,
          averageWPM:
            day.wpmScores.length > 0
              ? Math.round(
                  day.wpmScores.reduce((a: number, b: number) => a + b) /
                    day.wpmScores.length
                )
              : 0,
        });
      });

      return dailyStats.sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    } catch (error) {
      console.error('Failed to get daily stats:', error);
      return [];
    }
  }

  /**
   * ✅ Get performance by module
   */
  async getPerformanceByModule(userId: string): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];

    try {
      const trainingsRef = collection(db, `users/${userId}/trainings`);
      const trainingsSnap = await getDocs(trainingsRef);

      const byModule: Record<string, any> = {};

      trainingsSnap.forEach((doc) => {
        const data = doc.data();
        const module = data.moduleType;

        if (!byModule[module]) {
          byModule[module] = {
            scores: [],
            attempts: 0,
            bestScore: 0,
          };
        }

        byModule[module].scores.push(data.wpm || data.score || 0);
        byModule[module].attempts++;
        byModule[module].bestScore = Math.max(
          byModule[module].bestScore,
          data.wpm || data.score || 0
        );
      });

      // Calculate consistency and averages
      Object.entries(byModule).forEach(([module, data]: [string, any]) => {
        const avgScore =
          data.scores.reduce((a: number, b: number) => a + b, 0) /
          data.scores.length;

        // Calculate consistency (std deviation normalized)
        const variance =
          data.scores.reduce(
            (sum: number, score: number) => sum + Math.pow(score - avgScore, 2),
            0
          ) / data.scores.length;
        const stdDev = Math.sqrt(variance);
        const consistency = Math.max(0, 100 - stdDev / avgScore);

        metrics.push({
          moduleType: module,
          avgWPM: Math.round(avgScore),
          attempts: data.attempts,
          bestScore: data.bestScore,
          consistency: Math.round(consistency),
        });
      });

      return metrics.sort((a, b) => b.avgWPM - a.avgWPM);
    } catch (error) {
      console.error('Failed to get module performance:', error);
      return [];
    }
  }

  /**
   * ✅ Get weekly trends
   */
  async getWeeklyTrends(userId: string): Promise<ActivityTrend[]> {
    const trends: ActivityTrend[] = [];

    try {
      const analyticsRef = collection(db, `users/${userId}/analytics`);
      const analyticsSnap = await getDocs(analyticsRef);

      const byWeek: Record<number, any> = {};

      analyticsSnap.forEach((doc) => {
        const data = doc.data();
        const date = new Date(data.timestamp);
        const week = Math.floor(
          (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) /
            (7 * 24 * 60 * 60 * 1000)
        );

        if (!byWeek[week]) {
          byWeek[week] = { week, trainings: 0, xp: 0, duels: 0 };
        }

        if (data.type === 'training') {
          byWeek[week].trainings++;
          byWeek[week].xp += data.xp || 0;
        } else if (data.type === 'duel') {
          byWeek[week].duels++;
          byWeek[week].xp += data.xp || 0;
        }
      });

      return Object.values(byWeek).sort((a, b) => a.week - b.week);
    } catch (error) {
      console.error('Failed to get trends:', error);
      return [];
    }
  }
}

export const analyticsService = new AnalyticsService();

// ===============================================
// 3️⃣ REACT COMPONENT - ANALYTICS DASHBOARD
// ===============================================

export const AnalyticsDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [modulePerformance, setModulePerformance] = useState<PerformanceMetric[]>([]);
  const [trends, setTrends] = useState<ActivityTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [metrics, daily, modules, weeklyTrends] = await Promise.all([
          analyticsService.getUserMetrics(user.uid),
          analyticsService.getDailyStats(user.uid),
          analyticsService.getPerformanceByModule(user.uid),
          analyticsService.getWeeklyTrends(user.uid),
        ]);

        setMetrics(metrics);
        setDailyStats(daily);
        setModulePerformance(modules);
        setTrends(weeklyTrends);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [user.uid]);

  if (loading) {
    return <div className="text-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* KEY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Ortalama WPM"
          value={metrics?.averageWPM || 0}
          unit="wpm"
          icon="📊"
        />
        <MetricCard
          title="Toplam XP"
          value={metrics?.totalXP || 0}
          unit="xp"
          icon="⭐"
        />
        <MetricCard
          title="Düello Başarı"
          value={metrics?.duelWinRate || 0}
          unit="%"
          icon="🏆"
        />
        <MetricCard
          title="Günlük Seri"
          value={metrics?.streakDays || 0}
          unit="gün"
          icon="🔥"
        />
      </div>

      {/* PERFORMANCE BY MODULE */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Modüllere Göre Performans</h3>
        <div className="space-y-3">
          {modulePerformance.map((perf) => (
            <div key={perf.moduleType} className="flex items-center gap-4">
              <div className="flex-1">
                <h4 className="font-semibold">{perf.moduleType}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {perf.attempts} deneme
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{perf.avgWPM} WPM</div>
                <div className="text-sm">
                  Tutarlılık: {Math.round(perf.consistency)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DAILY ACTIVITY CHART */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Haftalık Aktivite</h3>
        <div className="space-y-2">
          {trends.slice(-7).map((trend) => (
            <ActivityBar
              key={trend.week}
              label={`Hafta ${trend.week}`}
              trainings={trend.trainings}
              duels={trend.duels}
              xp={trend.xp}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ===============================================
// HELPER COMPONENTS
// ===============================================

const MetricCard: React.FC<{
  title: string;
  value: number;
  unit: string;
  icon: string;
}> = ({ title, value, unit, icon }) => (
  <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm opacity-80">{title}</p>
        <p className="text-2xl font-bold">
          {value.toLocaleString()} {unit}
        </p>
      </div>
      <div className="text-4xl">{icon}</div>
    </div>
  </div>
);

const ActivityBar: React.FC<{
  label: string;
  trainings: number;
  duels: number;
  xp: number;
}> = ({ label, trainings, duels, xp }) => {
  const maxXp = 5000;
  const width = Math.min((xp / maxXp) * 100, 100);

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-semibold">{label}</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {trainings} eğitim • {duels} düello • {xp} XP
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

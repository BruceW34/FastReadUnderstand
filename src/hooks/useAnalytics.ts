/**
 * ✅ ANALYTICS HOOKS - React Integration
 * Custom hooks for analytics data in components
 */

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  AnalyticsMetrics,
  DailyStats,
  analyticsService,
} from '../services/AnalyticsService';

// ===============================================
// 1️⃣ USE USER METRICS
// ===============================================

export const useUserMetrics = (userId: string) => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await analyticsService.getUserMetrics(userId);
        setMetrics(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [userId]);

  return { metrics, loading, error };
};

// ===============================================
// 2️⃣ USE DAILY STATS
// ===============================================

export const useDailyStats = (userId: string, days: number = 30) => {
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await analyticsService.getDailyStats(userId);
        // Get last N days
        setStats(data.slice(-days));
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userId, days]);

  return { stats, loading };
};

// ===============================================
// 3️⃣ USE ACTIVITY COMPARISON
// ===============================================

export interface ActivityComparison {
  period: string;
  totalXP: number;
  totalDuels: number;
  totalTrainings: number;
  avgWPM: number;
}

export const useActivityComparison = (userId: string) => {
  const [thisWeek, setThisWeek] = useState<ActivityComparison | null>(null);
  const [lastWeek, setLastWeek] = useState<ActivityComparison | null>(null);
  const [improvement, setImprovement] = useState(0);

  useEffect(() => {
    const loadComparison = async () => {
      try {
        const analyticsRef = collection(db, `users/${userId}/analytics`);
        const snap = await getDocs(analyticsRef);

        const now = new Date();
        const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const lastWeekStart = new Date(
          thisWeekStart.setDate(thisWeekStart.getDate() - 7)
        );

        let thisWeekData: any = {
          totalXP: 0,
          totalDuels: 0,
          totalTrainings: 0,
          wpmScores: [],
        };
        let lastWeekData: any = {
          totalXP: 0,
          totalDuels: 0,
          totalTrainings: 0,
          wpmScores: [],
        };

        snap.forEach((doc) => {
          const data = doc.data();
          const date = new Date(data.timestamp);

          const target = date >= thisWeekStart ? thisWeekData : lastWeekData;

          if (data.type === 'training') {
            target.totalTrainings++;
            target.wpmScores.push(data.wpm);
            target.totalXP += data.xp || 0;
          } else if (data.type === 'duel') {
            target.totalDuels++;
            target.wpmScores.push(data.wpm);
            target.totalXP += data.xp || 0;
          }
        });

        const thisWeekAvgWPM =
          thisWeekData.wpmScores.length > 0
            ? Math.round(
                thisWeekData.wpmScores.reduce((a: number, b: number) => a + b, 0) /
                  thisWeekData.wpmScores.length
              )
            : 0;

        const lastWeekAvgWPM =
          lastWeekData.wpmScores.length > 0
            ? Math.round(
                lastWeekData.wpmScores.reduce((a: number, b: number) => a + b, 0) /
                  lastWeekData.wpmScores.length
              )
            : 0;

        setThisWeek({
          period: 'Bu Hafta',
          totalXP: thisWeekData.totalXP,
          totalDuels: thisWeekData.totalDuels,
          totalTrainings: thisWeekData.totalTrainings,
          avgWPM: thisWeekAvgWPM,
        });

        setLastWeek({
          period: 'Geçen Hafta',
          totalXP: lastWeekData.totalXP,
          totalDuels: lastWeekData.totalDuels,
          totalTrainings: lastWeekData.totalTrainings,
          avgWPM: lastWeekAvgWPM,
        });

        const improvementPercent =
          lastWeekAvgWPM > 0
            ? ((thisWeekAvgWPM - lastWeekAvgWPM) / lastWeekAvgWPM) * 100
            : 0;
        setImprovement(Math.round(improvementPercent));
      } catch (error) {
        console.error('Failed to load activity comparison:', error);
      }
    };

    loadComparison();
  }, [userId]);

  return { thisWeek, lastWeek, improvement };
};

// ===============================================
// 4️⃣ USE RANK POSITION
// ===============================================

export interface RankPosition {
  rank: number;
  totalPlayers: number;
  percentile: number;
}

export const useRankPosition = (userId: string, metric: 'xp' | 'level' | 'winrate' = 'xp') => {
  const [position, setPosition] = useState<RankPosition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRank = async () => {
      try {
        const usersRef = collection(db, 'users');
        const snap = await getDocs(usersRef);

        const users = snap.docs.map((doc) => ({
          id: doc.id,
          xp: doc.data().xp || 0,
          level: doc.data().level || 1,
          winrate:
            doc.data().totalDuels > 0
              ? (doc.data().duelWins / doc.data().totalDuels) * 100
              : 0,
        }));

        const sortedUsers =
          metric === 'xp'
            ? users.sort((a, b) => b.xp - a.xp)
            : metric === 'level'
              ? users.sort((a, b) => b.level - a.level)
              : users.sort((a, b) => b.winrate - a.winrate);

        const rank = sortedUsers.findIndex((u) => u.id === userId) + 1;
        const percentile = Math.round(((sortedUsers.length - rank) / sortedUsers.length) * 100);

        setPosition({
          rank,
          totalPlayers: sortedUsers.length,
          percentile,
        });
      } catch (error) {
        console.error('Failed to load rank position:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRank();
  }, [userId, metric]);

  return { position, loading };
};

// ===============================================
// 5️⃣ USE STREAK
// ===============================================

export const useStreak = (userId: string) => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [daysInStreak, setDaysInStreak] = useState<string[]>([]);

  useEffect(() => {
    const loadStreak = async () => {
      try {
        const analyticsRef = collection(db, `users/${userId}/analytics`);
        const snap = await getDocs(analyticsRef);

        const dates = new Set<string>();
        snap.forEach((doc) => {
          const data = doc.data();
          const date = new Date(data.timestamp).toISOString().split('T')[0];
          dates.add(date);
        });

        const sortedDates = Array.from(dates).sort().reverse();

        // Calculate current streak
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        let currentDate = new Date();

        for (let i = 0; i < 365; i++) {
          const dateStr = currentDate.toISOString().split('T')[0];
          if (dates.has(dateStr)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else if (dateStr === today) {
            // Skip today if no activity yet
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }

        setCurrentStreak(streak);
        setBestStreak(Math.max(...sortedDates.map((_, i) => i + 1), 0));
        setDaysInStreak(sortedDates.slice(0, 30));
      } catch (error) {
        console.error('Failed to load streak:', error);
      }
    };

    loadStreak();
  }, [userId]);

  return { currentStreak, bestStreak, daysInStreak };
};

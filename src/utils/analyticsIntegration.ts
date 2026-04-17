/**
 * ✅ ANALYTICS INTEGRATION UTILITIES
 * Helper functions to log analytics when users complete actions
 */

import { doc, setDoc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

// ===============================================
// 1️⃣ LOG TRAINING COMPLETION
// ===============================================

export interface TrainingLogData {
  userId: string;
  moduleType: string;
  wpm: number;
  accuracy: number;
  xp: number;
  duration: number; // in seconds
  score?: number;
  textId?: string;
}

export const logTrainingCompletion = async (data: TrainingLogData) => {
  try {
    const { userId, moduleType, wpm, accuracy, xp, duration } = data;
    const timestamp = new Date();
    const date = timestamp.toISOString().split('T')[0];

    // 1. Add to analytics collection
    const analyticsRef = doc(
      db,
      `users/${userId}/analytics/${timestamp.getTime()}`
    );
    await setDoc(analyticsRef, {
      type: 'training',
      moduleType,
      wpm,
      accuracy,
      xp,
      duration,
      timestamp,
      date,
    });

    // 2. Update user stats
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    // Calculate streak (improved)
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    let newStreak = userData?.streak || 0;
    
    if (userData?.lastTrainingDate) {
      const lastTraining = new Date(userData.lastTrainingDate);
      const lastTrainingDate = new Date(lastTraining.getFullYear(), lastTraining.getMonth(), lastTraining.getDate());
      
      const daysDiff = Math.floor((todayDate.getTime() - lastTrainingDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        // Same day - no change to streak
        newStreak = userData.streak || 0;
      } else if (daysDiff === 1) {
        // Yesterday was the last training - increment streak
        newStreak = (userData.streak || 0) + 1;
      } else if (daysDiff > 1) {
        // More than 1 day gap - reset streak
        newStreak = 1;
      }
    } else {
      // First time - start new streak
      newStreak = 1;
    }

    const newLevel = Math.floor(((userData?.xp || 0) + xp) / 1000) + 1;

    await updateDoc(userRef, {
      totalWPM: increment(wpm),
      xp: increment(xp),
      lastTrainingDate: today.toISOString(),
      streak: newStreak,
      level: newLevel,
    });

    // 3. Update module-specific stats
    const moduleStatsRef = doc(
      db,
      `users/${userId}/moduleStats/${moduleType}`
    );
    const moduleDoc = await getDoc(moduleStatsRef);
    const moduleData = moduleDoc.data() || {};

    await setDoc(
      moduleStatsRef,
      {
        totalAttempts: (moduleData.totalAttempts || 0) + 1,
        totalXP: (moduleData.totalXP || 0) + xp,
        avgWPM:
          moduleData.avgWPM && moduleData.totalAttempts > 0
            ? ((moduleData.avgWPM * moduleData.totalAttempts + wpm) /
                (moduleData.totalAttempts + 1))
            : wpm,
        bestWPM: Math.max(moduleData.bestWPM || 0, wpm),
        lastAttemptDate: timestamp,
      },
      { merge: true }
    );

    console.log('Training logged successfully');
    return { success: true, streak: newStreak, level: newLevel };
  } catch (error) {
    console.error('Failed to log training:', error);
    throw error;
  }
};

// ===============================================
// 2️⃣ LOG DUEL COMPLETION
// ===============================================

export interface DuelLogData {
  userId: string;
  opponentId: string;
  result: 'win' | 'loss';
  userWPM: number;
  opponentWPM: number;
  userAccuracy: number;
  opponentAccuracy: number;
  duration: number; // in seconds
  xpGained: number;
}

export const logDuelCompletion = async (data: DuelLogData) => {
  try {
    const {
      userId,
      opponentId,
      result,
      userWPM,
      opponentWPM,
      userAccuracy,
      opponentAccuracy,
      duration,
      xpGained,
    } = data;

    const timestamp = new Date();
    const date = timestamp.toISOString().split('T')[0];

    // 1. Log for user
    const userAnalyticsRef = doc(
      db,
      `users/${userId}/analytics/${timestamp.getTime()}`
    );
    await setDoc(userAnalyticsRef, {
      type: 'duel',
      opponentId,
      result,
      userWPM,
      opponentWPM,
      userAccuracy,
      xp: xpGained,
      duration,
      timestamp,
      date,
    });

    // 2. Update user stats
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    const newLevel = Math.floor(((userData?.xp || 0) + xpGained) / 1000) + 1;

    const updateData: any = {
      xp: increment(xpGained),
      level: newLevel,
      totalDuels: increment(1),
    };

    if (result === 'win') {
      updateData.duelWins = increment(1);
    }

    await updateDoc(userRef, updateData);

    // 3. Update opponent's analytics
    const opponentAnalyticsRef = doc(
      db,
      `users/${opponentId}/analytics/${timestamp.getTime()}-opponent`
    );
    const opponentXP = result === 'win' ? 100 : 250; // Loser gets 100, Winner gets 250

    await setDoc(opponentAnalyticsRef, {
      type: 'duel',
      opponentId: userId,
      result: result === 'win' ? 'loss' : 'win',
      userWPM: opponentWPM,
      opponentWPM: userWPM,
      userAccuracy: opponentAccuracy,
      xp: opponentXP,
      duration,
      timestamp,
      date,
    });

    // 4. Update opponent's user stats
    const opponentRef = doc(db, 'users', opponentId);
    await updateDoc(opponentRef, {
      xp: increment(opponentXP),
      totalDuels: increment(1),
      duelWins: result === 'win' ? increment(0) : increment(1),
    });

    console.log('Duel logged successfully');
    return { success: true, level: newLevel };
  } catch (error) {
    console.error('Failed to log duel:', error);
    throw error;
  }
};

// ===============================================
// 3️⃣ UPDATE DAILY SUMMARY
// ===============================================

export const updateDailySummary = async (userId: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const analyticsRef = collection(db, `users/${userId}/analytics`);

    // Get today's data
    const snap = await getDocs(
      query(analyticsRef, where('date', '==', today))
    );

    let trainings = 0;
    let duels = 0;
    let totalXP = 0;
    const wpmScores: number[] = [];

    snap.forEach((doc) => {
      const data = doc.data();
      if (data.type === 'training') {
        trainings++;
        wpmScores.push(data.wpm);
        totalXP += data.xp;
      } else if (data.type === 'duel') {
        duels++;
        wpmScores.push(data.userWPM);
        totalXP += data.xp;
      }
    });

    const avgWpm =
      wpmScores.length > 0
        ? Math.round(wpmScores.reduce((a, b) => a + b, 0) / wpmScores.length)
        : 0;

    // Store daily summary
    const dailyRef = doc(db, `users/${userId}/dailyStats/${today}`);
    await setDoc(
      dailyRef,
      {
        date: today,
        trainings,
        duels,
        totalXP,
        avgWpm,
        sessions: trainings + duels,
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to update daily summary:', error);
  }
};

// ===============================================
// 4️⃣ CHECK & UPDATE ACHIEVEMENTS
// ===============================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (userData: any) => boolean;
  xpReward: number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_training',
    title: 'İlk Adım',
    description: 'İlk eğitimi tamamla',
    icon: '🎯',
    condition: (data) => (data.trainings || 0) >= 1,
    xpReward: 100,
  },
  {
    id: 'speed_demon',
    title: 'Hız İblisi',
    description: '200 WPM\'ye ulaş',
    icon: '⚡',
    condition: (data) => (data.maxWPM || 0) >= 200,
    xpReward: 250,
  },
  {
    id: 'consistency_master',
    title: 'Tutarlılık Ustası',
    description: '10 eğitimde 95%+ başarı',
    icon: '🎪',
    condition: (data) => (data.streak || 0) >= 10,
    xpReward: 300,
  },
  {
    id: 'duel_master',
    title: 'Düello Şampiyonu',
    description: '20 düello kazan',
    icon: '🏆',
    condition: (data) => (data.duelWins || 0) >= 20,
    xpReward: 500,
  },
  {
    id: 'level_10',
    title: 'Seviye 10',
    description: 'Seviye 10\'a ulaş',
    icon: '⭐',
    condition: (data) => (data.level || 1) >= 10,
    xpReward: 1000,
  },
];

export const checkAndUnlockAchievements = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    const unlockedAchievements: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (
        achievement.condition(userData) &&
        !(userData?.achievements || []).includes(achievement.id)
      ) {
        unlockedAchievements.push(achievement);

        // Add to achievements list
        await updateDoc(userRef, {
          achievements: increment(1),
        });
      }
    }

    return unlockedAchievements;
  } catch (error) {
    console.error('Failed to check achievements:', error);
    return [];
  }
};

// ===============================================
// IMPORT STATEMENT FIX
// ===============================================

import { collection, increment, query, where } from 'firebase/firestore';

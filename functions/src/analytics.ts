/**
 * ✅ ANALYTICS CLOUD FUNCTIONS - Backend Templates
 * Deploy to Firebase Cloud Functions for real-time analytics aggregation
 */

// ===============================================
// 1️⃣ LOG TRAINING ACTIVITY
// ===============================================

// firebaseConfig.js
// import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin';

/* 
export const onTrainingComplete = functions.firestore
  .document('users/{userId}/trainings/{docId}')
  .onCreate(async (snapshot, context) => {
    const { userId } = context.params;
    const trainingData = snapshot.data();

    try {
      // Add to analytics collection
      await admin.firestore().collection(`users/${userId}/analytics`).add({
        type: 'training',
        moduleType: trainingData.moduleType,
        wpm: trainingData.wpm,
        accuracy: trainingData.accuracy,
        xp: trainingData.xp,
        duration: trainingData.duration,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        date: new Date().toISOString().split('T')[0],
      });

      // Update user stats
      const userRef = admin.firestore().collection('users').doc(userId);
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      // Calculate new streak
      const lastTraining = new Date(userData.lastTrainingDate || 0);
      const today = new Date();
      const daysDiff = Math.floor(
        (today.getTime() - lastTraining.getTime()) / (1000 * 60 * 60 * 24)
      );

      let newStreak = userData.streak || 0;
      if (daysDiff === 0) {
        // Same day, no streak change
      } else if (daysDiff === 1) {
        // Consecutive day, increment streak
        newStreak++;
      } else {
        // Broken streak
        newStreak = 1;
      }

      await userRef.update({
        totalWPM: (userData.totalWPM || 0) + trainingData.wpm,
        xp: (userData.xp || 0) + trainingData.xp,
        lastTrainingDate: today.toISOString(),
        streak: newStreak,
        level: Math.floor(((userData.xp || 0) + trainingData.xp) / 1000) + 1,
      });
    } catch (error) {
      console.error('Failed to log training:', error);
    }
  });
*/

// ===============================================
// 2️⃣ LOG DUEL ACTIVITY
// ===============================================

/*
export const onDuelComplete = functions.firestore
  .document('duels/{duelId}')
  .onUpdate(async (change, context) => {
    const { duelId } = context.params;
    const duelData = change.after.data();
    const oldData = change.before.data();

    if (oldData.status === 'completed' || duelData.status !== 'completed') {
      return; // Only process when duel becomes completed
    }

    try {
      // Get player info
      const players = duelData.players;
      const winner = duelData.winner;

      for (const playerId of Object.keys(players)) {
        const isWinner = winner === playerId;
        const playerData = players[playerId];

        // Log to user's analytics
        await admin
          .firestore()
          .collection(`users/${playerId}/analytics`)
          .add({
            type: 'duel',
            opponentId: Object.keys(players).find((p) => p !== playerId),
            result: isWinner ? 'win' : 'loss',
            wpm: playerData.finalWpm,
            xp: isWinner ? 250 : 100,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            date: new Date().toISOString().split('T')[0],
          });

        // Update user stats
        const userRef = admin.firestore().collection('users').doc(playerId);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        const xpGain = isWinner ? 250 : 100;
        await userRef.update({
          xp: (userData.xp || 0) + xpGain,
          level: Math.floor(((userData.xp || 0) + xpGain) / 1000) + 1,
          totalDuels: (userData.totalDuels || 0) + 1,
          duelWins: isWinner ? (userData.duelWins || 0) + 1 : userData.duelWins,
        });
      }
    } catch (error) {
      console.error('Failed to log duel:', error);
    }
  });
*/

// ===============================================
// 3️⃣ AGGREGATE DAILY STATS
// ===============================================

/*
export const aggregateDailyStats = functions.pubsub
  .schedule('every day 00:00')
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const usersRef = admin.firestore().collection('users');
      const usersSnap = await usersRef.get();

      for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        const analyticsRef = admin
          .firestore()
          .collection(`users/${userId}/analytics`);

        // Get today's data
        const today = new Date().toISOString().split('T')[0];
        const todayQuery = await analyticsRef
          .where('date', '==', today)
          .get();

        let trainings = 0;
        let duels = 0;
        let xp = 0;
        const wpmScores: number[] = [];

        todayQuery.forEach((doc) => {
          const data = doc.data();
          if (data.type === 'training') {
            trainings++;
            wpmScores.push(data.wpm);
            xp += data.xp;
          } else if (data.type === 'duel') {
            duels++;
            xp += data.xp;
            wpmScores.push(data.wpm);
          }
        });

        // Store daily summary
        const dailyRef = admin
          .firestore()
          .collection(`users/${userId}/dailyStats`)
          .doc(today);

        const avgWpm =
          wpmScores.length > 0
            ? Math.round(
                wpmScores.reduce((a, b) => a + b, 0) / wpmScores.length
              )
            : 0;

        await dailyRef.set(
          {
            date: today,
            trainings,
            duels,
            xp,
            avgWpm,
            bestWpm: Math.max(...wpmScores, 0),
            totalSessions: trainings + duels,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      console.log('Daily stats aggregation completed');
    } catch (error) {
      console.error('Failed to aggregate daily stats:', error);
    }
  });
*/

// ===============================================
// 4️⃣ CALCULATE LEADERBOARDS
// ===============================================

/*
export const updateLeaderboards = functions.pubsub
  .schedule('every 6 hours')
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const usersRef = admin.firestore().collection('users');
      const usersSnap = await usersRef.get();

      // Prepare leaderboard data
      const leaderboardData: Array<{
        userId: string;
        username: string;
        xp: number;
        level: number;
        duelWinRate: number;
      }> = [];

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const duelWinRate =
          userData.totalDuels > 0
            ? (userData.duelWins / userData.totalDuels) * 100
            : 0;

        leaderboardData.push({
          userId: userDoc.id,
          username: userData.username,
          xp: userData.xp || 0,
          level: userData.level || 1,
          duelWinRate: Math.round(duelWinRate),
        });
      }

      // Sort and store
      const byXP = leaderboardData
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 100);
      const byLevel = leaderboardData
        .sort((a, b) => b.level - a.level)
        .slice(0, 100);
      const byWinRate = leaderboardData
        .sort((a, b) => b.duelWinRate - a.duelWinRate)
        .slice(0, 100);

      const leaderboardsRef = admin.firestore().collection('leaderboards');

      await leaderboardsRef.doc('xp').set(
        { players: byXP, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );

      await leaderboardsRef.doc('level').set(
        { players: byLevel, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );

      await leaderboardsRef.doc('duelWinRate').set(
        { players: byWinRate, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );

      console.log('Leaderboards updated');
    } catch (error) {
      console.error('Failed to update leaderboards:', error);
    }
  });
*/

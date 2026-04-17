/**
 * ✅ CLOUD FUNCTIONS - PUSH NOTIFICATIONS
 * Deploy this to: Firebase Cloud Functions > functions/src/notifications.ts
 */

/*
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const messaging = admin.messaging();

// ===============================================
// Send duel invitation notification
// ===============================================
export const sendDuelInviteNotification = functions.firestore
  .document('duels/{duelId}')
  .onCreate(async (snap, context) => {
    const duelData = snap.data();
    const { player1, player2 } = duelData;

    try {
      // Get player2's FCM token from Firestore
      const player2Doc = await db.collection('users').doc(player2).get();
      const fcmToken = player2Doc.data()?.pushNotificationToken;

      if (!fcmToken) {
        console.log('No FCM token for player:', player2);
        return;
      }

      // Send notification
      await messaging.send({
        token: fcmToken,
        notification: {
          title: '⚔️ Yeni Düello Daveti!',
          body: 'Bir oyuncu seni duel\'e davet etti. Kabul edecek misin?',
        },
        data: {
          type: 'duel_invite',
          duelId: context.params.duelId,
          opponentId: player1,
          opponentName: duelData.player1Name || 'Unknown',
        },
        webpush: {
          fcmOptions: {
            link: 'https://fastread.app/duel/' + context.params.duelId,
          },
          notification: {
            icon: '/icon-duel.png',
            badge: '/badge-duel.png',
            tag: 'duel-invite-' + context.params.duelId,
            requireInteraction: true,
          },
        },
      });

      console.log('✅ Duel invite notification sent');
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  });

// ===============================================
// Notify when opponent is ready for duel
// ===============================================
export const notifyOpponentReady = functions.firestore
  .document('duels/{duelId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if opponent just loaded the duel page
    if (before.opponentLoaded !== true && after.opponentLoaded === true) {
      try {
        const playerDoc = await db
          .collection('users')
          .doc(after.player1)
          .get();
        const fcmToken = playerDoc.data()?.pushNotificationToken;

        if (fcmToken) {
          await messaging.send({
            token: fcmToken,
            notification: {
              title: '✅ Rakip Hazır!',
              body: 'Rakibiniz duela katılmaya hazır. Hadi başlayalım!',
            },
            data: {
              type: 'duel_opponent_ready',
              duelId: context.params.duelId,
            },
          });
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  });

// ===============================================
// Notify duel winner
// ===============================================
export const notifyDuelResult = functions.firestore
  .document('duels/{duelId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if match finished
    if (before.status !== 'finished' && after.status === 'finished') {
      const { player1, player2, result } = after;
      const winnerId = result.winner; // winner user ID
      const looserId = result.winner === player1 ? player2 : player1;

      try {
        // Get both players' FCM tokens
        const winnerDoc = await db.collection('users').doc(winnerId).get();
        const loserDoc = await db.collection('users').doc(looserId).get();

        const winnerToken = winnerDoc.data()?.pushNotificationToken;
        const loserToken = loserDoc.data()?.pushNotificationToken;

        if (winnerToken) {
          await messaging.send({
            token: winnerToken,
            notification: {
              title: '🏆 Düeli Kazandın!',
              body: `${result.xpGained} XP kazandın!`,
            },
            data: {
              type: 'duel_result',
              duelId: context.params.duelId,
              result: 'won',
              XpGained: String(result.xpGained),
            },
          });
        }

        if (loserToken) {
          await messaging.send({
            token: loserToken,
            notification: {
              title: '⚔️ Düel Bitti',
              body: 'Rakibin seni yendi. Tekrar dene!',
            },
            data: {
              type: 'duel_result',
              duelId: context.params.duelId,
              result: 'lost',
              XpGained: '0',
            },
          });
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  });

export const sendCustomNotification = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) throw new Error('Not authenticated');

    const { notificationTitle, notificationBody, recipientId } = data;

    try {
      const userDoc = await db.collection('users').doc(recipientId).get();
      const fcmToken = userDoc.data()?.pushNotificationToken;

      if (!fcmToken) {
        throw new Error('No FCM token found');
      }

      await messaging.send({
        token: fcmToken,
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
      });

      return { success: true };
    } catch (error: any) {
      throw new functions.https.HttpsError(
        'unknown',
        'Failed to send notification: ' + error.message
      );
    }
  }
);
*/

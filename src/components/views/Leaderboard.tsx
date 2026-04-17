/**
 * ✅ LEADERBOARD COMPONENT
 * Global and friend leaderboards with multiple sorting options
 */

import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { User } from '../shared/types';

interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  xp: number;
  level: number;
  winrate: number;
  totalDuels: number;
  streak: number;
}

interface LeaderboardProps {
  user: User;
  limit?: number;
  type?: 'xp' | 'level' | 'winrate' | 'friends';
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  user,
  limit: pageLimit = 50,
  type = 'xp',
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        let usersQuery;

        if (type === 'friends') {
          // Get user's friends
          const userDocRef = collection(db, 'users');
          const friendsRef = await getDocs(
            query(userDocRef, where('id', '==', user.uid), limit(1))
          );

          let friendIds: string[] = [];
          friendsRef.forEach((doc) => {
            friendIds = doc.data().friendIds || [];
          });

          // Get friends' data
          usersQuery = query(
            collection(db, 'users'),
            where('uid', 'in', friendIds.length > 0 ? friendIds : [''])
          );
        } else {
          // Get all users sorted by metric
          const sortField =
            type === 'xp' ? 'xp' : type === 'level' ? 'level' : 'duelWinRate';
          usersQuery = query(
            collection(db, 'users'),
            orderBy(sortField, 'desc'),
            limit(pageLimit)
          );
        }

        const snapshot = await getDocs(usersQuery);
        const leaderboardData: LeaderboardEntry[] = [];
        let currentUserRank = 0;

        snapshot.forEach((doc, index) => {
          const data = doc.data();
          const winrate =
            data.totalDuels > 0
              ? Math.round((data.duelWins / data.totalDuels) * 100)
              : 0;

          leaderboardData.push({
            userId: doc.id,
            username: data.username,
            avatar: data.avatar,
            xp: data.xp || 0,
            level: data.level || 1,
            winrate,
            totalDuels: data.totalDuels || 0,
            streak: data.streak || 0,
          });

          if (doc.id === user.uid) {
            currentUserRank = index + 1;
          }
        });

        setEntries(leaderboardData);
        setUserRank(currentUserRank);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [type, user.uid, pageLimit]);

  if (loading) {
    return <div className="text-center p-8">Puan tablosu yükleniyor...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
      {/* USER'S POSITION */}
      {userRank && userRank > pageLimit && (
        <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b border-blue-200 dark:border-blue-800">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            📍 Sizin Konumunuz: #{userRank} / {entries.length}
          </p>
        </div>
      )}

      {/* LEADERBOARD TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                Sıra
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                Oyuncu
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                Seviye
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                XP
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                Düello
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                Seri 🔥
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {entries.map((entry, index) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                rank={index + 1}
                isCurrentUser={entry.userId === user.uid}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ===============================================
// LEADERBOARD ROW COMPONENT
// ===============================================

const LeaderboardRow: React.FC<{
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
}> = ({ entry, rank, isCurrentUser }) => {
  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400';
    if (rank === 2) return 'bg-gray-50 dark:bg-gray-700/30 border-l-4 border-gray-400';
    if (rank === 3) return 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400';
    if (isCurrentUser) return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400';
    return '';
  };

  return (
    <tr className={getRankColor(rank)}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">{getMedalEmoji(rank)}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {entry.avatar && (
            <img
              src={entry.avatar}
              alt={entry.username}
              className="w-8 h-8 rounded-full"
            />
          )}
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {entry.username}
              {isCurrentUser && <span className="text-xs ml-2 text-blue-600">👤 Sen</span>}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <span className="inline-block bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 px-3 py-1 rounded-full text-sm font-semibold">
          Lv. {entry.level}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <span className="font-bold text-blue-600 dark:text-blue-400">
          {entry.xp.toLocaleString()}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <span className="text-gray-700 dark:text-gray-300">
          {entry.totalDuels > 0 ? `${entry.winrate}%` : '-'}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <span
          className={`font-bold text-lg ${entry.streak > 0 ? 'text-orange-500' : 'text-gray-400'}`}
        >
          {entry.streak}
        </span>
      </td>
    </tr>
  );
};

export default Leaderboard;

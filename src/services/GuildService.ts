/**
 * ✅ GUILD SYSTEM SERVICE
 * Guild management, membership, roles, and team operations
 */

import React, { useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  deleteDoc,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { User } from '../shared/types';

// ===============================================
// 1️⃣ GUILD DATA TYPES
// ===============================================

export enum GuildRole {
  OWNER = 'owner',
  MODERATOR = 'moderator',
  MEMBER = 'member',
}

export interface GuildMember {
  uid: string;
  username: string;
  avatar?: string;
  role: GuildRole;
  joinDate: string;
  contribution: number; // XP contributed to guild
  level: number;
  lastActive: string;
}

export interface GuildStats {
  totalMembers: number;
  totalXP: number;
  totalWins: number;
  averageLevel: number;
  leaderPosition?: number;
}

export interface Guild {
  id: string;
  name: string;
  description: string;
  icon?: string;
  banner?: string;
  ownerId: string;
  createdDate: string;
  maxMembers: number;
  stats: GuildStats;
  members: GuildMember[];
  inviteCode: string;
  isPublic: boolean;
  tags: string[]; // 'competitive', 'casual', 'friendly', etc.
}

export interface GuildMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  pinned: boolean;
}

// ===============================================
// 2️⃣ GUILD SERVICE
// ===============================================

class GuildService {
  /**
   * ✅ Create new guild
   */
  async createGuild(
    ownerId: string,
    name: string,
    description: string,
    isPublic: boolean = true,
    tags: string[] = []
  ): Promise<string> {
    try {
      const guildId = doc(collection(db, 'guilds')).id;
      const inviteCode = this.generateInviteCode();

      const ownerRef = doc(db, 'users', ownerId);
      const ownerDoc = await getDoc(ownerRef);
      const ownerData = ownerDoc.data();

      const guildData: Guild = {
        id: guildId,
        name,
        description,
        ownerId,
        createdDate: new Date().toISOString(),
        maxMembers: 50,
        stats: {
          totalMembers: 1,
          totalXP: 0,
          totalWins: 0,
          averageLevel: ownerData?.level || 1,
        },
        members: [
          {
            uid: ownerId,
            username: ownerData?.username,
            avatar: ownerData?.avatar,
            role: GuildRole.OWNER,
            joinDate: new Date().toISOString(),
            contribution: 0,
            level: ownerData?.level || 1,
            lastActive: new Date().toISOString(),
          },
        ],
        inviteCode,
        isPublic,
        tags,
      };

      await setDoc(doc(db, 'guilds', guildId), guildData);

      // Add guild to owner's profile
      await updateDoc(ownerRef, {
        guildId,
        guildRole: GuildRole.OWNER,
      });

      console.log('Guild created:', guildId);
      return guildId;
    } catch (error) {
      console.error('Failed to create guild:', error);
      throw error;
    }
  }

  /**
   * ✅ Join guild via invite code
   */
  async joinGuildByCode(userId: string, inviteCode: string): Promise<string> {
    try {
      // Find guild by invite code
      const guildsRef = collection(db, 'guilds');
      const q = query(guildsRef, where('inviteCode', '==', inviteCode));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error('Davet kodu geçersiz');
      }

      const guildDoc = snapshot.docs[0];
      const guildData = guildDoc.data() as Guild;

      if (guildData.members.length >= guildData.maxMembers) {
        throw new Error('Kılavuz dolu');
      }

      // Check if already member
      if (guildData.members.some((m) => m.uid === userId)) {
        throw new Error('Zaten bu kılavuzun üyesisin');
      }

      // Get user data
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      // Add member to guild
      const newMember: GuildMember = {
        uid: userId,
        username: userData?.username,
        avatar: userData?.avatar,
        role: GuildRole.MEMBER,
        joinDate: new Date().toISOString(),
        contribution: 0,
        level: userData?.level || 1,
        lastActive: new Date().toISOString(),
      };

      await updateDoc(guildDoc.ref, {
        members: arrayUnion(newMember),
        'stats.totalMembers': increment(1),
      });

      // Add guild to user's profile
      await updateDoc(userRef, {
        guildId: guildDoc.id,
        guildRole: GuildRole.MEMBER,
      });

      return guildDoc.id;
    } catch (error) {
      console.error('Failed to join guild:', error);
      throw error;
    }
  }

  /**
   * ✅ Leave guild
   */
  async leaveGuild(userId: string, guildId: string): Promise<void> {
    try {
      const guildRef = doc(db, 'guilds', guildId);
      const guildDoc = await getDoc(guildRef);
      const guildData = guildDoc.data() as Guild;

      // Owner cannot leave without transferring ownership
      const member = guildData.members.find((m) => m.uid === userId);
      if (member?.role === GuildRole.OWNER) {
        throw new Error('Kılavuz sahibi ayrılamaz. Sahipliği başka birine aktar.');
      }

      await updateDoc(guildRef, {
        members: arrayRemove(member),
        'stats.totalMembers': increment(-1),
      });

      // Remove guild from user
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        guildId: null,
        guildRole: null,
      });
    } catch (error) {
      console.error('Failed to leave guild:', error);
      throw error;
    }
  }

  /**
   * ✅ Update guild information
   */
  async updateGuild(
    guildId: string,
    updates: Partial<Guild>
  ): Promise<void> {
    try {
      const guildRef = doc(db, 'guilds', guildId);
      await updateDoc(guildRef, updates);
    } catch (error) {
      console.error('Failed to update guild:', error);
      throw error;
    }
  }

  /**
   * ✅ Change member role
   */
  async changeMemberRole(
    guildId: string,
    memberId: string,
    newRole: GuildRole
  ): Promise<void> {
    try {
      const guildRef = doc(db, 'guilds', guildId);
      const guildDoc = await getDoc(guildRef);
      const guildData = guildDoc.data() as Guild;

      // Remove old member
      const oldMember = guildData.members.find((m) => m.uid === memberId);
      if (!oldMember) throw new Error('Member not found');

      await updateDoc(guildRef, {
        members: arrayRemove(oldMember),
      });

      // Update role and re-add
      oldMember.role = newRole;
      await updateDoc(guildRef, {
        members: arrayUnion(oldMember),
      });

      // Update user's role
      const userRef = doc(db, 'users', memberId);
      await updateDoc(userRef, { guildRole: newRole });
    } catch (error) {
      console.error('Failed to change member role:', error);
      throw error;
    }
  }

  /**
   * ✅ Get guild by ID
   */
  async getGuild(guildId: string): Promise<Guild | null> {
    try {
      const guildDoc = await getDoc(doc(db, 'guilds', guildId));
      return guildDoc.data() as Guild;
    } catch (error) {
      console.error('Failed to get guild:', error);
      return null;
    }
  }

  /**
   * ✅ Get user's guild
   */
  async getUserGuild(userId: string): Promise<Guild | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      if (!userData?.guildId) return null;

      return await this.getGuild(userData.guildId);
    } catch (error) {
      console.error('Failed to get user guild:', error);
      return null;
    }
  }

  /**
   * ✅ Get all guilds
   */
  async getAllGuilds(pageLimit: number = 50): Promise<Guild[]> {
    try {
      const q = query(
        collection(db, 'guilds'),
        where('isPublic', '==', true),
        orderBy('stats.totalMembers', 'desc'),
        limit(pageLimit)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => doc.data() as Guild);
    } catch (error) {
      console.error('Failed to get guilds:', error);
      return [];
    }
  }

  /**
   * ✅ Send guild message
   */
  async sendGuildMessage(
    guildId: string,
    userId: string,
    username: string,
    message: string
  ): Promise<void> {
    try {
      const messagesRef = collection(db, `guilds/${guildId}/messages`);
      await setDoc(doc(messagesRef), {
        userId,
        username,
        message,
        timestamp: new Date().toISOString(),
        pinned: false,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * ✅ Get guild messages
   */
  async getGuildMessages(guildId: string, limit: number = 50): Promise<GuildMessage[]> {
    try {
      const q = query(
        collection(db, `guilds/${guildId}/messages`),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as GuildMessage))
        .reverse();
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  /**
   * ✅ Update member contribution (called when training/duel completes)
   */
  async updateMemberContribution(
    guildId: string,
    userId: string,
    xpGained: number
  ): Promise<void> {
    try {
      const guildRef = doc(db, 'guilds', guildId);
      const guildDoc = await getDoc(guildRef);
      const guildData = guildDoc.data() as Guild;

      const memberIndex = guildData.members.findIndex((m) => m.uid === userId);
      if (memberIndex === -1) return;

      const member = guildData.members[memberIndex];
      member.contribution += xpGained;
      member.lastActive = new Date().toISOString();

      // Update members array
      const updatedMembers = [...guildData.members];
      updatedMembers[memberIndex] = member;

      await updateDoc(guildRef, {
        members: updatedMembers,
        'stats.totalXP': increment(xpGained),
      });
    } catch (error) {
      console.error('Failed to update contribution:', error);
    }
  }

  /**
   * ✅ Helper: Generate invite code
   */
  private generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

export const guildService = new GuildService();

// ===============================================
// 3️⃣ REACT HOOKS
// ===============================================

export const useGuild = (guildId: string | null) => {
  const [guild, setGuild] = useState<Guild | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!guildId) {
      setGuild(null);
      setLoading(false);
      return;
    }

    const loadGuild = async () => {
      try {
        const data = await guildService.getGuild(guildId);
        setGuild(data);
      } catch (error) {
        console.error('Failed to load guild:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGuild();
  }, [guildId]);

  return { guild, loading };
};

export const useUserGuild = (userId: string) => {
  const [guild, setGuild] = useState<Guild | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGuild = async () => {
      try {
        const data = await guildService.getUserGuild(userId);
        setGuild(data);
      } finally {
        setLoading(false);
      }
    };

    loadGuild();
  }, [userId]);

  return { guild, loading };
};

export default GuildService;

/**
 * ✅ TOURNAMENT SYSTEM SERVICE
 * Team tournaments, matches, brackets, and rankings
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  increment,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';

// ===============================================
// 1️⃣ TOURNAMENT DATA TYPES
// ===============================================

export enum TournamentStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TournamentType {
  SOLO = 'solo',
  TEAM_2V2 = 'team2v2',
  TEAM_3V3 = 'team3v3',
  TEAM_5V5 = 'team5v5',
  GUILD = 'guild', // Guild vs Guild
}

export interface TournamentTeam {
  id: string;
  name: string;
  guildId?: string;
  members: string[]; // User UIDs
  wins: number;
  losses: number;
  score: number;
  rank?: number;
}

export interface TournamentMatch {
  id: string;
  team1Id: string;
  team2Id: string;
  startTime: string;
  endTime?: string;
  winnerId?: string;
  team1Score: number;
  team2Score: number;
  status: 'scheduled' | 'in-progress' | 'completed';
  matchDetails?: {
    rounds: number;
    avgWPM?: number;
  };
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  guildId?: string; // If guild tournament
  type: TournamentType;
  status: TournamentStatus;
  startDate: string;
  endDate: string;
  maxTeams: number;
  teams: TournamentTeam[];
  matches: TournamentMatch[];
  prizePool: {
    first: number; // XP
    second: number;
    third: number;
  };
  rules: string;
  banner?: string;
}

// ===============================================
// 2️⃣ TOURNAMENT SERVICE
// ===============================================

class TournamentService {
  /**
   * ✅ Create new tournament
   */
  async createTournament(
    name: string,
    description: string,
    type: TournamentType,
    startDate: string,
    endDate: string,
    maxTeams: number = 16,
    guildId?: string
  ): Promise<string> {
    try {
      const tournamentId = doc(collection(db, 'tournaments')).id;

      const tournament: Tournament = {
        id: tournamentId,
        name,
        description,
        type,
        status: TournamentStatus.PENDING,
        startDate,
        endDate,
        maxTeams,
        teams: [],
        matches: [],
        guildId,
        prizePool: {
          first: 1000,
          second: 500,
          third: 250,
        },
        rules: 'Standard rules apply',
      };

      await setDoc(doc(db, 'tournaments', tournamentId), tournament);

      console.log('Tournament created:', tournamentId);
      return tournamentId;
    } catch (error) {
      console.error('Failed to create tournament:', error);
      throw error;
    }
  }

  /**
   * ✅ Register team for tournament
   */
  async registerTeam(
    tournamentId: string,
    teamName: string,
    memberIds: string[],
    guildId?: string
  ): Promise<string> {
    try {
      const tournamentRef = doc(db, 'tournaments', tournamentId);
      const tournamentDoc = await getDoc(tournamentRef);
      const tournament = tournamentDoc.data() as Tournament;

      // Check limits
      if (tournament.teams.length >= tournament.maxTeams) {
        throw new Error('Turnuva dolu');
      }

      if (memberIds.length !== this.getTeamSize(tournament.type)) {
        throw new Error(
          `Takım ${this.getTeamSize(tournament.type)} oyuncu olmalı`
        );
      }

      const teamId = doc(collection(db, `tournaments/${tournamentId}/teams`)).id;
      const team: TournamentTeam = {
        id: teamId,
        name: teamName,
        members: memberIds,
        guildId,
        wins: 0,
        losses: 0,
        score: 0,
      };

      // Add team to tournament
      await updateDoc(tournamentRef, {
        teams: [...tournament.teams, team],
      });

      return teamId;
    } catch (error) {
      console.error('Failed to register team:', error);
      throw error;
    }
  }

  /**
   * ✅ Generate tournament bracket (matches)
   */
  async generateBracket(tournamentId: string): Promise<void> {
    try {
      const tournamentRef = doc(db, 'tournaments', tournamentId);
      const tournamentDoc = await getDoc(tournamentRef);
      const tournament = tournamentDoc.data() as Tournament;

      if (tournament.teams.length < 2) {
        throw new Error('En az 2 takım gerekli');
      }

      const matches: TournamentMatch[] = [];
      const startDate = new Date(tournament.startDate);
      const matchInterval = 60 * 60 * 1000; // 1 hour between matches

      // Round-robin scheduling
      for (let i = 0; i < tournament.teams.length; i++) {
        for (let j = i + 1; j < tournament.teams.length; j++) {
          const matchTime = new Date(
            startDate.getTime() +
              (matches.length * matchInterval)
          ).toISOString();

          matches.push({
            id: doc(collection(db, 'dummyCollection')).id,
            team1Id: tournament.teams[i].id,
            team2Id: tournament.teams[j].id,
            startTime: matchTime,
            team1Score: 0,
            team2Score: 0,
            status: 'scheduled',
          });
        }
      }

      await updateDoc(tournamentRef, {
        matches,
        status: TournamentStatus.ACTIVE,
      });

      console.log(`Generated ${matches.length} matches`);
    } catch (error) {
      console.error('Failed to generate bracket:', error);
      throw error;
    }
  }

  /**
   * ✅ Complete match and update scores
   */
  async completeMatch(
    tournamentId: string,
    matchId: string,
    winnerId: string,
    team1Score: number,
    team2Score: number
  ): Promise<void> {
    try {
      const tournamentRef = doc(db, 'tournaments', tournamentId);
      const tournamentDoc = await getDoc(tournamentRef);
      const tournament = tournamentDoc.data() as Tournament;

      // Find match
      const matchIndex = tournament.matches.findIndex((m) => m.id === matchId);
      if (matchIndex === -1) throw new Error('Match not found');

      const match = tournament.matches[matchIndex];

      // Update match
      match.status = 'completed';
      match.winnerId = winnerId;
      match.team1Score = team1Score;
      match.team2Score = team2Score;
      match.endTime = new Date().toISOString();

      // Update teams
      const losingTeamId = winnerId === match.team1Id ? match.team2Id : match.team1Id;
      const winningTeam = tournament.teams.find((t) => t.id === winnerId);
      const losingTeam = tournament.teams.find((t) => t.id === losingTeamId);

      if (winningTeam && losingTeam) {
        winningTeam.wins++;
        winningTeam.score += team1Score > team2Score ? team1Score : team2Score;

        losingTeam.losses++;
        losingTeam.score += team1Score > team2Score ? team2Score : team1Score;

        // Stop ties at 5 wins
        if (winningTeam.wins >= 5) {
          await this.completeTournament(tournamentId);
        }
      }

      // Update tournament
      const updatedMatches = [...tournament.matches];
      updatedMatches[matchIndex] = match;

      await updateDoc(tournamentRef, {
        matches: updatedMatches,
        teams: tournament.teams,
      });

      console.log('Match completed');
    } catch (error) {
      console.error('Failed to complete match:', error);
      throw error;
    }
  }

  /**
   * ✅ Complete tournament and award prizes
   */
  async completeTournament(tournamentId: string): Promise<void> {
    try {
      const tournamentRef = doc(db, 'tournaments', tournamentId);
      const tournamentDoc = await getDoc(tournamentRef);
      const tournament = tournamentDoc.data() as Tournament;

      // Sort teams by wins and score
      const rankedTeams = tournament.teams.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.score - a.score;
      });

      // Award prizes
      const prizes = [
        tournament.prizePool.first,
        tournament.prizePool.second,
        tournament.prizePool.third,
      ];

      for (let i = 0; i < Math.min(3, rankedTeams.length); i++) {
        const team = rankedTeams[i];
        const totalPrize = prizes[i];

        // Split prize among team members
        const prizePerMember = Math.floor(totalPrize / team.members.length);

        for (const memberUID of team.members) {
          const userRef = doc(db, 'users', memberUID);
          await updateDoc(userRef, {
            xp: increment(prizePerMember),
            tournamentsPrizes: increment(prizePerMember),
          });
        }

        team.rank = i + 1;
      }

      // Update tournament
      await updateDoc(tournamentRef, {
        status: TournamentStatus.COMPLETED,
        teams: rankedTeams,
        'endDate': new Date().toISOString(),
      });

      console.log('Tournament completed');
    } catch (error) {
      console.error('Failed to complete tournament:', error);
      throw error;
    }
  }

  /**
   * ✅ Get tournament by ID
   */
  async getTournament(tournamentId: string): Promise<Tournament | null> {
    try {
      const doc_ref = doc(db, 'tournaments', tournamentId);
      const docSnap = await getDoc(doc_ref);
      return docSnap.data() as Tournament;
    } catch (error) {
      console.error('Failed to get tournament:', error);
      return null;
    }
  }

  /**
   * ✅ Get active tournaments
   */
  async getActiveTournaments(): Promise<Tournament[]> {
    try {
      const q = query(
        collection(db, 'tournaments'),
        where('status', 'in', [TournamentStatus.PENDING, TournamentStatus.ACTIVE]),
        orderBy('startDate', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => d.data() as Tournament);
    } catch (error) {
      console.error('Failed to get tournaments:', error);
      return [];
    }
  }

  /**
   * ✅ Get guild tournaments
   */
  async getGuildTournaments(guildId: string): Promise<Tournament[]> {
    try {
      const q = query(
        collection(db, 'tournaments'),
        where('guildId', '==', guildId),
        orderBy('startDate', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => d.data() as Tournament);
    } catch (error) {
      console.error('Failed to get guild tournaments:', error);
      return [];
    }
  }

  /**
   * ✅ Helper: Get team size for tournament type
   */
  private getTeamSize(type: TournamentType): number {
    switch (type) {
      case TournamentType.SOLO:
        return 1;
      case TournamentType.TEAM_2V2:
        return 2;
      case TournamentType.TEAM_3V3:
        return 3;
      case TournamentType.TEAM_5V5:
        return 5;
      case TournamentType.GUILD:
        return 5;
      default:
        return 1;
    }
  }
}

export const tournamentService = new TournamentService();

export default TournamentService;

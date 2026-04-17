/**
 * ✅ TOURNAMENT BROWSER & BRACKET COMPONENT
 * Join tournaments, view brackets, track matches
 */

import React, { useState, useEffect } from 'react';
import { User } from '../shared/types';
import {
  tournamentService,
  Tournament,
  TournamentStatus,
  TournamentMatch,
} from '../services/TournamentService';

interface TournamentBrowserProps {
  user: User;
}

export const TournamentBrowser: React.FC<TournamentBrowserProps> = ({ user }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'bracket'>('list');

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const data = await tournamentService.getActiveTournaments();
      setTournaments(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTournament = async (tournamentId: string) => {
    const tournament = await tournamentService.getTournament(tournamentId);
    if (tournament) {
      setSelectedTournament(tournament);
      setActiveTab('bracket');
    }
  };

  if (loading) {
    return <div className="text-center p-8">Turnuvalar yükleniyor...</div>;
  }

  if (selectedTournament) {
    return (
      <TournamentDetail
        tournament={selectedTournament}
        user={user}
        onBack={() => {
          setSelectedTournament(null);
          setActiveTab('list');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🏆 Turnuvalar</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              onSelect={() => handleSelectTournament(tournament.id)}
            />
          ))}
        </div>

        {tournaments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Şu anda aktif turnuva yok
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ===============================================
// TOURNAMENT CARD COMPONENT
// ===============================================

const TournamentCard: React.FC<{
  tournament: Tournament;
  onSelect: () => void;
}> = ({ tournament, onSelect }) => {
  const daysLeft = Math.ceil(
    (new Date(tournament.endDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.PENDING:
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100';
      case TournamentStatus.ACTIVE:
        return 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100';
      case TournamentStatus.COMPLETED:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100';
      default:
        return 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100';
    }
  };

  const getStatusLabel = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.PENDING:
        return '⏳ Bekleme';
      case TournamentStatus.ACTIVE:
        return '🔴 Devam Ediyor';
      case TournamentStatus.COMPLETED:
        return '✅ Tamamlandı';
      default:
        return '❌ İptal Edildi';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition">
      {tournament.banner && (
        <img
          src={tournament.banner}
          alt={tournament.name}
          className="w-full h-40 object-cover"
        />
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold">{tournament.name}</h3>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(tournament.status)}`}>
            {getStatusLabel(tournament.status)}
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          {tournament.description}
        </p>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Takım Boyutu:</span>
            <span className="font-semibold">
              {tournament.type === 'solo' && '1v1'}
              {tournament.type === 'team2v2' && '2v2'}
              {tournament.type === 'team3v3' && '3v3'}
              {tournament.type === 'team5v5' && '5v5'}
              {tournament.type === 'guild' && 'Kılavuz'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Kaydı Yapan Takımlar:</span>
            <span className="font-semibold">
              {tournament.teams.length} / {tournament.maxTeams}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Kalan Zaman:</span>
            <span className={`font-semibold ${daysLeft > 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {daysLeft > 0 ? `${daysLeft} gün` : 'Sona Erdi'}
            </span>
          </div>
        </div>

        <button
          onClick={onSelect}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold"
        >
          Detayları Gör
        </button>
      </div>
    </div>
  );
};

// ===============================================
// TOURNAMENT DETAIL COMPONENT
// ===============================================

interface TournamentDetailProps {
  tournament: Tournament;
  user: User;
  onBack: () => void;
}

const TournamentDetail: React.FC<TournamentDetailProps> = ({
  tournament,
  user,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bracket' | 'standings'>(
    'overview'
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <button
          onClick={onBack}
          className="mb-4 px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600"
        >
          ← Geri Dön
        </button>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 mb-8">
          <h1 className="text-4xl font-bold mb-2">{tournament.name}</h1>
          <p className="text-blue-100">{tournament.description}</p>
        </div>

        {/* TABS */}
        <div className="bg-white dark:bg-gray-800 rounded-lg mb-8">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {['overview', 'bracket', 'standings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-4 font-semibold transition border-b-2 ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400'
                }`}
              >
                {tab === 'overview' && '📋 Özet'}
                {tab === 'bracket' && '🗂️ Köşeli Parantez'}
                {tab === 'standings' && '📊 Sıralama'}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">📈 Bilgiler</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Tür</p>
                      <p className="font-semibold">{tournament.type}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Durum</p>
                      <p className="font-semibold">{tournament.status}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Başlama Tarihi</p>
                      <p className="font-semibold">
                        {new Date(tournament.startDate).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4">🏆 Ödüller</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🥇</span>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">1. Yer</p>
                        <p className="font-bold">{tournament.prizePool.first} XP</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🥈</span>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">2. Yer</p>
                        <p className="font-bold">{tournament.prizePool.second} XP</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🥉</span>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">3. Yer</p>
                        <p className="font-bold">{tournament.prizePool.third} XP</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bracket' && (
              <BracketView tournament={tournament} />
            )}

            {activeTab === 'standings' && (
              <StandingsView tournament={tournament} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===============================================
// BRACKET VIEW
// ===============================================

const BracketView: React.FC<{ tournament: Tournament }> = ({ tournament }) => {
  return (
    <div className="overflow-x-auto">
      <div className="space-y-3 min-w-max">
        {tournament.matches.map((match, index) => (
          <MatchCard key={match.id} match={match} tournament={tournament} />
        ))}
      </div>
    </div>
  );
};

const MatchCard: React.FC<{
  match: TournamentMatch;
  tournament: Tournament;
}> = ({ match, tournament }) => {
  const team1 = tournament.teams.find((t) => t.id === match.team1Id);
  const team2 = tournament.teams.find((t) => t.id === match.team2Id);

  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-semibold">{team1?.name || 'TBD'}</p>
          <p className="text-2xl font-bold">{match.team1Score}</p>
        </div>

        <div className="text-center px-4">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {match.status === 'completed' && 'Bitti'}
            {match.status === 'in-progress' && '🔴 Devam Ediyor'}
            {match.status === 'scheduled' && '⏳ Planlandı'}
          </p>
        </div>

        <div className="flex-1 text-right">
          <p className="font-semibold">{team2?.name || 'TBD'}</p>
          <p className="text-2xl font-bold">{match.team2Score}</p>
        </div>
      </div>
    </div>
  );
};

// ===============================================
// STANDINGS VIEW
// ===============================================

const StandingsView: React.FC<{ tournament: Tournament }> = ({ tournament }) => {
  const sortedTeams = [...tournament.teams].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.score - a.score;
  });

  return (
    <table className="w-full">
      <thead>
        <tr className="bg-gray-100 dark:bg-gray-700">
          <th className="px-4 py-3 text-left font-semibold">Sıra</th>
          <th className="px-4 py-3 text-left font-semibold">Takım</th>
          <th className="px-4 py-3 text-center font-semibold">Kazananlar</th>
          <th className="px-4 py-3 text-center font-semibold">Kayıplar</th>
          <th className="px-4 py-3 text-right font-semibold">Puan</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {sortedTeams.map((team, index) => (
          <tr key={team.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td className="px-4 py-3 font-bold">#{index + 1}</td>
            <td className="px-4 py-3 font-semibold">{team.name}</td>
            <td className="px-4 py-3 text-center text-green-600 font-semibold">
              {team.wins}
            </td>
            <td className="px-4 py-3 text-center text-red-600 font-semibold">
              {team.losses}
            </td>
            <td className="px-4 py-3 text-right font-bold">
              {team.score.toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TournamentBrowser;

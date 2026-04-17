/**
 * ✅ GUILD MANAGEMENT COMPONENT
 * Guild creation, member management, chat
 */

import React, { useState, useEffect } from 'react';
import { User } from '../shared/types';
import {
  guildService,
  Guild,
  GuildMember,
  GuildRole,
  useUserGuild,
} from '../services/GuildService';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface GuildManagementProps {
  user: User;
}

export const GuildManagement: React.FC<GuildManagementProps> = ({ user }) => {
  const { guild, loading } = useUserGuild(user.uid);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'chat'>(
    'overview'
  );
  const [guildMessages, setGuildMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateGuild, setShowCreateGuild] = useState(false);
  const [guildName, setGuildName] = useState('');
  const [guildDesc, setGuildDesc] = useState('');

  useEffect(() => {
    if (guild?.id) {
      loadMessages();
    }
  }, [guild?.id]);

  const loadMessages = async () => {
    if (!guild?.id) return;
    const messages = await guildService.getGuildMessages(guild.id);
    setGuildMessages(messages);
  };

  const handleCreateGuild = async () => {
    if (!guildName.trim()) return;
    try {
      await guildService.createGuild(user.uid, guildName, guildDesc, true, [
        'casual',
      ]);
      setShowCreateGuild(false);
      setGuildName('');
      setGuildDesc('');
    } catch (error) {
      console.error('Failed to create guild:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !guild?.id) return;
    try {
      await guildService.sendGuildMessage(
        guild.id,
        user.uid,
        user.username,
        newMessage
      );
      setNewMessage('');
      await loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleLeaveGuild = async () => {
    if (!guild?.id || !window.confirm('Kılavuzdan ayrılmak istediğine emin misin?'))
      return;
    try {
      await guildService.leaveGuild(user.uid, guild.id);
      window.location.reload();
    } catch (error) {
      console.error('Failed to leave guild:', error);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Yükleniyor...</div>;
  }

  if (!guild) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">🏰 Kılavuz Sistemi</h1>

          {showCreateGuild ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Yeni Kılavuz Oluştur</h2>
              <input
                type="text"
                placeholder="Kılavuz Adı"
                value={guildName}
                onChange={(e) => setGuildName(e.target.value)}
                className="w-full p-3 border rounded-lg mb-4 dark:bg-gray-700 dark:border-gray-600"
              />
              <textarea
                placeholder="Kılavuz Açıklaması"
                value={guildDesc}
                onChange={(e) => setGuildDesc(e.target.value)}
                className="w-full p-3 border rounded-lg mb-4 dark:bg-gray-700 dark:border-gray-600 h-24"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateGuild}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Oluştur
                </button>
                <button
                  onClick={() => setShowCreateGuild(false)}
                  className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-400"
                >
                  İptal
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateGuild(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-bold hover:bg-blue-700"
            >
              + Kılavuz Oluştur
            </button>
          )}

          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Kılavuzları Keşfet</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Diğer oyuncuların kılavuzlarına katılmak için davet kodunu sor veya
              kılavuzları keşfet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = guild.ownerId === user.uid;
  const isModerator = guild.members.find((m) => m.uid === user.uid)?.role === GuildRole.MODERATOR;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* GUILD HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            {guild.icon && (
              <img src={guild.icon} alt={guild.name} className="w-20 h-20 rounded-lg" />
            )}
            <div>
              <h1 className="text-4xl font-bold">{guild.name}</h1>
              <p className="text-blue-100 mt-1">{guild.members.length} üye</p>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto flex gap-8 px-8">
          {['overview', 'members', 'chat'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 font-semibold border-b-2 transition ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400'
              }`}
            >
              {tab === 'overview' && '📊 Özet'}
              {tab === 'members' && '👥 Üyeler'}
              {tab === 'chat' && '💬 Sohbet'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-4">📈 İstatistikler</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Toplam Üyeler</p>
                  <p className="text-2xl font-bold">{guild.stats.totalMembers}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Toplam XP</p>
                  <p className="text-2xl font-bold">{guild.stats.totalXP.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Ortalama Seviye</p>
                  <p className="text-2xl font-bold">{guild.stats.averageLevel}</p>
                </div>
              </div>
            </div>

            {/* Invite Code */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-4">🎟️ Davet Kodu</h3>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
                <p className="text-2xl font-mono font-bold">{guild.inviteCode}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(guild.inviteCode);
                  alert('Davet kodu kopyalandı!');
                }}
                className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Kopyala
              </button>
            </div>

            {/* Actions */}
            {!isOwner && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <h3 className="font-bold text-lg mb-4">⚙️ Eylemler</h3>
                <button
                  onClick={handleLeaveGuild}
                  className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                >
                  Kılavuzdan Ayrıl
                </button>
              </div>
            )}
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Oyuncu</th>
                  <th className="px-6 py-3 text-left font-semibold">Rol</th>
                  <th className="px-6 py-3 text-right font-semibold">Katkı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {guild.members
                  .sort((a, b) => {
                    if (a.role === GuildRole.OWNER) return -1;
                    if (b.role === GuildRole.OWNER) return 1;
                    if (a.role === GuildRole.MODERATOR && b.role !== GuildRole.MODERATOR)
                      return -1;
                    return 0;
                  })
                  .map((member) => (
                    <tr key={member.uid} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {member.avatar && (
                            <img
                              src={member.avatar}
                              alt={member.username}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <span className="font-semibold">{member.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-2 py-1 rounded text-sm">
                          {member.role === GuildRole.OWNER && '👑 Sahip'}
                          {member.role === GuildRole.MODERATOR && '⭐ Moderatör'}
                          {member.role === GuildRole.MEMBER && '👤 Üye'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-bold">
                        {member.contribution.toLocaleString()} XP
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex flex-col h-96">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {guildMessages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <div>
                    <p className="font-semibold text-sm">{msg.username}</p>
                    <p className="text-gray-700 dark:text-gray-300">{msg.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Mesaj yaz..."
                className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Gönder
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuildManagement;

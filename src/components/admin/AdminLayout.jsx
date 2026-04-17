import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { LessonManagement } from './views/LessonManagement';
import { UserManagement } from './views/UserManagement';
import { OffersManagement } from './views/OffersManagement';
import { LeagueManagement } from './views/LeagueManagement';
import { DuelManagement } from './views/DuelManagement';
import { QuestManagement } from './views/QuestManagement';

export const AdminLayout = ({ user, addToast, onExit }) => {
  const [adminTab, setAdminTab] = useState('lessons');

  const renderContent = () => {
    switch (adminTab) {
      case 'lessons':
        return <LessonManagement user={user} addToast={addToast} />;
      case 'users':
        return <UserManagement user={user} addToast={addToast} />;
      case 'offers':
        return <OffersManagement user={user} addToast={addToast} />;
      case 'leagues':
        return <LeagueManagement user={user} addToast={addToast} />;
      case 'duels':
        return <DuelManagement user={user} addToast={addToast} />;
      case 'quests':
        return <QuestManagement user={user} addToast={addToast} />;
      default:
        return <LessonManagement user={user} addToast={addToast} />;
    }
  };

  return (
    <div className="admin-layout" style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: 'var(--bg)',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <AdminSidebar activeTab={adminTab} setTab={setAdminTab} onExit={onExit} />
      <div className="admin-main-content" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--fg)' }}>
              {adminTab === 'lessons' && '📚 Ders & Antrenman Yönetimi'}
              {adminTab === 'users' && '👥 Kullanıcı Yönetimi'}
              {adminTab === 'offers' && '💰 Teklif & Fiyatlandırma'}
              {adminTab === 'leagues' && '🏆 Lig Yönetimi'}
              {adminTab === 'duels' && '⚔️ Düello Ayarları'}
              {adminTab === 'quests' && '🎯 Görev Yönetimi'}
            </h1>
            <p style={{ color: 'var(--mu)', marginTop: '4px' }}>FastRead Yönetim Paneli</p>
          </div>
          <div className="admin-user-info" style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--ac)' }}>Süper Admin</div>
          </div>
        </header>

        {renderContent()}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .admin-layout .btn {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .admin-layout .btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.2);
        }
        .admin-layout .card {
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

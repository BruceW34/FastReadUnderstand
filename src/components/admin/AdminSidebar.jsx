import React from 'react';

export const AdminSidebar = ({ activeTab, setTab, onExit }) => {
  const items = [
    { id: 'lessons', label: 'Ders Yönetimi', icon: '📚' },
    { id: 'users', label: 'Kullanıcılar', icon: '👥' },
    { id: 'offers', label: 'Teklifler', icon: '💰' },
    { id: 'leagues', label: 'Ligler', icon: '🏆' },
    { id: 'duels', label: 'Düello Ayarları', icon: '⚔️' },
    { id: 'quests', label: 'Görevler', icon: '🎯' },
  ];

  return (
    <aside style={{
      width: '260px',
      background: 'rgba(20, 20, 20, 0.8)',
      backdropFilter: 'blur(10px)',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 12px',
      position: 'sticky',
      top: 0,
      height: '100vh',
      zIndex: 100
    }}>
      <div style={{ 
        padding: '0 12px 24px 12px', 
        marginBottom: '24px', 
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          background: 'var(--ac)', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px'
        }}>⚡</div>
        <span style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '-0.5px' }}>BOLT <span style={{ color: 'var(--ac)' }}>ADMIN</span></span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === item.id ? 'var(--ac)' : 'transparent',
              color: activeTab === item.id ? '#000' : 'var(--mu)',
              cursor: 'pointer',
              textAlign: 'left',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
        <button
          onClick={onExit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent',
            color: 'var(--mu)',
            cursor: 'pointer',
            textAlign: 'left',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          <span>🏠</span> Uygulamaya Dön
        </button>
        <div className="card" style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', fontSize: '12px' }}>
          <div style={{ color: 'var(--mu)', marginBottom: '4px' }}>V2.0.0 Stable</div>
          <div style={{ color: '#10b981' }}>● Sistem Aktif</div>
        </div>
      </div>
    </aside>
  );
};

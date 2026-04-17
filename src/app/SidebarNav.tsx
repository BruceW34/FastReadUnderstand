import React from 'react';
import { getLvl, getStreak } from '@/data/levels';
import type { User } from '@/shared/types';
import type { NavItem } from './navConfig';

interface SidebarNavProps {
  user: User | null;
  tab: string;
  onChangeTab: (id: NavItem['id']) => void;
  onOpenStreakModal: () => void;
  onOpenLevelsModal: () => void;
  navItems: NavItem[];
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  user,
  tab,
  onChangeTab,
  onOpenStreakModal,
  onOpenLevelsModal,
  navItems,
}) => {
  const streak = getStreak(user?.sessions || [], (user as any)?.streakFreeze || 0);
  const levelInfo = getLvl(user?.tecrube || 0); // Seviye sadece eğitim TP'sine göre belirlenir
  
  // Segmented TP Progress (e.g., progress toward next level)
  const xpSegments = 10;
  const xpProgressIndex = Math.floor(((user?.tecrube || 0) % 1000) / 100); // TP'ye göre ilerleme göster

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-text electric-logo">⚡ FastReadUnderstand</div>
      </div>

      <div className="sb-section">Menü</div>
      {navItems
        .filter((n) => ['pathway', 'training', 'social'].includes(n.id))
        .map((n) => (
          <div
            key={n.id}
            className={`sb-item ${tab === n.id ? 'active' : ''}`}
            onClick={() => onChangeTab(n.id)}
          >
            <span className="ico">{n.icon}</span> {n.label}
          </div>
        ))}

      <div className="sb-section">Topluluk & Profil</div>
      {navItems
        .filter((n) => ['friends', 'library', 'profile'].includes(n.id))
        .map((n) => (
          <div
            key={n.id}
            className={`sb-item ${tab === n.id ? 'active' : ''}`}
            onClick={() => onChangeTab(n.id)}
          >
            <span className="ico">{n.icon}</span> {n.label}
          </div>
        ))}

      {user?.isAdmin && (
        <div 
          className={`sb-item ${tab === 'admin' ? 'active' : ''}`}
          onClick={() => onChangeTab('admin')}
          style={{ marginTop: 10, color: '#f59e0b', fontWeight: 900 }}
        >
          <span className="ico">🛠️</span> Admin Paneli
        </div>
      )}

      <div
        className="sb-streak"
        onClick={onOpenStreakModal}
        style={{ cursor: 'pointer' }}
      >
        <div>
          <div className="sb-streak-num" id="sbStreak">
            {streak}
          </div>
          <div className="sb-streak-label">Günlük Seri 🔥</div>
        </div>
        <div style={{ fontSize: 36 }}>🔥</div>
      </div>

      <div
        className="sb-xp"
        onClick={onOpenLevelsModal}
        style={{ cursor: 'pointer', marginTop: 'auto' }}
      >
        {/* Master Academic Level */}
        <div style={{ fontSize: 13, color: levelInfo.c.color, fontWeight: 900, marginBottom: 10, textAlign: 'center', textTransform: 'uppercase', background: levelInfo.c.color + '15', padding: '6px', borderRadius: '4px', border: `1px solid ${levelInfo.c.color}33` }}>
          {levelInfo.c.code} — {levelInfo.c.name}
        </div>

        <div className="sb-xp-row" style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--mu)', textTransform: 'uppercase' }}>Global XP</span>
          <span className="sb-xp-val" style={{ fontSize: 12 }}>{(user?.xp || 0).toLocaleString('tr-TR')}</span>
        </div>
        <div style={{ display: 'flex', gap: 2, height: 6, marginBottom: 12 }}>
          {Array.from({ length: xpSegments }).map((_, i) => (
            <div 
              key={i} 
              style={{ 
                flex: 1, 
                background: i < xpProgressIndex ? 'var(--ac)' : 'rgba(255,255,255,0.05)',
                borderRadius: 1
              }} 
            />
          ))}
        </div>

        {/* Training TP Bar (Progress toward next level) */}
        <div className="sb-xp-row" style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--mu)', textTransform: 'uppercase' }}>Eğitim TP</span>
          <span className="sb-xp-val" style={{ fontSize: 11, opacity: 0.8 }}>{(user?.tecrube || 0).toLocaleString('tr-TR')}</span>
        </div>
        <div className="sb-xp-bar" style={{ height: 4, background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="sb-xp-fill"
            style={{ 
              width: `${levelInfo.p}%`, 
              background: levelInfo.c.color || 'var(--ac)',
              height: '100%'
            }}
          ></div>
        </div>
        <div style={{ fontSize: 9, color: 'var(--mu)', marginTop: 4, textAlign: 'right' }}>
          Sıradaki Kademeye {Math.max(0, (levelInfo.n?.xpRequired || 0) - (user?.tecrube || 0))} TP
        </div>
      </div>
    </aside>
  );
};


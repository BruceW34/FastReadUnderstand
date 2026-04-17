import React from 'react';
import { ACHIEVEMENTS } from '@/data/levels.js';
import { PageWrapper, AnimCard } from './PageWrapper.jsx';

export function Achievements({ user }) {
  const unlocked = new Set(user?.unlockedAchievements || []);
  const unlockedCount = unlocked.size;
  const total = ACHIEVEMENTS.length;
  const pct = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  return (
    <PageWrapper animationType="slide">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ animation: 'pageSlideUp .3s both' }}>
          <div className="st">🏅 Başarımlar</div>
          <div className="ss">Rozetleri topla ve ustalığını dört bir yana kanıtla!</div>
        </div>

        {/* Özet banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '16px 20px', borderRadius: 18,
          background: 'rgba(245,158,11,.08)',
          border: '1px solid rgba(245,158,11,.2)',
          animation: 'cardReveal .4s .05s both',
        }}>
          <div style={{ fontSize: 36 }}>🏆</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{unlockedCount} / {total} rozet kazanıldı</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#f59e0b', fontFamily: 'var(--mo)' }}>{pct}%</span>
            </div>
            <div style={{ height: 7, background: 'rgba(255,255,255,.07)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: pct + '%',
                background: 'linear-gradient(90deg, #f59e0b, #f97316)',
                borderRadius: 99,
                transition: 'width 1s ease',
                boxShadow: '0 0 8px rgba(245,158,11,.5)',
              }} />
            </div>
          </div>
        </div>

        {/* Rozet grid */}
        <div style={{
          background: 'rgba(255,255,255,.02)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 20, padding: '22px',
          animation: 'cardReveal .4s .08s both',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {ACHIEVEMENTS.map((a, i) => {
              const has = unlocked.has(a.id);
              return (
                <div key={a.id} style={{
                  padding: '14px',
                  borderRadius: 14,
                  background: has ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.2)',
                  border: '1px solid ' + (has ? 'rgba(245,158,11,.4)' : 'rgba(255,255,255,.06)'),
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  opacity: has ? 1 : 0.55,
                  filter: has ? 'none' : 'grayscale(0.8)',
                  transition: 'all .3s',
                  animation: 'cardReveal .35s ' + (i * .02) + 's both',
                  boxShadow: has ? '0 4px 16px rgba(245,158,11,.1)' : 'none',
                  cursor: 'default',
                }}>
                  <div style={{
                    fontSize: 32, lineHeight: 1,
                    filter: has ? 'drop-shadow(0 0 6px rgba(245,158,11,.5))' : 'none',
                    animation: has ? 'boltBounce 3s ease-in-out ' + (i * .1) + 's infinite' : 'none',
                  }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: has ? 'var(--fg)' : 'var(--mu)', marginBottom: 3 }}>{a.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--mu)', lineHeight: 1.4 }}>{a.desc}</div>
                    <div style={{
                      fontSize: 11, fontWeight: 800, color: has ? '#f59e0b' : 'var(--mu)',
                      marginTop: 6, fontFamily: 'var(--mo)',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      {has ? '✓' : '🔒'} +{a.xp} XP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

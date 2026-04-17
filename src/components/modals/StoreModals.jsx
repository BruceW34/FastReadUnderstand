import React from 'react';
import { AdSection } from '@/components/ads/AdSection';
import { LEVELS } from '@/data/levels';
import { db } from '@/services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { AdService } from '@/services/AdService';

/* ─────────────────────────────────────────────
   MODAL BASE
───────────────────────────────────────────── */
function Modal({ title, children, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.8)', zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, backdropFilter: 'blur(5px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg)',
          width: '100%', maxWidth: 450,
          borderRadius: 24,
          padding: 24,
          position: 'relative',
          animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          border: '1px solid var(--b1)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'var(--b1)', border: 'none', color: 'var(--mu)',
            width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
            fontSize: 18, fontWeight: 800,
          }}
        >✕</button>
        <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 900, textAlign: 'center' }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HEART / ENERGY MODAL
───────────────────────────────────────────── */
export function HeartModal({ user, onClose, onAddHeart }) {
  return (
    <Modal title="Boltage Enerji Merkezi" onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <img src="assets/bolt.png" alt="Bolt" style={{ width: 80, height: 80, marginBottom: 10 }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--mu)', lineHeight: '1.5' }}>
          "Boltage enerjin bitmek üzere! Antrenmanlara devam etmek için enerji barını dolduralım."
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="card hov" style={{ padding: 15, cursor: 'pointer' }} onClick={() => { 
          AdService.showRewardVideo(() => {
            onAddHeart();
            onClose();
          });
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <div style={{ fontSize: 32 }}>📺</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Reklam İzle</div>
              <div style={{ fontSize: 12, color: 'var(--mu)' }}>Bir video izle ve +2 ⚡ Boltage enerjisi kazan.</div>
            </div>
            <div style={{ color: '#f43f5e', fontWeight: 900 }}>ÜCRETSİZ</div>
          </div>
        </div>

        <div className="card hov" style={{ padding: 15, background: 'rgba(245,158,11,0.05)', borderColor: '#f59e0b55' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <div style={{ fontSize: 32 }}>💎</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#f59e0b' }}>FastRead Pro</div>
              <div style={{ fontSize: 12, color: 'var(--mu)' }}>Sınırsız Boltage ve reklamsız deneyim.</div>
            </div>
            <button className="btn bp bs" style={{ padding: '6px 12px', fontSize: 11, background: '#f59e0b' }}>YÜKSELT</button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 25, fontSize: 11, color: 'var(--mu)', textAlign: 'center' }}>
        Boltage enerjin zamanla yenilenir; düzenli antrenman yapmayı unutma.
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   STREAK MODAL
───────────────────────────────────────────── */
export function StreakModal({ user, onClose, onBuyFreeze }) {
  const freezes = user.streakFreeze || 0;

  return (
    <Modal title="Seri Koruması" onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 50, marginBottom: 10 }}>🧊</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--mu)', lineHeight: '1.5' }}>
          "Günü kaçırdığında serini Bolt dondurur ve korur. Emeklerin boşa gitmesin!"
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: 20, marginBottom: 15 }}>
        <div style={{ fontSize: 12, color: 'var(--mu)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 5 }}>Mevcut Korumaların</div>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#fb923c' }}>{freezes} / 2</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          className="btn bp"
          disabled={freezes >= 2}
          style={{ width: '100%', padding: 15, fontWeight: 800, opacity: freezes >= 2 ? 0.5 : 1, background: '#fb923c' }}
          onClick={() => { onBuyFreeze(); onClose(); }}
        >
          {freezes >= 2 ? 'KORUMALAR DOLU' : '1 ADET DONDURMA AL (50 💎)'}
        </button>
        <p style={{ fontSize: 11, color: 'var(--mu)', textAlign: 'center' }}>
          Seri dondurma, antrenman yapmadığın bir gün otomatik olarak kullanılır.
        </p>
      </div>

      <AdSection user={user} style={{ marginTop: 20 }} />
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   DIAMOND MODAL
───────────────────────────────────────────── */
export function DiamondModal({ user, onClose }) {
  return (
    <Modal title="Hazine Odası" onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 50, marginBottom: 10 }}>💎</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--mu)', lineHeight: '1.5' }}>
          "Harika görünüyorsun Bruce! Kazandığın elmaslar senin disiplininin kanıtı. Elmaslarınla seri koruması alabilir veya özel temalar açabilirsin."
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="card" style={{ padding: 15 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 5 }}>🌟 Elmaslarla Neler Yapılır?</div>
          <ul style={{ fontSize: 12, color: 'var(--mu)', paddingLeft: 20, margin: 0, lineHeight: '1.6' }}>
            <li>Yeni okuma temaları açabilirsin (Yakında).</li>
            <li>Seri dondurma (Streak Freeze) alabilirsin.</li>
            <li>Liglerde üst sıralara tırmanmanı sağlar.</li>
          </ul>
        </div>

        <div className="card hov" style={{ padding: 15, background: 'rgba(6,182,212,0.05)', borderColor: '#06b6d455' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <div style={{ fontSize: 32 }}>🎁</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#06b6d4' }}>Premium Hediye</div>
              <div style={{ fontSize: 12, color: 'var(--mu)' }}>Arkadaşına Premium hediye et!</div>
            </div>
            <button className="btn bp bs" style={{ padding: '6px 12px', fontSize: 11, background: '#06b6d4' }}>HEDİYE ET</button>
          </div>
        </div>
      </div>

      <AdSection user={user} style={{ marginTop: 20 }} />
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   LEVEL DETAILS MODAL
───────────────────────────────────────────── */
export function LevelDetailsModal({ user, onClose }) {
  return (
    <Modal title="Okuma Seviyeleri" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        {LEVELS.map(l => {
          const isCurrent = (user.xp || 0) >= l.xpRequired && (!l.nextXp || (user.xp || 0) < l.nextXp);
          // Simple logic for "isCurrent" in modal list
          const xp = user.xp || 0;
          const currentLevel = LEVELS.find((lvl, idx) => {
            const nextLvl = LEVELS[idx + 1];
            return xp >= lvl.xpRequired && (!nextLvl || xp < nextLvl.xpRequired);
          });
          const active = currentLevel?.code === l.code;

          return (
            <div key={l.code} className="card" style={{
              padding: 15,
              borderLeft: `5px solid ${active ? l.color : 'var(--b1)'}`,
              opacity: active ? 1 : 0.7,
              background: active ? `${l.color}08` : 'transparent',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontWeight: 900, color: active ? l.color : 'var(--tx)' }}>{l.code}: {l.name}</span>
                <span style={{ fontSize: 10, color: 'var(--mu)' }}>{l.xpRequired}+ XP</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--mu)' }}>Hız: {l.minWPM}-{l.maxWPM} WPM • Blok: {l.blockSize}</p>
            </div>
          );
        })}
      </div>
      <p style={{ marginTop: 20, fontSize: 11, color: 'var(--mu)', textAlign: 'center' }}>
        Dersleri bitirerek tecrübe puanı kazan ve seviye atla!
      </p>
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   THEME MODAL
───────────────────────────────────────────── */
export function ThemeModal({ user, onClose }) {
  const activeTheme = user.activeTheme || 'dark';
  const unlocked = user.unlockedThemes || ['dark', 'light'];

  const onSelect = async (themeId) => {
    try {
      await updateDoc(doc(db, 'users', user.id), { activeTheme: themeId });
    } catch (e) { console.error(e); }
  };

  const themes = [
    { id: 'dark', name: 'Gece Yarısı', color: '#0f172a' },
    { id: 'light', name: 'Kar Beyazı', color: '#ffffff' },
    { id: 'retro', name: 'Retro Terminal', color: '#00ff41' },
    { id: 'ocean', name: 'Okyanus Esintisi', color: '#0ea5e9' },
    { id: 'neon', name: 'Neon Pençe', color: '#ec4899' },
  ];

  return (
    <Modal title="Tema Galerisi" onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
        {themes.map(t => {
          const isUnlocked = unlocked.includes(t.id);
          const isActive = activeTheme === t.id;
          return (
            <div key={t.id} className="card hov" style={{
              padding: 10,
              textAlign: 'center',
              border: isActive ? '2px solid var(--ac)' : '1px solid var(--b1)',
              opacity: isUnlocked ? 1 : 0.6,
            }}>
              <div style={{ height: 60, background: t.color, borderRadius: 10, marginBottom: 10, border: '1px solid var(--b1)' }} />
              <div style={{ fontWeight: 800, fontSize: 12 }}>{t.name}</div>
              <button
                className={`btn ${isActive ? 'bg' : 'bp'} bs`}
                style={{ width: '100%', marginTop: 5, fontSize: 10 }}
                onClick={() => isUnlocked ? onSelect(t.id) : null}
              >
                {isActive ? 'AKTİF' : isUnlocked ? 'SEÇ' : 'KİLİTLİ'}
              </button>
            </div>
          );
        })}
      </div>
      <AdSection user={user} style={{ marginTop: 20 }} />
    </Modal>
  );
}
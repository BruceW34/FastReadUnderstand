import { useMemo, useState, useEffect } from 'react';
import { getLvl, getLeague, LEAGUES } from '@/data/levels.js';
import { storage } from '@/shared/storage';
import { ProBadge } from '@/components/shared/Shared.jsx';
import { db } from '@/services/firebase';
import { collection, query, orderBy, limit, onSnapshot, getDocs, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';

export default function Profile({ user, onUpdateAvatar, addToast, onLogout, theme, setTheme, onTabChange, isMobile }) {
  const { c } = getLvl(user?.tecrube || 0);
  const sess = user.sessions || [];
  
  // Stats Derived
  const stats = useMemo(() => {
    const wpmSess = sess.filter(s => s.wpm > 0);
    const totalWords = sess.reduce((acc, s) => {
        // Estimate words if not stored: 1 min * WPM or 60s
        if (s.wpm > 0) return acc + s.wpm; // assume each session is ~1 min for now if duration not exact
        return acc + 100; // default for non-reading sessions
    }, 0);
    const maxWPM = wpmSess.length ? Math.max(...wpmSess.map(s => s.wpm)) : 0;
    const booksFinished = sess.filter(s => s.module === 'Kütüphane' || s.textTitle).length;
    
    // Streak logic
    const streak = user?.streak || 0; // Firebase'ten gelen streak

    return { totalWords, maxWPM, booksFinished, streak };
  }, [sess, user.streakFreeze]);

  // Use props isMobile or detect
  const mobile = isMobile !== undefined ? isMobile : window.innerWidth <= 768;

  const AVATARS = ['🚀', '⚡', '🧠', '🌟', '🔥', '🦁', '🦉', '💎', '🎯', '🥇'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 15 : 20 }}>
      <div>
        <div className="st">👤 Kullanıcı Profili</div>
        <div className="ss">Gelişimin, başarıların ve sosyal durumun.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 2fr', gap: 20, alignItems: 'start' }}>
        {/* Left Col: Identity */}
        <div className="card" style={{ textAlign: 'center', padding: mobile ? '20px 15px' : '30px 20px' }}>
          <div style={{ fontSize: mobile ? 60 : 80, marginBottom: 15, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,.3))' }}>
            {user.avatar || '🚀'}
          </div>
          <h2 style={{ margin: 0, fontSize: mobile ? 20 : 24, fontWeight: 800 }}>{user.name}</h2>
          <p style={{ color: 'var(--mu)', marginTop: 5, fontSize: mobile ? 12 : 14, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
          
          <div className="lb" style={{ margin: '15px auto', color: c.color, borderColor: c.color + '55', background: c.color + '15', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span>{c.code}</span><span> — </span><span>{c.name}</span>
            {user.isPro && <ProBadge />}
          </div>

          <div style={{ marginTop: 20, textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mu)', marginBottom: 8, textTransform: 'uppercase' }}>Avatar Değiştir</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {AVATARS.map(a => (
                <button key={a} className="btn bg bs" 
                  style={{ fontSize: 20, padding: 8, background: user.avatar === a ? 'rgba(255,255,255,.1)' : undefined }}
                  onClick={() => onUpdateAvatar(a)}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Stats & Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(140px, 1fr))', gap: mobile ? 10 : 12 }}>
            {[
              { label: 'Okunan Kelime', val: stats.totalWords.toLocaleString(), icon: '📊', color: '#06b6d4' },
              { label: 'En Yüksek WPM', val: stats.maxWPM, icon: '⚡', color: '#f59e0b' },
              { label: 'Bitirilen Metin', val: stats.booksFinished, icon: '📚', color: '#10b981' },
              { label: 'Günlük Seri', val: `${stats.streak} Gün`, icon: '🔥', color: '#f43f5e' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: mobile ? '12px 8px' : '16px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: mobile ? 20 : 24, marginBottom: 5 }}>{s.icon}</div>
                <div style={{ fontSize: mobile ? 16 : 20, fontWeight: 800, fontFamily: 'var(--mo)', color: s.color }}>{s.val}</div>
                <div style={{ fontSize: mobile ? 9 : 10, color: 'var(--mu)', textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 15 }}>🏅 Başarıların</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {(user.unlockedAchievements || []).length > 0 ? (
                (user.unlockedAchievements || []).map(achId => {
                   // Render unlocked achievements visually inside small pill badges
                   return (
                     <div key={achId} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--b2)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: 'var(--fg)' }}>
                       <span style={{ fontSize: 16 }}>🏆</span> {achId.replace('_', ' ').toUpperCase()}
                     </div>
                   );
                })
              ) : (
                <div style={{ fontSize: 12, color: 'var(--mu)' }}>Henüz açılan bir başarın yok. Antrenmanlara başla!</div>
              )}
            </div>
          </div>

          {/* Appearance Section */}
          <div className="card">
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 15 }}>🌓 Görünüm</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                className={`btn ${theme === 'dark' ? 'bp' : 'bg'} bs`} 
                style={{ flex: 1 }}
                onClick={() => setTheme('dark')}
              >
                🌙 Karanlık
              </button>
              <button 
                className={`btn ${theme === 'light' ? 'bp' : 'bg'} bs`} 
                style={{ flex: 1 }}
                onClick={() => setTheme('light')}
              >
                ☀️ Aydınlık
              </button>
            </div>
          </div>

          {/* FastRead Pro CTA */}
          <div className="card" style={{ border: '1px solid #f59e0b55', background: 'rgba(245,158,11,.05)' }}>
            <div style={{ display: 'flex', gap: 15, alignItems: 'center', flexDirection: mobile ? 'column' : 'row', textAlign: mobile ? 'center' : 'left' }}>
              <div style={{ fontSize: 32 }}>💎</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b' }}>FastRead Pro'ya Geç!</div>
                <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>Sınırsız hız modları, özel metinler ve reklamsız deneyim.</div>
              </div>
              <button className="btn bp" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', width: mobile ? '100%' : 'auto' }}>Yükselt</button>
            </div>
          </div>
          {/* Account Actions */}
          <div className="card" style={{ border: '1px solid rgba(239,68,68,.2)', background: 'rgba(239,68,68,.03)', marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Hesap İşlemleri</div>
                <div style={{ fontSize: 11, color: 'var(--mu)' }}>Oturumunu güvenli bir şekilde kapat.</div>
              </div>
              <button className="btn bg bs" style={{ color: '#f87171', borderColor: 'rgba(239,68,68,.3)' }} onClick={onLogout}>
                🚪 Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

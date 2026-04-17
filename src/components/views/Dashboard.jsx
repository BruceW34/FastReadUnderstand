import { useState, useEffect, useMemo } from 'react';
import { getLvl, LEVELS, fmt } from '@/data/levels.js';
import { db } from '@/services/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { AdSection } from '@/components/ads/AdSection';
import { BoltGuide } from '@/components/shared/BoltGuide';
import BoltInterstitial from '@/components/ads/BoltInterstitial';

export default function Dashboard({ user, onTabChange, onPremium }) {
  const { c, n, p } = getLvl(user.tecrube || 0); // Use tecrube (training TP) for levels, not global XP
  const sess = user.sessions || [];
  const [leaderboard, setLeaderboard] = useState([]);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [interstitialMsg, setInterstitialMsg] = useState("");

  // (Stats and Quests logic...)
  const stats = useMemo(() => {
    const wpmSess = sess.filter(s => s.wpm > 0);
    const avgWPM = wpmSess.length ? Math.round(wpmSess.reduce((a, s) => a + s.wpm, 0) / wpmSess.length) : 0;
    const bestWPM = wpmSess.length ? Math.max(...wpmSess.map(s => s.wpm)) : 0;
    const today = new Date().toDateString();
    const todaySess = sess.filter(s => new Date(s.date).toDateString() === today);
    const todayXP = todaySess.reduce((a, s) => a + (s.xpGained || 0), 0);
    const todayWords = todaySess.reduce((a, s) => a + (s.wpm || 100), 0);
    return { avgWPM, bestWPM, todayXP, todayWords, todayCount: todaySess.length };
  }, [sess]);

  const quests = [
    { id: 'xp', label: 'Hedef: 300 XP', current: stats.todayXP, total: 300, icon: '✨', color: '#f59e0b' },
    { id: 'words', label: 'Hedef: 1000 Kelime', current: stats.todayWords, total: 1000, icon: '📖', color: '#06b6d4' },
    { id: 'speed', label: 'WPM Testi Yap', current: sess.filter(s => s.module === 'WPM Testi' && new Date(s.date).toDateString() === new Date().toDateString()).length, total: 1, icon: '⚡', color: '#a855f7' },
  ];

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(3));
    const unsub = onSnapshot(q, (snap) => setLeaderboard(snap.docs.map(d => d.data())), (error) => {
      console.error('Error loading leaderboard:', error);
    });
    return () => unsub();
  }, []);

  const isMobile = window.innerWidth <= 768;

  // Bolt dynamic messaging
  const boltMsg = useMemo(() => {
    const hr = new Date().getHours();
    const welcome = hr < 12 ? "Günaydın Bruce! ☀️" : hr < 18 ? "Tünaydın Bruce! 👋" : "İyi akşamlar Bruce! 🌙";
    
    if (stats.todayCount === 0) return `${welcome} Bugün henüz antrenman yapmadın, haydi bir WPM testiyle başlayalım! ⚡`;
    if (stats.todayXP >= 500) return "Harikasın! Bugünkü XP hedefine ulaştın. Gerçek bir hız şampiyonusun! 🏆";
    return `Selam Bruce! Bugün ${stats.todayXP} XP topladın. Hedefe ulaşmak için biraz daha odaklanalım! 🚀`;
  }, [stats]);

  // Streak logic
  const streak = user?.streak || 0; // Firebase'ten gelen streak

  useEffect(() => {
    // Random Interstitial Chance
    if (Math.random() > 0.7 && !localStorage.getItem('bolt_seen_today')) {
      setInterstitialMsg("Selam Bruce! Hızını %20 artırmak için bugün 3 modül tamamlamaya ne dersin? Bolt her zaman yanında! ⚡🤖");
      setShowInterstitial(true);
      localStorage.setItem('bolt_seen_today', 'true');
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 18 : 24, animation: 'fadeIn 0.5s ease-out' }}>
      
      {showInterstitial && <BoltInterstitial message={interstitialMsg} onDismiss={() => setShowInterstitial(false)} />}

      {/* Bolt Coach */}
      <BoltGuide message={boltMsg} type={stats.todayXP >= 500 ? 'success' : 'tip'} style={{ position: 'relative', bottom: 'auto', right: 'auto', marginBottom: 20 }} />
      
      {/* 1. HERO STREAK & NEXT STEP */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: 20 }}>
        {/* Next Step CTA */}
        <div className="card" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          textAlign: 'center',
          border: '2px dashed var(--b2)',
          background: 'transparent',
          padding: isMobile ? 25 : 35,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <img src="assets/bolt.png" alt="Bolt" style={{ width: 100, height: 100, marginBottom: 15, filter: 'drop-shadow(0 0 15px var(--ac)44)' }} />
          <div style={{ fontWeight: 800, fontSize: 16 }}>Sıradaki Adım</div>
          <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 5, marginBottom: 15 }}>Hızını artırmak için Bolt'un tavsiyesine uy!</div>
          <button className="btn bp" style={{ width: isMobile ? '100%': 'auto', padding: isMobile ? '12px 20px' : '10px 25px', fontSize: 14, fontWeight: 800 }} onClick={() => onTabChange('flash')}>
            🚀 Flash Okuma Yap
          </button>
        </div>
      </div>

      {/* 2. DAILY QUESTS */}
      <div className="card">
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>🎯 Bugünkü Görevlerin</span>
          <div style={{ background: 'var(--b2)', fontSize: 10, padding: '2px 8px', borderRadius: 20, color: 'var(--mu)' }}>{quests.filter(q => q.current >= q.total).length}/3 TAMAMLANDI</div>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', 
          gap: isMobile ? 12 : 15 
        }}>
          {quests.map(q => {
            const prog = Math.min(100, (q.current / q.total) * 100);
            return (
              <div key={q.id} style={{ 
                background: 'var(--b0)', 
                padding: '12px', 
                borderRadius: '12px', 
                border: '1px solid var(--b1)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{q.icon}</span>
                    <span style={{ color: 'var(--mu)' }}>{q.label}</span>
                  </div>
                  <span>{prog === 100 ? '✅' : `${q.current}/${q.total}`}</span>
                </div>
                <div className="xbt" style={{ height: 6, background: 'var(--b1)' }}>
                  <div className="xbf" style={{ width: `${prog}%`, background: q.color, transition: 'width 1s ease-in-out' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. LEAGUE & PROGRESS SNAPSHOT */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1.5fr', gap: 24 }}>
          {/* Level Progress */}
          <div className="card">
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 15 }}>📈 Gelişim Yolculuğu</div>
            <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 20, flexDirection: isMobile ? 'column' : 'row' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', border: `4px solid ${c.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, background: c.color + '15', alignSelf: isMobile ? 'center' : 'auto' }}>
                {c.code}
              </div>
              <div style={{ flex: 1, width: '100%' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 4 }}>Sıradaki seviyeye {n?.xpRequired - user.xp} XP kaldı</div>
                <div className="xbt" style={{ height: 6, marginTop: 10 }}>
                   <div className="xbf" style={{ width: `${p}%`, background: c.color }} />
                </div>
              </div>
            </div>
            {/* Mini Roadmap Flow */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 25, position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: 'var(--b1)', zIndex: 0 }} />
              {[c.level, c.level+1, c.level+2].map(lv => {
                const targetL = LEVELS.find(l => l.level === lv);
                if (!targetL) return null;
                const active = user.xp >= targetL.xpRequired || lv === c.level;
                return (
                  <div key={lv} style={{ 
                    zIndex: 1, width: 32, height: 32, borderRadius: '50%', 
                    background: active ? targetL.color : 'var(--b0)',
                    border: `3px solid ${active ? 'var(--b3)' : 'var(--b1)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 900, color: active ? 'white' : 'var(--mu)'
                  }}>
                    {targetL.code}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mini League */}
          <div className="card">
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 15, display: 'flex', justifyContent: 'space-between' }}>
              <span>🏆 Lig Tahmini</span>
              <span style={{ fontSize: 11, color: '#f59e0b' }}>Gümüş Lig</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {leaderboard.map((lbUser, i) => (
                <div key={lbUser.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                   <div style={{ width: 20, fontWeight: 800, color: 'var(--mu)' }}>{i+1}</div>
                   <div style={{ fontSize: 18 }}>{lbUser.avatar}</div>
                   <div style={{ flex: 1, fontWeight: lbUser.id === user.id ? 700 : 400 }}>{lbUser.name} {lbUser.id === user.id && '(Sen)'}</div>
                   <div style={{ fontWeight: 700 }}>{lbUser.xp.toLocaleString()}</div>
                </div>
              ))}
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <button className="btn bg bs" style={{ fontSize: 11, padding: '6px 15px' }} onClick={() => onTabChange('profile')}>Tam Sıralama</button>
              </div>
            </div>
          </div>
      </div>

      <AdSection user={user} onClick={onPremium} style={{ marginTop: 15 }} />
    </div>
  );
}

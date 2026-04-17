import { useState, useEffect, useRef, useCallback } from 'react';
import { getLvl } from '@/data/levels.js';
import { storage } from '@/shared/storage';
import { auth, db } from '@/services/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// ─── BREATHING GUIDE (v2) ─────────────────────────────────────────────────────
// Inline breathing component that PAUSES reading and teaches proper breathing
// Research: Rhythmic breathing reduces subvocalization & improves focus
// Cycle: Inhale 4s → Hold 2s → Exhale 4s (simple, effective)
export function BreathingGuide({ active, wordsRead, breatheEvery = 50, onPause, onResume }) {
  const [breathing, setBreathing] = useState(false);
  const [phase, setPhase] = useState(null); // null, 'inhale', 'hold', 'exhale'
  const [progress, setProgress] = useState(0);
  const [approaching, setApproaching] = useState(false);
  const timerRef = useRef(null);
  const lastBreathRef = useRef(0);
  const breathingRef = useRef(false);

  const PHASES = [
    { id: 'inhale', label: 'Burundan Nefes Al', icon: '🫁', duration: 4000, color: '#10b981' },
    { id: 'hold',   label: 'Tut',              icon: '⏸️', duration: 2000, color: '#f59e0b' },
    { id: 'exhale', label: 'Ağızdan Nefes Ver', icon: '💨', duration: 4000, color: '#06b6d4' },
  ];

  // Detect approaching breath point (5 words before)
  useEffect(() => {
    if (!active || !wordsRead || breathingRef.current) return;
    const nextBreath = (Math.floor(lastBreathRef.current / breatheEvery) + 1) * breatheEvery;
    const remaining = nextBreath - wordsRead;
    if (remaining <= 5 && remaining > 0) {
      setApproaching(true);
    } else {
      setApproaching(false);
    }
  }, [wordsRead, active, breatheEvery]);

  // Trigger breathing cycle
  useEffect(() => {
    if (!active || !wordsRead || breathingRef.current) return;
    if (wordsRead > 0 && wordsRead >= breatheEvery && wordsRead % breatheEvery === 0 && wordsRead !== lastBreathRef.current) {
      lastBreathRef.current = wordsRead;
      breathingRef.current = true;
      setBreathing(true);
      setApproaching(false);
      if (onPause) onPause(); // PAUSE reading!

      let pi = 0;
      const runPhase = () => {
        if (pi >= PHASES.length) {
          // Breathing done → resume reading
          breathingRef.current = false;
          setBreathing(false);
          setPhase(null);
          setProgress(0);
          if (onResume) onResume();
          return;
        }
        const p = PHASES[pi];
        setPhase(p.id);
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const pct = Math.min((elapsed / p.duration) * 100, 100);
          setProgress(pct);
          if (pct < 100) {
            timerRef.current = requestAnimationFrame(tick);
          } else {
            pi++;
            runPhase();
          }
        };
        timerRef.current = requestAnimationFrame(tick);
      };
      runPhase();
    }
    return () => { if (timerRef.current) cancelAnimationFrame(timerRef.current); };
  }, [wordsRead, active, breatheEvery, onPause, onResume]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      breathingRef.current = false;
    };
  }, []);

  // Reset when deactivated
  useEffect(() => {
    if (!active) {
      lastBreathRef.current = 0;
      breathingRef.current = false;
      setBreathing(false);
      setApproaching(false);
      setPhase(null);
    }
  }, [active]);

  const currentPhase = PHASES.find(p => p.id === phase);

  // Approaching indicator: small lung icon pulsing on the side
  if (approaching && !breathing) {
    return (
      <div className="breath-approach">
        <div className="breath-lung-pulse">🫁</div>
        <span>Nefes yaklaşıyor...</span>
      </div>
    );
  }

  // Active breathing cycle: inline panel
  if (!breathing || !currentPhase) return null;

  const scale = phase === 'inhale' ? 0.7 + (progress / 333)
    : phase === 'exhale' ? 1 - (progress / 333)
    : 1;

  return (
    <div className="breath-panel">
      <div className="breath-panel-inner">
        <div className="breath-circle-wrap">
          <svg viewBox="0 0 100 100" className="breath-ring">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="4" />
            <circle cx="50" cy="50" r="44" fill="none" stroke={currentPhase.color}
              strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.1s linear', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
          </svg>
          <div className="breath-lung" style={{ transform: `scale(${scale})`, transition: 'transform 0.3s ease' }}>
            🫁
          </div>
        </div>
        <div className="breath-info">
          <div className="breath-label" style={{ color: currentPhase.color }}>
            {currentPhase.icon} {currentPhase.label}
          </div>
          <div className="breath-sub">
            ⏸ Okuma duraklatıldı • Nefes döngüsü tamamlanınca devam edecek
          </div>
          <div className="breath-phases">
            {PHASES.map(p => (
              <span key={p.id} className={`breath-phase-dot ${phase === p.id ? 'active' : ''}`}
                style={{ background: phase === p.id ? p.color : 'rgba(255,255,255,.15)', borderColor: p.color }}>
                {p.icon}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
export function Toasts({ toasts }) {
  return (
    <div className="tc">
      {toasts.map(t => (
        <div key={t.id} className="toast" style={{ borderColor: t.color || 'rgba(255,255,255,.15)' }}>
          {t.icon && <span style={{ marginRight: 7 }}>{t.icon}</span>}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export function Auth({ onLogin, addToast }) {
  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    setErr('');
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCred.user;
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        onLogin(docSnap.data());
      } else {
        const userData = { id: user.uid, name: user.displayName || 'Kullanıcı', email: user.email, xp: 0, sessions: [], isPro: false };
        await setDoc(doc(db, "users", user.uid), userData);
        onLogin(userData);
      }
      addToast({ msg: `Tekrar hoş geldin!`, color: '#10b981', icon: '⚡' });
    } catch (e) {
      console.error('Login error:', e);
      let msg = 'Giriş başarısız.';
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential' || e.code === 'auth/invalid-login-credentials') {
        msg = 'Hatalı giriş bilgileri.';
      } else if (e.code === 'auth/invalid-email') {
        msg = 'Geçersiz e-posta formatı.';
      }
      setErr(msg + ' (' + e.code + ')');
    } finally {
      setLoading(false);
    }
  };

  const reg = async () => {
    if (!name.trim() || !email.trim() || pass.length < 6)
      return setErr('Tüm alanları doldurun (şifre min 6 karakter).');
    
    setLoading(true);
    setErr('');
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCred.user;
      await updateProfile(user, { displayName: name });
      
        const userData = {
          id: user.uid,
          name,
          email,
          xp: 0,
          friends: [], // Added friends array
          sessions: [],
          avatar: '🚀',
          isPro: false,
          joinedAt: new Date().toISOString()
        };
      await setDoc(doc(db, "users", user.uid), userData);
      onLogin(userData);
      addToast({ msg: `Hoş geldin, ${name}!`, color: '#10b981', icon: '👋' });
    } catch (e) {
      console.error(e);
      let msg = 'Kayıt başarısız.';
      if (e.code === 'auth/email-already-in-use') msg = 'Bu e-posta zaten kayıtlı.';
      if (e.code === 'auth/invalid-email') msg = 'Geçersiz e-posta formatı.';
      if (e.code === 'auth/weak-password') msg = 'Şifre çok zayıf.';
      setErr(msg + ' (' + e.code + ')');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="as">
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 52, marginBottom: 6, filter: 'drop-shadow(0 0 20px rgba(124,58,237,.9))' }}>⚡</div>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1 }}>FastRead</div>
        <div style={{ color: 'var(--mu)', fontSize: 13, marginTop: 5 }}>Profesyonel okuma hızı eğitim platformu</div>
      </div>
      <div className="card" style={{ width: 360 }}>
        <div className="tabs" style={{ marginBottom: 22 }}>
          <button className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setErr(''); }}>Giriş Yap</button>
          <button className={`tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setErr(''); }}>Kayıt Ol</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tab === 'register' && <input className="ai" placeholder="Adın" value={name} onChange={e => setName(e.target.value)} />}
          <input className="ai" placeholder="E-posta" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="ai" placeholder="Şifre" type="password" value={pass} onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (tab === 'login' ? login() : reg())} />
          {err && <div style={{ color: '#f87171', fontSize: 12 }}>{err}</div>}
          <button className="btn bp" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            disabled={loading}
            onClick={tab === 'login' ? login : reg}>
            {loading ? 'Bekleyin...' : (tab === 'login' ? 'Giriş Yap' : 'Hesap Oluştur')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
export function Header({ user }) {
  const { c, n, p } = getLvl(user.tecrube || 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -.5 }}>Merhaba, {user.name} 👋</div>
        <div style={{ color: 'var(--mu)', fontSize: 12, marginTop: 2 }}>
          TP: <span style={{ color: 'var(--ac2)', fontFamily: 'var(--mo)', fontWeight: 600 }}>{(user.tecrube || 0).toLocaleString()}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ textAlign: 'right' }}>
          <div className="lb" style={{ color: c.color, borderColor: c.color + '55', background: c.color + '15' }}>
            <span>{c.code}</span><span> — </span><span>{c.name}</span>
          </div>
          <div style={{ marginTop: 7, minWidth: 150 }}>
            <div className="xbt">
              <div className="xbf" style={{ width: `${p}%`, background: `linear-gradient(90deg,${c.color},${n?.color || c.color})` }} />
            </div>
            {n && <div style={{ fontSize: 10, color: 'var(--mu)', marginTop: 2, textAlign: 'right' }}>
              {(n.xpRequired - (user.tecrube || 0)).toLocaleString()} TP → {n.code}
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TEXT SELECT ──────────────────────────────────────────────────────────────
export function TextSelect({ value, onChange, texts }) {
  return (
    <select value={value} onChange={e => onChange(texts.find(t => t.id === e.target.value))}>
      {texts.map(t => (
        <option key={t.id} value={t.id}>[{t.category}] {t.title}</option>
      ))}
    </select>
  );
}

// ─── QUIZ ─────────────────────────────────────────────────────────────────────
export function Quiz({ text, onDone, addToast }) {
  const qs = text.questions || [];
  const [ans, setAns] = useState({});
  const [rev, setRev] = useState(false);
  const [score, setScore] = useState(0);

  if (!qs.length) return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ color: 'var(--mu)' }}>Bu metin için soru tanımlanmamış.</div>
      <button className="btn bp" style={{ marginTop: 16 }} onClick={() => onDone(0)}>Devam</button>
    </div>
  );

  const reveal = () => {
    if (Object.keys(ans).length < qs.length) return;
    let s = 0;
    qs.forEach((q, i) => { if (ans[i] === q.correct) s++; });
    setScore(s);
    setRev(true);
    if (s === qs.length) addToast({ msg: '🎯 Mükemmel anlama! +200 TP', color: '#10b981', icon: '🎯' });
  };

  const xpMap = [0, 25, 50, 100];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div className="st">📝 Anlama Testi</div>
        <div className="ss">"{text.title}" metnini ne kadar anladın?</div>
      </div>
      {qs.map((q, qi) => (
        <div key={qi} className="card">
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>{qi + 1}. {q.question}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {q.options.map((opt, oi) => {
              let cl = 'qo';
              if (rev) {
                if (oi === q.correct) cl += ' correct';
                else if (ans[qi] === oi && oi !== q.correct) cl += ' wrong-a';
              } else if (ans[qi] === oi) cl += ' correct';
              return (
                <button key={oi} className={cl} disabled={rev}
                  onClick={() => !rev && setAns(a => ({ ...a, [qi]: oi }))}>
                  {String.fromCharCode(65 + oi)}. {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {!rev ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'stretch' }}>
          <button
            className="btn bp"
            disabled={Object.keys(ans).length < qs.length}
            onClick={reveal}
          >
            Sonuçları Gör
          </button>
          <button
            className="btn"
            title="Soruları cevaplanmadan quizi atla"
            onClick={() => { addToast({ msg: '⏭️ Quiz atlandı', color: '#f59e0b', icon: '⏭️' }); onDone(0); }}
            style={{ 
              background: '#f59e0b33', 
              color: '#f59e0b', 
              border: '2px solid #f59e0b', 
              fontWeight: 700,
              padding: '10px 16px',
              cursor: 'pointer',
              borderRadius: 8,
              fontSize: 14,
              whiteSpace: 'nowrap'
            }}
          >
            ⏭️ Quizi Atla
          </button>
        </div>
      ) : (
        <div
          className="card"
          style={{
            textAlign: 'center',
            background:
              score === qs.length
                ? 'rgba(16,185,129,.1)'
                : 'rgba(124,58,237,.1)',
          }}
        >
          <div style={{ fontSize: 44 }}>
            {score === qs.length ? '🎯' : score >= 2 ? '👍' : '📚'}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>
            {score} / {qs.length}
          </div>
          <div style={{ color: 'var(--mu)', marginTop: 4 }}>
            {score === qs.length
              ? 'Mükemmel! Tam puan!'
              : score >= 2
              ? 'İyi iş!'
              : 'Metni tekrar oku.'}
          </div>
          <div
            style={{
          color: '#34d399',
              fontFamily: 'var(--mo)',
              fontSize: 18,
              marginTop: 6,
            }}
          >
            +{Math.round((xpMap[Math.min(score, 3)] ||
              Math.round((score / qs.length) * 200)) * 0.5)}{' '}
            TP
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn bp"
              style={{ marginTop: 14 }}
              onClick={() =>
                onDone(
                  Math.round((xpMap[Math.min(score, 3)] ||
                    Math.round((score / qs.length) * 200)) * 0.5),
                )
              }
            >
              Devam Et
            </button>
            <button
              className="btn"
              style={{ 
                marginTop: 14, 
                background: '#f59e0b33', 
                color: '#f59e0b', 
                border: '2px solid #f59e0b', 
                fontWeight: 700,
                padding: '10px 16px',
                cursor: 'pointer',
                borderRadius: 8,
                fontSize: 14,
                whiteSpace: 'nowrap'
              }}
              onClick={() => onDone(0)}
            >
              ⏭️ Atla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── PRO GUARD ────────────────────────────────────────────────────────────────
// Visual paywall for locked features
export function ProGuard({ children, isPro, message = "Bu özellik FastRead Pro aboneliği gerektirir." }) {
  if (isPro) return children;
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12 }}>
      <div style={{ filter: 'blur(8px)', pointerEvents: 'none', opacity: .4, userSelect: 'none' }}>
        {children}
      </div>
      <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', 
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20,
          background: 'rgba(0,0,0,.6)', zIndex: 10
      }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b', maxWidth: 280 }}>{message}</div>
        <button className="btn bp" style={{ marginTop: 15, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
             💎 Pro'ya Geç ve Kilidi Aç
        </button>
      </div>
    </div>
  );
}

export function ProBadge() {
  return (
    <span style={{ 
        fontSize: 10, fontWeight: 900, background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: '#fff', padding: '2px 6px', borderRadius: 4, marginLeft: 6, verticalAlign: 'middle',
        boxShadow: '0 2px 5px rgba(217,119,6,.4)'
    }}>PRO</span>
  );
}

// ─── PUBLIC PROFILE PAGE (Instagram/Duolingo Style) ─────────────────────────
export function PublicProfileModal({ currentUser, targetUser, onClose, addToast }) {
  if (!targetUser) return null;
  const { c } = getLvl(targetUser.tecrube || 0);

  const handleAction = async (type) => {
    if (type === 'add') {
      try {
        // Send a friend request instead of outright adding
        await updateDoc(doc(db, "users", targetUser.id), {
          friendRequests: arrayUnion({ id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar, type: 'friend' })
        });
        addToast({ msg: `${targetUser.name}'e arkadaşlık isteği gönderildi!`, color: '#10b981', icon: '📩' });
      } catch (e) {
        addToast({ msg: `İstek gönderilemedi.`, color: '#ef4444' });
      }
    } else if (type === 'duel') {
      try {
        await updateDoc(doc(db, "users", targetUser.id), {
          friendRequests: arrayUnion({ id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar, type: 'duel' })
        });
        addToast({ msg: `${targetUser.name}'e düello daveti gönderildi! ⚔️`, color: '#f59e0b', icon: '⚔️' });
      } catch(e) {}
    } else if (type === 'coop') {
      try {
        await updateDoc(doc(db, "users", targetUser.id), {
          friendRequests: arrayUnion({ id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar, type: 'coop' })
        });
        addToast({ msg: `${targetUser.name} ile co-op daveti gönderildi! 🤝`, color: '#3b82f6', icon: '🤝' });
      } catch(e) {}
    }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 6000, 
      background: 'var(--bg)', overflowY: 'auto'
    }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 600, margin: '0 auto', background: 'var(--b1)', minHeight: '100vh' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', zIndex: 10, width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        
        {/* Header Cover */}
        <div style={{ height: 180, background: `linear-gradient(135deg, ${c.color}33, ${c.color}99)` }} />
        
        <div style={{ padding: '0 20px 25px 20px', textAlign: 'center', marginTop: -50 }}>
          <div style={{ 
            fontSize: 60, width: 100, height: 100, margin: '0 auto 15px', background: 'var(--b0)', 
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            border: `4px solid ${c.color}`, boxShadow: '0 8px 20px rgba(0,0,0,0.3)' 
          }}>
            {targetUser.avatar || '👤'}
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>{targetUser.name}</h2>
          <div style={{ fontSize: 13, color: 'var(--mu)', marginTop: 4 }}>{c.code} • <span style={{ color: c.color, fontWeight: 700 }}>{c.name}</span></div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, margin: '25px 0', borderTop: '1px solid var(--b2)', borderBottom: '1px solid var(--b2)', padding: '20px 0' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--fg)' }}>{(targetUser.tecrube || 0).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--mu)', textTransform: 'uppercase', fontWeight: 800 }}>TP</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--b2)', borderRight: '1px solid var(--b2)' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--fg)' }}>{c.code}</div>
              <div style={{ fontSize: 11, color: 'var(--mu)', textTransform: 'uppercase', fontWeight: 800 }}>KADEME</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--fg)' }}>{(targetUser.friends || []).length}</div>
              <div style={{ fontSize: 11, color: 'var(--mu)', textTransform: 'uppercase', fontWeight: 800 }}>Dostlar</div>
            </div>
          </div>
          
          {currentUser.id !== targetUser.id && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: 30 }}>
              {!currentUser.friends?.includes(targetUser.id) ? (
                <button 
                  className="btn bp" 
                  disabled={(targetUser.friendRequests || []).some(r => r.id === currentUser.id && r.type === 'friend')}
                  style={{ width: '100%', padding: '16px', justifyContent: 'center', fontSize: 16, borderRadius: 12 }} 
                  onClick={(e) => {
                    handleAction('add');
                    e.currentTarget.innerText = 'İstek Gönderildi ✅';
                    e.currentTarget.disabled = true;
                  }}
                >
                  {(targetUser.friendRequests || []).some(r => r.id === currentUser.id && r.type === 'friend') ? 'İstek Gönderildi ✅' : 'İstek Gönder ➕'}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 15 }}>
                  <button 
                    className="btn bp" 
                    style={{ flex: 1, padding: '16px', justifyContent: 'center', fontSize: 16, borderRadius: 12 }} 
                    onClick={(e) => {
                        handleAction('duel');
                        e.currentTarget.innerText = 'Davet Gönderildi ✅';
                        e.currentTarget.disabled = true;
                    }}
                  >
                    ⚔️ Düello Daveti
                  </button>
                  <button 
                    className="btn bg" 
                    style={{ flex: 1, padding: '16px', justifyContent: 'center', fontSize: 16, borderRadius: 12, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderColor: 'rgba(59,130,246,0.2)' }} 
                    onClick={(e) => {
                        handleAction('coop');
                        e.currentTarget.innerText = 'Davet Gönderildi ✅';
                        e.currentTarget.disabled = true;
                    }}
                  >
                    🤝 Co-op Daveti
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

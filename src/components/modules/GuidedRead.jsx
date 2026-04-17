import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getLvl, fmt } from '@/data/levels.js';
import { TextSelect, Quiz, ProBadge } from '@/components/shared/Shared';
import { BoltCoach } from '@/components/shared/BoltCoach';
import { PageWrapper, AnimCard, TipBox, HeaderSection } from './PageWrapper.jsx';

// ─── KILAVUZLU OKUMA ──────────────────────────────────────────────────────────
export function GuidedRead({ user, onXP, addToast, texts, isPro, isMobile, setFocusMode }) {
  const [sel, setSel] = useState(texts[0]);
  const [wpm, setWpm] = useState(isMobile ? 250 : 300);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [showQ, setShowQ] = useState(false);
  const [guideMode, setGuideMode] = useState('line');
  const [lineIdx, setLineIdx] = useState(0);
  const [pct, setPct] = useState(0);
  const [lastXP, setLastXP] = useState(null);
  const ir = useRef(null); const ar = useRef(null);
  const { c } = getLvl(user.tecrube || 0);
  const WPL = isMobile ? 6 : 8;
  const words = useMemo(() => sel.content.split(/\s+/).filter(Boolean), [sel]);
  const lines = useMemo(() => {
    const l = [];
    for (let i = 0; i < words.length; i += WPL) l.push(words.slice(i, i + WPL).join(' '));
    return l;
  }, [words, WPL]);

  const startRef = useRef(null);
  startRef.current = () => {
    clearInterval(ir.current); ir.current = null;
    cancelAnimationFrame(ar.current); ar.current = null;
    setRunning(true); setDone(false); setFocusMode(true); setLastXP(null);

    if (guideMode === 'line') {
      let i = 0; setLineIdx(0);
      ir.current = setInterval(() => {
        if (i >= lines.length) {
          clearInterval(ir.current); ir.current = null;
          setRunning(false); setDone(true); setFocusMode(false);
          const g = Math.round(words.length * (wpm / 200) * (6 + c.level / 2) * 0.5);
          setLastXP(g);
          onXP(g, wpm, sel.title, 'Kılavuzlu Okuma');
          addToast({ msg: `+${g} XP! ⚡`, color: '#10b981', icon: '⚡' });
          return;
        }
        setLineIdx(i); i++;
      }, (60000 / wpm) * WPL);
    } else {
      setPct(0);
      const dur = (words.length / wpm) * 60000;
      const startMs = Date.now();
      const tick = () => {
        const p = Math.min(((Date.now() - startMs) / dur) * 100, 100);
        setPct(p);
        if (p < 100) { ar.current = requestAnimationFrame(tick); }
        else {
          ar.current = null;
          setRunning(false); setDone(true); setFocusMode(false);
          const g = Math.round(words.length * (wpm / 200) * (6 + c.level / 2) * 0.5);
          setLastXP(g);
          onXP(g, wpm, sel.title, 'Kılavuzlu Okuma');
          addToast({ msg: `+${g} XP! ⚡`, color: '#8b5cf6', icon: '⚡' });
        }
      };
      ar.current = requestAnimationFrame(tick);
    }
  };

  const start = () => { if (typeof startRef.current === 'function') startRef.current(); };

  const stop = useCallback(() => {
    clearInterval(ir.current); cancelAnimationFrame(ar.current);
    ir.current = null; ar.current = null;
    setRunning(false); setFocusMode(false);
  }, [setFocusMode]);

  const reset = useCallback(() => {
    clearInterval(ir.current); cancelAnimationFrame(ar.current);
    ir.current = null; ar.current = null;
    setRunning(false); setLineIdx(0); setPct(0); setDone(false);
    setFocusMode(false); setLastXP(null);
  }, [setFocusMode]);

  useEffect(() => () => {
    clearInterval(ir.current); cancelAnimationFrame(ar.current);
    ir.current = null; ar.current = null;
    setFocusMode(false);
  }, [setFocusMode]);

  const MODES = [
    { id: 'line', icon: '📄', label: 'Satır Vurgulama', color: '#10b981' },
    { id: 'pacer', icon: '⏱️', label: 'Işık Çubuğu', color: '#8b5cf6' },
    { id: 'scroll', icon: '📜', label: 'Oto-Kaydırma', color: '#06b6d4' },
  ];
  const activeMode = MODES.find(m => m.id === guideMode);

  if (showQ) return (
    <PageWrapper animationType="slide">
      <Quiz text={sel} onDone={(x) => { setShowQ(false); if (x) onXP(x, wpm, sel.title, 'Quiz'); }} addToast={addToast} />
    </PageWrapper>
  );

  return (
    <PageWrapper animationType="flip">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {!running && (
          <HeaderSection icon="📖" title="Kılavuzlu Okuma" subtitle="Tempo ve ritim odaklı görsel rehberlik." />
        )}

        {!running && (
          <AnimCard delay={0.05} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 18px',
            background: 'rgba(16,185,129,.08)',
            border: '1px solid rgba(16,185,129,.2)',
            borderRadius: 16,
          }}>
            <img src="assets/bolt.png" alt="Bolt" style={{
              width: 56, height: 56, objectFit: 'contain',
              filter: 'drop-shadow(0 0 8px rgba(16,185,129,.5))',
              animation: 'boltBounce 2s ease-in-out infinite',
              flexShrink: 0,
            }} />
            <div style={{ fontSize: 13, fontWeight: 700, fontStyle: 'italic', color: 'var(--tx)', lineHeight: 1.5 }}>
              "Rehber çubuğu gözün boşuna dolaşmasını engeller. <em>Akışa bırak</em>! ⚡"
            </div>
          </AnimCard>
        )}

        <AnimCard delay={0.08} style={{
          background: 'rgba(255,255,255,.02)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 20,
          padding: running ? (isMobile ? '20px 15px' : '40px 25px') : '22px',
          transition: 'padding .3s ease',
        }}>
          {!running && <TipBox>💡 <strong>Bilim:</strong> Pacer kullanımı gereksiz göz sıçramalarını engeller ve odaklanmayı %30'a kadar artırır.</TipBox>}

          {/* Mod seçici */}
          {!running && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {MODES.map((m, i) => (
                <button key={m.id}
                  className="btn-hov"
                  onClick={() => { if (!running) { setGuideMode(m.id); reset(); } }}
                  style={{
                    flex: 1, padding: '10px 6px', borderRadius: 12, border: 'none',
                    background: guideMode === m.id ? `${m.color}22` : 'rgba(255,255,255,.04)',
                    color: guideMode === m.id ? m.color : 'var(--mu)',
                    fontWeight: guideMode === m.id ? 800 : 600,
                    fontSize: 12, cursor: 'pointer',
                    outline: guideMode === m.id ? `1.5px solid ${m.color}44` : '1px solid rgba(255,255,255,.06)',
                    transition: 'all .2s',
                    animation: `cardReveal .35s ${i * .05}s both`,
                  }}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{m.icon}</div>
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {/* Ayarlar */}
          {!running && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextSelect value={sel.id} onChange={t => { setSel(t); reset(); }} texts={texts} />
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 180 }}>
                <span style={{ fontSize: 11, color: 'var(--mu)', whiteSpace: 'nowrap', fontFamily: 'var(--mo)', fontWeight: 700 }}>{wpm} WPM</span>
                <input type="range" min={100} max={2000} step={25} value={wpm}
                  style={{ '--pct': `${((wpm - 100) / 1900) * 100}%` }}
                  onChange={e => !running && setWpm(+e.target.value)} />
                {wpm > 1200 && !isPro && <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 800 }}>PRO <ProBadge /></div>}
              </div>
            </div>
          )}

          {/* Mod aktif göstergesi (running) */}
          {running && (
            <div style={{
              display: 'flex', justifyContent: 'center', marginBottom: 16,
              animation: 'pageFadeIn .3s both',
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 18px', borderRadius: 20,
                background: `${activeMode?.color}18`,
                border: `1px solid ${activeMode?.color}44`,
                color: activeMode?.color, fontSize: 12, fontWeight: 700,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: activeMode?.color, animation: 'pulseGlow 1.5s infinite' }} />
                {activeMode?.icon} {activeMode?.label} — {wpm} WPM
              </div>
            </div>
          )}

          {/* ─ Satır vurgulama modu ─ */}
          {guideMode === 'line' && (
            <div style={{ maxHeight: running ? '70vh' : 340, overflowY: 'auto', padding: '12px 0' }}>
              {lines.map((line, i) => (
                <div key={i}
                  className={`chunk-line ${i === lineIdx && running ? 'active-line' : ''} ${i < lineIdx ? 'done-line' : ''}`}
                  style={{ fontSize: running ? 'clamp(1.1rem, 2.5vw, 1.8rem)' : undefined, lineHeight: 1.8, transition: 'all .15s' }}>
                  {line}
                </div>
              ))}
            </div>
          )}

          {/* ─ Işık çubuğu modu ─ */}
          {guideMode === 'pacer' && (
            <div style={{
              position: 'relative', padding: isMobile ? 15 : 22, borderRadius: 14,
              border: '1px solid rgba(255,255,255,.07)', background: 'rgba(0,0,0,.25)',
              lineHeight: 2.2, fontSize: running ? 'clamp(1rem, 2vw, 1.5rem)' : 17,
              overflow: 'hidden', maxHeight: running ? '72vh' : 360,
            }}>
              {sel.content}
              <div style={{
                position: 'absolute', left: 0, right: 0, height: 36, top: `${pct}%`,
                background: `linear-gradient(to bottom, transparent, ${c.color}1a, ${c.color}2a, ${c.color}1a, transparent)`,
                borderTop: `2px solid ${c.color}`,
                boxShadow: `0 0 20px ${c.color}55, 0 0 40px ${c.color}22`,
                transition: running ? 'top 0.05s linear' : 'none',
                pointerEvents: 'none',
                display: running || done ? 'block' : 'none',
              }} />
            </div>
          )}

          {/* ─ Otomatik kaydırma modu ─ */}
          {guideMode === 'scroll' && (
            <div style={{
              position: 'relative', maxHeight: running ? '72vh' : 360,
              overflow: 'hidden', borderRadius: 14,
              border: '1px solid rgba(255,255,255,.07)', background: 'rgba(0,0,0,.25)',
            }}>
              <div style={{ transform: `translateY(-${pct * (isMobile ? 2.5 : 2)}%)`, transition: 'transform 0.1s linear', padding: isMobile ? 15 : 22 }}>
                <p style={{ lineHeight: 2.2, fontSize: running ? 'clamp(1rem, 2vw, 1.5rem)' : 17 }}>{sel.content}</p>
              </div>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(to bottom, rgba(0,0,0,.7), transparent)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(to top, rgba(0,0,0,.7), transparent)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: '48%', left: 0, right: 0, height: 3, background: c.color, boxShadow: `0 0 12px ${c.color}`, opacity: running ? 1 : .3, transition: 'opacity .3s' }} />
            </div>
          )}

          {/* İlerleme çubuğu */}
          <div style={{ marginTop: 14 }}>
            <div className="xbt" style={{ height: 6, borderRadius: 99 }}>
              <div className="xbf" style={{
                width: `${guideMode === 'line' ? (lines.length > 0 ? (lineIdx / lines.length) * 100 : 0) : pct}%`,
                background: `linear-gradient(90deg, ${activeMode?.color || c.color}, ${activeMode?.color || c.color}cc)`,
                transition: 'width .1s linear',
                boxShadow: running ? `0 0 8px ${activeMode?.color || c.color}88` : 'none',
              }} />
            </div>
          </div>

          {/* Tamamlandı XP */}
          {done && lastXP && (
            <div style={{ textAlign: 'center', marginTop: 14, animation: 'successPop .4s both' }}>
              <div style={{
                display: 'inline-block',
                background: `linear-gradient(135deg, ${activeMode?.color}22, ${activeMode?.color}11)`,
                border: `1px solid ${activeMode?.color}44`,
                borderRadius: 16, padding: '10px 24px',
                fontSize: 20, fontWeight: 900, color: activeMode?.color, fontFamily: 'var(--mo)',
              }}>+{lastXP} XP 📖</div>
            </div>
          )}

          {/* Kontroller */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            {!running ? (
              wpm > 1200 && !isPro
                ? <button className="btn bp" style={{ background: 'linear-gradient(135deg,#444,#222)', cursor: 'not-allowed' }} disabled>🔒 Pro Gerekli</button>
                : <button className="btn bp btn-hov" onClick={start}>{done ? '🔄 Tekrar' : '▶ Başla'}</button>
            ) : <button className="btn bd btn-hov" onClick={stop}>⏸ Dur</button>}
            <button className="btn bg btn-hov" onClick={reset}>↺ Baştan</button>
            {done && <button className="btn bg btn-hov" onClick={() => setShowQ(true)}>📝 Test</button>}
          </div>
        </AnimCard>
      </div>
    </PageWrapper>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { getLvl, fmt } from '@/data/levels.js';
import { TextSelect, Quiz } from '@/components/shared/Shared';
import { PageWrapper, AnimCard, TipBox, HeaderSection } from './PageWrapper.jsx';

// ─── REGRESSION BLOCKER ───────────────────────────────────────────────────────
export function Regress({ user, onXP, addToast, texts, isMobile, setFocusMode }) {
  const [sel, setSel] = useState(texts[0]);
  const [speed, setSpeed] = useState(200);
  const [running, setRunning] = useState(false);
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  const [showQ, setShowQ] = useState(false);
  const [lastXP, setLastXP] = useState(null);
  const ar = useRef(null); const sr = useRef(null);
  const { c } = getLvl(user.tecrube || 0);

  const start = () => {
    setRunning(true); setPct(0); setFocusMode(true); setLastXP(null);
    const wds = sel.content.split(/\s+/).length;
    const dur = (60000 / speed) * wds;
    sr.current = Date.now();
    const tick = () => {
      const p = Math.min(((Date.now() - sr.current) / dur) * 100, 100);
      setPct(p);
      if (p < 100) { ar.current = requestAnimationFrame(tick); }
      else {
        setRunning(false); setDone(true); setFocusMode(false);
        const g = Math.round(wds * (speed / 200) * (4 + c.level / 2.5) * 0.5);
        setLastXP(g);
        onXP(g, speed, sel.title, 'Regresyon Engeli');
        addToast({ msg: '+' + g + ' XP! Regresyon sifir!', color: '#f59e0b', icon: '🚫' });
      }
    };
    ar.current = requestAnimationFrame(tick);
  };

  const stop = () => { cancelAnimationFrame(ar.current); setRunning(false); setFocusMode(false); };
  useEffect(() => () => { cancelAnimationFrame(ar.current); setFocusMode(false); }, [setFocusMode]);

  if (showQ) return (
    <PageWrapper animationType="slide">
      <Quiz text={sel} onDone={(x) => { setShowQ(false); if (x) onXP(x, speed, sel.title, 'Quiz'); }} addToast={addToast} />
    </PageWrapper>
  );

  return (
    <PageWrapper animationType="flip">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!running && (
          <div style={{ animation: 'pageSlideUp .3s both' }}>
            <div className="st">🚫 Regresyon Engeli</div>
            <div className="ss">Geriye dönmeyi fiziksel olarak engelle, sadece ileri bak.</div>
          </div>
        )}

        {!running && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 18px',
            background: 'rgba(245,158,11,.07)',
            border: '1px solid rgba(245,158,11,.2)',
            borderRadius: 16,
            animation: 'cardReveal .35s .05s both',
          }}>
            <img src="assets/bolt.png" alt="Bolt" style={{
              width: 56, height: 56, objectFit: 'contain',
              filter: 'drop-shadow(0 0 8px rgba(245,158,11,.4))',
              animation: 'boltBounce 2s ease-in-out infinite',
              flexShrink: 0,
            }} />
            <div style={{ fontSize: 13, fontWeight: 700, fontStyle: 'italic', color: 'var(--tx)', lineHeight: 1.5 }}>
              "Bir kez oku, tam anla! Geri dönmek hızını yüzde 30 düşürür. 🚫"
            </div>
          </div>
        )}

        <div style={{
          background: 'rgba(255,255,255,.02)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 20,
          padding: running ? (isMobile ? '20px 15px' : '40px 25px') : '22px',
          transition: 'padding .3s ease',
          animation: 'cardReveal .4s .08s both',
        }}>
          {!running && (
            <div className="tip-box" style={{ animation: 'tipSlide .4s .1s both' }}>
              💡 <strong>Bilim:</strong> Okuma sırasındaki geri dönüşler (regresyon) hızı %30 düşürür. Bu modül beynine "bir kez oku, tam anla" komutu verir.
            </div>
          )}

          {!running && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextSelect value={sel.id} onChange={t => { stop(); setSel(t); setPct(0); setDone(false); }} texts={texts} />
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--mu)', whiteSpace: 'nowrap', fontFamily: 'var(--mo)', fontWeight: 700 }}>{speed} WPM</span>
                <input type="range" min={50} max={1500} step={25} value={speed}
                  style={{ '--pct': ((speed - 50) / 1450 * 100) + '%' }}
                  onChange={e => setSpeed(+e.target.value)} />
              </div>
            </div>
          )}

          {/* Çalışırken WPM göstergesi */}
          {running && (
            <div style={{
              display: 'flex', justifyContent: 'center', marginBottom: 16,
              animation: 'pageFadeIn .3s both',
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 18px', borderRadius: 20,
                background: 'rgba(245,158,11,.15)',
                border: '1px solid rgba(245,158,11,.3)',
                color: '#f59e0b', fontSize: 12, fontWeight: 700,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', animation: 'pulseGlow 1.5s infinite' }} />
                {speed} WPM — Regresyon Blocker Aktif
              </div>
            </div>
          )}

          {/* Metin + gizleme maskeyi */}
          <div className="rt" style={{
            maxHeight: running ? (isMobile ? '75vh' : '70vh') : 300,
            fontSize: running ? 'clamp(1.1rem, 2.5vw, 1.8rem)' : 16,
            lineHeight: 1.9,
            padding: running ? '10px 0' : undefined,
            borderRadius: 12,
            transition: 'all .3s ease',
          }}>
            <div className="rh" style={{
              width: pct + '%',
              background: 'linear-gradient(90deg,' + c.color + '08 60%,' + c.color + '22 100%)',
              borderRightColor: c.color,
              transition: running ? 'width 0.1s linear' : 'none',
            }} />
            {sel.content}
          </div>

          {/* Tamamlandı XP */}
          {done && lastXP && (
            <div style={{ textAlign: 'center', marginTop: 14, animation: 'successPop .4s both' }}>
              <div style={{
                display: 'inline-block',
                background: 'rgba(245,158,11,.15)',
                border: '1px solid rgba(245,158,11,.35)',
                borderRadius: 16, padding: '10px 24px',
                fontSize: 20, fontWeight: 900, color: '#f59e0b', fontFamily: 'var(--mo)',
              }}>+{lastXP} XP 🚫</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
            {!running
              ? <button className="btn bp" style={{ transition: 'all .2s' }} onClick={start}>{done ? '🔄 Tekrar Et' : '▶ Antrenmana Başla'}</button>
              : <button className="btn bd" style={{ transition: 'all .2s' }} onClick={stop}>⏸ Durdur</button>}
            {done && !running && <button className="btn bg" style={{ transition: 'all .2s' }} onClick={() => setShowQ(true)}>📝 Teste Başla</button>}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

// ─── EYE GYM ─────────────────────────────────────────────────────────────────
export function EyeGym({ user, onXP, addToast, isMobile, onFail, isLessonMode = false, targetTime = 0 }) {
  const cr = useRef(null); const ar = useRef(null);
  const [mode, setMode] = useState('lissajous');
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const tRef = useRef(0);
  const tr = useRef();
  const { c } = getLvl(user.tecrube || 0);

  const draw = useCallback(() => {
    const cv = cr.current; if (!cv) return;
    const ctx = cv.getContext('2d'); const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H); tRef.current += 0.016 * speed; const t = tRef.current;
    let x, y;
    if (mode === 'lissajous') { x = W/2 + (W*.38)*Math.sin(2*t+Math.PI/2); y = H/2 + (H*.38)*Math.sin(3*t); }
    else if (mode === 'infinity') { const s = Math.min(W,H)*.36; x = W/2 + s*Math.cos(t)/(1+Math.sin(t)**2); y = H/2 + s*Math.sin(t)*Math.cos(t)/(1+Math.sin(t)**2); }
    else if (mode === 'zigzag') { x = W/2 + (W*.4)*Math.sin(t); y = H/2 + (H*.35)*Math.sin(2*t); }
    else { x = W/2 + (W*.4)*Math.cos(t); y = H/2 + (H*.3)*Math.sin(t); }

    // İz çizgisi
    ctx.beginPath();
    for (let i = 0; i < 60; i++) {
      const tt = tRef.current - i*0.016*speed; let tx, ty;
      if (mode === 'lissajous') { tx = W/2+(W*.38)*Math.sin(2*tt+Math.PI/2); ty = H/2+(H*.38)*Math.sin(3*tt); }
      else if (mode === 'infinity') { const s=Math.min(W,H)*.36; tx=W/2+s*Math.cos(tt)/(1+Math.sin(tt)**2); ty=H/2+s*Math.sin(tt)*Math.cos(tt)/(1+Math.sin(tt)**2); }
      else if (mode === 'zigzag') { tx=W/2+(W*.4)*Math.sin(tt); ty=H/2+(H*.35)*Math.sin(2*tt); }
      else { tx=W/2+(W*.4)*Math.cos(tt); ty=H/2+(H*.3)*Math.sin(tt); }
      i === 0 ? ctx.moveTo(tx, ty) : ctx.lineTo(tx, ty);
    }
    ctx.strokeStyle = c.color+'30'; ctx.lineWidth = 2; ctx.stroke();

    // Top
    const g = ctx.createRadialGradient(x, y, 0, x, y, 22);
    g.addColorStop(0, c.color+'ff'); g.addColorStop(.5, c.color+'88'); g.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI*2); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI*2); ctx.fillStyle = 'white'; ctx.fill();

    ar.current = requestAnimationFrame(draw);
  }, [mode, speed, c.color]);

  useEffect(() => {
    if (running) {
      ar.current = requestAnimationFrame(draw);
      const start = Date.now();
      tr.current = setInterval(() => {
        const cur = (Date.now() - start) / 1000;
        setElapsed(cur);
        if (isLessonMode && targetTime > 0 && cur >= targetTime) {
          stopFn();
          if (onFail) onFail();
          addToast({ msg: 'Egzersiz suresi doldu!', color: '#ef4444', icon: '⏰' });
        }
      }, 100);
    } else {
      cancelAnimationFrame(ar.current);
      clearInterval(tr.current);
    }
    return () => { cancelAnimationFrame(ar.current); clearInterval(tr.current); };
  }, [running, draw, isLessonMode, targetTime, onFail, addToast]);

  const stopFn = () => {
    setRunning(false);
    clearInterval(tr.current);
    if (elapsed >= 30) {
      const g = Math.round(elapsed * 2);
      onXP(g, 0, 'Goz Isinma', 'Göz Jimi');
      addToast({ msg: '+' + g + ' XP! Goz kaslari isindi!', color: '#10b981', icon: '👁️' });
    }
  };

  const MODES = [
    { id: 'lissajous', l: 'Lissajous', color: '#7c3aed' },
    { id: 'infinity', l: 'Sonsuzluk', color: '#06b6d4' },
    { id: 'circle', l: 'Daire', color: '#10b981' },
    { id: 'zigzag', l: 'Zigzag', color: '#f59e0b' },
  ];

  return (
    <PageWrapper animationType="flip">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ animation: 'pageSlideUp .3s both' }}>
          <div className="st">👁️ Göz Jimi (Saccade Eğitimi)</div>
          <div className="ss">Göz kaslarını ısıt, saccade hızını artır. Sadece noktaya odaklan, başını oynatma.</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,.02)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 20,
          padding: '22px',
          animation: 'cardReveal .4s .06s both',
        }}>
          <div className="tip-box" style={{ animation: 'tipSlide .4s .1s both' }}>
            💡 <strong>Bilim:</strong> Gözler metin okurken saccade (sıçrama) hareketleri yapar. Bu egzersiz göz kaslarını güçlendirir. Günde 5-20 dk yeterlidir. 20-20-20 kuralını uygula!
          </div>

          {!isLessonMode && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              {MODES.map((m, i) => (
                <button key={m.id}
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: mode === m.id ? m.color + '22' : 'rgba(255,255,255,.04)',
                    color: mode === m.id ? m.color : 'var(--mu)',
                    fontWeight: mode === m.id ? 800 : 600,
                    fontSize: 12,
                    outline: mode === m.id ? '1.5px solid ' + m.color + '44' : '1px solid rgba(255,255,255,.06)',
                    transition: 'all .2s',
                    animation: 'cardReveal .3s ' + (i * .04) + 's both',
                  }}
                  onClick={() => !running && setMode(m.id)}>{m.l}</button>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--mu)' }}>Hız:</span>
                {[.5, 1, 1.5, 2].map(s => (
                  <button key={s}
                    style={{
                      padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: speed === s ? c.color + '22' : 'rgba(255,255,255,.04)',
                      color: speed === s ? c.color : 'var(--mu)',
                      fontWeight: speed === s ? 800 : 500,
                      fontSize: 12, transition: 'all .2s',
                    }}
                    onClick={() => setSpeed(s)}>{s}x</button>
                ))}
              </div>
            </div>
          )}

          {isLessonMode && (
            <div style={{ textAlign: 'right', marginBottom: 15 }}>
              <div style={{ fontSize: 9, color: 'var(--mu)', textTransform: 'uppercase' }}>ANTRENMAN SÜRESİ</div>
              <div style={{
                fontSize: 28, fontWeight: 900,
                color: targetTime > 0 && (targetTime - elapsed) < 5 ? '#ef4444' : 'var(--fg)',
                fontFamily: 'var(--mo)',
                animation: 'countUp .2s both',
              }}>
                {targetTime > 0 ? Math.max(0, targetTime - elapsed).toFixed(1) : elapsed.toFixed(1)}s
              </div>
            </div>
          )}

          {/* Canvas */}
          <div style={{
            borderRadius: 14, overflow: 'hidden',
            border: running ? '1px solid ' + c.color + '33' : '1px solid rgba(255,255,255,.06)',
            background: 'rgba(0,0,0,.3)',
            transition: 'border-color .3s',
            boxShadow: running ? '0 0 20px ' + c.color + '15' : 'none',
          }}>
            <canvas ref={cr} width={600} height={isMobile ? 350 : 280} className="ec" style={{ width: '100%', display: 'block' }} />
          </div>

          {/* Timer + kontroller */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <div style={{
              fontFamily: 'var(--mo)', fontSize: 22, color: c.color, fontWeight: 800,
              animation: running ? 'countUp .2s both' : 'none',
            }}>{fmt(elapsed)}</div>
            {!running
              ? <button className="btn bp" style={{ transition: 'all .2s' }} onClick={() => setRunning(true)}>▶ Başla</button>
              : <button className="btn bd" style={{ transition: 'all .2s' }} onClick={stopFn}>⏹ Bitir (+XP)</button>}
            <div style={{ fontSize: 11, color: 'var(--mu)' }}>Min 30 sn XP kazan</div>
          </div>

          {/* İlerleme çubuğu */}
          {running && elapsed > 0 && (
            <div style={{ marginTop: 10, animation: 'pageFadeIn .3s both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--mu)', marginBottom: 4 }}>
                <span>{elapsed < 30 ? 'XP için: ' + Math.ceil(30 - elapsed) + 's daha' : 'XP Kazanıyor!'}</span>
                <span style={{ color: elapsed >= 30 ? '#10b981' : 'var(--mu)' }}>{elapsed >= 30 ? '✓' : ''}</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  width: Math.min((elapsed / 30) * 100, 100) + '%',
                  background: elapsed >= 30 ? '#10b981' : c.color,
                  transition: 'width .2s linear, background .3s',
                  boxShadow: elapsed >= 30 ? '0 0 8px #10b98188' : 'none',
                }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

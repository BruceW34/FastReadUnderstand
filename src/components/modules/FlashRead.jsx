import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getLvl, fmt } from '@/data/levels.js';
import { TextSelect, Quiz, BreathingGuide } from '@/components/shared/Shared';
import { BoltGuide } from '@/components/shared/BoltGuide';
import { BoltCoach } from '@/components/shared/BoltCoach';
import { PageWrapper, AnimCard, TipBox, HeaderSection, StatBadge } from './PageWrapper.jsx';

// ─── FLASH OKUMA ──────────────────────────────────────────────────────────────
export function FlashRead({ user, onXP, addToast, texts, isPro, isMobile, setFocusMode }) {
  const [sel, setSel] = useState(texts[0]);
  const [wpm, setWpm] = useState(() => isMobile ? 300 : getLvl(user.tecrube || 0).c.minWPM);
  const [running, setRunning] = useState(false);
  const [idx, setIdx] = useState(0);
  const [cw, setCw] = useState('');
  const [done, setDone] = useState(false);
  const [showQ, setShowQ] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [wordCount, setWordCount] = useState(isMobile ? 2 : 3);
  const [breathe] = useState(true);
  const [breatheEvery] = useState(50);
  const [lastXP, setLastXP] = useState(null);
  const ir = useRef(null); const tr = useRef(null);
  const words = useMemo(() => sel.content.split(/\s+/).filter(Boolean), [sel]);
  const { c } = getLvl(user.tecrube || 0);

  const reset = () => {
    clearInterval(ir.current); clearInterval(tr.current);
    ir.current = null; tr.current = null;
    setRunning(false); setIdx(0); setCw(''); setDone(false);
    setElapsed(0); setFocusMode(false); setLastXP(null);
  };

  const stop = useCallback(() => {
    clearInterval(ir.current); clearInterval(tr.current);
    ir.current = null; tr.current = null;
    setRunning(false); setFocusMode(false);
  }, [setFocusMode]);

  const breathPause = useCallback(() => {
    clearInterval(ir.current); clearInterval(tr.current);
    ir.current = null; tr.current = null;
  }, []);

  const start = useCallback((resume = false) => {
    if (resume && running) return;
    const startingFromDone = done && !resume;
    if (startingFromDone) { setIdx(0); setDone(false); setElapsed(0); setLastXP(null); }
    setRunning(true); setFocusMode(true);
    clearInterval(tr.current);
    tr.current = setInterval(() => setElapsed(e => e + 1), 1000);
    clearInterval(ir.current);
    let i = startingFromDone ? 0 : idx;
    ir.current = setInterval(() => {
      if (i >= words.length) {
        clearInterval(ir.current); clearInterval(tr.current);
        ir.current = null; tr.current = null;
        setRunning(false); setDone(true); setCw('✓'); setFocusMode(false);
        const g = Math.round(words.length * (wpm / 200) * (5 + c.level / 2) * 0.5);
        setLastXP(g);
        onXP(g, wpm, sel.title, 'Flash Okuma');
        addToast({ msg: `+${g} XP! ⚡`, color: '#7c3aed', icon: '⚡' });
        return;
      }
      setCw(words.slice(i, i + wordCount).join(' '));
      setIdx(i); i += wordCount;
    }, (60000 / wpm) * wordCount);
  }, [wpm, words, idx, done, sel, onXP, addToast, wordCount, setFocusMode, c.level, running]);

  useEffect(() => () => { stop(); setFocusMode(false); }, [stop, setFocusMode]);

  if (showQ) return (
    <PageWrapper animationType="slide">
      <Quiz text={sel} onDone={(x) => { setShowQ(false); if (x) onXP(x, wpm, sel.title, 'Quiz'); }} addToast={addToast} />
    </PageWrapper>
  );

  const prog = words.length > 0 ? (idx / words.length) * 100 : 0;

  return (
    <PageWrapper animationType="flip">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Başlık + metin seçimi */}
        {!running && (
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', flexWrap: 'wrap', gap: 10,
            animation: 'pageSlideUp .3s both',
          }}>
            <HeaderSection icon="⚡" title="Flash Okuma" subtitle="RSVP ve Chunking ile zihin hızına ulaş." />
            <div style={{ animation: 'pageSlideUp .3s .08s both' }}>
              <TextSelect value={sel.id} onChange={t => { setSel(t); stop(); setIdx(0); setCw(''); setDone(false); }} texts={texts} />
            </div>
          </div>
        )}

        {/* Bolt Coach */}
        {!running && (
          <AnimCard delay={0.05} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 18px',
            background: 'rgba(124,58,237,.08)',
            border: '1px solid rgba(124,58,237,.2)',
            borderRadius: 16,
          }}>
            <img src="assets/bolt.png" alt="Bolt" style={{
              width: 56, height: 56, objectFit: 'contain',
              filter: 'drop-shadow(0 0 8px rgba(124,58,237,.5))',
              animation: 'boltBounce 2s ease-in-out infinite',
              flexShrink: 0,
            }} />
            <div style={{ fontSize: 13, fontWeight: 700, fontStyle: 'italic', color: 'var(--tx)', lineHeight: 1.5 }}>
              "Kelimeleri tek tek seslendirmemeye çalış. Sadece <em>görsel olarak algıla</em>! ⚡"
            </div>
          </AnimCard>
        )}

        {/* Ana kart */}
        <AnimCard delay={0.08} style={{
          background: 'rgba(255,255,255,.02)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 20,
          padding: running ? (isMobile ? '40px 15px' : '60px 30px') : '22px',
          transition: 'padding .3s ease',
        }}>

          {!running && (
            <TipBox>
              💡 <strong>Bilim:</strong> RSVP göz hareketini sıfırlar. Chunking beynin doğal dil işleme hızını artırır.
            </TipBox>
          )}

          {/* WPM ayarları */}
          <div style={{ marginBottom: running ? 30 : 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--mu)' }}>
              <span>Hız Hedefi</span>
              <span style={{
                color: c.color, fontFamily: 'var(--mo)', fontWeight: 800, fontSize: 18,
                animation: 'countUp .2s both',
              }}>{wpm} WPM</span>
            </div>
            {!running && (
              <>
                <input type="range" min={100} max={6000} step={50} value={wpm}
                  style={{ '--pct': `${((wpm - 100) / 5900) * 100}%` }}
                  onChange={e => setWpm(+e.target.value)} />
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {[200, 400, 600, 800, 1000, 1500, 2000].map(v => (
                    <button key={v} className="btn bg bs btn-hov" onClick={() => setWpm(v)}
                      style={{ opacity: wpm === v ? 1 : .5, background: wpm === v ? `${c.color}33` : undefined, transition: 'all .2s' }}>
                      {v}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'center', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--mu)' }}>Grup:</span>
                  {[1, 2, 3, 4].map(n => (
                    <button key={n} className="btn bg bs btn-hov" onClick={() => setWordCount(n)}
                      style={{ background: wordCount === n ? `${c.color}33` : undefined, transition: 'all .2s' }}>
                      {n}K
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Kelime gösterme alanı */}
          <div style={{
            position: 'relative',
            minHeight: running ? (isMobile ? 200 : 300) : 140,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderTop: running ? 'none' : '1px solid rgba(255,255,255,.07)',
            borderBottom: running ? 'none' : '1px solid rgba(255,255,255,.07)',
            margin: running ? '0' : '0 -22px',
            padding: '18px 22px',
            background: running ? `radial-gradient(ellipse at center, ${c.color}08 0%, transparent 70%)` : 'transparent',
            transition: 'all .3s ease',
          }}>
            {!running && <div className="fl" style={{ left: 'calc(50% - 1.5px)' }} />}
            <div className="fw" style={{
              color: c.color,
              fontSize: running ? `clamp(2rem, ${10 - wordCount * 1.2}vw, 5rem)` : (wordCount > 1 ? 'clamp(1.2rem,3vw,2.5rem)' : undefined),
              fontWeight: 900,
              textShadow: running ? `0 0 40px ${c.color}55, 0 0 80px ${c.color}22` : 'none',
              transition: 'text-shadow .2s',
              letterSpacing: running ? '-0.02em' : 0,
            }}>
              {cw || (running ? '...' : '▶ Başlat')}
            </div>
          </div>

          {/* İlerleme */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--mu)', marginBottom: 6 }}>
              <span>{idx}/{words.length} kelime</span>
              <span>⏱ {fmt(elapsed)}</span>
            </div>
            <div className="xbt" style={{ height: 6, borderRadius: 99, overflow: 'hidden' }}>
              <div className="xbf" style={{
                width: `${prog}%`, background: `linear-gradient(90deg, ${c.color}, ${c.color}cc)`,
                transition: 'width .1s linear',
                boxShadow: running ? `0 0 8px ${c.color}88` : 'none',
              }} />
            </div>
          </div>

          {/* Tamamlandı XP gösterimi */}
          {done && lastXP && (
            <div style={{
              textAlign: 'center', marginTop: 16,
              animation: 'successPop .4s both',
            }}>
              <div style={{
                display: 'inline-block',
                background: `linear-gradient(135deg, ${c.color}22, ${c.color}11)`,
                border: `1px solid ${c.color}44`,
                borderRadius: 16,
                padding: '10px 24px',
                fontSize: 20,
                fontWeight: 900,
                color: c.color,
                fontFamily: 'var(--mo)',
              }}>+{lastXP} XP ⚡</div>
            </div>
          )}

          {/* Kontroller */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            {!running
              ? <button className="btn bp btn-hov" onClick={() => start(false)} style={{ padding: '12px 30px' }}>
                  {done ? '🔄 Tekrar Et' : '▶ Antrenmana Başla'}
                </button>
              : <button className="btn bd btn-hov" onClick={stop}>⏸ Duraklat</button>
            }
            {!running && <button className="btn bg btn-hov" onClick={reset}>↺ Sıfırla</button>}
            {done && !running && <button className="btn bg btn-hov" onClick={() => setShowQ(true)}>📝 Quiz</button>}
          </div>

          {/* Çalışırken Bolt rehberi */}
          {running && (
            <div style={{ marginTop: 24, animation: 'pageFadeIn .4s both' }}>
              <BoltGuide
                message={idx > words.length / 2 ? "Harika gidiyorsun, hızı koru! ⚡" : "Odaklan, her kelime bir adım! 🎯"}
                type="success"
                style={{ margin: 0, position: 'relative', bottom: 'auto', right: 'auto', marginTop: 10 }}
              />
            </div>
          )}

          <BreathingGuide
            active={running && breathe}
            wordsRead={idx}
            breatheEvery={breatheEvery}
            onPause={breathPause}
            onResume={() => start(true)}
          />
        </AnimCard>
      </div>
    </PageWrapper>
  );
}

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getLvl, fmt } from '@/data/levels.js';
import { TextSelect, Quiz } from '@/components/shared/Shared';
import { db } from '@/services/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { storage } from '@/shared/storage';
import { PageWrapper, AnimCard, TipBox } from './PageWrapper.jsx';
import { DuelDraft } from '../modals/DuelDraft';

// ─── SCHULTE ──────────────────────────────────────────────────────────────────
export function Schulte({ user, onXP, addToast, isMobile, onFail, isLessonMode = false, targetTime = 0, matchData, setMatchData }) {
  const [grid, setGrid] = useState([]);
  const [targetSeq, setTargetSeq] = useState([]);
  const [currIdx, setCurrIdx] = useState(0);
  const [next, setNext] = useState(1);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [wrong, setWrong] = useState(null);
  const [showQ, setShowQ] = useState(false);
  const [size, setSize] = useState(5);
  const [mode, setMode] = useState('number');
  const [bestTimes, setBestTimes] = useState(() => storage.get('sr_schulte_best', {}));
  const tr = useRef(null);
  const { c } = getLvl(user.xp || 0);
  const ALPHABET = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ';
  const COLORS = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#f97316','#84cc16','#14b8a6','#6366f1','#e11d48','#0ea5e9','#a855f7','#22c55e','#eab308'];
  const BENCHMARKS = { 3:{elite:5,good:10,beginner:20}, 4:{elite:10,good:20,beginner:35}, 5:{elite:15,good:25,beginner:45}, 6:{elite:25,good:40,beginner:70}, 7:{elite:35,good:55,beginner:90} };

  const newGame = useCallback((seed) => {
    const total = size * size;
    
    // Stable Seeded Shuffle Helper
    const seededShuffle = (arr, s) => {
        let currentSeed = s;
        const nextRand = () => {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            return currentSeed / 233280;
        };
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(nextRand() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    let items;
    if (mode === 'letter') items = ALPHABET.slice(0, total).split('');
    else if (mode === 'color') items = COLORS.slice(0, total);
    else items = Array.from({ length: total }, (_, i) => i + 1);

    if (seed) {
        items = seededShuffle(items, seed);
    } else {
        items = items.sort(() => Math.random() - .5);
    }
    
    setGrid(items);
    if (seed) {
        const sorted = [...items].sort((a,b) => {
            if (mode === 'number') return a - b;
            return a.toString().localeCompare(b.toString());
        });
        setTargetSeq(sorted);
    } else {
        setTargetSeq([...items].sort(() => Math.random() - 0.5));
    }
    
    setCurrIdx(0);
    setNext(1);
    setElapsed(0); setDone(false); setRunning(false);
    if (tr.current) clearInterval(tr.current);
  }, [size, mode, ALPHABET, COLORS]);

  const initRef = useRef(null);

  useEffect(() => { 
    let seed = null;
    if (matchData && matchData.rounds) {
        const round = matchData.rounds[matchData.currentRound - 1];
        if (round) {
            // Enforcement: Use drafted parameters
            let targetSize = size;
            let targetTimeLimit = 0;
            
            if (round.paramType === 'size') targetSize = parseInt(round.customParam);
            else if (round.paramType === 'time') targetTimeLimit = parseInt(round.customParam);
            else {
                // Background difficulty fallback
                targetSize = round.difficulty === 'easy' ? 3 : (round.difficulty === 'medium' ? 5 : 7);
            }

            if (size !== targetSize) setSize(targetSize);
            
            // Critical check for initialization
            const currentMatchRoundId = `${matchData.id}_${matchData.currentRound}`;
            if (initRef.current === currentMatchRoundId) return;
            initRef.current = currentMatchRoundId;

            seed = 0;
            const str = matchData.id + matchData.currentRound;
            for(let i=0; i<str.length; i++) seed += str.charCodeAt(i);
            
            newGame(seed);
        }
    } else if (!initRef.current) {
        initRef.current = 'initial';
        newGame();
    }
  }, [matchData, newGame, size]);
  useEffect(() => { if (isLessonMode && !running && !done) go(); }, [isLessonMode]);

  const getTarget = () => { 
    if (currIdx >= grid.length) return 'OK';
    return targetSeq[currIdx];
  };
  
  const go = () => { 
    setRunning(true); 
    tr.current = setInterval(() => {
        setElapsed(e => {
            const nextE = e + 1;
            // Check for time limit in Duel
            if (matchData) {
                const round = matchData.rounds[matchData.currentRound - 1];
                if (round && round.paramType === 'time' && nextE >= parseInt(round.customParam)) {
                    clearInterval(tr.current);
                    setRunning(false);
                    setDone(true);
                    finalizeMatch(currIdx, nextE);
                    return nextE;
                }
            }
            return nextE;
        });
    }, 1000); 
  };

  const finalizeMatch = useCallback((score, finalElapsed) => {
    if (!matchData) return;
    const mRef = doc(db, 'matches', matchData.id);
    const ridx = matchData.currentRound - 1;
    const isP1 = matchData.p1.id === user.id;
    
    const roundUpdate = {
        [`rounds.${ridx}.${isP1 ? 'p1' : 'p2'}.score`]: score,
        [`rounds.${ridx}.${isP1 ? 'p1' : 'p2'}.status`]: 'finished',
        [`rounds.${ridx}.${isP1 ? 'p1' : 'p2'}.elapsed`]: finalElapsed
    };

    updateDoc(mRef, roundUpdate).then(async () => {
      const snap = await getDoc(mRef); 
      const m = snap.data();
      const currRound = m.rounds[ridx];
      
      if (currRound.p1.status === 'finished' && currRound.p2.status === 'finished') {
          if (m.currentRound < 5) {
              await updateDoc(mRef, { 
                  currentRound: m.currentRound + 1,
                  status: 'drafting',
                  'p1.status': 'waiting',
                  'p2.status': 'waiting'
              });
              addToast({ msg: `Raunt ${m.currentRound} tamamlandı! Sıradaki raunt için seçim yapın.`, icon: '⚔️' });
          } else {
              let p1Wins = 0, p2Wins = 0;
              m.rounds.forEach(r => {
                  // If Schulte has time limit, higher score wins. Otherwise lower elapsed wins.
                  const isTimeLimit = r.paramType === 'time';
                  if (isTimeLimit) {
                    if (r.p1.score > r.p2.score) p1Wins++;
                    else if (r.p2.score > r.p1.score) p2Wins++;
                  } else {
                    if (r.p1.score < r.p2.score) p1Wins++;
                    else if (r.p2.score < r.p1.score) p2Wins++;
                  }
              });
              const wId = p1Wins > p2Wins ? m.p1.id : (p2Wins > p1Wins ? m.p2.id : 'draw');
              await updateDoc(mRef, { status: 'completed', winnerId: wId });
              addToast({ msg: 'Düello Tamamlandı!', icon: '🏆' });
          }
      }
    });
  }, [matchData, user.id, addToast]);

  const click = (n) => {
    if (!running || done) return;
    const target = targetSeq[currIdx];
    const isCorrect = n === target;

    if (isCorrect) {
      const nextIdx = currIdx + 1;
      setCurrIdx(nextIdx);
      if (nextIdx >= size * size) {
        clearInterval(tr.current); 
        setRunning(false); 
        setDone(true);
        if (matchData) {
            finalizeMatch(size * size, elapsed);
        } else {
          const bk = size + 'x' + size;
          if (!bestTimes[bk] || elapsed < bestTimes[bk]) {
            const nt = { ...bestTimes, [bk]: elapsed };
            setBestTimes(nt);
            if (!isLessonMode) storage.set('sr_schulte_best', nt);
          }
          const xp = isLessonMode ? 30 : Math.round(Math.max(20, 100 - elapsed + size * size));
          setTimeout(() => { if (typeof onXP === 'function') onXP(xp, 0, 'Schulte Tablosu', 'Schulte Tablosu'); }, 1200);
        }
      }
    } else {
      setWrong(n); if (onFail) onFail();
      setTimeout(() => setWrong(null), 350);
    }
  };

  useEffect(() => {
    if (running && targetTime > 0 && elapsed >= targetTime) {
      clearInterval(tr.current); setRunning(false); setDone(true); if (onFail) onFail();
    }
  }, [elapsed, running, targetTime, onFail]);

  const bench = BENCHMARKS[size] || BENCHMARKS[5];
  const bestKey = size + 'x' + size;
  const bestTime = bestTimes[bestKey];
  const midIdx = Math.floor(size / 2) * size + Math.floor(size / 2);
  // Removed Quiz/Test logic here

  return (
    <PageWrapper animationType="flip">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ animation: 'pageSlideUp .3s both' }}>
          <div className="st">🎲 Schulte Tablosu</div>
          <div className="ss">Gözünü merkeze sabitle. Çevre görüşünle öğeleri sırayla bul. Başını OYNATMA.</div>
        </div>

        {matchData && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(244,63,94,.15), rgba(124,58,237,.15))',
            border: '2px solid rgba(244,63,94,.3)',
            borderRadius: 16, padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            animation: 'cardReveal .4s both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 24 }}>⚔️</div>
                <div style={{ position: 'absolute', top: -5, right: -10, background: '#f43f5e', color: '#fff', fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 10 }}>R{matchData.currentRound}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: 1 }}>DÜELLO REKABETİ</div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{matchData.p1.id === user.id ? matchData.p2.name : matchData.p1.name}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--mu)', fontWeight: 700 }}>DURUM</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--fg)' }}>RAUNT {matchData.currentRound || 1}/5</div>
                </div>
                <div style={{ fontSize: 32 }}>{matchData.p1.id === user.id ? matchData.p2.avatar : matchData.p1.avatar}</div>
            </div>
          </div>
        )}

        <div style={{
          background: 'rgba(255,255,255,.02)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 20, padding: '22px',
          animation: 'cardReveal .4s .06s both',
        }}>
          <div className="tip-box" style={{ animation: 'tipSlide .4s .1s both' }}>
            💡 <strong>Bilim:</strong> Schulte tabloları %40 görsel dikkat artışı sağlar. Gözünü <strong>merkezdeki + işaretinden ayırma</strong> — tüm öğeleri periferik görüşle bul.
          </div>

          {!isLessonMode && !matchData && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', animation: 'cardReveal .35s .08s both' }}>
              {[
                { col: '#ef4444', label: 'Elit: <' + bench.elite + 'sn', bg: 'rgba(239,68,68,.1)', border: 'rgba(239,68,68,.2)' },
                { col: '#f59e0b', label: 'İyi: <' + bench.good + 'sn', bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.2)' },
                { col: '#7c3aed', label: 'Başlangıç: <' + bench.beginner + 'sn', bg: 'rgba(124,58,237,.1)', border: 'rgba(124,58,237,.2)' },
              ].map(b => (
                <div key={b.label} style={{ padding: '6px 12px', borderRadius: 8, background: b.bg, border: '1px solid ' + b.border, fontSize: 11, color: b.col, fontWeight: 700 }}>{b.label}</div>
              ))}
              {bestTime != null && (
                <div style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)', fontSize: 11, marginLeft: 'auto', color: '#10b981', fontWeight: 700 }}>
                  🏆 En İyi ({bestKey}): {fmt(bestTime)}
                </div>
              )}
            </div>
          )}

          {isLessonMode && running && (
            <div style={{ textAlign: 'center', marginBottom: 15 }}>
              <div style={{ fontSize: 9, color: 'var(--mu)', textTransform: 'uppercase' }}>SÜRE</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: (targetTime - elapsed) < 5 ? '#ef4444' : 'var(--fg)', fontFamily: 'var(--mo)', animation: 'countUp .2s both' }}>
                {(targetTime - elapsed).toFixed(1)}s
              </div>
            </div>
          )}

          {!isLessonMode && !matchData && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--mu)' }}>Boyut:</span>
                {[3,4,5,6,7].map(s => (
                  <button key={s} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: size === s ? c.color + '22' : 'rgba(255,255,255,.04)', color: size === s ? c.color : 'var(--mu)', fontWeight: size === s ? 800 : 500, fontSize: 12, transition: 'all .2s' }} onClick={() => setSize(s)}>{s}x{s}</button>
                ))}
                <span style={{ fontSize: 11, color: 'var(--mu)', marginLeft: 8 }}>Mod:</span>
                {[{id:'number',l:'123'},{id:'letter',l:'ABC'},{id:'color',l:'🎨'}].map(m => (
                  <button key={m.id} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: mode === m.id ? c.color + '22' : 'rgba(255,255,255,.04)', color: mode === m.id ? c.color : 'var(--mu)', fontWeight: mode === m.id ? 800 : 500, fontSize: 12, transition: 'all .2s' }} onClick={() => setMode(m.id)}>{m.l}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: 1 }}>Hedef</div>
                  <div style={{ fontSize: 40, fontWeight: 900, fontFamily: 'var(--mo)', color: c.color, lineHeight: 1, animation: 'countUp .2s both' }}>{getTarget()}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: 1 }}>Süre</div>
                  <div style={{ fontSize: 30, fontWeight: 900, fontFamily: 'var(--mo)', lineHeight: 1 }}>{fmt(elapsed)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 7, flexDirection: isMobile ? 'row' : 'column' }}>
                {!running && !done && <button className="btn bp" style={{ transition: 'all .2s' }} onClick={go}>▶ Başla</button>}
                <button className="btn bg" style={{ transition: 'all .2s' }} onClick={newGame}>↺ Baştan</button>
              </div>
            </div>
          )}

          {matchData && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 18, gap: 20, padding: 15, background: 'rgba(255,255,255,.02)', borderRadius: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: 1.5 }}>HEDEF</div>
                <div style={{ fontSize: 42, fontWeight: 900, color: 'var(--ac)', fontFamily: 'var(--mo)' }}>{getTarget()}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: 1.5 }}>SÜRE</div>
                <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'var(--mo)', color: 'var(--fg)' }}>{fmt(elapsed)}</div>
              </div>
              {!running && !done && (
                  <button className="btn bp" style={{ padding: '12px 30px', fontWeight: 900, background: 'linear-gradient(135deg, var(--ac), var(--ac2))', boxShadow: '0 4px 15px var(--ac2)44' }} onClick={go}>⚔️ BAŞLA</button>
              )}
            </div>
          )}

          {isLessonMode && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, padding: '10px 15px', background: 'rgba(255,255,255,.02)', borderRadius: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--mu)', textTransform: 'uppercase' }}>HEDEF</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: c.color, fontFamily: 'var(--mo)' }}>{getTarget()}</div>
              </div>
              {targetTime > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'var(--mu)', textTransform: 'uppercase' }}>KALAN</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: (targetTime - elapsed) < 10 ? '#ef4444' : 'var(--fg)', fontFamily: 'var(--mo)' }}>{fmt(Math.max(0, targetTime - elapsed))}</div>
                </div>
              )}
              {!running && !done && <button className="btn bp" onClick={go}>BAŞLA</button>}
            </div>
          )}

          {done && (
            <div style={{
              textAlign: 'center', marginBottom: 16, padding: 16,
              background: next > size * size ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)',
              border: '1px solid ' + (next > size * size ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)'),
              borderRadius: 14,
              animation: 'successPop .4s both',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: currIdx >= size * size ? '#34d399' : '#f87171' }}>
                {currIdx >= size * size ? 'Tamamlandı!' : 'Süre Doldu!'}
              </div>
              <div style={{ color: 'var(--mu)', marginTop: 6, fontSize: 13 }}>
                {currIdx >= size * size
                  ? 'Süre: ' + fmt(elapsed) + (elapsed < bench.elite ? ' • ELİT!' : elapsed < bench.good ? ' • İyi!' : ' • Devam et!')
                  + (bestTime === elapsed ? ' • YENİ REKOR!' : '')
                  : 'Sadece ' + currIdx + ' tane buldun. Hızlan!'}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                {!isLessonMode && currIdx >= size * size && <button className="btn bg" style={{ transition: 'all .2s' }} onClick={() => setShowQ(true)}>📝 Test</button>}
                {isLessonMode && currIdx < size * size && <button className="btn bg" style={{ transition: 'all .2s' }} onClick={newGame}>🔄 Tekrar Dene</button>}
              </div>
            </div>
          )}

          {/* Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(' + size + ',1fr)',
            gap: isMobile ? 3 : (size >= 6 ? 4 : 6),
            maxWidth: isMobile ? '100%' : (size === 7 ? '420px' : size >= 5 ? '380px' : size === 4 ? '300px' : '240px'),
            margin: '0 auto', position: 'relative',
          }}>
            {grid.map((n, i) => (
              <div key={i}
                className={'sc' + (targetSeq.slice(0, currIdx).includes(n) ? ' found' : '') + (wrong === n ? ' wrong' : '')}
                style={{
                  height: isMobile ? (64 - size * 4) + 'px' : (size === 7 ? '50px' : size === 6 ? '56px' : size <= 4 ? '72px' : '64px'),
                  fontSize: isMobile ? (20 - size * 2) : (size >= 7 ? 14 : size <= 4 ? 22 : 18),
                  cursor: running && !done ? 'pointer' : 'default',
                  ...(mode === 'color' ? { background: n + '33', borderColor: n + '55' } : {}),
                  transition: 'all .15s',
                  animation: wrong === n ? 'wrongShake .3s both' : 'none',
                }}
                onClick={() => click(n)}>
                {i === midIdx && running && !done && <span style={{ position: 'absolute', color: c.color, fontSize: 10, opacity: .7, top: 2, left: '50%', transform: 'translateX(-50%)' }}>+</span>}
                {mode === 'color' ? '' : (targetSeq.slice(0, currIdx).includes(n) ? '✓' : n)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {matchData && matchData.status === 'drafting' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div className="card" style={{ width: '95%', maxWidth: 600, padding: 0, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <DuelDraft matchId={matchData.id} userId={user.id} onFinish={() => setMatchData({ ...matchData, status: 'in_progress' })} />
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

// ─── VERT READ ────────────────────────────────────────────────────────────────
export function VertRead({ user, onXP, addToast, texts, isMobile }) {
  const [sel, setSel] = useState(texts[0]);
  const [wpm, setWpm] = useState(300);
  const [running, setRunning] = useState(false);
  const [wi, setWi] = useState(0);
  const [cw, setCw] = useState('');
  const [done, setDone] = useState(false);
  const [showQ, setShowQ] = useState(false);
  const [lastXP, setLastXP] = useState(null);
  const ir = useRef(null);
  const { c } = getLvl(user.tecrube || 0);
  const words = useMemo(() => sel.content.split(/\s+/).filter(Boolean), [sel]);

  const stop = () => { clearInterval(ir.current); setRunning(false); };
  const start = () => {
    if (done) { setWi(0); setDone(false); setLastXP(null); }
    setRunning(true); let i = done ? 0 : wi;
    ir.current = setInterval(() => {
      if (i >= words.length) {
        clearInterval(ir.current); setRunning(false); setDone(true);
        const g = Math.round(words.length * (wpm / 200) * 9);
        setLastXP(g);
        onXP(g, wpm, sel.title, 'Dikey Okuma');
        addToast({ msg: '+' + g + ' XP! Dikey okuma tamamlandi!', color: '#8b5cf6', icon: '⚡' });
        return;
      }
      setCw(words[i]); setWi(i); i++;
    }, 60000 / wpm);
  };
  useEffect(() => () => clearInterval(ir.current), []);

  if (showQ) return (
    <PageWrapper animationType="slide">
      <Quiz text={sel} onDone={(x) => { setShowQ(false); if (x) onXP(x, wpm, sel.title, 'Quiz'); }} addToast={addToast} />
    </PageWrapper>
  );

  return (
    <PageWrapper animationType="flip">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ animation: 'pageSlideUp .3s both' }}>
          <div className="st">↕️ Dikey Okuma</div>
          <div className="ss">Sadece merkez sütuna bak. Periferik görüş ile her iki tarafı algıla.</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,.02)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 20, padding: '22px',
          animation: 'cardReveal .4s .06s both',
        }}>
          <div className="tip-box" style={{ animation: 'tipSlide .4s .1s both' }}>
            💡 <strong>Bilim:</strong> Dikey okuma, göz hareketlerini minimumda tutarak periferik görüşü antrenler. Merkeze sabit bak, çevredeki bilgiyi algıla.
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextSelect value={sel.id} onChange={t => { stop(); setSel(t); setWi(0); setCw(''); setDone(false); }} texts={texts} />
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--mu)', whiteSpace: 'nowrap', fontFamily: 'var(--mo)', fontWeight: 700 }}>{wpm} WPM</span>
              <input type="range" min={100} max={3000} step={25} value={wpm}
                style={{ '--pct': ((wpm - 100) / 2900 * 100) + '%' }}
                onChange={e => !running && setWpm(+e.target.value)} />
            </div>
          </div>

          <div style={{
            textAlign: 'center', padding: '36px 0', minHeight: 180,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            borderTop: '1px solid rgba(255,255,255,.07)',
            borderBottom: '1px solid rgba(255,255,255,.07)',
            margin: '0 -22px', position: 'relative',
            background: running ? 'radial-gradient(ellipse at center, ' + c.color + '08 0%, transparent 60%)' : 'transparent',
            transition: 'background .3s',
          }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, background: c.color + '22', transform: 'translateX(-50%)' }} />
            <div className="vw" style={{
              color: c.color,
              textShadow: running ? '0 0 24px ' + c.color + '66' : 'none',
              transition: 'text-shadow .2s',
            }}>{cw || (running ? '...' : '▼ BAŞLA')}</div>
            <div style={{ marginTop: 8, color: 'var(--mu)', fontSize: 11, fontFamily: 'var(--mo)' }}>{wi}/{words.length}</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ height: 5, background: 'rgba(255,255,255,.06)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: (words.length > 0 ? (wi / words.length) * 100 : 0) + '%',
                background: 'linear-gradient(90deg, ' + c.color + ', ' + c.color + 'cc)',
                borderRadius: 99, transition: 'width .1s linear',
                boxShadow: running ? '0 0 6px ' + c.color + '88' : 'none',
              }} />
            </div>
          </div>

          {done && lastXP && (
            <div style={{ textAlign: 'center', marginTop: 14, animation: 'successPop .4s both' }}>
              <div style={{
                display: 'inline-block',
                background: 'rgba(139,92,246,.15)',
                border: '1px solid rgba(139,92,246,.3)',
                borderRadius: 16, padding: '10px 24px',
                fontSize: 20, fontWeight: 900, color: '#8b5cf6', fontFamily: 'var(--mo)',
              }}>+{lastXP} XP ⚡</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
            {!running
              ? <button className="btn bp" style={{ transition: 'all .2s' }} onClick={start}>{done ? '🔄 Tekrar' : '▶ Başla'}</button>
              : <button className="btn bd" style={{ transition: 'all .2s' }} onClick={stop}>⏸ Dur</button>}
            <button className="btn bg" style={{ transition: 'all .2s' }} onClick={() => { stop(); setWi(0); setCw(''); setDone(false); }}>↺</button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

// ─── VISUAL MEMORY ────────────────────────────────────────────────────────────
const EMOJIS = ['🍎','🐶','🏠','⭐','🌙','🎯','🔥','💎','🦋','🚀','🎸','🌺','🦁','🏆','💡','🌊','🎨','🌍','🦊','⚡','🧊','🎭','🪐','🍀','🐝','🎪','🌸','🐠','🎵','🔮','🌈','🍕','🐱','🎿','🌻','🐼','🎃','🦄','🏰','🐺','🍄','❄️','🌮','🦅','🪴','🎶','🐳','🍩','🫧','🐙','🦑','🎻','🧲','🎲','🏄','🪼','🫐','🦜','🧁','🍭','🎈','🐉','🦩','🧶'];
const MEM_WORDS = ['kitap','deniz','güneş','bulut','rüzgar','masa','pencere','kapı','ayna','yıldız','ateş','orman','nehir','köprü','kule','şehir','çiçek','dağ','yol','gece','kedi','kuş','balık','araba','ev','anahtar','saat','bardak','kalem','ışık','resim','müzik','bahçe','çanta','bilgi','renk','hayal','umut','rüya','şarkı','dans','oyun','film','tarih','kargo','pasta','limon','elma','portakal','çilek'];
const MEM_COLORS = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#f97316','#84cc16','#14b8a6','#6366f1','#e11d48','#0ea5e9','#a855f7','#22c55e','#eab308','#f43f5e','#2dd4bf','#818cf8','#fb923c','#4ade80','#38bdf8','#c084fc','#fb7185','#34d399','#fbbf24','#a3e635','#f472b6','#60a5fa','#e879f9','#22d3ee','#a78bfa','#f87171','#facc15','#4ade80','#38bdf8','#c084fc','#fb7185','#34d399','#fbbf24','#a3e635','#f472b6','#60a5fa','#e879f9','#22d3ee','#a78bfa','#f87171','#facc15','#4ade80','#38bdf8'];

export function VisualMemory({ user, onXP, addToast, isMobile, initialLevel = 1, onFail, onSkip, isLessonMode = false, targetTime = 0, matchData, setMatchData, onTabChange, setDemoMode }) {
  const [level, setLevel] = useState(initialLevel);
  const [phase, setPhase] = useState('idle');
  const [grid, setGrid] = useState([]);
  const [toRemember, setToRemember] = useState([]);
  const [roundCount, setRoundCount] = useState(0);
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ correct: 0, wrong: 0, streak: 0, bestStreak: 0 });
  const [gridSize, setGridSize] = useState(4);
  const [memMode, setMemMode] = useState('emoji');
  const levelUpRef = useRef(null);
  const startTimeRef = useRef(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const { c } = getLvl(user.tecrube || 0);

  const finalizeMatchV = useCallback((finalScore) => {
    if (!matchData) return;
    const mRef = doc(db, 'matches', matchData.id);
    const ridx = matchData.currentRound - 1;
    const isP1 = matchData.p1.id === user.id;
    
    const roundUpdate = {
        [`rounds.${ridx}.${isP1 ? 'p1' : 'p2'}.score`]: finalScore,
        [`rounds.${ridx}.${isP1 ? 'p1' : 'p2'}.status`]: 'finished'
    };
    updateDoc(mRef, roundUpdate).then(async () => {
      const snap = await getDoc(mRef); const m = snap.data();
      const currR = m.rounds[ridx];
      if (currR.p1.status === 'finished' && currR.p2.status === 'finished') {
          if (m.currentRound < 5) {
              await updateDoc(mRef, { 
                  currentRound: m.currentRound + 1,
                  status: 'drafting',
                  'p1.status': 'waiting',
                  'p2.status': 'waiting'
              });
          } else {
              let p1W=0, p2W=0;
              m.rounds.forEach(r => { if(r.p1.score > r.p2.score) p1W++; else if(r.p2.score > r.p1.score) p2W++; });
              const winId = p1W > p2W ? m.p1.id : (p2W > p1W ? m.p2.id : 'draw');
              await updateDoc(mRef, { status: 'completed', winnerId: winId });
          }
      }
      setMatchData(null);
      addToast({ msg: 'Skorun kaydedildi!', icon: '🧠' });
    });
  }, [matchData, user?.id, addToast, setMatchData]);

  useEffect(() => {
    const round = matchData?.rounds?.[matchData.currentRound - 1];
    const draftingTimeLimit = (round?.paramType === 'time' && round?.customParam) ? parseInt(round.customParam) : targetTime;

    if (phase === 'recall' && (draftingTimeLimit > 0)) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const diff = (Date.now() - startTimeRef.current) / 1000;
        setElapsed(diff);
        if (diff >= draftingTimeLimit) {
          clearInterval(timerRef.current);
          if (matchData) {
              setPhase('result');
              finalizeMatchV(level);
          } else {
            setPhase('result'); setResult(false);
            if (onFail) onFail();
            addToast({ msg: 'Süre doldu! -1 ⚡', color: '#ef4444', icon: '⚡' });
          }
        }
      }, 100);
      return () => clearInterval(timerRef.current);
    }
  }, [phase, targetTime, matchData, level, finalizeMatchV, onFail, addToast]);

  const getCount = (lv) => Math.min(2 + Math.floor((Number(lv) || 1) / 2), gridSize === 8 ? 20 : gridSize === 7 ? 16 : gridSize === 6 ? 14 : gridSize === 5 ? 10 : 8) || 1;
  const getShowTime = (lv) => Math.max(1200, 2500 - lv * 100);

  const newRound = useCallback((targetLevel = level, seed = null) => {
    if (levelUpRef.current) { clearTimeout(levelUpRef.current); levelUpRef.current = null; }
    const total = gridSize * gridSize;

    // Stable Seeded Shuffle Helper
    const seededShuffle = (arr, s) => {
        let currentSeed = s;
        const nextRand = () => {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            return currentSeed / 233280;
        };
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(nextRand() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    let pool;
    if (memMode === 'color') pool = [...MEM_COLORS];
    else if (memMode === 'word') pool = [...MEM_WORDS];
    else pool = [...EMOJIS];

    if (seed) pool = seededShuffle(pool, seed).slice(0, total);
    else pool = pool.sort(() => Math.random() - .5).slice(0, total);

    const cnt = getCount(targetLevel);
    
    let idxs;
    if (seed) {
        idxs = Array.from({ length: total }, (_, i) => i);
        idxs = seededShuffle(idxs, seed + 123).slice(0, cnt);
    } else {
        idxs = Array.from({ length: total }, (_, i) => i).sort(() => Math.random() - .5).slice(0, cnt);
    }

    setGrid(pool); setToRemember(idxs); setRoundCount(cnt); setSelected([]);
    setPhase('show'); setResult(null);
    setTimeout(() => setPhase('recall'), getShowTime(targetLevel));
  }, [level, gridSize, memMode]);

  const initRef = useRef(null);

  useEffect(() => {
    let seed = null;
    if (matchData && matchData.rounds) {
        const round = matchData.rounds[matchData.currentRound - 1];
        if (round) {
            const targetGridSize = round.customParam && typeof round.customParam === 'number' ? round.customParam : (round.difficulty === 'easy' ? 4 : (round.difficulty === 'medium' ? 5 : 6));
            if (gridSize !== targetGridSize) setGridSize(targetGridSize);
            
            // For Memory Mode (emoji, word, color)
            if (round.customMode && round.customMode !== memMode) setMemMode(round.customMode);

            // Enforcement: Use drafted parameters
            if (round.paramType === 'mode' && round.customParam) {
                // Map draft id to memMode
                const m = round.customParam === 'inverted' ? 'color' : 'emoji'; // Fallback mapping for simplicity
                if (memMode !== m) setMemMode(m);
            }
            
            // Time limit enforcement handled in the round start/loop
            
            const currentMatchRoundId = `${matchData.id}_${matchData.currentRound}`;
            if (initRef.current === currentMatchRoundId) return;
            initRef.current = currentMatchRoundId;

            seed = 0;
            const str = matchData.id + matchData.currentRound;
            for(let i=0; i<str.length; i++) seed += str.charCodeAt(i);
            
            newRound(level, seed);
        }
    } else if (isLessonMode && phase === 'idle' && !initRef.current) {
        initRef.current = 'initial';
        newRound(level);
    }
  }, [isLessonMode, level, newRound, matchData]); // Reduced dependencies

  const resetAll = () => {
    if (levelUpRef.current) clearTimeout(levelUpRef.current);
    setLevel(1); setPhase('idle'); setGrid([]); setToRemember([]); setRoundCount(0);
    setSelected([]); setResult(null); setScore({ correct: 0, wrong: 0, streak: 0, bestStreak: 0 });
  };

  const pick = (i) => {
    if (phase !== 'recall') return;
    let ns = [...selected];
    if (i !== -1) {
      const pi = ns.indexOf(i);
      if (pi >= 0) ns.splice(pi, 1); else if (ns.length < roundCount) ns.push(i);
      setSelected(ns);
    }
    if (i === -1 || ns.length === roundCount) {
      const isSkip = i === -1;
      const correct = !isSkip && ns.every(x => toRemember.includes(x)) && toRemember.every(x => ns.includes(x));
      setPhase('result'); setResult(isSkip ? 'skipped' : correct);
      const delay = isSkip ? 800 : (correct ? 1000 : 1200);
      if (correct) {
        const ns2 = { ...score, correct: score.correct + 1, streak: score.streak + 1, bestStreak: Math.max(score.bestStreak, score.streak + 1) };
        setScore(ns2);
        const xp = level * 20 + (gridSize - 4) * 10;
        addToast({ msg: '+' + xp + ' XP! Seviye ' + level + ' tamamlandi!', color: '#10b981', icon: '⚡' });
        levelUpRef.current = setTimeout(() => {
          onXP(xp, 0, 'Görsel Hafiza', 'Görsel Hafıza');
          if (!isLessonMode) { const nextLvl = Math.min(level + 1, 20); setLevel(nextLvl); newRound(nextLvl); }
        }, delay);
      } else {
        setScore({ ...score, wrong: score.wrong + 1, streak: 0 });
        if (onFail && !isSkip) onFail();
        if (matchData) {
            finalizeMatchV(level);
        }
        levelUpRef.current = setTimeout(() => {
          let nextLvl = isSkip ? Math.min(level + 1, 20) : Math.max(level - 1, 1);
          setLevel(nextLvl);
          if (isSkip && typeof onSkip === 'function') onSkip();
          newRound(nextLvl);
        }, delay);
      }
    }
  };

  useEffect(() => () => {
    if (levelUpRef.current) clearTimeout(levelUpRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const displayCount = phase === 'idle' ? getCount(level) : roundCount;

  return (
    <PageWrapper animationType="flip">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ animation: 'pageSlideUp .3s both' }}>
          <div className="st">🧠 Görsel Hafıza</div>
          <div className="ss">Vurgulanan öğeleri ezberle ve geri çağır.</div>
        </div>

        {matchData && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,.15), rgba(6,182,212,.15))',
            border: '2px solid rgba(124,58,237,.3)',
            borderRadius: 16, padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            animation: 'cardReveal .4s both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 24 }}>⚔️</div>
                <div style={{ position: 'absolute', top: -5, right: -10, background: '#7c3aed', color: '#fff', fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 10 }}>R{matchData.currentRound}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 1 }}>HAFIZA REKABETİ</div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{matchData.p1.id === user.id ? matchData.p2.name : matchData.p1.name}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--mu)', fontWeight: 700 }}>DURUM</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--fg)' }}>RAUNT {matchData.currentRound}/5</div>
                </div>
                <div style={{ fontSize: 32 }}>{matchData.p1.id === user.id ? matchData.p2.avatar : matchData.p1.avatar}</div>
            </div>
          </div>
        )}

        <div style={{
          background: 'rgba(255,255,255,.02)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 20, padding: '22px',
          animation: 'cardReveal .4s .06s both',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            {!isLessonMode && (
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {[
                  { l: 'Seviye', v: level, col: c.color },
                  { l: 'Ezber', v: displayCount, col: 'var(--tx)' },
                  { l: 'Seri', v: score.streak, col: '#34d399' },
                  { l: 'En İyi', v: score.bestStreak, col: '#f59e0b' },
                ].map(s => (
                  <div key={s.l} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.l}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--mo)', color: s.col, animation: 'countUp .2s both' }}>{Number.isNaN(s.v) ? 0 : s.v}</div>
                  </div>
                ))}
              </div>
            )}

            {isLessonMode && phase === 'recall' && (
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 9, color: 'var(--mu)', textTransform: 'uppercase' }}>SÜRE</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: targetTime > 0 && (targetTime - elapsed) < 5 ? '#ef4444' : 'var(--fg)', fontFamily: 'var(--mo)' }}>
                  {targetTime > 0 ? (targetTime - elapsed).toFixed(1) : elapsed.toFixed(1)}s
                </div>
              </div>
            )}

            {!isLessonMode && !matchData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                {phase === 'idle' && (
                  <>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[4,5,6,7,8].map(s => (
                        <button key={s} style={{ padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: gridSize === s ? c.color + '22' : 'rgba(255,255,255,.04)', color: gridSize === s ? c.color : 'var(--mu)', fontWeight: gridSize === s ? 800 : 500, fontSize: 11, transition: 'all .2s' }} onClick={() => setGridSize(s)}>{s}x{s}</button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[{id:'emoji',l:'😀'},{id:'word',l:'Kelime'},{id:'color',l:'Renk'}].map(m => (
                        <button key={m.id} style={{ padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: memMode === m.id ? c.color + '22' : 'rgba(255,255,255,.04)', color: memMode === m.id ? c.color : 'var(--mu)', fontWeight: memMode === m.id ? 800 : 500, fontSize: 11, transition: 'all .2s' }} onClick={() => setMemMode(m.id)}>{m.l}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {!isLessonMode && !matchData && (
              <div style={{ display: 'flex', gap: 4 }}>
                {phase === 'idle' && <button className="btn bp" style={{ transition: 'all .2s' }} onClick={newRound}>▶ Başla</button>}
                {phase === 'result' && <button className="btn bp" style={{ transition: 'all .2s' }} onClick={newRound}>Sonraki →</button>}
                <button className="btn bg" style={{ transition: 'all .2s' }} onClick={resetAll}>↺</button>
              </div>
            )}
            {matchData && !isLessonMode && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {phase === 'idle' && <button className="btn bp" style={{ padding: '10px 24px', fontWeight: 900, background: 'linear-gradient(135deg, var(--ac), var(--ac2))' }} onClick={newRound}>⚔️ BAŞLA</button>}
                {phase === 'result' && <button className="btn bp" style={{ padding: '10px 24px', fontWeight: 900 }} onClick={newRound}>Sonraki →</button>}
              </div>
            )}
          </div>

          {/* Faz göstergesi */}
          {phase === 'show' && (
            <div style={{
              textAlign: 'center', marginBottom: 14, padding: '8px 14px',
              background: 'rgba(124,58,237,.15)', borderRadius: 10, color: c.color, fontWeight: 700,
              animation: 'successPop .3s both',
            }}>
              {roundCount} öğeyi ezberle! ({(getShowTime(level) / 1000).toFixed(1)}sn kaldı)
            </div>
          )}
          {phase === 'recall' && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                padding: '8px 14px', background: 'rgba(6,182,212,.15)', borderRadius: 10,
                color: 'var(--ac2)', fontWeight: 700, flex: 1, textAlign: 'center',
                animation: 'pageSlideUp .25s both',
              }}>
                📦 Hangi öğelerdi? Seç!
              </div>
              <button className="btn bg" style={{ padding: '8px 16px', color: '#f87171', border: '1px solid rgba(248,113,113,.3)', transition: 'all .2s' }} onClick={() => pick(-1)}>⏭️ Geç</button>
            </div>
          )}
          {phase === 'result' && (
            <div style={{
              textAlign: 'center', marginBottom: 14, padding: 12,
              background: result === 'skipped' ? 'rgba(245,158,11,.15)' : result ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)',
              borderRadius: 10, fontWeight: 700,
              color: result === 'skipped' ? '#f59e0b' : result ? '#34d399' : '#f87171',
              fontSize: 16,
              animation: 'successPop .35s both',
            }}>
              {result === 'skipped' ? 'Es geçildi →' : result ? 'Mükemmel! Seviye ' + (level + 1) + "'e →" : 'Tekrar dene'}
            </div>
          )}

          {user.id === 'demo' && phase === 'result' && result && (
             <div style={{ 
               marginBottom: 15, padding: 15, background: 'rgba(221,185,74,.1)', 
               border: '1px solid rgba(221,185,74,.3)', borderRadius: 12, textAlign: 'center',
               animation: 'cardReveal .3s both'
             }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>💎 Harika Gidiyorsun!</div>
                <div style={{ fontSize: 11, color: 'var(--mu)', marginBottom: 12 }}>Bu skoru ve kazandığın XP'yi kaybetmemek için hemen kayıt ol.</div>
                <button className="btn bp" onClick={() => setDemoMode(false)} style={{ fontSize: 12, padding: '8px 16px' }}>Skorunu Kaydet & Kayıt Ol</button>
             </div>
          )}

          {/* Grid */}
          {phase !== 'idle' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(' + gridSize + ',1fr)',
              gap: gridSize >= 7 ? 3 : gridSize >= 6 ? 5 : 8,
              maxWidth: gridSize === 8 ? 480 : gridSize === 7 ? 440 : gridSize === 6 ? 420 : gridSize === 5 ? 360 : 300,
              margin: '0 auto',
            }}>
              {grid.map((em, i) => {
                const isTarget = toRemember.includes(i);
                const isSel = selected.includes(i);
                let cl = 'vm-cell';
                if (phase === 'show' && isTarget) cl += ' active';
                if (phase === 'recall' && isSel) cl += ' active';
                if (phase === 'result') {
                  if (isTarget && isSel) cl += ' correct';
                  else if (isSel && !isTarget) cl += ' wrong-v';
                  else if (isTarget) cl += ' correct';
                }
                const cs = gridSize === 8 ? { width: 50, height: 50, fontSize: memMode === 'word' ? 9 : memMode === 'color' ? 0 : 14 }
                  : gridSize === 7 ? { width: 54, height: 54, fontSize: memMode === 'word' ? 10 : memMode === 'color' ? 0 : 16 }
                  : gridSize === 6 ? { width: 58, height: 58, fontSize: memMode === 'word' ? 11 : memMode === 'color' ? 0 : 18 }
                  : gridSize === 5 ? { width: 60, height: 60, fontSize: memMode === 'word' ? 12 : memMode === 'color' ? 0 : 20 }
                  : { fontSize: memMode === 'word' ? 13 : memMode === 'color' ? 0 : 22 };
                const colorBg = memMode === 'color' ? em + '33' : undefined;
                const cellBg = phase === 'show' && isTarget ? (memMode === 'color' ? em + '88' : c.color + '33') : colorBg;
                return (
                  <div key={i} className={cl} onClick={() => pick(i)}
                    style={{
                      ...cs, background: cellBg,
                      transition: 'all .15s',
                      animation: phase === 'show' && isTarget ? 'successPop .3s both' : phase === 'result' && isSel && !isTarget ? 'wrongShake .3s both' : 'none',
                    }}>
                    {memMode === 'color' ? <div style={{ width: '60%', height: '60%', borderRadius: '50%', background: em, margin: 'auto' }} /> : em}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {matchData && matchData.status === 'drafting' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div className="card" style={{ width: '95%', maxWidth: 600, padding: 0, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <DuelDraft matchId={matchData.id} userId={user.id} onFinish={() => setMatchData({ ...matchData, status: 'in_progress' })} />
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

// ─── WPM TEST ─────────────────────────────────────────────────────────────────
export function WPMTest({ user, onXP, addToast, texts, isMobile }) {
  const [sel, setSel] = useState(texts[0]);
  const [phase, setPhase] = useState('ready');
  const [startTime, setStartTime] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [showQ, setShowQ] = useState(false);
  const { c } = getLvl(user.tecrube || 0);
  const wc = sel.content.split(/\s+/).length;

  const begin = () => { setPhase('reading'); setStartTime(Date.now()); };
  const finish = () => {
    const secs = (Date.now() - startTime) / 60000;
    const w = Math.round(wc / secs);
    setWpm(w); setPhase('done');
    const g = Math.round(w / 10);
    onXP(g, w, sel.title, 'WPM Testi');
    addToast({ msg: w + ' WPM! +' + g + ' XP ⚡', color: c.color, icon: '⚡' });
  };

  if (showQ) return (
    <PageWrapper animationType="slide">
      <Quiz text={sel} onDone={(x) => { setShowQ(false); if (x) onXP(x, wpm, sel.title, 'Quiz'); }} addToast={addToast} />
    </PageWrapper>
  );

  const rating = wpm < 200 ? { text: 'Yavaş', sub: 'Hedef: 300+ WPM', col: '#f87171' }
    : wpm < 400 ? { text: 'Normal', sub: 'Hedef: 600+ WPM', col: '#f59e0b' }
    : wpm < 800 ? { text: 'Hızlı!', sub: 'Hedef: 1000+ WPM', col: '#34d399' }
    : { text: 'Olağanüstü! 🔥', sub: 'Gerçek hız okuyucu', col: c.color };

  return (
    <PageWrapper animationType="flip">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ animation: 'pageSlideUp .3s both' }}>
          <div className="st">📊 WPM Testi</div>
          <div className="ss">Metni kendi hızında oku. Bitirince "Bitti" de. Gerçek hızını öğren.</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,.02)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 20, padding: '22px',
          animation: 'cardReveal .4s .06s both',
        }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
            <TextSelect value={sel.id} onChange={t => { setSel(t); setPhase('ready'); setWpm(0); }} texts={texts} />
            <div style={{ fontSize: 12, color: 'var(--mu)', fontFamily: 'var(--mo)' }}>{wc} kelime</div>
          </div>

          {phase === 'done' && (
            <div style={{
              textAlign: 'center', marginBottom: 20, padding: 20,
              background: 'rgba(255,255,255,.03)', borderRadius: 16,
              border: '1px solid rgba(255,255,255,.08)',
              animation: 'successPop .4s both',
            }}>
              <div style={{ fontSize: 11, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: 1 }}>Okunan WPM</div>
              <div className="wpm-big" style={{ color: c.color, textShadow: '0 0 30px ' + c.color + '55', animation: 'countUp .3s both' }}>{wpm}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: rating.col, marginTop: 4 }}>{rating.text}</div>
              <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 4 }}>{rating.sub}</div>
            </div>
          )}

          {/* Çalışırken immersive gösterge */}
          {phase === 'reading' && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14, animation: 'pageFadeIn .3s both' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 18px', borderRadius: 20,
                background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)',
                color: '#10b981', fontSize: 12, fontWeight: 700,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulseGlow 1.2s infinite' }} />
                Okuma Sürüyor — Hazır olunca "Bitti!" bas
              </div>
            </div>
          )}

          <div style={{
            maxHeight: 340, overflowY: 'auto', padding: '4px 0',
            opacity: phase === 'ready' ? .5 : 1,
            transition: 'opacity .3s',
            borderRadius: 12,
          }}>
            <p style={{ lineHeight: 1.9, fontSize: 16 }}>{sel.content}</p>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
            {phase === 'ready' && <button className="btn bp" style={{ transition: 'all .2s' }} onClick={begin}>▶ Okumaya Başla</button>}
            {phase === 'reading' && <button className="btn bp" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', transition: 'all .2s' }} onClick={finish}>✓ Bitti!</button>}
            {phase === 'done' && <>
              <button className="btn bg" style={{ transition: 'all .2s' }} onClick={() => setPhase('ready')}>🔄 Tekrar</button>
              <button className="btn bg" style={{ transition: 'all .2s' }} onClick={() => setShowQ(true)}>📝 Anlama Testi</button>
            </>}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

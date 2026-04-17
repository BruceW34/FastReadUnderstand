import { useState, useCallback, useRef, useEffect } from 'react';
import { db } from '@/services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getLvl } from '@/data/levels.js';
import { BoltGuide } from '@/components/shared/BoltGuide';
import { PageWrapper, AnimCard, TipBox } from './PageWrapper.jsx';
import { DuelDraft } from '../modals/DuelDraft';

const LETTERS = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ';

// ─── PERIPHERAL VISION ────────────────────────────────────────────────────────
export function PeripheralVision({ user, onXP, addToast, isPro, onFail, onSkip, isLessonMode = false, targetTime = 0, initialMode = 'letter', isMobile, matchData, setMatchData }) {
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState(initialMode);
  const [center, setCenter] = useState('+');
  const [sides, setSides] = useState({ left: '', right: '' });
  const [answer, setAnswer] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showTime, setShowTime] = useState(600);
  const [round, setRound] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [lastAnswer, setLastAnswer] = useState(null); // 'correct' | 'wrong'
  const tr = useRef(null); const timerRef = useRef(null);
  const { c } = getLvl(user.tecrube || 0);

  const newFlash = useCallback((seed) => {
    setLastAnswer(null);
    const chars = mode === 'number' ? '0123456789'.split('') : LETTERS.split('');
    
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

    let shuffled;
    if (seed) {
        shuffled = seededShuffle(chars, seed + round * 100); 
    } else {
        shuffled = [...chars].sort(() => Math.random() - 0.5);
    }

    const l = shuffled[0];
    const r = shuffled[1];
    const pos = (seed ? (seed + round) % 2 === 0 : Math.random() > .5) ? 'left' : 'right';
    const target = pos === 'left' ? l : r;
    setSides({ left: l, right: r });
    setCenter(target);
    setAnswer({ pos, target, revealed: false });
    tr.current = setTimeout(() => setSides({ left: '?', right: '?' }), showTime);
  }, [showTime, mode, round]);

  useEffect(() => { if (isLessonMode && !running) start(); }, [isLessonMode]);

  useEffect(() => {
    const round = matchData?.rounds?.[matchData.currentRound - 1];
    const draftingTimeLimit = (round?.paramType === 'time' && round?.customParam) ? parseInt(round.customParam) : targetTime;

    if (running && draftingTimeLimit > 0) {
      timerRef.current = setInterval(() => {
        setElapsed(e => {
            const nextE = e + 0.1;
            if (nextE >= draftingTimeLimit) {
                clearInterval(timerRef.current);
                setRunning(false);
                if (matchData) {
                    finalizeMatchP(score.correct);
                } else {
                    if (onFail) onFail();
                    addToast({ msg: 'Süre doldu! -1 ⚡', color: '#ef4444', icon: '⚡' });
                }
                return nextE;
            }
            return nextE;
        });
      }, 100);
      return () => clearInterval(timerRef.current);
    }
  }, [running, targetTime, matchData, score.correct, onFail, addToast]);

  const initRef = useRef(null);

  const start = (seed = null) => {
    if (showTime < 300 && !isPro && !isLessonMode) return;
    
    clearInterval(timerRef.current);
    setRunning(true); setScore({ correct: 0, total: 0 }); setRound(0); setElapsed(0);
    newFlash(seed);
  };

  useEffect(() => {
    let seed = null;
    if (matchData && matchData.rounds) {
        const round = matchData.rounds[matchData.currentRound - 1];
        if (round) {
            // Enforcement: Use drafted parameters
            if (round.paramType === 'flash' && round.customParam) {
                const f = parseInt(round.customParam);
                if (showTime !== f) setShowTime(f);
            }
            
            const currentMatchRoundId = `${matchData.id}_${matchData.currentRound}`;
            if (initRef.current === currentMatchRoundId) return;
            initRef.current = currentMatchRoundId;

            seed = 0;
            const str = matchData.id + matchData.currentRound;
            for(let i=0; i<str.length; i++) seed += str.charCodeAt(i);
            
            start(seed);
        }
    } else if (!initRef.current) {
        initRef.current = 'initial';
        start();
    }
  }, [matchData, showTime]);

  const finalizeMatchP = useCallback((finalScore) => {
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
      addToast({ msg: 'Skorun kaydedildi!', icon: '👁️' });
    });
  }, [matchData, user.id, addToast]);

  const onAnswer = (side) => {
    if (!answer || answer.revealed) return;
    clearTimeout(tr.current);
    if (side === 'skip') {
      if (typeof onSkip === 'function') setTimeout(() => onSkip(), 400);
      else setTimeout(() => newFlash(), 400);
      return;
    }
    const correct = side === answer.pos;
    setLastAnswer(correct ? 'correct' : 'wrong');
    setAnswer({ ...answer, revealed: true });
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    const nr = round + 1; setRound(nr);
    if (nr >= 15) {
      setRunning(false);
      clearInterval(timerRef.current);
      const finalScore = score.correct + (correct ? 1 : 0);
      if (matchData) {
          finalizeMatchP(finalScore);
          return;
      }
      const g = Math.round(finalScore * 5 * (1 + c.level / 10)); // Reduced multiplier from 10 to 5
      onXP(g, 0, 'Cevre Gorusu', 'Çevre Görüşü');
      addToast({ msg: finalScore + '/15! +' + g + ' XP', color: '#06b6d4', icon: '👁️' });
      return;
    }
    setTimeout(() => newFlash(), 800);
  };

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <PageWrapper animationType="flip">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ animation: 'pageSlideUp .3s both' }}>
          <div className="st">👁️ Çevre Görüşü</div>
          <div className="ss">Bakışını merkeze odakla ve yanlarda beliren karakterleri tespit et.</div>
        </div>

        {matchData && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,.15), rgba(59,130,246,.15))',
            border: '2px solid rgba(6,182,212,.3)',
            borderRadius: 16, padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            animation: 'cardReveal .4s both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 24 }}>⚔️</div>
                <div style={{ position: 'absolute', top: -5, right: -10, background: '#06b6d4', color: '#fff', fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 10 }}>R{matchData.currentRound}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: 1 }}>VİZYON REKABETİ</div>
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
          {/* Skor + ayarlar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            {!isLessonMode && (
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {[
                  { l: 'Doğru', v: score.correct, col: '#34d399' },
                  { l: 'Tur', v: round + '/15', col: c.color },
                  { l: 'İsabet', v: accuracy + '%', col: accuracy > 70 ? '#34d399' : '#f59e0b' },
                ].map(s => (
                  <div key={s.l} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: .8 }}>{s.l}</div>
                    <div style={{
                      fontSize: 26, fontWeight: 900, fontFamily: 'var(--mo)', color: s.col,
                      animation: 'countUp .2s both',
                    }}>{s.v}</div>
                  </div>
                ))}
              </div>
            )}

            {isLessonMode && running && (
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 9, color: 'var(--mu)', textTransform: 'uppercase' }}>SÜRE</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: (targetTime - elapsed) < 5 ? '#ef4444' : 'var(--fg)', fontFamily: 'var(--mo)' }}>
                  {(targetTime - elapsed).toFixed(1)}s
                </div>
              </div>
            )}

            {!isLessonMode && !matchData && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--mu)' }}>Mod:</span>
                <button style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: mode === 'letter' ? c.color + '22' : 'rgba(255,255,255,.04)', color: mode === 'letter' ? c.color : 'var(--mu)', fontWeight: mode === 'letter' ? 800 : 500, fontSize: 12, transition: 'all .2s' }} onClick={() => setMode('letter')}>Harf</button>
                <button style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: mode === 'number' ? c.color + '22' : 'rgba(255,255,255,.04)', color: mode === 'number' ? c.color : 'var(--mu)', fontWeight: mode === 'number' ? 800 : 500, fontSize: 12, transition: 'all .2s' }} onClick={() => setMode('number')}>Sayı</button>
                <span style={{ fontSize: 11, color: 'var(--mu)', marginLeft: 6 }}>Flash:</span>
                {[800, 600, 400].map(t => (
                  <button key={t} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: showTime === t ? c.color + '22' : 'rgba(255,255,255,.04)', color: showTime === t ? c.color : 'var(--mu)', fontSize: 11, transition: 'all .2s' }} onClick={() => setShowTime(t)}>{t}ms</button>
                ))}
              </div>
            )}
            {matchData && (
              <div style={{ flex: 1, textAlign: 'right' }}>
                 <div style={{ fontSize: 10, color: 'var(--mu)', fontWeight: 800, textTransform: 'uppercase' }}>HIZ</div>
                 <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--ac)', fontFamily: 'var(--mo)' }}>{showTime}ms</div>
              </div>
            )}
          </div>

          {/* Flash alanı */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0,
            minHeight: 180,
            borderTop: '1px solid rgba(255,255,255,.07)',
            borderBottom: '1px solid rgba(255,255,255,.07)',
            margin: '0 -22px', padding: '22px',
            background: lastAnswer === 'correct'
              ? 'rgba(16,185,129,.06)'
              : lastAnswer === 'wrong'
              ? 'rgba(239,68,68,.06)'
              : 'transparent',
            transition: 'background .3s',
          }}>
            {/* Sol taraf */}
            <div className="pv-side" onClick={() => onAnswer('left')} style={{
              cursor: running ? 'pointer' : 'default',
              flex: 1, textAlign: 'center', padding: '10px',
              borderRadius: 14,
              transition: 'all .15s',
              transform: running ? 'scale(1)' : 'scale(0.95)',
            }}>
              <span style={{
                fontSize: 46, fontWeight: 900, fontFamily: 'var(--mo)',
                color: answer?.revealed && answer.pos === 'left' ? '#34d399' : 'var(--tx)',
                animation: running && sides.left !== '?' ? 'successPop .2s both' : 'none',
              }}>{running ? sides.left : '—'}</span>
            </div>

            {/* Merkez hedef */}
            <div style={{ width: 130, textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: c.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>BUL</div>
              <div style={{
                fontSize: 50, fontWeight: 900, fontFamily: 'var(--mo)', color: c.color,
                textShadow: '0 0 24px ' + c.color + '88',
                animation: running ? 'countUp .15s both' : 'none',
              }}>{running ? center : '+'}</div>
            </div>

            {/* Sağ taraf */}
            <div className="pv-side" onClick={() => onAnswer('right')} style={{
              cursor: running ? 'pointer' : 'default',
              flex: 1, textAlign: 'center', padding: '10px',
              borderRadius: 14, transition: 'all .15s',
              transform: running ? 'scale(1)' : 'scale(0.95)',
            }}>
              <span style={{
                fontSize: 46, fontWeight: 900, fontFamily: 'var(--mo)',
                color: answer?.revealed && answer.pos === 'right' ? '#34d399' : 'var(--tx)',
                animation: running && sides.right !== '?' ? 'successPop .2s both' : 'none',
              }}>{running ? sides.right : '—'}</span>
            </div>
          </div>

          {/* Başlat / Bolt rehber / Geç */}
          {!running && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <button className="btn bp" style={{ padding: matchData ? '12px 35px' : '8px 20px', fontWeight: 900, background: matchData ? 'linear-gradient(135deg, var(--ac), var(--ac2))' : undefined }} onClick={start}>{matchData ? '⚔️ BAŞLA' : '▶ Başla'}</button>
            </div>
          )}
          {!isPro && !isLessonMode && !matchData && (
            <div style={{ display: 'flex', gap: 6 }}>
              {[800, 600, 400, 200].map(ms => (
                <button key={ms} className={`btn ${showTime === ms ? 'bp' : 'bg'} bs`} onClick={() => setShowTime(ms)}>{ms}ms</button>
              ))}
            </div>
          )}
          {running && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 16, animation: 'pageFadeIn .3s both' }}>
              <BoltGuide
                message={round > 7 ? 'Görüşün iyice açıldı, devam! ⚡' : 'Merkezden ayrılma, yanları hisset! 🎯'}
                style={{ border: 'none', background: 'transparent', padding: 0, position: 'relative', bottom: 'auto', right: 'auto', marginTop: 16 }}
              />
              <button className="btn bg" style={{ padding: '8px 24px', color: '#f87171', border: '1px solid rgba(248,113,113,.3)', transition: 'all .2s' }} onClick={() => onAnswer('skip')}>⏭️ Geç</button>
            </div>
          )}

          {/* İlerleme bar */}
          {running && (
            <div style={{ marginTop: 14, animation: 'pageFadeIn .3s both' }}>
              <div style={{ height: 5, background: 'rgba(255,255,255,.06)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: (round / 15 * 100) + '%',
                  background: 'linear-gradient(90deg, ' + c.color + ', ' + c.color + 'cc)',
                  transition: 'width .3s ease',
                  boxShadow: '0 0 6px ' + c.color + '88',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--mu)', marginTop: 4 }}>
                <span>{round}/15 tur</span>
                <span>{accuracy}% isabet</span>
              </div>
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

// ─── WORD RECOGNITION ─────────────────────────────────────────────────────────
const RECOG_WORDS = ['bilim','uzay','dünya','kitap','ışık','zaman','rüzgar','deniz','güneş','bulut','yıldız','ateş','orman','pencere','kapı','ayna','masa','köprü','kule','şehir','çiçek','dağ','yol','gece','gözlem','keşif','deney','toplum','sanat','müzik'];

export function WordRecognition({ user, onXP, addToast, isPro, onFail, onSkip, isLessonMode = false, targetTime = 0, initialMode = 'word', isMobile, matchData, setMatchData }) {
  const [phase, setPhase] = useState('idle');
  const [mode, setMode] = useState(initialMode);
  const [flashWord, setFlashWord] = useState('');
  const [options, setOptions] = useState([]);
  const [correct, setCorrect] = useState('');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [round, setRound] = useState(0);
  const [flashMs, setFlashMs] = useState(750);
  const [picked, setPicked] = useState(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const initRef = useRef(null);
  const { c } = getLvl(user.tecrube || 0);

  useEffect(() => {
    const roundObj = matchData?.rounds?.[matchData.currentRound - 1];
    const draftingTimeLimit = (roundObj?.paramType === 'time' && roundObj?.customParam) ? parseInt(roundObj.customParam) : targetTime;

    if (phase !== 'idle' && phase !== 'done' && draftingTimeLimit > 0) {
      timerRef.current = setInterval(() => {
        setElapsed(e => {
            const nextE = e + 0.1;
            if (nextE >= draftingTimeLimit) {
                clearInterval(timerRef.current);
                setPhase('done');
                if (matchData) {
                    finalizeMatchW(score.correct);
                } else {
                    if (onFail) onFail();
                    addToast({ msg: 'Süre doldu! -1 ⚡', color: '#ef4444', icon: '⚡' });
                }
                return nextE;
            }
            return nextE;
        });
      }, 100);
      return () => clearInterval(timerRef.current);
    }
  }, [phase, targetTime, matchData, score, onFail, addToast]);

  const newRound = useCallback((seed) => {
    let target, pool;
    
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

    if (mode === 'number') {
      const makeLookalike = (t, s) => {
        let currentSeed = s;
        const nextRand = () => {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            return currentSeed / 233280;
        };
        let arr = t.split('');
        let changes = Math.floor(nextRand() * 2) + 1;
        for (let i = 0; i < changes; i++) {
          let idx = Math.floor(nextRand() * arr.length);
          arr[idx] = (Math.floor(nextRand() * 9) + 1).toString();
        }
        return arr.join('');
      };
      
      const chars = '0123456789'.split('');
      let dig;
      if (seed) {
          dig = seededShuffle(chars, seed + round * 50);
      } else {
          dig = chars.sort(() => Math.random() - .5);
      }
      target = dig.slice(0, 4 + Math.min(6, Math.floor(round/2))).join('');
      
      pool = [target];
      let pSeed = (seed || 0) + round * 77;
      while (pool.length < 4) { 
          let n = makeLookalike(target, pSeed++); 
          if (!pool.includes(n)) pool.push(n); 
      }
    } else {
      let p;
      if (seed) p = seededShuffle(RECOG_WORDS, seed + round * 10);
      else p = [...RECOG_WORDS].sort(() => Math.random() - .5);
      target = p[0]; pool = [target, p[1], p[2], p[3]];
    }
    const offsetX = (seed ? ( (seed+round*33) % 400 - 200 ) : (Math.random() - 0.5) * (isMobile ? 100 : 250));
    const offsetY = (seed ? ( (seed+round*66) % 160 - 80 ) : (Math.random() - 0.5) * (isMobile ? 40 : 80));
    
    setPos({ x: offsetX, y: offsetY });
    setFlashWord(target); setCorrect(target); 
    
    if (seed) setOptions(seededShuffle(pool, seed + round * 99));
    else setOptions(pool.sort(() => Math.random() - .5));
    
    setPicked(null); setPhase('flash');
    setTimeout(() => setPhase('pick'), flashMs);
  }, [flashMs, mode, isMobile, round]);

  useEffect(() => { if (isLessonMode && phase === 'idle') start(); }, [isLessonMode, phase]);

  // Timer is handled in the unified effect above


  const finalizeMatchW = useCallback((finalScore) => {
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
      addToast({ msg: 'Skorun kaydedildi!', icon: '🔤' });
    });
  }, [matchData, user.id, addToast]);

  const start = (seed = null) => {
    if (flashMs < 200 && !isPro && !isLessonMode) return;
    if (matchData && matchData.rounds) {
        const roundData = matchData.rounds[matchData.currentRound - 1];
        if (roundData) {
            // Enforcement: Use drafted parameters
            if (roundData.paramType === 'flash' && roundData.customParam) {
              const targetFlashMs = parseInt(roundData.customParam);
              if (flashMs !== targetFlashMs) setFlashMs(targetFlashMs);
            } else {
              const targetFlashMs = roundData.difficulty === 'easy' ? 1000 : (roundData.difficulty === 'medium' ? 750 : 500);
              if (flashMs !== targetFlashMs) setFlashMs(targetFlashMs);
            }

            const currentMatchRoundId = `${matchData.id}_${matchData.currentRound}`;
            if (initRef.current === currentMatchRoundId) return;
            initRef.current = currentMatchRoundId;

            seed = 0;
            const str = matchData.id + matchData.currentRound;
            for(let i=0; i<str.length; i++) seed += str.charCodeAt(i);
        }
    } else if (!initRef.current) {
        initRef.current = 'initial';
    }
    setScore({ correct: 0, total: 0 }); setRound(0); setElapsed(0); 
    newRound(seed);
  };

  const pick = (w) => {
    if (phase !== 'pick' || picked !== null) return;
    setPicked(w === null ? 'skip' : w);
    if (w === null) {
      setScore(s => ({ ...s, total: s.total + 1 }));
      const nr = round + 1; setRound(nr);
      if (nr >= (isLessonMode ? 1 : 10)) {
        setPhase('done'); clearInterval(timerRef.current);
        const g = Math.round(score.correct * 4 * (1 + c.level / 12)); // Reduced multiplier from 8 to 4
        setTimeout(() => onXP(g, 0, 'Kelime Tanima', 'Kelime Tanıma'), 700);
      } else {
        if (typeof onSkip === 'function') setTimeout(() => onSkip(), 700);
        else setTimeout(() => newRound(), 700);
      }
      return;
    }
    const isCorrect = w === correct;
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    const nr = round + 1; setRound(nr);
    if (nr >= (isLessonMode ? 1 : (matchData ? 10 : 20))) {
      setPhase('done'); 
      clearInterval(timerRef.current);
      const finalScore = score.correct + (isCorrect ? 1 : 0);
      
      if (matchData) {
          finalizeMatchW(finalScore);
      } else {
          const g = Math.round(finalScore * 4 * (1 + c.level / 12)); // Reduced multiplier from 8 to 4
          setTimeout(() => onXP(g, 0, 'Kelime Tanima', 'Kelime Tanıma'), 700);
          addToast({ msg: finalScore + '/' + (isLessonMode ? 10 : 20) + '! +' + g + ' XP', color: '#10b981', icon: '🔤' });
      }
    } else {
      setTimeout(() => newRound(), 1000);
    }
  };

  return (
    <PageWrapper animationType="flip">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ animation: 'pageSlideUp .3s both' }}>
          <div className="st">🔤 {mode === 'number' ? 'Sayı' : 'Kelime'} Tanıma</div>
          <div className="ss">Hızlıca flash edilen öğeyi seçeneklerden bul.</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,.02)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 20, padding: '22px',
          animation: 'cardReveal .4s .06s both',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            {!isLessonMode && (
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--mu)', textTransform: 'uppercase' }}>Doğru</div>
                  <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'var(--mo)', color: '#34d399', animation: 'countUp .2s both' }}>{score.correct}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--mu)', textTransform: 'uppercase' }}>Tur</div>
                  <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'var(--mo)', color: c.color }}>{round}/{isLessonMode ? 10 : 20}</div>
                </div>
              </div>
            )}

            {isLessonMode && phase !== 'idle' && phase !== 'done' && (
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 9, color: 'var(--mu)', textTransform: 'uppercase' }}>SÜRE</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: (targetTime - elapsed) < 5 ? '#ef4444' : 'var(--fg)', fontFamily: 'var(--mo)' }}>
                  {(targetTime - elapsed).toFixed(1)}s
                </div>
              </div>
            )}

            {!isLessonMode && !matchData && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {['word', 'number'].map(m => (
                  <button key={m} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: mode === m ? c.color + '22' : 'rgba(255,255,255,.04)', color: mode === m ? c.color : 'var(--mu)', fontWeight: mode === m ? 800 : 500, fontSize: 12, transition: 'all .2s' }} onClick={() => setMode(m)}>{m === 'word' ? 'Kelime' : 'Sayı'}</button>
                ))}
                <span style={{ fontSize: 11, color: 'var(--mu)', marginLeft: 4 }}>Flash:</span>
                {[1000, 750, 500].map(t => (
                  <button key={t} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: flashMs === t ? c.color + '22' : 'rgba(255,255,255,.04)', color: flashMs === t ? c.color : 'var(--mu)', fontSize: 11, transition: 'all .2s' }} onClick={() => phase === 'idle' && setFlashMs(t)}>{t}ms</button>
                ))}
              </div>
            )}
            {matchData && (
              <div style={{ flex: 1, textAlign: 'right' }}>
                 <div style={{ fontSize: 10, color: 'var(--mu)', fontWeight: 800, textTransform: 'uppercase' }}>HIZ</div>
                 <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--ac)', fontFamily: 'var(--mo)' }}>{flashMs}ms</div>
              </div>
            )}
          </div>

          {/* Flash area */}
          <div style={{
            minHeight: 150, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderTop: '1px solid rgba(255,255,255,.07)',
            borderBottom: '1px solid rgba(255,255,255,.07)',
            margin: '0 -22px', padding: '22px',
            position: 'relative', overflow: 'hidden',
            background: phase === 'flash' ? c.color + '06' : 'transparent',
            transition: 'background .15s',
          }}>
            {phase === 'flash' && (
              <div style={{
                fontSize: 50, fontWeight: 900, fontFamily: 'var(--mo)', color: c.color,
                animation: 'successPop .08s ease both',
                transform: 'translate(' + pos.x + 'px, ' + pos.y + 'px)',
                textShadow: '0 0 20px ' + c.color + '88',
              }}>{flashWord}</div>
            )}
            {phase === 'pick' && <div style={{ fontSize: 22, color: 'var(--mu)', fontWeight: 700 }}>Ne gördün? 🤔</div>}
            {phase === 'idle' && <div style={{ fontSize: 15, color: 'var(--mu)' }}>▶ Başlamak için butona bas</div>}
            {phase === 'done' && (
              <div style={{ textAlign: 'center', animation: 'successPop .4s both' }}>
                <div style={{ fontSize: 44 }}>{score.correct === round ? '🎯' : '📚'}</div>
                <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{score.correct}/{round}</div>
                <div style={{ fontSize: 13, color: 'var(--mu)', marginTop: 4 }}>
                  {score.correct === round ? 'Mükemmel!' : score.correct > round / 2 ? 'İyi iş!' : 'Daha fazla pratik yap!'}
                </div>
              </div>
            )}
          </div>

          {/* Seçenekler */}
          {phase === 'pick' && (
            <div style={{ animation: 'pageSlideUp .2s both' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: mode === 'number' ? 14 : 8, marginTop: 16 }}>
                {options.map(w => {
                  const isWrong = picked === w && w !== correct;
                  const isRight = picked === w && w === correct;
                  const shouldHighlight = picked && w === correct && picked !== w;
                  return (
                    <button key={w}
                      style={{
                        padding: mode === 'number' ? '28px 10px' : '14px 18px',
                        fontSize: mode === 'number' ? 26 : 16,
                        fontFamily: mode === 'number' ? 'var(--mo)' : 'inherit',
                        fontWeight: 900, letterSpacing: mode === 'number' ? 8 : 0,
                        textAlign: 'center',
                        borderRadius: 12, border: 'none', cursor: 'pointer',
                        background: isRight ? 'rgba(16,185,129,.25)' : isWrong ? 'rgba(239,68,68,.2)' : shouldHighlight ? 'rgba(16,185,129,.15)' : mode === 'number' ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.04)',
                        color: isRight ? '#34d399' : isWrong ? '#f87171' : shouldHighlight ? '#34d399' : 'var(--tx)',
                        outline: isRight ? '2px solid #34d399' : isWrong ? '2px solid #f87171' : shouldHighlight ? '1.5px solid #34d39966' : '1px solid rgba(255,255,255,.07)',
                        transition: 'all .15s',
                        animation: isRight ? 'successPop .3s both' : isWrong ? 'wrongShake .3s both' : 'cardReveal .25s both',
                      }}
                      onClick={() => pick(w)}>{w}</button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                {picked === 'skip'
                  ? <div style={{ padding: '8px 24px', color: '#f59e0b', background: 'rgba(245,158,11,.15)', borderRadius: 10, fontWeight: 700, fontSize: 13 }}>⏭️ Es geçildi...</div>
                  : <button className="btn bg" style={{ padding: '8px 24px', color: '#f87171', border: '1px solid rgba(248,113,113,.3)', transition: 'all .2s' }} onClick={() => pick(null)}>⏭️ Geç</button>}
              </div>
            </div>
          )}

          {/* Başlat */}
          {phase === 'idle' && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
              <button className="btn bp" style={{ padding: matchData ? '12px 35px' : '8px 20px', fontWeight: 900, background: matchData ? 'linear-gradient(135deg, var(--ac), var(--ac2))' : undefined }} onClick={start}>{matchData ? '⚔️ BAŞLA' : '▶ Başla'}</button>
            </div>
          )}

          {(phase === 'flash' || phase === 'pick') && (
            <BoltGuide
              message={mode === 'number' ? 'Tüm sayıyı tek bir resim gibi düşün! 🧩' : (round > 10 ? 'Harika bir görsel hafıza! 🧠' : 'Kelimeyi bir resim gibi gör! 📸')}
              style={{ marginTop: 16, border: 'none', background: 'transparent', padding: 0, position: 'relative', bottom: 'auto', right: 'auto' }}
            />
          )}

          {/* İlerleme bar */}
          {(phase === 'flash' || phase === 'pick') && (
            <div style={{ marginTop: 12 }}>
              <div style={{ height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: (round / 10 * 100) + '%',
                  background: 'linear-gradient(90deg, ' + c.color + ', ' + c.color + 'cc)',
                  transition: 'width .3s ease',
                }} />
              </div>
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

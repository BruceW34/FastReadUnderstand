import { useState, useMemo, useEffect, useRef } from 'react';
import { getLvl } from '@/data/levels.js';
import { storage } from '@/shared/storage';
import { PageWrapper, AnimCard, TipBox, StatBadge } from './PageWrapper.jsx';

// ─── DAILY CHALLENGE ──────────────────────────────────────────────────────────
export function DailyChallenge({ user, onXP, addToast, texts, isMobile, setFocusMode }) {
  const today = new Date().toISOString().slice(0, 10);
  const [dailyData, setDailyData] = useState(() => storage.get('sr_daily', {}));
  const todayDone = dailyData[today];
  const seed = today.split('-').reduce((a, b) => a + (+b), 0);
  const dailyText = texts[seed % texts.length];
  const targetWPM = 300 + (seed % 5) * 100;
  const [phase, setPhase] = useState(todayDone ? 'done' : 'ready');
  const [startTime, setStartTime] = useState(0);
  const { c } = getLvl(user.tecrube || 0);
  const wc = dailyText.content.split(/\s+/).length;

  const streak = (() => {
    let s = 0; const d = new Date();
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().slice(0, 10);
      if (dailyData[key]) { s++; } else { if (i !== 0) break; }
      d.setDate(d.getDate() - 1);
    }
    return s;
  })();

  const begin = () => { setPhase('reading'); setStartTime(Date.now()); setFocusMode(true); };
  const finish = () => {
    const secs = (Date.now() - startTime) / 60000;
    const wpm = Math.round(wc / secs);
    const hit = wpm >= targetWPM;
    const xp = hit ? 250 : 100;
    const nd = { ...dailyData, [today]: { wpm, target: targetWPM, hit, date: today } };
    setDailyData(nd); storage.set('sr_daily', nd);
    onXP(xp, wpm, dailyText.title, 'Günlük Mücadele');
    setPhase('done'); setFocusMode(false);
    addToast({ msg: hit ? 'Hedef asildi! ' + wpm + ' WPM! +' + xp + ' XP' : wpm + ' WPM. +' + xp + ' XP', color: hit ? '#10b981' : '#f59e0b', icon: '🏁' });
  };

  useEffect(() => () => setFocusMode(false), [setFocusMode]);
  const result = dailyData[today];

  const last7 = (() => {
    const days = []; const d = new Date();
    for (let i = 0; i < 7; i++) {
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, data: dailyData[key] || null });
      d.setDate(d.getDate() - 1);
    }
    return days;
  })();

  return (
    <PageWrapper animationType="flip">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {phase !== 'reading' && (
          <div style={{ animation: 'pageSlideUp .3s both' }}>
            <div className="st">🏁 Günlük Mücadele</div>
            <div className="ss">Her gün yeni bir hız hedefiyle streakini koru.</div>
          </div>
        )}

        {/* Streak + hedef banner */}
        {phase !== 'reading' && (
          <div style={{
            display: 'flex', gap: 12, alignItems: 'stretch',
            animation: 'cardReveal .4s .05s both',
          }}>
            {/* Streak */}
            <div style={{
              flex: 1, borderRadius: 18,
              background: streak > 0 ? 'linear-gradient(135deg, rgba(245,158,11,.15), rgba(245,158,11,.05))' : 'rgba(255,255,255,.03)',
              border: streak > 0 ? '1px solid rgba(245,158,11,.3)' : '1px solid rgba(255,255,255,.07)',
              padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 36, lineHeight: 1, animation: 'boltBounce 2s ease-in-out infinite' }}>🔥</div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: 1 }}>Günlük Seri</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#f59e0b', fontFamily: 'var(--mo)', lineHeight: 1 }}>{streak}</div>
                <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>gün üst üste</div>
              </div>
            </div>
            {/* Hedef */}
            <div style={{
              flex: 1.5, borderRadius: 18,
              background: 'rgba(255,255,255,.02)',
              border: '1px solid rgba(255,255,255,.07)',
              padding: '16px 20px',
            }}>
              <div style={{ fontSize: 10, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Bugünün Hedefi</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{dailyText.title}</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--mu)' }}>{wc} kelime</span>
                <span style={{ color: 'rgba(255,255,255,.15)' }}>•</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b' }}>{targetWPM} WPM hedef</span>
              </div>
            </div>
          </div>
        )}

        <div style={{
          background: 'rgba(255,255,255,.02)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 20,
          padding: phase === 'reading' ? (isMobile ? '20px 15px' : '40px 25px') : '22px',
          transition: 'padding .3s ease',
          animation: 'cardReveal .4s .1s both',
        }}>
          {phase !== 'reading' && (
            <div className="tip-box" style={{ animation: 'tipSlide .4s .12s both' }}>
              💡 <strong>Bilim:</strong> Tutarlılık her şeydir. Streak sistemi beynini düzenli hıza alıştırır.
            </div>
          )}

          {/* Sonuç (tamamlanmışsa) */}
          {result && phase !== 'reading' && (
            <div style={{
              padding: 18, borderRadius: 14, marginBottom: 16, textAlign: 'center',
              background: result.hit ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.08)',
              border: '1px solid ' + (result.hit ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.2)'),
              animation: 'successPop .4s both',
            }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: result.hit ? '#34d399' : '#f87171', fontFamily: 'var(--mo)' }}>
                {result.wpm} WPM
              </div>
              <div style={{ color: 'var(--mu)', marginTop: 6, fontSize: 13 }}>
                {result.hit ? 'Hedef (' + result.target + ' WPM) aşıldı! Harika!' : 'Hedef: ' + result.target + ' WPM — tekrar dene!'}
              </div>
            </div>
          )}

          {/* Metin alanı */}
          <div style={{
            maxHeight: phase === 'reading' ? (isMobile ? '75vh' : '70vh') : 300,
            overflowY: 'auto',
            opacity: phase === 'reading' ? 1 : .6,
            transition: 'all .3s',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,.07)',
            background: 'rgba(0,0,0,.2)',
            marginBottom: 14,
            padding: '14px 18px',
          }}>
            {phase === 'reading' && (
              <div style={{
                display: 'flex', justifyContent: 'center', marginBottom: 14,
                animation: 'pageFadeIn .3s both',
              }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '5px 16px', borderRadius: 20,
                  background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)',
                  color: '#10b981', fontSize: 11, fontWeight: 700,
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'pulseGlow 1.2s infinite' }} />
                  Okuma Sürüyor — Hedef: {targetWPM} WPM
                </div>
              </div>
            )}
            <p style={{ lineHeight: 2.1, fontSize: phase === 'reading' ? 'clamp(1rem, 2.2vw, 1.8rem)' : 16 }}>
              {dailyText.content}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            {phase === 'ready' && <button className="btn bp" style={{ transition: 'all .2s' }} onClick={begin}>▶ Okumaya Başla</button>}
            {phase === 'reading' && <button className="btn bp" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', transition: 'all .2s' }} onClick={finish}>✓ Bitti!</button>}
            {phase === 'done' && <>
              <div style={{ color: 'var(--mu)', fontSize: 13 }}>✅ Tamamlandı!</div>
              <button className="btn bg" style={{ transition: 'all .2s' }} onClick={() => setPhase('ready')}>🔄 Tekrar Oku</button>
            </>}
          </div>

          {/* Son 7 gün */}
          {phase !== 'reading' && (
            <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 14, animation: 'cardReveal .4s .2s both' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Son 7 Gün</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[...last7].reverse().map((day, i) => (
                  <div key={day.date} style={{
                    flex: 1, textAlign: 'center', padding: '10px 4px',
                    borderRadius: 10,
                    background: day.data ? (day.data.hit ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.08)') : 'rgba(255,255,255,.02)',
                    border: '1px solid ' + (day.data ? (day.data.hit ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.15)') : 'rgba(255,255,255,.05)'),
                    minWidth: 0,
                    transition: 'all .2s',
                    animation: 'cardReveal .3s ' + (i * .03) + 's both',
                  }}>
                    <div style={{ fontSize: 9, color: 'var(--mu)' }}>{day.date.slice(5)}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, marginTop: 3, color: day.data ? (day.data.hit ? '#34d399' : '#f87171') : 'var(--mu)' }}>
                      {day.data ? day.data.wpm : '—'}
                    </div>
                    <div style={{ fontSize: 10, marginTop: 1 }}>
                      {day.data ? (day.data.hit ? '✓' : '✗') : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

// ─── PROGRESS CHART ───────────────────────────────────────────────────────────
export function ProgressChart({ user }) {
  const cr = useRef(null);
  const { c } = getLvl(user.tecrube || 0);
  const sess = user.sessions || [];
  const wpmSessions = sess.filter(s => s.wpm > 0);

  const moduleBreakdown = useMemo(() => {
    const map = {};
    sess.forEach(s => {
      if (!map[s.module]) map[s.module] = { count: 0, totalXP: 0, bestWPM: 0, totalWPM: 0, wpmCount: 0 };
      map[s.module].count++;
      map[s.module].totalXP += s.xp || 0;
      if (s.wpm > 0) { map[s.module].totalWPM += s.wpm; map[s.module].wpmCount++; if (s.wpm > map[s.module].bestWPM) map[s.module].bestWPM = s.wpm; }
    });
    return Object.entries(map).sort((a, b) => b[1].totalXP - a[1].totalXP);
  }, [sess]);

  useEffect(() => {
    const cv = cr.current; if (!cv || wpmSessions.length < 2) return;
    const ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    cv.width = 700 * dpr; cv.height = 280 * dpr;
    ctx.scale(dpr, dpr);
    const W = 700, H = 280;
    const pad = { top: 30, right: 20, bottom: 40, left: 55 };
    ctx.clearRect(0, 0, W, H);
    const data = wpmSessions.slice(-30);
    const maxW = Math.max(...data.map(s => s.wpm)) * 1.15;
    const minW = Math.min(...data.map(s => s.wpm)) * 0.85;
    const range = maxW - minW || 1;
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      const val = Math.round(maxW - (range / 4) * i);
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px monospace'; ctx.textAlign = 'right';
      ctx.fillText(val + ' WPM', pad.left - 8, y + 4);
    }
    const pts = data.map((s, i) => ({
      x: pad.left + (data.length > 1 ? (chartW / (data.length - 1)) * i : chartW / 2),
      y: pad.top + chartH - ((s.wpm - minW) / range) * chartH, wpm: s.wpm
    }));
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, pad.top + chartH);
    ctx.lineTo(pts[0].x, pad.top + chartH);
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    areaGrad.addColorStop(0, c.color + '30'); areaGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = areaGrad; ctx.fill();
    const grad = ctx.createLinearGradient(pad.left, 0, W - pad.right, 0);
    grad.addColorStop(0, c.color + 'cc'); grad.addColorStop(1, '#06b6d4cc');
    ctx.strokeStyle = grad; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();
    pts.forEach((p, i) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, i === pts.length - 1 ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = i === pts.length - 1 ? '#fff' : c.color; ctx.fill();
      if (i === pts.length - 1) { ctx.strokeStyle = c.color; ctx.lineWidth = 2; ctx.stroke(); }
    });
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Son ' + data.length + ' seans WPM trendi', pad.left, 18);
  }, [wpmSessions, c.color]);

  const totalSessions = sess.length;
  const totalXP = user.xp || 0;
  const avgWPM = wpmSessions.length ? Math.round(wpmSessions.reduce((a, s) => a + s.wpm, 0) / wpmSessions.length) : 0;
  const bestWPM = wpmSessions.length ? Math.max(...wpmSessions.map(s => s.wpm)) : 0;
  const last5 = wpmSessions.slice(-5);
  const last5Avg = last5.length ? Math.round(last5.reduce((a, s) => a + s.wpm, 0) / last5.length) : 0;
  const trend = last5Avg - avgWPM;

  return (
    <PageWrapper animationType="slide">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ animation: 'pageSlideUp .3s both' }}>
          <div className="st">📈 İlerleme Grafiği</div>
          <div className="ss">WPM trendini takip et. Gelişimini gör.</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,.02)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 20, padding: '22px',
          animation: 'cardReveal .4s .06s both',
        }}>
          {/* Özet istatistikler */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { l: 'Toplam Seans', v: totalSessions, c: c.color, icon: '📊', delay: .05 },
              { l: 'Toplam XP', v: totalXP, c: '#f59e0b', icon: '⚡', delay: .08 },
              { l: 'Ort. WPM', v: avgWPM, c: '#06b6d4', icon: '📈', delay: .11 },
              { l: 'En İyi WPM', v: bestWPM, c: '#10b981', icon: '🏆', delay: .14 },
              { l: 'Son 5 Ort.', v: last5Avg, c: '#8b5cf6', icon: '📉', delay: .17 },
              { l: 'Trend', v: (trend >= 0 ? '+' : '') + trend, c: trend >= 0 ? '#34d399' : '#f87171', icon: trend >= 0 ? '📈' : '📉', delay: .20 },
            ].map(s => (
              <div key={s.l} style={{
                textAlign: 'center', flex: '1 1 80px', padding: '12px 6px',
                borderRadius: 12, background: 'rgba(255,255,255,.03)',
                border: '1px solid rgba(255,255,255,.07)',
                animation: 'cardReveal .35s ' + s.delay + 's both',
              }}>
                <div style={{ fontSize: 16, marginBottom: 3 }}>{s.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--mo)', color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 9, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: .5, marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Grafik */}
          {wpmSessions.length >= 2 ? (
            <canvas ref={cr} style={{
              width: '100%', height: 280, borderRadius: 14,
              background: 'rgba(0,0,0,.25)', border: '1px solid rgba(255,255,255,.06)',
            }} />
          ) : (
            <div style={{
              textAlign: 'center', color: 'var(--mu)', padding: '40px 0',
              borderRadius: 14, background: 'rgba(0,0,0,.15)',
              border: '1px solid rgba(255,255,255,.05)',
            }}>
              📊 En az 2 WPM seansu tamamla → Grafik oluşsun
            </div>
          )}

          {/* Modül dağılımı */}
          {moduleBreakdown.length > 0 && (
            <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 14, animation: 'cardReveal .4s .15s both' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Modül Dağılımı</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                {moduleBreakdown.map(([mod, data], i) => (
                  <div key={mod} style={{
                    padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    animation: 'cardReveal .3s ' + (i * .03) + 's both',
                    transition: 'background .2s',
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{mod}</div>
                      <div style={{ fontSize: 10, color: 'var(--mu)', marginTop: 2 }}>
                        {data.count} seans{data.bestWPM > 0 ? ' • En iyi: ' + data.bestWPM + ' WPM' : ''}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', fontFamily: 'var(--mo)' }}>+{data.totalXP}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Son seanslar */}
          {sess.length > 0 && (
            <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 14, animation: 'cardReveal .4s .2s both' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Son Seanslar</div>
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {[...sess].reverse().slice(0, 20).map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,.04)',
                    fontSize: 12, transition: 'background .15s',
                    borderRadius: 6,
                  }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: 'var(--mu)', fontFamily: 'var(--mo)', fontSize: 10, minWidth: 70 }}>
                        {new Date(s.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                      </span>
                      <span style={{ fontWeight: 600 }}>{s.module}</span>
                      {s.text && <span style={{ color: 'var(--mu)', fontSize: 10 }}>• {s.text}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {s.wpm > 0 && <span style={{ fontFamily: 'var(--mo)', color: '#06b6d4', fontWeight: 700 }}>{s.wpm} WPM</span>}
                      <span style={{ fontFamily: 'var(--mo)', color: '#f59e0b', fontWeight: 600, fontSize: 11 }}>+{s.xp} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

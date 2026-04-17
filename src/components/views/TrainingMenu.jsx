import { useMemo, useState, useEffect, useRef } from 'react';
import { getLvl } from '@/data/levels.js';
import { storage } from '@/shared/storage';
import { AdSection } from '@/components/ads/AdSection';

// ─── DERS TANIMI ─────────────────────────────────────────────────────────────
const LESSONS = [
  {
    id: 'flash',
    icon: '⚡',
    label: 'Flash Okuma',
    desc: 'RSVP ile zihin hızına ulaş',
    xpRequired: 0,
    color: '#7c3aed',
    unit: 'Birim 1 — Hız Temelleri',
    unitColor: '#7c3aed',
    tip: 'Kelimeleri seslendirmeden sadece gör!',
    stars: 3,
  },
  {
    id: 'guided',
    icon: '📖',
    label: 'Kılavuzlu Okuma',
    desc: 'Ritim ve tempo ile akar gibi oku',
    xpRequired: 50,
    color: '#7c3aed',
    unit: 'Birim 1 — Hız Temelleri',
    unitColor: '#7c3aed',
    tip: 'Gözlerini rehbere bırak, beyin takip eder!',
    stars: 3,
  },
  {
    id: 'regress',
    icon: '🚫',
    label: 'Regresyon Engeli',
    desc: 'Bir kez oku, tam anla',
    xpRequired: 120,
    color: '#7c3aed',
    unit: 'Birim 1 — Hız Temelleri',
    unitColor: '#7c3aed',
    tip: 'Geri dönmek hız kaybıdır. İleri bak!',
    stars: 3,
  },
  {
    id: 'vert',
    icon: '↕️',
    label: 'Dikey Okuma',
    desc: 'Görüş alanını genişlet',
    xpRequired: 220,
    color: '#0891b2',
    unit: 'Birim 2 — Görüş Alanı',
    unitColor: '#0891b2',
    tip: 'Sayfayı yukarıdan aşağı tara!',
    stars: 3,
  },
  {
    id: 'eye',
    icon: '👁️',
    label: 'Göz Jimi',
    desc: 'Saccade eğitimi ile göz kasları',
    xpRequired: 320,
    color: '#0891b2',
    unit: 'Birim 2 — Görüş Alanı',
    unitColor: '#0891b2',
    tip: 'Sadece noktaya odaklan, baş hareket etmesin!',
    stars: 3,
  },
  {
    id: 'peripheral',
    icon: '🎯',
    label: 'Görüş Alanı',
    desc: 'Çevre görüşünü geliştir',
    xpRequired: 430,
    color: '#0891b2',
    unit: 'Birim 2 — Görüş Alanı',
    unitColor: '#0891b2',
    tip: 'Merkeze bak, çevreyi fark et!',
    stars: 3,
  },
  {
    id: 'schulte',
    icon: '🎲',
    label: 'Schulte Tablosu',
    desc: 'Periferik görüş ve konsantrasyon',
    xpRequired: 560,
    color: '#d97706',
    unit: 'Birim 3 — Zihin Hızı',
    unitColor: '#d97706',
    tip: 'Merkezi gör, çevreyi hisset!',
    stars: 3,
  },
  {
    id: 'memory',
    icon: '🧠',
    label: 'Görsel Hafıza',
    desc: 'Kısa süreli belleği güçlendir',
    xpRequired: 680,
    color: '#d97706',
    unit: 'Birim 3 — Zihin Hızı',
    unitColor: '#d97706',
    tip: 'Her kelime bir fotoğraf, çek!',
    stars: 3,
  },
  {
    id: 'wordrecog',
    icon: '🔍',
    label: 'Kelime Tanıma',
    desc: 'Hızlı algılama ve pattern okuma',
    xpRequired: 800,
    color: '#d97706',
    unit: 'Birim 3 — Zihin Hızı',
    unitColor: '#d97706',
    tip: 'Kelimeyi okuma, tanı!',
    stars: 3,
  },
  {
    id: 'wpmtest',
    icon: '📈',
    label: 'WPM Testi',
    desc: 'Gerçek hızını ölç',
    xpRequired: 950,
    color: '#059669',
    unit: 'Birim 4 — Ustalık',
    unitColor: '#059669',
    tip: 'Anlayarak oku, sadece hızlı değil!',
    stars: 3,
  },
  {
    id: 'daily',
    icon: '🏁',
    label: 'Günlük Mücadele',
    desc: 'Serileri koru, zirveye çık',
    xpRequired: 1100,
    color: '#059669',
    unit: 'Birim 4 — Ustalık',
    unitColor: '#059669',
    tip: 'Her gün bir adım, her adım bir zafer!',
    stars: 3,
  },
];

// ─── KİTAP ÇEVİRME EFEKTİ (Lesson Card) ─────────────────────────────────────
function LessonCard({ lesson, isUnlocked, isActive, isCompleted, earnedStars, onClick, index }) {
  const [flipped, setFlipped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const timeoutRef = useRef(null);

  const handleClick = () => {
    if (!isUnlocked) return;
    setFlipped(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setFlipped(false);
      onClick();
    }, 420);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const stars = earnedStars || 0;

  return (
    <div
      style={{
        perspective: '800px',
        cursor: isUnlocked ? 'pointer' : 'default',
        position: 'relative',
      }}
      onMouseEnter={() => isUnlocked && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pulse ring for active lesson */}
      {isActive && (
        <div style={{
          position: 'absolute',
          inset: -6,
          borderRadius: 24,
          border: `3px solid ${lesson.color}`,
          animation: 'pulseBorder 1.8s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 2,
        }} />
      )}

      <div
        onClick={handleClick}
        style={{
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: flipped
            ? 'rotateY(-180deg)'
            : hovered && isUnlocked
              ? 'rotateY(-8deg) translateY(-4px) scale(1.03)'
              : 'rotateY(0deg)',
          transition: flipped
            ? 'transform 0.42s cubic-bezier(0.4,0,0.2,1)'
            : 'transform 0.22s ease',
          borderRadius: 20,
          minHeight: 120,
        }}
      >
        {/* ÖN YÜZ */}
        <div style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          background: isUnlocked
            ? isCompleted
              ? `linear-gradient(135deg, ${lesson.color}22, ${lesson.color}11)`
              : isActive
                ? `linear-gradient(135deg, ${lesson.color}33, ${lesson.color}15)`
                : 'rgba(255,255,255,0.04)'
            : 'rgba(0,0,0,0.3)',
          border: `2px solid ${isUnlocked ? (isActive ? lesson.color : isCompleted ? lesson.color + '66' : 'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.06)'}`,
          borderRadius: 20,
          padding: '18px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          filter: isUnlocked ? 'none' : 'grayscale(1)',
          opacity: isUnlocked ? 1 : 0.45,
          boxShadow: isActive
            ? `0 8px 32px ${lesson.color}33, 0 0 0 1px ${lesson.color}44`
            : isCompleted
              ? `0 4px 16px ${lesson.color}22`
              : 'none',
        }}>
          {/* Tamamlanma şeridi */}
          {isCompleted && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${lesson.color}, ${lesson.color}88)`,
              borderRadius: '20px 20px 0 0',
            }} />
          )}

          {/* İkon */}
          <div style={{
            fontSize: 38,
            lineHeight: 1,
            filter: isUnlocked ? 'none' : 'grayscale(1)',
            position: 'relative',
          }}>
            {!isUnlocked ? '🔒' : lesson.icon}
          </div>

          {/* İsim */}
          <div style={{
            fontWeight: 800,
            fontSize: 13,
            color: isUnlocked ? 'var(--tx, #fff)' : '#666',
            textAlign: 'center',
            lineHeight: 1.2,
          }}>
            {lesson.label}
          </div>

          {/* Açıklama */}
          <div style={{
            fontSize: 10,
            color: 'var(--mu, #888)',
            textAlign: 'center',
            lineHeight: 1.3,
          }}>
            {isUnlocked ? lesson.desc : `${lesson.xpRequired} XP gerekli`}
          </div>

          {/* Yıldızlar */}
          <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                fontSize: 14,
                opacity: i < stars ? 1 : 0.2,
                filter: i < stars ? `drop-shadow(0 0 4px ${lesson.color})` : 'none',
                transition: 'all 0.3s',
              }}>⭐</span>
            ))}
          </div>

          {/* Aktif ders rozeti */}
          {isActive && (
            <div style={{
              background: lesson.color,
              color: '#fff',
              fontSize: 9,
              fontWeight: 900,
              padding: '3px 10px',
              borderRadius: 20,
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginTop: 2,
            }}>BAŞLA</div>
          )}
        </div>

        {/* ARKA YÜZ (çevirme anı) */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: `linear-gradient(135deg, ${lesson.color}, ${lesson.color}cc)`,
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 6,
        }}>
          <div style={{ fontSize: 32 }}>⚡</div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>Yükleniyor...</div>
        </div>
      </div>
    </div>
  );
}

// ─── BİRİM BAŞLIĞI ────────────────────────────────────────────────────────────
function UnitHeader({ unit, color, lessonsInUnit, completedInUnit }) {
  const pct = lessonsInUnit > 0 ? (completedInUnit / lessonsInUnit) * 100 : 0;
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}22, ${color}0a)`,
      border: `1px solid ${color}44`,
      borderRadius: 16,
      padding: '16px 20px',
      marginBottom: 4,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: `${pct}%`, height: '100%',
        background: `${color}0d`,
        transition: 'width 0.8s ease',
      }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 3 }}>
            {unit}
          </div>
          <div style={{ fontSize: 12, color: 'var(--mu, #888)' }}>
            {completedInUnit}/{lessonsInUnit} ders tamamlandı
          </div>
        </div>
        <div style={{
          background: color,
          color: '#fff',
          borderRadius: 20,
          padding: '4px 14px',
          fontSize: 11,
          fontWeight: 900,
        }}>
          {Math.round(pct)}%
        </div>
      </div>
      <div style={{ position: 'relative', marginTop: 10, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          borderRadius: 99,
          transition: 'width 0.8s ease',
          boxShadow: `0 0 8px ${color}88`,
        }} />
      </div>
    </div>
  );
}

// ─── BOLT TIP (Condensed) ────────────────────────────────────────────────────
function BoltTip({ message }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '8px 16px',
      background: 'rgba(124,58,237,0.06)',
      border: '1px solid rgba(124,58,237,0.15)',
      borderRadius: 12,
      marginBottom: 2,
    }}>
      <style>{`
        @keyframes boltBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes pulseBorder { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.02)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <img
        src="assets/bolt.png"
        alt="Bolt"
        style={{
          width: 32, height: 32,
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 6px rgba(124,58,237,0.4))',
          animation: 'boltBounce 2s ease-in-out infinite',
          flexShrink: 0,
        }}
      />
      <div style={{ fontSize: 12, fontWeight: 600, fontStyle: 'italic', color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>
        "{message}"
      </div>
    </div>
  );
}

// ─── ANA COMPONENT ───────────────────────────────────────────────────────────
export default function TrainingMenu({ user, onTabChange, onAddHeart, isMobile }) {
  const { c } = getLvl(user.tecrube || 0);
  const sess = user.sessions || [];

  // Modül başına en son skoru bul
  const latestScores = useMemo(() => {
    const scores = {};
    const moduleNameMap = {
      flash: 'Flash Okuma', guided: 'Kılavuzlu Okuma', vert: 'Dikey Okuma',
      regress: 'Regresyon Engeli', eye: 'Göz Jimi', schulte: 'Schulte',
      memory: 'Görsel Hafıza', wpmtest: 'WPM Testi', peripheral: 'Çevre Görüşü',
      wordrecog: 'Kelime Tanıma', daily: 'Günlük Mücadele',
    };
    const reversed = [...sess].reverse();
    LESSONS.forEach(m => {
      const last = reversed.find(s => s.module === moduleNameMap[m.id]);
      if (last) {
        if (last.wpm) scores[m.id] = last.wpm;
        else if (last.score) scores[m.id] = last.score;
        else if (last.xpGained) scores[m.id] = 1;
      }
    });
    return scores;
  }, [sess]);

  // Günlük seri hesapla
  const streak = useMemo(() => {
    let s = 0; const d = new Date();
    const dailyData = storage.get('sr_daily', {});
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().slice(0, 10);
      if (dailyData[key]) { s++; } else { if (i !== 0) break; }
      d.setDate(d.getDate() - 1);
    }
    return s;
  }, []);

  // Hangi dersler tamamlandı / aktif
  const lessonState = useMemo(() => {
    return LESSONS.map((lesson, i) => {
      const isCompleted = !!latestScores[lesson.id];
      const isUnlocked = (user.tecrube || 0) >= lesson.xpRequired;
      const prevCompleted = i === 0 || !!latestScores[LESSONS[i - 1].id];
      const isActive = isUnlocked && !isCompleted && prevCompleted;
      // Yıldız sayısı: basit bir formül
      let earnedStars = 0;
      if (isCompleted) {
        const score = latestScores[lesson.id];
        if (score >= 3) earnedStars = 3;
        else if (score >= 2) earnedStars = 2;
        else earnedStars = 1;
        // WPM tabanlı modüller için
        if (score > 100) earnedStars = score > 600 ? 3 : score > 300 ? 2 : 1;
      }
      return { isCompleted, isUnlocked, isActive, earnedStars };
    });
  }, [latestScores, user.xp]);

  // Birimlere göre gruplama
  const units = useMemo(() => {
    const map = {};
    LESSONS.forEach((lesson, i) => {
      if (!map[lesson.unit]) map[lesson.unit] = { unit: lesson.unit, color: lesson.unitColor, lessons: [] };
      map[lesson.unit].lessons.push({ lesson, state: lessonState[i], index: i });
    });
    return Object.values(map);
  }, [lessonState]);

  // Bolt'un ipucu mesajı — aktif derse göre
  const boltMsg = useMemo(() => {
    const activeLesson = LESSONS.find((l, i) => lessonState[i].isActive);
    if (activeLesson) return `Sıradaki ders: ${activeLesson.label}! ${activeLesson.tip} ⚡`;
    const completed = lessonState.filter(s => s.isCompleted).length;
    if (completed === LESSONS.length) return 'Tüm dersleri tamamladın! Şimdi günlük mücadeleye atıl! 🏆';
    return 'Hangi becerini geliştirmek istersin? Sıraya uymak zorunda değilsin, ama ilerleme kaydeder! ⚡';
  }, [lessonState]);

  const completedCount = lessonState.filter(s => s.isCompleted).length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      animation: 'slideUp 0.4s ease-out',
      paddingBottom: 32,
    }}>
      {/* Başlık */}
      <div>
        <div className="st" style={{ fontSize: 22, fontWeight: 900 }}>📚 Okuma Yolculuğu</div>
        <div className="ss">Hızını artır, anlama kabiliyetini geliştir — her ders yeni bir seviye!</div>
      </div>

      {/* Bolt ipucu */}
      <BoltTip message={boltMsg} />

      {/* Genel ilerleme */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--mu, #888)' }}>GENEL İLERLEME</span>
          <span style={{ fontSize: 12, fontWeight: 900, color: c.color }}>{completedCount}/{LESSONS.length} ders</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(completedCount / LESSONS.length) * 100}%`,
            background: `linear-gradient(90deg, ${c.color}, ${c.color}cc)`,
            borderRadius: 99,
            transition: 'width 1s ease',
            boxShadow: `0 0 10px ${c.color}66`,
          }} />
        </div>
      </div>
{/* ─── SOSYAL AKSİYONLAR (TAŞINDI) ────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? 10 : 12,
        marginBottom: 8
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px 20px',
          background: 'rgba(139,92,246,0.06)',
          border: '1.5px dashed rgba(139,92,246,0.3)',
          borderRadius: 16,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
          onClick={() => onTabChange('online-duel')}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.06)'; }}
        >
          <div style={{ fontSize: 32 }}>⚔️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#8b5cf6' }}>Online Düello</div>
            <div style={{ fontSize: 11, color: 'var(--mu, #888)', marginTop: 2 }}>Kendi seviyendeki rakiple eş ve WPM testini kazanan olsun!</div>
          </div>
          <div style={{
            background: '#8b5cf6',
            color: '#fff',
            padding: '6px 16px',
            borderRadius: 99,
            fontSize: 12,
            fontWeight: 800,
          }}>Maç Bul →</div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px 20px',
          background: 'rgba(16,185,129,0.06)',
          border: '1.5px dashed rgba(16,185,129,0.3)',
          borderRadius: 16,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
          onClick={() => onTabChange('social')}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.06)'; }}
        >
          <div style={{ fontSize: 32 }}>🤝</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#10b981' }}>Co-op Antrenman</div>
            <div style={{ fontSize: 11, color: 'var(--mu, #888)', marginTop: 2 }}>Arkadaşınla beraber antrenman yap ve birlikte XP kazan!</div>
          </div>
          <div style={{
            background: '#10b981',
            color: '#fff',
            padding: '6px 16px',
            borderRadius: 99,
            fontSize: 12,
            fontWeight: 800,
          }}>Davet Et →</div>
        </div>
      </div>

      {/* BİRİMLER + DERSLER */}
      {units.map((unitData, ui) => {
        const completedInUnit = unitData.lessons.filter(l => l.state.isCompleted).length;
        return (
          <div key={unitData.unit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <UnitHeader
              unit={unitData.unit}
              color={unitData.color}
              lessonsInUnit={unitData.lessons.length}
              completedInUnit={completedInUnit}
            />
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
              gap: 16,
            }}>
              {unitData.lessons.map(({ lesson, state, index }) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  isUnlocked={state.isUnlocked}
                  isActive={state.isActive}
                  isCompleted={state.isCompleted}
                  earnedStars={state.earnedStars}
                  index={index}
                  onClick={() => onTabChange(lesson.id)}
                />
              ))}
            </div>
          </div>
        );
      })}


      <AdSection user={user} type="heart" onReward={onAddHeart} style={{ maxWidth: 400, margin: '4px auto 0' }} />
    </div>
  );
}
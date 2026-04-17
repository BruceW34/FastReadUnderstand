import React, { useMemo, useState, useEffect, useRef } from 'react';
import { BoltGuide } from '@/components/shared/BoltGuide';
import { db } from '@/services/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getLvl } from '@/data/levels.js';
import { LevelDetailsModal } from '@/components/modals/StoreModals.jsx';
import { DEFAULT_TEXTS } from '@/data/texts.js';
import {
    Schulte, VisualMemory, EyeGym, WPMTest,
    WordRecognition, PeripheralVision
} from '@/components/modules/index.js';

/* ─────────────────────────────────────────────
   PATH DATA - Generate from Firebase Weekly Goals
───────────────────────────────────────────── */
const generatePathFromWeeklyGoals = (weeklyGoals) => {
    const STAGE_NAMES = {
        1: { title: 'Hızlı Okumanın Temeli', desc: 'Zihin-göz koordinasyonunu kur', icon: '⚡' },
        2: { title: 'Görsel Bloklama', desc: 'Kelimeleri gruplar halinde gör', icon: '📦' },
        3: { title: 'Bilişsel Odaklanma', desc: 'Schulte ve çevresel görüş', icon: '👁️' },
        4: { title: 'Satır Yakalama', desc: 'Hızlı tarama teknikleri', icon: '🚀' },
    };
    const COLORS = ['#1a3a5c', '#1a2a50', '#201640'];
    const BG_COLORS = ['#0d2137', '#0d1a3a', '#100828'];

    const path = [];
    for (let u = 1; u <= 4; u++) {
        const stages = [];
        const stageData = weeklyGoals?.[u] || {};
        
        for (let s = 1; s <= 5; s++) {
            const goalData = stageData?.[s] || {};
            const type = s === 5 ? 'final' : 'exercise';
            stages.push({
                id: `u${u}s${s}`,
                type,
                label: goalData.title || (s === 1 ? 'Başlangıç' : s === 5 ? 'Bölüm Finali' : `${s}. Aşama`),
                description: goalData.description || '',
                targetWPM: goalData.targetWPM || 300,
                difficulty: goalData.difficulty || 3,
                totalSteps: 10,
                completed: false,
            });
        }
        
        const colorIdx = (u - 1) % 3;
        path.push({
            id: u,
            title: STAGE_NAMES[u].title,
            desc: STAGE_NAMES[u].desc,
            icon: STAGE_NAMES[u].icon,
            color1: COLORS[colorIdx],
            color2: BG_COLORS[colorIdx],
            stages,
        });
    }
    return path;
};

/* ─────────────────────────────────────────────
   BOOK FLIP TRANSITION
───────────────────────────────────────────── */
function BookFlip({ show, onDone, children, prevChildren }) {
    const [phase, setPhase] = useState('idle'); // idle | flipping | done

    useEffect(() => {
        if (show) {
            setPhase('flipping');
            const t = setTimeout(() => {
                setPhase('done');
                onDone && onDone();
            }, 700);
            return () => clearTimeout(t);
        } else {
            setPhase('idle');
        }
    }, [show]);

    if (phase === 'idle') return <>{children}</>;

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', perspective: 1200 }}>
            {/* Previous page (going away) */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backfaceVisibility: 'hidden',
                    transformOrigin: 'left center',
                    transform: phase === 'flipping' ? 'rotateY(-180deg)' : 'rotateY(0deg)',
                    transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 2,
                    background: 'var(--bg)',
                    boxShadow: phase === 'flipping' ? '-20px 0 60px rgba(0,0,0,0.5)' : 'none',
                }}
            >
                {prevChildren}
            </div>
            {/* New page (coming in) */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backfaceVisibility: 'hidden',
                    transformOrigin: 'left center',
                    transform: phase === 'flipping' ? 'rotateY(0deg)' : 'rotateY(180deg)',
                    transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 1,
                    background: 'var(--bg)',
                }}
            >
                {children}
            </div>
            <style>{`
        @keyframes pageShine {
          0% { opacity: 0; }
          40% { opacity: 0.15; }
          100% { opacity: 0; }
        }
      `}</style>
        </div>
    );
}

/* ─────────────────────────────────────────────
   PROGRESS RING
───────────────────────────────────────────── */
function ProgressRing({ progress, total = 10, isActive }) {
    if (progress === 0 && !isActive) return null;
    const ringRadius = 41;
    const circumference = 2 * Math.PI * ringRadius;
    const segments = total;
    const segmentWidth = (circumference / segments) * 0.8; 
    const gapWidth = (circumference / segments) * 0.2;

    return (
        <svg
            style={{
                position: 'absolute', top: -14, left: -14,
                width: 100, height: 100,
                pointerEvents: 'none',
                transform: 'rotate(-90deg)',
            }}
        >
            {Array.from({ length: segments }).map((_, i) => {
                const isFilled = i < progress;
                const isCurrent = i === progress && isActive;
                const color = isFilled
                    ? '#fbbf24'
                    : isCurrent
                        ? 'rgba(255,255,255,0.2)'
                        : 'transparent';
                
                return (
                    <circle
                        key={i}
                        cx="50" cy="50" r={ringRadius}
                        fill="none"
                        stroke={color}
                        strokeWidth="6"
                        strokeDasharray={`${segmentWidth} ${circumference - segmentWidth}`}
                        strokeDashoffset={-(i * (segmentWidth + gapWidth))}
                        strokeLinecap="round"
                        style={{ transition: 'stroke 0.4s' }}
                    />
                );
            })}
        </svg>
    );
}

/* ─────────────────────────────────────────────
   STAGE PREVIEW MODAL  (kitap flip ile açılıyor)
───────────────────────────────────────────── */
function StageModal({ stage, pathProgress, nodeProgress, onClose, onStart }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

    const isCompleted = pathProgress.has(stage.id);
    const totalSteps = stage.totalSteps || 6;
    const prog = isCompleted ? totalSteps : (nodeProgress[stage.id] || 0);

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.85)',
                zIndex: 3000,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 20,
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.25s',
            }}
            onClick={onClose}
        >
            {/* Book cover card */}
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: 380,
                    position: 'relative',
                    transform: visible ? 'scale(1) rotateY(0deg)' : 'scale(0.85) rotateY(20deg)',
                    transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                    perspective: 800,
                }}
            >
                {/* Book spine */}
                <div style={{
                    position: 'absolute',
                    left: -18,
                    top: 10,
                    bottom: 10,
                    width: 18,
                    background: 'linear-gradient(180deg, #1a3a5c, #0d1a3a)',
                    borderRadius: '4px 0 0 4px',
                    boxShadow: '-4px 0 12px rgba(0,0,0,0.5)',
                }} />

                {/* Book cover */}
                <div style={{
                    background: 'linear-gradient(135deg, #1a2a50 0%, #0d1a3a 100%)',
                    borderRadius: '0 16px 16px 0',
                    padding: 32,
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '8px 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Decorative lines mimicking book pages */}
                    <div style={{
                        position: 'absolute', right: 0, top: 0, bottom: 0, width: 6,
                        background: 'repeating-linear-gradient(180deg, #f5f0e8 0px, #f5f0e8 2px, #ddd5c8 2px, #ddd5c8 4px)',
                        opacity: 0.3,
                    }} />

                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: 14, right: 14,
                            background: 'rgba(255,255,255,0.1)', border: 'none',
                            color: 'var(--mu)', width: 30, height: 30,
                            borderRadius: '50%', cursor: 'pointer', fontSize: 16,
                        }}
                    >✕</button>

                    <div style={{ fontSize: 48, marginBottom: 16 }}>
                        {isCompleted ? '✅' : prog > 0 ? '📖' : '🎯'}
                    </div>

                    <div style={{
                        fontSize: 11, fontWeight: 800, letterSpacing: 3,
                        color: 'rgba(255,255,255,0.4)',
                        textTransform: 'uppercase', marginBottom: 8,
                    }}>
                        {isCompleted ? 'TAMAMLANDI' : prog > 0 ? `${prog}/${totalSteps} SAYFA` : 'YENİ BÖLÜM'}
                    </div>

                    <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10, color: '#fff' }}>
                        {stage.label}
                    </h2>

                    {/* Progress bar as book pages */}
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div key={i} style={{
                                width: totalSteps > 8 ? 20 : 30, height: 8,
                                borderRadius: 4,
                                background: i < prog ? '#fbbf24' : 'rgba(255,255,255,0.15)',
                                transition: `background 0.3s ${i * 0.05}s`,
                                boxShadow: i < prog ? '0 0 8px rgba(251,191,36,0.5)' : 'none',
                            }} />
                        ))}
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, marginBottom: 24, textAlign: 'left' }}>
                        <div style={{ fontSize: 11, color: 'var(--mu)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Bu Aşamada Neler Var?</div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                            <li>📖 Hızlı Okuma Egzersizi</li>
                            <li>🧠 Görsel Hafıza (45sn)</li>
                            <li>🔤 Kelime / Sayı Tanıma (30sn)</li>
                            <li>⚡ Schulte Tablosu</li>
                        </ul>
                    </div>

                    <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 28, fontSize: 13, lineHeight: 1.6 }}>
                        {isCompleted
                            ? 'Bu bölümü zaten tamamladın. Tekrar pratik yapmak için başla!'
                            : prog > 0
                                ? `${totalSteps - prog} sayfa daha çevirince bu bölümü tamamlarsın.`
                                : 'Tam odaklanma ile sayfalara başla!'}
                    </p>

                    <button
                        className="btn-big"
                        style={{ width: '100%', fontSize: 16, letterSpacing: 1 }}
                        onClick={() => onStart(stage)}
                    >
                        {isCompleted ? '🔄 TEKRAR ET' : prog > 0 ? '📖 DEVAM ET' : '🚀 BAŞLA'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   MAIN PATHWAY
───────────────────────────────────────────── */
export default function Pathway({
    user, onXP, addToast, onTabChange,
    onAddHeart, onRemoveHeart, onRemoveHalfHeart, isMobile,
}) {
    const tp = user?.tecrube || 0;
    const pathProgress = useMemo(
        () => new Set(user?.pathProgress || []),
        [user?.pathProgress],
    );
    const nodeProgress = user?.nodeProgress || {};
    const { c: current, n: next, p: progress } = getLvl(user?.tecrube || 0);
    const [weeklyGoals, setWeeklyGoals] = useState(null);
    const [pathData, setPathData] = useState([]);
    const [headerConfig, setHeaderConfig] = useState({
        headerTag: '⚡ Haftalık Görevler',
        headerTitle: 'Haftanın Okuma Görevleri',
        headerSubtitle: '10 görev • 50 aşama • Başlangıçtan Ustalık Seviyesine',
    });

    // Load weekly goals from Firebase
    useEffect(() => {
        let mounted = true;
        const loadWeeklyGoals = async () => {
            try {
                const snap = await getDoc(doc(db, 'admin', 'weeklyPathwayGoals'));
                if (!mounted) return;
                
                if (snap.exists() && snap.data().stageWeeklyGoals) {
                    const data = snap.data();
                    setWeeklyGoals(data.stageWeeklyGoals);
                    const generatedPath = generatePathFromWeeklyGoals(data.stageWeeklyGoals);
                    setPathData(generatedPath);
                    console.log('✅ Haftalık görevler Firebase\'ten yüklendi');
                } else {
                    // Fallback: empty structure, admin düzenleme bekleyecek
                    console.log('⚠️ Haftalık görevler henüz ayarlanmamış');
                    const defaultGoals = {};
                    [1, 2, 3, 4].forEach((stage) => {
                        defaultGoals[stage] = {};
                        [1, 2, 3, 4].forEach((week) => {
                            defaultGoals[stage][week] = Array.from({ length: 5 }, (_, idx) => ({
                                order: idx + 1,
                                title: `${idx + 1}. Görev`,
                                description: '',
                                moduleId: '',
                                moduleName: '',
                                targetWPM: 300 + (idx * 50),
                                difficulty: 3,
                            }));
                        });
                    });
                    setWeeklyGoals(defaultGoals);
                    setPathData(generatePathFromWeeklyGoals(defaultGoals));
                }
            } catch (e) {
                if (e.code === 'unavailable' || e.message?.includes('offline')) {
                    console.log('⚠️ Firebase offline - varsayılan pathway config kullanılıyor');
                } else {
                    console.error('⚠️ Haftalık görevler yükleneme hatası:', e);
                }
            }
        };
        loadWeeklyGoals();
        return () => { mounted = false; };
    }, []);

    // Load admin pathway config
    useEffect(() => {
        let mounted = true;
        const loadAdmin = async () => {
            try {
                const snap = await getDoc(doc(db, 'admin', 'pathway'));
                if (!snap.exists() || !mounted) return;
                const data = snap.data();
                if (data.headerTag || data.headerTitle || data.headerSubtitle) {
                    setHeaderConfig(prev => ({
                        ...prev,
                        headerTag: data.headerTag || prev.headerTag,
                        headerTitle: data.headerTitle || prev.headerTitle,
                        headerSubtitle: data.headerSubtitle || prev.headerSubtitle,
                    }));
                }
                console.log('✅ Admin pathway config yüklendi');
            } catch (e) {
                if (e.code === 'unavailable' || e.message?.includes('offline')) {
                    console.log('⚠️ Firebase offline - yerel pathway config kullanılıyor');
                } else {
                    console.error('Admin pathway config error:', e);
                }
            }
        };
        loadAdmin();
        return () => { mounted = false; };
    }, []);

    // Daily reward
    const today = new Date().toDateString();
    const hasClaimedDaily = user?.lastDailyClaim === today;
    const onClaimDaily = async () => {
        if (hasClaimedDaily) return;
        try {
            await onXP(5, 0, 'Günlük Ödül', 'Pathway', 5); // Reduced to 5 TP
            addToast({ msg: '🎁 Günlük ödülün hesabına eklendi!', color: '#10b981', icon: '✨' });
            await updateDoc(doc(db, 'users', user.id), { lastDailyClaim: today });
        } catch (e) { console.error(e); }
    };

    // State
    const [selectedStage, setSelectedStage] = useState(null);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [lessonResult, setLessonResult] = useState(null);
    const [showCompleteScreen, setShowCompleteScreen] = useState(false);

    // Book flip state
    const [bookFlip, setBookFlip] = useState(false);
    const [prevLessonContent, setPrevLessonContent] = useState(null);
    const flipTimeout = useRef(null);

    const boltMessage = useMemo(() => {
        const xp = user?.xp || 0;
        if (xp < 4500) return `Selam! Yolun başındasın. ${current.name} (${current.code}) aşamasındasın. Dersleri aksatma! ⚡`;
        if (xp < 21000) return `Harika gidiyorsun! ${current.code} seviyesi okuma hızını ciddileştiriyor. Bugün yeni bir aşama açalım mı?`;
        return `Efsanevi okuma yolunda emin adımlarla ilerliyorsun. ${current.name} (${current.code}) seviyesinin hakkını veriyorsun! 🔥`;
    }, [user?.xp, current]);

    // Locking: MUST complete 100% of previous unit before unlocking next
    const isUnitLocked = uIdx => {
        if (uIdx === 0) return false;
        const prevUnit = pathData[uIdx - 1];
        return !prevUnit.stages.every(s => pathProgress.has(s.id));
    };
    const isStageLocked = (uIdx, sIdx) => {
        if (isUnitLocked(uIdx)) return true;
        if (sIdx === 0) return false;
        // Strict linear progression within unit
        return !pathProgress.has(pathData[uIdx].stages[sIdx - 1].id);
    };

    const closeLesson = () => {
        setCurrentLesson(null);
        setLessonResult(null);
        setBookFlip(false);
        setPrevLessonContent(null);
    };

    // Start lesson from modal
    const startLesson = (stage) => {
        const totalSteps = stage.totalSteps || 6;
        const prog = pathProgress.has(stage.id) ? totalSteps : (nodeProgress[stage.id] || 0);
        
        // If completed, start from beginning for practice, else continue from where left off
        const targetStep = prog >= totalSteps ? 1 : prog + 1;
        
        // Smarter content selection: cycle through texts or difficulty
        const textIdx = (parseInt(stage.id.replace(/\D/g, '')) + targetStep) % DEFAULT_TEXTS.length;
        
        setCurrentLesson({
            stage,
            taskIdx: targetStep,
            subIdx: 0,
            subTotal: 3, // Each "Page" has 3 mini-tasks for depth
            type: stage.type === 'reading' ? 'reading' : (targetStep % 2 === 0 ? 'exercise' : 'reading'),
            text: DEFAULT_TEXTS[textIdx],
            status: 'idle',
            duration: 0,
        });
        setSelectedStage(null);
    };

    /* ── BOOK FLIP: go to next task ── */
    const flipToNext = (nextLesson) => {
        setPrevLessonContent({ ...currentLesson });
        setBookFlip(true);
        clearTimeout(flipTimeout.current);
        flipTimeout.current = setTimeout(() => {
            setCurrentLesson(nextLesson);
            setBookFlip(false);
            setPrevLessonContent(null);
        }, 750);
    };

    /* ── Continue after correct result ── */
    const handleContinue = () => {
        setLessonResult(null);
        const stageId = currentLesson.stage.id;
        const totalSteps = 10; // Forced 10 steps

        if (currentLesson.taskIdx >= totalSteps || pathProgress.has(stageId)) {
            if (!pathProgress.has(stageId)) {
                // Final completion of the PART
                onXP(40, 0, stageId, 'Pathway', 40); // Reduced from 100
            }
            setShowCompleteScreen(true);
        } else {
            const nextStep = currentLesson.taskIdx + 1;
            if (user && !pathProgress.has(stageId)) {
                updateDoc(doc(db, 'users', user.id), {
                    [`nodeProgress.${stageId}`]: nextStep - 1,
                }).catch(console.error);
            }
            
            const stageNumeric = parseInt(stageId.replace(/\D/g, '')) || 0;
            const textIdx = (stageNumeric + nextStep) % DEFAULT_TEXTS.length;
            
            const nextLesson = {
                ...currentLesson,
                taskIdx: nextStep,
                subIdx: 0,
                subTotal: 3,
                // Variety: 1, 3, 5, 7, 9 are reading/exercise mix, etc.
                type: (nextStep % 3 === 0) ? 'exercise' : 'reading', 
                text: DEFAULT_TEXTS[textIdx],
                status: 'idle',
            };
            flipToNext(nextLesson);
        }
    };

    const advanceSub = (xp, label) => {
        if (currentLesson.subIdx + 1 >= currentLesson.subTotal) {
            onXP(xp, 0, 'none', 'none', 0); // Reduced multiplier from 2*xp to 1*xp
            setLessonResult({ status: 'correct', msg: `${label} Tamam!`, points: `+${xp} TP` });
        } else {
            setCurrentLesson({ ...currentLesson, subIdx: currentLesson.subIdx + 1 });
        }
    };

    /* ── Mini games ── */
    const renderMiniGame = (lessonState) => {
        const lesson = lessonState || currentLesson;
        if (!lesson) return null;

        const commonProps = {
            user, addToast, isMobile,
            isLessonMode: true,
            onFail: onRemoveHalfHeart, // 1 Boltage loss
        };

        // Rotation of games based on step to ensure variety
        const gameType = (lesson.taskIdx + lesson.subIdx) % 3;

        if (gameType === 0) {
            return (
                <VisualMemory
                    key={lesson.subIdx}
                    {...commonProps}
                    targetTime={45} // Increased to 45s
                    initialLevel={4 + (lesson.taskIdx)}
                    onSkip={() => advanceSub(10, 'Hafıza Görevi')}
                    onXP={(xp) => advanceSub(xp, 'Hafıza Görevi')}
                />
            );
        }
        if (gameType === 1) {
            return (
                <WordRecognition
                    key={lesson.subIdx}
                    {...commonProps}
                    initialMode={lesson.taskIdx % 2 === 0 ? "number" : "word"}
                    targetTime={30} // Increased to 30s
                    onSkip={() => advanceSub(10, 'Görsel Algılama Görevi')}
                    onXP={(xp) => advanceSub(xp, 'Görsel Algılama Görevi')}
                />
            );
        }
        if (gameType === 2) {
            let sSize = lesson.taskIdx >= 8 ? 7 : (lesson.taskIdx >= 5 ? 6 : 5);
            let sTime = sSize >= 7 ? 90 : (sSize >= 6 ? 75 : 60);
            return (
                <Schulte
                    key={lesson.subIdx}
                    {...commonProps}
                    size={sSize}
                    targetTime={sTime} // Scaled to size
                    onXP={(xp) => advanceSub(xp, 'Hız Görevi')}
                />
            );
        }
        return null;
    };

    const hearts = user?.hearts !== undefined ? user.hearts : 5;


    return (
        <div style={{ paddingBottom: 100 }}>
            <style>{`
        /* ── Book Flip page turn ── */
        @keyframes bookPageShine {
          0%   { opacity: 0; left: 0; }
          40%  { opacity: 0.2; }
          100% { opacity: 0; left: 100%; }
        }

        /* ── Stage node pulse ── */
        @keyframes nodePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(88,204,2,0.5), 0 4px 20px rgba(0,0,0,0.4); }
          50%       { box-shadow: 0 0 0 12px rgba(88,204,2,0), 0 4px 20px rgba(0,0,0,0.4); }
        }
        .active-lesson { animation: nodePulse 2s ease-in-out infinite; }

        /* ── Complete screen ── */
        @keyframes completePop {
          0%   { transform: scale(0.7); opacity: 0; }
          70%  { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .complete-pop { animation: completePop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }

        /* ── Result bar slide ── */
        @keyframes resultSlide {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .ls-result-anim { animation: resultSlide 0.3s ease-out; }
      `}</style>

            {/* ── 1. COURSE MAP ── */}
            <div className="course-wrap">
                <div className="course-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div className="course-tag">{headerConfig.headerTag}</div>
                        <div className="course-title">{headerConfig.headerTitle}</div>
                        <div className="course-sub">{headerConfig.headerSubtitle}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', alignItems: 'flex-end' }}>
                        {!hasClaimedDaily && (
                            <button className="btn-big" style={{ padding: '10px 20px', fontSize: 14 }} onClick={onClaimDaily}>
                                🎁 Ödülü Al
                            </button>
                        )}
                    </div>
                </div>

                {pathData.map((unit, uIdx) => {
                    const unitLocked = isUnitLocked(uIdx);
                    return (
                        <div className="unit" key={unit.id} style={{ opacity: unitLocked ? 0.65 : 1 }}>
                            <div className="unit-header" style={{ background: `linear-gradient(135deg, ${unit.color1}, ${unit.color2})` }}>
                                <div className="unit-icon">{unit.icon}</div>
                                <div className="unit-info">
                                    <div className="unit-num">Haftanın {unit.id}. Görevi</div>
                                    <div className="unit-name">{unit.title}</div>
                                    <div className="unit-desc">{unit.desc}</div>
                                </div>
                                {unitLocked ? (
                                    <div className="unit-locked-badge" style={{ color: 'var(--mu)', border: '2px solid var(--border)' }}>🔒 Kilitli</div>
                                ) : (
                                    <div className="unit-locked-badge" style={{ color: 'var(--green)', border: '2px solid rgba(88,204,2,.3)' }}>📖 Devam Et</div>
                                )}
                            </div>

                            <div className="lesson-path" style={{ 
                                pointerEvents: unitLocked ? 'none' : 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '40px 0',
                                position: 'relative'
                            }}>
                                {/* Dynamic SVG Path connections */}
                                <svg style={{ 
                                    position: 'absolute', 
                                    inset: 0, 
                                    width: '100%', 
                                    height: '100%', 
                                    zIndex: 0,
                                    pointerEvents: 'none' 
                                }}>
                                    <defs>
                                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                            <feGaussianBlur stdDeviation="4" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                    </defs>
                                    {unit.stages.map((stage, sIdx) => {
                                        if (sIdx === 0) return null;
                                        const isPrevCompleted = pathProgress.has(unit.stages[sIdx-1].id);
                                        const isCurrCompleted = pathProgress.has(stage.id);
                                        
                                        // Zig-zag offsets to match CSS nodes
                                        const getX = (idx) => {
                                            if (idx % 3 === 0) return '50%';
                                            return idx % 3 === 1 ? 'calc(50% - 120px)' : 'calc(50% + 120px)';
                                        };
                                        const getY = (idx) => idx * 104 + 52; // 88 margin + 8 gap + 72 size/2

                                        return (
                                            <g key={`path-${stage.id}`}>
                                                <line 
                                                    x1={getX(sIdx-1)} y1={getY(sIdx-1)} 
                                                    x2={getX(sIdx)} y2={getY(sIdx)} 
                                                    stroke="rgba(255,255,255,0.08)" 
                                                    strokeWidth="12" 
                                                    strokeLinecap="round" 
                                                />
                                                <line 
                                                    x1={getX(sIdx-1)} y1={getY(sIdx-1)} 
                                                    x2={getX(sIdx)} y2={getY(sIdx)} 
                                                    stroke={isPrevCompleted ? "#fbbf24" : "transparent"} 
                                                    strokeWidth="12" 
                                                    strokeLinecap="round"
                                                    style={{ 
                                                        transition: 'stroke 0.8s',
                                                        filter: isPrevCompleted ? 'url(#glow)' : 'none',
                                                        opacity: isPrevCompleted ? 0.8 : 0
                                                    }}
                                                />
                                            </g>
                                        );
                                    })}
                                </svg>

                                {unit.stages.map((stage, sIdx) => {
                                    const isCompleted = pathProgress.has(stage.id);
                                    const isLocked = isStageLocked(uIdx, sIdx);
                                    const isActive = !isCompleted && !isLocked;

                                    return (
                                        <div className="lesson-node" key={stage.id} style={{
                                            marginLeft: sIdx % 3 === 0 ? 0 : sIdx % 3 === 1 ? -120 : 120,
                                            margin: '16px 0',
                                            zIndex: 5
                                        }}>
                                            <div style={{ position: 'relative' }}>
                                                <ProgressRing 
                                                    progress={pathProgress.has(stage.id) ? 10 : (nodeProgress[stage.id] || 0)} 
                                                    total={10}
                                                    isActive={isActive} 
                                                />
                                                <button
                                                    className={`lesson-btn ${isCompleted ? 'done perfect' : isActive ? 'active-lesson' : 'locked'}`}
                                                    style={{ pointerEvents: 'auto' }}
                                                    onClick={() => {
                                                        if (isActive || isCompleted) setSelectedStage(stage);
                                                    }}
                                                >
                                                    {isActive && <div className="active-arrow">BAŞLA!</div>}
                                                    {stage.type === 'final' ? '🏆' : (isCompleted ? '✓' : sIdx + 1)}
                                                </button>
                                            </div>
                                            <div className="lesson-tooltip">
                                                {isCompleted ? `✓ ${stage.label}` : isLocked ? `🔒 ${stage.label}` : stage.label}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="section-chest">
                                <button className={`chest-btn ${unitLocked ? 'locked-chest' : ''}`} style={{ pointerEvents: 'auto' }}>
                                    {unitLocked ? '🔒' : '🏆'}
                                </button>
                                <div className={`chest-label ${unitLocked ? 'locked' : ''}`}>{unitLocked ? 'Kilitli' : 'Bölüm Ödülü'}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── 2. BOLT MASCOT ── */}
            <BoltGuide message={boltMessage} style={{ position: 'fixed', bottom: 40, right: 40, zIndex: 900 }} />

            {/* ── 3. STAGE MODAL (book cover style) ── */}
            {selectedStage && (
                <StageModal
                    stage={selectedStage}
                    pathProgress={pathProgress}
                    nodeProgress={nodeProgress}
                    onClose={() => setSelectedStage(null)}
                    onStart={startLesson}
                />
            )}

            {/* ── 4. LESSON SCREEN ── */}
            {currentLesson && !showExitConfirm && (
                <div
                    className="lesson-screen visible"
                    style={{
                        display: 'flex',
                        position: 'fixed',
                        inset: 0,
                        zIndex: 5000,
                        flexDirection: 'column',
                        background: 'var(--bg)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Progress bar header */}
                    <div className="lesson-progress">
                        <button className="lp-back" onClick={() => setShowExitConfirm(true)}>✕</button>
                        <div className="lp-bar">
                            <div
                                className="lp-fill"
                                style={{
                                    width: `${((currentLesson.taskIdx - 1 + (currentLesson.subIdx / currentLesson.subTotal)) / (currentLesson.stage.totalSteps || 6)) * 100}%`,
                                    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                                }}
                            />
                        </div>
                        <div className="lp-label">⚡ <span>{Math.round(hearts * 2)}</span></div>
                    </div>

                    {/* No hearts overlay */}
                    {hearts <= 0 && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(0,0,0,0.95)',
                            zIndex: 100,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <div className="card" style={{ maxWidth: 400, textAlign: 'center', padding: 40 }}>
                                <div style={{ fontSize: 64, marginBottom: 20 }}>💔</div>
                                <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 15 }}>Boltage Bitti!</h3>
                                <p style={{ color: 'var(--mu)', fontSize: 16, marginBottom: 30 }}>Devam edebilmek için reklam izle ve Boltage kazan.</p>
                                <button className="btn-big" style={{ width: '100%', marginBottom: 15, background: 'var(--red)' }} onClick={() => onAddHeart()}>
                                    📺 REKLAM İZLE (+2 ⚡)
                                </button>
                                <button className="btn bg" style={{ width: '100%', padding: '15px' }} onClick={closeLesson}>DERSİ YARIDA BIRAK</button>
                            </div>
                        </div>
                    )}

                    {/* Lesson body with book flip */}
                    <div
                        className="ls-body"
                        style={{ flex: 1, overflowY: 'auto', position: 'relative' }}
                    >
                        {/* Book flip overlay */}
                        {bookFlip && (
                            <div style={{
                                position: 'absolute', inset: 0, zIndex: 50,
                                perspective: 1200,
                                pointerEvents: 'none',
                            }}>
                                {/* Page peeling from right to left */}
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.03) 100%)',
                                    transformOrigin: 'left center',
                                    animation: 'bookPageFlip 0.75s cubic-bezier(0.4,0,0.2,1) forwards',
                                }} />
                                <style>{`
                  @keyframes bookPageFlip {
                    0%   { transform: perspective(1200px) rotateY(0deg); opacity: 1; }
                    100% { transform: perspective(1200px) rotateY(-180deg); opacity: 0; }
                  }
                `}</style>
                            </div>
                        )}

                        {currentLesson.taskIdx === 1 ? (
                            /* Reading task */
                            <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', paddingTop: 40, padding: '40px 20px' }}>
                                <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 20 }}>
                                    {currentLesson.text?.title || 'Okuma Metni'}
                                </h1>
                                <p style={{ fontSize: 18, lineHeight: 1.8, color: 'var(--mu)', marginBottom: 40 }}>
                                    Bu görev bir okuma hızı değerlendirmesidir.
                                </p>

                                {currentLesson.status === 'idle' && (
                                    <button
                                        className="btn-big"
                                        onClick={() => setCurrentLesson({ ...currentLesson, status: 'running', startTime: Date.now() })}
                                    >
                                        OKUMAYA BAŞLA ⚡
                                    </button>
                                )}

                                {currentLesson.status === 'running' && (
                                    <div className="card" style={{ padding: 30, textAlign: 'left' }}>
                                        <p style={{ fontSize: 18, lineHeight: 1.8, marginBottom: 40, whiteSpace: 'pre-wrap' }}>
                                            {currentLesson.text?.content || 'Egzersiz içeriği yüklenemedi.'}
                                        </p>
                                        <button
                                            className="btn-big"
                                            style={{ width: '100%' }}
                                            onClick={() => {
                                                const duration = (Date.now() - currentLesson.startTime) / 1000;
                                                onXP(15, 0, 'none', 'none', 0);
                                                setLessonResult({ status: 'correct', msg: `Süre: ${duration.toFixed(1)}s!`, points: '+15 TP' });
                                            }}
                                        >
                                            BİTİRDİM!
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Mini game */
                            <div style={{
                                height: '100%', display: 'flex',
                                flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', width: '100%',
                            }}>
                                <div style={{ width: '100%', maxWidth: 800 }}>
                                    <div style={{
                                        textAlign: 'center', color: 'var(--mu)',
                                        fontSize: 13, marginBottom: 5,
                                        fontWeight: 700, letterSpacing: 1,
                                    }}>
                                        GÖREV {currentLesson.subIdx + 1} / {currentLesson.subTotal}
                                    </div>
                                    <div style={{
                                        textAlign: 'center',
                                        fontSize: 18, fontWeight: 900, marginBottom: 15, color: '#fff'
                                    }}>
                                        {((currentLesson.taskIdx + currentLesson.subIdx) % 3) === 0 ? '🧠 Görsel Hafıza (45sn)' :
                                         ((currentLesson.taskIdx + currentLesson.subIdx) % 3) === 1 ? '🔤 Kelime / Sayı Tanıma (30sn)' :
                                         '⚡ Schulte Tablosu Hız Testi'}
                                    </div>
                                    {/* Sayfa numarası (kitap efekti) */}
                                    <div style={{
                                        position: 'absolute', bottom: 20, right: 30,
                                        fontSize: 11, color: 'rgba(255,255,255,0.2)',
                                        fontWeight: 700, letterSpacing: 2,
                                    }}>
                                        SAYFA {currentLesson.taskIdx} / {currentLesson.stage.totalSteps || 6}
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        {renderMiniGame()}
                                        <button 
                                            className="btn bd bs" 
                                            style={{ 
                                                marginTop: 30, padding: '12px 20px', width: '100%', 
                                                border: `1px solid ${hearts >= 0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.3)'}`,
                                                color: hearts >= 0.5 ? 'var(--mu)' : '#ef4444',
                                                fontWeight: 800, letterSpacing: 1,
                                                opacity: hearts >= 0.5 ? 1 : 0.5,
                                                cursor: hearts >= 0.5 ? 'pointer' : 'not-allowed'
                                            }}
                                            onClick={() => {
                                                if (hearts < 0.5) return;
                                                if (typeof onRemoveHalfHeart === 'function') onRemoveHalfHeart();
                                                const lbl = currentLesson.taskIdx === 2 ? 'Hafıza Görevi' 
                                                          : currentLesson.taskIdx === 3 ? 'Görsel Algılama Görevi' 
                                                          : 'Büyük Final';
                                                advanceSub(10, lbl);
                                            }}
                                        >
                                            ⏭️ ZORLANDIM, AŞAMAYI GEÇ (-1 ⚡)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Result bar */}
                    {lessonResult && (
                        <div className={`ls-result ${lessonResult.status} ls-result-anim`}>
                            <div className="ls-result-msg">
                                <div className="ls-result-icon">{lessonResult.status === 'correct' ? '✅' : '❌'}</div>
                                <div>
                                    <div className="ls-result-title">{lessonResult.status === 'correct' ? 'Harika İş!' : 'Yanlış Cevap!'}</div>
                                    <div className="ls-result-sub">{lessonResult.msg} {lessonResult.points}</div>
                                </div>
                            </div>
                            <button
                                className={`ls-continue ${lessonResult.status}`}
                                onClick={() => {
                                    if (lessonResult.status === 'correct') handleContinue();
                                    else setLessonResult(null);
                                }}
                            >
                                DEVAM ET
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── 5. COMPLETE SCREEN ── */}
            {showCompleteScreen && (
                <div
                    className="complete-screen visible"
                    style={{ position: 'fixed', inset: 0, zIndex: 6000 }}
                >
                    <div style={{ position: 'relative', zIndex: 10 }} className="complete-pop">
                        {/* Book closed animation */}
                        <div style={{
                            fontSize: 80, marginBottom: 24,
                            filter: 'drop-shadow(0 0 32px rgba(16,185,129,0.6))',
                            animation: 'boltFloat 3s ease-in-out infinite',
                        }}>📗</div>

                        <div style={{ marginBottom: 40 }}>
                            <div className="complete-title">BÖLÜM TAMAM!</div>
                            <div className="complete-sub">Kitabın bu sayfasını başarıyla bitirdin.</div>
                        </div>

                        <div className="complete-stats" style={{ marginBottom: 40 }}>
                            <div className="cs-item">
                                <div className="cs-lbl">Kazanılan TP</div>
                                <div className="cs-val" style={{ color: 'var(--gold)' }}>+40</div>
                            </div>
                            <div className="cs-item">
                                <div className="cs-lbl">TP Bonus</div>
                                <div className="cs-val" style={{ color: 'var(--blue)' }}>+10</div>
                            </div>
                            <div className="cs-item">
                                <div className="cs-lbl">Doğruluk</div>
                                <div className="cs-val" style={{ color: 'var(--green)' }}>%100</div>
                            </div>
                        </div>

                        <button
                            className="btn-big"
                            style={{ width: '100%', maxWidth: 320, fontSize: 20 }}
                            onClick={() => { setShowCompleteScreen(false); closeLesson(); }}
                        >
                            MÜKEMMEL! 🎉
                        </button>
                    </div>
                </div>
            )}

            {/* ── 6. EXIT CONFIRM ── */}
            {showExitConfirm && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.9)',
                    zIndex: 6000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div className="card" style={{ maxWidth: 400, textAlign: 'center', padding: 40 }}>
                        {/* Mini book closing visual */}
                        <div style={{ fontSize: 64, marginBottom: 20 }}>📕</div>
                        <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 15 }}>Kitabı Kapatıyor Musun?</h3>
                        <p style={{ color: 'var(--mu)', fontSize: 16, marginBottom: 30 }}>Bu sayfadaki ilerlemen kaydedilmeyecek.</p>
                        <button className="btn-big" style={{ width: '100%', marginBottom: 15 }} onClick={() => setShowExitConfirm(false)}>
                            OKUMAYA DEVAM ET
                        </button>
                        <button
                            className="btn bg"
                            style={{ width: '100%', padding: '15px', color: '#ef4444' }}
                            onClick={() => { setShowExitConfirm(false); closeLesson(); }}
                        >
                            KİTABI KAPAT
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
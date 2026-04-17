import { useState, useEffect, useMemo } from 'react';
import { db } from '@/services/firebase';
import { doc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore';
import { HeaderSection } from '../modules/PageWrapper.jsx';

const GAME_TYPES = [
  { id: 'schulte', name: 'Schulte Tablosu', icon: '🎲' },
  { id: 'visual_memory', name: 'Görsel Hafıza', icon: '🧠' },
  { id: 'word_recog', name: 'Kelime Tanıma', icon: '🔤' },
  { id: 'peripheral', name: 'Çevre Görüşü', icon: '👁️' },
];

const GAME_PARAMS = [
    // Schulte
    { id: '3', label: '3x3 Izgara', icon: '⚡', module: 'schulte', type: 'size' },
    { id: '5', label: '5x5 Izgara', icon: '⚖️', module: 'schulte', type: 'size' },
    { id: '7', label: '7x7 Izgara', icon: '💀', module: 'schulte', type: 'size' },
    { id: '20', label: '20 Saniye', icon: '⏱️', module: 'schulte', type: 'time' },
    { id: '30', label: '30 Saniye', icon: '⏱️', module: 'schulte', type: 'time' },
    { id: '40', label: '40 Saniye', icon: '⏱️', module: 'schulte', type: 'time' },
    
    // Visual Memory
    { id: 'normal', label: 'Normal Mod', icon: '🧠', module: 'memory', type: 'mode' },
    { id: 'inverted', label: 'Ters Mod', icon: '🙃', module: 'memory', type: 'mode' },
    { id: '15', label: '15 Saniye', icon: '⏱️', module: 'memory', type: 'time' },
    { id: '25', label: '25 Saniye', icon: '⏱️', module: 'memory', type: 'time' },
    
    // Vision
    { id: '400', label: '400ms Hız', icon: '🎯', module: 'peripheral', type: 'flash' },
    { id: '800', label: '800ms Hız', icon: '👁️', module: 'peripheral', type: 'flash' },
    { id: '30', label: '30 Saniye', icon: '⏱️', module: 'peripheral', type: 'time' },
    
    // Word Recognition
    { id: '500', label: '500ms Hız', icon: '⚡', module: 'wordrecog', type: 'flash' },
    { id: '1000', label: '1000ms Hız', icon: '🐢', module: 'wordrecog', type: 'flash' },
    { id: '28', label: '28 Saniye', icon: '⏱️', module: 'wordrecog', type: 'time' },
    { id: '45', label: '45 Saniye', icon: '⏱️', module: 'wordrecog', type: 'time' },
];

export function DuelDraft({ matchId, userId, onFinish }) {
  const [match, setMatch] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [draftSettings, setDraftSettings] = useState({ draftTimer: 15, roundCount: 5 });
  
  useEffect(() => {
    const fetchAdminSettings = async () => {
      try {
        const { getDoc, doc: fdoc } = await import('firebase/firestore');
        const snap = await getDoc(fdoc(db, 'admin', 'duels'));
        if (snap.exists()) setDraftSettings(snap.data());
      } catch(e) { console.error(e); }
    };
    fetchAdminSettings();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'matches', matchId), (snap) => {
      const data = snap.data();
      if (!data) return;
      setMatch(data);
      if (data.status === 'in_progress') {
          onFinish(); 
          return;
      }
    });
    return () => unsub();
  }, [matchId, onFinish]);

  const draft = match?.draft || { picks: [], turn: match?.p1?.id, subPhase: 'game' };
  const currentRoundNum = (draft?.picks?.length || 0) + 1;
  const isMyTurn = draft.turn === userId;
  const currentPhase = draft.subPhase || 'game';

  const randomOptions = useMemo(() => {
      if (!match) return [];
      const seed = matchId + (draft?.picks?.length || 0) + (draft.subPhase || 'game');
      const getRand = (s) => {
          let hash = 0;
          for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
          return (Math.abs(hash) % 1000) / 1000;
      };
      
      if (currentPhase === 'game') {
          const shuffled = [...GAME_TYPES].sort(() => getRand(seed + 'g') - 0.5);
          return shuffled.slice(0, 2);
      } else {
          const params = GAME_PARAMS.filter(p => p.module === draft.tempGame);
          const shuffled = [...params].sort(() => getRand(seed + 'p') - 0.5);
          return shuffled.slice(0, 2);
      }
  }, [matchId, draft?.picks?.length, draft.subPhase, draft.tempGame, match]);

  useEffect(() => {
    if (timeLeft > 0 && isMyTurn) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isMyTurn) {
      makePick(randomOptions[0]);
    }
  }, [timeLeft, isMyTurn, randomOptions]);

  useEffect(() => { setTimeLeft(draftSettings.draftTimer || 15); }, [draft?.picks?.length, draft.subPhase, draftSettings.draftTimer]);

  const makePick = async (opt) => {
    if (!isMyTurn) return;
    
    const mRef = doc(db, 'matches', matchId);
    const picks = draft.picks || [];
    const update = {};
    
    if (currentPhase === 'game') {
        update['draft.tempGame'] = opt.id;
        update['draft.subPhase'] = 'param';
        // Alternate turn for parameter selection
        update['draft.turn'] = userId === match.p1.id ? match.p2.id : match.p1.id;
    } else {
        const difficulty = currentRoundNum <= 2 ? 'easy' : (currentRoundNum <= 4 ? 'medium' : 'hard');
        const newPick = { 
            round: currentRoundNum, 
            picker: draft.turn, 
            gameId: draft.tempGame,
            customParam: opt.id,
            customMode: opt.mode || null,
            paramType: opt.type || 'generic',
            difficulty
        };
        
        // Single pick for current round
        update['draft.picks'] = arrayUnion(newPick);
        update['draft.tempGame'] = null;
        update['draft.subPhase'] = 'game';
        // After param is picked, it's the picker's turn to pick the next game (in the next drafting phase)
        update['draft.turn'] = userId; 
        
        // Transition to in_progress for this round
        update.status = 'in_progress';
        
        // Ensure the round object exists in the rounds array
        const roundObj = {
            type: newPick.gameId,
            difficulty: newPick.difficulty,
            customParam: newPick.customParam,
            customMode: newPick.customMode,
            paramType: newPick.paramType,
            status: 'pending',
            p1: { score: 0, status: 'waiting' },
            p2: { score: 0, status: 'waiting' }
        };

        if (currentRoundNum === 1) {
            update.rounds = [roundObj];
        } else {
            // We'll update the specific round index
            update[`rounds.${currentRoundNum - 1}`] = roundObj;
        }
    }

    await updateDoc(mRef, update);
  };

  if (!match) return null;

  return (
    <div style={{ padding: 25, textAlign: 'center' }}>
      <HeaderSection icon="⚔️" title="Düello Hazırlığı" subtitle={`Strateji Aşaması: Raunt ${currentRoundNum}`} />
      
      <div style={{ margin: '20px 0', display: 'flex', justifyContent: 'center', gap: 30, alignItems: 'center' }}>
          <div style={{ opacity: draft.turn === match.p1.id ? 1 : 0.4, transform: draft.turn === match.p1.id ? 'scale(1.15)' : 'scale(1)', transition: 'all .4s' }}>
              <div style={{ fontSize: 40, filter: draft.turn === match.p1.id ? 'drop-shadow(0 0 10px var(--ac))' : 'none' }}>{match.p1.avatar}</div>
              <div style={{ fontSize: 13, fontWeight: 900, marginTop: 5 }}>{match.p1.name}</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--mu)', letterSpacing: 2 }}>VS</div>
          <div style={{ opacity: draft.turn === match.p2.id ? 1 : 0.4, transform: draft.turn === match.p2.id ? 'scale(1.15)' : 'scale(1)', transition: 'all .4s' }}>
              <div style={{ fontSize: 40, filter: draft.turn === match.p2.id ? 'drop-shadow(0 0 10px #f43f5e)' : 'none' }}>{match.p2.avatar}</div>
              <div style={{ fontSize: 13, fontWeight: 900, marginTop: 5 }}>{match.p2.name}</div>
          </div>
      </div>

      <div style={{ 
          background: 'rgba(255,255,255,.02)', 
          borderRadius: 24, 
          padding: 30,
          border: '1px solid ' + (isMyTurn ? 'var(--ac)' : 'rgba(255,255,255,.08)'),
          boxShadow: isMyTurn ? '0 0 40px var(--ac2)22' : 'none',
          position: 'relative'
      }}>
          <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: isMyTurn ? 'var(--ac)' : 'var(--mu)', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  {isMyTurn 
                    ? (currentPhase === 'game' ? 'OYUN SEÇ!' : 'ZORLUK / MOD SEÇ!') 
                    : 'RAKİBİN KARARI BEKLENİYOR...'}
              </div>
              {isMyTurn && (
                  <div style={{ fontSize: 44, fontWeight: 900, marginTop: 10, color: timeLeft < 4 ? '#ef4444' : 'var(--tx)', fontFamily: 'var(--mo)' }}>
                      {timeLeft}
                  </div>
              )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '10px 0' }}>
              {randomOptions.map((opt, idx) => (
                  <button 
                    key={idx + '-' + opt.id}
                    disabled={!isMyTurn}
                    onClick={() => makePick(opt)}
                    style={{
                        padding: '40px 20px',
                        background: isMyTurn 
                            ? 'linear-gradient(145deg, rgba(var(--ac-rgb), 0.1), rgba(var(--ac-rgb), 0.02))' 
                            : 'rgba(255,255,255,.02)',
                        border: '2px solid ' + (isMyTurn ? 'rgba(var(--ac-rgb), 0.2)' : 'rgba(255,255,255,.05)'),
                        borderRadius: 24,
                        color: 'var(--tx)',
                        cursor: isMyTurn ? 'pointer' : 'default',
                        transition: 'all .4s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isMyTurn ? 'translateY(0) scale(1)' : 'scale(0.95)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 15,
                        boxShadow: isMyTurn ? '0 10px 25px -10px rgba(var(--ac-rgb), 0.3)' : 'none',
                        minHeight: 220,
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => isMyTurn && (e.currentTarget.style.transform = 'translateY(-10px) scale(1.05)')}
                    onMouseLeave={(e) => isMyTurn && (e.currentTarget.style.transform = 'translateY(0) scale(1)')}
                  >
                      {isMyTurn && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--ac)' }} />}
                      <div style={{ 
                          fontSize: 56, 
                          filter: isMyTurn ? 'drop-shadow(0 0 20px rgba(var(--ac-rgb), 0.4))' : 'grayscale(1)',
                          transition: 'all .4s'
                      }}>
                        {opt.icon}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>{opt.name || opt.label}</div>
                      {isMyTurn && <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ac)', background: 'rgba(var(--ac-rgb), 0.1)', padding: '4px 12px', borderRadius: 20 }}>SEÇMEK İÇİN TIKLA</div>}
                  </button>
              ))}
          </div>
      </div>

      <div style={{ marginTop: 30, display: 'flex', justifyContent: 'center', gap: 12 }}>
          {[1,2,3,4,5].map(p => (
              <div key={p} style={{
                  width: 30, height: 6, borderRadius: 10,
                  background: currentRoundNum === p ? 'var(--ac)' : (currentRoundNum > p ? 'var(--ac2)' : 'rgba(255,255,255,.1)'),
                  transition: 'all .4s'
              }} />
          ))}
      </div>
      
      <div style={{ marginTop: 15, fontSize: 11, color: 'var(--mu)', fontWeight: 700 }}>
        STRATEJİ: {currentPhase === 'game' ? 'OYUN BELİRLENİYOR' : 'ZORLUK BELİRLENİYOR'}
      </div>
    </div>
  );
}

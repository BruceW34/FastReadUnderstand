import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/services/firebase';
import { doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { TRAINING_CONFIG } from '@/data/trainingConfig';

/**
 * 🎮 DuelCardGame Component
 * Her antrenmanın özelliklerini soran interaktif kart sistemi
 * 5 aşama × soru sistemi × Puan mekanizması
 */
export function DuelCardGame({ matchId, userId, opponent, onFinish, addToast }) {
  const [match, setMatch] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [gamePhase, setGamePhase] = useState('card'); // 'card' | 'question' | 'result'
  const [selectedCard, setSelectedCard] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [loading, setLoading] = useState(true);

  // Firebase'den match verilerini dinle
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'matches', matchId), (snap) => {
      const data = snap.data();
      if (data) {
        setMatch(data);
        setLoading(false);
        
        // Score güncelle
        let p1 = 0, p2 = 0;
        (data.duelRounds || []).forEach(r => {
          if (r.p1Score) p1 += r.p1Score;
          if (r.p2Score) p2 += r.p2Score;
        });
        setP1Score(p1);
        setP2Score(p2);
      }
    }, (error) => {
      console.error('Error listening to match:', error);
      setLoading(false);
    });
    return () => unsub();
  }, [matchId]);

  // Soru geri sayım
  useEffect(() => {
    if (gamePhase !== 'question') return;
    
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gamePhase]);

  const isMyTurn = match && ((currentRound % 2 === 1 && match.p1.id === userId) || 
                             (currentRound % 2 === 0 && match.p2.id === userId));

  // Rasgele seçenekler oluştur
  const generateOptions = (property, lessonId) => {
    const config = TRAINING_CONFIG[lessonId];
    if (!config) return [];

    const fieldDef = Object.values(config.fields || {}).find(f => f.label?.includes(property));
    if (!fieldDef) return [];

    if (fieldDef.type === 'select') {
      return fieldDef.options || [];
    } else if (fieldDef.type === 'number') {
      const min = fieldDef.min || 1;
      const max = fieldDef.max || 100;
      const values = [];
      for (let i = min; i <= max; i += Math.ceil((max - min) / 3)) {
        values.push(i);
      }
      return values.slice(0, 4);
    }
    return [];
  };

  // Soru oluştur ve başla
  const startQuestion = () => {
    if (!selectedCard) return;
    
    const lessonConfig = TRAINING_CONFIG[selectedCard.lessonId];
    if (!lessonConfig) return;

    const fieldKeys = Object.keys(lessonConfig.fields || {}).filter(k => k !== 'lessonId');
    const randomProperty = fieldKeys[Math.floor(Math.random() * fieldKeys.length)];
    
    setSelectedCard({
      ...selectedCard,
      questionProperty: randomProperty,
      options: generateOptions(randomProperty, selectedCard.lessonId)
    });
    
    setGamePhase('question');
    setTimeLeft(10);
  };

  // Cevap seçildi
  const answerQuestion = (selectedOption) => {
    if (!selectedCard) return;

    const isCorrect = String(selectedOption) === String(selectedCard.correctAnswer);
    const speedBonus = timeLeft > 7 ? 5 : 0;
    const points = isCorrect ? (10 + speedBonus) : -5;

    const isP1 = match.p1.id === userId;
    const roundData = {
      round: currentRound,
      card: selectedCard,
      selectedOption,
      isCorrect,
      points,
      playerAnswer: isP1 ? points : 0,
      opponentAnswer: !isP1 ? points : 0,
    };

    // Firebase'e kaydet
    updateDoc(doc(db, 'matches', matchId), {
      duelRounds: [...(match.duelRounds || []), roundData],
      lastRoundTimestamp: new Date(),
    }).then(() => {
      setGamePhase('result');
      setTimeout(() => {
        if (currentRound < 5) {
          setCurrentRound(currentRound + 1);
          setGamePhase('card');
          setSelectedCard(null);
        } else {
          finishDuel();
        }
      }, 2000);
    });
  };

  const handleTimeout = () => {
    answerQuestion(null);
    addToast({ msg: 'Süre doldu! -5 puan', color: '#ef4444', icon: '⏰' });
  };

  const finishDuel = async () => {
    const winner = p1Score > p2Score ? match.p1.id : 
                   p2Score > p1Score ? match.p2.id : null;
    
    await updateDoc(doc(db, 'matches', matchId), {
      status: 'finished',
      winner,
      finalP1Score: p1Score,
      finalP2Score: p2Score,
      finishedAt: new Date(),
    });

    onFinish?.(winner);
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>⏳ Yükleniyor...</div>;
  if (!match) return <div>Maç bulunamadı</div>;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '20px', 
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      animation: 'fadeIn 0.4s ease-out'
    }}>
      
      {/* ROUND BİLGİSİ */}
      <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 900, color: 'var(--ac)', textTransform: 'uppercase', letterSpacing: 1 }}>
        RAUNT {currentRound} / 5
      </div>
      
      {/* Skor Tablosu */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ 
          background: match.p1.id === userId ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'var(--b3)', 
          padding: '16px', 
          borderRadius: '12px', 
          border: `2px solid ${match.p1.id === userId ? '#a78bfa' : 'var(--b2)'}`,
          textAlign: 'center',
          transform: match.p1.id === userId ? 'scale(1.02)' : 'scale(1)',
          transition: 'transform 0.3s ease',
          boxShadow: match.p1.id === userId ? '0 8px 16px rgba(124, 58, 237, 0.3)' : 'none'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '6px' }}>{match.p1.avatar || '👤'}</div>
          <div style={{ fontSize: '13px', fontWeight: 900, marginBottom: '4px', color: match.p1.id === userId ? '#fff' : 'var(--mu)' }}>{match.p1.name}</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#a78bfa' }}>{p1Score}</div>
          <div style={{ fontSize: '10px', color: 'var(--mu)', marginTop: '4px', opacity: 0.7 }}>puan</div>
        </div>
        
        <div style={{ 
          background: match.p2.id === userId ? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' : 'var(--b3)', 
          padding: '16px', 
          borderRadius: '12px', 
          border: `2px solid ${match.p2.id === userId ? '#7dd3fc' : 'var(--b2)'}`,
          textAlign: 'center',
          transform: match.p2.id === userId ? 'scale(1.02)' : 'scale(1)',
          transition: 'transform 0.3s ease',
          boxShadow: match.p2.id === userId ? '0 8px 16px rgba(14, 165, 233, 0.3)' : 'none'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '6px' }}>{match.p2.avatar || '👤'}</div>
          <div style={{ fontSize: '13px', fontWeight: 900, marginBottom: '4px', color: match.p2.id === userId ? '#fff' : 'var(--mu)' }}>{match.p2.name}</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#7dd3fc' }}>{p2Score}</div>
          <div style={{ fontSize: '10px', color: 'var(--mu)', marginTop: '4px', opacity: 0.7 }}>puan</div>
        </div>
      </div>

      {/* Raunt Gözergahı */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '12px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '8px'
      }}>
        <span style={{ fontWeight: 600 }}>Raunt: {currentRound}/5</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[1, 2, 3, 4, 5].map(r => (
            <div 
              key={r}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: r < currentRound ? '#10b981' : (r === currentRound ? '#f59e0b' : '#333'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '12px',
                color: '#fff'
              }}
            >
              {r}
            </div>
          ))}
        </div>
      </div>

      {/* KART SEÇME AŞAMASI */}
      {gamePhase === 'card' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px' }}>
              {isMyTurn ? '🎯 Antrenman Seç' : `⏳ ${opponent?.name} seçiyor...`}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--mu)' }}>
              Seçilen antrenmanın özelliğini tahmin etmen gerekecek
            </p>
          </div>

          {isMyTurn ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              {Object.entries(TRAINING_CONFIG).map(([lessonId, config]) => (
                <div
                  key={lessonId}
                  onClick={() => {
                    setSelectedCard({ 
                      lessonId, 
                      name: config.name,
                      icon: config.icon,
                      correctAnswer: config.fields?.duration?.default || 300
                    });
                    startQuestion();
                  }}
                  style={{
                    padding: '16px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '2px solid #fff2',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    opacity: selectedCard?.lessonId === lessonId ? 1 : 0.7,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#fff2'}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{config.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>{config.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--mu)' }}>Seç</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '12px',
              color: 'var(--mu)'
            }}>
              ⏳ Rakibin seçim yapıyor...
            </div>
          )}
        </div>
      )}

      {/* SORU AŞAMASI */}
      {gamePhase === 'question' && selectedCard && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ 
            padding: '20px',
            background: 'linear-gradient(135deg, #7c3aed40, #3b82f640)',
            borderRadius: '12px',
            border: '2px solid #7c3aed',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{selectedCard.icon}</div>
            <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '4px' }}>
              {selectedCard.name}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--mu)' }}>
              {selectedCard.questionProperty} nedir?
            </p>
          </div>

          {/* Geri Sayım */}
          <div style={{
            fontSize: '48px',
            fontWeight: 900,
            textAlign: 'center',
            color: timeLeft <= 3 ? '#ef4444' : '#f59e0b'
          }}>
            {timeLeft}
          </div>

          {/* Seçenekler */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {selectedCard.options?.slice(0, 4).map((option, i) => (
              <button
                key={i}
                onClick={() => answerQuestion(option)}
                style={{
                  padding: '16px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '2px solid #fff2',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#7c3aed';
                  e.currentTarget.style.background = '#7c3aed20';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#fff2';
                  e.currentTarget.style.background = 'rgba(0,0,0,0.2)';
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SONUÇ AŞAMASI */}
      {gamePhase === 'result' && (
        <div style={{
          padding: '30px',
          background: 'linear-gradient(135deg, #10b98140, #3b82f640)',
          borderRadius: '12px',
          border: '2px solid #10b981',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
          <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '8px' }}>Raunt Bitti!</h3>
          <p style={{ fontSize: '12px', color: 'var(--mu)' }}>Bir sonraki raunta geçiliyor...</p>
        </div>
      )}
    </div>
  );
}

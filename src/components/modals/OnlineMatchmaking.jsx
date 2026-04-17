import React, { useState, useEffect } from 'react';
import { db } from '@/services/firebase';
import { 
  collection, query, where, onSnapshot, addDoc, 
  serverTimestamp, doc, updateDoc, getDoc, orderBy, limit
} from 'firebase/firestore';
import { getLeague, LEAGUES } from '@/data/levels';
import { DuelCardGame } from './DuelCardGame';

/**
 * 🔍 OnlineMatchmaking Component
 * Kendi seviyesiyle online rakip arar ve otomatik maç oluşturur
 */
export default function OnlineMatchmaking({ user, addToast, onClose }) {
  const [matchId, setMatchId] = useState(null);
  const [matchStatus, setMatchStatus] = useState('searching'); // 'searching', 'found', 'playing', 'finished', 'timeout'
  const [opponent, setOpponent] = useState(null);
  const [timeSearching, setTimeSearching] = useState(0);
  const [matchResult, setMatchResult] = useState(null);
  const [countdownToStart, setCountdownToStart] = useState(3);

  // Rakip arama
  useEffect(() => {
    if (matchStatus !== 'searching') return;

    const myLeague = getLeague(user.xp || 0);
    const myLeagueIndex = LEAGUES.findIndex(l => l.id === myLeague.id);
    const maxXP = myLeagueIndex < LEAGUES.length - 1 ? LEAGUES[myLeagueIndex + 1].minXP : 999999999;

    // Aynı ligdeki oyuncuları ara (sen hariç)
    // Basitleştirilmiş sorgu: Sadece online olanları getir (Index gerektirmez)
    const q = query(
      collection(db, "users"),
      where("isOnline", "==", true),
      limit(20)
    );

    const unsub = onSnapshot(q, async (snap) => {
      const candidates = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => 
          u.id !== user.id && 
          !u.inMatch && 
          u.xp >= myLeague.minXP && 
          u.xp < maxXP
        )
        .sort((a, b) => (b.xp || 0) - (a.xp || 0)); // Yakın seviyeli olanları başa al

      if (candidates.length > 0) {
        // İlk uygun rakibi seç
        const opponent = candidates[0];
        setOpponent(opponent);

        // Match oluştur
        try {
          const matchDoc = {
            p1: { id: user.id, name: user.name, avatar: user.avatar },
            p2: { id: opponent.id, name: opponent.name, avatar: opponent.avatar },
            status: 'ready', // 'ready', 'in_progress', 'finished'
            mode: 'wpm-test', // WPM testi modu
            createdAt: serverTimestamp(),
            p1Score: 0,
            p2Score: 0,
          };

          const docRef = await addDoc(collection(db, 'matches'), matchDoc);
          setMatchId(docRef.id);
          setMatchStatus('found');

          // Rakipe durum bildir
          await updateDoc(doc(db, 'users', opponent.id), {
            inMatch: true,
            currentMatchId: docRef.id,
          });

          // Kendini güncelle
          await updateDoc(doc(db, 'users', user.id), {
            inMatch: true,
            currentMatchId: docRef.id,
          });
        } catch (err) {
          console.error('Match oluşturmada hata:', err);
          addToast({ msg: 'Maç oluşturulamadı', color: '#ef4444' });
        }
      }
    });

    return () => unsub();
  }, [matchStatus, user.id, user.xp]);

  // Arama zamanı göstergesi
  useEffect(() => {
    if (matchStatus !== 'searching') return;

    // 5 minuto timeout - cancelar busca após 300 segundos
    const timeoutLimit = 300; // 5 minutos em segundos

    const timer = setInterval(() => {
      setTimeSearching(t => {
        const newTime = t + 1;
        
        // Se passou de 5 minutos, cancelar busca
        if (newTime >= timeoutLimit) {
          clearInterval(timer);
          setMatchStatus('timeout');
          addToast({ 
            msg: '⏰ Arama süresi doldu. Rakip bulunamadı.',
            color: '#f59e0b' 
          });
          return newTime;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [matchStatus]);

  // Found'dan Playing'e geçiş (3 saniye countdown)
  useEffect(() => {
    if (matchStatus !== 'found') {
      setCountdownToStart(3);
      return;
    }

    if (countdownToStart <= 0) {
      setMatchStatus('playing');
      return;
    }

    const timer = setTimeout(() => {
      setCountdownToStart(t => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [matchStatus, countdownToStart]);

  // Maç tamamlandığında
  const handleMatchFinish = (result) => {
    setMatchResult(result);
    setMatchStatus('finished');
    
    // Oyuncu statüsünü güncelle
    updateDoc(doc(db, 'users', user.id), {
      inMatch: false,
    }).catch(console.error);

    if (opponent) {
      updateDoc(doc(db, 'users', opponent.id), {
        inMatch: false,
      }).catch(console.error);
    }
  };

  // Timeout state - Arama süresi doldu
  if (matchStatus === 'timeout') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: '40px 20px',
        textAlign: 'center',
        minHeight: '400px',
      }}>
        <div style={{ fontSize: 80 }}>⏰</div>
        <h2 style={{ fontSize: 28, fontWeight: 900 }}>
          Arama Süresi Doldu
        </h2>
        <p style={{ color: 'var(--mu)', fontSize: 14, maxWidth: 300 }}>
          5 dakika içinde rakip bulunamadı. Daha sonra tekrar deneyin!
        </p>
        <button
          onClick={() => onClose()}
          style={{
            background: 'var(--ac)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 28px',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            marginTop: 20,
          }}
        >
          Geri Dön
        </button>
      </div>
    );
  }

  if (matchStatus === 'playing' && matchId) {
    return (
      <DuelCardGame
        matchId={matchId}
        userId={user.id}
        opponent={opponent}
        onFinish={() => handleMatchFinish()}
        addToast={addToast}
      />
    );
  }

  if (matchStatus === 'finished' && matchResult) {
    const isWon = matchResult.winner === user.id;
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: '40px 20px',
        textAlign: 'center',
        minHeight: '400px',
      }}>
        <div style={{ fontSize: 80 }}>
          {isWon ? '🎉' : '😢'}
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 900 }}>
          {isWon ? 'Kazandın! 🏆' : 'Kaybettin 💔'}
        </h2>
        <div style={{
          display: 'flex',
          gap: 30,
          fontSize: 18,
          fontWeight: 700,
          marginTop: 20,
        }}>
          <div>
            <div style={{ fontSize: 24, color: '#10b981', marginBottom: 5 }}>
              {matchResult.p1Score}
            </div>
            <div>{user.name}</div>
          </div>
          <div style={{ color: 'var(--mu)' }}>VS</div>
          <div>
            <div style={{ fontSize: 24, color: '#f59e0b', marginBottom: 5 }}>
              {matchResult.p2Score}
            </div>
            <div>{opponent?.name}</div>
          </div>
        </div>

        <div style={{
          background: isWon ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `2px solid ${isWon ? '#10b981' : '#ef4444'}`,
          borderRadius: 12,
          padding: 16,
          marginTop: 20,
          width: '100%',
          maxWidth: 300,
        }}>
          <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 8 }}>XP ÖDÜLÜ</div>
          <div style={{
            fontSize: 32,
            fontWeight: 900,
            color: isWon ? '#10b981' : '#f59e0b',
          }}>
            +{isWon ? 150 : 50}
          </div>
        </div>

        <button
          onClick={() => onClose()}
          style={{
            background: 'var(--ac)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 28px',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            marginTop: 20,
          }}
        >
          Tamam
        </button>
      </div>
    );
  }

  if (matchStatus === 'found') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: '40px 20px',
        textAlign: 'center',
        minHeight: '400px',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))',
        borderRadius: 16,
      }}>
        <div style={{ fontSize: 60 }}>🎉</div>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>Rakip Bulundu!</h2>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          marginTop: 20,
          fontSize: 18,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{user.avatar || '👤'}</div>
            <div style={{ fontWeight: 700 }}>{user.name}</div>
          </div>
          
          <div style={{ fontSize: 24, color: 'var(--mu)' }}>VS</div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{opponent?.avatar || '🚀'}</div>
            <div style={{ fontWeight: 700 }}>{opponent?.name}</div>
          </div>
        </div>

        <div style={{
          marginTop: 30,
          padding: 20,
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          maxWidth: 300,
        }}>
          <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 8 }}>MAÇIN KURALLARI</div>
          <ul style={{ fontSize: 12, lineHeight: 1.8, margin: 0, paddingLeft: 20, color: 'var(--tx)' }}>
            <li>5 raund oynanacak</li>
            <li>Her raunda kart seç</li>
            <li>Antrenman soru-cevabı</li>
            <li>Doğru = +10, Yanlış = -5</li>
            <li>En yüksek puan kazanır</li>
          </ul>
        </div>

        <div style={{
          marginTop: 20,
          fontSize: 32,
          fontWeight: 900,
          color: '#8b5cf6',
          animation: 'pulse 1s infinite',
        }}>
          {countdownToStart}
        </div>
      </div>
    );
  }

  // Searching state
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      padding: '60px 20px',
      textAlign: 'center',
      minHeight: '500px',
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.08))',
      borderRadius: 16,
    }}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
        @keyframes pulse { 0%, 100% { opacity: 0.6 } 50% { opacity: 1 } }
        .match-spinner { animation: spin 2s linear infinite; }
      `}</style>

      <div className="match-spinner" style={{ fontSize: 60 }}>⚔️</div>

      <h2 style={{ fontSize: 28, fontWeight: 900, marginTop: 10 }}>
        Rakip Aranıyor...
      </h2>

      <div style={{
        marginTop: 20,
        padding: 20,
        background: 'rgba(139, 92, 246, 0.1)',
        borderRadius: 12,
        border: '2px solid rgba(139, 92, 246, 0.3)',
        minWidth: 280,
      }}>
        <div style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 10 }}>
          Kendi seviyendeki oyuncular aranıyor...
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#8b5cf6', marginBottom: 12 }}>
          {timeSearching}s / 300s
        </div>
        {/* Progress bar */}
        <div style={{ 
          height: 4, 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: 2,
          overflow: 'hidden',
          marginBottom: 8
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (timeSearching / 300) * 100)}%`,
            background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
            transition: 'width 1s linear'
          }} />
        </div>
        <div style={{ fontSize: 10, color: 'var(--mu)' }}>
          {300 - timeSearching}s kalan
        </div>
      </div>

      <div style={{ marginTop: 20, color: 'var(--mu)', fontSize: 12 }}>
        <p>
          • Aynı lig seviyesindeki çevrimiçi oyuncularla eşleşiyor<br/>
          • Ortalama bekleme süresi 5-15 saniye<br/>
          • Oynamak için internet bağlantısı gerekli
        </p>
      </div>

      <button
        onClick={() => onClose()}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 8,
          padding: '10px 20px',
          color: 'var(--tx)',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          marginTop: 30,
        }}
      >
        İptal Et
      </button>
    </div>
  );
}

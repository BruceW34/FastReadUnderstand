import React, { useState, useEffect } from 'react';
import { db } from '@/services/firebase';
import { doc, updateDoc, getDoc, onSnapshot, arrayUnion } from 'firebase/firestore';

/**
 * 🤝 CoopMission Component
 * Birlikte oynanan eğitim görevleri
 * 4 Hafta × 5 Görev = 20 Toplam Görev
 */
export function CoopMission({ missionId, userId, user, addToast }) {
  const [mission, setMission] = useState(null);
  const [members, setMembers] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [myScore, setMyScore] = useState(0);

  // Mission verilerini dinle
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'coop_missions', missionId), (snap) => {
      const data = snap.data();
      if (data) {
        setMission(data);
        setMembers(data.members || []);
        setLoading(false);
      }
    }, (error) => {
      console.error('Error listening to mission:', error);
      setLoading(false);
    });
    return () => unsub();
  }, [missionId]);

  // Görev hesapla
  const getCurrentGoal = () => {
    if (!mission) return null;
    const goalIndex = (currentWeek - 1) * 5 + currentGoalIndex;
    return mission.goals?.[goalIndex];
  };

  const currentGoal = getCurrentGoal();

  // Oyun bittiğinde çağrılacak
  const submitScore = async (score) => {
    try {
      const goal = currentGoal;
      const goalIndex = (currentWeek - 1) * 5 + currentGoalIndex;
      
      // Verileri güncelle
      const updatedGoals = [...(mission.goals || [])];
      const currentGoalData = updatedGoals[goalIndex];
      
      currentGoalData.playerScores = currentGoalData.playerScores || {};
      currentGoalData.playerScores[userId] = score;
      currentGoalData.status = 'completed';

      // Hedef başarılı mı?
      const isSuccess = score >= goal.targetWPM;
      const memberContribution = isSuccess ? goal.rewarde || 100 : 0;

      // Update mission
      await updateDoc(doc(db, 'coop_missions', missionId), {
        goals: updatedGoals,
        currentXP: mission.currentXP + (isSuccess ? goal.reward || 100 : 0),
      });

      // User istatistiklerini güncelle
      await updateDoc(doc(db, 'users', userId), {
        coopPoints: (user.coopPoints || 0) + memberContribution,
      });

      addToast({
        msg: isSuccess ? 
          `✅ Başarılı! +${goal.reward || 100} XP` : 
          `❌ Hedef kaçırıldı. ${goal.targetWPM - score} fark`,
        color: isSuccess ? '#10b981' : '#ef4444',
        icon: isSuccess ? '🎉' : '😢'
      });

      // Sonraki görevse geç
      if (currentGoalIndex < 4) {
        setCurrentGoalIndex(currentGoalIndex + 1);
      } else if (currentWeek < 4) {
        setCurrentWeek(currentWeek + 1);
        setCurrentGoalIndex(0);
      } else {
        // Tüm görevler bitti
        finishMission();
      }

      setIsPlaying(false);
      setMyScore(0);
    } catch (error) {
      console.error('Score submission error:', error);
      addToast({ msg: 'Skor kaydedilemedi', color: '#ef4444' });
    }
  };

  const finishMission = async () => {
    try {
      await updateDoc(doc(db, 'coop_missions', missionId), {
        status: 'completed',
        completedAt: new Date(),
      });

      addToast({
        msg: `🎉 Co-op Görev Tamamlandı! ${mission.reward || 2000} XP Kazandın`,
        color: '#10b981',
        icon: '🏆'
      });
    } catch (error) {
      console.error('Mission completion error:', error);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>⏳ Yükleniyor...</div>;
  }

  if (!mission) {
    return <div style={{ padding: '20px' }}>Görev bulunamadı</div>;
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '20px',
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* Başlık */}
      <div style={{
        background: 'linear-gradient(135deg, #10b98140, #3b82f640)',
        padding: '20px',
        borderRadius: '12px',
        border: '2px solid #10b981',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '4px' }}>
          🤝 {mission.title}
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--mu)', margin: '4px 0' }}>
          Hedef: {mission.goalXP?.toLocaleString()} XP
        </p>
        <p style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
          İlerleme: {mission.currentXP?.toLocaleString()} / {mission.goalXP?.toLocaleString()}
        </p>
      </div>

      {/* Üyeler */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px'
      }}>
        {members.map((member) => (
          <div
            key={member.id}
            style={{
              padding: '12px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '8px',
              border: member.id === userId ? '2px solid #7c3aed' : '1px solid #fff2',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '6px' }}>
              {member.avatar || '👤'}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
              {member.name}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#7c3aed' }}>
              {member.contribution || 0}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--mu)' }}>katkı</div>
          </div>
        ))}
      </div>

      {/* Hafta ve Görev Gözergahı */}
      <div style={{
        padding: '16px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '13px', color: 'var(--mu)', marginBottom: '8px' }}>
          Hafta {currentWeek} / 4
        </div>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5].map((i) => {
            const goalIndex = (currentWeek - 1) * 5 + i - 1;
            const isCompleted = mission.goals?.[goalIndex]?.status === 'completed';
            const isActive = currentGoalIndex === i - 1;

            return (
              <div
                key={i}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isCompleted ? '#10b981' : (isActive ? '#f59e0b' : '#333'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '12px',
                  color: '#fff'
                }}
              >
                {isCompleted ? '✓' : i}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mevcut Görev */}
      {currentGoal && (
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #f59e0b40, #ec489940)',
          borderRadius: '12px',
          border: '2px solid #f59e0b'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '8px' }}>
            📚 Görev {currentGoalIndex + 1}/5 (Hafta {currentWeek})
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--fg)', marginBottom: '12px' }}>
            {currentGoal.title || `Hafta ${currentWeek} - Görev ${currentGoalIndex + 1}`}
          </p>
          
          {currentGoal.description && (
            <p style={{ fontSize: '12px', color: 'var(--mu)', marginBottom: '12px' }}>
              {currentGoal.description}
            </p>
          )}

          {/* Hedef Bilgisi */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            marginBottom: '12px'
          }}>
            <div style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: 'var(--mu)', fontWeight: 600 }}>WPM HEDEFİ</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#f59e0b' }}>
                {currentGoal.targetWPM || 250}
              </div>
            </div>
            <div style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: 'var(--mu)', fontWeight: 600 }}>ÖDÜl</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#10b981' }}>
                +{currentGoal.reward || 100}
              </div>
            </div>
          </div>

          {/* Başla Butonu */}
          <button
            onClick={() => setIsPlaying(true)}
            disabled={isPlaying}
            style={{
              width: '100%',
              padding: '12px',
              background: '#f59e0b',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 800,
              cursor: isPlaying ? 'not-allowed' : 'pointer',
              opacity: isPlaying ? 0.5 : 1,
              fontSize: '14px'
            }}
          >
            {isPlaying ? '⏳ Oyun Oynanıyor...' : '▶️ Başla'}
          </button>
        </div>
      )}

      {/* Yapılan Görevler */}
      {mission.goals && mission.goals.length > 0 && (
        <div style={{
          padding: '16px',
          background: 'rgba(0,0,0,0.1)',
          borderRadius: '8px'
        }}>
          <h4 style={{ fontSize: '12px', fontWeight: 800, marginBottom: '12px', color: 'var(--mu)' }}>
            ✅ TAMAMLANAN GÖREVLER
          </h4>
          <div style={{ display: 'grid', gap: '8px' }}>
            {mission.goals.map((goal, idx) => {
              if (goal.status !== 'completed') return null;
              
              const week = Math.floor(idx / 5) + 1;
              const goalNum = (idx % 5) + 1;
              
              return (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>
                    Hafta {week}, Görev {goalNum}
                  </span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>
                    ✓ Tamamlandı
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* İstatistikler */}
      <div style={{
        padding: '16px',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '8px',
        border: '1px solid #3b82f640'
      }}>
        <h4 style={{ fontSize: '12px', fontWeight: 800, marginBottom: '12px', color: 'var(--mu)' }}>
          📊 İLERLEME
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            flex: 1,
            height: '8px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: '#10b981',
              width: `${(mission.currentXP / mission.goalXP) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {Math.round((mission.currentXP / mission.goalXP) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default CoopMission;

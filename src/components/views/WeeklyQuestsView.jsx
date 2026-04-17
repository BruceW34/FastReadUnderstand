import React, { useEffect, useState } from 'react';
import { db } from '@/services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export const WeeklyQuestsView = ({ user, addToast }) => {
  const [loading, setLoading] = useState(true);
  const [weeklyPlans, setWeeklyPlans] = useState({});
  const [currentWeek, setCurrentWeek] = useState(1);
  const [expandedStage, setExpandedStage] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [weeks, setWeeks] = useState([]);

  const STAGES = [
    { id: 1, name: 'Başlangıç', icon: '🌱', color: '#10b981' },
    { id: 2, name: 'Gelişim', icon: '📈', color: '#3b82f6' },
    { id: 3, name: 'İleri', icon: '🔥', color: '#f59e0b' },
    { id: 4, name: 'Master', icon: '💎', color: '#ec4899' },
  ];

  // Firebase'den hafta planlarını yükle
  useEffect(() => {
    const load = async () => {
      try {
        const docRef = doc(db, 'admin', 'weeklyPlans');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const plans = data.plans || {};
          setWeeklyPlans(plans);

          const weekNumbers = Object.keys(plans)
            .map(Number)
            .sort((a, b) => a - b);
          setWeeks(weekNumbers);

          if (weekNumbers.length > 0) {
            setCurrentWeek(weekNumbers[0]);
          }
        }
      } catch (e) {
        console.error('Hafta planları yüklenemedi:', e);
        addToast?.({ msg: 'Görevler yüklenemedi.', color: '#ef4444' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [addToast]);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        ⏳ Görevler yükleniyor...
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--mu)' }}>
        📭 Henüz görev planı hazırlanmamış. Lütfen sonra tekrar deneyin.
      </div>
    );
  }

  const currentWeekData = weeklyPlans[currentWeek];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Başlık */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--fg)', marginBottom: '8px' }}>
          📅 {currentWeek}. Hafta Görevleri
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--mu)' }}>
          Bu haftanın çalışmalarını tamamla ve ilerle
        </p>
      </div>

      {/* Hafta Seçici */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {weeks.map((week) => (
          <button
            key={week}
            onClick={() => {
              setCurrentWeek(week);
              setExpandedStage(null);
            }}
            style={{
              padding: '10px 16px',
              background: currentWeek === week ? 'var(--ac)' : 'rgba(0,0,0,0.2)',
              color: currentWeek === week ? '#fff' : 'var(--fg)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            📆 Hafta {week}
          </button>
        ))}
      </div>

      {/* Aşamalar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {STAGES.map((stage) => {
          const stageData = currentWeekData?.[stage.id];
          const isExpanded = expandedStage === stage.id;
          const totalGoals = stageData?.chapters?.reduce((sum, ch) => sum + (ch.goals?.length || 0), 0) || 0;

          return (
            <div
              key={stage.id}
              style={{
                border: `2px solid ${stage.color}`,
                borderRadius: '12px',
                overflow: 'hidden',
                background: stage.color + '08',
              }}
            >
              {/* Aşama Başlığı */}
              <button
                onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: stage.color + '20',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{stage.icon}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, color: 'var(--fg)' }}>
                      {stage.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--mu)' }}>
                      {stageData?.chapters?.length || 0} bölüm • {totalGoals} görev
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '16px' }}>{isExpanded ? '▼' : '▶'}</span>
              </button>

              {/* Bölümler ve Görevler */}
              {isExpanded && stageData?.chapters && (
                <div style={{ padding: '16px', borderTop: `1px solid ${stage.color}40`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {stageData.chapters.map((chapter, chIdx) => (
                    <div
                      key={chIdx}
                      style={{
                        padding: '12px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        border: `1px solid ${chapter.moduleId ? '#10b981' : '#ef4444'}40`,
                      }}
                    >
                      {/* Modül Adı */}
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '13px',
                          marginBottom: '12px',
                          color: 'var(--ac)',
                        }}
                      >
                        {chapter.moduleName || '(Modül seçilmedi)'}
                      </div>

                      {/* Görevler Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
                        {chapter.goals?.map((goal, goalIdx) => (
                          <button
                            key={goalIdx}
                            onClick={() => setSelectedGoal({ stage, chapter, chIdx, goal, goalIdx })}
                            style={{
                              padding: '12px',
                              background: 'rgba(255,255,255,0.1)',
                              border: '1px solid var(--bd)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              textAlign: 'left',
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(255,255,255,0.15)';
                              e.target.style.borderColor = 'var(--ac)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(255,255,255,0.1)';
                              e.target.style.borderColor = 'var(--bd)';
                            }}
                          >
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ac)', marginBottom: '4px' }}>
                              Görev {goal.order}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--fg)', marginBottom: '6px', minHeight: '18px', lineHeight: '1.3' }}>
                              {goal.title || '(İsim eklenecek)'}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', fontSize: '10px', color: 'var(--mu)' }}>
                              <span>🎯 Lvl {goal.difficulty}</span>
                              <span>⚡ {goal.targetWPM} WPM</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Görev Detay Modal */}
      {selectedGoal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setSelectedGoal(null)}
        >
          <div
            style={{
              background: 'var(--bg)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ac)', marginBottom: '4px' }}>
                  {selectedGoal.chapter.moduleName}
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--fg)' }}>
                  {selectedGoal.goal.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedGoal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--fg)',
                }}
              >
                ✕
              </button>
            </div>

            {/* Açıklama */}
            {selectedGoal.goal.description && (
              <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <p style={{ fontSize: '13px', color: 'var(--fg)', lineHeight: '1.6' }}>
                  {selectedGoal.goal.description}
                </p>
              </div>
            )}

            {/* İstatistikler */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ fontSize: '11px', color: 'var(--mu)', marginBottom: '4px' }}>Zorluk Seviyesi</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>
                  🎯 {selectedGoal.goal.difficulty}/5
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <div style={{ fontSize: '11px', color: 'var(--mu)', marginBottom: '4px' }}>Hedef Hız</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#3b82f6' }}>
                  ⚡ {selectedGoal.goal.targetWPM} WPM
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <div style={{ fontSize: '11px', color: 'var(--mu)', marginBottom: '4px' }}>Süre</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b' }}>
                  ⏱️ {selectedGoal.goal.duration}s
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '8px', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                <div style={{ fontSize: '11px', color: 'var(--mu)', marginBottom: '4px' }}>Tekrar</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#ec4899' }}>
                  🔄 {selectedGoal.goal.reps}x
                </div>
              </div>
            </div>

            {/* Başlat Butonu */}
            <button
              onClick={() => {
                addToast?.({ msg: '🎮 Oyun başlatılıyor...', color: '#3b82f6' });
                // Burada gerçek oyun başlatma kodu gelecek
                setSelectedGoal(null);
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--ac)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              ▶️ Görevi Başlat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

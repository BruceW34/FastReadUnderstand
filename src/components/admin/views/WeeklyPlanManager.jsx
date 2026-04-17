import React, { useEffect, useState } from 'react';
import { db } from '@/services/firebase';
import { doc, getDoc, setDoc, deleteField, Timestamp } from 'firebase/firestore';

const STAGES = [
  { id: 1, name: 'Başlangıç', icon: '🌱', color: '#10b981' },
  { id: 2, name: 'Gelişim', icon: '📈', color: '#3b82f6' },
  { id: 3, name: 'İleri', icon: '🔥', color: '#f59e0b' },
  { id: 4, name: 'Master', icon: '💎', color: '#ec4899' },
];

const MODULES = [
  { id: 'flash', name: '⚡ Flash Okuma', color: '#7c3aed' },
  { id: 'guided', name: '📖 Kılavuzlu Okuma', color: '#7c3aed' },
  { id: 'regress', name: '🚫 Regresyon Engeli', color: '#7c3aed' },
  { id: 'vert', name: '↕️ Dikey Okuma', color: '#0891b2' },
  { id: 'eye', name: '👁️ Göz Jimi', color: '#0891b2' },
  { id: 'peripheral', name: '🎯 Görüş Alanı', color: '#0891b2' },
  { id: 'schulte', name: '🎲 Schulte Tablosu', color: '#d97706' },
  { id: 'memory', name: '🧠 Görsel Hafıza', color: '#d97706' },
];

const DIFFICULTY_MODES = [
  { id: 1, name: 'Çok Kolay', icon: '😊' },
  { id: 2, name: 'Kolay', icon: '🙂' },
  { id: 3, name: 'Normal', icon: '😐' },
  { id: 4, name: 'Zor', icon: '😰' },
  { id: 5, name: 'Çok Zor', icon: '😱' },
];

export const WeeklyPlanManager = ({ addToast }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // UI State
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [weeks, setWeeks] = useState([]);
  const [expandedStage, setExpandedStage] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);

  // Data State
  const [weeklyPlans, setWeeklyPlans] = useState({});

  // Firestore'dan hafta planlarını yükle
  useEffect(() => {
    const load = async () => {
      try {
        const docRef = doc(db, 'admin', 'weeklyPlans');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setWeeklyPlans(data.plans || {});
          const weekNumbers = Object.keys(data.plans || {})
            .map(Number)
            .sort((a, b) => a - b);
          setWeeks(weekNumbers);
          if (weekNumbers.length === 0) setWeeks([1]);
        } else {
          setWeeks([1]);
        }
      } catch (e) {
        console.error(e);
        addToast?.({ msg: 'Hafta planları yüklenemedi.', color: '#ef4444' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [addToast]);

  // Hafta verilerini getir veya oluştur
  const getWeekData = (weekNum) => {
    if (!weeklyPlans[weekNum]) {
      const newWeek = {};
      STAGES.forEach((stage) => {
        newWeek[stage.id] = {
          stageId: stage.id,
          stageName: stage.name,
          chapters: [], // { moduleId, moduleName, goals: [{ order, title, desc, difficulty, targetWPM, ... }] }
        };
      });
      return newWeek;
    }
    return weeklyPlans[weekNum];
  };

  // Yeni bölüm (chapter) ekle
  const addChapter = (weekNum, stageId) => {
    setWeeklyPlans((prev) => {
      const updated = { ...prev };
      if (!updated[weekNum]) {
        updated[weekNum] = getWeekData(weekNum);
      }
      const stageData = updated[weekNum][stageId];
      if (!stageData.chapters) stageData.chapters = [];

      stageData.chapters.push({
        moduleId: '',
        moduleName: '',
        goals: Array.from({ length: 5 }, (_, i) => ({
          order: i + 1,
          title: '',
          description: '',
          difficulty: 3,
          targetWPM: 300,
          duration: 60,
          restTime: 10,
          reps: 1,
        })),
      });

      return updated;
    });
  };

  // Bölüm sil
  const deleteChapter = (weekNum, stageId, chapterIdx) => {
    setWeeklyPlans((prev) => {
      const updated = { ...prev };
      updated[weekNum][stageId].chapters.splice(chapterIdx, 1);
      return updated;
    });
  };

  // Modülü seç
  const setModuleForChapter = (weekNum, stageId, chapterIdx, moduleId) => {
    setWeeklyPlans((prev) => {
      const updated = { ...prev };
      const module = MODULES.find((m) => m.id === moduleId);
      updated[weekNum][stageId].chapters[chapterIdx].moduleId = moduleId;
      updated[weekNum][stageId].chapters[chapterIdx].moduleName = module?.name || '';
      return updated;
    });
  };

  // Görevi güncelle
  const updateGoal = (weekNum, stageId, chapterIdx, goalIdx, field, value) => {
    setWeeklyPlans((prev) => {
      const updated = { ...prev };
      const goal = updated[weekNum][stageId].chapters[chapterIdx].goals[goalIdx];
      goal[field] = field.includes('difficulty') || field.includes('WPM') || field.includes('duration')
        ? parseInt(value) || 0
        : value;
      return updated;
    });
  };

  // Yeni hafta ekle
  const addWeek = () => {
    const nextWeek = Math.max(...weeks, 0) + 1;
    setWeeklyPlans((prev) => ({
      ...prev,
      [nextWeek]: getWeekData(nextWeek),
    }));
    setWeeks((prev) => [...prev, nextWeek].sort((a, b) => a - b));
    setSelectedWeek(nextWeek);
  };

  // Hafta sil
  const deleteWeek = (weekNum) => {
    setWeeklyPlans((prev) => {
      const updated = { ...prev };
      delete updated[weekNum];
      return updated;
    });
    setWeeks((prev) => prev.filter((w) => w !== weekNum));
    if (selectedWeek === weekNum) {
      setSelectedWeek(weeks[0]);
    }
  };

  // Kaydet
  const saveAllPlans = async () => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'admin', 'weeklyPlans'),
        {
          plans: weeklyPlans,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );
      addToast?.({ msg: '✅ Tüm hafta planları kaydedildi!', color: '#10b981' });
    } catch (e) {
      console.error(e);
      addToast?.({ msg: '❌ Kaydetme başarısız.', color: '#ef4444' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>⏳ Yükleniyor...</div>;

  const currentWeekData = getWeekData(selectedWeek);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Başlık */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--fg)' }}>
            📅 Hafta Bazlı Planlama
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--mu)', marginTop: '4px' }}>
            Haftaları seç, aşamaları yapılandır, bölüm ekle, görevleri ata
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn bp"
            onClick={addWeek}
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            ➕ Yeni Hafta
          </button>
          <button
            className="btn bp"
            disabled={saving}
            onClick={saveAllPlans}
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            {saving ? '⏳ Kaydediliyor...' : '💾 Tümünü Kaydet'}
          </button>
        </div>
      </div>

      {/* Hafta Seçici */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {weeks.map((week) => (
          <div key={week} style={{ position: 'relative' }}>
            <button
              onClick={() => setSelectedWeek(week)}
              style={{
                padding: '10px 16px',
                background: selectedWeek === week ? '#3b82f6' : 'rgba(0,0,0,0.2)',
                color: selectedWeek === week ? '#fff' : 'var(--fg)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              📆 Hafta {week}
            </button>
            {weeks.length > 1 && (
              <button
                onClick={() => deleteWeek(week)}
                title="Hafta sil"
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Aşamalar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {STAGES.map((stage) => {
          const stageData = currentWeekData[stage.id];
          const isExpanded = expandedStage === stage.id;

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
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{stage.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--fg)' }}>
                      {stage.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--mu)' }}>
                      {stageData.chapters?.length || 0} bölüm
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '12px' }}>{isExpanded ? '▼' : '▶'}</span>
              </button>

              {/* Açılabilir İçerik */}
              {isExpanded && (
                <div style={{ padding: '16px', borderTop: `1px solid ${stage.color}40` }}>
                  {/* Bölüm Listesi */}
                  {stageData.chapters?.map((chapter, chIdx) => (
                    <div
                      key={chIdx}
                      style={{
                        marginBottom: '16px',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        border: `1px solid ${chapter.moduleId ? '#10b981' : '#ef4444'}40`,
                      }}
                    >
                      {/* Bölüm Başı - Modül Seçimi */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                        <select
                          value={chapter.moduleId || ''}
                          onChange={(e) => setModuleForChapter(selectedWeek, stage.id, chIdx, e.target.value)}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: 'var(--bg)',
                            color: 'var(--fg)',
                            border: '1px solid var(--bd)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          <option value="">-- Modülü Seç --</option>
                          {MODULES.map((mod) => (
                            <option key={mod.id} value={mod.id}>
                              {mod.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => deleteChapter(selectedWeek, stage.id, chIdx)}
                          style={{
                            padding: '6px 12px',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          🗑️ Sil
                        </button>
                      </div>

                      {/* Görevler Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                        {chapter.goals?.map((goal, goalIdx) => (
                          <div
                            key={goalIdx}
                            style={{
                              padding: '10px',
                              background: 'rgba(255,255,255,0.05)',
                              borderRadius: '6px',
                              border: '1px solid rgba(255,255,255,0.1)',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onClick={() =>
                              setEditingGoal({
                                week: selectedWeek,
                                stage: stage.id,
                                chapter: chIdx,
                                goal: goalIdx,
                              })
                            }
                          >
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ac)', marginBottom: '4px' }}>
                              Görev {goal.order}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--fg)', marginBottom: '4px', minHeight: '18px' }}>
                              {goal.title || '(Başlık ekle)'}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                gap: '4px',
                                fontSize: '10px',
                                color: 'var(--mu)',
                              }}
                            >
                              <span>🎯 Zorluk {goal.difficulty}</span>
                              <span>WPM {goal.targetWPM}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Bölüm Ekle */}
                  <button
                    onClick={() => addChapter(selectedWeek, stage.id)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: stage.color + '30',
                      color: stage.color,
                      border: `1px dashed ${stage.color}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '12px',
                    }}
                  >
                    ➕ Bölüm Ekle
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Görev Editor Modal */}
      {editingGoal && (
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
          onClick={() => setEditingGoal(null)}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                📝 Görev {editingGoal.goal + 1} Düzenleme
              </h3>
              <button
                onClick={() => setEditingGoal(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Form Alanları */}
            {editingGoal && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mu)' }}>Başlık</label>
                  <input
                    type="text"
                    value={
                      weeklyPlans[editingGoal.week][editingGoal.stage].chapters[editingGoal.chapter].goals[editingGoal.goal].title
                    }
                    onChange={(e) =>
                      updateGoal(
                        editingGoal.week,
                        editingGoal.stage,
                        editingGoal.chapter,
                        editingGoal.goal,
                        'title',
                        e.target.value
                      )
                    }
                    placeholder="Görev başlığını gir"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg)',
                      border: '1px solid var(--bd)',
                      borderRadius: '6px',
                      color: 'var(--fg)',
                      marginTop: '4px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mu)' }}>Açıklama</label>
                  <textarea
                    value={
                      weeklyPlans[editingGoal.week][editingGoal.stage].chapters[editingGoal.chapter].goals[editingGoal.goal]
                        .description
                    }
                    onChange={(e) =>
                      updateGoal(
                        editingGoal.week,
                        editingGoal.stage,
                        editingGoal.chapter,
                        editingGoal.goal,
                        'description',
                        e.target.value
                      )
                    }
                    placeholder="Görev açıklaması"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg)',
                      border: '1px solid var(--bd)',
                      borderRadius: '6px',
                      color: 'var(--fg)',
                      minHeight: '80px',
                      marginTop: '4px',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mu)' }}>
                      🎯 Zorluk (1-5)
                    </label>
                    <select
                      value={
                        weeklyPlans[editingGoal.week][editingGoal.stage].chapters[editingGoal.chapter].goals[editingGoal.goal]
                          .difficulty
                      }
                      onChange={(e) =>
                        updateGoal(
                          editingGoal.week,
                          editingGoal.stage,
                          editingGoal.chapter,
                          editingGoal.goal,
                          'difficulty',
                          e.target.value
                        )
                      }
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'var(--bg)',
                        border: '1px solid var(--bd)',
                        borderRadius: '6px',
                        color: 'var(--fg)',
                        marginTop: '4px',
                      }}
                    >
                      {DIFFICULTY_MODES.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.icon} {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mu)' }}>
                      Hedef WPM
                    </label>
                    <input
                      type="number"
                      value={
                        weeklyPlans[editingGoal.week][editingGoal.stage].chapters[editingGoal.chapter].goals[editingGoal.goal]
                          .targetWPM
                      }
                      onChange={(e) =>
                        updateGoal(
                          editingGoal.week,
                          editingGoal.stage,
                          editingGoal.chapter,
                          editingGoal.goal,
                          'targetWPM',
                          e.target.value
                        )
                      }
                      min="100"
                      max="6000"
                      step="50"
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'var(--bg)',
                        border: '1px solid var(--bd)',
                        borderRadius: '6px',
                        color: 'var(--fg)',
                        marginTop: '4px',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mu)' }}>
                      Süre (sn)
                    </label>
                    <input
                      type="number"
                      value={
                        weeklyPlans[editingGoal.week][editingGoal.stage].chapters[editingGoal.chapter].goals[editingGoal.goal]
                          .duration
                      }
                      onChange={(e) =>
                        updateGoal(
                          editingGoal.week,
                          editingGoal.stage,
                          editingGoal.chapter,
                          editingGoal.goal,
                          'duration',
                          e.target.value
                        )
                      }
                      min="30"
                      max="7200"
                      step="10"
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'var(--bg)',
                        border: '1px solid var(--bd)',
                        borderRadius: '6px',
                        color: 'var(--fg)',
                        marginTop: '4px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mu)' }}>
                      Dinlenme (sn)
                    </label>
                    <input
                      type="number"
                      value={
                        weeklyPlans[editingGoal.week][editingGoal.stage].chapters[editingGoal.chapter].goals[editingGoal.goal]
                          .restTime
                      }
                      onChange={(e) =>
                        updateGoal(
                          editingGoal.week,
                          editingGoal.stage,
                          editingGoal.chapter,
                          editingGoal.goal,
                          'restTime',
                          e.target.value
                        )
                      }
                      min="5"
                      max="300"
                      step="5"
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'var(--bg)',
                        border: '1px solid var(--bd)',
                        borderRadius: '6px',
                        color: 'var(--fg)',
                        marginTop: '4px',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mu)' }}>
                    Tekrar Sayısı
                  </label>
                  <input
                    type="number"
                    value={
                      weeklyPlans[editingGoal.week][editingGoal.stage].chapters[editingGoal.chapter].goals[editingGoal.goal]
                        .reps
                    }
                    onChange={(e) =>
                      updateGoal(
                        editingGoal.week,
                        editingGoal.stage,
                        editingGoal.chapter,
                        editingGoal.goal,
                        'reps',
                        e.target.value
                      )
                    }
                    min="1"
                    max="20"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg)',
                      border: '1px solid var(--bd)',
                      borderRadius: '6px',
                      color: 'var(--fg)',
                      marginTop: '4px',
                    }}
                  />
                </div>

                <button
                  onClick={() => {
                    saveAllPlans();
                    setEditingGoal(null);
                  }}
                  style={{
                    padding: '10px',
                    background: 'var(--ac)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '12px',
                  }}
                >
                  ✅ Kaydet & Kapat
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

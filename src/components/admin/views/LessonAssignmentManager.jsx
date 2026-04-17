import React, { useEffect, useState } from 'react';
import { db } from '@/services/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

// Eğitim derslerinin listesi
const AVAILABLE_LESSONS = [
  {
    id: 'flash',
    icon: '⚡',
    label: 'Flash Okuma',
    desc: 'RSVP ile zihin hızına ulaş',
    color: '#7c3aed',
  },
  {
    id: 'guided',
    icon: '📖',
    label: 'Kılavuzlu Okuma',
    desc: 'Ritim ve tempo ile akar gibi oku',
    color: '#7c3aed',
  },
  {
    id: 'regress',
    icon: '🚫',
    label: 'Regresyon Engeli',
    desc: 'Bir kez oku, tam anla',
    color: '#7c3aed',
  },
  {
    id: 'vert',
    icon: '↕️',
    label: 'Dikey Okuma',
    desc: 'Görüş alanını genişlet',
    color: '#0891b2',
  },
  {
    id: 'eye',
    icon: '👁️',
    label: 'Göz Jimi',
    desc: 'Saccade eğitimi ile göz kasları',
    color: '#0891b2',
  },
  {
    id: 'peripheral',
    icon: '🎯',
    label: 'Görüş Alanı',
    desc: 'Çevre görüşünü geliştir',
    color: '#0891b2',
  },
  {
    id: 'schulte',
    icon: '🎲',
    label: 'Schulte Tablosu',
    desc: 'Periferik görüş ve konsantrasyon',
    color: '#d97706',
  },
  {
    id: 'memory',
    icon: '🧠',
    label: 'Görsel Hafıza',
    desc: 'Kısa süreli belleği güçlendir',
    color: '#d97706',
  },
];

export const LessonAssignmentManager = ({ addToast }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedLesson, setDraggedLesson] = useState(null);
  const [editingDuration, setEditingDuration] = useState(null);
  
  const [trainingCourses, setTrainingCourses] = useState([
    {
      id: 'course-1',
      name: 'Hızlı Okuma Başlangıç',
      desc: '3 haftada temel hız kazanım',
      icon: '🚀',
      lessons: [],
    },
    {
      id: 'course-2',
      name: 'Görüş Alanı Ekspansiyon',
      desc: 'Periferik görüş geliştirme',
      icon: '👁️',
      lessons: [],
    },
    {
      id: 'course-3',
      name: 'Zihin Hızı Atılımı',
      desc: 'Schulte ve hafıza antrenmanları',
      icon: '🧠',
      lessons: [],
    },
  ]);

  // Firestore'dan konfigürasyonu yükle
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const ref = doc(db, 'admin', 'lessonAssignments');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.trainingCourses && Array.isArray(data.trainingCourses)) {
            setTrainingCourses(data.trainingCourses);
          }
        }
      } catch (e) {
        console.error('Konfigürasyon yüklenemedi:', e);
        addToast?.({ msg: 'Ders atama ayarları yüklenemedi.', color: '#ef4444' });
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [addToast]);

  // Drag başla
  const handleDragStart = (e, lesson) => {
    setDraggedLesson(lesson);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Drag over - kursu kabul et
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Drop - dersi kursa at
  const handleDrop = (e, courseId) => {
    e.preventDefault();
    
    if (!draggedLesson) return;

    setTrainingCourses((prev) =>
      prev.map((course) => {
        if (course.id === courseId) {
          // Aynı dersi tekrar ekleme
          if (course.lessons.some((l) => l.id === draggedLesson.id)) {
            return course;
          }
          return {
            ...course,
            lessons: [
              ...course.lessons,
              {
                ...draggedLesson,
                assignmentId: `${draggedLesson.id}-${Date.now()}`,
                duration: 5, // Dakika olarak varsayılan süre
                order: course.lessons.length + 1,
              },
            ],
          };
        }
        return course;
      })
    );
    
    setDraggedLesson(null);
  };

  // Dersi kursdan çıkar
  const removeLesson = (courseId, assignmentId) => {
    setTrainingCourses((prev) =>
      prev.map((course) => {
        if (course.id === courseId) {
          return {
            ...course,
            lessons: course.lessons.filter((l) => l.assignmentId !== assignmentId),
          };
        }
        return course;
      })
    );
  };

  // Süre güncelle
  const updateDuration = (courseId, assignmentId, newDuration) => {
    setTrainingCourses((prev) =>
      prev.map((course) => {
        if (course.id === courseId) {
          return {
            ...course,
            lessons: course.lessons.map((lesson) => {
              if (lesson.assignmentId === assignmentId) {
                return { ...lesson, duration: parseInt(newDuration) || 1 };
              }
              return lesson;
            }),
          };
        }
        return course;
      })
    );
  };

  // Kursu sıradaki öğeyi taşı
  const moveLesson = (courseId, assignmentId, direction) => {
    setTrainingCourses((prev) =>
      prev.map((course) => {
        if (course.id === courseId) {
          const lessons = [...course.lessons];
          const idx = lessons.findIndex((l) => l.assignmentId === assignmentId);
          if (idx === -1) return course;

          if (direction === 'up' && idx > 0) {
            [lessons[idx], lessons[idx - 1]] = [lessons[idx - 1], lessons[idx]];
          } else if (direction === 'down' && idx < lessons.length - 1) {
            [lessons[idx], lessons[idx + 1]] = [lessons[idx + 1], lessons[idx]];
          }

          return {
            ...course,
            lessons: lessons.map((l, i) => ({ ...l, order: i + 1 })),
          };
        }
        return course;
      })
    );
  };

  // Tümünü kaydet
  const saveConfig = async () => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'admin', 'lessonAssignments'),
        { trainingCourses, updatedAt: new Date() },
        { merge: true }
      );
      addToast?.({ msg: 'Ders atamalar başarıyla kaydedildi!', color: '#10b981' });
    } catch (e) {
      console.error(e);
      addToast?.({ msg: 'Kaydetme başarısız oldu.', color: '#ef4444' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Yükleniyor...</div>;

  // Atanmış derslerin ID'lerini al
  const assignedLessonIds = new Set(
    trainingCourses.flatMap((course) => course.lessons.map((l) => l.id))
  );

  // Henüz atanmamış dersler
  const unassignedLessons = AVAILABLE_LESSONS.filter(
    (lesson) => !assignedLessonIds.has(lesson.id)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Başlık */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--fg)' }}>
            🎯 Ders Atama Yönetimi
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--mu)', marginTop: '4px' }}>
            Dersleri eğitim kurslarına sürükle-bırakla atayın ve sürelerini ayarlayın
          </p>
        </div>
        <button 
          className="btn bp" 
          disabled={saving} 
          onClick={saveConfig}
          style={{ padding: '8px 16px' }}
        >
          {saving ? '⏳ Kaydediliyor...' : '💾 Tümünü Kaydet'}
        </button>
      </div>

      {/* Ana Düzen - Dersler ve Kurslar */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        
        {/* Sol: Kullanılabilir Dersler */}
        <div className="card" style={{ padding: '20px', height: 'fit-content', background: 'rgba(139, 92, 246, 0.05)' }}>
          <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '16px', color: 'var(--ac)' }}>
            📚 Kullanılabilir Dersler
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {unassignedLessons.length > 0 ? (
              unassignedLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lesson)}
                  style={{
                    padding: '12px',
                    background: lesson.color + '20',
                    border: `2px solid ${lesson.color}`,
                    borderRadius: '8px',
                    cursor: 'grab',
                    transition: 'all 0.2s',
                    userSelect: 'none',
                  }}
                  onDragEnd={() => setDraggedLesson(null)}
                >
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>
                    {lesson.icon} {lesson.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--mu)', marginTop: '2px' }}>
                    {lesson.desc}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--mu)', textAlign: 'center', padding: '16px' }}>
                ✅ Tüm dersler atanmıştır!
              </div>
            )}
          </div>
        </div>

        {/* Sağ: Eğitim Kursları */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {trainingCourses.map((course) => (
            <div
              key={course.id}
              className="card"
              style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '24px' }}>{course.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--fg)' }}>
                    {course.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--mu)' }}>{course.desc}</div>
                </div>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, course.id)}
                style={{
                  padding: '16px',
                  border: '2px dashed var(--ac)',
                  borderRadius: '8px',
                  minHeight: '120px',
                  background: draggedLesson ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {course.lessons.length === 0 ? (
                  <div style={{ color: 'var(--mu)', textAlign: 'center', padding: '32px 16px' }}>
                    📤 Dersleri buraya sürükleyin
                  </div>
                ) : (
                  course.lessons.map((lesson, idx) => (
                    <div
                      key={lesson.assignmentId}
                      style={{
                        padding: '12px',
                        background: lesson.color + '20',
                        border: `2px solid ${lesson.color}`,
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>
                          {idx + 1}. {lesson.icon} {lesson.label}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--mu)', marginTop: '2px' }}>
                          {lesson.desc}
                        </div>
                      </div>

                      {/* Süre Ayarı */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          min="30"
                          max="7200"
                          value={lesson.duration}
                          onChange={(e) =>
                            updateDuration(course.id, lesson.assignmentId, e.target.value)
                          }
                          style={{
                            width: '50px',
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid var(--bd)',
                            background: 'var(--bg)',
                            color: 'var(--fg)',
                            textAlign: 'center',
                            fontWeight: 600,
                          }}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--mu)', minWidth: '30px' }}>
                          sn
                        </div>
                      </div>

                      {/* Kontrol Butonları */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => moveLesson(course.id, lesson.assignmentId, 'up')}
                          disabled={idx === 0}
                          style={{
                            padding: '6px 8px',
                            fontSize: '12px',
                            background: idx === 0 ? 'var(--mu)' : 'var(--ac)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            opacity: idx === 0 ? 0.5 : 1,
                          }}
                        >
                          ⬆️
                        </button>
                        <button
                          onClick={() => moveLesson(course.id, lesson.assignmentId, 'down')}
                          disabled={idx === course.lessons.length - 1}
                          style={{
                            padding: '6px 8px',
                            fontSize: '12px',
                            background: idx === course.lessons.length - 1 ? 'var(--mu)' : 'var(--ac)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: idx === course.lessons.length - 1 ? 'not-allowed' : 'pointer',
                            opacity: idx === course.lessons.length - 1 ? 0.5 : 1,
                          }}
                        >
                          ⬇️
                        </button>
                        <button
                          onClick={() => removeLesson(course.id, lesson.assignmentId)}
                          style={{
                            padding: '6px 8px',
                            fontSize: '12px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Özet */}
              {course.lessons.length > 0 && (
                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--mu)' }}>
                  ⏱️ Toplam süre:{' '}
                  <strong style={{ color: 'var(--ac)' }}>
                    {course.lessons.reduce((sum, l) => sum + l.duration, 0)} saniye ({(course.lessons.reduce((sum, l) => sum + l.duration, 0) / 60).toFixed(1)} dk)
                  </strong>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Alt Bilgi */}
      <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', fontSize: '12px', color: 'var(--mu)' }}>
        💡 <strong>İpucu:</strong> Dersleri sol taraftan sürükleyip eğitim kurslarına bırakın. 
        Sürelerini SANIYE cinsinden ayarlayın, sırasını değiştirin ve kaydettikten sonra uygulamada görüntülenecektir.
      </div>
    </div>
  );
};

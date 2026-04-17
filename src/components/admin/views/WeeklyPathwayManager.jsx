import React, { useEffect, useState } from 'react';
import { db } from '@/services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const STAGES = [
  { id: 1, name: 'Başlangıç', icon: '🌱', color: '#10b981' },
  { id: 2, name: 'Gelişim', icon: '📈', color: '#3b82f6' },
  { id: 3, name: 'İleri', icon: '🔥', color: '#f59e0b' },
  { id: 4, name: 'Master', icon: '💎', color: '#ec4899' },
];

const WEEKS = [1, 2, 3, 4];
const GOALS_PER_WEEK = 5;

const MODULES = [
  { id: 'flash', name: '⚡ Flash Okuma', desc: 'RSVP ile zihin hızına ulaş' },
  { id: 'guided', name: '📖 Kılavuzlu Okuma', desc: 'Ritim ve tempo ile akar gibi oku' },
  { id: 'regress', name: '🚫 Regresyon Engeli', desc: 'Bir kez oku, tam anla' },
  { id: 'vert', name: '↕️ Dikey Okuma', desc: 'Görüş alanını genişlet' },
  { id: 'eye', name: '👁️ Göz Jimi', desc: 'Saccade eğitimi ile göz kasları' },
  { id: 'peripheral', name: '🎯 Görüş Alanı', desc: 'Çevre görüşünü geliştir' },
  { id: 'schulte', name: '🎲 Schulte Tablosu', desc: 'Periferik görüş ve konsantrasyon' },
  { id: 'memory', name: '🧠 Görsel Hafıza', desc: 'Kısa süreli belleği güçlendir' },
];

const DEFAULT_GOAL = {
  order: 1,
  title: '',
  description: '',
  moduleId: '',
  moduleName: '',
  targetWPM: 300,
  difficulty: 3,
};

export const WeeklyPathwayManager = ({ addToast }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Yapı: stageWeeklyGoals[stageId][week][goalIndex]
  const [stageWeeklyGoals, setStageWeeklyGoals] = useState(() => {
    const initial = {};
    STAGES.forEach((stage) => {
      initial[stage.id] = {};
      WEEKS.forEach((week) => {
        initial[stage.id][week] = Array.from({ length: GOALS_PER_WEEK }, (_, idx) => ({
          ...DEFAULT_GOAL,
          order: idx + 1,
        }));
      });
    });
    return initial;
  });

  // Firestore'dan yükle
  useEffect(() => {
    const load = async () => {
      try {
        const ref = doc(db, 'admin', 'weeklyPathwayGoals');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.stageWeeklyGoals) {
            setStageWeeklyGoals(data.stageWeeklyGoals);
          }
        }
      } catch (e) {
        console.error('Haftalık görevler yüklenemedi:', e);
        addToast?.({ msg: 'Haftalık görevler yüklenemedi.', color: '#ef4444' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [addToast]);

  // Görevi güncelle
  const updateGoal = (stageId, week, goalIdx, field, value) => {
    setStageWeeklyGoals((prev) => {
      const stageCopy = { ...prev };
      const weekgoalsCopy = [...stageCopy[stageId][week]];
      
      // Eğer modül seçilirse, moduleName otomatik set et
      const updateData = { [field]: field === 'targetWPM' || field === 'difficulty' || field === 'order' ? parseInt(value) || 0 : value };
      if (field === 'moduleId') {
        const selectedModule = MODULES.find((m) => m.id === value);
        if (selectedModule) {
          updateData.moduleName = selectedModule.name;
          // Otomatik title oluştur
          if (!weekgoalsCopy[goalIdx].title || weekgoalsCopy[goalIdx].title === '') {
            updateData.title = selectedModule.name;
          }
        }
      }
      
      weekgoalsCopy[goalIdx] = { ...weekgoalsCopy[goalIdx], ...updateData };
      stageCopy[stageId][week] = weekgoalsCopy;
      return stageCopy;
    });
  };

  // Kaydet
  const saveConfig = async () => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'admin', 'weeklyPathwayGoals'),
        { stageWeeklyGoals, updatedAt: new Date() },
        { merge: true }
      );
      addToast?.({ msg: 'Haftalık görevler kaydedildi!', color: '#10b981' });
    } catch (e) {
      console.error(e);
      addToast?.({ msg: 'Kaydetme başarısız.', color: '#ef4444' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Yükleniyor...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Başlık */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--fg)' }}>
            📅 Haftalık Görev Aşamaları
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--mu)', marginTop: '4px' }}>
            4 Aşama × 4 Hafta × 5 Görev = 80 Toplam Görev Yapısı
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

      {/* Özet */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
        }}
      >
        {STAGES.map((stage) => (
          <div
            key={stage.id}
            style={{
              padding: '16px',
              background: stage.color + '15',
              border: `2px solid ${stage.color}`,
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '28px' }}>{stage.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '6px', color: 'var(--fg)' }}>
              {stage.name}
            </div>
            <div style={{ fontSize: '11px', color: stage.color, fontWeight: 600, marginTop: '4px' }}>
              4 hafta · 20 görev
            </div>
          </div>
        ))}
      </div>

      {/* Aşamalar */}
      {STAGES.map((stage) => (
        <div key={stage.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '12px', borderBottom: `2px solid ${stage.color}` }}>
            <div style={{ fontSize: '32px' }}>{stage.icon}</div>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--fg)' }}>
                Aşama {stage.id}: {stage.name}
              </h3>
            </div>
          </div>

          {/* Haftalar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
            {WEEKS.map((week) => (
              <div
                key={week}
                className="card"
                style={{
                  padding: '16px',
                  background: stage.color + '10',
                  border: `1px solid ${stage.color}40`,
                  borderRadius: '8px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '14px', color: stage.color, marginBottom: '14px' }}>
                  📅 Hafta {week}
                </div>

                {/* Görevler */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {stageWeeklyGoals[stage.id][week].map((goal, goalIdx) => (
                    <div key={goalIdx} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                      {/* Modül Seçimi */}
                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ fontSize: '10px', color: 'var(--mu)', display: 'block', marginBottom: '4px' }}>📚 Modül Seç</label>
                        <select
                          value={goal.moduleId || ''}
                          onChange={(e) => updateGoal(stage.id, week, goalIdx, 'moduleId', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid var(--bd)',
                            background: 'var(--bg)',
                            color: goal.moduleId ? 'var(--ac)' : 'var(--mu)',
                            fontSize: '11px',
                            fontWeight: goal.moduleId ? 600 : 400,
                            cursor: 'pointer',
                          }}
                        >
                          <option value="">-- Modül Seçiniz --</option>
                          {MODULES.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Sıra ve Başlık */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={goal.order}
                          onChange={(e) => updateGoal(stage.id, week, goalIdx, 'order', e.target.value)}
                          style={{
                            width: '45px',
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid var(--bd)',
                            background: 'var(--bg)',
                            color: 'var(--fg)',
                            textAlign: 'center',
                            fontWeight: 600,
                            fontSize: '12px',
                          }}
                        />
                        <input
                          type="text"
                          placeholder={goal.moduleName || `Görev ${goalIdx + 1}`}
                          value={goal.title}
                          onChange={(e) => updateGoal(stage.id, week, goalIdx, 'title', e.target.value)}
                          style={{
                            flex: 1,
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid var(--bd)',
                            background: 'var(--bg)',
                            color: 'var(--fg)',
                            fontSize: '12px',
                          }}
                        />
                      </div>

                      {/* Açıklama */}
                      <input
                        type="text"
                        placeholder="Açıklama"
                        value={goal.description}
                        onChange={(e) => updateGoal(stage.id, week, goalIdx, 'description', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          marginBottom: '8px',
                          borderRadius: '4px',
                          border: '1px solid var(--bd)',
                          background: 'var(--bg)',
                          color: 'var(--fg)',
                          fontSize: '11px',
                        }}
                      />

                      {/* WPM ve Zorluk */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--mu)' }}>🎯 WPM</label>
                          <input
                            type="number"
                            min="100"
                            max="5000"
                            step="50"
                            value={goal.targetWPM}
                            onChange={(e) => updateGoal(stage.id, week, goalIdx, 'targetWPM', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px',
                              marginTop: '2px',
                              borderRadius: '4px',
                              border: '1px solid var(--bd)',
                              background: 'var(--bg)',
                              color: 'var(--fg)',
                              fontSize: '11px',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--mu)' }}>🎚️ Zorluk</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={goal.difficulty}
                            onChange={(e) => updateGoal(stage.id, week, goalIdx, 'difficulty', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px',
                              marginTop: '2px',
                              borderRadius: '4px',
                              border: '1px solid var(--bd)',
                              background: 'var(--bg)',
                              color: 'var(--fg)',
                              fontSize: '11px',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Hafta özeti */}
                <div style={{ marginTop: '10px', padding: '8px', background: stage.color + '10', borderRadius: '4px', fontSize: '10px', color: 'var(--mu)' }}>
                  <strong>WPM Aralığı:</strong> {Math.min(...stageWeeklyGoals[stage.id][week].map((g) => g.targetWPM))} - {Math.max(...stageWeeklyGoals[stage.id][week].map((g) => g.targetWPM))} |{' '}
                  <strong>Zorluk:</strong> {Math.min(...stageWeeklyGoals[stage.id][week].map((g) => g.difficulty))} - {Math.max(...stageWeeklyGoals[stage.id][week].map((g) => g.difficulty))}
                </div>
              </div>
            ))}
          </div>

          {/* Aşama özeti */}
          <div style={{ marginTop: '16px', padding: '12px', background: stage.color + '10', borderRadius: '8px', fontSize: '12px', color: 'var(--mu)' }}>
            <strong>Aşama Özeti:</strong> Min WPM:{' '}
            {Math.min(
              ...WEEKS.flatMap((w) =>
                stageWeeklyGoals[stage.id][w].map((g) => g.targetWPM)
              )
            )}{' '}
            | Max WPM:{' '}
            {Math.max(
              ...WEEKS.flatMap((w) =>
                stageWeeklyGoals[stage.id][w].map((g) => g.targetWPM)
              )
            )}{' '}
            | Ortalama Zorluk:{' '}
            {(
              WEEKS.flatMap((w) =>
                stageWeeklyGoals[stage.id][w].map((g) => g.difficulty)
              ).reduce((a, b) => a + b, 0) /
              (4 * 5)
            ).toFixed(1)}
          </div>
        </div>
      ))}

      {/* Alt Bilgi */}
      <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', fontSize: '12px', color: 'var(--mu)' }}>
        📊 <strong>Yapı:</strong> 4 Aşama × 4 Hafta × 5 Görev = 80 Toplam Yapı
        <br />
        💡 <strong>Tavsiye:</strong> Her hafta WPM hedefleri ve zorluk kademeli olarak artmalıdır
        <br />
        ✅ <strong>Kaydet:</strong> Ayarlar Firestore'a kaydedilir ve uygulamada otomatik yüklenir
      </div>
    </div>
  );
};

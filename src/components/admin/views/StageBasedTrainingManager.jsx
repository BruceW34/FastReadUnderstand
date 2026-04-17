import React, { useEffect, useState } from 'react';
import { db } from '@/services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { TRAINING_CONFIG } from '@/data/trainingConfig';

const STAGES = [
  { id: 1, name: 'Başlangıç', icon: '🌱', color: '#10b981', desc: 'Temel beceriler' },
  { id: 2, name: 'Gelişim', icon: '📈', color: '#3b82f6', desc: 'Orta zorluk' },
  { id: 3, name: 'İleri', icon: '🔥', color: '#f59e0b', desc: 'Yüksek zorluk' },
  { id: 4, name: 'Master', icon: '💎', color: '#ec4899', desc: 'Harita seviyesi' },
];

// Tüm kullanılabilir dersler
const AVAILABLE_LESSONS = Object.entries(TRAINING_CONFIG).map(([id, config]) => ({
  id,
  ...config,
}));

export const StageBasedTrainingManager = ({ addToast }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [stageConfig, setStageConfig] = useState(() =>
    Object.fromEntries(
      STAGES.map((s) => [
        s.id,
        Array.from({ length: 1 }, (_, idx) => ({
          id: idx + 1,
          lessonId: '',
        })),
      ])
    )
  );

  // Firestore'dan yükle
  useEffect(() => {
    const load = async () => {
      try {
        const ref = doc(db, 'admin', 'stageBasedTraining');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.stages) {
            setStageConfig(data.stages);
          }
        }
      } catch (e) {
        console.error('Config yüklenemedi:', e);
        addToast?.({ msg: 'Aşama ayarları yüklenemedi.', color: '#ef4444' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [addToast]);

  // Antrenman güncelle
  const updateTraining = (stageId, trainingIdx, field, value) => {
    setStageConfig((prev) => {
      const stageTrain = [...prev[stageId]];
      const current = stageTrain[trainingIdx] || {};
      stageTrain[trainingIdx] = {
        ...current,
        [field]: 
          typeof value === 'string' && !isNaN(value) && field !== 'lessonId'
            ? parseInt(value)
            : value,
      };
      return { ...prev, [stageId]: stageTrain };
    });
  };

  // Ders seçilince ayarları başlat
  const initializeTrainingWithLesson = (stageId, trainingIdx, lessonId) => {
    const lessonConfig = TRAINING_CONFIG[lessonId];
    if (!lessonConfig) return;

    const newTraining = { lessonId, id: trainingIdx + 1 };
    Object.entries(lessonConfig.fields).forEach(([fieldKey, fieldConfig]) => {
      if (fieldConfig.required) {
        newTraining[fieldKey] = fieldConfig.min || 0;
      }
    });

    setStageConfig((prev) => {
      const stageTrain = [...prev[stageId]];
      stageTrain[trainingIdx] = newTraining;
      return { ...prev, [stageId]: stageTrain };
    });
  };

  // Kaydet
  const saveConfig = async () => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'admin', 'stageBasedTraining'),
        { stages: stageConfig, updatedAt: new Date() },
        { merge: true }
      );
      addToast?.({ msg: 'Aşama-tabanlı antrenmanlar kaydedildi!', color: '#10b981' });
    } catch (e) {
      console.error(e);
      addToast?.({ msg: 'Kaydetme başarısız.', color: '#ef4444' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Yükleniyor...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Başlık */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--fg)' }}>
            🎯 4 Aşama × 1 Antrenman Yapılandırması
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--mu)', marginTop: '4px' }}>
            Her aşamada 1 antrenmanı dinamik olarak ayarlayın (süreler saniyedir) - toplam 4 yapı
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

      {/* Özet Kartı */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
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
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stage.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--fg)' }}>
              {stage.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--mu)', marginTop: '4px' }}>
              {stage.desc}
            </div>
            <div style={{ fontSize: '11px', color: stage.color, fontWeight: 600, marginTop: '8px' }}>
              1 antrenman
            </div>
          </div>
        ))}
      </div>

      {/* Aşama Panels */}
      {STAGES.map((stage) => (
        <div
          key={stage.id}
          className="card"
          style={{
            padding: '20px',
            borderLeft: `4px solid ${stage.color}`,
            background: 'rgba(255,255,255,0.01)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ fontSize: '32px' }}>{stage.icon}</div>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--fg)' }}>
                Aşama {stage.id}: {stage.name}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--mu)', marginTop: '2px' }}>
                {stage.desc}
              </p>
            </div>
          </div>

          {/* Antrenmanlar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
            {stageConfig[stage.id].map((training, idx) => {
              const lessonConfig = TRAINING_CONFIG[training.lessonId];
              const hasLesson = !!lessonConfig;

              return (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    background: stage.color + '10',
                    border: `1px solid ${stage.color}40`,
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '13px', color: stage.color }}>
                    Antrenman {idx + 1}
                  </div>

                  {/* 1. Ders Seçimi - Dropdown */}
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--mu)', fontWeight: 600 }}>
                      📚 Ders Seçin (Zorunlu)
                    </label>
                    <select
                      value={training.lessonId}
                      onChange={(e) => {
                        const lessonId = e.target.value;
                        updateTraining(stage.id, idx, 'lessonId', lessonId);
                        if (lessonId) {
                          initializeTrainingWithLesson(stage.id, idx, lessonId);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        marginTop: '4px',
                        borderRadius: '4px',
                        border: '2px solid var(--ac)',
                        background: 'var(--bg)',
                        color: 'var(--fg)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      <option value="">-- Ders Seçin --</option>
                      {AVAILABLE_LESSONS.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.icon} {lesson.name}
                        </option>
                      ))}
                    </select>
                    {hasLesson && (
                      <div style={{ marginTop: '6px', fontSize: '11px', color: lessonConfig.color, fontWeight: 500 }}>
                        {lessonConfig.desc}
                      </div>
                    )}
                  </div>

                  {/* 2. Dinamik Alanlar */}
                  {hasLesson ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {Object.entries(lessonConfig.fields).map(([fieldKey, fieldConfig]) => (
                        <div key={fieldKey}>
                          <label style={{ fontSize: '10px', color: fieldConfig.required ? lessonConfig.color : 'var(--mu)', fontWeight: fieldConfig.required ? 700 : 600 }}>
                            {fieldConfig.label} {fieldConfig.required ? '*' : '(opsiyonel)'}
                          </label>
                          <input
                            type={fieldConfig.type}
                            min={fieldConfig.min}
                            max={fieldConfig.max}
                            step={fieldConfig.step}
                            value={training[fieldKey] ?? ''}
                            onChange={(e) => updateTraining(stage.id, idx, fieldKey, e.target.value)}
                            placeholder={`${fieldConfig.min}-${fieldConfig.max}`}
                            style={{
                              width: '100%',
                              padding: '6px',
                              marginTop: '3px',
                              borderRadius: '4px',
                              border: `1.5px solid ${fieldConfig.required ? lessonConfig.color : 'var(--bd)'}`,
                              background: 'var(--bg)',
                              color: 'var(--fg)',
                              fontSize: '11px',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '12px',
                        background: 'rgba(255, 165, 0, 0.1)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: 'var(--mu)',
                        textAlign: 'center',
                        border: '1px dashed #ffa500',
                      }}
                    >
                      ⬆️ Lütfen ders seçerek başlayın
                    </div>
                  )}

                  {/* Özet */}
                  {hasLesson && (
                    <div
                      style={{
                        padding: '8px',
                        background: lessonConfig.color + '20',
                        borderRadius: '4px',
                        fontSize: '10px',
                        color: 'var(--mu)',
                        lineHeight: '1.5',
                        border: `1px solid ${lessonConfig.color}40`,
                      }}
                    >
                      <strong style={{ color: lessonConfig.color }}>✓ {lessonConfig.name}</strong>
                      <div style={{ marginTop: '4px' }}>
                        {Object.entries(lessonConfig.fields)
                          .filter(([_, f]) => f.required)
                          .map(([key]) => (
                            <div key={key}>
                              {key}: <strong>{training[key] ?? '-'}</strong>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Alt Bilgi */}
      <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', fontSize: '12px', color: 'var(--mu)', lineHeight: '1.6' }}>
        <div>📊 <strong>Yapı:</strong> 4 Aşama × 5 Antrenman = 20 Toplam Yapı</div>
        <div>⏱️ <strong>Süreler:</strong> Tüm süreler SANIYE cinsinden girilir</div>
        <div>✨ <strong>Dinamik Alanlar:</strong> Ders seçilince o dersin özel alanları otomatik gösterilir</div>
        <div>💡 <strong>Tavsiye:</strong> Zorluk aşama ilerledikçe artmalıdır - Başlangıçta 1-3, Master'da 8-10</div>
        <div>🔒 <strong>Zorunlu Alanlar:</strong> Yıldız (*) işareti ile gösterilir</div>
      </div>
    </div>
  );
};

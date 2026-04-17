import React, { useState, useEffect } from 'react';
import { db } from '../../../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { TRAINING_CONFIG } from '../../../data/trainingConfig';

const STAGES = [
  { id: 1, name: '🌱 BAŞLANGIÇ', color: '#10b981', desc: 'Temel okuma becerilerini geliştir' },
  { id: 2, name: '📈 GELİŞİM', color: '#3b82f6', desc: 'Orta seviye zorluklar' },
  { id: 3, name: '🔥 İLERİ', color: '#f59e0b', desc: 'İleri seviye eğitim' },
  { id: 4, name: '💎 MASTER', color: '#ec4899', desc: 'Maksimum zorluk' },
];

const LESSON_OPTIONS = Object.keys(TRAINING_CONFIG).map(key => ({
  id: key,
  name: TRAINING_CONFIG[key].name,
  icon: TRAINING_CONFIG[key].icon,
}));

export default function StageBlockTrainingManager() {
  const [stageBlockTraining, setStageBlockTraining] = useState({});
  const [selectedStage, setSelectedStage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  // Firebase'den veri yükle
  useEffect(() => {
    const loadData = async () => {
      try {
        const docRef = doc(db, 'admin', 'stageBlockTraining');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          // Eski schedule verilerini temizle
          const data = docSnap.data();
          const cleanedData = {};
          STAGES.forEach(stage => {
            if (data[stage.id]) {
              cleanedData[stage.id] = data[stage.id];
            } else {
              cleanedData[stage.id] = { lessonId: '' };
            }
          });
          setStageBlockTraining(cleanedData);
        } else {
          // Initialize with 1 training per stage (minimal)
          const emptyData = {};
          STAGES.forEach(stage => {
            emptyData[stage.id] = { lessonId: '' };
          });
          setStageBlockTraining(emptyData);
        }
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update training - ONLY lessonId (simplified)
  const updateTraining = (stageId, lessonId) => {
    const updated = { ...stageBlockTraining };
    updated[stageId] = { lessonId };
    setStageBlockTraining(updated);
  };

  // Firebase'e kaydet
  const saveData = async () => {
    try {
      setSaveStatus('Kaydediliyor...');
      await setDoc(doc(db, 'admin', 'stageBlockTraining'), stageBlockTraining);
      setSaveStatus('✅ Başarıyla kaydedildi!');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      setSaveStatus('❌ Kayıt hatası: ' + error.message);
    }
  };

  // Calculate stage stats
  const getStageStats = (stageId) => {
    const training = stageBlockTraining[stageId];
    if (!training || !training.lessonId) return '⬜ Boş';
    return `✅ ${TRAINING_CONFIG[training.lessonId]?.name || 'Bilinmiyor'}`;
  };

  // Check if stage is completed
  const isStageLocked = (stageId) => {
    if (stageId === 1) return false;
    
    // Previous stage must be configured
    const prevTraining = stageBlockTraining[stageId - 1];
    return !prevTraining || !prevTraining.lessonId;
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>⏳ Yükleniyor...</div>;
  }

  const currentTraining = stageBlockTraining[selectedStage] || {};
  const currentStageDef = STAGES.find(s => s.id === selectedStage);
  const lessonConfig = TRAINING_CONFIG[currentTraining.lessonId];

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* BAŞLIK */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
          🎯 4 Aşama × 1 Antrenman (Basit)
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--mu)' }}>
          Her aşamada tek bir antrenman seç. Sadece antrenman türü kaydedilir.
        </p>
        {saveStatus && (
          <div style={{ fontSize: '12px', color: saveStatus.includes('✅') ? '#10b981' : '#ef4444', marginTop: '8px' }}>
            {saveStatus}
          </div>
        )}
      </div>

      {/* AŞAMA SEÇİCİ */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {STAGES.map(stage => {
          const locked = isStageLocked(stage.id);
          return (
            <button
              key={stage.id}
              disabled={locked}
              onClick={() => setSelectedStage(stage.id)}
              title={locked ? 'Önceki aşama tamamlanmadı!' : stage.desc}
              style={{
                padding: '10px 16px',
                background: locked ? 'rgba(0,0,0,0.3)' : (selectedStage === stage.id ? stage.color : 'rgba(0,0,0,0.2)'),
                color: locked ? '#999' : (selectedStage === stage.id ? '#fff' : 'inherit'),
                border: locked ? '2px dashed #666' : 'none',
                borderRadius: '8px',
                cursor: locked ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '12px',
                transition: 'all 0.2s',
                opacity: locked ? 0.5 : 1,
              }}
            >
              {locked && '🔒 '}{stage.name}
              <br />
              <span style={{ fontSize: '10px', opacity: 0.7 }}>
                {getStageStats(stage.id)}
              </span>
            </button>
          );
        })}
      </div>

      {/* SEÇİLİ AŞAMA BİLGİSİ */}
      <div style={{ background: `${currentStageDef?.color}20`, padding: '16px', borderRadius: '12px', border: `2px solid ${currentStageDef?.color}` }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
          {currentStageDef?.name}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--fg)' }}>
          {currentStageDef?.desc}
        </p>
      </div>

      {/* ANTRENMAN KURULUMU */}
      <div style={{ border: `2px solid ${currentStageDef?.color}`, borderRadius: '12px', padding: '20px', background: `${currentStageDef?.color}10` }}>
        <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>
          ✅ Antrenman Seç (Her Aşamada 1 Yeterli)
        </h4>

        {/* Sadece Ders Seçimi */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            📚 Antrenman Türü <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select
            value={currentTraining.lessonId || ''}
            onChange={(e) => updateTraining(selectedStage, e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '2px solid var(--ac)',
              background: 'var(--bg)',
              color: 'var(--fg)',
              fontWeight: 600,
            }}
          >
            <option value="">-- Antrenman Seçin --</option>
            {LESSON_OPTIONS.map(lesson => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.icon} {lesson.name}
              </option>
            ))}
          </select>
          {lessonConfig && (
            <div style={{ marginTop: '8px', padding: '10px', fontSize: '12px', color: '#fff', fontWeight: 500, background: lessonConfig.color, borderRadius: '6px' }}>
              ℹ️ {lessonConfig.desc}
            </div>
          )}
        </div>

        {!currentTraining.lessonId && (
          <div style={{ padding: '12px', background: 'rgba(255, 165, 0, 0.1)', borderRadius: '6px', fontSize: '12px', color: 'var(--mu)', textAlign: 'center', border: '1px dashed #ffa500' }}>
            ⬆️ Antrenman seçerek başlayın
          </div>
        )}
      </div>

      {/* KAYDET BUTONU */}
      <button
        onClick={saveData}
        style={{
          padding: '12px 24px',
          background: '#10b981',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 700,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => e.target.style.background = '#059669'}
        onMouseLeave={(e) => e.target.style.background = '#10b981'}
      >
        ✅ Antrenmanları Kaydet
      </button>

      {/* BİLGİ */}
      <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid #3b82f6' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#3b82f6' }}>
          ℹ️ Basit Sistem
        </h4>
        <ul style={{ fontSize: '11px', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
          <li>✅ <strong>4 Aşama</strong> = <strong>4 Antrenman</strong> (her aşamada 1)</li>
          <li>✅ Aşama 1 (🌱 BAŞLANGIÇ) → Aşama 2 (📈 GELİŞİM) → Aşama 3 (🔥 İLERİ) → Aşama 4 (💎 MASTER)</li>
          <li>✅ Antrenman seç → Kaydet → Bitti!</li>
          <li>🔒 Önceki aşama tamamlanmamışsa sonraki aşama kilitli</li>
          <li>💾 Değişiklikleri KAYDET butonuyla kaydet</li>
        </ul>
      </div>
    </div>
  );
}

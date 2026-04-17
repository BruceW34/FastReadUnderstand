import { useState, useRef } from 'react';
import { DEFAULT_TEXTS } from '@/data/texts.js';
import { storage } from '@/shared/storage';
import { BoltCoach } from '@/components/shared/BoltCoach';

export default function Library({ texts, setTexts, onXP, addToast, isMobile }) {
  const [showAdd, setShowAdd] = useState(false);
  const [json, setJson] = useState('');
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const EXAMPLE = `{
  "id": "benim_metin_1",
  "title": "Kitap veya Metin Adı",
  "category": "Roman",
  "difficulty": 2,
  "content": "Uzun metni buraya yapıştır. Ne kadar uzun olursa olsun çalışır...",
  "questions": [
    {
      "question": "Soru metni?",
      "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
      "correct": 0
    }
  ]
}`;

  const addText = () => {
    try {
      const t = JSON.parse(json);
      if (!t.id || !t.title || !t.content) return setErr('id, title ve content alanları zorunlu.');
      if (texts.find(x => x.id === t.id)) return setErr('Bu ID zaten mevcut. Farklı bir id kullan.');
      if (!t.questions) t.questions = [];
      if (!t.difficulty) t.difficulty = 1;
      if (!t.category) t.category = 'Genel';
      const nt = [...texts, t];
      setTexts(nt);
      storage.set('sr_custom_texts', nt.filter(x => !DEFAULT_TEXTS.find(d => d.id === x.id)));
      setShowAdd(false);
      setJson('');
      setErr('');
      onXP(100, 0, 'Kütüphane', 'Editör');
      addToast({ msg: '✍️ Metin eklendi! +100 XP', color: '#7c3aed', icon: '✍️' });
    } catch {
      setErr('Geçersiz JSON. Formatı kontrol et (virgül, tırnak eksik olabilir).');
    }
  };

  const addFromFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result.trim();
      if (!content) return addToast({ msg: 'Dosya boş.', color: '#ef4444' });
      const id = 'file_' + Date.now();
      const title = file.name.replace(/\.[^/.]+$/, '');
      const t = { id, title, category: 'Dosya', difficulty: 2, content, questions: [] };
      if (texts.find(x => x.id === t.id)) { t.id = id + '_2'; }
      const nt = [...texts, t];
      setTexts(nt);
      storage.set('sr_custom_texts', nt.filter(x => !DEFAULT_TEXTS.find(d => d.id === x.id)));
      onXP(100, 0, 'Kütüphane', 'Editör');
      addToast({ msg: `📄 "${title}" eklendi! +100 XP`, color: '#7c3aed', icon: '📄' });
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.txt') || file.type === 'text/plain')) {
      addFromFile(file);
    } else {
      addToast({ msg: 'Sadece .txt dosyaları desteklenir.', color: '#ef4444' });
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) addFromFile(file);
    e.target.value = '';
  };

  const delText = (id) => {
    if (DEFAULT_TEXTS.find(t => t.id === id)) {
      return addToast({ msg: 'Varsayılan metinler silinemez.', color: '#ef4444' });
    }
    const nt = texts.filter(t => t.id !== id);
    setTexts(nt);
    storage.set('sr_custom_texts', nt.filter(x => !DEFAULT_TEXTS.find(d => d.id === x.id)));
    addToast({ msg: 'Metin silindi.', color: '#64748b' });
  };

  const exportData = () => {
    const data = {
      user: storage.get('sr_currentUser', null),
      users: storage.get('sr_users', {}),
      customTexts: storage.get('sr_custom_texts', []),
      daily: storage.get('sr_daily', {}),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'fastread_backup.json'; a.click();
    URL.revokeObjectURL(url);
    addToast({ msg: '📥 Veriler dışa aktarıldı!', color: '#10b981', icon: '📥' });
  };

  const importData = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.users) storage.set('sr_users', data.users);
        if (data.customTexts) storage.set('sr_custom_texts', data.customTexts);
        if (data.daily) storage.set('sr_daily', data.daily);
        if (data.user) storage.set('sr_currentUser', data.user);
        addToast({ msg: '📤 Veriler içe aktarıldı! Sayfayı yenile.', color: '#10b981', icon: '📤' });
      } catch {
        addToast({ msg: 'Geçersiz yedekleme dosyası.', color: '#ef4444' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="st">📚 Metin Kütüphanesi</div>
          <div className="ss">{texts.length} metin • JSON ile ekle, .txt sürükle-bırak, tüm modüllerde kullan</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn bp" onClick={() => setShowAdd(v => !v)} style={{ fontSize: isMobile ? 12 : 14 }}>
            {showAdd ? '✕ Kapat' : '+ Metin Ekle'}
          </button>
          <button className="btn bg bs" onClick={() => fileRef.current?.click()} style={{ fontSize: isMobile ? 12 : 14 }}>📄 .txt Yükle</button>
          <button className="btn bg bs" onClick={exportData} style={{ fontSize: isMobile ? 12 : 14 }}>📥 Dışa Aktar</button>
          <label className="btn bg bs" style={{ cursor: 'pointer', fontSize: isMobile ? 12 : 14 }}>
            📤 İçe Aktar
            <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
          </label>
          <input ref={fileRef} type="file" accept=".txt" onChange={handleFileInput} style={{ display: 'none' }} />
        </div>
      </div>

      <BoltCoach 
        message="Okuma hızını artırmanın en iyi yolu, sevdiğin metinlerle pratik yapmaktır. Buraya kendi metinlerini ekleyebilirsin! 📚" 
        style={{ marginBottom: 15 }} 
      />

      {/* DRAG DROP ZONE */}
      {dragOver && (
        <div style={{ padding: isMobile ? 30 : 40, border: '2px dashed rgba(124,58,237,.6)', borderRadius: 18, textAlign: 'center', background: 'rgba(124,58,237,.08)', animation: 'fi .2s ease' }}>
          <div style={{ fontSize: isMobile ? 30 : 40 }}>📄</div>
          <div style={{ color: 'var(--ac)', fontWeight: 700, marginTop: 8, fontSize: isMobile ? 13 : 15 }}>.txt dosyasını buraya bırak</div>
        </div>
      )}

      {/* ADD FORM */}
      {showAdd && (
        <div className="card" style={{ borderColor: 'rgba(124,58,237,.4)' }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>📋 JSON Formatı</div>

          {/* Format guide */}
          <div style={{ marginBottom: 12, padding: 14, background: 'rgba(0,0,0,.4)', borderRadius: 10, fontFamily: 'var(--mo)', fontSize: 11, color: 'var(--mu)', lineHeight: 1.9, whiteSpace: 'pre' }}>
            {EXAMPLE}
          </div>

          <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 10, lineHeight: 1.7 }}>
            💡 <strong>İpuçları:</strong><br />
            • <code style={{ color: 'var(--ac2)' }}>id</code> — benzersiz bir isim (boşluk kullanma, örn: "kitap_1")<br />
            • <code style={{ color: 'var(--ac2)' }}>difficulty</code> — 1 (kolay) ile 5 (çok zor) arası<br />
            • <code style={{ color: 'var(--ac2)' }}>questions</code> — opsiyonel, eklemek zorunda değilsin<br />
            • <code style={{ color: 'var(--ac2)' }}>correct</code> — 0'dan başlar (A=0, B=1, C=2, D=3)
          </div>

          <textarea
            value={json}
            onChange={e => setJson(e.target.value)}
            rows={8}
            placeholder="JSON'ı buraya yapıştır..."
          />
          {err && <div style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn bp" onClick={addText}>✓ Kütüphaneye Ekle</button>
            <button className="btn bg" onClick={() => { setShowAdd(false); setErr(''); setJson(''); }}>İptal</button>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{preview.title}</div>
                <div style={{ color: 'var(--ac2)', fontSize: 13, marginTop: 3 }}>{preview.category}</div>
              </div>
              <button className="btn bg bs" onClick={() => setPreview(null)}>✕</button>
            </div>
            <div style={{ lineHeight: 1.8, fontSize: 15, color: 'var(--mu)', marginBottom: 16 }}>
              {preview.content}
            </div>
            {preview.questions?.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Test Soruları ({preview.questions.length}):</div>
                {preview.questions.map((q, i) => (
                  <div key={i} style={{ marginBottom: 8, padding: '8px 12px', background: 'var(--s1)', borderRadius: 8, fontSize: 13 }}>
                    <div style={{ fontWeight: 600 }}>{i + 1}. {q.question}</div>
                    <div style={{ color: '#34d399', marginTop: 3 }}>✓ Cevap: {q.options[q.correct]}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEXT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(270px,1fr))', gap: 10 }}>
        {texts.map(t => {
          const isCustom = !DEFAULT_TEXTS.find(d => d.id === t.id);
          return (
            <div key={t.id} className="card" style={{ borderColor: isCustom ? 'rgba(124,58,237,.35)' : 'var(--b1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--ac2)', marginTop: 2 }}>
                    {t.category}
                    {isCustom && <span style={{ color: '#7c3aed', marginLeft: 6 }}>● Özel</span>}
                  </div>
                </div>
                <div className="strs">{'★'.repeat(t.difficulty || 1)}{'☆'.repeat(5 - (t.difficulty || 1))}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--mu)', lineHeight: 1.6, marginBottom: 8 }}>
                {t.content.slice(0, 100)}...
              </div>
              <div style={{ fontSize: 11, color: 'var(--mu)', display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{t.content.split(/\s+/).length} kelime • {(t.questions || []).length} soru</span>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button className="btn bg bs" onClick={() => setPreview(t)}>👁️ Önizle</button>
                  {isCustom && <button className="btn bd bs" onClick={() => delText(t.id)}>🗑️</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

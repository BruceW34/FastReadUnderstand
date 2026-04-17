import React from 'react';

export const AdminSystemFlow = () => {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* BAŞLIK */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
          📊 Admin Panel Yapısı & İşlem Akışı
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--mu)' }}>
          Tüm sekmeler nasıl çalışıyor? Hangi sırayla kullanmalısın?
        </p>
      </div>

      {/* 6 TAB GÖRÜNTÜLEMESİ */}
      <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '20px', borderRadius: '12px', border: '2px solid #7c3aed' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: '#7c3aed' }}>
          6 Admin Sekmesi (Tabs)
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          
          {/* Tab 1 */}
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '14px', borderRadius: '8px', border: '2px solid #10b981' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#10b981', marginBottom: '8px' }}>
              1️⃣ 📖 Rehber
            </div>
            <div style={{ fontSize: '12px', color: 'var(--fg)', lineHeight: '1.6' }}>
              ✓ Tüm sistem açıklaması<br/>
              ✓ İşlem sırası<br/>
              ✓ Her sayfanın amacı<br/>
              <strong style={{ color: '#10b981' }}>→ İLK BAŞLA BURADAN</strong>
            </div>
          </div>

          {/* Tab 2 */}
          <div style={{ background: 'rgba(124, 58, 237, 0.2)', padding: '14px', borderRadius: '8px', border: '2px solid #7c3aed' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#7c3aed', marginBottom: '8px' }}>
              2️⃣ 📚 Pathway
            </div>
            <div style={{ fontSize: '12px', color: 'var(--fg)', lineHeight: '1.6' }}>
              ✓ Temel eğitim yapısı<br/>
              ✓ 10 Ünite tanımla<br/>
              ✓ Her ünite başlık/açıklama<br/>
              <strong style={{ color: '#7c3aed' }}>→ TEMEL YAPIYSAL İŞLEM</strong>
            </div>
          </div>

          {/* Tab 3 */}
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '14px', borderRadius: '8px', border: '2px solid #3b82f6' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#3b82f6', marginBottom: '8px' }}>
              3️⃣ 📅 Haftalık Görevler
            </div>
            <div style={{ fontSize: '12px', color: 'var(--fg)', lineHeight: '1.6' }}>
              ✓ 4 Aşama × 4 Hafta<br/>
              ✓ Her haftada 5 görev<br/>
              ✓ WPM + Zorluk hedefi<br/>
              <strong style={{ color: '#3b82f6' }}>→ İLERLEME ZAMANLAMASI</strong>
            </div>
          </div>

          {/* Tab 4 */}
          <div style={{ background: 'rgba(6, 182, 212, 0.2)', padding: '14px', borderRadius: '8px', border: '2px solid #06b6d4' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#06b6d4', marginBottom: '8px' }}>
              4️⃣ 🎯 Ders Atama
            </div>
            <div style={{ fontSize: '12px', color: 'var(--fg)', lineHeight: '1.6' }}>
              ✓ Sürükle-bırak sistemi<br/>
              ✓ Dersleri kurslara at<br/>
              ✓ Süre ayarla (saniye)<br/>
              <strong style={{ color: '#06b6d4' }}>→ HANGI DERSLER KULLAN?</strong>
            </div>
          </div>

          {/* Tab 5 */}
          <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '14px', borderRadius: '8px', border: '2px solid #f59e0b' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#f59e0b', marginBottom: '8px' }}>
              5️⃣ 🗂️ Aşama × Bölüm
            </div>
            <div style={{ fontSize: '12px', color: 'var(--fg)', lineHeight: '1.6' }}>
              ✓ 4 Aşama × 4 Bölüm<br/>
              ✓ Her bölümde 5 antrenman<br/>
              ✓ Dinamik ders seçimi<br/>
              <strong style={{ color: '#f59e0b' }}>→ ANTRENMAN TÜMLERİ</strong>
            </div>
          </div>

          {/* Tab 6 */}
          <div style={{ background: 'rgba(236, 72, 153, 0.2)', padding: '14px', borderRadius: '8px', border: '2px solid #ec4899' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#ec4899', marginBottom: '8px' }}>
              6️⃣ ⚙️ JSON Config
            </div>
            <div style={{ fontSize: '12px', color: 'var(--fg)', lineHeight: '1.6' }}>
              ✓ İleri parametreler<br/>
              ✓ Doğrudan JSON düzenleme<br/>
              ✓ Özel ayarlamalar<br/>
              <strong style={{ color: '#ec4899' }}>→ İLERİ AYARLAR (İSTEĞE BAĞLI)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* İŞLEM SIRASI */}
      <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '20px', borderRadius: '12px', border: '2px solid #22c55e' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: '#22c55e' }}>
          ✅ YAPMAN GEREKEN İŞLEMLER (SIRAYLA)
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{ padding: '12px', background: 'rgba(34, 197, 94, 0.2)', borderRadius: '8px', border: '1px solid #22c55e' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#22c55e', marginBottom: '4px' }}>
              Adım 1: 📖 Rehberi Oku
            </div>
            <div style={{ fontSize: '12px', color: 'var(--fg)' }}>
              Admin sayfasının ne olduğunu ve nasıl çalıştığını öğren
            </div>
          </div>

          <div style={{ padding: '12px', background: 'rgba(124, 58, 237, 0.2)', borderRadius: '8px', border: '1px solid #7c3aed' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#7c3aed', marginBottom: '4px' }}>
              Adım 2: 📚 Pathway'i Ayarla
            </div>
            <div style={{ fontSize: '12px', color: 'var(--fg)' }}>
              Temel eğitim yapısını kur (10 ünite başlık ve açıklamasını yaz)
            </div>
          </div>

          <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '8px', border: '1px solid #3b82f6' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#3b82f6', marginBottom: '4px' }}>
              Adım 3: 📅 Haftalık Görevleri Ayarla
            </div>
            <div style={{ fontSize: '12px', color: 'var(--fg)' }}>
              4 Aşama × 4 Hafta × 5 Görev yapılandır. Her haftanın WPM hedefleri ve zorluk seviyeleri
            </div>
          </div>

          <div style={{ padding: '12px', background: 'rgba(6, 182, 212, 0.2)', borderRadius: '8px', border: '1px solid #06b6d4' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#06b6d4', marginBottom: '4px' }}>
              Adım 4: 🎯 Ders Atamalarını Yap
            </div>
            <div style={{ fontSize: '12px', color: 'var(--fg)' }}>
              Sürükle-bırak ile dersleri eğitim kurslarına at. Her ders için süre belirle
            </div>
          </div>

          <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '8px', border: '1px solid #f59e0b' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#f59e0b', marginBottom: '4px' }}>
              Adım 5: 🗂️ Aşama × Bölüm Antrenmanlarını Ayarla
            </div>
            <div style={{ fontSize: '12px', color: 'var(--fg)' }}>
              4 Aşama × 4 Bölüm × 5 Antrenman = 80 Antrenman yapılandır. Her antrenmanın ders, süre, zorluk vb.
            </div>
          </div>

          <div style={{ padding: '12px', background: 'rgba(236, 72, 153, 0.2)', borderRadius: '8px', border: '1px solid #ec4899' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#ec4899', marginBottom: '4px' }}>
              Adım 6: ⚙️ (İsteğe Bağlı) JSON Config
            </div>
            <div style={{ fontSize: '12px', color: 'var(--fg)' }}>
              İleri ayarlamalar için doğrudan JSON düzenle (genellikle gerekli değildir)
            </div>
          </div>
        </div>
      </div>

      {/* AŞAMA × BÖLÜM YAPISI */}
      <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '20px', borderRadius: '12px', border: '2px solid #f59e0b' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: '#f59e0b' }}>
          🗂️ Aşama × Bölüm × Antrenman (Yeni Sistem)
        </h2>
        
        <div style={{ fontFamily: 'monospace', fontSize: '12px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', lineHeight: '1.8', color: '#fbbf24', overflowX: 'auto' }}>
{`🌱 BAŞLANGIÇ (Aşama 1)
├─ BÖLÜM 1: 5 Antrenman
│  ├─ Antrenman 1: Flash Okuma (300sn, Zorluk 1)
│  ├─ Antrenman 2: Kılavuzlu Okuma (300sn, Zorluk 1)
│  ├─ Antrenman 3: Regresyon Engeli
│  ├─ Antrenman 4: Dikey Okuma
│  └─ Antrenman 5: Göz Jimi
├─ BÖLÜM 2: 5 Antrenman (daha zorlayıcı)
├─ BÖLÜM 3: 5 Antrenman
└─ BÖLÜM 4: 5 Antrenman (aşama sonu)

📈 GELİŞİM (Aşama 2)
├─ BÖLÜM 1: 5 Antrenman (Başlangıçtan daha zorlayıcı)
├─ BÖLÜM 2: 5 Antrenman
├─ BÖLÜM 3: 5 Antrenman
└─ BÖLÜM 4: 5 Antrenman

🔥 İLERİ (Aşama 3)
├─ BÖLÜM 1-4: Her bölümde 5 Antrenman

💎 MASTER (Aşama 4)
├─ BÖLÜM 1-4: Her bölümde 5 Antrenman

═════════════════════════
TOPLAM: 4 Aşama × 4 Bölüm × 5 Antrenman = 80 Antrenman`}
        </div>
      </div>

      {/* DATA AKIŞI */}
      <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '20px', borderRadius: '12px', border: '2px solid #3b82f6' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: '#3b82f6' }}>
          📡 Veri Akışı (Admin Panel → Uygulama)
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px' }}>
            <div style={{ fontWeight: 700, marginBottom: '8px' }}>Admin Panel (Firebase)</div>
            ├─ admin/pathway → Temel yapı<br/>
            ├─ admin/weeklyPathwayGoals → Haftalık görevler<br/>
            ├─ admin/lessonAssignments → Ders atamalar<br/>
            ├─ admin/stageBlockTraining → Aşama-Bölüm-Antrenmanlar<br/>
            └─ admin/trainings → İleri JSON config
          </div>

          <div style={{ fontSize: '18px', textAlign: 'center', color: '#3b82f6', fontWeight: 700 }}>
            ⬇️ KAYDET BUTONU ⬇️
          </div>

          <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px' }}>
            <div style={{ fontWeight: 700, marginBottom: '8px' }}>Kullanıcı Uygulaması</div>
            Kullanıcı eğitim menüsünde:<br/>
            ✓ Haftalık görevlerini görmüş olur<br/>
            ✓ Antrenmanları başlatabilir<br/>
            ✓ İlerleme kaydedilir
          </div>
        </div>
      </div>

      {/* ÖNEMLİ NOTLAR */}
      <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '12px', border: '2px solid #ef4444' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ef4444', marginBottom: '8px' }}>
          ⚠️ ÖNEMLİ NOTLAR
        </h3>
        <ul style={{ fontSize: '12px', color: 'var(--fg)', lineHeight: '1.8', marginLeft: '20px' }}>
          <li><strong>Her sekmede "Kaydet" butonu vardır.</strong> Değişiklikleri mutlaka kaydet!</li>
          <li><strong>Süreler SANIYE cinsinden girilir</strong> (örn: 300sn = 5 dakika)</li>
          <li><strong>Bölüm sistemi ilk kez kullanıldığında</strong> başlangıç verileri 0'dan başlar</li>
          <li><strong>Ters sırada değişiklik yapılırsa</strong> (mesela önce antrenmanlar sonra haftalık) sorun çıkmaz</li>
          <li><strong>JSON Config</strong> sadece ileri kullanıcılar içindir</li>
        </ul>
      </div>
    </div>
  );
};

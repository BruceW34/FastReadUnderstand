import React from 'react';

export const AdminGuidance = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>
          📚 Admin Sayfaları Rehberi
        </h1>
      </div>

      {/* Pathway Ayarları */}
      <div className="card" style={{ padding: '24px', borderLeft: '4px solid #7c3aed' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#7c3aed', marginBottom: '12px' }}>
          1️⃣ Pathway Ayarları (Haftalık Görevler)
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--mu)', marginBottom: '16px', lineHeight: '1.6' }}>
          Kullanıcıların öğrenme yolculuğunun genel yapısını oluşturursunuz. Her hafta için 4 aşama × hedefler belirlenir.
        </p>
        <div style={{ background: 'rgba(124, 58, 237, 0.1)', padding: '16px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.8' }}>
          <strong>Ne Yaparsınız?</strong>
          <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
            <li>📍 Haftalık görev başlığını/açıklamasını belirlersiniz</li>
            <li>🎯 10 ünite (1-10) tanımlarsınız</li>
            <li>📊 Her ünite için başlık ve açıklama yazarsınız</li>
            <li>💾 Veritabanında haftalık görev haritası kaydedilir</li>
          </ul>
          <strong style={{ marginTop: '12px', display: 'block' }}>Örnek:</strong>
          <div style={{ marginTop: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
            Ünite 1: Hız Temelleri → Flash Okuma başlarsınız<br />
            Ünite 2: Tempo → Kılavuzlu Okuma<br />
            ... (Ünite 3-10)
          </div>
        </div>
      </div>

      {/* Ders Atama */}
      <div className="card" style={{ padding: '24px', borderLeft: '4px solid #3b82f6' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#3b82f6', marginBottom: '12px' }}>
          2️⃣ Ders Atama (Sürükle-Bırak)
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--mu)', marginBottom: '16px', lineHeight: '1.6' }}>
          Eğitim kurslarına dersleri atarsınız. Hangi dersler, hangi kursta olacak ve ne kadar süreceğini belirlersiniz.
        </p>
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.8' }}>
          <strong>Ne Yaparsınız?</strong>
          <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
            <li>📚 Sol panelden dersleri seçersiniz</li>
            <li>🎯 Sağdaki kurs alanlarına sürüklersiniz</li>
            <li>⏱️ Her dersin süresini belirlersiniz (dakika)</li>
            <li>🔄 Ders sırasını yukarı/aşağı butonlarıyla değiştirebilirsiniz</li>
            <li>💾 Kurs-ders atamalar kaydedilir</li>
          </ul>
          <strong style={{ marginTop: '12px', display: 'block' }}>Kurslar:</strong>
          <div style={{ marginTop: '8px' }}>
            🚀 Hızlı Okuma Başlangıç | 👁️ Görüş Alanı | 🧠 Zihin Hızı
          </div>
        </div>
      </div>

      {/* 4×5 Antrenmanlar */}
      <div className="card" style={{ padding: '24px', borderLeft: '4px solid #f59e0b' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b', marginBottom: '12px' }}>
          3️⃣ 4 Aşama × 5 Antrenmanlar
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--mu)', marginBottom: '16px', lineHeight: '1.6' }}>
          Kullanıcıların seviye ilerledikçe karşılaşacağı antrenmanları yapılandırırsınız. Toplam 20 antrenman (4 aşama × 5 antrenman).
        </p>
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.8' }}>
          <strong>Ne Yaparsınız?</strong>
          <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
            <li>📊 4 Aşama seçersiniz: 🌱 Başlangıç | 📈 Gelişim | 🔥 İleri | 💎 Master</li>
            <li>🎯 Her aşamada 5 antrenmanı yapılandırırsınız</li>
            <li>📚 Antrenmanın hangi ders olacağını seçersiniz</li>
            <li>⏱️ Süre, zorluk, tekrar, dinlenme ve hedef WPM belirlersiniz</li>
            <li>🔄 Zorluk aşama ilerledikçe artmalıdır (Başlangıçta 1-3, Master'da 8-10)</li>
          </ul>
          <strong style={{ marginTop: '12px', display: 'block' }}>Örnek Yapı:</strong>
          <div style={{ marginTop: '8px', fontFamily: 'monospace', fontSize: '11px' }}>
            🌱 Aşama 1 - Antrenman 1: Flash (5dk, Zorluk 1, 3 tekrar, 300 WPM)<br />
            📈 Aşama 2 - Antrenman 1: Flash (10dk, Zorluk 4, 5 tekrar, 500 WPM)<br />
            🔥 Aşama 3 - Antrenman 1: Flash (15dk, Zorluk 7, 7 tekrar, 800 WPM)<br />
            💎 Aşama 4 - Antrenman 1: Flash (20dk, Zorluk 10, 10 tekrar, 1200 WPM)
          </div>
        </div>
      </div>

      {/* Haftalık Görev Aşamaları */}
      <div className="card" style={{ padding: '24px', borderLeft: '4px solid #ec4899' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ec4899', marginBottom: '12px' }}>
          4️⃣ Haftalık Görev Aşamaları (YENİ)
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--mu)', marginBottom: '16px', lineHeight: '1.6' }}>
          Pathway'i 4 aşama × haftalar şeklinde organize edersiniz. Her aşamada 4 hafta vardır.
        </p>
        <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '16px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.8' }}>
          <strong>Ne Yaparsınız?</strong>
          <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
            <li>🌱 Aşama 1-4 seçersiniz</li>
            <li>📅 Her aşamada 4 hafta ve her haftada 5 görev yapılandırırsınız</li>
            <li>📝 Haftaya özgü hedefler belirlersiniz (zorluk, WPM, vb.)</li>
            <li>🎯 Toplam: 4 aşama × 4 hafta × 5 görev = 80 görev yapısı</li>
          </ul>
          <strong style={{ marginTop: '12px', display: 'block' }}>Yapı Örneği:</strong>
          <div style={{ marginTop: '8px', fontFamily: 'monospace', fontSize: '11px' }}>
            🌱 Aşama 1<br />
            ├─ Hafta 1: 5 görev (Hedef 300 WPM)<br />
            ├─ Hafta 2: 5 görev (Hedef 350 WPM)<br />
            ├─ Hafta 3: 5 görev (Hedef 400 WPM)<br />
            └─ Hafta 4: 5 görev (Hedef 450 WPM)<br />
            <br />
            📈 Aşama 2<br />
            ├─ Hafta 1: 5 görev (Hedef 500 WPM)<br />
            ... (Hafta 2-4)
          </div>
        </div>
      </div>

      {/* Antrenman Özellikleri */}
      <div className="card" style={{ padding: '24px', borderLeft: '4px solid #10b981' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', marginBottom: '12px' }}>
          🔧 Antrenmanların Dinamik Özellikleri
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--mu)', marginBottom: '16px', lineHeight: '1.6' }}>
          Her antrenmanın farklı parametreleri vardır. Seçildikten sonra ilgili alanlar otomatik olarak gösterilir.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'rgba(124, 58, 237, 0.1)', padding: '12px', borderRadius: '8px', fontSize: '12px' }}>
            <strong>⚡ Flash Okuma</strong>
            <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--mu)' }}>
              ✓ Süre (dk) | ✓ Zorluk | ✓ WPM | ✓ Tekrar
            </div>
          </div>
          <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '12px', borderRadius: '8px', fontSize: '12px' }}>
            <strong>🎲 Schulte Tablosu</strong>
            <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--mu)' }}>
              ✓ Süre (dk) | ✓ Zorluk | ✗ WPM | ✓ Hız Hedefi (sn)
            </div>
          </div>
          <div style={{ background: 'rgba(217, 119, 6, 0.1)', padding: '12px', borderRadius: '8px', fontSize: '12px' }}>
            <strong>🧠 Görsel Hafıza</strong>
            <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--mu)' }}>
              ✓ Süre (dk) | ✓ Zorluk | ✗ WPM | ✓ Şekil Sayısı
            </div>
          </div>
        </div>
      </div>

      {/* İşlem Sırası */}
      <div className="card" style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid #10b981' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', marginBottom: '12px' }}>
          ✅ Tavsiye Edilen İşlem Sırası
        </h2>
        <ol style={{ fontSize: '13px', lineHeight: '1.8', marginLeft: '20px', color: 'var(--fg)' }}>
          <li>
            <strong>1. Pathway Ayarları</strong> - Haftalık görev haritasını ve üniteleri belirle
          </li>
          <li>
            <strong>2. Haftalık Görev Aşamaları (YENİ)</strong> - 4 aşama × 4 hafta × 5 görev yapılandır
          </li>
          <li>
            <strong>3. Ders Atama</strong> - Hangi derslerin hangi kursta olacağını kur
          </li>
          <li>
            <strong>4. 4×5 Antrenmanlar</strong> - Her aşama için 5 antrenmanı detaylı ayarla
          </li>
          <li>
            <strong>5. Antrenman Config (JSON)</strong> - İleri parametreler için doğrudan JSON düzenle
          </li>
        </ol>
      </div>
    </div>
  );
};

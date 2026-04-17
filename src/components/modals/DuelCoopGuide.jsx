import React from 'react';

/**
 * 🎮 Düello & Co-op Sistem Rehberi
 * Detaylı açıklama ve iş akışı
 */
export function DuelCoopGuide() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* BAŞLIK */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
          ⚔️ Düello & 🤝 Co-op Sistem
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mu)' }}>
          İki farklı multiplayer oyun modu - birbiriyle ya da birlikte
        </p>
      </div>

      {/* DÜELLO SİSTEMİ */}
      <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '20px', borderRadius: '12px', border: '2px solid #ec4899' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px', color: '#ec4899' }}>
          ⚔️ DÜELLO SİSTEMİ
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          
          {/* Özellik 1 */}
          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '6px' }}>🎯 Nasıl Oynarsın?</div>
            <ul style={{ fontSize: '12px', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
              <li>Arkadaşına <strong>meydan oku</strong></li>
              <li>5 raunt oynanır</li>
              <li>Her rauntta antrenman kartı seç</li>
              <li>O antrenmanın özeliklerini tahmin et</li>
              <li>Doğru tahmin = +10 puan</li>
              <li>Yanlış tahmin = -5 puan</li>
            </ul>
          </div>

          {/* Özellik 2 */}
          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '6px' }}>🃏 Kart Seçimi</div>
            <p style={{ fontSize: '12px', margin: 0, lineHeight: '1.6', color: 'var(--mu)' }}>
              8 antrenman türünden birini seç:
              <br/>• Flash Okuma<br/>• Schulte Tablosu<br/>• Görsel Hafıza<br/>• Peripheral Vision<br/>• Kelime Tanıma<br/>• Dikey Okuma<br/>• Rehberli Okuma<br/>• Regresyon Engeli
            </p>
          </div>

          {/* Özellik 3 */}
          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '6px' }}>❓ Soru Türleri</div>
            <p style={{ fontSize: '12px', margin: 0, lineHeight: '1.6', color: 'var(--mu)' }}>
              Her antrenmanın kendii özelliği var:
              <br/>• Schulte: Grid boyutu?<br/>• Hafıza: Mod türü?<br/>• Hız: Süre?<br/>• Peripheral: Flash hızı?
            </p>
          </div>

          {/* Özellik 4 */}
          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '6px' }}>⏰ 10 Saniye Sınırı</div>
            <p style={{ fontSize: '12px', margin: 0, lineHeight: '1.6', color: 'var(--mu)' }}>
              Her soru 10 saniye içinde cevaplanmalı.
              <br/>
              <strong style={{ color: '#f59e0b' }}>Hızlı cevap (3sn içinde)</strong> = +5 bonus puan
            </p>
          </div>

          {/* Özellik 5 */}
          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '6px' }}>🏆 Kazananlar!</div>
            <p style={{ fontSize: '12px', margin: 0, lineHeight: '1.6', color: 'var(--mu)' }}>
              5 round sonunda en çok puanı alan kazanır.
              <br/>
              <strong style={{ color: '#10b981' }}>Ödül:</strong> XP + Trofiler
            </p>
          </div>

          {/* Özellik 6 */}
          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '6px' }}>🎲 Rastgele Seçenek</div>
            <p style={{ fontSize: '12px', margin: 0, lineHeight: '1.6', color: 'var(--mu)' }}>
              Kart seçmek istemezsen "Rastgele" butonuna bas.
              <br/>
              Sistem otomatik olarak seçecek!
            </p>
          </div>
        </div>

        {/* Düello Akışı */}
        <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '10px', color: '#ec4899' }}>→ İŞ AKIŞI (5 RAUNT)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', overflow: 'auto', paddingBottom: '8px' }}>
            <div style={{ minWidth: '80px', background: '#ec489920', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: 700 }}>
              Raunt 1<br/>Kartları Seç
            </div>
            <span style={{ fontWeight: 900 }}>→</span>
            <div style={{ minWidth: '80px', background: '#f59e0b20', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: 700 }}>
              Soruları<br/>Cevapla
            </div>
            <span style={{ fontWeight: 900 }}>→</span>
            <div style={{ minWidth: '80px', background: '#3b82f620', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: 700 }}>
              Puanları<br/>Topla
            </div>
            <span style={{ fontWeight: 900 }}>→</span>
            <div style={{ minWidth: '80px', background: '#10b98120', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: 700 }}>
              5 Raunt<br/>Bitir
            </div>
            <span style={{ fontWeight: 900 }}>→</span>
            <div style={{ minWidth: '80px', background: '#7c3aed20', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: 700 }}>
              Kazananı<br/>Belirle
            </div>
          </div>
        </div>
      </div>

      {/* CO-OP SİSTEMİ */}
      <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '12px', border: '2px solid #10b981' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px', color: '#10b981' }}>
          🤝 CO-OP (İŞBİRLİKÇİ) SİSTEMİ
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          
          {/* Özellik 1 */}
          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '6px' }}>🎯 Nasıl Oynarsın?</div>
            <ul style={{ fontSize: '12px', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
              <li>Arkadaşla <strong>ekip kurulması teklifi</strong> gönder</li>
              <li>4 Hafta × 5 Görev = 20 toplam görev</li>
              <li>Haftada sırayla oynatılır</li>
              <li>Hedef: Belirli WPM başarısına ulaş</li>
              <li>Başarılı = Ortak ödül!</li>
            </ul>
          </div>

          {/* Özellik 2 */}
          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '6px' }}>📅 Haftalık Görevler</div>
            <p style={{ fontSize: '12px', margin: 0, lineHeight: '1.6', color: 'var(--mu)' }}>
              <strong>Hafta 1-2:</strong> Temel seviye<br/>
              <strong>Hafta 3:</strong> Orta seviye<br/>
              <strong>Hafta 4:</strong> İleri seviye<br/><br/>
              Her haftada farklı hedefler
            </p>
          </div>

          {/* Özellik 3 */}
          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '6px' }}>👥 Sırası ile Oyun</div>
            <p style={{ fontSize: '12px', margin: 0, lineHeight: '1.6', color: 'var(--mu)' }}>
              <strong>A oyuncu</strong> oynuyor → Puanını kaydediyor<br/>
              <strong>B oyuncu</strong> seyrediyor<br/><br/>
              Sonra sıralar değişiyor ve B oynuyor
            </p>
          </div>

          {/* Özellik 4 */}
          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '6px' }}>✅ Başarı Koşulu</div>
            <p style={{ fontSize: '12px', margin: 0, lineHeight: '1.6', color: 'var(--mu)' }}>
              Hedef WPM başarıyla ulaşılırsa:
              <br/>
              <strong style={{ color: '#10b981' }}>✓ +100 XP her oyuncu</strong><br/>
              <strong style={{ color: '#10b981' }}>✓ Ortak trofiler</strong><br/>
              <strong style={{ color: '#10b981' }}>✓ Co-op skoru +1</strong>
            </p>
          </div>

          {/* Özellik 5 */}
          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '6px' }}>🎁 Ortak Ödüller</div>
            <p style={{ fontSize: '12px', margin: 0, lineHeight: '1.6', color: 'var(--mu)' }}>
              20 görevin hepsi başarılıyla tamamlanırsa:
              <br/>
              <strong style={{ color: '#f59e0b' }}>+2000 XP TAM TAKIM</strong><br/>
              <strong style={{ color: '#f59e0b' }}>🏆 Co-op Ustası Rozeti</strong>
            </p>
          </div>

          {/* Özellik 6 */}
          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '6px' }}>📊 İlerleme Takibi</div>
            <p style={{ fontSize: '12px', margin: 0, lineHeight: '1.6', color: 'var(--mu)' }}>
              Her oyuncunun katkısı gösterilir.
              <br/>
              Ortak hedefe ne kadar yakın olduğunu gör.
              <br/>
              Motivasyon sistemi - ilerle için teşvik!
            </p>
          </div>
        </div>

        {/* Co-op Akışı */}
        <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '10px', color: '#10b981' }}>→ İŞ AKIŞI (4 HAFTA × 5 GÖREV)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', overflow: 'auto', paddingBottom: '8px' }}>
            <div style={{ minWidth: '90px', background: '#10b98120', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: 700 }}>
              Ekip<br/>Kurulması
            </div>
            <span style={{ fontWeight: 900 }}>→</span>
            <div style={{ minWidth: '90px', background: '#3b82f620', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: 700 }}>
              Hafta 1-4<br/>Görevler
            </div>
            <span style={{ fontWeight: 900 }}>→</span>
            <div style={{ minWidth: '90px', background: '#f59e0b20', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: 700 }}>
              Sırası ile<br/>Oyun
            </div>
            <span style={{ fontWeight: 900 }}>→</span>
            <div style={{ minWidth: '90px', background: '#ec489920', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: 700 }}>
              Puanları<br/>Topla
            </div>
            <span style={{ fontWeight: 900 }}>→</span>
            <div style={{ minWidth: '90px', background: '#7c3aed20', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: 700 }}>
              Başarılı mı?<br/>Ödül Al!
            </div>
          </div>
        </div>
      </div>

      {/* KARŞILAŞTIRMA */}
      <div style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', border: '2px solid #6366f1' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px', color: '#6366f1' }}>
          🎮 Düello vs Co-op Karşılaştırması
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--bd)' }}>
                <th style={{ padding: '8px', textAlign: 'left', fontWeight: 800 }}>Özellik</th>
                <th style={{ padding: '8px', textAlign: 'center', color: '#ec4899', fontWeight: 700 }}>⚔️ Düello</th>
                <th style={{ padding: '8px', textAlign: 'center', color: '#10b981', fontWeight: 700 }}>🤝 Co-op</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--b2)' }}>
                <td style={{ padding: '8px' }}>Duygu</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>Rekabetçi</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>İşbirlikçi</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--b2)' }}>
                <td style={{ padding: '8px' }}>Oyuncu Sayısı</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>2</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>2+</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--b2)' }}>
                <td style={{ padding: '8px' }}>Süresi</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>~10 dakika</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>4 hafta</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--b2)' }}>
                <td style={{ padding: '8px' }}>Ödül Sistemi</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>Bireysel</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>Ortak</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--b2)' }}>
                <td style={{ padding: '8px' }}>Güçlük</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>Değişken</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>Kademeli</td>
              </tr>
              <tr>
                <td style={{ padding: '8px' }}>En İyi Kullanım</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>Kısa sürede eğlence</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>Uzun vadeli hedef</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ÖNERİLER */}
      <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid #f59e0b' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b', marginBottom: '8px' }}>
          💡 İPUÇLARı
        </h4>
        <ul style={{ fontSize: '11px', lineHeight: '1.8', margin: 0, paddingLeft: '20px', color: 'var(--fg)' }}>
          <li><strong>Düello:</strong> 10 saniye süresine dayanıklı olmalısın - hızlı düşün!</li>
          <li><strong>Co-op:</strong> Türk arkadaşınla uyum sağla, hep aynı saatte olmayabilirsin</li>
          <li>Her gün biri oynayıp puanı kaydedebilir</li>
          <li>19 görev başarılıysa 20. görev isteğe bağlı olabilir</li>
          <li>Başarısız görevler tekrarlanabilir</li>
        </ul>
      </div>
    </div>
  );
}

import { AdMob } from '@capacitor-community/admob';

/**
 * AdSection Component 💳
 * Displays a non-intrusive advertisement placeholder or a Pro upsell.
 * Only visible for non-Pro users.
 */
export function AdSection({ user, type = 'banner', onReward, onClick, style = {} }) {
  if (user?.isPro) return null;

  const showRewarded = async () => {
    // Tarayıcıda (Web) reklamlar çalışmaz, sadece gerçek telefonda çalışır.
    // Geliştirme kolaylığı için tarayıcıda direkt ödül veriyoruz.
    if (window.Capacitor?.getPlatform() === 'web' || !window.Capacitor) {
      console.log("Reklam simülasyonu: Web sitesinde gerçek reklam gösterilemez. Ödül veriliyor...");
      if (onReward) onReward();
      return;
    }

    try {
      const options = {
        adId: 'ca-app-pub-8333671199406867/1549507778', // Gerçek Ödüllü Reklam ID!
      };
      
      await AdMob.prepareRewardedAd(options);
      const reward = await AdMob.showRewardedAd();
      
      if (reward && onReward) {
        onReward();
      }
    } catch (e) {
      console.error("AdMob Error:", e);
      if (onReward) onReward();
    }
  };

  const ads = [
    { title: 'FastRead Pro', desc: 'Reklamları kaldır, tüm modülleri aç!', cta: '99 TL / Ay', icon: '💎', color: '#f59e0b' },
    { title: 'Dil Öğrenmek Artık Kolay', desc: 'FastRead ile okuma hızını 3x yap.', cta: 'Hemen Başla', icon: '🎓', color: '#7c3aed' },
    { title: 'Sponsorlu İçerik', desc: 'Yeni nesil okuma deneyimini keşfet.', cta: 'İncele', icon: '🚀', color: '#0891b2' }
  ];

  const ad = ads[Math.floor(Math.random() * ads.length)];

  const showBanner = async () => {
    try {
      const options = {
        adId: 'ca-app-pub-8333671199406867/2862589449', // Gerçek Banner ID!
        position: 'BOTTOM_CENTER',
        margin: 0,
        isTesting: false
      };
      await AdMob.showBanner(options);
    } catch (e) {
      console.error("Banner Error:", e);
    }
  };

  if (type === 'heart') {
    return (
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #f97316, #fb923c)', 
        color: 'white', 
        padding: 15, 
        textAlign: 'center',
        border: 'none',
        ...style 
      }}>
        <div style={{ fontSize: 24, marginBottom: 5 }}>⚡</div>
        <div style={{ fontWeight: 800, fontSize: 14 }}>Boltage mı Bitti?</div>
        <div style={{ fontSize: 11, opacity: 0.9, marginBottom: 12 }}>Bir reklam izle ve 2 Boltage kazan!</div>
        <button className="btn bs" onClick={showRewarded} style={{ background: 'white', color: '#f97316', width: '100%', fontWeight: 800 }}>
          📺 Reklam İzle (+2 ⚡)
        </button>
      </div>
    );
  }

  return (
    <div className="card hov" 
      onClick={onClick}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 15, 
        padding: '12px 18px', 
        background: 'var(--s1)', 
        border: '1px solid var(--b1)', 
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        ...style 
    }}>
      <div style={{ 
        position: 'absolute', 
        top: 4, 
        right: 8, 
        fontSize: 8, 
        fontWeight: 800, 
        color: 'var(--mu)', 
        textTransform: 'uppercase',
        letterSpacing: 0.5
      }}>Sponsorlu</div>
      
      <div style={{ 
        width: 40, 
        height: 40, 
        borderRadius: 10, 
        background: ad.color + '22', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: 20
      }}>
        {ad.icon}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 800 }}>{ad.title}</div>
        <div style={{ fontSize: 11, color: 'var(--mu)' }}>{ad.desc}</div>
      </div>
      
      <button className="btn bg bs" style={{ fontSize: 10, padding: '6px 12px', fontWeight: 800 }}>
        {ad.cta}
      </button>
    </div>
  );
}

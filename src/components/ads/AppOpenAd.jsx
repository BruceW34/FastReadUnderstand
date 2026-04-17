import React, { useState, useEffect } from 'react';

/**
 * App Open Ad Component (Startup Ad) 📺
 * Simulates a full-screen ad that appears on app start.
 * AdMob App ID: ca-app-pub-8333671199406867~6270663050
 * AdMob Unit ID: ca-app-pub-8333671199406867/7971445897
 */
export function AppOpenAd({ onClose, canDismiss = false }) {
  const [countdown, setCountdown] = useState(3);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (canDismiss) {
      setCanSkip(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [canDismiss]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#0a0a0f', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 40, textAlign: 'center'
    }}>
      {/* Ad Logo Placeholder */}
      <div style={{ 
        width: 120, height: 120, 
        background: 'linear-gradient(45deg, #4f46e5, #ec4899)', 
        borderRadius: 30, marginBottom: 40,
        boxShadow: '0 20px 50px rgba(79, 70, 229, 0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 48
      }}>⚡</div>

      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 10, color: 'white' }}>FastRead Pro</h1>
      <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 300, lineHeight: 1.5, marginBottom: 40 }}>
        Daha hızlı okuma ve odaklanma için reklamsız deneyime bugün geçin!
      </p>

      {/* Action Button */}
      <button className="btn bp" style={{ padding: '15px 40px', fontSize: 16, fontWeight: 900, borderRadius: 15 }}>
        Hemen Yükselt
      </button>

      {/* Close/Skip Button */}
      {(canSkip || canDismiss) ? (
        <button 
          onClick={onClose}
          style={{ 
            marginTop: 30, background: 'var(--blue)', border: 'none', color: 'white',
            padding: '12px 30px', borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: 'pointer',
            boxShadow: '0 10px 20px rgba(26, 60, 255, 0.3)',
            animation: 'fadeIn 0.3s'
          }}
        >
          UYGULAMAYA GEÇ ➜
        </button>
      ) : (
        <div style={{ marginTop: 30, color: '#475569', fontSize: 13, fontWeight: 700 }}>
          Uygulama açılıyor... ({countdown})
        </div>
      )}

      {/* Ad Disclosure & IDs */}
      <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 10, color: '#334155', textTransform: 'uppercase', letterSpacing: 1 }}>
        Reklam
      </div>
      <div style={{ position: 'absolute', bottom: 20, left: 20, fontSize: 8, color: '#1e293b', textAlign: 'left' }}>
        AdMob App: ca-app-pub-8333...050<br/>
        Unit: ca-app-pub-8333...897
      </div>
    </div>
  );
}

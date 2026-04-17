import React, { useState, useEffect } from 'react';
import { db } from '@/services/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

export function DuelManagement({ user, addToast }) {
  const [settings, setSettings] = useState({
    defaultStake: 100,
    roundCount: 5,
    draftTimer: 15,
    gamePool: ['schulte', 'memory', 'peripheral', 'wordrecog']
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'admin', 'duels'));
        if (snap.exists()) {
          setSettings(snap.data());
        }
      } catch (e) {
        console.error('Fetch duel settings error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const save = async () => {
    try {
      await setDoc(doc(db, 'admin', 'duels'), settings, { merge: true });
      addToast({ msg: 'Düello ayarları güncellendi!', color: '#10b981', icon: '⚔️' });
    } catch (e) {
      console.error('Save duel settings error:', e);
      addToast({ msg: 'Ayarlar kaydedilemedi.', color: '#ef4444' });
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  const toggleGame = (game) => {
    let next = [...settings.gamePool];
    if (next.includes(game)) next = next.filter(g => g !== game);
    else next.push(game);
    setSettings({ ...settings, gamePool: next });
  };

  return (
    <div className="card" style={{ padding: '24px', animation: 'fadeIn 0.4s both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>⚔️ Düello & Draft Ayarları</h2>
          <p style={{ fontSize: '12px', color: 'var(--mu)' }}>Çoklu raunt ve seçim aşaması parametreleri.</p>
        </div>
        <button className="btn bp" onClick={save}>💾 Ayarları Kaydet</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div className="st-item">
          <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--mu)', display: 'block', marginBottom: '8px' }}>VARSAYILAN BAHİS (XP)</label>
          <input 
            type="number" 
            className="input" 
            value={settings.defaultStake} 
            onChange={e => setSettings({...settings, defaultStake: parseInt(e.target.value)})}
            style={{ width: '100%' }}
          />
        </div>
        <div className="st-item">
          <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--mu)', display: 'block', marginBottom: '8px' }}>RAUNT SAYISI</label>
          <input 
            type="number" 
            className="input" 
            value={settings.roundCount} 
            onChange={e => setSettings({...settings, roundCount: parseInt(e.target.value)})}
            style={{ width: '100%' }}
          />
        </div>
        <div className="st-item">
          <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--mu)', display: 'block', marginBottom: '8px' }}>SEÇİM SÜRESİ (SN)</label>
          <input 
            type="number" 
            className="input" 
            value={settings.draftTimer} 
            onChange={e => setSettings({...settings, draftTimer: parseInt(e.target.value)})}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--mu)', display: 'block', marginBottom: '12px' }}>AKTİF OYUN HAVUZU</label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['schulte', 'memory', 'peripheral', 'wordrecog', 'flash', 'guided'].map(game => (
            <button 
              key={game}
              className={`btn ${settings.gamePool.includes(game) ? 'bp' : 'bg'}`}
              style={{ padding: '8px 16px', fontSize: '12px', opacity: settings.gamePool.includes(game) ? 1 : 0.6 }}
              onClick={() => toggleGame(game)}
            >
              {game.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="tip-box" style={{ marginTop: '30px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
        💡 <strong>Not:</strong> Oyun havuzuna yeni oyunlar eklemeden önce ilgili modülün <code>matchData</code> desteği olduğundan emin olun. Şu an Schulte, Hafıza, Çevre Görüşü ve Kelime Tanıma tam desteklidir.
      </div>
    </div>
  );
}

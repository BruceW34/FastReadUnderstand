import React, { useState } from 'react';
import { getLvl } from '@/data/levels.js';
import { db } from '@/services/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, addDoc, collection, serverTimestamp } from 'firebase/firestore';

/**
 * TopNav Component ⚡
 * Duolingo-style header for stats like Energy (Volt), Streaks, Level, and Notifications.
 */
export function TopNav({ user, onOpenHeart, onOpenStreak, onOpenDiamond, onOpenLevels, tab, addToast, onTabChange }) {
  const [showNotif, setShowNotif] = useState(false);
  
  const { c, p } = getLvl(user?.tecrube || 0); // Use tecrube (training TP) for levels
  const streak = user?.streak || 0; // Firebase'ten gelen streak
  
  // Energy system (Boltage)
  const rawHearts = user?.hearts !== undefined ? user.hearts : 5;
  const boltage = Math.max(0, Math.min(10, rawHearts * 2)); // 0-10 bar
  
  const notifications = user?.friendRequests || [];
  
  const handleRequest = async (req, action) => {
    try {
      const meRef = doc(db, 'users', user.id);
      if (action === 'accept') {
        if (req.type === 'friend') {
          await updateDoc(meRef, {
            friends: arrayUnion(req.id),
            friendRequests: arrayRemove(req),
          });
          await updateDoc(doc(db, 'users', req.id), {
            friends: arrayUnion(user.id),
          });
          addToast?.({ msg: `${req.name} ile arkadaş oldun!`, color: '#10b981', icon: '👥' });
        } else if (req.type === 'duel') {
          const match = {
            p1: { id: user.id, name: user.name, avatar: user.avatar || '👤', score: 0, status: 'waiting' },
            p2: { id: req.id, name: req.name, avatar: req.avatar || '👤', score: 0, status: 'waiting' },
            type: 'schulte', status: 'active', createdAt: serverTimestamp(), stake: 200,
          };
          await addDoc(collection(db, 'matches'), match);
          await updateDoc(meRef, { friendRequests: arrayRemove(req) });
          addToast?.({ msg: `Düello hazır! Sosyal sekmesinden girebilirsin.`, color: '#f59e0b', icon: '⚔️' });
          localStorage.setItem('sr_social_tab', 'coop');
          onTabChange?.('social');
        } else if (req.type === 'coop') {
          const mission = {
            title: 'Haftalık Hız Maratonu', memberIds: [user.id, req.id],
            members: [
              { id: user.id, name: user.name, contribution: 0 },
              { id: req.id, name: req.name, contribution: 0 },
            ],
            goalXP: 10000, currentXP: 0, deadline: '7 Gün', reward: 2000,
            status: 'active', createdAt: serverTimestamp(),
          };
          await addDoc(collection(db, 'coop_missions'), mission);
          await updateDoc(meRef, { friendRequests: arrayRemove(req) });
          addToast?.({ msg: `${req.name} ile Co-op göreviniz başladı!`, color: '#10b981', icon: '🤝' });
          onTabChange?.('social');
        } else {
          await updateDoc(meRef, { friendRequests: arrayRemove(req) });
        }
      } else if (action === 'reject') {
        await updateDoc(meRef, { friendRequests: arrayRemove(req) });
        addToast?.({ msg: `İstek reddedildi.`, color: '#f59e0b', icon: '✕' });
      }
    } catch (e) {
      console.error(e);
      addToast?.({ msg: 'Hata oluştu.', color: '#ef4444' });
    }
  };


  return (
    <div className="topbar">
      <div className="topbar-title" style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 24 }}>⚡</span>
      </div>
      <div className="topbar-right">
        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <div className="tb-stat" style={{ cursor: 'pointer', position: 'relative', background: notifications.length > 0 ? 'rgba(124,58,237,0.1)' : 'var(--b1)' }} onClick={() => setShowNotif(!showNotif)}>
            <span className="ico">🔔</span>
            {notifications.length > 0 && (
              <div style={{
                position: 'absolute', top: -5, right: -5,
                background: '#ef4444', color: '#fff', fontSize: 10, width: 18, height: 18,
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900
              }}>
                {notifications.length}
              </div>
            )}
          </div>
          
          {showNotif && (
            <div className="card notif-dropdown" style={{ position: 'absolute', top: 50, right: 0, width: 'clamp(280px, 90vw, 380px)', maxHeight: '450px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              <div style={{ fontWeight: 800, marginBottom: 15, fontSize: 12, textTransform: 'uppercase', color: 'var(--mu)', letterSpacing: 1 }}>
                📬 {notifications.length} İstek
              </div>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--mu)', fontSize: 13 }}>
                  📭 Bildiriminiz yok
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {notifications.map(req => (
                    <div key={req.id + req.type} style={{ background: 'var(--b2)', padding: '12px', borderRadius: '10px', border: '1px solid var(--b3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ fontSize: 28, minWidth: 40, textAlign: 'center' }}>{req.avatar || '👤'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 12, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.name.substring(0, 25)}</div>
                          <div style={{ fontSize: 10, color: 'var(--mu)', marginTop: 3 }}>
                            {req.type === 'friend' ? '👥 Arkadaş' : req.type === 'duel' ? '⚔️ Düello' : req.type === 'coop' ? '🤝 Ekip' : '💬 Mesaj'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        <button className="btn bp bs" style={{ padding: '6px 8px', fontSize: 11, background: '#10b981', fontWeight: 700 }} onClick={() => { handleRequest(req, 'accept'); setShowNotif(false); }}>✓ Kabul</button>
                        <button className="btn bg bs" style={{ padding: '6px 8px', fontSize: 11, fontWeight: 700 }} onClick={() => { handleRequest(req, 'reject'); setShowNotif(false); }}>✕ Red</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="tb-stat" style={{ cursor: 'pointer' }} onClick={onOpenStreak}>
          <span className="ico">🔥</span>
          <span id="streakNum">{streak}</span>
        </div>

        {/* TP (XP) Display - deduplicated to only rocket icon */}
        <div className="card hov" style={{ padding: '8px 15px', color: 'var(--ac)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowNotif(false) || onTabChange('social')}>
          <div style={{ marginRight: 6 }}>🚀</div>
          <span id="xpNum">{(user?.tecrube || 0).toLocaleString()} TP</span>
        </div>

        <div className="card hov" style={{ padding: '8px 15px', color: '#f97316', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f9731644', background: 'rgba(249, 115, 22, 0.05)' }} onClick={onOpenHeart}>
          <div style={{ marginRight: 6, fontSize: 18 }}>⚡</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <span style={{ fontWeight: 900, fontSize: 18, fontFamily: 'var(--mo)' }}>{boltage}</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--mu)' }}>/10</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { db } from '@/services/firebase';
import { 
  collection, query, where, onSnapshot, addDoc, 
  serverTimestamp, orderBy, limit, doc, getDoc,
  updateDoc, arrayUnion
} from 'firebase/firestore';
import { DuelDraft } from './DuelDraft';
import { DuelCardGame } from './DuelCardGame';
import CoopMission from './CoopMission';

/**
 * CoopHub Component 🤝⚔️
 * Real-time Duel and Co-op Multiplayer System
 */
export default function CoopHub({ user, addToast, onTabChange, setMatchData }) {
  const [activeDraftMatchId, setActiveDraftMatchId] = useState(null);
  const [activeGameMatchId, setActiveGameMatchId] = useState(null);
  const [activeMissionId, setActiveMissionId] = useState(null);
  const [mode, setMode] = useState('duel'); // 'duel', 'together'
  const [matches, setMatches] = useState([]);
  const [coopMissions, setCoopMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showCoopModal, setShowCoopModal] = useState(false);
  const [friendsList, setFriendsList] = useState([]);

  // 1. Listen for Matches - Automatically cleanup old pending matches
  useEffect(() => {
    if (!user?.id) return;
    const q1 = query(collection(db, "matches"), where("p1.id", "==", user.id));
    const q2 = query(collection(db, "matches"), where("p2.id", "==", user.id));

    const unsub1 = onSnapshot(q1, (snap) => {
        const m1 = snap.docs.map(d => {
            const data = d.data();
            const createdTime = data.createdAt?.seconds || 0;
            const nowTime = Math.floor(Date.now() / 1000);
            const ageInHours = (nowTime - createdTime) / 3600;
            
            // Auto-close pending matches older than 24 hours
            if (data.status === 'drafting' && ageInHours > 24) {
              updateDoc(doc(db, 'matches', d.id), { status: 'expired' }).catch(e => console.error(e));
              return null;
            }
            return { id: d.id, ...data };
        }).filter(m => m);
        
        setMatches(prev => {
            const combined = [...m1, ...prev.filter(x => x.p1?.id !== user.id)];
            return combined.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        });
        setLoading(false);
    }, (error) => {
        console.error('Error listening to matches (p1):', error);
        setLoading(false);
    });

    const unsub2 = onSnapshot(q2, (snap) => {
        const m2 = snap.docs.map(d => {
            const data = d.data();
            const createdTime = data.createdAt?.seconds || 0;
            const nowTime = Math.floor(Date.now() / 1000);
            const ageInHours = (nowTime - createdTime) / 3600;
            
            // Auto-close pending matches older than 24 hours
            if (data.status === 'drafting' && ageInHours > 24) {
              updateDoc(doc(db, 'matches', d.id), { status: 'expired' }).catch(e => console.error(e));
              return null;
            }
            return { id: d.id, ...data };
        }).filter(m => m);
        
        setMatches(prev => {
            const combined = [...m2, ...prev.filter(x => x.p2?.id !== user.id)];
            return combined.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        });
        setLoading(false);
    }, (error) => {
        console.error('Error listening to matches (p2):', error);
        setLoading(false);
    });

    return () => { unsub1(); unsub2(); };
  }, [user?.id]);

  // 2. Cleanup expired matches - delete them after 24 hours
  useEffect(() => {
    if (matches.length === 0) return;
    
    const cleanupInterval = setInterval(async () => {
      const nowTime = Math.floor(Date.now() / 1000);
      
      for (const match of matches) {
        if (match.status === 'expired') {
          const createdTime = match.createdAt?.seconds || 0;
          const ageInHours = (nowTime - createdTime) / 3600;
          
          // Delete expired matches after they've been expired for 1 hour
          if (ageInHours > 25) {
            try {
              const matchRef = collection(db, 'matches');
              const q = query(matchRef, where('__name__', '==', match.id));
              // Actually delete the document
              // For now, just mark as deleted in a field since direct delete is risky
              updateDoc(doc(db, 'matches', match.id), { 
                status: 'deleted',
                deletedAt: serverTimestamp()
              }).catch(e => console.error('Error deleting match:', e));
            } catch (err) {
              console.error('Cleanup error:', err);
            }
          }
        }
      }
    }, 3600000); // Check every hour
    
    return () => clearInterval(cleanupInterval);
  }, [matches]);

  // 2. Listen for Co-op Missions
  useEffect(() => {
    if (!user?.id) return;
    const q = query(collection(db, "coop_missions"), where("memberIds", "array-contains", user.id));
    const unsub = onSnapshot(q, (snap) => {
      setCoopMissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error('Error listening to co-op missions:', error);
    });
    return () => unsub();
  }, [user?.id]);

  // 3. Fetch Friends for Challenge
  const fetchFriends = async () => {
    if (!user.friends || user.friends.length === 0) return;
    const list = [];
    for (const fId of user.friends) {
        const d = await getDoc(doc(db, "users", fId));
        if (d.exists()) list.push({ id: d.id, ...d.data() });
    }
    setFriendsList(list);
  };

  const startDuel = async (targetUser, gameType = 'schulte') => {
    try {
        const req = {
          id: user.id,
          name: user.name,
          avatar: user.avatar || '👤',
          type: 'duel',
          gameType: gameType
        };
        await updateDoc(doc(db, "users", targetUser.id), {
          friendRequests: arrayUnion(req)
        });
        addToast({ msg: `${targetUser.name}'e meydan okuma isteği gönderildi! ⚔️`, icon: '👊' });
        setShowChallengeModal(false);
    } catch (e) {
        console.error(e);
        addToast({ msg: 'Hata oluştu.', color: '#ef4444' });
    }
  };

  const startCoop = async (targetUser) => {
    try {
        const req = {
          id: user.id,
          name: user.name,
          avatar: user.avatar || '👤',
          type: 'coop'
        };
        await updateDoc(doc(db, "users", targetUser.id), {
          friendRequests: arrayUnion(req)
        });
        addToast({ msg: `${targetUser.name}'e ekip daveti gönderildi! 🤝`, icon: '✨' });
        setShowCoopModal(false);
    } catch (e) {
        console.error(e);
        addToast({ msg: 'Hata oluştu.', color: '#ef4444' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <button 
          className={`btn ${mode === 'together' ? 'bp' : 'bg'} bs`} 
          style={{ flex: 1, padding: 12, fontWeight: 800 }}
          onClick={() => setMode('together')}
        >
          🤝 CO-OP
        </button>
        <button 
          className={`btn ${mode === 'duel' ? 'bp' : 'bg'} bs`} 
          style={{ flex: 1, padding: 12, fontWeight: 800 }}
          onClick={() => setMode('duel')}
        >
          ⚔️ ONLINE
        </button>
      </div>

      {mode === 'duel' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card hov" style={{ background: 'rgba(var(--ac-rgb), 0.05)', borderStyle: 'dashed', cursor: 'pointer' }} onClick={() => { setShowChallengeModal(true); fetchFriends(); }}>
            <div style={{ textAlign: 'center', padding: '15px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⚔️</div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Yeni Düello Başlat</div>
              <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 5 }}>Arkadaşlarına meydan oku ve XP hırsızı ol!</div>
              <button 
                className="btn bp bs" 
                style={{ marginTop: 15, background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setShowChallengeModal(true); 
                  fetchFriends(); 
                }}
              >
                MEYDAN OKU
              </button>
            </div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 10 }}>Aktif Mücadeleler</div>
          
          {loading ? (
             <div style={{ padding: 30, textAlign: 'center', color: 'var(--mu)' }}>Mücadeleler taranıyor...</div>
          ) : matches.filter(m => m && m.status !== 'expired' && m.status !== 'deleted').length === 0 ? (
             <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
                <div style={{ color: 'var(--mu)', fontSize: 13 }}>Henüz aktif bir düellon yok.</div>
             </div>
          ) : matches.filter(m => m && m.status !== 'expired' && m.status !== 'deleted').map(m => {
             const isP1 = m.p1.id === user.id;
             const myData = isP1 ? m.p1 : m.p2;
             const oppData = isP1 ? m.p2 : m.p1;
             const myTurn = m.status === 'drafting' ? (m.draft?.turn === user.id) : (myData.status === 'waiting');
             const finished = m.status === 'completed';
             const isDrafting = m.status === 'drafting';

             return (
                <div key={m.id} className="card" style={{ 
                    padding: '15px 20px', 
                    borderLeft: `6px solid ${finished ? '#10b981' : (isDrafting ? '#f59e0b' : (myTurn ? 'var(--ac)' : 'var(--b1)'))}`
                }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                      <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--mu)', textTransform: 'uppercase' }}>
                          {isDrafting ? 'HAZIRLIK AŞAMASI' : (m.type + ' • ' + m.stake + ' XP STAKE')}
                      </div>
                      <div style={{ fontSize: 10, color: finished ? '#10b981' : (isDrafting ? '#f59e0b' : 'var(--mu)') }}>
                          {finished ? 'TAMAMLANDI' : (isDrafting ? 'SEÇİM YAPILIYOR' : 'DEVAM EDİYOR')}
                      </div>
                   </div>
                   
                   <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                         <div style={{ fontSize: 32 }}>{myData.avatar}</div>
                         <div style={{ fontSize: 11, fontWeight: 800, marginTop: 4 }}>{myData.name}</div>
                         <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--ac)' }}>{myData.score}</div>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 900, opacity: 0.3 }}>VS</div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                         <div style={{ fontSize: 32 }}>{oppData.avatar}</div>
                         <div style={{ fontSize: 11, fontWeight: 800, marginTop: 4 }}>{oppData.name}</div>
                         <div style={{ fontSize: 18, fontWeight: 900, color: '#f43f5e' }}>{oppData.score}</div>
                      </div>
                   </div>

                   {!finished && (
                      <div style={{ marginTop: 15 }}>
                         {isDrafting ? (
                             <button 
                                className="btn bp" 
                                style={{ width: '100%', padding: '10px 0', fontSize: 12, fontWeight: 900, background: '#f59e0b' }}
                                onClick={() => setActiveDraftMatchId(m.id)}
                            >
                                STRATEJİ SEÇ! ⚡
                            </button>
                         ) : myTurn ? (
                            <button 
                                className={`btn ${myData.status === 'ready' ? 'bg' : 'bp'}`} 
                                style={{ width: '100%', padding: '10px 0', fontSize: 12, fontWeight: 900 }}
                                disabled={myData.status === 'ready'}
                                onClick={() => {
                                    const mRef = doc(db, 'matches', m.id);
                                    updateDoc(mRef, { [`${isP1 ? 'p1' : 'p2'}.status`]: 'ready' }).then(async () => {
                                        const snap = await getDoc(mRef);
                                        const updatedM = { id: snap.id, ...snap.data() };
                                        if (updatedM.p1.status === 'ready' && updatedM.p2.status === 'ready') {
                                            setMatchData(updatedM);
                                            const currentRound = updatedM.rounds ? updatedM.rounds[updatedM.currentRound - 1] : null;
                                            if (currentRound) onTabChange(currentRound.type);
                                            else onTabChange(updatedM.type);
                                        }
                                    });
                                }}
                            >
                                {myData.status === 'ready' ? 'RAKİP BEKLENİYOR...' : 'ŞİMDİ OYNA! ⚡'}
                            </button>
                         ) : (
                            <div style={{ 
                                padding: '8px', background: 'var(--b2)', borderRadius: 10, 
                                fontSize: 11, color: 'var(--mu)', textAlign: 'center', fontWeight: 700 
                            }}>
                                RAKİBİN SIRASI BEKLENİYOR...
                            </div>
                         )}
                      </div>
                   )}
                </div>
             );
          })}
          
          <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20 }}>Savaş Günlüğü (Son 10 Sonuç)</div>
          
          {matches.filter(m => m.status === 'completed').length === 0 ? (
             <div style={{ padding: 20, textAlign: 'center', opacity: 0.5, fontSize: 13 }}>Henüz tamamlanmış bir savaş yok.</div>
          ) : matches.filter(m => m.status === 'completed').slice(0, 10).map(m => {
             const isP1 = m.p1.id === user.id;
             const myData = isP1 ? m.p1 : m.p2;
             const oppData = isP1 ? m.p2 : m.p1;
             const iWon = m.winnerId === user.id;

             return (
                <div key={m.id} style={{ 
                    display: 'flex', alignItems: 'center', gap: 12, padding: 12, 
                    background: 'var(--b2)', borderRadius: 12, marginBottom: 8,
                    border: `1px solid ${iWon ? '#10b98133' : '#ef444433'}`
                }}>
                   <div style={{ fontSize: 20 }}>{iWon ? '🏆' : '💀'}</div>
                   <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{oppData.name} ile Savaş</div>
                      <div style={{ fontSize: 11, color: iWon ? '#10b981' : '#f43f5e' }}>{iWon ? 'KAZANDIN' : 'KAYBETTİN'}</div>
                   </div>
                   <div style={{ textAlign: 'right', fontWeight: 900, fontSize: 14 }}>
                      {myData.score} <span style={{ opacity: 0.3, fontSize: 10 }}>vs</span> {oppData.score}
                   </div>
                </div>
             );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ background: 'rgba(16, 185, 129, 0.05)', borderStyle: 'dashed' }}>
            <div style={{ textAlign: 'center', padding: '15px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Ortak Görev Başlat</div>
              <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 5 }}>Arkadaşınla güçlerini birleştir, büyük ödülü bölüşün!</div>
              <button 
                className="btn bp bs" 
                style={{ marginTop: 15, background: 'linear-gradient(135deg, #10b981, #059669)' }}
                onClick={() => { setShowCoopModal(true); fetchFriends(); }}
              >
                EKİP KUR
              </button>
            </div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 10 }}>Ekipler & İlerleme</div>

          {coopMissions.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
               <div style={{ fontSize: 40, marginBottom: 10 }}>🏘️</div>
               <div style={{ color: 'var(--mu)', fontSize: 13 }}>Henüz bir ekibin yok.</div>
            </div>
          ) : coopMissions.map(mission => {
            const pct = (mission.currentXP / mission.goalXP) * 100;
            return (
              <div key={mission.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                   <div>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{mission.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--mu)' }}>{mission.members.length} Kişilik Ekip</div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#10b981' }}>{mission.reward} XP</div>
                      <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>{mission.deadline}</div>
                   </div>
                </div>
                
                <div style={{ background: 'var(--b2)', height: 10, borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: 10 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--mu)', fontWeight: 800 }}>
                  <span>{mission.currentXP.toLocaleString()} / {mission.goalXP.toLocaleString()} XP</span>
                  <span>%{Math.round(pct)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drafting Modal */}
      {activeDraftMatchId && (
          <div className="modal-overlay" style={{ zIndex: 4000 }}>
              <div className="card" style={{ width: '100%', maxWidth: 600, padding: 0, overflow: 'hidden' }}>
                  <button 
                    onClick={() => setActiveDraftMatchId(null)}
                    style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', color: 'var(--mu)', fontSize: 24, cursor: 'pointer', zIndex: 10 }}
                  >
                      ✕
                  </button>
                  <DuelDraft 
                    matchId={activeDraftMatchId} 
                    userId={user.id} 
                    onFinish={() => setActiveDraftMatchId(null)} 
                  />
              </div>
          </div>
      )}

      {/* Challenge Modal */}
      {showChallengeModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
           <div className="card" style={{ width: '100%', maxWidth: 400, padding: 25 }}>
              <h3 style={{ margin: '0 0 20px', fontWeight: 900 }}>Arkadaşına Meydan Oku</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
                 {friendsList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--mu)' }}>Henüz hiç arkadaşın yok. Önce arkadaş ekle!</div>
                 ) : friendsList.map(f => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 15, padding: 12, background: 'var(--b2)', borderRadius: 12 }}>
                       <div style={{ fontSize: 24 }}>{f.avatar}</div>
                       <div style={{ flex: 1, fontWeight: 700 }}>{f.name}</div>
                       <div style={{ display: 'flex', gap: 5 }}>
                          <button className="btn bp bs" onClick={() => startDuel(f, 'schulte')} title="Schulte">🎲</button>
                          <button className="btn bp bs" onClick={() => startDuel(f, 'memory')} title="Hafıza">🧠</button>
                       </div>
                    </div>
                 ))}
              </div>

              <button className="btn bg" style={{ width: '100%', marginTop: 20 }} onClick={() => setShowChallengeModal(false)}>İPTAL</button>
           </div>
        </div>
      )}

      {/* Co-op Invite Modal */}
      {showCoopModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
           <div className="card" style={{ width: '100%', maxWidth: 400, padding: 25 }}>
              <h3 style={{ margin: '0 0 20px', fontWeight: 900 }}>Ekip Arkadaşı Seç</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
                 {friendsList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--mu)' }}>Henüz hiç arkadaşın yok. Önce arkadaş ekle!</div>
                 ) : friendsList.map(f => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 15, padding: 12, background: 'var(--b2)', borderRadius: 12 }}>
                       <div style={{ fontSize: 24 }}>{f.avatar}</div>
                       <div style={{ flex: 1, fontWeight: 700 }}>{f.name}</div>
                       <button className="btn bp bs" onClick={() => startCoop(f)} title="Davet Et">Davet Et</button>
                    </div>
                 ))}
              </div>
              <button className="btn bg" style={{ width: '100%', marginTop: 20 }} onClick={() => setShowCoopModal(false)}>İPTAL</button>
           </div>
        </div>
      )}
    </div>
  );
}

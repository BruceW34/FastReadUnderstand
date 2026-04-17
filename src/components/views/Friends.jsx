import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/services/firebase';
import { 
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getLvl, getLeague } from '@/data/levels.js';
import { PublicProfileModal } from '@/components/shared/Shared.jsx';

/**
 * Enhanced Friends Component 👥
 * Features: Tabs, Global/Friends League, Search by Email/Name, Friend Management,
 *           basic Düello ve Co-op entegrasyonu.
 */
export default function Friends({ user, addToast, onTabChange, isMobile }) {
  const [tab, setTab] = useState('rankings'); // 'rankings', 'my_friends', 'add'
  const [leagueType, setLeagueType] = useState('friends'); // 'global', 'friends'
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [globalUsers, setGlobalUsers] = useState([]);
  const [friendsData, setFriendsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState([]); // Gönderilen taleplereri
  
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // 1. Fetch Global Top Users
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      setGlobalUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      if (leagueType === 'global') setLoading(false);
    }, (error) => {
      console.error('Error loading global users:', error);
      if (leagueType === 'global') setLoading(false);
    });
    return () => unsub();
  }, [leagueType]);

  // 2. Fetch Detailed Friends Data
  useEffect(() => {
    if (!user.friends || user.friends.length === 0) {
      setFriendsData([]);
      setLoading(false);
      return;
    }

    // Firebase 'in' query limit is 10, so we might need to batch if user has many friends
    // For now, let's handle up to 30 friends in batches of 10
    const fetchFriends = async () => {
      const chunks = [];
      for (let i = 0; i < user.friends.length; i += 10) {
        chunks.push(user.friends.slice(i, i + 10));
      }

      const results = [];
      for (const chunk of chunks) {
        const q = query(collection(db, "users"), where("id", "in", chunk));
        const snap = await getDocs(q);
        results.push(...snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
      setFriendsData(results);
      setLoading(false);
    };

    fetchFriends();
  }, [user.friends]);

  // 3. Friends League logic (Friends + Me)
  const friendsLeague = useMemo(() => {
    const list = [...friendsData];
    // Check if I'm already in the list (if I added myself as friend, though unlikely)
    if (!list.find(u => u.id === user.id)) {
      list.push({ ...user });
    }
    return list.sort((a, b) => (b.xp || 0) - (a.xp || 0));
  }, [friendsData, user]);

  // 4. Search Logic (Email or Name)
  const handleSearch = async () => {
    if (!search.trim() || search.trim().length < 3) {
      return addToast({ msg: 'En az 3 karakter girin.', color: '#f59e0b' });
    }
    setSearching(true);
    try {
      let results = [];
      
      // Try email first (exact match)
      const qEmail = query(collection(db, "users"), where("email", "==", search.trim()));
      const snapEmail = await getDocs(qEmail);
      results = snapEmail.docs.map(d => ({ id: d.id, ...d.data() }));

      // Also try name (username) - exact match for now as Firestore doesn't support easy 'contains' without third-party
      if (results.length === 0) {
        const qName = query(collection(db, "users"), where("name", "==", search.trim()));
        const snapName = await getDocs(qName);
        results = snapName.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      setSearchResults(results.filter(u => u.id !== user.id));
      if (results.length === 0) addToast({ msg: 'Kullanıcı bulunamadı.' });
    } catch (e) {
      console.error(e);
      addToast({ msg: 'Arama hatası.', color: '#ef4444' });
    } finally {
      setSearching(false);
    }
  };

  const addFriend = async (targetUser) => {
    if (user.friends?.includes(targetUser.id)) return addToast({ msg: 'Zaten ekli!' });
    try {
      await updateDoc(doc(db, "users", targetUser.id), {
        friendRequests: arrayUnion({ id: user.id, name: user.name, avatar: user.avatar, type: 'friend' })
      });
      addToast({ msg: `${targetUser.name}'e arkadaşlık isteği gönderildi!`, color: '#10b981', icon: '📩' });
      // Remove from search results mostly so we don't spam
      setSearchResults(prev => prev.filter(u => u.id !== targetUser.id));
    } catch (e) {
      console.error(e);
      addToast({ msg: 'Hata oluştu.', color: '#ef4444' });
    }
  };

  const handleRequest = async (req, action) => {
    try {
      const meRef = doc(db, 'users', user.id);

      if (action === 'accept') {
        if (req.type === 'friend') {
          // Karşılıklı arkadaş ekle
          await updateDoc(meRef, {
            friends: arrayUnion(req.id),
            friendRequests: arrayRemove(req),
          });
          await updateDoc(doc(db, 'users', req.id), {
            friends: arrayUnion(user.id),
          });
          addToast({
            msg: `${req.name} ile arkadaş oldun!`,
            color: '#10b981',
            icon: '👥',
          });
        } else if (req.type === 'duel') {
          // Düello isteğini kabullen → yeni match oluştur
          const match = {
            p1: {
              id: req.id, // The one who sent the request
              name: req.name,
              avatar: req.avatar || '👤',
              score: 0,
              status: 'waiting',
            },
            p2: {
              id: user.id, // The one who accepted
              name: user.name,
              avatar: user.avatar || '👤',
              score: 0,
              status: 'waiting',
            },
            status: 'drafting',
            draft: {
                picks: [],
                turn: req.id, // The challenger starts picking
                subPhase: 'game',
                tempGame: null
            },
            createdAt: serverTimestamp(),
            currentRound: 1,
            stake: 10, // Default stake, will be updated in draft
          };
          await addDoc(collection(db, 'matches'), match);
          await updateDoc(meRef, { friendRequests: arrayRemove(req) });
          addToast({
            msg: `Düello hazır! Sosyal > Co-op > Düello sekmesinden gir.`,
            color: '#f59e0b',
            icon: '⚔️',
          });
          localStorage.setItem('sr_social_tab', 'coop');
          onTabChange && onTabChange('social');
        } else if (req.type === 'coop') {
          // Co-op isteğini kabullen → yeni ortak görev oluştur
          const mission = {
            title: 'Haftalık Hız Maratonu',
            memberIds: [user.id, req.id],
            members: [
              { id: user.id, name: user.name, contribution: 0 },
              { id: req.id, name: req.name, contribution: 0 },
            ],
            goalXP: 10000,
            currentXP: 0,
            deadline: '7 Gün',
            reward: 2000,
            status: 'active',
            createdAt: serverTimestamp(),
          };
          await addDoc(collection(db, 'coop_missions'), mission);
          await updateDoc(meRef, { friendRequests: arrayRemove(req) });
          addToast({
            msg: `${req.name} ile Co-op göreviniz başladı!`,
            color: '#10b981',
            icon: '🤝',
          });
          localStorage.setItem('sr_social_tab', 'coop');
          onTabChange && onTabChange('social');
        } else {
          // Bilinmeyen tip – sadece isteği temizle
          await updateDoc(meRef, { friendRequests: arrayRemove(req) });
        }
      } else {
        await updateDoc(meRef, { friendRequests: arrayRemove(req) });
        addToast({ msg: `İstek reddedildi.`, color: '#f59e0b' });
      }
    } catch (e) {
      console.error(e);
      addToast({ msg: 'Hata oluştu.', color: '#ef4444' });
    }
  };

  const removeFriend = async (fId, name) => {
    try {
      const friendRef = doc(db, "users", fId);
      await updateDoc(doc(db, "users", user.id), {
        friends: arrayRemove(fId)
      });
      // Also remove from their friends list
      await updateDoc(friendRef, {
        friends: arrayRemove(user.id)
      });
      addToast({ msg: `${name} arkadaşlıktan çıkarıldı.`, color: '#ef4444', icon: '👋' });
    } catch (e) {
      console.error(e);
      addToast({ msg: 'Hata oluştu.', color: '#ef4444' });
    }
  };

  // Gönderilen arkadaşlık talebini geri çek (Withdraw)
  const withdrawRequest = async (targetId, targetName) => {
    try {
      const targetRef = doc(db, "users", targetId);
      const currentReqs = (await getDocs(query(collection(db, "users")))).docs
        .find(d => d.id === targetId)?.data()?.friendRequests || [];
      
      const myRequest = currentReqs.find(r => r.id === user.id);
      if (myRequest) {
        await updateDoc(targetRef, {
          friendRequests: arrayRemove(myRequest)
        });
        addToast({ msg: `${targetName}'e gönderdiğin istek geri çekildi.`, color: '#f59e0b', icon: '↩️' });
        setSearchResults(prev => prev.filter(u => u.id !== targetId));
      }
    } catch (e) {
      console.error(e);
      addToast({ msg: 'Hata oluştu.', color: '#ef4444' });
    }
  };

  const UserRow = ({ u, rank, isMe }) => {
    const { c } = getLvl(u.tecrube || 0);
    const league = getLeague(u.xp || 0);
    const mobile = isMobile !== undefined ? isMobile : window.innerWidth <= 768;
    return (
      <div 
        onClick={() => !isMe && setSelectedUser(u)}
        style={{ 
          display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 15, padding: isMobile ? '12px 10px' : '16px 20px',
          background: isMe ? 'rgba(var(--ac-rgb), 0.1)' : 'var(--b1)',
          borderBottom: '1px solid var(--b2)',
          borderRadius: 12,
          marginBottom: 8,
          cursor: isMe ? 'default' : 'pointer',
          position: 'relative',
          overflow: 'hidden'
      }}>
        {isMe && <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: 'var(--ac)' }} />}
        
        <div style={{ width: isMobile ? 25 : 35, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: isMobile ? 14 : 18, color: rank <= 3 ? '#f59e0b' : 'var(--mu)', fontFamily: 'var(--mo)' }}>
            {rank}
          </div>
        </div>
        
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: isMobile ? 24 : 40, background: league.bg, borderRadius: '50%', width: isMobile ? 44 : 56, height: isMobile ? 44 : 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {u.avatar || '👤'}
          </div>
          <div style={{ position: 'absolute', bottom: -5, right: -5, fontSize: isMobile ? 12 : 16, background: 'var(--b1)', borderRadius: '50%', padding: 2 }} title={league.name}>
            {league.icon}
          </div>
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: isMobile ? 14 : 16, color: isMe ? 'var(--ac)' : 'var(--tx)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {u.name || 'İsimsiz'}
          </div>
          <div style={{ fontSize: isMobile ? 10 : 12, color: 'var(--mu)', display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ color: league.color, fontWeight: 700 }}>{league.name}</span>
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: isMobile ? 14 : 18, fontWeight: 900, fontFamily: 'var(--mo)', color: 'var(--fg)' }}>
            {(u.xp || 0) > 1000 ? `${((u.xp || 0)/1000).toFixed(1)}k` : (u.xp || 0)}
          </div>
          <div style={{ fontSize: 9, color: 'var(--mu)', textTransform: 'uppercase', fontWeight: 800 }}>
            XP
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.3s ease-out' }}>
      <style>{`
        .f-tabs { display: flex; gap: 5; background: var(--b1); padding: 5px; borderRadius: 12px; margin-bottom: 5px; }
        .f-tab { 
          flex: 1; border: none; background: transparent; color: var(--mu); 
          padding: 10px; borderRadius: 8px; cursor: pointer; font-size: 13px; font-weight: 700;
          transition: all 0.2s;
        }
        .f-tab.active { background: var(--b2); color: var(--tx); box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        .l-toggle { display: flex; gap: 10; margin-bottom: 15; }
        .l-btn { 
          padding: 6px 15px; border-radius: 20px; border: 1px solid var(--b2); 
          background: var(--b1); color: var(--mu); font-size: 12px; font-weight: 700; cursor: pointer;
        }
        .l-btn.active { background: var(--ac); color: #fff; border-color: var(--ac); }
      `}</style>

      <div>
        <div className="st">👥 Arkadaşlar & Ligler</div>
        <div className="ss">Arkadaşlarınla yarış, gelişimini takip et!</div>
      </div>

      <div className="f-tabs">
        <button className={`f-tab ${tab === 'rankings' ? 'active' : ''}`} onClick={() => setTab('rankings')}>🏆 Sıralama</button>
        <button className={`f-tab ${tab === 'my_friends' ? 'active' : ''}`} onClick={() => setTab('my_friends')}>👥 Arkadaşlarım</button>
        <button className={`f-tab ${tab === 'add' ? 'active' : ''}`} onClick={() => setTab('add')}>➕ Arkadaş Ekle</button>
      </div>

      {tab === 'rankings' && (() => {
        const myLeague = getLeague(user.xp || 0);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div className="card" style={{ padding: '25px 20px', textAlign: 'center', background: `linear-gradient(to bottom, ${myLeague.bg}, transparent)`, borderTop: `2px solid ${myLeague.color}` }}>
              <div style={{ fontSize: 64, marginBottom: 10 }}>{myLeague.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: myLeague.color, letterSpacing: 1, textTransform: 'uppercase' }}>
                {myLeague.name} Lig
              </div>
              <div style={{ fontSize: 13, color: 'var(--mu)', marginTop: 8 }}>
                Sıradaki lige geçmek için EXP toplamaya devam et!
              </div>

              <div className="l-toggle" style={{ justifyContent: 'center', marginTop: 25, marginBottom: 0 }}>
                <button className={`l-btn ${leagueType === 'friends' ? 'active' : ''}`} onClick={() => setLeagueType('friends')}>Dostlar Arası</button>
                <button className={`l-btn ${leagueType === 'global' ? 'active' : ''}`} onClick={() => setLeagueType('global')}>Küresel Sıralama</button>
              </div>
            </div>

            <div>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--mu)' }}>Sıralama hesaplanıyor...</div>
              ) : (
                (leagueType === 'friends' ? friendsLeague : globalUsers).map((u, i) => (
                  <UserRow key={u.id} u={u} rank={i + 1} isMe={u.id === user.id} />
                ))
              )}
              {!loading && leagueType === 'friends' && friendsData.length === 0 && (
                <div className="card" style={{ padding: 40, textAlign: 'center', background: 'var(--b1)' }}>
                  <div style={{ fontSize: 48, marginBottom: 15 }}>🌵</div>
                  <div style={{ color: 'var(--mu)', fontSize: 15, fontWeight: 600 }}>Şu an bu ligde kimse yok.</div>
                  <div style={{ color: 'var(--mu)', fontSize: 13, marginTop: 5 }}>Arkadaş ekleyerek ligini canlandır!</div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {tab === 'my_friends' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {user.friendRequests && user.friendRequests.length > 0 && (
            <div className="card" style={{ borderColor: 'rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.05)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#34d399', marginBottom: 15, textTransform: 'uppercase' }}>🔔 Gelen İstekler</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {user.friendRequests.map(req => (
                  <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '10px 15px', background: 'var(--b1)', borderRadius: 12 }}>
                    <div style={{ fontSize: 32 }}>{req.avatar || '👤'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800 }}>{req.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--mu)' }}>
                        {req.type === 'friend'
                          ? 'Arkadaşlık isteği'
                          : req.type === 'duel'
                          ? 'Düello daveti'
                          : req.type === 'coop'
                          ? 'Co-op daveti'
                          : 'İstek'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn bp bs" style={{ padding: '8px 16px', background: '#10b981' }} onClick={() => handleRequest(req, 'accept')}>Onayla</button>
                      <button className="btn bd bs" style={{ padding: '8px 16px' }} onClick={() => handleRequest(req, 'decline')}>Reddet</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="card">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
            {friendsData.length > 0 ? friendsData.map((f, i) => {
              const { c } = getLvl(f.tecrube || 0);
              return (
                <div key={f.id} onClick={() => setSelectedUser(f)} style={{ 
                  display: 'flex', alignItems: 'center', gap: 15, padding: '15px 20px',
                  borderBottom: i === friendsData.length - 1 ? 'none' : '1px solid var(--b1)',
                  cursor: 'pointer'
                }}>
                  <div style={{ fontSize: 30 }}>{f.avatar || '👤'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{f.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--mu)' }}>
                       <span style={{ color: c.color, fontWeight: 700 }}>{c.name}</span> • {f.xp?.toLocaleString()} XP
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button
                      className="btn bp bs"
                      style={{ padding: '6px 12px', fontSize: 14 }}
                      title="Düello Daveti Gönder"
                      onClick={async (e) => {
                        try {
                          await updateDoc(doc(db, "users", f.id), {
                            friendRequests: arrayUnion({ id: user.id, name: user.name, avatar: user.avatar, type: 'duel' })
                          });
                          addToast({ msg: `${f.name}'e düello daveti gönderildi! ⚔️`, color: '#f59e0b', icon: '⚔️' });
                          e.currentTarget.innerText = '✅';
                          e.currentTarget.disabled = true;
                        } catch(err) { console.error(err); }
                      }}
                    >
                      ⚔️
                    </button>
                    <button
                      className="btn bg bs"
                      style={{ padding: '6px 12px', fontSize: 14, background: 'rgba(16,185,129,.1)', color: '#10b981', borderColor: 'rgba(16,185,129,.3)' }}
                      title="Co-op Daveti Gönder"
                      onClick={async (e) => {
                        try {
                          await updateDoc(doc(db, "users", f.id), {
                            friendRequests: arrayUnion({ id: user.id, name: user.name, avatar: user.avatar, type: 'coop' })
                          });
                          addToast({ msg: `${f.name} ile co-op daveti gönderildi! 🤝`, color: '#3b82f6', icon: '🤝' });
                          e.currentTarget.innerText = '✅';
                          e.currentTarget.disabled = true;
                        } catch(err) { console.error(err); }
                      }}
                    >
                      🤝
                    </button>
                    <button className="btn bd bs" style={{ padding: '6px 12px', fontSize: 14 }} title="Kaldır" onClick={() => removeFriend(f.id, f.name)}>🗑️</button>
                  </div>
                </div>
              );
            }) : (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
                <div style={{ color: 'var(--mu)' }}>Arkadaş listen şu an boş.</div>
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {tab === 'add' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 15 }}>Arama</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input 
                className="ai" 
                placeholder="E-posta veya kullanıcı adı..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1 }}
              />
              <button className="btn bp" onClick={handleSearch} disabled={searching}>
                {searching ? '...' : '🔍 Ara'}
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="card" style={{ animation: 'slideDown 0.3s ease-out' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mu)', marginBottom: 15, textTransform: 'uppercase' }}>Arama Sonuçları</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {searchResults.map(r => (
                  <div key={r.id} onClick={() => setSelectedUser(r)} style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '5px 0', cursor: 'pointer' }}>
                    <div style={{ fontSize: 32 }}>{r.avatar || '👤'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--mu)' }}>{r.email}</div>
                    </div>
                    <button className="btn bp bs" onClick={(e) => { e.stopPropagation(); addFriend(r); }}>
                      Ekle +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!search && globalUsers.length > 0 && (
            <div className="card" style={{ marginTop: 10, animation: 'slideDown 0.3s ease-out' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mu)', marginBottom: 15, textTransform: 'uppercase' }}>Önerilen Kişiler (Küresel Liderler)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {globalUsers.filter(u => u.id !== user.id && !user.friends?.includes(u.id)).slice(0, 5).map(r => {
                  const rLvl = getLvl(r.tecrube || 0).c;
                  return (
                    <div key={r.id} onClick={() => setSelectedUser(r)} style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '8px 12px', background: 'var(--b2)', borderRadius: 12, cursor: 'pointer' }}>
                      <div style={{ fontSize: 32 }}>{r.avatar || '👤'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800 }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--mu)' }}>{rLvl.code} • <span style={{ color: rLvl.color }}>{rLvl.name}</span></div>
                      </div>
                      <button 
                        className="btn bg bs" 
                        disabled={(r.friendRequests || []).some(req => req.id === user.id && req.type === 'friend')}
                        style={{ padding: '6px 12px', fontSize: 13, background: 'rgba(124,58,237,.1)', color: 'var(--ac)', borderColor: 'rgba(124,58,237,.3)' }} 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          addFriend(r); 
                          e.currentTarget.innerText = 'İstek Gönderildi ✅';
                          e.currentTarget.disabled = true;
                        }}
                      >
                        {(r.friendRequests || []).some(req => req.id === user.id && req.type === 'friend') ? 'İstek Gönderildi ✅' : 'Ekle +'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      <PublicProfileModal currentUser={user} targetUser={selectedUser} onClose={() => setSelectedUser(null)} addToast={addToast} />
    </div>
  );
}

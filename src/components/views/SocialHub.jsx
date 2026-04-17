import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/services/firebase';
import { collection, query, orderBy, limit, onSnapshot, getDocs, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getLvl, getLeague, ACHIEVEMENTS as ALL_ACHS, LEAGUES } from '@/data/levels.js';
import CoopHub from '@/components/modals/CoopHub.jsx';
import { PublicProfileModal } from '@/components/shared/Shared.jsx';

/**
 * SocialHub Component 🏆👥
 * A Duolingo-style social center with Leagues and Quests.
 */
export default function SocialHub({ user, onXP, addToast, onTabChange, setMatchData, isMobile }) {
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem('sr_social_tab') || 'leagues'); 
    const [leagueTab, setLeagueTab] = useState('my'); // 'my', 'friends', 'global'
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);

    const [friendsData, setFriendsData] = useState([]);
    const [globalQuests, setGlobalQuests] = useState([]);

    const myLeague = getLeague(user.xp || 0);
    const myLeagueIndex = LEAGUES.findIndex(l => l.id === myLeague.id);
    const maxXP = myLeagueIndex < LEAGUES.length - 1 ? LEAGUES[myLeagueIndex + 1].minXP : 999999;

  useEffect(() => {
    setLoading(true);
    let q;
    
    if (leagueTab === 'global') {
      q = query(collection(db, "users"), orderBy("xp", "desc"), limit(30));
    } else {
      q = query(
        collection(db, "users"), 
        where("xp", ">=", myLeague.minXP), 
        where("xp", "<", maxXP), 
        orderBy("xp", "desc"), 
        limit(30)
      );
    }

    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      console.error('Error loading users:', error);
      setLoading(false);
    });
    return () => unsub();
  }, [leagueTab, myLeague.minXP, maxXP]);

    // Fetch Global Quests
    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'admin', 'quests'), (snap) => {
            if (snap.exists()) {
                setGlobalQuests(snap.data().list || []);
            }
        }, (error) => {
            console.error('Error loading global quests:', error);
        });
        return () => unsub();
    }, []);

    // Fetch Detailed Friends Data
    useEffect(() => {
        if (!user.friends || user.friends.length === 0) {
            setFriendsData([]);
            return;
        }

        const fetchFriends = async () => {
            const chunks = [];
            for (let i = 0; i < user.friends.length; i += 10) {
                chunks.push(user.friends.slice(i, i + 10));
            }

            const results = [];
            for (const chunk of chunks) {
                const qq = query(collection(db, "users"), where("id", "in", chunk));
                const snap = await getDocs(qq);
                results.push(...snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
            setFriendsData(results);
        };

        fetchFriends();
    }, [user.friends]);

  const friendsLeague = useMemo(() => {
    const list = [...friendsData];
    if (!list.find(u => u.id === user.id)) list.push({ ...user });
    return list.sort((a, b) => (b.xp || 0) - (a.xp || 0));
  }, [friendsData, user]);

  const UserRow = ({ u, rank, isMe, totalUsers }) => {
    const { c } = getLvl(u.tecrube || 0);
    const league = getLeague(u.xp || 0);
    
    // Duolingo Zone Logic
    let zone = 'safe';
    let zoneColor = 'transparent';
    let glow = 'none';

    if (leagueTab !== 'global') {
      if (rank <= 3) { 
        zone = 'promotion-top'; 
        zoneColor = 'rgba(245, 158, 11, 0.15)'; // Gold tint for top 3
        glow = '0 0 10px rgba(245, 158, 11, 0.4)';
      } 
      else if (rank <= 5) { 
        zone = 'promotion'; 
        zoneColor = 'rgba(16, 185, 129, 0.1)'; 
      }
      else if (totalUsers > 15 && rank > totalUsers - 5) { 
        zone = 'demotion'; 
        zoneColor = 'rgba(239, 68, 68, 0.1)'; 
      }
    }

    return (
      <div 
        onClick={() => !isMe && setSelectedUser(u)}
        style={{ 
          display: 'flex', alignItems: 'center', gap: 15, padding: '16px 20px',
          background: isMe ? 'rgba(var(--ac-rgb), 0.15)' : zoneColor !== 'transparent' ? zoneColor : 'var(--b1)',
          borderBottom: '1px solid var(--b2)',
          borderRadius: 8,
          marginBottom: 8,
          cursor: isMe ? 'default' : 'pointer',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: glow
      }}>
        {isMe && <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: 'var(--ac)' }} />}
        {zone === 'demotion' && <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 3, background: '#ef4444' }} />}
        {(zone === 'promotion' || zone === 'promotion-top') && <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 3, background: '#10b981' }} />}
        
        <div style={{ width: 35, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: rank <= 3 ? '#f59e0b' : 'var(--mu)', fontFamily: 'var(--mo)' }}>
            {rank}
          </div>
          {rank === 1 && <div style={{ fontSize: 10 }}>👑</div>}
        </div>
        
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 40, background: league.bg, borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {u.avatar || '👤'}
          </div>
          <div style={{ position: 'absolute', bottom: -5, right: -5, fontSize: 16, background: 'var(--b1)', borderRadius: '50%', padding: 2 }} title={league.name}>
            {league.icon}
          </div>
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: isMe ? 'var(--ac)' : 'var(--tx)', marginBottom: 2 }}>
            {u.name || 'İsimsiz'} {isMe && <span style={{ fontSize: 12, color: 'var(--mu)', fontWeight: 600 }}>(Sen)</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--mu)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ color: c.color, fontWeight: 700 }}>{c.name}</span> 
            <span>•</span>
            <span style={{ color: league.color, fontWeight: 700 }}>{league.name} Lig</span>
          </div>
        </div>
        
        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--mo)', color: 'var(--fg)' }}>
              {(u.xp || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: 'var(--mu)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5 }}>
              XP
            </div>
          </div>
          {!isMe && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await updateDoc(doc(db, "users", u.id), {
                    friendRequests: arrayUnion({ id: user.id, name: user.name, avatar: user.avatar, type: 'duel' })
                  });
                  addToast({ msg: `${u.name}'e düello daveti gönderildi! ⚔️`, color: '#f59e0b', icon: '⚔️' });
                } catch(err) { console.error(err); }
              }}
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 16,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Düello Daveti Gönder"
            >
              ⚔️
            </button>
          )}
        </div>
      </div>
    );
  };

    const quests = useMemo(() => {
        return globalQuests.map(q => {
            let progress = 0;
            if (q.id === 'w1') { // Weekly Runner (Custom logic example)
                progress = Math.max(0, (user.xp || 0) - (user.xpAtWeekStart || 0));
            } else if (q.id === 'm1') { // Month Champ
                progress = (user.sessions || []).filter(s => new Date(s.date).getMonth() === new Date().getMonth()).length;
            } else if (q.id === 'w2') { // Book Worm
                progress = (user.readTexts || []).length;
            } else {
                // Generic logic: check if q.targetField is defined in json
                const field = q.targetField || 'xp';
                progress = user[field] || 0;
            }
            return { ...q, progress };
        });
    }, [globalQuests, user]);

  const claimQuest = (q) => {
    if ((user.completedQuests || []).includes(q.id)) {
        addToast({ msg: 'Bu ödül zaten alındı!', color: '#ef4444' });
        return;
    }
    const reducedReward = Math.floor(q.reward / 4); // 75% reduction to match onXP scaling
    onXP(reducedReward, 0, q.id, 'Görev Ödülü', reducedReward); 
    addToast({ msg: `${q.title} ödülü alındı!`, color: '#10b981', icon: '🎁' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* 1. TOP TABS */}
      <div style={{ display: 'flex', background: 'var(--b2)', borderRadius: 16, padding: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {['leagues', 'quests', 'achievements', 'online'].map(t => (
          <button 
            key={t}
            onClick={() => {
                setActiveTab(t);
                localStorage.setItem('sr_social_tab', t);
            }}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: 12,
              border: 'none',
              background: activeTab === t ? 'var(--b1)' : 'transparent',
              color: activeTab === t ? 'var(--ac)' : 'var(--mu)',
              fontWeight: 800,
              fontSize: isMobile ? 10 : 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase'
            }}
          >
            {t === 'leagues' ? '🏆 Ligler' : t === 'quests' ? '🎯 Görevler' : t === 'achievements' ? '🏅 Başarılar' : '🤝 Online'}
          </button>
        ))}
      </div>

      {activeTab === 'leagues' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div className="card" style={{ padding: isMobile ? '20px 15px' : '25px 20px', textAlign: 'center', background: `linear-gradient(to bottom, ${myLeague.bg}, transparent)`, borderTop: `2px solid ${myLeague.color}` }}>
            <div style={{ fontSize: isMobile ? 48 : 64, marginBottom: 10 }}>{myLeague.icon}</div>
            <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 900, color: myLeague.color, letterSpacing: 1, textTransform: 'uppercase' }}>
              {myLeague.name} Lig
            </div>
            <div style={{ fontSize: isMobile ? 12 : 13, color: 'var(--mu)', marginTop: 8 }}>
              Sıradaki lige geçmek için EXP toplamaya devam et!
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 25, marginBottom: 0, flexWrap: 'wrap' }}>
              <button 
                onClick={() => setLeagueTab('my')}
                style={{
                  padding: isMobile ? '5px 10px' : '6px 15px', borderRadius: 20, border: `1px solid ${leagueTab === 'my' ? 'var(--ac)' : 'var(--b2)'}`,
                  background: leagueTab === 'my' ? 'var(--ac)' : 'var(--b1)', color: leagueTab === 'my' ? '#fff' : 'var(--mu)',
                  fontSize: isMobile ? 10 : 12, fontWeight: 700, cursor: 'pointer'
                }}>Ligi</button>
              <button 
                onClick={() => setLeagueTab('friends')}
                style={{
                  padding: isMobile ? '5px 10px' : '6px 15px', borderRadius: 20, border: `1px solid ${leagueTab === 'friends' ? 'var(--ac)' : 'var(--b2)'}`,
                  background: leagueTab === 'friends' ? 'var(--ac)' : 'var(--b1)', color: leagueTab === 'friends' ? '#fff' : 'var(--mu)',
                  fontSize: isMobile ? 10 : 12, fontWeight: 700, cursor: 'pointer'
                }}>Arkadaşlar</button>
              <button 
                onClick={() => setLeagueTab('global')}
                style={{
                  padding: isMobile ? '5px 10px' : '6px 15px', borderRadius: 20, border: `1px solid ${leagueTab === 'global' ? 'var(--ac)' : 'var(--b2)'}`,
                  background: leagueTab === 'global' ? 'var(--ac)' : 'var(--b1)', color: leagueTab === 'global' ? '#fff' : 'var(--mu)',
                  fontSize: isMobile ? 10 : 12, fontWeight: 700, cursor: 'pointer'
                }}>Global</button>
            </div>
          </div>

          <div>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--mu)' }}>Sıralama hesaplanıyor...</div>
            ) : (
              (() => {
                const list = leagueTab === 'friends' ? friendsLeague : users;
                return list.map((u, i) => {
                  const rank = i + 1;
                  return (
                    <React.Fragment key={u.id}>
                      {leagueTab !== 'global' && rank === 1 && <div style={{ fontSize: 13, color: '#f59e0b', fontWeight: 900, padding: '10px 10px 5px', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}>👑 LİDER TABLOSU</div>}
                      {leagueTab !== 'global' && rank === 4 && <div style={{ fontSize: 13, color: '#10b981', fontWeight: 800, padding: '10px 10px 5px', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}><span>⬆️</span> Yükselme Bölgesi</div>}
                      {leagueTab !== 'global' && rank === 6 && <div style={{ fontSize: 13, color: 'var(--mu)', fontWeight: 800, padding: '10px 10px 5px', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}><span>➖</span> Güvenli Bölge</div>}
                      {leagueTab !== 'global' && list.length > 15 && rank === list.length - 4 && <div style={{ fontSize: 13, color: '#ef4444', fontWeight: 800, padding: '20px 10px 5px', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}><span>⬇️</span> Düşme Bölgesi</div>}
                      <UserRow u={u} rank={rank} isMe={u.id === user.id} totalUsers={list.length} />
                    </React.Fragment>
                  );
                });
              })()
            )}
            
            {!loading && leagueTab === 'friends' && friendsData.length === 0 && (
              <div className="card" style={{ padding: 40, textAlign: 'center', background: 'var(--b1)' }}>
                <div style={{ fontSize: 48, marginBottom: 15 }}>🌵</div>
                <div style={{ color: 'var(--mu)', fontSize: 15, fontWeight: 600 }}>Şu an bu ligde kimse yok.</div>
                <div style={{ color: 'var(--mu)', fontSize: 13, marginTop: 5 }}>Arkadaş ekleyerek ligini canlandır!</div>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'quests' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {/* Bolt Encouragement for Quests */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '10px 0' }}>
            <img src="assets/bolt.png" alt="Bolt" style={{ width: 50, height: 50 }} />
            <div className="ss" style={{ fontSize: 13, fontWeight: 600 }}>
              "Mücadelelere devam Bruce! Tamamladığın her görev seni zirveye taşır! ⚡"
            </div>
          </div>

          {quests.map(q => {
            const pct = Math.min(100, (q.progress / q.total) * 100);
            return (
              <div key={q.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                  <div style={{ display: 'flex', gap: isMobile ? 10 : 12 }}>
                    <div style={{ 
                      width: isMobile ? 40 : 44, 
                      height: isMobile ? 40 : 44, 
                      borderRadius: 12, 
                      background: 'var(--b2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? 20 : 24 
                    }}>{q.icon}</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: isMobile ? 13 : 15 }}>{q.title}</div>
                      <div style={{ fontSize: isMobile ? 11 : 12, color: 'var(--mu)' }}>{q.desc}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>+{q.reward} XP</div>
                    <div style={{ fontSize: 10, color: 'var(--mu)', textTransform: 'uppercase' }}>{q.type === 'weekly' ? 'Haftalık' : 'Aylık'}</div>
                  </div>
                </div>
                
                <div style={{ background: 'var(--b2)', height: 8, borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${pct}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                    borderRadius: 10,
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, fontWeight: 700, color: 'var(--mu)' }}>
                  <span>{q.progress} / {q.total}</span>
                  <span>%{Math.round(pct)}</span>
                </div>

                {pct >= 100 && !(user.completedQuests || []).includes(q.id) && (
                  <button 
                    className="btn bp" 
                    onClick={() => claimQuest(q)}
                    style={{ width: '100%', marginTop: 15, padding: '10px', fontSize: 12, fontWeight: 900 }}
                  >
                    ÖDÜLÜ AL (+{q.reward} XP) 🎁
                  </button>
                )}
                {(user.completedQuests || []).includes(q.id) && (
                  <div style={{ 
                    marginTop: 15, 
                    padding: '8px', 
                    background: 'rgba(16, 185, 129, 0.1)', 
                    color: '#10b981', 
                    borderRadius: 10, 
                    fontSize: 12, 
                    fontWeight: 800, 
                    textAlign: 'center',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    ✓ TAMAMLANDI
                  </div>
                )}
                
                {user.isAdmin && (
                  <button 
                    onClick={() => onTabChange('admin')}
                    style={{ 
                      marginTop: 10, 
                      width: '100%', 
                      background: 'rgba(245, 158, 11, 0.1)', 
                      color: '#f59e0b', 
                      border: '1px solid #f59e0b33',
                      borderRadius: 10,
                      padding: '6px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ GÖREVLERİ DÜZENLE
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : activeTab === 'online' ? (
        <CoopHub user={user} addToast={addToast} onTabChange={onTabChange} setMatchData={setMatchData} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {/* Achievement View Integration */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '10px 0' }}>
            <img src="assets/bolt.png" alt="Bolt" style={{ width: 50, height: 50 }} />
            <div className="ss" style={{ fontSize: 13, fontWeight: 600 }}>
              "Her kupa senin ne kadar hırslı olduğunu gösterir! Koleksiyonu tamamla! 🏅"
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: isMobile ? 8 : 12 }}>
            {ALL_ACHS.map(a => {
              const has = (user.unlockedAchievements || []).includes(a.id);
              return (
                <div key={a.id} className="card hov" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? 10 : 15, 
                  padding: isMobile ? 12 : 16,
                  opacity: has ? 1 : 0.4,
                  filter: has ? 'none' : 'grayscale(1)',
                  background: has ? 'var(--b2)' : 'transparent',
                  borderColor: has ? 'var(--ac)33' : 'var(--b1)'
                }}>
                  <div style={{ fontSize: isMobile ? 24 : 30, filter: has ? 'none' : 'grayscale(1)' }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: isMobile ? 12 : 14 }}>{a.name}</div>
                    <div style={{ fontSize: isMobile ? 10 : 11, color: 'var(--mu)' }}>{a.desc}</div>
                    {has && <div style={{ fontSize: 9, color: '#10b981', fontWeight: 900, marginTop: 4 }}>✓ +{a.xp} XP KAZANILDI</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <PublicProfileModal currentUser={user} targetUser={selectedUser} onClose={() => setSelectedUser(null)} addToast={addToast} />
    </div>
  );
}

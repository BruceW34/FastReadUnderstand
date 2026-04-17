import React, { useState, useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { getLvl, getStreak } from './data/levels';
import { DEFAULT_TEXTS } from './data/texts';
import { storage } from './shared/storage';
import { AdService } from '@/services/AdService';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  collection,
  query,
  where,
  getDocs,
  increment,
} from 'firebase/firestore';
import { Auth, Toasts } from '@/components/shared/Shared';
import { TopNav } from '@/components/layout/TopNav';
import Dashboard from '@/components/views/Dashboard';
import Library from '@/components/views/Library';
import {
  FlashRead,
  GuidedRead,
  VertRead,
  Regress,
  EyeGym,
  Schulte,
  VisualMemory,
  WPMTest,
  PeripheralVision,
  WordRecognition,
  DailyChallenge,
  ProgressChart,
  Achievements,
} from './components/modules';
import Profile from '@/components/views/Profile';
import SocialHub from '@/components/views/SocialHub';
import Friends from '@/components/views/Friends';
import TrainingMenu from '@/components/views/TrainingMenu';
import Pathway from '@/components/views/Pathway';
import Landing from '@/components/views/Landing';
import OnlineMatchmaking from '@/components/modals/OnlineMatchmaking';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  HeartModal,
  StreakModal,
  DiamondModal,
  LevelDetailsModal,
  ThemeModal,
} from '@/components/modals/StoreModals';
import { AppOpenAd } from '@/components/ads/AppOpenAd';
import { LoadingScreen } from './app/LoadingScreen';
import { SidebarNav } from './app/SidebarNav';
import { MobileBottomNav } from './app/MobileBottomNav';
import { NAV_ITEMS } from './app/navConfig';
import type { ReadingText, User } from './shared/types';

const NAV = NAV_ITEMS;

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>(
    typeof window !== 'undefined'
      ? localStorage.getItem('sr_tab') || 'pathway'
      : 'pathway',
  );
  const [demoMode, setDemoMode] = useState(false);
  const [demoXP, setDemoXP] = useState(0);
  const [theme, setTheme] = useState<string>(
    typeof window !== 'undefined'
      ? localStorage.getItem('sr_theme') || 'dark'
      : 'dark',
  );

  useEffect(() => {
    localStorage.setItem('sr_tab', tab);
  }, [tab]);

  useEffect(() => {
    const activeTheme = (user as any)?.activeTheme || theme;
    if (typeof document === 'undefined') return;
    document.body.classList.remove(
      'light-theme',
      'retro-theme',
      'ocean-theme',
      'neon-theme',
    );
    if (activeTheme !== 'dark') {
      document.body.classList.add(`${activeTheme}-theme`);
    }
    localStorage.setItem('sr_theme', activeTheme);
  }, [theme, (user as any)?.activeTheme]);

  const [toasts, setToasts] = useState<any[]>([]);
  const [texts, setTexts] = useState<ReadingText[]>(() => {
    const custom = storage.get<ReadingText[]>('sr_custom_texts', []);
    const ids = new Set(DEFAULT_TEXTS.map((t) => t.id));
    return [...DEFAULT_TEXTS, ...custom.filter((t) => !ids.has(t.id))];
  });
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
  );
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'heart' | 'streak' | 'diamond' | 'levels' | 'theme' | null
  >(
    typeof window !== 'undefined'
      ? (sessionStorage.getItem('sr_modal') as any) || null
      : null,
  );

  useEffect(() => {
    if (activeModal) {
      sessionStorage.setItem('sr_modal', activeModal);
    } else {
      sessionStorage.removeItem('sr_modal');
    }
  }, [activeModal]);
  const [showAppOpenAd, setShowAppOpenAd] = useState(true);
  const [matchData, setMatchData] = useState<any>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clear matchData when navigating to core menus (Training, Pathway, etc.)
  useEffect(() => {
    const coreTabs = ['pathway', 'training', 'dashboard', 'profile', 'library', 'achievements', 'social'];
    // We only clear if we are NOT in a module tab but matchData is still active
    // EXCEPT for 'social' where the draft/duel view is, we keep it there if they are in the hub
    const moduleTabs = ['flash', 'guided', 'vert', 'regress', 'eye', 'peripheral', 'wordrecog', 'schulte', 'memory', 'wpmtest', 'daily'];
    
    if (coreTabs.includes(tab) && tab !== 'social' && matchData) {
        setMatchData(null);
    }
  }, [tab, matchData]);

  useEffect(() => {
    // Initialize AdMob
    AdService.initialize().then(() => {
       const adFreq = parseInt(localStorage.getItem('sr_ad_freq') || '3');
       const launches = parseInt(localStorage.getItem('sr_ad_launches') || '0') + 1;
       localStorage.setItem('sr_ad_launches', launches.toString());
       
       if (launches % adFreq === 0) {
           AdService.showInterstitial(() => {
             console.log("Startup Interstitial finished");
           });
       }

       // Ad frekansını Firebase'den yükle (offline olursa lokal değeri kullan)
       getDoc(doc(db, 'admin', 'ads')).then(snap => {
           if (snap.exists() && snap.data().adFrequency) {
               console.log('📊 Ad frekansı Firebase\'den yüklendi');
               localStorage.setItem('sr_ad_freq', snap.data().adFrequency.toString());
           }
       }).catch(err => {
           if (err.code === 'unavailable' || err.message?.includes('offline')) {
               console.log('⚠️ Firebase offline - yerel ad frekansı kullanılıyor');
           } else {
               console.error('Ad config hatası:', err);
           }
       });
    });
  }, []);

  // Energy (Boltage) Regeneration Logic
  useEffect(() => {
    if (!user || user.hearts >= 5) return;

    const REGEN_TIME = 30 * 60 * 1000; // 30 minutes for 0.5 hearts
    const interval = setInterval(async () => {
      const now = Date.now();
      const lastRegen = (user as any).lastEnergyRegen || now;
      const elapsed = now - lastRegen;

      if (elapsed >= REGEN_TIME) {
        const heartsToAdd = Math.floor(elapsed / REGEN_TIME) * 0.5;
        const newHearts = Math.min(5, (user.hearts || 0) + heartsToAdd);
        
        try {
          await updateDoc(doc(db, 'users', user.id), {
            hearts: newHearts,
            lastEnergyRegen: now
          });
          console.log(`Energy regenerated: +${heartsToAdd} hearts`);
        } catch (e) {
          console.error("Energy regen sync error:", e);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        console.log('✅ Firebase kullanıcı bulundu:', firebaseUser.uid);
        
        const unsubDoc = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              console.log('✅ Firestore verileri yüklendi');
              setUser(docSnap.data() as User);
            } else {
              // Veri yok - henüz Firestore'da yazılmamış (yeni hesap)
              console.log('ℹ️ Firestore\'da veri yok - varsayılan veriler kullanılıyor');
              setUser({
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'Yeni Kullanıcı',
                email: firebaseUser.email || '',
                xp: 0,
                tecrube: 0,
                sessions: [],
                isPro: false,
                hearts: 5,
                diamonds: 0,
              });
            }
            setLoading(false);
          },
          (error: any) => {
            console.error('⚠️ Firestore snapshot Error:', error?.code || error?.message);
            // Network/offline hatası olsa da loading'i kapat - onSnapshot otomatik retry edecek
            if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
              console.log('📡 Network timeout - önbellekten veri okumaya çalışılıyor...');
            }
            // Fallback user - varsayılan veriler
            setUser(prev => prev || {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Kullanıcı',
              email: firebaseUser.email || '',
              xp: 0,
              tecrube: 0,
              sessions: [],
              isPro: false,
              hearts: 5,
              diamonds: 0,
            });
            setLoading(false);
          },
        );
        return () => unsubDoc();
      } else {
        // Kullanıcı giriş yapmamış
        console.log('ℹ️ Kullanıcı giriş yapmamış - Login sayfası gösteriliyor');
        setUser(null);
        setLoading(false);
      }
    }, (error) => {
      console.error('❌ Auth state error:', error);
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const addToast = useCallback(
    ({ msg, color, icon }: { msg: string; color?: string; icon?: string }) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, msg, color, icon }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    },
    [],
  );

  const onXP = useCallback(
    async (
      amount: number,
      wpm: number,
      textTitle: string,
      module: string,
      tpAmount = 0,
    ) => {
      if (!user) {
        if (demoMode) {
          setDemoXP(prev => prev + amount);
        }
        return;
      }
      try {
        const TRAINING_MODULES = [
          'Flash Okuma', 'Kılavuzlu Okuma', 'Dikey Okuma', 'Regresyon Engeli', 
          'Göz Egzersizi', 'Schulte Tablosu', 'Görsel Hafıza', 'WPM Testi', 
          'Çevre Görüşü', 'Kelime Tanıma', 'Günlük Mücadele'
        ];
        const isTraining = TRAINING_MODULES.includes(module) || tab === 'pathway';
        const nx = user.xp + (amount / 4); // 75% reduction - 1/4 of normal
        let tpGain = isTraining ? (tpAmount > 0 ? tpAmount / 4 : amount / 4) : 0; // 75% reduction
        
        const nt = (user.tecrube || 0) + tpGain;
        const prevLevel = getLvl(user.tecrube || 0).c.level;
        const newLevel = getLvl(nt).c.level;

        // Diamond logic: ~10% of XP gained as diamonds
        const diamondGain = isTraining ? Math.max(1, Math.floor(tpGain / 5)) : 0;
        const nd = (user.diamonds || 0) + diamondGain;

        const session = {
          wpm,
          xpGained: amount,
          textTitle,
          module,
          duration: 60,
          date: Date.now(),
        };
        const unlocked = new Set(user.unlockedAchievements || []);
        const usedM = new Set(user.usedModules || []);
        usedM.add(module);

        const readModules = [
          'Flash Okuma',
          'Kılavuzlu Okuma',
          'Dikey Okuma',
          'Regresyon Engeli',
          'WPM Testi',
        ];
        const userSessions = user.sessions || [];
        if (
          !unlocked.has('first_read') &&
          userSessions.filter((s) => readModules.includes(s.module)).length ===
            1
        ) {
          unlocked.add('first_read');
          addToast({
            msg: '🏆 İlk Adım rozeti!',
            color: '#ffd700',
            icon: '📖',
          });
        }
        if (!unlocked.has('speed_500') && wpm >= 500) {
          unlocked.add('speed_500');
          addToast({
            msg: '🏆 Hız Şeytanı!',
            color: '#ffd700',
            icon: '⚡',
          });
        }
        if (!unlocked.has('speed_1000') && wpm >= 1000) {
          unlocked.add('speed_1000');
          addToast({
            msg: '🏆 Süper Hız!',
            color: '#ffd700',
            icon: '🚀',
          });
        }
        if (!unlocked.has('speed_2000') && wpm >= 2000) {
          unlocked.add('speed_2000');
          addToast({
            msg: '🏆 Efsane Hız! 🔥',
            color: '#ffd700',
            icon: '🔥',
          });
        }
        if (!unlocked.has('level_5') && newLevel >= 5) {
          unlocked.add('level_5');
          addToast({
            msg: '🏆 Yarı Yol!',
            color: '#ffd700',
            icon: '🏆',
          });
        }
        if (!unlocked.has('memory_ace') && module === 'Görsel Hafıza' && amount >= 100) {
          unlocked.add('memory_ace');
          addToast({
            msg: '🏆 Hafıza Ustası!',
            color: '#ffd700',
            icon: '🧠',
          });
        }
        if (!unlocked.has('custom_text') && module === 'Editör') {
          unlocked.add('custom_text');
          addToast({
            msg: '🏆 Editör rozeti! ✍️',
            color: '#ffd700',
            icon: '✍️',
          });
        }
        if (!unlocked.has('all_modules') && usedM.size >= 7) {
          unlocked.add('all_modules');
          addToast({
            msg: '🏆 Tam Antrenman! 💪',
            color: '#ffd700',
            icon: '💪',
          });
        }
        if (!unlocked.has('daily_3') && module === 'Günlük Mücadele') {
          const dailyData = storage.get<Record<string, unknown>>(
            'sr_daily',
            {},
          );
          if (Object.keys(dailyData).length >= 3) {
            unlocked.add('daily_3');
            addToast({
              msg: '🏆 3 Günlük Seri! 🔥',
              color: '#ffd700',
              icon: '🔥',
            });
          }
        }
        if (
          !unlocked.has('peripheral_master') &&
          module === 'Çevre Görüşü' &&
          amount >= 150
        ) {
          unlocked.add('peripheral_master');
          addToast({
            msg: '🏆 Çevre Görüşü Ustası!',
            color: '#ffd700',
            icon: '👁️',
          });
        }

        if (newLevel > prevLevel) {
          const li = getLvl(nt);
          addToast({
            msg: `⬆️ Seviye Atladın! ${li.c.name}!`,
            color: li.c.color,
            icon: '🎊',
          });
        }

        const userRef = doc(db, 'users', user.id);
        const updates: any = {
          xp: nx,
          tecrube: nt,
          diamonds: nd,
          sessions: arrayUnion(session),
          unlockedAchievements: [...unlocked],
          usedModules: [...usedM],
        };

        // Calculate streak based on sessions (including the new one being added)
        const newSessions = [...(user.sessions || []), session];
        const updatedStreak = getStreak(newSessions, user.streakFreeze || 0);
        updates.streak = updatedStreak;

        if (module === 'Pathway' && textTitle) {
          const pathProgress = new Set(user.pathProgress || []);
          pathProgress.add(textTitle);
          updates.pathProgress = [...pathProgress];
        }

        if (module === 'Görev Ödülü') {
          const completed = new Set(user.completedQuests || []);
          if (completed.has(textTitle)) {
              console.warn('Quest already claimed:', textTitle);
              return;
          }
          completed.add(textTitle);
          updates.completedQuests = [...completed];
        }

        await updateDoc(userRef, updates);

        if (amount > 0) {
          const qCoop = query(
            collection(db, 'coop_missions'),
            where('memberIds', 'array-contains', user.id),
          );
          const snapCoop = await getDocs(qCoop);
          snapCoop.forEach(async (mDoc) => {
            const mRef = doc(db, 'coop_missions', mDoc.id);
            await updateDoc(mRef, { currentXP: increment(amount) });
          });
        }
      } catch (e) {
        console.error('XP Error:', e);
        addToast({
          msg: 'Veri senkronizasyonu hatası.',
          color: '#ef4444',
        });
      }
    },
    [user, addToast, tab, demoMode],
  );

  const onLogin = useCallback(
    async (userData: any) => {
      // If there's demo XP to migration
      if (demoXP > 0 && userData && userData.id) {
        const dXp = demoXP; // Capture current demoXP
        setDemoXP(0); // Clear it before async call to prevent double migration
        
        try {
          const userRef = doc(db, 'users', userData.id);
          await updateDoc(userRef, {
            xp: increment(dXp),
            tecrube: increment(dXp),
          });
          
          addToast({
            msg: `Demodaki ${dXp} TP hesabına eklendi!`,
            color: '#10b981',
            icon: '💎',
          });
        } catch (e) {
          console.error('XP migration failed:', e);
          // If it fails, maybe we should restore demoXP? 
          // But usually this means user doc doesn't exist yet or permission error.
        }
      }
      
      setUser(userData);
      setDemoMode(false);
    },
    [demoXP, addToast],
  );

  const onAddHeart = useCallback(async () => {
    if (!user) return;
    try {
      const currentHearts = user.hearts !== undefined ? user.hearts : 5;
      if (currentHearts >= 5) {
        addToast({ msg: '⚡ Boltage zaten tam dolu!', color: '#f97316', icon: '🔋' });
        return;
      }
      const userRef = doc(db, 'users', user.id);
      const newHearts = Math.min(5, currentHearts + 1);
      await updateDoc(userRef, { hearts: newHearts });
      addToast({
        msg: '⚡ 1 Boltage Kazanıldı!',
        color: '#10b981',
        icon: '⚡',
      });
    } catch (e) {
      console.error('Heart Error:', e);
    }
  }, [user, addToast]);

  const onRemoveHeart = useCallback(async () => {
    if (!user) return;
    const currentHearts = user.hearts !== undefined ? user.hearts : 5;
    if (currentHearts <= 0) return;
    try {
      const userRef = doc(db, 'users', user.id);
      const newHearts = Math.max(0, currentHearts - 1);
      await updateDoc(userRef, { hearts: newHearts });
      addToast({
        msg: '⚡ 2 Boltage harcandı!',
        color: '#f97316',
        icon: '⚡',
      });
    } catch (e) {
      console.error('Heart removal Error:', e);
    }
  }, [user, addToast]);

  const onRemoveHalfHeart = useCallback(async () => {
    if (!user) return;
    const currentHearts = user.hearts !== undefined ? user.hearts : 5;
    if (currentHearts <= 0) return;
    try {
      const userRef = doc(db, 'users', user.id);
      const newHearts = Math.max(0, currentHearts - 0.5);
      await updateDoc(userRef, { hearts: newHearts });
      addToast({
        msg: '⚡ 1 Boltage harcandı!',
        color: '#f97316',
        icon: '⚡',
      });
    } catch (e) {
      console.error('Half heart removal Error:', e);
    }
  }, [user, addToast]);

  const onBuyFreeze = useCallback(async () => {
    if (!user || (user.diamonds || 0) < 50) {
      addToast({ msg: 'Yetersiz Elmas! (50 💎 Gerekli)', color: '#ef4444', icon: '❌' });
      return;
    }
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        diamonds: (user.diamonds || 0) - 50,
        streakFreeze: (user.streakFreeze || 0) + 1,
      });
      addToast({
        msg: '🧊 Seri Koruması Alındı!',
        color: '#fb923c',
        icon: '❄️',
      });
    } catch (e) {
      console.error('Freeze Error:', e);
    }
  }, [user, addToast]);

  useEffect(() => {
    if (!user || user.isPro) return;
    const interval = setInterval(() => {
      console.log(
        'Interstitial: Bolt Premium avantajlarını hatırlatıyor...',
      );
    }, 300000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return <LoadingScreen />;
  }

  const logout = () => signOut(auth);
  const isPro = user?.isPro || false;

  const updateAvatar = async (avatar: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id), { avatar });
      addToast({
        msg: 'Avatar güncellendi!',
        color: '#10b981',
        icon: '👤',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const isAdmin = !!user?.isAdmin;

  const moduleProps = {
    user: user || { id: 'demo', name: 'Misafir', xp: 0, tecrube: 0, avatar: '👤' },
    onXP,
    addToast,
    texts,
    isPro,
    isMobile,
    setFocusMode: setIsFocusMode,
    matchData,
    setMatchData,
    onTabChange: setTab,
    setDemoMode,
  };

  if (!user && !demoMode) {
    return (
      <>
        <Toasts toasts={toasts} />
        <Landing
          onLogin={onLogin}
          addToast={addToast}
          onDemoStart={() => {
            setDemoMode(true);
            setTab('memory');
          }}
        />
      </>
    );
  }

  return (
    <>
      {showAppOpenAd && !isPro && Capacitor.getPlatform() === 'android' && (
        <AppOpenAd 
          onClose={() => setShowAppOpenAd(false)} 
          canDismiss={!!user || demoMode} 
        />
      )}
      <Toasts toasts={toasts} />
      <div className={`app ${isFocusMode ? 'focus-mode' : ''}`}>
        {(user || (demoMode && !isFocusMode)) && !isFocusMode && !isMobile && !demoMode && tab !== 'admin' && (
          <SidebarNav
            user={user || { id: 'demo', name: 'Misafir', xp: 0, tecrube: 0, avatar: '👤' }}
            tab={tab}
            navItems={isAdmin ? NAV : NAV.filter((n) => n.id !== 'admin')}
            onChangeTab={setTab as any}
            onOpenStreakModal={() => setActiveModal('streak')}
            onOpenLevelsModal={() => setActiveModal('levels')}
          />
        )}

        {isMobile && !isFocusMode && (user || (demoMode && !isFocusMode)) && !demoMode && tab !== 'admin' && (
          <MobileBottomNav
            user={user || { id: 'demo', name: 'Misafir', xp: 0, tecrube: 0, avatar: '👤' }}
            tab={tab}
            onChangeTab={setTab}
            navItems={NAV}
          />
        )}

        <main
          className="main"
          style={{
            padding: isFocusMode
              ? isMobile
                ? '20px'
                : '40px'
              : isMobile
              ? '0 0 80px 0'
              : tab === 'admin' ? '0' : (demoMode ? '0' : undefined),
          }}
        >

          {(user || (demoMode && !isFocusMode)) && !isFocusMode && !demoMode && tab !== 'admin' && (
            <TopNav
              user={user || { id: 'demo', name: 'Misafir', xp: 0, tecrube: 0, avatar: '👤' }}
              onOpenHeart={() => setActiveModal('heart')}
              onOpenStreak={() => setActiveModal('streak')}
              onOpenDiamond={() => setActiveModal('diamond')}
              onOpenLevels={() => setActiveModal('levels')}
              tab={tab}
              addToast={addToast}
              onTabChange={setTab}
            />
          )}

          {isFocusMode && (
            <div
              style={{
                position: 'fixed',
                top: 20,
                right: 20,
                zIndex: 1000,
              }}
            >
              <button
                className="btn bd bs"
                onClick={() => setIsFocusMode(false)}
                style={{ padding: '8px 15px', fontWeight: 800 }}
              >
                ✕ Kapat
              </button>
            </div>
          )}

          {tab === 'pathway' && (
            <Pathway
              user={user}
              onTabChange={setTab}
              addToast={addToast}
              onXP={onXP}
              onAddHeart={onAddHeart}
              onRemoveHeart={onRemoveHeart}
              onRemoveHalfHeart={onRemoveHalfHeart}
              isMobile={isMobile}
            />
          )}
          {tab === 'training' && (
            <TrainingMenu
              user={user}
              onTabChange={setTab}
              onAddHeart={onAddHeart}
              isMobile={isMobile}
            />
          )}
          {tab === 'social' && (
            <SocialHub
              user={user}
              onXP={onXP}
              addToast={addToast}
              onTabChange={setTab}
              setMatchData={setMatchData}
              isMobile={isMobile}
            />
          )}
          {tab === 'friends' && (
            <Friends user={user} addToast={addToast} onTabChange={setTab} isMobile={isMobile} />
          )}
          {tab === 'online-duel' && user && (
            <OnlineMatchmaking
              user={user}
              addToast={addToast}
              onClose={() => setTab('training')}
            />
          )}
          {tab === 'profile' && user && (
            <Profile
              user={user}
              onUpdateAvatar={updateAvatar}
              addToast={addToast}
              onLogout={logout}
              isMobile={isMobile}
              theme={theme}
              setTheme={setTheme}
              onTabChange={setTab}
            />
          )}
          {tab === 'profile' && !user && demoMode && (
             <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 20 }}>🔒</div>
                <h3>Profil için kayıt olmalısın</h3>
                <button className="btn bp" onClick={() => setDemoMode(false)} style={{ marginTop: 20 }}>Kayıt Ol</button>
             </div>
          )}
          {tab === 'flash' && <FlashRead {...moduleProps} />}
          {tab === 'guided' && <GuidedRead {...moduleProps} />}
          {tab === 'vert' && <VertRead {...moduleProps} />}
          {tab === 'regress' && <Regress {...moduleProps} />}
          {tab === 'eye' && <EyeGym {...moduleProps} />}
          {tab === 'peripheral' && (
            <PeripheralVision {...moduleProps} />
          )}
          {tab === 'wordrecog' && <WordRecognition {...moduleProps} />}
          {tab === 'schulte' && <Schulte {...moduleProps} />}
          {tab === 'memory' && <VisualMemory {...moduleProps} initialLevel={user?.id === 'demo' ? 6 : 1} />}
          {tab === 'wpmtest' && <WPMTest {...moduleProps} />}
          {tab === 'daily' && <DailyChallenge {...moduleProps} />}
          {tab === 'progress' && <ProgressChart user={user} />}
          {tab === 'library' && (
            <Library
              texts={texts}
              setTexts={setTexts}
              onXP={onXP}
              addToast={addToast}
              isMobile={isMobile}
            />
          )}
          {tab === 'achievements' && <Achievements user={user} />}
          {tab === 'admin' && isAdmin && (
            <AdminLayout user={user} addToast={addToast} onExit={() => setTab('pathway')} />
          )}
          {tab === 'dashboard' && <Dashboard user={user} />}
        </main>

        {activeModal === 'heart' && (
          <HeartModal
            user={user}
            onClose={() => setActiveModal(null)}
            onAddHeart={onAddHeart}
          />
        )}
        {activeModal === 'streak' && (
          <StreakModal
            user={user}
            onClose={() => setActiveModal(null)}
            onBuyFreeze={onBuyFreeze}
          />
        )}
        {activeModal === 'diamond' && (
          <DiamondModal
            user={user}
            onClose={() => setActiveModal(null)}
          />
        )}
        {activeModal === 'levels' && (
          <LevelDetailsModal
            user={user}
            onClose={() => setActiveModal(null)}
          />
        )}
        {activeModal === 'theme' && (
          <ThemeModal
            user={user}
            onClose={() => setActiveModal(null)}
          />
        )}
      </div>
    </>
  );
};

export default App;


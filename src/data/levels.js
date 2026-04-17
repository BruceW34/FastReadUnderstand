export const LEVELS = [
  { level: 1,  code: 'A1', name: 'Başlangıç',      minWPM: 150,  maxWPM: 250,  xpRequired: 0,      blockSize: 1, color: '#64748b' },
  { level: 2,  code: 'A2', name: 'Gelişim',        minWPM: 250,  maxWPM: 350,  xpRequired: 1500,   blockSize: 1, color: '#3b82f6' },
  { level: 3,  code: 'B1', name: 'Orta Seviye',    minWPM: 350,  maxWPM: 500,  xpRequired: 4500,   blockSize: 2, color: '#8b5cf6' },
  { level: 4,  code: 'B2', name: 'İleri Orta',     minWPM: 500,  maxWPM: 700,  xpRequired: 10500,  blockSize: 2, color: '#06b6d4' },
  { level: 5,  code: 'C1', name: 'İleri Seviye',   minWPM: 700,  maxWPM: 900,  xpRequired: 21000,  blockSize: 3, color: '#10b981' },
  { level: 6,  code: 'C2', name: 'Uzman Okur',     minWPM: 900,  maxWPM: 1200, xpRequired: 36000,  blockSize: 3, color: '#f59e0b' },
  { level: 7,  code: 'D1', name: 'Elit Okur',      minWPM: 1200, maxWPM: 1600, xpRequired: 60000,  blockSize: 4, color: '#ef4444' },
  { level: 8,  code: 'D2', name: 'Süper Okur',     minWPM: 1600, maxWPM: 2200, xpRequired: 105000, blockSize: 4, color: '#f97316' },
  { level: 9,  code: 'E1', name: 'Efsane Okur',    minWPM: 2200, maxWPM: 3500, xpRequired: 180000, blockSize: 4, color: '#ec4899' },
  { level: 10, code: 'E2', name: 'Üstat Okur',     minWPM: 3500, maxWPM: 6000, xpRequired: 300000, blockSize: 4, color: '#ffd700' },
];

export const ACHIEVEMENTS = [
    { id: 'first_read', name: 'İlk Adım', desc: 'İlk metni bitir', xp: 10, icon: '📖' },
    { id: 'speed_500', name: 'Hız Şeytanı', desc: '500 WPM\'e ulaş', xp: 40, icon: '⚡' },
    { id: 'speed_1000', name: 'Süper Hız', desc: '1000 WPM\'e ulaş', xp: 100, icon: '🚀' },
    { id: 'speed_2000', name: 'Efsane Hız', desc: '2000 WPM\'e ulaş', xp: 200, icon: '🔥' },
    { id: 'perfect_quiz', name: 'Mükemmel Anlama', desc: 'Testte tam puan al', xp: 30, icon: '🎯' },
    { id: 'level_5', name: 'Yarı Yol', desc: 'C1 Kademesine ulaş', xp: 200, icon: '🏆' },
    { id: 'schulte_fast', name: 'Schulte Ustası', desc: 'Schulte\'yi 25 sn altında bitir', xp: 60, icon: '🎲' },
    { id: 'memory_ace', name: 'Hafıza Ustası', desc: 'Görsel hafıza Uzmanlığı', xp: 80, icon: '🧠' },
    { id: 'custom_text', name: 'Editör', desc: 'Kütüphaneye metin ekle', xp: 20, icon: '✍️' },
    { id: 'all_modules', name: 'Tam Antrenman', desc: 'Tüm modülleri kullan', xp: 100, icon: '💪' },
    { id: 'daily_3', name: '3 Günlük Seri', desc: '3 gün üst üste mücadele', xp: 60, icon: '🔥' },
    { id: 'peripheral_master', name: 'Çevre Görüşü Ustası', desc: 'Çevre görüşünde 10+ doğru', xp: 50, icon: '👁️' },
];

export const LEAGUES = [
  { id: 'bronze', name: 'Bronz', minXP: 0, color: '#cd7f32', bg: 'rgba(205,127,50,0.1)', icon: '🥉' },
  { id: 'silver', name: 'Gümüş', minXP: 7500, color: '#c0c0c0', bg: 'rgba(192,192,192,0.1)', icon: '🥈' },
  { id: 'gold', name: 'Altın', minXP: 22500, color: '#ffd700', bg: 'rgba(255,215,0,0.1)', icon: '🥇' },
  { id: 'emerald', name: 'Zümrüt', minXP: 45000, color: '#50c878', bg: 'rgba(80,200,120,0.1)', icon: '❇️' },
  { id: 'ruby', name: 'Yakut', minXP: 90000, color: '#e0115f', bg: 'rgba(224,17,95,0.1)', icon: '♦️' },
  { id: 'diamond', name: 'Elmas', minXP: 150000, color: '#b9f2ff', bg: 'rgba(185,242,255,0.1)', icon: '💎' }
];

export const getLeague = (xp) => {
  let current = LEAGUES[0];
  for (let i = 0; i < LEAGUES.length; i++) {
    if (xp >= LEAGUES[i].minXP) current = LEAGUES[i];
  }
  return current;
};


export function getLvl(xp) {
  let c = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) { c = LEVELS[i]; break; }
  }
  const n = LEVELS.find(l => l.xpRequired > xp);
  const p = n ? ((xp - c.xpRequired) / (n.xpRequired - c.xpRequired)) * 100 : 100;
  return { c, n, p };
}

export function fmt(s) {
  return `${Math.floor(s / 60)}:${((s || 0) % 60).toString().padStart(2, '0')}`;
}

/**
 * Parses session dates robustly (handles Firestore Timestamps and DD.MM.YYYY format)
 */
export function parseSessionDate(dateVal) {
  if (!dateVal) return new Date(NaN);
  if (typeof dateVal === 'object' && dateVal.seconds) {
    return new Date(dateVal.seconds * 1000);
  } else if (typeof dateVal === 'string' && dateVal.includes('.')) {
    const parts = dateVal.split('.');
    if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`);
    return new Date(dateVal);
  }
  return new Date(dateVal);
}

/**
 * Robust Streak Calculation (Duolingo Style)
 * Counts unique days from session history, and respects streak freezes.
 */
export function getStreak(sessions = [], freezes = 0) {
  if (!sessions || sessions.length === 0) return 0;
  
  // Create an array of YYYY-MM-DD strings for precise comparison ignoring hours
  const dates = [...new Set(sessions.map(s => {
    const dt = parseSessionDate(s?.date);
    if(isNaN(dt)) return null;
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }).filter(Boolean))];
  
  let s = 0; 
  let availableFreezes = freezes || 0;
  const d = new Date();
  
  // Check today and work backwards up to a year
  for (let i = 0; i < 365; i++) {
     const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
     
     if (dates.includes(dateStr)) {
       s++;
     } else {
       if (i === 0) {
         // Missing today is fine, the day is not over yet.
       } else if (availableFreezes > 0) {
         // Use a freeze for a missed day in the past
         availableFreezes--;
       } else {
         // No freeze available and day was missed, streak broken.
         break;
       }
     }
     d.setDate(d.getDate() - 1);
  }
  return s;
}

export interface NavItem {
  id:
    | 'pathway'
    | 'training'
    | 'flash'
    | 'guided'
    | 'vert'
    | 'regress'
    | 'eye'
    | 'peripheral'
    | 'wordrecog'
    | 'schulte'
    | 'memory'
    | 'wpmtest'
    | 'daily'
    | 'progress'
    | 'social'
    | 'friends'
    | 'library'
    | 'profile'
    | 'admin';
  icon: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'pathway', icon: '🗺️', label: 'Eğitimler' },
  { id: 'training', icon: '🏋️', label: 'Antrenman' },
  { id: 'flash', icon: '⚡', label: 'Flash Okuma' },
  { id: 'guided', icon: '📖', label: 'Kılavuzlu Okuma' },
  { id: 'vert', icon: '↕️', label: 'Dikey Okuma' },
  { id: 'regress', icon: '🚫', label: 'Regresyon Engeli' },
  { id: 'eye', icon: '👁️', label: 'Göz Jimi' },
  { id: 'peripheral', icon: '👁️‍🗨️', label: 'Çevre Görüşü' },
  { id: 'wordrecog', icon: '🔤', label: 'Kelime Tanıma' },
  { id: 'schulte', icon: '🎲', label: 'Schulte Tablosu' },
  { id: 'memory', icon: '🧠', label: 'Görsel Hafıza' },
  { id: 'wpmtest', icon: '📈', label: 'WPM Testi' },
  { id: 'daily', icon: '🏁', label: 'Günlük Mücadele' },
  { id: 'progress', icon: '📉', label: 'İlerleme' },
  { id: 'social', icon: '🏆', label: 'Ligler & Görevler' },
  { id: 'friends', icon: '👥', label: 'Arkadaşlar' },
  { id: 'library', icon: '📚', label: 'Kütüphane' },
  { id: 'profile', icon: '👤', label: 'Profil' },
  { id: 'admin', icon: '🛠️', label: 'Admin' },
];


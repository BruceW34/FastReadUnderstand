import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, enableIndexedDbPersistence, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// ✅ GÜVENLIKLI: Environment variables'dan config yükle
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
} as const;

// Validation: gerekli env variables mevcut mu?
if (!firebaseConfig.apiKey) {
  throw new Error(
    '❌ Firebase API Key eksik! .env dosyasını kontrol et veya .env.example kopyala'
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  cacheSizeBytes: 40 * 1024 * 1024,
});
console.log('🔥 Firebase Project ID:', app.options.projectId);

// Persistence ve offline mod setup
(async () => {
  try {
    // 1. Persistence'ı etkinleştir
    await enableIndexedDbPersistence(db);
    console.log('✅ Firestore persistence etkinleştirildi');
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.log('⚠️ Birden fazla sekme açık - persistence devre dışı');
    } else if (err.code === 'unimplemented') {
      console.log('⚠️ Tarayıcı persistence desteklemiyor');
    } else {
      console.log('ℹ️ Persistence setup:', err.message);
    }
  }

  // 2. Network durumunu kontrol et
  if (typeof window !== 'undefined') {
    // İnternet bağlantısını kontrol et ve network'ü etkinleştir
    try {
      await enableNetwork(db);
      console.log('🌐 Network etkinleştirildi - ONLINE');
    } catch (e: any) {
      console.log('⚠️ Network enable hatası:', e.message);
    }

    // İnternet durumunu dinle
    window.addEventListener('online', async () => {
      console.log('📡 İnternet bağlandı - Network enable ediliyor');
      try {
        await enableNetwork(db);
        console.log('✅ Network etkinleştirildi');
      } catch (e) {
        console.error('❌ Network enable hatası:', e);
      }
    });

    window.addEventListener('offline', async () => {
      console.log('📡 İnternet kesildi - Çevrimdışı moda geçiliyor');
      try {
        await disableNetwork(db);
        console.log('✅ Çevrimdışı mod aktif');
      } catch (e) {
        console.error('❌ Network disable hatası:', e);
      }
    });

    // Browser başladığında internet var mı kontrol et
    if (!navigator.onLine) {
      try {
        await disableNetwork(db);
        console.log('✅ Başlangıçta çevrimdışı - Offline mode');
      } catch (e) {
        console.error('❌ Initial offline setup hatası:', e);
      }
    }
  }
})();

export const analytics =
  typeof window !== 'undefined' ? getAnalytics(app) : null;


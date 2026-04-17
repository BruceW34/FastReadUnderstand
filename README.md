# ⚡ FastRead — React Projesi

Profesyonel okuma hızı eğitim platformu.

---

## 🚀 Projeyi GitHub’a Yükleme

1. Bu klasörde `.gitignore` ve `README.md` olduğundan emin ol.
2. Gizli bilgileri saklamak için `.env.example` kullan; gerçek `.env` dosyalarını asla commit etme.
3. Git deposu oluştur:

```bash
git init
```

4. Değişiklikleri ekle ve commit yap:

```bash
git add .
git commit -m "Initial project import"
```

5. GitHub’da yeni bir repo oluştur, ardından uzaktaki repo adresini ekle:

```bash
git remote add origin https://github.com/kullaniciadi/repo-adi.git
git branch -M main
git push -u origin main
```

---

## 📦 Kurulum

```bash
npm install
npm run dev
```

Sonra tarayıcıyı aç:

```bash
http://localhost:5173
```

---

## ⚙️ Ortam Değişkenleri

Bu proje Firebase kullanıyor. Aşağıdaki değişkenleri `.env.local` veya yerel ortam dosyanıza ekle:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

> `.env.example` dosyasını kopyalayarak başlaman en güvenli yol.

---

## 📁 Proje Yapısı

```
src/
├── App.tsx / App.jsx      ← Ana uygulama
├── main.tsx / main.jsx    ← React entry point
├── index.css              ← Tüm stiller
├── components/            ← UI ve modül bileşenleri
├── services/              ← Firebase, ödeme, reklam servisleri
├── hooks/                 ← özel React hook’ları
└── data/                  ← uygulama metinleri ve yapılandırma
```

---

## 📌 Yasal ve Lisans Bilgileri

- Proje `MIT` lisansı ile yayınlanmıştır.
- `.gitignore` dosyası, gizli `.env` dosyalarını ve derleme çıktısını commit edilmekten korur.
- Üçüncü taraf paketleri `package.json` içinde listelenmiştir.
- Bu proje açık kaynak paylaşımı için uygun hale getirilmiştir.

---

## 🛡️ Dikkat Edilmesi Gerekenler

- Firebase config bilgilerini, `apiKey` ve `projectId` dahil, asla GitHub’a açık şekilde yükleme.
- `.env.example` bir şablondur; gerçek verileri bu dosyada tutma.
- Proje içinde tersine mühendislik veya telif hakkı içeren başka bir kaynak yoksa GitHub’a yükleyebilirsin.

---

## 📄 Lisans

Bu proje `MIT License` ile lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

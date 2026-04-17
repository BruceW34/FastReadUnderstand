// ─────────────────────────────────────────────────────────────────
// METIN EKLEMEK İÇİN: Bu diziye yeni obje ekle ve kaydet.
// Zorunlu alanlar: id, title, category, difficulty, content
// Opsiyonel: questions (test soruları)
// ─────────────────────────────────────────────────────────────────

export const DEFAULT_TEXTS = [
  {
    id: 't1',
    title: 'Kara Delikler',
    category: 'Bilim',
    difficulty: 1,
    content:
      'Kara delikler uzayın en gizemli nesneleri arasında yer almaktadır. Bu devasa kozmik yapılar o kadar güçlü bir yerçekimine sahiptir ki ışık bile onlardan kaçamaz. Bir kara deliğin merkezinde sonsuz yoğunluğa sahip bir nokta bulunur buna tekillik adı verilir. Bilim insanları kara deliklerin büyük yıldızların ömürlerini tamamladıktan sonra çökmesiyle oluştuğunu düşünmektedir. Samanyolu galaksisinin merkezinde Sagittarius A adı verilen süperkütleli bir kara delik bulunmaktadır. Bu kara deliğin kütlesi güneşin kütlesinin yaklaşık dört milyon katıdır. Hawking radyasyonu olarak bilinen teoriye göre kara delikler zamanla çok yavaş bir şekilde enerji kaybederek buharlaşabilmektedir. Kara deliklerin zaman üzerindeki etkisi de son derece çarpıcıdır bir kara deliğin yakınında zaman çok daha yavaş akar. Bu fenomen Einstein\'ın genel görelilik teorisiyle açıklanmaktadır. Gelecekte daha gelişmiş teleskoplarla kara delikleri çok daha iyi anlayabileceğiz.',
    questions: [
      { question: 'Kara deliklerin merkezindeki noktaya ne denir?', options: ['Olay ufku', 'Tekillik', 'Hawking noktası', 'Çekim merkezi'], correct: 1 },
      { question: 'Samanyolu merkezindeki kara deliğin adı?', options: ['Alpha Centauri', 'Betelgeuse', 'Sagittarius A', 'Andromeda X'], correct: 2 },
      { question: 'Kara deliklerin buharlaşabileceğini söyleyen teori?', options: ['Einstein radyasyonu', 'Hawking radyasyonu', 'Planck teorisi', 'Kuantum çöküşü'], correct: 1 },
    ],
  },
  {
    id: 't2',
    title: "Osmanlı'nın Yükselişi",
    category: 'Tarih',
    difficulty: 2,
    content:
      "Osmanlı İmparatorluğu 1299 yılında Osman Gazi tarafından küçük bir beylik olarak kurulmuş ve altı yüz yılı aşkın bir süre boyunca üç kıtada hüküm sürmüştür. İmparatorluğun en parlak dönemi Kanuni Sultan Süleyman dönemine denk gelir. Bu dönemde Osmanlı toprakları Macaristan'dan Basra Körfezi'ne Cezayir'den Hazar Denizi'ne kadar uzanıyordu. Osmanlı'nın bu denli geniş toprakları yönetebilmesinin arkasında güçlü bir bürokrasi köklü bir hukuk sistemi ve etkin bir ordu yatmaktadır. Devşirme sistemi yeteneğe dayalı bir yönetici sınıfının oluşmasını sağlamıştır. Topkapı Sarayı yüzyıllar boyunca imparatorluğun yönetim merkezi olarak hizmet vermiştir. Osmanlı mimarisi özellikle Mimar Sinan'ın eserleriyle dünya mimarlık tarihine altın harflerle yazılmıştır. Süleymaniye ve Selimiye camileri bu muhteşem mirasın en güzel örnekleridir. İmparatorluk 1922 yılında resmen sona ermiş ve yerini modern Türkiye Cumhuriyeti almıştır.",
    questions: [
      { question: 'Osmanlı hangi yılda kurulmuştur?', options: ['1071', '1299', '1453', '1517'], correct: 1 },
      { question: 'En parlak dönemi yaşatan sultan?', options: ['Yavuz Sultan Selim', 'II. Mehmed', 'Kanuni Sultan Süleyman', 'II. Abdülhamid'], correct: 2 },
      { question: "Osmanlı'nın ünlü mimarı?", options: ['Mimar Hayreddin', 'Mimar Sinan', 'Mimar Kemaleddin', 'Davut Ağa'], correct: 1 },
    ],
  },
  {
    id: 't3',
    title: "Yapay Zekanın Geleceği",
    category: 'Teknoloji',
    difficulty: 3,
    content:
      'Yapay zeka son on yılda insanlığın karşılaştığı en köklü teknolojik dönüşümü temsil etmektedir. Derin öğrenme algoritmaları sayesinde makineler artık görüntü tanıma doğal dil işleme ve strateji oyunlarında insanları geçebilmektedir. Büyük dil modelleri metin üretme ve anlama konusunda çığır açan başarılar elde etmiştir. Ancak bu gelişmeler beraberinde önemli etik soruları da getirmektedir. Otomasyon nedeniyle iş kayıpları algoritmik önyargı ve gizlilik ihlalleri başlıca endişeler arasındadır. Yapay genel zeka yani insanın bilişsel yeteneklerini her alanda aşabilen bir sistem henüz teorik bir kavram olsa da araştırmacılar bu hedefe doğru hızla ilerlemektedir. Kuantum bilgisayarlar ile yapay zekanın birleşimi hesaplama gücünü katlanarak artırabilir. Sağlık alanında yapay zeka destekli tanı sistemleri kanser gibi hastalıkların erken tespitinde umut verici sonuçlar vermektedir.',
    questions: [
      { question: 'Büyük dil modelleri hangi alanda öne çıktı?', options: ['Görüntü işleme', 'Metin üretme ve anlama', 'Ses tanıma', 'Robot kontrolü'], correct: 1 },
      { question: 'Yapay genel zeka ne anlama gelir?', options: ['Sadece oyun oynayan YZ', 'Her alanda insan yeteneklerini aşan sistem', 'Çok dilli çeviri', 'Otomatik sürüş'], correct: 1 },
      { question: 'Hangi teknoloji YZ ile birleşerek hesaplama gücünü artırır?', options: ['Blockchain', '5G', 'Kuantum bilgisayarlar', 'Nöral arayüzler'], correct: 2 },
    ],
  },
  {
    id: 't4',
    title: "Beynin Sırları",
    category: 'Nörobilim',
    difficulty: 2,
    content:
      'İnsan beyni evrenin bilinen en karmaşık yapısıdır. Yaklaşık seksen altı milyar nörondan oluşan bu organ saniyede trilyonlarca sinaptik bağlantı kurabilmektedir. Nöroplastisite yani beynin kendini yeniden yapılandırma yeteneği modern nörobilimin en heyecan verici keşiflerinden biridir. Bu özellik sayesinde beyin yeni beceriler öğrenebilir travmaları atlatabilir ve hasarlanmış bölgelerin işlevlerini diğer alanlara aktarabilir. Uyku beyin sağlığı için kritik öneme sahiptir bu süreçte toksinler temizlenir ve öğrenilen bilgiler pekiştirilir. Meditasyon ve bilinçli nefes egzersizleri beyin dalgalarını değiştirerek odaklanma kapasitesini artırabilir. Okuma hızı çalışmaları özellikle periferik görüşü güçlendirmeye yönelik egzersizler gözü ileten sinir yollarını güçlendirir. Hızlı okuma yalnızca bir göz becerisi değil aynı zamanda bir beyin antrenmanıdır.',
    questions: [
      { question: 'İnsan beynindeki nöron sayısı yaklaşık?', options: ['Bir milyar', 'On milyar', 'Seksen altı milyar', 'Bir trilyon'], correct: 2 },
      { question: "Beynin yeniden yapılanma yeteneğine ne denir?", options: ['Homeostaz', 'Nöroplastisite', 'Sinaptogenez', 'Myelinasyon'], correct: 1 },
      { question: 'Uyku sırasında beyinde ne olur?', options: ['Nöronlar enerji depolar', 'Toksinler temizlenir, bilgiler pekişir', 'Sinir bağlantıları kesilir', 'Aktivite durur'], correct: 1 },
    ],
  },
  {
    id: 't5',
    title: 'Kuantum Fiziği',
    category: 'Bilim',
    difficulty: 4,
    content:
      "Kuantum fiziği atom altı partiküllerin davranışlarını açıklayan ve klasik fiziğin sınırlarını kökten sorgulayan bir bilim dalıdır. Dalga parçacık ikilemi bir fotonun veya elektronun gözlemlenene kadar hem dalga hem de parçacık olarak var olabileceğini ileri sürmektedir. Heisenberg'in belirsizlik ilkesine göre bir partikülin konumu ve momentumu eş zamanlı olarak kesin biçimde ölçülemez. Süperpozisyon ilkesi bir kuantum sisteminin birden fazla durumda aynı anda bulunabileceğini ifade eder. Dolanıklık ise iki partikülin birbirine bağlanarak aralarındaki mesafeden bağımsız olarak anlık iletişim kurabilmesidir. Einstein bu fenomeni uzaklıkta ürkütücü bir etki olarak nitelendirmiştir. Kuantum hesaplama bu ilkeleri kullanarak klasik bilgisayarların çözemeyeceği problemleri saniyeler içinde çözme potansiyeli taşımaktadır.",
    questions: [
      { question: "Heisenberg'in belirsizlik ilkesi neyi söyler?", options: ["Işığın sabit hızını", "Konum ve momentumun eş zamanlı ölçülememesini", "Enerjinin korunumunu", "Partiküllerin yükünü"], correct: 1 },
      { question: 'İki partikülin mesafeden bağımsız etkileşimine ne denir?', options: ['Süperpozisyon', 'Tünel etkisi', 'Dolanıklık', 'Dalga çöküşü'], correct: 2 },
      { question: 'Einstein dolanıklığı nasıl tanımladı?', options: ['Evrenin temeli', 'Uzaklıkta ürkütücü bir etki', 'Görelilik paradoksu', 'Kuantum sıçraması'], correct: 1 },
    ],
  },
  {
    id: 't6',
    title: 'Sherlock Holmes: Kızıl Çalışma',
    category: 'Hikaye',
    difficulty: 2,
    content:
      "Bay Stamford beni küçük kimya laboratuvarına götürdü. Bir genç adam masanın üzerinde öne eğilmiş bir şeylerle uğraşıyordu. Beni görünce yerinden fırladı ve elini uzattı. Güç bir kavrayışı vardı. Gözlerinde garip bir parıltı yanıyordu. Merhaba Holmes dedim. Siz de Bay Watson'sınız değil mi dedi. Stamford benden bahsetmiş demek. Gayet iyi. Bir şey bulduk aslında dedim. Hemoglobin tarafından emilen bir madde keşfettim. Neden bu kadar önemli diye sordum şaşkınlıkla. Neden mi dedi kahkahasını tutamayarak. Efendim bu buluş belki de adalet tarihinin seyrini değiştirecek. Artık herhangi bir lekede insan kanı olup olmadığını kesin biçimde anlayabileceğiz. Bu sözleri söylerken gözleri parıldıyordu. Ona baktım ve bu adamın olağanüstü biri olduğunu anladım.",
    questions: [
      { question: 'Holmes ne keşfettiğini söylüyor?', options: ['Yeni bir element', 'Hemoglobin testi', 'Parmak izi testi', 'DNA analizi'], correct: 1 },
      { question: "Watson'ı laboratuvara kim götürdü?", options: ['Holmes', 'Stamford', 'Hudson', 'Lestrade'], correct: 1 },
      { question: 'Holmes bu buluşun neyi değiştireceğini söylüyor?', options: ['Tıp tarihini', 'Adalet tarihinin seyrini', 'Kimya bilimini', 'Polis teşkilatını'], correct: 1 },
    ],
  },
  {
    id: 't7',
    title: 'Kızıl Şafak: Mars Kolonisi',
    category: 'Hikaye',
    difficulty: 3,
    content:
      "Kaptan Elif Yıldız o sabah uyandığında kubbe camından kızıl bir şafak süzülüyordu. Mars'ın günbatımı maviydi ama gündoğumu her zaman kızıl olurdu. Koloni üssünün alarm sistemi sessizce yanıp sönüyordu. Sera modülündeki oksijen seviyeleri düşmüştü. Elif hızla kontrol odasına yürüdü. Ekranda kırmızı uyarılar parlıyordu. Sera üçteki bitkiler beklenenden çok fazla karbondioksit tüketmişti. Bu iyi bir işaretti aslında. Bitkiler büyüyordu. Ama dengeyi sağlamak zorundaydılar. Mars'ta en küçük hesaplama hatası felaket demekti. Mühendis Kaan sensörleri kontrol ederken Elif pencereden dışarı baktı. Kızıl kumların arasında rüzgar girdapları dans ediyordu. Bir gün bu çorak topraklar yeşerecek diye düşündü. İnsanlığın ikinci yuvası burada kurulacaktı. Sera modülünün dengelenmesi üç saat sürdü ama sonunda oksijen seviyeleri normale döndü. Elif günlüğüne yazdı bugün Mars bize bir ders daha verdi sabrı ve hassasiyeti.",
    questions: [
      { question: 'Mars\'ta gündoğumu ne renktir?', options: ['Mavi', 'Kızıl', 'Turuncu', 'Mor'], correct: 1 },
      { question: 'Sera modülündeki sorun neydi?', options: ['Su sızıntısı', 'Oksijen seviyesi düşmesi', 'Sıcaklık artışı', 'Işık arızası'], correct: 1 },
      { question: 'Mühendis Kaan ne yapıyordu?', options: ['Bitkileri suluyordu', 'Sensörleri kontrol ediyordu', 'Rapor yazıyordu', 'Uyuyordu'], correct: 1 },
    ],
  },
  {
    id: 't8',
    title: 'Hızlı Okuma Teknikleri',
    category: 'Eğitim',
    difficulty: 1,
    content:
      "Hızlı okuma, göz kaslarını eğitmek ve beynin bilgiyi işleme hızını artırmak için kullanılan bilimsel bir yöntemdir. Geleneksel okuma yönteminde her kelimeyi içimizden seslendiririz, bu da okuma hızımızı konuşma hızımıza hapseder. Oysa gözlerimiz, beyne saniyede binlerce kare veri gönderebilir. Hızlı okumanın ilk adımı, iç seslendirmeyi (subvocalization) azaltmaktır. İkinci adım, bakış açımızı genişleterek kelimeleri tek tek değil, gruplar halinde (chunking) görmektir. Gözlerimizin bir satır üzerinde yaptığı sıçramaları (fixation) azaltarak daha akıcı bir okuma sağlayabiliriz. Ayrıca, metin üzerinde geri dönüşler yapmaktan kaçınarak zaman tasarrufu yapabiliriz. Düzenli Schulte tablosu egzersizleri ve çevre görüşü çalışmaları, bu sürecin temel taşlarını oluşturur. Unutmayın, okuma hızı arttıkça aslında odaklanma kapasiteniz de artar çünkü zihniniz dış uyaranlara daha az vakit bulur.",
    questions: [
      { question: 'Hızlı okumayı engelleyen en büyük alışkanlık nedir?', options: ['Az ışıkta okumak', 'İç seslendirme', 'Yorgunluk', 'Kitap seçimi'], correct: 1 },
      { question: 'Kelime gruplarını görmeye ne denir?', options: ['Scanning', 'Chunking', 'Skimming', 'Regresyon'], correct: 1 },
      { question: 'Schulte tablosu neyi geliştirir?', options: ['Kelime dağarcığını', 'Çevre görüşünü ve odağı', 'Hafızayı', 'Yazım kurallarını'], correct: 1 },
    ],
  },
  {
    id: 't9',
    title: 'Mnemonik: Hafıza Sanatı',
    category: 'Psikoloji',
    difficulty: 3,
    content:
      "Antik Yunan'dan beri kullanılan mnemonik teknikleri, bilgilerin uzun süreli hafızaya kaydedilmesini kolaylaştıran zihinsel araçlardır. En bilinen yöntemlerden biri olan 'Loci Metodu' (Hafıza Sarayı), kavramları iyi bildiğiniz fiziksel bir mekanla ilişkilendirmeye dayanır. Örneğin, alışveriş listenizdeki ürünleri evinizin farklı odalarına hayalinizde yerleştirerek hatırlayabilirsiniz. Bir diğer yöntem olan 'Askı Kelime Yöntemi', rakamları kafiyeli kelimelerle eşleştirerek liste hatırlamayı sağlar. Zihnimiz görsel ve absürt hikayeleri düz metinlerden çok daha kolay hatırlar. Bu yüzden bir bilgiyi kodlarken ne kadar çok duyu organınızı işin içine katarsanız, hatırlama olasılığınız o kadar artar. Hafıza sadece doğuştan gelen bir yetenek değil, doğru tekniklerle geliştirilebilen bir kastır. Düzenli pratikle herkes 'süper hafıza' sahibi olabilir.",
    questions: [
      { question: 'Loci Metodu nedir?', options: ['Kitap özetleme', 'Hafıza Sarayı (Yerleştirme)', 'Hızlı yazma', 'Matematik tekniği'], correct: 1 },
      { question: 'Hafıza neye göre daha kolay kaydeder?', options: ['Düz listelere', 'Absürt ve görsel hikayelere', 'Siyah beyaz yazılara', 'Sessiz ortamlara'], correct: 1 },
      { question: 'Hatırlama olasılığını ne artırır?', options: ['Gözleri kapatmak', 'Daha fazla duyuyu işe katmak', 'Hızlı nefes almak', 'Metni ezberlemek'], correct: 1 },
    ],
  },
  {
    id: 't10',
    title: 'Üretkenliğin Psikolojisi',
    category: 'Psikoloji',
    difficulty: 2,
    content:
      "Modern dünyada odaklanma yeteneğimiz sürekli olarak bildirimler, sosyal medya ve çoklu görev (multitasking) baskısı altındadır. Gerçek üretkenlik, meşgul olmaktan ziyade doğru işlere odaklanmakla ilgilidir. 'Derin Çalışma' (Deep Work) kavramı, dikkatin dağılmadığı bir ortamda bilişsel sınırları zorlayarak yapılan çalışmayı ifade eder. Bu tür bir odaklanma, hem işin kalitesini artırır hem de yeni becerileri daha hızlı öğrenmenizi sağlar. Pomodoro tekniği gibi yöntemler, beyni kısa süreli yoğun odaklanma seanslarına alıştırarak ertelemeyi azaltabilir. Ancak unutulmamalıdır ki, beynin de dinlenmeye ihtiyacı vardır. 'Aylaklık' dönemleri, aslında beynin bilgileri sentezlediği ve yaratıcı çözümler ürettiği anlardır. Teknolojiden tamamen uzaklaşmak yerine, onu bilinçli bir araç olarak kullanmak temel farkı yaratır.",
    questions: [
      { question: 'Derin Çalışma (Deep Work) neyi ifade eder?', options: ['Çok uzun süre çalışmak', 'Kesintisiz ve yoğun odaklanma', 'Grup çalışması', 'Gece çalışmak'], correct: 1 },
      { question: 'Pomodoro tekniği neyi amaçlar?', options: ['Uykuyu düzenlemek', 'Ertelemeyi azaltıp odağı artırmak', 'Daha hızlı yemek yemek', 'Spor performansını artırmak'], correct: 1 },
      { question: 'Beyin ne zaman bilgileri sentezler?', options: ['Çok yorgunken', 'Dinlenme ve aylaklık anlarında', 'Sınav sırasında', 'Televizyon izlerken'], correct: 1 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// BURAYA DOĞRUDAN YENİ METİN EKLEYEBİLİRSİN:
// {
//   id: 'benim_1',
//   title: 'Kitap Adı',
//   category: 'Roman',
//   difficulty: 2,   // 1-5
//   content: 'Metin buraya...',
//   questions: [     // opsiyonel
//     { question: 'Soru?', options: ['A','B','C','D'], correct: 0 }
//   ]
// },
// ─────────────────────────────────────────────────────────────────

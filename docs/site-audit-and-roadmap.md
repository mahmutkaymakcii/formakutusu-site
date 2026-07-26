# Forma Kutusu site denetimi, rakip analizi ve geliştirme yol haritası

Denetim tarihi: 26 Temmuz 2026

Repo: `mahmutkaymakcii/formakutusu-site`

Çalışma dalı: `agent/forma-kutusu-cro-seo`
Taslak PR: <https://github.com/mahmutkaymakcii/formakutusu-site/pull/1>

## 1. Yönetici özeti

Mevcut depo çalışan bir statik dışa aktarım içeriyordu; ancak düzenlenebilir kaynak yerine hash'li Next.js çalışma dosyaları ve RSC çıktıları tutuluyordu. Yalnızca yedi asıl sayfa vardı. Bu yapı içerik, SEO ve model kataloğu yönetimini gereksiz şekilde zorlaştırıyor; mobil `/hakkimizda/` sayfasında yatay taşma üretiyor ve her değişiklikte derlenmiş çıktıların elle yönetilmesini gerektiriyordu.

Yenileme sonucunda site:

- Bağımlılıksız, statik ve kaynak üreticisi bulunan HTML/CSS/JavaScript yapısına taşındı.
- 22 erişilebilir sayfaya, 21 indekslenebilir sitemap URL'sine ve yedi koruyucu eski-URL yönlendirmesine ulaştı.
- 28 modeli merkezi JSON dosyasından yöneten aranabilir, filtrelenebilir ve favorilenebilir bir katalog kazandı.
- Üç adımlı, kısa ve WhatsApp'a kontrollü aktarım yapan teklif asistanı kazandı.
- Koyu, kontrollü altın vurgulu, mobil öncelikli ve erişilebilir bir tasarım sistemine geçti.
- Doğrulanmamış `329+ model`, `400 TL kampanya` ve teslimat/fiyat çağrışımları kaldırıldı.
- 220 responsive senaryoda yatay taşma, konsol hatası, eksik görsel, eksik alt metin/boyut, yinelenen ID ve mobil menü hatası üretmedi.
- Son mobil Lighthouse laboratuvar ölçümünde Performance 96, Accessibility 100, Best Practices 100 ve SEO 100 aldı.

En büyük açık görsel ve ticari kanıt tarafındadır. Drive'da gerçek üretim fotoğrafı, kumaş yakın planı, model ön/arka seti, doğrulanmış yorum veya güncel fiyat/termin belgesi bulunmadığı için bu içerikler üretilmedi. Mevcut referans görselleri isim, müşteri yorumu veya doğrulanmamış başarı iddiası eklenmeden kullanıldı.

## 2. Google Drive kaynak raporu

### İncelenen yapı

İki aynı adlı üst klasör bulundu. İzlenen erişilebilir yol:

`formakutusu-site / formakutusu.com / formakutusu-site`

İç klasörde yalnızca şu beş dosya vardı:

| Dosya | Tür | Boyut | Değerlendirme |
| --- | --- | ---: | --- |
| `index.html` | HTML | 7.004 bayt | Eski/alternatif site çıktısı; görsel kaynak değil |
| `robots.txt` | Metin | 69 bayt | Eski yayın dosyası; depo sürümü kaynak kabul edildi |
| `sitemap.xml` | XML | 267 bayt | Eski yayın dosyası; yeni bilgi mimarisine uygun değil |
| `README.md` | Markdown | 18 bayt | İçerik açısından yetersiz |
| `nora-logo-vibes.png` | PNG | 2.984.133 bayt | Büyük orijinal logo; web'e doğrudan eklenmedi |

### Web kullanım kararı

| Kategori | Kullanım alanı | Drive kaynağı | Kalite durumu | Web optimizasyonu | Öneri |
| --- | --- | --- | --- | --- | --- |
| Ana sayfa | Hero/banner | Bulunamadı | Değerlendirilemedi | — | Gerçek takım/üretim fotoğraf seti eklenmeli |
| Forma modelleri | Model kartları | Bulunamadı | Değerlendirilemedi | — | Ön/arka/detay görselleri düzenli adlarla arşivlenmeli |
| Model detayları | Ön/arka görünüş | Bulunamadı | Değerlendirilemedi | — | Her model için aynı açı ve oran standardı kurulmalı |
| Gerçek üretimler | Güven/referans | Bulunamadı | Değerlendirilemedi | — | İzinli ve kişisel veri içermeyen üretim seti gerekli |
| Kumaşlar | Kalite anlatımı | Bulunamadı | Değerlendirilemedi | — | Makro kumaş ve dikiş fotoğrafları gerekli |
| Marka | Footer/kurumsal alan | `nora-logo-vibes.png` | Dosya büyük; orijinal çözünürlük metadata'sı doğrulanamadı | Depodaki mevcut `nora.webp` yeterli | Orijinali Drive'da bırak; gerekirse ayrı WebP/AVIF kopya üret |
| Blog | İçerik görselleri | Bulunamadı | Değerlendirilemedi | — | Konu bazlı özgün üretim görselleri eklenmeli |

### Kullanılan ve kullanılmayan dosyalar

- Drive orijinalleri silinmedi, taşınmadı, yeniden adlandırılmadı, değiştirilmedi veya paylaşılmadı.
- `nora-logo-vibes.png` GitHub'a taşınmadı. Depoda zaten bulunan 420×245 px, 21.270 baytlık `assets/brand/nora.webp` web için yeterliydi.
- Drive'da düzenleme gerektiren kullanılabilir yeni bir görsel olmadığı için Adobe işlemi yapılmadı.
- Drive standart paylaşım bağlantıları sitede CDN olarak kullanılmadı.
- GitHub'a eklenen tek yeni görsel, depodaki mevcut FK-007 WebP dosyasından üretilen 640×800 px, 44.158 baytlık responsive kopyadır: `assets/models/fk-007-640.webp`.
- Kişisel veri veya müşteri sipariş bilgisi içeren bir dosya tespit edilmedi; böyle bir içerik yayınlanmadı.

### Önerilen Drive klasör standardı

```text
formakutusu-site/
├── 01-brand/
├── 02-models/
│   ├── futbol/
│   ├── basketbol/
│   └── voleybol/
├── 03-production-approved/
├── 04-fabrics/
├── 05-campaigns/
├── 06-blog/
└── 99-archive/
```

Her web adayı için `model-kodu`, `on/arka/detay`, çekim tarihi, yayın izni, çözünürlük ve güncellik bilgisi tutulmalıdır.

## 3. Rakip karşılaştırması

### Yöntem ve sınırlamalar

39 alan adı, mobil tarayıcı profiliyle ana sayfa seviyesinde otomatik teknik taramadan ve seçili kullanıcı akışı kontrollerinden geçirildi. Başlıklar, CTA'lar, formlar, WhatsApp, FAQ, referans, yapılandırılmış veri, model/tasarlama sinyalleri, görsel ve script yoğunluğu ile yatay taşma incelendi. Bu bir satın alma veya gizli müşteri testi değildir; fiyat, kalite ve teslimat iddiaları bağımsız doğrulanmadı.

36 site erişilebildi. Erişilebilen sitelerin 30'unda WhatsApp, 25'inde form, 20'sinde FAQ, 34'ünde referans/örnek alanı, 27'sinde tasarlama veya konfigüratör sinyali, 31'inde yapılandırılmış veri görüldü. Ana sayfada dosya yükleme alanı olan rakip tespit edilmedi. İki sitede mobil yatay taşma görüldü.

| Site | Güçlü yönler | Zayıf yönler | Öne çıkan özellik | Forma Kutusu için ders |
| --- | --- | --- | --- | --- |
| formayaptirma.net | Tasarım akışı, referanslar, temel şema | FAQ yok; 75 script ile ağır yapı riski | Dijital forma tasarım sihirbazı | Modelden teklife geçişi kısa tut |
| marinspor.com | Geniş branş/model vitrini, WhatsApp, FAQ | 25 form ve 74 script karmaşa yaratabilir | Ürün bazlı WhatsApp mesajı | Her model kodunu CTA mesajına otomatik ekle |
| formaburda.com | 3D anlatımı, FAQ, video ve zengin şema | Çok yoğun bağlantı ve içerik hiyerarşisi | 3D forma tasarlama | Tasarım vaadini güçlü ama sade anlat |
| formatasarim.com | Çok geniş branş kapsamı, referanslar | 59 alt metinsiz görsel, şema ve konfigüratör yok | Branş mega menüsü | Kategori derinliği kur; erişilebilirliği koru |
| tasarimforma.com.tr | Görsel model/referans sunumu, WhatsApp | FAQ ve konfigüratör yok; 46 script | Katalog odaklı akış | Katalogdan sonra teklif adımını görünür yap |
| formaniciz.com | Doğrudan WhatsApp, tasarlama odağı | Form/FAQ yok; ana sayfada az görsel | Tasarım odaklı değer önerisi | İlk ekranda tek net iş ve iki CTA kullan |
| formamarketim.com | Geniş görsel katalog, FAQ ve konfigüratör | 85 görsel ve 66 script performans riski | Model çeşitliliği | Merkezi veri dosyası ve lazy-load kullan |
| halisahaformasi.com | Niş arama niyeti, FAQ, yerel işletme şeması | 75 script; akış yoğun | Halı saha odaklı landing page | Niyet bazlı ayrı sayfa oluştur |
| formaajansi.com | Zengin görsel sunum, FAQ ve tasarım sinyali | WhatsApp yok; mobil yatay taşma; 80 script | Görsel katalog | Sabit CTA içerik kapatmamalı, taşma test edilmeli |
| superforma.net | FAQ, breadcrumb ve kapsamlı şema | 88 script ile yüksek çalışma yükü | SEO içerik katmanı | Şemayı koru, kütüphane yükünü azalt |
| acunsport.com | 143 görsellik geniş katalog, FAQ ve şema | WhatsApp yok; yoğun sayfa | Büyük ürün vitrini | Görsel seçimi ile teklif akışını bağla |
| divanespor.com | FAQ ve kurumsal içerik | Referans/konfigüratör/WhatsApp yok; 94 script | İçerik anlatımı | Güven içeriğini görünür dönüşüm CTA'sıyla birleştir |
| bs-sport.co | FAQ, referans ve zengin şema | Konfigüratör yok | Yapılandırılmış bilgi | Ürün sürecini FAQ ile destekle |
| egemenspor.com | WhatsApp, FAQ, referans ve tasarım sinyali | Form yok; 55 script | Çok kanallı iletişim | WhatsApp'a hazır bağlam gönder |
| hizliforma.com.tr | WhatsApp, FAQ, görsel katalog | Hız iddiaları doğrulama gerektirir; 43 script | Teslimat odaklı konumlanma | Doğrulanmamış termin kullanma; süreç görünürlüğü sun |
| formamarketi.com.tr | 95 görsel, ürün akışı, şema | FAQ yok; 64 script | Mağaza benzeri katalog | Favori ve paylaşılabilir model seçimi kullan |
| nilspor.com | Store/Service şemaları, geniş görsel katalog | 106 script ile en ağır yapılardan; FAQ yok | E-ticaret yapılandırması | Şema doğruluğu kadar çalışma yükünü de yönet |
| roaft.com | 119 görsellik katalog, görece düşük 22 script | FAQ yok | Görsel çeşitliliği | Az JavaScript ile zengin katalog mümkün |
| klasforma.com | FAQ ve zengin organizasyon şemaları | 71 script, sınırlı ana sayfa görseli | Kurumsal/SEO katmanı | Güven içeriğini gerçek görselle destekle |
| futbolformasi.com.tr | Odaklı niş içerik, yalnızca 9 script | FAQ ve tasarım aracı yok | Hafif teknik yapı | Niş sayfaları hafif tut |
| kralforma.com | WhatsApp, FAQ ve tasarım sinyali | Ana sayfada sınırlı görsel derinlik | Kısa teklif yolu | Düşük sürtünmeli iletişimi koru |
| futbolforma.net | FAQ, içerik ve tasarım akışı | 74 script | İçerik + konfigüratör | Bilgilendirme ile teklifi aynı yolculukta birleştir |
| enucuzforma.com | Fiyat niyetini açık yakalama, FAQ | İnce görsel içerik; fiyat iddiaları hızla eskir | Fiyat odaklı SEO | Kesin fiyat yerine doğrulanabilir fiyat bileşenleri açıkla |
| tusemspor.com | Video/yerel şema, FAQ, yalnızca 12 script | İçerik kapsamı sınırlı olabilir | Hafif ve medya destekli anlatım | Gerçek üretim videosunu performanslı ekle |
| hitforma.com | Breadcrumb/SEO yapısı, WhatsApp, yalnızca 16 script | Form ve FAQ yok | Hafif yapılandırılmış sayfa | Teknik sadeliği korurken FAQ ekle |
| formaniyap.com | 182 görsellik tasarlama deneyimi, 11 script | Form, FAQ ve şema yok | Görsel konfigüratör | Canlı önizlemeyi aşamalı geliştirme olarak ele al |
| formazade.com | Çok kapsamlı şema, içerik ve FAQ | WhatsApp yok; 101 script | Şema zenginliği | Yapılandırılmış veriyi yalnızca görünür içerikle eşleştir |
| sahadagiy.net | WhatsApp ve konfigüratör odaklı akış | Ana taramada görsel/FAQ/form sinyali yok | Dijital tasarım yaklaşımı | Araç varsa faydasını örnekle açıkla |
| futbolforma.com | Odaklı niş sayfa, temel şema | Yalnızca 5 görsel; referans ve konfigüratör yok | Basit bilgi mimarisi | Niş sayfa sade olabilir ama kanıt içermeli |
| formahane.com | 81 görsellik katalog, WhatsApp ve tasarım sinyali | 69 script; FAQ ve şema yok | Görsel ürün seçimi | Katalog verisini merkezi ve taranabilir tut |
| forma.com.tr | 106 görsel ve WhatsApp | Mobil yatay taşma; FAQ/konfigüratör yok | Güçlü alan adı ve katalog | Mobil kaliteyi marka gücünden bağımsız test et |
| unieksports.com | Referans, içerik ve tasarım sinyali | WhatsApp/form/FAQ yok; 74 script | Kurumsal sunum | Güven sayfasından satış kanalına net geçiş ver |
| formatasarla.web.tr | İncelenemedi | TLS sertifikası tarih hatası | Erişim: `ERR_CERT_DATE_INVALID` | Sertifika izleme ve otomatik yenileme kritik |
| formaci.net | FAQ, referans, yalnızca 18 script | WhatsApp, konfigüratör ve şema yok | Hafif içerik sitesi | Hafif yapıya doğrudan teklif CTA'sı ekle |
| formasiparis.com | 97 görsel, WhatsApp ve tasarım sinyali | 74 script; FAQ yok | Sipariş odaklı marka/URL | Arama niyeti ile form CTA'sını eşleştir |
| formaclup.com | Form, WhatsApp, referans ve temel şema | Yalnızca 3 görsel; FAQ/konfigüratör yok | Temel teklif akışı | Az görselle bile açık teklif yolu kurulabilir |
| imajersey.com | 252 görsel, video, ItemList, FAQ ve WhatsApp | Ana sayfa görsel ağırlığı riski; form yok | Çok geniş model vitrini | Sanal listeleme ve responsive görsel stratejisi düşün |
| demspor.com | İncelenemedi | HTTP 521, kaynak sunucu erişilemiyor | Cloudflare 521 | Origin sağlık izleme ve hata sayfası gerekli |
| tasarlaformani.com | İncelenemedi | HTTP 522, bağlantı zaman aşımı | Cloudflare 522 | Origin bağlantı/timeout takibi gerekli |

### Ortak özellikler ve fırsatlar

Rakiplerde ortak olan model galerisi, WhatsApp, referans alanı ve tasarım vaadi artık temel beklentidir. Sık hatalar ise ağır script yükü, kalabalık mega menü, ana sayfaya çok fazla model yığma, doğrulanması zor fiyat/teslimat iddiaları, eksik FAQ ve mobil taşmadır.

Forma Kutusu'nun fark yaratabileceği alanlar:

- Model koduyla hızlı arama, favori listesi ve favorileri WhatsApp'ta tek mesajla paylaşma.
- Dosyayı sunucuya göndermeden önce tür/boyut doğrulayan, KVKK açıklaması net bir teklif akışı.
- Her adımda kullanıcının neden o bilgiyi verdiğini açıklayan sade teklif asistanı.
- Gerçek üretim ile dijital tasarımı aynı model koduyla eşleştiren doğrulanabilir galeri.
- Takım listesi CSV şablonu ve ileride ekip arkadaşlarından beden toplama bağlantısı.
- Performanslı, bağımlılıksız ve klavye erişilebilir arayüz.

Taklit edilmemesi gerekenler: sahte sayaç/yorum, güncel olmayan kampanya, zorunlu uzun form, otomatik açılan müdahaleci popup, mobilde içerik kapatan CTA, yüzlerce görseli ilk yüklemede indirme ve görünür içerikle eşleşmeyen şema.

## 4. Tespit edilen hatalar

| Alan | Problem | Önem | Etkisi | Çözüm | İlgili dosya |
| --- | --- | ---: | --- | --- | --- |
| Kaynak yapı | Depoda düzenlenebilir Next.js kaynağı yok, yalnızca derlenmiş/hash'li çıktı vardı | Yüksek | Bakım, güvenli değişiklik ve SEO içerik üretimi zor | Ortak üretici + statik kaynak yapısı kuruldu | `tools/build-site.cjs`, eski `_next/` |
| Mobil UX | `/hakkimizda/` 320–768 px aralığında yatay taşıyordu | Yüksek | Mobil içerik kesiliyor, kalite algısı düşüyor | Grid, başlık ve breadcrumb kırılma kuralları düzeltildi | `assets/css/site.css` |
| Güven | `329+ model` ve `400 TL kampanya` doğrulanabilir kaynağa bağlı değildi | Yüksek | Yanıltıcı fiyat/sayı ve güncellik riski | İddialar kaldırıldı; doğrulanabilen süreç bilgileri korundu | `tools/build-site.cjs` |
| Bilgi mimarisi | Yedi sayfa çok sayıda farklı arama niyetini aynı içerikte toplamaya çalışıyordu | Yüksek | Zayıf niyet eşleşmesi ve iç bağlantı ağı | 21 indekslenebilir hedef URL oluşturuldu | Sayfa klasörleri, `sitemap.xml` |
| Dönüşüm | Model arama/favori ve yapılandırılmış teklif akışı yoktu | Orta | Kullanıcı model kodunu ve ihtiyacını aktarmakta zorlanıyor | Arama, filtre, favori ve 3 adımlı teklif eklendi | `assets/js/site.js`, `modeller/`, `teklif/` |
| Form | Dosya türü/boyutu, minimum adet ve adım doğrulaması eksikti | Orta | Eksik veya kullanılamaz teklif mesajları | İstemci doğrulaması ve anlaşılır hata metni eklendi | `assets/js/site.js` |
| SEO | Hizmet sayfaları, rehber ağı ve breadcrumb kapsamı sınırlıydı | Orta | Long-tail görünürlük ve taranabilirlik eksik | Niyet sayfaları, rehber, canonical, OG ve ilgili şemalar eklendi | Üretilen HTML, `sitemap.xml` |
| Performans | Next runtime/polyfill/hash'li paketler statik içerik için gereksizdi | Orta | JavaScript çalıştırma ve aktarım maliyeti | Bağımlılıksız 15 KB sınıfı uygulama JS'i kullanıldı | `assets/js/site.js`, silinen `_next/` |
| Erişilebilirlik | Mobil menü/modal ve hareket azaltma davranışları sınırlıydı | Orta | Klavye ve hareket hassasiyeti sorunları | Escape, odak, aria durumları ve `prefers-reduced-motion` eklendi | `assets/js/site.js`, `assets/css/site.css` |
| Hukuki açıklık | Gizlilik/KVKK bilgi sayfası yoktu | Orta | Dosya ve iletişim verisi kullanımında belirsizlik | Açık bilgi sayfası ve form notu eklendi | `kvkk-ve-gizlilik/` |
| Bakım | Tekrarlanan RSC `.txt` dosyaları ve kullanılmayan SVG'ler vardı | Düşük | Repo gürültüsü ve yanlış kaynak düzenleme riski | Kullanılmayan çıktı temizlendi | Silinen `__next*`, `*.txt`, üç SVG |
| PWA/marka | Manifest yoktu | Düşük | Mobil tarayıcı marka metadata'sı eksik | Web manifest eklendi | `site.webmanifest` |

Başlangıç denetiminde yeniden üretilebilen kritik seviye bir güvenlik veya çalışma hatası bulunmadı. Kritik hata bırakılmadı.

## 5. Uygulanan geliştirmeler

| Değişiklik | Gerekçe | Dosyalar | Müşteri etkisi | SEO etkisi | Performans etkisi |
| --- | --- | --- | --- | --- | --- |
| Ortak statik sayfa üreticisi | Kaynak ve çıktı ayrımını geri kazandırmak | `tools/build-site.cjs`, `README.md` | Tutarlı sayfalar | Meta/şema standardı | Runtime bağımlılığı yok |
| Mobil öncelikli tasarım sistemi | Premium fakat sade marka deneyimi | `assets/css/site.css` | Okunaklı, hızlı, güvenli kullanım | Dolaylı UX sinyali | Sistem fontları, ağır efekt yok |
| 28 modellik JSON katalog | Model yönetimini merkezileştirmek | `assets/data/models.json`, `modeller/` | Hızlı arama ve filtre | Taranabilir kategori içeriği | İstemci tarafı küçük veri |
| Favoriler ve paylaşılabilir seçim | Karar sürecini kısaltmak | `assets/js/site.js` | Seçimleri saklar/paylaştırır | Nötr | `localStorage`, kütüphane yok |
| Üç adımlı teklif asistanı | İlk temasta yalnızca gerekli bilgileri istemek | `teklif/`, `assets/js/site.js` | Daha temiz WhatsApp talebi | Güçlü ticari CTA | Sunucu isteği yok |
| CSV takım listesi | İsim/numara/beden toplama hatasını azaltmak | `assets/templates/takim-listesi.csv` | Hazır şablon indirir | Nötr | 2 satırlık hafif dosya |
| Dosya doğrulama | Desteklenmeyen/büyük dosyayı erken açıklamak | `assets/js/site.js` | Hata nedeni anlaşılır | Nötr | Yerel doğrulama |
| 14 yeni içerik/hedef sayfası | Arama niyetlerini ayırmak | Yeni sayfa klasörleri | İhtiyaca özgü bilgi | Long-tail hedefler | Statik HTML |
| Rehber merkezi ve üç özgün makale | Bilgi aramalarını ve iç bağlantıyı desteklemek | `rehber/` | Sipariş hazırlığı kolay | Bilgilendirici sorgular | Statik HTML |
| FAQ, breadcrumb ve Organization şemaları | Görünür içerikle eşleşen yapısal veri | Üretilen HTML | Bilgi bulma kolay | Zengin sonuç uygunluğu | İhmal edilebilir |
| Eski URL yönlendirmeleri | Mevcut bağlantıları korumak | `katalog*`, `urun.html` | Kırık yol yok | URL geçişi korunur | Anlık meta yönlendirme |
| Responsive FK-007 türevi | Mobil LCP görsel aktarımını azaltmak | `assets/models/fk-007-640.webp` | Daha hızlı ilk ekran | Görsel boyutu/alt düzenli | 100.662 bayttan 44.158 bayta |
| 404, robots, sitemap, manifest | Teknik temel | İlgili kök dosyalar | Tutarlı hata/yayın davranışı | Tarama ve indeks kontrolü | Hafif |

### Uygulanan bilgi mimarisi

- Ana sayfa
- Modeller
- Futbol, basketbol ve voleybol
- Halı saha forması
- Takıma özel forma
- Forma-şort takımı
- Okul ve turnuva forması
- Kumaş ve üretim
- Nasıl sipariş verilir
- Beden tablosu
- Sık sorulan sorular
- Teklif
- Rehber + üç makale
- Hakkımızda, iletişim, KVKK/gizlilik ve 404

### Ana sayfa yapısı

| Bölüm | Durum | Amaç ve mobil davranış |
| --- | --- | --- |
| Güçlü ilk ekran/değer önerisi | Uygulandı | Ne üretildiğini ve minimum 5 adedi ilk ekranda açıklar; CTA'lar mobilde tek sütun |
| Ana/ikincil CTA | Uygulandı | Modeller ve 60 saniyelik teklif yollarını ayırır |
| Model vitrini | Uygulandı | Seçili modeller; tüm katalog lazy-load |
| Kullanım alanları | Uygulandı | Halı saha, okul, kulüp ve turnuva kararını hızlandırır |
| Sipariş süreci | Uygulandı | Beş adımı doğrulanabilir dille gösterir |
| Neden Forma Kutusu | Uygulandı | Tasarım onayı, kişiselleştirme ve tek iletişim hattı |
| Kumaş/üretim | Metin uygulandı | Görsel kaynak gelince makro fotoğraf eklenmeli |
| Gerçek üretimler | Mevcut repo görselleriyle uygulandı | İsim/yorum/teslimat iddiası eklenmedi |
| Doğrulanmış yorumlar | Uygulanmadı | Kaynak ve yayın izni yok |
| Beden/üretim bilgisi | Uygulandı | Beden tablosu ve liste şablonuna bağlanır |
| FAQ | Uygulandı | Ana sorular + ayrı ayrıntılı sayfa |
| Son teklif CTA/footer | Uygulandı | Mobilde görünür, içerik kapatmaz |

## 6. Uygulanmayan öneriler

| Özellik | Neden uygulanmadı | Teknik gereksinim | Ücretli servis | Sonraki aşama |
| --- | --- | --- | --- | --- |
| Gerçek renk/forma konfigüratörü | Katmanlı model kaynakları yok | SVG/Canvas veya 3D varlık, varyant veri modeli | Şart değil | 30–90 gün |
| Canlı isim/numara önizleme | Onaylı font ve arka yüz şablonu yok | Canvas/SVG metin motoru | Hayır | 30–90 gün |
| Model ön/arka geçişi | Eşleşmiş arka görseller yok | Drive varlık standardı + JSON alanları | Hayır | İlk 30 gün, kaynak gelince |
| Sunucuya logo/liste yükleme | Backend ve saklama politikası yok | İmzalı yükleme, antivirüs, süreli silme, KVKK kayıtları | Depolamaya bağlı | Backend kararı sonrası |
| Spam korumalı gerçek form gönderimi | Mevcut backend yok | API, hız sınırı, honeypot/CAPTCHA ve log politikası | CAPTCHA seçimine bağlı | İlk 30 gün |
| QR ile takım arkadaşı beden toplama | Kalıcı veri ve erişim kontrolü gerektiriyor | Veritabanı, kısa bağlantı, rol/son kullanma tarihi | Hosting/veritabanına bağlı | 30–90 gün |
| Tekrar sipariş ve yönetici paneli | Kimlik, sipariş ID'si ve ERP kaynağı yok | Auth, veritabanı, sipariş entegrasyonu | Muhtemel | Daha sonra |
| Model karşılaştırma/benzer model | Ürün niteliği veri seti sınırlı | Etiketler, karşılaştırma bileşeni | Hayır | 30–90 gün |
| Üretim aşaması takibi | Gerçek operasyon veri kaynağı yok | Sipariş durum API'si | Entegrasyona bağlı | Daha sonra |
| Gerçek yorum/referans kimliği | Doğrulanmış izinli veri yok | Onay kayıtları ve yayın izni | Hayır | Veri geldikten sonra |
| AVIF tam set | Mevcut 36 WebP zaten küçük; kaynak set yok | Toplu görsel pipeline | Hayır | Yeni görsel setinde |
| CDN | Mevcut toplam ağırlık için zorunlu değil | DNS/cache/görsel dönüşümü | Sağlayıcıya bağlı | Trafik ve görsel büyürse |
| Analytics ve consent | Hesap/ölçüm ID'si verilmedi | GA4/alternatif, consent mode, gizlilik metni | Seçime bağlı | Hemen yapılmalı |

### Sıra dışı özellik önceliklendirmesi

| Özellik | Müşteri faydası | Dönüşüm etkisi | Teknik zorluk | Performans etkisi | Öncelik |
| --- | --- | ---: | ---: | ---: | ---: |
| Model koduyla hızlı arama | Modeli anında bulur | Yüksek | Düşük | Çok düşük | Uygulandı |
| Model favorileme | Kısa liste yapar | Yüksek | Düşük | Çok düşük | Uygulandı |
| Favorileri WhatsApp'ta gönderme | Tek mesajda bağlam verir | Yüksek | Düşük | Çok düşük | Uygulandı |
| Paylaşılabilir model bağlantısı | Takım içi karar kolaylaşır | Orta | Düşük | Çok düşük | Uygulandı |
| Akıllı teklif sihirbazı | Eksik brief'i azaltır | Yüksek | Orta | Düşük | Uygulandı |
| CSV takım listesi | İsim/beden hatasını azaltır | Yüksek | Düşük | Yok | Uygulandı |
| Ön/arka geçişi | Tasarımı doğru değerlendirir | Yüksek | Düşük | Düşük | Kaynak bekliyor |
| İsim/numara canlı önizleme | Kişiselleştirmeyi somutlaştırır | Yüksek | Orta | Düşük | 30–90 gün |
| Renk kombinasyonu önizlemesi | Karar süresini kısaltır | Yüksek | Yüksek | Orta | 30–90 gün |
| Kumaş yakınlaştırma | Kaliteyi görünür kılar | Orta | Düşük | Görsele bağlı | Kaynak bekliyor |
| Tasarım/gerçek üretim eşleştirme | Güveni artırır | Yüksek | Orta | Görsele bağlı | İlk 30 gün |
| QR ile beden toplama | Takım yöneticisi yükünü azaltır | Yüksek | Yüksek | Düşük | 30–90 gün |
| Tekrar sipariş | Sadakati artırır | Yüksek | Yüksek | Orta | Daha sonra |
| Model karşılaştırma | Benzer seçenekleri netleştirir | Orta | Orta | Düşük | 30–90 gün |
| Görsel benzer modeller | Keşfi artırır | Orta | Yüksek | Orta/yüksek | Daha sonra |
| Üretim aşaması görselleştirme | Belirsizliği azaltır | Yüksek | Yüksek | Düşük | Veri entegrasyonu sonrası |
| Hareket azaltma | Erişilebilirlik sağlar | Orta | Düşük | Olumlu | Uygulandı |
| Kaydırma ilerleme göstergesi | Uzun rehberde yön verir | Düşük | Düşük | Çok düşük | Şimdilik gereksiz |
| Mobil kamerayla logo seçme | Dosya seçimini kolaylaştırır | Orta | Orta | Düşük | Backend sonrası |
| Takım yöneticisi paneli | Siparişi merkezileştirir | Yüksek | Çok yüksek | Uygulamaya bağlı | Daha sonra |

## 7. SEO planı

### Arama niyeti haritası

| Anahtar kelime | Niyet | Hedef URL / durum | Önerilen title ve H1 | İçerik, şema ve CTA |
| --- | --- | --- | --- | --- |
| forma yaptırma | Ticari araştırma | `/takima-ozel-forma/` uygulandı | Title: Takıma Özel Forma Yaptırma; H1: Takımına özel formayı net bir brief ile başlat | Süreç, ürün kapsamı, FAQ; Service/Breadcrumb; Teklif al |
| halı saha forması | Ticari | `/hali-saha-formasi/` uygulandı | Title: Halı Saha Forması Yaptırma; H1: Halı saha takımını tek görünümde buluştur | Model, liste, beden, FAQ; Service; Modelleri gör |
| forma tasarla | Araç/ticari | `/teklif/` kısmi; gelecekte `/forma-tasarla/` | Title/H1 gerçek araç hazır olunca “Forma Tasarla” | Canlı önizleme yokken yanıltıcı “tasarla” iddiası kullanılmamalı |
| takıma özel forma | Ticari | `/takima-ozel-forma/` uygulandı | Mevcut hedef | Kişiselleştirme, minimum adet, süreç; Teklif |
| özel forma yaptırma | Ticari | `/takima-ozel-forma/` ortak hedef | Aynı canonical hedef | Kopya sayfa açma; ilgili alt başlık ve iç link |
| futbol forması yaptırma | Ticari | `/futbol/` uygulandı | Title: Özel Futbol Forması Modelleri; H1: Futbol forması modellerini takımına göre seç | Model listesi, FAQ, ItemList/Breadcrumb; Model seç |
| forma şort takımı | Ticari | `/forma-sort-takimi/` uygulandı | Title: Forma Şort Takımı Yaptırma | Kapsam/beden/liste; Service; Teklif |
| ucuz forma yaptırma | Fiyat araştırması | Yeni sayfa açılmadı | Gelecek: “Forma Fiyatını Belirleyen Unsurlar” | Doğrulanmış fiyat olmadan “ucuz” vaadi kullanılmamalı |
| okul takımı forması | Ticari | `/okul-turnuva-formasi/` uygulandı | Title: Okul ve Turnuva Forması | Çocuk/yetişkin beden ve liste; Service; Şablon indir |
| turnuva forması | Ticari | `/okul-turnuva-formasi/` ortak hedef | Aynı sayfada ayrı H2 | Termin iddiası olmadan hazırlık kontrol listesi |
| kurumsal takım forması | Ticari/B2B | Şimdilik `/takima-ozel-forma/` | Gelecek ayrı B2B sayfa | Fatura, onay ve adet süreci doğrulanınca ayrılaştır |
| sublimasyon forma | Bilgilendirici/ticari | `/kumas-ve-uretim/` uygulandı | Title: Süblimasyon Forma Kumaşı ve Üretim | Teknik süreç, bakım, FAQ; Article/Service; Teklif |
| isimli numaralı forma | Ticari | `/takima-ozel-forma/` | H2 ile hedeflenir | CSV listesi, kişiselleştirme; Şablon indir |
| kaleci forması yaptırma | Ticari | Gelecek `/kaleci-formasi/` | Kaynak gelince ayrı title/H1 | Kalıp/kol/beden/model görseli olmadan açılmamalı |
| takım forması yaptırma | Ticari | `/takima-ozel-forma/` | Mevcut hedef | Branş bağlantıları ve teklif CTA |
| forma siparişi | İşlemsel | `/nasil-siparis-verilir/` uygulandı | Title: Forma Siparişi Nasıl Verilir? | Adımlar, gerekli dosyalar; HowTo/Breadcrumb; Teklif |
| kişiye özel forma | Bireysel/ticari | Hedeflenmedi | Minimum 5 adet ile niyet uyumsuz | Bireysel tek ürün sağlanmıyorsa sayfa açma |
| forma fiyatları | Fiyat araştırması | `/teklif/` | Title: Forma Teklifi Hazırla | Fiyatı etkileyen unsurlar; kesin fiyat yok; Teklif asistanı |

Her ticari sayfada özgün giriş, kullanıcı karar soruları, doğrulanabilir minimum sipariş, ürün kapsamı, ilgili model kartları, FAQ, iç bağlantı ve görünür teklif CTA'sı bulunmalıdır. Görsel kaynak geldiğinde her sayfa için konuya özgü gerçek üretim fotoğrafı kullanılmalıdır.

### Teknik SEO uygulaması

- Her indekslenebilir sayfada benzersiz title, description, canonical, Open Graph ve Twitter metadata.
- Görünür içerikle eşleşen Organization, FAQPage, BreadcrumbList ve uygun sayfalarda ItemList/Article şeması.
- 21 URL'lik XML sitemap ve kökten referans veren robots.txt.
- 404 sayfasında `noindex`.
- Eski katalog URL'lerinde canonical + `noindex` + yeni hedefe yönlendirme.
- Anlamlı başlık hiyerarşisi, açıklayıcı bağlantı metinleri ve kategori/rehber iç bağlantıları.
- Görsellerde açıklayıcı alt metin, width/height ve ilk ekran dışındakilerde lazy loading.

### İçerik takvimi önerisi

İlk 30 gün:

1. Süblimasyon forma nedir, hangi kullanımda avantaj sağlar?
2. Halı saha forması için takım listesi nasıl hazırlanır?
3. Forma bedeni toplarken yapılan yedi hata.
4. Forma + şort teklifini etkileyen değişkenler.
5. Okul turnuvası için forma sipariş kontrol listesi.

30–90 gün:

1. Kaleci forması model ve beden rehberi.
2. Kurumsal turnuva forması planlama rehberi.
3. Tasarım ile gerçek üretim karşılaştırmalı vaka çalışmaları.
4. Forma bakım ve yıkama rehberi.
5. Ön/arka model seçimi ve isim-numara yerleşim rehberi.

## 8. Tasarım sistemi

| Alan | Karar |
| --- | --- |
| Ana zemin | `#090a08` |
| Yüzeyler | `#11120f`, `#171813`, `#1e1f19` |
| Ana metin | `#f5f1e7`; ikincil `#aaa79d` |
| Altın vurgu | `#d5aa43`; parlak durum `#efc966`; koyu `#6b5525` |
| Durum renkleri | Hata `#ff7b73`; başarı `#9bd49b` |
| Başlık fontu | Sistem dar/condensed zinciri; harici font isteği yok |
| Gövde fontu | Inter varsa, yoksa sistem sans-serif |
| Başlık ölçeği | H1 `clamp(2.85rem, 8vw, 6.8rem)`; H2 `clamp(2.1rem, 5vw, 4rem)` |
| Grid | En fazla 76 rem konteyner; mobil tek sütun; içerik türüne göre 2–4 sütun |
| Boşluk | 4 px tabanlı 0.25–6 rem ölçek |
| Köşe | 0.5, 1 ve 1.5 rem |
| Gölge | Yalnızca katman ayrımı için kontrollü `0 24px 80px / 35%` |
| Buton | Altın dolu ana; çizgili ikincil; görünür hover/focus |
| Form | Kalıcı label, açıklama, alan-bazlı hata, klavye ve dokunma hedefleri |
| Hareket | Kısa opacity/transform; `prefers-reduced-motion` ile kapatılır |
| Görsel oranı | Model kartlarında tutarlı dikey oran; width/height zorunlu |
| Kontrast | Koyu zeminde açık metin; altın metin küçük puntoda tek başına kullanılmaz |
| Mobil kural | 320 px başlangıç; sabit CTA teklif sayfasında kapalı, diğer sayfalarda içerik kapatmaz |

Premium etki ağır animasyon, parlak glow veya sahte 3D yerine tipografik ölçek, boşluk, tutarlı yüzeyler ve model görsellerinin net sunumuyla kurulmuştur.

## 9. Test sonuçları

| Test | Sonuç | Açıklama |
| --- | --- | --- |
| Responsive tarama | Başarılı | 22 sayfa × 10 genişlik = 220/220 |
| Ekran genişlikleri | Başarılı | 320, 360, 390, 430, 768, 1024, 1280, 1366, 1440, 1920 px |
| HTTP sayfa yanıtları | Başarılı | 220 senaryoda hatalı durum yok |
| Mobil yatay taşma | Başarılı | 0 |
| Konsol hatası | Başarılı | 0 |
| Sayfa JavaScript hatası | Başarılı | 0 |
| Bozuk/eksik görsel | Başarılı | 0 |
| Eksik alt metin | Başarılı | 0 |
| Eksik görsel boyutu | Başarılı | 0 |
| Yinelenen HTML ID | Başarılı | 0 |
| Mobil menü | Başarılı | Tüm mobil sayfa/genişlik kombinasyonlarında açıldı; Escape ile kapandı |
| Model galerisi/modal | Başarılı | Açma, kapama ve Escape davranışı |
| Model arama/branş filtresi | Başarılı | Model kodu ve branş |
| Favori ve favori filtresi | Başarılı | Saklama ve paylaşılabilir sorgu |
| Teklif asistanı | Başarılı | Boş adım, minimum adet, geçerli ilerleme |
| Dosya doğrulama | Başarılı | Desteklenmeyen tür engellendi; dosya adları mesaja eklendi |
| WhatsApp | Başarılı | `905348578836` ve dolu mesaj parametresi |
| Telefon | Başarılı | `tel:+905348578836` |
| Sitemap URL'leri | Başarılı | 21/21 erişilebilir |
| İç bağlantı/CSV | Başarılı | Bozuk iç bağlantı yok |
| Benzersiz SEO title | Başarılı | Yinelenen title yok |
| İşlev test paketi | Başarılı | 20/20 |
| HTML doğrulama | Başarılı | `html-validate`, 0 hata |
| Lighthouse mobil | Başarılı | P 96 / A 100 / BP 100 / SEO 100 |
| Lighthouse mobil metrik | Ölçüldü | FCP 835 ms, LCP 2.766 ms, TBT 0 ms, CLS 0, 390.329 bayt |
| Lighthouse masaüstü | Başarılı | P/A/BP/SEO 100/100/100/100; önceki final turu |
| Chrome | Test edildi | Yerel kurulu Chrome ile otomasyon |
| Edge/Safari/Firefox | Yapılmadı | Bu turda otomasyon/cihaz matrisi yok; birleştirme öncesi manuel önerilir |
| Gerçek backend gönderimi | Uygulanamaz | Backend yok; WhatsApp istemci akışı test edildi |
| Gerçek alan adı hosting önizlemesi | Yapılmadı | PR için otomatik preview URL'si bulunmuyor |

Canlı başlangıç Lighthouse ölçümü 88/96/96/100, FCP 1.612 ms, LCP 3.742 ms, TBT 102 ms ve 617.008 bayttı. Final yerel laboratuvar ölçümü daha iyi sonuç verdi; ancak başlangıç canlı hosting, final yerel statik sunucu üzerinde olduğu için fark yön gösterir, saha verisi veya birebir hosting karşılaştırması değildir.

Lighthouse komutu raporu üretmesine rağmen Windows geçici Chrome klasörünü temizlerken `EPERM` ile çıkış kodu 1 döndürdü. JSON raporu tam oluştu ve skorlar bu dosyadan okundu; bu site hatası değildir.

## 10. Değiştirilen dosyalar

### Değiştirilen

- `index.html`, `futbol/index.html`, `basketbol/index.html`, `voleybol/index.html`
- `hakkimizda/index.html`, `iletisim/index.html`, `teklif/index.html`
- `404.html`, `404/index.html`
- `robots.txt`, `sitemap.xml`
- Eski katalog ve ürün yönlendirme HTML'leri

### Eklenen

- `README.md`
- `tools/build-site.cjs`
- `assets/css/site.css`
- `assets/js/site.js`
- `assets/templates/takim-listesi.csv`
- `site.webmanifest`
- `modeller/`, `hali-saha-formasi/`, `takima-ozel-forma/`
- `forma-sort-takimi/`, `okul-turnuva-formasi/`
- `kumas-ve-uretim/`, `nasil-siparis-verilir/`, `beden-tablosu/`
- `sik-sorulan-sorular/`, `kvkk-ve-gizlilik/`
- `rehber/` ve üç rehber makalesi
- Bu denetim raporu

### Silinen

- `_next/` altındaki hash'li runtime/chunk/CSS çıktıları
- Kök ve sayfa klasörlerindeki `__next*` ve `index.txt` RSC çıktıları
- Kullanılmayan `_not-found/` derleme çıktısı
- Kullanılmayan `file.svg`, `globe.svg`, `window.svg`

### Taşınan

- Yok. Kaynaklar yeni yapıya kopyalanmadı; gerekli olmayan Drive dosyaları yerinde bırakıldı.

### Optimize edilen görseller

- `assets/models/fk-007-640.webp`: 640×800 px, 44.158 bayt; mevcut `fk-007.webp` için responsive türev.

### Eklenen veri dosyaları

- `assets/data/models.json`: 11 futbol, 11 basketbol, 6 voleybol olmak üzere 28 model.

## 11. GitHub teslimi

- Dal: `agent/forma-kutusu-cro-seo`
- Ana uygulama commit'i: `a85da83e5be28f96f39d2db7538333e25ed37dab`
- Commit başlıkları:
  1. `Siteyi hafif ve dönüşüm odaklı yapıya taşı`
  2. `Site denetimi ve yol haritasını ekle`
- Taslak PR: <https://github.com/mahmutkaymakcii/formakutusu-site/pull/1>
- Otomatik preview bağlantısı: yok

### Birleştirme öncesi kontrol listesi

- [ ] Statik hosting preview'sinde bütün yönlendirmeleri kontrol et.
- [ ] Gerçek alan adında canonical, sitemap ve 404 davranışını kontrol et.
- [ ] WhatsApp mesaj metnini satış ekibiyle onayla.
- [ ] KVKK/gizlilik metnini hukuk danışmanına incelet.
- [ ] Analytics/consent kararını ve ölçüm ID'lerini ekle.
- [ ] Gerçek üretim ve kumaş görsellerinin yayın izinlerini doğrula.
- [ ] Edge, Firefox ve gerçek iOS Safari üzerinde manuel smoke test yap.
- [ ] PR hazır olduğunda draft durumunu kaldır ve `main` ile birleştir.

## 12. Sonraki öncelikler

### Hemen yapılmalı

1. Hosting preview ve gerçek cihaz smoke testi.
2. Analytics/consent ve teklif dönüşüm event'lerinin tanımlanması.
3. KVKK metninin hukuki onayı.
4. Satış ekibiyle ürün kapsamı, minimum adet ve WhatsApp metninin teyidi.

### İlk 30 gün

1. Drive'a izinli gerçek üretim, kumaş ve model ön/arka setlerinin eklenmesi.
2. Dijital tasarım/gerçek üretim eşleştirme alanı.
3. Doğrulanmış güncel fiyat bileşenleri ve termin açıklaması.
4. Kaleci forması için kaynak ve içerik toplanması.
5. Search Console, sitemap gönderimi ve Core Web Vitals izleme.

### 30–90 gün

1. Katmanlı SVG/Canvas renk ve isim-numara önizleme prototipi.
2. QR kodlu takım beden toplama akışının KVKK/backend tasarımı.
3. Model karşılaştırma ve nitelik etiketleri.
4. Kurumsal takım/turnuva landing page ve vaka çalışmaları.
5. Dönüşüm hunisi üzerinden A/B testleri: hero CTA, model kartı CTA ve form adım sırası.

### Daha sonra değerlendirilebilir

1. Tekrar sipariş ve takım yöneticisi paneli.
2. ERP/üretim durum entegrasyonu.
3. Görsel benzer model önerisi.
4. Trafik ve katalog hacmi gerektirirse CDN/otomatik görsel pipeline.


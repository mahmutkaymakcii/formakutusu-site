# Forma Kutusu — Genel Proje Denetimi

Tarih: 7 Ekim 2026 (Europe/Istanbul)

Repo: `mahmutkaymakcii/formakutusu-site`

İncelenen main commit: `5dc24538477a5bd6f735eff1e1490f0b58cd99a7`

Canlı adres: https://formakutusu.com/

## Genel değerlendirme

Site teknik olarak yayınlanmış, katalog ve temel sipariş yönlendirmesi çalışıyor. Bu denetimde sitemap'teki 50 sayfanın tamamı HTTP 200 döndürdü; HTML içerikleri, Cloudflare'ın eklediği beacon betiği çıkarıldığında main ile birebir eşleşti. Kontrol edilen 45 yerel varlığın tamamı HTTP 200 döndürdü ve main dosyalarıyla birebir eşleşti.

Öncelikli eksikler: 10 futbol modeli görselindeki eski telefon numarası, yayımlanmış GTM konteynerinin boş olması, güncel Search Console sonuçlarının doğrulanamaması ve durum kayıtlarının eski sürümleri karıştırması.

Bu bir ilk denetimdir; tam tarayıcı/cihaz matrisi, güncel Lighthouse, gerçek kullanıcı performansı ve işletme/hesap sahipliği doğrulaması tamamlanmış değildir. Bu alanlar aşağıda açık bırakılmıştır. Otomatik kontrollerin geçmesi satış, indeksleme veya bütün ekranlarda kusursuz kullanım kanıtı sayılmamıştır.

## 1. Son yapılan işler ve gerçek devam noktası

| Tarih | İş | Kanıt / durum |
| --- | --- | --- |
| 20 Ağustos | GTM kodunun site geneline eklenmesi | main geçmişi; yayımlanmış konteyner aşağıda incelendi |
| 27 Ağustos | İç bağlantı ve crawl-depth denetimi, rehber → ticari sayfa bağlantıları | PR #13, commit `23ae1f26a3b42e49d7c1d2336a286a222e5f19c4` |
| 27 Ağustos | Tek durum kaynağı ve sonraki adımların kaydı | `PROJECT-STATUS.md`, PR #14 |
| 3 Ekim | Neon FK favicon değişikliği | incelenen main commit |
| 7 Ekim | Güncel kod, üretim tekrarlanabilirliği, canlı yayın, katalog ve görseller denetimi | bu rapor |

Eski local SEO pilot görevleri güncel ana sıra değildir. Çekirdek sayfaların indeks ve ölçüm durumu görülmeden yerel sayfaları ölçekleme kararı alınmamalıdır.

## 2. Durum tablosu

| Alan | Durum | Kanıt | Eksik / sonraki adım | Öncelik |
| --- | --- | --- | --- | --- |
| Yayın ve kod eşleşmesi | Doğrulandı | 50 HTML ve 45 varlık karşılaştırması | sonraki kod değişikliğinden sonra tekrar kontrol | — |
| Sayfa üretimi | Doğrulandı | CI komutları yeniden çalıştırıldı; git diff temiz | aynı üretim sırasını koru | — |
| Model kataloğu | Doğrulandı | `assets/data/models.json`: 28 model; 11 futbol, 11 basketbol, 6 voleybol | katalog genişlemesini varlık standardıyla planla | P2 |
| Arama / filtre / favori | Örnek canlı akışlar geçti | kod arama, boş sonuç, üç branş, favori filtresi, sayfalar arası kalıcılık | gerçek mobil tarayıcıda da test et | P1 |
| Model görselleri | Erişilebilir; iletişim tutarsızlığı var | 28 modelin alt iletişim bantlarının görsel incelemesi | 10 görselde eski numarayı düzelt | P0 |
| WhatsApp | Link/mesaj tarafı doğrulandı | sitemap HTML'lerindeki tüm wa.me hedefleri `905348578836`; FK-007 mesajında kod var | gerçek müşteri siparişinden ayrı ölç | P1 |
| Fiyat / sipariş / SSS | Yayında | `/teklif/`, model sayfaları, `/sik-sorulan-sorular/` | fiyatın güncelliği ve ödeme/kargo kapsamı işletmeden teyit | P1 |
| Teknik SEO | Temel kontroller geçti | 50 self-canonical, noindex yok, JSON-LD parse hatası yok | indeks durumunu Google verisiyle ayrı doğrula | P0 |
| İç bağlantılar | Bağlantısız/erişilemeyen sayfa yok | `tools/audit-link-graph.cjs` | 20 düşük inbound sayfayı bağlamsal içerikle değerlendir | P1 |
| GTM | Kod kurulu, yayımlanmış konteyner boş | `GTM-TJL9N3XX`, version 1, tags 0, rules 0 | Google tag + olayları yapılandır ve test et | P0 |
| GA4 / dönüşüm | Bu GTM üzerinden ölçüm yok; hesap durumu bilinmiyor | yayımlanmış konteyner; özel hesap erişimi engeli | doğru property/stream/Measurement ID ve DebugView doğrulaması | P0 |
| Google indeks / organik performans | Güncel veri doğrulanamadı | GSC Wizard `payment_required` | Search Console'dan güncel dışa aktarımlar/URL Inspection | P0 |
| Ana sayfa tasarımı | 1363 CSS px masaüstü görünümü incelendi | belirgin yatay taşma ve başlık çakışması gözlenmedi | önceki ekran sorununun tüm ölçülerde kapandığı kanıtlanmadı | P1 |
| Beden bilgisi | Planlama sayfası ve CSV var | `/beden-tablosu/` | gerçek santimetre ölçü tablosu yok | P1 |
| Güven kanıtları | Üretim galerisi var | ana sayfa; açma/Escape kapanma testi | fotoğraf kaynağı/yayın izni, vaka eşleşmesi, gerçek yorumlar | P1/P2 |
| Hesap sahipliği / yedekler | Bu turda doğrulanamadı | mevcut durum kaydı yalnızca kontrol listesi | domain, DNS, Google/Meta sahipliği ve kurtarma envanteri | P1 |

P0: müşteri iletişimi, ölçüm ve kritik doğrulama. P1: sonraki düzeltme turu. P2: temel eksikler kapandıktan sonra büyüme.

## 3. Doğrulanan bulgular

### F-01 — Görsellere gömülü eski telefon (P0)

Beklenen mevcut site hattı: **0534 857 88 36**. Aşağıdaki 10 model görselinde **0543 232 18 53** yazıyor:

`FK-001`, `FK-002`, `FK-005`, `FK-007`, `FK-008`, `FK-009`, `FK-012`, `FK-027`, `FK-029`, `FK-031`.

Dosyalar: `assets/models/` altındaki aynı kodlu `.webp` dosyaları. FK-019 ve 17 basketbol/voleybol modelinde görülen numara mevcut site hattıyla aynı. İlgili görseller canlı varlık karşılaştırmasında main ile eşleşti; sorun yalnızca yerel arşivde değildir.

Tekrar üretme: ilgili ürün sayfasını aç → tam boy model görselini aç → alt iletişim bandını oku → site footer/WhatsApp hedefiyle karşılaştır.

Etki: görseli indiren/paylaşan veya numarayı elle yazan müşteri iki farklı iletişim hattı görür. Eski hattın hâlen hizmet verip vermediği bu turda test edilmedi.

Çözüm: onaylı orijinal tasarımlarda yalnızca iletişim bandını güncelle; forma tasarımına dokunmadan WebP türevlerini yeniden üret. Aynı görselin hero/önizleme/türev kullanımlarını da tarayıp eşitle.

Tamamlanma ölçütü: 28 katalog görseli ve kullanılan türevlerde tek mevcut hat; doğru WhatsApp linkleri; görsellerin form/pattern korunumu; canlı dosya doğrulaması.

### F-02 — GTM kurulumunun ölçüm sanılması (P0)

Kaynak: https://www.googletagmanager.com/gtm.js?id=GTM-TJL9N3XX

Yayımlanmış resource: version `1`, `tags: []`, `predicates: []`, `rules: []`. Kaynakta GA4 Measurement ID veya planlanan dönüşüm event adları bulunmadı. Repo `assets/js/site.js` içinde de özel analytics event gönderimi yok.

Bu konteyner üzerinden GA4/dönüşüm çalışmıyor. GA4 hesabında property bulunup bulunmadığı ve GTM çalışma alanındaki yayınlanmamış değişiklikler doğrulanamadı. Cloudflare beacon'ın bulunması GA4 veya sipariş dönüşüm ölçümü anlamına gelmez.

Çözüm: doğru GA4 property ve Web Data Stream'i belirle; Measurement ID'yi yayımlanacak Google tag'e bağla; Preview/DebugView'da tek page_view ve ilgili eventleri doğrula. GTM otomatik click tetikleyicileri ile site dataLayer çözümünden uygun olanını seç; aynı olayı iki kez gönderme.

İlk olaylar: `whatsapp_click`, `phone_click`, `model_view`, `pricing_view`, `model_favorite`, `category_click`, `order_click`, `instagram_click`. Parametrelerde model kodu, sayfa yolu ve CTA konumu kullanılabilir; mesaj içeriği veya müşteri kişisel verisini ölçüme taşıma. WhatsApp tıklamasını gerçek sipariş olarak raporlama.

Tamamlanma ölçütü: doğru property'de test verisi; olay başına tek tetikleme; model/sayfa bağlamı; gereksiz kişisel veri içermeyen payload; varsa onay tercihlerinin tutarlı davranışı.

### F-03 — Google sonuçları ölçülemedi (P0 doğrulama)

`list_sites` ve `list_ga4_properties` çağrıları `payment_required` ile reddedildi. GSC Wizard deneme süresi sona ermiş/aktif abonelik yok. Bu, Google Search Console hesabının arızalı olduğunu veya sitenin indekslenmediğini kanıtlamaz.

27 Ağustos'taki 36 tıklama / 283 gösterim ve indeks raporları tarihsel veridir; bugünkü KPI olarak kullanılmamalıdır. Site: sorgusu kesin indeks kontrolünün yerine konulmadı.

Gerekli veri: son tamamlanmış 28 günlük GSC performansı (önceki dönem karşılaştırması, sorgu/sayfa ayrımı), Sayfa İndeksleme raporu, sitemap raporu ve aşağıdaki 12 öncelikli URL'nin URL Inspection sonuçları. Doğrudan Search Console dışa aktarımı kullanılabilir; bu iş için yardımcı servise abonelik zorunlu değildir.

Öncelikli URL'ler: `/takima-ozel-forma/`, `/hali-saha-formasi/`, `/futbol/`, `/modeller/`, `/teklif/`, `/forma-sort-takimi/`, `/forma-yaptirma-istanbul/`, `/nasil-siparis-verilir/`, `/basketbol/`, `/voleybol/`, `/rehber/forma-yaptirma-rehberi/`, `/rehber/`.

### F-04 — Sürüm ve durum kayıtları karışıyor (P1)

`docs/site-audit-and-roadmap.md` 26 Temmuz sürümünü, `PROJECT-STATUS.md` ise 27 Ağustos durumunu anlatıyordu. Güncel fiyat sayfasında eski üç adımlı teklif formu yok; fiyat + WhatsApp akışı var. Eski siyah-gold tasarım, model sayısı ve Lighthouse sonuçları güncel çıktı gibi sunulmamalı.

Çözüm: durum kaydını bu denetim tarihi/commit'i ile güncelle; tamamlanan kod, canlı doğrulama ve işletme sonucu için ayrı işaretler tut. Eski raporu tarihsel arşiv olarak koru.

### F-05 — “Kendin Tasarla” ile mevcut deneyim uyumsuz (P1)

`index.html` içinde iki kullanım var. Hedefler `/takima-ozel-forma/` ve `/teklif/`; mevcut sistem canlı forma düzenleme/renk/isim önizleme aracı sunmuyor.

Çözüm: hizmeti doğru anlatan “Sana Özel Tasarım” veya “Takımına Özel Tasarım” metni kullan; mevcut model/fiyat/WhatsApp yolunu koru. Gerçek araç tamamlandığında araç vaadini yeniden değerlendir.

### F-06 — İmalat ve teslimat ayrımı (P1)

Ana sayfa ve ortak SSS'de “Teslimat süresi nedir?” yanıtı “İmalat süremiz 5–7 iş günüdür.” şeklinde. Kargo süresi ve imalat başlangıcı açıklanmıyor.

Çözüm: imalat ve kargo bilgilerini ayır; sayısal yeni termin uydurma. İşletme onayıyla tasarım/ödeme onayının başlangıç şartını, iş günü tanımını ve kargo kapsamını netleştir.

### F-07 — Beden sayfası gerçek ölçü tablosu değil (P1)

`/beden-tablosu/` güncel kadro/beden planlama ve CSV indirimi sunuyor; içerik açıkça santimetre tablosu bulunmadığını söylüyor. Önceki durum kaydındaki “beden tablosu tamamlandı” ifadesi bu nedenle fazla genişti.

Çözüm: üretimde kullanılan onaylı kalıp ölçüleri, ölçüm yöntemi ve ürün/kalıp ayrımları sağlandığında gerçek tabloyu ekle. Kaynak hazır değilken mevcut sayfayı planlama olarak etiketle. Ürün akışındaki iç süreç ifadelerini müşterinin kararını kolaylaştıran metne dönüştür.

### F-08 — İç bağlantı güçlendirme fırsatı (P1/P2)

50 indekslenebilir sayfa; 0 orphan; 0 unreachable; ana sayfa dışındaki sayfalar 1–2 adım derinlikte. 20 sayfanın yalnızca 1–2 farklı kaynak sayfadan inbound linki var. Bu sayısal eşik tek başına hata veya indekslenmeme nedeni değildir.

Özellikle üç rehber makalesi 1 inbound link alıyor; İstanbul ve halı saha sayfaları 2 inbound. İçerik ve gerçek kullanıcı ilişkisine uygun yerlerde bağlantı eklemek değerlendirilmeli; sadece sayıyı artırmak için site geneline link doldurulmamalı.

### F-09 — Ticari ve güven bilgilerinin kaynak kontrolü (P1)

Site tek üst 280 TL, forma + şort 420 TL, çorap 30 TL, lüks çorap 50 TL ve uzun kollu kaleci farkı 50 TL gösteriyor. Bunlar sitede tutarlı görünen fiyatlardır; işletmenin bugünkü fiyat onayı değildir. KDV/kargo kapsamı, ödeme şartları, değişiklik/hatalı üretim süreci, gerçek fotoğrafların kaynak ve yayın izinleri teyit edilmelidir.

Gizlilik sayfası dosya/WhatsApp kullanımını açıklıyor; GTM ve Cloudflare ölçüm davranışının anlatımı ayrıca güncellenmeli. Bu rapor hukuki uygunluk kararı vermiyor.

## 4. Çalıştırılan kontroller

| Kontrol | Sonuç |
| --- | --- |
| 7 JavaScript sözdizimi kontrolü | geçti |
| `fix-site` → SEO link injector → GTM injector | geçti |
| Üretim sonrası `git diff --exit-code` | geçti, fark yok |
| `audit-site` | 59 HTML, 4 CSS, 7 JS; geçti |
| `audit-link-graph` | 50 sayfa; 0 orphan; 0 unreachable; 20 weak inbound |
| Canlı sitemap sayfaları | 50/50 HTTP 200 |
| Canlı/main HTML eşleşmesi | Cloudflare beacon haricinde 50/50 birebir |
| Sayfalarda bulunan 45 yerel varlık | 45/45 HTTP 200, 45/45 main ile birebir |
| robots / sitemap TXT / sitemap XML | HTTP 200; main ile eşleşiyor; XML Content-Type doğru |
| self-canonical / noindex / JSON-LD parse | 50 sayfada temel kontroller geçti |
| Rastgele bulunmayan yol | HTTP 404 |
| 7 eski katalog/ürün URL'si | HTTP kontrolü, noindex ve doğru meta-refresh hedefleri doğrulandı; katalog.html → /modeller/ browser testi geçti |
| CSV şablonu ve sosyal paylaşım OG görseli | HTTP 200; CSV sütunları doğrulandı |
| Sitemap sayfalarındaki WhatsApp hedefleri | yanlış numaralı wa.me linki yok |
| Model görsellerinin iletişim bandı | 28 model incelendi; 10 eski numara |
| Canlı katalog sayısı / branşlar | 28 toplam; 11 futbol / 11 basketbol / 6 voleybol |
| Kod arama ve boş sonuç | `fk-007` → 1 model; `FK-999` → boş durum |
| Branş filtreleri | 11/11/6 sonucu doğrulandı |
| Favori / sayaç / filtre / kalıcılık / çıkarma | örnek FK-001/FK-007 akışları geçti |
| Ürün tam/detay görünümü | FK-007 geçti |
| Ürün WhatsApp mesajı | doğru numara ve FK-007 kodu; mesaj gönderilmedi |
| Üretim galerisi / Escape ile kapanma | geçti |
| Masaüstü (1363 CSS px) | belirgin yatay taşma/hero başlık çakışması gözlenmedi |
| Site kaynaklı console hata kontrolü | örnek akışlarda kayıt bulunmadı; browser extension hataları site hatası sayılmadı |
| Yayımlanmış GTM | boş konteyner doğrulandı |

HTTP/body kontrolleri DOM görüntü kontrollerinden ayrı yapılmıştır. Varlık sayısı bu sayfalarda doğrudan referans verilen yerel img/script/stylesheet/icon/manifest dosyalarını kapsar; tüm repo dosyaları, her CSS fontu veya bütün sosyal paylaşım varlıkları için tam kapsam iddiası yoktur.

## 5. Tamamlanmayan / erişim veya kaynak bekleyen kontroller

- Gerçek iPhone Safari, Android Chrome, Edge/Firefox ve dar viewport işlev matrisi bu turda çalıştırılmadı. Önceki responsive testler güncel test gibi kullanılmadı.
- Yeni Lighthouse/Core Web Vitals ölçümü yapılmadı. Eski laboratuvar skorları bugünkü canlı skor olarak gösterilmedi.
- GSC ve GA4 özel hesap verileri, yayınlanmamış GTM workspace değişiklikleri okunamadı.
- Eski URL'lerde HTML meta-refresh kullanılıyor; bu rapor sunucu tarafı 301 yönlendirme varmış gibi değerlendirmiyor. 7 eski URL'nin hedef/noindex bilgisi ve örnek katalog yönlenmesi doğrulandı. İlk ek HTTP istemcisi 403 döndürdü; ana taramayla aynı istemci ayarıyla yapılan tek yeniden kontrol 200 döndürdü. İlk sonuç site hatası sayılmadı.
- Domain/DNS/hosting/Google/Meta sahipliği, 2FA ve yedeklerin kullanılabilirliği bu turda doğrulanmadı.
- Gerçek satın alma, ödeme veya müşteriyle mesajlaşma yapılmadı.
- Üretim fotoğraflarının izinleri, ölçü tablosu, fiyat ve termin bilgileri işletme kaynağından doğrulanmadı.

## 6. Uygulanabilir iş sırası ve kabul ölçütleri

| Sıra | İş | Tamamlanma ölçütü | Bağımlılık |
| --- | --- | --- | --- |
| 1 | 10 model görseli ve türevlerinde telefon birliği | tüm kullanılan varlıklarda mevcut hat; forma görselleri korunmuş; canlı doğrulama | düzenlenebilir/onaylı görsel kaynağı |
| 2 | GA4 + GTM ölçümü | doğru property, tek page_view/olay, DebugView testleri | Measurement ID ve hesap erişimi |
| 3 | Güncel Google indeks/performans ölçümü | 12 öncelikli URL raporu, güncel sitemap ve dönem karşılaştırması | GSC dışa aktarımı veya erişim |
| 4 | Gerçek mobil ve performans testleri | iOS/Android temel akışları ve güncel performans raporu | uygun tarayıcı/cihaz ortamı |
| 5 | Metin ve ticari açıklık düzeltmesi | tasarım vaadi/imalat-kargo/beden/fiyat kapsamı tutarlı | işletme teyidi gereken maddeler |
| 6 | Gerçek içerik ve ölçüler | onaylı beden tablosu, üretim-vaka setleri, izinli yorumlar | içerik kaynakları |
| 7 | Veriye göre UX ve iç bağlantı revizyonu | önce/sonra ölçüm, ekran testleri, site kalite kontrolleri | ölçüm altyapısı ve yeterli veri |
| 8 | Kontrollü SEO büyümesi | çekirdek URL sonuçlarına dayalı küçük pilot | güncel indeks ve performans verisi |

Yeni özellikler (canlı tasarım aracı, QR beden toplama, panel/ERP) backlog'da kalır; mevcut iletişim ve ölçüm eksiklerinin önüne alınmaz.

## Sıradaki tek görev

**10 futbol modelinin ve kullanılan görsel türevlerinin iletişim bandını mevcut site hattıyla eşitlemek.** Paralel bağımsız hazırlık olarak doğru GA4 Measurement ID ve güncel Search Console dışa aktarımı temin edilir. Bu denetim PR'si production kodunu değiştirmez; düzeltmeler ayrı küçük PR'larda test edilir.

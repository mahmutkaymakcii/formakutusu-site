# Forma Kutusu — Proje Durumu ve Ana Yol Haritası

Son güncelleme: 27 Ağustos 2026

Bu dosya `formakutusu.com` projesinin tek durum kaynağıdır. Yeni iş başlamadan önce burası kontrol edilir; tamamlanan veya yön değiştiren her önemli işten sonra güncellenir.

## Durum işaretleri

- ✅ TAMAMLANDI
- 🔵 YAPILIYOR
- 🧪 TEST / DOĞRULAMA
- 🟡 SIRADA
- ⛔ BLOKLU / BEKLİYOR
- 💡 DAHA SONRA

---

## 1. Şu anki ana hedef

**Forma Kutusu'nu yalnızca marka adını bilen kullanıcıların ziyaret ettiği bir siteden, Google üzerinden yeni müşteri kazandıran ve ziyaretçiyi kolayca modele, fiyata ve WhatsApp siparişine götüren bir satış kanalına dönüştürmek.**

Bugünkü birincil darboğaz tasarım değil, **Google indeksleme ve markasız ticari aramalarda görünürlük**.

Ana ticari hedef sorgular:

- forma yaptırma
- halı saha forması
- özel tasarım forma
- forma tasarla
- takım forması
- forma yaptırma İstanbul

---

## 2. Güncel sistem özeti

| Alan | Durum | Not |
| --- | --- | --- |
| Canlı site | ✅ | Statik HTML/CSS/JS, Cloudflare Pages |
| GitHub ana repo | ✅ | `mahmutkaymakcii/formakutusu-site` |
| Ana sayfa | ✅ / 🟡 | Canlı; UX sadeleştirme yeniden planlanacak |
| Mobil yapı | ✅ | Önceki responsive ve taşma denetimleri başarılı |
| Futbol | ✅ | Canlı kategori |
| Basketbol | ✅ | Canlı kategori |
| Voleybol | ✅ | Canlı kategori |
| Halı saha | ✅ | Canlı niyet sayfası |
| Model kataloğu | ✅ | Merkezi `assets/data/models.json` |
| Model detay sayfaları | ✅ | Futbol, basketbol, voleybol model sayfaları |
| Fiyat sayfası | ✅ | `/teklif/`; fiyat + WhatsApp sipariş yaklaşımı |
| Sipariş anlatımı | ✅ | `/nasil-siparis-verilir/` |
| Beden tablosu | ✅ | Canlı |
| Kumaş / üretim | ✅ | Canlı |
| SSS | ✅ | Canlı |
| KVKK / gizlilik | ✅ / 🧪 | Sayfa var; hukuki doğrulama ayrı konu |
| robots.txt | ✅ | `Allow: /`; primary sitemap `sitemap.txt` |
| Primary sitemap | ✅ | 50 URL |
| Sitemap XML | ✅ | Secondary/fallback |
| Google Search Console | ✅ | URL-prefix ve domain property mevcut |
| Google Tag Manager | ✅ | `GTM-TJL9N3XX` site geneline kurulu |
| Google Analytics 4 | ⛔ | Henüz bağlı/kurulu değil |
| Google İşletme Profili | ⛔ | Doğrulama için uygun ve kalıcı işletme konumu bekleniyor |
| Dönüşüm event ölçümü | ⛔ | WhatsApp/model/fiyat/sipariş eventleri henüz doğrulanmadı |
| Yerel il/ilçe SEO sistemi | 🟡 | İstanbul başlangıcı var; ölçekleme henüz yapılmayacak |

---

## 3. Google indeksleme — 27 Ağustos 2026 anlık durum

### Sitemap

Primary sitemap: `https://formakutusu.com/sitemap.txt`

- Sitemap içinde: **50 URL**
- Search Console sitemap raporu: **0 hata / 0 uyarı**
- Google sitemap'i okuyabiliyor; eski “sitemap okunamadı” problemi şu an ana darboğaz değil.

### URL Inspection kontrolü

27 Ağustos 2026'da sitemap URL'leri Search Console URL Inspection ile kontrol edildi.

- Ana sayfa `https://formakutusu.com/`: ✅ **Submitted and indexed**
- Son başarılı ana sayfa crawl: **23 Ağustos 2026**, Googlebot Mobile
- Diğer sitemap URL'leri: indeksli PASS sonucu vermedi; sonuçlar ağırlıklı olarak:
  - `Discovered - currently not indexed`
  - `URL is unknown to Google`
- Bazı URL'ler tekrarlı sorgularda bu iki non-indexed durum arasında değişebildi. Bu nedenle ana teşhis “49 sayfanın tamamı aynı coverage nedeni yüzünden bloklu” değil; **Google ana sayfa dışındaki site yapısını henüz yeterince crawl/index etmiyor**.

### Teknik ilk kontrol

Kritik ticari sayfalarda örneğin `/takima-ozel-forma/`:

- `robots: index,follow`
- self-referencing canonical mevcut
- benzersiz title ve description mevcut
- robots.txt genel crawl'a izin veriyor

Bu nedenle sonraki adım yalnızca `noindex` aramak değil; **crawl discovery, iç link gücü, içerik benzersizliği/kalitesi, site mimarisi, sitemap sinyali ve Google'ın siteye ayırdığı crawl/index önceliğini birlikte incelemek**.

---

## 4. Search Console performans özeti

Son 28 günlük son yerleşmiş veri penceresi (28 Temmuz–24 Ağustos 2026):

| KPI | Değer |
| --- | ---: |
| Tıklama | 36 |
| Gösterim | 283 |
| CTR | %12,72 |
| Ortalama pozisyon | 2,35 |

Ancak bu ortalama büyük ölçüde marka sorgusundan geliyor:

- `forma kutusu`: 23 tıklama / 142 gösterim / ort. pozisyon 1,11

Kontrol edilen temel ticari sorgular:

- `forma yaptırma`: 0 gösterim
- `halı saha forması`: 0 gösterim
- `forma tasarla`: 0 gösterim

**Sonuç:** SEO başarısı henüz markasız müşteri kazanımı seviyesine gelmedi.

---

## 5. P0 — Şimdi yapılacak işler

### P0.1 — SEO / Indexing Audit

Durum: 🔵 YAPILIYOR

Amaç: Google'ın ana sayfa dışındaki URL'leri neden crawl/index etmediğini kanıta dayalı olarak belirlemek.

Kontrol listesi:

- [x] Sitemap'teki 50 URL'yi URL Inspection ile toplu kontrol et
- [x] robots.txt ve primary sitemap sözleşmesini doğrula
- [x] Kritik ticari sayfada robots + canonical kontrolü yap
- [ ] 50 URL'yi sayfa türüne göre sınıflandır: kategori / hizmet / rehber / model / yardımcı
- [ ] Ana sayfadan kritik para sayfalarına iç link derinliğini ölç
- [ ] Kategori ve model sayfalarında benzer/ince içerik riskini ölç
- [ ] Canonical zinciri veya canonical çakışması var mı kontrol et
- [ ] Tüm sitemap URL'lerinin canlı HTTP durumlarını yeniden doğrula
- [ ] Sitemap XML/TXT içerik farklarını doğrula
- [ ] Dahili linklerde orphan/weak page analizi yap
- [ ] Önemli ticari sayfalar için içerik ve başlık niyet eşleşmesini kontrol et
- [ ] Öncelikli 8–12 URL'lik “index first” listesi oluştur
- [ ] Gerekli teknik/içerik düzeltmelerini ayrı branch/PR üzerinden uygula
- [ ] Düzeltmeden sonra URL Inspection sonuçlarını yeniden ölç

### P0.2 — Proje yönetim disiplini

Durum: ✅ BAŞLATILDI

- [x] `PROJECT-STATUS.md` oluştur
- [ ] Her çalışma sonunda “Son yapılan / Sıradaki” alanını güncelle
- [ ] Yeni fikirleri doğrudan kodlamadan önce backlog'a ekle
- [ ] Siteyi etkileyen her büyük değişikliği branch + test + PR mantığıyla yap

---

## 6. P1 — Ölçüm sistemi

Durum: 🟡 SIRADA

GTM kurulu ancak GA4 bağlı değil. Site revizyonlarından önce davranış ölçümü kurulmalı.

Plan:

- [ ] Google Analytics 4 property oluştur
- [ ] `formakutusu.com` Web Data Stream oluştur
- [ ] GA4 Measurement ID'yi GTM üzerinden bağla
- [ ] Realtime/DebugView ile page_view doğrula
- [ ] Aşağıdaki eventleri tanımla ve test et:
  - `whatsapp_click`
  - `phone_click`
  - `pricing_view`
  - `model_view`
  - `model_favorite`
  - `category_click`
  - `order_click`
  - `instagram_click`
- [ ] Kritik eventlerden uygun olanları GA4 key event olarak işaretle
- [ ] Consent/KVKK gereksinimini ayrıca değerlendir

---

## 7. P1 — Ana sayfa UX / CRO revizyonu

Durum: 🟡 SIRADA — henüz kodlama yapılmayacak

### Mevcut problem tanımı

İlk ekran görsel olarak güçlü olmaya çalışırken kullanıcıya aynı anda fazla mesaj veriyor.

Tespit edilen sorunlar:

- Büyük hero başlığı belirli masaüstü ölçülerinde görsel alanına taşıyor/çakışıyor.
- İlk ekranda aynı anda fazla metin, kart, CTA ve görsel bulunuyor.
- Görsel hiyerarşi zayıflıyor; kullanıcı nereye bakacağını seçmek zorunda kalıyor.
- Ana sayfa toplam karar yolculuğu açısından kısa kalıyor.
- Koyu zemin + neon gradient + büyük beyaz yazılar + çok sayıda kart/görsel birlikte görsel gürültü oluşturuyor.
- Neon vurgu her yerde kullanıldığında gerçek CTA vurgusu zayıflıyor.

### Yeni tasarım prensibi

**Sade → anlaşılır → güven → seçenek → satış**

Ana sayfa müşterinin şu sorularını sırayla cevaplamalı:

1. Ne üretiyorsunuz?
2. Hangi ürün/branşlar var?
3. Modelleri nereden görebilirim?
4. Fiyat ne?
5. Nasıl sipariş veririm?
6. Kalite nasıl?
7. Size neden güveneyim?
8. Başkaları memnun mu?
9. Nasıl iletişime geçerim?

### Önerilen yeni ana sayfa bilgi mimarisi

1. Sade hero — tek ana mesaj + tek güçlü görsel + 2 CTA
2. “Ne arıyorsun?” hızlı seçim alanı
3. Ürün kategorileri
4. En çok tercih edilen modeller
5. Fiyatlar
6. 3 adımda sipariş
7. Gerçek üretimler / tasarımdan sahaya
8. Gerçek müşteri ve takım fotoğrafları
9. Doğrulanabilir kullanıcı yorumları
10. Neden Forma Kutusu?
11. SSS
12. WhatsApp / iletişim CTA

### Görsel yön

Karar kesinleşmedi; test edilecek öneri:

- %60–70 açık/kırık beyaz içerik yüzeyi
- %20–30 koyu lacivert/siyah vurgu alanları
- Neon yeşil ağırlıklı olarak CTA ve kritik vurgu
- Gradient kullanımı sınırlı

Amaç başka bir siteyi kopyalamak değil; **ilk bakışta ne yaptığımızı anlatan, hata/karmaşa hissettirmeyen ve karar vermeyi kolaylaştıran arayüz**.

---

## 8. P1/P2 — Güven ve içerik katmanı

Durum: 🟡 SIRADA

Öncelikli içerik:

- [ ] Gerçek üretim fotoğrafları
- [ ] Takım fotoğrafları
- [ ] Dijital tasarım → üretilmiş forma → takım üzerinde sonuç vaka setleri
- [ ] Kumaş yakın çekimleri
- [ ] Baskı/dikim/üretim görüntüleri
- [ ] Paketleme/kargo görüntüleri
- [ ] Doğrulanabilir müşteri yorumları
- [ ] Sektör tecrübesini doğrulanabilir ve abartısız biçimde anlatan kurumsal içerik

Kural: Doğrulanmamış müşteri yorumu, ortaklık, üretim adedi veya başarı iddiası yayınlanmaz.

---

## 9. P2 — Ürün genişlemesi

Mevcut ana gruplar:

- Futbol
- Basketbol
- Voleybol
- Halı saha

Gelecekte bilgi mimarisine eklenecek adaylar:

- Kaleci formaları
- Eşofman
- Antrenman yeleği
- Yağmurluk

Kural: Görsel, ürün kapsamı ve gerçek üretim bilgisi hazır olmayan kategori yalnızca SEO amacıyla boş sayfa olarak yayınlanmaz.

---

## 10. P2 — SEO büyüme sistemi

İndeksleme stabil olduktan sonra:

- [ ] Ticari landing page kapsamını güçlendir
- [ ] Düzenli rehber/içerik takvimi
- [ ] Gerçek vaka çalışmaları
- [ ] İç link kümeleri
- [ ] Backlink planı
- [ ] Yerel SEO mimarisi

### İl / ilçe SEO kuralı

`/forma-yaptirma-istanbul/` başlangıç sayfası mevcut.

Türkiye geneli il/ilçe sayfalarını hemen yüzlerce URL olarak üretme. Önce:

1. Mevcut çekirdek URL'lerin indekslenmesini sağla.
2. Sayfa şablonunun gerçekten özgün ve faydalı yerel içerik üretebildiğini kanıtla.
3. İstanbul içinde sınırlı pilot küme ile test et.
4. Search Console sonuçlarına göre ölçekle.

---

## 11. Google İşletme Profili

Durum: ⛔ BEKLİYOR

Profil mevcut fakat doğrulama tamamlanmadı.

Karar:

- Kalıcı ve Google politikalarına uygun gerçek işletme konumu oluşmadan doğrulamayı zorlamamak.
- Geçici, ödünç veya başka işletmelerin kullandığı bir konumu yalnızca doğrulama amacıyla kullanmamak.
- Müşteri kabul edilmeyen bir operasyon adresi kullanılacaksa ileride uygun “service-area business” yapısını değerlendirmek.

Bu konu şu an SEO/indexing ve GA4'ten daha düşük önceliklidir.

---

## 12. Dijital varlık sahipliği kuralı

Forma Kutusu'nun temel dijital varlıkları üçüncü taraf kişi/ajans mülkiyetinde bırakılmamalı.

Kontrol edilecek sahiplikler:

- [ ] Domain / registrar
- [ ] DNS / Cloudflare
- [x] GitHub repository
- [x] Search Console erişimi
- [ ] GA4 property (kurulduğunda)
- [x] Google Tag Manager container
- [ ] Google Business Profile (doğrulandığında)
- [ ] Google Ads (kullanıldığında)
- [ ] Instagram / Meta
- [ ] Kurumsal e-posta
- [ ] 2FA / kurtarma yöntemleri
- [ ] Periyodik site ve veri yedekleri

Dış hizmet sağlayıcıya gerekli yetki verilir; ana sahiplik Forma Kutusu kontrolünde tutulur.

---

## 13. Şimdilik yapılmayacaklar

- ❌ İndeksleme çözülmeden yüzlerce il/ilçe SEO sayfası üretmek
- ❌ UX mimarisi netleşmeden ana sayfayı tekrar tekrar görsel olarak yeniden tasarlamak
- ❌ Gerçek olmayan yorum/referans/sayı kullanmak
- ❌ “Forma Tasarla” adıyla gerçek araç yokken yanıltıcı canlı tasarım vaadi vermek
- ❌ Sadece rakipte var diye ağır script, 3D veya gereksiz efekt eklemek
- ❌ Site ölçülmeden A/B sonucu varmış gibi tasarım kararı vermek

---

## 14. Daha sonra değerlendirilecek özellikler

- 💡 Canlı forma renk/isim/numara önizleme
- 💡 Katmanlı SVG/Canvas forma tasarlama aracı
- 💡 QR kodlu takım beden toplama
- 💡 Model karşılaştırma
- 💡 Takım yöneticisi / tekrar sipariş paneli
- 💡 ERP / üretim durumu entegrasyonu
- 💡 Görselden benzer model önerisi

---

## 15. Aktif çalışma sırası

1. 🔵 **Indexing Audit'i tamamla**
2. 🟡 Gerekli crawl/index düzeltmelerini uygula ve yeniden test et
3. 🟡 GA4 + GTM dönüşüm ölçümünü kur
4. 🟡 Ana sayfa UX wireframe / bilgi mimarisini kesinleştir
5. 🟡 Ana sayfa revizyonunu branch üzerinde uygula
6. 🟡 Gerçek üretim / müşteri kanıt katmanını güçlendir
7. 🟡 Ticari SEO içerik kümelerini büyüt
8. 🟡 Kontrollü yerel SEO pilotu
9. 🟡 Backlink çalışması
10. 💡 Gelişmiş forma tasarlama ve takım araçları

---

## 16. Son yapılan / sıradaki

### Son yapılan

- 27 Ağustos 2026: Güncel repo, Search Console, sitemap, URL Inspection ve ölçüm altyapısı yeniden değerlendirildi.
- 50 sitemap URL'si URL Inspection kapsamına alındı.
- Ana sayfanın indeksli; ana sayfa dışı URL'lerin ise `Discovered - currently not indexed` veya `URL is unknown to Google` durumlarında olduğu doğrulandı.
- `PROJECT-STATUS.md` tek proje durum kaynağı olarak oluşturuldu.

### Sıradaki tek görev

**P0.1 SEO / Indexing Audit'in ikinci turu: site içi crawl mimarisi, iç link derinliği, sayfa benzerliği/ince içerik, canonical yapısı ve HTTP canlılık kontrolleri.**

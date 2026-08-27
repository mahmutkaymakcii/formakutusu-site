# Forma Kutusu — İndeksleme Kurtarma Denetimi

Tarih: 27 Ağustos 2026

Dal: `audit/indexing-recovery-20260827`

## Amaç

Google'ın ana sayfa dışındaki URL'leri neden yeterince crawl/index etmediğini teknik ve içerik sinyallerine göre sınıflandırmak; doğrudan üretim koduna müdahale etmeden önce kanıta dayalı düzeltme sırası belirlemek.

## 1. Search Console anlık durum

27 Ağustos 2026 URL Inspection kontrollerinde:

- Ana sayfa `/`: `Submitted and indexed`
- Son başarılı ana sayfa crawl: 23 Ağustos 2026, Googlebot Mobile
- Diğer sitemap URL'leri ağırlıklı olarak:
  - `Discovered - currently not indexed`
  - `URL is unknown to Google`
- 50 URL'lik sitemap Search Console tarafından okunuyor; sitemap raporunda 0 hata / 0 uyarı var.

Bu nedenle ilk hipotez `robots.txt` veya sitemap okunamaması değildir.

## 2. 50 URL'nin sayfa türlerine göre sınıflandırılması

| Tür | Adet | URL örnekleri |
| --- | ---: | --- |
| Ana sayfa | 1 | `/` |
| Ticari/kategori/hizmet landing page | 8 | `/futbol/`, `/basketbol/`, `/voleybol/`, `/hali-saha-formasi/`, `/takima-ozel-forma/`, `/forma-sort-takimi/`, `/okul-turnuva-formasi/`, `/forma-yaptirma-istanbul/` |
| Katalog ve yardımcı/kurumsal sayfa | 9 | `/modeller/`, `/teklif/`, `/nasil-siparis-verilir/`, `/beden-tablosu/`, `/kumas-ve-uretim/`, `/hakkimizda/`, `/iletisim/`, `/sik-sorulan-sorular/`, `/kvkk-ve-gizlilik/` |
| Rehber merkezi + makaleler | 4 | `/rehber/` ve 3 makale |
| Model detay sayfaları | 28 | `/modeller/fk-001/` vb. |
| **Toplam** | **50** | |

## 3. Teknik temel kontroller

### robots.txt

- `User-agent: *`
- `Allow: /`
- Primary sitemap: `https://formakutusu.com/sitemap.txt`

Crawl'ı genel olarak engelleyen bir robots kuralı yok.

### Canonical / indexability

Üretici ve depo denetimi indekslenebilir HTML sayfalarında self-referencing canonical sözleşmesini zorunlu tutuyor. Örnek `/takima-ozel-forma/` sayfasında:

- `robots: index,follow,max-image-preview:large`
- canonical: `https://formakutusu.com/takima-ozel-forma/`
- benzersiz title
- benzersiz meta description

Depodaki `tools/audit-site.cjs` ayrıca yinelenen canonical, yinelenen title, sitemapte indekslenebilir olmayan URL ve canonical-route uyuşmazlığı durumlarında CI'ı başarısız yapıyor.

### Sitemap TXT/XML

`sitemap.txt` ve `sitemap.xml` aynı 50 indekslenebilir URL'yi içeriyor. İki dosya arasında URL kapsamı farkı tespit edilmedi.

### CI

`PROJECT-STATUS.md` eklenmesinden sonraki `Site Quality` GitHub Actions çalışması başarıyla tamamlandı. Mevcut depo üretilebilir durumda.

## 4. İç link mimarisi

### Güçlü sitewide bağlantı alan sayfalar

Ortak header/footer üzerinden site genelinde tekrar tekrar link alan çekirdek sayfalar:

- `/modeller/`
- `/forma-sort-takimi/`
- `/takima-ozel-forma/`
- `/nasil-siparis-verilir/`
- `/hakkimizda/`
- `/iletisim/`
- `/teklif/`
- `/futbol/`
- `/basketbol/`
- `/voleybol/`
- `/kumas-ve-uretim/`
- `/beden-tablosu/`
- `/sik-sorulan-sorular/`
- `/kvkk-ve-gizlilik/`

Ana sayfa ayrıca doğrudan `/hali-saha-formasi/` ve seçili model detaylarına link veriyor.

### Zayıf/orphan riski taşıyan URL kümesi

Mevcut güncel header/footer ve ana sayfa yapısında aşağıdaki URL'ler ana navigasyonun parçası değil:

- `/forma-yaptirma-istanbul/`
- `/okul-turnuva-formasi/`
- `/rehber/`
- `/rehber/forma-yaptirma-rehberi/`
- `/rehber/hali-saha-formasi-secimi/`
- `/rehber/takim-listesi-hazirlama/`

`/rehber/` kendi üç makalesine link veriyor; makaleler breadcrumb ile rehber merkezine dönebiliyor. Ancak bu kümenin çekirdek site yapısından aldığı görünür iç link desteği zayıf. `/forma-yaptirma-istanbul/` da sitemap dışında keşif sinyali açısından zayıf görünüyor.

Bu durum tüm 49 URL'nin indekslenmemesini tek başına açıklamaz; ancak özellikle `URL is unknown to Google` görülen zayıf sayfalarda keşif sorununa katkı sağlayabilir.

## 5. Model sayfalarında benzersizlik riski

28 model detay sayfası teknik olarak ayrı:

- ayrı URL
- ayrı canonical
- ayrı SKU/model kodu
- ayrı ürün görseli
- ayrı alt metin
- branşa göre bazı değişken alanlar

Ancak aynı branş içindeki model sayfalarının büyük metin bölümü neredeyse aynı şablondan üretiliyor.

Örnek `FK-001` ile `FK-002` arasında değişen temel unsurlar model kodu, görsel/alt metin ve birkaç değişken alan. Şu bölümlerin önemli bölümü aynı:

- lead metni
- fiyatlandırma kutusu
- minimum sipariş ve ürün kapsamı
- kişiselleştirme seçenekleri
- üretim/teslim açıklaması
- beden/bakım açıklaması
- ürün bilgi kartları
- dört adımlı sipariş akışı
- FAQ cevapları

### Risk değerlendirmesi

Bu bir teknik duplicate canonical hatası değildir. Ancak yeni/henüz düşük otoriteli bir domainde Google'ın 28 çok benzer model sayfasını ayrı ayrı indekslemeye değer görmemesine katkıda bulunabilecek **düşük benzersiz değer / templated content** riski vardır.

Model sayfalarını topluca silmek veya noindex yapmak şu aşamada önerilmez. Önce çekirdek ticari sayfaların indekslenmesini ve model sayfalarının gerçek ürün farklılıklarıyla zenginleştirilmesini test etmek daha doğru.

## 6. Ana sayfadan crawl derinliği

Mevcut yapıdan çıkarılan pratik derinlik:

- Derinlik 0: `/`
- Derinlik 1: ana navigasyon/footer sayfaları, branş kategorileri, halı saha ve ana sayfadaki seçili modeller
- Derinlik 2: `/modeller/` üzerinden 28 model detay sayfası
- Zayıf/ayrı küme: rehber, İstanbul ve okul/turnuva sayfaları

50 URL'lik bir site için 2 tıklama derinliği teknik olarak yüksek değildir. Asıl konu bazı içerik kümelerinin çekirdek navigasyondan kopuk kalması ve çok sayıda model sayfasının birbirine aşırı benzemesidir.

## 7. Eski/unutulmuş branch kontrolü

Unutulmuş iş riski için branch karşılaştırması yapıldı:

- `codex/final-site`: `main` dalının gerisinde; main'e göre ek commit yok.
- `codex/local-seo-pilot`: `main` dalının gerisinde; main'e göre ek commit yok.
- `agent/trigger-hero-update`: eski tabandan ayrışmış; main'e taşınmamış anlamlı site kodu yerine yalnızca `.hero-trigger/run.txt` tetik dosyası farkı kaldı.

Sonuç: Güncel `main` dışında kaybolmuş kritik bir Codex uygulama paketi tespit edilmedi.

## 8. Birincil teşhis

Şu an tek bir kritik teknik blok tespit edilmedi. Daha olası tablo birden fazla sinyalin birleşimi:

1. Site yapısı ve URL seti yakın zamanda ciddi biçimde değişti.
2. Google ana sayfayı taramış durumda; diğer URL'lerin önemli kısmını henüz crawl etmemiş.
3. Rehber / İstanbul / okul-turnuva kümesinde iç link keşif sinyali zayıf.
4. 28 model sayfası kendi aralarında yüksek oranda şablon benzerliği taşıyor.
5. Domainin markasız aramalardaki otoritesi henüz düşük; son 28 günlük görünürlük büyük ölçüde `forma kutusu` marka sorgusundan geliyor.

Dolayısıyla yaklaşım "sitemap'i yeniden değiştir" değil, çekirdek URL'leri güçlendirip Google'a daha net site önceliği vermek olmalı.

## 9. Index-first öncelik listesi

İlk etapta Google'ın indekslemesini istediğimiz 12 URL:

1. `https://formakutusu.com/`
2. `https://formakutusu.com/takima-ozel-forma/`
3. `https://formakutusu.com/hali-saha-formasi/`
4. `https://formakutusu.com/futbol/`
5. `https://formakutusu.com/modeller/`
6. `https://formakutusu.com/teklif/`
7. `https://formakutusu.com/forma-sort-takimi/`
8. `https://formakutusu.com/forma-yaptirma-istanbul/`
9. `https://formakutusu.com/nasil-siparis-verilir/`
10. `https://formakutusu.com/basketbol/`
11. `https://formakutusu.com/voleybol/`
12. `https://formakutusu.com/rehber/forma-yaptirma-rehberi/`

Model detaylarının tamamını birinci dalga hedefi yapmak yerine katalog/kategori/para sayfalarını öncelemek daha mantıklı.

## 10. Önerilen düzeltme turu

Henüz uygulanmadı. Ayrı bir implementation commit/PR ile:

### A — İç link keşfini güçlendir

- Rehber merkezine sitewide veya ana sayfadan anlamlı bir link ver.
- `forma-yaptirma-istanbul` sayfasına ilgili ticari/rehber içerikten doğal iç link ekle.
- `okul-turnuva-formasi` sayfasını uygun kategori/ana sayfa karar yolculuğuna bağla.
- Rehber makalelerinden doğrudan ilgili para sayfalarına bağlamsal iç linkler ekle.

### B — Para sayfalarının niyet eşleşmesini güçlendir

- `takima-ozel-forma`, `hali-saha-formasi`, `futbol` ve İstanbul sayfasında kullanıcı sorularına özgün cevap ve gerçek kanıt katmanı artır.
- Başlık/description/H1 değişiklikleri yalnızca sorgu niyeti ve içerik eşleşmesi gerekliyse yapılmalı; anahtar kelime doldurma yapılmamalı.

### C — Model sayfası benzersizliğini artır

Her model için mümkün oldukça gerçek farklılık alanları ekle:

- tasarım karakteri
- ana geometrik/desen özelliği
- renk uyarlama önerileri
- hangi takım/forma stiline uygun olduğu
- ön/arka/detay görselleri
- gerçek üretim varsa vaka bağlantısı

### D — Audit aracını genişlet

`tools/audit-site.cjs` şu anda kırık link ve canonical kontrol ediyor ancak link graph/orphan sayfa kontrolü yapmıyor. İleride:

- indekslenebilir sayfalara gelen internal link sayısını hesapla
- sıfır inbound internal link bulunan URL'de uyarı/hata üret
- ana sayfadan BFS crawl depth raporu çıkar
- sitemapte olup link graph'ta bulunmayan sayfaları raporla

## 11. Bu turda yapılmayanlar

- Canlı tasarım değiştirilmedi.
- Sitemap URL sayısı değiştirilmedi.
- Model sayfaları noindex yapılmadı.
- URL silinmedi/yönlendirilmedi.
- İl/ilçe sayfaları toplu üretilmedi.
- Ana sayfa UX revizyonuna başlanmadı.
- GA4 kurulmadı.

Önce denetim sonucu sabitlenmiştir; sonraki adım küçük ve ölçülebilir indeksleme temel düzeltmeleridir.

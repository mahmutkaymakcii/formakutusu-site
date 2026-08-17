# Forma Kutusu web sitesi

Forma Kutusu'nun bağımlılıksız, statik ve mobil öncelikli web sitesi.

## Yapı

- `tools/build-site.cjs`: ortak şablonlardan standart HTML sayfalarını üretir; küratörlü `index.html` ve `hali-saha-formasi/index.html` dosyalarına yazmaz.
- `tools/fix-site.cjs`: üretimi tamamlar, özel sayfaları korur, İstanbul sayfasını ortak tasarıma taşır, metin hatalarını düzeltir ve sitemap dosyalarını yeniden oluşturur.
- `tools/audit-site.cjs`: production HTML, CSS, JavaScript, iç bağlantılar, görsel yolları, SEO, JSON-LD, manifest, robots ve sitemap kontrollerini yapar; `preview/` kapsam dışıdır.
- `assets/data/models.json`: futbol, basketbol ve voleybol model kataloğunun tek veri kaynağıdır.
- `assets/css/site.css`: ortak tasarım sistemi ve responsive bileşenler.
- `assets/css/home-v2.css`: ana sayfaya özel yerleşim katmanı.
- `assets/css/neon-sport.css`: güncel yapıyı koruyan koyu neon-sportif marka katmanı.
- `assets/fonts/`: yerel Manrope ve Unbounded web fontları ile lisansları.
- `assets/brand/forma-kutusu-og-neon.png`: sosyal paylaşım için 1200 × 630 neon marka görseli.
- `assets/js/site.js`: menü, galeri, model filtreleri, favoriler ve teklif asistanı.
- `assets/templates/takim-listesi.csv`: müşterilerin indirebildiği takım listesi şablonu.

## Yerel üretim

Node.js 24 ile:

```sh
node tools/fix-site.cjs
node tools/audit-site.cjs
```

Yayın öncesinde kullanılacak ana komut `tools/fix-site.cjs` dosyasıdır. Bu komut temel üreticiyi çalıştırır, küratörlü ana sayfa ve halı saha sayfasını korur, ortak düzeltmeleri uygular ve sitemap dosyalarını mevcut indekslenebilir sayfalardan yeniden üretir. Primary sitemap `sitemap.txt` dosyasıdır ve `robots.txt` bu adresi gösterir; `sitemap.xml` secondary/fallback olarak tutulur.

## Model ekleme

Yeni model `assets/data/models.json` dosyasına eklenir ve optimize edilmiş WebP görseli `assets/models/` altında tutulur. Model kodları benzersiz olmalı; görseller küçük harfli, boşluksuz ve tireli adlandırılmalıdır.

## Yayın öncesi kontrol

```sh
node --check tools/build-site.cjs
node --check tools/fix-site.cjs
node --check tools/audit-site.cjs
node --check assets/js/site.js
node tools/fix-site.cjs
node tools/audit-site.cjs
git diff --exit-code
```

GitHub Actions aynı kontrolleri her pull request ve `main` güncellemesinde otomatik çalıştırır. Denetim; kırık bağlantı, eksik görsel, yinelenen kimlik, hatalı canonical, sitemap uyumsuzluğu, geçersiz JSON-LD ve JavaScript sözdizimi hatalarında başarısız olur.

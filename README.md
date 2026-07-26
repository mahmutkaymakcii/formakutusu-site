# Forma Kutusu web sitesi

Forma Kutusu'nun bağımlılıksız, statik ve mobil öncelikli web sitesi.

## Yapı

- `tools/build-site.cjs`: ortak şablonlardan bütün HTML sayfalarını üretir.
- `assets/data/models.json`: futbol, basketbol ve voleybol model kataloğunun tek veri kaynağıdır.
- `assets/css/site.css`: tasarım sistemi ve responsive bileşenler.
- `assets/js/site.js`: menü, galeri, model filtreleri, favoriler ve teklif asistanı.
- `assets/templates/takim-listesi.csv`: müşterilerin indirebildiği takım listesi şablonu.

## Yerel üretim

Node.js 18 veya daha yeni bir sürümle:

```sh
node tools/build-site.cjs
```

Üretilen HTML dosyaları doğrudan statik hosting üzerinde yayınlanabilir. Sayfa metni veya şablon değişikliği yapıldığında HTML dosyaları elle düzenlenmemeli; üretici dosya güncellenip komut yeniden çalıştırılmalıdır.

## Model ekleme

Yeni model `assets/data/models.json` dosyasına eklenir ve optimize edilmiş WebP görseli `assets/models/` altında tutulur. Model kodları benzersiz olmalı; görseller küçük harfli, boşluksuz ve tireli adlandırılmalıdır.

## Yayın öncesi kontrol

- Üretim komutunu çalıştır.
- HTML doğrulamasını yap.
- İç bağlantıları, WhatsApp ve telefon bağlantılarını kontrol et.
- 320–1920 px aralığında yatay taşma ve sabit CTA çakışması olmadığını doğrula.
- `sitemap.xml` ve `robots.txt` çıktılarının güncel olduğunu kontrol et.

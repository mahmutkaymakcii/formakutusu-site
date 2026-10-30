const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const origin = "https://formakutusu.com";

function file(relativePath) {
  return path.join(root, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(file(relativePath), "utf8");
}

function write(relativePath, content) {
  const target = file(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${content.trimEnd()}\n`, "utf8");
}

function walk(dir) {
  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "preview"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...walk(full));
    else output.push(full);
  }
  return output;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function schemaTag(schema) {
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

function extractChrome(html) {
  const contentStart = html.indexOf('<a class="skip-link"');
  const mainStart = html.indexOf('<main id="main-content">');
  const footerStart = html.indexOf('<footer class="site-footer">');
  const bodyEnd = html.indexOf("</body>");
  if ([contentStart, mainStart, footerStart, bodyEnd].some((value) => value < 0)) {
    throw new Error("Ortak sayfa kabuğu çıkarılamadı.");
  }
  return {
    header: html
      .slice(contentStart, mainStart)
      .replace(/\saria-current="page"/g, "")
      .trimEnd(),
    footer: html.slice(footerStart, bodyEnd).trimEnd(),
  };
}

function createIstanbulPage(chrome) {
  const canonical = `${origin}/forma-yaptirma-istanbul/`;
  const faq = [
    [
      "İstanbul için minimum forma siparişi kaç adettir?",
      "Takım üretimi en az 5 adet ile başlar. Ürün fiyatlarını Fiyatlar sayfasında inceleyebilirsin.",
    ],
    [
      "İstanbul dışındaki takımlar da sipariş verebilir mi?",
      "Evet. Siparişler Türkiye genelinde planlanabilir. İmalat tasarım onayından sonra 5–7 iş günü sürer; kargo süresi buna dahil değildir.",
    ],
    [
      "Tasarımı üretimden önce görebilir miyim?",
      "Evet. Renk, logo, sponsor, isim ve numara detayları kontrol edilip tasarım onayı alınmadan üretime geçilmez.",
    ],
  ];
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Forma Kutusu",
      url: `${origin}/`,
      logo: `${origin}/assets/brand/formakutusu.webp`,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+905432321853",
        contactType: "sales",
        availableLanguage: "Turkish",
      },
      sameAs: [
        "https://www.instagram.com/formakutusu/",
        "https://www.tiktok.com/@formakutusunora",
      "https://www.facebook.com/share/198st7XEzE/",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: `${origin}/` },
        { "@type": "ListItem", position: 2, name: "Forma Yaptırma İstanbul", item: canonical },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ];

  const faqHtml = faq
    .map(
      ([question, answer], index) => `<details ${index === 0 ? "open" : ""}>
          <summary>${escapeHtml(question)}</summary>
          <div><p>${escapeHtml(answer)}</p></div>
        </details>`,
    )
    .join("\n        ");

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#080a0e">
  <meta name="color-scheme" content="dark">
  <title>Forma Yaptırma İstanbul | Forma Kutusu</title>
  <meta name="description" content="İstanbul'daki futbol, halı saha, basketbol ve voleybol takımları için özel forma modellerini ve fiyatlarını inceleyin.">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="manifest" href="/site.webmanifest">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Forma Kutusu">
  <meta property="og:title" content="Forma Yaptırma İstanbul | Forma Kutusu">
  <meta property="og:description" content="İstanbul'daki takımlar için model, renk, logo, isim, numara ve beden bilgileriyle forma siparişini hazırlayın.">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${origin}/assets/brand/forma-kutusu-og-neon.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Forma Yaptırma İstanbul | Forma Kutusu">
  <meta name="twitter:description" content="İstanbul'daki takımlar için özel forma fiyatlarını inceleyin ve siparişinizi hazırlayın.">
  <meta name="twitter:image" content="${origin}/assets/brand/forma-kutusu-og-neon.jpg">
  <link rel="preload" href="/assets/fonts/unbounded-variable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/manrope-variable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/css/site.css?v=20261025b">
  <link rel="stylesheet" href="/assets/css/neon-sport.css?v=20261024b">
  ${schemas.map(schemaTag).join("\n  ")}
  <script src="/assets/js/site.js?v=20261025b" defer></script>
</head>
<body class="content-page istanbul-page">
  ${chrome.header}
  <main id="main-content">
    <nav class="breadcrumbs container" aria-label="İçerik yolu">
      <a href="/">Ana Sayfa</a><span aria-hidden="true">/</span><span aria-current="page">Forma Yaptırma İstanbul</span>
    </nav>
    <section class="inner-hero">
      <div class="container inner-hero__grid">
        <div>
          <p class="eyebrow">İstanbul'daki takımlar için</p>
          <h1>İstanbul’da forma yaptırma: süreci net bilgilerle başlat.</h1>
          <p class="lead">Futbol, halı saha, basketbol ve voleybol takımları için model, renk, logo, isim, numara ve beden dağılımını sipariş öncesinde planla.</p>
        </div>
      </div>
    </section>
    <section class="feature-section"><div class="container">
      <div class="section-intro"><p class="eyebrow">Sipariş için gerekenler</p><h2>Sipariş kapsamını dört başlıkta netleştir.</h2><p>Fiyatları incele; siparişini WhatsApp’tan başlat.</p></div>
      <div class="feature-grid">
        <article><span>01</span><h3>Model ve branş</h3><p>Futbol, basketbol veya voleybol model kodunu seç.</p></article>
        <article><span>02</span><h3>Takım kimliği</h3><p>Renk, arma, sponsor, isim ve numara bilgilerini hazırla.</p></article>
        <article><span>03</span><h3>Adet ve beden</h3><p>Oyuncu listesini kontrol ederek beden dağılımını netleştir.</p></article>
        <article><span>04</span><h3>Tasarım onayı</h3><p>Hazırlanan görsel onaylanmadan üretime geçilmez.</p></article>
      </div>
    </div></section>
    <section class="content-section"><div class="container prose">
      <h2>İstanbul’daki takımlar için forma üretimi</h2>
      <p>İstanbul Zeytinburnu merkezli Forma Kutusu, 2017’den beri takımlara özel forma tasarlıyor; formalar NORA markasıyla üretiliyor. Halı saha ekipleri, amatör kulüpler, şirket takımları, okul ve turnuva kadroları için futbol, basketbol ve voleybol formalarını takımın renkleri, arması ve sponsorlarıyla hazırlıyoruz.</p>
      <p>Sipariş süreci her takım için aynı: model kataloğundan beğendiğin desenin kodunu seç ya da kendi deseninle başla, adet ve ürün kapsamını belirle, oyuncu listesini hazırla. Tasarım desteği ücretsiz; hazırlanan görseli onaylamadan üretime geçmiyoruz. İmalat, onaydan sonra 5–7 iş günü sürüyor ve siparişler kargoyla gönderiliyor.</p>
      <h2>İstanbul’da forma fiyatları</h2>
      <p>Fiyatlar adet başına: tek üst forma 300₺, forma + şort 450₺, forma + şort + çorap 480₺. Kaleci forması için 50₺ uzun kollu fiyat farkı eklenir. Üretim en az 5 adet ile başlar. Ayrıntılar ve örnek hesaplar için <a href="/teklif/">Fiyatlar</a> sayfasına, model seçmek için <a href="/modeller/">Modeller</a> sayfasına bakabilirsin.</p>
      <h2>Hangi takımlar için?</h2>
      <p><a href="/hali-saha-formasi/">Halı saha forması</a>, <a href="/futbol/">futbol forması</a>, <a href="/basketbol/">basketbol forması</a>, <a href="/voleybol/">voleybol forması</a> ve <a href="/okul-turnuva-formasi/">okul ve turnuva forması</a> siparişlerinde isim, numara, logo ve sponsor bilgileri tasarım aşamasında formaya uygulanır. Kendi desenini kullanmak istersen <a href="/takima-ozel-forma/">takıma özel forma</a> sayfasından yükleyip formanın üzerinde anında görebilirsin.</p>
    </div></section>
    <section class="content-band"><div class="container content-band__grid">
      <div><p class="eyebrow">Gönderim planı</p><h2>İstanbul ve Türkiye geneli için güncel bilgiyi sipariş görüşmesinde doğrula.</h2></div>
      <ul class="check-list"><li>Minimum 5 adet üretim</li><li>Ücretsiz tasarım desteği</li><li>Forma ve şort kapsamı</li><li>Çocuk ve yetişkin bedenleri</li><li>Tasarım onayı</li><li>Onaydan sonra 5–7 iş günü imalat</li></ul>
    </div></section>
    <section class="faq-section"><div class="container faq-section__grid">
      <div class="section-intro"><p class="eyebrow">Sık sorulanlar</p><h2>İstanbul forma siparişi hakkında</h2><p>İmalat tasarım onayından sonra 5–7 iş günü sürer.</p></div>
      <div class="faq-list">${faqHtml}</div>
    </div></section>
    <section class="final-cta"><div class="container final-cta__inner">
      <div><p class="eyebrow">Bir sonraki adım</p><h2>Takımına yakışan formayı birlikte hazırlayalım.</h2></div>
      <div class="button-row"><a class="button" href="/forma-tasarla/">Tasarla →</a><a class="button button--ghost" href="/teklif/">Fiyatları Gör</a></div>
    </div></section>
  </main>
  ${chrome.footer}
</body>
</html>`;
}

const build = spawnSync(process.execPath, [file("tools/build-site.cjs")], {
  cwd: root,
  encoding: "utf8",
  stdio: "inherit",
});
if (build.status !== 0) process.exit(build.status || 1);

const chrome = extractChrome(read("hakkimizda/index.html"));
write("forma-yaptirma-istanbul/index.html", createIstanbulPage(chrome));

for (const relativePath of ["404.html", "404/index.html"]) {
  let html = read(relativePath);
  html = html.replace(
    '<meta name="robots" content="index,follow,max-image-preview:large">',
    '<meta name="robots" content="noindex,follow">',
  );
  write(relativePath, html);
}

const replacements = [
  [/Futbol formalari/g, "Futbol formaları"],
  [/Basketbol formalari/g, "Basketbol formaları"],
  [/Voleybol formalari/g, "Voleybol formaları"],
  [/Tasarım onayın alınmadan/g, "Tasarım onayı alınmadan"],
];

for (const htmlFile of walk(root).filter((target) => target.endsWith(".html"))) {
  const originalHtml = fs.readFileSync(htmlFile, "utf8");
  let html = originalHtml;
  for (const [pattern, replacement] of replacements) html = html.replace(pattern, replacement);
  if (html !== originalHtml) fs.writeFileSync(htmlFile, `${html.trimEnd()}\n`, "utf8");
}

const indexableCanonicals = [];
for (const htmlFile of walk(root).filter((target) => target.endsWith(".html"))) {
  const html = fs.readFileSync(htmlFile, "utf8");
  if (/http-equiv=["']refresh["']/i.test(html)) continue;
  if (/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) continue;
  const match = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  if (match?.[1]?.startsWith(origin)) indexableCanonicals.push(match[1]);
}

const canonicalUrls = [...new Set(indexableCanonicals)].sort((a, b) => {
  if (a === `${origin}/`) return -1;
  if (b === `${origin}/`) return 1;
  return a.localeCompare(b, "tr");
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${canonicalUrls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>`;
write("sitemap.xml", sitemap);
write("sitemap.txt", canonicalUrls.join("\n"));
write(
  "robots.txt",
  `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.txt\nSitemap: ${origin}/sitemap.xml`,
);

console.log(`Finalized ${canonicalUrls.length} indexable pages.`);

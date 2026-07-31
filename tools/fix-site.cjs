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
    if ([".git", "node_modules"].includes(entry.name)) continue;
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
    header: html.slice(contentStart, mainStart).trimEnd(),
    footer: html.slice(footerStart, bodyEnd).trimEnd(),
  };
}

function createIstanbulPage(chrome) {
  const canonical = `${origin}/forma-yaptirma-istanbul/`;
  const faq = [
    [
      "İstanbul için minimum forma siparişi kaç adettir?",
      "Takım üretimi en az 5 adet ile başlar. Ürün kapsamı ve beden dağılımı teklif sırasında netleştirilir.",
    ],
    [
      "İstanbul dışındaki takımlar da sipariş verebilir mi?",
      "Evet. Siparişler Türkiye genelinde planlanabilir; güncel gönderim ve teslim bilgisi teklif aşamasında paylaşılır.",
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
        telephone: "+905348578836",
        contactType: "sales",
        availableLanguage: "Turkish",
      },
      sameAs: [
        "https://www.instagram.com/formakutusu/",
        "https://www.tiktok.com/@formakutusunora",
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
  <meta name="description" content="İstanbul'daki futbol, halı saha, basketbol ve voleybol takımları için özel forma tasarımı ve üretim teklifi hazırlayın.">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preload" href="/assets/models/fk-007-640.webp" as="image" imagesrcset="/assets/models/fk-007-640.webp 640w, /assets/models/fk-007.webp 1000w" imagesizes="(max-width: 52rem) 92vw, 38vw" fetchpriority="high">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Forma Kutusu">
  <meta property="og:title" content="Forma Yaptırma İstanbul | Forma Kutusu">
  <meta property="og:description" content="İstanbul'daki takımlar için model, renk, logo, isim, numara ve beden bilgileriyle forma teklifi hazırlayın.">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${origin}/assets/brand/forma-kutusu-og-neon.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Forma Yaptırma İstanbul | Forma Kutusu">
  <meta name="twitter:description" content="İstanbul'daki takımlar için özel forma teklifini kısa adımlarla hazırlayın.">
  <meta name="twitter:image" content="${origin}/assets/brand/forma-kutusu-og-neon.png">
  <link rel="stylesheet" href="/assets/css/site.css">
  <link rel="stylesheet" href="/assets/css/neon-sport.css?v=20260731d">
  ${schemas.map(schemaTag).join("\n  ")}
  <script src="/assets/js/site.js" defer></script>
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
          <h1>Forma yaptırma sürecini net bilgilerle başlat.</h1>
          <p class="lead">Futbol, halı saha, basketbol ve voleybol takımları için model, renk, logo, isim, numara ve beden dağılımını tek teklif akışında planla.</p>
          <div class="button-row"><a class="button" href="/teklif/">Teklif Hazırla</a><a class="button button--ghost" href="/modeller/">Modelleri Gör</a></div>
        </div>
        <div class="inner-hero__visual"><img src="/assets/models/fk-007.webp" srcset="/assets/models/fk-007-640.webp 640w, /assets/models/fk-007.webp 1000w" sizes="(max-width: 52rem) 92vw, 38vw" alt="FK-007 özel futbol forma ve şort modeli" width="1000" height="1250" loading="eager" fetchpriority="high"></div>
      </div>
    </section>
    <section class="feature-section"><div class="container">
      <div class="section-intro"><p class="eyebrow">Teklif için gerekenler</p><h2>Sipariş kapsamını dört başlıkta netleştir.</h2><p>Kesin fiyat ve teslim tarihi, seçilen ürün kapsamı ve güncel üretim planına göre teklif sırasında paylaşılır.</p></div>
      <div class="feature-grid">
        <article><span>01</span><h3>Model ve branş</h3><p>Futbol, basketbol veya voleybol model kodunu seç.</p></article>
        <article><span>02</span><h3>Takım kimliği</h3><p>Renk, arma, sponsor, isim ve numara bilgilerini hazırla.</p></article>
        <article><span>03</span><h3>Adet ve beden</h3><p>Oyuncu listesini kontrol ederek beden dağılımını netleştir.</p></article>
        <article><span>04</span><h3>Tasarım onayı</h3><p>Hazırlanan görsel onaylanmadan üretime geçilmez.</p></article>
      </div>
    </div></section>
    <section class="content-band"><div class="container content-band__grid">
      <div><p class="eyebrow">Gönderim planı</p><h2>İstanbul ve Türkiye geneli için güncel bilgiyi teklif aşamasında doğrula.</h2></div>
      <ul class="check-list"><li>Minimum 5 adet üretim</li><li>Ücretsiz tasarım desteği</li><li>Forma ve şort kapsamı</li><li>Çocuk ve yetişkin bedenleri</li><li>Tasarım onayı</li><li>Güncel teslim ve kargo bilgisi</li></ul>
    </div></section>
    <section class="faq-section"><div class="container faq-section__grid">
      <div class="section-intro"><p class="eyebrow">Sık sorulanlar</p><h2>İstanbul forma siparişi hakkında</h2><p>Doğrulanması gereken fiyat, termin ve üretim ayrıntıları teklif görüşmesinde netleştirilir.</p></div>
      <div class="faq-list">${faqHtml}</div>
    </div></section>
    <section class="final-cta"><div class="container final-cta__inner">
      <div><p class="eyebrow">Bir sonraki adım</p><h2>Takımın için anlaşılır bir teklif özeti hazırla.</h2><p>Model kodunu, adedi, takım renklerini ve beden listesini paylaşman yeterli.</p></div>
      <div class="button-row"><a class="button" href="/teklif/">Teklif Sihirbazını Aç</a><a class="button button--ghost" href="https://wa.me/905348578836?text=Merhaba%2C%20%C4%B0stanbul%27daki%20tak%C4%B1m%C4%B1m%C4%B1z%20i%C3%A7in%20forma%20teklifi%20almak%20istiyorum." target="_blank" rel="noopener noreferrer">WhatsApp'tan Yaz</a></div>
    </div></section>
  </main>
  ${chrome.footer}
</body>
</html>`;
}

const curated = new Map();
for (const relativePath of ["index.html", "hali-saha-formasi/index.html"]) {
  if (fs.existsSync(file(relativePath))) curated.set(relativePath, read(relativePath));
}

const build = spawnSync(process.execPath, [file("tools/build-site.cjs")], {
  cwd: root,
  encoding: "utf8",
  stdio: "inherit",
});
if (build.status !== 0) process.exit(build.status || 1);

for (const [relativePath, content] of curated) write(relativePath, content);

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
  let html = fs.readFileSync(htmlFile, "utf8");
  for (const [pattern, replacement] of replacements) html = html.replace(pattern, replacement);
  fs.writeFileSync(htmlFile, `${html.trimEnd()}\n`, "utf8");
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

console.log(`Finalized ${canonicalUrls.length} indexable pages.`);

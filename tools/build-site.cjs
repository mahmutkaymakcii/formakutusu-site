const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const models = JSON.parse(
  fs.readFileSync(path.join(root, "assets", "data", "models.json"), "utf8"),
);

const site = {
  name: "Forma Kutusu",
  origin: "https://formakutusu.com",
  phoneDisplay: "0534 857 88 36",
  phoneHref: "+905348578836",
  whatsapp: "905348578836",
  instagram: "https://www.instagram.com/formakutusu/",
  tiktok: "https://www.tiktok.com/@formakutusunora",
};

const routes = [];
const curatedRoutes = new Set(["/", "/hali-saha-formasi/"]);

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function whatsappUrl(message) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${site.origin}${item.path}`,
    })),
  };
}

function faqSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: `${site.origin}/`,
    logo: `${site.origin}/assets/brand/formakutusu.webp`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: site.phoneHref,
      contactType: "sales",
      availableLanguage: "Turkish",
    },
    sameAs: [site.instagram, site.tiktok],
  };
}

function schemaTags(schemas = []) {
  return schemas
    .map(
      (schema) =>
        `<script type="application/ld+json">${JSON.stringify(schema)}</script>`,
    )
    .join("\n");
}

const headerLinks = [
  {
    name: "Formalar",
    path: "/modeller/",
    section: "/modeller/",
    aliases: ["/futbol/", "/basketbol/", "/voleybol/", "/hali-saha-formasi/"],
  },
  { name: "Şortlar", path: "/forma-sort-takimi/" },
  { name: "Özel Üretim", path: "/takima-ozel-forma/" },
  { name: "Nasıl Sipariş Verilir?", path: "/nasil-siparis-verilir/" },
  { name: "Hakkımızda", path: "/hakkimizda/" },
  { name: "İletişim", path: "/iletisim/" },
];

function headerLink(item, routePath) {
  const isCurrent =
    routePath === item.path ||
    (item.section && routePath.startsWith(item.section)) ||
    item.aliases?.includes(routePath);
  return `<a href="${item.path}"${isCurrent ? ' aria-current="page"' : ""}>${item.name}</a>`;
}

function header(routePath) {
  return `
  <a class="skip-link" href="#main-content">Ana içeriğe geç</a>
  <section class="service-strip" aria-label="Hizmet özeti">
    <div class="container service-strip__inner">
      <span>Türkiye geneli gönderim</span>
      <span>Minimum 5 adet üretim</span>
      <span>Ücretsiz tasarım desteği</span>
      <span>İsim, numara ve logo uygulaması</span>
    </div>
  </section>
  <header class="site-header" data-site-header>
    <div class="container site-header__inner">
      <a class="brand" href="/" aria-label="Forma Kutusu ana sayfa">
        <img src="/assets/brand/formakutusu.webp" alt="Forma Kutusu" width="640" height="88">
      </a>
      <nav class="site-nav" id="site-nav" aria-label="Ana menü" data-site-nav>
        ${headerLinks.map((item) => headerLink(item, routePath)).join("\n        ")}
        <a class="site-nav__mobile-action" href="/modeller/">
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg> Model Ara
        </a>
        <a class="button button--small site-nav__mobile-action site-nav__mobile-quote" href="/teklif/"${routePath === "/teklif/" ? ' aria-current="page"' : ""}>Teklif Al</a>
      </nav>
      <div class="header-actions" aria-label="Hızlı bağlantılar">
        <a class="header-action header-search" href="/modeller/" aria-label="Model ara">
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
          <span class="header-action__label">Model Ara</span>
        </a>
        <a class="header-action header-favorites" href="/modeller/?filtre=favoriler" aria-label="Favorilerim">
          <span class="header-favorites__icon"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg><b data-favorite-count>0</b></span>
          <span class="header-action__label">Favoriler</span>
        </a>
        <a class="button button--small header-quote" href="/teklif/"${routePath === "/teklif/" ? ' aria-current="page"' : ""}>Teklif Al</a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-nav-toggle>
          <span class="sr-only">Menüyü aç</span>
          <span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>
        </button>
      </div>
    </div>
  </header>`;
}

function footer() {
  return `
  <footer class="site-footer">
    <div class="container site-footer__grid">
      <div>
        <img class="site-footer__logo" src="/assets/brand/formakutusu.webp" alt="Forma Kutusu" width="640" height="88" loading="lazy">
        <p>Takımlar için özel forma tasarımı ve süblimasyon üretim süreci.</p>
        <p class="site-footer__producer">Üretim gücü <img src="/assets/brand/nora.webp" alt="NORA" width="420" height="245" loading="lazy"></p>
      </div>
      <div>
        <h2>Modeller</h2>
        <a href="/futbol/">Futbol formalari</a>
        <a href="/basketbol/">Basketbol formalari</a>
        <a href="/voleybol/">Voleybol formalari</a>
        <a href="/modeller/">Tüm modeller</a>
      </div>
      <div>
        <h2>Bilgi</h2>
        <a href="/kumas-ve-uretim/">Kumaş ve üretim</a>
        <a href="/beden-tablosu/">Beden planlama</a>
        <a href="/sik-sorulan-sorular/">Sık sorulanlar</a>
        <a href="/hakkimizda/">Hakkımızda</a>
      </div>
      <div>
        <h2>İletişim</h2>
        <a href="${whatsappUrl("Merhaba, takımımız için özel forma teklifi almak istiyorum.")}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a href="tel:${site.phoneHref}">${site.phoneDisplay.split(" ").join("&nbsp;")}</a>
        <a href="${site.instagram}" target="_blank" rel="noopener noreferrer">Instagram</a>
        <a href="/kvkk-ve-gizlilik/">Gizlilik notu</a>
      </div>
    </div>
    <div class="container site-footer__bottom">
      <p>© ${new Date().getFullYear()} Forma Kutusu. Tüm hakları saklıdır.</p>
      <a href="/iletisim/">İletişim</a>
    </div>
  </footer>
  <a class="mobile-cta" href="/teklif/" aria-label="Teklif formunu aç">
    <span aria-hidden="true">↗</span> Teklif Al
  </a>`;
}

function pageShell({
  title,
  description,
  path: routePath,
  body,
  schemas = [],
  pageClass = "",
  preloadImage = "",
}) {
  const canonical = `${site.origin}${routePath}`;
  const fullTitle = title.includes("Forma Kutusu")
    ? title
    : `${title} | Forma Kutusu`;
  const preload = preloadImage
    ? preloadImage === "/assets/models/fk-007.webp"
      ? `<link rel="preload" href="/assets/models/fk-007-640.webp" as="image" imagesrcset="/assets/models/fk-007-640.webp 640w, /assets/models/fk-007.webp 1000w" imagesizes="(max-width: 52rem) 92vw, 38vw" fetchpriority="high">`
      : `<link rel="preload" href="${preloadImage}" as="image" fetchpriority="high">`
    : "";
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#080a0e">
  <meta name="color-scheme" content="dark">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="manifest" href="/site.webmanifest">
  ${preload}
  <meta property="og:locale" content="tr_TR">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Forma Kutusu">
  <meta property="og:title" content="${escapeHtml(fullTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${site.origin}/assets/brand/forma-kutusu-og-neon.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(fullTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${site.origin}/assets/brand/forma-kutusu-og-neon.png">
  <link rel="stylesheet" href="/assets/css/site.css">
  <link rel="stylesheet" href="/assets/css/neon-sport.css?v=20260801c">
  ${schemaTags(schemas)}
  <script src="/assets/js/site.js?v=20260801c" defer></script>
</head>
<body class="${escapeHtml(pageClass)}">
  ${header(routePath)}
  <main id="main-content">
    ${body}
  </main>
  ${footer()}
</body>
</html>
`;
}

function breadcrumbs(items) {
  return `<nav class="breadcrumbs container" aria-label="İçerik yolu">
    ${items
      .map((item, index) =>
        index === items.length - 1
          ? `<span aria-current="page">${escapeHtml(item.name)}</span>`
          : `<a href="${item.path}">${escapeHtml(item.name)}</a><span aria-hidden="true">/</span>`,
      )
      .join("")}
  </nav>`;
}

function sectionIntro(eyebrow, title, copy = "") {
  return `<div class="section-intro">
    <p class="eyebrow">${escapeHtml(eyebrow)}</p>
    <h2>${escapeHtml(title)}</h2>
    ${copy ? `<p>${escapeHtml(copy)}</p>` : ""}
  </div>`;
}

function modelUrl(model) {
  return `/modeller/${model.id.toLowerCase()}/`;
}

function modelImageAttributes(model, sizes) {
  const responsive =
    model.id === "FK-007"
      ? ` srcset="/assets/models/fk-007-640.webp 640w, /assets/models/fk-007.webp 1000w" sizes="${sizes}"`
      : "";
  const width = model.id === "FK-007" ? 1000 : 640;
  const height = model.id === "FK-007" ? 1250 : 800;
  return { responsive, width, height };
}

function modelCard(model, eager = false) {
  const message = `Merhaba, ${model.id} kodlu modeli takımımıza özel hazırlatmak için teklif almak istiyorum.`;
  const detailUrl = modelUrl(model);
  const sportLabels = {
    futbol: "Futbol",
    basketbol: "Basketbol",
    voleybol: "Voleybol",
  };
  const sportCopy = {
    futbol: "Takım renkleri, logo, isim ve numara detaylarıyla sahaya hazırla.",
    basketbol: "Forma ve şort tasarımını takım kimliğine göre birlikte planla.",
    voleybol: "Renk, logo, isim ve numara uygulamalarıyla takımına uyarla.",
  };
  const sportLabel = sportLabels[model.sport] || model.category;
  const cardCopy = sportCopy[model.sport] || "Renk ve baskı detaylarını takımına göre kişiselleştir.";
  const badge = model.featured ? "Öne çıkan" : "Takıma özel";
  const image = modelImageAttributes(
    model,
    "(max-width: 35rem) calc(100vw - 2rem), (max-width: 52rem) 50vw, (max-width: 68rem) 33vw, 25vw",
  );
  return `<article class="model-card" data-model-card data-sport="${model.sport}" data-model-id="${model.id}" aria-labelledby="model-title-${model.id}">
    <div class="model-card__media">
      <a class="model-card__image-link" href="${detailUrl}" aria-label="${model.id} modelinin ayrıntılarını incele">
        <img src="${model.image}"${image.responsive} alt="${escapeHtml(model.alt)}" width="${image.width}" height="${image.height}" ${eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'}>
      </a>
      <div class="model-card__badges" aria-label="Model özellikleri">
        <span class="model-card__badge model-card__badge--signal">${badge}</span>
        <span class="model-card__badge">${escapeHtml(sportLabel)}</span>
      </div>
      <button class="favorite-button" type="button" data-favorite="${model.id}" aria-label="${model.id} modelini favorilere ekle" aria-pressed="false">
        <span aria-hidden="true">♡</span>
      </button>
    </div>
    <div class="model-card__body">
      <div class="model-card__heading">
        <div>
        <p>${escapeHtml(model.category)}</p>
          <h3 id="model-title-${model.id}"><a href="${detailUrl}">${model.id}</a></h3>
        </div>
        <span aria-hidden="true">FK</span>
      </div>
      <p class="model-card__summary">${escapeHtml(cardCopy)}</p>
      <ul class="model-card__features" aria-label="Kişiselleştirme seçenekleri">
        <li>Renk uyarlama</li>
        <li>Logo · isim · numara</li>
      </ul>
      <div class="model-card__actions">
        <a class="model-card__primary" href="${detailUrl}" aria-label="${model.id} modelinin ürün sayfasını aç">Ürünü incele <span aria-hidden="true">→</span></a>
        <a class="model-card__secondary" href="${whatsappUrl(message)}" target="_blank" rel="noopener noreferrer" aria-label="${model.id} modeli için WhatsApp üzerinden bilgi al">WhatsApp <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  </article>`;
}

function modelGrid(items, eagerFirst = false) {
  return `<div class="model-grid" data-model-grid>${items
    .map((model, index) => modelCard(model, eagerFirst && index === 0))
    .join("")}</div>`;
}

function faqBlock(items) {
  return `<div class="faq-list">
    ${items
      .map(
        ([question, answer], index) => `<details ${index === 0 ? "open" : ""}>
      <summary>${escapeHtml(question)}</summary>
      <div><p>${escapeHtml(answer)}</p></div>
    </details>`,
      )
      .join("")}
  </div>`;
}

function innerHero({ eyebrow, title, copy, cta = true, image }) {
  return `<section class="inner-hero">
    <div class="container inner-hero__grid">
      <div>
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="lead">${escapeHtml(copy)}</p>
        ${
          cta
            ? `<div class="button-row"><a class="button" href="/teklif/">Teklif Hazırla</a><a class="button button--ghost" href="/modeller/">Modelleri Gör</a></div>`
            : ""
        }
      </div>
      ${
        image
          ? `<div class="inner-hero__visual"><img src="${image.src}"${image.src === "/assets/models/fk-007.webp" ? ' srcset="/assets/models/fk-007-640.webp 640w, /assets/models/fk-007.webp 1000w" sizes="(max-width: 52rem) 92vw, 38vw"' : ""} alt="${escapeHtml(image.alt)}" width="${image.width}" height="${image.height}" loading="eager" fetchpriority="high"></div>`
          : `<div class="inner-hero__mark" aria-hidden="true"><span>FK</span><strong>Takımına özel</strong></div>`
      }
    </div>
  </section>`;
}

function finalCta(title = "Takımın için net bir teklif hazırlayalım.") {
  return `<section class="final-cta">
    <div class="container final-cta__inner">
      <div><p class="eyebrow">Bir sonraki adım</p><h2>${escapeHtml(title)}</h2><p>Model kodunu, forma adedini ve takım renklerini paylaşman yeterli.</p></div>
      <div class="button-row"><a class="button" href="/teklif/">Teklif Sihirbazını Aç</a><a class="button button--ghost" href="${whatsappUrl("Merhaba, takımımız için özel forma teklifi almak istiyorum.")}" target="_blank" rel="noopener noreferrer">WhatsApp’tan Yaz</a></div>
    </div>
  </section>`;
}

function writePage(routePath, options) {
  const relative = routePath === "/" ? "index.html" : `${routePath.replace(/^\/|\/$/g, "")}/index.html`;
  const filePath = path.join(root, relative);

  if (curatedRoutes.has(routePath)) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Curated page is missing and will not be generated: ${relative}`);
    }
    routes.push(routePath);
    return;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const output = pageShell({ ...options, path: routePath }).replace(/[ \t]+$/gm, "");
  fs.writeFileSync(filePath, output, "utf8");
  routes.push(routePath);
}

const homeFaq = [
  [
    "Minimum kaç adet sipariş verebilirim?",
    "Üretim en az 5 adet forma ile başlar. Ürün kapsamı ve beden dağılımı teklif sırasında netleştirilir.",
  ],
  [
    "Modelin renkleri değiştirilebilir mi?",
    "Evet. Seçilen model takım renklerine göre düzenlenebilir; logo, sponsor, isim ve numara detayları tasarım aşamasında eklenebilir.",
  ],
  [
    "Tasarımı üretimden önce görebilir miyim?",
    "Evet. Tasarım onayı alınmadan üretime geçilmez. Revizyon ihtiyacı tasarım aşamasında konuşulur.",
  ],
  [
    "Teslimat süresi nedir?",
    "Süre sipariş adedi, ürün kapsamı ve üretim yoğunluğuna göre değişir. Güncel tarih teklif aşamasında açıkça paylaşılır.",
  ],
  [
    "Çocuk ve yetişkin bedenleri birlikte hazırlanabilir mi?",
    "Beden dağılımı takım listesiyle planlanır. Uygun beden seçenekleri sipariş öncesinde teyit edilir.",
  ],
];

const featuredModels = models.filter((model) => model.featured).slice(0, 6);

writePage("/", {
  title: "Forma Kutusu | Takımına Özel Forma Tasarımı ve Üretimi",
  description:
    "Futbol, basketbol ve voleybol takımları için özel forma tasarımı ve süblimasyon üretimi. Model seçin, detayları paylaşın, teklifinizi hazırlayın.",
  pageClass: "home-page",
  preloadImage: "/assets/models/fk-007.webp",
  schemas: [organizationSchema(), faqSchema(homeFaq)],
  body: `
    <section class="hero">
      <div class="container hero__grid">
        <div class="hero__content">
          <p class="eyebrow">Takımına özel forma üretimi</p>
          <h1>Formanı seç.<br><span>Takım kimliğine dönüştürelim.</span></h1>
          <p class="lead">Futbol, basketbol ve voleybol takımları için model seçimi, tasarım desteği ve süblimasyon üretimini tek, anlaşılır süreçte buluşturuyoruz.</p>
          <div class="button-row">
            <a class="button" href="/modeller/">Forma Modellerini İncele</a>
            <a class="button button--ghost" href="/teklif/">60 Saniyede Teklif Hazırla</a>
          </div>
          <ul class="hero__proof" aria-label="Hizmet özellikleri">
            <li><strong>5+</strong><span>adet üretim</span></li>
            <li><strong>Ücretsiz</strong><span>tasarım desteği</span></li>
            <li><strong>Onaylı</strong><span>üretim başlangıcı</span></li>
          </ul>
        </div>
        <div class="hero__visual">
          <div class="hero__image-frame">
            <img src="/assets/models/fk-007.webp" srcset="/assets/models/fk-007-640.webp 640w, /assets/models/fk-007.webp 1000w" sizes="(max-width: 52rem) 92vw, 38vw" alt="FK-007 mor, sarı ve turuncu özel forma ve şort modeli" width="1000" height="1250" loading="eager" fetchpriority="high">
            <span class="hero__model-code">FK-007</span>
          </div>
          <div class="hero__note"><span>01</span><p>Modeli seç</p><strong>Renklerini ve takım detaylarını birlikte uyarlayalım.</strong></div>
        </div>
      </div>
    </section>

    <section class="choice-section">
      <div class="container">
        ${sectionIntro("Takım türünü seç", "Nereden başlayacağını sen belirle.", "Halı saha ekibinden okul takımına kadar teklif akışını kullanım amacına göre sadeleştirdik.")}
        <div class="choice-grid">
          <a href="/hali-saha-formasi/"><span>01</span><h3>Halı saha takımı</h3><p>Model, renk, isim ve numara planını hızlıca oluştur.</p><strong>İncele ↗</strong></a>
          <a href="/okul-turnuva-formasi/"><span>02</span><h3>Okul ve turnuva</h3><p>Farklı bedenleri ve takım listesini tek dosyada hazırla.</p><strong>İncele ↗</strong></a>
          <a href="/takima-ozel-forma/"><span>03</span><h3>Spor kulübü</h3><p>Takım kimliğine uygun tasarım ve üretim kapsamını netleştir.</p><strong>İncele ↗</strong></a>
          <a href="/forma-sort-takimi/"><span>04</span><h3>Forma + şort</h3><p>Forma ve şort detaylarını aynı teklif içinde planla.</p><strong>İncele ↗</strong></a>
        </div>
      </div>
    </section>

    <section class="models-section">
      <div class="container">
        ${sectionIntro("Öne çıkan modeller", "Bir model kodu seç. Gerisini birlikte netleştirelim.", "Kartları favorilerine ekleyebilir, seçtiklerini tek WhatsApp mesajında paylaşabilirsin.")}
        ${modelGrid(featuredModels, false)}
        <div class="section-action"><a class="text-link" href="/modeller/">Tüm forma modellerini gör <span aria-hidden="true">→</span></a></div>
      </div>
    </section>

    <section class="process-section">
      <div class="container">
        ${sectionIntro("Şeffaf sipariş süreci", "Fikirden sahaya dört net adım.", "Teslim tarihi ve kapsam, varsayımla değil teklif sırasında verilen gerçek bilgilerle belirlenir.")}
        <ol class="process-grid">
          <li><span>01</span><h3>Modeli belirle</h3><p>Katalogdan model kodunu seç veya aradığın tasarım yönünü anlat.</p></li>
          <li><span>02</span><h3>Takım detaylarını gönder</h3><p>Renk, logo, sponsor, isim-numara ve beden listesini paylaş.</p></li>
          <li><span>03</span><h3>Tasarımı onayla</h3><p>Hazırlanan görseli kontrol et; onayından önce üretime başlanmaz.</p></li>
          <li><span>04</span><h3>Üretim ve gönderim</h3><p>Onaylanan kapsam üretime alınır; güncel gönderim bilgisi paylaşılır.</p></li>
        </ol>
      </div>
    </section>

    <section class="production-section">
      <div class="container">
        ${sectionIntro("Gerçek üretimler", "Ekrandaki tasarımın sahadaki karşılığı.", "Yalnızca hâlihazırda yayınlanmış üretim görsellerini kullanıyoruz; müşteri adı veya özel sipariş verisi göstermiyoruz.")}
        <div class="production-grid">
          ${[
            ["ref-1.webp", "Forma Kutusu tarafından üretilen yeşil takım formalarını giyen futbol takımı"],
            ["ref-4.webp", "Kırmızı takım formalarıyla gerçek üretim örneği"],
            ["ref-9.webp", "Siyah forma ve şort üretiminden gerçek ürünler"],
            ["ref-15.webp", "Tamamlanan siyah ve mavi takım formaları"],
            ["ref-22.webp", "Tamamlanan beyaz takım forması ve şortu"],
            ["ref-24.webp", "Tamamlanan özel desenli takım formaları"],
          ]
            .map(
              ([file, alt]) =>
                `<button class="production-card" type="button" data-gallery-item="/assets/references/${file}" data-gallery-alt="${escapeHtml(alt)}"><img src="/assets/references/${file}" alt="${escapeHtml(alt)}" width="1000" height="700" loading="lazy"><span>Yakından gör</span></button>`,
            )
            .join("")}
        </div>
      </div>
    </section>

    <section class="faq-section">
      <div class="container faq-section__grid">
        ${sectionIntro("Sipariş öncesi", "Kısa sorulara net cevaplar.", "Burada olmayan bir ayrıntı için teklif sihirbazını kullanabilir veya WhatsApp’tan yazabilirsin.")}
        ${faqBlock(homeFaq)}
      </div>
    </section>
    ${finalCta()}

    <dialog class="gallery-dialog" data-gallery-dialog aria-label="Üretim görseli">
      <button type="button" class="dialog-close" data-dialog-close aria-label="Görseli kapat">×</button>
      <img src="/assets/references/ref-1.webp" alt="" width="1000" height="700" data-gallery-image>
      <p data-gallery-caption></p>
    </dialog>`,
});

const modelPageSchemas = [
  breadcrumbSchema([
    { name: "Ana Sayfa", path: "/" },
    { name: "Forma Modelleri", path: "/modeller/" },
  ]),
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Forma Kutusu Forma Modelleri",
    url: `${site.origin}/modeller/`,
    description:
      "Futbol, basketbol ve voleybol için filtrelenebilir özel forma modeli koleksiyonu.",
  },
];

writePage("/modeller/", {
  title: "Forma Modelleri | Futbol, Basketbol ve Voleybol",
  description:
    "Takıma özel futbol, basketbol ve voleybol forma modellerini kodla arayın, branşa göre filtreleyin ve favorilerinizi WhatsApp üzerinden paylaşın.",
  pageClass: "models-page",
  schemas: modelPageSchemas,
  body: `
    ${breadcrumbs([
      { name: "Ana Sayfa", path: "/" },
      { name: "Forma Modelleri", path: "/modeller/" },
    ])}
    ${innerHero({
      eyebrow: "Model kataloğu",
      title: "Takımına uygun modeli bul.",
      copy: "Model koduyla ara, branşa göre filtrele, favorilerini tek listede topla. Her model takım renklerine göre yeniden ele alınabilir.",
      image: { src: "/assets/models/fk-031.webp", alt: "FK-031 özel futbol forma modeli", width: 640, height: 800 },
    })}
    <section class="catalog-section">
      <div class="container">
        <div class="catalog-toolbar" data-catalog-toolbar>
          <label class="search-field">
            <span>Model kodu ara</span>
            <input type="search" placeholder="Örn. FK-007" autocomplete="off" data-model-search>
          </label>
          <div class="filter-group" role="group" aria-label="Branşa göre filtrele">
            <button type="button" class="filter-button is-active" data-model-filter="all" aria-pressed="true">Tümü</button>
            <button type="button" class="filter-button" data-model-filter="futbol" aria-pressed="false">Futbol</button>
            <button type="button" class="filter-button" data-model-filter="basketbol" aria-pressed="false">Basketbol</button>
            <button type="button" class="filter-button" data-model-filter="voleybol" aria-pressed="false">Voleybol</button>
            <button type="button" class="filter-button" data-model-filter="favorites" aria-pressed="false">Favoriler <span data-favorite-count>0</span></button>
          </div>
          <button type="button" class="button button--small" data-share-favorites disabled>Favorileri WhatsApp’tan Gönder</button>
        </div>
        <p class="catalog-result" role="status" aria-live="polite" data-model-result>${models.length} model gösteriliyor.</p>
        ${modelGrid(models)}
        <div class="empty-state" data-model-empty hidden>
          <h2>Eşleşen model bulunamadı.</h2>
          <p>Model kodunu kontrol et veya farklı bir branş filtresi seç.</p>
        </div>
      </div>
    </section>
    ${finalCta("Favorilerini seçtiysen teklifini birlikte tamamlayalım.")}`,
});

const categoryConfig = {
  futbol: {
    route: "/futbol/",
    title: "Futbol Forması Yaptırma ve Forma Modelleri",
    description:
      "Takımınıza özel futbol ve halı saha forması modellerini inceleyin. Renk, logo, sponsor, isim ve numara detaylarıyla teklif hazırlayın.",
    eyebrow: "Futbol formaları",
    heading: "Takımına özel futbol forma modelleri.",
    copy: "Halı saha ekipleri, okul takımları, turnuva kadroları ve kulüpler için modelden teklife uzanan sade bir akış.",
    image: { src: "/assets/models/fk-007.webp", alt: "FK-007 özel futbol forma ve şort modeli", width: 1000, height: 1250 },
    faq: [
      ["Futbol formalarına isim ve numara eklenebilir mi?", "İsim, numara, logo ve sponsor bilgileri tasarım aşamasında modele uygulanabilir."],
      ["Kaleci forması da hazırlanabilir mi?", "Kaleci ürünü ihtiyacını teklif notunda belirt; uygun model ve kapsam sipariş öncesinde netleştirilir."],
      ["Forma ve şort birlikte planlanabilir mi?", "Evet. Forma ve şort kapsamı adet ve beden dağılımıyla birlikte teklif edilir."],
    ],
  },
  basketbol: {
    route: "/basketbol/",
    title: "Basketbol Forması Yaptırma ve Takım Modelleri",
    description:
      "Takımınıza özel basketbol forma ve şort modellerini inceleyin. Renk, logo, isim ve numara detaylarıyla teklif hazırlayın.",
    eyebrow: "Basketbol formaları",
    heading: "Sahaya ve parkeye uygun takım görünümü.",
    copy: "Basketbol forma ve şort modellerini kodla seç; takım renklerini, logoyu ve oyuncu listesini teklif akışına ekle.",
    image: { src: "/assets/models/fk-b-004.webp", alt: "FK-B-004 özel basketbol forma ve şort modeli", width: 640, height: 800 },
    faq: [
      ["Basketbol forması ve şortu birlikte hazırlanır mı?", "Ürün kapsamı teklif sırasında birlikte planlanabilir; adet ve beden dağılımı ayrıca belirtilir."],
      ["Oyuncu isim ve numaraları nasıl iletilir?", "Takım listesi CSV veya Excel dosyasıyla hazırlanabilir; teklif sonrasında WhatsApp görüşmesine eklenir."],
      ["Çocuk ve yetişkin bedenleri aynı siparişte olabilir mi?", "Beden dağılımı sipariş öncesinde teyit edilerek takım listesine işlenir."],
    ],
  },
  voleybol: {
    route: "/voleybol/",
    title: "Voleybol Forması Yaptırma ve Takım Modelleri",
    description:
      "Takımınıza özel voleybol forma modellerini inceleyin. Renk, logo, isim, numara ve takım listesiyle teklif hazırlayın.",
    eyebrow: "Voleybol formaları",
    heading: "Takım bütünlüğünü sahaya taşıyan modeller.",
    copy: "Okul, turnuva ve kulüp takımları için voleybol modellerini incele; beden dağılımını ve oyuncu bilgilerini düzenli biçimde paylaş.",
    image: { src: "/assets/models/fk-v-002.webp", alt: "FK-V-002 özel voleybol forma modeli", width: 640, height: 800 },
    faq: [
      ["Voleybol modellerinin renkleri değiştirilebilir mi?", "Seçilen model takım renkleri ve kimlik öğelerine göre tasarım aşamasında düzenlenebilir."],
      ["Takım listesini dosya olarak gönderebilir miyim?", "Evet. Oyuncu adı, numarası ve bedeni için hazırlanan şablonu kullanabilirsin."],
      ["Üretimden önce tasarım onayı alınır mı?", "Onaylanan tasarım olmadan üretime başlanmaz."],
    ],
  },
};

for (const [sport, config] of Object.entries(categoryConfig)) {
  const categoryModels = models.filter((model) => model.sport === sport);
  writePage(config.route, {
    title: config.title,
    description: config.description,
    pageClass: "category-page",
    preloadImage: config.image.src,
    schemas: [
      breadcrumbSchema([
        { name: "Ana Sayfa", path: "/" },
        { name: config.eyebrow, path: config.route },
      ]),
      faqSchema(config.faq),
    ],
    body: `
      ${breadcrumbs([
        { name: "Ana Sayfa", path: "/" },
        { name: config.eyebrow, path: config.route },
      ])}
      ${innerHero({
        eyebrow: config.eyebrow,
        title: config.heading,
        copy: config.copy,
        image: config.image,
      })}
      <section class="models-section">
        <div class="container">
          ${sectionIntro("Model seçimi", `${categoryModels.length} erişilebilir model`, "Model kodunu teklif formuna ekleyebilir veya doğrudan WhatsApp üzerinden paylaşabilirsin.")}
          ${modelGrid(categoryModels)}
        </div>
      </section>
      <section class="content-band">
        <div class="container content-band__grid">
          <div><p class="eyebrow">Kişiselleştirme</p><h2>Takım detaylarını tek yerde topla.</h2></div>
          <ul class="check-list"><li>Takım renkleri</li><li>Logo ve sponsor</li><li>Oyuncu isimleri ve numaraları</li><li>Beden dağılımı</li><li>Forma ve şort kapsamı</li><li>Kaleci ürünü ihtiyacı</li></ul>
        </div>
      </section>
      <section class="faq-section"><div class="container faq-section__grid">${sectionIntro("Sık sorulanlar", `${config.eyebrow} hakkında`, "Teklif öncesinde en çok ihtiyaç duyulan bilgiler.")}${faqBlock(config.faq)}</div></section>
      ${finalCta()}`,
  });
}

const productDetailConfig = {
  futbol: {
    label: "Futbol",
    singular: "Futbol Forması",
    categoryRoute: "/futbol/",
    intro:
      "Halı saha, okul, turnuva ve kulüp takımları için renk, logo, sponsor, isim ve numara ayrıntılarıyla kişiselleştirilebilir.",
    scope: "Forma veya forma + şort",
  },
  basketbol: {
    label: "Basketbol",
    singular: "Basketbol Forma Modeli",
    categoryRoute: "/basketbol/",
    intro:
      "Basketbol takımları için forma ve şort görünümü; takım renkleri, logo, isim ve numara ayrıntılarıyla planlanabilir.",
    scope: "Forma + şort",
  },
  voleybol: {
    label: "Voleybol",
    singular: "Voleybol Forma Modeli",
    categoryRoute: "/voleybol/",
    intro:
      "Okul, turnuva ve kulüp takımları için renk, logo, isim, numara ve beden dağılımına göre kişiselleştirilebilir.",
    scope: "Takım ihtiyacına göre",
  },
};

for (const model of models) {
  const config = productDetailConfig[model.sport];
  const route = modelUrl(model);
  const quoteUrl = `/teklif/?model=${encodeURIComponent(model.id)}`;
  const message = `Merhaba, ${model.id} kodlu ${config.label.toLocaleLowerCase("tr-TR")} forma modelini takımımıza özel hazırlatmak için bilgi ve teklif almak istiyorum.`;
  const image = modelImageAttributes(
    model,
    "(max-width: 68rem) calc(100vw - 2rem), 48vw",
  );
  const related = models
    .filter((candidate) => candidate.sport === model.sport && candidate.id !== model.id)
    .slice(0, 3);
  const description = `${model.id} ${config.singular.toLocaleLowerCase("tr-TR")} büyük görselini ve kişiselleştirme bilgilerini inceleyin; takımınıza özel teklif hazırlayın.`;

  writePage(route, {
    title: `${model.id} ${config.singular}`,
    description,
    pageClass: "product-page",
    preloadImage: model.image,
    schemas: [
      breadcrumbSchema([
        { name: "Ana Sayfa", path: "/" },
        { name: "Forma Modelleri", path: "/modeller/" },
        { name: model.id, path: route },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: model.name,
        sku: model.id,
        category: model.category,
        image: `${site.origin}${model.image}`,
        description,
        url: `${site.origin}${route}`,
        brand: { "@type": "Brand", name: site.name },
        additionalProperty: [
          { "@type": "PropertyValue", name: "Minimum sipariş", value: "5 adet" },
          {
            "@type": "PropertyValue",
            name: "Kişiselleştirme",
            value: "Renk, logo, sponsor, isim ve numara",
          },
        ],
      },
    ],
    body: `
      ${breadcrumbs([
        { name: "Ana Sayfa", path: "/" },
        { name: "Forma Modelleri", path: "/modeller/" },
        { name: model.id, path: route },
      ])}
      <section class="product-detail">
        <div class="container product-detail__grid">
          <div class="product-detail__gallery" data-product-gallery data-product-mode="full">
            <div class="product-detail__thumbs" role="group" aria-label="Ürün görseli görünümü">
              <button class="is-active" type="button" data-product-view="full" aria-pressed="true" aria-label="${model.id} tam ürün görünümünü göster">
                <span class="product-detail__thumb-frame"><img src="${model.image}" alt="" width="${image.width}" height="${image.height}" loading="lazy"></span>
                <span>Tam</span>
              </button>
              <button type="button" data-product-view="detail" aria-pressed="false" aria-label="${model.id} ürün detayını yakın göster">
                <span class="product-detail__thumb-frame product-detail__thumb-frame--detail"><img src="${model.image}" alt="" width="${image.width}" height="${image.height}" loading="lazy"></span>
                <span>Detay</span>
              </button>
            </div>
            <div class="product-detail__visual">
              <a href="${model.image}" target="_blank" rel="noopener" aria-label="${model.id} ürün görselini tam boy aç">
                <img src="${model.image}"${image.responsive} alt="${escapeHtml(model.alt)}" width="${image.width}" height="${image.height}" loading="eager" fetchpriority="high" data-product-image>
                <span>Görseli tam boy aç ↗</span>
              </a>
              <div class="product-detail__badges" aria-label="Ürün özellikleri">
                <span>${model.featured ? "Öne çıkan" : "Takıma özel"}</span>
                <span>${escapeHtml(config.label)}</span>
              </div>
              <button class="favorite-button" type="button" data-favorite="${model.id}" aria-label="${model.id} modelini favorilere ekle" aria-pressed="false"><span aria-hidden="true">♡</span></button>
            </div>
          </div>
          <div class="product-detail__info">
            <p class="eyebrow">${escapeHtml(model.category)} · ${model.id}</p>
            <h1>${model.id} ${escapeHtml(config.singular)}</h1>
            <p class="lead">${escapeHtml(config.intro)}</p>
            <div class="product-detail__pricing"><span>Fiyatlandırma</span><strong>Takıma özel teklif</strong><small>Adet, ürün kapsamı ve kişiselleştirme ayrıntılarına göre hazırlanır.</small></div>
            <dl class="product-detail__facts">
              <div><dt>Model kodu</dt><dd>${model.id}</dd></div>
              <div><dt>Branş</dt><dd>${escapeHtml(config.label)}</dd></div>
              <div><dt>Minimum sipariş</dt><dd>5 adet</dd></div>
              <div><dt>Ürün kapsamı</dt><dd>${escapeHtml(config.scope)}</dd></div>
            </dl>
            <div class="product-detail__actions">
              <a class="button product-detail__whatsapp" href="${whatsappUrl(message)}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">◉</span> WhatsApp’tan Teklif Al</a>
              <a class="button button--ghost" href="${quoteUrl}">Teklif Formunu Doldur</a>
            </div>
            <p class="product-detail__note">Fiyat ve teslim tarihi; ürün kapsamı, adet, beden dağılımı ve güncel üretim planına göre teklif sırasında paylaşılır.</p>
            <div class="product-detail__accordions">
              <details open><summary>Model ve ürün bilgileri</summary><div><ul><li>Model kodu: ${model.id}</li><li>Branş: ${escapeHtml(config.label)}</li><li>Ürün kapsamı: ${escapeHtml(config.scope)}</li><li>Minimum üretim: 5 adet</li></ul></div></details>
              <details><summary>Kişiselleştirme seçenekleri</summary><div><ul><li>Takım renkleri</li><li>Logo ve sponsor</li><li>Oyuncu ismi ve forma numarası</li><li>Beden dağılımı</li></ul></div></details>
              <details><summary>Üretim ve teslimat süreci</summary><div><p>Hazırlanan tasarım onaylandıktan sonra üretim planı oluşturulur. Güncel üretim, teslim ve gönderim bilgileri teklif görüşmesinde teyit edilir.</p></div></details>
              <details><summary>Beden ve bakım bilgisi</summary><div><p>Çocuk ve yetişkin beden seçenekleri ile kullanılacak ürüne uygun bakım talimatları sipariş öncesinde doğrulanır.</p></div></details>
              <details><summary>Ürün açıklaması</summary><div><p>${escapeHtml(config.intro)} Görseldeki model takım renklerine ve kimlik öğelerine göre yeniden ele alınabilir.</p></div></details>
            </div>
            <div class="product-detail__trust" aria-label="Sipariş avantajları"><span>5+ minimum üretim</span><span>Ücretsiz tasarım desteği</span><span>Tasarım onayı</span></div>
          </div>
        </div>
      </section>
      <section class="product-information">
        <div class="container">
          ${sectionIntro("Ürün bilgileri", "Modeli takımına göre tamamla.", "Görseldeki tasarım başlangıç noktasıdır; uygulama ayrıntıları teklif ve tasarım onayı sırasında netleşir.")}
          <div class="product-information__grid">
            <article><span>01</span><h2>Renk uyarlama</h2><p>Model, takımının ana ve yardımcı renklerine göre yeniden düzenlenebilir.</p></article>
            <article><span>02</span><h2>Takım kimliği</h2><p>Arma, sponsor, oyuncu ismi ve forma numarası tasarıma eklenebilir.</p></article>
            <article><span>03</span><h2>Beden planı</h2><p>Oyuncu listesi ve beden dağılımı üretim onayından önce birlikte kontrol edilir.</p></article>
            <article><span>04</span><h2>Tasarım onayı</h2><p>Hazırlanan takım görünümü onaylanmadan üretime başlanmaz.</p></article>
          </div>
        </div>
      </section>
      <section class="product-order">
        <div class="container product-order__grid">
          <div><p class="eyebrow">Nasıl sipariş verilir?</p><h2>Dört kısa adımda ilerle.</h2><p>Model kodu hazır olduğu için teklif görüşmesi daha hızlı ve anlaşılır ilerler.</p></div>
          <ol>
            <li><span>1</span><div><strong>Modeli seç</strong><p>${model.id} kodunu teklif formuna ekle.</p></div></li>
            <li><span>2</span><div><strong>Takım detaylarını paylaş</strong><p>Renk, logo, sponsor, isim, numara ve beden bilgilerini hazırla.</p></div></li>
            <li><span>3</span><div><strong>Tasarımı kontrol et</strong><p>Takımına özel hazırlanan görseli üretim öncesinde incele.</p></div></li>
            <li><span>4</span><div><strong>Onayla ve planla</strong><p>Güncel fiyat ve teslim bilgisiyle sipariş kapsamını netleştir.</p></div></li>
          </ol>
        </div>
      </section>
      <section class="product-faq">
        <div class="container product-faq__grid">
          ${sectionIntro("Sık sorulanlar", `${model.id} hakkında merak edilenler.`, "Ürüne ve güncel üretim planına göre değişebilecek bilgiler teklif görüşmesinde doğrulanır.")}
          <div class="faq-list">
            <details open><summary>Bu modelin renkleri değiştirilebilir mi?</summary><div><p>Evet. Model takımının ana ve yardımcı renklerine göre tasarım aşamasında yeniden düzenlenebilir.</p></div></details>
            <details><summary>İsim, numara, logo ve sponsor eklenebilir mi?</summary><div><p>Evet. Oyuncu ismi, forma numarası, takım arması ve sponsor görselleri tasarım onayına eklenebilir.</p></div></details>
            <details><summary>Fiyat neden sabit görünmüyor?</summary><div><p>Fiyat; ürün kapsamı, adet, beden dağılımı ve kişiselleştirme ayrıntılarına göre değişebileceği için güncel teklif üzerinden paylaşılır.</p></div></details>
          </div>
        </div>
      </section>
      <section class="product-related">
        <div class="container">
          ${sectionIntro("Daha fazla model", `Diğer ${config.label.toLocaleLowerCase("tr-TR")} modellerini incele.`, "Aynı branştaki farklı çizgileri karşılaştır ve takımına en uygun başlangıç modelini seç.")}
          ${modelGrid(related)}
          <div class="section-action"><a class="button button--ghost" href="${config.categoryRoute}">Tüm ${escapeHtml(config.label)} Modelleri</a></div>
        </div>
      </section>`,
  });
}

const servicePages = [
  {
    route: "/hali-saha-formasi/",
    title: "Halı Saha Forması Yaptırma",
    description: "Takımınıza özel halı saha forması yaptırın. Model, renk, logo, isim, numara, şort ve beden listesini tek teklif akışında planlayın.",
    eyebrow: "Halı saha takımları",
    heading: "Maç saati belli. Forman da net olsun.",
    copy: "Model kodunu seç, takım renklerini belirle, oyuncu listesini hazırla. Teklif için gerçekten gereken bilgileri tek akışta topla.",
    image: { src: "/assets/models/fk-027.webp", alt: "FK-027 lacivert ve bordo halı saha forma modeli", width: 640, height: 800 },
    cards: [
      ["Model ve renk", "Hazır model üzerinden takım renkleri ve tasarım yönü belirlenir."],
      ["İsim ve numara", "Oyuncu bilgileri düzenli takım listesiyle paylaşılır."],
      ["Logo ve sponsor", "Uygun dosyalar tasarım görüşmesine eklenir."],
      ["Forma ve şort", "Ürün kapsamı ve adetler teklif öncesinde netleştirilir."],
    ],
    faq: [
      ["Halı saha forması için minimum sipariş kaç adet?", "Üretim en az 5 adet ile başlar."],
      ["Kendi logomuzu kullanabilir miyiz?", "Logo dosyanı teklif görüşmesine ekleyebilirsin; kullanılabilirliği tasarım aşamasında kontrol edilir."],
      ["Forma listesi nasıl hazırlanmalı?", "Oyuncu adı, numarası ve beden sütunlarını içeren takım listesi şablonunu kullanabilirsin."],
    ],
    models: models.filter((model) => model.sport === "futbol").slice(0, 6),
  },
  {
    route: "/takima-ozel-forma/",
    title: "Takıma Özel Forma Yaptırma",
    description: "Takımınıza özel forma tasarımı için model, renk, logo, sponsor, isim, numara ve beden bilgilerini planlayın; teklifinizi hazırlayın.",
    eyebrow: "Takım kimliği",
    heading: "Hazır modeli, takımına ait bir kimliğe dönüştür.",
    copy: "Taklit bir görünüm yerine takım renklerini, armayı ve kullanım amacını merkeze alan kontrollü bir tasarım süreci.",
    image: { src: "/assets/models/fk-019.webp", alt: "FK-019 beyaz ve yeşil özel futbol forma modeli", width: 640, height: 800 },
    cards: [
      ["Takım renkleri", "Ana ve yardımcı renkleri görünür bir hiyerarşiyle belirle."],
      ["Arma ve sponsor", "Logo dosyalarını mümkün olan en temiz hâliyle paylaş."],
      ["İsim ve numara", "Okunabilirliği tasarımın parçası olarak ele al."],
      ["Onaylı üretim", "Son görseli kontrol etmeden üretime geçme."],
    ],
    faq: [
      ["Sıfırdan tasarım isteyebilir miyim?", "Model seçmeden de tasarım yönünü anlatabilirsin; kapsam teklif görüşmesinde değerlendirilir."],
      ["Renkleri tamamen değiştirebilir miyim?", "Modelin uygulanabilirliği korunarak takım renklerine göre düzenleme yapılabilir."],
      ["Tasarım revizesi yapılır mı?", "Gerekli düzenlemeler tasarım onayı aşamasında konuşulur."],
    ],
  },
  {
    route: "/forma-sort-takimi/",
    title: "Forma Şort Takımı Yaptırma",
    description: "Takımınıza özel forma ve şort takımını model, renk, logo, isim, numara, adet ve beden dağılımıyla birlikte planlayın.",
    eyebrow: "Forma + şort",
    heading: "Üst ve alt parçayı aynı takım diliyle planla.",
    copy: "Forma ve şort kapsamını en başta belirt; renk, numara uygulaması ve adet bilgisini tek teklif içinde netleştir.",
    image: { src: "/assets/models/fk-007.webp", alt: "FK-007 özel forma ve şort takımı", width: 1000, height: 1250 },
    cards: [
      ["Tek tasarım dili", "Forma ve şort renklerini birbiriyle uyumlu ele al."],
      ["Adet planı", "Forma ve şort adetlerini ayrı ayrı teyit et."],
      ["Şort numarası", "Gerekiyorsa şort numarası uygulamasını teklif notuna ekle."],
      ["Beden dağılımı", "Takım listesini siparişten önce son kez kontrol et."],
    ],
    faq: [
      ["Forma ve şort birlikte sipariş edilebilir mi?", "Evet. Kapsamı teklif formunda forma ve şort olarak seçebilirsin."],
      ["Şorta numara eklenebilir mi?", "İhtiyacı teklif notunda belirt; uygulama tasarım görüşmesinde netleştirilir."],
      ["Fiyat neden sitede sabit değil?", "Fiyat; ürün kapsamı, adet ve üretim ayrıntılarına göre değişebileceği için güncel teklif üzerinden paylaşılır."],
    ],
  },
  {
    route: "/okul-turnuva-formasi/",
    title: "Okul Takımı ve Turnuva Forması Yaptırma",
    description: "Okul takımı, şirket turnuvası ve organizasyonlar için forma yaptırma sürecini takım listesi, farklı bedenler ve teslim planıyla yönetin.",
    eyebrow: "Okul ve turnuva",
    heading: "Kalabalık kadroları düzenli bir siparişe dönüştür.",
    copy: "Öğrenci, çalışan veya turnuva kadrolarında farklı bedenleri, isimleri ve numaraları tek listede toplayarak hata riskini azalt.",
    image: { src: "/assets/models/fk-001.webp", alt: "FK-001 okul ve turnuva takımları için özel forma modeli", width: 640, height: 800 },
    cards: [
      ["Tek takım listesi", "Oyuncu adı, numarası ve bedeni aynı dosyada tutulur."],
      ["Farklı bedenler", "Çocuk ve yetişkin beden ihtiyacı sipariş öncesinde teyit edilir."],
      ["Organizasyon tarihi", "Hedef tarih ilk görüşmede paylaşılır; uygunluk teklif aşamasında doğrulanır."],
      ["Tek sorumlu kişi", "Onay ve liste değişiklikleri tek takım yöneticisi üzerinden ilerler."],
    ],
    faq: [
      ["Turnuva tarihini nasıl bildirmeliyim?", "Teklif formundaki not alanına hedef tarihi ekle; güncel üretim uygunluğu ayrıca teyit edilir."],
      ["Takım listesini sonradan değiştirebilir miyim?", "Üretim onayından önce değişiklikleri tek listede güncellemek gerekir; üretim başladıktan sonraki durum ayrıca değerlendirilir."],
      ["CSV şablonu var mı?", "Evet. Beden planlama sayfasından takım listesi şablonunu indirebilirsin."],
    ],
  },
];

for (const service of servicePages) {
  const items = service.models || featuredModels.slice(0, 4);
  writePage(service.route, {
    title: service.title,
    description: service.description,
    pageClass: "service-page",
    preloadImage: service.image.src,
    schemas: [
      breadcrumbSchema([
        { name: "Ana Sayfa", path: "/" },
        { name: service.title, path: service.route },
      ]),
      faqSchema(service.faq),
    ],
    body: `
      ${breadcrumbs([
        { name: "Ana Sayfa", path: "/" },
        { name: service.title, path: service.route },
      ])}
      ${innerHero({ eyebrow: service.eyebrow, title: service.heading, copy: service.copy, image: service.image })}
      <section class="feature-section"><div class="container">
        ${sectionIntro("Planlama", "Tekliften önce netleştirilecekler.", "Eksik veya dağınık bilgi yerine kısa, kontrol edilebilir bir sipariş özeti oluştur.")}
        <div class="feature-grid">${service.cards.map(([title, copy], index) => `<article><span>0${index + 1}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p></article>`).join("")}</div>
      </div></section>
      <section class="models-section"><div class="container">
        ${sectionIntro("Başlangıç modelleri", "Önce modeli seçebilirsin.", "Beğendiğin kodu teklif formuna ekle; renk ve kişiselleştirme detayları sonraki adımda netleşir.")}
        ${modelGrid(items)}
      </div></section>
      <section class="download-band"><div class="container download-band__inner"><div><p class="eyebrow">Takım listesi</p><h2>İsim, numara ve bedenleri tek dosyada topla.</h2><p>Boş şablonu indir, kendi cihazında doldur ve WhatsApp görüşmesine ekle.</p></div><a class="button button--ghost" href="/assets/templates/takim-listesi.csv" download>CSV Şablonunu İndir</a></div></section>
      <section class="faq-section"><div class="container faq-section__grid">${sectionIntro("Sık sorulanlar", service.title, "Sipariş öncesinde en çok ihtiyaç duyulan bilgiler.")}${faqBlock(service.faq)}</div></section>
      ${finalCta()}`,
  });
}

writePage("/nasil-siparis-verilir/", {
  title: "Forma Siparişi Nasıl Verilir?",
  description: "Takıma özel forma siparişini model seçiminden takım listesine, tasarım onayından üretime kadar adım adım planlayın.",
  pageClass: "process-page",
  schemas: [
    breadcrumbSchema([
      { name: "Ana Sayfa", path: "/" },
      { name: "Nasıl Sipariş Verilir?", path: "/nasil-siparis-verilir/" },
    ]),
  ],
  body: `
    ${breadcrumbs([{ name: "Ana Sayfa", path: "/" }, { name: "Nasıl Sipariş Verilir?", path: "/nasil-siparis-verilir/" }])}
    ${innerHero({ eyebrow: "Sipariş rehberi", title: "Karmaşık değil. Sırayla ilerle.", copy: "Model, takım bilgisi, tasarım onayı ve üretim adımlarını tek kontrol listesinde takip et.", image: { src: "/assets/models/fk-009.webp", alt: "FK-009 özel futbol forma modeli", width: 640, height: 800 } })}
    <section class="timeline-section"><div class="container">
      <ol class="timeline">
        <li><span>01</span><div><h2>Branşı ve modeli seç</h2><p>Futbol, basketbol veya voleybol kataloğundan beğendiğin model kodunu not al. Hazır model seçmek zorunlu değil; tasarım yönünü de anlatabilirsin.</p></div></li>
        <li><span>02</span><div><h2>Ürün kapsamını belirle</h2><p>Yalnızca forma mı, forma ve şort mu istediğini; varsa kaleci ürünü ve ek ihtiyaçları belirt.</p></div></li>
        <li><span>03</span><div><h2>Takım listesini hazırla</h2><p>Oyuncu adı, numarası ve bedeni için tek, güncel bir liste kullan. Değişiklikleri farklı mesajlara bölme.</p></div></li>
        <li><span>04</span><div><h2>Logo ve renkleri paylaş</h2><p>Logo, sponsor ve örnek görselleri mümkün olan en temiz dosyalarla ilet. Mobil kameradan çekilmiş dosya da ön değerlendirme için seçilebilir.</p></div></li>
        <li><span>05</span><div><h2>Tasarımı kontrol et ve onayla</h2><p>İsim, numara, logo, renk ve beden listesini son kez karşılaştır. Tasarım onayından sonra üretim planı netleşir.</p></div></li>
      </ol>
    </div></section>
    <section class="download-band"><div class="container download-band__inner"><div><p class="eyebrow">Hazırlık aracı</p><h2>Takım listesi şablonunu kullan.</h2><p>Dosya yalnızca cihazına indirilir; doldurduktan sonra WhatsApp görüşmesine kendin eklersin.</p></div><a class="button" href="/assets/templates/takim-listesi.csv" download>Şablonu İndir</a></div></section>
    ${finalCta("Hazırlık listen tamamsa teklifini oluşturalım.")}`,
});

writePage("/beden-tablosu/", {
  title: "Forma Beden Planlama ve Takım Listesi",
  description: "Takım forması siparişinde beden dağılımını planlayın, oyuncu adı ve numaralarını düzenleyin, ücretsiz CSV takım listesi şablonunu indirin.",
  pageClass: "content-page",
  schemas: [
    breadcrumbSchema([
      { name: "Ana Sayfa", path: "/" },
      { name: "Beden Planlama", path: "/beden-tablosu/" },
    ]),
  ],
  body: `
    ${breadcrumbs([{ name: "Ana Sayfa", path: "/" }, { name: "Beden Planlama", path: "/beden-tablosu/" }])}
    ${innerHero({ eyebrow: "Beden ve kadro", title: "Doğru liste, daha az sipariş hatası.", copy: "Doğrulanmamış ölçü tablosu yayınlamak yerine, güncel ürün kalıbını sipariş öncesinde teyit ediyor ve takım listesini düzenli biçimde topluyoruz.", cta: false })}
    <section class="content-section"><div class="container content-columns">
      <article><h2>Bedenleri nasıl planlamalısın?</h2><ol><li>Her oyuncunun kullandığı benzer bir spor ürününü referans al.</li><li>Çocuk ve yetişkin beden ihtiyacını ayrı belirt.</li><li>Kaleci ürününü ve farklı kalıp ihtiyacını not düş.</li><li>Üretim onayından önce son listeyi tek dosyada paylaş.</li></ol></article>
      <aside class="info-card"><p class="eyebrow">Önemli not</p><h2>Ölçüler ürüne göre teyit edilir.</h2><p>Bu sayfada santimetre tablosu vermiyoruz; mevcut arşivde doğrulanmış kalıp ölçüleri bulunmuyor. Güncel ölçü bilgisini teklif görüşmesinde istemelisin.</p></aside>
    </div></section>
    <section class="download-band"><div class="container download-band__inner"><div><p class="eyebrow">Ücretsiz şablon</p><h2>Takım listesini CSV olarak indir.</h2><p>Oyuncu adı, forma numarası, beden, kaleci bilgisi ve not sütunları hazır.</p></div><a class="button" href="/assets/templates/takim-listesi.csv" download>CSV Şablonunu İndir</a></div></section>
    ${finalCta()}`,
});

const productionFaq = [
  ["Süblimasyon baskı nedir?", "Tasarımın üretim sürecinde kumaşa uygulanmasına dayanan bir baskı yöntemidir. Kullanılacak kumaş ve teknik kapsam siparişe göre teyit edilir."],
  ["Kumaş türünü nasıl seçerim?", "Takımın branşı, kullanım amacı ve ürün kapsamı görüşmede paylaşılır; uygun seçenekler güncel üretim bilgisine göre önerilir."],
  ["Numara ve isim sonradan eklenir mi?", "Uygulama yöntemi tasarım ve üretim kapsamının parçası olarak sipariş öncesinde netleştirilir."],
];

writePage("/kumas-ve-uretim/", {
  title: "Süblimasyon Forma, Kumaş ve Üretim Süreci",
  description: "Süblimasyon forma üretiminde kumaş, baskı, tasarım onayı ve kalite kontrol adımlarını öğrenin. Güncel üretim bilgilerini teklif sırasında teyit edin.",
  pageClass: "content-page",
  schemas: [
    breadcrumbSchema([
      { name: "Ana Sayfa", path: "/" },
      { name: "Kumaş ve Üretim", path: "/kumas-ve-uretim/" },
    ]),
    faqSchema(productionFaq),
  ],
  body: `
    ${breadcrumbs([{ name: "Ana Sayfa", path: "/" }, { name: "Kumaş ve Üretim", path: "/kumas-ve-uretim/" }])}
    ${innerHero({ eyebrow: "Üretim bilgisi", title: "Görünüm kadar süreç de önemli.", copy: "Kumaş, baskı ve dikim kararlarını doğrulanmış güncel üretim bilgisiyle ele al. Teknik ayrıntıları teklif görüşmesinde açıkça sor.", image: { src: "/assets/references/ref-9.webp", alt: "Siyah forma ve şort üretiminden gerçek ürünler", width: 1000, height: 700 } })}
    <section class="feature-section"><div class="container">
      ${sectionIntro("Kontrol noktaları", "Üretime geçmeden önce dört doğrulama.", "Havalı teknik terimler yerine siparişini doğrudan etkileyen sorulara odaklan.")}
      <div class="feature-grid"><article><span>01</span><h3>Kullanım amacı</h3><p>Branş, maç veya antrenman kullanımı ve oyuncu profili.</p></article><article><span>02</span><h3>Kumaş seçimi</h3><p>Mevcut seçenekler ve uygunluk güncel üretim bilgisiyle teyit edilir.</p></article><article><span>03</span><h3>Tasarım onayı</h3><p>Renk, logo, isim ve numara üretimden önce kontrol edilir.</p></article><article><span>04</span><h3>Son liste</h3><p>Adet, beden ve oyuncu bilgileri tek dosyada kesinleştirilir.</p></article></div>
    </div></section>
    <section class="faq-section"><div class="container faq-section__grid">${sectionIntro("Teknik sorular", "Kumaş ve üretim hakkında", "Doğrulanamayan marka, sertifika veya garanti ifadeleri kullanmıyoruz.")}${faqBlock(productionFaq)}</div></section>
    ${finalCta()}`,
});

const allFaq = [
  ...homeFaq,
  ["Logo için hangi dosya türünü göndermeliyim?", "PNG, JPG veya PDF dosyası ön değerlendirme için seçilebilir. Baskıya uygunluk tasarım görüşmesinde kontrol edilir."],
  ["Takım listesini Excel veya CSV olarak gönderebilir miyim?", "Evet. Teklif sayfası dosyanın adını hazırlar; WhatsApp açıldıktan sonra dosyayı görüşmeye kendin eklemelisin."],
  ["Sitede yüklediğim dosyalar sunucuya gider mi?", "Hayır. Bu statik sitede dosyalar sunucuya yüklenmez; yalnızca cihazında kontrol edilir ve WhatsApp görüşmesine eklemen için hatırlatılır."],
  ["Fiyatı ne belirler?", "Ürün kapsamı, adet, beden dağılımı ve üretim ayrıntıları fiyatı etkileyebilir. Güncel teklif doğrudan paylaşılır."],
];

writePage("/sik-sorulan-sorular/", {
  title: "Forma Yaptırma Sık Sorulan Sorular",
  description: "Minimum sipariş, tasarım onayı, isim ve numara, takım listesi, dosya türleri, teslim planı ve forma fiyatları hakkında net yanıtlar.",
  pageClass: "faq-page",
  schemas: [
    breadcrumbSchema([
      { name: "Ana Sayfa", path: "/" },
      { name: "Sık Sorulan Sorular", path: "/sik-sorulan-sorular/" },
    ]),
    faqSchema(allFaq),
  ],
  body: `
    ${breadcrumbs([{ name: "Ana Sayfa", path: "/" }, { name: "Sık Sorulan Sorular", path: "/sik-sorulan-sorular/" }])}
    ${innerHero({ eyebrow: "Sık sorulanlar", title: "Sipariş öncesinde bilmen gerekenler.", copy: "Minimum adet, tasarım, dosya, beden ve teslim planıyla ilgili yanıtları tek yerde topladık.", cta: false })}
    <section class="faq-section"><div class="container faq-section__grid">${sectionIntro("Yanıtlar", "Kısa ve doğrulanabilir bilgi.", "Güncel üretim, fiyat veya termin gerektiren konular teklif görüşmesinde teyit edilir.")}${faqBlock(allFaq)}</div></section>
    ${finalCta()}`,
});

writePage("/teklif/", {
  title: "Forma Teklifi Al",
  description: "Branş, model, adet, takım rengi ve dosya bilgilerini kısa adımlarla hazırlayın; teklif özetinizi WhatsApp üzerinden gönderin.",
  pageClass: "quote-page",
  schemas: [
    breadcrumbSchema([
      { name: "Ana Sayfa", path: "/" },
      { name: "Teklif Al", path: "/teklif/" },
    ]),
  ],
  body: `
    ${breadcrumbs([{ name: "Ana Sayfa", path: "/" }, { name: "Teklif Al", path: "/teklif/" }])}
    <section class="quote-hero"><div class="container"><p class="eyebrow">Hızlı teklif sihirbazı</p><h1>İhtiyacını 3 kısa adımda özetle.</h1><p class="lead">Bilgiler bu sayfada sunucuya gönderilmez. Son adımda hazırlanan metinle WhatsApp açılır; seçtiğin dosyaları görüşmeye kendin eklersin.</p></div></section>
    <section class="quote-section"><div class="container quote-layout">
      <form class="quote-form" data-quote-form novalidate>
        <ol class="progress-steps" aria-label="Teklif adımları">
          <li class="is-active" data-progress-step="1" aria-current="step"><span>1</span><strong>Takım</strong></li>
          <li data-progress-step="2"><span>2</span><strong>Ürün</strong></li>
          <li data-progress-step="3"><span>3</span><strong>Dosyalar</strong></li>
        </ol>
        <div class="form-alert" role="alert" data-form-alert hidden></div>
        <fieldset data-form-step="1">
          <legend>Takımını tanıyalım</legend>
          <div class="form-grid">
            <label><span>Branş *</span><select name="sport" required aria-describedby="quote-error-sport"><option value="">Seçin</option><option>Futbol</option><option>Basketbol</option><option>Voleybol</option><option>Diğer</option></select><small class="field-error" id="quote-error-sport" data-field-error="sport" hidden></small></label>
            <label><span>Kullanım amacı *</span><select name="useCase" required aria-describedby="quote-error-use-case"><option value="">Seçin</option><option>Halı saha takımı</option><option>Okul takımı</option><option>Turnuva / organizasyon</option><option>Spor kulübü</option><option>Diğer</option></select><small class="field-error" id="quote-error-use-case" data-field-error="useCase" hidden></small></label>
            <label class="form-grid__full"><span>Takım veya organizasyon adı</span><input type="text" name="teamName" maxlength="80" autocomplete="organization" placeholder="Örn. Kuzey Yıldızı"></label>
          </div>
          <div class="form-actions"><button class="button" type="button" data-next-step>Devam Et</button></div>
        </fieldset>
        <fieldset data-form-step="2" hidden>
          <legend>Ürün ayrıntılarını ekle</legend>
          <div class="form-grid">
            <label><span>Ürün kapsamı *</span><select name="product" required aria-describedby="quote-error-product"><option value="">Seçin</option><option>Yalnızca forma</option><option>Forma + şort</option><option>Kaleci ürünü dahil</option><option>Kararsızım</option></select><small class="field-error" id="quote-error-product" data-field-error="product" hidden></small></label>
            <label><span>Adet *</span><input type="number" name="quantity" min="5" max="500" step="1" inputmode="numeric" required placeholder="En az 5" aria-describedby="quote-error-quantity"><small class="field-error" id="quote-error-quantity" data-field-error="quantity" hidden></small></label>
            <label><span>Model kodu</span><input type="text" name="modelCode" maxlength="20" autocomplete="off" placeholder="Örn. FK-007"></label>
            <label><span>Takım renkleri</span><input type="text" name="colors" maxlength="80" placeholder="Örn. lacivert, altın"></label>
            <label class="form-grid__full"><span>Ek not</span><textarea name="notes" rows="4" maxlength="500" placeholder="Hedef tarih, kaleci forması veya farklı bir ihtiyaç varsa yazın."></textarea></label>
          </div>
          <div class="form-actions"><button class="button button--ghost" type="button" data-prev-step>Geri</button><button class="button" type="button" data-next-step>Devam Et</button></div>
        </fieldset>
        <fieldset data-form-step="3" hidden>
          <legend>Dosyaları hazırlayın</legend>
          <div class="form-grid">
            <label class="file-field"><span>Logo veya örnek görsel</span><input type="file" name="visualFile" accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf" data-max-size="10485760" aria-describedby="quote-help-visual-file quote-error-visual-file"><small id="quote-help-visual-file">PNG, JPG, WebP veya PDF · en fazla 10 MB</small><small class="field-error" id="quote-error-visual-file" data-field-error="visualFile" hidden></small></label>
            <label class="file-field"><span>İsim, numara ve beden listesi</span><input type="file" name="rosterFile" accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" data-max-size="10485760" aria-describedby="quote-help-roster-file quote-error-roster-file"><small id="quote-help-roster-file">CSV, XLS veya XLSX · en fazla 10 MB</small><small class="field-error" id="quote-error-roster-file" data-field-error="rosterFile" hidden></small></label>
            <label class="checkbox-field form-grid__full"><input type="checkbox" name="consent" required aria-describedby="quote-error-consent"><span>Bilgilerimin teklif görüşmesi amacıyla WhatsApp’a aktarılacağını anladım ve kabul ediyorum. *</span></label>
            <small class="field-error form-grid__full" id="quote-error-consent" data-field-error="consent" hidden></small>
          </div>
          <p class="form-note">Dosyalar bu siteden yüklenmez. WhatsApp açıldıktan sonra seçtiğin dosyaları sohbete ayrıca eklemen gerekir.</p>
          <div class="form-actions"><button class="button button--ghost" type="button" data-prev-step>Geri</button><button class="button" type="submit">WhatsApp Mesajını Hazırla</button></div>
        </fieldset>
      </form>
      <aside class="quote-summary" aria-live="polite">
        <p class="eyebrow">Teklif özeti</p>
        <h2>Seçimlerin burada görünecek.</h2>
        <dl data-quote-summary><div><dt>Branş</dt><dd data-summary-value="sport">—</dd></div><div><dt>Kullanım</dt><dd data-summary-value="useCase">—</dd></div><div><dt>Takım</dt><dd data-summary-value="teamName">—</dd></div><div><dt>Ürün</dt><dd data-summary-value="product">—</dd></div><div><dt>Adet</dt><dd data-summary-value="quantity">—</dd></div><div><dt>Model</dt><dd data-summary-value="modelCode">—</dd></div><div><dt>Renkler</dt><dd data-summary-value="colors">—</dd></div><div><dt>Not</dt><dd data-summary-value="notes">—</dd></div><div><dt>Logo / örnek</dt><dd data-summary-value="visualFile">—</dd></div><div><dt>Takım listesi</dt><dd data-summary-value="rosterFile">—</dd></div></dl>
        <a href="/assets/templates/takim-listesi.csv" download>Takım listesi CSV şablonunu indir →</a>
      </aside>
    </div></section>`,
});

writePage("/hakkimizda/", {
  title: "Hakkımızda",
  description: "Forma Kutusu'nun takım forması tasarım, model seçimi, onay ve üretim yaklaşımını; doğrulanabilir bilgi ve şeffaf süreç ilkelerini öğrenin.",
  pageClass: "about-page",
  schemas: [
    breadcrumbSchema([
      { name: "Ana Sayfa", path: "/" },
      { name: "Hakkımızda", path: "/hakkimizda/" },
    ]),
  ],
  body: `
    ${breadcrumbs([{ name: "Ana Sayfa", path: "/" }, { name: "Hakkımızda", path: "/hakkimizda/" }])}
    ${innerHero({ eyebrow: "Forma Kutusu", title: "Takım kimliğini üretime hazırlayan sade yaklaşım.", copy: "Model seçimini, takım detaylarını, tasarım onayını ve üretim iletişimini tek anlaşılır süreçte birleştiriyoruz.", image: { src: "/assets/references/ref-15.webp", alt: "Forma Kutusu üretiminden tamamlanan siyah ve mavi takım formaları", width: 1000, height: 700 } })}
    <section class="feature-section"><div class="container">
      ${sectionIntro("Çalışma ilkeleri", "Güven, iddiadan değil süreçten doğar.", "Sitede doğrulanamayan satış sayıları, sahte yorumlar, sabit termin veya gerçek olmayan garanti ifadeleri kullanmıyoruz.")}
      <div class="feature-grid"><article><span>01</span><h3>Net kapsam</h3><p>Adet, ürün, beden ve kişiselleştirme detayları teklif öncesinde yazılı hâle gelir.</p></article><article><span>02</span><h3>Görsel onay</h3><p>Takım renkleri ve kimlik öğeleri üretimden önce kontrol edilir.</p></article><article><span>03</span><h3>Güncel bilgi</h3><p>Fiyat ve termin, üretim koşullarına göre teklif sırasında teyit edilir.</p></article><article><span>04</span><h3>Gizlilik</h3><p>Müşteri listeleri ve özel sipariş dosyaları web sitesinde yayınlanmaz.</p></article></div>
    </div></section>
    <section class="brand-band"><div class="container brand-band__inner"><div><p class="eyebrow">Üretim gücü</p><h2>NORA</h2><p>Forma Kutusu ve NORA marka materyalleri mevcut web arşivinde birlikte kullanılıyor. Güncel kurumsal veya üretim ayrıntıları teklif görüşmesinde teyit edilebilir.</p></div><img src="/assets/brand/nora.webp" alt="NORA" width="420" height="245" loading="lazy"></div></section>
    ${finalCta()}`,
});

writePage("/iletisim/", {
  title: "İletişim",
  description: "Forma Kutusu ile WhatsApp veya telefon üzerinden iletişime geçin; model kodunuzu, forma adedinizi ve takım renklerinizi paylaşın.",
  pageClass: "contact-page",
  schemas: [
    breadcrumbSchema([
      { name: "Ana Sayfa", path: "/" },
      { name: "İletişim", path: "/iletisim/" },
    ]),
  ],
  body: `
    ${breadcrumbs([{ name: "Ana Sayfa", path: "/" }, { name: "İletişim", path: "/iletisim/" }])}
    ${innerHero({ eyebrow: "İletişim", title: "Takımın için konuşmaya başlayalım.", copy: "En hızlı başlangıç için model kodunu, forma adedini ve takım renklerini mesajına ekle.", cta: false })}
    <section class="contact-section"><div class="container contact-grid">
      <a class="contact-card" href="${whatsappUrl("Merhaba, takımımız için özel forma teklifi almak istiyorum.")}" target="_blank" rel="noopener noreferrer"><span>01</span><h2>WhatsApp</h2><p>Teklif ve model soruları için doğrudan yaz.</p><strong>Mesaj gönder ↗</strong></a>
      <a class="contact-card" href="tel:${site.phoneHref}"><span>02</span><h2>Telefon</h2><p>${site.phoneDisplay.split(" ").join("&#8209;")}</p></a>
      <a class="contact-card" href="${site.instagram}" target="_blank" rel="noopener noreferrer"><span>03</span><h2>Instagram</h2><p>Yayınlanan tasarım ve içerikleri incele.</p><strong>Profili aç ↗</strong></a>
    </div></section>
    <section class="content-band"><div class="container content-band__grid"><div><p class="eyebrow">Mesaj kontrol listesi</p><h2>İlk mesajda bunları ekle.</h2></div><ul class="check-list"><li>Branş ve kullanım amacı</li><li>Beğendiğin model kodu</li><li>Forma adedi</li><li>Forma veya forma + şort</li><li>Takım renkleri</li><li>Varsa hedef tarih</li></ul></div></section>
    ${finalCta()}`,
});

writePage("/kvkk-ve-gizlilik/", {
  title: "Gizlilik ve Dosya Kullanımı Notu",
  description: "Forma Kutusu teklif sayfasında dosyaların ve form bilgilerinin nasıl kullanıldığını öğrenin. Dosyalar site sunucusuna yüklenmez.",
  pageClass: "content-page",
  schemas: [
    breadcrumbSchema([
      { name: "Ana Sayfa", path: "/" },
      { name: "Gizlilik", path: "/kvkk-ve-gizlilik/" },
    ]),
  ],
  body: `
    ${breadcrumbs([{ name: "Ana Sayfa", path: "/" }, { name: "Gizlilik", path: "/kvkk-ve-gizlilik/" }])}
    ${innerHero({ eyebrow: "Şeffaflık", title: "Dosyaların bu sitede tutulmaz.", copy: "Teklif sihirbazı statik olarak çalışır; form alanları ve seçtiğin dosyalar sunucuya gönderilmez.", cta: false })}
    <section class="content-section"><div class="container prose">
      <h2>Teklif sihirbazı nasıl çalışır?</h2><p>Form alanları yalnızca cihazında bir WhatsApp mesajı hazırlamak için kullanılır. Gönder düğmesine bastığında WhatsApp açılır; mesajı göndermek veya vazgeçmek senin kontrolündedir.</p>
      <h2>Dosya seçimi</h2><p>Logo, örnek görsel veya takım listesi seçersen site yalnızca dosya türünü, boyutunu ve adını cihazında kontrol eder. Dosya otomatik yüklenmez. WhatsApp görüşmesi açıldıktan sonra dosyayı sohbete kendin eklemelisin.</p>
      <h2>Hassas bilgiler</h2><p>Müşteri adı, telefon, adres, logo, takım listesi veya özel sipariş bilgisini web sitesinde yayınlamıyoruz. İletişim sırasında yalnızca teklif ve üretim için gerekli bilgileri paylaşmanı öneriyoruz.</p>
      <h2>Harici hizmet</h2><p>WhatsApp, Instagram ve TikTok bağlantıları harici platformlara gider. Bu platformlardaki veri işlemleri kendi koşullarına tabidir.</p>
    </div></section>
    ${finalCta()}`,
});

const guideCards = [
  {
    path: "/rehber/forma-yaptirma-rehberi/",
    title: "Forma Yaptırma Rehberi",
    copy: "Model, adet, kumaş, takım listesi ve tasarım onayını doğru sıraya koy.",
  },
  {
    path: "/rehber/hali-saha-formasi-secimi/",
    title: "Halı Saha Forması Seçimi",
    copy: "Takım renklerinden forma ve şort kapsamına kadar karar listesini hazırla.",
  },
  {
    path: "/rehber/takim-listesi-hazirlama/",
    title: "Takım Listesi Hazırlama",
    copy: "İsim, numara ve beden bilgilerindeki yaygın sipariş hatalarını azalt.",
  },
];

writePage("/rehber/", {
  title: "Forma Yaptırma Rehberi ve Bilgi Merkezi",
  description: "Forma yaptırma, halı saha forması seçimi, takım listesi, beden planlama, kumaş ve sipariş süreci hakkında özgün rehberler.",
  pageClass: "guide-index",
  schemas: [
    breadcrumbSchema([
      { name: "Ana Sayfa", path: "/" },
      { name: "Rehber", path: "/rehber/" },
    ]),
  ],
  body: `
    ${breadcrumbs([{ name: "Ana Sayfa", path: "/" }, { name: "Rehber", path: "/rehber/" }])}
    ${innerHero({ eyebrow: "Bilgi merkezi", title: "Forma siparişini daha bilinçli hazırla.", copy: "Satın alma kararı vermeden önce model, beden, dosya ve üretim sürecini açıklayan kısa rehberler.", cta: false })}
    <section class="guide-section"><div class="container guide-grid">${guideCards.map((card, index) => `<a class="guide-card" href="${card.path}"><span>0${index + 1}</span><h2>${escapeHtml(card.title)}</h2><p>${escapeHtml(card.copy)}</p><strong>Rehberi oku →</strong></a>`).join("")}</div></section>
    ${finalCta()}`,
});

const guideArticles = [
  {
    route: "/rehber/forma-yaptirma-rehberi/",
    title: "Forma Yaptırma Rehberi: Sipariş Kontrol Listesi",
    description: "Forma yaptırırken model, adet, ürün kapsamı, takım listesi, logo, beden ve tasarım onayı adımlarını doğru sırayla planlayın.",
    heading: "Forma yaptırmadan önce 7 kararı netleştir.",
    intro: "İyi bir sipariş, yalnızca güzel bir model seçmekle başlamaz. Doğru bilgi akışı; yanlış beden, eksik numara ve son dakika değişikliği riskini azaltır.",
    sections: [
      ["1. Kullanım amacını yaz", "Halı saha, okul, turnuva veya kulüp kullanımı üretim görüşmesinin bağlamını belirler."],
      ["2. Model kodunu seç", "Hazır bir model kodu iletişimi hızlandırır. Model seçmediysen beğendiğin renk ve tasarım yönünü açıkla."],
      ["3. Ürün kapsamını belirt", "Yalnızca forma, forma ve şort veya kaleci ürünü dahil seçeneklerini en başta ayır."],
      ["4. Adet ve beden dağılımını topla", "Her oyuncunun adını, numarasını ve bedenini tek güncel listede tut."],
      ["5. Logo dosyalarını hazırla", "Takım arması ve sponsor dosyalarını mümkün olan en net hâliyle paylaş."],
      ["6. Tasarımı satır satır kontrol et", "İsim yazımı, numara, renk, logo ve beden listesini üretim onayından önce karşılaştır."],
      ["7. Fiyat ve tarihi teyit et", "Sabit ve doğrulanmamış iddialar yerine güncel teklif ve üretim planını yazılı olarak iste."],
    ],
  },
  {
    route: "/rehber/hali-saha-formasi-secimi/",
    title: "Halı Saha Forması Seçimi: Takım İçin Pratik Rehber",
    description: "Halı saha forması seçerken model, renk kontrastı, isim-numara okunabilirliği, forma-şort kapsamı, beden ve takım listesini planlayın.",
    heading: "Halı saha forması seçerken görünüm kadar düzeni de düşün.",
    intro: "Haftalık maç takımları için en iyi model, yalnızca dikkat çekici olan değil; kadro bilgisini doğru taşıyan ve siparişi kolay yöneten modeldir.",
    sections: [
      ["Takım renklerini sınırla", "Bir ana renk, bir yardımcı renk ve kontrollü bir vurgu çoğu takım için yeterlidir."],
      ["Numara okunabilirliğini kontrol et", "Forma zemini ile isim ve numara arasında belirgin kontrast iste."],
      ["Forma ve şortu birlikte düşün", "Şort rengi ve varsa şort numarası uygulamasını teklif kapsamına ekle."],
      ["Kaleci ihtiyacını ayır", "Kaleci ürününün renk ve kapsamını takım listesinin içinde açıkça belirt."],
      ["Bedenleri son gün toplamaya bırakma", "Takım yöneticisi tek bir güncel liste tutsun ve üretim onayından önce son kontrolü yapsın."],
    ],
  },
  {
    route: "/rehber/takim-listesi-hazirlama/",
    title: "Forma İsim, Numara ve Beden Listesi Nasıl Hazırlanır?",
    description: "Forma siparişi için oyuncu adı, numara, beden, kaleci bilgisi ve notları içeren doğru takım listesini hazırlayın; ücretsiz CSV şablonunu indirin.",
    heading: "Tek dosya kullan. Her değişikliği aynı listede güncelle.",
    intro: "Sipariş hatalarının önemli bir bölümü farklı mesajlarda kalan isim, numara ve beden değişikliklerinden doğar. Basit bir tablo bu riski azaltır.",
    sections: [
      ["Oyuncu adını yaz", "Formada görünmesi istenen yazımı büyük-küçük harf dâhil son hâliyle gir."],
      ["Forma numarasını ayrı sütunda tut", "Numarayı metin içinde değil, kendi sütununda sakla."],
      ["Bedeni ürün kalıbıyla teyit et", "Doğrulanmış güncel beden bilgisini üreticiyle karşılaştır."],
      ["Kaleciyi işaretle", "Farklı ürün veya renk ihtiyacı varsa kaleci sütununda açıkça belirt."],
      ["Tek sorumlu belirle", "Son listeyi bir kişi güncellesin ve üretim onayından önce dondursun."],
    ],
  },
];

for (const article of guideArticles) {
  writePage(article.route, {
    title: article.title,
    description: article.description,
    pageClass: "article-page",
    schemas: [
      breadcrumbSchema([
        { name: "Ana Sayfa", path: "/" },
        { name: "Rehber", path: "/rehber/" },
        { name: article.heading, path: article.route },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.description,
        author: { "@type": "Organization", name: site.name },
        publisher: { "@type": "Organization", name: site.name },
        mainEntityOfPage: `${site.origin}${article.route}`,
      },
    ],
    body: `
      ${breadcrumbs([{ name: "Ana Sayfa", path: "/" }, { name: "Rehber", path: "/rehber/" }, { name: article.heading, path: article.route }])}
      <article class="article"><header class="article__header container"><p class="eyebrow">Forma Kutusu Rehber</p><h1>${escapeHtml(article.heading)}</h1><p class="lead">${escapeHtml(article.intro)}</p></header><div class="container article__body">${article.sections.map(([title, copy]) => `<section><h2>${escapeHtml(title)}</h2><p>${escapeHtml(copy)}</p></section>`).join("")}<aside class="download-card"><h2>Takım listesi şablonunu indir</h2><p>Oyuncu adı, forma numarası, beden, kaleci bilgisi ve not sütunları hazır.</p><a class="button" href="/assets/templates/takim-listesi.csv" download>CSV Şablonunu İndir</a></aside></div></article>
      ${finalCta()}`,
  });
}

writePage("/404/", {
  title: "Sayfa Bulunamadı",
  description: "Aradığınız sayfa bulunamadı. Forma modellerine, teklif sayfasına veya ana sayfaya geri dönün.",
  pageClass: "not-found-page",
  schemas: [],
  body: `<section class="not-found"><div class="container"><p class="eyebrow">404 · Ofsayt</p><h1>Aradığın sayfa sahaya çıkmamış olabilir.</h1><p>Bağlantı değişmiş veya sayfa kaldırılmış olabilir. Forma modellerine dönerek devam edebilirsin.</p><div class="button-row"><a class="button" href="/modeller/">Forma Modelleri</a><a class="button button--ghost" href="/">Ana Sayfa</a></div></div></section>`,
});

const redirects = [
  ["katalog.html", "/modeller/"],
  ["katalog/index.html", "/modeller/"],
  ["katalog-basketbol.html", "/basketbol/"],
  ["katalog-basketbol/index.html", "/basketbol/"],
  ["katalog-voleybol.html", "/voleybol/"],
  ["katalog-voleybol/index.html", "/voleybol/"],
  ["urun.html", "/modeller/"],
];

for (const [relative, target] of redirects) {
  const filePath = path.join(root, relative);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><link rel="canonical" href="${site.origin}${target}"><meta http-equiv="refresh" content="0;url=${target}"><title>Yönlendiriliyor | Forma Kutusu</title></head><body><p>Yeni sayfaya yönlendiriliyorsunuz: <a href="${target}">${target}</a></p></body></html>\n`,
    "utf8",
  );
}

fs.copyFileSync(path.join(root, "404", "index.html"), path.join(root, "404.html"));

const sitemapUrls = routes
  .filter((route) => route !== "/404/")
  .map((route) => `${site.origin}${route}`)
  .sort((a, b) => {
    if (a === `${site.origin}/`) return -1;
    if (b === `${site.origin}/`) return 1;
    return a.localeCompare(b, "tr");
  });

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap, "utf8");
fs.writeFileSync(path.join(root, "sitemap.txt"), `${sitemapUrls.join("\n")}\n`, "utf8");

fs.writeFileSync(
  path.join(root, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${site.origin}/sitemap.txt\n`,
  "utf8",
);

console.log(`Built ${routes.length} pages and ${redirects.length} redirects.`);

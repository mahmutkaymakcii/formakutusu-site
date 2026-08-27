const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function write(relativePath, content) {
  fs.writeFileSync(path.join(root, relativePath), `${content.trimEnd()}\n`, "utf8");
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

function normalizeGuideFooterLink(html) {
  // Remove only links created by this normalizer so an earlier run cannot leave
  // the Rehber link in the header/navigation. Existing breadcrumb or content
  // links to /rehber/ use different anchor text and remain untouched.
  let normalized = html.replace(/\s*<a href="\/rehber\/">Forma rehberi<\/a>/g, "");
  const footerStart = normalized.indexOf('<footer class="site-footer');
  if (footerStart < 0) return normalized;

  const beforeFooter = normalized.slice(0, footerStart);
  let footer = normalized.slice(footerStart);

  const faqLinkPattern = /(<a href="\/sik-sorulan-sorular\/">[^<]*<\/a>)/i;
  if (faqLinkPattern.test(footer)) {
    footer = footer.replace(
      faqLinkPattern,
      '$1\n        <a href="/rehber/">Forma rehberi</a>',
    );
    return beforeFooter + footer;
  }

  const aboutLinkPattern = /(<a href="\/hakkimizda\/">[^<]*<\/a>)/i;
  if (aboutLinkPattern.test(footer)) {
    footer = footer.replace(
      aboutLinkPattern,
      '<a href="/rehber/">Forma rehberi</a>\n        $1',
    );
  }

  return beforeFooter + footer;
}

function addGuideHubCommercialLinks(html) {
  if (html.includes('data-seo-related="guide-commercial"')) return html;
  const marker = '</section>\n    <section class="final-cta">';
  if (!html.includes(marker)) return html;

  const block = `</section>
    <section class="guide-section" data-seo-related="guide-commercial"><div class="container">
      <div class="section-intro"><p class="eyebrow">İlgili hizmetler</p><h2>Rehberden sipariş sayfalarına geç.</h2><p>İhtiyacına göre doğrudan ilgili forma üretim ve planlama sayfasını aç.</p></div>
      <div class="guide-grid">
        <a class="guide-card" href="/forma-yaptirma-istanbul/"><span>04</span><h2>İstanbul’da Forma Yaptırma</h2><p>İstanbul’daki takımlar için model, adet, beden ve sipariş adımlarını incele.</p><strong>Sayfayı aç →</strong></a>
        <a class="guide-card" href="/okul-turnuva-formasi/"><span>05</span><h2>Okul ve Turnuva Forması</h2><p>Kalabalık kadrolar ve farklı bedenler için sipariş hazırlığını planla.</p><strong>Sayfayı aç →</strong></a>
      </div>
    </div></section>
    <section class="final-cta">`;

  return html.replace(marker, block);
}

function addArticleRelatedLinks(html, links) {
  if (html.includes('data-seo-related="article"')) return html;
  const marker = '</div></article>\n      <section class="final-cta">';
  if (!html.includes(marker)) return html;

  const linkHtml = links
    .map(({ href, label }) => `<a class="text-link" href="${href}">${label} <span aria-hidden="true">→</span></a>`)
    .join(' ');

  const block = `<aside class="download-card" data-seo-related="article"><h2>İlgili sayfalar</h2><p>Sipariş kararını netleştirmek için ilgili sayfalara geç.</p><p>${linkHtml}</p></aside></div></article>
      <section class="final-cta">`;

  return html.replace(marker, block);
}

const htmlFiles = walk(root).filter((file) => file.endsWith(".html"));
let footerUpdates = 0;

for (const file of htmlFiles) {
  const relativePath = path.relative(root, file).split(path.sep).join("/");
  const original = fs.readFileSync(file, "utf8");
  const updated = normalizeGuideFooterLink(original);
  if (updated !== original) {
    write(relativePath, updated);
    footerUpdates += 1;
  }
}

const contextual = [
  {
    path: "rehber/forma-yaptirma-rehberi/index.html",
    links: [
      { href: "/takima-ozel-forma/", label: "Takıma özel forma" },
      { href: "/teklif/", label: "Forma fiyatları" },
      { href: "/forma-yaptirma-istanbul/", label: "İstanbul’da forma yaptırma" },
    ],
  },
  {
    path: "rehber/hali-saha-formasi-secimi/index.html",
    links: [
      { href: "/hali-saha-formasi/", label: "Halı saha forması" },
      { href: "/forma-sort-takimi/", label: "Forma + şort" },
      { href: "/modeller/", label: "Forma modelleri" },
    ],
  },
  {
    path: "rehber/takim-listesi-hazirlama/index.html",
    links: [
      { href: "/okul-turnuva-formasi/", label: "Okul ve turnuva forması" },
      { href: "/beden-tablosu/", label: "Beden planlama" },
      { href: "/nasil-siparis-verilir/", label: "Sipariş adımları" },
    ],
  },
];

const guideHubPath = "rehber/index.html";
if (fs.existsSync(path.join(root, guideHubPath))) {
  const original = read(guideHubPath);
  const updated = addGuideHubCommercialLinks(original);
  if (updated !== original) write(guideHubPath, updated);
}

for (const item of contextual) {
  if (!fs.existsSync(path.join(root, item.path))) continue;
  const original = read(item.path);
  const updated = addArticleRelatedLinks(original, item.links);
  if (updated !== original) write(item.path, updated);
}

console.log(`SEO internal links normalized. Footer updates: ${footerUpdates}.`);

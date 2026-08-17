const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const origin = "https://formakutusu.com";
const errors = [];
const warnings = [];

function relative(file) {
  return path.relative(root, file).split(path.sep).join("/");
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

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function addError(file, message) {
  errors.push(`${relative(file)}: ${message}`);
}

function addWarning(file, message) {
  warnings.push(`${relative(file)}: ${message}`);
}

function parseAttributes(source = "") {
  const attrs = {};
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = pattern.exec(source))) {
    const name = match[1].toLowerCase();
    attrs[name] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attrs;
}

function tags(html, tagName) {
  const results = [];
  const pattern = new RegExp(`<${tagName}\\b([^>]*)>`, "gi");
  let match;
  while ((match = pattern.exec(html))) {
    results.push({ attrs: parseAttributes(match[1]), raw: match[0], index: match.index });
  }
  return results;
}

function textMatches(html, pattern) {
  return [...html.matchAll(pattern)].map((match) => match[1]?.trim() ?? match[0]);
}

function routeForHtml(file) {
  const rel = relative(file);
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"index.html".length)}`;
  return `/${rel}`;
}

function stripQueryAndHash(value) {
  return value.split("#", 1)[0].split("?", 1)[0];
}

function internalPath(value, currentRoute) {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^(?:mailto:|tel:|sms:|data:|blob:|javascript:)/i.test(trimmed)) return null;
  if (trimmed.startsWith("//")) return null;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.origin !== origin) return null;
      return parsed.pathname;
    } catch {
      return null;
    }
  }
  if (trimmed.startsWith("#")) return "";
  const clean = stripQueryAndHash(trimmed);
  if (!clean) return "";
  if (clean.startsWith("/")) return clean;
  const base = currentRoute.endsWith("/") ? currentRoute : path.posix.dirname(currentRoute) + "/";
  return path.posix.resolve(base, clean);
}

function localFileCandidates(urlPath) {
  const decoded = decodeURIComponent(urlPath || "/");
  const clean = decoded.replace(/^\/+/, "");
  if (!clean) return [path.join(root, "index.html")];
  const candidates = [path.join(root, clean)];
  if (decoded.endsWith("/")) candidates.push(path.join(root, clean, "index.html"));
  else if (!path.posix.extname(decoded)) {
    candidates.push(path.join(root, `${clean}.html`));
    candidates.push(path.join(root, clean, "index.html"));
  }
  return candidates;
}

function internalTargetExists(urlPath) {
  return localFileCandidates(urlPath).some((candidate) => fs.existsSync(candidate));
}

function extractMeta(html, key, value) {
  return tags(html, "meta").find((tag) => tag.attrs[key] === value)?.attrs.content;
}

function extractLink(html, rel) {
  return tags(html, "link").find((tag) => (tag.attrs.rel || "").split(/\s+/).includes(rel))?.attrs.href;
}

function isRedirectPage(html) {
  return tags(html, "meta").some((tag) => tag.attrs["http-equiv"]?.toLowerCase() === "refresh");
}

function hasNoindex(html) {
  return (extractMeta(html, "name", "robots") || "").toLowerCase().includes("noindex");
}

function checkBalancedCss(file, css) {
  let depth = 0;
  let quote = "";
  let comment = false;
  for (let index = 0; index < css.length; index += 1) {
    const char = css[index];
    const next = css[index + 1];
    if (comment) {
      if (char === "*" && next === "/") {
        comment = false;
        index += 1;
      }
      continue;
    }
    if (!quote && char === "/" && next === "*") {
      comment = true;
      index += 1;
      continue;
    }
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth < 0) {
      addError(file, "CSS içinde fazladan kapanış süslü parantezi var.");
      return;
    }
  }
  if (comment) addError(file, "CSS yorumu kapatılmamış.");
  if (quote) addError(file, "CSS metin değeri kapatılmamış.");
  if (depth !== 0) addError(file, `CSS süslü parantez dengesi bozuk (${depth}).`);
}

const files = walk(root);
const productionFiles = files.filter((file) => !relative(file).startsWith("preview/"));
const htmlFiles = productionFiles.filter((file) => file.endsWith(".html"));
const cssFiles = productionFiles.filter((file) => file.endsWith(".css"));
const jsFiles = productionFiles.filter((file) => /\.(?:c?js|mjs)$/.test(file));
const indexablePages = new Map();
const titles = new Map();
const canonicals = new Map();

for (const file of htmlFiles) {
  const html = read(file);
  const route = routeForHtml(file);
  const redirect = isRedirectPage(html);
  const noindex = hasNoindex(html);
  const titleItems = textMatches(html, /<title\b[^>]*>([\s\S]*?)<\/title>/gi);
  const descriptions = tags(html, "meta").filter((tag) => tag.attrs.name === "description");
  const canonicalItems = tags(html, "link").filter((tag) => (tag.attrs.rel || "").split(/\s+/).includes("canonical"));

  if (!/^<!doctype html>/i.test(html.trimStart())) addError(file, "DOCTYPE eksik veya dosyanın başında değil.");
  if (!/<html\b[^>]*\blang=["']tr["']/i.test(html)) addError(file, 'html lang="tr" eksik.');
  if (!/<meta\b[^>]*name=["']viewport["']/i.test(html)) addError(file, "viewport meta etiketi eksik.");
  if (titleItems.length !== 1) addError(file, `Tam olarak bir title olmalı; bulunan: ${titleItems.length}.`);
  if (!redirect && descriptions.length !== 1) addError(file, `Tam olarak bir meta description olmalı; bulunan: ${descriptions.length}.`);
  if (canonicalItems.length !== 1) addError(file, `Tam olarak bir canonical olmalı; bulunan: ${canonicalItems.length}.`);

  const ids = tags(html, "[a-zA-Z][\\w:-]*");
  const idValues = [];
  const allTagPattern = /<([a-zA-Z][\w:-]*)\b([^>]*)>/g;
  let tagMatch;
  while ((tagMatch = allTagPattern.exec(html))) {
    const attrs = parseAttributes(tagMatch[2]);
    if (attrs.id) idValues.push(attrs.id);
  }
  const duplicateIds = [...new Set(idValues.filter((id, index) => idValues.indexOf(id) !== index))];
  if (duplicateIds.length) addError(file, `Yinelenen id: ${duplicateIds.join(", ")}.`);

  if (!redirect) {
    const h1Count = (html.match(/<h1\b/gi) || []).length;
    if (h1Count !== 1) addError(file, `Tam olarak bir h1 olmalı; bulunan: ${h1Count}.`);
    if (!/<main\b[^>]*id=["']main-content["']/i.test(html)) addError(file, 'main#main-content eksik.');
  }

  for (const image of tags(html, "img")) {
    if (!("src" in image.attrs) || !image.attrs.src) addError(file, "src değeri olmayan img etiketi var.");
    if (!("alt" in image.attrs)) addError(file, `Alt metni olmayan görsel: ${image.attrs.src || "bilinmeyen"}.`);
    if (!("width" in image.attrs) || !("height" in image.attrs)) {
      addError(file, `Boyut bilgisi eksik görsel: ${image.attrs.src || "bilinmeyen"}.`);
    }
  }

  for (const anchor of tags(html, "a")) {
    if (anchor.attrs.target === "_blank") {
      const rel = (anchor.attrs.rel || "").split(/\s+/);
      if (!rel.includes("noopener") && !rel.includes("noreferrer")) {
        addError(file, `target="_blank" bağlantısında noopener/noreferrer yok: ${anchor.attrs.href || ""}.`);
      }
    }
  }

  const refs = [
    ...tags(html, "a").map((tag) => ["href", tag.attrs.href]),
    ...tags(html, "link").map((tag) => ["href", tag.attrs.href]),
    ...tags(html, "script").map((tag) => ["src", tag.attrs.src]),
    ...tags(html, "img").map((tag) => ["src", tag.attrs.src]),
    ...tags(html, "source").flatMap((tag) => [["src", tag.attrs.src], ["srcset", tag.attrs.srcset?.split(",")[0]?.trim().split(/\s+/)[0]]]),
  ];

  for (const [attribute, value] of refs) {
    if (!value) continue;
    const resolved = internalPath(value, route);
    if (resolved === null) continue;
    if (resolved === "") {
      if (value.startsWith("#") && !idValues.includes(value.slice(1))) addError(file, `Bulunamayan sayfa içi hedef: ${value}.`);
      continue;
    }
    if (!internalTargetExists(resolved)) addError(file, `Kırık ${attribute} yolu: ${value} -> ${resolved}.`);
  }

  const srcsets = [...html.matchAll(/\bsrcset=["']([^"']+)["']/gi)];
  for (const match of srcsets) {
    for (const candidate of match[1].split(",")) {
      const value = candidate.trim().split(/\s+/)[0];
      const resolved = internalPath(value, route);
      if (resolved && !internalTargetExists(resolved)) addError(file, `Kırık srcset yolu: ${value}.`);
    }
  }

  const jsonLdPattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonMatch;
  while ((jsonMatch = jsonLdPattern.exec(html))) {
    try {
      JSON.parse(jsonMatch[1]);
    } catch (error) {
      addError(file, `Geçersiz JSON-LD: ${error.message}.`);
    }
  }

  const badContent = [
    [/\bformalari\b/i, '"formalari" yerine "formaları" kullanılmalı.'],
    [/Tasarım onayın alınmadan/i, '"Tasarım onayın" dilbilgisi hatası.'],
    [/genellikle\s+1\s*-\s*2\s+gün/i, "Doğrulanmamış 1-2 gün teslimat iddiası var."],
    [/solmaz\s*,?\s*dökülmez/i, "Koşulsuz solmaz/dökülmez garantisi kullanılmış."],
  ];
  for (const [pattern, message] of badContent) if (pattern.test(html)) addError(file, message);

  const canonical = canonicalItems[0]?.attrs.href;
  if (!redirect && !noindex && !/^(?:404\.html|404\/index\.html)$/.test(relative(file))) {
    indexablePages.set(route, file);
    const expected = `${origin}${route}`;
    if (canonical !== expected) addError(file, `Canonical beklenen ${expected}, bulunan ${canonical || "yok"}.`);
    const ogUrl = extractMeta(html, "property", "og:url");
    if (ogUrl && ogUrl !== expected) addError(file, `og:url canonical ile uyuşmuyor: ${ogUrl}.`);
    if (titleItems[0]) {
      const previous = titles.get(titleItems[0]);
      if (previous) addError(file, `Yinelenen title; diğer dosya: ${relative(previous)}.`);
      else titles.set(titleItems[0], file);
    }
    if (canonical) {
      const previous = canonicals.get(canonical);
      if (previous) addError(file, `Yinelenen canonical; diğer dosya: ${relative(previous)}.`);
      else canonicals.set(canonical, file);
    }
  }

  if (!redirect && route !== "/" && !html.includes('/assets/css/site.css')) {
    addWarning(file, "Ortak site.css yerine bağımsız/inline tasarım kullanıyor.");
  }
  if ((html.match(/<style\b/gi) || []).length) addWarning(file, "Inline style bloğu içeriyor; ortak CSS yapısından sapıyor.");
  if (/fonts\.googleapis\.com/i.test(html)) addWarning(file, "Harici Google Fonts bağımlılığı içeriyor.");
}

for (const file of cssFiles) checkBalancedCss(file, read(file));

for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) addError(file, `JavaScript sözdizimi hatası: ${(result.stderr || result.stdout).trim()}`);
}

const modelsFile = path.join(root, "assets/data/models.json");
try {
  const models = JSON.parse(read(modelsFile));
  if (!Array.isArray(models)) addError(modelsFile, "Kök değer dizi olmalı.");
  else {
    const ids = new Set();
    for (const [index, model] of models.entries()) {
      if (!model.id || !/^[A-Z0-9]+(?:-[A-Z0-9]+)+$/.test(model.id)) addError(modelsFile, `${index + 1}. model kodu geçersiz: ${model.id || "yok"}.`);
      if (ids.has(model.id)) addError(modelsFile, `Yinelenen model kodu: ${model.id}.`);
      ids.add(model.id);
      if (!model.image || !internalTargetExists(model.image)) addError(modelsFile, `${model.id || index}: model görseli bulunamadı: ${model.image || "yok"}.`);
      if (!model.alt?.trim()) addError(modelsFile, `${model.id || index}: alt metni eksik.`);
      if (!["futbol", "basketbol", "voleybol"].includes(model.sport)) addError(modelsFile, `${model.id || index}: geçersiz branş: ${model.sport}.`);
    }
  }
} catch (error) {
  addError(modelsFile, `JSON okunamadı: ${error.message}.`);
}

const manifestFile = path.join(root, "site.webmanifest");
try {
  const manifest = JSON.parse(read(manifestFile));
  if (!manifest.name || !manifest.short_name || !manifest.start_url || !manifest.icons?.length) addError(manifestFile, "Zorunlu manifest alanları eksik.");
  for (const icon of manifest.icons || []) if (!internalTargetExists(icon.src)) addError(manifestFile, `Manifest ikonu bulunamadı: ${icon.src}.`);
} catch (error) {
  addError(manifestFile, `Manifest JSON geçersiz: ${error.message}.`);
}

function validateSitemapLocations(sitemapFile, locations) {
  const locationSet = new Set();
  for (const location of locations) {
    if (locationSet.has(location)) addError(sitemapFile, `Yinelenen sitemap URL'si: ${location}.`);
    locationSet.add(location);
    let parsed;
    try {
      parsed = new URL(location);
    } catch {
      addError(sitemapFile, `Geçersiz URL: ${location}.`);
      continue;
    }
    if (parsed.origin !== origin) addError(sitemapFile, `Farklı origin kullanılmış: ${location}.`);
    if (!internalTargetExists(parsed.pathname)) addError(sitemapFile, `Sitemap hedefi bulunamadı: ${parsed.pathname}.`);
  }
  for (const route of indexablePages.keys()) {
    const expected = `${origin}${route}`;
    if (!locationSet.has(expected)) addError(sitemapFile, `İndekslenebilir sayfa sitemap'te yok: ${expected}.`);
  }
  for (const location of locationSet) {
    const parsed = new URL(location);
    if (!indexablePages.has(parsed.pathname)) addError(sitemapFile, `Sitemap URL'si indekslenebilir HTML listesinde yok: ${location}.`);
  }
  return locationSet;
}

const sitemapFile = path.join(root, "sitemap.txt");
try {
  const locations = read(sitemapFile)
    .split(/\r?\n/)
    .map((location) => location.trim())
    .filter(Boolean);
  validateSitemapLocations(sitemapFile, locations);
} catch (error) {
  addError(sitemapFile, `Sitemap yapısı geçersiz: ${error.message}.`);
}

const secondarySitemapFile = path.join(root, "sitemap.xml");
if (fs.existsSync(secondarySitemapFile)) {
  try {
    const secondarySitemap = read(secondarySitemapFile);
    if (!/^<\?xml\b/.test(secondarySitemap.trimStart()) || !/<urlset\b/.test(secondarySitemap)) {
      throw new Error("XML başlığı veya urlset eksik");
    }
    const locations = textMatches(secondarySitemap, /<loc>([\s\S]*?)<\/loc>/gi);
    validateSitemapLocations(secondarySitemapFile, locations);
  } catch (error) {
    addError(secondarySitemapFile, `Secondary sitemap yapısı geçersiz: ${error.message}.`);
  }
}

const robotsFile = path.join(root, "robots.txt");
const robots = read(robotsFile);
if (!/User-agent:\s*\*/i.test(robots)) addError(robotsFile, "Genel user-agent kuralı yok.");
if (!new RegExp(`Sitemap:\\s*${origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/sitemap\\.txt`, "i").test(robots)) addError(robotsFile, "Primary TXT sitemap adresi eksik veya yanlış.");

if (warnings.length) {
  console.log(`\nUYARILAR (${warnings.length})`);
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (errors.length) {
  console.error(`\nHATALAR (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`\nDenetim başarılı: ${htmlFiles.length} HTML, ${cssFiles.length} CSS, ${jsFiles.length} JavaScript dosyası kontrol edildi.`);

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const origin = "https://formakutusu.com";

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "preview"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function rel(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function routeFor(file) {
  const value = rel(file);
  if (value === "index.html") return "/";
  if (value.endsWith("/index.html")) return `/${value.slice(0, -"index.html".length)}`;
  return `/${value}`;
}

function metaRobots(html) {
  const match = html.match(/<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']*)["'][^>]*>/i)
    || html.match(/<meta\b[^>]*content=["']([^"']*)["'][^>]*name=["']robots["'][^>]*>/i);
  return (match?.[1] || "").toLowerCase();
}

function isRedirect(html) {
  return /<meta\b[^>]*http-equiv=["']refresh["']/i.test(html);
}

function normalizeHref(href, currentRoute) {
  if (!href) return null;
  const value = href.trim();
  if (!value || value.startsWith("#")) return null;
  if (/^(?:mailto:|tel:|sms:|javascript:|data:|blob:)/i.test(value)) return null;
  if (value.startsWith("//")) return null;

  try {
    if (/^https?:\/\//i.test(value)) {
      const url = new URL(value);
      if (url.origin !== origin) return null;
      return url.pathname.endsWith("/") ? url.pathname : url.pathname;
    }
  } catch {
    return null;
  }

  const clean = value.split("#", 1)[0].split("?", 1)[0];
  if (!clean) return null;
  if (clean.startsWith("/")) return clean;
  const base = currentRoute.endsWith("/") ? currentRoute : `${path.posix.dirname(currentRoute)}/`;
  return path.posix.resolve(base, clean);
}

const pages = new Map();
for (const file of walk(root).filter((file) => file.endsWith(".html"))) {
  const html = fs.readFileSync(file, "utf8");
  const route = routeFor(file);
  if (isRedirect(html)) continue;
  if (metaRobots(html).includes("noindex")) continue;
  if (route === "/404.html" || route === "/404/") continue;
  pages.set(route, { file, html });
}

const outgoing = new Map([...pages.keys()].map((route) => [route, new Set()]));
const incoming = new Map([...pages.keys()].map((route) => [route, new Set()]));

for (const [route, page] of pages) {
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = anchorPattern.exec(page.html))) {
    const target = normalizeHref(match[1], route);
    if (!target || !pages.has(target) || target === route) continue;
    outgoing.get(route).add(target);
    incoming.get(target).add(route);
  }
}

const depth = new Map();
if (pages.has("/")) {
  depth.set("/", 0);
  const queue = ["/"];
  while (queue.length) {
    const route = queue.shift();
    const nextDepth = depth.get(route) + 1;
    for (const target of outgoing.get(route) || []) {
      if (depth.has(target)) continue;
      depth.set(target, nextDepth);
      queue.push(target);
    }
  }
}

const rows = [...pages.keys()]
  .sort((a, b) => {
    const aDepth = depth.has(a) ? depth.get(a) : Number.POSITIVE_INFINITY;
    const bDepth = depth.has(b) ? depth.get(b) : Number.POSITIVE_INFINITY;
    if (aDepth !== bDepth) return aDepth - bDepth;
    return a.localeCompare(b, "tr");
  })
  .map((route) => ({
    route,
    depth: depth.has(route) ? depth.get(route) : null,
    inbound: incoming.get(route)?.size || 0,
    outbound: outgoing.get(route)?.size || 0,
  }));

const orphans = rows.filter((row) => row.route !== "/" && row.inbound === 0);
const unreachable = rows.filter((row) => row.route !== "/" && row.depth === null);
const weak = rows.filter((row) => row.route !== "/" && row.inbound > 0 && row.inbound <= 2);

console.log(`Internal link graph: ${rows.length} indexable pages`);
console.log(`Orphan pages (0 inbound): ${orphans.length}`);
console.log(`Unreachable from home: ${unreachable.length}`);
console.log(`Weak pages (1-2 inbound): ${weak.length}`);

if (orphans.length) {
  console.log("\nORPHAN PAGES");
  for (const row of orphans) console.log(`- ${row.route}`);
}

if (unreachable.length) {
  console.log("\nUNREACHABLE FROM HOME");
  for (const row of unreachable) console.log(`- ${row.route}`);
}

if (weak.length) {
  console.log("\nWEAK INBOUND PAGES");
  for (const row of weak) console.log(`- ${row.route} (${row.inbound} inbound, depth ${row.depth ?? "∞"})`);
}

console.log("\nDEPTH SUMMARY");
const depthCounts = new Map();
for (const row of rows) {
  const key = row.depth === null ? "unreachable" : String(row.depth);
  depthCounts.set(key, (depthCounts.get(key) || 0) + 1);
}
for (const [key, count] of depthCounts) console.log(`- depth ${key}: ${count}`);

// This audit is intentionally non-blocking for now. It gives us a baseline
// before we strengthen the information architecture. Broken links/canonical
// errors remain blocking in tools/audit-site.cjs.

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

const build = spawnSync(process.execPath, [file("tools/build-site.cjs")], {
  cwd: root,
  encoding: "utf8",
  stdio: "inherit",
});
if (build.status !== 0) process.exit(build.status || 1);

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

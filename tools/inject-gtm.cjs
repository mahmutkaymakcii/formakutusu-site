const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const containerId = "GTM-TJL9N3XX";

const headSnippet = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');</script>
<!-- End Google Tag Manager -->`;

const bodySnippet = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${containerId}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

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

let updated = 0;
let skipped = 0;

for (const htmlFile of walk(root).filter((target) => target.endsWith(".html"))) {
  const original = fs.readFileSync(htmlFile, "utf8");
  let html = original;

  if (!html.includes("<!-- Google Tag Manager -->")) {
    html = html.replace(/<head>/i, `<head>\n${headSnippet}`);
  }

  if (!html.includes("<!-- Google Tag Manager (noscript) -->")) {
    html = html.replace(/<body([^>]*)>/i, `<body$1>\n${bodySnippet}`);
  }

  if (html !== original) {
    fs.writeFileSync(htmlFile, `${html.trimEnd()}\n`, "utf8");
    updated += 1;
  } else {
    skipped += 1;
  }
}

console.log(`GTM ${containerId}: updated ${updated} HTML files, skipped ${skipped}.`);

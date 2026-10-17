/*
  Sipariş dosyası yükleme (Cloudflare Pages Function): POST /api/dosya
  Sipariş formundaki logo, reklam, tasarım görselleri ve forma önizlemesi R2'ye (DOSYALAR
  bağlantısı) tahmin edilemez adlarla kaydedilir; dönen bağlantılar WhatsApp mesajına eklenir.
  DOSYALAR bağlı değilse 503 döner ve form dosyaları elle eklemeyi önerir.
*/
const MAX_FILES = 8;
const MAX_FILE = 10 * 1024 * 1024;
const TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};
const ALLOWED_ORIGIN = /^https:\/\/(?:www\.)?formakutusu\.com$|^https:\/\/[a-z0-9-]+\.formakutusu-site\.pages\.dev$|^http:\/\/localhost(?::\d+)?$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("Origin") || "";
  if (!ALLOWED_ORIGIN.test(origin)) return json({ error: "İzin verilmeyen kaynak" }, 403);
  if (!env.DOSYALAR) return json({ error: "Dosya depolama henüz bağlı değil" }, 503);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Form okunamadı" }, 400);
  }
  const files = form.getAll("file").filter((file) => typeof file === "object" && file.size > 0);
  if (!files.length) return json({ error: "Dosya yok" }, 400);
  if (files.length > MAX_FILES) return json({ error: `En fazla ${MAX_FILES} dosya` }, 400);

  // Önce hepsi denetlenir; hatalı bir dosya varsa hiçbiri kaydedilmez
  for (const file of files) {
    if (!TYPES[file.type]) return json({ error: `${file.name}: desteklenmeyen dosya türü` }, 400);
    if (file.size > MAX_FILE) return json({ error: `${file.name}: 10 MB'tan büyük` }, 400);
  }

  const day = new Date().toISOString().slice(0, 10);
  const base = new URL(request.url).origin;
  const saved = [];
  for (const file of files) {
    const ext = TYPES[file.type];
    const key = `${day}/${crypto.randomUUID()}.${ext}`;
    await env.DOSYALAR.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { name: String(file.name || `dosya.${ext}`).slice(0, 120) },
    });
    saved.push({ name: file.name, url: `${base}/dosya/${key}` });
  }
  return json({ files: saved });
}

export const onRequest = () => json({ error: "Yalnızca POST" }, 405);

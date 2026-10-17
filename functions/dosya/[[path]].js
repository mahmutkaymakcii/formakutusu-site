/*
  Sipariş dosyasını gösterir (Cloudflare Pages Function): GET /dosya/<gün>/<uuid>.<uzantı>
  Bağlantıyı yalnızca sipariş mesajını alan bilir. SVG/PDF içindeki betikler çalışmasın diye
  sayfa korumalı (sandbox) sunulur; arama motorlarına kapalıdır.
*/
const KEY = /^\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.(?:png|jpg|webp|svg|pdf)$/;

export async function onRequestGet({ params, env }) {
  const key = [].concat(params.path || []).join("/");
  if (!env.DOSYALAR || !KEY.test(key)) return new Response("Bulunamadı", { status: 404 });
  const object = await env.DOSYALAR.get(key);
  if (!object) return new Response("Bulunamadı", { status: 404 });
  const name = object.customMetadata?.name || key.split("/").pop();
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "private, max-age=3600",
    },
  });
}

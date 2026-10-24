/*
  Forma Kutusu – renkli modeller
  Ana renk ve desen rengi serbestçe değiştirilebilen forma modelleri. Her model, düz forma
  panelini (en-boy oranı 3:4, hazır desen görselleriyle aynı) kodla çizer; önizleme bu paneli
  hazır desen görseli gibi formaya giydirir. Tasarım sihirbazı aynı çizimle model kartlarını üretir.
*/
(() => {
  "use strict";

  // Renk paleti: isimler sipariş mesajına da yazılır
  const PALETTE = [
    ["#111111", "Siyah"], ["#ffffff", "Beyaz"], ["#3a3d42", "Antrasit"], ["#9aa0a6", "Gri"],
    ["#14254f", "Lacivert"], ["#1f4fbf", "Saks mavi"], ["#5aaee8", "Açık mavi"], ["#00a6a6", "Turkuaz"],
    ["#0f5132", "Koyu yeşil"], ["#1f8a4c", "Yeşil"], ["#b5f23d", "Neon yeşil"], ["#ffd400", "Sarı"],
    ["#d4af37", "Gold"], ["#ff7a00", "Turuncu"], ["#c8102e", "Kırmızı"], ["#6d1a2b", "Bordo"],
    ["#5b2a86", "Mor"], ["#ff4f9a", "Pembe"],
  ];

  const hexToRgb = (hex) => {
    const n = Number.parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  // İki rengin karışımı (t = 0 → a, t = 1 → b)
  const mix = (a, b, t) => {
    const [x, y] = [hexToRgb(a), hexToRgb(b)];
    return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`;
  };
  const shade = (hex, t) => mix(hex, t < 0 ? "#000000" : "#ffffff", Math.abs(t));

  // Her model: (g, w, h, ana, desen) ile paneli çizer. Göğüs bölgesi yaklaşık h × 0.18–0.42.
  const MODELS = [
    {
      code: "FK-R-01", name: "Klasik",
      draw(g, w, h, a, b) {
        g.fillStyle = a; g.fillRect(0, 0, w, h);
        g.fillStyle = b;
        for (const x of [0.06, 0.9]) g.fillRect(w * x, 0, w * 0.04, h);
        g.fillRect(0, h * 0.94, w, h * 0.03);
      },
    },
    {
      code: "FK-R-02", name: "Göğüs bandı",
      draw(g, w, h, a, b) {
        g.fillStyle = a; g.fillRect(0, 0, w, h);
        g.fillStyle = b; g.fillRect(0, h * 0.25, w, h * 0.13);
        g.fillStyle = shade(b, 0.35); g.fillRect(0, h * 0.4, w, h * 0.018);
        g.fillRect(0, h * 0.215, w, h * 0.018);
      },
    },
    {
      code: "FK-R-03", name: "Çubuklu",
      draw(g, w, h, a, b) {
        g.fillStyle = a; g.fillRect(0, 0, w, h);
        g.fillStyle = b;
        const n = 9, sw = w / n;
        for (let i = 1; i < n; i += 2) g.fillRect(i * sw, 0, sw, h);
      },
    },
    {
      code: "FK-R-04", name: "Kuşak",
      draw(g, w, h, a, b) {
        g.fillStyle = a; g.fillRect(0, 0, w, h);
        g.save(); g.translate(w / 2, h / 2); g.rotate(-0.72);
        g.fillStyle = b; g.fillRect(-w * 1.2, -w * 0.11, w * 2.4, w * 0.22);
        g.fillStyle = shade(b, -0.3); g.fillRect(-w * 1.2, w * 0.13, w * 2.4, w * 0.025);
        g.restore();
      },
    },
    {
      code: "FK-R-05", name: "V şerit",
      draw(g, w, h, a, b) {
        g.fillStyle = a; g.fillRect(0, 0, w, h);
        const v = (top, thick, color) => {
          g.fillStyle = color; g.beginPath();
          g.moveTo(0, h * top); g.lineTo(w / 2, h * (top + 0.2)); g.lineTo(w, h * top);
          g.lineTo(w, h * (top + thick)); g.lineTo(w / 2, h * (top + 0.2 + thick)); g.lineTo(0, h * (top + thick));
          g.closePath(); g.fill();
        };
        v(0.14, 0.09, b); v(0.26, 0.025, b);
      },
    },
    {
      code: "FK-R-06", name: "İki renk",
      draw(g, w, h, a, b) {
        g.fillStyle = a; g.fillRect(0, 0, w, h);
        g.fillStyle = b; g.fillRect(w / 2, 0, w / 2, h);
      },
    },
    {
      code: "FK-R-07", name: "Degrade",
      draw(g, w, h, a, b) {
        const gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, a); gr.addColorStop(0.45, a); gr.addColorStop(1, b);
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      },
    },
    {
      code: "FK-R-08", name: "İnce çizgi",
      draw(g, w, h, a, b) {
        g.fillStyle = a; g.fillRect(0, 0, w, h);
        g.fillStyle = b;
        const n = 14, sw = w / n;
        for (let i = 0; i < n; i++) g.fillRect(i * sw + sw / 2, 0, Math.max(2, w * 0.008), h);
      },
    },
    {
      code: "FK-R-09", name: "Yatay çizgili",
      draw(g, w, h, a, b) {
        g.fillStyle = a; g.fillRect(0, 0, w, h);
        g.fillStyle = b;
        const n = 10, sh = h / n;
        for (let i = 1; i < n; i += 2) g.fillRect(0, i * sh, w, sh);
      },
    },
    {
      code: "FK-R-10", name: "Yan panel",
      draw(g, w, h, a, b) {
        g.fillStyle = a; g.fillRect(0, 0, w, h);
        g.fillStyle = b;
        for (const side of [0, 1]) {
          g.beginPath();
          const x0 = side ? w : 0, d = side ? -1 : 1;
          g.moveTo(x0, 0); g.lineTo(x0 + d * w * 0.16, 0); g.lineTo(x0 + d * w * 0.24, h * 0.5);
          g.lineTo(x0 + d * w * 0.16, h); g.lineTo(x0, h); g.closePath(); g.fill();
        }
      },
    },
    {
      code: "FK-R-11", name: "Kırık cam",
      draw(g, w, h, a, b) {
        g.fillStyle = a; g.fillRect(0, 0, w, h);
        // Sabit tohumlu üçgenler: model her çizimde aynı görünür
        let seed = 7;
        const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        for (let i = 0; i < 26; i++) {
          const cx = rnd() * w, cy = h * (0.35 + rnd() * 0.7), r = w * (0.08 + rnd() * 0.16);
          g.globalAlpha = 0.25 + rnd() * 0.75;
          g.fillStyle = rnd() > 0.5 ? b : shade(b, -0.25);
          g.beginPath();
          for (let k = 0; k < 3; k++) { const t = rnd() * Math.PI * 2; g.lineTo(cx + Math.cos(t) * r, cy + Math.sin(t) * r); }
          g.closePath(); g.fill();
        }
        g.globalAlpha = 1;
      },
    },
    {
      code: "FK-R-12", name: "Şimşek",
      draw(g, w, h, a, b) {
        g.fillStyle = a; g.fillRect(0, 0, w, h);
        const zig = (y, amp, thick, color) => {
          g.strokeStyle = color; g.lineWidth = thick; g.lineJoin = "miter"; g.beginPath();
          const n = 6;
          for (let i = 0; i <= n; i++) g.lineTo((w * i) / n, y + (i % 2 ? amp : -amp));
          g.stroke();
        };
        zig(h * 0.33, h * 0.04, h * 0.07, b);
        zig(h * 0.43, h * 0.04, h * 0.015, b);
      },
    },
    {
      code: "FK-R-13", name: "Noktalı",
      draw(g, w, h, a, b) {
        g.fillStyle = a; g.fillRect(0, 0, w, h);
        g.fillStyle = b;
        const step = w / 26;
        for (let y = step / 2, row = 0; y < h; y += step, row++) {
          const t = Math.max(0, (y / h - 0.35) / 0.65);
          const r = step * 0.5 * Math.min(1, t * 1.15);
          if (r < 0.6) continue;
          for (let x = (row % 2 ? step / 2 : 0); x < w + step; x += step) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
        }
      },
    },
    {
      code: "FK-R-14", name: "Dalga",
      draw(g, w, h, a, b) {
        g.fillStyle = a; g.fillRect(0, 0, w, h);
        g.strokeStyle = b;
        for (let i = 0; i < 7; i++) {
          g.lineWidth = h * (0.012 + i * 0.006);
          g.beginPath();
          const y0 = h * (0.45 + i * 0.08);
          for (let x = 0; x <= w; x += w / 40) g.lineTo(x, y0 + Math.sin((x / w) * Math.PI * 2.2 + i * 0.5) * h * 0.035);
          g.stroke();
        }
      },
    },
  ];

  // Paneli çizer ve görsel gibi kullanılabilsin diye naturalWidth/Height ekler
  function draw(code, main, accent, w = 620, h = 826, into = null) {
    const model = MODELS.find((m) => m.code === code) || MODELS[0];
    const c = into || document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.clearRect(0, 0, w, h);
    model.draw(g, w, h, main, accent);
    return Object.assign(c, { naturalWidth: w, naturalHeight: h });
  }

  const colorName = (hex) => PALETTE.find(([v]) => v.toLowerCase() === String(hex).toLowerCase())?.[1] || `Özel renk (${String(hex).toUpperCase()})`;

  window.FormaModeller = { PALETTE, MODELS, draw, hexToRgb, colorName, isModel: (code) => /^FK-R-\d+$/.test(code || "") };
})();

/*
  Forma Kutusu – 2.5D forma önizlemesi
  Sipariş formundaki desen, yaka, logo, sırt yazısı ve şort seçimlerini boş bir forma + şort
  render'ı (mockup) üzerine kumaşın ışık ve kırışıklarıyla birlikte uygular.
  Formun data-preview değeri: "gallery" (hazır desenler) ya da "upload" (müşterinin deseni).
  Dosyalar yalnızca tarayıcıda işlenir; hiçbir yere yüklenmez.
*/
(() => {
  "use strict";

  const stage = document.querySelector("[data-preview-stage]");
  const form = document.querySelector("[data-order-form][data-preview]");
  if (!stage || !form) return;

  const MODE = form.dataset.preview;
  const ASSETS = "/assets/onizleme/";
  const view = stage.querySelector("canvas");
  const ctx = view.getContext("2d");
  const status = stage.querySelector("[data-preview-status]");
  const say = (text) => { if (status) status.textContent = text; };

  // Mockup çerçevesi 1848 × 1888. Küçük ekranlarda ve az bellekli cihazlarda daha düşük
  // çözünürlükte çalışılır; tüm ölçüler bu çerçeveye göre ölçeklenir.
  const FW = 1848, FH = 1888;
  const SCALE = window.matchMedia("(max-width: 60rem)").matches || (navigator.deviceMemory && navigator.deviceMemory <= 4) ? 0.6 : 1;
  const W = Math.round(FW * SCALE), H = Math.round(FH * SCALE), N = W * H, k = W / FW;

  const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Görsel yüklenemedi"));
    img.src = src;
  });
  const fileToImage = (file) => loadImage(URL.createObjectURL(file));
  async function loadFont(name, url) {
    const face = new FontFace(name, `url(${url})`);
    await face.load();
    document.fonts.add(face);
  }

  // ---------------------------------------------------------------------------
  // Yaka tipine göre mockup ve yaka bölgeleri (çokgenler 1848 × 1888 çerçevesinde ölçüldü)
  // ---------------------------------------------------------------------------
  const MOCKUPS = {
    "Sıfır yaka": { src: "mockup-sifir.webp", inner: [20, 100] },
    "V yaka": {
      src: "mockup-v.webp", inner: [0, 160], gain: [2.0, 3.6],
      front: [
        { poly: [[405, 0], [411, 15], [410, 27], [412, 39], [417, 51], [425, 63], [435, 77], [449, 96], [470, 120], [500, 139], [520, 155], [538, 162], [558, 150], [577, 137], [600, 120], [620, 100], [627, 85], [639, 73], [649, 59], [656, 45], [660, 30], [657, 19], [650, 14], [656, 0]], r: 5 },
        { poly: [[395, 0], [372, 30], [377, 41], [382, 53], [389, 65], [398, 78], [408, 90], [417, 103], [426, 122], [447, 143], [473, 163], [504, 184], [538, 203], [562, 190], [589, 170], [617, 151], [641, 132], [659, 116], [664, 104], [669, 94], [676, 80], [683, 66], [688, 52], [691, 42], [702, 30], [680, 0]], r: 4 },
      ],
      backEdge: () => 542, backX: [1250, 1535],
    },
    "Polo yaka": {
      src: "mockup-polo.webp", inner: [0, 190], gain: [1.95, 3.6],
      front: [
        { poly: [[410, 8], [418, 40], [424, 90], [458, 131], [364, 170], [351, 62]], r: 4 },
        { poly: [[666, 8], [660, 40], [653, 90], [631, 131], [717, 171], [727, 57]], r: 4 },
        { poly: [[414, 0], [664, 0], [660, 40], [653, 90], [632, 128], [540, 191], [457, 128], [424, 90], [418, 40]], r: 5 },
        { poly: [[424, 152], [457, 126], [632, 126], [659, 152], [540, 237]], r: 4 },
      ],
      backEdge: (x) => 547 + 0.00055 * (x - 1395) ** 2, backX: [1238, 1552],
    },
    // Basketbol ve voleybol: ölçüler görselin kendi pikselinde (native); görsel çerçeveye oranı
    // korunarak yerleştirilir ve ölçüler aşağıda çerçeveye çevrilir. Yaka V; kolluk bantları
    // belirtilen bölgelerde siluet kenarına yakın şerit olarak tek renge boyanır.
    "Basketbol": {
      src: "mockup-basketbol.webp", native: [1078, 1152], inner: [0, 122], gain: [1.05, 1.7],
      front: [
        { poly: [[205, 0], [209, 10], [221, 40], [226, 63], [259, 97], [299, 122], [339, 97], [372, 63], [377, 40], [389, 10], [393, 0]], r: 5 },
        { poly: [[185, 0], [190, 13], [200, 51], [217, 84], [259, 122], [299, 146], [339, 122], [381, 84], [398, 51], [408, 13], [413, 0]], r: 4 },
      ],
      backEdge: (x) => 240 + 0.00048 * (x - 837) ** 2, backX: [650, 1025],
      // Forma eteği (gölge çizgisi ölçüldü: ortada 734, kenarlarda ~725); altı şort
      hem: (x) => 734 - 0.0002 * (x - 300) ** 2,
      // Yaka açıklığı ve bant piksel bazında (zone: arama alanı, dark: açıklık eşiği, band: bant genişliği)
      neck: { zone: [170, 0, 430, 175], dark: 148, band: 22 },
      trims: { band: 26, zones: [
        [[0, 30], [135, 30], [135, 300], [0, 300]], [[465, 30], [600, 30], [600, 300], [465, 300]],
        [[575, 240], [690, 240], [690, 480], [575, 480]], [[990, 240], [1078, 240], [1078, 480], [990, 480]],
      ] },
      layout: {
        logoRight: { x: 164, y: 177, w: 66, h: 38 }, logoLeft: { x: 380, y: 155, w: 75, h: 84 },
        // Ön yüzde göğüs ortasında numara, reklam numaranın altında
        frontNumber: { x: 236, y: 262, w: 140, h: 150 }, sponsor: { x: 175, y: 440, w: 262, h: 100 },
        club: { x: 657, y: 332, w: 360, h: 51 }, number: { x: 701, y: 422, w: 272, h: 239 }, player: { x: 657, y: 697, w: 360, h: 51 },
        shortsLogo: { x: 69, y: 998, w: 82, h: 84 }, shortsNumber: { x: 430, y: 904, w: 107, h: 124 },
      },
    },
    "Voleybol": {
      // frontAnchor: desen önde etek (alt) kısmından hizalanır
      src: "mockup-voleybol.webp", native: [1168, 1160], inner: [0, 163], gain: [1.15, 1.9], noShortsItems: true, frontAnchor: "bottom",
      front: [
        // V yaka merkezi x = 313 (yakın planda yeniden ölçüldü)
        { poly: [[207, 0], [209, 7], [228, 45], [248, 84], [280, 124], [313, 163], [346, 124], [378, 84], [398, 45], [417, 7], [419, 0]], r: 5 },
        { poly: [[184, 0], [187, 22], [208, 60], [229, 99], [270, 140], [313, 182], [356, 140], [397, 99], [418, 60], [439, 22], [442, 0]], r: 4 },
      ],
      backEdge: () => 186, backX: [798, 1018],
      neck: { zone: [165, 0, 465, 215], dark: 148, band: 20 },
      // Forma eteği kavisli (ortada aşağıda); forma ile şort bu çizgiden ayrılır
      hem: (x) => 877 - 0.00047 * (x - 313) ** 2,
      trims: { band: 20, zones: [
        [[0, 60], [90, 60], [90, 310], [0, 310]], [[520, 60], [640, 60], [640, 310], [520, 310]],
        [[640, 220], [710, 220], [710, 470], [640, 470]], [[1100, 220], [1168, 220], [1168, 470], [1100, 470]],
      ] },
      layout: {
        logoRight: { x: 166, y: 215, w: 70, h: 40 }, logoLeft: { x: 398, y: 190, w: 80, h: 89 },
        frontNumber: { x: 246, y: 300, w: 134, h: 150 }, sponsor: { x: 177, y: 470, w: 272, h: 100 },
        club: { x: 738, y: 298, w: 340, h: 54 }, number: { x: 765, y: 404, w: 285, h: 251 }, player: { x: 738, y: 702, w: 340, h: 54 },
      },
    },
  };
  // Native ölçülü mockup'ları çerçeve koordinatına çevir (oran korunarak ortalanmış yerleşim)
  for (const cfg of Object.values(MOCKUPS)) {
    if (!cfg.native) continue;
    const [nw, nh] = cfg.native, fs = Math.min(FW / nw, FH / nh);
    const ox = (FW - nw * fs) / 2, oy = (FH - nh * fs) / 2;
    const pt = ([x, y]) => [x * fs + ox, y * fs + oy];
    cfg.fit = { fs, ox, oy };
    cfg.front = cfg.front.map((p) => ({ ...p, poly: p.poly.map(pt) }));
    const edge = cfg.backEdge;
    cfg.backEdge = (xf) => edge((xf - ox) / fs) * fs + oy;
    if (cfg.hem) { const hem = cfg.hem; cfg.hem = (xf) => hem((xf - ox) / fs) * fs + oy; }
    if (cfg.neck) {
      const [x0, y0, x1, y1] = cfg.neck.zone;
      cfg.neck = { ...cfg.neck, zone: [x0 * fs + ox, y0 * fs + oy, x1 * fs + ox, y1 * fs + oy], band: cfg.neck.band * fs };
    }
    cfg.backX = cfg.backX.map((x) => x * fs + ox);
    cfg.inner = cfg.inner.map((y) => y * fs + oy);
    if (cfg.trims) cfg.trims = { band: cfg.trims.band * fs, zones: cfg.trims.zones.map((z) => z.map(pt)) };
    if (cfg.layout) for (const b of Object.values(cfg.layout)) { b.x = b.x * fs + ox; b.y = b.y * fs + oy; b.w *= fs; b.h *= fs; }
  }
  const inPoly = (x, y, pts) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };

  function boxBlur(src, r) {
    const tmp = new Float32Array(N), out = new Float32Array(N), d = 2 * r + 1;
    for (let y = 0; y < H; y++) {
      let s = 0; const o = y * W;
      for (let x = -r; x <= r; x++) s += src[o + Math.min(W - 1, Math.max(0, x))];
      for (let x = 0; x < W; x++) { tmp[o + x] = s / d; s += src[o + Math.min(W - 1, x + r + 1)] - src[o + Math.max(0, x - r)]; }
    }
    for (let x = 0; x < W; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
      for (let y = 0; y < H; y++) { out[y * W + x] = s / d; s += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x]; }
    }
    return out;
  }

  // Bölgeler: 0 arka plan, 1 forma ön (kollar dahil), 2 forma arka, 3 şort,
  // 4 ön yaka, 5 yakanın iç görünümü, 6 arka yaka
  function analyseMockup(img, cfg) {
    const c = Object.assign(document.createElement("canvas"), { width: W, height: H });
    const cx = c.getContext("2d", { willReadFrequently: true });
    cx.imageSmoothingQuality = "high";
    if (cfg.fit) cx.drawImage(img, cfg.fit.ox * k, cfg.fit.oy * k, cfg.native[0] * cfg.fit.fs * k, cfg.native[1] * cfg.fit.fs * k);
    else cx.drawImage(img, 0, 0, W, H);
    const data = cx.getImageData(0, 0, W, H).data;
    const lum = new Float32Array(N);
    for (let i = 0; i < N; i++) lum[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];

    // 1) Arka plan: kenarlardan taşma doldurma (şeffaf ya da neredeyse beyaz pikseller)
    const bg = new Uint8Array(N);
    const isBg = (i) => data[i * 4 + 3] < 24 ||
      (lum[i] >= 244 && Math.max(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]) - Math.min(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]) < 10);
    const stack = [];
    const push = (i) => { if (!bg[i] && isBg(i)) { bg[i] = 1; stack.push(i); } };
    for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
    while (stack.length) {
      const i = stack.pop(), x = i % W, y = (i - x) / W;
      if (x > 0) push(i - 1); if (x < W - 1) push(i + 1);
      if (y > 0) push(i - W); if (y < H - 1) push(i + W);
    }

    // 2) Parçalar: maske daraltılıp bileşenler bulunur, sonra tüm kumaşa geri yayılır
    const R = Math.max(3, Math.round(Math.min(W, H) * 0.006));
    const sat = new Int32Array((W + 1) * (H + 1));
    for (let y = 0; y < H; y++) {
      let row = 0;
      for (let x = 0; x < W; x++) { row += bg[y * W + x] ? 0 : 1; sat[(y + 1) * (W + 1) + x + 1] = sat[y * (W + 1) + x + 1] + row; }
    }
    const eroded = new Uint8Array(N), full = (2 * R + 1) ** 2;
    for (let y = R; y < H - R; y++) for (let x = R; x < W - R; x++) {
      const a = sat[(y - R) * (W + 1) + (x - R)], b = sat[(y - R) * (W + 1) + (x + R + 1)];
      const c2 = sat[(y + R + 1) * (W + 1) + (x - R)], d = sat[(y + R + 1) * (W + 1) + (x + R + 1)];
      if (d - b - c2 + a === full) eroded[y * W + x] = 1;
    }
    const comp = new Int32Array(N).fill(-1), comps = [];
    for (let s = 0; s < N; s++) {
      if (!eroded[s] || comp[s] >= 0) continue;
      const id = comps.length; let n = 0;
      comp[s] = id; stack.push(s);
      while (stack.length) {
        const i = stack.pop(), x = i % W, y = (i - x) / W; n++;
        if (x > 0 && eroded[i - 1] && comp[i - 1] < 0) { comp[i - 1] = id; stack.push(i - 1); }
        if (x < W - 1 && eroded[i + 1] && comp[i + 1] < 0) { comp[i + 1] = id; stack.push(i + 1); }
        if (y > 0 && eroded[i - W] && comp[i - W] < 0) { comp[i - W] = id; stack.push(i - W); }
        if (y < H - 1 && eroded[i + W] && comp[i + W] < 0) { comp[i + W] = id; stack.push(i + W); }
      }
      comps.push({ id, n });
    }
    const bigIds = new Set(comps.filter((cc) => cc.n > N * 0.01).map((cc) => cc.id));
    for (let i = 0; i < N; i++) if (comp[i] >= 0 && !bigIds.has(comp[i])) comp[i] = -1;
    let queue = [];
    for (let i = 0; i < N; i++) if (comp[i] >= 0) queue.push(i);
    while (queue.length) {
      const next = [];
      for (const i of queue) {
        const x = i % W, y = (i - x) / W;
        for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
          if (j >= 0 && !bg[j] && comp[j] < 0) { comp[j] = comp[i]; next.push(j); }
        }
      }
      queue = next;
    }
    const stats = new Map();
    for (let i = 0; i < N; i++) {
      const id = comp[i]; if (id < 0) continue;
      const x = i % W, y = (i - x) / W;
      const st = stats.get(id) || { id, n: 0, sx: 0, minX: W, maxX: 0, minY: H, maxY: 0 };
      st.n++; st.sx += x;
      if (x < st.minX) st.minX = x; if (x > st.maxX) st.maxX = x; if (y < st.minY) st.minY = y; if (y > st.maxY) st.maxY = y;
      stats.set(id, st);
    }
    const big = [...stats.values()].map((st) => ({ ...st, cx: st.sx / st.n }));
    const back = big.reduce((a, b) => (b.cx > a.cx ? b : a));
    const left = big.filter((cc) => cc !== back);
    let hemY;
    if (left.length >= 2) { left.sort((a, b) => a.minY - b.minY); hemY = left[0].maxY + 1; }
    else {
      const L = left[0];
      hemY = Math.round(L.minY + (L.maxY - L.minY) * 0.684);
      for (let y = Math.round(L.minY + (L.maxY - L.minY) * 0.6); y < L.minY + (L.maxY - L.minY) * 0.75; y++) {
        let cnt = 0;
        for (let x = L.minX; x <= L.maxX; x++) if (comp[y * W + x] === L.id) cnt++;
        if (cnt < 4) { hemY = y; break; }
      }
    }
    const leftIds = new Set(left.map((cc) => cc.id));
    const region = new Uint8Array(N);
    const boxes = { front: [W, H, 0, 0], back: [W, H, 0, 0], shorts: [W, H, 0, 0] };
    const grow = (b, x, y) => { if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y; };
    for (let i = 0; i < N; i++) {
      const id = comp[i]; if (id < 0) continue;
      const x = i % W, y = (i - x) / W;
      if (id === back.id) { region[i] = 2; grow(boxes.back, x, y); }
      else if (leftIds.has(id)) {
        const shirt = cfg.hem ? y < cfg.hem(x / k) * k : y < hemY;
        if (shirt) { region[i] = 1; grow(boxes.front, x, y); } else { region[i] = 3; grow(boxes.shorts, x, y); }
      }
    }

    // 2b) Yaka bölgeleri (ölçüler çerçeve pikselinde; x/k, y/k ile karşılaştırılır)
    const NX = 533, NY = 40;
    const sup = (x, y, rx, ry) => Math.abs((x - NX) / rx) ** 3 + Math.abs((y - NY) / ry) ** 3;
    const backTop = boxes.back[1] / k;
    const frontMax = cfg.front ? Math.max(...cfg.front.flatMap((p) => p.poly.map((q) => q[1]))) + 2 : 0;
    for (let i = 0; i < N; i++) {
      const r = region[i]; if (r !== 1 && r !== 2) continue;
      const x = (i % W) / k, y = Math.floor(i / W) / k;
      if (!cfg.front) {
        if (r === 1 && y < 160) {
          if (y >= 20 && sup(x, y, 128, 60) <= 1) region[i] = 5;
          else if (sup(x, y, 160, 99) <= 1) region[i] = 4;
        } else if (r === 2 && y < backTop + 70 && data[i * 4 + 3] < 250) region[i] = 6;
      } else if (r === 1 && y < frontMax) {
        const hit = cfg.front.find((p) => inPoly(x, y, p.poly));
        if (hit) region[i] = hit.r;
      } else if (r === 2 && x >= cfg.backX[0] && x <= cfg.backX[1] && y <= cfg.backEdge(x)) region[i] = 6;
    }

    // 2b') Basketbol/voleybol yakası piksel bazında: yaka açıklığı (iç görünüm) koyu tonlu; içindeki
    //      açık tonlu etiket gibi boşluklar dolgu ile eklenir. V bant, açıklığın çevresinde sabit
    //      genişlikte şerittir. Böylece ne bantta desen ne içeride karanlık leke kalır.
    if (cfg.neck) {
      const [zx0, zy0, zx1, zy1] = cfg.neck.zone.map((v) => Math.round(v * k));
      const zw = zx1 - zx0 + 1, zh = zy1 - zy0 + 1, Z = zw * zh;
      const zi = (x, y) => (zy0 + y) * W + zx0 + x;
      const dark = new Uint8Array(Z), seen = new Uint8Array(Z);
      for (let y = 0; y < zh; y++) for (let x = 0; x < zw; x++) {
        const i = zi(x, y), r = region[i];
        if (r === 4 || r === 5) region[i] = 1;
        if (region[i] === 1 && lum[i] < cfg.neck.dark) dark[y * zw + x] = 1;
      }
      // Bölge kenarından koyu olmayan piksellerle ulaşılamayan yerler açıklığın içidir
      const q = [];
      for (let x = 0; x < zw; x++) for (const y of [0, zh - 1]) if (!dark[y * zw + x]) { seen[y * zw + x] = 1; q.push(y * zw + x); }
      for (let y = 0; y < zh; y++) for (const x of [0, zw - 1]) if (!dark[y * zw + x] && !seen[y * zw + x]) { seen[y * zw + x] = 1; q.push(y * zw + x); }
      while (q.length) {
        const j = q.pop(), x = j % zw, y = (j - x) / zw;
        for (const n of [x > 0 ? j - 1 : -1, x < zw - 1 ? j + 1 : -1, y > 0 ? j - zw : -1, y < zh - 1 ? j + zw : -1]) {
          if (n >= 0 && !seen[n] && !dark[n]) { seen[n] = 1; q.push(n); }
        }
      }
      const dist = new Float32Array(Z).fill(1e9);
      let maxY = 0;
      for (let y = 0; y < zh; y++) for (let x = 0; x < zw; x++) {
        const j = y * zw + x, i = zi(x, y);
        if (region[i] === 1 && (dark[j] || !seen[j])) { region[i] = 5; dist[j] = 0; maxY = Math.max(maxY, y); }
      }
      for (let y = 0; y < zh; y++) for (let x = 0; x < zw; x++) {
        const j = y * zw + x; let v = dist[j]; if (!v) continue;
        if (x > 0) v = Math.min(v, dist[j - 1] + 1);
        if (y > 0) { v = Math.min(v, dist[j - zw] + 1); if (x > 0) v = Math.min(v, dist[j - zw - 1] + 1.4); if (x < zw - 1) v = Math.min(v, dist[j - zw + 1] + 1.4); }
        dist[j] = v;
      }
      for (let y = zh - 1; y >= 0; y--) for (let x = zw - 1; x >= 0; x--) {
        const j = y * zw + x; let v = dist[j]; if (!v) continue;
        if (x < zw - 1) v = Math.min(v, dist[j + 1] + 1);
        if (y < zh - 1) { v = Math.min(v, dist[j + zw] + 1); if (x < zw - 1) v = Math.min(v, dist[j + zw + 1] + 1.4); if (x > 0) v = Math.min(v, dist[j + zw - 1] + 1.4); }
        dist[j] = v;
      }
      const D = cfg.neck.band * k, yLim = maxY + D * 1.4;
      for (let y = 0; y < zh; y++) for (let x = 0; x < zw; x++) {
        const i = zi(x, y);
        if (region[i] === 1 && dist[y * zw + x] <= D && y <= yLim) region[i] = 4;
      }
    }

    // 2c) Kolsuz modellerde kolluk bantları: bölge içinde siluet kenarına "band" kadar yakın kumaş
    if (cfg.trims) {
      // Arka plana uzaklık (iki geçişli 3-4 chamfer, çerçeve pikseli ölçeğinde)
      const dist = new Float32Array(N);
      for (let i = 0; i < N; i++) dist[i] = bg[i] ? 0 : 1e9;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x; let v = dist[i]; if (!v) continue;
        if (x > 0) v = Math.min(v, dist[i - 1] + 1);
        if (y > 0) { v = Math.min(v, dist[i - W] + 1); if (x > 0) v = Math.min(v, dist[i - W - 1] + 1.4); if (x < W - 1) v = Math.min(v, dist[i - W + 1] + 1.4); }
        dist[i] = v;
      }
      for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
        const i = y * W + x; let v = dist[i]; if (!v) continue;
        if (x < W - 1) v = Math.min(v, dist[i + 1] + 1);
        if (y < H - 1) { v = Math.min(v, dist[i + W] + 1); if (x < W - 1) v = Math.min(v, dist[i + W + 1] + 1.4); if (x > 0) v = Math.min(v, dist[i + W - 1] + 1.4); }
        dist[i] = v;
      }
      const band = cfg.trims.band * k;
      for (let i = 0; i < N; i++) {
        const r = region[i]; if ((r !== 1 && r !== 2) || dist[i] > band) continue;
        const x = (i % W) / k, y = Math.floor(i / W) / k;
        if (cfg.trims.zones.some((z) => inPoly(x, y, z))) region[i] = r === 1 ? 4 : 6;
      }
    }

    // 3) Işık haritası: kumaşın ortanca tonu 1.0. Geniş aydınlatma ve ince kırışıklar güçlendirilir;
    //    koyu taraf çarpma (multiply), açık taraf ekran (screen) olarak uygulanır.
    const percentile = (test, q) => {
      const s = [];
      for (let i = 0; i < N; i += 7) if (test(region[i]) && lum[i] > 60) s.push(lum[i]);
      s.sort((a, b) => a - b);
      return s[Math.floor(s.length * q)];
    };
    const mid = percentile((r) => r && r !== 5 && r !== 6, 0.5) || 185;
    const midCollar = percentile((r) => r === 6, 0.5) || mid;
    const [BROAD, FINE] = cfg.gain || [2.6, 4.2];
    const mask = new Float32Array(N), ml = new Float32Array(N);
    for (let i = 0; i < N; i++) if (region[i]) { mask[i] = 1; ml[i] = lum[i]; }
    const R1 = Math.max(4, Math.round(14 * k));
    const bm = boxBlur(boxBlur(mask, R1), R1), bl = boxBlur(boxBlur(ml, R1), R1);
    const localL = new Float32Array(N);
    for (let i = 0; i < N; i++) localL[i] = bm[i] > 0.05 ? bl[i] / bm[i] : lum[i];
    const shade = new Float32Array(N), gloss = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const r = region[i]; if (!r) continue;
      if (r === 5) {
        const y = Math.floor(i / W) / k, [i0, i1] = cfg.inner;
        shade[i] = 0.8 - 0.18 * Math.min(1, Math.max(0, (y - i0) / (i1 - i0)));
        continue;
      }
      const ref = r === 6 ? midCollar : mid, local = localL[i];
      const T = Math.max(0.22, Math.min(1.8, 1 + (local / ref - 1) * BROAD + (lum[i] / Math.max(1, local) - 1) * FINE));
      // Kenar gölgesi: siluete yaklaştıkça hafif kararma (hacim)
      const ao = 0.72 + 0.28 * Math.min(1, Math.max(0, (bm[i] - 0.5) / 0.42));
      shade[i] = Math.min(1, T) * ao;
      gloss[i] = Math.min(0.55, Math.max(0, T - 1) * 0.9) * ao;
    }

    // Desen bükülmesi: desen ışık eğimine göre birkaç piksel kaydırılır, kıvrımlara oturur
    const dispX = new Int8Array(N), dispY = new Int8Array(N);
    const sd = Math.max(2, Math.round(5 * k)), DISP = 16 * k * 60;
    for (let y = sd; y < H - sd; y++) for (let x = sd; x < W - sd; x++) {
      const i = y * W + x, r = region[i];
      if (r !== 1 && r !== 2 && r !== 3) continue;
      dispX[i] = Math.max(-8, Math.min(8, Math.round(((localL[i + sd] - localL[i - sd]) / (2 * sd * 255)) * DISP)));
      dispY[i] = Math.max(-8, Math.min(8, Math.round(((localL[i + sd * W] - localL[i - sd * W]) / (2 * sd * 255)) * DISP)));
    }

    // 4) Kenar yumuşatma (3×3)
    const alpha = new Float32Array(N);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x; let s = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += region[i + dy * W + dx] ? 1 : 0;
      alpha[i] = s / 9;
    }
    const opaque = data[3] === 255 && data[(N - 1) * 4 + 3] === 255;
    const dark = new Uint8Array(N); // yaka içindeki koyu etiket gibi çok koyu pikseller
    for (let i = 0; i < N; i++) dark[i] = lum[i] < 70 ? 1 : 0;
    return { base: data, region, alpha, shade, gloss, dispX, dispY, boxes, dark, opaque };
  }

  // ---------------------------------------------------------------------------
  // Yardımcılar
  // ---------------------------------------------------------------------------
  function mainColorOf(img) {
    const w = 48, h = Math.max(1, Math.round((48 * img.naturalHeight) / img.naturalWidth));
    const c = Object.assign(document.createElement("canvas"), { width: w, height: h });
    const cx = c.getContext("2d", { willReadFrequently: true }); cx.drawImage(img, 0, 0, w, h);
    const d = cx.getImageData(0, 0, w, h).data, buckets = new Map();
    for (let i = 0; i < d.length; i += 4) {
      const key = (d[i] >> 4) + "," + (d[i + 1] >> 4) + "," + (d[i + 2] >> 4);
      const b = buckets.get(key) || [0, 0, 0, 0]; b[0] += d[i]; b[1] += d[i + 1]; b[2] += d[i + 2]; b[3]++; buckets.set(key, b);
    }
    let best = null; for (const b of buckets.values()) if (!best || b[3] > best[3]) best = b;
    return [0, 1, 2].map((n) => Math.round(best[n] / best[3]));
  }
  function drawFit(g, img, cx, cy, maxW, maxH) {
    const r = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    const w = img.naturalWidth * r, h = img.naturalHeight * r;
    g.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  }
  // anchor "bottom": görselin alt kenarı kutunun alt kenarına (etek) hizalanır; varsayılan ortalı
  function drawCover(g, img, box, anchor = "center") {
    const [x0, y0, x1, y1] = box, bw = x1 - x0, bh = y1 - y0;
    const r = Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
    const w = img.naturalWidth * r, h = img.naturalHeight * r;
    g.drawImage(img, x0 + (bw - w) / 2, anchor === "bottom" ? y1 - h : y0 + (bh - h) / 2, w, h);
  }
  const drawInBox = (g, img, b) => drawFit(g, img, b.x + b.w / 2, b.y + b.h / 2, b.w, b.h);
  // Kutuya yazı: kutunun yüksekliği harf yüksekliğidir (isimde "H", numarada rakamlar)
  const REF = { FIBA: "H", NoraNumara: "0123456789" };
  function refMetrics(g, font) {
    g.font = `100px "${font}"`;
    const m = g.measureText(REF[font]);
    return { asc: m.actualBoundingBoxAscent / 100, desc: m.actualBoundingBoxDescent / 100 };
  }
  function sizeInBox(g, text, font, box) {
    const r = refMetrics(g, font);
    let s = box.h / (r.asc + r.desc);
    if (text) { g.font = `100px "${font}"`; s = Math.min(s, (box.w / g.measureText(text).width) * 100); }
    return s;
  }
  function textInBox(g, text, font, box, size, color) {
    if (!text) return;
    const r = refMetrics(g, font);
    g.font = `${size}px "${font}"`;
    g.fillStyle = color; g.textAlign = "center"; g.textBaseline = "alphabetic";
    g.fillText(text, box.x + box.w / 2, box.y + box.h / 2 + ((r.asc - r.desc) * size) / 2);
  }

  // Onaylı FK-001 yerleşimi (1848 × 1888 çerçevesinde; logolar kutuya sığar, yazılarda kutu yüksekliği harf yüksekliği)
  const LAYOUT = {
    logoRight: { x: 319, y: 312, w: 106, h: 61 },
    logoLeft: { x: 660, y: 277, w: 121, h: 135 },
    sponsor: { x: 309, y: 474, w: 471, h: 180 },
    club: { x: 1114, y: 700, w: 538, h: 83 },
    number: { x: 1171, y: 852, w: 439, h: 386 },
    player: { x: 1099, y: 1302, w: 538, h: 83 },
    shortsLogo: { x: 225, y: 1695, w: 132, h: 135 },
    shortsNumber: { x: 769, y: 1522, w: 173, h: 200 },
  };
  // Basketbol ve voleybolun kendi yerleşimi var (çerçeveye çevrilmiş); diğerleri FK-001 yerleşimi
  const layoutFor = (cfg) => Object.fromEntries(Object.entries(cfg.layout || LAYOUT).map(([id, b]) => [id, { x: b.x * k, y: b.y * k, w: b.w * k, h: b.h * k }]));

  // TR arması (sol göğüste "TR Arma" seçildiğinde): kırmızı zemin üzerinde ay yıldız
  function trCrest() {
    const c = Object.assign(document.createElement("canvas"), { width: 300, height: 340 });
    const g = c.getContext("2d");
    g.fillStyle = "#e30a17";
    g.beginPath(); g.moveTo(20, 20); g.lineTo(280, 20); g.lineTo(280, 200);
    g.quadraticCurveTo(280, 290, 150, 330); g.quadraticCurveTo(20, 290, 20, 200); g.closePath(); g.fill();
    g.fillStyle = "#fff";
    g.beginPath(); g.arc(128, 165, 70, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#e30a17";
    g.beginPath(); g.arc(146, 165, 56, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#fff"; g.beginPath();
    for (let n = 0; n < 10; n++) {
      const a = -Math.PI / 2 + (n * Math.PI) / 5, rr = n % 2 ? 15 : 37;
      g.lineTo(212 + Math.cos(a) * rr, 165 + Math.sin(a) * rr);
    }
    g.closePath(); g.fill();
    g.font = "800 46px sans-serif"; g.textAlign = "center"; g.fillText("TR", 150, 82);
    return Object.assign(c, { naturalWidth: 300, naturalHeight: 340 });
  }

  // ---------------------------------------------------------------------------
  // Durum ve formdan okunan seçimler
  // ---------------------------------------------------------------------------
  const state = {
    analysis: null, collar: "", wantCollar: "",
    pattern: null, patternCode: "", mainColor: [0, 143, 135],
    samples: { left: null, right: null, sponsor: null }, uploads: {}, tr: null,
    scene: null, sceneCanvas: null, sceneKey: "", ready: false,
  };
  const analyses = {};
  const el = (name) => form.elements[name];
  const isOn = (name) => Boolean(el(name)?.checked);
  const val = (name) => el(name)?.value || "";
  const hideShorts = () => val("scope") === "ust";
  // Branş: özel üretimde seçimden, model sayfalarında formdan. Basketbol ve voleybolda kendi
  // mockup'ı (V yaka) kullanılır; futbolda yaka tipine göre.
  const sport = () => val("sport") || form.dataset.sport || "futbol";
  const mockupKey = () => (sport() === "basketbol" ? "Basketbol" : sport() === "voleybol" ? "Voleybol" : val("collar"));

  function logo(slot, name) {
    if (isOn(`${name}-none`)) return null;
    if (name === "logo-left" && isOn(`${name}-alt`)) return (state.tr ||= trCrest());
    return state.uploads[name] || state.samples[slot];
  }

  async function useCollar(type) {
    if (!MOCKUPS[type]) type = "Sıfır yaka";
    state.wantCollar = type;
    if (state.collar === type) return;
    if (!analyses[type]) {
      say("Model hazırlanıyor…");
      const img = await loadImage(ASSETS + MOCKUPS[type].src);
      await new Promise((r) => setTimeout(r, 0));
      analyses[type] ||= analyseMockup(img, MOCKUPS[type]);
    }
    if (state.wantCollar !== type) return;
    state.analysis = analyses[type]; state.collar = type; state.sceneKey = "";
    state.cfg = MOCKUPS[type]; state.P = layoutFor(MOCKUPS[type]);
  }

  function setPattern(img, code) {
    state.pattern = img; state.patternCode = code;
    state.mainColor = mainColorOf(img);
  }

  // ---------------------------------------------------------------------------
  // Çizim
  // ---------------------------------------------------------------------------
  const tex = Object.assign(document.createElement("canvas"), { width: W, height: H });
  const texBack = Object.assign(document.createElement("canvas"), { width: W, height: H });
  const texShorts = Object.assign(document.createElement("canvas"), { width: W, height: H });
  const gar = Object.assign(document.createElement("canvas"), { width: W, height: H });
  const textColor = () => (form.querySelector('input[name="text-color"]:checked')?.value) || "#ffffff";

  function drawScene(c, shadows) {
    if (state.scene) drawCover(c, state.scene, [0, 0, W, H]); else { c.fillStyle = "#0b0b0d"; c.fillRect(0, 0, W, H); }
    for (const [x, y, rx, s] of shadows) {
      const gr = c.createRadialGradient(x, y, 0, x, y, rx);
      gr.addColorStop(0, `rgba(0,0,0,${0.75 * s})`); gr.addColorStop(1, "rgba(0,0,0,0)");
      c.save(); c.translate(x, y); c.scale(1, 0.14); c.translate(-x, -y);
      c.fillStyle = gr; c.beginPath(); c.arc(x, y, rx, 0, Math.PI * 2); c.fill(); c.restore();
    }
  }

  function render() {
    const A = state.analysis; if (!A || !state.pattern) return;
    const { boxes } = A, noShorts = hideShorts();
    const [sx0, sy0, sx1, sy1] = boxes.shorts;
    const solid = state.mainColor;
    const g = tex.getContext("2d", { willReadFrequently: true });
    g.clearRect(0, 0, W, H);
    g.filter = "blur(0.6px)"; // vektör desenin keskin kenarlarını kumaşa yaklaştırır
    // Ön ve arka ayrı katmanlarda: görüntüde ön kol ile arka parçanın kutuları üst üste
    // bindiğinden tek katmanda arka desen ön kolun üzerine yazılıyordu
    const gb = texBack.getContext("2d", { willReadFrequently: true });
    gb.clearRect(0, 0, W, H);
    gb.filter = "blur(0.6px)";
    drawCover(g, state.pattern, boxes.front, state.cfg.frontAnchor); drawCover(gb, state.pattern, boxes.back);
    g.filter = "none"; gb.filter = "none";
    // Şort ayrı katmanda düz renk: kavisli etekte şort dikdörtgeni formanın alt kısmını kesiyordu
    const gs = texShorts.getContext("2d", { willReadFrequently: true });
    gs.fillStyle = `rgb(${solid.join(",")})`; gs.fillRect(0, 0, W, H);

    const P = state.P;
    const L = { right: logo("right", "logo-right"), left: logo("left", "logo-left"), sponsor: logo("sponsor", "sponsor") };
    if (L.right) drawInBox(g, L.right, P.logoRight);
    if (L.left) drawInBox(g, L.left, P.logoLeft);
    if (L.sponsor) drawInBox(g, L.sponsor, P.sponsor);
    const color = textColor();
    const club = (val("back-text").trim() || "KULÜP İSMİ").toLocaleUpperCase("tr-TR");
    const player = isOn("has-name") || !el("has-name") ? "OYUNCU" : "";
    const num = isOn("has-number") || !el("has-number") ? "10" : "";
    const nameSize = Math.min(sizeInBox(g, club, "FIBA", P.club), sizeInBox(g, player || club, "FIBA", P.player));
    textInBox(gb, club, "FIBA", P.club, nameSize, color);
    textInBox(gb, num, "NoraNumara", P.number, sizeInBox(g, num, "NoraNumara", P.number), color);
    textInBox(gb, player, "FIBA", P.player, nameSize, color);
    // Basketbol ve voleybolda ön yüzde de numara
    if (P.frontNumber && num) textInBox(g, num, "NoraNumara", P.frontNumber, sizeInBox(g, num, "NoraNumara", P.frontNumber), color);
    // Voleybolda şorta logo ve numara eklenmez
    const shortsItems = !state.cfg.noShortsItems && sport() !== "voleybol";
    if (shortsItems && isOn("shorts-logo") && L.left) drawInBox(gs, L.left, P.shortsLogo);
    if (shortsItems && isOn("shorts-number") && num) textInBox(gs, num, "NoraNumara", P.shortsNumber, sizeInBox(g, num, "NoraNumara", P.shortsNumber), color);

    // Birleştirme: bükülmüş doku × gölge + sıcak parlaklık, ardından canlılık
    const tf = g.getImageData(0, 0, W, H).data, tb = gb.getImageData(0, 0, W, H).data, ts = gs.getImageData(0, 0, W, H).data;
    const out = new ImageData(W, H), o = out.data, b = A.base;
    const GL = [255, 238, 210], SAT = 1.45, LIFT = 1.12;
    for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i++) {
      const p = i * 4, reg = A.region[i], a = A.alpha[i];
      if (!reg || a === 0 || (noShorts && reg === 3)) { o[p + 3] = 0; continue; }
      if (A.dark[i] && reg < 4) { o[p] = b[p]; o[p + 1] = b[p + 1]; o[p + 2] = b[p + 2]; o[p + 3] = A.opaque ? Math.round(a * 255) : b[p + 3]; continue; }
      let r0, g0, b0;
      if (reg >= 4) [r0, g0, b0] = solid;
      else {
        const sx = Math.min(W - 1, Math.max(0, x + A.dispX[i])), sy = Math.min(H - 1, Math.max(0, y + A.dispY[i]));
        const t = reg === 2 ? tb : reg === 3 ? ts : tf; // her parça kendi katmanından
        const tq = (sy * W + sx) * 4; r0 = t[tq]; g0 = t[tq + 1]; b0 = t[tq + 2];
      }
      const s = A.shade[i], gl = A.gloss[i];
      let r = r0 * s, gg = g0 * s, bl = b0 * s;
      r += (GL[0] - r) * gl; gg += (GL[1] - gg) * gl; bl += (GL[2] - bl) * gl;
      const Y = 0.299 * r + 0.587 * gg + 0.114 * bl;
      r = (Y + (r - Y) * SAT) * LIFT; gg = (Y + (gg - Y) * SAT) * LIFT; bl = (Y + (bl - Y) * SAT) * LIFT;
      const m = A.opaque || b[p + 3] < 255 ? 1 : a;
      o[p] = Math.min(255, Math.max(0, r)) * m + b[p] * (1 - m);
      o[p + 1] = Math.min(255, Math.max(0, gg)) * m + b[p + 1] * (1 - m);
      o[p + 2] = Math.min(255, Math.max(0, bl)) * m + b[p + 2] * (1 - m);
      o[p + 3] = A.opaque ? Math.round(a * 255) : reg === 6 && b[p + 3] > 180 ? 255 : b[p + 3];
    }
    gar.getContext("2d").putImageData(out, 0, 0);

    // Sahne (gölgeler önbellekte); ürünler biraz küçültülüp zemine oturtulur
    const scale = 0.84, ox = (W - W * scale) / 2, oy = H * 0.035;
    const key = `${state.collar}|${noShorts}`;
    if (state.sceneKey !== key) {
      const [bx0, , bx1, by1] = boxes.back;
      const map = (x, y) => [ox + x * scale, oy + y * scale];
      const [shX, shY] = map((sx0 + sx1) / 2, noShorts ? boxes.front[3] : sy1);
      const [bkX, bkY] = map((bx0 + bx1) / 2, by1);
      const sc = state.sceneCanvas ||= Object.assign(document.createElement("canvas"), { width: W, height: H });
      const c = sc.getContext("2d");
      c.clearRect(0, 0, W, H);
      drawScene(c, [[shX, Math.max(shY + H * 0.008, H * 0.8), (sx1 - sx0) * scale * 0.7, 1], [bkX, Math.max(shY, bkY + H * 0.1), (bx1 - bx0) * scale * 0.45, 0.45]]);
      c.save(); c.shadowColor = "rgba(0,0,0,.6)"; c.shadowBlur = W * 0.02; c.shadowOffsetY = H * 0.008;
      c.drawImage(gar, ox, oy, W * scale, H * scale); c.restore();
      state.sceneKey = key;
    }
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(state.sceneCanvas, 0, 0);
    ctx.drawImage(gar, ox, oy, W * scale, H * scale);
  }

  let queued = false;
  function schedule() {
    if (!state.ready || queued) return;
    queued = true;
    const run = () => { if (!queued) return; queued = false; render(); };
    requestAnimationFrame(run); setTimeout(run, 60);
  }
  let typing;
  const scheduleSoon = () => { clearTimeout(typing); typing = setTimeout(schedule, 250); };
  const showStatus = () => say(`${state.patternCode} · ${state.collar}`);

  // ---------------------------------------------------------------------------
  // Desen Seç: elastik makara galerisi (8 sabit kare, oklarla sayfa değişir)
  // ---------------------------------------------------------------------------
  const reel = form.querySelector("[data-pattern-reel]");
  // Galeri seçilen branşın desenlerini gösterir (branş seçilmemişse futbol)
  const allPatterns = reel ? JSON.parse(reel.dataset.patterns || "[]") : [];
  const sportPatterns = () => {
    const list = allPatterns.filter((p) => p.sport === sport());
    return list.length ? list : allPatterns;
  };
  const PER_PAGE = 8;
  let page = 0;
  async function choosePattern(p) {
    say("Desen yükleniyor…");
    p.img ||= await loadImage(p.src);
    setPattern(p.img, p.code);
    el("pattern-code").value = p.code;
    renderReel(); showStatus(); schedule();
  }
  function renderReel() {
    if (!reel) return;
    const track = reel.querySelector("[data-reel-track]");
    const patterns = sportPatterns();
    const pages = Math.max(1, Math.ceil(patterns.length / PER_PAGE));
    page = (page + pages) % pages;
    track.replaceChildren(...Array.from({ length: PER_PAGE }, (_, n) => {
      const p = patterns[page * PER_PAGE + n];
      const btn = document.createElement("button");
      btn.type = "button";
      if (!p) { btn.className = "reel__item reel__item--empty"; btn.disabled = true; btn.setAttribute("aria-hidden", "true"); return btn; }
      btn.className = "reel__item";
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", String(p.code === state.patternCode));
      btn.setAttribute("aria-label", p.code);
      btn.title = p.code;
      const img = new Image(); img.src = p.thumb; img.alt = ""; img.loading = "lazy";
      btn.append(img);
      btn.addEventListener("click", () => choosePattern(p).catch(() => say("Desen yüklenemedi")));
      return btn;
    }));
    reel.querySelector("[data-reel-name]").textContent = state.patternCode || patterns[0]?.code || "";
    const pager = reel.querySelector("[data-reel-page]");
    pager.textContent = `${page + 1} / ${pages}`;
    reel.querySelectorAll("[data-reel-prev], [data-reel-next]").forEach((b) => { b.disabled = pages < 2; });
  }
  reel?.querySelector("[data-reel-prev]").addEventListener("click", () => { page--; renderReel(); });
  reel?.querySelector("[data-reel-next]").addEventListener("click", () => { page++; renderReel(); });

  // ---------------------------------------------------------------------------
  // Form olayları
  // ---------------------------------------------------------------------------
  for (const name of ["logo-left", "logo-right", "sponsor"]) {
    el(name)?.addEventListener("change", async (e) => {
      const f = e.target.files?.[0];
      if (!f || !f.type.startsWith("image/")) { delete state.uploads[name]; schedule(); return; }
      try { state.uploads[name] = await fileToImage(f); } catch { delete state.uploads[name]; }
      schedule();
    });
  }
  form.querySelector("[data-design-input]")?.addEventListener("change", async (e) => {
    const f = [...(e.target.files || [])].find((file) => file.type.startsWith("image/") && file.type !== "image/svg+xml");
    if (!f) return;
    try { setPattern(await fileToImage(f), "Özel desen"); showStatus(); schedule(); } catch { say("Desen okunamadı"); }
  });
  const switchModel = async () => {
    if (!state.ready) return;
    try { await useCollar(mockupKey()); showStatus(); schedule(); } catch { say("Önizleme yüklenemedi"); }
  };
  el("collar")?.addEventListener("change", switchModel);
  el("sport")?.addEventListener("change", async () => {
    // Galeri o branşın desenlerine geçer; seçili desen bu branşta yoksa ilk desen seçilir
    if (reel) {
      page = 0;
      const list = sportPatterns();
      if (state.ready && list.length && !list.some((p) => p.code === state.patternCode)) {
        try { await choosePattern(list[0]); } catch { say("Desen yüklenemedi"); }
      }
      renderReel();
    }
    switchModel();
  });
  form.addEventListener("input", (e) => { if (e.target.name === "back-text") scheduleSoon(); });
  form.addEventListener("change", (e) => {
    if (/^(logo-left|logo-right|sponsor)-(none|alt)$|^(shorts-logo|shorts-number|has-name|has-number|text-color|scope)$/.test(e.target.name)) schedule();
  });

  // Sipariş gönderiminde paylaşıma eklenecek önizleme görseli
  form.formaPreview = () => new Promise((resolve) => {
    if (!state.ready) { resolve(null); return; }
    const name = `${(state.patternCode || "forma").replace(/\s+/g, "-")}-onizleme.jpg`;
    view.toBlob((blob) => resolve(blob ? new File([blob], name, { type: "image/jpeg" }) : null), "image/jpeg", 0.9);
  });

  // ---------------------------------------------------------------------------
  // Başlatma: önizleme ekrana yaklaşınca (sayfa yükünü geciktirmemek için)
  // ---------------------------------------------------------------------------
  view.width = W; view.height = H;
  async function boot() {
    try {
      say("Önizleme hazırlanıyor…");
      const first = sportPatterns()[0] || { code: "FK-001", src: ASSETS + "desen/fk-001.jpg" };
      const [pattern, scene, left, right, sponsor] = await Promise.all([
        loadImage(first.src), loadImage(ASSETS + "sahne.webp"),
        loadImage(ASSETS + "ornek-arma.png"), loadImage(ASSETS + "ornek-nora.png"), loadImage(ASSETS + "ornek-reklam.png"),
        loadFont("FIBA", ASSETS + "fiba.ttf"), loadFont("NoraNumara", ASSETS + "nora-numara.ttf"),
      ]);
      first.img = pattern;
      state.scene = scene;
      state.samples = { left, right, sponsor };
      // Özel üretimde desen yüklenene kadar forma ve şort desensiz beyaz görünür
      if (MODE === "upload") {
        const plain = Object.assign(document.createElement("canvas"), { width: 16, height: 22, naturalWidth: 16, naturalHeight: 22 });
        const pg = plain.getContext("2d"); pg.fillStyle = "#f2f2f0"; pg.fillRect(0, 0, 16, 22);
        setPattern(plain, "Beyaz forma");
      } else setPattern(pattern, first.code);
      if (el("pattern-code")) el("pattern-code").value = first.code;
      await useCollar(mockupKey());
      state.ready = true;
      render(); renderReel(); showStatus();
      stage.classList.add("is-ready");
    } catch {
      say("Önizleme bu tarayıcıda yüklenemedi; siparişinizi yine de gönderebilirsiniz.");
    }
  }
  renderReel();
  let started = false;
  const start = () => { if (!started) { started = true; boot(); } };
  form.addEventListener("focusin", start, { once: true }); // formla etkileşimde de başlar
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting)) { io.disconnect(); start(); }
    }, { rootMargin: "300px" });
    io.observe(stage);
  } else start();
})();

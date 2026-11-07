/*
  Forma Kutusu – isteğe bağlı 3D forma önizlemesi (WebGL 2, bağımlılıksız)
  2D önizleme varsayılandır. Model (assets/onizleme/forma-3d.glb) ve WebGL yalnızca
  "3D önizleme" düğmesine basılınca yüklenir. Desen, renk, logo ve yazılar 2D önizlemeden
  (form.formaParts) alınır; dosyalar yalnızca tarayıcıda işlenir, hiçbir yere yüklenmez.
  Model: 3D Jersey Kit "Shirt" (futbol forması, bisiklet yaka). UV kalıbı düz ve parçalar
  ayrık olduğu için desen, logo ve yazılar kalıp üzerine doğrudan yerleştirilir.
*/
(() => {
  "use strict";

  const form = document.querySelector("[data-order-form][data-wizard]");
  const box = form?.querySelector("[data-forma3d]");
  const stage = form?.querySelector("[data-preview-stage]");
  const toggle = stage?.querySelector("[data-forma3d-toggle]");
  if (!box || !toggle) return;

  const MODEL = "/assets/onizleme/forma-3d.glb?v=20261107a";
  const controls = box.querySelector("[data-forma3d-controls]");
  const note = box.querySelector("[data-forma3d-note]");
  const collarPick = box.querySelector("[data-forma3d-collar]");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const small = window.matchMedia("(max-width: 60rem)").matches || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  const el = (name) => form.elements[name];
  const isOn = (name) => Boolean(el(name)?.checked);
  const val = (name) => el(name)?.value || "";
  // Bilgi satırı: 3D açıkken ya da bir uyarı varken görünür (kontroller yalnızca 3D açıkken)
  const say = (text) => { note.textContent = text; note.hidden = !text; box.hidden = !active && !text; };

  // ---------------------------------------------------------------------------
  // UV kalıbı (glTF UV, v aşağı doğru). Ön kalıp UV'de düz, arka kalıp UV'de aynalıdır:
  // arkaya çizilen her şey yatayda ters çevrilir ki arkadan bakınca doğru okunsun.
  // ---------------------------------------------------------------------------
  const BODY = { u0: 0, v0: 0.585, u1: 0.53, v1: 0.985 }; // gövde dokusunun kapladığı alan
  const FRONT = { cx: 0.1436, u0: 0.0129, u1: 0.265, v0: 0.5966, v1: 0.9714 };
  const BACK = { cx: 0.3994, u0: 0.265, u1: 0.518, v0: 0.5953, v1: 0.9728 };
  // Kollar ayrı malzeme; özgün dokusu 2:1 olduğundan v birimi u biriminin yarısı uzunluktadır
  const SLEEVE = { u0: 0.2, v0: 0.27, u1: 0.48, v1: 0.555 };
  // Yerleşim (UV biriminde; kalıp yüksekliği ~0,375 ≈ 75 cm). Sol/sağ giyen kişiye göredir.
  const LAYOUT = {
    chestY: 0.712, chestDX: 0.046,
    crest: { w: 0.034, h: 0.038 }, nora: { w: 0.03, h: 0.017 },
    sponsor: { y: 0.772, w: 0.118, h: 0.045 },
    club: { y: 0.668, w: 0.13, h: 0.016 }, number: { y: 0.745, w: 0.11, h: 0.088 }, player: { y: 0.822, w: 0.13, h: 0.016 },
  };

  // ---------------------------------------------------------------------------
  // Durum
  // ---------------------------------------------------------------------------
  const VIEWS = { takim: -0.55, on: 0, arka: Math.PI };
  const cam = { yaw: VIEWS.takim, pitch: 0.06, zoom: 1 };
  let active = false, gl = null, scene = null, loading = null, raf = 0, dirtyTex = true, tween = null;
  let layer, canvas, status;

  const supported = (() => {
    try { return Boolean(window.WebGL2RenderingContext && document.createElement("canvas").getContext("webgl2")); }
    catch { return false; }
  })();

  // ---------------------------------------------------------------------------
  // GLB okuma (KHR_mesh_quantization dahil)
  // ---------------------------------------------------------------------------
  async function loadModel() {
    const res = await fetch(MODEL);
    if (!res.ok) throw new Error("Model indirilemedi");
    const buf = await res.arrayBuffer();
    const dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546c67) throw new Error("GLB değil");
    let json = null, bin = null;
    for (let o = 12; o < buf.byteLength;) {
      const len = dv.getUint32(o, true), type = dv.getUint32(o + 4, true);
      if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, o + 8, len)));
      else if (type === 0x004e4942) bin = new Uint8Array(buf, o + 8, len);
      o += 8 + len;
    }
    if (!json || !bin) throw new Error("GLB eksik");
    return { json, bin };
  }

  const SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
  const NORM = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 };
  function build(model) {
    const { json, bin } = model;
    const node = json.nodes.find((n) => n.mesh !== undefined);
    const s = node.scale || [1, 1, 1], t = node.translation || [0, 0, 0];
    const buffers = json.bufferViews.map((v) => {
      const b = gl.createBuffer(), target = v.target || gl.ARRAY_BUFFER;
      gl.bindBuffer(target, b);
      gl.bufferData(target, bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength), gl.STATIC_DRAW);
      return b;
    });
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    const parts = json.meshes[node.mesh].primitives.map((p) => {
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      [["POSITION", 0], ["NORMAL", 1], ["TEXCOORD_0", 2]].forEach(([name, loc]) => {
        const a = json.accessors[p.attributes[name]], v = json.bufferViews[a.bufferView];
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers[a.bufferView]);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, SIZE[a.type], a.componentType, Boolean(a.normalized), v.byteStride || 0, a.byteOffset || 0);
        if (name === "POSITION") {
          // Normalize edilmiş (nicemlenmiş) değerlerde min/max tam sayı olarak yazılır
          const q = a.normalized ? NORM[a.componentType] : 1;
          for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], (a.min[i] / q) * s[i] + t[i]); max[i] = Math.max(max[i], (a.max[i] / q) * s[i] + t[i]); }
        }
      });
      const ia = json.accessors[p.indices];
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers[ia.bufferView]);
      gl.bindVertexArray(null);
      return { vao, count: ia.count, type: ia.componentType, offset: ia.byteOffset || 0, name: json.materials[p.material].name };
    });
    const center = min.map((m, i) => (m + max[i]) / 2);
    const radius = Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2;
    // Model matrisi: düğümün ölçek/öteleme değeri + merkezleme (sütun sıralı)
    const modelM = new Float32Array([s[0], 0, 0, 0, 0, s[1], 0, 0, 0, 0, s[2], 0, t[0] - center[0], t[1] - center[1], t[2] - center[2], 1]);
    return { parts, radius, modelM };
  }

  // ---------------------------------------------------------------------------
  // Gölgelendirici: kumaşa yakın yumuşak ışık; içten görünen yüzler koyu
  // ---------------------------------------------------------------------------
  const VS = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNor; layout(location=2) in vec2 aUv;
uniform mat4 uModel, uViewProj;
out vec3 vNor; out vec2 vUv; out vec3 vPos;
void main() { vec4 p = uModel * vec4(aPos, 1.0); vPos = p.xyz; vNor = mat3(uModel) * aNor; vUv = aUv; gl_Position = uViewProj * p; }`;
  const FS = `#version 300 es
precision highp float;
in vec3 vNor; in vec2 vUv; in vec3 vPos;
uniform sampler2D uTex; uniform vec4 uRect; uniform bool uUseTex; uniform vec3 uColor; uniform vec3 uEye;
out vec4 outColor;
void main() {
  vec3 base = uUseTex ? texture(uTex, (vUv - uRect.xy) / uRect.zw).rgb : uColor;
  base = pow(base, vec3(2.2));
  vec3 n = normalize(vNor), v = normalize(uEye - vPos);
  float inner = 1.0;
  if (dot(n, v) < 0.0) { n = -n; inner = 0.45; }
  vec3 l1 = normalize(vec3(0.45, 0.65, 0.9)), l2 = normalize(vec3(-0.75, 0.2, -0.55));
  float d1 = max(dot(n, l1), 0.0), d2 = max(dot(n, l2), 0.0), hemi = 0.5 + 0.5 * n.y;
  float spec = pow(max(dot(n, normalize(l1 + v)), 0.0), 28.0) * 0.05;
  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0) * 0.1;
  float head = max(dot(n, v), 0.0); // kameradan gelen yumuşak ışık: her açıdan okunur kalsın
  vec3 c = base * (0.14 + 0.16 * hemi + 0.5 * d1 + 0.14 * d2 + 0.42 * head) * inner + vec3(spec + rim) * inner;
  outColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;
  function program() {
    const make = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      return sh;
    };
    const p = gl.createProgram();
    gl.attachShader(p, make(gl.VERTEX_SHADER, VS)); gl.attachShader(p, make(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = Object.fromEntries(["uModel", "uViewProj", "uTex", "uRect", "uUseTex", "uColor", "uEye"].map((n) => [n, gl.getUniformLocation(p, n)]));
    return { p, u };
  }

  // ---------------------------------------------------------------------------
  // Dokular: gövde (ön + arka kalıp) ve kollar; 2D önizlemenin desen ve logolarıyla
  // ---------------------------------------------------------------------------
  const maxTex = () => Math.min(small ? 1024 : 2048, gl.getParameter(gl.MAX_TEXTURE_SIZE));
  const bodyCanvas = document.createElement("canvas");
  const sleeveCanvas = document.createElement("canvas");
  function sizeCanvases() {
    const w = maxTex();
    bodyCanvas.width = w; bodyCanvas.height = Math.round((w * (BODY.v1 - BODY.v0)) / (BODY.u1 - BODY.u0));
    sleeveCanvas.width = Math.round(w / 2); sleeveCanvas.height = Math.round((w / 2) * (SLEEVE.v1 - SLEEVE.v0) / (2 * (SLEEVE.u1 - SLEEVE.u0)));
  }
  const rgb = (c) => `rgb(${c.join(",")})`;
  function paintBody(P) {
    const W = bodyCanvas.width, H = bodyCanvas.height, g = bodyCanvas.getContext("2d");
    const kx = W / (BODY.u1 - BODY.u0), ky = H / (BODY.v1 - BODY.v0);
    const X = (u) => (u - BODY.u0) * kx, Y = (v) => (v - BODY.v0) * ky;
    const boxAt = (cu, cv, w, h) => ({ x: X(cu) - (w * kx) / 2, y: Y(cv) - (h * ky) / 2, w: w * kx, h: h * ky });
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = rgb(P.mainColor); g.fillRect(0, 0, W, H);
    const D = P.draw, L = LAYOUT;
    // Ön kalıp: desen + göğüs logoları + reklam
    g.save();
    g.filter = "blur(0.5px)";
    D.cover(g, P.pattern, [X(FRONT.u0), Y(FRONT.v0), X(FRONT.u1), Y(FRONT.v1)]);
    g.filter = "none";
    const leftChest = (b) => boxAt(FRONT.cx + L.chestDX, L.chestY, b.w, b.h); // giyenin solu (görselde sağ)
    const rightChest = (b) => boxAt(FRONT.cx - L.chestDX, L.chestY, b.w, b.h);
    const middle = boxAt(FRONT.cx, L.chestY, L.nora.w, L.nora.h);
    const crest = P.logo("left", "logo-left");
    const rightOff = isOn("logo-right-none");
    const rightUpload = rightOff ? null : P.uploads["logo-right"];
    const nora = rightOff ? null : P.samples.right;
    if (P.flag) {
      D.inBox(g, P.flag, leftChest(L.crest));
      const right = rightOff ? null : rightUpload || crest;
      if (right) D.inBox(g, right, rightChest(L.crest));
      if (nora) D.inBox(g, nora, middle);
    } else {
      if (crest) D.inBox(g, crest, leftChest(L.crest));
      if (rightUpload) { D.inBox(g, rightUpload, rightChest(L.crest)); if (nora) D.inBox(g, nora, middle); }
      else if (nora) D.inBox(g, nora, rightChest(L.nora));
    }
    const sponsorText = isOn("sponsor-none") || P.uploads.sponsor ? "" : val("sponsor-text").trim().toLocaleUpperCase("tr-TR");
    const sb = boxAt(FRONT.cx, L.sponsor.y, L.sponsor.w, L.sponsor.h);
    if (sponsorText) {
      const tb = { ...sb, y: sb.y + sb.h * 0.2, h: sb.h * 0.6 };
      D.textInBox(g, sponsorText, "FIBA", tb, D.sizeInBox(g, sponsorText, "FIBA", tb), P.textColor);
    } else {
      const sponsor = P.logo("sponsor", "sponsor");
      if (sponsor) D.inBox(g, sponsor, sb);
    }
    g.restore();
    // Arka kalıp: aynalı çizim (arkadan bakınca düz okunur)
    g.save();
    g.translate(X(BACK.cx) * 2, 0); g.scale(-1, 1);
    const mx = (u) => 2 * BACK.cx - u; // aynalı koordinatta kalıp sınırları
    g.filter = "blur(0.5px)";
    D.cover(g, P.pattern, [X(mx(BACK.u1)), Y(BACK.v0), X(mx(BACK.u0)), Y(BACK.v1)]);
    g.filter = "none";
    const club = (val("back-text").trim() || "KULÜP İSMİ").toLocaleUpperCase("tr-TR");
    const player = isOn("has-name") ? "OYUNCU" : "";
    const num = isOn("has-number") ? "10" : "";
    const cb = boxAt(BACK.cx, L.club.y, L.club.w, L.club.h), pb = boxAt(BACK.cx, L.player.y, L.player.w, L.player.h);
    const nb = boxAt(BACK.cx, L.number.y, L.number.w, L.number.h);
    const nameSize = Math.min(D.sizeInBox(g, club, "FIBA", cb), D.sizeInBox(g, player || club, "FIBA", pb));
    D.textInBox(g, club, "FIBA", cb, nameSize, P.textColor);
    D.textInBox(g, num, "NoraNumara", nb, D.sizeInBox(g, num, "NoraNumara", nb), P.textColor);
    D.textInBox(g, player, "FIBA", pb, nameSize, P.textColor);
    g.restore();
  }
  function paintSleeves(P) {
    const g = sleeveCanvas.getContext("2d");
    g.fillStyle = rgb(P.mainColor); g.fillRect(0, 0, sleeveCanvas.width, sleeveCanvas.height);
    P.draw.cover(g, P.pattern, [0, 0, sleeveCanvas.width, sleeveCanvas.height]);
  }
  function texture() {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    return t;
  }
  function upload(t, c) {
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.generateMipmap(gl.TEXTURE_2D);
  }
  function refreshTextures() {
    const P = form.formaParts?.();
    if (!P || !P.pattern) return false;
    paintBody(P); paintSleeves(P);
    upload(scene.tex.body, bodyCanvas); upload(scene.tex.sleeve, sleeveCanvas);
    scene.trim = P.mainColor.map((c) => c / 255);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Kamera ve çizim
  // ---------------------------------------------------------------------------
  function perspective(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
  }
  function lookAt(e, c) {
    let z = [e[0] - c[0], e[1] - c[1], e[2] - c[2]], l = Math.hypot(...z); z = z.map((v) => v / l);
    let x = [z[2], 0, -z[0]]; l = Math.hypot(...x) || 1; x = x.map((v) => v / l); // yukarı = +y
    const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    const d = (a) => -(a[0] * e[0] + a[1] * e[1] + a[2] * e[2]);
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, d(x), d(y), d(z), 1];
  }
  function mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
    return o;
  }
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }
  function draw() {
    raf = 0;
    if (!active || !scene || gl.isContextLost()) return;
    if (tween) {
      const k = Math.min(1, (performance.now() - tween.t0) / tween.ms), e = 1 - (1 - k) ** 3;
      cam.yaw = tween.from + (tween.to - tween.from) * e;
      cam.pitch = tween.p0 + (tween.p1 - tween.p0) * e;
      if (k >= 1) tween = null;
    }
    if (dirtyTex && refreshTextures()) dirtyTex = false;
    resize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const fov = 0.55, aspect = canvas.width / canvas.height;
    const fit = scene.radius / Math.sin(fov / 2) / Math.min(1, aspect) * 0.86;
    const dist = fit / cam.zoom;
    const eye = [dist * Math.sin(cam.yaw) * Math.cos(cam.pitch), dist * Math.sin(cam.pitch), dist * Math.cos(cam.yaw) * Math.cos(cam.pitch)];
    const vp = mul(perspective(fov, aspect, dist * 0.1, dist * 4), lookAt(eye, [0, 0, 0]));
    const { p, u } = scene.prog;
    gl.useProgram(p);
    gl.uniformMatrix4fv(u.uModel, false, scene.modelM);
    gl.uniformMatrix4fv(u.uViewProj, false, vp);
    gl.uniform3fv(u.uEye, eye);
    gl.uniform1i(u.uTex, 0);
    gl.activeTexture(gl.TEXTURE0);
    for (const part of scene.parts) {
      const body = part.name.startsWith("Shirt"), sleeve = part.name.startsWith("Shoulder_FRONT");
      gl.uniform1i(u.uUseTex, body || sleeve ? 1 : 0);
      if (body) { gl.bindTexture(gl.TEXTURE_2D, scene.tex.body); gl.uniform4f(u.uRect, BODY.u0, BODY.v0, BODY.u1 - BODY.u0, BODY.v1 - BODY.v0); }
      else if (sleeve) { gl.bindTexture(gl.TEXTURE_2D, scene.tex.sleeve); gl.uniform4f(u.uRect, SLEEVE.u0, SLEEVE.v0, SLEEVE.u1 - SLEEVE.u0, SLEEVE.v1 - SLEEVE.v0); }
      else gl.uniform3fv(u.uColor, scene.trim); // yaka, etek bandı ve kol ağızları ana renkte
      gl.bindVertexArray(part.vao);
      gl.drawElements(gl.TRIANGLES, part.count, part.type, part.offset);
    }
    gl.bindVertexArray(null);
    if (tween) request();
  }
  const request = () => { if (!raf) raf = requestAnimationFrame(draw); };

  // Görünüme geçiş: azaltılmış harekette anında
  function turnTo(yaw, pitch = 0.06) {
    // En kısa yoldan dön
    const full = Math.PI * 2;
    let target = yaw;
    while (target - cam.yaw > Math.PI) target -= full;
    while (target - cam.yaw < -Math.PI) target += full;
    if (reduced.matches) { cam.yaw = target; cam.pitch = pitch; tween = null; }
    else tween = { from: cam.yaw, to: target, p0: cam.pitch, p1: pitch, t0: performance.now(), ms: 450 };
    request();
  }
  const currentView = () => form.querySelector('[data-view][aria-selected="true"]')?.dataset.view || "takim";

  // ---------------------------------------------------------------------------
  // Katman, sürükleyerek döndürme ve klavye
  // ---------------------------------------------------------------------------
  function makeLayer() {
    layer = document.createElement("div");
    layer.className = "forma3d__layer";
    layer.hidden = true;
    canvas = document.createElement("canvas");
    canvas.className = "forma3d__canvas";
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "3D forma önizlemesi. Döndürmek için sürükleyin ya da sol ve sağ ok tuşlarını kullanın.");
    status = document.createElement("span");
    status.className = "order-studio__status forma3d__status";
    status.setAttribute("aria-live", "polite");
    layer.append(canvas, status);
    stage.querySelector("canvas").after(layer);

    let drag = null;
    canvas.addEventListener("pointerdown", (e) => {
      drag = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch, id: e.pointerId };
      canvas.setPointerCapture(e.pointerId);
      tween = null;
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const k = 6 / Math.max(240, canvas.clientWidth);
      cam.yaw = drag.yaw - (e.clientX - drag.x) * k;
      if (e.pointerType === "mouse") cam.pitch = Math.max(-0.45, Math.min(0.6, drag.pitch + (e.clientY - drag.y) * k));
      request();
    });
    const end = () => { drag = null; };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); turnTo(cam.yaw + (e.key === "ArrowLeft" ? 0.4 : -0.4), cam.pitch); }
      else if (e.key === "Home") { e.preventDefault(); reset(); }
    });
    // Bağlam kaybolursa GPU kaynakları geçersizdir: katman atılır, bir sonraki açılışta yeni tuval
    // ve yeni bağlamla baştan kurulur
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      resizer.disconnect();
      layer.remove();
      layer = canvas = status = null;
      gl = scene = loading = null;
      fail("3D görünüm durdu; 2D önizleme kullanılıyor. Tekrar açmayı deneyebilirsin.");
    });
    const resizer = new ResizeObserver(request);
    resizer.observe(canvas);
  }

  function reset() { cam.zoom = 1; turnTo(VIEWS[currentView()] ?? VIEWS.takim); }

  async function ensureScene() {
    if (scene) return;
    loading ||= (async () => {
      const model = await loadModel();
      gl = canvas.getContext("webgl2", { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: "low-power" });
      if (!gl) throw new Error("WebGL 2 yok");
      gl.enable(gl.DEPTH_TEST);
      sizeCanvases();
      scene = { ...build(model), prog: program(), tex: { body: texture(), sleeve: texture() }, trim: [0.5, 0.5, 0.5] };
      // Yazı tipleri 2D önizlemeyle aynı (FIBA, NoraNumara); yüklenmemişse bekle
      await Promise.all([document.fonts.load('40px "FIBA"'), document.fonts.load('40px "NoraNumara"')]).catch(() => {});
    })();
    try { await loading; }
    catch (e) { loading = null; throw e; }
  }

  // ---------------------------------------------------------------------------
  // Aç / kapat
  // ---------------------------------------------------------------------------
  const futbol = () => (val("sport") || "futbol") === "futbol";
  function collarNote() {
    const base = "Temsili görünüm, baskı provası değildir.";
    say(val("collar") && val("collar") !== "Sıfır yaka"
      ? `3D modelde yaka bisiklet yaka görünür; ${val("collar")} 2D önizlemede ve siparişte geçerli. ${base}`
      : base);
  }
  function setActive(on) {
    active = on;
    toggle.setAttribute("aria-pressed", String(on));
    toggle.textContent = on ? "2D'ye dön" : "3D önizleme";
    controls.hidden = !on;
    stage.classList.toggle("is-3d", on);
    if (layer) layer.hidden = !on;
    if (on) { collarNote(); request(); }
    else say("");
  }
  function fail(text) {
    setActive(false);
    say(text);
  }
  async function open() {
    if (!supported) { say("Bu tarayıcı 3D görünümü desteklemiyor; 2D önizleme kullanılıyor."); return; }
    if (!futbol()) return;
    if (!layer) makeLayer();
    setActive(true);
    if (scene) { dirtyTex = true; reset(); return; }
    status.hidden = false;
    status.textContent = "3D model yükleniyor…";
    try {
      await ensureScene();
      if (!active) return;
      status.hidden = true;
      cam.yaw = VIEWS[currentView()] ?? VIEWS.takim;
      dirtyTex = true;
      request();
    } catch {
      fail("3D model yüklenemedi; 2D önizleme kullanılıyor. Siparişini yine de gönderebilirsin.");
    }
  }

  toggle.addEventListener("click", () => (active ? setActive(false) : open()));
  controls.addEventListener("click", (e) => {
    const turn = e.target.closest("[data-forma3d-turn]");
    if (turn) turnTo(cam.yaw - Number(turn.dataset.forma3dTurn) * (Math.PI / 4), cam.pitch);
    else if (e.target.closest("[data-forma3d-reset]")) reset();
  });
  // Ön / Arka / Takım sekmeleri 3D'de kamerayı çevirir
  // Sekme tıklaması ya da akordeonun seçtiği görünüm (forma-sihirbaz.js setView → form.formaView)
  const view2d = form.formaView;
  form.formaView = (name) => {
    view2d?.(name);
    if (active) turnTo(VIEWS[name || "takim"] ?? VIEWS.takim);
  };
  // 2D önizleme her çizimden sonra haber verir: doku yenilenir
  form.addEventListener("forma-render", () => { dirtyTex = true; if (active) request(); });

  // Yaka: 3D panelindeki seçim 1. adımdaki yaka kartlarıyla aynı alanı değiştirir
  const syncCollar = () => { collarPick.value = val("collar") || "Sıfır yaka"; };
  collarPick.addEventListener("change", () => {
    const radio = form.querySelector(`input[name="collar"][value="${collarPick.value}"]`);
    if (!radio) return;
    radio.checked = true;
    radio.dispatchEvent(new Event("change", { bubbles: true }));
  });
  // Branş: 3D şimdilik yalnızca futbol forması için
  // Branş: 3D model futbol forması; basketbol ve voleybolda düğme gizlenir, 2D önizleme sürer
  const syncSport = () => {
    toggle.hidden = !futbol();
    if (!futbol() && active) setActive(false);
  };
  form.addEventListener("change", (e) => {
    if (e.target.name === "collar") { syncCollar(); if (active) collarNote(); }
    else if (e.target.name === "sport") syncSport();
  });
  controls.hidden = true;
  syncCollar();
  syncSport();
})();

/*
  Forma Kutusu – forma tasarla sihirbazı
  5 adım: Yaka → Model → Forma düzenleme → Oyuncu bilgileri → Sipariş. Adımlar aynı sipariş
  formunun bölümleridir; liste, tutar ve WhatsApp mesajı site.js'te, önizleme forma-onizleme.js'te.
  Bu dosya adım geçişlerini, renkli model kartlarını, renk paletlerini ve sipariş özetini yönetir.
*/
(() => {
  "use strict";

  const form = document.querySelector("[data-order-form][data-wizard]");
  const FM = window.FormaModeller;
  if (!form || !FM) return;

  const steps = [...form.querySelectorAll("[data-step]")];
  const tabs = [...form.querySelectorAll("[data-wizard-go]")];
  const el = (name) => form.elements[name];
  const checked = (name) => form.querySelector(`input[name="${name}"]:checked`);
  const escape = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const formatTL = (value) => `${value.toLocaleString("tr-TR")}₺`;
  let current = 1;
  let reached = 1;

  // ---------------------------------------------------------------------------
  // Renkli modeller: kartlar ve renk paletleri
  // ---------------------------------------------------------------------------
  const grid = form.querySelector("[data-color-models]");
  let selectedModel = el("pattern-code").value;
  const thumbs = new Map();

  // Kart görseli: düz panel sade bir forma silüetine giydirilir, üstüne hafif ışık
  function drawThumb(canvas, code) {
    const w = canvas.width, h = canvas.height, g = canvas.getContext("2d");
    const panel = FM.draw(code, el("main-color").value, el("accent-color").value, 300, 400);
    g.clearRect(0, 0, w, h);
    const shirt = new Path2D();
    const p = [[0.36, 0.06], [0.2, 0.11], [0.04, 0.3], [0.17, 0.4], [0.24, 0.32], [0.24, 0.95], [0.76, 0.95], [0.76, 0.32], [0.83, 0.4], [0.96, 0.3], [0.8, 0.11], [0.64, 0.06]];
    p.forEach(([x, y], i) => (i ? shirt.lineTo(x * w, y * h) : shirt.moveTo(x * w, y * h)));
    shirt.quadraticCurveTo(w / 2, h * 0.16, 0.36 * w, 0.06 * h);
    g.save(); g.clip(shirt);
    g.drawImage(panel, 0, 0, w, h);
    const light = g.createLinearGradient(0, 0, w, 0);
    light.addColorStop(0, "rgba(0,0,0,.28)"); light.addColorStop(0.45, "rgba(255,255,255,.12)"); light.addColorStop(1, "rgba(0,0,0,.3)");
    g.fillStyle = light; g.fillRect(0, 0, w, h);
    g.restore();
    g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 1.5; g.stroke(shirt);
  }

  function buildModels() {
    grid.replaceChildren(...FM.MODELS.map((model) => {
      const card = document.createElement("label");
      card.className = "wizard-model";
      card.innerHTML = `<input type="radio" name="model-pick" value="${model.code}"${model.code === selectedModel ? " checked" : ""}>
        <canvas width="180" height="200" aria-hidden="true"></canvas>
        <strong>${escape(model.name)}</strong><small>${model.code}</small><span>300₺'den · En az 5 adet</span>`;
      thumbs.set(model.code, card.querySelector("canvas"));
      return card;
    }));
    redrawThumbs();
  }
  const redrawThumbs = () => thumbs.forEach((canvas, code) => drawThumb(canvas, code));

  grid.addEventListener("change", (e) => {
    if (e.target.name !== "model-pick") return;
    selectedModel = e.target.value;
    el("pattern-code").value = selectedModel;
    form.dispatchEvent(new Event("model-change"));
  });

  // Renk paleti: hazır renkler + özel renk seçici; seçim gizli alana adıyla yazılır
  function buildPalette(holder) {
    const target = el(holder.dataset.palette);
    const name = `${holder.dataset.palette}-pick`;
    const list = document.createElement("div");
    list.className = "wizard-palette";
    list.setAttribute("role", "radiogroup");
    list.setAttribute("aria-label", holder.dataset.palette === "main-color" ? "Ana renk" : "Desen rengi");
    list.innerHTML = FM.PALETTE.map(([value, label]) => `<label class="wizard-swatch" title="${label}"><input type="radio" name="${name}" value="${value}" data-label="${label}"${value === target.value ? " checked" : ""}><i style="background:${value}"></i><span>${label}</span></label>`).join("")
      + `<label class="wizard-swatch wizard-swatch--custom" title="Özel renk"><input type="color" value="${target.value}" aria-label="Özel renk seç"><span>Özel renk</span></label>`;
    holder.append(list);
    const set = (value, label) => {
      target.value = value;
      target.dataset.label = label;
      redrawThumbs();
      form.dispatchEvent(new Event("model-change"));
    };
    list.addEventListener("change", (e) => {
      if (e.target.type === "radio") set(e.target.value, e.target.dataset.label);
    });
    const custom = list.querySelector('input[type="color"]');
    custom.addEventListener("input", () => {
      list.querySelectorAll('input[type="radio"]').forEach((r) => (r.checked = false));
      set(custom.value, FM.colorName(custom.value));
    });
  }

  // Model türü sekmesi: renkli modele dönünce son seçilen renkli model geri gelir. Yakalama
  // aşamasında çalışır; önizleme olayı işlemeden önce desen kodu hazır olur.
  form.addEventListener("click", (e) => {
    if (e.target.closest('[data-pattern-mode="color"]')) el("pattern-code").value = selectedModel;
  }, true);
  const syncMode = () => {
    const mode = el("pattern-mode").value;
    form.querySelectorAll("[data-color-only]").forEach((item) => (item.hidden = mode !== "color"));
    form.querySelector("[data-gallery-note]").hidden = mode !== "gallery";
  };
  form.addEventListener("pattern-mode", syncMode);

  // ---------------------------------------------------------------------------
  // Forma düzenleme: akordeon (tek bölüm açık) ve Takım / Ön / Arka görünümü
  // ---------------------------------------------------------------------------
  const viewTabs = [...form.querySelectorAll("[data-view]")];
  const setView = (name) => {
    viewTabs.forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.view === name)));
    form.formaView?.(name === "takim" ? "" : name);
  };
  viewTabs.forEach((tab) => tab.addEventListener("click", () => setView(tab.dataset.view)));
  const panels = [...form.querySelectorAll(".wizard-acc")];
  panels.forEach((item) => item.addEventListener("toggle", () => {
    if (!item.open) return;
    panels.forEach((other) => { if (other !== item) other.open = false; });
    if (item.dataset.focus) setView(item.dataset.focus);
  }));

  // Çorap: "Çorap istiyorum" açılınca renk seçenekleri görünür (varsayılan siyah)
  const socksToggle = form.querySelector("[data-socks-toggle]");
  const socksColors = form.querySelector("[data-socks-colors]");
  socksToggle.addEventListener("change", () => {
    socksColors.hidden = !socksToggle.checked;
    const pick = form.querySelector(`input[name="socks"][value="${socksToggle.checked ? "siyah" : "yok"}"]`);
    pick.checked = true;
    pick.dispatchEvent(new Event("change", { bubbles: true }));
  });
  // "Yok" rengi listede gizli; açıkken seçim yalnızca renkler arasındadır
  form.querySelector('input[name="socks"][value="yok"]').closest("label").hidden = true;

  // ---------------------------------------------------------------------------
  // Adım kontrolleri: hatalar adımın kendi kutusunda gösterilir
  // ---------------------------------------------------------------------------
  const UPLOAD_LABELS = ["Sol göğüs logosu", "Sağ göğüs logosu", "Forma önü reklam"];
  function stepErrors(n) {
    const all = form.orderApi?.validate() || [];
    if (n === 2) return form.orderApi?.validateDesign() || [];
    if (n === 3) return all.filter((error) => UPLOAD_LABELS.some((label) => error.startsWith(label)));
    if (n === 4) return all.filter((error) => /oyuncu|satırda/.test(error));
    return [];
  }
  function showErrors(n, errors) {
    const box = steps[n - 1].querySelector("[data-step-errors]");
    if (!box) return;
    box.hidden = errors.length === 0;
    box.tabIndex = -1;
    box.replaceChildren(...errors.map((error) => Object.assign(document.createElement("span"), { textContent: error })));
  }
  function check(n) {
    const errors = stepErrors(n);
    showErrors(n, errors);
    if (!errors.length) return true;
    steps[n - 1].querySelector("[data-step-errors]")?.focus({ preventScroll: true });
    if (n === 3) {
      // Eksik yükleme bölümünü aç
      const label = UPLOAD_LABELS.find((l) => errors[0].startsWith(l));
      const item = panels.find((p) => p.textContent.includes(label));
      if (item) { item.open = true; item.scrollIntoView({ behavior: "smooth", block: "center" }); }
    } else steps[n - 1].querySelector("[data-step-errors]")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }

  // ---------------------------------------------------------------------------
  // Sipariş özeti (5. adım)
  // ---------------------------------------------------------------------------
  function buildReview() {
    const box = form.querySelector("[data-wizard-review]");
    const calc = form.orderApi.calculate();
    const sport = el("sport").value;
    const keeper = sport === "voleybol" ? "Libero" : "Kaleci";
    const showKeeper = sport !== "basketbol";
    const mark = (on) => (on ? "✓" : "–");
    const mode = el("pattern-mode").value;
    const model = mode === "color"
      ? `${FM.MODELS.find((m) => m.code === selectedModel)?.name || ""} (${selectedModel}) · ${el("main-color").dataset.label} / ${el("accent-color").dataset.label}`
      : mode === "upload" ? "Kendi desenim" : el("pattern-code").value;
    const rows = calc.rows.map((r, i) => `<tr><td>${i + 1}</td><td>${escape(r.name || "-")}</td><td>${escape(r.number || "-")}</td>${showKeeper ? `<td>${r.keeper ? "Evet" : "Hayır"}</td>` : ""}<td>${escape(r.size)}</td><td>${mark(r.shorts)}</td><td>${mark(r.socks)}</td></tr>`).join("");
    const details = [
      ["Branş", checked("sport")?.dataset.label],
      ["Model", model],
      ["Yaka", el("collar").value],
      ["Kumaş", "Poly Mesh"],
      ["Kulüp ismi", el("back-text").value.trim() || "Yok"],
      ["Yazı / numara rengi", checked("text-color")?.dataset.label],
      ["Sırt ismi", el("has-name").checked ? "Var" : "Yok"],
      ["Sırt numarası", el("has-number").checked ? "Var" : "Yok"],
      ...[...form.querySelectorAll("[data-upload]")].map((upload) => {
        const input = upload.querySelector("[data-upload-input]");
        const alt = upload.querySelector("[data-upload-alt]");
        const none = upload.querySelector("[data-upload-none]").checked;
        const text = upload.querySelector("[data-upload-text]")?.value.trim();
        const value = none ? "Yok" : alt?.checked ? `TR Arma${input.files[0] ? ` · Sağ göğüs: ${input.files[0].name}` : ""}` : input.files[0]?.name || text || "Yok";
        return [upload.querySelector(".order-upload__field > span").textContent, value];
      }),
      ...(mode === "upload" ? [["Tasarım dosyaları", [...el("design").files].map((f) => f.name).join(", ")]] : []),
      ...(calc.kit ? [["Şort rengi", checked("shorts-color")?.dataset.label], ...(sport !== "voleybol" ? [["Şort logosu", el("shorts-logo").checked ? "Var" : "Yok"], ["Şort numarası", el("shorts-number").checked ? "Var" : "Yok"]] : [])] : []),
      ...(calc.socks ? [["Çorap rengi", checked("socks")?.dataset.label]] : []),
      ...(calc.keepers ? [["Kaleci forması rengi", checked("keeper-color")?.dataset.label]] : []),
      ["Toplam forma", `${calc.qty} adet`],
      ["Toplam tutar", formatTL(calc.total)],
    ];
    box.innerHTML = `<h3>Oyuncu listesi</h3>
      <div class="wizard-table"><table><thead><tr><th>#</th><th>Sırt ismi</th><th>Sırt no</th>${showKeeper ? `<th>${keeper}</th>` : ""}<th>Beden</th><th>Şort</th><th>Çorap</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="wizard-details"><h3>Sipariş detayları</h3><dl>${details.map(([k, v]) => `<div><dt>${k}</dt><dd>${escape(v || "-")}</dd></div>`).join("")}</dl>
      <p class="wizard-details__parts">${escape(calc.parts.join(" + "))}. Kesin tutar sipariş görüşmesinde teyit edilir.</p></div>`;
  }

  // ---------------------------------------------------------------------------
  // Adım geçişi
  // ---------------------------------------------------------------------------
  const header = document.querySelector(".site-header");
  // Yapışık adım çubuğu ve önizleme sitenin üst menüsünün altında durur
  const placeTop = () => form.style.setProperty("--wizard-top", `${header ? Math.round(header.getBoundingClientRect().height) : 0}px`);
  placeTop();
  window.addEventListener("resize", placeTop, { passive: true });
  function show(n, push = true, scroll = true) {
    current = n;
    reached = Math.max(reached, n);
    steps.forEach((step) => (step.hidden = Number(step.dataset.step) !== n));
    tabs.forEach((tab) => {
      const i = Number(tab.dataset.wizardGo);
      tab.toggleAttribute("aria-current", i === n);
      if (i === n) tab.setAttribute("aria-current", "step");
      tab.classList.toggle("is-done", i < n);
    });
    form.dataset.current = n;
    // Telefonda adım çubuğu kayar: etkin adım ortaya gelir
    const bar = form.querySelector(".wizard__tabs"), active = tabs[n - 1];
    if (bar && active) bar.scrollLeft = active.offsetLeft - (bar.clientWidth - active.offsetWidth) / 2;
    if (n === 5) buildReview();
    if (n === 3) setView(viewTabs.find((t) => t.getAttribute("aria-selected") === "true")?.dataset.view || "takim");
    if (push) history.pushState({ wizardStep: n }, "", `#adim-${n}`);
    if (!scroll) return;
    const title = steps[n - 1].querySelector(".wizard__title");
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
    const top = form.getBoundingClientRect().top + window.scrollY - (header?.getBoundingClientRect().height || 0) - 12;
    if (window.scrollY > top || form.getBoundingClientRect().top > window.innerHeight * 0.5) window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }
  function go(n) {
    if (n < 1 || n > steps.length) return;
    if (n === current) return;
    if (n < current) { show(n); return; }
    for (let i = current; i < n; i++) {
      if (!check(i)) { if (i !== current) show(i); return; }
    }
    show(n);
  }
  form.addEventListener("wizard-advance", () => go(current + 1));
  form.addEventListener("click", (e) => {
    if (e.target.closest("[data-wizard-next]")) go(current + 1);
    else if (e.target.closest("[data-wizard-back]")) go(current - 1);
    else if (e.target.closest("[data-wizard-go]")) go(Number(e.target.closest("[data-wizard-go]").dataset.wizardGo));
  });
  // Telefonda geri tuşu bir önceki adıma döner
  window.addEventListener("popstate", (e) => {
    const n = e.state?.wizardStep || Number((location.hash.match(/^#adim-(\d)$/) || [])[1]) || 1;
    if (n >= 1 && n <= steps.length) show(Math.min(n, reached), false);
  });
  // Hata kutuları düzeltilince güncellenir
  form.addEventListener("input", () => { if (current >= 3 && current <= 4) { const box = steps[current - 1].querySelector("[data-step-errors]"); if (box && !box.hidden) showErrors(current, stepErrors(current)); } });
  form.addEventListener("change", () => { if (current >= 3 && current <= 4) { const box = steps[current - 1].querySelector("[data-step-errors]"); if (box && !box.hidden) showErrors(current, stepErrors(current)); } });

  // Tasarımı indir: önizlemedeki "Görseli kaydet" ile aynı (telefonda paylaşım menüsü)
  form.querySelector("[data-wizard-download]")?.addEventListener("click", () => form.querySelector("[data-preview-save]")?.click());

  buildModels();
  form.querySelectorAll("[data-palette]").forEach(buildPalette);
  syncMode();
  history.replaceState({ wizardStep: 1 }, "", location.hash.startsWith("#adim-") ? location.pathname + location.search : location.href);
  show(1, false, false);
})();

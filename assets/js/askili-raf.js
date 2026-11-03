(() => {
  const WA = "905432321853";
  const SIZES = ["Çocuk", "S", "M", "L", "XL", "2XL", "3XL"];
  const make = (p, n, label) => Array.from({ length: n }, (_, i) => {
    const code = `${p}-${String(i + 1).padStart(3, "0")}`;
    return { code, label, img: `/assets/raf/${code.toLowerCase()}.webp` };
  });
  const DATA = {
    futbol: make("FK-F", 12, "Futbol forma deseni"),
    basketbol: make("FK-B", 10, "Basketbol forma deseni"),
    voleybol: make("FK-V", 8, "Voleybol forma deseni"),
  };
  const $ = (id) => document.getElementById(id);
  const rail = $("rail"), track = $("track"), focus = $("focus");
  let sport = "futbol", current = -1, picked = new Set(), lastBtn = null;

  function render() {
    track.innerHTML = DATA[sport].map((m, i) => `
      <button class="hanger" style="--i:${i}" data-i="${i}" aria-label="${m.code} desenini incele">
        <span class="swing">
          <svg class="hook" viewBox="0 0 46 44" aria-hidden="true"><use href="#hook"/></svg>
          <img src="${m.img}" alt="${m.code} ${m.label.toLowerCase()}" width="375" height="480" loading="${i < 6 ? "eager" : "lazy"}" decoding="async">
        </span>
        <span class="tag">${m.code}</span>
      </button>`).join("");
    $("count").textContent = `${DATA[sport].length} desen`;
    rail.scrollLeft = 0;
  }

  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => x.setAttribute("aria-selected", x === t));
    sport = t.dataset.sport; render();
  }));
  document.querySelectorAll(".arrow").forEach((b) => b.addEventListener("click", () => {
    rail.scrollBy({ left: Number(b.dataset.dir) * rail.clientWidth * 0.7, behavior: "smooth" });
  }));

  // Fareyle sürükleyerek kaydırma (dokunmatikte tarayıcı kendi kaydırır)
  let drag = null, moved = false;
  rail.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; drag = { x: e.clientX, s: rail.scrollLeft }; moved = false; });
  window.addEventListener("pointermove", (e) => {
    if (!drag) return; const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 5) { moved = true; rail.classList.add("dragging"); }
    rail.scrollLeft = drag.s - dx;
  });
  window.addEventListener("pointerup", () => { drag = null; rail.classList.remove("dragging"); });

  track.addEventListener("click", (e) => {
    const b = e.target.closest(".hanger"); if (!b || moved) return;
    lastBtn = b; open(Number(b.dataset.i), b.querySelector("img"));
  });

  function fill(i) {
    const m = DATA[sport][i]; current = i;
    $("f-img").src = m.img; $("f-img").alt = `${m.code} ${m.label.toLowerCase()}`;
    $("f-code").textContent = m.code; $("f-title").textContent = m.label;
    $("f-try").href = `/forma-tasarla/?model=${m.code}`;
    waLink();
  }
  function waLink() {
    const m = DATA[sport][current];
    const sz = picked.size ? ` Bedenler: ${[...picked].join(", ")}.` : "";
    $("f-wa").href = `https://wa.me/${WA}?text=${encodeURIComponent(`Merhaba, ${m.code} deseni için teklif almak istiyorum.${sz}`)}`;
  }
  $("f-sizes").innerHTML = SIZES.map((s) => `<button class="size" aria-pressed="false">${s}</button>`).join("");
  $("f-sizes").addEventListener("click", (e) => {
    const b = e.target.closest(".size"); if (!b) return;
    const on = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", on); on ? picked.add(b.textContent) : picked.delete(b.textContent); waLink();
  });

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function open(i, fromImg) {
    fill(i);
    document.body.classList.add("focus-open"); focus.setAttribute("aria-hidden", "false");
    const to = $("f-img");
    if (fromImg && !reduce) {
      // Rafta tıklanan formadan büyük görsele uçuş (FLIP)
      const a = fromImg.getBoundingClientRect();
      requestAnimationFrame(() => {
        const b = to.getBoundingClientRect(); if (!b.width) return;
        const s = a.width / b.width;
        to.animate([
          { transform: `translate(${a.left + a.width / 2 - (b.left + b.width / 2)}px, ${a.top + a.height / 2 - (b.top + b.height / 2)}px) scale(${s})` },
          { transform: "none" },
        ], { duration: 560, easing: "cubic-bezier(.22,.8,.24,1)" });
        $("f-swing").animate([{ transform: "rotate(0)" }, { transform: "rotate(2.5deg)", offset: .55 }, { transform: "rotate(-1deg)", offset: .8 }, { transform: "rotate(0)" }], { duration: 1200, delay: 380 });
      });
    }
    focus.querySelector(".close").focus({ preventScroll: true });
  }
  function close() {
    document.body.classList.remove("focus-open"); focus.setAttribute("aria-hidden", "true");
    if (lastBtn) lastBtn.focus({ preventScroll: true });
  }
  function step(d) {
    const n = DATA[sport].length; fill((current + d + n) % n);
    if (!reduce) $("f-img").animate([{ opacity: 0, transform: `translateX(${d * 30}px)` }, { opacity: 1, transform: "none" }], { duration: 320, easing: "ease-out" });
    lastBtn = track.querySelector(`[data-i="${current}"]`);
    lastBtn?.scrollIntoView({ inline: "center", block: "nearest" });
  }
  focus.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) close();
    const s = e.target.closest("[data-step]"); if (s) step(Number(s.dataset.step));
  });
  document.addEventListener("keydown", (e) => {
    if (!document.body.classList.contains("focus-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });
  // Telefonda büyük görselde parmakla sağa/sola kaydırınca sonraki desen
  let tx = null;
  $("f-img").parentElement.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
  $("f-img").parentElement.addEventListener("touchend", (e) => {
    if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
  });

  render();
})();

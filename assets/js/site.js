(() => {
  "use strict";

  const WHATSAPP_NUMBER = "905348578836";
  const FAVORITES_KEY = "forma-kutusu-favorites-v1";
  const CONSENT_KEY = "forma-kutusu-consent-v1";
  const MOBILE_NAV_QUERY = "(max-width: 1179px)";

  const safeStorage = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Depolama kapalı olsa da temel site işlevleri çalışmaya devam eder.
      }
    },
  };

  function openWhatsApp(message) {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (!popup) window.location.assign(url);
  }

  function initNavigation() {
    const toggle = document.querySelector("[data-nav-toggle]");
    const nav = document.querySelector("[data-site-nav]");
    if (!toggle || !nav) return;

    const label = toggle.querySelector(".sr-only");

    const close = ({ restoreFocus = false } = {}) => {
      toggle.setAttribute("aria-expanded", "false");
      if (label) label.textContent = "Menüyü aç";
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      if (restoreFocus) toggle.focus();
    };

    const open = () => {
      toggle.setAttribute("aria-expanded", "true");
      if (label) label.textContent = "Menüyü kapat";
      nav.classList.add("is-open");
      document.body.classList.add("nav-open");
      nav.querySelector("a")?.focus();
    };

    toggle.addEventListener("click", () => {
      if (toggle.getAttribute("aria-expanded") === "true") {
        close({ restoreFocus: true });
      } else {
        open();
      }
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) close();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        close({ restoreFocus: true });
      }
    });

    const desktopQuery = window.matchMedia(`not ${MOBILE_NAV_QUERY}`);
    const handleBreakpoint = (event) => {
      if (event.matches && nav.classList.contains("is-open")) close();
    };

    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", handleBreakpoint);
    } else {
      desktopQuery.addListener(handleBreakpoint);
    }
  }

  function initNavGroups() {
    document.querySelectorAll("[data-nav-group]").forEach((group) => {
      const toggle = group.querySelector(".site-nav__toggle");
      const label = group.querySelector("a")?.textContent || "";
      if (!toggle) return;

      const setOpen = (open) => {
        group.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", `${label} alt menüsünü ${open ? "kapat" : "aç"}`);
      };

      toggle.addEventListener("click", () => {
        group.classList.remove("is-dismissed");
        setOpen(!group.classList.contains("is-open"));
      });

      group.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        const visible = group.classList.contains("is-open") || group.matches(":focus-within");
        if (!visible) return;
        event.stopPropagation();
        setOpen(false);
        group.classList.add("is-dismissed");
        toggle.focus();
      });

      group.addEventListener("focusout", (event) => {
        if (group.contains(event.relatedTarget)) return;
        setOpen(false);
        group.classList.remove("is-dismissed");
      });

      group.addEventListener("mouseleave", () => group.classList.remove("is-dismissed"));

      document.addEventListener("click", (event) => {
        if (!group.contains(event.target)) setOpen(false);
      });
    });
  }

  // Yazılabilir alanlar Türkçe kurallarıyla büyük harfe çevrilir (i → İ, ı → I).
  function initUppercaseFields() {
    const toUpper = (field) => {
      const start = field.selectionStart;
      const end = field.selectionEnd;
      const upper = field.value.toLocaleUpperCase("tr-TR");
      if (upper === field.value) return;
      field.value = upper;
      if (start !== null && document.activeElement === field) field.setSelectionRange(start, end);
    };

    document.addEventListener("input", (event) => {
      const field = event.target.closest?.("[data-uppercase]");
      if (field && !event.isComposing) toUpper(field);
    });

    document.addEventListener("compositionend", (event) => {
      const field = event.target.closest?.("[data-uppercase]");
      if (field) toUpper(field);
    });
  }

  function initOrderForm() {
    const form = document.querySelector("[data-order-form]");
    if (!form) return;

    const SIZES = ["116", "128", "140", "152", "164", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];
    const PRICES = { ust: 300, takim: 450, socks: 30 };
    const MIN_QTY = 5;
    const MAX_QTY = 60;
    const MAX_FILE = 10 * 1024 * 1024;
    const FILE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "application/pdf"];

    const quantityInput = form.querySelector("[data-order-quantity]");
    const roster = form.querySelector("[data-order-roster]");
    const shorts = form.querySelector("[data-order-shorts]");
    const totalLabel = form.querySelector("[data-order-total]");
    const errorBox = form.querySelector("[data-order-errors]");
    const status = form.querySelector("[data-order-status]");
    const uploads = [...form.querySelectorAll("[data-upload]")];
    const formatTL = (value) => `${value.toLocaleString("tr-TR")}₺`;

    const quantity = () => {
      const value = Number.parseInt(quantityInput.value, 10);
      return Number.isFinite(value) ? value : 0;
    };
    const checked = (name) => form.querySelector(`[name="${name}"]:checked`)?.value || "";
    const isOn = (name) => Boolean(form.querySelector(`[name="${name}"]`)?.checked);

    const sizeOptions = SIZES.map((size) => `<option value="${size}">${size}</option>`).join("");

    const buildRoster = () => {
      const count = Math.min(Math.max(quantity(), 0), MAX_QTY);
      const rows = [...roster.querySelectorAll("[data-roster-row]")];

      for (let index = rows.length; index < count; index += 1) {
        const row = document.createElement("div");
        row.className = "order-roster__row";
        row.dataset.rosterRow = "";
        row.innerHTML = `
          <span class="order-roster__index">${index + 1}</span>
          <label><span class="sr-only">${index + 1}. oyuncu ismi</span><input type="text" name="player-name" maxlength="20" autocomplete="off" placeholder="İSİM" data-uppercase data-roster-field="name"></label>
          <label><span class="sr-only">${index + 1}. oyuncu numarası</span><input type="text" name="player-number" maxlength="3" inputmode="numeric" autocomplete="off" placeholder="NO" data-roster-field="number"></label>
          <label><span class="sr-only">${index + 1}. oyuncu bedeni</span><select name="player-size" data-roster-field="size"><option value="">BEDEN</option>${sizeOptions}</select></label>`;
        roster.append(row);
      }

      rows.slice(count).forEach((row) => row.remove());
      syncRosterFields();
    };

    const syncRosterFields = () => {
      const hasName = isOn("has-name");
      const hasNumber = isOn("has-number");
      roster.classList.toggle("is-no-name", !hasName);
      roster.classList.toggle("is-no-number", !hasNumber);
      roster.querySelectorAll('[data-roster-field="name"]').forEach((input) => (input.disabled = !hasName));
      roster.querySelectorAll('[data-roster-field="number"]').forEach((input) => (input.disabled = !hasNumber));
    };

    const updateTotal = () => {
      const qty = quantity();
      const unit = (checked("scope") === "ust" ? PRICES.ust : PRICES.takim) + (checked("socks") === "var" ? PRICES.socks : 0);
      shorts.hidden = checked("scope") === "ust";
      totalLabel.textContent =
        qty >= MIN_QTY
          ? `Tahmini tutar: ${qty} × ${formatTL(unit)} = ${formatTL(qty * unit)} (kaleci farkı hariç; kesin tutar sipariş görüşmesinde teyit edilir)`
          : `En az ${MIN_QTY} adet sipariş verilebilir.`;
    };

    uploads.forEach((upload) => {
      const input = upload.querySelector("[data-upload-input]");
      const none = upload.querySelector("[data-upload-none]");
      const preview = upload.querySelector("[data-upload-preview]");

      const showPreview = () => {
        const file = input.files?.[0];
        preview.replaceChildren();
        preview.hidden = !file;
        if (!file) return;
        if (file.type.startsWith("image/")) {
          const img = document.createElement("img");
          img.src = URL.createObjectURL(file);
          img.alt = "";
          img.onload = () => URL.revokeObjectURL(img.src);
          preview.append(img);
        }
        preview.append(document.createTextNode(file.name));
      };

      input.addEventListener("change", () => {
        if (input.files?.length) none.checked = false;
        upload.classList.toggle("is-none", none.checked);
        showPreview();
      });

      none.addEventListener("change", () => {
        if (none.checked) input.value = "";
        input.disabled = none.checked;
        upload.classList.toggle("is-none", none.checked);
        showPreview();
      });
    });

    const uploadState = () =>
      uploads.map((upload) => {
        const input = upload.querySelector("[data-upload-input]");
        const label = upload.querySelector(".order-upload__field > span").textContent;
        return { label, file: input.files?.[0] || null, none: upload.querySelector("[data-upload-none]").checked };
      });

    const validate = () => {
      const errors = [];
      const qty = quantity();
      if (qty < MIN_QTY) errors.push(`Adet en az ${MIN_QTY} olmalı.`);
      if (qty > MAX_QTY) errors.push(`${MAX_QTY} adetten fazla siparişler için lütfen WhatsApp'tan yaz.`);
      if (!checked("collar")) errors.push("Yaka tipini seç.");

      uploadState().forEach(({ label, file, none }) => {
        if (!file && !none) errors.push(`${label}: dosya yükle ya da "yok" seçeneğini işaretle.`);
        const allowed = file && (FILE_TYPES.includes(file.type) || /\.(png|jpe?g|webp|svg|pdf)$/i.test(file.name));
        if (file && !allowed) errors.push(`${label}: PNG, JPG, WEBP, SVG veya PDF yükle.`);
        if (file && file.size > MAX_FILE) errors.push(`${label}: dosya 10 MB'tan küçük olmalı.`);
      });

      const rows = [...roster.querySelectorAll("[data-roster-row]")];
      const missingSize = rows.filter((row) => !row.querySelector('[data-roster-field="size"]').value).length;
      if (missingSize) errors.push(`${missingSize} satırda beden seçilmedi.`);
      if (isOn("has-number")) {
        const missingNumber = rows.filter((row) => !row.querySelector('[data-roster-field="number"]').value.trim()).length;
        if (missingNumber) errors.push(`${missingNumber} satırda numara eksik.`);
      }
      if (isOn("has-name")) {
        const missingName = rows.filter((row) => !row.querySelector('[data-roster-field="name"]').value.trim()).length;
        if (missingName) errors.push(`${missingName} satırda isim eksik.`);
      }
      return errors;
    };

    const buildMessage = () => {
      const qty = quantity();
      const scope = checked("scope");
      const unit = (scope === "ust" ? PRICES.ust : PRICES.takim) + (checked("socks") === "var" ? PRICES.socks : 0);
      const yesNo = (value) => (value ? "Var" : "Yok");
      const lines = [
        "Merhaba, sipariş vermek istiyorum.",
        "",
        `Model: ${form.dataset.model} (${form.dataset.sportLabel})`,
        `Adet: ${qty}`,
        `Ürün: ${scope === "ust" ? "Tek üst forma" : "Forma + şort"}`,
        `Çorap: ${checked("socks") === "var" ? "Var" : "Yok"}`,
        `Yaka: ${checked("collar")}`,
        "",
        "FORMA ÖNÜ",
        ...uploadState().map(({ label, file }) => `${label}: ${file ? `Var (dosya: ${file.name})` : "Yok"}`),
        "",
        "FORMA ARKASI",
        `Sırt yazısı: ${form.querySelector('[name="back-text"]').value.trim() || "Yok"}`,
        `Numara: ${yesNo(isOn("has-number"))}`,
        `İsim: ${yesNo(isOn("has-name"))}`,
      ];

      if (scope !== "ust") {
        lines.push("", "ŞORT", `Sağ paça logo: ${isOn("shorts-logo") ? "Evet" : "Hayır"}`, `Sol paça numara: ${isOn("shorts-number") ? "Evet" : "Hayır"}`);
      }

      lines.push("", "LİSTE (İSİM - NUMARA - BEDEN)");
      roster.querySelectorAll("[data-roster-row]").forEach((row, index) => {
        const name = isOn("has-name") ? row.querySelector('[data-roster-field="name"]').value.trim() : "";
        const number = isOn("has-number") ? row.querySelector('[data-roster-field="number"]').value.trim() : "";
        const size = row.querySelector('[data-roster-field="size"]').value;
        lines.push(`${index + 1}. ${[name || "-", number || "-", size].join(" - ")}`);
      });

      lines.push("", `Tahmini tutar: ${qty} × ${formatTL(unit)} = ${formatTL(qty * unit)} (kaleci farkı hariç)`);
      return lines.join("\n");
    };

    quantityInput.addEventListener("input", () => {
      buildRoster();
      updateTotal();
    });
    form.addEventListener("change", (event) => {
      if (event.target.matches("[data-roster-toggle]")) syncRosterFields();
      updateTotal();
    });

    roster.addEventListener("input", (event) => {
      if (event.target.matches('[data-roster-field="number"]')) {
        event.target.value = event.target.value.replace(/\D/g, "");
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const errors = validate();
      errorBox.hidden = errors.length === 0;
      errorBox.replaceChildren(...errors.map((error) => Object.assign(document.createElement("span"), { textContent: error })));
      if (errors.length) {
        errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      const message = buildMessage();
      const files = uploadState().map(({ file }) => file).filter(Boolean);

      // Paylaşım ve pencere açma kullanıcı etkileşimi gerektirir; pano yazımı beklenmez.
      navigator.clipboard?.writeText(message).catch(() => {});

      if (files.length && navigator.canShare?.({ files, text: message })) {
        try {
          await navigator.share({ files, text: message, title: `${form.dataset.model} sipariş` });
          status.textContent = "Paylaşım menüsü açıldı. WhatsApp'ı seçerek logoları ve sipariş bilgilerini gönderebilirsin; mesaj ayrıca panoya kopyalandı.";
          return;
        } catch (error) {
          if (error?.name === "AbortError") return;
        }
      }

      openWhatsApp(message);
      status.textContent = files.length
        ? `WhatsApp açıldı. Logo dosyalarını (${files.map((file) => file.name).join(", ")}) sohbete ekleyerek gönder. Mesaj panoya da kopyalandı.`
        : "WhatsApp açıldı; mesajı kontrol edip gönderebilirsin. Mesaj panoya da kopyalandı.";
    });

    buildRoster();
    updateTotal();
  }

  function initCatalog() {
    const cards = [...document.querySelectorAll("[data-model-card]")];
    const favoriteButtons = [...document.querySelectorAll("[data-favorite]")];
    const countLabels = [...document.querySelectorAll("[data-favorite-count]")];

    let favorites = new Set(
      safeStorage
        .get(FAVORITES_KEY, [])
        .filter((item) => typeof item === "string")
        .map((item) => item.toUpperCase()),
    );

    const params = new URLSearchParams(window.location.search);
    const sharedFavorites = params
      .get("favoriler")
      ?.split(",")
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);

    if (sharedFavorites?.length) {
      favorites = new Set([...favorites, ...sharedFavorites]);
      safeStorage.set(FAVORITES_KEY, [...favorites]);
    }

    const syncFavorites = () => {
      favoriteButtons.forEach((button) => {
        const id = (button.dataset.favorite || "").toUpperCase();
        const isFavorite = favorites.has(id);
        button.setAttribute("aria-pressed", String(isFavorite));
        button.setAttribute(
          "aria-label",
          `${id} modelini favoriler${isFavorite ? "den çıkar" : "e ekle"}`,
        );
        const icon = button.querySelector("span");
        if (icon) icon.textContent = isFavorite ? "♥" : "♡";
      });

      countLabels.forEach((label) => {
        label.textContent = String(favorites.size);
      });
    };

    syncFavorites();
    if (!cards.length) return;

    const search = document.querySelector("[data-model-search]");
    const filterButtons = [...document.querySelectorAll("[data-model-filter]")];
    const result = document.querySelector("[data-model-result]");
    const empty = document.querySelector("[data-model-empty]");
    const share = document.querySelector("[data-share-favorites]");

    const requestedFilter = (params.get("filtre") || "").toLowerCase();
    let activeFilter =
      requestedFilter === "favoriler" || requestedFilter === "favorites" || sharedFavorites?.length
        ? "favorites"
        : "all";

    const syncFilterButtons = () => {
      filterButtons.forEach((button) => {
        const selected = button.dataset.modelFilter === activeFilter;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    };

    const applyFilters = () => {
      const query = (search?.value || "").trim().toLocaleUpperCase("tr-TR");
      let visibleCount = 0;

      cards.forEach((card) => {
        const id = (card.dataset.modelId || "").toUpperCase();
        const sport = card.dataset.sport || "";
        const filterMatches =
          activeFilter === "all" ||
          sport === activeFilter ||
          (activeFilter === "favorites" && favorites.has(id));
        const visible = filterMatches && (!query || id.includes(query));
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      if (result) result.textContent = `${visibleCount} model gösteriliyor.`;
      if (empty) empty.hidden = visibleCount !== 0;
      if (share) share.disabled = favorites.size === 0;
    };

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-favorite]");
      if (!button) return;

      const id = (button.dataset.favorite || "").toUpperCase();
      if (!id) return;

      if (favorites.has(id)) favorites.delete(id);
      else favorites.add(id);

      safeStorage.set(FAVORITES_KEY, [...favorites]);
      syncFavorites();
      applyFilters();
    });

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.modelFilter || "all";
        syncFilterButtons();
        applyFilters();
      });
    });

    search?.addEventListener("input", applyFilters);

    share?.addEventListener("click", () => {
      const selected = [...favorites].sort();
      if (!selected.length) return;

      const shareUrl = `${window.location.origin}/modeller/?favoriler=${encodeURIComponent(selected.join(","))}`;
      openWhatsApp(
        `Merhaba, Forma Kutusu kataloğunda şu modelleri favorilerime ekledim: ${selected.join(", ")}\n\nPaylaşılabilir liste: ${shareUrl}\n\nBu modeller için takımımıza özel sipariş vermek istiyorum.`,
      );
    });

    syncFilterButtons();
    applyFilters();
  }

  function initGallery() {
    const dialog = document.querySelector("[data-gallery-dialog]");
    const image = dialog?.querySelector("[data-gallery-image]");
    const caption = dialog?.querySelector("[data-gallery-caption]");
    if (!dialog || !image || !caption) return;

    document.querySelectorAll("[data-gallery-item]").forEach((button) => {
      button.addEventListener("click", () => {
        image.src = button.dataset.galleryItem || "";
        image.alt = button.dataset.galleryAlt || "";
        caption.textContent = button.dataset.galleryAlt || "";
        if (typeof dialog.showModal === "function") dialog.showModal();
      });
    });

    dialog.querySelector("[data-dialog-close]")?.addEventListener("click", () => {
      if (dialog.open) dialog.close();
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog && dialog.open) dialog.close();
    });
  }

  function initProductGallery() {
    const gallery = document.querySelector("[data-product-gallery]");
    const image = gallery?.querySelector("[data-product-image]");
    const controls = [...(gallery?.querySelectorAll("[data-product-view]") || [])];
    if (!gallery || !image || !controls.length) return;

    controls.forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.dataset.productView === "detail" ? "detail" : "full";
        gallery.dataset.productMode = mode;
        controls.forEach((control) => {
          const selected = control === button;
          control.classList.toggle("is-active", selected);
          control.setAttribute("aria-pressed", String(selected));
        });
      });
    });
  }

  function initConsent() {
    let banner = null;

    const updateConsent = (state) => {
      window.dataLayer = window.dataLayer || [];
      const gtag =
        typeof window.gtag === "function"
          ? window.gtag
          : function () {
              window.dataLayer.push(arguments);
            };
      gtag("consent", "update", {
        ad_storage: state,
        ad_user_data: state,
        ad_personalization: state,
        analytics_storage: state,
      });
    };

    const hide = () => {
      banner?.remove();
      banner = null;
      document.body.classList.remove("has-consent-banner");
    };

    const show = () => {
      if (banner) {
        banner.querySelector("button")?.focus();
        return;
      }

      banner = document.createElement("section");
      banner.className = "consent-banner";
      banner.setAttribute("aria-label", "Çerez tercihleri");
      banner.innerHTML = `
        <p>Siteyi geliştirmek için analiz çerezleri kullanmak istiyoruz. Onay vermezsen yalnızca sitenin çalışması için gerekli olanlar kullanılır. <a href="/kvkk-ve-gizlilik/">Gizlilik notu</a></p>
        <div class="consent-banner__actions">
          <button class="consent-banner__button" type="button" data-consent="denied">Reddet</button>
          <button class="consent-banner__button" type="button" data-consent="granted">Kabul et</button>
        </div>`;

      banner.addEventListener("click", (event) => {
        const button = event.target.closest("[data-consent]");
        if (!button) return;
        const state = button.dataset.consent === "granted" ? "granted" : "denied";
        safeStorage.set(CONSENT_KEY, state);
        updateConsent(state);
        hide();
      });

      document.body.append(banner);
      document.body.classList.add("has-consent-banner");
    };

    const footerBottom = document.querySelector(".site-footer__bottom");
    if (footerBottom) {
      const settings = document.createElement("button");
      settings.className = "consent-link";
      settings.type = "button";
      settings.textContent = "Çerez tercihleri";
      settings.addEventListener("click", show);
      footerBottom.append(settings);
    }

    const stored = safeStorage.get(CONSENT_KEY, null);
    if (stored !== "granted" && stored !== "denied") show();
  }

  initNavigation();
  initNavGroups();
  initUppercaseFields();
  initOrderForm();
  initConsent();
  initCatalog();
  initGallery();
  initProductGallery();
})();

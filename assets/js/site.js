(() => {
  "use strict";

  const WHATSAPP_NUMBER = "905348578836";
  const FAVORITES_KEY = "forma-kutusu-favorites-v1";
  const MOBILE_NAV_QUERY = "(max-width: 980px)";

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
    const groups = [...nav.querySelectorAll("[data-nav-group]")];
    const header = nav.closest("header");

    const setMobileNavTop = () => {
      if (!window.matchMedia(MOBILE_NAV_QUERY).matches || !header) return;
      nav.style.setProperty("--mobile-nav-top", `${Math.max(0, Math.round(header.getBoundingClientRect().bottom))}px`);
    };

    const closeGroups = (except = null) => {
      groups.forEach((group) => {
        if (group !== except) group.removeAttribute("open");
      });
    };

    const close = ({ restoreFocus = false } = {}) => {
      toggle.setAttribute("aria-expanded", "false");
      if (label) label.textContent = "Menüyü aç";
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      closeGroups();
      if (restoreFocus) toggle.focus();
    };

    const open = () => {
      setMobileNavTop();
      toggle.setAttribute("aria-expanded", "true");
      if (label) label.textContent = "Menüyü kapat";
      nav.classList.add("is-open");
      document.body.classList.add("nav-open");
      nav.querySelector("summary, a")?.focus();
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

    window.addEventListener("resize", () => {
      if (nav.classList.contains("is-open")) setMobileNavTop();
    });

    groups.forEach((group) => {
      group.addEventListener("toggle", () => {
        if (group.open) closeGroups(group);
      });
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest("[data-site-nav]")) closeGroups();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        const openGroup = groups.find((group) => group.open);
        if (openGroup) {
          openGroup.removeAttribute("open");
          openGroup.querySelector("summary")?.focus();
        } else if (nav.classList.contains("is-open")) {
          close({ restoreFocus: true });
        }
      }
    });

    const normalizePath = (pathname) => `${pathname.replace(/\/+$/, "") || "/"}/`.replace("//", "/");
    const currentUrl = new URL(window.location.href);
    const currentPath = normalizePath(currentUrl.pathname);
    const candidates = [...nav.querySelectorAll("a[href]")]
      .map((link) => ({ link, url: new URL(link.href, currentUrl) }))
      .filter(({ url }) => normalizePath(url.pathname) === currentPath);

    let currentLink = candidates.find(({ url }) =>
      url.search === currentUrl.search && (!url.hash || url.hash === currentUrl.hash),
    );
    if (!currentLink && currentPath === "/modeller/" && currentUrl.searchParams.has("favoriler")) {
      currentLink = candidates.find(({ url }) => url.searchParams.get("filtre") === "favoriler");
    }
    currentLink ||= candidates.find(({ url }) => !url.search && !url.hash) || candidates[0];
    if (currentLink) {
      currentLink.link.classList.add("is-current");
      currentLink.link.setAttribute("aria-current", "page");
      currentLink.link.closest("[data-nav-group]")?.classList.add("has-current");
    }

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
        : requestedFilter === "populer" || requestedFilter === "popular"
          ? "popular"
          : params.get("sezon") === "2026"
            ? "season-2026"
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
          (activeFilter === "season-2026" && card.dataset.season === "2026") ||
          (activeFilter === "popular" && card.dataset.featured === "true") ||
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

    if (window.location.hash === "#model-search") {
      window.requestAnimationFrame(() => search?.focus());
    }

    share?.addEventListener("click", () => {
      const selected = [...favorites].sort();
      if (!selected.length) return;

      const shareUrl = `${window.location.origin}/modeller/?favoriler=${encodeURIComponent(selected.join(","))}`;
      openWhatsApp(
        `Merhaba, Forma Kutusu kataloğunda şu modelleri favorilerime ekledim: ${selected.join(", ")}\n\nPaylaşılabilir liste: ${shareUrl}\n\nBu modeller için takımımıza özel teklif almak istiyorum.`,
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

  function initQuoteForm() {
    const form = document.querySelector("[data-quote-form]");
    if (!form) return;

    const steps = [...form.querySelectorAll("[data-form-step]")];
    const progress = [...form.querySelectorAll("[data-progress-step]")];
    const alertBox = form.querySelector("[data-form-alert]");
    const summary = document.querySelector("[data-quote-summary]");
    const showAllSteps = form.dataset.formMode === "all";
    let currentStep = 1;

    const fields = {
      fullName: form.elements.fullName,
      phone: form.elements.phone,
      email: form.elements.email,
      teamName: form.elements.teamName,
      product: form.elements.product,
      quantity: form.elements.quantity,
      sizes: form.elements.sizes,
      modelCode: form.elements.modelCode,
      colors: form.elements.colors,
      sponsor: form.elements.sponsor,
      notes: form.elements.notes,
      deliveryDate: form.elements.deliveryDate,
      visualFile: form.elements.visualFile,
      rosterFile: form.elements.rosterFile,
    };

    const summaryKeys = ["fullName", "teamName", "product", "quantity", "modelCode"];

    const updateSummary = () => {
      if (!summary) return;
      summary.querySelectorAll("div").forEach((row, index) => {
        const value = fields[summaryKeys[index]]?.value?.trim() || "—";
        const output = row.querySelector("dd");
        if (output) output.textContent = value;
      });
    };

    const showAlert = (message = "") => {
      if (!alertBox) return;
      alertBox.textContent = message;
      alertBox.hidden = !message;
      if (message) {
        alertBox.setAttribute("tabindex", "-1");
        alertBox.focus();
      }
    };

    const setStep = (step) => {
      if (showAllSteps) return;
      currentStep = Math.max(1, Math.min(steps.length, step));
      steps.forEach((fieldset, index) => {
        fieldset.hidden = index + 1 !== currentStep;
      });
      progress.forEach((item, index) => {
        item.classList.toggle("is-active", index + 1 === currentStep);
        item.classList.toggle("is-complete", index + 1 < currentStep);
      });
      showAlert();
      steps[currentStep - 1]?.querySelector("input,select,textarea,button")?.focus();
      window.scrollTo({
        top: Math.max(0, form.getBoundingClientRect().top + window.scrollY - 110),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    };

    const validateFile = (input) => {
      const file = input.files?.[0];
      input.removeAttribute("aria-invalid");
      if (!file) return "";

      const maxSize = Number(input.dataset.maxSize || 10485760);
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      const allowed =
        input.name === "visualFile"
          ? ["png", "jpg", "jpeg", "webp", "pdf"]
          : ["csv", "xls", "xlsx"];

      if (!allowed.includes(extension)) {
        input.setAttribute("aria-invalid", "true");
        return `${file.name} desteklenen bir dosya türü değil.`;
      }
      if (file.size > maxSize) {
        input.setAttribute("aria-invalid", "true");
        return `${file.name} 10 MB sınırını aşıyor.`;
      }
      return "";
    };

    const validateStep = (step) => {
      const fieldset = steps[step - 1];
      if (!fieldset) return false;

      const invalid = [];
      fieldset.querySelectorAll("input, select, textarea").forEach((field) => {
        if (field.disabled || field.type === "file") return;
        field.removeAttribute("aria-invalid");
        const invalidQuantity =
          field.name === "quantity" && field.value &&
          (Number(field.value) < 5 || Number(field.value) > 500);
        const invalidPhone =
          field.type === "tel" && field.value && field.value.replace(/\D/g, "").length < 10;

        if (!field.checkValidity() || invalidQuantity || invalidPhone) {
          field.setAttribute("aria-invalid", "true");
          invalid.push(field);
        }
      });

      fieldset.querySelectorAll('input[type="file"]').forEach((input) => {
        if (validateFile(input)) invalid.push(input);
      });

      if (!invalid.length) return true;

      showAlert(
        step === 3
          ? "Lütfen dosya türlerini, boyutlarını ve onay kutusunu kontrol edin."
          : "Lütfen yıldızlı alanları doğru biçimde doldurun.",
      );
      invalid[0].focus();
      return false;
    };

    form.querySelectorAll("[data-next-step]").forEach((button) => {
      button.addEventListener("click", () => {
        if (validateStep(currentStep)) setStep(currentStep + 1);
      });
    });

    form.querySelectorAll("[data-prev-step]").forEach((button) => {
      button.addEventListener("click", () => setStep(currentStep - 1));
    });

    form.addEventListener("input", updateSummary);
    form.addEventListener("change", (event) => {
      if (event.target.matches('input[type="file"]')) {
        showAlert(validateFile(event.target));
      }
      updateSummary();
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (showAllSteps) {
        for (let step = 1; step <= steps.length; step += 1) {
          if (!validateStep(step)) return;
        }
      } else if (!validateStep(3)) return;

      const values = Object.fromEntries(
        [...new FormData(form).entries()].filter(([, value]) => typeof value === "string"),
      );
      const visualFile = fields.visualFile?.files?.[0]?.name;
      const rosterFile = fields.rosterFile?.files?.[0]?.name;
      const lines = [
        "Merhaba, takımımız için özel forma teklifi almak istiyorum.",
        "",
        `Ad soyad: ${values.fullName || "Belirtilmedi"}`,
        `Telefon: ${values.phone || "Belirtilmedi"}`,
        `E-posta: ${values.email || "Belirtilmedi"}`,
        `Takım / organizasyon: ${values.teamName || "Belirtilmedi"}`,
        `Ürün: ${values.product || "Belirtilmedi"}`,
        `Adet: ${values.quantity || "Belirtilmedi"}`,
        `Beden dağılımı: ${values.sizes || "Belirtilmedi"}`,
        `Model kodu: ${values.modelCode || "Belirtilmedi"}`,
        `Takım renkleri: ${values.colors || "Belirtilmedi"}`,
        `Logo / sponsor: ${values.sponsor || "Belirtilmedi"}`,
        `Teslimat beklentisi: ${values.deliveryDate || "Belirtilmedi"}`,
        `Not: ${values.notes || "Yok"}`,
      ];

      if (visualFile || rosterFile) {
        lines.push("", "Seçtiğim dosyaları bu sohbete ayrıca ekleyeceğim:");
        if (visualFile) lines.push(`- Logo / örnek: ${visualFile}`);
        if (rosterFile) lines.push(`- Takım listesi: ${rosterFile}`);
      }

      openWhatsApp(lines.join("\n"));
    });

    const modelFromQuery = new URLSearchParams(window.location.search).get("model");
    if (modelFromQuery && fields.modelCode) {
      fields.modelCode.value = modelFromQuery.toUpperCase();
    }
    updateSummary();
  }

  function validateStaticForm(form, alertBox) {
    const invalid = [];
    form.querySelectorAll("input, select, textarea").forEach((field) => {
      field.removeAttribute("aria-invalid");
    });

    form.querySelectorAll("input, select, textarea").forEach((field) => {
      if (field.disabled || field.type === "file") return;
      const quantityInvalid = field.name === "quantity" && field.value && (Number(field.value) < 5 || Number(field.value) > 500);
      const phoneInvalid = field.type === "tel" && field.value && field.value.replace(/\D/g, "").length < 10;
      if (!field.checkValidity() || quantityInvalid || phoneInvalid) {
        field.setAttribute("aria-invalid", "true");
        invalid.push(field);
      }
    });

    form.querySelectorAll('input[type="file"]').forEach((input) => {
      const file = input.files?.[0];
      if (!file) return;
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      const allowed = ["png", "jpg", "jpeg", "webp", "pdf"];
      const maxSize = Number(input.dataset.maxSize || 10485760);
      if (!allowed.includes(extension) || file.size > maxSize) {
        input.setAttribute("aria-invalid", "true");
        invalid.push(input);
      }
    });

    if (alertBox) {
      alertBox.hidden = invalid.length === 0;
      alertBox.textContent = invalid.length
        ? "Lütfen zorunlu alanları, telefon numarasını, adedi ve dosya sınırını kontrol edin."
        : "";
    }
    if (invalid.length) {
      invalid[0].focus();
      return false;
    }
    return true;
  }

  function textFormValues(form) {
    return Object.fromEntries(
      [...new FormData(form).entries()].filter(([, value]) => typeof value === "string"),
    );
  }

  function initQuickQuoteForm() {
    const form = document.querySelector("[data-quick-quote-form]");
    if (!form) return;
    const alertBox = form.querySelector("[data-quick-form-alert]");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateStaticForm(form, alertBox)) return;
      const values = textFormValues(form);
      const visualFile = form.elements.visualFile?.files?.[0]?.name;
      const lines = [
        "Merhaba, takımımız için forma teklifi almak istiyorum.",
        "",
        `Ad soyad: ${values.fullName}`,
        `Telefon: ${values.phone}`,
        `E-posta: ${values.email || "Belirtilmedi"}`,
        `Ürün: ${values.product}`,
        `Adet: ${values.quantity}`,
        `Beden dağılımı: ${values.sizes || "Belirtilmedi"}`,
        `Takım / kulüp: ${values.teamName || "Belirtilmedi"}`,
        `Renk tercihi: ${values.colors || "Belirtilmedi"}`,
        `Logo / sponsor: ${values.sponsor || "Belirtilmedi"}`,
        `Teslimat beklentisi: ${values.deliveryDate || "Belirtilmedi"}`,
        `Not: ${values.notes || "Yok"}`,
      ];
      if (visualFile) lines.push("", `Seçtiğim dosyayı sohbete ayrıca ekleyeceğim: ${visualFile}`);
      openWhatsApp(lines.join("\n"));
    });
  }

  function initBulkForm() {
    const form = document.querySelector("[data-bulk-form]");
    if (!form) return;
    const alertBox = form.querySelector("[data-bulk-form-alert]");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateStaticForm(form, alertBox)) return;
      const values = textFormValues(form);
      const fileName = form.elements.visualFile?.files?.[0]?.name;
      const lines = [
        "Merhaba, bayilik / toplu sipariş için görüşmek istiyorum.",
        "",
        `Kurum / firma: ${values.organization}`,
        `Yetkili kişi: ${values.contactName}`,
        `Telefon: ${values.phone}`,
        `E-posta: ${values.email || "Belirtilmedi"}`,
        `Talep türü: ${values.requestType}`,
        `Tahmini adet: ${values.quantity}`,
        `Ürün grubu: ${values.productGroup}`,
        `Şehir: ${values.city}`,
        `Not: ${values.notes || "Yok"}`,
      ];
      if (fileName) lines.push("", `Dosyayı sohbete ayrıca ekleyeceğim: ${fileName}`);
      openWhatsApp(lines.join("\n"));
    });
  }

  function initWhatsAppMessages() {
    document.querySelectorAll("[data-whatsapp-message]").forEach((button) => {
      button.addEventListener("click", () => {
        const message = button.dataset.whatsappMessage?.trim();
        if (message) openWhatsApp(message);
      });
    });
  }

  initNavigation();
  initCatalog();
  initGallery();
  initProductGallery();
  initQuoteForm();
  initQuickQuoteForm();
  initBulkForm();
  initWhatsAppMessages();
})();

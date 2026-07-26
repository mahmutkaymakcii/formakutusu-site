(() => {
  "use strict";

  const WHATSAPP_NUMBER = "905348578836";
  const FAVORITES_KEY = "forma-kutusu-favorites-v1";

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
        // Site işlevleri depolama kapalıyken de devam eder.
      }
    },
  };

  const openWhatsApp = (message) => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (!popup) window.location.href = url;
  };

  function initNavigation() {
    const toggle = document.querySelector("[data-nav-toggle]");
    const nav = document.querySelector("[data-site-nav]");
    if (!toggle || !nav) return;

    const close = ({ restoreFocus = false } = {}) => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.querySelector(".sr-only").textContent = "Menüyü aç";
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      if (restoreFocus) toggle.focus();
    };

    const open = () => {
      toggle.setAttribute("aria-expanded", "true");
      toggle.querySelector(".sr-only").textContent = "Menüyü kapat";
      nav.classList.add("is-open");
      document.body.classList.add("nav-open");
      nav.querySelector("a")?.focus();
    };

    toggle.addEventListener("click", () => {
      toggle.getAttribute("aria-expanded") === "true"
        ? close({ restoreFocus: true })
        : open();
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) close();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        close({ restoreFocus: true });
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 832 && nav.classList.contains("is-open")) close();
    });
  }

  function initCatalog() {
    const cards = [...document.querySelectorAll("[data-model-card]")];
    if (!cards.length) return;

    const search = document.querySelector("[data-model-search]");
    const filterButtons = [...document.querySelectorAll("[data-model-filter]")];
    const result = document.querySelector("[data-model-result]");
    const empty = document.querySelector("[data-model-empty]");
    const share = document.querySelector("[data-share-favorites]");
    const countLabels = [...document.querySelectorAll("[data-favorite-count]")];
    let activeFilter = "all";
    let favorites = new Set(
      safeStorage
        .get(FAVORITES_KEY, [])
        .filter((item) => typeof item === "string"),
    );

    const queryFavorites = new URLSearchParams(window.location.search)
      .get("favoriler")
      ?.split(",")
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);
    if (queryFavorites?.length) {
      favorites = new Set([...favorites, ...queryFavorites]);
      safeStorage.set(FAVORITES_KEY, [...favorites]);
    }

    const syncFavorites = () => {
      document.querySelectorAll("[data-favorite]").forEach((button) => {
        const id = button.dataset.favorite;
        const isFavorite = favorites.has(id);
        button.setAttribute("aria-pressed", String(isFavorite));
        button.setAttribute(
          "aria-label",
          `${id} modelini favoriler${isFavorite ? "den çıkar" : "e ekle"}`,
        );
        button.querySelector("span").textContent = isFavorite ? "♥" : "♡";
      });
      countLabels.forEach((label) => {
        label.textContent = String(favorites.size);
      });
      if (share) share.disabled = favorites.size === 0;
    };

    const applyFilters = () => {
      const query = (search?.value || "").trim().toLocaleUpperCase("tr-TR");
      let visibleCount = 0;
      cards.forEach((card) => {
        const id = card.dataset.modelId;
        const sport = card.dataset.sport;
        const filterMatches =
          activeFilter === "all" ||
          sport === activeFilter ||
          (activeFilter === "favorites" && favorites.has(id));
        const searchMatches = !query || id.includes(query);
        const visible = filterMatches && searchMatches;
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });
      if (result) result.textContent = `${visibleCount} model gösteriliyor.`;
      if (empty) empty.hidden = visibleCount !== 0;
    };

    document.addEventListener("click", (event) => {
      const favoriteButton = event.target.closest("[data-favorite]");
      if (!favoriteButton) return;
      const id = favoriteButton.dataset.favorite;
      favorites.has(id) ? favorites.delete(id) : favorites.add(id);
      safeStorage.set(FAVORITES_KEY, [...favorites]);
      syncFavorites();
      applyFilters();
    });

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.modelFilter;
        filterButtons.forEach((candidate) => {
          const selected = candidate === button;
          candidate.classList.toggle("is-active", selected);
          candidate.setAttribute("aria-pressed", String(selected));
        });
        applyFilters();
      });
    });

    search?.addEventListener("input", applyFilters);

    share?.addEventListener("click", () => {
      const selected = [...favorites].sort();
      if (!selected.length) return;
      const shareUrl = `${window.location.origin}/modeller/?favoriler=${encodeURIComponent(selected.join(","))}`;
      openWhatsApp(
        `Merhaba, Forma Kutusu kataloğunda şu modelleri favorilerime ekledim: ${selected.join(", ")}.\n\nPaylaşılabilir liste: ${shareUrl}\n\nBu modeller için takımımıza özel teklif almak istiyorum.`,
      );
    });

    syncFavorites();
    applyFilters();
  }

  function initGallery() {
    const dialog = document.querySelector("[data-gallery-dialog]");
    const image = dialog?.querySelector("[data-gallery-image]");
    const caption = dialog?.querySelector("[data-gallery-caption]");
    if (!dialog || !image || !caption) return;

    document.querySelectorAll("[data-gallery-item]").forEach((button) => {
      button.addEventListener("click", () => {
        image.src = button.dataset.galleryItem;
        image.alt = button.dataset.galleryAlt || "";
        caption.textContent = button.dataset.galleryAlt || "";
        if (typeof dialog.showModal === "function") dialog.showModal();
      });
    });

    dialog.querySelector("[data-dialog-close]")?.addEventListener("click", () => {
      dialog.close();
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  function initQuoteForm() {
    const form = document.querySelector("[data-quote-form]");
    if (!form) return;

    const steps = [...form.querySelectorAll("[data-form-step]")];
    const progress = [...form.querySelectorAll("[data-progress-step]")];
    const alert = form.querySelector("[data-form-alert]");
    const summary = document.querySelector("[data-quote-summary]");
    let currentStep = 1;

    const fields = {
      sport: form.elements.sport,
      useCase: form.elements.useCase,
      teamName: form.elements.teamName,
      product: form.elements.product,
      quantity: form.elements.quantity,
      modelCode: form.elements.modelCode,
      colors: form.elements.colors,
      notes: form.elements.notes,
      visualFile: form.elements.visualFile,
      rosterFile: form.elements.rosterFile,
      consent: form.elements.consent,
    };

    const summaryMap = [
      ["Branş", "sport"],
      ["Kullanım", "useCase"],
      ["Ürün", "product"],
      ["Adet", "quantity"],
      ["Model", "modelCode"],
    ];

    const updateSummary = () => {
      if (!summary) return;
      summary.querySelectorAll("div").forEach((row, index) => {
        const key = summaryMap[index]?.[1];
        const field = fields[key];
        row.querySelector("dd").textContent = field?.value?.trim() || "—";
      });
    };

    const showAlert = (message = "") => {
      if (!alert) return;
      alert.textContent = message;
      alert.hidden = !message;
      if (message) alert.focus?.();
    };

    const setStep = (step) => {
      currentStep = Math.max(1, Math.min(steps.length, step));
      steps.forEach((fieldset, index) => {
        fieldset.hidden = index + 1 !== currentStep;
      });
      progress.forEach((item, index) => {
        item.classList.toggle("is-active", index + 1 === currentStep);
        item.classList.toggle("is-complete", index + 1 < currentStep);
      });
      showAlert("");
      const activeFieldset = steps[currentStep - 1];
      activeFieldset?.querySelector("input,select,textarea,button")?.focus();
      window.scrollTo({
        top: Math.max(0, form.getBoundingClientRect().top + window.scrollY - 110),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    };

    const validateFile = (input) => {
      const file = input.files?.[0];
      input.removeAttribute("aria-invalid");
      if (!file) return "";
      const maxSize = Number(input.dataset.maxSize || 10_485_760);
      const extension = file.name.split(".").pop()?.toLowerCase();
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
      const invalid = [];
      fieldset.querySelectorAll("[required]").forEach((field) => {
        field.removeAttribute("aria-invalid");
        const invalidQuantity =
          field.name === "quantity" &&
          (Number(field.value) < 5 || Number(field.value) > 500);
        if (!field.checkValidity() || invalidQuantity) {
          field.setAttribute("aria-invalid", "true");
          invalid.push(field);
        }
      });
      fieldset.querySelectorAll('input[type="file"]').forEach((input) => {
        const error = validateFile(input);
        if (error) invalid.push(input);
      });
      if (invalid.length) {
        showAlert(
          step === 3
            ? "Lütfen dosya türlerini, boyutlarını ve onay kutusunu kontrol edin."
            : "Lütfen yıldızlı alanları doğru biçimde doldurun.",
        );
        invalid[0].focus();
        return false;
      }
      return true;
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
        const error = validateFile(event.target);
        showAlert(error);
      }
      updateSummary();
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateStep(3)) return;

      const values = Object.fromEntries(
        new FormData(form)
          .entries()
          .filter(([, value]) => typeof value === "string"),
      );
      const visualFile = fields.visualFile.files?.[0]?.name;
      const rosterFile = fields.rosterFile.files?.[0]?.name;
      const lines = [
        "Merhaba, takımımız için özel forma teklifi almak istiyorum.",
        "",
        `Branş: ${values.sport}`,
        `Kullanım amacı: ${values.useCase}`,
        `Takım / organizasyon: ${values.teamName || "Belirtilmedi"}`,
        `Ürün: ${values.product}`,
        `Adet: ${values.quantity}`,
        `Model kodu: ${values.modelCode || "Belirtilmedi"}`,
        `Takım renkleri: ${values.colors || "Belirtilmedi"}`,
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
    if (modelFromQuery) fields.modelCode.value = modelFromQuery.toUpperCase();
    updateSummary();
  }

  initNavigation();
  initCatalog();
  initGallery();
  initQuoteForm();
})();

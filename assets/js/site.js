(() => {
  "use strict";

  const WHATSAPP_NUMBER = "905348578836";
  const FAVORITES_KEY = "forma-kutusu-favorites-v1";
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

    const validatedFields = new WeakSet();
    const requiredMessages = {
      sport: "Branş seçin.",
      useCase: "Kullanım amacı seçin.",
      product: "Ürün kapsamını seçin.",
      quantity: "Adet girin.",
      consent: "Devam etmek için onay kutusunu işaretleyin.",
    };

    const updateSummary = () => {
      if (!summary) return;
      summary.querySelectorAll("[data-summary-value]").forEach((output) => {
        const key = output.dataset.summaryValue;
        const field = fields[key];
        const value =
          field?.type === "file" ? field.files?.[0]?.name : field?.value?.trim();
        output.textContent = value || "—";
      });
    };

    const showAlert = (message = "") => {
      if (!alertBox) return;
      alertBox.textContent = message;
      alertBox.hidden = !message;
    };

    const stepAlertMessage = (step) =>
      step === 3
        ? "Lütfen dosya türlerini, boyutlarını ve onay kutusunu kontrol edin."
        : "Lütfen yıldızlı alanları doğru biçimde doldurun.";

    const syncGeneralAlert = (step = currentStep) => {
      const fieldset = steps[step - 1];
      const hasInvalid = fieldset?.querySelector('[aria-invalid="true"]');
      showAlert(hasInvalid ? stepAlertMessage(step) : "");
    };

    const setFieldError = (field, message = "") => {
      const error = form.querySelector(`[data-field-error="${field.name}"]`);
      if (message) {
        field.setAttribute("aria-invalid", "true");
        if (error) {
          error.textContent = message;
          error.hidden = false;
        }
      } else {
        field.removeAttribute("aria-invalid");
        if (error) {
          error.textContent = "";
          error.hidden = true;
        }
      }
    };

    const setStep = (step) => {
      currentStep = Math.max(1, Math.min(steps.length, step));
      steps.forEach((fieldset, index) => {
        fieldset.hidden = index + 1 !== currentStep;
      });
      progress.forEach((item, index) => {
        const isActive = index + 1 === currentStep;
        item.classList.toggle("is-active", isActive);
        item.classList.toggle("is-complete", index + 1 < currentStep);
        if (isActive) item.setAttribute("aria-current", "step");
        else item.removeAttribute("aria-current");
      });
      syncGeneralAlert();
      steps[currentStep - 1]?.querySelector("input,select,textarea,button")?.focus();
      window.scrollTo({
        top: Math.max(0, form.getBoundingClientRect().top + window.scrollY - 110),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    };

    const validateRequiredField = (field) => {
      validatedFields.add(field);
      let message = "";

      if (field.name === "quantity") {
        const value = Number(field.value);
        if (!field.value.trim()) message = requiredMessages.quantity;
        else if (!field.checkValidity() || value < 5 || value > 500) {
          message = "Adet 5 ile 500 arasında olmalı.";
        }
      } else if (!field.checkValidity()) {
        message = requiredMessages[field.name] || "Bu alanı kontrol edin.";
      }

      setFieldError(field, message);
      return message;
    };

    const validateFile = (input) => {
      const file = input.files?.[0];
      validatedFields.add(input);
      let message = "";

      if (file) {
        const maxSize = Number(input.dataset.maxSize || 10485760);
        const extension = file.name.split(".").pop()?.toLowerCase() || "";
        const allowed =
          input.name === "visualFile"
            ? ["png", "jpg", "jpeg", "webp", "pdf"]
            : ["csv", "xls", "xlsx"];

        if (!allowed.includes(extension)) {
          message = `${file.name} desteklenen bir dosya türü değil.`;
        } else if (file.size > maxSize) {
          message = `${file.name} 10 MB sınırını aşıyor.`;
        }
      }

      setFieldError(input, message);
      return message;
    };

    const validateStep = (step) => {
      const fieldset = steps[step - 1];
      if (!fieldset) return false;

      const invalid = [];
      fieldset.querySelectorAll("[required]").forEach((field) => {
        if (validateRequiredField(field)) invalid.push(field);
      });

      fieldset.querySelectorAll('input[type="file"]').forEach((input) => {
        if (validateFile(input)) invalid.push(input);
      });

      syncGeneralAlert(step);
      if (!invalid.length) return true;

      invalid[0]?.focus();
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

    form.addEventListener("input", (event) => {
      const field = event.target;
      if (
        field.matches("[required]") &&
        !field.matches('input[type="file"]') &&
        validatedFields.has(field)
      ) {
        validateRequiredField(field);
        syncGeneralAlert();
      }
      updateSummary();
    });
    form.addEventListener("change", (event) => {
      const field = event.target;
      if (field.matches('input[type="file"]')) {
        validateFile(field);
        syncGeneralAlert();
      } else if (field.matches("[required]") && validatedFields.has(field)) {
        validateRequiredField(field);
        syncGeneralAlert();
      }
      updateSummary();
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateStep(3)) return;

      const values = Object.fromEntries(
        [...new FormData(form).entries()].filter(([, value]) => typeof value === "string"),
      );
      const visualFile = fields.visualFile?.files?.[0]?.name;
      const rosterFile = fields.rosterFile?.files?.[0]?.name;
      const lines = [
        "Merhaba, takımımız için özel forma teklifi almak istiyorum.",
        "",
        `Branş: ${values.sport || "Belirtilmedi"}`,
        `Kullanım amacı: ${values.useCase || "Belirtilmedi"}`,
        `Takım / organizasyon: ${values.teamName || "Belirtilmedi"}`,
        `Ürün: ${values.product || "Belirtilmedi"}`,
        `Adet: ${values.quantity || "Belirtilmedi"}`,
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
    if (modelFromQuery && fields.modelCode) {
      fields.modelCode.value = modelFromQuery.toUpperCase();
    }
    updateSummary();
  }

  initNavigation();
  initCatalog();
  initGallery();
  initProductGallery();
  initQuoteForm();
})();

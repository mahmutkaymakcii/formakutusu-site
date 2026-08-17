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

  initNavigation();
  initCatalog();
  initGallery();
  initProductGallery();
})();

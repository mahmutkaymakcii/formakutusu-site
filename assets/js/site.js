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
    // "noopener" ile window.open her zaman null döner ve sayfa da yönlenirdi; opener elle kesilir
    const popup = window.open(url, "_blank");
    if (popup) popup.opener = null;
    else window.location.assign(url);
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
    const PRICES = { ust: 300, takim: 450, socks: 30, goalkeeper: 50 };
    const MIN_QTY = 5;
    const MAX_QTY = 60;
    const MAX_FILE = 10 * 1024 * 1024;
    const FILE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "application/pdf"];

    // Forma tasarla sihirbazı: oyuncu listesi satır satır (kaleci, şort, çorap oyuncu bazında),
    // adet satır sayısıdır; branş ve yaka kartlarla seçilir
    const wizard = form.hasAttribute("data-wizard");
    const quantityInput = form.querySelector("[data-order-quantity]");
    const roster = form.querySelector("[data-order-roster]");
    const shorts = form.querySelector("[data-order-shorts]");
    const totalLabel = form.querySelector("[data-order-total]");
    const totalDetail = form.querySelector("[data-order-total-detail]");
    const sportSelect = wizard ? null : form.querySelector("[data-order-sport]");
    const collarSelect = form.elements.collar;
    const PART_PRICES = { shirt: 300, shorts: 150 };
    const designInput = form.querySelector("[data-design-input]");
    const designPreview = form.querySelector("[data-design-preview]");
    const MAX_DESIGN_FILES = 5;
    const COLLARS = {
      futbol: ["Sıfır yaka", "V yaka", "Polo yaka"],
      basketbol: ["Sıfır yaka", "V yaka"],
      voleybol: ["Sıfır yaka", "V yaka", "Polo yaka"],
    };
    // Kaleci (+50₺) ve libero (fiyat farkı yok) ek forma seçenekleri.
    const EXTRAS = [
      { name: "goalkeeper", title: "KALECİ", label: "Kaleci forması", price: PRICES.goalkeeper, note: "uzun kol" },
      { name: "libero", title: "LİBERO", label: "Libero forması", price: 0, note: "" },
    ].filter((extra) => form.elements[extra.name]);
    const errorBox = form.querySelector("[data-order-errors]");
    const status = form.querySelector("[data-order-status]");
    const uploads = [...form.querySelectorAll("[data-upload]")];
    const formatTL = (value) => `${value.toLocaleString("tr-TR")}₺`;
    const currentSport = () => (wizard ? form.elements.sport?.value || "futbol" : sportSelect ? sportSelect.value : form.dataset.sport || "");

    const quantity = () => {
      if (wizard) return roster.querySelectorAll("[data-roster-row]").length;
      const value = Number.parseInt(quantityInput.value, 10);
      return Number.isFinite(value) ? value : 0;
    };
    const checked = (name) => form.elements[name]?.value || "";
    const isOn = (name) => Boolean(form.querySelector(`[name="${name}"]`)?.checked);

    const sizeOptions = SIZES.map((size) => `<option value="${size}">${size}</option>`).join("");

    // Sihirbaz satırı: # · isim · numara · kaleci · beden · şort · çorap · sil
    const keeperLabel = () => (currentSport() === "voleybol" ? "Libero" : "Kaleci");
    const addRow = () => {
      const row = document.createElement("div");
      row.className = "order-roster__row wizard-row";
      row.dataset.rosterRow = "";
      const shortsOn = checked("scope") !== "ust";
      const socksOn = (checked("socks") || "yok") !== "yok";
      row.innerHTML = `
          <span class="order-roster__index"></span>
          <label class="wizard-row__name"><span class="sr-only">Oyuncu ismi</span><input type="text" name="player-name" maxlength="20" autocomplete="off" placeholder="İSİM" data-uppercase data-roster-field="name"></label>
          <label class="wizard-row__number"><span class="sr-only">Oyuncu numarası</span><input type="text" name="player-number" maxlength="3" inputmode="numeric" autocomplete="off" placeholder="NO" data-roster-field="number"></label>
          <label class="wizard-tog" data-keeper-cell><input type="checkbox" data-roster-field="keeper"><span data-keeper-label>${keeperLabel()}</span></label>
          <label class="wizard-row__size"><span class="sr-only">Beden</span><select name="player-size" data-roster-field="size"><option value="">BEDEN</option>${sizeOptions}</select></label>
          <label class="wizard-tog"><input type="checkbox" data-roster-field="shorts"${shortsOn ? " checked" : ""}><span>Şort</span></label>
          <label class="wizard-tog"><input type="checkbox" data-roster-field="socks"${socksOn ? " checked" : ""}><span>Çorap</span></label>
          <button type="button" class="wizard-row__del" data-roster-del>Sil</button>`;
      roster.append(row);
      return row;
    };
    const renumber = () => {
      const rows = [...roster.querySelectorAll("[data-roster-row]")];
      rows.forEach((row, index) => {
        row.querySelector(".order-roster__index").textContent = index + 1;
        row.querySelector("[data-roster-del]").setAttribute("aria-label", `${index + 1}. oyuncuyu sil`);
        row.querySelector("[data-roster-del]").disabled = rows.length === 1;
      });
      quantityInput.value = rows.length;
    };

    const buildRoster = () => {
      if (wizard) {
        if (!roster.querySelector(".wizard-roster__head")) {
          roster.insertAdjacentHTML("afterbegin", `<div class="wizard-roster__head" aria-hidden="true"><span>#</span><span>Sırt ismi</span><span>Sırt no</span><span data-keeper-label>${keeperLabel()}</span><span>Beden</span><span>Şort</span><span>Çorap</span><span></span></div>`);
        }
        while (quantity() < MIN_QTY) addRow();
        renumber();
        syncRosterFields();
        return;
      }
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
      if (wizard) {
        // Kaleci futbolda, libero voleybolda; basketbolda bu sütun yok
        roster.classList.toggle("is-no-keeper", currentSport() === "basketbol");
        roster.querySelectorAll("[data-keeper-label]").forEach((el) => (el.textContent = keeperLabel()));
      }
    };
    const rowData = () =>
      [...roster.querySelectorAll("[data-roster-row]")].map((row) => {
        const field = (name) => row.querySelector(`[data-roster-field="${name}"]`);
        return {
          name: isOn("has-name") ? field("name").value.trim() : "",
          number: isOn("has-number") ? field("number").value.trim() : "",
          size: field("size").value,
          keeper: currentSport() !== "basketbol" && field("keeper").checked,
          shorts: field("shorts").checked,
          socks: field("socks").checked,
        };
      });

    // Seçeneğin bölümü branşa göre gizliyse (özel tasarım formu) hesaba katılmaz.
    const extraActive = (name) => {
      const section = form.elements[name]?.closest("[data-sport-only]");
      return Boolean(form.elements[name]) && !section?.hidden && isOn(name);
    };

    const extraCount = (name) => {
      if (!extraActive(name)) return 0;
      const value = Number.parseInt(form.elements[`${name}-count`]?.value, 10);
      return Number.isFinite(value) && value > 0 ? value : 0;
    };

    const calculateWizard = () => {
      const rows = rowData();
      const futbol = currentSport() === "futbol";
      const kit = rows.filter((r) => r.shorts).length;
      const single = rows.length - kit;
      const socks = rows.filter((r) => r.socks).length;
      const keepers = futbol ? rows.filter((r) => r.keeper).length : 0;
      const kitPrice = PART_PRICES.shirt + PART_PRICES.shorts;
      const total = kit * kitPrice + single * PART_PRICES.shirt + socks * PRICES.socks + keepers * PRICES.goalkeeper;
      const parts = [];
      if (kit) parts.push(`${kit} × forma + şort (${formatTL(kitPrice)})`);
      if (single) parts.push(`${single} × tek üst forma (${formatTL(PART_PRICES.shirt)})`);
      if (socks) parts.push(`${socks} × çorap (${formatTL(PRICES.socks)})`);
      if (keepers) parts.push(`${keepers} × kaleci uzun kol farkı (${formatTL(PRICES.goalkeeper)})`);
      return { qty: rows.length, total, parts, rows, kit, single, socks, keepers };
    };

    const calculate = () => {
      if (wizard) return calculateWizard();
      const qty = quantity();
      const scope = checked("scope") === "ust" ? "ust" : "takim";
      const base = PRICES[scope];
      const socks = (checked("socks") || "yok") !== "yok" ? PRICES.socks : 0;
      const keepers = Math.min(extraCount("goalkeeper"), qty);
      const total = qty * (base + socks) + keepers * PRICES.goalkeeper;
      const parts = [`${qty} × ${scope === "ust" ? "tek üst forma" : "forma + şort"} (${formatTL(base)})`];
      if (socks) parts.push(`${qty} × çorap (${formatTL(socks)})`);
      if (keepers) parts.push(`${keepers} × kaleci uzun kol farkı (${formatTL(PRICES.goalkeeper)})`);
      return { qty, total, parts };
    };

    const syncSport = () => {
      if (wizard) {
        // Basketbolda polo yaka yok: kart gizlenir, seçiliyse sıfır yakaya dönülür
        const polo = form.querySelector('[data-collar-card="Polo yaka"]');
        const noPolo = currentSport() === "basketbol";
        if (polo) polo.hidden = noPolo;
        if (noPolo && checked("collar") === "Polo yaka") {
          const zero = form.querySelector('input[name="collar"][value="Sıfır yaka"]');
          zero.checked = true;
          zero.dispatchEvent(new Event("change", { bubbles: true }));
        }
        form.querySelectorAll("[data-sport-only]").forEach((section) => (section.hidden = section.dataset.sportOnly !== currentSport()));
        syncRosterFields();
        return;
      }
      if (!sportSelect) return;
      const sport = sportSelect.value;
      form.querySelectorAll("[data-sport-only]").forEach((section) => (section.hidden = section.dataset.sportOnly !== sport));
      const current = collarSelect.value;
      const options = COLLARS[sport] || COLLARS.futbol;
      collarSelect.replaceChildren(
        new Option("Seçin", ""),
        ...options.map((collar) => new Option(collar, collar, false, collar === current)),
      );
    };

    const designFiles = () => [...(designInput?.files || [])];

    // Seçili dosyayı kaldırma düğmesi; dosya alanının change olayı önizlemeyi de günceller
    const removeButton = (file, onRemove) => {
      const button = Object.assign(document.createElement("button"), { type: "button", className: "order-upload__remove", textContent: "Kaldır" });
      button.setAttribute("aria-label", `${file.name} dosyasını kaldır`);
      button.addEventListener("click", onRemove);
      return button;
    };
    const setFiles = (input, files) => {
      try {
        const transfer = new DataTransfer();
        files.forEach((file) => transfer.items.add(file));
        input.files = transfer.files;
      } catch {
        input.value = "";
      }
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };

    const showDesignPreview = () => {
      if (!designPreview) return;
      const files = designFiles();
      designPreview.replaceChildren(
        ...files.map((file, index) => {
          const item = document.createElement("li");
          if (file.type.startsWith("image/")) {
            const img = document.createElement("img");
            img.src = URL.createObjectURL(file);
            img.alt = "";
            img.onload = () => URL.revokeObjectURL(img.src);
            item.append(img);
          }
          item.append(
            Object.assign(document.createElement("span"), { textContent: file.name }),
            removeButton(file, () => setFiles(designInput, designFiles().filter((_, i) => i !== index))),
          );
          return item;
        }),
      );
      designPreview.hidden = files.length === 0;
    };

    const updateTotal = () => {
      // Voleybolda şorta logo/numara eklenmez; tek üst formada şort yoktur
      shorts.hidden = checked("scope") === "ust" || currentSport() === "voleybol";
      EXTRAS.forEach(({ name }) => {
        const on = isOn(name);
        form.querySelectorAll(`[data-${name}-count], [data-${name}-note]`).forEach((el) => (el.hidden = !on));
      });

      const { qty, total, parts, keepers } = calculate();
      const counter = form.querySelector("[data-roster-count]");
      if (counter) counter.textContent = `Toplam oyuncu: ${qty}${currentSport() === "futbol" ? ` · Kaleci: ${keepers}` : ""}`;
      if (qty < MIN_QTY) {
        totalLabel.textContent = "—";
        totalDetail.textContent = `En az ${MIN_QTY} adet sipariş verilebilir.`;
        return;
      }
      totalLabel.textContent = formatTL(total);
      totalDetail.textContent = `${parts.join(" + ")}. Kesin tutar sipariş görüşmesinde teyit edilir.`;
    };

    uploads.forEach((upload) => {
      const input = upload.querySelector("[data-upload-input]");
      const none = upload.querySelector("[data-upload-none]");
      const alt = upload.querySelector("[data-upload-alt]");
      const preview = upload.querySelector("[data-upload-preview]");

      // "Yok" dosya yüklemeyi pasif yapar; TR Arma ile "Yok" birbirini dışlar. TR Arma seçiliyken
      // yüklenen logo sağ göğse geçer, bu yüzden yükleme açık kalır.
      const sync = () => {
        const blocked = none.checked;
        if (blocked) input.value = "";
        input.disabled = blocked;
        const text = upload.querySelector("[data-upload-text]");
        if (text) text.disabled = blocked;
        upload.classList.toggle("is-none", blocked);
        showPreview();
      };

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
        preview.append(
          Object.assign(document.createElement("span"), { textContent: file.name }),
          removeButton(file, () => setFiles(input, [])),
        );
      };

      input.addEventListener("change", showPreview);

      none.addEventListener("change", () => {
        if (none.checked && alt) alt.checked = false;
        sync();
      });

      alt?.addEventListener("change", () => {
        if (alt.checked) none.checked = false;
        sync();
      });
    });

    const uploadState = () =>
      uploads.map((upload) => {
        const input = upload.querySelector("[data-upload-input]");
        const alt = upload.querySelector("[data-upload-alt]");
        const label = upload.querySelector(".order-upload__field > span").textContent;
        return {
          label,
          file: input.files?.[0] || null,
          none: upload.querySelector("[data-upload-none]").checked,
          alt: alt?.checked ? alt.dataset.uploadAlt : "",
          text: upload.querySelector("[data-upload-text]")?.value.trim() || "",
        };
      });

    const validate = () => {
      const errors = [];
      const qty = quantity();
      if (qty < MIN_QTY) errors.push(wizard ? `En az ${MIN_QTY} oyuncu eklemelisin (şu an ${qty}).` : `Adet en az ${MIN_QTY} olmalı.`);
      if (qty > MAX_QTY) errors.push(`${MAX_QTY} adetten fazla siparişler için lütfen WhatsApp'tan yaz.`);
      if (sportSelect && !sportSelect.value) errors.push("Branşı seç.");
      if (!checked("collar")) errors.push("Yaka tipini seç.");

      if (form.hasAttribute("data-custom")) {
        const files = designFiles();
        if (!files.length) errors.push("Desen veya tasarım görseli yükle.");
        if (files.length > MAX_DESIGN_FILES) errors.push(`En fazla ${MAX_DESIGN_FILES} tasarım görseli yükleyebilirsin.`);
        files.forEach((file) => {
          const allowed = FILE_TYPES.includes(file.type) || /\.(png|jpe?g|webp|svg|pdf)$/i.test(file.name);
          if (!allowed) errors.push(`${file.name}: PNG, JPG, WEBP, SVG veya PDF yükle.`);
          if (file.size > MAX_FILE) errors.push(`${file.name}: dosya 10 MB'tan küçük olmalı.`);
        });
      }

      EXTRAS.forEach(({ name, label }) => {
        if (!extraActive(name)) return;
        const count = extraCount(name);
        if (!count) errors.push(`${label} adedini gir.`);
        else if (count > qty) errors.push(`${label} adedi toplam adetten fazla olamaz.`);
      });

      uploadState().forEach(({ label, file, none, alt, text }) => {
        if (!file && !none && !alt && !text) errors.push(`${label}: dosya yükle ya da bir seçenek işaretle.`);
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
      const { qty, total, parts } = calculate();
      const scope = checked("scope");
      const yesNo = (value) => (value ? "Var" : "Yok");
      const sportLabel = wizard
        ? form.querySelector('input[name="sport"]:checked')?.dataset.label || ""
        : sportSelect ? sportSelect.selectedOptions[0]?.textContent || "" : form.dataset.sportLabel;
      const designLines = form.hasAttribute("data-custom")
        ? [
            "",
            "ÖZEL TASARIM",
            `Tasarım görselleri: ${designFiles().length ? designFiles().map((file) => file.name).join(", ") : "Yok"}`,
          ]
        : [];
      // Önizlemeli formlarda: galeriden seçilen desen kodu, kulüp ismi etiketi, yazı rengi
      // "Kendi desenim" sekmesinde galeri kodu değil "Özel tasarım" yazılır
      let patternCode = form.hasAttribute("data-custom") ? "Özel tasarım" : form.elements["pattern-code"]?.value || "";
      const colorModel = wizard && checked("pattern-mode") === "color";
      if (colorModel) {
        const model = window.FormaModeller?.MODELS.find((m) => m.code === patternCode);
        if (model) patternCode = `${model.code} ${model.name}`;
      }
      const label = (name) => form.elements[name]?.dataset?.label || "";
      const calc = calculate();
      const backLabel = form.querySelector('[name="back-text"]')?.closest("label")?.querySelector("span")?.textContent || "Sırt yazısı";
      const textColor = form.querySelector('input[name="text-color"]:checked')?.dataset.label || "";
      const lines = [
        "Merhaba, sipariş vermek istiyorum.",
        "",
        `Model: ${patternCode || form.dataset.model} (${sportLabel})`,
        ...designLines,
        "",
        ...(colorModel ? [`Ana renk: ${label("main-color")}`, `Desen rengi: ${label("accent-color")}`, ""] : []),
        `Adet: ${qty}`,
        ...(wizard
          ? [
              `Ürün: ${[calc.kit && `${calc.kit} forma + şort`, calc.single && `${calc.single} tek üst forma`].filter(Boolean).join(", ")}`,
              `Çorap: ${calc.socks ? `${calc.socks} çift (${form.querySelector('input[name="socks"]:checked')?.dataset.label || ""})` : "Yok"}`,
            ]
          : [
              `Ürün: ${scope === "ust" ? "Tek üst forma" : "Forma + şort"}`,
              `Çorap: ${form.elements.socks?.selectedOptions[0]?.textContent.replace(/ çorap$/, "") || "Yok"}`,
            ]),
        `Yaka: ${checked("collar")}`,
        ...(wizard ? ["Kumaş: Poly Mesh"] : []),
        "",
        "FORMA ÖNÜ",
        ...uploadState().map(({ label, file, alt, text, none }) => {
          if (!file && !none && text) return `${label}: Yazı – ${text.toLocaleUpperCase("tr-TR")}`;
          if (alt) return `${label}: ${alt}${file ? ` (yüklenen logo sağ göğse geçer, dosya: ${file.name})` : ""}`;
          // Sağ göğse logo yüklenince NORA iki logonun ortasına geçer
          const nora = /^Sağ göğüs/.test(label) ? ", NORA logosu iki logonun ortasında" : "";
          return `${label}: ${file ? `Var (dosya: ${file.name})${nora}` : "Yok"}`;
        }),
        "",
        "FORMA ARKASI",
        `${backLabel}: ${form.querySelector('[name="back-text"]').value.trim() || "Yok"}`,
        `Numara: ${yesNo(isOn("has-number"))}`,
        `İsim: ${yesNo(isOn("has-name"))}`,
        ...(textColor ? [`Yazı ve numara rengi: ${textColor}`] : []),
      ];

      if ((wizard ? calc.kit > 0 : scope !== "ust") && currentSport() !== "voleybol") {
        const shortsColor = form.querySelector('input[name="shorts-color"]:checked')?.dataset.label;
        lines.push("", "ŞORT", ...(shortsColor ? [`Şort rengi: ${shortsColor}`] : []), `Sağ paça logo: ${isOn("shorts-logo") ? "Evet" : "Hayır"}`, `Sol paça numara: ${isOn("shorts-number") ? "Evet" : "Hayır"}`);
      }

      EXTRAS.forEach(({ name, title, label, price, note }) => {
        const section = form.elements[name].closest("[data-sport-only]");
        if (section?.hidden) return;
        const detail = [note, price ? `+${formatTL(price)}` : "fiyat farkı yok"].filter(Boolean).join(", ");
        lines.push("", title, extraActive(name) ? `${label}: ${extraCount(name)} adet (${detail})` : `${label}: Yok`);
      });

      const note = form.elements["order-note"]?.value.trim();
      if (form.elements["order-note"]) lines.push("", "SİPARİŞ NOTU", note || "Yok");

      if (wizard && calc.keepers) {
        lines.push("", "KALECİ", `Kaleci forması: ${calc.keepers} adet (uzun kol, +${formatTL(PRICES.goalkeeper)})`, `Kaleci forması rengi: ${form.querySelector('input[name="keeper-color"]:checked')?.dataset.label || "-"}`);
      }

      if (wizard) {
        const keeper = currentSport() === "voleybol" ? "Libero" : "Kaleci";
        lines.push("", "LİSTE (İSİM - NUMARA - BEDEN)");
        calc.rows.forEach((r, index) => {
          const extras = [r.keeper && keeper, r.shorts ? "Şort" : "Şortsuz", r.socks && "Çorap"].filter(Boolean).join(", ");
          lines.push(`${index + 1}. ${[r.name || "-", r.number || "-", r.size].join(" - ")} (${extras})`);
        });
        lines.push("", `TOPLAM TUTAR: ${formatTL(total)} (${parts.join(" + ")})`);
        return lines.join("\n");
      }

      lines.push("", "LİSTE (İSİM - NUMARA - BEDEN)");
      roster.querySelectorAll("[data-roster-row]").forEach((row, index) => {
        const name = isOn("has-name") ? row.querySelector('[data-roster-field="name"]').value.trim() : "";
        const number = isOn("has-number") ? row.querySelector('[data-roster-field="number"]').value.trim() : "";
        const size = row.querySelector('[data-roster-field="size"]').value;
        lines.push(`${index + 1}. ${[name || "-", number || "-", size].join(" - ")}`);
      });

      lines.push("", `TOPLAM TUTAR: ${formatTL(total)} (${parts.join(" + ")})`);
      return lines.join("\n");
    };

    quantityInput.addEventListener("input", () => {
      buildRoster();
      updateTotal();
    });
    form.addEventListener("change", (event) => {
      if (event.target.matches("[data-roster-toggle]")) syncRosterFields();
      if (wizard) {
        // Şort ve çorap seçimi tüm oyunculara uygulanır; oyuncu bazında listede değiştirilebilir
        const name = event.target.name;
        if (name === "scope") roster.querySelectorAll('[data-roster-field="shorts"]').forEach((box) => (box.checked = checked("scope") !== "ust"));
        if (name === "socks") roster.querySelectorAll('[data-roster-field="socks"]').forEach((box) => (box.checked = checked("socks") !== "yok"));
        if (name === "sport") syncSport();
      }
      updateTotal();
    });
    if (wizard) {
      form.querySelector("[data-roster-add]")?.addEventListener("click", () => {
        if (quantity() >= MAX_QTY) return;
        const row = addRow();
        renumber();
        syncRosterFields();
        updateTotal();
        row.querySelector("input:not(:disabled)")?.focus();
      });
      roster.addEventListener("click", (event) => {
        const del = event.target.closest("[data-roster-del]");
        if (!del || quantity() <= 1) return;
        del.closest("[data-roster-row]").remove();
        renumber();
        updateTotal();
      });
      // Sihirbaz adımları için: adım kontrolü ve sipariş özeti aynı hesapla yapılır
      form.orderApi = { validate: () => validate(), calculate: () => calculate(), keeperLabel };
    }
    EXTRAS.forEach(({ name }) => form.elements[`${name}-count`]?.addEventListener("input", updateTotal));
    sportSelect?.addEventListener("change", syncSport);
    designInput?.addEventListener("change", showDesignPreview);

    // Tasarım stüdyosu: "Hazır desenler" / "Kendi desenim" sekmeleri. Seçilen sekme formun
    // özel tasarım kurallarını (desen dosyası zorunlu, mesajda ÖZEL TASARIM) açar ya da kapatır;
    // önizleme "pattern-mode" olayıyla desen kaynağını değiştirir.
    const modeTabs = [...form.querySelectorAll("[data-pattern-mode]")];
    const setPatternMode = (mode) => {
      modeTabs.forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.patternMode === mode)));
      form.querySelectorAll("[data-mode-panel]").forEach((panel) => (panel.hidden = panel.dataset.modePanel !== mode));
      form.elements["pattern-mode"].value = mode;
      form.toggleAttribute("data-custom", mode === "upload");
      form.dataset.preview = mode;
      errorBox.hidden = true;
      form.dispatchEvent(new CustomEvent("pattern-mode", { detail: mode }));
    };
    modeTabs.forEach((tab) => tab.addEventListener("click", () => setPatternMode(tab.dataset.patternMode)));

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

      // Mesaj doğrudan Forma Kutusu WhatsApp sohbetine gider (paylaşım menüsü açılmaz). Pencere
      // açma kullanıcı etkileşimi gerektirdiğinden beklemeden açılır; pano yazımı beklenmez.
      const message = buildMessage();
      navigator.clipboard?.writeText(message).catch(() => {});
      openWhatsApp(message);

      // WhatsApp bağlantısıyla dosya gönderilemez: yüklenen dosyalar sohbete elle eklenir,
      // önizleme görseli de indirilebilir
      const files = [...designFiles(), ...uploadState().map(({ file }) => file)].filter(Boolean);
      status.replaceChildren(
        files.length
          ? `WhatsApp sohbeti açıldı. Mesajı gönderdikten sonra dosyalarını (${files.map((file) => file.name).join(", ")}) sohbete ekle.`
          : "WhatsApp sohbeti açıldı; mesajı kontrol edip gönderebilirsin.",
      );
      const preview = form.formaPreview ? await form.formaPreview().catch(() => null) : null;
      if (preview) {
        const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(preview), download: preview.name, textContent: "Forma önizlemesini indir" });
        status.append(" ", link);
      }
    });

    syncSport();
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

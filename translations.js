// ---- Language runtime (with path + URL propagation) ----
(function () {
  const LS_KEY = "lang";
  const KNOWN = ["en","pt","de","es","fr","uk","vi","pl","ja","de-CH","nl","ru","tr","it","zh-CN"];
  const IS_LOCAL = /^(localhost|127\.0\.0\.1)$/i.test(location.hostname);
  const matchLang = (s) => {
  const n = norm(s);
  if (!n) return null;
  // exact match
  const exact = KNOWN.find(k => norm(k) === n);
  if (exact) return exact;
  // base language fallback
  const base = n.split("-")[0];
  return KNOWN.find(k => norm(k) === base) || null;
};


  const norm = s => (s || "").toLowerCase().replace(/_/g, "-");

  function getUrlLang() {
    const v = new URLSearchParams(location.search).get("lang");
    return matchLang(v);
  }
  function getPathLang() {
    const parts = location.pathname.replace(/^\/+/, "").split("/");
    let cand = parts[0] || "";
    if (!matchLang(cand) && parts[1] && !/\.html?$/i.test(parts[0])) {
      cand = parts[1];
    }
    return matchLang(cand);
  }

  function getCurrentLang() {
    const sel = document.getElementById("lang-select");
    return (sel && sel.value)
        || localStorage.getItem(LS_KEY)
        || getBrowserLang()
        || (document.documentElement.getAttribute("lang") || "en");
  }

  function getBrowserLang() {
  const cand =
    (navigator.languages && navigator.languages[0]) ||
    navigator.language ||
    navigator.userLanguage;
  return matchLang(cand);
}

function safePage(p) {
  return /^(index|gallery|studio)\.html$/i.test(p || "") ? p : "index.html";
}

function setCurrentLang(lang) {
  const use = matchLang(lang) || "en";
  localStorage.setItem(LS_KEY, use);
  document.documentElement.setAttribute("lang", use);

  const sel1 = document.getElementById("lang-select");
  if (sel1) sel1.value = use;
  const sel2 = document.getElementById("lang-select-menu");
  if (sel2) sel2.value = use;

  // Build the canonical URL for the *current page* in the chosen language
  // (index pages get .../index.html; gallery keeps ?lang=xx)
  const dest = new URL(targetForLang(use), location.origin);

  // Update address bar without reloading
  history.replaceState(null, "", dest);

  // Keep internal links in sync
  decorateLinks();
}


// Compute "repo" (if any) and the current page (index.html / gallery.html)
function computeRepoAndPage() {
  const raw = location.pathname.replace(/^\/+/, "").split("/");
  const isHtml = s => /\.html?$/i.test(s || "");
  const isLang = s => !!matchLang(s);

  let i = 0;
  let repo = "";

  if (IS_LOCAL) {
    // In local dev we don't enforce repo; take folder as root
    if (raw[i] && !isLang(raw[i]) && !isHtml(raw[i])) {
      repo = raw[i++]; // your folder (color_converter_wplace)
    }
  } else {
    // GitHub Pages: enforce repo
    if (!raw[i]) {
      repo = "color_converter_wplace";
    } else if (isLang(raw[i]) || isHtml(raw[i])) {
      repo = "color_converter_wplace";
    } else {
      repo = raw[i++];
    }
  }

  if (raw[i] && isLang(raw[i])) i++;
  let page = raw.slice(i).join("/") || "index.html";
  if (!isHtml(page)) page = (page.replace(/\/+$/, "") || "index") + ".html";
  return { repo, page };
}

// Build the target URL for a given language while keeping the same page
function targetForLang(lang) {
  const use = matchLang(lang) || "en";
  const { repo, page } = computeRepoAndPage();
  const base = (!IS_LOCAL && repo) ? `/${repo}` : (IS_LOCAL ? "" : "");

  const pg = safePage(page);

  const file = pg.toLowerCase();
  if (file === "gallery.html" || file === "studio.html") {
  // Keep single file + ?lang=xx (same behavior across pages)
  return use === "en" ? `${base}/${pg}` : `${base}/${pg}?lang=${use}`;
  }
  // index.html keeps folder-style for non-EN
  return use === "en" ? `${base}/${pg}` : `${base}/${use}/${pg}`;
}

// Redirect to the correct folder page and persist language
function navigateToLang(lang) {
  const use = (window.matchLang && window.matchLang(lang)) || "en";
  localStorage.setItem("lang", use);
  document.documentElement.setAttribute("lang", use);
  const dest = targetForLang(use);
  window.location.href = dest; // full navigation to folder page
}


  // Apply translations to data-i18n + attribute variants
  function applyTranslations(root = document) {
    const lang = getCurrentLang();
    const dict = (window.translations && window.translations[lang]) || {};
    const tr = (key, fallback) => (dict[key] ?? fallback ?? key);

    root.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (key) el.textContent = tr(key, el.textContent);
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (key) el.setAttribute("placeholder", tr(key, el.getAttribute("placeholder") || ""));
    });
    root.querySelectorAll("[data-i18n-title]").forEach(el => {
      const key = el.getAttribute("data-i18n-title");
      if (key) el.setAttribute("title", tr(key, el.getAttribute("title") || ""));
    });
    root.querySelectorAll("[data-i18n-aria-label]").forEach(el => {
      const key = el.getAttribute("data-i18n-aria-label");
      if (key) el.setAttribute("aria-label", tr(key, el.getAttribute("aria-label") || ""));
    });
    root.querySelectorAll("[data-i18n-alt]").forEach(el => {
      const key = el.getAttribute("data-i18n-alt");
      if (key) el.setAttribute("alt", tr(key, el.getAttribute("alt") || ""));
    });
  }

  // Keep internal links carrying the language (?lang=xx)
  function decorateLinks(root = document) {
    const lang = (typeof getCurrentLang === "function" && getCurrentLang()) || "en";
    const KNOWN_SET = new Set(KNOWN.map(k => k.toLowerCase()));
    const parts = location.pathname.replace(/^\/+/, "").split("/");

    // figure the repo name once from the current page
    const currentRepo =
      (!IS_LOCAL && parts[0] && !KNOWN_SET.has((parts[0] || "").toLowerCase()) && !/\.html?$/i.test(parts[0]))
        ? parts[0]
        : (!IS_LOCAL ? "color_converter_wplace" : "");
    const basePrefix = currentRepo ? `/${currentRepo}` : "";
    const repoLower = (currentRepo || "").toLowerCase();

    root.querySelectorAll('a[data-keep-lang]').forEach(a => {
      const raw = a.getAttribute("href");
      if (!raw) return;

      let url;
      try { url = new URL(raw, location.origin); } catch { return; }

      const segs = url.pathname.replace(/^\/+/, "").split("/");
      const hrefFirstSeg = (segs[0] || "").toLowerCase();

      // per-link prefix (don’t mutate global state)
      let prefix = basePrefix;

      // if the href already includes the repo, don’t add it again
      if (hrefFirstSeg === repoLower) prefix = "";

      // strip a leading language segment if present
      if (segs.length && KNOWN_SET.has((segs[0] || "").toLowerCase())) segs.shift();

      const filename = segs[segs.length - 1] || "";

      if (/^gallery\.html$/i.test(filename)) {
        url.pathname = `${prefix}/gallery.html`;
        url.search   = lang.toLowerCase() === "en" ? "" : `?lang=${lang}`;
      } else if (/^studio\.html$/i.test(filename)) {
        url.pathname = `${prefix}/studio.html`;
        url.search   = lang.toLowerCase() === "en" ? "" : `?lang=${lang}`;
      } else if (!filename || /^index\.html$/i.test(filename)) {
        url.pathname = lang.toLowerCase() === "en"
          ? `${prefix}/index.html`
          : `${prefix}/${lang}/index.html`;
        url.search = "";
      } else {
        url.pathname = `${prefix}/${segs.join("/")}`;
        url.search   = lang.toLowerCase() === "en" ? "" : `?lang=${lang}`;
      }

      url.pathname = url.pathname.replace(/\.html\/+$/i, ".html"); // safety
      a.setAttribute("href", url.toString());
    });
  }


function initLang() {
  // Priority: ?lang → folder → saved → browser → 'en'
  const desired =
    getUrlLang() ||
    getPathLang() ||
    localStorage.getItem(LS_KEY) ||
    getBrowserLang() ||
    "en";

  const use = matchLang(desired) || "en";
  const { repo, page } = computeRepoAndPage();
  const pg = safePage(page);
  const repoPrefix = `/${repo || "color_converter_wplace"}/`;

  // Redirect #1 — if URL is not under the repo folder, force it under /color_converter_wplace/
  if (!IS_LOCAL && !location.pathname.startsWith(repoPrefix)) {
    const base = "/color_converter_wplace";
    const dest = (pg.toLowerCase() === "gallery.html")
      ? (use === "en" ? `${base}/gallery.html` : `${base}/gallery.html?lang=${use}`)
      : (use === "en" ? `${base}/${pg}` : `${base}/${use}/${pg}`);
    window.location.replace(dest);
    return;
  }

  // Redirect #1.5 — URL begins with a lang but points to an unknown file (e.g., /pt/foo.html)
  {
    const parts = location.pathname.replace(/^\/+/, "").split("/");
    const firstIsLang = !!matchLang(parts[0]) || (!!parts[1] && matchLang(parts[1])); // handles /repo/pt/...
    // second segment if path starts with lang (no repo) OR third if path is /repo/lang/...
    const idx = (parts[0] && matchLang(parts[0])) ? 1 : ((parts[1] && matchLang(parts[1])) ? 2 : -1);
    const file = idx >= 0 ? (parts[idx] || "").toLowerCase() : "";
    const isKnown = file === "" || file === "index.html" || file === "gallery.html" || file === "studio.html";
    if (firstIsLang && !isKnown) {
      window.location.replace(targetForLang(use));
      return;
    }
  }

  // Redirect #2 — repo present but folder lang doesn't match chosen lang (home page only)
  const norm = s => (s || "").toLowerCase().replace(/_/g, "-");
  const pathLang = getPathLang() || "en";
  if (pg.toLowerCase() === "index.html" && norm(pathLang) !== norm(use)) {
    const dest = targetForLang(use);
    if (norm(new URL(dest, location.origin).pathname) !== norm(location.pathname)) {
      window.location.replace(dest);
      return;
    }
  }

  // Apply and render
  setCurrentLang(use);
  applyTranslations(document);

  // Wire selectors
  const hook = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = use;
    el.addEventListener("change", () => {
      const chosen = el.value;
      localStorage.setItem(LS_KEY, chosen);
      window.location.href = targetForLang(chosen);
    });
  };
  hook("lang-select");
  hook("lang-select-menu");

  window.renderGallery?.();
  window.refreshSelectionBar?.();
}

// expose
window.getCurrentLang = getCurrentLang;
window.setCurrentLang = setCurrentLang;
window.applyTranslations = applyTranslations;
window.initLang = initLang;
window.decorateLinks = decorateLinks;
window.matchLang = matchLang;
window.computeRepoAndPage = computeRepoAndPage;
// NOTE: targetForLang is defined globally elsewhere; no inner duplicate here.

// boot
if (document.readyState !== "loading") initLang();
else document.addEventListener("DOMContentLoaded", initLang);
})();

window.translations = {
  en: {
    galleryPageTitle: "My Gallery – Wplace Color Converter",
    pageTitle: "Wplace Color Converter",
    home: "Home",
    gallery: "Gallery",
    galleryTitle: "Your Image Gallery",
    deleteAll: "Delete All",
    exportGallery: "Export Gallery",
    importGallery: "Import Gallery",
    exportSelected: "Export Selected",
    deleteSelected: "Delete Selected",
    searchPlaceholder: "Search…",
    tagFilter: "Tag filter",
    sortNewest: "Newest first",
    sortOldest: "Oldest first",
    sortNameAsc: "Name A→Z",
    sortSizeDesc: "Largest",
    emptyGallery: "No images yet",
    goConvert: "Go Convert",
    personalGallery: "Your personal gallery",
    clearAllPrompt: "Are you sure you want to delete all images?",
    yes: "Yes",
    cancel: "Cancel",
    save: "Save",
    download: "Download",
    delete: "Delete",
    selected: "selected",
    allCollections: "All collections",
    deleteOnePrompt: "Delete this image?",
    deleteSelectedPrompt: "Delete selected images?",
    noImagesExport: "No images to export.",
    exportedAll: "Exported gallery",
    noSelected: "No images selected.",
    exportedSelected: "Exported selected images",
    imported: "Imported images",
    saved: "Saved",
    deleted: "Deleted",
    deleteFailed: "Failed to delete",
    selectionCount: "0 selected",
    collectionFilter: "Collection filter",
    sort: "Sort",
    viewerNamePlaceholder: "Name…",
    viewerTagsPlaceholder: "Tags…",
    viewerCollectionPlaceholder: "Collection",
    studioPageTitle: "Studio – Wplace Color Converter",
    studioTitle: "Studio",
    genNotice: "Uses the public Pollinations image endpoint. Prompts may be logged publicly by that service. No account is required.",
    paletteFree: "Free Colors",
    palettePaid: "Paid Colors",
    tools: "Tools",
    toolPencil: "Pencil", toolPencilTitle: "Pencil (P)",
    toolBrush: "Brush", toolBrushTitle: "Brush (H)",
    toolEraser: "Eraser", toolEraserTitle: "Eraser (E)",
    toolPicker: "Pick", toolPickerTitle: "Eyedropper (I)",
    toolFill: "Fill", toolFillTitle: "Fill (B)",
    toolLine: "Line", toolLineTitle: "Line (L)",
    toolRect: "Rect", toolRectTitle: "Rectangle (R)",
    toolRectF: "Rect+", toolRectFTitle: "Filled Rectangle (Shift+R)",
    toolCirc: "Circle", toolCircTitle: "Ellipse/Circle (O)",
    toolCircF: "Circle+", toolCircFTitle: "Filled Ellipse (Shift+O)",
    undo: "Undo", undoTitle: "Undo (Ctrl+Z)",
    redo: "Redo", redoTitle: "Redo (Ctrl+Y)",
    clear: "Clear",
    gridSize: "Grid Size",
    zoom: "Zoom",
    showGrid: "Show grid",
    genPlaceholder: "e.g., retro 8-bit spaceship sprite facing right, transparent background",
    generate: "Generate",
    uploadImage: "Upload Image",
    hideGrid: "Hide grid",
    customCursors: "Custom Cursors",
    imageNotFound: "Image not found.",
    imageSaved: "Added to gallery!",
    saveFailed: "Failed to save image.",
    storageFull: "Your browser storage is full. Remove some items from the gallery and try again.",
    copied: "Copied to clipboard!",
    cleared: "Canvas cleared.",
    nothingSelected: "Nothing selected."
  },
  pt: {
    galleryPageTitle: "A Minha Galeria – Wplace Color Converter",
    pageTitle: "Wplace Conversor de Cores",
    home: "Início",
    gallery: "Galeria",
    galleryTitle: "A sua Galeria de Imagens",
    deleteAll: "Eliminar Tudo",
    exportGallery: "Exportar Galeria",
    importGallery: "Importar Galeria",
    exportSelected: "Exportar selecionadas",
    deleteSelected: "Eliminar selecionadas",
    searchPlaceholder: "Pesquisar…",
    tagFilter: "Filtro de etiquetas",
    sortNewest: "Mais recentes",
    sortOldest: "Mais antigas",
    sortNameAsc: "Nome A→Z",
    sortSizeDesc: "Maiores",
    emptyGallery: "Ainda sem imagens",
    goConvert: "Ir Converter",
    personalGallery: "A sua galeria pessoal",
    clearAllPrompt: "Tem a certeza de que deseja eliminar todas as imagens?",
    yes: "Sim",
    cancel: "Cancelar",
    save: "Guardar",
    download: "Transferir",
    delete: "Eliminar",
    selected: "selecionadas",
    allCollections: "Todas as coleções",
    deleteOnePrompt: "Eliminar esta imagem?",
    deleteSelectedPrompt: "Eliminar as imagens selecionadas?",
    noImagesExport: "Nenhuma imagem para exportar.",
    exportedAll: "Galeria exportada",
    noSelected: "Nenhuma imagem selecionada.",
    exportedSelected: "Selecionadas exportadas",
    imported: "Imagens importadas",
    saved: "Guardado",
    deleted: "Eliminado",
    deleteFailed: "Falha ao eliminar",
    selectionCount: "0 selecionadas",
    collectionFilter: "Filtro de coleção",
    sort: "Ordenar",
    viewerNamePlaceholder: "Nome…",
    viewerTagsPlaceholder: "Etiquetas…",
    viewerCollectionPlaceholder: "Coleção",
    studioPageTitle: "Estúdio – Wplace Conversor de Cores",
    studioTitle: "Estúdio",
    genNotice: "Usa o serviço público de imagens Pollinations. Os prompts podem ser registados publicamente por esse serviço. Não é necessária conta.",
    paletteFree: "Cores Gratuitas",
    palettePaid: "Cores Pagas",
    tools: "Ferramentas",
    toolPencil: "Lápis", toolPencilTitle: "Lápis (P)",
    toolBrush: "Pincel", toolBrushTitle: "Pincel (H)",
    toolEraser: "Borracha", toolEraserTitle: "Borracha (E)",
    toolPicker: "Conta-gotas", toolPickerTitle: "Conta-gotas (I)",
    toolFill: "Preencher", toolFillTitle: "Preencher (B)",
    toolLine: "Linha", toolLineTitle: "Linha (L)",
    toolRect: "Retângulo", toolRectTitle: "Retângulo (R)",
    toolRectF: "Retângulo+", toolRectFTitle: "Retângulo preenchido (Shift+R)",
    toolCirc: "Círculo", toolCircTitle: "Elipse/Círculo (O)",
    toolCircF: "Círculo+", toolCircFTitle: "Elipse preenchida (Shift+O)",
    undo: "Desfazer", undoTitle: "Desfazer (Ctrl+Z)",
    redo: "Refazer", redoTitle: "Refazer (Ctrl+Y)",
    clear: "Limpar",
    gridSize: "Tamanho da grelha",
    zoom: "Zoom",
    showGrid: "Mostrar grelha",
    genPlaceholder: "ex.: nave retro 8-bits virada à direita, fundo transparente",
    generate: "Gerar",
    uploadImage: "Carregar imagem",
    hideGrid: "Ocultar grelha",
    customCursors: "Cursores personalizados",
    imageNotFound: "Imagem não encontrada.",
    imageSaved: "Adicionado à galeria!",
    saveFailed: "Falha ao guardar a imagem.",
    storageFull: "O armazenamento do navegador está cheio. Remova alguns itens da galeria e tente novamente.",
    copied: "Copiado para a área de transferência!",
    cleared: "Tela limpa.",
    nothingSelected: "Nada selecionado."
  },
  de: {
    galleryPageTitle: "Meine Galerie – Wplace Color Converter",
    pageTitle: "Wplace Farbkonverter",
    home: "Startseite",
    gallery: "Galerie",
    galleryTitle: "Ihre Bildergalerie",
    deleteAll: "Alles löschen",
    exportGallery: "Galerie exportieren",
    importGallery: "Galerie importieren",
    exportSelected: "Auswahl exportieren",
    deleteSelected: "Auswahl löschen",
    searchPlaceholder: "Suchen…",
    tagFilter: "Tag-Filter",
    sortNewest: "Neueste zuerst",
    sortOldest: "Älteste zuerst",
    sortNameAsc: "Name A→Z",
    sortSizeDesc: "Größte",
    emptyGallery: "Noch keine Bilder",
    goConvert: "Zum Konverter",
    personalGallery: "Ihre persönliche Galerie",
    clearAllPrompt: "Möchten Sie wirklich alle Bilder löschen?",
    yes: "Ja",
    cancel: "Abbrechen",
    save: "Speichern",
    download: "Herunterladen",
    delete: "Löschen",
    selected: "ausgewählt",
    allCollections: "Alle Sammlungen",
    deleteOnePrompt: "Dieses Bild löschen?",
    deleteSelectedPrompt: "Ausgewählte Bilder löschen?",
    noImagesExport: "Keine Bilder zum Exportieren.",
    exportedAll: "Galerie exportiert",
    noSelected: "Keine Bilder ausgewählt.",
    exportedSelected: "Auswahl exportiert",
    imported: "Bilder importiert",
    saved: "Gespeichert",
    deleted: "Gelöscht",
    deleteFailed: "Löschen fehlgeschlagen",
    selectionCount: "0 ausgewählt",
    collectionFilter: "Sammlungsfilter",
    sort: "Sortieren",
    viewerNamePlaceholder: "Name…",
    viewerTagsPlaceholder: "Tags…",
    viewerCollectionPlaceholder: "Sammlung",
    studioPageTitle: "Studio – Wplace Farbkonverter",
    studioTitle: "Studio",
    genNotice: "Verwendet den öffentlichen Pollinations-Bilddienst. Prompts können dort öffentlich protokolliert werden. Kein Konto erforderlich.",
    paletteFree: "Kostenlose Farben",
    palettePaid: "Bezahlte Farben",
    tools: "Werkzeuge",
    toolPencil: "Stift", toolPencilTitle: "Stift (P)",
    toolBrush: "Pinsel", toolBrushTitle: "Pinsel (H)",
    toolEraser: "Radierer", toolEraserTitle: "Radierer (E)",
    toolPicker: "Pipette", toolPickerTitle: "Pipette (I)",
    toolFill: "Füllen", toolFillTitle: "Füllen (B)",
    toolLine: "Linie", toolLineTitle: "Linie (L)",
    toolRect: "Rechteck", toolRectTitle: "Rechteck (R)",
    toolRectF: "Rechteck+", toolRectFTitle: "Gefülltes Rechteck (Shift+R)",
    toolCirc: "Kreis", toolCircTitle: "Ellipse/Kreis (O)",
    toolCircF: "Kreis+", toolCircFTitle: "Gefüllte Ellipse (Shift+O)",
    undo: "Rückgängig", undoTitle: "Rückgängig (Ctrl+Z)",
    redo: "Wiederholen", redoTitle: "Wiederholen (Ctrl+Y)",
    clear: "Leeren",
    gridSize: "Rastergröße",
    zoom: "Zoom",
    showGrid: "Raster anzeigen",
    genPlaceholder: "z. B. Retro-8-Bit-Raumschiff nach rechts, transparenter Hintergrund",
    generate: "Generieren",
    uploadImage: "Bild hochladen",
    hideGrid: "Raster ausblenden",
    customCursors: "Benutzerdefinierte Cursor",
    imageNotFound: "Bild nicht gefunden.",
    imageSaved: "Zur Galerie hinzugefügt!",
    saveFailed: "Bild konnte nicht gespeichert werden.",
    storageFull: "Der Browserspeicher ist voll. Entferne einige Elemente aus der Galerie und versuche es erneut.",
    copied: "In die Zwischenablage kopiert!",
    cleared: "Leinwand gelöscht.",
    nothingSelected: "Nichts ausgewählt."
  },
  "de-CH": {
    galleryPageTitle: "Meine Galerie – Wplace Color Converter",
    pageTitle: "Wplace Farbkonverter",
    home: "Startseite",
    gallery: "Galerie",
    galleryTitle: "Ihre Bildergalerie",
    deleteAll: "Alles löschen",
    exportGallery: "Galerie exportieren",
    importGallery: "Galerie importieren",
    exportSelected: "Auswahl exportieren",
    deleteSelected: "Auswahl löschen",
    searchPlaceholder: "Suchen…",
    tagFilter: "Tag-Filter",
    sortNewest: "Neueste zuerst",
    sortOldest: "Älteste zuerst",
    sortNameAsc: "Name A→Z",
    sortSizeDesc: "Größte",
    emptyGallery: "Noch keine Bilder",
    goConvert: "Zum Konverter",
    personalGallery: "Ihre persönliche Galerie",
    clearAllPrompt: "Möchten Sie wirklich alle Bilder löschen?",
    yes: "Ja",
    cancel: "Abbrechen",
    save: "Speichern",
    download: "Herunterladen",
    delete: "Löschen",
    selected: "ausgewählt",
    allCollections: "Alle Sammlungen",
    deleteOnePrompt: "Dieses Bild löschen?",
    deleteSelectedPrompt: "Ausgewählte Bilder löschen?",
    noImagesExport: "Keine Bilder zum Exportieren.",
    exportedAll: "Galerie exportiert",
    noSelected: "Keine Bilder ausgewählt.",
    exportedSelected: "Auswahl exportiert",
    imported: "Bilder importiert",
    saved: "Gespeichert",
    deleted: "Gelöscht",
    deleteFailed: "Löschen fehlgeschlagen",
    selectionCount: "0 ausgewählt",
    collectionFilter: "Sammlungsfilter",
    sort: "Sortieren",
    viewerNamePlaceholder: "Name…",
    viewerTagsPlaceholder: "Tags…",
    viewerCollectionPlaceholder: "Sammlung",
    studioPageTitle: "Studio – Wplace Farbkonverter",
    studioTitle: "Studio",
    genNotice: "Verwendet den öffentlichen Pollinations-Bilddienst. Prompts können dort öffentlich protokolliert werden. Kein Konto erforderlich.",
    paletteFree: "Kostenlose Farben",
    palettePaid: "Bezahlte Farben",
    tools: "Werkzeuge",
    toolPencil: "Stift", toolPencilTitle: "Stift (P)",
    toolBrush: "Pinsel", toolBrushTitle: "Pinsel (H)",
    toolEraser: "Radierer", toolEraserTitle: "Radierer (E)",
    toolPicker: "Pipette", toolPickerTitle: "Pipette (I)",
    toolFill: "Füllen", toolFillTitle: "Füllen (B)",
    toolLine: "Linie", toolLineTitle: "Linie (L)",
    toolRect: "Rechteck", toolRectTitle: "Rechteck (R)",
    toolRectF: "Rechteck+", toolRectFTitle: "Gefülltes Rechteck (Shift+R)",
    toolCirc: "Kreis", toolCircTitle: "Ellipse/Kreis (O)",
    toolCircF: "Kreis+", toolCircFTitle: "Gefüllte Ellipse (Shift+O)",
    undo: "Rückgängig", undoTitle: "Rückgängig (Ctrl+Z)",
    redo: "Wiederholen", redoTitle: "Wiederholen (Ctrl+Y)",
    clear: "Leeren",
    gridSize: "Rastergröße",
    zoom: "Zoom",
    showGrid: "Raster anzeigen",
    genPlaceholder: "z. B. Retro-8-Bit-Raumschiff nach rechts, transparenter Hintergrund",
    generate: "Generieren",
    uploadImage: "Bild hochladen",
    hideGrid: "Raster ausblenden",
    customCursors: "Benutzerdefinierte Cursor",
    imageNotFound: "Bild nicht gefunden.",
    imageSaved: "Zur Galerie hinzugefügt!",
    saveFailed: "Bild konnte nicht gespeichert werden.",
    storageFull: "Der Browserspeicher ist voll. Entferne einige Elemente aus der Galerie und versuche es erneut.",
    copied: "In die Zwischenablage kopiert!",
    cleared: "Leinwand gelöscht.",
    nothingSelected: "Nichts ausgewählt."
  },
  es: {
    galleryPageTitle: "Mi Galería – Wplace Color Converter",
    pageTitle: "Wplace Convertidor de Colores",
    home: "Inicio",
    gallery: "Galería",
    galleryTitle: "Tu Galería de Imágenes",
    deleteAll: "Eliminar todo",
    exportGallery: "Exportar galería",
    importGallery: "Importar galería",
    exportSelected: "Exportar seleccionadas",
    deleteSelected: "Eliminar seleccionadas",
    searchPlaceholder: "Buscar…",
    tagFilter: "Filtro de etiquetas",
    sortNewest: "Más recientes",
    sortOldest: "Más antiguas",
    sortNameAsc: "Nombre A→Z",
    sortSizeDesc: "Más grandes",
    emptyGallery: "Aún no hay imágenes",
    goConvert: "Ir a convertir",
    personalGallery: "Tu galería personal",
    clearAllPrompt: "¿Seguro que deseas eliminar todas las imágenes?",
    yes: "Sí",
    cancel: "Cancelar",
    save: "Guardar",
    download: "Descargar",
    delete: "Eliminar",
    selected: "seleccionadas",
    allCollections: "Todas las colecciones",
    deleteOnePrompt: "¿Eliminar esta imagen?",
    deleteSelectedPrompt: "¿Eliminar las imágenes seleccionadas?",
    noImagesExport: "No hay imágenes para exportar.",
    exportedAll: "Galería exportada",
    noSelected: "No se seleccionaron imágenes.",
    exportedSelected: "Exportación completada",
    imported: "Imágenes importadas",
    saved: "Guardado",
    deleted: "Eliminado",
    deleteFailed: "Error al eliminar",
    selectionCount: "0 seleccionadas",
    collectionFilter: "Filtro de colección",
    sort: "Ordenar",
    viewerNamePlaceholder: "Nombre…",
    viewerTagsPlaceholder: "Etiquetas…",
    viewerCollectionPlaceholder: "Colección",
    studioPageTitle: "Estudio – Wplace Convertidor de Colores",
    studioTitle: "Estudio",
    genNotice: "Usa el servicio público de imágenes Pollinations. Los prompts pueden registrarse públicamente en ese servicio. No se requiere cuenta.",
    paletteFree: "Colores gratis",
    palettePaid: "Colores de pago",
    tools: "Herramientas",
    toolPencil: "Lápiz", toolPencilTitle: "Lápiz (P)",
    toolBrush: "Pincel", toolBrushTitle: "Pincel (H)",
    toolEraser: "Borrador", toolEraserTitle: "Borrador (E)",
    toolPicker: "Cuentagotas", toolPickerTitle: "Cuentagotas (I)",
    toolFill: "Rellenar", toolFillTitle: "Rellenar (B)",
    toolLine: "Línea", toolLineTitle: "Línea (L)",
    toolRect: "Rectángulo", toolRectTitle: "Rectángulo (R)",
    toolRectF: "Rectángulo+", toolRectFTitle: "Rectángulo relleno (Shift+R)",
    toolCirc: "Círculo", toolCircTitle: "Elipse/Círculo (O)",
    toolCircF: "Círculo+", toolCircFTitle: "Elipse rellena (Shift+O)",
    undo: "Deshacer", undoTitle: "Deshacer (Ctrl+Z)",
    redo: "Rehacer", redoTitle: "Rehacer (Ctrl+Y)",
    clear: "Limpiar",
    gridSize: "Tamaño de cuadrícula",
    zoom: "Zoom",
    showGrid: "Mostrar cuadrícula",
    genPlaceholder: "ej.: nave retro de 8 bits mirando a la derecha, fondo transparente",
    generate: "Generar",
    uploadImage: "Subir imagen",
    hideGrid: "Ocultar cuadrícula",
    customCursors: "Cursores personalizados",
    imageNotFound: "Imagen no encontrada.",
    imageSaved: "¡Añadido a la galería!",
    saveFailed: "Error al guardar la imagen.",
    storageFull: "El almacenamiento del navegador está lleno. Elimina elementos de la galería e inténtalo de nuevo.",
    copied: "¡Copiado al portapapeles!",
    cleared: "Lienzo borrado.",
    nothingSelected: "Nada seleccionado."

  },
  fr: {
    galleryPageTitle: "Ma Galerie – Wplace Color Converter",
    pageTitle: "Wplace Convertisseur de Couleurs",
    home: "Accueil",
    gallery: "Galerie",
    galleryTitle: "Votre Galerie d’Images",
    deleteAll: "Tout supprimer",
    exportGallery: "Exporter la galerie",
    importGallery: "Importer la galerie",
    exportSelected: "Exporter la sélection",
    deleteSelected: "Supprimer la sélection",
    searchPlaceholder: "Rechercher…",
    tagFilter: "Filtre de tags",
    sortNewest: "Plus récentes",
    sortOldest: "Plus anciennes",
    sortNameAsc: "Nom A→Z",
    sortSizeDesc: "Les plus grandes",
    emptyGallery: "Pas encore d’images",
    goConvert: "Aller convertir",
    personalGallery: "Votre galerie personnelle",
    clearAllPrompt: "Voulez-vous vraiment supprimer toutes les images ?",
    yes: "Oui",
    cancel: "Annuler",
    save: "Enregistrer",
    download: "Télécharger",
    delete: "Supprimer",
    selected: "sélectionnées",
    allCollections: "Toutes les collections",
    deleteOnePrompt: "Supprimer cette image ?",
    deleteSelectedPrompt: "Supprimer les images sélectionnées ?",
    noImagesExport: "Aucune image à exporter.",
    exportedAll: "Galerie exportée",
    noSelected: "Aucune image sélectionnée.",
    exportedSelected: "Sélection exportée",
    imported: "Images importées",
    saved: "Enregistré",
    deleted: "Supprimé",
    deleteFailed: "Échec de la suppression",
    selectionCount: "0 sélectionnées",
    collectionFilter: "Filtre de collection",
    sort: "Trier",
    viewerNamePlaceholder: "Nom…",
    viewerTagsPlaceholder: "Étiquettes…",
    viewerCollectionPlaceholder: "Collection",
    studioPageTitle: "Studio – Wplace Convertisseur de Couleurs",
    studioTitle: "Studio",
    genNotice: "Utilise le service public d’images Pollinations. Les prompts peuvent être enregistrés publiquement par ce service. Aucun compte requis.",
    paletteFree: "Couleurs gratuites",
    palettePaid: "Couleurs payantes",
    tools: "Outils",
    toolPencil: "Crayon", toolPencilTitle: "Crayon (P)",
    toolBrush: "Pinceau", toolBrushTitle: "Pinceau (H)",
    toolEraser: "Gomme", toolEraserTitle: "Gomme (E)",
    toolPicker: "Pipette", toolPickerTitle: "Pipette (I)",
    toolFill: "Remplir", toolFillTitle: "Remplir (B)",
    toolLine: "Ligne", toolLineTitle: "Ligne (L)",
    toolRect: "Rectangle", toolRectTitle: "Rectangle (R)",
    toolRectF: "Rectangle+", toolRectFTitle: "Rectangle plein (Shift+R)",
    toolCirc: "Cercle", toolCircTitle: "Ellipse/Cercle (O)",
    toolCircF: "Cercle+", toolCircFTitle: "Ellipse pleine (Shift+O)",
    undo: "Annuler", undoTitle: "Annuler (Ctrl+Z)",
    redo: "Rétablir", redoTitle: "Rétablir (Ctrl+Y)",
    clear: "Effacer",
    gridSize: "Taille de la grille",
    zoom: "Zoom",
    showGrid: "Afficher la grille",
    genPlaceholder: "ex. : vaisseau rétro 8 bits tourné à droite, fond transparent",
    generate: "Générer",
    uploadImage: "Importer une image",
    hideGrid: "Masquer la grille",
    customCursors: "Curseurs personnalisés",
    imageNotFound: "Image non trouvée.",
    imageSaved: "Ajouté à la galerie !",
    saveFailed: "Échec de l’enregistrement de l’image.",
    storageFull: "Le stockage du navigateur est plein. Supprimez des éléments de la galerie et réessayez.",
    copied: "Copié dans le presse-papiers !",
    cleared: "Toile effacée.",
    nothingSelected: "Rien sélectionné."
  },
  uk: {
    galleryPageTitle: "Моя Галерея – Wplace Color Converter",
    pageTitle: "Wplace Конвертер кольорів",
    home: "Головна",
    gallery: "Галерея",
    galleryTitle: "Ваша Галерея зображень",
    deleteAll: "Видалити все",
    exportGallery: "Експортувати галерею",
    importGallery: "Імпортувати галерею",
    exportSelected: "Експортувати вибрані",
    deleteSelected: "Видалити вибрані",
    searchPlaceholder: "Пошук…",
    tagFilter: "Фільтр тегів",
    sortNewest: "Найновіші",
    sortOldest: "Найстаріші",
    sortNameAsc: "Ім’я A→Z",
    sortSizeDesc: "Найбільші",
    emptyGallery: "Немає зображень",
    goConvert: "Перейти до конвертації",
    personalGallery: "Ваша особиста галерея",
    clearAllPrompt: "Видалити всі зображення?",
    yes: "Так",
    cancel: "Скасувати",
    save: "Зберегти",
    download: "Завантажити",
    delete: "Видалити",
    selected: "вибрано",
    allCollections: "Усі колекції",
    deleteOnePrompt: "Видалити це зображення?",
    deleteSelectedPrompt: "Видалити вибрані зображення?",
    noImagesExport: "Немає зображень для експорту.",
    exportedAll: "Галерею експортовано",
    noSelected: "Не вибрано зображень.",
    exportedSelected: "Вибрані експортовано",
    imported: "Зображення імпортовано",
    saved: "Збережено",
    deleted: "Видалено",
    deleteFailed: "Помилка видалення",
    selectionCount: "0 вибрано",
    collectionFilter: "Фільтр колекцій",
    sort: "Сортувати",
    viewerNamePlaceholder: "Ім’я…",
    viewerTagsPlaceholder: "Теги…",
    viewerCollectionPlaceholder: "Колекція",
    studioPageTitle: "Студія – Wplace Конвертер кольорів",
    studioTitle: "Студія",
    genNotice: "Використовує публічний сервіс зображень Pollinations. Промпти можуть зберігатися публічно цим сервісом. Обліковий запис не потрібен.",
    paletteFree: "Безкоштовні кольори",
    palettePaid: "Платні кольори",
    tools: "Інструменти",
    toolPencil: "Олівець", toolPencilTitle: "Олівець (P)",
    toolBrush: "Пензель", toolBrushTitle: "Пензель (H)",
    toolEraser: "Гумка", toolEraserTitle: "Гумка (E)",
    toolPicker: "Піпетка", toolPickerTitle: "Піпетка (I)",
    toolFill: "Заливка", toolFillTitle: "Заливка (B)",
    toolLine: "Лінія", toolLineTitle: "Лінія (L)",
    toolRect: "Прямокутник", toolRectTitle: "Прямокутник (R)",
    toolRectF: "Прямокутник+", toolRectFTitle: "Заповнений прямокутник (Shift+R)",
    toolCirc: "Коло", toolCircTitle: "Еліпс/Коло (O)",
    toolCircF: "Коло+", toolCircFTitle: "Заповнений еліпс (Shift+O)",
    undo: "Скасувати", undoTitle: "Скасувати (Ctrl+Z)",
    redo: "Повторити", redoTitle: "Повторити (Ctrl+Y)",
    clear: "Очистити",
    gridSize: "Розмір сітки",
    zoom: "Масштаб",
    showGrid: "Показати сітку",
    genPlaceholder: "наприклад: ретро 8-бітний космічний корабель праворуч, прозорий фон",
    generate: "Згенерувати",
    uploadImage: "Завантажити зображення",
    hideGrid: "Приховати сітку",
    customCursors: "Користувацькі курсори",
    imageNotFound: "Зображення не знайдено.",
    imageSaved: "Додано до галереї!",
    saveFailed: "Не вдалося зберегти зображення.",
    storageFull: "Пам’ять браузера заповнена. Видаліть деякі елементи з галереї та спробуйте ще раз.",
    copied: "Скопійовано в буфер обміну!",
    cleared: "Полотно очищено.",
    nothingSelected: "Нічого не вибрано."
  },
  vi: {
    galleryPageTitle: "Thư viện của tôi – Wplace Color Converter",
    pageTitle: "Wplace Trình Chuyển Đổi Màu",
    home: "Trang chủ",
    gallery: "Thư viện",
    galleryTitle: "Thư viện hình ảnh của bạn",
    deleteAll: "Xóa tất cả",
    exportGallery: "Xuất thư viện",
    importGallery: "Nhập thư viện",
    exportSelected: "Xuất đã chọn",
    deleteSelected: "Xóa đã chọn",
    searchPlaceholder: "Tìm kiếm…",
    tagFilter: "Bộ lọc thẻ",
    sortNewest: "Mới nhất",
    sortOldest: "Cũ nhất",
    sortNameAsc: "Tên A→Z",
    sortSizeDesc: "Lớn nhất",
    emptyGallery: "Chưa có hình ảnh",
    goConvert: "Chuyển đổi",
    personalGallery: "Thư viện cá nhân của bạn",
    clearAllPrompt: "Bạn có chắc muốn xóa tất cả hình ảnh?",
    yes: "Có",
    cancel: "Hủy",
    save: "Lưu",
    download: "Tải xuống",
    delete: "Xóa",
    selected: "đã chọn",
    allCollections: "Tất cả bộ sưu tập",
    deleteOnePrompt: "Xóa hình này?",
    deleteSelectedPrompt: "Xóa các hình đã chọn?",
    noImagesExport: "Không có hình nào để xuất.",
    exportedAll: "Đã xuất thư viện",
    noSelected: "Không có hình nào được chọn.",
    exportedSelected: "Đã xuất hình đã chọn",
    imported: "Đã nhập hình",
    saved: "Đã lưu",
    deleted: "Đã xóa",
    deleteFailed: "Xóa thất bại",
    selectionCount: "0 đã chọn",
    collectionFilter: "Bộ lọc bộ sưu tập",
    sort: "Sắp xếp",
    viewerNamePlaceholder: "Tên…",
    viewerTagsPlaceholder: "Thẻ…",
    viewerCollectionPlaceholder: "Bộ sưu tập",
    studioPageTitle: "Studio – Wplace Trình Chuyển Đổi Màu",
    studioTitle: "Studio",
    genNotice: "Sử dụng dịch vụ hình ảnh công khai Pollinations. Prompt có thể được lưu công khai bởi dịch vụ này. Không cần tài khoản.",
    paletteFree: "Màu miễn phí",
    palettePaid: "Màu trả phí",
    tools: "Công cụ",
    toolPencil: "Bút chì", toolPencilTitle: "Bút chì (P)",
    toolBrush: "Cọ vẽ", toolBrushTitle: "Cọ vẽ (H)",
    toolEraser: "Tẩy", toolEraserTitle: "Tẩy (E)",
    toolPicker: "Chọn màu", toolPickerTitle: "Ống nhỏ giọt (I)",
    toolFill: "Tô màu", toolFillTitle: "Tô màu (B)",
    toolLine: "Đường", toolLineTitle: "Đường (L)",
    toolRect: "Hình chữ nhật", toolRectTitle: "Hình chữ nhật (R)",
    toolRectF: "Hình chữ nhật+", toolRectFTitle: "Hình chữ nhật tô màu (Shift+R)",
    toolCirc: "Hình tròn", toolCircTitle: "Hình elip/tròn (O)",
    toolCircF: "Hình tròn+", toolCircFTitle: "Hình elip tô màu (Shift+O)",
    undo: "Hoàn tác", undoTitle: "Hoàn tác (Ctrl+Z)",
    redo: "Làm lại", redoTitle: "Làm lại (Ctrl+Y)",
    clear: "Xóa",
    gridSize: "Kích thước lưới",
    zoom: "Thu phóng",
    showGrid: "Hiện lưới",
    genPlaceholder: "ví dụ: tàu vũ trụ retro 8-bit nhìn sang phải, nền trong suốt",
    generate: "Tạo",
    uploadImage: "Tải ảnh lên",
    hideGrid: "Ẩn lưới",
    customCursors: "Con trỏ tùy chỉnh",
    imageNotFound: "Không tìm thấy hình ảnh.",
    imageSaved: "Đã thêm vào thư viện!",
    saveFailed: "Lưu hình ảnh thất bại.",
    storageFull: "Bộ nhớ trình duyệt đã đầy. Hãy xóa bớt một số mục trong thư viện và thử lại.",
    copied: "Đã sao chép vào bộ nhớ tạm!",
    cleared: "Đã xóa canvas.",
    nothingSelected: "Chưa chọn gì."
  },
  pl: {
    galleryPageTitle: "Moja Galeria – Wplace Color Converter",
    pageTitle: "Wplace Konwerter Kolorów",
    home: "Strona główna",
    gallery: "Galeria",
    galleryTitle: "Twoja Galeria obrazów",
    deleteAll: "Usuń wszystko",
    exportGallery: "Eksportuj galerię",
    importGallery: "Importuj galerię",
    exportSelected: "Eksportuj wybrane",
    deleteSelected: "Usuń wybrane",
    searchPlaceholder: "Szukaj…",
    tagFilter: "Filtr tagów",
    sortNewest: "Najnowsze",
    sortOldest: "Najstarsze",
    sortNameAsc: "Nazwa A→Z",
    sortSizeDesc: "Największe",
    emptyGallery: "Brak obrazów",
    goConvert: "Idź konwertować",
    personalGallery: "Twoja osobista galeria",
    clearAllPrompt: "Czy na pewno usunąć wszystkie obrazy?",
    yes: "Tak",
    cancel: "Anuluj",
    save: "Zapisz",
    download: "Pobierz",
    delete: "Usuń",
    selected: "wybrane",
    allCollections: "Wszystkie kolekcje",
    deleteOnePrompt: "Usunąć ten obraz?",
    deleteSelectedPrompt: "Usunąć wybrane obrazy?",
    noImagesExport: "Brak obrazów do eksportu.",
    exportedAll: "Wyeksportowano galerię",
    noSelected: "Nie wybrano obrazów.",
    exportedSelected: "Wyeksportowano wybrane",
    imported: "Zaimportowano obrazy",
    saved: "Zapisano",
    deleted: "Usunięto",
    deleteFailed: "Błąd usuwania",
    selectionCount: "0 wybrane",
    collectionFilter: "Filtr kolekcji",
    sort: "Sortuj",
    viewerNamePlaceholder: "Nazwa…",
    viewerTagsPlaceholder: "Tagi…",
    viewerCollectionPlaceholder: "Kolekcja",
    studioPageTitle: "Studio – Wplace Konwerter Kolorów",
    studioTitle: "Studio",
    genNotice: "Korzysta z publicznego serwisu obrazów Pollinations. Prompty mogą być publicznie rejestrowane przez ten serwis. Konto nie jest wymagane.",
    paletteFree: "Darmowe kolory",
    palettePaid: "Płatne kolory",
    tools: "Narzędzia",
    toolPencil: "Ołówek", toolPencilTitle: "Ołówek (P)",
    toolBrush: "Pędzel", toolBrushTitle: "Pędzel (H)",
    toolEraser: "Gumka", toolEraserTitle: "Gumka (E)",
    toolPicker: "Pipeta", toolPickerTitle: "Pipeta (I)",
    toolFill: "Wypełnij", toolFillTitle: "Wypełnij (B)",
    toolLine: "Linia", toolLineTitle: "Linia (L)",
    toolRect: "Prostokąt", toolRectTitle: "Prostokąt (R)",
    toolRectF: "Prostokąt+", toolRectFTitle: "Wypełniony prostokąt (Shift+R)",
    toolCirc: "Koło", toolCircTitle: "Elipsa/Koło (O)",
    toolCircF: "Koło+", toolCircFTitle: "Wypełniona elipsa (Shift+O)",
    undo: "Cofnij", undoTitle: "Cofnij (Ctrl+Z)",
    redo: "Ponów", redoTitle: "Ponów (Ctrl+Y)",
    clear: "Wyczyść",
    gridSize: "Rozmiar siatki",
    zoom: "Powiększenie",
    showGrid: "Pokaż siatkę",
    genPlaceholder: "np.: retro statek kosmiczny 8-bit skierowany w prawo, przezroczyste tło",
    generate: "Generuj",
    uploadImage: "Prześlij obraz",
    hideGrid: "Ukryj siatkę",
    customCursors: "Własne kursory",
    imageNotFound: "Nie znaleziono obrazu.",
    imageSaved: "Dodano do galerii!",
    saveFailed: "Nie udało się zapisać obrazu.",
    storageFull: "Pamięć przeglądarki jest pełna. Usuń niektóre elementy z galerii i spróbuj ponownie.",
    copied: "Skopiowano do schowka!",
    cleared: "Płótno wyczyszczone.",
    nothingSelected: "Nic nie zaznaczono."
  },
  ja: {
    galleryPageTitle: "マイギャラリー – Wplace Color Converter",
    pageTitle: "Wplace カラーコンバーター",
    home: "ホーム",
    gallery: "ギャラリー",
    galleryTitle: "あなたの画像ギャラリー",
    deleteAll: "すべて削除",
    exportGallery: "ギャラリーをエクスポート",
    importGallery: "ギャラリーをインポート",
    exportSelected: "選択をエクスポート",
    deleteSelected: "選択を削除",
    searchPlaceholder: "検索…",
    tagFilter: "タグフィルター",
    sortNewest: "新しい順",
    sortOldest: "古い順",
    sortNameAsc: "名前 A→Z",
    sortSizeDesc: "大きい順",
    emptyGallery: "画像がまだありません",
    goConvert: "コンバーターへ",
    personalGallery: "あなたの個人ギャラリー",
    clearAllPrompt: "すべての画像を削除しますか？",
    yes: "はい",
    cancel: "キャンセル",
    save: "保存",
    download: "ダウンロード",
    delete: "削除",
    selected: "選択中",
    allCollections: "すべてのコレクション",
    deleteOnePrompt: "この画像を削除しますか？",
    deleteSelectedPrompt: "選択した画像を削除しますか？",
    noImagesExport: "エクスポートする画像がありません。",
    exportedAll: "ギャラリーをエクスポートしました",
    noSelected: "画像が選択されていません。",
    exportedSelected: "選択をエクスポートしました",
    imported: "画像をインポートしました",
    saved: "保存しました",
    deleted: "削除しました",
    deleteFailed: "削除に失敗しました",
    selectionCount: "0 選択中",
    collectionFilter: "コレクションフィルター",
    sort: "並べ替え",
    viewerNamePlaceholder: "名前…",
    viewerTagsPlaceholder: "タグ…",
    viewerCollectionPlaceholder: "コレクション",
    studioPageTitle: "スタジオ – Wplace カラーコンバーター",
    studioTitle: "スタジオ",
    genNotice: "公開の Pollinations 画像サービスを使用します。プロンプトはそのサービスによって公開ログに記録される可能性があります。アカウントは不要です。",
    paletteFree: "無料の色",
    palettePaid: "有料の色",
    tools: "ツール",
    toolPencil: "鉛筆", toolPencilTitle: "鉛筆 (P)",
    toolBrush: "ブラシ", toolBrushTitle: "ブラシ (H)",
    toolEraser: "消しゴム", toolEraserTitle: "消しゴム (E)",
    toolPicker: "スポイト", toolPickerTitle: "スポイト (I)",
    toolFill: "塗りつぶし", toolFillTitle: "塗りつぶし (B)",
    toolLine: "線", toolLineTitle: "線 (L)",
    toolRect: "四角", toolRectTitle: "四角形 (R)",
    toolRectF: "四角+", toolRectFTitle: "塗りつぶし四角形 (Shift+R)",
    toolCirc: "円", toolCircTitle: "楕円/円 (O)",
    toolCircF: "円+", toolCircFTitle: "塗りつぶし楕円 (Shift+O)",
    undo: "元に戻す", undoTitle: "元に戻す (Ctrl+Z)",
    redo: "やり直す", redoTitle: "やり直す (Ctrl+Y)",
    clear: "クリア",
    gridSize: "グリッドサイズ",
    zoom: "ズーム",
    showGrid: "グリッドを表示",
    genPlaceholder: "例: レトロ8ビットの宇宙船、右向き、透明背景",
    generate: "生成",
    uploadImage: "画像をアップロード",
    hideGrid: "グリッドを非表示",
    customCursors: "カスタムカーソル",
    imageNotFound: "画像が見つかりません。",
    imageSaved: "ギャラリーに追加しました！",
    saveFailed: "画像の保存に失敗しました。",
    storageFull: "ブラウザのストレージがいっぱいです。ギャラリーからいくつか削除して再試行してください。",
    copied: "クリップボードにコピーしました！",
    cleared: "キャンバスをクリアしました。",
    nothingSelected: "何も選択されていません。"
  },
  nl: {
    galleryPageTitle: "Mijn Galerij – Wplace Color Converter",
    pageTitle: "Wplace Kleurconverter",
    home: "Home",
    gallery: "Galerij",
    galleryTitle: "Jouw Afbeeldingengalerij",
    deleteAll: "Alles verwijderen",
    exportGallery: "Galerij exporteren",
    importGallery: "Galerij importeren",
    exportSelected: "Selectie exporteren",
    deleteSelected: "Selectie verwijderen",
    searchPlaceholder: "Zoeken…",
    tagFilter: "Tagfilter",
    sortNewest: "Nieuwste eerst",
    sortOldest: "Oudste eerst",
    sortNameAsc: "Naam A→Z",
    sortSizeDesc: "Grootste",
    emptyGallery: "Nog geen afbeeldingen",
    goConvert: "Ga converteren",
    personalGallery: "Jouw persoonlijke galerij",
    clearAllPrompt: "Weet je zeker dat je alle afbeeldingen wilt verwijderen?",
    yes: "Ja",
    cancel: "Annuleren",
    save: "Opslaan",
    download: "Downloaden",
    delete: "Verwijderen",
    selected: "geselecteerd",
    allCollections: "Alle collecties",
    deleteOnePrompt: "Deze afbeelding verwijderen?",
    deleteSelectedPrompt: "Geselecteerde afbeeldingen verwijderen?",
    noImagesExport: "Geen afbeeldingen om te exporteren.",
    exportedAll: "Galerij geëxporteerd",
    noSelected: "Geen afbeeldingen geselecteerd.",
    exportedSelected: "Geselecteerde geëxporteerd",
    imported: "Afbeeldingen geïmporteerd",
    saved: "Opgeslagen",
    deleted: "Verwijderd",
    deleteFailed: "Verwijderen mislukt",
    selectionCount: "0 geselecteerd",
    collectionFilter: "Collectiefilter",
    sort: "Sorteren",
    viewerNamePlaceholder: "Naam…",
    viewerTagsPlaceholder: "Tags…",
    viewerCollectionPlaceholder: "Collectie",
    studioPageTitle: "Studio – Wplace Kleurconverter",
    studioTitle: "Studio",
    genNotice: "Gebruikt de openbare Pollinations-afbeeldingsdienst. Prompts kunnen daar openbaar worden gelogd. Geen account vereist.",
    paletteFree: "Gratis kleuren",
    palettePaid: "Betaalde kleuren",
    tools: "Hulpmiddelen",
    toolPencil: "Potlood", toolPencilTitle: "Potlood (P)",
    toolBrush: "Kwast", toolBrushTitle: "Kwast (H)",
    toolEraser: "Gum", toolEraserTitle: "Gum (E)",
    toolPicker: "Pipet", toolPickerTitle: "Pipet (I)",
    toolFill: "Vullen", toolFillTitle: "Vullen (B)",
    toolLine: "Lijn", toolLineTitle: "Lijn (L)",
    toolRect: "Rechthoek", toolRectTitle: "Rechthoek (R)",
    toolRectF: "Rechthoek+", toolRectFTitle: "Gevulde rechthoek (Shift+R)",
    toolCirc: "Cirkel", toolCircTitle: "Ellips/Cirkel (O)",
    toolCircF: "Cirkel+", toolCircFTitle: "Gevulde ellips (Shift+O)",
    undo: "Ongedaan maken", undoTitle: "Ongedaan maken (Ctrl+Z)",
    redo: "Opnieuw", redoTitle: "Opnieuw (Ctrl+Y)",
    clear: "Wissen",
    gridSize: "Rastergrootte",
    zoom: "Zoom",
    showGrid: "Raster weergeven",
    genPlaceholder: "bijv.: retro 8-bit ruimteschip naar rechts, transparante achtergrond",
    generate: "Genereren",
    uploadImage: "Afbeelding uploaden",
    hideGrid: "Raster verbergen",
    customCursors: "Aangepaste cursors",
    imageNotFound: "Afbeelding niet gevonden.",
    imageSaved: "Toegevoegd aan galerij!",
    saveFailed: "Afbeelding kon niet worden opgeslagen.",
    storageFull: "De browseropslag is vol. Verwijder enkele items uit de galerij en probeer opnieuw.",
    copied: "Gekopieerd naar klembord!",
    cleared: "Canvas gewist.",
    nothingSelected: "Niets geselecteerd."
  },
  ru: {
    galleryPageTitle: "Моя Галерея – Wplace Color Converter",
    pageTitle: "Wplace Конвертер цветов",
    home: "Главная",
    gallery: "Галерея",
    galleryTitle: "Ваша галерея изображений",
    deleteAll: "Удалить все",
    exportGallery: "Экспорт галереи",
    importGallery: "Импорт галереи",
    exportSelected: "Экспортировать выбранные",
    deleteSelected: "Удалить выбранные",
    searchPlaceholder: "Поиск…",
    tagFilter: "Фильтр тегов",
    sortNewest: "Сначала новые",
    sortOldest: "Сначала старые",
    sortNameAsc: "Имя A→Z",
    sortSizeDesc: "Самые большие",
    emptyGallery: "Нет изображений",
    goConvert: "Перейти к конвертеру",
    personalGallery: "Ваша личная галерея",
    clearAllPrompt: "Вы уверены, что хотите удалить все изображения?",
    yes: "Да",
    cancel: "Отмена",
    save: "Сохранить",
    download: "Скачать",
    delete: "Удалить",
    selected: "выбрано",
    allCollections: "Все коллекции",
    deleteOnePrompt: "Удалить это изображение?",
    deleteSelectedPrompt: "Удалить выбранные изображения?",
    noImagesExport: "Нет изображений для экспорта.",
    exportedAll: "Галерея экспортирована",
    noSelected: "Нет выбранных изображений.",
    exportedSelected: "Выбранные экспортированы",
    imported: "Изображения импортированы",
    saved: "Сохранено",
    deleted: "Удалено",
    deleteFailed: "Не удалось удалить",
    selectionCount: "0 выбрано",
    collectionFilter: "Фильтр коллекции",
    sort: "Сортировать",
    viewerNamePlaceholder: "Имя…",
    viewerTagsPlaceholder: "Теги…",
    viewerCollectionPlaceholder: "Коллекция",
    studioPageTitle: "Студия – Wplace Конвертер цветов",
    studioTitle: "Студия",
    genNotice: "Использует публичный сервис изображений Pollinations. Подсказки могут записываться этим сервисом публично. Аккаунт не требуется.",
    paletteFree: "Бесплатные цвета",
    palettePaid: "Платные цвета",
    tools: "Инструменты",
    toolPencil: "Карандаш", toolPencilTitle: "Карандаш (P)",
    toolBrush: "Кисть", toolBrushTitle: "Кисть (H)",
    toolEraser: "Ластик", toolEraserTitle: "Ластик (E)",
    toolPicker: "Пипетка", toolPickerTitle: "Пипетка (I)",
    toolFill: "Заливка", toolFillTitle: "Заливка (B)",
    toolLine: "Линия", toolLineTitle: "Линия (L)",
    toolRect: "Прямоугольник", toolRectTitle: "Прямоугольник (R)",
    toolRectF: "Прямоугольник+", toolRectFTitle: "Заполненный прямоугольник (Shift+R)",
    toolCirc: "Круг", toolCircTitle: "Эллипс/Круг (O)",
    toolCircF: "Круг+", toolCircFTitle: "Заполненный эллипс (Shift+O)",
    undo: "Отменить", undoTitle: "Отменить (Ctrl+Z)",
    redo: "Повторить", redoTitle: "Повторить (Ctrl+Y)",
    clear: "Очистить",
    gridSize: "Размер сетки",
    zoom: "Масштаб",
    showGrid: "Показать сетку",
    genPlaceholder: "напр.: ретро 8-битный космический корабль вправо, прозрачный фон",
    generate: "Сгенерировать",
    uploadImage: "Загрузить изображение",
    hideGrid: "Скрыть сетку",
    customCursors: "Пользовательские курсоры",
    imageNotFound: "Изображение не найдено.",
    imageSaved: "Добавлено в галерею!",
    saveFailed: "Не удалось сохранить изображение.",
    storageFull: "Хранилище браузера переполнено. Удалите некоторые элементы из галереи и попробуйте снова.",
    copied: "Скопировано в буфер обмена!",
    cleared: "Холст очищен.",
    nothingSelected: "Ничего не выбрано."
  },
  tr: {
    galleryPageTitle: "Galerim – Wplace Color Converter",
    pageTitle: "Wplace Renk Dönüştürücü",
    home: "Ana Sayfa",
    gallery: "Galeri",
    galleryTitle: "Resim Galeriniz",
    deleteAll: "Tümünü sil",
    exportGallery: "Galeriyi dışa aktar",
    importGallery: "Galeriyi içe aktar",
    exportSelected: "Seçilenleri dışa aktar",
    deleteSelected: "Seçilenleri sil",
    searchPlaceholder: "Ara…",
    tagFilter: "Etiket filtresi",
    sortNewest: "En yeniler",
    sortOldest: "En eskiler",
    sortNameAsc: "Ad A→Z",
    sortSizeDesc: "En büyükler",
    emptyGallery: "Henüz resim yok",
    goConvert: "Dönüştürmeye git",
    personalGallery: "Kişisel galeriniz",
    clearAllPrompt: "Tüm resimleri silmek istediğinizden emin misiniz?",
    yes: "Evet",
    cancel: "İptal",
    save: "Kaydet",
    download: "İndir",
    delete: "Sil",
    selected: "seçildi",
    allCollections: "Tüm koleksiyonlar",
    deleteOnePrompt: "Bu resmi sil?",
    deleteSelectedPrompt: "Seçilen resimler silinsin mi?",
    noImagesExport: "Dışa aktarılacak resim yok.",
    exportedAll: "Galeri dışa aktarıldı",
    noSelected: "Hiç resim seçilmedi.",
    exportedSelected: "Seçilenler dışa aktarıldı",
    imported: "Resimler içe aktarıldı",
    saved: "Kaydedildi",
    deleted: "Silindi",
    deleteFailed: "Silme başarısız",
    selectionCount: "0 seçildi",
    collectionFilter: "Koleksiyon filtresi",
    sort: "Sırala",
    viewerNamePlaceholder: "Ad…",
    viewerTagsPlaceholder: "Etiketler…",
    viewerCollectionPlaceholder: "Koleksiyon",
    studioPageTitle: "Stüdyo – Wplace Renk Dönüştürücü",
    studioTitle: "Stüdyo",
    genNotice: "Genel Pollinations görsel hizmetini kullanır. Promptlar bu hizmet tarafından herkese açık olarak kaydedilebilir. Hesap gerekli değildir.",
    paletteFree: "Ücretsiz Renkler",
    palettePaid: "Ücretli Renkler",
    tools: "Araçlar",
    toolPencil: "Kalem", toolPencilTitle: "Kalem (P)",
    toolBrush: "Fırça", toolBrushTitle: "Fırça (H)",
    toolEraser: "Silgi", toolEraserTitle: "Silgi (E)",
    toolPicker: "Damlalık", toolPickerTitle: "Damlalık (I)",
    toolFill: "Doldur", toolFillTitle: "Doldur (B)",
    toolLine: "Çizgi", toolLineTitle: "Çizgi (L)",
    toolRect: "Dikdörtgen", toolRectTitle: "Dikdörtgen (R)",
    toolRectF: "Dikdörtgen+", toolRectFTitle: "Dolu dikdörtgen (Shift+R)",
    toolCirc: "Daire", toolCircTitle: "Elips/Daire (O)",
    toolCircF: "Daire+", toolCircFTitle: "Dolu elips (Shift+O)",
    undo: "Geri al", undoTitle: "Geri al (Ctrl+Z)",
    redo: "Yinele", redoTitle: "Yinele (Ctrl+Y)",
    clear: "Temizle",
    gridSize: "Izgara boyutu",
    zoom: "Yakınlaştırma",
    showGrid: "Izgarayı göster",
    genPlaceholder: "örn.: retro 8-bit uzay gemisi sağa bakıyor, şeffaf arka plan",
    generate: "Üret",
    uploadImage: "Resim yükle",
    hideGrid: "Izgarayı gizle",
    customCursors: "Özel imleçler",
    imageNotFound: "Resim bulunamadı.",
    imageSaved: "Galeriye eklendi!",
    saveFailed: "Resim kaydedilemedi.",
    storageFull: "Tarayıcı depolama alanı dolu. Galeriden bazı öğeleri kaldırıp tekrar deneyin.",
    copied: "Panoya kopyalandı!",
    cleared: "Tuval temizlendi.",
    nothingSelected: "Hiçbir şey seçilmedi."
  },
  it: {
    galleryPageTitle: "La mia Galleria – Wplace Color Converter",
    pageTitle: "Wplace Convertitore di Colori",
    home: "Home",
    gallery: "Galleria",
    galleryTitle: "La tua Galleria di immagini",
    deleteAll: "Elimina tutto",
    exportGallery: "Esporta galleria",
    importGallery: "Importa galleria",
    exportSelected: "Esporta selezionate",
    deleteSelected: "Elimina selezionate",
    searchPlaceholder: "Cerca…",
    tagFilter: "Filtro tag",
    sortNewest: "Più recenti",
    sortOldest: "Più vecchie",
    sortNameAsc: "Nome A→Z",
    sortSizeDesc: "Più grandi",
    emptyGallery: "Ancora nessuna immagine",
    goConvert: "Vai a convertire",
    personalGallery: "La tua galleria personale",
    clearAllPrompt: "Eliminare davvero tutte le immagini?",
    yes: "Sì",
    cancel: "Annulla",
    save: "Salva",
    download: "Scarica",
    delete: "Elimina",
    selected: "selezionate",
    allCollections: "Tutte le collezioni",
    deleteOnePrompt: "Eliminare questa immagine?",
    deleteSelectedPrompt: "Eliminare le immagini selezionate?",
    noImagesExport: "Nessuna immagine da esportare.",
    exportedAll: "Galleria esportata",
    noSelected: "Nessuna immagine selezionata.",
    exportedSelected: "Selezionate esportate",
    imported: "Immagini importate",
    saved: "Salvato",
    deleted: "Eliminato",
    deleteFailed: "Eliminazione non riuscita",
    selectionCount: "0 selezionate",
    collectionFilter: "Filtro collezioni",
    sort: "Ordina",
    viewerNamePlaceholder: "Nome…",
    viewerTagsPlaceholder: "Tag…",
    viewerCollectionPlaceholder: "Collezione",
    studioPageTitle: "Studio – Wplace Convertitore di Colori",
    studioTitle: "Studio",
    genNotice: "Usa l'endpoint pubblico di immagini Pollinations. I prompt possono essere registrati pubblicamente da quel servizio. Non è richiesto alcun account.",
    paletteFree: "Colori gratuiti",
    palettePaid: "Colori a pagamento",
    tools: "Strumenti",
    toolPencil: "Matita", toolPencilTitle: "Matita (P)",
    toolBrush: "Pennello", toolBrushTitle: "Pennello (H)",
    toolEraser: "Gomma", toolEraserTitle: "Gomma (E)",
    toolPicker: "Contagocce", toolPickerTitle: "Contagocce (I)",
    toolFill: "Riempi", toolFillTitle: "Riempi (B)",
    toolLine: "Linea", toolLineTitle: "Linea (L)",
    toolRect: "Rettangolo", toolRectTitle: "Rettangolo (R)",
    toolRectF: "Rettangolo+", toolRectFTitle: "Rettangolo pieno (Shift+R)",
    toolCirc: "Cerchio", toolCircTitle: "Ellisse/Cerchio (O)",
    toolCircF: "Cerchio+", toolCircFTitle: "Ellisse piena (Shift+O)",
    undo: "Annulla", undoTitle: "Annulla (Ctrl+Z)",
    redo: "Ripeti", redoTitle: "Ripeti (Ctrl+Y)",
    clear: "Pulisci",
    gridSize: "Dimensione griglia",
    zoom: "Zoom",
    showGrid: "Mostra griglia",
    genPlaceholder: "es.: astronave retrò 8-bit rivolta a destra, sfondo trasparente",
    generate: "Genera",
    uploadImage: "Carica immagine",
    hideGrid: "Nascondi griglia",
    customCursors: "Cursori personalizzati",
    imageNotFound: "Immagine non trovata.",
    imageSaved: "Aggiunta alla galleria!",
    saveFailed: "Impossibile salvare l'immagine.",
    storageFull: "La memoria del browser è piena. Rimuovi alcuni elementi dalla galleria e riprova.",
    copied: "Copiato negli appunti!",
    cleared: "Canvas pulito.",
    nothingSelected: "Niente selezionato."
  },
  "zh-CN": {
    galleryPageTitle: "我的图库 – Wplace 颜色转换器",
    pageTitle: "Wplace 颜色转换器",
    home: "首页",
    gallery: "图库",
    galleryTitle: "你的图片图库",
    deleteAll: "全部删除",
    exportGallery: "导出图库",
    importGallery: "导入图库",
    exportSelected: "导出已选",
    deleteSelected: "删除已选",
    searchPlaceholder: "搜索…",
    tagFilter: "标签筛选",
    sortNewest: "最新优先",
    sortOldest: "最旧优先",
    sortNameAsc: "名称 A→Z",
    sortSizeDesc: "最大",
    emptyGallery: "尚无图片",
    goConvert: "去转换",
    personalGallery: "你的个人图库",
    clearAllPrompt: "确定要删除所有图片吗？",
    yes: "是",
    cancel: "取消",
    save: "保存",
    download: "下载",
    delete: "删除",
    selected: "已选",
    allCollections: "全部合集",
    deleteOnePrompt: "删除此图片？",
    deleteSelectedPrompt: "删除所选图片？",
    noImagesExport: "没有可导出的图片。",
    exportedAll: "已导出图库",
    noSelected: "未选择图片。",
    exportedSelected: "已导出所选",
    imported: "已导入图片",
    saved: "已保存",
    deleted: "已删除",
    deleteFailed: "删除失败",
    selectionCount: "已选 0",
    collectionFilter: "合集筛选",
    sort: "排序",
    viewerNamePlaceholder: "名称…",
    viewerTagsPlaceholder: "标签…",
    viewerCollectionPlaceholder: "合集",
    studioPageTitle: "工作室 – Wplace 颜色转换器",
    studioTitle: "工作室",
    genNotice: "使用 Pollinations 公共图片服务。该服务可能会公开记录你的提示词。无需账户。",
    paletteFree: "免费颜色",
    palettePaid: "付费颜色",
    tools: "工具",
    toolPencil: "铅笔", toolPencilTitle: "铅笔 (P)",
    toolBrush: "画笔", toolBrushTitle: "画笔 (H)",
    toolEraser: "橡皮", toolEraserTitle: "橡皮 (E)",
    toolPicker: "吸管", toolPickerTitle: "吸管 (I)",
    toolFill: "填充", toolFillTitle: "填充 (B)",
    toolLine: "直线", toolLineTitle: "直线 (L)",
    toolRect: "矩形", toolRectTitle: "矩形 (R)",
    toolRectF: "矩形+", toolRectFTitle: "填充矩形 (Shift+R)",
    toolCirc: "圆形", toolCircTitle: "椭圆/圆 (O)",
    toolCircF: "圆形+", toolCircFTitle: "填充椭圆 (Shift+O)",
    undo: "撤销", undoTitle: "撤销 (Ctrl+Z)",
    redo: "重做", redoTitle: "重做 (Ctrl+Y)",
    clear: "清空",
    gridSize: "网格大小",
    zoom: "缩放",
    showGrid: "显示网格",
    genPlaceholder: "例如：复古 8 位右朝向的飞船，透明背景",
    generate: "生成",
    uploadImage: "上传图片",
    hideGrid: "隐藏网格",
    customCursors: "自定义光标",
    imageNotFound: "未找到图像。",
    imageSaved: "已添加到图库！",
    saveFailed: "保存图像失败。",
    storageFull: "浏览器存储已满。请从图库中删除一些项目后重试。",
    copied: "已复制到剪贴板！",
    cleared: "画布已清空。",
    nothingSelected: "未选择任何内容。"
  },
  };
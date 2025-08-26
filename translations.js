// ---- Language runtime (with path + URL propagation) ----
(function () {
  const LS_KEY = "lang";
  const KNOWN = ["en","pt","de","es","fr","uk","vi","pl","ja","de-CH","nl","ru","tr"];
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
  return /^(index|gallery)\.html$/i.test(p || "") ? p : "index.html";
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

  if (pg.toLowerCase() === "gallery.html") {
    return use === "en" ? `${base}/gallery.html` : `${base}/gallery.html?lang=${use}`;
  }
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
  // current language
  const lang = (typeof getCurrentLang === "function" && getCurrentLang()) || "en";

  // known languages (normalized)
  const KNOWN = new Set(["en","pt","de","de-ch","es","fr","uk","vi","pl","ja","nl","ru","tr"]);

  // detect optional repo base (e.g., /myrepo/...)
  const parts = location.pathname.replace(/^\/+/, "").split("/");
  let repoBase = "";
  if (parts.length && !KNOWN.has(parts[0].toLowerCase()) && !/\.(html?)$/i.test(parts[0])) {
    repoBase = `/${parts[0]}`;
  }

root.querySelectorAll('a[data-keep-lang]').forEach(a => {
  const raw = a.getAttribute("href");
  if (!raw) return;

  let url;
  try { 
    // build relative to the site root, never to the current page
    url = new URL(raw, location.origin);
  } catch { 
    return; 
  }

  const KNOWN = new Set(["en","pt","de","de-ch","es","fr","uk","vi","pl","ja","nl","ru","tr"]);
  const segs = url.pathname.replace(/^\/+/, "").split("/");
  if (segs.length && KNOWN.has(segs[0].toLowerCase())) segs.shift();

  const parts = location.pathname.replace(/^\/+/, "").split("/");
  let repoBase = "";
  if (parts.length && !KNOWN.has((parts[0]||"").toLowerCase()) && !/\.(html?)$/i.test(parts[0])) {
    repoBase = `/${parts[0]}`;
  }

  const lang = (typeof getCurrentLang === "function" && getCurrentLang()) || "en";
  const filename = segs[segs.length - 1] || "";

  if (/^gallery\.html$/i.test(filename)) {
    url.pathname = `${repoBase}/gallery.html`;
    url.search = lang.toLowerCase()==="en" ? "" : `?lang=${lang}`;
  } else if (!filename || /^index\.html$/i.test(filename)) {
    url.pathname = lang.toLowerCase()==="en"
      ? `${repoBase}/index.html`
      : `${repoBase}/${lang}/index.html`;
    url.search = "";
  } else {
    url.pathname = `${repoBase}/${segs.join("/")}`;
    url.search = lang.toLowerCase()==="en" ? "" : `?lang=${lang}`;
  }

  // safety: no ".html/" endings
  url.pathname = url.pathname.replace(/\.html\/+$/i, ".html");

  // write an ABSOLUTE url (keeps origin so new-tab works)
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
    const isKnown = file === "" || file === "index.html" || file === "gallery.html";
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
  }
};

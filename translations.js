// ---- Language runtime (with path + URL propagation) ----
(function () {
  const LS_KEY = "wplace.lang";
  const KNOWN = ["en","pt","de","es","fr","uk","vi","pl","ja","de-CH","nl","ru","tr"];

  const norm = s => (s || "").toLowerCase().replace(/_/g, "-");
  const matchLang = s => KNOWN.find(k => norm(k) === norm(s)) || null;

  function getUrlLang() {
    const v = new URLSearchParams(location.search).get("lang");
    return matchLang(v);
  }
  function getPathLang() {
    const first = location.pathname.replace(/^\/+/, "").split("/")[0];
    return matchLang(first);
  }

  function getCurrentLang() {
    const sel = document.getElementById("lang-select");
    return (sel && sel.value)
        || localStorage.getItem(LS_KEY)
        || (document.documentElement.getAttribute("lang") || "en");
  }

function setCurrentLang(lang) {
  const use = matchLang(lang) || "en";
  localStorage.setItem(LS_KEY, use);
  document.documentElement.setAttribute("lang", use);

  const sel = document.getElementById("lang-select");
  if (sel) sel.value = use;
  const sel2 = document.getElementById("lang-select-menu");
  if (sel2) sel2.value = use;

  // Update the current page URL with ?lang=...
  const url = new URL(window.location.href);
  url.searchParams.set("lang", use);
  history.replaceState(null, "", url);

  decorateLinks(); // keep all <a data-keep-lang> links in sync
}

// Compute "repo" (if any) and the current page (index.html / gallery.html)
function computeRepoAndPage() {
  const raw = location.pathname.replace(/^\/+/, "").split("/");
  let repo = "";
  let i = 0;

  // repo if first segment is neither a lang nor an html file
  const isHtml = s => /\.html?$/i.test(s || "");
  const isLang = s => !!(window.matchLang && window.matchLang(s));

  if (raw[i] && !isLang(raw[i]) && !isHtml(raw[i])) {
    repo = raw[i++];
  }
  if (raw[i] && isLang(raw[i])) i++;

  let page = raw.slice(i).join("/") || "index.html";
  if (!isHtml(page)) page = (page.replace(/\/+$/, "") || "index") + ".html";

  return { repo, page };
}

// Build the target URL for a given language while keeping the same page
function targetForLang(lang) {
  const use = (window.matchLang && window.matchLang(lang)) || "en";
  const { repo, page } = computeRepoAndPage();
  const base = repo ? `/${repo}` : "";
  const n = (s => (s || "").toLowerCase().replace(/_/g, "-"))(use);
  return n === "en" ? `${base}/${page}` : `${base}/${use}/${page}`;
}

// Redirect to the correct folder page and persist language
function navigateToLang(lang) {
  const use = (window.matchLang && window.matchLang(lang)) || "en";
  localStorage.setItem("wplace.lang", use);
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
    try { url = new URL(raw, location.origin + location.pathname); }
    catch { return; }

    // Remove any leading locale folder in the path
    const segs = url.pathname.replace(/^\/+/, "").split("/");
    if (segs.length && KNOWN.has(segs[0].toLowerCase())) segs.shift();

    const filename = segs[segs.length - 1] || "";

    // Special rules:
    //  - gallery is global: always at /<repo>/gallery.html with ?lang=xx
    //  - home is localized: /<repo>/<lang>/index.html (or /<repo>/index.html for en)
    if (/^gallery\.html$/i.test(filename)) {
      url.pathname = `${repoBase}/gallery.html`;
      url.searchParams.set("lang", lang);
    } else if (!filename || /^index\.html$/i.test(filename)) {
      // home
      url.pathname = (lang.toLowerCase() === "en")
        ? `${repoBase}/index.html`
        : `${repoBase}/${lang}/index.html`;
      // (no query on home)
      url.search = "";
    } else {
      // any other internal page: strip locale and just keep it under repo
      url.pathname = `${repoBase}/${segs.join("/")}`;
      url.searchParams.set("lang", lang);
    }

    a.setAttribute("href", url.pathname + url.search + url.hash);
  });
}


function initLang() {
  // Priority: ?lang → folder (/pt/) → saved → <html lang> → 'en'
  const desired =
    getUrlLang() ||
    getPathLang() ||
    localStorage.getItem(LS_KEY) ||
    document.documentElement.getAttribute("lang") ||
    "en";

  setCurrentLang(desired);
  applyTranslations(document);

  // helper: compute correct target URL for a given lang
  function targetForLang(lang) {
    const use = matchLang(lang) || "en";
    const parts = window.location.pathname.replace(/^\/+/, "").split("/");
    let repo = "";
    let page = "index.html";

    // detect repo name
    if (parts.length && !matchLang(parts[0]) && !/\.html?$/i.test(parts[0])) {
      repo = parts.shift();
    }
    // remove current lang segment
    if (parts.length && matchLang(parts[0])) {
      parts.shift();
    }
    // remaining path or default
    page = parts.join("/") || "index.html";
    if (!/\.html?$/i.test(page)) {
      page = (page.replace(/\/+$/, "") || "index") + ".html";
    }

    const base = repo ? `/${repo}` : "";
    return use === "en"
      ? `${base}/${page}`
      : `${base}/${use}/${page}`;
  }

  // wire selectors
  const hook = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = desired;
    el.addEventListener("change", () => {
      const chosen = el.value;
      localStorage.setItem(LS_KEY, chosen);
      // redirect to corresponding locale page
      window.location.href = targetForLang(chosen);
    });
  };
  hook("lang-select");
  hook("lang-select-menu");

  // If gallery page exposes these, keep dynamic text consistent
  window.renderGallery?.();
  window.refreshSelectionBar?.();
}


  // expose
  window.getCurrentLang = getCurrentLang;
  window.setCurrentLang = setCurrentLang;
  window.applyTranslations = applyTranslations;
  window.initLang = initLang;
  window.decorateLinks = decorateLinks;

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
  },
  "zh-CN": {
    title: "Wplace 色彩转换器",
    freeColors: "免费颜色:",
    paidColors: "付费颜色 (每种2000💧):",
    download: "下载图片",
    clipboard: "复制到剪贴板",
    goto: "前往Wplace",
    pixelsAmount: "像素总数量:",
    width: "宽度:",
    height: "高度:",
    area: "总面积:",
    imageCopied: "图片复制到剪贴板了！",
    copyFailed: "图片复制失败",
    imageNotFound: "没有找到图片",
    allButtonfreeSelect: "选择所有免费颜色",
    allButtonfreeUnselect: "取消选择所有免费颜色",
    allButtonpaidSelect: "选择所有💧付费颜色",
    allButtonpaidUnselect: "取消选择所有 💧付费颜色",
    zoom: "缩放",
    scale: "比例",
    transparentButton: "隐藏半透明的像素",
    transparentButtonTitle: "当激活时，半透明像素将会完全透明，否则将会完全不透明",
    zoomHint: "Ctrl + 鼠标滚轮调整缩放",
    ditherButton: "抖动处理（推荐）",
    uploadStrong: "上传图片",
    uploadSpan: "点击，粘贴或拖放",
    hideEyeControls: "显示颜色隐藏控件（眼睛）",
    advancedOptions: "高级选项",
    sort: "排序方式",
    sortOriginal: "按原始排序",
    sortCount: "按数量排序",
  }
};

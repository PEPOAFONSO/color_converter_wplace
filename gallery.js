/* =========================================================
   Wplace Color Converter — Gallery
   ========================================================= */

(() => {
  const DB_NAME = "wplaceGallery";
  const STORE_NAME = "images";

  let currentViewerId = null;
  const selectedIds = new Set();

  let allImagesCache = [];
  let filteredImagesCache = [];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function showToast(message, type = "info") {
    const t = document.getElementById("globalToast");
    if (t) {
      t.textContent = message;
      t.dataset.type = type;
      t.classList.add("show");
      setTimeout(() => t.classList.remove("show"), 1800);
    } else {
      console.log(`[toast:${type}]`, message);
    }
  }

  function t(key, fallback) {
    try {
      const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
      const dict = (window.translations && window.translations[lang]) || {};
      return dict[key] || fallback || key;
    } catch {
      return fallback || key;
    }
  }

  function showConfirmModal(i18nKeyOrText) {
    const modal = $("#confirmModal");
    if (!modal) {
      return Promise.resolve(
        confirm(typeof i18nKeyOrText === "string" ? i18nKeyOrText : "Are you sure?")
      );
    }
    const p = modal.querySelector("p[data-i18n]") || modal.querySelector("p");
    if (p && typeof i18nKeyOrText === "string") p.textContent = i18nKeyOrText;

    modal.hidden = false;

    return new Promise((resolve) => {
      const yes = $("#confirmYes");
      const no = $("#confirmNo");
      const cleanup = () => {
        modal.hidden = true;
        yes?.removeEventListener("click", onYes);
        no?.removeEventListener("click", onNo);
      };
      const onYes = () => { cleanup(); resolve(true); };
      const onNo = () => { cleanup(); resolve(false); };

      yes?.addEventListener("click", onYes);
      no?.addEventListener("click", onNo);
    });
  }

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true
          });
          store.createIndex("created", "created", { unique: false });
          store.createIndex("name", "name", { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function getAllImages() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function addImageRecord(rec) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(rec);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function updateImageRecord(id, patch) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const rec = getReq.result;
        if (!rec) { resolve(false); return; }
        Object.assign(rec, patch);
        const putReq = store.put(rec);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async function deleteImage(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function clearAllImages() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  function isSelected(id) { return selectedIds.has(id); }
  function setSelected(id, on) {
    if (on) selectedIds.add(id); else selectedIds.delete(id);
    refreshSelectionBar();
  }

  function refreshSelectionBar() {
    const n = selectedIds.size;

    // bar element(s)
    const bar = $("#selectionBar");
    if (bar) {
      bar.hidden = n === 0;
      bar.style.display = n === 0 ? "none" : ""; // force visibility
    }

    // counters that might exist in different layouts
    const countEl = $("#selectionCount");
    if (countEl) countEl.textContent = `${n} ${t("selected","selected")}`;

    const bulkCount = $("#bulkCount");
    if (bulkCount) bulkCount.textContent = `${n} ${t("selected","selected")}`;

    $$.call(null, "[data-selected-count]").forEach(el => {
      el.textContent = String(n);
    });

    // also add/remove a body flag if you want styling hooks
    document.body.classList.toggle("has-selection", n > 0);
  }

  async function updateStorageMeter() {
    const bar = $("#storageBar");
    const text = $("#storageText");
    if (!bar || !text) return;
    const imgs = await getAllImages();
    let total = 0;
    for (const it of imgs) total += it.blob?.size || 0;
    const cap = 2048 * 1024 * 1024;
    const pct = Math.min(100, (total / cap) * 100);
    bar.style.width = `${pct.toFixed(1)}%`;
    const mb = (total / (1024 * 1024)).toFixed(1);
    text.textContent = `${pct.toFixed(0)}% (${mb} MB / 2048.0 MB)`;
  }

  function getFilterValues() {
    return {
      q: ($("#searchBox")?.value || "").trim().toLowerCase(),
      tag: ($("#tagFilter")?.value || "").trim().toLowerCase(),
      coll: $("#collectionFilter")?.value || "",
      sort: $("#sortSelect")?.value || "newest"
    };
  }

  function filterAndSort(list) {
    const { q, tag, coll, sort } = getFilterValues();
    let out = list.slice();

    if (q) {
      out = out.filter(r =>
        (r.name || "").toLowerCase().includes(q) ||
        (r.collection || "").toLowerCase().includes(q) ||
        (Array.isArray(r.tags) ? r.tags.join(",") : "").toLowerCase().includes(q)
      );
    }

    if (tag) {
      out = out.filter(r =>
        Array.isArray(r.tags) ? r.tags.some(tg => (tg || "").toLowerCase().includes(tag)) : false
      );
    }

    if (coll && coll !== "__all__") {
      out = out.filter(r => (r.collection || "") === coll);
    }

    switch (sort) {
      case "oldest": out.sort((a, b) => (a.created || 0) - (b.created || 0)); break;
      case "nameAsc": out.sort((a, b) => (a.name || "").localeCompare(b.name || "")); break;
      case "sizeDesc": out.sort((a, b) => (b.blob?.size || 0) - (a.blob?.size || 0)); break;
      default: out.sort((a, b) => (b.created || 0) - (a.created || 0));
    }
    return out;
  }

  function populateCollectionFilter(list) {
    const sel = $("#collectionFilter");
    if (!sel) return;
    const set = new Set(list.map(r => r.collection).filter(Boolean));
    const current = sel.value || "__all__";
    sel.innerHTML =
      `<option value="__all__" data-i18n="allCollections">${t("allCollections", "All collections")}</option>` +
      Array.from(set)
        .sort()
        .map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
        .join("");
    sel.value = current;
  }

  function escapeHtml(s = "") {
    return s.replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  async function renderGallery() {
    const grid = $("#gallery");
    const empty = $("#emptyState");
    if (!grid) return;

    if (!allImagesCache.length) allImagesCache = await getAllImages();

    filteredImagesCache = filterAndSort(allImagesCache);

    grid.innerHTML = "";
    if (!filteredImagesCache.length) {
      empty?.classList.remove("hidden");
      refreshSelectionBar();
      updateStorageMeter();
      return;
    }
    empty?.classList.add("hidden");
    populateCollectionFilter(allImagesCache);

    for (const item of filteredImagesCache) {
      const card = document.createElement("div");
      card.className = "gallery-item";
      card.dataset.id = item.id;

      if (isSelected(item.id)) card.classList.add("is-selected");

      const url = URL.createObjectURL(item.blob);
      card.innerHTML = `
        <div class="select-check">
          <input type="checkbox" aria-label="Select">
        </div>
        <img src="${url}" alt="${escapeHtml(item.name || "Saved Image")}">
        <div class="gallery-actions">
          <a href="${url}" download="image_${item.id}.png" title="${t("download","Download")}" aria-label="${t("download","Download")}">
            <img src="https://www.svgrepo.com/show/520695/download.svg" alt="">
          </a>
          <button class="delete-btn" title="${t("delete","Delete")}" aria-label="${t("delete","Delete")}">
            <img src="https://www.svgrepo.com/show/521000/trash-2.svg" alt="">
          </button>
        </div>
      `;

      card.addEventListener("click", (e) => {
        if (e.target.closest(".select-check")) return;
        openViewerById(item.id);
      });

      const chk = card.querySelector(".select-check input");
      if (chk) {
        chk.checked = isSelected(item.id);
        chk.addEventListener("click", (e) => {
          e.stopPropagation();
          const now = !isSelected(item.id);
          setSelected(item.id, now);
          card.classList.toggle("is-selected", now);
          chk.checked = now;
        });
      }

      const del = card.querySelector(".delete-btn");
      if (del) {
        del.addEventListener("click", async (e) => {
          e.stopPropagation();
          const ok = await showConfirmModal(t("deleteOnePrompt", "Delete this image?"));
          if (!ok) return;
          try {
            await deleteImage(item.id);
            selectedIds.delete(item.id);
            allImagesCache = allImagesCache.filter(r => r.id !== item.id);
            filteredImagesCache = filteredImagesCache.filter(r => r.id !== item.id);
            card.remove();
            refreshSelectionBar();           // << ensure UI resets
            updateStorageMeter();
            showToast(t("deleted", "Deleted"), "success");
            if (!grid.children.length) $("#emptyState")?.classList.remove("hidden");
          } catch (err) {
            console.error(err);
            showToast(t("deleteFailed", "Failed to delete"), "error");
          }
        });
      }

      grid.appendChild(card);
    }

    refreshSelectionBar(); // << reflect current selection count
    updateStorageMeter();
  }

  async function exportGallery() {
    const images = await getAllImages();
    if (!images.length) {
      showToast(t("noImagesExport", "No images to export."), "error");
      return;
    }
    const zip = new JSZip();
    images.forEach((item) => zip.file(`image_${item.id}.png`, item.blob));
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wplace_gallery.zip";
    a.click();
    URL.revokeObjectURL(url);
    showToast(t("exportedAll", "Exported gallery"), "success");
  }

  async function exportSelectedImages() {
    if (!selectedIds.size) {
      showToast(t("noSelected", "No images selected."), "error");
      return;
    }
    const list = await getAllImages();
    const map = new Map(list.map(r => [r.id, r]));
    const zip = new JSZip();
    let added = 0;
    for (const id of selectedIds) {
      const it = map.get(id);
      if (it) { zip.file(`image_${id}.png`, it.blob); added++; }
    }
    if (!added) {
      showToast(t("noSelected", "No images selected."), "error");
      return;
    }
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wplace_selected.zip";
    a.click();
    URL.revokeObjectURL(url);
    showToast(t("exportedSelected", "Exported selected images"), "success");
  }

  async function importGallery(files) {
    if (!files.length) return;
    const newRecords = [];

    for (const file of files) {
      if (file.name.toLowerCase().endsWith(".zip")) {
        const zip = await JSZip.loadAsync(file);
        for (const name of Object.keys(zip.files)) {
          const entry = zip.files[name];
          if (entry.dir) continue;
          if (!/\.(png|jpe?g|gif|webp)$/i.test(name)) continue;
          const blob = await entry.async("blob");
          newRecords.push({ blob, created: Date.now() });
        }
      } else if (file.type.startsWith("image/")) {
        newRecords.push({ blob: file, created: Date.now() });
      }
    }

    for (const rec of newRecords) {
      await addImageRecord(rec);
    }

    allImagesCache = await getAllImages();
    await renderGallery();
    refreshSelectionBar();                  // << keep bar right
    showToast(t("imported", "Imported images"), "success");
  }

  async function confirmDeleteSelected() {
    if (!selectedIds.size) {
      showToast(t("noSelected", "No images selected."), "error");
      return;
    }
    const ok = await showConfirmModal(t("deleteSelectedPrompt", "Delete selected images?"));
    if (!ok) return;

    for (const id of Array.from(selectedIds)) {
      try { await deleteImage(id); } catch {}
    }
    selectedIds.clear();
    allImagesCache = await getAllImages();
    await renderGallery();
    refreshSelectionBar();                  // << force hide & reset counter
    showToast(t("deleted", "Deleted"), "success");
  }

  async function clearAllHandler() {
    const ok = await showConfirmModal(t("clearAllPrompt", "Are you sure you want to delete all images?"));
    if (!ok) return;
    await clearAllImages();
    selectedIds.clear();
    allImagesCache = [];
    await renderGallery();
    refreshSelectionBar();                  // << ensure bar hidden
    showToast(t("deleted", "Deleted"), "success");
  }

  // --- filename helpers (prevent double extensions) ---
  function mimeToExt(type = "") {
    const t = type.toLowerCase();
    if (t.includes("png")) return "png";
    if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
    if (t.includes("webp")) return "webp";
    if (t.includes("gif")) return "gif";
    if (t.includes("bmp")) return "bmp";
    if (t.includes("tif")) return "tif";
    return "";
  }

  function stripImageExt(name = "") {
    return name.replace(/\.(png|jpe?g|gif|webp|bmp|tiff?)$/i, "");
  }

  function buildDownloadName(item, fallbackBase) {
    const base = stripImageExt((item && item.name) ? String(item.name) : String(fallbackBase || "image"));
    const ext = mimeToExt(item?.blob?.type || "") || "png";
    return `${base}.${ext}`;
  }


  function openViewerById(id) {
    const viewer = $("#viewer");
    const imgEl = $("#viewerImg");
    const nameEl = $("#viewerName");
    const tagsEl = $("#viewerTags");
    const collEl = $("#viewerCollection");
    const dl = $("#viewerDownload");
    const selBtn = $("#viewerSelect");

    const item = (filteredImagesCache.find(x => x.id === id) ||
                  allImagesCache.find(x => x.id === id));
    if (!item || !viewer || !imgEl) return;

    currentViewerId = id;
    const url = URL.createObjectURL(item.blob);
    imgEl.src = url;
    nameEl && (nameEl.value = item.name || `image_${id}`);
    tagsEl && (tagsEl.value = Array.isArray(item.tags) ? item.tags.join(", ") : "");
    collEl && (collEl.value = item.collection || "");

  if (dl) {
    dl.href = url;
    dl.download = buildDownloadName(item, `image_${id}`);
  }

    if (selBtn) {
      selBtn.setAttribute("aria-pressed", String(isSelected(id)));
    }

    viewer.hidden = false;
  }

  function closeViewer() {
    $("#viewer")?.setAttribute("hidden", "true");
    currentViewerId = null;
  }

  async function saveViewerMeta() {
    if (currentViewerId == null) return;
    const name = $("#viewerName")?.value || `image_${currentViewerId}`;
    const rawTags = $("#viewerTags")?.value || "";
    const tags = rawTags.split(",").map(s => s.trim()).filter(Boolean);
    const coll = $("#viewerCollection")?.value || "";
    await updateImageRecord(currentViewerId, { name, tags, collection: coll });

    const it = allImagesCache.find(x => x.id === currentViewerId);
    if (it) { it.name = name; it.tags = tags; it.collection = coll; }
    const it2 = filteredImagesCache.find(x => x.id === currentViewerId);
    if (it2) { it2.name = name; it2.tags = tags; it2.collection = coll; }
    showToast(t("saved", "Saved"), "success");
    renderGallery();
  }

  async function deleteFromViewer() {
    if (currentViewerId == null) return;
    const ok = await showConfirmModal(t("deleteOnePrompt", "Delete this image?"));
    if (!ok) return;
    await deleteImage(currentViewerId);
    selectedIds.delete(currentViewerId);
    closeViewer();
    allImagesCache = await getAllImages();
    await renderGallery();
    refreshSelectionBar();                  // << update bar
    showToast(t("deleted", "Deleted"), "success");
  }

  function toggleViewerSelect() {
    if (currentViewerId == null) return;
    const now = !isSelected(currentViewerId);
    setSelected(currentViewerId, now);
    const btn = $("#viewerSelect");
    if (btn) btn.setAttribute("aria-pressed", String(now));
    const tile = $(`.gallery-item[data-id="${currentViewerId}"]`);
    const chk = tile?.querySelector(".select-check input");
    if (tile) {
      tile.classList.toggle("is-selected", now);
      if (chk) chk.checked = now;
    }
  }

  function bindUI() {
    $("#searchBox")?.addEventListener("input", () => { renderGallery(); });
    $("#tagFilter")?.addEventListener("input", () => { renderGallery(); });
    $("#collectionFilter")?.addEventListener("change", () => { renderGallery(); });
    $("#sortSelect")?.addEventListener("change", () => { renderGallery(); });

    $("#exportGallery")?.addEventListener("click", exportGallery);
    $("#importGallery")?.addEventListener("change", (e) => {
      importGallery(Array.from(e.target.files || []));
      e.target.value = "";
    });
    $("#clearAllBtn")?.addEventListener("click", clearAllHandler);

    $("#selectionExport")?.addEventListener("click", exportSelectedImages);
    $("#selectionDelete")?.addEventListener("click", confirmDeleteSelected);

    $("#viewerClose")?.addEventListener("click", closeViewer);
    $("#viewerPrev")?.addEventListener("click", () => navViewer(-1));
    $("#viewerNext")?.addEventListener("click", () => navViewer(1));
    $("#viewerSave")?.addEventListener("click", saveViewerMeta);
    $("#viewerDelete")?.addEventListener("click", deleteFromViewer);
    $("#viewerSelect")?.addEventListener("click", toggleViewerSelect);

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("#confirmModal")?.hidden) return;
      if (e.key === "Escape") closeViewer();
    });
  }

  function navViewer(dir) {
    if (currentViewerId == null || !filteredImagesCache.length) return;
    const idx = filteredImagesCache.findIndex(x => x.id === currentViewerId);
    if (idx < 0) return;
    let next = idx + dir;
    if (next < 0) next = filteredImagesCache.length - 1;
    if (next >= filteredImagesCache.length) next = 0;
    openViewerById(filteredImagesCache[next].id);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      if (window.initLang) window.initLang();
      if (window.applyTranslations) window.applyTranslations();

      bindUI();
      await renderGallery();
      await updateStorageMeter();
      refreshSelectionBar(); // << ensure bar is hidden initially
    } catch (e) {
      console.error(e);
    }

    (function setupMobileMenu(){
      const burger   = document.querySelector('.nav-burger');
      const menu     = document.getElementById('mobileMenu');
      const backdrop = document.getElementById('menuBackdrop');
      if (!burger || !menu || !backdrop) return;

      let open = false;
      function setOpen(v){
        open = v;
        burger.setAttribute('aria-expanded', String(v));
        menu.classList.toggle('show', v);
        backdrop.hidden = !v;
      }

      burger.addEventListener('click', () => setOpen(!open));
      backdrop.addEventListener('click', () => setOpen(false));
      window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });
      window.addEventListener('resize', () => { if (window.innerWidth >= 981 && open) setOpen(false); });
    })();
  });

})();

// Language selector change event
document.addEventListener("DOMContentLoaded", () => {
  const parts = window.location.pathname.split("/").filter(Boolean);

  // ---------- helpers ----------
  const normalize = s => (s || "").replace(/_/g, "-").toLowerCase();
  const SUPPORTED = [
    "en","pt","de","de-CH","es","fr","uk","vi","pl","ja","nl","ru","tr"
  ];
  const SUP_NORM = SUPPORTED.map(normalize);

  const isLang = seg => SUP_NORM.includes(normalize(seg));
  const last = arr => arr[arr.length - 1] || "";

  // Detect repoName and current path lang
  let repoName = "";
  let langFromPath = "en";
  let pathAfterLang = ""; // e.g. "gallery.html" or "index.html"

  if (parts.length) {
    if (isLang(parts[0])) {
      // /<lang>/...
      langFromPath = parts[0];
      pathAfterLang = parts.slice(1).join("/") || "index.html";
    } else {
      // maybe /<repo>/... or /<page>
      repoName = parts[0];
      if (parts.length > 1 && isLang(parts[1])) {
        langFromPath = parts[1];
        pathAfterLang = parts.slice(2).join("/") || "index.html";
      } else {
        // no lang in path
        langFromPath = "en";
        pathAfterLang = parts.slice(1).join("/") || (parts.length ? last(parts) : "index.html");
        if (!parts[1]) {
          pathAfterLang = parts[0] || "index.html";
          repoName = "";
        }
      }
    }
  } else {
    langFromPath = "en";
    pathAfterLang = "index.html";
  }

  // Normalize page name
  if (!/\.(html?)$/i.test(pathAfterLang)) {
    pathAfterLang = (pathAfterLang.replace(/\/+$/, "") || "index") + ".html";
  }

  const base = repoName ? `/${repoName}` : "";

  // ---------- load or derive saved lang ----------
  let savedLang = localStorage.getItem("lang");
  if (!savedLang) {
    const nav = (navigator.language || "en").toLowerCase();
    const navBase = nav.split("-")[0];
    savedLang =
      SUP_NORM.includes(normalize(nav)) ? nav :
      SUP_NORM.includes(normalize(navBase)) ? navBase : "en";
    localStorage.setItem("lang", savedLang);
  }

  // ---------- redirect if URL lang ≠ savedLang ----------
  if (normalize(langFromPath) !== normalize(savedLang) && pathAfterLang !== "gallery.html") {
    const use = savedLang;
    const dest =
      normalize(use) === "en"
        ? `${base}/${pathAfterLang}`
        : `${base}/${use}/${pathAfterLang}`;
    window.location.replace(dest);
    return;
  }

  // ---------- hook up selector ----------
  const select = document.getElementById("lang-select");
  if (select) {
    select.value = savedLang;

    select.addEventListener("change", () => {
      const chosen = select.value;
      localStorage.setItem("lang", chosen);

      let target;
      if (pathAfterLang === "gallery.html") {
        // Always keep gallery at root, just add query param
        target = `${base}/gallery.html?lang=${chosen}`;
      } else {
        target =
          normalize(chosen) === "en"
            ? `${base}/${pathAfterLang}`
            : `${base}/${chosen}/${pathAfterLang}`;
      }

      window.location.href = target;
    });
  }
});

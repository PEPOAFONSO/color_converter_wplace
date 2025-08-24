// =======================
//   Wplace Main Script
// =======================

/*
  [0,0,0],[60,60,60],[120,120,120],[170,170,170],[210,210,210],[255,255,255],
  [96,0,24],[165, 14, 30],[237,28,36],[250,128,114],[228,92,26],[255,127,39],[246,170,9],
  [249,221,59],[255,250,188],[156,132,49],[197,173,49],[232,212,95],[74,107,58],[90,148,74],[132,197,115],
  [14,185,104],[19,230,123],[135,255,94],[12,129,110][16,174,166],[19,225,190],[15,121,159],[96,247,242],
  [187,250,242],[40,80,158],[64,147,228],[125,199,255],[77,49,184],[107,80,246],[153,177,251],
  [74,66,132],[122,113,196],[181,174,241],[181, 174, 241],[170,56,185],[224,159,249],
  [203,0,122],[236,31,128],[243,141,169],[155,82,73],[209,128,120],[250,182,164],
  [104,70,52],[149,104,42],[219,164,99],[123,99,82],[156,132,107],[214,181,148],
  [209,128,81],[248,178,119],[255,197,165],[109,100,63],[148,140,107],[205,197,158],
  [51,57,65],[109,117,141],[179,185,209]
*/

// --- Color name mapping ---
const colorNames = {
  "0,0,0": "Black",
  "60,60,60": "Dark Gray",
  "120,120,120": "Gray",
  "210,210,210": "Light Gray",
  "255,255,255": "White",
  "96,0,24": "Deep Red",
  "237,28,36": "Red",
  "255,127,39": "Orange",
  "246,170,9": "Gold",
  "249,221,59": "Yellow",
  "255,250,188": "Light Yellow",
  "14,185,104": "Dark Green",
  "19,230,123": "Green",
  "135,255,94": "Light Green",
  "12,129,110": "Dark Teal",
  "16,174,166": "Teal",
  "19,225,190": "Light Teal",
  "96,247,242": "Cyan",
  "40,80,158": "Dark Blue",
  "64,147,228": "Blue",
  "107,80,246": "Indigo",
  "153,177,251": "Light Indigo",
  "120,12,153": "Dark Purple",
  "170,56,185": "Purple",
  "224,159,249": "Light Purple",
  "203,0,122": "Dark Pink",
  "236,31,128": "Pink",
  "243,141,169": "Light Pink",
  "104,70,52": "Dark Brown",
  "149,104,42": "Brown",
  "248,178,119": "Beige",
  "170,170,170": "Medium Gray",
  "165,14,30": "Dark Red",
  "250,128,114": "Light Red",
  "228,92,26": "Dark Orange",
  "156,132,49": "Dark Goldenrod",
  "197,173,49": "Goldenrod",
  "232,212,95": "Light Goldenrod",
  "74,107,58": "Dark Olive",
  "90,148,74": "Olive",
  "132,197,115": "Light Olive",
  "15,121,159": "Dark Cyan",
  "187,250,242": "Light Cyan",
  "125,199,255": "Light Blue",
  "77,49,184": "Dark Indigo",
  "74,66,132": "Dark Slate Blue",
  "122,113,196": "Slate Blue",
  "181,174,241": "Light Slate Blue",
  "155,82,73": "Dark Peach",
  "209,128,120": "Peach",
  "250,182,164": "Light Peach",
  "219,164,99": "Light Brown",
  "123,99,82": "Dark Tan",
  "156,132,107": "Tan",
  "214,181,148": "Light Tan",
  "209,128,81": "Dark Beige",
  "255,197,165": "Light Beige",
  "109,100,63": "Dark Stone",
  "148,140,107": "Stone",
  "205,197,158": "Light Stone",
  "51,57,65": "Dark Slate",
  "109,117,141": "Slate",
  "179,185,209": "Light Slate",
};

// Used for displaying different colors in color list
const paidColors = new Set([
  "170,170,170",    // Medium Gray
  "165,14,30",      // Dark Red
  "250,128,114",    // Light Red
  "228,92,26",      // Dark Orange
  "156,132,49",     // Dark Goldenrod
  "197,173,49",     // Goldenrod
  "232,212,95",     // Light Goldenrod
  "74,107,58",      // Dark Olive
  "90,148,74",      // Olive
  "132,197,115",    // Light Olive
  "15,121,159",     // Dark Cyan
  "187,250,242",    // Light Cyan
  "125,199,255",    // Light Blue
  "77,49,184",      // Dark Indigo
  "74,66,132",      // Dark Slate Blue
  "122,113,196",    // Slate Blue
  "181,174,241",    // Light Slate Blue
  "155,82,73",      // Dark Peach
  "209,128,120",    // Peach
  "250,182,164",    // Light Peach
  "219,164,99",     // Light Brown
  "123,99,82",      // Dark Tan
  "156,132,107",    // Tan
  "214,181,148",    // Light Tan
  "209,128,81",     // Dark Beige
  "255,197,165",    // Light Beige
  "109,100,63",     // Dark Stone
  "148,140,107",    // Stone
  "205,197,158",    // Light Stone
  "51,57,65",       // Dark Slate
  "109,117,141",    // Slate
  "179,185,209",    // Light Slate
]);

// Utility: clamp zoom to a reasonable range
const widthInput  = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');

let padrao = [];

function rgbFromChip(btn) {
  // 1) inline style (stable under Dark Reader)
  let s = btn.style.backgroundColor;       // e.g. "rgb(249, 221, 59)"
  if (s) {
    const m = s.match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (m) return [ +m[1], +m[2], +m[3] ];
  }
  // 2) raw style attribute (extra safety)
  s = btn.getAttribute('style') || '';
  let m = s.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m) return [ +m[1], +m[2], +m[3] ];
  // 3) title attribute fallback: "Name: rgb(r, g, b)"
  s = btn.getAttribute('title') || '';
  m = s.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m) return [ +m[1], +m[2], +m[3] ];
  return null;
}

function updatePadraoFromActiveButtons() {
  padrao = [];
  const activeButtons = document.querySelectorAll(
    '#colors-free .toggle-color.active, #colors-paid .toggle-color.active'
  );

  const idsToSave = [];
  activeButtons.forEach(btn => {
    const rgb = rgbFromChip(btn);          // <<< use this
    if (rgb) padrao.push(rgb);
    idsToSave.push(btn.id);
  });

  localStorage.setItem('activeColors', JSON.stringify(idsToSave));

  if (originalImage) {
    applyScale();
    applyPreview();
  }
}


const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const downloadLink = document.getElementById('download');

// Clipboard
document.getElementById('clipboard').addEventListener('click', async function () {
  // Prefer processedCanvas; fallback to main canvas if needed
  const c = finalizeToPalette();


  const lang = (typeof getCurrentLang === 'function' ? getCurrentLang() : 'en');
  const t = (typeof translations !== 'undefined' && translations[lang]) || {};

  if (!c || !c.width || !c.height) {
    showToast(t.imageNotFound || "No image loaded.", "error");
    return;
  }

  // Don't copy if fully transparent
  const empty = (typeof canvasIsEmpty === 'function')
    ? canvasIsEmpty(c)
    : (() => {
        const ctx = c.getContext('2d');
        const data = ctx.getImageData(0, 0, c.width, c.height).data;
        for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) return false;
        return true;
      })();

  if (empty) {
    showToast(t.imageNotFound || "No image loaded.", "error");
    return;
  }

  const doCopy = (blob) => {
    if (!blob) { showToast(t.copyFailed || "Copy failed.", "error"); return; }
    navigator.clipboard.write([ new ClipboardItem({ 'image/png': blob }) ])
      .then(() => showToast(t.copiedClipboard || "Copied to clipboard!", "success"))
      .catch(() => showToast(t.copyFailed || "Copy failed.", "error"));
  };

  if (c.toBlob) {
    c.toBlob(doCopy, 'image/png');
  } else {
    // Fallback for older browsers
    const dataURL = c.toDataURL('image/png');
    const b64 = dataURL.split(',')[1] || "";
    const bin = atob(b64);
    const u8  = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    doCopy(new Blob([u8], { type: 'image/png' }));
  }
});



// Handle paste events to allow image pasting
document.addEventListener('paste', function (event) {
  if (!event.clipboardData) return;
  const items = event.clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const file = items[i].getAsFile();
      if (file) {
        const reader = new FileReader();
        reader.onload = function (evt) {
          const img = new Image();
          img.onload = function () {
            originalImage = img;
            currentImageWidth = img.width;
            currentImageHeight = img.height;
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            processarImagem();
            showImageInfo(currentImageWidth, currentImageHeight);
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      }
      event.preventDefault();
      break;
    }
  }
});

// Function to find the closest color in the pattern
function corMaisProxima(r, g, b) {
  let menorDist = Infinity;
  let cor = [0, 0, 0];
  for (let i = 0; i < padrao.length; i++) {
    const [pr, pg, pb] = padrao[i];
    //const dist = Math.sqrt((pr - r) ** 2 + (pg - g) ** 2 + (pb - b) ** 2);
    //https://www.compuphase.com/cmetric.htm#:~:text=A%20low%2Dcost%20approximation
    const rmean = (pr + r) / 2;
    const rdiff = pr - r;
    const gdiff = pg - g;
    const bdiff = pb - b;
    const x = (512 + rmean) * rdiff * rdiff >> 8;
    const y = 4 * gdiff * gdiff;
    const z = (767 - rmean) * bdiff * bdiff >> 8;
    const dist = Math.sqrt(x + y + z);
    if (dist < menorDist) {
      menorDist = dist;
      cor = [pr, pg, pb];
    }
  }
  return cor;
}

function hardClampToPalette(c, palette) {
  if (!c) return;
  const ctx = c.getContext('2d');
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i+3] === 0) continue; // skip transparent
    const [nr, ng, nb] = corMaisProxima(d[i], d[i+1], d[i+2]);
    d[i] = nr; d[i+1] = ng; d[i+2] = nb; d[i+3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

function finalizeToPalette() {
  // ensure processedCanvas exists
  if (!processedCanvas) {
    processedCanvas = document.createElement('canvas');
    processedCtx = processedCanvas.getContext('2d', { willReadFrequently: true });
    processedCanvas.width  = canvas.width;
    processedCanvas.height = canvas.height;
    processedCtx.drawImage(canvas, 0, 0);
  }

  // clamp everything to your palette and zero RGB for transparent pixels
  const pctx = processedCanvas.getContext('2d');
  const img  = pctx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
  const d    = img.data;

  for (let i = 0; i < d.length; i += 4) {
    if (d[i+3] === 0) {          // fully transparent -> zero RGB
      d[i] = d[i+1] = d[i+2] = 0;
      continue;
    }
    const [nr, ng, nb] = corMaisProxima(d[i], d[i+1], d[i+2]);
    d[i]   = nr;
    d[i+1] = ng;
    d[i+2] = nb;
    d[i+3] = 255;
  }

  pctx.putImageData(img, 0, 0);
  return processedCanvas;
}

// Global variables for image size
let currentImageWidth = null;
let currentImageHeight = null;
let fileName = "";

// --- Make Home honor ?lang=xx on load and sync UI ---
(function ensureLangFromURL() {
  const q = new URLSearchParams(location.search).get("lang");
  if (q && window.setCurrentLang) {
    // setCurrentLang persists to localStorage, sets <html lang>, and decorates links
    window.setCurrentLang(q);
  } else if (window.initLang) {
    // fall back to your normal init (reads localStorage / <html lang>)
    window.initLang();
  }
  // apply translations right away
  window.applyTranslations?.(document);

  // sync both selectors to the active lang
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  ["lang-select", "lang-select-menu"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = lang;
    el?.addEventListener("change", (e) => {
      window.setCurrentLang(e.target.value);
      window.applyTranslations?.(document);
    });
  });
})();

// Dithering helper function
function clampByte(v){ return v < 0 ? 0 : v > 255 ? 255 : v; }

function processWithFloydSteinberg(ctx, palette, transparentHideActive) {
  const w = canvas.width, h = canvas.height;
  const img = ctx.getImageData(0, 0, w, h);
  const d  = img.data;

  // float buffer to carry diffusion error
  const buf = new Float32Array(d.length);
  for (let i = 0; i < d.length; i++) buf[i] = d[i];

  const colorCounts = {};

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;

      let r = buf[idx], g = buf[idx+1], b = buf[idx+2], a = buf[idx+3];

      // Handle semi‑transparent input pixels
      if (a < 255 && a > 0) {
        if (transparentHideActive) {
          // hide and skip diffusion
          d[idx] = d[idx+1] = d[idx+2] = 0;
          d[idx+3] = 0;
          continue;
        } else {
          a = 255; // treat as opaque for processing
        }
      }

      // Quantize to nearest palette color
      const [nr, ng, nb] = corMaisProxima(r|0, g|0, b|0);
      const key = `${nr},${ng},${nb}`;

      // --- Per‑color hide: make transparent and skip diffusion/count ---
      if (typeof hiddenColors !== 'undefined' && hiddenColors.has(key)) {
        d[idx] = d[idx+1] = d[idx+2] = 0;
        d[idx+3] = 0;
        continue; // do NOT diffuse error from hidden pixels
      }

      // Write quantized color
      d[idx]   = nr;
      d[idx+1] = ng;
      d[idx+2] = nb;
      d[idx+3] = (a === 0) ? 0 : 255;

      // Count only visible pixels
      if (d[idx+3] !== 0) {
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      }

      // Error terms
      const er = r - nr;
      const eg = g - ng;
      const eb = b - nb;

      // Diffuse error to neighbors (Floyd–Steinberg)
      const push = (xx, yy, fr) => {
        if (xx < 0 || xx >= w || yy < 0 || yy >= h) return;
        const j = (yy * w + xx) * 4;
        buf[j  ] = clampByte(buf[j  ] + er * fr);
        buf[j+1] = clampByte(buf[j+1] + eg * fr);
        buf[j+2] = clampByte(buf[j+2] + eb * fr);
      };

      push(x+1, y  , 7/16);
      push(x-1, y+1, 3/16);
      push(x  , y+1, 5/16);
      push(x+1, y+1, 1/16);
    }
  }

  ctx.putImageData(img, 0, 0);
  return colorCounts;
}


//Zoom helper
function fitZoomToViewport() {
  const vp = document.getElementById('canvasViewport');
  if (!processedCanvas || !vp) return 1;
  const w = processedCanvas.width, h = processedCanvas.height;
  const fit = Math.min(vp.clientWidth / w, vp.clientHeight / h, 1);
  return (fit > 0 && isFinite(fit)) ? fit : 1;
}

function getColorsListOrder() {
  const fromInput = document.querySelector('input[name="colors-list-order"]:checked')?.value
  return fromInput || 'original'
}

// Image processing
let _colorCounts

function processarImagem() {
  if (!canvas || !ctx) return;

  const transparentHideActive =
    document.getElementById('transparentButton').classList.contains('active');

  let colorCounts;

  if (isDitheringOn && isDitheringOn()) {
    // ---- DITHERED PATH ----
    colorCounts = processWithFloydSteinberg(ctx, padrao, transparentHideActive);
  } else {
    // ---- NON-DITHERED PATH ----
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    colorCounts = {};

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];

      const [nr, ng, nb] = corMaisProxima(r, g, b);
      const key = `${nr},${ng},${nb}`;

      // Per-color HIDE
      if (hiddenColors.has(key)) {
        data[i] = data[i + 1] = data[i + 2] = 0;
        data[i + 3] = 0;
        continue;
      }

      // Write quantized color
      data[i] = nr; data[i + 1] = ng; data[i + 2] = nb;

      // Alpha handling
      if (a === 0) {
        data[i + 3] = 0;
      } else if (a < 255) {
        data[i + 3] = transparentHideActive ? 0 : 255;
      } else {
        data[i + 3] = 255;
      }

      if (data[i + 3] !== 0) {
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

// --- keep processedCanvas/UI in sync right here ---
processedCanvas = document.createElement('canvas');
processedCtx = processedCanvas.getContext('2d', { willReadFrequently: true });
processedCanvas.width  = canvas.width;
processedCanvas.height = canvas.height;
processedCtx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
processedCtx.drawImage(canvas, 0, 0);

// Final authoritative palette pass + export
const exportCanvas = finalizeToPalette();
downloadLink.href = exportCanvas.toDataURL('image/png');

// Normalize filename to .png (handles svg/jpg/etc.)
const base = (fileName || 'image').replace(/\.[^.]+$/,'').trim() || 'image';
downloadLink.download = `converted_${base}.png`;

showImageInfo(canvas.width, canvas.height);
if (colorCounts) showColorUsage(colorCounts, getColorsListOrder());

_colorCounts = colorCounts;

return colorCounts;
}

// Image info display
function showImageInfo(width, height) {
  if (width == null || height == null) return;

  const wIn = document.getElementById("widthInput");
  const hIn = document.getElementById("heightInput");
  const aBx = document.getElementById("area");

  if (wIn) wIn.value = width;
  if (hIn) hIn.value = height;

  if (aBx) {
    const area = width * height;
    if ("value" in aBx) aBx.value = area;
    else aBx.textContent = String(area);
  }
}


// Color usage display
function showColorUsage(colorCounts = {}, order = 'original') {
  const colorListDiv = document.getElementById('color-list');
  if (!colorListDiv) return;

  // Keep palette order, show if count > 0 or hidden
  const rows = padrao.map(([r, g, b]) => {
    const key    = `${r},${g},${b}`;
    const name   = colorNames[key] || `rgb(${r}, ${g}, ${b})`;
    const count  = colorCounts[key] || 0;
    const hidden = typeof hiddenColors !== 'undefined' && hiddenColors.has(key);
    return { r, g, b, key, name, count, hidden };
  }).filter(item => item.count > 0 || item.hidden);

  colorListDiv.innerHTML = '';

  const rowsSorted = order === "original" ? rows : rows.toSorted((a, b) => b.count - a.count);

  rowsSorted.forEach(({r, g, b, key, name, count, hidden}) => {
    const row = document.createElement('div');
    row.className = 'usage-item' + (hidden ? ' hidden' : '');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '10px';
    row.style.marginBottom = '6px';

    const swatch = document.createElement('span');
    swatch.style.display = 'inline-block';
    swatch.style.width = '20px';
    swatch.style.height = '20px';
    swatch.style.border = '1px solid #ccc';
    swatch.style.background = `rgb(${r},${g},${b})`;

    const label = document.createElement('span');
    if (hidden && count === 0) {
      // Show eye icon instead of 0px
      label.textContent = `${name}: `;
      const eyeIcon = document.createElement('span');
      eyeIcon.className = 'usage-hide-icon';
      label.appendChild(eyeIcon);
    } else {
      label.textContent = hidden
        ? `${name}: ${count} px`
        : `${name}: ${count} px`;
      
      // Differentiate Paid colors
      const isPaid = paidColors.has(key);
      if (isPaid) label.style.color = 'gold';
    }

    row.appendChild(swatch);
    row.appendChild(label);
    colorListDiv.appendChild(row);
  });
}


// --- Script for Select All buttons (translation-free, label via data-attrs) ---

(function selectAllSection({
  masterId,
  scopeSelector,
  dataType,
  storageKey,
  defaultOn = false, // free: true (on first visit), paid: false
  fallbackSelect,
  fallbackUnselect
}) {
  document.addEventListener("DOMContentLoaded", () => {
    const masterBtn   = document.getElementById(masterId);
    const colorBtns   = Array.from(document.querySelectorAll(`${scopeSelector} .toggle-color[data-type="${dataType}"]`));
    if (!masterBtn || !colorBtns.length) return;

    // ---- helpers ----
    function getExportCanvas() {
      return (typeof processedCanvas !== "undefined" && processedCanvas) ? processedCanvas : canvas;
    }

    const getLabels = () => {
      const select   = masterBtn.getAttribute("data-label-select")   || fallbackSelect;
      const unselect = masterBtn.getAttribute("data-label-unselect") || fallbackUnselect;
      return { select, unselect };
    };

    function updateMasterLabel() {
      const { select, unselect } = getLabels();
      const allActive = colorBtns.every(b => b.classList.contains("active"));
      masterBtn.textContent = allActive ? unselect : select;
    }

    function saveState() {
      const activeIds = colorBtns.filter(b => b.classList.contains("active")).map(b => b.id);
      localStorage.setItem(storageKey, JSON.stringify(activeIds));
    }

    // ---- load state ----
    const raw   = localStorage.getItem(storageKey);
    const firstVisit = raw === null;
    let savedIds = [];
    if (!firstVisit) {
      try { savedIds = JSON.parse(raw); } catch { /* ignore parse errors */ }
    }

    // apply state
    colorBtns.forEach(b => {
      const shouldBeActive = firstVisit ? defaultOn : savedIds.includes(b.id);
      b.classList.toggle("active", shouldBeActive);
    });

    // initial render and derived updates
    window.addEventListener("load", updateMasterLabel);
    if (!firstVisit) updatePadraoFromActiveButtons();

    // single-button toggle
    colorBtns.forEach(b => {
      b.addEventListener("click", () => {
        b.classList.toggle("active");
        // microtask to let layout settle before expensive work
        setTimeout(() => {
          updateMasterLabel();
          saveState();
          updatePadraoFromActiveButtons();
          if (window.originalImage) {
            reprocessWithCurrentPalette();
          }
        }, 0);
      });
    });

    // master toggle
    masterBtn.addEventListener("click", () => {
      const allActive = colorBtns.every(b => b.classList.contains("active"));
      colorBtns.forEach(b => b.classList.toggle("active", !allActive));

      updateMasterLabel();
      saveState();
      updatePadraoFromActiveButtons();
      if (window.originalImage) {
        reprocessWithCurrentPalette();
      }
    });
  });
})({
  // Free Colors
  masterId: "unselect-all-free",
  scopeSelector: "#colors-free",
  dataType: "free",
  storageKey: "activeColors",
  defaultOn: true,
  fallbackSelect: "Select All Free Colors",
  fallbackUnselect: "Unselect All Free Colors"
});

(function selectAllSectionPaid() {
  // Paid Colors
  (function selectAllSection(config) {
    document.addEventListener("DOMContentLoaded", () => {
      const masterBtn   = document.getElementById(config.masterId);
      const colorBtns   = Array.from(document.querySelectorAll(`${config.scopeSelector} .toggle-color[data-type="${config.dataType}"]`));
      if (!masterBtn || !colorBtns.length) return;

      const getLabels = () => {
        const select   = masterBtn.getAttribute("data-label-select")   || config.fallbackSelect;
        const unselect = masterBtn.getAttribute("data-label-unselect") || config.fallbackUnselect;
        return { select, unselect };
      };

      function updateMasterLabel() {
        const { select, unselect } = getLabels();
        const allActive = colorBtns.every(b => b.classList.contains("active"));
        masterBtn.textContent = allActive ? unselect : select;
      }

      function saveState() {
        const activeIds = colorBtns.filter(b => b.classList.contains("active")).map(b => b.id);
        localStorage.setItem(config.storageKey, JSON.stringify(activeIds));
      }

      const raw = localStorage.getItem(config.storageKey);
      let savedIds = [];
      if (raw !== null) { try { savedIds = JSON.parse(raw); } catch {} }

      // default OFF for paid if nothing saved
      colorBtns.forEach(b => {
        const shouldBeActive = raw !== null ? savedIds.includes(b.id) : false;
        b.classList.toggle("active", shouldBeActive);
      });

      window.addEventListener("load", updateMasterLabel);
      updatePadraoFromActiveButtons();

      colorBtns.forEach(b => {
        b.addEventListener("click", () => {
          b.classList.toggle("active");
          setTimeout(() => {
            updateMasterLabel();
            saveState();
            updatePadraoFromActiveButtons();
            if (window.originalImage) {
              reprocessWithCurrentPalette();
            }
          }, 0);
        });
      });

      masterBtn.addEventListener("click", () => {
        const allActive = colorBtns.every(b => b.classList.contains("active"));
        colorBtns.forEach(b => b.classList.toggle("active", !allActive));

        updateMasterLabel();
        saveState();
        updatePadraoFromActiveButtons();
        if (window.originalImage) {
          reprocessWithCurrentPalette();
        }
      });
    });
  })({
    masterId: "select-all-paid",
    scopeSelector: "#colors-paid",
    dataType: "paid",
    storageKey: "activeColorsPaid",
    fallbackSelect: "Select All Paid Colors",
    fallbackUnselect: "Unselect All Paid Colors"
  });
})();

// --End of Script for buttons--



// --- Hidden colors (per-chip eye toggle) -------------------------------
const hiddenColors = new Set();

function rgbKeyFromButton(btn) {
  const bg = getComputedStyle(btn).backgroundColor;
  const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? `${+m[1]},${+m[2]},${+m[3]}` : null;
}

function updateEyeForButton(btn) {
  const key = rgbKeyFromButton(btn);
  const eye = btn.querySelector('.hide-eye');
  const hidden = key ? hiddenColors.has(key) : false;
  if (eye) {
    eye.classList.toggle('is-off', hidden);
    eye.title = hidden ? 'Show color' : 'Hide color';
  }
  btn.classList.toggle('color-hidden', hidden);
}

function augmentColorChipsWithEye() {
  const nodeList = document.querySelectorAll('#colors-free .toggle-color, #colors-paid .toggle-color');
  Array.from(nodeList).forEach(btn => {
    if (!btn.querySelector('.hide-eye')) {
      const eye = document.createElement('button');
      eye.type = 'button';
      eye.className = 'hide-eye';
      eye.title = 'Hide color';
      eye.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = rgbKeyFromButton(btn);
        if (!key) return;
        if (hiddenColors.has(key)) hiddenColors.delete(key);
        else hiddenColors.add(key);
        updateEyeForButton(btn);
        refreshMasterEyes();
        if (window.originalImage) { reprocessWithCurrentPalette(); }
      });
      btn.appendChild(eye);
    }
    updateEyeForButton(btn);
  });
}


// Run once and re-run if the lists are rebuilt
document.addEventListener('DOMContentLoaded', augmentColorChipsWithEye);
const rootsToWatch = ['colors-free','colors-paid']
  .map(id => document.getElementById(id))
  .filter(Boolean);
const mo = new MutationObserver(augmentColorChipsWithEye);
rootsToWatch.forEach(root => mo.observe(root, { childList: true, subtree: true }));

// --- Master eye (hide/show all in a section) -----------------------------
function sectionChips(selector) {
  return Array.from(document.querySelectorAll(`${selector} .toggle-color`));
}

function hideShowAllInSection(selector, hide) {
  const chips = sectionChips(selector);
  chips.forEach(btn => {
    const key = rgbKeyFromButton(btn);
    if (!key) return;
    if (hide) hiddenColors.add(key); else hiddenColors.delete(key);
    updateEyeForButton(btn);
  });
  if (originalImage) {
    reprocessWithCurrentPalette();
  }
}

function updateMasterEye(selector, btn) {
  const chips = sectionChips(selector);
  if (!chips.length) { btn.classList.remove('active'); return; }
  const allHidden = chips.every(b => {
    const key = rgbKeyFromButton(b);
    return key && hiddenColors.has(key);
  });
  btn.classList.toggle('active', allHidden);
  btn.title = allHidden ? 'Show all colors' : 'Hide all colors';
}

document.addEventListener('DOMContentLoaded', () => {
  const freeBtn = document.getElementById('hide-toggle-free');
  const paidBtn = document.getElementById('hide-toggle-paid');

  if (freeBtn) {
    updateMasterEye('#colors-free', freeBtn);
    freeBtn.addEventListener('click', () => {
      const makeHide = !freeBtn.classList.contains('active');
      hideShowAllInSection('#colors-free', makeHide);
      updateMasterEye('#colors-free', freeBtn);
    });
  }

  if (paidBtn) {
    updateMasterEye('#colors-paid', paidBtn);
    paidBtn.addEventListener('click', () => {
      const makeHide = !paidBtn.classList.contains('active');
      hideShowAllInSection('#colors-paid', makeHide);
      updateMasterEye('#colors-paid', paidBtn);
    });
  }
});

function refreshMasterEyes() {
  const freeBtn = document.getElementById('hide-toggle-free');
  const paidBtn = document.getElementById('hide-toggle-paid');
  if (freeBtn) updateMasterEye('#colors-free', freeBtn);
  if (paidBtn) updateMasterEye('#colors-paid', paidBtn);
}

// Scale, Zoom, and Dimension functionality
const scaleRange   = document.getElementById('scaleRange');
const scaleValue   = document.getElementById('scaleValue');
const zoomRange    = document.getElementById('zoomRange');
const zoomValue    = document.getElementById('zoomValue');

let originalImage     = null;
let scaledCanvas      = null;
let scaledCtx         = null;
let processedCanvas   = null;
let processedCtx      = null;

// Utility: initialize width/height fields when a new image loads
function initDimensions() {
  if (!originalImage) return;
  widthInput.value  = originalImage.width;
  heightInput.value = originalImage.height;
}

// Update only the display text of scale/zoom sliders
scaleRange.addEventListener('input', () => {
  scaleValue.textContent = parseFloat(scaleRange.value).toFixed(2) + 'x';
});
zoomRange.addEventListener('input', () => {
  // update the label
  zoomValue.textContent = parseFloat(zoomRange.value).toFixed(2) + 'x';
  // and call the preview
  applyPreview();
});


// ---------- Deferred validation for width/height ----------

const TYPE_PAUSE_MS = 500; // commit after short pause
let widthDebounce  = null;
let heightDebounce = null;

// Helpers to safely parse and clamp against max scale
function commitFromWidth() {
  if (!originalImage) return;

  const raw = widthInput.value.trim();
  if (raw === '') return;               // allow empty while typing

  const reqW = parseInt(raw, 10);
  if (!Number.isFinite(reqW)) return;

  const maxScale = parseFloat(scaleRange.max) || 5;
  const maxW = Math.round(originalImage.width * maxScale);
  const newW = Math.min(Math.max(reqW, 1), maxW);

  const scale = newW / originalImage.width;
  const newH  = Math.round(originalImage.height * scale);

  // sync UI once
  widthInput.value        = newW;
  heightInput.value       = newH;
  scaleRange.value        = scale.toFixed(2);
  scaleValue.textContent  = scale.toFixed(2) + 'x';

  applyScale();
  applyPreview();
}

function commitFromHeight() {
  if (!originalImage) return;

  const raw = heightInput.value.trim();
  if (raw === '') return;

  const reqH = parseInt(raw, 10);
  if (!Number.isFinite(reqH)) return;

  const maxScale = parseFloat(scaleRange.max) || 5;
  const maxH = Math.round(originalImage.height * maxScale);
  const newH = Math.min(Math.max(reqH, 1), maxH);

  const scale = newH / originalImage.height;
  const newW  = Math.round(originalImage.width * scale);

  heightInput.value       = newH;
  widthInput.value        = newW;
  scaleRange.value        = scale.toFixed(2);
  scaleValue.textContent  = scale.toFixed(2) + 'x';

  applyScale();
  applyPreview();
}

// Ignore commits mid‑composition (IME)
function cancelWidthDebounce(){ if (widthDebounce)  { clearTimeout(widthDebounce);  widthDebounce  = null; } }
function cancelHeightDebounce(){ if (heightDebounce){ clearTimeout(heightDebounce); heightDebounce = null; } }

widthInput.addEventListener('compositionstart', cancelWidthDebounce);
heightInput.addEventListener('compositionstart', cancelHeightDebounce);
widthInput.addEventListener('compositionend',   () => { commitFromWidth();  });
heightInput.addEventListener('compositionend',  () => { commitFromHeight(); });

// When user types a new width
widthInput.addEventListener('input', () => {
  cancelWidthDebounce();
  widthDebounce = setTimeout(commitFromWidth, TYPE_PAUSE_MS);
});
widthInput.addEventListener('blur', commitFromWidth);
widthInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') commitFromWidth();
});

// When user types a new height
heightInput.addEventListener('input', () => {
  cancelHeightDebounce();
  heightDebounce = setTimeout(commitFromHeight, TYPE_PAUSE_MS);
});
heightInput.addEventListener('blur', commitFromHeight);
heightInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') commitFromHeight();
});


// Core: scale the original image into a temp canvas and draw it
function applyScale() {
  const scale = parseFloat(scaleRange.value);
  if (!originalImage) return;

  const newWidth  = Math.round(originalImage.width * scale);
  const newHeight = Math.round(originalImage.height * scale);

  // update dimension fields
  widthInput.value  = newWidth;
  heightInput.value = newHeight;

  // prepare off-screen canvas
  if (!scaledCanvas) {
    scaledCanvas = document.createElement('canvas');
    scaledCtx    = scaledCanvas.getContext('2d');
  }
  scaledCanvas.width  = newWidth;
  scaledCanvas.height = newHeight;
  scaledCtx.clearRect(0, 0, newWidth, newHeight);
  scaledCtx.drawImage(
    originalImage,
    0, 0,
    originalImage.width,
    originalImage.height,
    0, 0,
    newWidth,
    newHeight
  );

  // draw onto main canvas & process
  canvas.width  = newWidth;
  canvas.height = newHeight;
  ctx.clearRect(0, 0, newWidth, newHeight);
  ctx.drawImage(scaledCanvas, 0, 0);

  processarImagem();
}

// Core: zoom the processed image into the visible canvas
function applyPreview() {
  const src = processedCanvas || canvas;
  if (!src) { 
    console.warn('No source for preview'); 
    return; 
  }

  let zoom = parseFloat(zoomRange?.value);
  if (!Number.isFinite(zoom) || zoom <= 0) zoom = 1;

  // no longer clamp zoom to fit — let user zoom out freely
  const effectiveZoom = zoom;

  const vp = document.getElementById('canvasViewport');
  const baseW = src.width;
  const baseH = src.height;

  // keep viewport center while zooming
  let cx = 0.5, cy = 0.5;
  if (vp && canvas.offsetWidth && canvas.offsetHeight) {
    cx = (vp.scrollLeft + vp.clientWidth  / 2) / Math.max(1, canvas.offsetWidth);
    cy = (vp.scrollTop  + vp.clientHeight / 2) / Math.max(1, canvas.offsetHeight);
  }

  // target draw size
  let pw = Math.max(1, Math.round(baseW * effectiveZoom));
  let ph = Math.max(1, Math.round(baseH * effectiveZoom));

  // draw (crisp pixels)
  canvas.width  = pw;
  canvas.height = ph;
  ctx.clearRect(0, 0, pw, ph);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, baseW, baseH, 0, 0, pw, ph);

  // element size so viewport can scroll/pan
  canvas.style.width  = pw + 'px';
  canvas.style.height = ph + 'px';

  if (vp) {
    const smallerThanViewport = pw <= vp.clientWidth && ph <= vp.clientHeight;

    if (smallerThanViewport) {
      // center image if smaller than viewport
      vp.scrollLeft = 0;
      vp.scrollTop  = 0;
      vp.style.display = 'grid';
      vp.style.placeContent = 'center';
    } else {
      // restore normal layout for panning
      vp.style.display = '';
      vp.style.placeContent = '';
      vp.scrollLeft = Math.max(0, canvas.offsetWidth  * cx - vp.clientWidth  / 2);
      vp.scrollTop  = Math.max(0, canvas.offsetHeight * cy - vp.clientHeight / 2);
    }
  }

  // update label
  zoomValue.textContent = effectiveZoom.toFixed(2) + 'x';
}




// When slider stops (or on change), actually re-scale & re-preview
scaleRange.addEventListener('change', () => {
  applyScale();
  applyPreview();
});

// ---- SINGLE upload handler: fit-to-viewport + center on load ----
upload.addEventListener('change', e => {
  const file = e.target.files?.[0];
  if (!file) return;
  fileName = file.name;

  const img = new Image();
  img.onload = () => {
    originalImage       = img;
    currentImageWidth   = img.width;
    currentImageHeight  = img.height;

    // seed canvas
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // controls + info
    scaleRange.value = 1.0;
    scaleValue.textContent = '1.00x';
    initDimensions?.();
    showImageInfo(currentImageWidth, currentImageHeight);

    // process -> fills processedCanvas
    processarImagem?.();

    // reset viewport scroll
    const vp = document.getElementById('canvasViewport');
    if (vp) { vp.scrollLeft = 0; vp.scrollTop = 0; }

    // fit AFTER layout so vp sizes are correct
    requestAnimationFrame(() => {
      const MIN = 0.05;
      const fit = fitZoomToViewport?.() ?? 1;   // contain
      const z   = Math.max(fit, MIN);

      zoomRange.min = '0.05';
      zoomRange.value = z.toFixed(3);
      zoomValue.textContent = z.toFixed(2) + 'x';

      applyPreview?.(); // this will center if smaller than viewport
    });
  };

  // object URL is simpler/faster than FileReader
  img.src = URL.createObjectURL(file);
});



// --- Drag & Drop Support ---
(function () {
  const dropTarget = document.querySelector('.custom-upload');
  const fileInput = document.getElementById('upload');
  if (!dropTarget || !fileInput) return;

  // Highlight on dragover
  ['dragenter', 'dragover'].forEach(evt => {
    dropTarget.addEventListener(evt, e => {
      e.preventDefault();
      e.stopPropagation();
      dropTarget.classList.add('dragover');
    });
  });

  // Remove highlight on dragleave/drop
  ['dragleave', 'dragend', 'drop'].forEach(evt => {
    dropTarget.addEventListener(evt, e => {
      e.preventDefault();
      e.stopPropagation();
      dropTarget.classList.remove('dragover');
    });
  });

  // Handle file drop
  dropTarget.addEventListener('drop', e => {
    const files = e.dataTransfer?.files;
    if (!files?.length) return;
    fileInput.files = files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  });
})();


// Reset controls on unload (optional)
window.addEventListener('beforeunload', () => {
  scaleRange.value = 1.0;
  scaleValue.textContent = '1.00x';
  zoomRange.value  = 1.0;
  zoomValue.textContent  = '1.00x';
});

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





// Current language getter
function getCurrentLang() {
  return localStorage.getItem("lang") || "en";
}

// Initial refresh
showImageInfo(currentImageWidth, currentImageHeight);

// Transparent button
document.getElementById('transparentButton').addEventListener('click', function () {
  this.classList.toggle('active');
  localStorage.setItem('transparentHide', this.classList.contains('active'));
  updatePadraoFromActiveButtons();

if (originalImage) {
  reprocessWithCurrentPalette();
}

});

// Only keep for dynamic info (no static translations here)
function applyTranslations(lang) {
  if (currentImageWidth && currentImageHeight) {
    showImageInfo(currentImageWidth, currentImageHeight);
  }
}


// --- Extra viewport interactions: drag-to-pan + Ctrl/Meta + wheel zoom ---
(function enhanceViewport() {
  const vp = document.getElementById('canvasViewport');
  const cv = document.getElementById('canvas');
  if (!vp || !cv) return;

  // ---- Drag-to-pan ----
  let down = false, sx = 0, sy = 0, sl = 0, st = 0;
  vp.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    down = true;
    sx = e.clientX; sy = e.clientY;
    sl = vp.scrollLeft; st = vp.scrollTop;
    e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if (!down) return;
    vp.scrollLeft = sl - (e.clientX - sx);
    vp.scrollTop  = st - (e.clientY - sy);
  });
  window.addEventListener('mouseup', () => { down = false; });

  // ---- Robust Ctrl/Meta + wheel zoom (log-scale, min 0.05) ----
  const WHEEL_OPTS = { passive: false };
  const handleZoomWheel = (e) => {
    const wantsZoom = e.ctrlKey || e.metaKey; // Ctrl on Win/Linux, ⌘ on macOS
    if (!wantsZoom) return;

    // Stop browser page zoom
    e.preventDefault();

    const slider = document.getElementById('zoomRange');
    if (!slider) return;

    const MIN = 0.05;
    const MAX = parseFloat(slider.max) || 10;
    let cur    = parseFloat(slider.value) || 1;

    // log-scale step (smooth & never stuck at tiny values)
    const STEP = 0.05;
    let logZ = Math.log(Math.max(cur, MIN));   // floor at MIN so recovery works
    logZ += (e.deltaY < 0 ? +STEP : -STEP);
    let next = Math.exp(logZ);

    if (next < MIN) next = MIN;
    if (next > MAX) next = MAX;

    slider.value = next.toFixed(3);
    applyPreview();
  };

  // Attach to BOTH viewport and canvas so it works wherever the cursor is
  vp.addEventListener('wheel', handleZoomWheel, WHEEL_OPTS);
  cv.addEventListener('wheel', handleZoomWheel, WHEEL_OPTS);

  // Also enforce MIN on manual slider moves
  const slider = document.getElementById('zoomRange');
  if (slider) {
    slider.min = '0.05'; // ensure HTML min matches the logic
    slider.addEventListener('input', () => {
      const MIN = 0.05;
      const MAX = parseFloat(slider.max) || 10;
      let z = parseFloat(slider.value) || 1;
      if (z < MIN) z = MIN;
      if (z > MAX) z = MAX;
      slider.value = z.toFixed(3);
      applyPreview();
    });
  }
})();

// --- Dithering toggle ---
const DITHER_KEY = 'ditherOn';

function isDitheringOn() {
  const v = localStorage.getItem(DITHER_KEY);
  return v === null ? false : v === 'true';   // default OFF
}

(function initDitherButton(){
  const btn = document.getElementById('ditherButton');
  if (!btn) return;

  // Determine initial state (default OFF first time)
  const saved = localStorage.getItem(DITHER_KEY);
  const on = saved === null ? false : saved === 'true';
  if (saved === null) localStorage.setItem(DITHER_KEY, 'false');

  // Sync UI
  btn.classList.toggle('active', on);

  // (Title comes from your localized HTML; no JS i18n here.)

  // Click handler
  btn.addEventListener('click', () => {
    const next = !btn.classList.contains('active');
    btn.classList.toggle('active', next);
    localStorage.setItem(DITHER_KEY, String(next));

if (originalImage) {
  reprocessWithCurrentPalette();
}

  });

  // Reprocess if active on load and image already present
  if (on && originalImage) {
    applyScale?.();
    applyPreview?.();
  }
})();


// Advanced options: toggle visibility of all "hide color" controls
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('opt-toggle-hide-ui');
  if (!btn) return;

  const apply = () => {
    const on = btn.classList.contains('active');
    // on = show eyes; off = hide them
    document.body.classList.toggle('hide-ui-off', !on);
    // keep master eye visual state in sync
    if (typeof refreshMasterEyes === 'function') refreshMasterEyes();
  };

  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    apply();
  });

  apply(); // set initial state
});

Array.from(document.querySelectorAll('input[name="colors-list-order"]'))
  .forEach(radio => {
    radio.addEventListener('change', (event) => {
      if (_colorCounts) showColorUsage(_colorCounts, event.target.value);
    });
  });


// Utility: check if a canvas has only transparent pixels
function canvasIsEmpty(c) {
  if (!c) return true;
  const ctx = c.getContext("2d");
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 0) return false; // found a non-transparent pixel
  }
  return true;
}

// Utility: pick the right canvas (processed if exists, else main)
function getTargetCanvas() {
  return (typeof processedCanvas !== "undefined" && processedCanvas) ? processedCanvas : canvas;
}

// ===============================
// Save Image to Gallery (localStorage)
// ===============================
async function saveImageToGallery(blob) {
  // Use the same IndexedDB as gallery.js
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("wplaceGallery", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "id", autoIncrement: true })
          .createIndex("created", "created", { unique: false });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("images", "readwrite");
      const store = tx.objectStore("images");
      const rec = { blob, created: Date.now() };
      store.add(rec);
      tx.oncomplete = resolve;
      tx.onerror = reject;
    };
    req.onerror = () => reject(req.error);
  });
}

// ===============================
// Add to Gallery
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("addToGallery");
  if (!btn) return;
  if (btn.dataset.bound === "true") return;
  btn.dataset.bound = "true";

  btn.addEventListener("click", () => {
    // Always use the clamped/processed canvas
    const c = (typeof finalizeToPalette === "function")
      ? finalizeToPalette()
      : (typeof getTargetCanvas === "function" ? getTargetCanvas() : document.getElementById("canvas"));

    const lang = (typeof getCurrentLang === "function" ? getCurrentLang() : "en");
    const t = (typeof window.translations !== "undefined" && window.translations[lang]) || {};

    if (!c || !c.width || !c.height) {
      showToast(t.imageNotFound || "No image to add.", "error");
      return;
    }

    // Don’t add fully transparent canvases
    const isEmpty = (function isCanvasEmpty(canvasEl){
      const _ctx = canvasEl.getContext("2d");
      const d = _ctx.getImageData(0, 0, canvasEl.width, canvasEl.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) return false;
      return true;
    })(c);

    if (isEmpty) {
      showToast(t.imageNotFound || "No image to add.", "error");
      return;
    }

    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");

    const finish = async (blob) => {
      if (!blob) {
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
        showToast(t.saveFailed || "Failed to save image.", "error");
        return;
      }
      try {
        // Save to localStorage as data URL (PNG)
        await saveImageToGallery(blob);

        // Make sure the gallery area is visible *now* (when it exists on this page)
        const area = document.getElementById("galleryArea");
        if (area) area.hidden = false;

        // Mark last action (optional, gallery can read this)
        localStorage.setItem("gallery:lastAddedAt", String(Date.now()));

        showToast(t.imageSaved || "Added to gallery!", "success");

        // Redirect to gallery after a brief pause
        setTimeout(() => {
          const target = lang === "en" ? "gallery.html" : `gallery.html?lang=${lang}`;
          window.location.href = target;
        }, 700);
      } catch (err) {
        console.error(err);
        let msg = t.saveFailed || "Failed to save image.";
        // Surface quota issues nicely
        if (String(err).toLowerCase().includes("quota")) {
          msg = t.storageFull || "Your browser storage is full. Remove some items from the gallery and try again.";
        }
        showToast(msg, "error");
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
      }
    };

    // Always export PNG
    if (c.toBlob) {
      c.toBlob(finish, "image/png");
    } else {
      const dataURL = c.toDataURL("image/png");
      const b64 = dataURL.split(",")[1] || "";
      const bin = atob(b64);
      const u8  = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      finish(new Blob([u8], { type: "image/png" }));
    }
  });
});

// ---------- Mobile Burger Menu ----------
document.addEventListener("DOMContentLoaded", () => {
  const burger   = document.querySelector(".nav-burger");
  const menu     = document.getElementById("mobileMenu");
  const backdrop = document.getElementById("menuBackdrop");
  if (!burger || !menu || !backdrop) return;

  let open = false;
  function setOpen(v) {
    open = v;
    burger.setAttribute("aria-expanded", String(v));
    menu.classList.toggle("show", v);
    backdrop.hidden = !v;
  }

  burger.addEventListener("click", () => setOpen(!open));
  backdrop.addEventListener("click", () => setOpen(false));

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && open) setOpen(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 981 && open) setOpen(false);
  });
});

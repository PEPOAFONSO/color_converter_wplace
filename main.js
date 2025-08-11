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

function updatePadraoFromActiveButtons() {
  padrao = [];
  let colorActiveSave = [];
  const activeButtons = document.querySelectorAll('#colors-free .toggle-color.active, #colors-paid .toggle-color.active');
  activeButtons.forEach(btn => {
    const bg = window.getComputedStyle(btn).backgroundColor;
    const rgbMatch = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      padrao.push([r, g, b]);
    }
    colorActiveSave.push(btn.id);
  });
  localStorage.setItem('activeColors', JSON.stringify(colorActiveSave));
}

const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const downloadLink = document.getElementById('download');

// Clipboard
function showCustomToast(message) {
  const toastBtn = document.getElementById('clipboard');
  if (!toastBtn) return;
  const originalText = toastBtn.textContent;
  toastBtn.textContent = message;
  toastBtn.style.background = '#ff4d4d';
  toastBtn.style.color = '#fff';
  setTimeout(() => {
    toastBtn.textContent = originalText;
    toastBtn.style.background = '';
    toastBtn.style.color = '';
  }, 1800);
}

document.getElementById('clipboard').addEventListener('click', async function () {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let allTransparent = true;
  for (let i = 3; i < imageData.length; i += 4) {
    if (imageData[i] !== 0) {
      allTransparent = false;
      break;
    }
  }

  const lang = getCurrentLang();
  const t = translations[lang] || translations['en'];

  if (allTransparent) {
    showCustomToast(t.imageNotFound);
    return;
  }

  canvas.toBlob(async (blob) => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      showCustomToast(t.imageCopied);
    } catch (err) {
      showCustomToast(t.copyFailed);
    }
  }, 'image/png');
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

// Dithering helper function
function clampByte(v){ return v < 0 ? 0 : v > 255 ? 255 : v; }

function processWithFloydSteinberg(ctx, palette, transparentHideActive) {
  const w = canvas.width, h = canvas.height;
  const img = ctx.getImageData(0, 0, w, h);
  const d  = img.data;

  // work in float copy to carry error
  const buf = new Float32Array(d.length);
  for (let i = 0; i < d.length; i++) buf[i] = d[i];

  const colorCounts = {};

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;

      let r = buf[idx], g = buf[idx+1], b = buf[idx+2], a = buf[idx+3];

      // Your alpha rule
      if (a < 255 && a > 0) {
        if (transparentHideActive) {
          // make transparent and skip diffusion
          d[idx+3] = 0;
          d[idx] = d[idx+1] = d[idx+2] = 0;
          continue;
        } else {
          a = 255;
        }
      }

      // Quantize current pixel to nearest in palette
      const [nr, ng, nb] = corMaisProxima(r|0, g|0, b|0);
      d[idx]   = nr;
      d[idx+1] = ng;
      d[idx+2] = nb;
      d[idx+3] = (a === 0) ? 0 : 255;

      if (a !== 0) {
        const key = `${nr},${ng},${nb}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      }

      // Error
      const er = r - nr;
      const eg = g - ng;
      const eb = b - nb;

      // Diffuse to neighbors (Floyd–Steinberg):
      //   (x+1, y    ) += 7/16 * e
      //   (x-1, y+1  ) += 3/16 * e
      //   (x,   y+1  ) += 5/16 * e
      //   (x+1, y+1  ) += 1/16 * e
      // bounds checks inline
      const push = (xx, yy, fr) => {
        if (xx < 0 || xx >= w || yy < 0 || yy >= h) return;
        const j = (yy * w + xx) * 4;
        // only push into RGB; leave alpha as-is
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


// Image processing
function processarImagem() {
  if (!canvas || !ctx) return;

  const transparentHideActive =
    document.getElementById('transparentButton').classList.contains('active');

  let colorCounts;

  if (isDitheringOn && isDitheringOn()) {
    // ---- DITHERED PATH ----
    colorCounts = processWithFloydSteinberg(ctx, padrao, transparentHideActive);
  } else {
    // ---- NON-DITHERED PATH (your original loop) ----
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    colorCounts = {};

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      const [nr, ng, nb] = corMaisProxima(r, g, b);
      data[i]     = nr;
      data[i + 1] = ng;
      data[i + 2] = nb;

      if (a < 255 && a > 0) {
        data[i + 3] = transparentHideActive ? 0 : 255;
      }

      if (a !== 0) {
        const key = `${nr},${ng},${nb}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  // Keep processedCanvas in sync with what's on the main canvas
  if (!processedCanvas) {
    processedCanvas = document.createElement('canvas');
    processedCtx = processedCanvas.getContext('2d');
  }
  processedCanvas.width  = canvas.width;
  processedCanvas.height = canvas.height;
  processedCtx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
  processedCtx.drawImage(canvas, 0, 0);

  // Update UI bits
  downloadLink.href = canvas.toDataURL("image/png");
  downloadLink.download = `converted_${fileName}`;
  showImageInfo(canvas.width, canvas.height);
  if (colorCounts) showColorUsage(colorCounts);
}


// Image info display
function showImageInfo(width, height) {
  const langSelect = document.getElementById('lang-select');
  const lang       = (langSelect && langSelect.value) || 'en';
  const t          = translations[lang];

// grab the new fields
const widthInput  = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');

// only write if they actually exist
if (widthInput) {
  widthInput.value = width;
}
if (heightInput) {
  heightInput.value = height;
}
}


// Color usage display
function showColorUsage(colorCounts) {
  let colorList = [];
  padrao.forEach(([r, g, b]) => {
    const key = `${r},${g},${b}`;
    const count = colorCounts[key];
    if (count === undefined) return;
    colorList.push({ r, g, b, count, name: colorNames[key] });
  });
  colorList.sort((a, b) => b.count - a.count);

  const colorListDiv = document.getElementById('color-list');
  if (!colorListDiv) return;
  colorListDiv.innerHTML = '';
  colorList.forEach(({ r, g, b, count, name }) => {
    const key = `${r},${g},${b}`;
    const isPaid = paidColors.has(key);

    const colorItem = document.createElement('div');
    colorItem.style.display = 'flex';
    colorItem.style.alignItems = 'center';
    colorItem.style.marginBottom = '4px';

    const swatch = document.createElement('span');
    swatch.style.display = 'inline-block';
    swatch.style.width = '24px';
    swatch.style.height = '24px';
    swatch.style.background = `rgb(${r},${g},${b})`;
    swatch.style.border = '1px solid #ccc';
    swatch.style.marginRight = '8px';

    const label = document.createElement('span');
    const colorName = name || `rgb(${r}, ${g}, ${b})`;
    label.textContent = `${colorName}: ${count} px`;
    if (isPaid) label.style.color = 'gold';

    colorItem.appendChild(swatch);
    colorItem.appendChild(label);
    colorListDiv.appendChild(colorItem);
  });
}

// --- Script for select All buttons ---

// Free Colors
document.addEventListener('DOMContentLoaded', () => {
  const masterBtn    = document.getElementById('unselect-all-free');
  const freeButtons  = Array.from(document.querySelectorAll('#colors-free .toggle-color[data-type="free"]'));
  function t(key) {
    const lang = getCurrentLang();
    return (translations[lang] || translations.en)[key];
  }

  function updateMasterLabel() {
    const allActive = freeButtons.every(b => b.classList.contains('active'));
    masterBtn.textContent = allActive
      ? t('allButtonfreeUnselect')
      : t('allButtonfreeSelect');
  }

  function saveActiveColors() {
    const activeIds = freeButtons
      .filter(b => b.classList.contains('active'))
      .map(b => b.id);
    localStorage.setItem('activeColors', JSON.stringify(activeIds));
  }

  // -- LOAD STATE --
  const raw = localStorage.getItem('activeColors');
  let saved = [];
  if (raw !== null) {
    try { saved = JSON.parse(raw); } catch(e) { console.warn('couldn’t parse saved colors:', raw); }
  }

  // Apply saved state or default to ON if none saved
  const firstVisit = raw === null;
  freeButtons.forEach(b =>
    b.classList.toggle('active', firstVisit ? true : saved.includes(b.id))
  );

  // Update label now
  window.addEventListener('load', () => { updateMasterLabel(); });

  // If it's the first visit, don't save until user interacts
  if (!firstVisit) {
    updatePadraoFromActiveButtons();
  }

  // ——— WIRING UP THE CLICK HANDLERS ———
  freeButtons.forEach(b => {
    b.addEventListener('click', () => {
      b.classList.toggle('active');

      setTimeout(() => {
        updateMasterLabel();
        saveActiveColors();
        updatePadraoFromActiveButtons();
        if (originalImage) {
          applyScale?.();
          applyPreview?.();
        }
      }, 0);
    });
  });

  masterBtn.addEventListener('click', () => {
    const allActive = freeButtons.every(b => b.classList.contains('active'));
    freeButtons.forEach(b => b.classList.toggle('active', !allActive));

    updateMasterLabel();
    saveActiveColors();
    updatePadraoFromActiveButtons();
    if (originalImage) {
      applyScale?.();
      applyPreview?.();
    }
  });
});


// Paid Colors
document.addEventListener('DOMContentLoaded', () => {
  const masterBtn    = document.getElementById('select-all-paid');
  const paidButtons  = Array.from(document.querySelectorAll('#colors-paid .toggle-color[data-type="paid"]'));
  function t(key) {
    const lang = getCurrentLang();
    return (translations[lang] || translations.en)[key];
  }

  function updateMasterLabel() {
    const allActive = paidButtons.every(b => b.classList.contains('active'));
    masterBtn.textContent = allActive
      ? t('allButtonpaidUnselect')
      : t('allButtonpaidSelect');
  }

  function saveActiveColorsPaid() {
    const activeIds = paidButtons
      .filter(b => b.classList.contains('active'))
      .map(b => b.id);
    localStorage.setItem('activeColorsPaid', JSON.stringify(activeIds));
  }

  // -- LOAD STATE --
  const raw = localStorage.getItem('activeColorsPaid');
  let saved = [];
  if (raw !== null) {
    try { saved = JSON.parse(raw); } catch(e) { console.warn('couldn’t parse saved paid colors:', raw); }
  }

  // apply saved (default to OFF for paid if nothing saved)
  paidButtons.forEach(b =>
    b.classList.toggle('active', raw !== null ? saved.includes(b.id) : false)
  );

  window.addEventListener('load', () => { updateMasterLabel(); });

  // initial draw
  updatePadraoFromActiveButtons();

  // single-button toggle
  paidButtons.forEach(b => {
    b.addEventListener('click', () => {
      b.classList.toggle('active');  // ✅ core change

      setTimeout(() => {
        updateMasterLabel();
        saveActiveColorsPaid();
        updatePadraoFromActiveButtons();
        if (originalImage) {
          applyScale?.();
          applyPreview?.();
        }
      }, 0);
    });
  });

  masterBtn.addEventListener('click', () => {
    const allActive = paidButtons.every(b => b.classList.contains('active'));
    paidButtons.forEach(b => b.classList.toggle('active', !allActive));

    updateMasterLabel();
    saveActiveColorsPaid();
    updatePadraoFromActiveButtons();
    if (originalImage) {
      applyScale?.();
      applyPreview?.();
    }
  });
});

// --End of Script for buttons--

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


// When user types a new width
widthInput.addEventListener('input', () => {
  if (!originalImage) return;

  // 1) parse and clamp width
  const rawW = parseInt(widthInput.value, 10) || 0;
  const maxScale = parseFloat(scaleRange.max);                // e.g. 5
  const maxW = Math.round(originalImage.width * maxScale);    // maximum allowed width
  const newW = Math.min(Math.max(rawW, 1), maxW);              // clamp to [1, maxW]

  // 2) write back the clamped value so the user sees it
  widthInput.value = newW;

  // 3) compute the scale and corresponding height
  const scale = newW / originalImage.width;
  const newH  = Math.round(originalImage.height * scale);

  // 4) sync other controls
  heightInput.value      = newH;
  scaleRange.value       = scale.toFixed(2);
  scaleValue.textContent = scale.toFixed(2) + 'x';

  // 5) redraw
  applyScale();
  applyPreview();
});


// When user types a new height
heightInput.addEventListener('input', () => {
  if (!originalImage) return;

  // 1) parse and clamp height
  const rawH = parseInt(heightInput.value, 10) || 0;
  const maxScale = parseFloat(scaleRange.max);                 // e.g. 5
  const maxH = Math.round(originalImage.height * maxScale);    // maximum allowed height
  const newH = Math.min(Math.max(rawH, 1), maxH);              // clamp to [1, maxH]

  // 2) write back the clamped value so the user sees it
  heightInput.value = newH;

  // 3) compute the scale and corresponding width
  const scale = newH / originalImage.height;
  const newW  = Math.round(originalImage.width * scale);

  // 4) sync other controls
  widthInput.value       = newW;
  scaleRange.value       = scale.toFixed(2);
  scaleValue.textContent = scale.toFixed(2) + 'x';

  // 5) redraw
  applyScale();
  applyPreview();
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
  let zoom = parseFloat(zoomRange?.value);
  if (!Number.isFinite(zoom) || zoom <= 0) zoom = 1;

  if (!processedCanvas) {
    console.warn('No processedCanvas, skipping preview');
    return;
  }

  // no longer clamp zoom to fit — let user zoom out freely
  const effectiveZoom = zoom;

  const vp = document.getElementById('canvasViewport');
  const baseW = processedCanvas.width;
  const baseH = processedCanvas.height;

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
  ctx.drawImage(processedCanvas, 0, 0, baseW, baseH, 0, 0, pw, ph);
  ctx.imageSmoothingEnabled = true;

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


document.addEventListener('DOMContentLoaded', function () {
  const buttons = document.querySelectorAll('#colors .toggle-color');
  const colorActiveSave = JSON.parse(localStorage.getItem('activeColors')) || [];
  colorActiveSave.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.classList.add('active');
    }
  });

  const transparentButton = document.getElementById('transparentButton');
  if (localStorage.getItem('transparentHide') === 'true') {
    transparentButton.classList.add('active');
  }

  updatePadraoFromActiveButtons();

  buttons.forEach(btn => {
    btn.addEventListener('click', function () {
      btn.classList.toggle('active');
      updatePadraoFromActiveButtons();
      if (originalImage) {
        applyScale();
        applyPreview();
      }
    });
  });
});

const translations = {
  en: {
    title: "Wplace Color Converter",
    freeColors: "Free Colors:",
    paidColors: "Paid Colors (2000💧each):",
    download: "Download Image",
    clipboard: "Copy to Clipboard",
    goto: "Go to Wplace",
    pixelsAmount: "Pixels Amount:",
    width: "Width:",
    height: "Height:",
    area: "Area:",
    imageCopied: "Image copied to clipboard!",
    copyFailed: "Failed to copy image.",
    imageNotFound: "Image not found",
    allButtonfreeSelect: "Select All Free Colors",
    allButtonfreeUnselect: "Unselect All Free Colors",
    allButtonpaidSelect: "Select All 💧Paid Colors",
    allButtonpaidUnselect: "Unselect All 💧Paid Colors",
    zoom: "Zoom",
    scale: "Scale",
    transparentButton: "Hide Semi-Transparent Pixels",
    transparentButtonTitle: "When active, semi-transparent pixels will be made fully transparent, otherwise they will be fully opaque.",
    zoomHint: "Ctrl + Scroll to zoom",
    ditherButton: "Dither (recommended)",
    uploadStrong: "Upload Image",
    uploadSpan: "Click, paste or drag & drop",
  },
  pt: {
    title: "Conversor de Cores Wplace",
    freeColors: "Cores Gratuitas:",
    paidColors: "Cores Pagas (2000💧cada):",
    download: "Baixar Imagem",
    clipboard: "Copiar para Área de Transferência",
    goto: "Ir para o Wplace",
    pixelsAmount: "Quantidade de Pixels:",
    width: "Largura:",
    height: "Altura:",
    area: "Área:",
    imageCopied: "Imagem copiada para a área de transferência!",
    copyFailed: "Falha ao copiar a imagem.",
    imageNotFound: "Imagem não encontrada",
    allButtonfreeSelect: "Selecionar Todas as Cores Gratuitas",
    allButtonfreeUnselect: "Desmarcar Todas as Cores Gratuitas",
    allButtonpaidSelect: "Selecionar Todas as Cores Pagas 💧",
    allButtonpaidUnselect: "Desmarcar Todas as Cores Pagas 💧",
    zoom: "Zoom",
    scale: "Tamanho",
    transparentButton: "Ocultar Pixels Semitransparentes",
    transparentButtonTitle: "Remover Pixels Semitransparentes",
    zoomHint: "Ctrl + scroll para ampliar",
    ditherButton: "Dithering (recomendado)",
    uploadStrong: "Carregar Imagem",
    uploadSpan: "Clique, cole ou arraste e largue",
  },
  de: {
    title: "Wplace Farbkonverter",
    freeColors: "Kostenlose Farben:",
    paidColors: "Bezahlte Farben (2000💧 pro Stück):",
    download: "Bild herunterladen",
    clipboard: "In die Zwischenablage kopieren",
    goto: "Zu Wplace gehen",
    pixelsAmount: "Anzahl der Pixel:",
    width: "Breite:",
    height: "Höhe:",
    area: "Fläche:",
    imageCopied: "Bild in Zwischenablage kopiert!",
    copyFailed: "Bild konnte nicht kopiert werden.",
    imageNotFound: "Bild nicht gefunden",
    allButtonfreeSelect: "Alle kostenlosen Farben auswählen",
    allButtonfreeUnselect: "Alle kostenlosen Farben abwählen",
    allButtonpaidSelect: "Alle 💧bezahlten Farben auswählen",
    allButtonpaidUnselect: "Alle 💧bezahlten Farben abwählen",
    zoom: "Zoom",
    scale: "Maßstab",
    transparentButton: "Halbtransparente Pixel ausblenden",
    transparentButtonTitle: "Wenn aktiv, werden halbtransparente Pixel vollständig transparent, andernfalls vollständig undurchsichtig.",
    zoomHint: "Strg + Scroll zum Zoomen",
    ditherButton: "Dithering (empfohlen)",
    uploadStrong: "Bild hochladen",
    uploadSpan: "Klicken, einfügen oder ziehen und ablegen",
  },
  es: {
    title: "Convertidor de Colores Wplace",
    freeColors: "Colores Gratis:",
    paidColors: "Colores de Pago (2000💧 cada uno):",
    download: "Descargar Imagen",
    clipboard: "Copiar al Portapapeles",
    goto: "Ir a Wplace",
    pixelsAmount: "Cantidad de píxeles:",
    width: "Ancho:",
    height: "Alto:",
    area: "Área:",
    imageCopied: "¡Imagen copiada al portapapeles!",
    copyFailed: "Error al copiar la imagen.",
    imageNotFound: "Imagen no encontrada",
    allButtonfreeSelect: "Seleccionar todos los colores gratis",
    allButtonfreeUnselect: "Deseleccionar todos los colores gratis",
    allButtonpaidSelect: "Seleccionar todos los colores 💧de pago",
    allButtonpaidUnselect: "Deseleccionar todos los colores 💧de pago",
    zoom: "Zoom",
    scale: "Escala",
    transparentButton: "Ocultar píxeles semitransparentes",
    transparentButtonTitle: "Cuando está activo, los píxeles semitransparentes se vuelven completamente transparentes, de lo contrario, completamente opacos.",
    zoomHint: "Ctrl + desplazamiento para acercar/alejar",
    ditherButton: "Tramado (recomendado)",
    uploadStrong: "Subir imagen",
    uploadSpan: "Haz clic, pega o arrastra y suelta",
  },
  fr: {
    title: "Convertisseur de Couleurs Wplace",
    freeColors: "Couleurs Gratuites :",
    paidColors: "Couleurs Payantes (2000💧 chacune) :",
    download: "Télécharger l’image",
    clipboard: "Copier dans le presse-papiers",
    goto: "Aller sur Wplace",
    pixelsAmount: "Nombre de pixels :",
    width: "Largeur :",
    height: "Hauteur :",
    area: "Surface :",
    imageCopied: "Image copiée dans le presse-papiers !",
    copyFailed: "Échec de la copie de l’image.",
    imageNotFound: "Image non trouvée",
    allButtonfreeSelect: "Sélectionner toutes les couleurs gratuites",
    allButtonfreeUnselect: "Désélectionner toutes les couleurs gratuites",
    allButtonpaidSelect: "Sélectionner toutes les couleurs 💧payantes",
    allButtonpaidUnselect: "Désélectionner toutes les couleurs 💧payantes",
    zoom: "Zoom",
    scale: "Échelle",
    transparentButton: "Masquer les pixels semi-transparents",
    transparentButtonTitle: "Lorsque cette option est activée, les pixels semi-transparents deviennent complètement transparents, sinon ils restent complètement opaques.",
    zoomHint: "Ctrl + molette pour zoomer",
    ditherButton: "Tramage (recommandé)",
    uploadStrong: "Télécharger une image",
    uploadSpan: "Cliquez, collez ou glissez-déposez",
  },
  uk: {
    title: "Конвертер кольорів Wplace",
    freeColors: "Безкоштовні кольори:",
    paidColors: "Платні кольори (2000💧 кожен):",
    download: "Завантажити зображення",
    clipboard: "Копіювати в буфер обміну",
    goto: "Перейти до Wplace",
    pixelsAmount: "Кількість пікселів:",
    width: "Ширина:",
    height: "Висота:",
    area: "Площа:",
    imageCopied: "Зображення скопійовано в буфер обміну!",
    copyFailed: "Не вдалося скопіювати зображення.",
    imageNotFound: "Зображення не знайдено",
    allButtonfreeSelect: "Вибрати всі безкоштовні кольори",
    allButtonfreeUnselect: "Зняти вибір усіх безкоштовних кольорів",
    allButtonpaidSelect: "Вибрати всі 💧платні кольори",
    allButtonpaidUnselect: "Зняти вибір усіх 💧платних кольорів",
    zoom: "Зум",
    scale: "Масштаб",
    transparentButton: "Сховати напівпрозорі пікселі",
    transparentButtonTitle: "Коли активовано, напівпрозорі пікселі стають повністю прозорими, інакше вони залишаються повністю непрозорими.",
    zoomHint: "Ctrl + прокрутка для масштабування",
    ditherButton: "Дизеринг (рекомендовано)",
    uploadStrong: "Завантажити зображення",
    uploadSpan: "Натисніть, вставте або перетягніть",
  },
  vi: {
    title: "Trình chuyển đổi màu Wplace",
    freeColors: "Màu miễn phí:",
    paidColors: "Màu trả phí (2000💧 mỗi màu):",
    download: "Tải hình ảnh",
    clipboard: "Sao chép vào bộ nhớ tạm",
    goto: "Đi đến Wplace",
    pixelsAmount: "Số lượng điểm ảnh:",
    width: "Chiều rộng:",
    height: "Chiều cao:",
    area: "Diện tích:",
    imageCopied: "Đã sao chép hình ảnh vào bộ nhớ tạm!",
    copyFailed: "Sao chép hình ảnh thất bại.",
    imageNotFound: "Không tìm thấy hình ảnh",
    allButtonfreeSelect: "Chọn tất cả màu miễn phí",
    allButtonfreeUnselect: "Bỏ chọn tất cả màu miễn phí",
    allButtonpaidSelect: "Chọn tất cả màu 💧trả phí",
    allButtonpaidUnselect: "Bỏ chọn tất cả màu 💧trả phí",
    zoom: "Thu phóng",
    scale: "Tỉ lệ",
    transparentButton: "Ẩn các điểm ảnh bán trong suốt",
    transparentButtonTitle: "Khi bật, các điểm ảnh bán trong suốt sẽ trở nên hoàn toàn trong suốt, nếu không sẽ hoàn toàn đục.",
    zoomHint: "Ctrl + cuộn để thu phóng",
    ditherButton: "Dithering (khuyến nghị)",
    uploadStrong: "Tải hình ảnh",
    uploadSpan: "Nhấp, dán hoặc kéo và thả",
  },
  ja: {
    title: "Wplace カラーコンバーター",
    freeColors: "無料カラー：",
    paidColors: "有料カラー（1色2000💧）：",
    download: "画像をダウンロード",
    clipboard: "クリップボードにコピー",
    goto: "Wplaceへ移動",
    pixelsAmount: "ピクセル数：",
    width: "幅：",
    height: "高さ：",
    area: "面積：",
    imageCopied: "画像がクリップボードにコピーされました！",
    copyFailed: "画像のコピーに失敗しました。",
    imageNotFound: "画像が見つかりません",
    allButtonfreeSelect: "すべての無料カラーを選択",
    allButtonfreeUnselect: "すべての無料カラーの選択を解除",
    allButtonpaidSelect: "すべての💧有料カラーを選択",
    allButtonpaidUnselect: "すべての💧有料カラーの選択を解除",
    zoom: "ズーム",
    scale: "スケール",
    transparentButton: "半透明ピクセルを非表示",
    transparentButtonTitle: "有効にすると、半透明ピクセルは完全に透明になり、無効にすると完全に不透明になります。",
    zoomHint: "Ctrl + スクロールでズーム",
    ditherButton: "ディザリング（推奨）",
    uploadStrong: "画像をアップロード",
    uploadSpan: "クリック、貼り付け、またはドラッグ＆ドロップ",
  },
  pl: {
    title: "Konwerter Kolorów Wplace",
    freeColors: "Darmowe Kolory:",
    paidColors: "Płatne Kolory (2000💧za sztukę):",
    download: "Pobierz Obraz",
    clipboard: "Kopiuj do Schowka",
    goto: "Przejdź do Wplace",
    pixelsAmount: "Liczba Pikseli:",
    width: "Szerokość:",
    height: "Wysokość:",
    area: "Powierzchnia:",
    imageCopied: "Obraz skopiowany do schowka!",
    copyFailed: "Nie udało się skopiować obrazu.",
    imageNotFound: "Nie znaleziono obrazu",
    allButtonfreeSelect: "Zaznacz Wszystkie Darmowe Kolory",
    allButtonfreeUnselect: "Odznacz Wszystkie Darmowe Kolory",
    allButtonpaidSelect: "Zaznacz Wszystkie Płatne Kolory 💧",
    allButtonpaidUnselect: "Odznacz Wszystkie Płatne Kolory 💧",
    zoom: "Powiększenie",
    scale: "Skala",
    transparentButton: "Ukryj półprzezroczyste piksele",
    transparentButtonTitle: "Gdy aktywne, półprzezroczyste piksele będą całkowicie przezroczyste, w przeciwnym razie będą całkowicie nieprzezroczyste.",
    zoomHint: "Ctrl + przewijanie, aby powiększyć",
    ditherButton: "Dithering (zalecane)",
    uploadStrong: "Prześlij obraz",
    uploadSpan: "Kliknij, wklej lub przeciągnij i upuść",
  },
  de_CH: {
    title: "Wplace Farbkonverter",
    freeColors: "Kostenlose Farben:",
    paidColors: "Bezahlte Farben (2000💧 pro Farbe):",
    download: "Bild herunterladen",
    clipboard: "In die Zwischenablage kopieren",
    goto: "Zu Wplace gehen",
    pixelsAmount: "Pixelanzahl:",
    width: "Breite:",
    height: "Höhe:",
    area: "Fläche:",
    imageCopied: "Bild in Zwischenablage kopiert!",
    copyFailed: "Bild konnte nicht kopiert werden.",
    imageNotFound: "Bild nicht gefunden",
    allButtonfreeSelect: "Alle kostenlosen Farben auswählen",
    allButtonfreeUnselect: "Alle kostenlosen Farben abwählen",
    allButtonpaidSelect: "Alle 💧bezahlten Farben auswählen",
    allButtonpaidUnselect: "Alle 💧bezahlten Farben abwählen",
    zoom: "Zoom",
    scale: "Massstab",
    transparentButton: "Halbtransparente Pixel ausblenden",
    transparentButtonTitle: "Wenn aktiv, werden halbtransparente Pixel vollständig transparent, andernfalls vollständig undurchsichtig.",
    zoomHint: "Strg + Scroll zum Zoomen",
    ditherButton: "Dithering (empfohlen)",
    uploadStrong: "Bild hochladen",
    uploadSpan: "Klicken, einfügen oder ziehen und ablegen",
  },
  nl: {
    title: "Wplace Kleurconverter",
    freeColors: "Gratis kleuren:",
    paidColors: "Betaalde kleuren (2000💧 per stuk):",
    download: "Afbeelding downloaden",
    clipboard: "Kopiëren naar klembord",
    goto: "Ga naar Wplace",
    pixelsAmount: "Aantal pixels:",
    width: "Breedte:",
    height: "Hoogte:",
    area: "Oppervlakte:",
    imageCopied: "Afbeelding gekopieerd naar klembord!",
    copyFailed: "Afbeelding kopiëren mislukt.",
    imageNotFound: "Afbeelding niet gevonden",
    allButtonfreeSelect: "Selecteer alle gratis kleuren",
    allButtonfreeUnselect: "Deselecteer alle gratis kleuren",
    allButtonpaidSelect: "Selecteer alle 💧betaalde kleuren",
    allButtonpaidUnselect: "Deselecteer alle 💧betaalde kleuren",
    zoomHint: "Ctrl + scroll om te zoomen",
    ditherButton: "Dithering (aanbevolen)",
    uploadStrong: "Afbeelding uploaden",
    uploadSpan: "Klik, plak of sleep en zet neer",
  },
  ru: {
    title: "Конвертер цветов Wplace",
    freeColors: "Бесплатные цвета:",
    paidColors: "Платные цвета (2000💧 за каждый):",
    download: "Скачать изображение",
    clipboard: "Копировать в буфер обмена",
    goto: "Перейти на Wplace",
    pixelsAmount: "Количество пикселей:",
    width: "Ширина:",
    height: "Высота:",
    area: "Площадь:",
    imageCopied: "Изображение скопировано в буфер обмена!",
    copyFailed: "Не удалось скопировать изображение.",
    imageNotFound: "Изображение не найдено",
    allButtonfreeSelect: "Выбрать все бесплатные цвета",
    allButtonfreeUnselect: "Снять выбор со всех бесплатных цветов",
    allButtonpaidSelect: "Выбрать все 💧платные цвета",
    allButtonpaidUnselect: "Снять выбор со всех 💧платных цветов",
    zoom: "Зум",
    scale: "Масштаб",
    transparentButton: "Скрыть полупрозрачные пиксели",
    transparentButtonTitle: "Когда включено, полупрозрачные пиксели становятся полностью прозрачными, иначе они остаются полностью непрозрачными.",
    zoomHint: "Ctrl + прокрутка для масштабирования",
    ditherButton: "Дизеринг (рекомендуется)",
    uploadStrong: "Загрузить изображение",
    uploadSpan: "Нажмите, вставьте или перетащите",
  },
  tr: {
    title: "Wplace Renk Dönüştürücü",
    freeColors: "Ücretsiz Renkler:",
    paidColors: "Ücretli Renkler (Her biri 2000💧):",
    download: "Görseli İndir",
    clipboard: "Panoya Kopyala",
    goto: "Wplace'e Git",
    pixelsAmount: "Piksel Sayısı:",
    width: "Genişlik:",
    height: "Yükseklik:",
    area: "Alan:",
    imageCopied: "Görsel panoya kopyalandı!",
    copyFailed: "Resim kopyalanamadı.",
    imageNotFound: "Görsel bulunamadı",
    allButtonfreeSelect: "Tüm Ücretsiz Renkleri Seç",
    allButtonfreeUnselect: "Tüm Ücretsiz Renklerin Seçimini Kaldır",
    allButtonpaidSelect: "Tüm 💧Ücretli Renkleri Seç",
    allButtonpaidUnselect: "Tüm 💧Ücretli Renklerin Seçimini Kaldır",
    zoom: "Yakınlaştır",
    scale: "Ölçek",
    transparentButton: "Yarı saydam pikselleri gizle",
    transparentButtonTitle: "Aktif olduğunda, yarı saydam pikseller tamamen saydam hale gelir, aksi takdirde tamamen opak kalır.",
    zoomHint: "Ctrl + kaydırma ile yakınlaştır",
    ditherButton: "Dithering (önerilir)",
    uploadStrong: "Resim Yükle",
    uploadSpan: "Tıklayın, yapıştırın veya sürükleyip bırakın",
  }
};

// Language selector change event
document.addEventListener("DOMContentLoaded", () => {
  const parts = window.location.pathname.split("/").filter(Boolean);

  // A) repoName vs local‐mode
  let repoName = "", currentPathLang = "en";
  if (translations[parts[0]]) {
    currentPathLang = parts[0];               // local: "/de/"
  } else {
    repoName = parts[0] || "";                
    if (translations[parts[1]]) {
      currentPathLang = parts[1];             // pages: "/repoName/de/"
    }
  }
  const base = repoName ? `/${repoName}` : "";

  // B) Grab savedLang _before_ any detection
  const savedLang = localStorage.getItem("lang");

  // C) Load or detect (but don’t overwrite savedLang yet)
  let lang = savedLang;
  if (!lang) {
    const nav = (navigator.language || "en").toLowerCase();
    lang = translations[nav]
      ? nav
      : translations[nav.split("-")[0]]
        ? nav.split("-")[0]
        : "en";
    // now persist it
    localStorage.setItem("lang", lang);
  }

  // D) **Only** honor the URL if there _was_ a savedLang (i.e. the user had explicitly chosen before)
  const manuallyNavigated =
    (!repoName && translations[parts[0]]) ||
    (repoName  && translations[parts[1]]);
  if (savedLang && manuallyNavigated) {
    lang = currentPathLang;
    localStorage.setItem("lang", lang);
  }

  // E) If our final lang ≠ the URL, redirect to the correct one
  if (currentPathLang !== lang) {
    const dest = lang === "en"
      ? `${base}/`
      : `${base}/${lang}/`;
    window.location.replace(window.location.origin + dest);
    return;
  }

  // F) Wire up the selector
  const select = document.getElementById("lang-select");
  if (select) {
    select.value = lang;
    select.addEventListener("change", () => {
      const chosen = select.value;
      localStorage.setItem("lang", chosen);
      const target = chosen === "en"
        ? `${base}/`
        : `${base}/${chosen}/`;
      window.location.href = window.location.origin + target;
    });
  }

  // G) Finally, apply in‐page translations
  applyTranslations(lang);
});


// Global variables for image size
let currentImageWidth = null;
let currentImageHeight = null;
let fileName = "";

// Helper to get current language from selector
function getCurrentLang() {
  const langSelect = document.getElementById('lang-select');
  return (langSelect && langSelect.value) || 'en';
}

// Show image info with translation
// Show image info by updating the width/height inputs and area‐box
function showImageInfo(width, height) {
  const lang = getCurrentLang();
  const t    = translations[lang];
  if (width == null || height == null) return;

  const wIn = document.getElementById("widthInput");
  const hIn = document.getElementById("heightInput");
  const aBx = document.getElementById("area");

  if (wIn) wIn.value     = width;
  if (hIn) hIn.value     = height;
  if (aBx) aBx.textContent = `${width * height}`;
}

// Refresh width/height/area display
showImageInfo(currentImageWidth, currentImageHeight);

// Transparent button functionality
document.getElementById('transparentButton').addEventListener('click', function () {
  this.classList.toggle('active');
  localStorage.setItem('transparentHide', this.classList.contains('active'));

  updatePadraoFromActiveButtons();

  if (originalImage) {
    applyScale();
    applyPreview();
  }
});

function applyTranslations(lang) {
console.log(document.getElementById("meta-og-title"));
  // Update visible elements
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const titleKey = el.getAttribute('data-i18n-title');

    if (translations[lang]?.[key]) el.textContent = translations[lang][key];
    if (titleKey && translations[lang]?.[titleKey]) el.title = translations[lang][titleKey];
  });

  // Update dynamic info if present
  if (currentImageWidth && currentImageHeight) {
    const t = translations[lang];
    document.getElementById("width").textContent = `${t.width} ${currentImageWidth}`;
    document.getElementById("height").textContent = `${t.height} ${currentImageHeight}`;
    document.getElementById("area").textContent = `${t.area} ${currentImageWidth * currentImageHeight}`;
  }

  // Call any additional UI update
  showImageInfo(currentImageWidth, currentImageHeight);
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
    const STEP = 0.01;
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
  return v === null ? true : v === 'true';   // default ON
}

(function initDitherButton(){
  const btn = document.getElementById('ditherButton');
  if (!btn) return;

  // Determine initial state (default ON first time)
  const saved = localStorage.getItem(DITHER_KEY);
  const on = saved === null ? true : saved === 'true';
  if (saved === null) localStorage.setItem(DITHER_KEY, 'true');

  // Sync UI
  btn.classList.toggle('active', on);

  // Optional title via i18n
  const lang = (typeof getCurrentLang === 'function' && getCurrentLang()) || 'en';
  if (translations?.[lang]?.ditherButtonTitle) {
    btn.title = translations[lang].ditherButtonTitle;
  }

  // Click handler
  btn.addEventListener('click', () => {
    const next = !btn.classList.contains('active');
    btn.classList.toggle('active', next);
    localStorage.setItem(DITHER_KEY, String(next));

    if (originalImage) {
      applyScale?.();
      applyPreview?.();
    }
  });

  // 🔹 Force reprocess if active on load and image already loaded
  if (on && originalImage) {
    applyScale?.();
    applyPreview?.();
  }
})();
// --- Color palette and mappings ---
const colorPalette = [
  [0,0,0],[60,60,60],[120,120,120],[170,170,170],[210,210,210],[255,255,255],
  [96,0,24],[165,14,30],[237,28,36],[250,128,114],[228,92,26],[255,127,39],[246,170,9],
  [249,221,59],[255,250,188],[156,132,49],[197,173,49],[232,212,95],[74,107,58],[90,148,74],[132,197,115],
  [14,185,104],[19,230,123],[135,255,94],[12,129,110],[16,174,166],[19,225,190],[15,121,159],[96,247,242],
  [187,250,242],[40,80,158],[64,147,228],[125,199,255],[77,49,184],[107,80,246],[153,177,251],
  [74,66,132],[122,113,196],[181,174,241],[170,56,185],[224,159,249],
  [203,0,122],[236,31,128],[243,141,169],[155,82,73],[209,128,120],[250,182,164],
  [104,70,52],[149,104,42],[219,164,99],[123,99,82],[156,132,107],[214,181,148],
  [209,128,81],[248,178,119],[255,197,165],[109,100,63],[148,140,107],[205,197,158],
  [51,57,65],[109,117,141],[179,185,209]
];

const colorNames = {
  "0,0,0": "Black", "60,60,60": "Dark Gray", "120,120,120": "Gray", "210,210,210": "Light Gray", "255,255,255": "White",
  "96,0,24": "Deep Red", "237,28,36": "Red", "255,127,39": "Orange", "246,170,9": "Gold", "249,221,59": "Yellow", "255,250,188": "Light Yellow",
  "14,185,104": "Dark Green", "19,230,123": "Green", "135,255,94": "Light Green", "12,129,110": "Dark Teal", "16,174,166": "Teal", "19,225,190": "Light Teal", "96,247,242": "Cyan",
  "40,80,158": "Dark Blue", "64,147,228": "Blue", "107,80,246": "Indigo", "153,177,251": "Light Indigo", "120,12,153": "Dark Purple", "170,56,185": "Purple", "224,159,249": "Light Purple",
  "203,0,122": "Dark Pink", "236,31,128": "Pink", "243,141,169": "Light Pink", "104,70,52": "Dark Brown", "149,104,42": "Brown", "248,178,119": "Beige",
  "170,170,170": "Medium Gray", "165,14,30": "Dark Red", "250,128,114": "Light Red", "228,92,26": "Dark Orange", "156,132,49": "Dark Goldenrod", "197,173,49": "Goldenrod", "232,212,95": "Light Goldenrod",
  "74,107,58": "Dark Olive", "90,148,74": "Olive", "132,197,115": "Light Olive", "15,121,159": "Dark Cyan", "187,250,242": "Light Cyan", "125,199,255": "Light Blue",
  "77,49,184": "Dark Indigo", "74,66,132": "Dark Slate Blue", "122,113,196": "Slate Blue", "181,174,241": "Light Slate Blue", "155,82,73": "Dark Peach", "209,128,120": "Peach", "250,182,164": "Light Peach",
  "219,164,99": "Light Brown", "123,99,82": "Dark Tan", "156,132,107": "Tan", "214,181,148": "Light Tan", "209,128,81": "Dark Beige", "255,197,165": "Light Beige",
  "109,100,63": "Dark Stone", "148,140,107": "Stone", "205,197,158": "Light Stone", "51,57,65": "Dark Slate", "109,117,141": "Slate", "179,185,209": "Light Slate"
};

const paidColors = new Set([
  "170,170,170", "165,14,30", "250,128,114", "228,92,26", "156,132,49", "197,173,49", "232,212,95",
  "74,107,58", "90,148,74", "132,197,115", "15,121,159", "187,250,242", "125,199,255",
  "77,49,184", "74,66,132", "122,113,196", "181,174,241", "155,82,73", "209,128,120", "250,182,164",
  "219,164,99", "123,99,82", "156,132,107", "214,181,148", "209,128,81", "255,197,165",
  "109,100,63", "148,140,107", "205,197,158", "51,57,65", "109,117,141", "179,185,209"
]);

// --- Global variables ---
let padrao = [];
let originalImage = null;
let originalImageAspectRatio = 1; // Memorizza l'aspect ratio originale
let currentImageWidth = null;
let currentImageHeight = null;
let fileName = "";
let processedCanvas = null;
let processedCtx = null;
let isUpdatingFromAspectRatio = false; // Flag per prevenire loop infiniti

// --- DOM elements (will be initialized when DOM is loaded) ---
let upload, canvas, ctx, downloadLink, widthInput, heightInput, scaleRange, scaleValue, zoomRange, zoomValue;

// --- Debug function ---
function debugLog(message, data = null) {
  console.log(`[DEBUG] ${message}`, data || '');
}

// --- Initialize DOM elements ---
function initializeDOMElements() {
  debugLog("Initializing DOM elements...");
  
  upload = document.getElementById('upload');
  canvas = document.getElementById('canvas');
  downloadLink = document.getElementById('download');
  widthInput = document.getElementById('widthInput');
  heightInput = document.getElementById('heightInput');
  scaleRange = document.getElementById('scaleRange');
  scaleValue = document.getElementById('scaleValue');
  zoomRange = document.getElementById('zoomRange');
  zoomValue = document.getElementById('zoomValue');
  
  if (canvas) {
    ctx = canvas.getContext('2d', { willReadFrequently: true });
  }
  
  // Check if all elements are found
  const elements = { upload, canvas, downloadLink, widthInput, heightInput, scaleRange, scaleValue, zoomRange, zoomValue };
  const missingElements = Object.entries(elements).filter(([key, value]) => !value).map(([key]) => key);
  
  if (missingElements.length > 0) {
    console.error(`Missing DOM elements: ${missingElements.join(', ')}`);
    return false;
  }
  
  debugLog("All DOM elements initialized successfully");
  return true;
}

// --- Update color palette from active buttons ---
function updatePadraoFromActiveButtons() {
  debugLog("Updating color palette from active buttons");
  padrao = [];
  let colorActiveSave = [];
  const activeButtons = document.querySelectorAll('#colors .toggle-color.active');
  
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
  debugLog(`Updated palette with ${padrao.length} colors`);
}

// --- Find closest color ---
function corMaisProxima(r, g, b) {
  let menorDist = Infinity;
  let cor = [0, 0, 0];
  
  for (let i = 0; i < padrao.length; i++) {
    const [pr, pg, pb] = padrao[i];
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

// --- Process image ---
function processarImagem() {
  debugLog("Processing image");
  
  if (!canvas || !ctx) {
    console.error("Canvas or context not available");
    return;
  }
  
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const colorCounts = {};
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    const [nr, ng, nb] = corMaisProxima(r, g, b);
    data[i] = nr;
    data[i + 1] = ng;
    data[i + 2] = nb;
    
    if (a < 255 && a > 0) {
      const transparentButton = document.getElementById('transparentButton');
      if (transparentButton && transparentButton.classList.contains('active')) {
        data[i + 3] = 0;
      } else {
        data[i + 3] = 255;
      }
    }
    
    if (a !== 0) {
      const key = `${nr},${ng},${nb}`;
      colorCounts[key] = (colorCounts[key] || 0) + 1;
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
  
  if (downloadLink) {
    downloadLink.href = canvas.toDataURL("image/png");
    downloadLink.download = `converted_${fileName}`;
  }
  
  showImageInfo(canvas.width, canvas.height);
  showColorUsage(colorCounts);
  
  // Store processed image
  if (!processedCanvas) {
    processedCanvas = document.createElement('canvas');
    processedCtx = processedCanvas.getContext('2d');
  }
  processedCanvas.width = canvas.width;
  processedCanvas.height = canvas.height;
  processedCtx.putImageData(imgData, 0, 0);
  
  debugLog("Image processing completed");
}

// --- Show image info ---
function showImageInfo(width, height) {
  debugLog(`Showing image info: ${width}x${height}`);
  
  if (widthInput) widthInput.value = width;
  if (heightInput) heightInput.value = height;
  
  const areaElement = document.getElementById('area');
  if (areaElement) {
    areaElement.textContent = `${width * height}`;
  }
}

// --- Show color usage ---
function showColorUsage(colorCounts) {
  debugLog("Showing color usage");
  
  const colorListDiv = document.getElementById('color-list');
  if (!colorListDiv) return;
  
  colorListDiv.innerHTML = '';
  let colorList = [];
  
  padrao.forEach(([r, g, b]) => {
    const key = `${r},${g},${b}`;
    const count = colorCounts[key];
    if (count === undefined) return;
    colorList.push({ r, g, b, count, name: colorNames[key] });
  });
  
  colorList.sort((a, b) => b.count - a.count);
  
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

// --- Apply scale ---
function applyScale() {
  debugLog("Applying scale");
  
  if (!originalImage || !canvas || !ctx) {
    console.error("Cannot apply scale - missing required elements");
    return;
  }
  
  const scale = parseFloat(scaleRange.value);
  const newWidth = Math.round(currentImageWidth * scale);
  const newHeight = Math.round(currentImageHeight * scale);
  
  debugLog(`Scaling to: ${newWidth}x${newHeight} (scale: ${scale})`);
  
  // Update canvas size
  canvas.width = newWidth;
  canvas.height = newHeight;
  
  // Draw scaled image
  ctx.clearRect(0, 0, newWidth, newHeight);
  ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);
  
  // Process the scaled image
  processarImagem();
}

// --- Apply preview (zoom) ---
function applyPreview() {
  debugLog("Applying preview/zoom");
  
  if (!processedCanvas || !canvas || !ctx) {
    console.warn("Cannot apply preview - missing processed canvas or context");
    return;
  }
  
  const zoom = parseFloat(zoomRange.value);
  const pw = Math.round(processedCanvas.width * zoom);
  const ph = Math.round(processedCanvas.height * zoom);
  
  debugLog(`Zooming to: ${pw}x${ph} (zoom: ${zoom})`);
  
  canvas.width = pw;
  canvas.height = ph;
  ctx.clearRect(0, 0, pw, ph);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(processedCanvas, 0, 0, processedCanvas.width, processedCanvas.height, 0, 0, pw, ph);
  ctx.imageSmoothingEnabled = true;
}

// --- Calculate height from width maintaining aspect ratio ---
function calculateHeightFromWidth(width) {
  if (!originalImage || originalImageAspectRatio === 0) return width;
  return Math.round(width / originalImageAspectRatio);
}

// --- Calculate width from height maintaining aspect ratio ---
function calculateWidthFromHeight(height) {
  if (!originalImage || originalImageAspectRatio === 0) return height;
  return Math.round(height * originalImageAspectRatio);
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  debugLog("Setting up event listeners");
  
  if (!upload || !canvas || !ctx || !widthInput || !heightInput || !scaleRange || !zoomRange) {
    console.error("Cannot setup event listeners - missing required elements");
    return;
  }
  
  // File upload
  upload.addEventListener('change', function(e) {
    debugLog("File selected");
    const file = e.target.files[0];
    if (!file) return;
    
    fileName = file.name;
    const reader = new FileReader();
    
    reader.onload = function(evt) {
      const img = new Image();
      img.onload = function() {
        debugLog(`Image loaded: ${img.width}x${img.height}`);
        
        originalImage = img;
        currentImageWidth = img.width;
        currentImageHeight = img.height;
        
        // Calcola e memorizza l'aspect ratio originale
        originalImageAspectRatio = img.width / img.height;
        debugLog(`Original aspect ratio: ${originalImageAspectRatio}`);
        
        // Set canvas to original size
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // Reset controls
        scaleRange.value = 1.0;
        scaleValue.textContent = '1.00x';
        zoomRange.value = 1.0;
        zoomValue.textContent = '1.00x';
        
        // Process image
        processarImagem();
        
        debugLog("Image setup completed");
      };
      
      img.onerror = function() {
        console.error("Failed to load image");
      };
      
      img.src = evt.target.result;
    };
    
    reader.onerror = function() {
      console.error("Failed to read file");
    };
    
    reader.readAsDataURL(file);
  });
  
  // Width input - con mantenimento aspect ratio
  widthInput.addEventListener('input', function() {
    if (!originalImage || isUpdatingFromAspectRatio) return;
    
    const rawW = parseInt(this.value, 10);
    if (isNaN(rawW) || rawW < 1) {
      this.value = currentImageWidth;
      return;
    }
    
    // Imposta il flag per prevenire loop
    isUpdatingFromAspectRatio = true;
    
    // Calcola l'altezza corrispondente per mantenere l'aspect ratio
    const newHeight = calculateHeightFromWidth(rawW);
    
    // Aggiorna i valori
    currentImageWidth = rawW;
    currentImageHeight = newHeight;
    
    // Aggiorna l'input dell'altezza
    heightInput.value = newHeight;
    
    // Aggiorna le informazioni
    showImageInfo(currentImageWidth, currentImageHeight);
    
    // Resetta il flag
    isUpdatingFromAspectRatio = false;
    
    // Applica le modifiche
    applyScale();
    applyPreview();
  });
  
  // Height input - con mantenimento aspect ratio
  heightInput.addEventListener('input', function() {
    if (!originalImage || isUpdatingFromAspectRatio) return;
    
    const rawH = parseInt(this.value, 10);
    if (isNaN(rawH) || rawH < 1) {
      this.value = currentImageHeight;
      return;
    }
    
    // Imposta il flag per prevenire loop
    isUpdatingFromAspectRatio = true;
    
    // Calcola la larghezza corrispondente per mantenere l'aspect ratio
    const newWidth = calculateWidthFromHeight(rawH);
    
    // Aggiorna i valori
    currentImageWidth = newWidth;
    currentImageHeight = rawH;
    
    // Aggiorna l'input della larghezza
    widthInput.value = newWidth;
    
    // Aggiorna le informazioni
    showImageInfo(currentImageWidth, currentImageHeight);
    
    // Resetta il flag
    isUpdatingFromAspectRatio = false;
    
    // Applica le modifiche
    applyScale();
    applyPreview();
  });
  
  // Scale slider
  scaleRange.addEventListener('input', function() {
    scaleValue.textContent = parseFloat(this.value).toFixed(2) + 'x';
  });
  
  scaleRange.addEventListener('change', function() {
    if (originalImage) {
      applyScale();
      applyPreview();
    }
  });
  
  // Zoom slider
  zoomRange.addEventListener('input', function() {
    zoomValue.textContent = parseFloat(this.value).toFixed(2) + 'x';
    if (originalImage) {
      applyPreview();
    }
  });
  
  // Clipboard functionality
  const clipboardBtn = document.getElementById('clipboard');
  if (clipboardBtn) {
    clipboardBtn.addEventListener('click', async function() {
      if (!canvas) return;
      
      try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        
        // Show success message
        const originalText = this.textContent;
        this.textContent = 'Image copied!';
        this.style.background = '#D60270';
        this.style.color = '#fff';
        
        setTimeout(() => {
          this.textContent = originalText;
          this.style.background = '';
          this.style.color = '';
        }, 1800);
      } catch (err) {
        console.error('Failed to copy image:', err);
      }
    });
  }
  
  // Transparent button
  const transparentBtn = document.getElementById('transparentButton');
  if (transparentBtn) {
    transparentBtn.addEventListener('click', function() {
      this.classList.toggle('active');
      localStorage.setItem('transparentHide', this.classList.contains('active'));
      
      if (originalImage) {
        applyScale();
        applyPreview();
      }
    });
  }
  
  debugLog("Event listeners setup completed");
}

// --- Setup color buttons ---
function setupColorButtons() {
  debugLog("Setting up color buttons");
  
  // Load saved colors
  const savedColors = JSON.parse(localStorage.getItem('activeColors') || '[]');
  savedColors.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.add('active');
  });
  
  // Load transparent button state
  const transparentBtn = document.getElementById('transparentButton');
  if (transparentBtn && localStorage.getItem('transparentHide') === 'true') {
    transparentBtn.classList.add('active');
  }
  
  // Setup color button clicks
  const colorButtons = document.querySelectorAll('#colors .toggle-color');
  colorButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      this.classList.toggle('active');
      updatePadraoFromActiveButtons();
      
      if (originalImage) {
        applyScale();
        applyPreview();
      }
    });
  });
  
  // Setup master buttons
  setupMasterButtons();
  
  // Initialize color palette
  updatePadraoFromActiveButtons();
  
  debugLog("Color buttons setup completed");
}

// --- Setup master buttons ---
function setupMasterButtons() {
  // Free colors master button
  const freeMasterBtn = document.getElementById('unselect-all-free');
  const freeButtons = Array.from(document.querySelectorAll('button.toggle-color[data-type="free"]:not(#unselect-all-free)'));
  
  if (freeMasterBtn && freeButtons.length > 0) {
    freeMasterBtn.addEventListener('click', function() {
      const allActive = freeButtons.every(b => b.classList.contains('active'));
      freeButtons.forEach(b => b.classList.toggle('active', !allActive));
      updatePadraoFromActiveButtons();
      
      if (originalImage) {
        applyScale();
        applyPreview();
      }
    });
  }
  
  // Paid colors master button
  const paidMasterBtn = document.getElementById('select-all-paid');
  const paidButtons = Array.from(document.querySelectorAll('button.toggle-color[data-type="paid"]:not(#select-all-paid)'));
  
  if (paidMasterBtn && paidButtons.length > 0) {
    paidMasterBtn.addEventListener('click', function() {
      const allActive = paidButtons.every(b => b.classList.contains('active'));
      paidButtons.forEach(b => b.classList.toggle('active', !allActive));
      updatePadraoFromActiveButtons();
      
      if (originalImage) {
        applyScale();
        applyPreview();
      }
    });
  }
}

// --- Initialize everything when DOM is loaded ---
document.addEventListener('DOMContentLoaded', function() {
  debugLog("DOM loaded, initializing application");
  
  try {
    // Initialize DOM elements
    if (!initializeDOMElements()) {
      console.error("Failed to initialize DOM elements");
      return;
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup color buttons
    setupColorButtons();
    
    // Setup language selector (if exists)
    setupLanguageSelector();
    
    debugLog("Application initialized successfully");
    
    // Show ready message
    console.log("%cWplace Color Converter is ready!", "color: #00eaff; font-size: 16px; font-weight: bold;");
    
  } catch (error) {
    console.error("Failed to initialize application:", error);
  }
});

// --- Language selector setup ---
function setupLanguageSelector() {
  const langSelect = document.getElementById('lang-select');
  if (!langSelect) return;
  
  // Load saved language
  const savedLang = localStorage.getItem('lang') || 'en';
  langSelect.value = savedLang;
  
  langSelect.addEventListener('change', function() {
    localStorage.setItem('lang', this.value);
    // In a real implementation, you would reload the page or update translations
    console.log(`Language changed to: ${this.value}`);
  });
}

// --- Paste functionality ---
document.addEventListener('paste', function(event) {
  debugLog("Paste event detected");
  
  if (!event.clipboardData) return;
  
  const items = event.clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const file = items[i].getAsFile();
      if (file && upload) {
        // Create a new FileList-like object
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        upload.files = dataTransfer.files;
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        upload.dispatchEvent(event);
        
        event.preventDefault();
        break;
      }
    }
  }
});

// --- Global error handling ---
window.addEventListener('error', function(event) {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
});
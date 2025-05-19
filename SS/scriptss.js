// We have only one dataBlock in our array:
let dataBlocks = [
  { id: "dataBlock1", x: 1250, y: 150, w: 300, h: 150, label: "data" }
];

let canvas;

// This array will hold the "active" arrows we want to draw.
let activeArrows = [];

// Show indirect arrow by default
let indirectArrowVisible = true;
let indirectArrow = [{ start: "indirectRow", end: "indBlockAddr1" }];

// Initially, the data block is hidden
let showDataBlock = false; 

let movingData = null;

let animationInProgress = false;

let fileImg;

// Language support variables
let currentLanguage = 'en'; // Default language is English
let translations = {}; // Object to hold loaded translations
let isLanguageLoaded = false; // Flag to track if language file is loaded

// Function to load language data from JSON file
function loadLanguage(lang) {
  fetch(`lang/${lang}.json`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      translations[lang] = data;
      
      // If this is the current language, update UI
      if (lang === currentLanguage) {
        updateUILanguage();
        isLanguageLoaded = true;
      }
    })
    .catch(error => {
      console.error(`Error loading language file ${lang}.json:`, error);
      // Fall back to English if there's an error
      if (lang !== 'en') {
        loadLanguage('en');
        currentLanguage = 'en';
      }
    });
}

// Load both language files at startup
document.addEventListener('DOMContentLoaded', () => {
  // Check for saved language preference
  const savedLanguage = localStorage.getItem('preferredLanguage');
  if (savedLanguage) {
    currentLanguage = savedLanguage;
    document.getElementById('currentLanguage').textContent = 
      savedLanguage === 'en' ? 'English' : 'Slovenčina';
  }
  
  loadLanguage('en');
  loadLanguage('sk');
});

// Function to change the language
function changeLanguage(lang) {
  currentLanguage = lang;
  
  // Update the language indicator in the UI
  document.getElementById('currentLanguage').textContent = lang === 'en' ? 'English' : 'Slovenčina';
  
  // Make sure the language is loaded
  if (!translations[lang]) {
    loadLanguage(lang);
    return; // Will be called again when language is loaded
  }
  
  // Update UI elements with new language
  updateUILanguage();
  
  // Save language preference in localStorage
  localStorage.setItem('preferredLanguage', lang);
}

// Function to update UI elements with the selected language
function updateUILanguage() {
  // Skip if translations aren't loaded yet
  if (!translations[currentLanguage]) return;
  
  // Update navbar elements
    document.querySelector('.navbar-brand').textContent = translations[currentLanguage].nav.title;
    document.querySelector('a.nav-link[href="../index.html"]').textContent = translations[currentLanguage].nav.virtualMemory;
    document.querySelector('.nav-link.dropdown-toggle').textContent = translations[currentLanguage].nav.fileSystem;
    
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems[0].textContent = translations[currentLanguage].nav.fileSystemIndirect;
    dropdownItems[1].textContent = translations[currentLanguage].nav.fileSystemDindirect;
    dropdownItems[2].textContent = translations[currentLanguage].nav.fileSystemSize;
    
    document.querySelector('a.nav-link[href="../MMAP/Mmap.html"]').textContent = translations[currentLanguage].nav.mmap;
  
  // Update legend
  const legendButton = document.querySelector('.legend-toggle');
  if (legendButton) {
    const legendIcon = legendButton.querySelector('i');
    if (legendIcon) {
      legendButton.textContent = '';
      legendButton.appendChild(legendIcon);
      legendButton.appendChild(document.createTextNode(' ' + translations[currentLanguage].legend.title));
    }
  }
  
  const legendTitle = document.querySelector('.card-title');
  if (legendTitle) legendTitle.textContent = translations[currentLanguage].legend.title;
  
  // Update legend items
  const legendItems = document.querySelectorAll('.legend-content ul li');
  legendItems.forEach(item => {
    const strong = item.querySelector('strong');
    if (strong) {
      const key = strong.textContent.trim();
      if (key === 'GČB' || key === 'GBN') {
        item.innerHTML = `<strong>${translations[currentLanguage].tableHeaders.GCB}</strong> - ${translations[currentLanguage].legendItems.GCB}`;
      } else if (key === 'LČB' || key === 'LBN') {
        item.innerHTML = `<strong>${translations[currentLanguage].tableHeaders.LCB}</strong> - ${translations[currentLanguage].legendItems.LCB}`;
      }
    }
  });
  
  // Update table headers
  const tableHeaders = document.querySelectorAll('h5.text-primary');
  tableHeaders.forEach(header => {
    const text = header.textContent.trim();
    if (text === 'Dinode') {
      header.textContent = translations[currentLanguage].dinode.title;
    } else if (text === 'Indirect Block' || text === 'Nepriamy Blok') {
      header.textContent = translations[currentLanguage].indirectBlock.title;
    }
  });
  
  // Update table column headers
  const gcbHeader = document.querySelector('#gcb-header');
  if (gcbHeader) {
    gcbHeader.textContent = translations[currentLanguage].tableHeaders.GCB;
  }
  
  const dinodeGcbHeader = document.querySelector('#dinode-gcb-header');
  if (dinodeGcbHeader) {
    dinodeGcbHeader.textContent = translations[currentLanguage].tableHeaders.GCB;
  }
  
  const lcbHeader = document.querySelector('#lcb-header');
  if (lcbHeader) {
    lcbHeader.textContent = translations[currentLanguage].tableHeaders.LCB;
  }
  
  // Update tooltip content
  const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltips.forEach(tooltip => {
    if (tooltip.querySelector('span')?.textContent.includes('GBN') || 
        tooltip.querySelector('span')?.textContent.includes('GČB')) {
      tooltip.setAttribute('data-bs-original-title', translations[currentLanguage].glossary.GCB);
    } else if (tooltip.querySelector('span')?.textContent.includes('LBN') || 
               tooltip.querySelector('span')?.textContent.includes('LČB')) {
      tooltip.setAttribute('data-bs-original-title', translations[currentLanguage].glossary.LCB);
    }
  });
  
  // Update table cell text for dinode rows
  const dinodeRows = {
    'typeRow': translations[currentLanguage].dinode.type,
    'majorRow': translations[currentLanguage].dinode.major,
    'minorRow': translations[currentLanguage].dinode.minor,
    'nlinkRow': translations[currentLanguage].dinode.nlink,
    'sizeRow': translations[currentLanguage].dinode.size,
    'addr1Row': `${translations[currentLanguage].dinode.address} 1`,
    'addr2Row': `${translations[currentLanguage].dinode.address} 2`,
    'addr12Row': `${translations[currentLanguage].dinode.address} 12`,
    'indirectRow': translations[currentLanguage].dinode.addressIndirect
  };
  
  for (const [id, text] of Object.entries(dinodeRows)) {
    const row = document.getElementById(id);
    if (row) {
      const cell = row.querySelector('td:first-child');
      if (cell) cell.textContent = text;
    }
  }
  
  // Re-initialize tooltips to update their content
  refreshTooltips();
}

// Function to highlight a row with grey background
function highlightRow(rowId, highlight) {
  const row = document.getElementById(rowId);
  if (row) {
    if (highlight) {
      row.style.backgroundColor = "#e0e0e0"; // Light grey color
    } else {
      row.style.backgroundColor = ""; // Reset to default
    }
  }
}

// Clear all highlighted rows
function clearAllHighlights() {
  const rowIds = ["addr1Row", "addr2Row", "addr12Row", "indirectRow", 
                  "indBlockAddr1", "indBlockAddr2", "indBlockAddr256"];
  rowIds.forEach(id => highlightRow(id, false));
}

// Update row highlights based on active arrows
function updateRowHighlights() {
  clearAllHighlights();
  
  // Highlight rows with active arrows
  activeArrows.forEach(arrow => {
    highlightRow(arrow.start, true);
  });
  
  // Highlight rows with indirect arrows
  indirectArrow.forEach(arrow => {
    highlightRow(arrow.start, true);
  });
}

function preload() {
  fileImg = loadImage("hdd.png"); // Ensure you have a file image named 'file.png'
}


function setup() {
  // Create a canvas that spans the full page behind content
  canvas = createCanvas(windowWidth, document.body.scrollHeight);
  canvas.id("arrowCanvas");

  // Prevent canvas from capturing all mouse clicks
  canvas.style("pointer-events", "none");
  console.log("Canvas pointer-events set to none");

  // Add click listeners for each row you want to connect
  const row1 = document.getElementById("addr1Row");
  const row2 = document.getElementById("addr2Row");
  const row12 = document.getElementById("addr12Row");
  const indirectRow = document.getElementById("indirectRow");
  const indBlockAddr1 = document.getElementById("indBlockAddr1");
  const indBlockAddr2 = document.getElementById("indBlockAddr2");
  const indBlockAddr256 = document.getElementById("indBlockAddr256");

  if (row1) {
    console.log("addr1Row element found");
    row1.addEventListener("click", () => {
      console.log("addr1Row clicked");
      startDataMove("addr1Row", "dataBlock1");
    });
  }

  if (row2) {
    console.log("addr2Row element found");
    row2.addEventListener("click", () => {
      console.log("addr2Row clicked");
      startDataMove("addr2Row", "dataBlock1");
    });
  }

  if (row12) {
    console.log("addr12Row element found");
    row12.addEventListener("click", () => {
      console.log("addr12Row clicked");
      startDataMove("addr12Row", "dataBlock1");
    });
  }

  if (indirectRow) {
    console.log("indirectRow element found");
    indirectRow.addEventListener("click", () => {
      console.log("indirectRow clicked");
      // No action needed when clicked
    });
  }

  if (indBlockAddr1) {
    console.log("indBlockAddr1 element found");
    indBlockAddr1.addEventListener("click", () => {
      console.log("indBlockAddr1 clicked");
      startDataMove("indBlockAddr1", "dataBlock1");
    });
  }

  if (indBlockAddr2) {
    console.log("indBlockAddr2 element found");
    indBlockAddr2.addEventListener("click", () => {
      console.log("indBlockAddr2 clicked");
      startDataMove("indBlockAddr2", "dataBlock1");
    });
  }

  if (indBlockAddr256) {
    console.log("indBlockAddr256 element found");
    indBlockAddr256.addEventListener("click", () => {
      console.log("indBlockAddr256 clicked");
      startDataMove("indBlockAddr256", "dataBlock1");
    });
  }
}

function draw() {
  // Clear background each frame
  clear();
  
  // Update data block label with translation if available
  if (translations[currentLanguage] && dataBlocks[0]) {
    dataBlocks[0].label = translations[currentLanguage].data;
  }
  
  // Draw the data block only if it is visible
  if (showDataBlock) {
    for (let block of dataBlocks) {
      drawDataBlock(block);
    }

    // Draw arrows only when the data block is visible
    for (let arrow of activeArrows) {
      drawArrowFromRowToBlock(arrow.start, arrow.end, 0, 0);
    }
  }

  // Always draw indirect arrows, regardless of showDataBlock state
  for (let arrow of indirectArrow) {
    drawArrowFromRowToBlock(arrow.start, arrow.end, 0, 150);
  }

  // Draw moving data if animation is in progress
  if (movingData) {
    push();
    translate(movingData.x, movingData.y);
    rotate(radians(movingData.rotation));
    
    // Draw animated data block
    drawingContext.shadowOffsetX = 3;
    drawingContext.shadowOffsetY = 3;
    drawingContext.shadowBlur = 8;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.2)';
    
    // Create gradient for the moving block
    let gradient = drawingContext.createRadialGradient(0, 0, 0, 0, 0, movingData.size/1.5);
    gradient.addColorStop(0, '#e6f2ff');
    gradient.addColorStop(1, '#b8daff');
    
    drawingContext.fillStyle = gradient;
    
    // Draw rounded rectangle
    drawingContext.beginPath();
    drawingContext.roundRect(-movingData.size/2, -movingData.size/2, movingData.size, movingData.size, 15);
    drawingContext.fill();
    
    // Add border
    drawingContext.strokeStyle = '#0d6efd';
    drawingContext.lineWidth = 2;
    drawingContext.stroke();
    
    // Add text
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 0;
    drawingContext.shadowBlur = 0;
    fill(40, 40, 40);
    textAlign(CENTER, CENTER);
    textSize(movingData.size/5);
    textStyle(BOLD);
    if (translations[currentLanguage]) {
      text(translations[currentLanguage].data, 0, 0);
    } else {
      text("data", 0, 0);
    }
    
    // Add binary data visual
    textSize(movingData.size/10);
    textStyle(NORMAL);
    text("0101", 0, -15);
    text("1010", 0, 15);
    
    pop();
    
    moveData();
  }

  // Draw the file image as the data source
  let imgX = min(width - 220, 1310);
  let imgY = 525;
  image(fileImg, imgX, imgY, 180, 190);
}

// Draw the data block rectangle with text
function drawDataBlock(block) {
  // Add shadow effect
  drawingContext.shadowOffsetX = 5;
  drawingContext.shadowOffsetY = 5;
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.3)';
  
  // Gradient background for the block
  let gradient = drawingContext.createLinearGradient(block.x, block.y, block.x, block.y + block.h);
  gradient.addColorStop(0, '#f8f9fa');
  gradient.addColorStop(1, '#e9ecef');
  
  drawingContext.fillStyle = gradient;
  
  // Draw rounded rectangle with border
  drawingContext.beginPath();
  drawingContext.roundRect(block.x, block.y, block.w, block.h, 15);
  drawingContext.fill();
  
  // Add border
  drawingContext.strokeStyle = '#0d6efd';
  drawingContext.lineWidth = 2;
  drawingContext.stroke();
  
  // Reset shadow for text
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 0;
  drawingContext.shadowBlur = 0;
  
  // Add text with better styling
  fill(40, 40, 40);
  textSize(32);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  text(block.label, block.x + block.w / 2, block.y + block.h / 2);
  
  // Add a small icon/visual to make it look like a data block
  textSize(16);
  textStyle(NORMAL);
  text("0101010110101", block.x + block.w / 2, block.y + block.h / 2 - 30);
  text("1010101001010", block.x + block.w / 2, block.y + block.h / 2 + 30);
}

// Start animation of moving data
function startDataMove(startElemId, targetBlockId) {
  if (animationInProgress) return;
  
  // Don't react to clicks on indirectRow
  if (startElemId === "indirectRow") return;
  
  animationInProgress = true;

  // Add visual feedback that the row was clicked
  const startElem = document.getElementById(startElemId);
  if (startElem) {
    startElem.style.transition = 'background-color 0.3s';
    startElem.style.backgroundColor = '#cfe2ff'; // Light blue background
    setTimeout(() => {
      startElem.style.backgroundColor = '';
    }, 300);
  }

  // Hide the data block first
  showDataBlock = false;
  movingData = {
      x: dataBlocks[0].x + dataBlocks[0].w / 2,
      y: dataBlocks[0].y + dataBlocks[0].h / 2,
      targetX: 1400,
      targetY: 670,
      phase: "backToFile", // First phase: moving back to the file
      source: startElemId,
      size: 100, // Starting size
      targetSize: 50, // Make it smaller when moving to file
      rotation: 0 // Add rotation for more dynamic animation
  };
}

// Move data smoothly toward target
function moveData() {
  if (!movingData) return;

  movingData.x += (movingData.targetX - movingData.x) * 0.1;
  movingData.y += (movingData.targetY - movingData.y) * 0.1;
  
  // Animate size
  movingData.size += (movingData.targetSize - movingData.size) * 0.1;
  
  // Add slight rotation for more dynamic movement
  movingData.rotation = sin(frameCount * 0.05) * 5;

  if (abs(movingData.x - movingData.targetX) < 1 && abs(movingData.y - movingData.targetY) < 1) {
      if (movingData.phase === "backToFile") {
          // Instead of clearing all highlights, only clear the active arrow highlights
          // but preserve the indirect arrow highlights
          
          // First save which rows have indirect arrows
          let indirectHighlightedRows = [];
          indirectArrow.forEach(arrow => {
              indirectHighlightedRows.push(arrow.start);
          });
          
          // Clear all highlights
          clearAllHighlights();
          
          // Restore indirect arrow highlights
          indirectHighlightedRows.forEach(rowId => {
              highlightRow(rowId, true);
          });
          
          // Pause briefly before the next phase
          setTimeout(() => {
              movingData = {
                  x: 1400,
                  y: 670,
                  targetX: dataBlocks[0].x + dataBlocks[0].w / 2,
                  targetY: dataBlocks[0].y + dataBlocks[0].h / 2,
                  phase: "toDataBlock",
                  source: movingData.source,
                  size: 50, // Start with the small size
                  targetSize: 100, // Grow to normal size when moving up
                  rotation: 0
              };
          }, 100);
      } else if (movingData.phase === "toDataBlock") {
          // Animation complete, show data block and arrows
          showDataBlock = true;
          activeArrows = [];
          activeArrows.push({ start: movingData.source, end: "dataBlock1" });
          movingData = null;
          animationInProgress = false;
          
          // Update row highlights based on new activeArrows
          updateRowHighlights();
      }
  }
}

// Draw arrow from row to block
function drawArrowFromRowToBlock(startElemId, endElemId, offsetStart, offsetEnd) {
  const startElem = document.getElementById(startElemId);
  if (!startElem) return;

  // Get the center of the start table cell
  let startRect = startElem.getBoundingClientRect();
  let startX = startRect.left + startRect.width / 2 + 150;
  let startY = startRect.top + startRect.height / 2 + window.scrollY;


  const endElem = document.getElementById(endElemId);
  if (endElem) {
    // If there's a real element with that ID
    let endRect = endElem.getBoundingClientRect();
    let endX = endRect.left + endRect.width / 2;
    let endY = endRect.top + endRect.height / 2 + window.scrollY;
    lineWithArrowhead(startX, startY, endX - offsetEnd, endY);
  } else {
    // Otherwise, check dataBlocks array
    let block = dataBlocks.find(b => b.id === endElemId);
    if (!block) return;
    let blockCenterX = block.x + block.w / 2;
    let blockCenterY = block.y + block.h / 2;
    lineWithArrowhead(startX, startY, blockCenterX - 50, blockCenterY);
  }

  // Enhanced arrow styling
  if (startElemId === "indirectRow" || endElemId === "indBlockAddr1") {
    // Indirect arrows visually distinct
    stroke(70, 130, 180); // Steel blue color
    strokeWeight(2.5);
  } else {
    // Regular arrows
    stroke(0, 0, 0);
    strokeWeight(2);
  }
}

// Draw line + arrowhead from (x1,y1) to (x2,y2)
function lineWithArrowhead(x1, y1, x2, y2) {
  // Draw a bezier curve instead of straight line for more organic look
  noFill();
  let midX = (x1 + x2) / 2;
  let midY = (y1 + y2) / 2;
  let controlY = midY - 20; // Curve control point
  
  beginShape();
  vertex(x1, y1);
  quadraticVertex(midX, controlY, x2, y2);
  endShape();

  // Draw arrowhead
  push();
  translate(x2, y2);
  let angle = atan2(y2 - controlY, x2 - midX);
  rotate(angle);
  let arrowSize = 10;
  fill(0);
  noStroke();
  triangle(0, 0, -arrowSize, -arrowSize / 2, -arrowSize, arrowSize / 2);
  pop();
}

// Initialize tooltips
function initTooltips() {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  
  Array.from(tooltipTriggerList).forEach(tooltipTriggerEl => {
    // Dispose existing tooltip if it exists to prevent duplicates
    const tooltip = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
    if (tooltip) tooltip.dispose();
    
    // Create new tooltip
    new bootstrap.Tooltip(tooltipTriggerEl, {
      html: true,
      trigger: 'hover focus',
      container: 'body',
      boundary: 'window',
      template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner" style="max-width: 300px;"></div></div>'
    });
  });
}

// Function to refresh tooltips after language change
function refreshTooltips() {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  
  tooltipTriggerList.forEach(tooltipTriggerEl => {
    // Get the current tooltip instance
    const tooltipInstance = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
    
    // If tooltip exists, dispose it first
    if (tooltipInstance) {
      tooltipInstance.dispose();
    }
    
    // Create new tooltip
    new bootstrap.Tooltip(tooltipTriggerEl, {
      html: true,
      trigger: 'hover focus',
      container: 'body',
      boundary: 'window'
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips with HTML support and custom options
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl, {
      html: true,
      template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner" style="max-width: 300px;"></div></div>'
    });
  });
  
  // Make sure Bootstrap Icons are loaded
  const linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  linkElement.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css';
  document.head.appendChild(linkElement);
  
  // Replace jQuery-style selector with proper querySelector
  const gcbHeader = document.querySelector('th:nth-child(1)');
  const lcbHeader = document.querySelector('th:nth-child(2)');
  const dinodeGcbHeader = document.querySelector('#dinode-gcb-header').closest('th');
  
  if (gcbHeader) {
    gcbHeader.style.cursor = 'pointer';
    gcbHeader.addEventListener('mouseenter', function() {
      const tooltipIcon = this.querySelector('[data-bs-toggle="tooltip"]');
      if (tooltipIcon) {
        const tooltip = bootstrap.Tooltip.getInstance(tooltipIcon);
        if (tooltip) {
          tooltip.show();
        }
      }
    });
    
    gcbHeader.addEventListener('mouseleave', function() {
      const tooltipIcon = this.querySelector('[data-bs-toggle="tooltip"]');
      if (tooltipIcon) {
        const tooltip = bootstrap.Tooltip.getInstance(tooltipIcon);
        if (tooltip) {
          tooltip.hide();
        }
      }
    });
  }
  
  if (dinodeGcbHeader) {
    dinodeGcbHeader.style.cursor = 'pointer';
    dinodeGcbHeader.addEventListener('mouseenter', function() {
      const tooltipIcon = this.querySelector('[data-bs-toggle="tooltip"]');
      if (tooltipIcon) {
        const tooltip = bootstrap.Tooltip.getInstance(tooltipIcon);
        if (tooltip) {
          tooltip.show();
        }
      }
    });
    
    dinodeGcbHeader.addEventListener('mouseleave', function() {
      const tooltipIcon = this.querySelector('[data-bs-toggle="tooltip"]');
      if (tooltipIcon) {
        const tooltip = bootstrap.Tooltip.getInstance(tooltipIcon);
        if (tooltip) {
          tooltip.hide();
        }
      }
    });
  }
  
  if (lcbHeader) {
    lcbHeader.style.cursor = 'pointer';
    lcbHeader.addEventListener('mouseenter', function() {
      const tooltipIcon = this.querySelector('[data-bs-toggle="tooltip"]');
      if (tooltipIcon) {
        const tooltip = bootstrap.Tooltip.getInstance(tooltipIcon);
        if (tooltip) {
          tooltip.show();
        }
      }
    });
    
    lcbHeader.addEventListener('mouseleave', function() {
      const tooltipIcon = this.querySelector('[data-bs-toggle="tooltip"]');
      if (tooltipIcon) {
        const tooltip = bootstrap.Tooltip.getInstance(tooltipIcon);
        if (tooltip) {
          tooltip.hide();
        }
      }
    });
  }
  
  // Initialize the legend collapse functionality
  const legendToggle = document.querySelector('.legend-toggle');
  const legendContent = document.getElementById('legendContent');
  
  if (legendToggle && legendContent) {
    // Close the legend when clicking outside of it
    document.addEventListener('click', function(event) {
      if (!legendToggle.contains(event.target) && !legendContent.contains(event.target) && legendContent.classList.contains('show')) {
        const bsCollapse = new bootstrap.Collapse(legendContent);
        bsCollapse.hide();
      }
    });
  }
  
  // Add global function for language changing
  window.changeLanguage = changeLanguage;
});

// Keep canvas size in sync with window size
function windowResized() {
  resizeCanvas(windowWidth, document.body.scrollHeight);
}
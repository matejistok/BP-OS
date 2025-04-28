// Constants for colors and sizing
const COLORS = {
  virtualAddress: { fill: [173, 216, 230], stroke: [0, 0, 0] },
  physicalAddress: { fill: [250, 128, 114], stroke: [0, 0, 0] },
  pageDirectory: { fill: [240, 240, 240], stroke: [0, 0, 0] },
  disabledDirectory: { fill: [245, 245, 245], stroke: [150, 150, 150] },
  highlight: { fill: [255, 255, 0, 150], stroke: [0, 0, 0] },
  arrows: {
    blue: [0, 0, 255],
    red: [255, 0, 0]
  },
  textColor: [0, 0, 0]
};

const SIZES = {
  text: 14,
  arrowhead: 8
};

// App state variables
let hoverElements = [];
let editableElements = {
  L2: '9',
  L1: '9',
  L0: '9',
  L2Index: '10',
  L1Index: '11',
  L0Index: '12',
  PPN1: '0x1A2B',
  PPN2: '0x3C4D',
  PPN3: '0x5E6F',
  SATP: '0x7F8A',
  Memory: '512'
};
let activeElement = null;
let l1Changed = false;
let showArrows = false;
let modals = {};
let showAllModals = false;
let highlightPage = false;
let ArrowsPositions = {
  pageDirectory1L2: { y: 360 },
  pageDirectory1L2Index: { y: 400 },
  pageDirectory1L1: { y: 360 },
  pageDirectory1L1Index: { y: 400 },
  pageDirectory1L0: { y: 360 },
  pageDirectory1L0Index: { y: 400 },
};
let canvas;

// Initialize canvas and UI elements
function setup() {
  // Create canvas that fits the document
  canvas = createCanvas(windowWidth, document.body.scrollHeight);
  canvas.id("Canvas");
  canvas.style("z-index", "-1");
  canvas.position(0, 50);
  background(255);
  textSize(SIZES.text);

  // Create UI buttons with consistent styling
  createUIButtons();

  // Initialize all visual components
  drawVirtualAddress(width * 0.025, height * 0.008);
  drawPageDirectory(width * 0.07, height * 0.285, parseInt(editableElements.L2), parseInt(editableElements.L2Index), editableElements.SATP, 220, 'PPN1', 'PD1');
  drawPageDirectory(width * 0.27, height * 0.285, parseInt(editableElements.L1), parseInt(editableElements.L1Index), editableElements.PPN1, 220, 'PPN2', 'PD2');
  drawPageDirectory(width * 0.47, height * 0.285, parseInt(editableElements.L0), parseInt(editableElements.L0Index), editableElements.PPN2, 220, 'PPN3', 'PD3');
  drawPhysicalAddress(width * 0.635, height * 0.07);
  drawVirtualMemorySpace(width * 0.8, height * 0.07); 
  drawSATP(width * 0.033, height * 0.857);
  
  // Create help modals
  createHelpModals();
}

function createUIButtons() {
  // Button to toggle arrows with improved styling
  let toggleArrowsButton = createButton('Šípky');
  toggleArrowsButton.position(width - 120, 70);
  toggleArrowsButton.addClass('ui-button');
  toggleArrowsButton.mousePressed(() => {
    showArrows = !showArrows;
    redraw();
  });

  // Button to toggle all modals with improved styling
  let toggleButton = createButton('Pomoc');
  toggleButton.position(width - 60, 70);
  toggleButton.addClass('ui-button');
  toggleButton.mousePressed(() => toggleAllModals());
}

function draw() {
  clear();
  background(255);
  
  // Draw main elements
  drawVirtualAddress(width * 0.025, height * 0.08);
  drawSATP(width * 0.033, height * 0.857);

  // Update state based on editable elements
  updatePageDirectoryState();

  // Draw page directories based on current state
  drawPageDirectories();
  
  // Draw physical address and virtual memory space
  drawPhysicalAddress(width * 0.635, height * 0.07);
  drawVirtualMemorySpace(width * 0.8, height * 0.07);

  // Handle hover highlights and interactions
  handleHoverEffects();

  // Draw arrows if enabled
  if (showArrows) {
    drawArrows();
  }
}

function updatePageDirectoryState() {
  // Update state for L2
  if (editableElements.L2 === '0') {
    editableElements.PPN1 = '';
    editableElements.L2Index = '';
  } else if (editableElements.L2 !== '0' && editableElements.L2Index === '') {
    editableElements.PPN1 = '1A2B';
  }
  
  // Update state for L1
  if (editableElements.L1 === '0') {
    editableElements.PPN2 = '';
    editableElements.L1Index = '';
  } else if (editableElements.L1 !== '0' && editableElements.L1Index === '') {
    editableElements.PPN2 = '3C4D';
  }
  
  // Update state for L0
  if (editableElements.L0 === '0') {
    editableElements.PPN3 = '';
    editableElements.L0Index = '';
  } else if (editableElements.L0 !== '0' && editableElements.L0Index === '') {
    editableElements.PPN3 = '5E6F';
  }

  // Update Memory value based on L2, L1, and L0
  updateMemorySize();
}

function updateMemorySize() {
  if (editableElements.L2 === '0') {
    if (editableElements.L1 === '0') {
      editableElements.Memory = (Math.pow(2, parseInt(editableElements.L0)) * 0.000004).toFixed(6);
    } else {
      editableElements.Memory = (Math.pow(2, parseInt(editableElements.L1)) * 0.002).toString();
    }
  } else {
    editableElements.Memory = Math.pow(2, parseInt(editableElements.L2)).toString();
  }
}

function drawPageDirectories() {
  // Draw Page Directory 1 (or disable it if L2 = 0)
  if (editableElements.L2 === '0') {
    drawDisabledPageDirectory(width * 0.07, height * 0.285);
  } else {
    drawPageDirectory(width * 0.07, height * 0.285, parseInt(editableElements.L2), parseInt(editableElements.L2Index), editableElements.SATP, 220, 'PPN1', 'PD1');
  }

  // Draw Page Directory 2 (or disable it if L1 = 0)
  if (editableElements.L1 === '0') {
    drawDisabledPageDirectory(width * 0.27, height * 0.285);
  } else {
    if (editableElements.L2 === '0') {
      drawPageDirectory(width * 0.27, height * 0.285, parseInt(editableElements.L1), parseInt(editableElements.L1Index), editableElements.SATP, 220, 'PPN2', 'PD2');
    } else {
      drawPageDirectory(width * 0.27, height * 0.285, parseInt(editableElements.L1), parseInt(editableElements.L1Index), editableElements.PPN1, 220, 'PPN2', 'PD2');
    }
  }

  // Draw Page Directory 3 (or disable it if L0 = 0)
  if (editableElements.L0 === '0') {
    drawDisabledPageDirectory(width * 0.47, height * 0.285);
  } else {
    if (editableElements.L1 === '0') {
      drawPageDirectory(width * 0.47, height * 0.285, parseInt(editableElements.L0), parseInt(editableElements.L0Index), editableElements.SATP, 220, 'PPN3', 'PD3');
    } else {
      drawPageDirectory(width * 0.47, height * 0.285, parseInt(editableElements.L0), parseInt(editableElements.L0Index), editableElements.PPN2, 220, 'PPN3', 'PD3');
    }
  }
}

function drawDisabledPageDirectory(x, y) {
  fill(COLORS.disabledDirectory.fill);
  stroke(COLORS.disabledDirectory.stroke);
  rect(x, y, 150, 300);

  let numEntries = 8;
  let entryHeight = 300 / numEntries;
  for (let i = 1; i < numEntries; i++) {
    line(x, y + i * entryHeight, x + 150, y + i * entryHeight);
  }

  line(x + 95, y, x + 95, y + 300);
}

function handleHoverEffects() {
  // Calculate highlight height for virtual memory space
  let highlightHeight = calculateHighlightHeight();

  for (let element of hoverElements) {
    if (isMouseOverElement(element)) {
      if (isElementDisabled(element)) {
        continue;
      }

      // Apply appropriate highlight effect
      applyHighlightEffect(element, highlightHeight);
    }
    
    // Display element value only once, not on every frame
    if (element.key && editableElements[element.key]) {
      fill(COLORS.textColor);
      textSize(SIZES.text);
      noStroke(); // Add this to prevent stroke on text
      text(editableElements[element.key], element.x + 10, (element.y + element.h / 2) + 5);
    }
  }
}

function calculateHighlightHeight() {
  let highlightHeight = 600;
  
  if (editableElements.L2 === '0') {
    if (editableElements.L1 === '0') {
      highlightHeight = highlightHeight/(2**Math.abs(parseInt(editableElements.L1 - 9)));
    } else {
      highlightHeight = highlightHeight/(2**Math.abs(parseInt(editableElements.L0 - 9)));
    }
  } else {
    highlightHeight = 600/(2**Math.abs(parseInt(editableElements.L2 - 9)));
  }

  // highlightHeight does not exceed total height
  return min(highlightHeight, 600);
}

function isMouseOverElement(element) {
  return (
    mouseX > element.x &&
    mouseX < element.x + element.w &&
    mouseY > element.y &&
    mouseY < element.y + element.h
  );
}

function isElementDisabled(element) {
  return (
    (editableElements.L2 === '0' && element.key === 'PPN1') ||
    (editableElements.L1 === '0' && element.key === 'PPN2') ||
    (editableElements.L0 === '0' && element.key === 'PPN3')
  );
}

function applyHighlightEffect(element, highlightHeight) {
  // Highlight for virtual memory space
  if (['L2', 'L1', 'L0'].includes(element.key)) {
    fill(COLORS.highlight.fill);
    noStroke();
    rect(width * 0.8, height * 0.0715, 250, highlightHeight);
    if(editableElements[element.key] !== '0') {
      highlightRowLabels(element.key);
    }
  } 
  // Highlight for index elements
  else if (element.key.endsWith('Index')) {
    fill(COLORS.highlight.fill);
    noStroke();
    rect(element.x, element.y, element.w, element.h);
    
    // Highlight corresponding page directory
    if (element.key === 'L2Index' && editableElements.L2Index !== '') {
      drawPageDirectory(width * 0.07, height * 0.285, parseInt(editableElements.L2), parseInt(editableElements.L2Index), editableElements.SATP, COLORS.highlight.fill, 'PPN1', 'PD1');
    } else if (element.key === 'L1Index' && editableElements.L1Index !== '') {
      drawPageDirectory(width * 0.27, height * 0.285, parseInt(editableElements.L1), parseInt(editableElements.L1Index), editableElements.PPN1, COLORS.highlight.fill, 'PPN2', 'PD2');
    } else if (element.key === 'L0Index' && editableElements.L0Index !== '') {
      drawPageDirectory(width * 0.47, height * 0.285, parseInt(editableElements.L0), parseInt(editableElements.L0Index), editableElements.PPN2, COLORS.highlight.fill, 'PPN3', 'PD3');
    }
  } 
  // Highlight for PPN elements
  else if (['SATP', 'PPN1', 'PPN2', 'PPN3'].includes(element.key)) {
    fill(COLORS.highlight.fill);
    noStroke();
    rect(element.x, element.y, element.w, element.h);
    highlightAddress(editableElements[element.key]);
  }
  // Default highlight
  else {
    fill(COLORS.highlight.fill);
    noStroke();
    rect(element.x, element.y, element.w, element.h);
  }
}

function drawArrows() {
  // L2 page directory arrows
  if (editableElements.L2 !== '0') {
    // Arrow from L2Index to PPN of Page Directory 1
    drawMultiCornerArrow([[width * 0.085, height * 0.16], [width * 0.085, height * 0.175], [width * 0.035, height * 0.175], [width * 0.035, ArrowsPositions.pageDirectory1L2.y], [width * 0.05, ArrowsPositions.pageDirectory1L2.y]], COLORS.arrows.blue);
    
    // Arrow from PD1 PPN to Page Directory 2 Address
    drawMultiCornerArrow([[width * 0.1, ArrowsPositions.pageDirectory1L2Index.y - 12], [width * 0.1, ArrowsPositions.pageDirectory1L2Index.y], [width * 0.2, ArrowsPositions.pageDirectory1L2Index.y], [width * 0.2, height * 0.265], [width * 0.265, height * 0.265]], COLORS.arrows.red);
  } else {
    // Arrow from SATP to Page Directory 2
    drawMultiCornerArrow([[width * 0.04, height * 0.855], [width * 0.04, height * 0.265], [width * 0.26, height * 0.265], [], [width * 0.26, height * 0.265]], COLORS.arrows.red);
  }

  // L1 page directory arrows
  if (editableElements.L1 !== '0') {
    // Arrow from L1Index to PPN of Page Directory 2
    drawMultiCornerArrow([[width * 0.125, height * 0.16], [width * 0.125, height * 0.175], [width * 0.22, height * 0.175], [width * 0.22, ArrowsPositions.pageDirectory1L1.y], [width * 0.25, ArrowsPositions.pageDirectory1L1.y]], COLORS.arrows.blue);
    
    // Arrow from PD2 PPN to Page Directory 3 Address
    drawMultiCornerArrow([[width * 0.3, ArrowsPositions.pageDirectory1L1Index.y - 12], [width * 0.3, ArrowsPositions.pageDirectory1L1Index.y], [width * 0.4, ArrowsPositions.pageDirectory1L1Index.y], [width * 0.4, height * 0.265], [width * 0.46, height * 0.265]], COLORS.arrows.red);
  } else {
    // Arrow from SATP to Page Directory 3
    drawMultiCornerArrow([[width * 0.04, height * 0.855], [width * 0.04, height * 0.265], [width * 0.46, height * 0.265], [], [width * 0.46, height * 0.265]], COLORS.arrows.red);
  }

  // L0 page directory arrows
  // Arrow from L0Index to PPN of Page Directory 3
  drawMultiCornerArrow([[], [width * 0.175, height * 0.15], [width * 0.42, height * 0.15], [width * 0.42, ArrowsPositions.pageDirectory1L0.y], [width * 0.45, ArrowsPositions.pageDirectory1L0.y]], COLORS.arrows.blue);

  // Arrow from SATP to Page Directory 1
  drawMultiCornerArrow([[width * 0.04, height * 0.855], [width * 0.04, height * 0.265], [width * 0.06, height * 0.265], [], [width * 0.06, height * 0.265]], COLORS.arrows.red);

  // Arrow from PD3 PPN to Physical Address
  drawMultiCornerArrow([[width * 0.5, ArrowsPositions.pageDirectory1L0Index.y - 12], [width * 0.5, ArrowsPositions.pageDirectory1L0Index.y], [width * 0.67, ArrowsPositions.pageDirectory1L0Index.y], [width * 0.67, height * 0.135]], COLORS.arrows.red);

  // Arrow for Offset in Physical Address
  drawMultiCornerArrow([[width * 0.24, height * 0.1], [width * 0.6, height * 0.1], [width * 0.6, height * 0.175], [width * 0.72, height * 0.175], [width * 0.72, height * 0.135]], COLORS.arrows.red);
}

// Function to draw multi-corner arrows with improved styling
function drawMultiCornerArrow(points, color) {
  stroke(color);
  strokeWeight(1.5); // Slightly thicker lines for better visibility
  noFill();

  // Draw lines between points, skipping empty points
  for (let i = 0; i < points.length - 1; i++) {
    if (points[i].length > 0 && points[i + 1].length > 0) {
      line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    }
  }

  // Draw arrowhead at the last segment
  let lastValidPoints = getLastValidPoints(points);
  if (lastValidPoints) {
    drawArrowhead(lastValidPoints[0], lastValidPoints[1], lastValidPoints[2], lastValidPoints[3], color);
  }
  
  strokeWeight(1); // Reset stroke weight
}

function getLastValidPoints(points) {
  for (let i = points.length - 2; i >= 0; i--) {
    if (points[i].length > 0 && points[i + 1].length > 0) {
      return [points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]];
    }
  }
  return null;
}

// Function to draw an arrowhead with improved styling
function drawArrowhead(x1, y1, x2, y2, color) {
  let arrowSize = SIZES.arrowhead;
  let angle = atan2(y2 - y1, x2 - x1);
  
  push();
  translate(x2, y2);
  rotate(angle);
  fill(color);
  noStroke();
  triangle(0, 0, -arrowSize, arrowSize / 2, -arrowSize, -arrowSize / 2);
  pop();
}

function toggleAllModals() {
  showAllModals = !showAllModals;
  
  for (let modalKey in modals) {
    if (showAllModals) {
      modals[modalKey].style('display', 'block');
      // Short delay before setting opacity to make the transition work
      setTimeout(() => {
        modals[modalKey].style('opacity', '1');
        modals[modalKey].style('transform', 'scale(1)');
      }, 10);
    } else {
      modals[modalKey].style('opacity', '0');
      modals[modalKey].style('transform', 'scale(0.9)');
      // Wait for the transition to finish before hiding the modal
      setTimeout(() => modals[modalKey].style('display', 'none'), 300);
    }
  }
}

function createHelpModals() {
  // Create a modal for virtual address explanation
  modals.virtualAddress = createModal(
    width * 0.025, 
    height * 0.16, 
    `<h4>Virtuálna adresa</h4>
     <p>Virtuálne adresy sú preložené na fyzické adresy pomocou stránkovacích tabuliek.</p>
     <p>Virtuálna adresa je rozdelená na:</p>
     <ul>
       <li><strong>L2, L1, L0</strong>: Indexy stránkovacej tabuľky (nastaviteľná dĺžka)</li>
       <li><strong>Offset</strong>: Bajtový posun v rámci stránky</li>
     </ul>
     <p>Kliknutím na hodnoty L2, L1, L0 zmeníte veľkosť stránkovacej tabuľky.</p>`, 
    300, 
    200
  );
  
  // Create a modal for Page Directory 1
  modals.pageDirectory1 = createModal(
    width * 0.07, 
    height * 0.6, 
    `<h4>Adresár stránok 1 (Úroveň 2)</h4>
     <p>Toto je stránkovacia tabuľka prvej úrovne, ktorá prekladá časť L2 virtuálnej adresy.</p>
     <p>Každý záznam obsahuje číslo fyzickej stránky (PPN) ukazujúce na stránkovaciu tabuľku úrovne 1.</p>
     <p>Nastavením L2 na 0 túto úroveň vypnete.</p>`, 
    250, 
    180
  );
  
  // Create a modal for Page Directory 2
  modals.pageDirectory2 = createModal(
    width * 0.27, 
    height * 0.6, 
    `<h4>Adresár stránok 2 (Úroveň 1)</h4>
     <p>Toto je stránkovacia tabuľka druhej úrovne, ktorá prekladá časť L1 virtuálnej adresy.</p>
     <p>Každý záznam obsahuje číslo fyzickej stránky (PPN) ukazujúce na stránkovaciu tabuľku úrovne 0.</p>
     <p>Nastavením L1 na 0 túto úroveň vypnete.</p>`, 
    250, 
    180
  );
  
  // Create a modal for Page Directory 3
  modals.pageDirectory3 = createModal(
    width * 0.47, 
    height * 0.6, 
    `<h4>Adresár stránok 3 (Úroveň 0)</h4>
     <p>Toto je stránkovacia tabuľka poslednej úrovne, ktorá prekladá časť L0 virtuálnej adresy.</p>
     <p>Každý záznam obsahuje číslo fyzickej stránky (PPN) ukazujúce na skutočnú fyzickú pamäťovú stránku.</p>
     <p>Nastavením L0 na 0 použijete obrovské stránky (neodporúča sa).</p>`, 
    250, 
    180
  );
  
  // Create a modal for Physical Address
  modals.physicalAddress = createModal(
    width * 0.635, 
    height * 0.15, 
    `<h4>Fyzická adresa</h4>
     <p>Fyzická adresa je skutočné umiestnenie v hardvéri pamäte.</p>
     <p>Skladá sa z:</p>
     <ul>
       <li><strong>PPN</strong>: Číslo fyzickej stránky zo stránkovacej tabuľky</li>
       <li><strong>Offset</strong>: Priamo skopírovaný z virtuálnej adresy</li>
     </ul>`, 
    250, 
    180
  );
  
  // Create a modal for Virtual Memory Space
  modals.virtualMemory = createModal(
    width * 0.8, 
    height * 0.67, 
    `<h4>Priestor virtuálnej pamäti</h4>
     <p>Predstavuje celkovú adresovateľnú pamäť dostupnú procesu.</p>
     <p>Veľkosť sa mení podľa konfigurácie stránkovacej tabuľky:</p>
     <ul>
       <li>Viac bitov pre stránkovacie tabuľky = väčší adresný priestor</li>
       <li>Typicky meraný v GB pre veľké priestory</li>
     </ul>
     <p>Pri umiestnení kurzora nad L2, L1 alebo L0 sa zvýrazní prístupná oblasť pamäti.</p>`, 
    250, 
    200
  );
  
  // Create a modal for SATP Register
  modals.satp = createModal(
    width * 0.033, 
    height * 0.78, 
    `<h4>Register SATP</h4>
     <p>Register preklad adries a ochrany supervízora</p>
     <p>Obsahuje fyzickú adresu koreňovej stránkovacej tabuľky (PD1).</p>
     <p>CPU používa tento register na začatie prechodu stránkovacej tabuľky pri preklade adries.</p>
     <p>Kliknutím upravíte hexadecimálnu hodnotu.</p>`, 
    250, 
    170
  );
  
  // Create a modal for Arrows explanation
  modals.arrows = createModal(
    width - 300, 
    height * 0.18, 
    `<h4>Prechod stránkovacími tabuľkami</h4>
     <p>Aktivujte "Šípky" pre vizualizáciu procesu prechodu stránkovacími tabuľkami:</p>
     <ul>
       <li><strong>Modré šípky</strong>: Ukazujú, ako bity virtuálnej adresy vyberajú záznamy v stránkovacích tabuľkách</li>
       <li><strong>Červené šípky</strong>: Ukazujú, ako každá stránkovacia tabuľka ukazuje na ďalšiu úroveň</li>
     </ul>
     <p>Prechod začína od SATP a pokračuje cez stránkovacie tabuľky až po dosiahnutie fyzickej adresy.</p>`, 
    250, 
    200
  );
}

function createModal(x, y, content, width, height) {
  let modal = createDiv(`
    <div class="modal-content">
      ${content}
    </div>
  `);
  
  modal.position(x, y);
  modal.size(width, height);
  modal.addClass('info-modal');
  
  // Initially hidden
  modal.style('display', 'none');
  modal.style('opacity', '0');
  modal.style('transform', 'scale(0.9)');
  modal.style('transition', 'opacity 0.3s ease, transform 0.3s ease');
  
  return modal;
}

function highlightLIndexRow(level, Lnum) {
  let x = 100;
  let y = 200;
  let numEntries = 8;
  let entryHeight = 300 / numEntries;
  let middleIndex = Math.floor(numEntries / 2);

  // Adjust x position based on the level
  if (level === 'L1Index') {
    x += 300;
  } else if (level === 'L0Index') {
    x += 600;
  }

  fill(COLORS.highlight.fill);
  noStroke();
  rect(x, y + middleIndex * entryHeight, 150, entryHeight);
  stroke(0);
}

function highlightRowLabels(level) {
  let x, y, Lnum, num;
  
  if (level === 'L2') {
    x = width * 0.07;
    y = height * 0.285;
    Lnum = parseInt(editableElements.L2);
    num = 3;
  } else if (level === 'L1') {
    x = width * 0.27;
    y = height * 0.285;
    Lnum = parseInt(editableElements.L1);
    num = 2;
  } else if (level === 'L0') {
    x = width * 0.47;
    y = height * 0.285;
    Lnum = parseInt(editableElements.L0);
    num = 1;
  }

  fill(COLORS.highlight.fill);
  noStroke();
  textSize(SIZES.text);
  
  let numEntries = 8;
  let entryHeight = 300 / numEntries;

  // Highlight rectangle for labels
  for(let i = 0; i < num; i++) {
    rect(x - 30, y + entryHeight / 2 - 10, 30, entryHeight * numEntries);
    x += width * 0.2;
  }
}

function highlightAddress(address) {
  fill(COLORS.highlight.fill);
  noStroke();
  textSize(SIZES.text);

  // Find the position of the address and highlight it
  if (address === editableElements.SATP && editableElements.L2 !== '0') {
    // Highlight SATP address in Page Directory 1
    rect(width * 0.07, height * 0.285 - 25, 110, 20);
  } else if ((address === editableElements.PPN1 || address === editableElements.SATP) && editableElements.L1 !== '0') {
    // Highlight PPN1 or SATP address in Page Directory 2
    rect(width * 0.27, height * 0.285 - 25, 110, 20);
  } else if ((address === editableElements.PPN2 || address === editableElements.SATP) && editableElements.L0 !== '0') {
    // Highlight PPN2 or SATP address in Page Directory 3
    rect(width * 0.47, height * 0.285 - 25, 110, 20);
  } else if (address === editableElements.PPN3) {
    // Highlight PPN3 in Physical Address
    rect(width * 0.635, height * 0.1 - height * 0.029, 100, 39);
  }

  fill(COLORS.textColor);
}

function drawVirtualAddress(x, y) {
  hoverElements.length = 0; // Clear hover elements
  
  // Draw the virtual address boxes with clean styling
  fill(COLORS.virtualAddress.fill);
  stroke(COLORS.virtualAddress.stroke);
  
  // Draw rectangles for each component
  rect(x, y, width * 0.04, height * 0.05);       // EXT
  rect(x + width * 0.04, y, width * 0.04, height * 0.05);  // L2
  rect(x + width * 0.08, y, width * 0.04, height * 0.05); // L1
  rect(x + width * 0.12, y, width * 0.04, height * 0.05); // L0
  rect(x + width * 0.16, y, width * 0.07, height * 0.05); // Offset

  // Add labels - use noStroke() to prevent thick text
  fill(COLORS.textColor);
  textSize(SIZES.text);
  noStroke();
  text('EXT', x + width * 0.01, y + height * 0.030);
  text('L2', x + width * 0.055, y + height * 0.075); 
  text('L1', x + width * 0.095, y + height * 0.075);  
  text('L0', x + width * 0.135, y + height * 0.075);  
  text('Offset', x + width * 0.18, y + height * 0.03);

  // Title
  textSize(SIZES.text);
  textStyle(BOLD);
  text('Virtuálna adresa', x + width * 0.07, y - height * 0.04);
  textStyle(NORMAL);

  // Add hover elements for interaction
  hoverElements.push({ label: 'L2', x: width * 0.075, y: height * 0.045, w: width * 0.02, h: height * 0.03, highlight: [1, 2, 3], key: 'L2' });
  hoverElements.push({ label: 'L1', x: width * 0.115, y: height * 0.045, w: width * 0.02, h: height * 0.03, highlight: [2, 3], key: 'L1' });
  hoverElements.push({ label: 'L0', x: width * 0.155, y: height * 0.045, w: width * 0.02, h: height * 0.03, highlight: [3], key: 'L0' });
  hoverElements.push({ label: 'L2Index', x: width * 0.065, y: height * 0.08, w: width * 0.04, h: height * 0.05, highlight: [1, 2, 3], key: 'L2Index' });
  hoverElements.push({ label: 'L1Index', x: width * 0.105, y: height * 0.08, w: width * 0.04, h: height * 0.05, highlight: [2, 3], key: 'L1Index' });
  hoverElements.push({ label: 'L0Index', x: width * 0.145, y: height * 0.08, w: width * 0.04, h: height * 0.05, highlight: [3], key: 'L0Index' });
}

function drawPageDirectory(x, y, Lnum, Lindex, PPN, color, key, pdnumber) {
  fill(COLORS.pageDirectory.fill);
  stroke(COLORS.pageDirectory.stroke);
  rect(x, y, 150, 300);

  // Horizontal Dividers
  let numEntries = 8;
  if (Lnum === 1) {
    numEntries = 2;
  }
  if (Lnum === 2) {
    numEntries = 4;
  }
  
  let entryHeight = 300 / numEntries;
  for (let i = 1; i < numEntries; i++) {
    line(x, y + i * entryHeight, x + 150, y + i * entryHeight);
  }
  
  // Handle special index display text
  let displayText = (Lindex === 2 ** Lnum + 1 - 2 ** Lnum || Lindex === 0 || Lindex === 2 ** Lnum - 1 || Lindex === 2 ** Lnum - 2 || Lindex === 2 ** Lnum - 3) ? "↑" : Lindex;

  // Find which index should be highlighted
  let highlightIndex = calculateHighlightIndex(Lnum, Lindex, numEntries);

  // Divider PPN and Flags
  line(x + 100, y + highlightIndex * entryHeight, x + 100, y + (highlightIndex + 1) * entryHeight);

  // Highlight row
  fill(color);
  noStroke();
  rect(x, y + highlightIndex * entryHeight, 150, entryHeight);
  
  // Reset stroke after drawing highlight rectangle
  stroke(COLORS.pageDirectory.stroke);

  // Create or update the hover element
  updateHoverElement(x, y, highlightIndex, entryHeight, key);

  // Divider line
  line(x + 95, y, x + 95, y + 300);

  // Add Flags label
  textSize(SIZES.text);
  fill(0);
  noStroke();
  text("Flags", x + 110, y + highlightIndex * entryHeight + entryHeight / 2 + 5);

  // Add index labels for Page Directory
  drawPageDirectoryLabels(x, y, Lnum, numEntries, entryHeight);

  // Update arrow positions
  updateArrowPositions(pdnumber, y, highlightIndex, entryHeight);

  // Add Page Directory label and address
  textSize(SIZES.text);
  textStyle(BOLD);
  text("Adresár stránok", x + 25, y + 300 + 20);
  text("Adresa: " + PPN, x, y - 10);
  textStyle(NORMAL);
}

function calculateHighlightIndex(Lnum, Lindex, numEntries) {
  if (Lindex === (2 ** Lnum - 1)) {
    return 0;
  } else if (Lindex === (2 ** Lnum - 2)) {
    return 1;
  } else if (Lindex === (2 ** Lnum - 3)) {
    return 2;
  } else if (Lindex === (2 ** Lnum + 1 - 2 ** Lnum)) {
    return numEntries - 2;
  } else if (Lindex === 0) {
    return numEntries - 1;
  } else {
    return Math.floor(numEntries / 2);
  }
}

function updateHoverElement(x, y, highlightIndex, entryHeight, key) {
  let hoverElement = hoverElements.find(el => el.key === key);
  if (!hoverElement) {
    hoverElement = { 
      label: 'PPN', 
      x: x + 5, 
      y: y + highlightIndex * entryHeight + entryHeight / 2 - 15, 
      w: 85, 
      h: 30, 
      key: key 
    };
    hoverElements.push(hoverElement);
  } else {
    hoverElement.x = x + 5;
    hoverElement.y = y + highlightIndex * entryHeight + entryHeight / 2 - 15;
  }
}

function drawPageDirectoryLabels(x, y, Lnum, numEntries, entryHeight) {
  fill(0);
  textSize(SIZES.text);
  noStroke(); // Add this to prevent stroke on text
  
  if(Lnum === 1) {
    text("1", x - 25, y + (numEntries - 2) * entryHeight + entryHeight / 2 + 5);
    text("0", x - 25, y + (numEntries - 1) * entryHeight + entryHeight / 2 + 5);
  } else if(Lnum === 2) {
    text("3", x - 25, y + (numEntries - 4) * entryHeight + entryHeight / 2 + 5);
    text("2", x - 25, y + (numEntries - 3) * entryHeight + entryHeight / 2 + 5);
    text("1", x - 25, y + (numEntries - 2) * entryHeight + entryHeight / 2 + 5);
    text("0", x - 25, y + (numEntries - 1) * entryHeight + entryHeight / 2 + 5);
  } else {
    text(2 ** Lnum - 1, x - 25, y + entryHeight / 2 + 5);
    text(2 ** Lnum - 2, x - 25, y + (numEntries - 7) * entryHeight + entryHeight / 2 + 5);
    text(2 ** Lnum - 3, x - 25, y + (numEntries - 6) * entryHeight + entryHeight / 2 + 5);
    text("↑", x - 25, y + (numEntries - 5) * entryHeight + entryHeight / 2 + 5);
    text("↑", x - 25, y + (numEntries - 4) * entryHeight + entryHeight / 2 + 5);
    text("↑", x - 25, y + (numEntries - 3) * entryHeight + entryHeight / 2 + 5);
    text("1", x - 25, y + (numEntries - 2) * entryHeight + entryHeight / 2 + 5);
    text("0", x - 25, y + (numEntries - 1) * entryHeight + entryHeight / 2 + 5);
  }
}

function updateArrowPositions(pdnumber, y, highlightIndex, entryHeight) {
  if(pdnumber === 'PD1') {
    ArrowsPositions.pageDirectory1L2.y = y + highlightIndex * entryHeight + entryHeight / 2;
    ArrowsPositions.pageDirectory1L2Index.y = y + highlightIndex * entryHeight + entryHeight / 2 + 25;
  } else if(pdnumber === 'PD2') {
    ArrowsPositions.pageDirectory1L1.y = y + highlightIndex * entryHeight + entryHeight / 2;
    ArrowsPositions.pageDirectory1L1Index.y = y + highlightIndex * entryHeight + entryHeight / 2 + 25;
  } else if(pdnumber === 'PD3') {
    ArrowsPositions.pageDirectory1L0.y = y + highlightIndex * entryHeight + entryHeight / 2;
    ArrowsPositions.pageDirectory1L0Index.y = y + highlightIndex * entryHeight + entryHeight / 2 + 25;
  }
}

function drawPhysicalAddress(x, y) {
  // Draw Physical Address boxes
  fill(COLORS.physicalAddress.fill);
  stroke(COLORS.physicalAddress.stroke);
  rect(x, y, 100, 40);                         // PPN
  rect(x + 100, y, 70, 40);                   // Offset

  // Add labels
  fill(COLORS.textColor);
  textSize(SIZES.text);
  noStroke(); // Add this to prevent stroke on text
  text('Offset', x + 115, y + 25);

  // Display PPN3 value
  text(`${editableElements.PPN3}`, x + 10, y + 25);

  // Title
  textSize(SIZES.text);
  textStyle(BOLD);
  text('Fyzická adresa', x + 20, y - 10);
  textStyle(NORMAL);
}

function drawVirtualMemorySpace(x, y) {
  // Draw Virtual Memory Space
  fill(255);
  stroke(0);
  rect(x, y, 250, 600);

  // Add labels
  fill(COLORS.textColor);
  textSize(SIZES.text);
  noStroke(); // Add this to prevent stroke on text
  textStyle(BOLD);
  text('Priestor virtuálnej pamäti', x + 45, y - 10);
  textStyle(NORMAL);
  
  // Show memory size based on settings
  if (editableElements.L2 === '0') {
    text('Použiteľné VA: ' + editableElements.Memory*1000 + ' MB', x + 50, y + 630);
  } else {
    text('Použiteľné VA: ' + editableElements.Memory + ' GB', x + 50, y + 630);
  }
}

function drawSATP(x, y) {
  // Draw SATP box
  fill(COLORS.virtualAddress.fill);
  stroke(COLORS.virtualAddress.stroke);
  rect(x, y, 100, 40);

  // Add SATP hover element
  hoverElements.push({ 
    label: 'SATP', 
    x: x, 
    y: y, 
    w: 100, 
    h: 40, 
    key: 'SATP' 
  });

  // Add SATP label
  fill(COLORS.textColor);
  textSize(SIZES.text);
  noStroke(); // Add this to prevent stroke on text
  textStyle(BOLD);
  text('SATP', x + 30, y - 10);
  textStyle(NORMAL);
}

function mousePressed() {
  for (let element of hoverElements) {
    if (isMouseOverElement(element)) {
      // Skip interaction for disabled elements
      if (isElementDisabled(element)) {
        continue;
      }

      activeElement = element.key;
      createInputForElement(element);
      break;
    }
  }
}

function createInputForElement(element) {
  let currentValue = editableElements[element.key];

  // Remove '0x' prefix for PPN and SATP values
  if (['PPN1', 'PPN2', 'PPN3', 'SATP'].includes(element.key) && currentValue.startsWith('0x')) {
    currentValue = currentValue.slice(2);
  }

  // Create an input box
  let inputBox = createInput(currentValue);
  inputBox.position(element.x + width * 0.001, element.y + height * 0.057);
  inputBox.size(element.w - 5, element.h - 5);
  inputBox.addClass('edit-input');

  // Focus and select the input after a slight delay
  setTimeout(() => {
    inputBox.elt.focus();
    inputBox.elt.select();
  }, 10);

  // Handle Enter key press
  inputBox.elt.addEventListener('keydown', createKeydownHandler(inputBox, element));

  // Handle clicks outside the input
  document.addEventListener('mousedown', createOutsideClickHandler(inputBox));
}

function createKeydownHandler(inputBox, element) {
  return function(event) {
    if (event.key === 'Enter') {
      updateElementValue(inputBox.value(), element);
      inputBox.remove();
      redraw();
    }
  };
}

function createOutsideClickHandler(inputBox) {
  return function handleClickOutside(event) {
    if (!inputBox.elt.contains(event.target)) {
      inputBox.remove();
      activeElement = null;
      redraw();
      document.removeEventListener('mousedown', handleClickOutside);
    }
  };
}

function updateElementValue(newValue, element) {
  if (['L0', 'L1', 'L2'].includes(element.key)) {
    if (/^[0-9]$/.test(newValue)) {
      editableElements[element.key] = newValue;
      if (element.key === 'L1' && editableElements.L2 === '0' && newValue !== '9') {
        l1Changed = true;
      }
    } else {
      alert("Hodnota musí byť číslo od 0 do 9.");
    }
  } else if (['L2Index', 'L1Index', 'L0Index'].includes(element.key)) {
    const maxIndex = Math.pow(2, parseInt(editableElements[element.key.replace('Index', '')]));
    if (/^[0-9]+$/.test(newValue) && parseInt(newValue) < maxIndex) {
      editableElements[element.key] = newValue;
    } else {
      alert(`Hodnota musí byť číslo od 0 do ${maxIndex - 1}.`);
    }
  } else if (['PPN1', 'PPN2', 'PPN3', 'SATP'].includes(element.key)) {
    if (/^[0-9a-fA-F]+$/.test(newValue)) {
      editableElements[element.key] = '0x' + newValue.toUpperCase();
    } else {
      alert("Hodnota musí byť platné hexadecimálne číslo.");
    }
  }
}

function mouseMoved() {
  // Only redraw if actually needed
  if (hoverElements.some(el => isMouseOverElement(el))) {
    redraw();
  }
}
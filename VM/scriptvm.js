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
  Memory: '512',
  Offset: '0xFF'
};
let activeElement = null;
let l1Changed = false;
let showArrows = true;
let modals = {};
let showAllModals = false;
let highlightPage = false;
let currentLanguage = 'en'; // Default language is English
let translations = {}; // Object to hold loaded translations
let modalContent = {}; // Modal content based on current language
let ArrowsPositions = {
  pageDirectory1L2: {  y: 360 },
  pageDirectory1L2Index: { y: 400 },
  pageDirectory1L1: { y: 360 },
  pageDirectory1L1Index: { y: 400 },
  pageDirectory1L0: { y: 360 },
  pageDirectory1L0Index: { y: 400 },
};
let canvas;
let interfaceButtons = []; // Add an array to keep track of buttons
let isLanguageLoaded = false; // Flag to track if language file is loaded
let pageDirectoryInfo = {
  PD1: null,
  PD2: null,
  PD3: null
};

// Function to load language data from JSON file
function loadLanguage(lang) {
  fetch(`VM/lang/${lang}.json`)
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
        updateModalContent();
        updateUILanguage();
        isLanguageLoaded = true;
        
        // Redraw the canvas with new translations
        if (canvas) { // Check if canvas exists
          redraw();
        } else {
          // If canvas isn't ready, call setup when ready
          setTimeout(setup, 100);
        }
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
  
  // Update modalContent based on the selected language
  updateModalContent();
  
  // Update UI elements with new language
  updateUILanguage();
  
  // Redraw the canvas with the new language
  redraw();
  
  // Save language preference in localStorage
  localStorage.setItem('preferredLanguage', lang);
}

// Function to update modal content
function updateModalContent() {
  // Skip if translations aren't loaded yet
  if (!translations[currentLanguage]) return;
  
  modalContent = {
    virtualAddress: translations[currentLanguage].virtualAddressHelp,
    pageDirectory1: translations[currentLanguage].pageDirectory1,
    pageDirectory2: translations[currentLanguage].pageDirectory2,
    pageDirectory3: translations[currentLanguage].pageDirectory3,
    physicalAddress: translations[currentLanguage].physicalAddress,
    virtualMemory: translations[currentLanguage].virtualMemorySpace,
    satp: translations[currentLanguage].satp,
    arrows: translations[currentLanguage].arrowsHelp
  };
  
  // Update existing modals if they exist
  for (let modalKey in modals) {
    if (modals[modalKey]) {
      let contentElement = modals[modalKey].elt.querySelector('p');
      if (contentElement) {
        contentElement.textContent = modalContent[modalKey];
      }
    }
  }
}

// Function to update UI elements with the selected language
function updateUILanguage() {
  // Skip if translations aren't loaded yet
  if (!translations[currentLanguage]) return;
  
  // Update navbar elements
  document.querySelector('.navbar-brand').textContent = translations[currentLanguage].nav.title;
  document.querySelector('a.nav-link[href="index.html"]').textContent = translations[currentLanguage].nav.virtualMemory;
  document.querySelector('.nav-link.dropdown-toggle').textContent = translations[currentLanguage].nav.fileSystem;
    
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  dropdownItems[0].textContent = translations[currentLanguage].nav.fileSystemIndirect;
  dropdownItems[1].textContent = translations[currentLanguage].nav.fileSystemDindirect;
  dropdownItems[2].textContent = translations[currentLanguage].nav.fileSystemSize;
    
  document.querySelector('a.nav-link[href="MMAP/Mmap.html"]').textContent = translations[currentLanguage].nav.mmap;
  
  // Update buttons
  for (let button of interfaceButtons) {
    if (button.html() === 'Help' || button.html() === 'Pomoc') {
      button.html(translations[currentLanguage].help);
    }
    if (button.html() === 'Arrows' || button.html() === 'Šípky') {
      button.html(translations[currentLanguage].arrows);
    }
  }
}

// Check for saved language preference on load
document.addEventListener('DOMContentLoaded', () => {
  const savedLanguage = localStorage.getItem('preferredLanguage');
  if (savedLanguage) {
    currentLanguage = savedLanguage;
    document.getElementById('currentLanguage').textContent = 
      savedLanguage === 'en' ? 'English' : 'Slovenčina';
  }
});

//First inicialization of canvas and elements
function setup() {
  // Wait until language is loaded
  if (!translations[currentLanguage]) {
    setTimeout(setup, 100); // Try again in 100ms
    return;
  }
  
  canvas = createCanvas(windowWidth, document.body.scrollHeight);
  canvas.id("Canvas");
  canvas.style("z-index", "-1");
  canvas.position(0, 50);
  background(255);
  textSize(14);

  // Button to toggle arrows
  let toggleArrowsButton = createButton(translations[currentLanguage].arrows);
  toggleArrowsButton.position(width - 130, 70);
  toggleArrowsButton.mousePressed(() => {
    showArrows = !showArrows;                                   // Toggle arrows
    redraw();                                                   // Refresh canvas
  });
  interfaceButtons.push(toggleArrowsButton); // Add to tracked buttons

  // Button to toggle all modals
  let toggleButton = createButton(translations[currentLanguage].help);
  toggleButton.position(width - 70, 70);
  toggleButton.mousePressed(() => toggleAllModals());
  interfaceButtons.push(toggleButton); // Add to tracked buttons

  // Initialize modals with better positions and sizes
  modals.virtualAddress = createModal(width * 0.025, height * 0.15, modalContent.virtualAddress, 320, 120);
  modals.pageDirectory1 = createModal(width * 0.07, height * 0.6, modalContent.pageDirectory1, 280, 150);
  modals.pageDirectory2 = createModal(width * 0.27, height * 0.6, modalContent.pageDirectory2, 280, 150);
  modals.pageDirectory3 = createModal(width * 0.47, height * 0.6, modalContent.pageDirectory3, 280, 150);
  modals.physicalAddress = createModal(width * 0.635, height * 0.15, modalContent.physicalAddress, 300, 120);
  modals.virtualMemory = createModal(width * 0.8, height * 0.66, modalContent.virtualMemory, 300, 150);
  modals.satp = createModal(width * 0.033, height * 0.78, modalContent.satp, 280, 120);
  modals.arrows = createModal(width - 300, 100, modalContent.arrows, 250, 100);
  
  // Hide all modals initially
  for (let modalKey in modals) {
    modals[modalKey].style('display', 'none');
  }

  drawVirtualAddress(width * 0.025, height * 0.008);

  // Page Directory 1
  drawPageDirectory(width * 0.07, height * 0.285, parseInt(editableElements.L2), parseInt(editableElements.L2Index), editableElements.SATP, 220, 'PPN1', 'PD1');

  // Page Directory 2
  drawPageDirectory(width * 0.27, height * 0.285, parseInt(editableElements.L1), parseInt(editableElements.L1Index), editableElements.PPN1, 220, 'PPN2', 'PD2');

  // Page Directory 3
  drawPageDirectory(width * 0.47, height * 0.285, parseInt(editableElements.L0), parseInt(editableElements.L0Index), editableElements.PPN2, 220, 'PPN3', 'PD3');

  drawPhysicalAddress(width * 0.635, height * 0.07);

  drawVirtualMemorySpace(width * 0.8, height * 0.07); 

  drawSATP(width * 0.033, height * 0.857);

}

// Modify the draw function to add visual indicators for editable elements
function draw() {
  clear();
  background(255);
  drawVirtualAddress(width * 0.025, height * 0.08);
  drawSATP(width * 0.033, height * 0.857);
  
  // Enforce page table level dependencies
  // L1 must be non-zero if L2 is non-zero
  if (editableElements.L2 !== '0' && editableElements.L1 === '0') {
    editableElements.L1 = '9';
  }
  
  // L0 must be non-zero if L1 is non-zero
  if (editableElements.L1 !== '0' && editableElements.L0 === '0') {
    editableElements.L0 = '9';
  }

  if (editableElements.L2 === '0') {
    editableElements.PPN1 = '';
    editableElements.L2Index = '';
  } else if (editableElements.L2 !== '0' && editableElements.L2Index === '') {
    editableElements.PPN1 = '0x1A2B'; // Add "0x" prefix
  }
  if (editableElements.L1 === '0') {
    editableElements.PPN2 = '';
    editableElements.L1Index = '';
  } else if (editableElements.L1 !== '0' && editableElements.L1Index === '') {
    editableElements.PPN2 = '0x3C4D'; // Add "0x" prefix
  }
  if (editableElements.L0 === '0') {
    editableElements.PPN3 = '';
    editableElements.L0Index = '';
  } else if (editableElements.L0 !== '0' && editableElements.L0Index === '') {
    editableElements.PPN3 = '0x5E6F'; // Add "0x" prefix
  }

  // Update Memory value based on L2, L1, and L0
  if (editableElements.L2 === '0') {
    if (editableElements.L1 === '0') {
      editableElements.Memory = (Math.pow(2, parseInt(editableElements.L0)) * 0.000004).toFixed(6);
    } else {
      editableElements.Memory = (Math.pow(2, parseInt(editableElements.L1)) * 0.002).toString();
    }
  } else {
    editableElements.Memory = Math.pow(2, parseInt(editableElements.L2)).toString();
  }

  // Calculate consistent positions for page directories
  const pd1X = width * 0.07;
  const pd2X = width * 0.27;
  const pd3X = width * 0.47;
  const pdY = height * 0.285;

  // Disable Page Directory 1
  if (editableElements.L2 === '0') {
    fill(245);                                             // Gray colour for Page Directory
    stroke(150,150,150);
    rect(pd1X, pdY, 150, 300);                            

    let numEntries = 8;                                    // Rows in Page Directory
    let entryHeight = 300 / numEntries;                    // Height of each entry
    for (let i = 1; i < numEntries; i++) {
      line(pd1X, pdY + i * entryHeight, pd1X + 150, pdY + i * entryHeight);
    }

    line(pd1X + 95, pdY, pd1X + 95, pdY + 300);
    
    // Store page directory info for highlighting even when disabled
    pageDirectoryInfo.PD1 = { x: pd1X, y: pdY, width: 150, height: 300, numEntries, entryHeight, Lnum: 0 };
    
  } else {
    drawPageDirectory(pd1X, pdY, parseInt(editableElements.L2), parseInt(editableElements.L2Index), editableElements.SATP, 220, 'PPN1', 'PD1');
  }

  // Disable Page Directory 2  
  if (editableElements.L1 === '0') {
    fill(245);            
    stroke(150,150,150);
    rect(pd2X, pdY, 150, 300);

    let numEntries = 8; 
    let entryHeight = 300 / numEntries;
    for (let i = 1; i < numEntries; i++) {
      line(pd2X, pdY + i * entryHeight, pd2X + 150, pdY + i * entryHeight);
    }

    line(pd2X + 95, pdY, pd2X + 95, pdY + 300);
    
    // Store page directory info for highlighting even when disabled
    pageDirectoryInfo.PD2 = { x: pd2X, pdY, width: 150, height: 300, numEntries, entryHeight, Lnum: 0 };
    
  } else {
    if (editableElements.L2 === '0'){
      drawPageDirectory(pd2X, pdY, parseInt(editableElements.L1), parseInt(editableElements.L1Index), editableElements.SATP, 220, 'PPN2', 'PD2');
    }
    else {
      drawPageDirectory(pd2X, pdY, parseInt(editableElements.L1), parseInt(editableElements.L1Index), editableElements.PPN1, 220, 'PPN2', 'PD2');
    }
  }

  // Disable Page Directory 3
  if (editableElements.L0 === '0') {
    fill(245);            
    stroke(150,150,150);
    rect(pd3X, pdY, 150, 300);

    let numEntries = 8; 
    let entryHeight = 300 / numEntries;
    for (let i = 1; i < numEntries; i++) {
      line(pd3X, pdY + i * entryHeight, pd3X + 150, pdY + i * entryHeight);
    }

    line(pd3X + 95, pdY, pd3X + 95, pdY + 300);
    
    // Store page directory info for highlighting even when disabled
    pageDirectoryInfo.PD3 = { x: pd3X, pdY, width: 150, height: 300, numEntries, entryHeight, Lnum: 0 };
    
  } else {
    if (editableElements.L1 === '0'){
      drawPageDirectory(pd3X, pdY, parseInt(editableElements.L0), parseInt(editableElements.L0Index), editableElements.SATP, 220, 'PPN3', 'PD3');
    }
    else {
      drawPageDirectory(pd3X, pdY, parseInt(editableElements.L0), parseInt(editableElements.L0Index), editableElements.PPN2, 220, 'PPN3', 'PD3');
    }
  }

  drawPhysicalAddress(width * 0.635, height * 0.07);
  drawVirtualMemorySpace(width * 0.8, height * 0.07);

  // Adjustable height calculated by depending on the value of L2, L1, and L0
  let highlightHeight;

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
  highlightHeight = min(highlightHeight, 600);

  for (let element of hoverElements) {
    let isEditable = true;
    
    // Check if element is editable in current state
    if ((editableElements.L2 === '0' && element.key === 'PPN1') ||
        (editableElements.L1 === '0' && element.key === 'PPN2') ||
        (editableElements.L0 === '0' && element.key === 'PPN3')) {
      isEditable = false;
    }
    
    let isHovered = mouseX > element.x && mouseX < element.x + element.w &&
                    mouseY > element.y && mouseY < element.y + element.h;
    
    // Change cursor to pointer when hovering over editable elements
    if (isHovered && isEditable) {
      document.body.style.cursor = 'pointer';
    }
    
    // Draw the basic element
    if (isEditable) {
      // Draw dotted border to indicate editability
      if (isHovered) {
        // Highlighted state
        fill(255, 255, 0, 150); // Yellow highlight, same as existing highlight
        noStroke();
        rect(element.x, element.y, element.w, element.h);
        
        // Draw edit icon
        push();
        fill(60, 60, 60);
        noStroke();
        textSize(10);
        text("✎", element.x + element.w - 12, element.y + 12);
        pop();
      } else {
        // Draw subtle dotted outline to indicate element is editable
        push();
        stroke(100, 100, 100);
        strokeWeight(1);
        
        // Draw a dotted border
        drawingContext.setLineDash([2, 2]);
        noFill();
        rect(element.x, element.y, element.w, element.h);
        drawingContext.setLineDash([]); // Reset to solid line
        pop();
        
        // Small indicator dot in corner
        fill(60, 60, 60, 120);
        noStroke();
        ellipse(element.x + element.w - 5, element.y + 5, 3, 3);
      }
    }
    
    // Special handling for L2, L1, L0 elements
    if (isHovered && ['L2', 'L1', 'L0'].includes(element.key)) {
      fill(255, 255, 0, 150); // Highlight colour
      noStroke();
      rect(width * 0.8, height * 0.0715, 250, highlightHeight);
      
      // Highlight appropriate page directories based on which size field is hovered
      if (element.key === 'L2' && editableElements.L2 !== '0') {
        // When hovering over L2 size, highlight all three page directories
        highlightPageDirectories(['PD1', 'PD2', 'PD3']);
      } else if (element.key === 'L1' && editableElements.L1 !== '0') {
        // When hovering over L1 size, highlight only the last two page directories
        highlightPageDirectories(['PD2', 'PD3']);
      } else if (element.key === 'L0' && editableElements.L0 !== '0') {
        // When hovering over L0 size, highlight only the last page directory
        highlightPageDirectories(['PD3']);
      }
    } else if (isHovered && ['L2Index', 'L1Index', 'L0Index'].includes(element.key)) {
      // Highlight the corresponding row in the page directory when hovering over an index
      highlightIndexRow(element.key);
    } else if (isHovered) {
      // Handle other element types
      if (['SATP', 'PPN1', 'PPN2', 'PPN3', 'Offset'].includes(element.key)) {
        highlightAddress(editableElements[element.key]);
      }
    }

    // Display value with appropriate styling
    if (isEditable) {
      fill(0);
    } else {
      fill(150); // Gray out non-editable text
    }
    textSize(14);
    noStroke();
    text(editableElements[element.key], element.x + 10, (element.y + element.h / 2) + 5);
  }

  // Reset cursor if not hovering over any editable element
  let hoveringEditable = false;
  for (let element of hoverElements) {
    if (mouseX > element.x && mouseX < element.x + element.w &&
        mouseY > element.y && mouseY < element.y + element.h) {
      if (!(editableElements.L2 === '0' && element.key === 'PPN1') &&
          !(editableElements.L1 === '0' && element.key === 'PPN2') &&
          !(editableElements.L0 === '0' && element.key === 'PPN3')) {
        hoveringEditable = true;
        break;
      }
    }
  }
  if (!hoveringEditable) {
    document.body.style.cursor = 'default';
  }

  // Draw arrows
  if (showArrows) {
    drawArrows();
  }
}

// Helper function to get element position by key
function getElementPosition(key) {
  const element = hoverElements.find(el => el.key === key);
  if (element) {
    return {
      x: element.x + element.w/2, // Center of element
      y: element.y + element.h/2,
      left: element.x,
      right: element.x + element.w,
      top: element.y,
      bottom: element.y + element.h
    };
  }
  return null;
}

function drawArrows() {
  // Get positions of all relevant elements for the arrows
  const l2Pos = getElementPosition('L2');
  const l1Pos = getElementPosition('L1');
  const l0Pos = getElementPosition('L0');
  const l2IndexPos = getElementPosition('L2Index');
  const l1IndexPos = getElementPosition('L1Index');
  const l0IndexPos = getElementPosition('L0Index');
  const ppn1Pos = getElementPosition('PPN1');
  const ppn2Pos = getElementPosition('PPN2');
  const ppn3Pos = getElementPosition('PPN3');
  const satpPos = getElementPosition('SATP');
  const offsetPos = getElementPosition('Offset');

  if (editableElements.L2 !== '0' && l2Pos && l2IndexPos && ppn1Pos) {
    // Arrow from L2Index to PPN of Page Directory 1
    drawMultiCornerArrow([
      [l2IndexPos.x - 30, l2IndexPos.bottom], 
      [l2IndexPos.x - 30, l2IndexPos.bottom + 15], 
      [width * 0.035, l2IndexPos.bottom + 15], 
      [width * 0.035, ppn1Pos.y], 
      [ppn1Pos.left - 40, ppn1Pos.y]
    ], [0, 0, 255]);
    
    // Arrow from PD1 PPN to Page Directory 2 Address
    drawMultiCornerArrow([
      [ppn1Pos.x, ppn1Pos.bottom],
      [ppn1Pos.x, ppn1Pos.bottom + 15],
      [ppn1Pos.right + 100, ppn1Pos.bottom + 15],
      [ppn1Pos.right + 100, height * 0.265], 
      [width * 0.265, height * 0.265]
    ], [255, 0, 0]);
  } else if (satpPos) {
    // Arrow from SATP to Page Directory 2
    drawMultiCornerArrow([
      [satpPos.x - 40, satpPos.top], 
      [satpPos.x - 40, height * 0.265], 
      [width * 0.26, height * 0.265]
    ], [255, 0, 0]);
  }

  if (editableElements.L1 !== '0' && l1Pos && l1IndexPos && ppn2Pos) {
    // Arrow from L1Index to PPN of Page Directory 2
    drawMultiCornerArrow([
      [l1IndexPos.x + 20, l1IndexPos.bottom], 
      [l1IndexPos.x + 20, l1IndexPos.bottom + 60], 
      [width * 0.22, l1IndexPos.bottom + 60], 
      [width * 0.22, ppn2Pos.y], 
      [ppn2Pos.left - 40, ppn2Pos.y]
    ], [0, 0, 255]);
    
    // Arrow from PD2 PPN to Page Directory 3 Address
    drawMultiCornerArrow([
      [ppn2Pos.x, ppn2Pos.bottom],
      [ppn2Pos.x, ppn2Pos.bottom + 15],
      [ppn2Pos.right + 100, ppn2Pos.bottom + 15],
      [ppn2Pos.right + 100, height * 0.265], 
      [width * 0.46, height * 0.265]
    ], [255, 0, 0]);
  } else if (satpPos) {
    // Arrow from SATP to Page Directory 3
    drawMultiCornerArrow([
      [satpPos.x - 40, satpPos.top], 
      [satpPos.x - 40, height * 0.265], 
      [width * 0.46, height * 0.265]
    ], [255, 0, 0]);
  }

  if (l0IndexPos && ppn3Pos) {
    // Arrow from L0Index to PPN of Page Directory 3
    drawMultiCornerArrow([
      [l0IndexPos.x + 25, l0IndexPos.bottom], 
      [l0IndexPos.x + 25, l0IndexPos.bottom + 30], 
      [width * 0.42, l0IndexPos.bottom + 30], 
      [width * 0.42, ppn3Pos.y], 
      [ppn3Pos.left - 40, ppn3Pos.y]  // End directly at the left side of the PPN3 element
    ], [0, 0, 255]);
  }

  if (satpPos) {
    // Arrow from SATP to Page Directory 1
    drawMultiCornerArrow([
      [satpPos.x - 40, satpPos.top], 
      [satpPos.x - 40, height * 0.265], 
      [width * 0.06, height * 0.265]  // End at the exact address position
    ], [255, 0, 0]);
  }

  if (ppn3Pos) {
    // Arrow from PD3 PPN to Physical Address PPN section
    const physAddrY = height * 0.135;
    const physAddrX = width * 0.635;
    
    // Find the specific position of the PPN part in the physical address
    const ppnTargetX = physAddrX + 70; // Target the middle of the PPN section
    
    drawMultiCornerArrow([
      [ppn3Pos.x, ppn3Pos.bottom], 
      [ppn3Pos.x, ppn3Pos.bottom + 15], 
      [ppnTargetX, ppn3Pos.bottom + 15], 
      [ppnTargetX, physAddrY]
    ], [255, 0, 0]);
  }

  if (offsetPos) {
    // Arrow for Offset in Physical Address - target the offset section specifically
    const physAddrOffsetY = height * 0.135;
    const physAddrX = width * 0.635;
    
    // Find the specific position of the offset part in the physical address
    const offsetTargetX = physAddrX + 120; // Target the middle of the offset section
    
    drawMultiCornerArrow([
      [offsetPos.x + 40, offsetPos.bottom], 
      [offsetPos.x + 40, offsetPos.bottom + 20], 
      [offsetTargetX, offsetPos.bottom + 20], 
      [offsetTargetX, physAddrOffsetY],
    ], [255, 0, 0]);
  }
}

// Function to draw arrows with multiple corners
function drawMultiCornerArrow(points, color) {
  stroke(color[0], color[1], color[2]);
  noFill();

  // Draw lines between the points
  for (let i = 0; i < points.length - 1; i++) {
    line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
  }

  // Draw arrowhead at the last segment
  let x1 = points[points.length - 2][0];
  let y1 = points[points.length - 2][1];
  let x2 = points[points.length - 1][0];
  let y2 = points[points.length - 1][1];
  drawArrowhead(x1, y1, x2, y2, color);
}

// Function to draw an arrowhead
function drawArrowhead(x1, y1, x2, y2, color) {
  let arrowSize = 8;
  let angle = atan2(y2 - y1, x2 - x1);
  push();
  translate(x2, y2);
  rotate(angle);
  fill(color[0], color[1], color[2]);
  noStroke();
  triangle(0, 0, -arrowSize, arrowSize / 2, -arrowSize, -arrowSize / 2);
  pop();
}

function toggleAllModals() {
  showAllModals = !showAllModals; // Toggle visibility state
  for (let modalKey in modals) {
    if (showAllModals) {
      modals[modalKey].style('display', 'block'); // Show modal
      modals[modalKey].style('opacity', '1');
      modals[modalKey].style('transform', 'scale(1)');
    } else {
      modals[modalKey].style('opacity', '0');
      modals[modalKey].style('transform', 'scale(0.9)');
      setTimeout(() => modals[modalKey].style('display', 'none'), 300); // Hide after transition
    }
  }
}

function createModal(x, y, content, width, height) {
  let modal = createDiv(`
    <div class="modal-content">
      <p>${content}</p>
    </div>
  `);
  modal.position(x, y); // Position on the canvas
  modal.size(width, height); // Width and height of the modal
  modal.style('padding', '15px');
  modal.style('border', '2px solid #45515f'); // Match the button color
  modal.style('background-color', 'rgba(255, 255, 255, 0.95)'); // Slightly transparent white
  modal.style('border-radius', '8px');
  modal.style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.15)');
  modal.style('font-family', 'Arial, sans-serif');
  modal.style('color', '#333');
  modal.style('line-height', '1.5');
  modal.style('text-align', 'left');
  modal.style('overflow-y', 'auto'); // Add scrolling if content is too long
  modal.style('max-height', '80vh'); // Limit height to 80% of viewport height
  modal.style('word-wrap', 'break-word'); // Prevent text from overflowing
  modal.style('transition', 'opacity 0.3s ease, transform 0.3s ease');
  modal.style('z-index', '100');
  modal.style('opacity', '0'); // Start with 0 opacity
  modal.style('transform', 'scale(0.9)'); // Start slightly smaller

  // Add a subtle close button
  let closeBtn = createButton('×');
  closeBtn.parent(modal);
  closeBtn.style('position', 'absolute');
  closeBtn.style('top', '5px');
  closeBtn.style('right', '10px');
  closeBtn.style('background', 'none');
  closeBtn.style('border', 'none');
  closeBtn.style('font-size', '18px');
  closeBtn.style('color', '#45515f');
  closeBtn.style('cursor', 'pointer');
  closeBtn.style('padding', '0 5px');
  closeBtn.mousePressed(() => {
    modal.style('opacity', '0');
    modal.style('transform', 'scale(0.9)');
    setTimeout(() => modal.style('display', 'none'), 300);
  });

  return modal;
}

function highlightLIndexRow(level, Lnum) {
  let x = 100;                                            // x position of the first page directory
  let y = 200;                                            // y position of the first page directory
  let numEntries = 8;
  let entryHeight = 300 / numEntries;
  let middleIndex = Math.floor(numEntries / 2);

  // Adjust x position based on the level
  if (level === 'L1Index') {
    x += 300;                                             // Move to the second page directory
  } else if (level === 'L0Index') {
    x += 600;                                             // Move to the third page directory
  }

  fill(255, 255, 0, 150);                                 // Highlight colour
  noStroke();
  rect(x, y + middleIndex * entryHeight, 150, entryHeight);
  stroke(0);
}

function highlightAddress(address) {
  fill(255, 255, 0, 150);                   // Highlight colour
  noStroke();
  textSize(14);

  // Find the position of the address
  let x, y;
  if (address === editableElements.SATP && editableElements.L2 !== '0') {
    x = width * 0.07;
    y = height * 0.285;
    rect(x, y - 25, 110, 20);
  } else if ((address === editableElements.PPN1 || address === editableElements.SATP)  && editableElements.L1 !== '0') {
    x = width * 0.27;
    y = height * 0.285;
    rect(x, y - 25, 110, 20);
  } else if ((address === editableElements.PPN2 || address === editableElements.SATP) && editableElements.L0 !== '0') {
    x = width * 0.47;
    y = height * 0.285;
    rect(x, y - 25, 110, 20);
  } else if (address === editableElements.PPN3) {
    x = width * 0.635;
    y = height * 0.1;
    rect(x, y - height * 0.029, 100, 39);
  } else if (address === editableElements.Offset) {
    x = width * 0.635 + 100;
    y = height * 0.1;
    rect(x, y - height * 0.029, 70, 39);
  }

  // Highlight rectangle behind address
  fill(0);
}

function highlightIndexRow(indexKey) {
  // Map the index key to the correct page directory and get info
  let pdInfo = null;
  let indexValue = null;
  
  if (indexKey === 'L2Index') {
    pdInfo = pageDirectoryInfo.PD1;
    indexValue = parseInt(editableElements.L2Index);
  } else if (indexKey === 'L1Index') {
    pdInfo = pageDirectoryInfo.PD2;
    indexValue = parseInt(editableElements.L1Index);
  } else if (indexKey === 'L0Index') {
    pdInfo = pageDirectoryInfo.PD3;
    indexValue = parseInt(editableElements.L0Index);
  }
  
  // If page directory or index is not available, return
  if (!pdInfo || isNaN(indexValue) || editableElements[indexKey.replace('Index', '')] === '0') {
    return;
  }
  
  // Calculate which row to highlight based on the index value and Lnum
  const Lnum = parseInt(editableElements[indexKey.replace('Index', '')]);
  const numEntries = pdInfo.numEntries;
  const entryHeight = pdInfo.entryHeight;
  
  // Calculate the specific row to highlight
  let highlightIndex = -1;
  
  // This logic follows the same pattern used in drawPageDirectory
  if (indexValue === (2 ** Lnum - 1)) {
    highlightIndex = 0;
  } else if (indexValue === (2 ** Lnum - 2)) {
    highlightIndex = 1;
  } else if (indexValue === (2 ** Lnum - 3)) {
    highlightIndex = 2;
  } else if (indexValue === (2 ** Lnum + 1 - 2 ** Lnum)) {
    highlightIndex = numEntries - 2;
  } else if (indexValue === 0) {
    highlightIndex = numEntries - 1;
  } else {
    highlightIndex = Math.floor(numEntries / 2);
  }
  
  // Highlight the entire row in the page directory
  fill(255, 255, 0, 150); // Highlight color (yellow)
  noStroke();
  rect(pdInfo.x, pdInfo.y + highlightIndex * entryHeight, pdInfo.width, entryHeight);
  
  // Make sure the vertical divider is still visible
  stroke(0);
  line(pdInfo.x + 95, pdInfo.y + highlightIndex * entryHeight, 
       pdInfo.x + 95, pdInfo.y + (highlightIndex + 1) * entryHeight);
  
  // Reset stroke weight
  strokeWeight(1);
}

function highlightPageDirectories(directoryIds) {
  for (let pdId of directoryIds) {
    const pdInfo = pageDirectoryInfo[pdId];
    
    if (pdInfo) {
      // Highlight the entire page directory with a glowing border
      stroke(255, 200, 0);
      strokeWeight(3);
      noFill();
      rect(pdInfo.x, pdInfo.y, pdInfo.width, pdInfo.height);
    }
  }
  
  // Reset stroke weight
  strokeWeight(1);
}

function drawVirtualAddress(x, y) {
  // Skip if translations aren't loaded yet
  if (!translations[currentLanguage]) return;
  
  hoverElements.length = 0; // Clear hover elements
  fill(173, 216, 230);      // Blue for virtual address
  stroke(0);
  rect(x, y, width * 0.04, height * 0.05);       // EXT
  rect(x, y - height * 0.03, width * 0.04, height * 0.03);
  rect(x + width * 0.04, y, width * 0.04, height * 0.05);  // L2Index
  rect(x + width * 0.04, y - height * 0.03, width * 0.04, height * 0.03); // L2Size
  rect(x + width * 0.08, y, width * 0.04, height * 0.05); // L1Index
  rect(x + width * 0.08, y - height * 0.03, width * 0.04, height * 0.03); // L1Size
  rect(x + width * 0.12, y, width * 0.04, height * 0.05); // L0Index
  rect(x + width * 0.12, y - height * 0.03, width * 0.04, height * 0.03); // L0Size
  rect(x + width * 0.16, y, width * 0.07, height * 0.05); // Offset
  rect(x + width * 0.16, y - height * 0.03, width * 0.07, height * 0.03);

  fill(0);
  noStroke();
  textSize(14);
  text('EXT', x + width * 0.01, y + height * 0.030);
  
  // Use translated word for "Size" instead of hardcoded English
  text(translations[currentLanguage].size || 'Size', x + width * 0.01, y - height * 0.010);
  
  text('L2', x + width * 0.055, y + height * 0.075); 
  text('L1', x + width * 0.095, y + height * 0.075);  
  text('L0', x + width * 0.135, y + height * 0.075);  
  text('Offset', x + width * 0.18, y + height * 0.075);
  text('12', x + width * 0.19, y + height * -0.010);

  textSize(20);
  text(translations[currentLanguage].virtualAddress, x + width * 0.07, y - height * 0.04);
  textSize(14);
  // Fix hover elements with proper dimensions
  hoverElements.push({ label: 'L2', x: x + width * 0.04, y: y - height * 0.03, w: width * 0.04, h: height * 0.03, key: 'L2' });
  hoverElements.push({ label: 'L1', x: x + width * 0.08, y: y - height * 0.03, w: width * 0.04, h: height * 0.03, key: 'L1' });
  hoverElements.push({ label: 'L0', x: x + width * 0.12, y: y - height * 0.03, w: width * 0.04, h: height * 0.03, key: 'L0' });
  hoverElements.push({ label: 'L2Index', x: x + width * 0.04, y: y, w: width * 0.04, h: height * 0.05, key: 'L2Index' });
  hoverElements.push({ label: 'L1Index', x: x + width * 0.08, y: y, w: width * 0.04, h: height * 0.05, key: 'L1Index' });
  hoverElements.push({ label: 'L0Index', x: x + width * 0.12, y: y, w: width * 0.04, h: height * 0.05, key: 'L0Index' });
  hoverElements.push({ label: 'Offset', x: x + width * 0.16, y: y, w: width * 0.07, h: height * 0.05, key: 'Offset' });
}

function drawPageDirectory(x, y, Lnum, Lindex, PPN, color, key, pdnumber) {
  // Skip if translations aren't loaded yet
  if (!translations[currentLanguage]) return;

  fill(240);                                        // Gray for Page Directory
  stroke(0);
  rect(x, y, 150, 300);                             // Directory with increased height

  // Horizontal Dividers
  let numEntries = 8;                               // Total number of entries
  if (Lnum === 1) {
    numEntries = 2;
  }
  if (Lnum === 2) {
    numEntries = 4;
  }
  let entryHeight = 300 / numEntries;               // Height of each entry
  for (let i = 1; i < numEntries; i++) {
    line(x, y + i * entryHeight, x + 150, y + i * entryHeight);
  }
  // Check if the size of Virtual address is 1 or 2 to resize the Page Directory 
  let displayText = (Lindex === 2 ** Lnum + 1 - 2 ** Lnum || Lindex === 0 || Lindex === 2 ** Lnum - 1 || Lindex === 2 ** Lnum - 2 || Lindex === 2 ** Lnum - 3) ? "↑" : Lindex;

  // Find which index should be highlighted
  let highlightIndex = -1;
  if (Lindex === (2 ** Lnum - 1)) {
    highlightIndex = 0;
  } else if (Lindex === (2 ** Lnum - 2)) {
    highlightIndex = 1;
  } else if (Lindex === (2 ** Lnum - 3)) {
    highlightIndex = 2;
  } else if (Lindex === (2 ** Lnum + 1 - 2 ** Lnum)) {
    highlightIndex = numEntries - 2;
  } else if (Lindex === 0) {
    highlightIndex = numEntries - 1;
  } else {
    highlightIndex = Math.floor(numEntries / 2);
  }

  // Divider PPN and Flags
  line(x + 100, y + highlightIndex * entryHeight, x + 100, y + (highlightIndex + 1) * entryHeight);

  // Gray row PPN and Flags
  fill(color);
  noStroke();
  rect(x, y + highlightIndex * entryHeight, 150, entryHeight);
  fill(255);
  stroke(0);

  // Create or update the hover element with edit indicator
  let hoverElement = hoverElements.find(el => el.key === key);
  if (!hoverElement) {
    hoverElement = { label: 'PPN', x: x + 5, y: y + highlightIndex * entryHeight + entryHeight / 2 - 15, w: 85, h: 30, key: key };
    hoverElements.push(hoverElement);
  } else {
    hoverElement.x = x + 5;
    hoverElement.y = y + highlightIndex * entryHeight + entryHeight / 2 - 15;
  }

  line(x + 95, y, x + 95, y + 300);

  // Flags
  textSize(14);
  fill(0);
  noStroke();
  text(translations[currentLanguage].flags, x + 110, y + highlightIndex * entryHeight + entryHeight / 2 + 5);

  // Labels for Page Directory (Index)
  if(Lnum === 1){
    text("1", x - 25, y + (numEntries - 2) * entryHeight + entryHeight / 2 + 5);
    text("0", x - 25, y + (numEntries - 1) * entryHeight + entryHeight / 2 + 5);
  } else if(Lnum === 2){
    text("3", x - 25, y + (numEntries - 4) * entryHeight + entryHeight / 2 + 5);
    text("2", x - 25, y + (numEntries - 3) * entryHeight + entryHeight / 2 + 5);
    text("1", x - 25, y + (numEntries - 2) * entryHeight + entryHeight / 2 + 5);
    text("0", x - 25, y + (numEntries - 1) * entryHeight + entryHeight / 2 + 5);
  } else{
    text(2 ** Lnum - 1, x - 30, y + entryHeight / 2 + 5);
    text(2 ** Lnum - 2, x - 30, y + (numEntries - 7) * entryHeight + entryHeight / 2 + 5);
    text(2 ** Lnum - 3, x - 30, y + (numEntries - 6) * entryHeight + entryHeight / 2 + 5);
    text("↑", x - 25, y + (numEntries - 5) * entryHeight + entryHeight / 2 + 5);
    text(displayText, x - 30, y + (numEntries - 4) * entryHeight + entryHeight / 2 + 5);
    text("↑", x - 25, y + (numEntries - 3) * entryHeight + entryHeight / 2 + 5);
    text(2 ** Lnum + 1 - 2 ** Lnum, x - 25, y + (numEntries - 2) * entryHeight + entryHeight / 2 + 5);
    text("0", x - 25, y + (numEntries - 1) * entryHeight + entryHeight / 2 + 5);
  }

  // Store page directory info for highlighting
  if(pdnumber === 'PD1'){
    pageDirectoryInfo.PD1 = { x, y, width: 150, height: 300, numEntries, entryHeight, Lnum };
    ArrowsPositions.pageDirectory1L2.y = y + highlightIndex * entryHeight + entryHeight / 2;
    ArrowsPositions.pageDirectory1L2Index.y = y + highlightIndex * entryHeight + entryHeight / 2 + 25;
  } else if(pdnumber === 'PD2'){
    pageDirectoryInfo.PD2 = { x, y, width: 150, height: 300, numEntries, entryHeight, Lnum };
    ArrowsPositions.pageDirectory1L1.y = y + highlightIndex * entryHeight + entryHeight / 2;
    ArrowsPositions.pageDirectory1L1Index.y = y + highlightIndex * entryHeight + entryHeight / 2 + 25;
  } else if(pdnumber === 'PD3'){
    pageDirectoryInfo.PD3 = { x, y, width: 150, height: 300, numEntries, entryHeight, Lnum };
    ArrowsPositions.pageDirectory1L0.y = y + highlightIndex * entryHeight + entryHeight / 2;
    ArrowsPositions.pageDirectory1L0Index.y = y + highlightIndex * entryHeight + entryHeight / 2 + 25;
  }

  textSize(14);
  text(translations[currentLanguage].pageDirectory, x + 25, y + 300 + 20);
  text(translations[currentLanguage].address + ": " + PPN, x, y - 10);
}

function drawPhysicalAddress(x, y) {
  // Skip if translations aren't loaded yet
  if (!translations[currentLanguage]) return;
  
  fill(250, 128, 114);                          // Red colour for Physical Address
  stroke(0);
  rect(x, y, 170, 40);                          // Combined rectangle for PPN and Offset

  fill(0);
  textSize(14);
  noStroke();

  // Display PPN3 value
  let ppnValue = editableElements.PPN3;
  
  // Display Offset value without 0x prefix and add padding
  let offsetValue = editableElements.Offset;
  if (offsetValue && offsetValue.startsWith('0x')) {
    offsetValue = offsetValue.slice(2); // Remove the '0x' prefix
  }
  
  // Add padding with leading zeros to make sure offset is always 3 digits (12 bits)
  if (offsetValue) {
    if (offsetValue.length === 1) {
      offsetValue = "00" + offsetValue; // Single digit, add two leading zeros
    } else if (offsetValue.length === 2) {
      offsetValue = "0" + offsetValue;  // Two digits, add one leading zero
    }
  }
  
  // Position the text
  text(ppnValue, x + 40, y + 25);
  text(offsetValue, x + 105, y + 25);

  // Add labels 
  text("PPN", x + 55, y + 55);       // Label for PPN
  text("Offset", x + 100, y + 55);  // Label for Offset

  textSize(14);
  text(translations[currentLanguage].physicalAddressTitle, x + 20, y - 10);
}

function drawVirtualMemorySpace(x, y) {
  // Skip if translations aren't loaded yet
  if (!translations[currentLanguage]) return;
  
  fill(255, 255, 255);      
  stroke(0);
  rect(x, y, 250, 600);    

  fill(0);
  noStroke();
  textSize(14);
  text(translations[currentLanguage].virtualMemorySpaceTitle, x + 45, y - 10);
  if (editableElements.L2 === '0') {
    text(translations[currentLanguage].usableVA + ': ' + editableElements.Memory*1000 + ' ' + translations[currentLanguage].mb, x + 50, y + 630);
  } else {
    text(translations[currentLanguage].usableVA + ': ' + editableElements.Memory + ' ' + translations[currentLanguage].gb, x + 50, y + 630);
  }
}

function drawSATP(x, y) {
  fill(173, 216, 230);                          // Light blue SATP
  stroke(0);
  rect(x, y, 100, 40);                          // SATP rectangle

  hoverElements.push({ label: 'SATP', x: x, y: y, w: 100, h: 40, key: 'SATP' });

  fill(0);
  textSize(14);
  
  // Draw the SATP text 
  noStroke();
  text("SATP", x + 40, y - 10);
}

function mousePressed() {
  if (!translations[currentLanguage]) return; // Skip if translations aren't loaded yet
  
  for (let element of hoverElements) {
    if (mouseX > element.x && mouseX < element.x + element.w &&
        mouseY > element.y && mouseY < element.y + element.h) {
      
      // Skip interaction for disabled elements
      if (editableElements.L2 === '0' && element.key === 'PPN1') continue;
      if (editableElements.L1 === '0' && element.key === 'PPN2') continue;
      if (editableElements.L0 === '0' && element.key === 'PPN3') continue;

      // Visual feedback - flash the element
      push();
      fill(100, 180, 255, 150); // Light blue flash
      noStroke();
      rect(element.x, element.y, element.w, element.h);
      pop();
      
      activeElement = element.key;
      let currentValue = editableElements[element.key];

      // Remove '0x' prefix for display in the input box
      if (['PPN1', 'PPN2', 'PPN3', 'SATP', 'Offset'].includes(element.key) && currentValue.startsWith('0x')) {
        currentValue = currentValue.slice(2);
      }

      // Create an input box at the clicked position
      let inputBox = createInput(currentValue);
      
      // Position the input box directly over the element
      inputBox.position(element.x, element.y + 50);
      
      // Set the size to match the clicked element
      inputBox.size(element.w, element.h);
      
      // Apply styles to make the input box fit properly
      inputBox.style('box-sizing', 'border-box');
      inputBox.style('margin', '0');
      inputBox.style('padding', '0 5px');
      inputBox.style('font-size', '14px');
      inputBox.style('text-align', 'center');

      setTimeout(() => {
        inputBox.elt.focus();
        inputBox.elt.select(); // Automatically select the content
      }, 10);

      // Function to save the input value
      const saveValue = function(newValue) {
        if (['L0', 'L1', 'L2'].includes(element.key)) {
          if (/^[0-9]$/.test(newValue)) {
            // Enforce hierarchy rules for page table levels
            if (element.key === 'L0' && newValue === '0') {
              // L0 can be 0 only if both L2 and L1 are 0
              if (editableElements.L2 !== '0' || editableElements.L1 !== '0') {
                alert(translations[currentLanguage].l0DependencyError || 
                      "L0 can be size 0 only when both L2 and L1 are size 0");
                inputBox.remove();
                redraw();
                return false;
              }
            } else if (element.key === 'L1' && newValue === '0') {
              // L1 can be 0 only if L2 is 0
              if (editableElements.L2 !== '0') {
                alert(translations[currentLanguage].l1DependencyError || 
                      "L1 can be size 0 only when L2 is size 0");
                inputBox.remove();
                redraw();
                return false;
              }
            } else if (element.key === 'L2' && newValue !== '0' && editableElements.L2 === '0') {
              // If L2 changes from 0 to non-zero, enforce L1 and L0 to be non-zero
              if (editableElements.L1 === '0') {
                editableElements.L1 = '9';
              }
              if (editableElements.L0 === '0') {
                editableElements.L0 = '9';
              }
            }
            
            editableElements[element.key] = newValue;
            
            // Handle dependencies when setting to zero
            if (element.key === 'L2' && newValue === '0') {
              // If L2 is set to 0, clear the L2Index
              editableElements.L2Index = '';
            }
            if (element.key === 'L1' && newValue === '0') {
              // If L1 is set to 0, clear the L1Index
              editableElements.L1Index = '';
            }
            if (element.key === 'L0' && newValue === '0') {
              // If L0 is set to 0, clear the L0Index
              editableElements.L0Index = '';
            }
            
            if (element.key === 'L1' && editableElements.L2 === '0' && newValue !== '9') {
              l1Changed = true;
            }
          } else {
            alert(translations[currentLanguage].valueErrorNumber);
            return false;
          }
        } else if (['L2Index', 'L1Index', 'L0Index'].includes(element.key)) {
          const maxIndex = Math.pow(2, parseInt(editableElements[element.key.replace('Index', '')]));
          if (/^[0-9]+$/.test(newValue) && parseInt(newValue) < maxIndex) {
            editableElements[element.key] = newValue;
          } else {
            alert(`${translations[currentLanguage].valueErrorRange} ${maxIndex - 1}.`);
            return false;
          }
        } else if (['PPN1', 'PPN2', 'PPN3', 'SATP'].includes(element.key)) {
          if (/^[0-9a-fA-F]+$/.test(newValue)) {
            // Check if the value exceeds FFFF (16 bits)
            if (parseInt(newValue, 16) > 0xFFFF) {
              alert(translations[currentLanguage].valueErrorHexRange || 
                    "Value must be a hexadecimal number not exceeding FFFF.");
              inputBox.remove();
              redraw();
              return false;
            } else {
              editableElements[element.key] = '0x' + newValue.toUpperCase();
            }
          } else {
            alert(translations[currentLanguage].valueErrorHex);
            inputBox.remove();
            redraw();
            return false;
          }
        } else if (element.key === 'Offset') {
          if (/^[0-9a-fA-F]+$/.test(newValue)) {
            // Convert to uppercase and ensure it doesn't exceed FFF (12 bits)
            newValue = newValue.toUpperCase();
            
            // Check if the value exceeds FFF (12 bits)
            if (parseInt(newValue, 16) > 0xFFF) {
              alert("Offset cannot exceed FFF (12 bits)");
              inputBox.remove();
              redraw();
              return false;
            } else {
              editableElements[element.key] = '0x' + newValue;
            }
          } else {
            alert(translations[currentLanguage].valueErrorHex);
            inputBox.remove();
            redraw();
            return false;
          }
        }
        return true;
      };

      // An event listener to handle the Enter key press
      inputBox.elt.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
          let newValue = inputBox.value();
          const isValid = saveValue(newValue);
          inputBox.remove();
          if (isValid) {
            redraw();
          }
        }
      });

      // An event listener to handle clicks outside the input box
      document.addEventListener('mousedown', function handleClickOutside(event) {
        if (!inputBox.elt.contains(event.target)) {
          let newValue = inputBox.value();
          const isValid = saveValue(newValue);
          inputBox.remove();
          if (isValid) {
            activeElement = null;
            redraw();
          }
          document.removeEventListener('mousedown', handleClickOutside);
        }
      });

      break;
    }
  }
}

function windowResized() {
  // Remove existing buttons to prevent duplicates
  removeInterfaceButtons();
  
  // Also need to remove existing modals
  for (let modalKey in modals) {
    if (modals[modalKey]) {
      modals[modalKey].remove();
    }
  }
  modals = {}; // Clear modals object
  
  resizeCanvas(windowWidth, document.body.scrollHeight);
  
  // Recalculate positions of all elements
  setup();
  
  // Load current language settings
  updateUILanguage();
  updateModalContent();
  
  // If there's an active input box, remove it to prevent positioning issues
  let existingInputs = document.querySelectorAll('input');
  existingInputs.forEach(input => {
    if (!input.id) { // Only remove our dynamically created inputs
      input.remove();
    }
  });
  
  activeElement = null;
  redraw();
}

// Helper function to remove all buttons
function removeInterfaceButtons() {
  for (let button of interfaceButtons) {
    if (button) {
      button.remove();
    }
  }
  interfaceButtons = []; // Clear the array
}

function mouseMoved() {
  redraw();
}

// Add a helper function to draw dotted lines
function drawDottedLine(x1, y1, x2, y2, spacing) {
  let spacing2 = spacing || 5;
  let d = dist(x1, y1, x2, y2);
  let steps = d / spacing2;
  for (let i = 0; i <= steps; i+=2) {
    let x = lerp(x1, x2, i/steps);
    let y = lerp(y1, y2, i/steps);
    let x2 = lerp(x1, x2, (i+1)/steps);
    let y2 = lerp(y1, y2, (i+1)/steps);
    line(x, y, x2, y2);
  }
}

// Expose changeLanguage function globally
window.changeLanguage = changeLanguage;
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
let showArrows = false;
let modals = {};
let showAllModals = false;
let highlightPage = false;
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

// Define modal content for each component
const modalContent = {
  virtualAddress: "Virtual Address: Shows the structure of a virtual address. Click on L2, L1, L0 to change page table levels, and on index fields to navigate through the page tables.",
  pageDirectory1: "Level 2 Page Directory: The first level of page tables that maps virtual addresses to the next level. Click on PPN1 to change the physical address of the next level.",
  pageDirectory2: "Level 1 Page Directory: The second level of page tables that further translates the virtual address. Click on PPN2 to change the physical address of the next level.",
  pageDirectory3: "Level 0 Page Directory: The final level of page tables that maps to actual physical memory pages. Click on PPN3 to set the physical page number.",
  physicalAddress: "Physical Address: The final translated memory address consisting of the page number (PPN3) and the offset within the page.",
  virtualMemory: "Virtual Memory Space: Shows the total addressable memory space. The size changes based on the page table levels (L2, L1, L0) configured.",
  satp: "SATP Register: Contains the physical address of the root page table (Level 2). It's the starting point for address translation.",
  arrows: "Arrows: Toggle this to visualize how the address translation flows through the page tables."
};

//First inicialization of canvas and elements
function setup() {
  canvas = createCanvas(windowWidth, document.body.scrollHeight);
  canvas.id("Canvas");
  canvas.style("z-index", "-1");
  canvas.position(0, 50);
  background(255);
  textSize(14);

  // Button to toggle arrows
  let toggleArrowsButton = createButton('Arrows');
  toggleArrowsButton.position(width - 120, 70);
  toggleArrowsButton.mousePressed(() => {
    showArrows = !showArrows;                                   // Toggle arrows
    redraw();                                                   // Refresh canvas
  });
  interfaceButtons.push(toggleArrowsButton); // Add to tracked buttons

  // Button to toggle all modals
  let toggleButton = createButton('Help');
  toggleButton.position(width - 60, 70);
  toggleButton.mousePressed(() => toggleAllModals());
  interfaceButtons.push(toggleButton); // Add to tracked buttons

  // Initialize modals
  modals.virtualAddress = createModal(width * 0.025, height * 0.13, modalContent.virtualAddress, 300, 100);
  modals.pageDirectory1 = createModal(width * 0.07, height * 0.6, modalContent.pageDirectory1, 180, 120);
  modals.pageDirectory2 = createModal(width * 0.27, height * 0.6, modalContent.pageDirectory2, 180, 120);
  modals.pageDirectory3 = createModal(width * 0.47, height * 0.6, modalContent.pageDirectory3, 180, 120);
  modals.physicalAddress = createModal(width * 0.635, height * 0.15, modalContent.physicalAddress, 200, 100);
  modals.virtualMemory = createModal(width * 0.8, height * 0.66, modalContent.virtualMemory, 250, 120);
  modals.satp = createModal(width * 0.033, height * 0.78, modalContent.satp, 200, 100);
  modals.arrows = createModal(width - 300, 100, modalContent.arrows, 200, 80);
  
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

function draw() {
  clear();
  background(255);
  drawVirtualAddress(width * 0.025, height * 0.08);
  drawSATP(width * 0.033, height * 0.857);

  if (editableElements.L2 === '0') {
    editableElements.PPN1 = '';
    editableElements.L2Index = '';
  } else if (editableElements.L2 !== '0' && editableElements.L2Index === '') {
    editableElements.PPN1 = '1A2B';
  }
  if (editableElements.L1 === '0') {
    editableElements.PPN2 = '';
    editableElements.L1Index = '';
  } else if (editableElements.L1 !== '0' && editableElements.L1Index === '') {
    editableElements.PPN2 = '3C4D';
  }
  if (editableElements.L0 === '0') {
    editableElements.PPN3 = '';
    editableElements.L0Index = '';
  } else if (editableElements.L0 !== '0' && editableElements.L0Index === '') {
    editableElements.PPN3 = '5E6F';
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

  // Disable Page Directory 1
  if (editableElements.L2 === '0') {
    fill(245);                                              // Gray colour for Page Directory
    stroke(150,150,150);
    rect(100, 200, 150, 300);                              

    let numEntries = 8;                                     // Rows in Page Directory
    let entryHeight = 300 / numEntries;                     // Height of each entry
    for (let i = 1; i < numEntries; i++) {
      line(100, 200 + i * entryHeight, 100 + 150, 200 + i * entryHeight);
    }

    line(100 + 95, 200, 100 + 95, 200 + 300);
  } else {
    drawPageDirectory(width * 0.07, height * 0.285, parseInt(editableElements.L2), parseInt(editableElements.L2Index), editableElements.SATP, 220, 'PPN1', 'PD1');
  }

  // Disable Page Directory 2  
  if (editableElements.L1 === '0') {
    fill(245);            
    stroke(150,150,150);
    rect(400, 200, 150, 300);

    let numEntries = 8; 
    let entryHeight = 300 / numEntries;
    for (let i = 1; i < numEntries; i++) {
      line(400, 200 + i * entryHeight, 400 + 150, 200 + i * entryHeight);
    }

    line(400 + 95, 200, 400 + 95, 200 + 300);
  } else {
    if (editableElements.L2 === '0'){
      drawPageDirectory(width * 0.27, height * 0.285, parseInt(editableElements.L1), parseInt(editableElements.L1Index), editableElements.SATP, 220, 'PPN2', 'PD2');
    }
    else {
      drawPageDirectory(width * 0.27, height * 0.285, parseInt(editableElements.L1), parseInt(editableElements.L1Index), editableElements.PPN1, 220, 'PPN2', 'PD2');
    }
  }

  // Disable Page Directory 3
  if (editableElements.L0 === '0') {
    fill(245);            
    stroke(150,150,150);
    rect(700, 200, 150, 300);

    let numEntries = 8; 
    let entryHeight = 300 / numEntries;
    for (let i = 1; i < numEntries; i++) {
      line(700, 200 + i * entryHeight, 700 + 150, 200 + i * entryHeight);
    }

    line(700 + 95, 200, 700 + 95, 200 + 300);
  } else {
    if (editableElements.L1 === '0'){
      drawPageDirectory(width * 0.47, height * 0.285, parseInt(editableElements.L0), parseInt(editableElements.L0Index), editableElements.SATP, 220, 'PPN3', 'PD3');
    }
    else {
      drawPageDirectory(width * 0.47, height * 0.285, parseInt(editableElements.L0), parseInt(editableElements.L0Index), editableElements.PPN2, 220, 'PPN3', 'PD3');
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
    if (
      mouseX > element.x &&
      mouseX < element.x + element.w &&
      mouseY > element.y &&
      mouseY < element.y + element.h
    ) {
      if (editableElements.L2 === '0' && element.key === 'PPN1') {
        continue;
      }
      // Highlight row labels of Page Directory
      if (['L2', 'L1', 'L0'].includes(element.key)) {
        fill(255, 255, 0, 150); // Highlight colour
        noStroke();
        rect(width * 0.8, height * 0.0715, 250, highlightHeight);
        if(editableElements[element.key] === '0') {
        } else {
          highlightRowLabels(element.key);
        }
      } else {
        fill(255, 255, 0, 150); // Highlight colour
        noStroke();
        rect(element.x, element.y, element.w, element.h);
      }

      if (['L2Index'].includes(element.key)){
        if (editableElements.L2Index === ''){
          
        }else{
          drawPageDirectory(width * 0.07, height * 0.285, parseInt(editableElements.L2), parseInt(editableElements.L2Index), editableElements.SATP, (255, 255, 0, 150), 'PPN1', 'PD1');
        }
      }

      if (['L1Index'].includes(element.key)){
        if (editableElements.L1Index === ''){
         
        }else{
          drawPageDirectory(width * 0.27, height * 0.285, parseInt(editableElements.L1), parseInt(editableElements.L1Index), editableElements.PPN1, (255, 255, 0, 150), 'PPN2', 'PD2');
        }
      }

      if (['L0Index'].includes(element.key)){
        if (editableElements.L0Index === ''){
         
        }else{
          drawPageDirectory(width * 0.47, height * 0.285, parseInt(editableElements.L0), parseInt(editableElements.L0Index), editableElements.PPN2, (255, 255, 0, 150), 'PPN3', 'PD3');
        }
      }

      if (['SATP', 'PPN1', 'PPN2', 'PPN3', 'Offset'].includes(element.key)) {
        highlightAddress(editableElements[element.key]);
      }
    }
    // Display value
    fill(0);
    textSize(14);
    noStroke();
    text(editableElements[element.key], element.x + 10, (element.y + element.h / 2) + 5);
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
    // Arrow from PD3 PPN to Physical Address
    const physAddrY = height * 0.135;
    const physAddrX = width * 0.635;
    drawMultiCornerArrow([
      [ppn3Pos.x, ppn3Pos.bottom], 
      [ppn3Pos.x, ppn3Pos.bottom + 15], 
      [physAddrX + 40, ppn3Pos.bottom + 15], 
      [physAddrX + 40, physAddrY - 10]
    ], [255, 0, 0]);
  }

  if (offsetPos) {
    // Arrow for Offset in Physical Address
    const physAddrOffsetY = height * 0.135;
    const physAddrOffsetX = width * 0.735;
    drawMultiCornerArrow([
      [offsetPos.x + 40, offsetPos.bottom], 
      [offsetPos.x + 40, offsetPos.bottom + 20], 
      [physAddrOffsetX - 50, offsetPos.bottom + 20], 
      [physAddrOffsetX - 50, physAddrOffsetY - 10],
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
    <div class="arrow-box" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; height: 100%;">
      <p>${content}</p>
    </div>
  `);
  modal.position(x, y); // Position on the canvas
  modal.size(width, height); // Width and height of the modal
  modal.style('padding', '10px');
  modal.style('border', '2px solid #333'); // Darker border for better contrast
  modal.style('background-color', '#ffffff'); // White background for cleaner look
  modal.style('border-radius', '12px'); // Slightly more rounded corners
  modal.style('box-shadow', '0 4px 8px rgba(0, 0, 0, 0.2)'); // Add shadow for depth
  modal.style('font-family', 'Arial, sans-serif'); // Cleaner font
  modal.style('color', '#333'); // Dark text for readability
  modal.style('line-height', '1.5'); // Improve text readability
  modal.style('text-align', 'left'); // Left-align text for better readability
  modal.style('transition', 'opacity 0.3s ease, transform 0.3s ease'); // Smooth transitions
  modal.style('z-index', '100'); // Ensure modals are on top
  modal.style('opacity', '0'); // Start with 0 opacity
  modal.style('transform', 'scale(0.9)'); // Start slightly smaller

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

  fill(255, 255, 0, 150);                                   // Highlight colour for row labels
  noStroke();
  textSize(14);
  noStroke();
  let numEntries = 8;
  let entryHeight = 300 / numEntries;

  // Highlight rectangle for labels
  for(let i = 0; i < num; i++) {
    rect(x - 30, y + entryHeight / 2 - 10, 30, entryHeight * numEntries);
    x += width * 0.2;
  }
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

function drawVirtualAddress(x, y) {
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
  text('Size', x + width * 0.01, y - height * 0.010);
  text('L2', x + width * 0.055, y + height * 0.075); 
  text('L1', x + width * 0.095, y + height * 0.075);  
  text('L0', x + width * 0.135, y + height * 0.075);  
  text('Offset', x + width * 0.18, y + height * 0.075);
  text('12', x + width * 0.19, y + height * -0.010);

  textSize(20);
  text('Virtual address', x + width * 0.07, y - height * 0.04);
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

  // Create or update the hover element
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
  text("Flags", x + 110, y + highlightIndex * entryHeight + entryHeight / 2 + 5);

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
    text(2 ** Lnum - 1, x - 25, y + entryHeight / 2 + 5);
    text(2 ** Lnum - 2, x - 25, y + (numEntries - 7) * entryHeight + entryHeight / 2 + 5);
    text(2 ** Lnum - 3, x - 25, y + (numEntries - 6) * entryHeight + entryHeight / 2 + 5);
    text("↑", x - 25, y + (numEntries - 5) * entryHeight + entryHeight / 2 + 5);
    text(displayText, x - 25, y + (numEntries - 4) * entryHeight + entryHeight / 2 + 5);
    text("↑", x - 25, y + (numEntries - 3) * entryHeight + entryHeight / 2 + 5);
    text(2 ** Lnum + 1 - 2 ** Lnum, x - 25, y + (numEntries - 2) * entryHeight + entryHeight / 2 + 5);
    text("0", x - 25, y + (numEntries - 1) * entryHeight + entryHeight / 2 + 5);
  }

  // Relocation of the Arrows
  if(pdnumber === 'PD1'){
    ArrowsPositions.pageDirectory1L2.y = y + highlightIndex * entryHeight + entryHeight / 2;
    ArrowsPositions.pageDirectory1L2Index.y = y + highlightIndex * entryHeight + entryHeight / 2 + 25;
  } else if(pdnumber === 'PD2'){
    ArrowsPositions.pageDirectory1L1.y = y + highlightIndex * entryHeight + entryHeight / 2;
    ArrowsPositions.pageDirectory1L1Index.y = y + highlightIndex * entryHeight + entryHeight / 2 + 25;
  }else if(pdnumber === 'PD3'){
    ArrowsPositions.pageDirectory1L0.y = y + highlightIndex * entryHeight + entryHeight / 2;
    ArrowsPositions.pageDirectory1L0Index.y = y + highlightIndex * entryHeight + entryHeight / 2 + 25;
  }

  textSize(14);
  text("Page Directory", x + 25, y + 300 + 20);
  text("Address: " + PPN, x, y - 10);
}


function drawPhysicalAddress(x, y) {
  fill(250, 128, 114);                          // Red colour for Physical Address
  stroke(0);
  rect(x, y, 100, 40);                          // PPN
  rect(x + 100, y, 70, 40);                     // Offset

  fill(0);
  textSize(14);
  noStroke();
  // text('Offset', x + 115, y + 5);

  // Display PPN3 value
  textSize(14);
  text(`${editableElements.PPN3}`, x + 10, y + 25);
  
  // Display Offset value
  text(`${editableElements.Offset}`, x + 115, y + 25);

  textSize(14);
  text('Physical Address', x + 20, y - 10);
}

function drawVirtualMemorySpace(x, y) {
  fill(255, 255, 255);      
  stroke(0);
  rect(x, y, 250, 600);    

  fill(0);
  noStroke();
  textSize(14);
  text('Virtual Memory Space', x + 45, y - 10);
  if (editableElements.L2 === '0') {
    text('Usable VA: ' + editableElements.Memory*1000 + ' MB', x + 50, y + 630);
  } else {
    text('Usable VA: ' + editableElements.Memory + ' GB', x + 50, y + 630);
  }
}

function drawSATP(x, y) {
  fill(173, 216, 230);                          // Light blue SATP
  stroke(0);
  rect(x, y, 100, 40);                          // SATP rectangle

  hoverElements.push({ label: 'SATP', x: x, y: y, w: 100, h: 40, key: 'SATP' });

  fill(0);
  textSize(14);

  // Display SATP value
  // text(editableElements.SATP, x + 10, y + 25);
}

function mousePressed() {
  for (let element of hoverElements) {
    if (
      mouseX > element.x &&
      mouseX < element.x + element.w &&
      mouseY > element.y &&
      mouseY < element.y + element.h
    ) {
      // Skip interaction if L2 is 0 and the element is in Page Directory 1
      if (editableElements.L2 === '0' && element.key === 'PPN1') {
        continue;
      }
      if (editableElements.L1 === '0' && element.key === 'PPN2') {
        continue;
      }
      if (editableElements.L0 === '0' && element.key === 'PPN3') {
        continue;
      }

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

      // An event listener to handle the Enter key press
      inputBox.elt.addEventListener('keydown', (function(inputBox, element) {
        return function(event) {
          if (event.key === 'Enter') {
            let newValue = inputBox.value();
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
            } else if (element.key === 'Offset') {
              if (/^[0-9a-fA-F]+$/.test(newValue)) {
                editableElements[element.key] = '0x' + newValue.toUpperCase();
              } else {
                alert("Hodnota musí byť platné hexadecimálne číslo.");
              }
            }
            inputBox.remove();
            redraw();
          }
        };
      })(inputBox, element));

      // An event listener to handle clicks outside the input box
      document.addEventListener('mousedown', function handleClickOutside(event) {
        if (!inputBox.elt.contains(event.target)) {
          inputBox.remove();
          activeElement = null;
          redraw();
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
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
let showArrows = false; // Track arrows visibility
let modals = {}; // Store modal elements
let showAllModals = false; // Track visibility of all modals
let highlightPage = false;
let ArrowsPositions = {
  pageDirectory1L2: {  y: 360 },
  pageDirectory1L2Index: { y: 400 },
  pageDirectory1L1: { y: 360 },
  pageDirectory1L1Index: { y: 400 },
  pageDirectory1L0: { y: 360 },
  pageDirectory1L0Index: { y: 400 },
};

function setup() {
  createCanvas(1500, 700);
  background(255);
  textSize(14);

  // Button to toggle arrows
  let toggleArrowsButton = createButton('Sipky');
  toggleArrowsButton.position(width - 120, 20); // Top-right position
  toggleArrowsButton.mousePressed(() => {
    showArrows = !showArrows; // Toggle arrows
    redraw(); // Refresh canvas
  });

  // Create a single button to toggle all modals
  let toggleButton = createButton('Pomocka');
  toggleButton.position(width - 70, 20);
  toggleButton.mousePressed(() => toggleAllModals());

  // Create modals but keep them hidden initially
  modals.modal1 = createModal(
    260,
    15,
    'Velkost',
    300,
    15
  );

  modals.modal2 = createModal(
    50,
    125,
    'Informacie o indexoch L2, L1, L0., ako funguju atd.',
    300,
    40
  );

  modals.modal3 = createModal(
    200,
    600,
    'SATP zachovava adresu prvej tabulky page directory',
    200,
    50
  );

  // Nakreslenie virtuálnej sekcie adresy
  hoverElements.push({ label: 'L2', x: 103, y: 25, w: 45, h: 25, highlight: [1, 2, 3], key: 'L2' });
  hoverElements.push({ label: 'L1', x: 153, y: 25, w: 45, h: 25, highlight: [2, 3], key: 'L1' });
  hoverElements.push({ label: 'L0', x: 203, y: 25, w: 45, h: 25, highlight: [3], key: 'L0' });
  hoverElements.push({ label: 'L2Index', x: 100, y: 50, w: 50, h: 40, highlight: [1, 2, 3], key: 'L2Index' });
  hoverElements.push({ label: 'L1Index', x: 150, y: 50, w: 50, h: 40, highlight: [2, 3], key: 'L1Index' });
  hoverElements.push({ label: 'L0Index', x: 200, y: 50, w: 50, h: 40, highlight: [3], key: 'L0Index' });
  drawVirtualAddress(50, 50);

  // Nakreslenie Page Directory 1
  drawPageDirectory(100, 200, parseInt(editableElements.L2), parseInt(editableElements.L2Index), editableElements.SATP, 220, 'PPN1', 'PD1');

  // Nakreslenie Page Directory 2
  drawPageDirectory(400, 300, parseInt(editableElements.L1), parseInt(editableElements.L1Index), editableElements.PPN1, 220), 'PPN2', 'PD2';

  // Nakreslenie Page Directory 3
  drawPageDirectory(700, 400, parseInt(editableElements.L0), parseInt(editableElements.L0Index), editableElements.PPN2, 220, 'PPN3', 'PD3');

  // Nakreslenie fyzickej sekcie adresy
  drawPhysicalAddress(950, 50);

  // Nakreslenie virtuálnej pamäťovej sekcie
  drawVirtualMemorySpace(1200, 50); 

  // Nakreslenie SATP
  hoverElements.push({ label: 'SATP', x: 50, y: 600, w: 100, h: 40, key: 'SATP' });
  drawSATP(50, 600);
}

function draw() {
  clear();
  background(255);
  drawVirtualAddress(50, 50);
  drawSATP(50, 600);

  if (editableElements.L2 === '0') {
    editableElements.PPN1 = '';
    editableElements.L2Index = '';
  }
  if (editableElements.L1 === '0') {
    editableElements.PPN2 = '';
    editableElements.L1Index = '';
  }
  if (editableElements.L0 === '0') {
    editableElements.PPN3 = '';
    editableElements.L0Index = '';
  }

  // Update Memory value based on L2, L1, and L0
  if (editableElements.L2 === '0') {
    if (editableElements.L1 === '0') {
      // If L2 and L1 are both 0, calculate memory based on L0
      editableElements.Memory = (Math.pow(2, parseInt(editableElements.L0)) * 0.000004).toFixed(6);
    } else {
      // If L2 is 0 and L1 is not 0
      editableElements.Memory = (Math.pow(2, parseInt(editableElements.L1)) * 0.002).toString();
    }
  } else {
    // If L2 is not 0, calculate memory based on L2
    editableElements.Memory = Math.pow(2, parseInt(editableElements.L2)).toString();
  }

  // Check if L2 is 0
  if (editableElements.L2 === '0') {
    fill(245);            // Jemne šedá pre Page Directory
    stroke(150,150,150);
    rect(100, 200, 150, 300); // Cela Page Directory with increased height

    // Horizontal Dividers
    let numEntries = 8; // Total number of entries
    let entryHeight = 300 / numEntries; // Height of each entry
    for (let i = 1; i < numEntries; i++) {
      line(100, 200 + i * entryHeight, 100 + 150, 200 + i * entryHeight);
    }

    line(100 + 95, 200, 100 + 95, 200 + 300);
  } else {
    drawPageDirectory(100, 200, parseInt(editableElements.L2), parseInt(editableElements.L2Index), editableElements.SATP, 220, 'PPN1', 'PD1');
  }

  if (editableElements.L1 === '0') {
    fill(245);            // Jemne šedá pre Page Directory
    stroke(150,150,150);
    rect(400, 200, 150, 300); // Cela Page Directory with increased height

    // Horizontal Dividers
    let numEntries = 8; // Total number of entries
    let entryHeight = 300 / numEntries; // Height of each entry
    for (let i = 1; i < numEntries; i++) {
      line(400, 200 + i * entryHeight, 400 + 150, 200 + i * entryHeight);
    }

    line(400 + 95, 200, 400 + 95, 200 + 300);
  } else {
    if (editableElements.L2 === '0'){
      drawPageDirectory(400, 200, parseInt(editableElements.L1), parseInt(editableElements.L1Index), editableElements.SATP, 220, 'PPN2', 'PD2');
    }
    else {
      drawPageDirectory(400, 200, parseInt(editableElements.L1), parseInt(editableElements.L1Index), editableElements.PPN1, 220, 'PPN2', 'PD2');
    }
  }

  if (editableElements.L0 === '0') {
    fill(245);            // Jemne šedá pre Page Directory
    stroke(150,150,150);
    rect(700, 200, 150, 300); // Cela Page Directory with increased height

    // Horizontal Dividers
    let numEntries = 8; // Total number of entries
    let entryHeight = 300 / numEntries; // Height of each entry
    for (let i = 1; i < numEntries; i++) {
      line(700, 200 + i * entryHeight, 700 + 150, 200 + i * entryHeight);
    }

    line(700 + 95, 200, 700 + 95, 200 + 300);
  } else {
    if (editableElements.L1 === '0'){
      drawPageDirectory(700, 200, parseInt(editableElements.L0), parseInt(editableElements.L0Index), editableElements.SATP, 220, 'PPN3', 'PD3');
    }
    else {
      drawPageDirectory(700, 200, parseInt(editableElements.L0), parseInt(editableElements.L0Index), editableElements.PPN2, 220, 'PPN3', 'PD3');
    }
  }
  drawPhysicalAddress(950, 50);
  drawVirtualMemorySpace(1200, 50);

  // Highlight part of the virtual memory space based on Memory value
  let memoryValue = parseFloat(editableElements.Memory);

  // Adjust the height calculation depending on the value of L2, L1, and L0
  let highlightHeight;

  if (editableElements.L2 === '0') {
    if (editableElements.L1 === '0') {
      // If L2 and L1 are both 0, use L0 to determine the highlight (should not exceed L1 = 1 highlight height)
      highlightHeight = highlightHeight/(2**Math.abs(parseInt(editableElements.L1 - 9)));
    } else {
      // If L2 is 0 and L1 is not 0 (should not exceed L2 = 1 highlight height)
      highlightHeight = highlightHeight/(2**Math.abs(parseInt(editableElements.L0 - 9)));
    }
  } else {
    // If L2 is not 0, use L2 to determine the highlight (full range)
    highlightHeight = 600/(2**Math.abs(parseInt(editableElements.L2 - 9)));
  }

  // Ensure highlightHeight does not exceed total height
  highlightHeight = min(highlightHeight, 600);

  for (let element of hoverElements) {
    if (
      mouseX > element.x &&
      mouseX < element.x + element.w &&
      mouseY > element.y &&
      mouseY < element.y + element.h
    ) {
      // Skip highlighting if L2 is 0 and the element is in Page Directory 1
      if (editableElements.L2 === '0' && element.key === 'PPN1') {
        continue;
      }

      if (['L2', 'L1', 'L0'].includes(element.key)) {
        // Highlight row labels instead of the entire Page Directory
        fill(255, 255, 0, 150); // Highlight color
        noStroke();
        rect(1200, 50, 250, highlightHeight);
        if(editableElements[element.key] === '0') {
        } else {
          highlightRowLabels(element.key);
        }
      } else {
        fill(255, 255, 0, 150); // Highlight color
        noStroke();
        rect(element.x, element.y, element.w, element.h);
      }

      if (['L2Index'].includes(element.key)){
        if (editableElements.L2Index === ''){
          
        }else{
          //highlightLIndexRow(element.key, editableElements.L2);
          drawPageDirectory(100, 200, parseInt(editableElements.L2), parseInt(editableElements.L2Index), editableElements.SATP, (255, 255, 0, 150), 'PPN1', 'PD1');
        }
      }

      if (['L1Index'].includes(element.key)){
        if (editableElements.L1Index === ''){
          
        }else{
          //highlightLIndexRow(element.key, editableElements.L1);
          drawPageDirectory(400, 200, parseInt(editableElements.L1), parseInt(editableElements.L1Index), editableElements.PPN1, (255, 255, 0, 150), 'PPN2', 'PD2');

        }
      }

      if (['L0Index'].includes(element.key)){
        if (editableElements.L0Index === ''){
          
        }else{
          //highlightLIndexRow(element.key, editableElements.L0);
          drawPageDirectory(700, 200, parseInt(editableElements.L0), parseInt(editableElements.L0Index), editableElements.PPN2, (255, 255, 0, 150), 'PPN3', 'PD3');

        }
      }

      if (['SATP', 'PPN1', 'PPN2', 'PPN3'].includes(element.key)) {
        highlightAddress(editableElements[element.key]);
      }
    }
    // Display value
    fill(0);
    textSize(14);
    text(editableElements[element.key], element.x + 10, (element.y + element.h / 2) + 5);
  }

  // Draw arrows if modal is not shown
  if (showArrows) {
    drawArrows();
  }
}

function drawArrows() {

  if (editableElements.L2 !== '0') {
    // Arrow from L2 to L2Index Page Directory (multiple corners)
    drawMultiCornerArrow([[125, 115], [125, 120], [50, 120], [50, ArrowsPositions.pageDirectory1L2.y], [70, ArrowsPositions.pageDirectory1L2.y]], [0, 0, 255]);
    // Arrow from L2 PPN to L1 Page Directory (multiple corners)
    drawMultiCornerArrow([[150, ArrowsPositions.pageDirectory1L2Index.y - 12], [150, ArrowsPositions.pageDirectory1L2Index.y], [300, ArrowsPositions.pageDirectory1L2Index.y], [300, 185], [390, 185]], [255, 0, 0]);
  } else {
    drawMultiCornerArrow([[60, 600], [60, 185], [390, 185], [], [390, 185]], [255, 0, 0]);
  }

  if (editableElements.L1 !== '0') {
    // Arrow from L1 to L1Index Page Directory (multiple corners)
    drawMultiCornerArrow([[175, 115], [175, 120], [330, 120], [330, ArrowsPositions.pageDirectory1L1.y], [360, ArrowsPositions.pageDirectory1L1.y]], [0, 0, 255]);
    // Arrow from L1 PPN to L0 Page Directory (multiple corners)
    drawMultiCornerArrow([[450, ArrowsPositions.pageDirectory1L1Index.y - 12], [450, ArrowsPositions.pageDirectory1L1Index.y], [600, ArrowsPositions.pageDirectory1L1Index.y], [600, 185], [690, 185]], [255, 0, 0]);
  } else {
    drawMultiCornerArrow([[60, 600], [60, 185], [690, 185], [], [690, 185]], [255, 0, 0]);
  }

  // Arrow from L0 to L0Index Page Directory (multiple corners)
  drawMultiCornerArrow([[], [240, 105], [630, 105], [630, ArrowsPositions.pageDirectory1L0.y], [660, ArrowsPositions.pageDirectory1L0.y]], [0, 0, 255]);

  // Arrow from SATP to L2 Page Directory (multiple corners)
  drawMultiCornerArrow([[60, 600], [60, 185], [90, 185], [], [90, 185]], [255, 0, 0]);

  // Arrow from L0 PPN to Physical Address (multiple corners)
  drawMultiCornerArrow([[750, ArrowsPositions.pageDirectory1L0Index.y - 12], [750, ArrowsPositions.pageDirectory1L0Index.y], [1000, ArrowsPositions.pageDirectory1L0Index.y], [1000, 95]], [255, 0, 0]);

  // Arrow for Offset in Physical Address
  drawMultiCornerArrow([[320, 70], [900, 70],[900, 130], [1080, 130], [1080, 95]], [255, 0, 0]);
}

// Helper function to draw arrows with multiple corners
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

// Helper function to draw an arrowhead
function drawArrowhead(x1, y1, x2, y2, color) {
  let arrowSize = 8;
  let angle = atan2(y2 - y1, x2 - x1);
  push();
  translate(x2, y2);
  rotate(angle);
  stroke(color[0], color[1], color[2]);
  line(0, 0, -arrowSize, arrowSize / 2);
  line(0, 0, -arrowSize, -arrowSize / 2);
  pop();
}

function toggleAllModals() {
  showAllModals = !showAllModals; // Toggle visibility state
  for (let modalKey in modals) {
    if (showAllModals) {
      modals[modalKey].style('display', 'block'); // Show modal
    } else {
      modals[modalKey].style('display', 'none'); // Hide modal
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
  modal.style('display', 'none'); // Initially hidden
  modal.style('padding', '10px');
  modal.style('border', '2px solid #000');
  modal.style('background-color', '#f0f0f0');
  modal.style('border-radius', '8px');
  return modal;
}

function highlightLIndexRow(level, Lnum) {
  let x = 100; // x position of the first page directory
  let y = 200; // y position of the first page directory
  let numEntries = 8;
  let entryHeight = 300 / numEntries;
  let middleIndex = Math.floor(numEntries / 2);

  // Adjust x position based on the level
  if (level === 'L1Index') {
    x += 300; // Move to the second page directory
  } else if (level === 'L0Index') {
    x += 600; // Move to the third page directory
  }

  fill(255, 255, 0, 150); // Highlight color
  noStroke();
  rect(x, y + middleIndex * entryHeight, 150, entryHeight);
  stroke(0);
}

function highlightRowLabels(level) {
  let x, y, Lnum, num;
  if (level === 'L2') {
    x = 100;
    y = 200;
    Lnum = parseInt(editableElements.L2);
    num = 3;
  } else if (level === 'L1') {
    x = 400;
    y = 200;
    Lnum = parseInt(editableElements.L1);
    num = 2;
  } else if (level === 'L0') {
    x = 700;
    y = 200;
    Lnum = parseInt(editableElements.L0);
    num = 1;
  }

  fill(255, 255, 0, 150); // Highlight color for row labels
  noStroke();
  textSize(14);
  let numEntries = 8;
  let entryHeight = 300 / numEntries;

  for(let i = 0; i < num; i++) {
    // Draw rectangles behind the text
    rect(x - 30, y + entryHeight / 2 - 10, 30, 20);
    rect(x - 30, y + (numEntries - 7) * entryHeight + entryHeight / 2 - 10, 30, 20);
    rect(x - 30, y + (numEntries - 6) * entryHeight + entryHeight / 2 - 10, 30, 20);
    rect(x - 30, y + (numEntries - 5) * entryHeight + entryHeight / 2 - 10, 30, 20);
    rect(x - 30, y + (numEntries - 4) * entryHeight + entryHeight / 2 - 10, 30, 20);
    rect(x - 30, y + (numEntries - 3) * entryHeight + entryHeight / 2 - 10, 30, 20);
    rect(x - 30, y + (numEntries - 2) * entryHeight + entryHeight / 2 - 10, 30, 20);
    rect(x - 30, y + (numEntries - 1) * entryHeight + entryHeight / 2 - 10, 30, 20);

    x += 300;
  }
}

function highlightAddress(address) {
  fill(255, 255, 0, 150); // Highlight color
  noStroke();
  textSize(14);

  // Find the position of the address
  let x, y;
  if (address === editableElements.SATP && editableElements.L2 !== '0') {
    x = 100;
    y = 200;
  } else if ((address === editableElements.PPN1 || address === editableElements.SATP)  && editableElements.L1 !== '0') {
    x = 400;
    y = 200;
  } else if ((address === editableElements.PPN2 || address === editableElements.SATP) && editableElements.L0 !== '0') {
    x = 700;
    y = 200;
  } else if (address === editableElements.PPN3) {
    x = 950;
    y = 80;
  }

  // Draw a rectangle behind the address text
  rect(x, y - 20, 100, 20);
  fill(0);
}

function drawVirtualAddress(x, y) {
  fill(173, 216, 230);      // Jemne modrá pre virtuálnu adresu
  stroke(0);
  rect(x, y, 50, 40);       // EXT
  rect(x + 50, y, 50, 40);  // L2
  rect(x + 100, y, 50, 40); // L1
  rect(x + 150, y, 50, 40); // L0
  rect(x + 200, y, 70, 40); // Offset

  fill(0);
  textSize(14);
  text('EXT', x + 15, y + 25);
  text('L2', x + 65, y + 60); 
  text('L1', x + 115, y + 60);  
  text('L0', x + 165, y + 60);  
  text('Offset', x + 220, y + 25);

  // Názov virtuálnej adresy
  textSize(14);
  text('Virtual address', x + 50, y - 30);
}

function drawPageDirectory(x, y, Lnum, Lindex, PPN, color, key, pdnumber) {

  // if (key === 'PPN1') {
  //   pageDirectoryPositions.pageDirectory1 = { x, y };
  // } else if (key === 'PPN2') {
  //   pageDirectoryPositions.pageDirectory2 = { x, y };
  // } else if (key === 'PPN3') {
  //   pageDirectoryPositions.pageDirectory3 = { x, y };
  // }

  fill(240);            // Jemne šedá pre Page Directory
  stroke(0);
  rect(x, y, 150, 300); // Cela Page Directory with increased height

  // Horizontal Dividers
  let numEntries = 8; // Total number of entries
  if (Lnum === 1) {
    numEntries = 2;
  }
  if (Lnum === 2) {
    numEntries = 4;
  }
  let entryHeight = 300 / numEntries; // Height of each entry
  for (let i = 1; i < numEntries; i++) {
    line(x, y + i * entryHeight, x + 150, y + i * entryHeight);
  }

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

  // Delenie PPN a Flags
  line(x + 100, y + highlightIndex * entryHeight, x + 100, y + (highlightIndex + 1) * entryHeight);

  // Šedý riadok pre PPN a Flags
  fill(color);
  noStroke();
  rect(x, y + highlightIndex * entryHeight, 150, entryHeight);
  fill(255);
  stroke(0);

  // Create or update the hover element
  let hoverElement = hoverElements.find(el => el.key === key);
  if (!hoverElement) {
    hoverElement = { label: 'PPN', x: x + 5, y: y + highlightIndex * entryHeight + entryHeight / 2 + 15, w: 85, h: 30, key: key };
    hoverElements.push(hoverElement);
  } else {
    hoverElement.x = x + 5;
    hoverElement.y = y + highlightIndex * entryHeight + entryHeight / 2 - 15;
  }

  line(x + 95, y, x + 95, y + 300);

  // Názov Flags
  textSize(14);
  fill(0);
  text("Flags", x + 110, y + highlightIndex * entryHeight + entryHeight / 2 + 5);

  if(Lnum === 1){
    text("1", x - 25, y + (numEntries - 2) * entryHeight + entryHeight / 2 + 5);
    text("0", x - 25, y + (numEntries - 1) * entryHeight + entryHeight / 2 + 5);
  } else if(Lnum === 2){
    text("3", x - 25, y + (numEntries - 4) * entryHeight + entryHeight / 2 + 5);
    text("2", x - 25, y + (numEntries - 3) * entryHeight + entryHeight / 2 + 5);
    text("1", x - 25, y + (numEntries - 2) * entryHeight + entryHeight / 2 + 5);
    text("0", x - 25, y + (numEntries - 1) * entryHeight + entryHeight / 2 + 5);
  } else{
    // Číselné označenie pre viacero riadkov
    text(2 ** Lnum - 1, x - 25, y + entryHeight / 2 + 5);
    text(2 ** Lnum - 2, x - 25, y + (numEntries - 7) * entryHeight + entryHeight / 2 + 5);
    text(2 ** Lnum - 3, x - 25, y + (numEntries - 6) * entryHeight + entryHeight / 2 + 5);
    text("↑", x - 25, y + (numEntries - 5) * entryHeight + entryHeight / 2 + 5);
    text(Lindex, x - 25, y + (numEntries - 4) * entryHeight + entryHeight / 2 + 5);
    text("↑", x - 25, y + (numEntries - 3) * entryHeight + entryHeight / 2 + 5);
    text(2 ** Lnum + 1 - 2 ** Lnum, x - 25, y + (numEntries - 2) * entryHeight + entryHeight / 2 + 5);
    text("0", x - 25, y + (numEntries - 1) * entryHeight + entryHeight / 2 + 5);
  }

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

  // Display PPN in hexadecimal
  // if (editableElements[`PPN${Lnum}`]) {
  //   fill(0);
  //   text(`PPN: 0x${editableElements[`PPN${Lnum}`]}`, x + 10, y + highlightIndex * entryHeight + entryHeight / 2 + 5);
  // }

  // Názov Page Directory
  textSize(14);
  text("Page Directory", x + 25, y + 300 + 20);
  text("Address: " + PPN, x, y - 10);
}


function drawPhysicalAddress(x, y) {
  fill(250, 128, 114);      // Jemne červená pre fyzickú adresu
  stroke(0);
  rect(x, y, 100, 40);      // PPN
  rect(x + 100, y, 70, 40); // Offset

  fill(0);
  textSize(14);
  // text('PPN', x + 35, y + 25);
  text('Offset', x + 115, y + 25);

  // Display PPN3 value
  textSize(14);
  text(`${editableElements.PPN3}`, x + 10, y + 25);

  textSize(14);
  text('Physical Address', x + 20, y - 10);
}

function drawVirtualMemorySpace(x, y) {
  fill(255, 255, 255);      // Jemne zelená pre virtuálnu pamäťovú sekciu
  stroke(0);
  rect(x, y, 250, 600);     // Cela virtuálna pamäťová sekcia

  fill(0);
  textSize(14);
  text('Virtual Memory Space', x + 45, y - 10);
  if (editableElements.L2 === '0') {
    text('Usable VA: ' + editableElements.Memory*1000 + ' MB', x + 50, y + 630);
  } else {
    text('Usable VA: ' + editableElements.Memory + ' GB', x + 50, y + 630);
  }
}

function drawSATP(x, y) {
  fill(173, 216, 230); // Jemne modrá pre SATP
  stroke(0);
  rect(x, y, 100, 40); // SATP rectangle

  fill(0);
  textSize(14);
  // text('SATP', x + 30, y + 25);

  // Display SATP value
  text(editableElements.SATP, x + 10, y + 25);
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
      if (['PPN1', 'PPN2', 'PPN3', 'SATP'].includes(element.key) && currentValue.startsWith('0x')) {
        currentValue = currentValue.slice(2);
      }

      // Create an input box at the clicked position
      let inputBox = createInput(currentValue);
      inputBox.position(element.x + 17, element.y +13);
      inputBox.size(element.w - 5, element.h - 5); // Set the size to match the clicked element
      inputBox.elt.focus();
      inputBox.elt.select(); // Automatically select the content

      // Add an event listener to handle the Enter key press
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
            } else if (['PPN1', 'PPN2', 'PPN3'].includes(element.key)) {
              if (/^[0-9a-fA-F]+$/.test(newValue)) {
                editableElements[element.key] = '0x' + newValue.toUpperCase();
              } else {
                alert("Hodnota musí byť platné hexadecimálne číslo.");
              }
            } else if (element.key === 'SATP') {
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

      // Add an event listener to handle clicks outside the input box
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

function mouseMoved() {
  redraw();
}

function mouseMoved() {
  redraw();
}

function mouseMoved() {
  redraw();
}
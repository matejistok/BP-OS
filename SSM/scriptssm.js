// We have only one dataBlock in our array:
let dataBlocks = [
  { id: "dataBlock1", x: 1250, y: 100, w: 300, h: 150, label: "data" }
];

let canvas;

// This array will hold the "active" arrows we want to draw.
let activeArrows = [];
let indirectArrowsVisible = false;
let indirectArrows = [];

// Initially, the data block is hidden
let showDataBlock = false; 

let movingData = null;

let animationInProgress = false;

let fileImg;

// Function to highlight a row with grey background
function highlightRow(rowId, highlight) {
  const row = document.getElementById(rowId);
  if (row) {
    if (highlight) {
      // Apply grey background but preserve hover effect
      row.setAttribute('data-highlighted', 'true');
      row.style.backgroundColor = "#e0e0e0"; // Light grey color
      
      // Add a hover event listener
      if (!row.hasHoverListeners) {
        row.addEventListener('mouseenter', function() {
          if (this.getAttribute('data-highlighted') === 'true') {
            this.style.backgroundColor = "rgb(255, 248, 152)";
          }
        });
        
        row.addEventListener('mouseleave', function() {
          if (this.getAttribute('data-highlighted') === 'true') {
            this.style.backgroundColor = "#e0e0e0";
          }
        });
        
        row.hasHoverListeners = true;
      }
    } else {
      // Reset to default
      row.setAttribute('data-highlighted', 'false');
      row.style.backgroundColor = "";
    }
  }
}

// Clear all highlighted rows
function clearAllHighlights() {
  const rowIds = ["addr1Row", "addr2Row", "addr12Row", "indirectRow", "dIndirectRow",
                  "indBlockAddr1", "indBlockAddr2", "indBlockAddr256", 
                  "DAddr1Row", "DAddr2Row", "DAddr256Row",
                  "indBlock2Addr1", "indBlock2Addr2", "indBlock2Addr256"];
  rowIds.forEach(id => highlightRow(id, false));
}

// Update row highlights based on active arrows and indirect arrows
function updateRowHighlights() {
  clearAllHighlights();
  
  // Highlight rows with active arrows
  activeArrows.forEach(arrow => {
    highlightRow(arrow.start, true);
  });
  
  // Highlight rows with indirect arrows
  indirectArrows.forEach(arrow => {
    highlightRow(arrow.start, true);
    highlightRow(arrow.end, true);
  });
}

function preload() {
  fileImg = loadImage("hdd.png"); // Ensure you have a file image named 'hdd.png'
}

function setup() {
  // Create a canvas that spans the full page behind content
  canvas = createCanvas(windowWidth, document.body.scrollHeight);
  canvas.id("arrowCanvas");

  // Fix: Prevent canvas from capturing all mouse clicks
  canvas.style("pointer-events", "none");

  // Add click listeners for each row you want to connect
  const row1 = document.getElementById("addr1Row");
  const row2 = document.getElementById("addr2Row");
  const row12 = document.getElementById("addr12Row");
  const indirectRow = document.getElementById("indirectRow");
  const indBlockAddr1 = document.getElementById("indBlockAddr1");
  const indBlockAddr2 = document.getElementById("indBlockAddr2");
  const indBlockAddr256 = document.getElementById("indBlockAddr256");
  const dIndirectRow = document.getElementById("dIndirectRow");
  const DAddr1Row = document.getElementById("DAddr1Row");
  const DAddr2Row = document.getElementById("DAddr2Row");
  const DAddr256Row = document.getElementById("DAddr256Row");
  const indBlock2Addr1 = document.getElementById("indBlock2Addr1");
  const indBlock2Addr2 = document.getElementById("indBlock2Addr2");
  const indBlock2Addr256 = document.getElementById("indBlock2Addr256");

  // Initialize permanent indirect arrows that will always be displayed
  indirectArrows.push({ 
    start: "indirectRow", 
    end: "indBlockAddr1", 
    offsetStartX: 0, 
    offsetStartY: 0, 
    offsetEndX: -150, 
    offsetEndY: 0 
  });
  
  indirectArrows.push({ 
    start: "dIndirectRow", 
    end: "DAddr1Row", 
    offsetStartX: -50, 
    offsetStartY: 15, 
    offsetEndX: 100, 
    offsetEndY: -20 
  });
  
  indirectArrowsVisible = true;
  
  // Set initial row highlights for the permanent arrows
  highlightRow("indirectRow", true);
  highlightRow("indBlockAddr1", true);
  highlightRow("dIndirectRow", true);
  highlightRow("DAddr1Row", true);

  if (row1) {
    console.log("addr1Row element found");
    row1.addEventListener("click", () => {
      console.log("addr1Row clicked");
      // Check if the arrow already exists
      const arrowExists = activeArrows.some(arrow => arrow.start === "addr1Row" && arrow.end === "dataBlock1");
      if (!arrowExists) {
        startDataMove("addr1Row", "dataBlock1");
        updateRowHighlights();
      }
    });
  }

  if (row2) {
    console.log("addr2Row element found");
    row2.addEventListener("click", () => {
      console.log("addr2Row clicked");
      const arrowExists = activeArrows.some(arrow => arrow.start === "addr2Row" && arrow.end === "dataBlock1");
      if (!arrowExists) {
        startDataMove("addr2Row", "dataBlock1");
        updateRowHighlights();
      }
    });
  }

  // Remove click event for indirectRow since we want it to always show the arrow
  if (indirectRow) {
    console.log("indirectRow element found");
    // No click event listener - the arrow is permanent
  }

  if (indBlockAddr1) {
    console.log("indBlockAddr1 element found");
    indBlockAddr1.addEventListener("click", () => {
      console.log("indBlockAddr1 clicked");
      const arrowExists = activeArrows.some(arrow => arrow.start === "indBlockAddr1" && arrow.end === "dataBlock1");
      if (!arrowExists) {
        startDataMove("indBlockAddr1", "dataBlock1");
        updateRowHighlights();
      }
    });
  }

  if (indBlockAddr2) {
    console.log("indBlockAddr2 element found");
    indBlockAddr2.addEventListener("click", () => {
      console.log("indBlockAddr2 clicked");
      startDataMove("indBlockAddr2", "dataBlock1");
      updateRowHighlights();
    });
  }

  if (indBlockAddr256) {
    console.log("indBlockAddr256 element found");
    indBlockAddr256.addEventListener("click", () => {
      console.log("indBlockAddr256 clicked");
      startDataMove("indBlockAddr256", "dataBlock1");
      updateRowHighlights();
    });
  }

  // Remove click event for dIndirectRow since we want it to always show the arrow
  if (dIndirectRow) {
    console.log("dIndirectRow element found");
    // No click event listener - the arrow is permanent
  }

  if (DAddr1Row) {
    console.log("DAddr1Row element found");
    DAddr1Row.addEventListener("click", () => {
      console.log("DAddr1Row clicked");
      
      // Check if this arrow already exists
      const arrowExists = indirectArrows.some(arrow => 
        arrow.start === "DAddr1Row" && arrow.end === "indBlock2Addr1");
      
      if (arrowExists) {
        // Remove only this arrow
        indirectArrows = indirectArrows.filter(arrow => 
          !(arrow.start === "DAddr1Row" && arrow.end === "indBlock2Addr1"));
      } else {
        // First remove any arrows from other DAddr rows to indBlock2Addr1
        indirectArrows = indirectArrows.filter(arrow => 
          !(arrow.end === "indBlock2Addr1" && 
            (arrow.start === "DAddr2Row" || arrow.start === "DAddr256Row")));
        
        // Preserve the permanent arrows when filtering
        const permanentArrows = indirectArrows.filter(arrow => 
          (arrow.start === "indirectRow" && arrow.end === "indBlockAddr1") ||
          (arrow.start === "dIndirectRow" && arrow.end === "DAddr1Row")
        );
        
        // Add this arrow
        permanentArrows.push({ 
          start: "DAddr1Row", 
          end: "indBlock2Addr1", 
          offsetStartX: 0, 
          offsetStartY: 0, 
          offsetEndX: -150, 
          offsetEndY: 0 
        });
        
        indirectArrows = permanentArrows;
  
        document.getElementById("indBlock2Addr1").children[0].innerText = "267";
        document.getElementById("indBlock2Addr2").children[0].innerText = "268";
        document.getElementById("indBlock2Addr256").children[0].innerText = "522";
        document.getElementById("indBlock2Addr1").children[1].innerText = "0";
        document.getElementById("indBlock2Addr2").children[1].innerText = "1";
        document.getElementById("indBlock2Addr256").children[1].innerText = "255";
      }
      
      indirectArrowsVisible = indirectArrows.length > 0;
      updateRowHighlights();
    });
  }

  if (DAddr2Row) {
    console.log("DAddr2Row element found");
    DAddr2Row.addEventListener("click", () => {
      console.log("DAddr2Row clicked");
      
      // Check if this arrow already exists
      const arrowExists = indirectArrows.some(arrow => 
        arrow.start === "DAddr2Row" && arrow.end === "indBlock2Addr1");
      
      if (arrowExists) {
        // Remove only this arrow
        indirectArrows = indirectArrows.filter(arrow => 
          !(arrow.start === "DAddr2Row" && arrow.end === "indBlock2Addr1"));
      } else {
        // First remove any arrows from other DAddr rows to indBlock2Addr1
        indirectArrows = indirectArrows.filter(arrow => 
          !(arrow.end === "indBlock2Addr1" && 
            (arrow.start === "DAddr1Row" || arrow.start === "DAddr256Row")));
        
        // Preserve the permanent arrows when filtering
        const permanentArrows = indirectArrows.filter(arrow => 
          (arrow.start === "indirectRow" && arrow.end === "indBlockAddr1") ||
          (arrow.start === "dIndirectRow" && arrow.end === "DAddr1Row")
        );
        
        // Add this arrow
        permanentArrows.push({ 
          start: "DAddr2Row", 
          end: "indBlock2Addr1", 
          offsetStartX: 0, 
          offsetStartY: 0, 
          offsetEndX: -150, 
          offsetEndY: 0 
        });
        
        indirectArrows = permanentArrows;
  
        document.getElementById("indBlock2Addr1").children[0].innerText = "523";
        document.getElementById("indBlock2Addr2").children[0].innerText = "524";
        document.getElementById("indBlock2Addr256").children[0].innerText = "779";
        document.getElementById("indBlock2Addr1").children[1].innerText = "256";
        document.getElementById("indBlock2Addr2").children[1].innerText = "257";
        document.getElementById("indBlock2Addr256").children[1].innerText = "258";
      }
      
      indirectArrowsVisible = indirectArrows.length > 0;
      updateRowHighlights();
    });
  }

  if (DAddr256Row) {
    console.log("DAddr256Row element found");
    DAddr256Row.addEventListener("click", () => {
      console.log("DAddr256Row clicked");
      
      // Check if this arrow already exists
      const arrowExists = indirectArrows.some(arrow => 
        arrow.start === "DAddr256Row" && arrow.end === "indBlock2Addr1");
      
      if (arrowExists) {
        // Remove only this arrow
        indirectArrows = indirectArrows.filter(arrow => 
          !(arrow.start === "DAddr256Row" && arrow.end === "indBlock2Addr1"));
      } else {
        // First remove any arrows from other DAddr rows to indBlock2Addr1
        indirectArrows = indirectArrows.filter(arrow => 
          !(arrow.end === "indBlock2Addr1" && 
            (arrow.start === "DAddr1Row" || arrow.start === "DAddr2Row")));
        
        // Preserve the permanent arrows when filtering
        const permanentArrows = indirectArrows.filter(arrow => 
          (arrow.start === "indirectRow" && arrow.end === "indBlockAddr1") ||
          (arrow.start === "dIndirectRow" && arrow.end === "DAddr1Row")
        );
        
        // Add this arrow
        permanentArrows.push({ 
          start: "DAddr256Row", 
          end: "indBlock2Addr1", 
          offsetStartX: 0, 
          offsetStartY: 0, 
          offsetEndX: -150, 
          offsetEndY: 0 
        });
        
        indirectArrows = permanentArrows;
  
        document.getElementById("indBlock2Addr1").children[0].innerText = "65547";
        document.getElementById("indBlock2Addr2").children[0].innerText = "65548";
        document.getElementById("indBlock2Addr256").children[0].innerText = "65803";
        document.getElementById("indBlock2Addr1").children[1].innerText = "65280";
        document.getElementById("indBlock2Addr2").children[1].innerText = "65281";
        document.getElementById("indBlock2Addr256").children[1].innerText = "65535";
      }
      
      indirectArrowsVisible = indirectArrows.length > 0;
      updateRowHighlights();
    });
  }

  if (indBlock2Addr1) {
    console.log("indBlock2Addr1 element found");
    indBlock2Addr1.addEventListener("click", () => {
      console.log("indBlock2Addr1 clicked");
      startDataMove("indBlock2Addr1", "dataBlock1");
      updateRowHighlights();
    });
  }

  if (indBlock2Addr2) {
    console.log("indBlock2Addr2 element found");
    indBlock2Addr2.addEventListener("click", () => {
      console.log("indBlock2Addr2 clicked");
      startDataMove("indBlock2Addr2", "dataBlock1");
      updateRowHighlights();
    });
  }

  if (indBlock2Addr256) {
    console.log("indBlock2Addr256 element found");
    indBlock2Addr256.addEventListener("click", () => {
      console.log("indBlock2Addr256 clicked");
      startDataMove("indBlock2Addr256", "dataBlock1");
      updateRowHighlights();
    });
  }
}

function draw() {
  // Clear background each frame
  clear();
  
  // Draw the data block only if it is visible
  if (showDataBlock) {
    for (let block of dataBlocks) {
      drawDataBlock(block);
    }

    // Draw arrows only when the data block is visible
    for (let arrow of activeArrows) {
      drawArrowFromRowToBlock(arrow.start, arrow.end, 0, 0, 0, 0);
    }
  }

  // Draw indirect arrows
  for (let arrow of indirectArrows) {
    drawArrowFromRowToBlock(arrow.start, arrow.end, arrow.offsetStartX, arrow.offsetStartY, arrow.offsetEndX, arrow.offsetEndY);
  }

  // Draw moving data if animation is in progress
  if (movingData) {
    push();
    translate(movingData.x, movingData.y);
    rotate(radians(movingData.rotation || 0));
    
    // Apply scale transformation
    scale(movingData.scale);
    
    // Draw animated data block
    drawingContext.shadowOffsetX = 3;
    drawingContext.shadowOffsetY = 3;
    drawingContext.shadowBlur = 8;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.2)';
    
    // Create gradient for the moving block
    let gradient = drawingContext.createRadialGradient(0, 0, 0, 0, 0, 50);
    gradient.addColorStop(0, '#e6f2ff');
    gradient.addColorStop(1, '#b8daff');
    
    drawingContext.fillStyle = gradient;
    
    // Draw rounded rectangle
    drawingContext.beginPath();
    drawingContext.roundRect(-50, -50, 100, 100, 15);
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
    textSize(20);
    textStyle(BOLD);
    text("data", 0, 0);
    
    // Add binary data visual
    textSize(10);
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
      scale: 1.0, // Starting scale
      targetScale: 0.6, // Target scale when moving down to file (smaller)
      rotation: 0 // Add rotation for more dynamic animation
  };

  updateRowHighlights();
}

// Move data smoothly toward target
function moveData() {
  if (!movingData) return;

  movingData.x += (movingData.targetX - movingData.x) * 0.1;
  movingData.y += (movingData.targetY - movingData.y) * 0.1;
  
  // Animate scale based on vertical direction
  movingData.scale += (movingData.targetScale - movingData.scale) * 0.1;
  
  // Add slight rotation for more dynamic movement
  movingData.rotation = sin(frameCount * 0.05) * 5;

  if (abs(movingData.x - movingData.targetX) < 1 && abs(movingData.y - movingData.targetY) < 1) {
      if (movingData.phase === "backToFile") {
          // Save which rows have indirect arrows before animation continues
          let indirectHighlightedRows = [];
          indirectArrows.forEach(arrow => {
              indirectHighlightedRows.push(arrow.start);
              indirectHighlightedRows.push(arrow.end);
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
                  scale: 0.6, // Starting scale (smaller)
                  targetScale: 1.0, // Target scale when moving up to data block (larger)
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
          
          // Update row highlights based on new activeArrows and existing indirectArrows
          updateRowHighlights();
      }
  }
}

// Draw arrow from row to block with enhanced styling
function drawArrowFromRowToBlock(startElemId, endElemId, offsetStartX, offsetStartY, offsetEndX, offsetEndY) {
  const startElem = document.getElementById(startElemId);
  if (!startElem) return;

  // Get the center of the start table cell
  let startRect = startElem.getBoundingClientRect();
  let startX = startRect.left + startRect.width / 2 + 150 + offsetStartX;
  let startY = startRect.top + startRect.height / 2 + window.scrollY + offsetStartY;

  // Set arrow style based on type
  if (startElemId.includes("indirect") || startElemId.includes("dIndirect") || 
      endElemId.includes("indBlock") || endElemId.includes("DAddr")) {
    // Make indirect arrows visually distinct
    stroke(70, 130, 180); // Steel blue color
    strokeWeight(2.5);
  } else {
    // Regular arrows
    stroke(0, 0, 0);
    strokeWeight(2);
  }

  // For the "end," we see if it's an element in the DOM
  const endElem = document.getElementById(endElemId);
  if (endElem) {
    // If there's a real element with that ID
    let endRect = endElem.getBoundingClientRect();
    let endX = endRect.left + endRect.width / 2 + offsetEndX;
    let endY = endRect.top + endRect.height / 2 + window.scrollY + offsetEndY;
    lineWithArrowhead(startX, startY, endX, endY);
  } else {
    // Otherwise, check our dataBlocks array
    let block = dataBlocks.find(b => b.id === endElemId);
    if (!block) return;
    let blockCenterX = block.x + block.w / 2;
    let blockCenterY = block.y + block.h / 2;
    lineWithArrowhead(startX, startY, blockCenterX - 150, blockCenterY);
  }
}

// Draw line + arrowhead from (x1,y1) to (x2,y2) with enhanced styling
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

// Keep canvas size in sync with window size
function windowResized() {
  resizeCanvas(windowWidth, document.body.scrollHeight);
}

// After all other code, at the end of the file
// Add this separate DOM ready event listener to ensure tooltips work properly
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Bootstrap tooltips explicitly
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  
  // Use Array.from for better browser compatibility
  Array.from(tooltipTriggerList).forEach(tooltipTriggerEl => {
    new bootstrap.Tooltip(tooltipTriggerEl, {
      html: true,
      trigger: 'hover focus', // Make sure tooltips respond to hover
      container: 'body',
      boundary: 'window',
      template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner" style="max-width: 300px;"></div></div>'
    });
  });
  
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
});

// Also add a window load event listener as a backup
window.addEventListener('load', function() {
  // Re-initialize tooltips again after window load
  // This ensures they work even if DOMContentLoaded didn't properly initialize them
  setTimeout(() => {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    Array.from(tooltipTriggerList).forEach(tooltipTriggerEl => {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }, 500); // Small delay to ensure everything is rendered
});
// We have only one dataBlock in our array:
let dataBlocks = [
  {
    id: "dataBlock1",
    x: 550,
    y: 150,
    w: 300,
    h: 150,
    label: "data"
  },
  {
    id: "dataBlock2",
    x: 950,
    y: 420,
    w: 300,
    h: 150,
    label: "data"
  }
];

let canvas;

// This array will hold the “active” arrows we want to draw.
let activeArrows = []; 

// Initially, the data block is hidden
let showDataBlock = false; 

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

  if (row1) {
    console.log("addr1Row element found");
    row1.addEventListener("click", () => {
      console.log("addr1Row clicked");
      showDataBlock = true; // Show the data block
      activeArrows = [{ start: "addr1Row", end: "dataBlock1" }]; // Draw arrow
    });
  }

  if (row2) {
    console.log("addr2Row element found");
    row2.addEventListener("click", () => {
      console.log("addr2Row clicked");
      showDataBlock = true; // Show the data block
      activeArrows = [{ start: "addr2Row", end: "dataBlock1" }]; // Draw arrow
    });
  }

  if (row12) {
    console.log("addr12Row element found");
    row12.addEventListener("click", () => {
      console.log("addr12Row clicked");
      showDataBlock = true; // Show the data block
      activeArrows = [{ start: "addr12Row", end: "dataBlock1" }]; // Draw arrow
    });
  }

  if (indirectRow) {
    console.log("indirectRow element found");
    indirectRow.addEventListener("click", () => {
      console.log("indirectRow clicked");
      showDataBlock = true; // Show the data block
      activeArrows = [{ start: "indirectRow", end: "indBlockAddr1" }]; // Draw arrow
    });
  }

  if (indBlockAddr1) {
    console.log("indBlockAddr1 element found");
    indBlockAddr1.addEventListener("click", () => {
      console.log("indBlockAddr1 clicked");
      showDataBlock = true; // Show the data block
      activeArrows = [{ start: "indBlockAddr1", end: "dataBlock2" }]; // Draw arrow
    });
  }

  if (indBlockAddr2) {
    console.log("indBlockAddr2 element found");
    indBlockAddr2.addEventListener("click", () => {
      console.log("indBlockAddr2 clicked");
      showDataBlock = true; // Show the data block
      activeArrows = [{ start: "indBlockAddr2", end: "dataBlock2" }]; // Draw arrow
    });
  }

  if (indBlockAddr256) {
    console.log("indBlockAddr256 element found");
    indBlockAddr256.addEventListener("click", () => {
      console.log("indBlockAddr256 clicked");
      showDataBlock = true; // Show the data block
      activeArrows = [{ start: "indBlockAddr256", end: "dataBlock2" }]; // Draw arrow
    });
  }
}

function draw() {
  // Clear background each frame
  clear();
  stroke(0);
  strokeWeight(2);

  // Draw the data block only if it is visible
  if (showDataBlock) {
    for (let block of dataBlocks) {
      drawDataBlock(block);
    }

    // Draw arrows only when the data block is visible
    for (let arrow of activeArrows) {
      drawArrowFromRowToBlock(arrow.start, arrow.end);
    }
  }
}

// Draw the data block rectangle with text
function drawDataBlock(block) {
  fill(230);
  rect(block.x, block.y, block.w, block.h, 5);
  fill(0);
  textSize(30);
  textAlign(CENTER, CENTER);
  text(block.label, block.x + block.w / 2, block.y + block.h / 2);
}

/**
 * Connect a table row (startElemId) to either another table row
 * or one of our data block rectangles (endElemId).
 */
function drawArrowFromRowToBlock(startElemId, endElemId) {
  const startElem = document.getElementById(startElemId);
  if (!startElem) return;

  // Get the center of the start table cell
  let startRect = startElem.getBoundingClientRect();
  let startX = startRect.left + startRect.width / 2 + 150;
  let startY = startRect.top + startRect.height / 2 + window.scrollY;

  // For the "end," we see if it's an element in the DOM
  const endElem = document.getElementById(endElemId);
  if (endElem) {
    // If there's a real element with that ID
    let endRect = endElem.getBoundingClientRect();
    let endX = endRect.left + endRect.width / 2;
    let endY = endRect.top + endRect.height / 2 + window.scrollY;
    lineWithArrowhead(startX, startY, endX, endY);
  } else {
    // Otherwise, check our dataBlocks array
    let block = dataBlocks.find(b => b.id === endElemId);
    if (!block) return;
    let blockCenterX = block.x + block.w / 2;
    let blockCenterY = block.y + block.h / 2;
    lineWithArrowhead(startX, startY, blockCenterX - 50, blockCenterY);
  }
}

// Draw line + arrowhead from (x1,y1) to (x2,y2)
function lineWithArrowhead(x1, y1, x2, y2) {
  line(x1, y1, x2, y2);
  push();
  translate(x2, y2);
  let angle = atan2(y2 - y1, x2 - x1);
  rotate(angle);
  let arrowSize = 8;
  line(0, 0, -arrowSize, -arrowSize / 2);
  line(0, 0, -arrowSize, arrowSize / 2);
  pop();
}

// Keep canvas size in sync with window size
function windowResized() {
  resizeCanvas(windowWidth, document.body.scrollHeight);
}
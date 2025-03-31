// Constants
const PGSIZE = 1000; // PGSIZE is 1000
const ADDR_ALIGN = 1000; // Address alignment for better readability

// Global variables
let fdTable = [
    { mode: 'r', fd: 3, size: 4*PGSIZE, mapped: false },
    { mode: 'rw', fd: 4, size: 2*PGSIZE, mapped: false },
    { mode: 'r', fd: 5, size: 8*PGSIZE, mapped: false },
    { mode: 'rw', fd: 6, size: 10*PGSIZE, mapped: false }
];

let selectedFd = null;
let mmapResult = null;
let p5Canvas;
let currentMapping = null; // Only store one mapping

// Functions to toggle dropdown menus
function toggleProtectionDropdown() {
    document.getElementById("protDropdown").classList.toggle("show");
}

function toggleFlagsDropdown() {
    document.getElementById("flagsDropdown").classList.toggle("show");
}

// Close dropdowns when clicking outside
window.onclick = function(event) {
    if (!event.target.matches('#protectionOptions') && !event.target.matches('#flagsOptions')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

// Select protection option
function selectProtection(prot) {
    document.getElementById("protectionOptions").textContent = prot;
    document.getElementById("protDropdown").classList.remove("show");
}

// Select flags option
function selectFlags(flag) {
    document.getElementById("flagsOptions").textContent = flag;
    document.getElementById("flagsDropdown").classList.remove("show");
}

// Function to render the FD table
function renderFdTable() {
    const tableBody = document.getElementById('fdTableBody');
    tableBody.innerHTML = '';
    
    fdTable.forEach(entry => {
        const row = document.createElement('tr');
        
        // Mode column
        const modeCell = document.createElement('td');
        modeCell.textContent = entry.mode;
        row.appendChild(modeCell);
        
        // FD column
        const fdCell = document.createElement('td');
        fdCell.textContent = entry.fd;
        row.appendChild(fdCell);
        
        // Size column
        const sizeCell = document.createElement('td');
        sizeCell.textContent = `${entry.size/PGSIZE}*PGSIZE`;
        row.appendChild(sizeCell);
        
        // Mapped column
        const mappedCell = document.createElement('td');
        mappedCell.className = 'checkbox-cell';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'form-check-input';
        checkbox.checked = entry.mapped;
        checkbox.addEventListener('change', function() {
            // Unselect all other checkboxes
            fdTable.forEach(e => e.mapped = false);
            entry.mapped = checkbox.checked;
            selectedFd = entry.mapped ? entry.fd : null;
            
            // Update fd input in mmap function
            document.getElementById('fdInput').textContent = selectedFd !== null ? selectedFd : '';
            
            // Update length input based on selected fd
            if (selectedFd !== null) {
                const selectedEntry = fdTable.find(e => e.fd === selectedFd);
                document.getElementById('lengthInput').textContent = `${selectedEntry.size/PGSIZE}*PGSIZE`;
            } else {
                document.getElementById('lengthInput').textContent = '';
            }
            
            renderFdTable();
        });
        
        mappedCell.appendChild(checkbox);
        row.appendChild(mappedCell);
        
        tableBody.appendChild(row);
    });
}

// Function to generate a random address with clean decimal representation
function generateRandomAddress() {
    // Using multiples of PGSIZE (1000)
    const possibleAddresses = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
    const randomIndex = Math.floor(Math.random() * possibleAddresses.length);
    return possibleAddresses[randomIndex];
}

// Execute mmap function
function executeMmap() {
    if (selectedFd === null) {
        alert('Please select a file descriptor from the FD table.');
        return;
    }
    
    // Check if there's already a mapping
    if (currentMapping !== null) {
        alert('There is already an active mapping. Please unmap first before creating a new mapping.');
        return;
    }
    
    const addr = parseInt(document.getElementById('addrInput').textContent || 0, 10);
    const protection = document.getElementById('protectionOptions').textContent;
    const flags = document.getElementById('flagsOptions').textContent;
    const fd = selectedFd;
    const offsetText = document.getElementById('offsetInput').value || "2";
    const offsetMultiplier = offsetText ? parseInt(offsetText) : 2;
    
    // Validate offset - can't be higher than addr/1000
    const maxOffset = Math.floor(addr / 1000);
    if (offsetMultiplier > maxOffset) {
        alert(`Offset cannot be higher than ${maxOffset} for address ${addr}.`);
        return;
    }
    
    const offset = offsetMultiplier * PGSIZE;
    
    const fdEntry = fdTable.find(entry => entry.fd === fd);
    const len = fdEntry.size;
    
    // Create a new mapping
    currentMapping = {
        address: addr,
        length: len,
        protection: protection,
        flags: flags,
        fd: fd,
        offset: offset,
        offsetMultiplier: offsetMultiplier,
        color: "hsla(200, 70%, 60%, 0.7)" // Fixed color for simplicity
    };
    
    // Update VMA info
    updateVmaInfo();
    
    // Update the munmap UI fields with default values
    if (document.getElementById('unmapAddrInput')) {
        document.getElementById('unmapAddrInput').value = addr;
        document.getElementById('unmapLengthInput').value = len;
    }
    
    // Generate a new random address for next mapping
    document.getElementById('addrInput').textContent = generateRandomAddress();
}

// Update VMA info display
function updateVmaInfo() {
    const vmaInfo = document.getElementById('vmaInfo');
    
    if (!currentMapping) {
        vmaInfo.innerHTML = '<div class="vma-title">VMAs</div><div>No active mappings</div>';
        return;
    }
    
    let html = '<div class="vma-title">VMAs</div>';
    
    // Format protection string (R/W/X)
    const protStr = `${currentMapping.protection.includes('READ') ? 'R' : '-'}${currentMapping.protection.includes('WRITE') ? 'W' : '-'}${currentMapping.protection.includes('EXEC') ? 'X' : '-'}`;
    
    // Add VMA box similar to the picture 
    html += `
        <div style="border-left: 4px solid ${currentMapping.color}; padding-left: 8px; margin-bottom: 8px;">
            <div>addr: ${currentMapping.address}</div>
            <div>length: ${currentMapping.length/PGSIZE}*PGSIZE</div>
            <div>prot: ${protStr}</div>
            <div>flag: ${currentMapping.flags}</div>
            <div>fd: ${currentMapping.fd}</div>
            <div>offset: ${currentMapping.offsetMultiplier}*PGSIZE</div>
        </div>
    `;
    
    vmaInfo.innerHTML = html;
}

// Update the munmap function UI
function updateMunmapUI() {
    const unmapSection = document.querySelector('.unmap-section');
    unmapSection.innerHTML = `
        <div>munmap(
            <div class="param-box">
                <input type="number" id="unmapAddrInput" style="width: 100%; border: none;" placeholder="addr">
            </div>,
            <div class="param-box">
                <input type="number" id="unmapLengthInput" style="width: 100%; border: none;" placeholder="length">
            </div>
        );
        <div class="map-button" onclick="executeUnmap()">UNMAP</div>
        </div>
    `;
}

// Enhanced executeUnmap function
function executeUnmap() {
    if (!currentMapping) {
        alert('No mapping to unmap.');
        return;
    }
    
    // Get munmap parameters
    const unmapAddr = parseInt(document.getElementById('unmapAddrInput').value || 0, 10);
    const unmapLength = parseInt(document.getElementById('unmapLengthInput').value || 0, 10);
    
    // Validate parameters
    if (unmapAddr <= 0 || unmapLength <= 0) {
        alert('Please enter valid address and length values.');
        return;
    }
    
    const mappingStart = currentMapping.address;
    const mappingEnd = currentMapping.address + currentMapping.length;
    const unmapEnd = unmapAddr + unmapLength;
    
    // Case 1: Complete unmap
    if (unmapAddr <= mappingStart && unmapEnd >= mappingEnd) {
        // Complete unmap
        currentMapping = null;
        updateVmaInfo();
        return;
    }
    
    // Validate address is within mapping or at start
    if (unmapAddr < mappingStart || unmapAddr >= mappingEnd) {
        alert('Address must be within the current mapping range.');
        return;
    }
    
    // Case 2: Unmap from start
    if (unmapAddr === mappingStart && unmapEnd < mappingEnd) {
        // Calculate new parameters
        const newAddr = unmapAddr + unmapLength;
        const newLen = currentMapping.length - unmapLength;
        const newOffset = currentMapping.offset + unmapLength;
        const newOffsetMultiplier = Math.round(newOffset / PGSIZE);
        
        // Update the current mapping
        currentMapping.address = newAddr;
        currentMapping.length = newLen;
        currentMapping.offset = newOffset;
        currentMapping.offsetMultiplier = newOffsetMultiplier;
        
        updateVmaInfo();
        return;
    }
    
    // Case 3: Unmap from end
    if (unmapAddr > mappingStart && unmapEnd >= mappingEnd) {
        // Reduce the mapping length to end at unmapAddr
        const newLen = unmapAddr - mappingStart;
        
        // Update the current mapping length
        currentMapping.length = newLen;
        
        updateVmaInfo();
        return;
    }
    
    // Case 4: Unmap from middle
    // This would create two separate mappings, which is not supported
    alert('Only complete unmap, unmap from start, or unmap from end are supported.\n\nFor unmapping from the end, set the address within the mapping and make sure the length extends to or beyond the end of the mapping.');
}

// Setup p5.js canvas
function setupP5Canvas() {
    const sketch = function(p) {
        p.setup = function() {
            const canvas = p.createCanvas(800, 220);
            canvas.parent('canvas-container');

            const canvasElement = document.getElementById('canvas-container').querySelector('canvas');
            canvasElement.style.marginLeft = '-20px';
        };
        
        p.draw = function() {
            p.background(255);
            
            // Draw title
            p.fill(0);
            p.textSize(14);
            p.textFont('Roboto');
            p.textAlign(p.LEFT, p.CENTER);
            p.text('', 50, 20);
            
            if (currentMapping) {
                // Calculate the visible memory range with clean decimal addresses
                // Make sure we can see the full offset distance
                const offsetDistance = currentMapping.offset;
                const startAddr = Math.max(0, currentMapping.address - offsetDistance - PGSIZE);
                const endAddr = currentMapping.address + currentMapping.length + 2 * PGSIZE;
                
                // Round to nice decimal values divisible by PGSIZE
                const roundedStartAddr = Math.floor(startAddr / PGSIZE) * PGSIZE;
                const roundedEndAddr = Math.ceil(endAddr / PGSIZE) * PGSIZE;
                const visibleRange = roundedEndAddr - roundedStartAddr;
                
                // Draw memory range 
                p.stroke(80);
                p.strokeWeight(2);
                p.noFill();
                p.rect(50, 50, 700, 25);
                
                // Draw address markers at start and end with clean decimal values
                p.noStroke();
                p.fill(0);
                p.textSize(12);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(roundedStartAddr, 50, 95); 
                
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(roundedEndAddr, 750, 95); 
                
                // Draw vertical lines
                p.stroke(220);
                p.line(50, 80, 50, 90); 
                p.line(750, 80, 750, 90); 
                
                // Draw page boundaries (PGSIZE)
                p.stroke(200);
                p.strokeWeight(1);
                const totalWidth = 700;
                const numPages = visibleRange / PGSIZE;
                const pageWidth = totalWidth / numPages;
                
                for (let i = 1; i <= numPages; i++) {
                    const x = 50 + i * pageWidth;
                    p.line(x, 50, x, 75);
                }
                
                // Draw fd area title
                p.textAlign(p.LEFT, p.CENTER);
                p.noStroke();
                p.text('', 50, 130); 
                
                // Draw the fd area representation 
                p.stroke(80);
                p.strokeWeight(2);
                p.noFill();
                p.rect(50, 140, 700, 15); 
                
                // Calculate position and width for the memory mapping
                const startX = 50 + ((currentMapping.address - roundedStartAddr) / visibleRange) * 700;
                const width = (currentMapping.length / visibleRange) * 700;
                const endX = startX + width;
                
                // Ensure the offset area is visible by adjusting the starting point if needed
                const offsetStartAddr = currentMapping.address - currentMapping.offset;
                const offsetStartX = 50 + ((offsetStartAddr - roundedStartAddr) / visibleRange) * 700;
                
                // Draw the memory mapping 
                p.fill(currentMapping.color);
                p.stroke(0);
                p.strokeWeight(1);
                p.rect(startX, 50, width, 25); 
                
                // Draw page lines inside the mapping
                p.stroke(100);
                const pagesInMapping = currentMapping.length / PGSIZE;
                const pageWidthInMapping = width / pagesInMapping;
                
                for (let i = 1; i < pagesInMapping; i++) {
                    const x = startX + i * pageWidthInMapping;
                    p.line(x, 50, x, 75); 
                }
                
                // Draw file representation
                // File starts at same X position as memory mapping
                const fileStartX = startX;
                
                // Draw the fd section
                p.fill(currentMapping.color);
                p.rect(fileStartX, 140, width, 15);
                
                // Draw the offset area using the calculated offset starting point
                p.fill(220); // Light gray
                const offsetWidth = (currentMapping.offset / visibleRange) * 700;
                p.rect(offsetStartX, 140, offsetWidth, 15); 
                
                // Draw page lines in file representation
                for (let i = 1; i < pagesInMapping; i++) {
                    const x = fileStartX + i * pageWidthInMapping;
                    p.line(x, 140, x, 155); 
                }
                
                // Draw offset page lines
                const pagesInOffset = currentMapping.offsetMultiplier;
                const offsetPageWidth = offsetWidth / pagesInOffset;
                
                for (let i = 1; i < pagesInOffset; i++) {
                    const x = offsetStartX + i * offsetPageWidth;
                    p.line(x, 140, x, 155);
                }
                
                // Draw address labels
                p.fill(0);
                p.noStroke();
                p.textSize(10);
                p.textAlign(p.CENTER, p.TOP);
                
                // Draw addr and addr+length with decimal values 
                p.text(currentMapping.address, startX, 80); 
                p.text(currentMapping.address + currentMapping.length, endX, 80); 
                
                // Draw labels for file sections 
                p.textAlign(p.LEFT, p.CENTER);
                p.text(`fd: ${currentMapping.fd}`, offsetStartX + 5, 147);
                
                // Draw mmap area label
                p.textAlign(p.CENTER, p.CENTER);
                p.text("", fileStartX + width/2, 147);
                
                // Draw "offset area" label
                p.text("offset", offsetStartX + offsetWidth/2, 147);
                
                // Draw connection lines
                p.stroke(0, 0, 0, 100);
                p.strokeWeight(1);
                p.line(startX, 75, fileStartX, 140); 
                p.line(endX, 75, fileStartX + width, 140);
                
                // Optional: Add label for offset starting address
                p.noStroke();
                p.textSize(10);
                p.textAlign(p.CENTER, p.TOP);
                p.text(offsetStartAddr, offsetStartX, 160);
            } else {
                
                p.stroke(80);
                p.strokeWeight(2);
                p.noFill();
                p.rect(50, 50, 700, 25); 
                p.rect(50, 140, 700, 15); 
                
                // Draw address markers
                p.noStroke();
                p.fill(0);
                p.textSize(12);
                p.textAlign(p.LEFT, p.CENTER);
                p.text("0", 50, 95); 
                
                p.textAlign(p.RIGHT, p.CENTER);
                p.text("10000", 750, 95);
                
                // Draw vertical lines
                p.stroke(220);
                p.line(50, 80, 50, 90); 
                p.line(750, 80, 750, 90); 
                
                // Draw file content label
                p.textAlign(p.LEFT, p.CENTER);
                p.noStroke();
                p.text('', 50, 130); 
            }
        };
    };
    
    new p5(sketch);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Set initial random address (decimal instead of hex)
    document.getElementById('addrInput').textContent = generateRandomAddress();
    
    // Set initial offset to 2
    document.getElementById('offsetInput').value = "2";
    
    // Update the munmap UI
    updateMunmapUI();
    
    // Render the FD table
    renderFdTable();
    
    // Set initial protection and flags to match picture
    document.getElementById('protectionOptions').textContent = 'PROT_READ|PROT_WRITE';
    document.getElementById('flagsOptions').textContent = 'MAP_SHARED';
    
    // Auto-select fd 6 initially
    const fd6Entry = fdTable.find(entry => entry.fd === 6);
    if (fd6Entry) {
        fd6Entry.mapped = true;
        selectedFd = 6;
        document.getElementById('fdInput').textContent = "6";
        document.getElementById('lengthInput').textContent = `${fd6Entry.size/PGSIZE}*PGSIZE`;
        renderFdTable();
    }
    
    // Setup p5.js canvas
    setupP5Canvas();
});
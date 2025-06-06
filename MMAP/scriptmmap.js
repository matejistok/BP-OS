// Constants
const PGSIZE = 1000; // PGSIZE is 1000
const ADDR_ALIGN = 1000; // Address alignment for better readability

// Translation variables
let translations = {}; // Object to hold loaded translations
let currentLanguage = 'en'; // Default language is English

// Global variables
let fdTable = [
    { mode: 'O_RDONLY', fd: 3, size: 4*PGSIZE, mapped: false },
    { mode: 'O_RDWR', fd: 4, size: 2*PGSIZE, mapped: false },
    { mode: 'O_RDONLY', fd: 5, size: 8*PGSIZE, mapped: false },
    { mode: 'O_RDWR', fd: 6, size: 10*PGSIZE, mapped: false }
];

let selectedFd = null;
let p5Canvas;
let vmaMappings = []; // Store multiple mappings
// Define a set of colors for different VMAs
const vmaColors = [
    "hsla(200, 70%, 60%, 0.7)",
    "hsla(140, 70%, 60%, 0.7)",
    "hsla(350, 70%, 60%, 0.7)",
    "hsla(50, 70%, 60%, 0.7)",
    "hsla(280, 70%, 60%, 0.7)"
];
// Track used colors to allow reuse when mappings are unmapped
let usedColorIndices = [];

// Cache DOM elements that won't change
const DOM = {
    fdTableBody: null,
    fdInput: null,
    fdInputField: null,
    lengthInputField: null,
    protectionOptions: null,
    flagsOptions: null,
    offsetInput: null,
    unmapAddrInput: null,
    unmapLengthInput: null,
    vmaInfo: null,
    canvasContainer: null
};

// Track active error messages
const activeErrors = new Set();

// Function to load language data from JSON file
function loadLanguage(lang) {
    fetch(`./lang/${lang}.json`)
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
            }
        })
        .catch(error => {
            console.error(`Error loading language file ${lang}.json:`, error);
            // Fall back to English if there's an error
            if (lang !== 'en') {
                currentLanguage = 'en';
                updateUILanguage();
            }
        });
}

// Function to change the language
function changeLanguage(lang) {
    currentLanguage = lang;
    
    // Update the language indicator in the UI
    document.getElementById('currentLanguage').textContent = lang === 'en' ? 'English' : 'Slovenčina';
    
    // Update UI elements with new language
    updateUILanguage();
    
    // Save language preference in localStorage
    localStorage.setItem('preferredLanguage', lang);
}

// Function to update UI elements with the selected language
function updateUILanguage() {
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
    
    // Update MMAP function UI
    updateAddressInputField();
    updateLengthInputField();
    updateFdInputField();
    document.querySelector('.map-button').textContent = translations[currentLanguage].mmapFunction.mapButton;

    // Update PROT tooltip
    const protTooltip = document.querySelector('#protectionOptions').closest('.tooltip-container').querySelector('.tooltip-icon');
    protTooltip.setAttribute('data-tooltip', translations[currentLanguage].mmapFunction.protTooltip);
    
    // Update PROT options
    const protOptions = document.querySelectorAll('#protDropdown div');
    protOptions[0].textContent = translations[currentLanguage].protectionOptions.execOnly;
    protOptions[1].textContent = translations[currentLanguage].protectionOptions.readOnly;
    protOptions[2].textContent = translations[currentLanguage].protectionOptions.writeOnly;
    protOptions[3].textContent = translations[currentLanguage].protectionOptions.readWrite;

    // Update FLAGS tooltip
    const flagsTooltip = document.querySelector('#flagsOptions').closest('.tooltip-container').querySelector('.tooltip-icon');
    flagsTooltip.setAttribute('data-tooltip', translations[currentLanguage].mmapFunction.flagsTooltip);
    
    // Update FLAG options
    const flagOptions = document.querySelectorAll('#flagsDropdown div');
    flagOptions[0].textContent = translations[currentLanguage].flagOptions.shared;
    flagOptions[1].textContent = translations[currentLanguage].flagOptions.private;

    const fdTooltip = document.querySelector('#fdInput').closest('.tooltip-container').querySelector('.tooltip-icon');
    fdTooltip.setAttribute('data-tooltip', translations[currentLanguage].mmapFunction.fdTooltip);
    
    // Update offset tooltip
    const offsetTooltip = document.querySelector('input#offsetInput').closest('.tooltip-container').querySelector('.tooltip-icon');
    offsetTooltip.setAttribute('data-tooltip', translations[currentLanguage].mmapFunction.offsetTooltip);
    
    // Update FD table
    document.querySelector('.fd-title').textContent = translations[currentLanguage].fdTable.title;
    const tableHeaders = document.querySelectorAll('table.table th');
    tableHeaders[0].textContent = translations[currentLanguage].fdTable.mode;
    tableHeaders[1].textContent = translations[currentLanguage].fdTable.fd;
    tableHeaders[2].textContent = translations[currentLanguage].fdTable.size;
    tableHeaders[3].textContent = translations[currentLanguage].fdTable.mapped;
    
    // Update VMA info title and placeholder
    const vmaTitle = document.querySelector('.vma-title');
    if (vmaTitle) {
        vmaTitle.textContent = translations[currentLanguage].vma.title;
        
        // If there are no mappings, update the placeholder
        if (vmaMappings.length === 0) {
            document.querySelector('#vmaInfo div:not(.vma-title)').textContent = translations[currentLanguage].vma.noMappings;
        } else {
            // Refresh VMA info to update labels in the current language
            updateVmaInfo();
        }
    }
    
    // Update UNMAP section
    updateMunmapUI();
    
    // Setup tooltips with new language
    setTimeout(setupTooltips, 100);
}

// Functions to toggle dropdown menus
function toggleProtectionDropdown() {
    document.getElementById("protDropdown").classList.toggle("show");
    setTimeout(setupTooltips, 100);
}

function toggleFlagsDropdown() {
    document.getElementById("flagsDropdown").classList.toggle("show");
    setTimeout(setupTooltips, 100);
}

// Close dropdowns when clicking outside - optimized with event delegation
window.onclick = function(event) {
    if (!event.target.matches('#protectionOptions') && !event.target.matches('#flagsOptions')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let dropdown of dropdowns) {
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        }
    }
}

// Function to show error messages with translation
function showError(message) {
    // Don't show the same error message twice
    if (activeErrors.size > 0) {
        return;
    }
    
    // Add to active errors
    activeErrors.add(message);
    
    // Look for known error messages in the translations
    let translatedMessage = message;
    
    // Check if this is a known error that needs translation
    if (translations[currentLanguage] && translations[currentLanguage].errors) {
        for (const [key, errorText] of Object.entries(translations[currentLanguage].errors)) {
            // Simple message replacement for exact matches
            if (message === translations['en'].errors[key]) {
                translatedMessage = errorText;
                break;
            }
            
            // Handle parametrized error messages
            if (message.includes('%s') && translations['en'].errors[key].includes('%s')) {
                const englishPattern = translations['en'].errors[key].replace('%s', '(.+)');
                const match = message.match(new RegExp(englishPattern));
                if (match && match[1]) {
                    translatedMessage = errorText.replace('%s', match[1]);
                    break;
                }
            }
            
            // New handling for error messages with additional instructions
            // Check if the message starts with the same text as a known error
            const englishError = translations['en'].errors[key];
            if (message.startsWith(englishError.split('\n')[0])) {
                // Found a potential match at the beginning
                // Replace the base error message with its translation
                // and preserve any additional instructions
                const additionalText = message.substring(englishError.length);
                if (additionalText) {
                    // If there's additional text beyond the known error message, 
                    // translate the base message and append the additional text
                    translatedMessage = errorText + additionalText;
                    break;
                }
            }
        }
    }
    
    // Create error notification element
    const errorNotification = document.createElement('div');
    errorNotification.className = 'error-notification';
    errorNotification.innerHTML = `
        <div class="error-icon">⚠️</div>
        <div class="error-message">${translatedMessage}</div>
        <div class="error-close" onclick="dismissError(this, '${encodeURIComponent(message)}')">×</div>
    `;
    
    // Add to body
    document.body.appendChild(errorNotification);
    
    // Fade in
    setTimeout(() => {
        errorNotification.style.opacity = '1';
        errorNotification.style.transform = 'translateY(0)';
    }, 10);
}

// Function to dismiss an error
function dismissError(closeButton, encodedMessage) {
    const message = decodeURIComponent(encodedMessage);
    const errorNotification = closeButton.parentElement;
    
    // Remove from active errors set
    activeErrors.delete(message);
    
    // Animate out
    errorNotification.style.opacity = '0';
    errorNotification.style.transform = 'translateY(20px)';
    
    // Remove from DOM after animation
    setTimeout(() => {
        if (errorNotification.parentElement) {
            errorNotification.remove();
        }
    }, 500);
}

// Select protection option
function selectProtection(prot) {
    DOM.protectionOptions.textContent = prot;
    document.getElementById("protDropdown").classList.remove("show");
}

// Select flags option
function selectFlags(flag) {
    DOM.flagsOptions.textContent = flag;
    document.getElementById("flagsDropdown").classList.remove("show");
}

// Updated function to render the FD table - with checkmarks for mapped fds
function renderFdTable() {
    const fragment = document.createDocumentFragment(); // Use document fragment for better performance
    
    fdTable.forEach(entry => {
        const row = document.createElement('tr');
        
        // Mode column
        const modeCell = document.createElement('td');
        modeCell.textContent = entry.mode;
        
        // FD column
        const fdCell = document.createElement('td');
        fdCell.textContent = entry.fd;
        
        // Size column
        const sizeCell = document.createElement('td');
        sizeCell.textContent = `${entry.size/PGSIZE}*PGSIZE`;
        
        // Mapped column - show checkmark if mapped
        const mappedCell = document.createElement('td');
        mappedCell.className = 'checkbox-cell';
        
        // If mapped through vmaMappings, show a checked and disabled checkbox
        const isMapped = vmaMappings.some(mapping => mapping.fd === entry.fd);
        if (isMapped) {
            const checkmark = document.createElement('span');
            checkmark.innerHTML = '✓';
            checkmark.style.color = '#4CAF50';
            checkmark.style.fontWeight = 'bold';
            checkmark.style.fontSize = '16px';
            mappedCell.appendChild(checkmark);
            
            // Highlight rows that are mapped
            row.style.backgroundColor = "#f0f8ff"; // Light blue background
        } else {
            mappedCell.textContent = '';
        }
        
        // Append all cells to the row
        row.appendChild(modeCell);
        row.appendChild(fdCell);
        row.appendChild(sizeCell);
        row.appendChild(mappedCell);
        
        fragment.appendChild(row);
    });
    
    // Clear table and add all rows at once
    DOM.fdTableBody.innerHTML = '';
    DOM.fdTableBody.appendChild(fragment);
}

// Function to generate a random address with clean decimal representation
function generateRandomAddress() {
    // Using multiples of PGSIZE (1000)
    const possibleAddresses = [3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000];
    return possibleAddresses[Math.floor(Math.random() * possibleAddresses.length)];
}

// Optimized tooltip handling
const tooltipManager = {
    tooltips: new Map(), // Store tooltips by element ID or unique identifier
    
    // Create or update a tooltip
    createTooltip(element, tooltipText) {
        const container = element.closest('.tooltip-container') || element.parentNode;
        
        // Find any existing tooltip text element and remove it
        const existingTooltip = container.querySelector('.tooltip-text');
        if (existingTooltip) {
            // Check if the tooltip is a direct child of the container before removing
            if (existingTooltip.parentNode === container) {
                container.removeChild(existingTooltip);
            } else if (existingTooltip.parentNode) {
                // If it exists but is not a direct child, remove it from its parent
                existingTooltip.parentNode.removeChild(existingTooltip);
            }
        }
        
        // Create tooltip text element
        const tooltipTextElement = document.createElement('span');
        tooltipTextElement.className = 'tooltip-text';
        
        // Handle multi-line tooltips - convert \n to proper line breaks
        tooltipTextElement.textContent = tooltipText;
        
        // Apply custom styles from data attributes
        const width = element.getAttribute('data-tooltip-width');
        const height = element.getAttribute('data-tooltip-height');
        const maxWidth = element.getAttribute('data-tooltip-max-width');
        const position = element.getAttribute('data-tooltip-position') || 'bottom';
        const align = element.getAttribute('data-tooltip-align') || 'center';
        
        if (width) tooltipTextElement.style.width = width;
        if (height) tooltipTextElement.style.height = height;
        if (maxWidth) tooltipTextElement.style.maxWidth = maxWidth;
        
        // Apply position class
        tooltipTextElement.classList.add(`tooltip-${position}`);
        tooltipTextElement.classList.add(`tooltip-align-${align}`);
        
        // Add it after the icon
        container.appendChild(tooltipTextElement);
    },
    
    // Setup tooltips with improved efficiency
    setupTooltips() {
        document.querySelectorAll('.tooltip-icon').forEach(icon => {
            // Check for tooltip text from data attribute
            const tooltipText = icon.getAttribute('data-tooltip') || icon.getAttribute('title');
            
            if (tooltipText) {
                // Remove the title attribute to prevent default browser tooltip
                icon.removeAttribute('title');
                
                // Make sure the icon is in a tooltip container
                let container = icon.closest('.tooltip-container');
                if (!container) {
                    container = document.createElement('div');
                    container.className = 'tooltip-container';
                    icon.parentNode.insertBefore(container, icon);
                    container.appendChild(icon);
                }
                
                // Store the tooltip text in data-tooltip attribute
                icon.setAttribute('data-tooltip', tooltipText);
                
                // Create our custom tooltip
                this.createTooltip(icon, tooltipText);
            }
        });
    }
};

// Use the optimized tooltip setup function
function setupTooltips() {
    tooltipManager.setupTooltips();
}

// Function to update the addrInput div to contain an input field
function updateAddressInputField() {
    const addrInputElement = document.getElementById('addrInput');
    
    if (!translations[currentLanguage]) {
        // If translations aren't loaded yet, try again shortly
        setTimeout(updateAddressInputField, 100);
        return;
    }
    
    // Replace the div content with an input element with fixed width and tooltip
    addrInputElement.innerHTML = `
        <div class="tooltip-container" style="position: relative;">
            <div style="position: absolute; top: -30px; width: 100%; text-align: center;">
                <span class="tooltip-icon" data-tooltip="${translations[currentLanguage].mmapFunction.addrTooltip}" 
                      data-tooltip-width="250px" data-tooltip-max-width="300px" data-tooltip-position="bottom">${translations[currentLanguage].mmapFunction.addr} ⓘ</span>
            </div>
            <input type="number" id="addrInputField" value="0" style="width: 80px; border: none; text-align: center;" readonly>
        </div>`;
}

// Function to update the lengthInput div to contain an input field
function updateLengthInputField() {
    const lengthInputElement = document.getElementById('lengthInput');
    
    if (!translations[currentLanguage]) {
        // If translations aren't loaded yet, try again shortly
        setTimeout(updateLengthInputField, 100);
        return;
    }
    
    // Replace the div content with an input element with fixed width and tooltip
    lengthInputElement.innerHTML = `
        <div class="tooltip-container" style="position: relative;">
            <div style="position: absolute; top: -30px; width: 100%; text-align: center;">
                <span class="tooltip-icon" data-tooltip="${translations[currentLanguage].mmapFunction.lenTooltip}" 
                      data-tooltip-width="180px" data-tooltip-position="bottom">${translations[currentLanguage].mmapFunction.len} ⓘ</span>
            </div>
            <input type="text" id="lengthInputField" style="width: 80px; border: none; text-align: center;" placeholder="Length">
        </div>`;
    
    // Cache the DOM reference
    DOM.lengthInputField = document.getElementById('lengthInputField');
    
    // Initialize with a default value with 0x prefix
    DOM.lengthInputField.value = "0x2000";
}

// Function to update the mmap UI fd input to be an editable field
function updateFdInputField() {
    const fdInputElement = document.getElementById('fdInput');
    
    if (!translations[currentLanguage]) {
        // If translations aren't loaded yet, try again shortly
        setTimeout(updateFdInputField, 100);
        return;
    }
    
    // Replace the div content with an input element with tooltip
    fdInputElement.innerHTML = `
        <div class="tooltip-container" style="position: relative;">
            <div style="position: absolute; top: -30px; width: 100%; text-align: center;">
                <span class="tooltip-icon" data-tooltip="${translations[currentLanguage].mmapFunction.fdTooltip}" 
                      data-tooltip-width="200px" data-tooltip-position="top">${translations[currentLanguage].mmapFunction.fd} ⓘ</span>
            </div>
            <input type="number" id="fdInputField" style="width: 60px; border: none; text-align: center;" placeholder="fd">
        </div>`;
    
    // Cache the DOM reference
    DOM.fdInputField = document.getElementById('fdInputField');
}

// Add new function to handle offset input formatting
function formatOffsetInput() {
    const offsetValue = DOM.offsetInput.value.trim();
    
    // Handle empty input
    if (!offsetValue) {
        DOM.offsetInput.value = "0x0";
        return;
    }
    
    // Remove 0x prefix if exists
    const numericValue = offsetValue.startsWith('0x') ? offsetValue.substring(2) : offsetValue;
    
    // Parse the value
    let intValue = parseInt(numericValue, 10);
    
    // Handle parsing errors
    if (isNaN(intValue)) {
        DOM.offsetInput.value = "0x0";
        return;
    }
    
    // If value is a small number (1, 2, etc.), multiply by PGSIZE
    if (intValue > 0 && intValue < 100) {
        intValue = intValue * PGSIZE;
    } 
    // If value doesn't align with PGSIZE, round it up
    else if (intValue % PGSIZE !== 0) {
        intValue = Math.ceil(intValue / PGSIZE) * PGSIZE;
    }
    
    // Format the value with 0x prefix
    DOM.offsetInput.value = `0x${intValue}`;
}

// Function to validate that the entered length has a valid value
function validateLength() {
    // Get input value and remove 0x prefix if present for parsing
    const inputValue = DOM.lengthInputField.value;
    const valueToProcess = inputValue.startsWith('0x') ? inputValue.substring(2) : inputValue;
    const value = parseInt(valueToProcess, 10);
    
    // Make sure length is positive
    if (isNaN(value) || value <= 0) {
        showError('Length must be a positive number.');
        return false;
    }
    
    // Round up to nearest page size
    const roundedValue = Math.ceil(value / PGSIZE) * PGSIZE;
    if (roundedValue !== value) {
        DOM.lengthInputField.value = `0x${roundedValue}`;
    }
    
    return true;
}

// Updated executeMmap function to handle typed fd values
function executeMmap() {
    // Get the typed fd value
    const fdValue = parseInt(DOM.fdInputField.value, 10);
    
    // Validate the fd input
    if (isNaN(fdValue)) {
        showError('Please enter a valid file descriptor.');
        return;
    }
    
    // Check if the fd exists in the fd table
    const fdEntry = fdTable.find(entry => entry.fd === fdValue);
    if (!fdEntry) {
        showError(`File descriptor ${fdValue} does not exist in the fd table.`);
        return;
    }
    
    // Check if the fd is already mapped
    if (vmaMappings.some(mapping => mapping.fd === fdValue)) {
        showError(`File descriptor ${fdValue} is already mapped. Please use a different file descriptor.`);
        return;
    }
    
    // Get length from input field, removing 0x prefix if present
    const lengthInput = DOM.lengthInputField.value;
    const lenValueStr = lengthInput.startsWith('0x') ? lengthInput.substring(2) : lengthInput;
    const lenValue = parseInt(lenValueStr, 10);
    
    // Validate length input
    if (isNaN(lenValue) || lenValue <= 0) {
        showError('Length must be a positive number.');
        return;
    }
    
    // Round length to page size if needed
    const len = Math.ceil(lenValue / PGSIZE) * PGSIZE;
    if (len !== lenValue) {
        DOM.lengthInputField.value = `0x${len}`;
    }
    
    // Check for invalid combination: O_RDONLY + MAP_SHARED + PROT_READ|PROT_WRITE
    const protection = DOM.protectionOptions.textContent;
    const flags = DOM.flagsOptions.textContent;
    
    if (fdEntry.mode === 'O_RDONLY' && 
        flags === 'MAP_SHARED' && 
        protection === 'PROT_READ|PROT_WRITE') {
        showError(translations['en'].errors.invalidCombo);
        return;
    }
    
    // Get address from input field (always 0 now)
    const addrInputField = document.getElementById('addrInputField');
    let addr = parseInt(addrInputField.value || 0, 10);
    
    // Address is 0, which means we need to determine the appropriate address
    if (addr === 0) {
        if (vmaMappings.length === 0) {
            // First mapping - generate a random address
            addr = generateRandomAddress();
        } else {
            // Find the highest ending address of all existing mappings
            let highestAddr = 0;
            vmaMappings.forEach(mapping => {
                const endAddr = mapping.address + mapping.length;
                highestAddr = Math.max(highestAddr, endAddr);
            });
            
            // Set the new mapping to start at the next page boundary after the highest address
            addr = highestAddr;
        }
    }
    
    const fd = fdValue;
    const offsetText = DOM.offsetInput.value || "0x0";
    const offsetValueStr = offsetText.startsWith('0x') ? offsetText.substring(2) : offsetText;
    // Calculate the actual offset multiplier (divide by PGSIZE)
    const offsetBytes = parseInt(offsetValueStr, 10) || 0;
    const offsetMultiplier = offsetBytes / PGSIZE;
    
    // Validate that offset isn't negative
    if (offsetBytes < 0) {
        showError('Offset cannot be negative.');
        return;
    }

    if(offsetMultiplier > fdEntry.size/PGSIZE) {
        showError(`Offset cannot exceed file size (${fdEntry.size/PGSIZE})`);
        return;
    }
    
    // Ensure that addr - offset is not negative
    if (addr - offsetBytes < 0) {
        showError('Effective address (addr - offset) cannot be negative. Please use a smaller offset or a larger address.');
        return;
    }
    
    // Check for address overlap with existing mappings in virtual memory
    let needNewAddress = false;
    for (const mapping of vmaMappings) {
        const mappingStart = mapping.address;
        const mappingEnd = mapping.address + mapping.length;
        
        if ((addr >= mappingStart && addr < mappingEnd) || 
            (addr + len > mappingStart && addr + len <= mappingEnd) ||
            (addr <= mappingStart && addr + len >= mappingEnd)) {
            needNewAddress = true;
            break;
        }
    }
    
    if (needNewAddress) {
        showError('New mapping overlaps with an existing mapping in virtual memory. Auto-generating a new address...');
        
        // Find the highest ending address
        let highestAddr = 0;
        vmaMappings.forEach(m => {
            const endAddr = m.address + m.length;
            highestAddr = Math.max(highestAddr, endAddr);
        });
        
        // Set a new address after the highest ending address
        addr = highestAddr;
    }

    // Select color for the new mapping
    let colorIndex;
    // Find the first unused color index
    for (let i = 0; i < vmaColors.length; i++) {
        if (!usedColorIndices.includes(i)) {
            colorIndex = i;
            usedColorIndices.push(i);
            break;
        }
    }
    
    // If all colors are used, cycle through them
    if (colorIndex === undefined) {
        colorIndex = vmaMappings.length % vmaColors.length;
        usedColorIndices.push(colorIndex);
    }
    
    // Create a new mapping
    const newMapping = {
        address: addr,
        length: len,
        protection: protection,
        flags: flags,
        fd: fd,
        offset: offsetBytes,
        offsetMultiplier: offsetMultiplier,
        color: vmaColors[colorIndex],
        colorIndex: colorIndex, // Store the color index for later reference
        fileSize: fdEntry.size // Store the complete file size
    };
    
    // Add the new mapping to the array
    vmaMappings.push(newMapping);
    
    // Mark the file descriptor as mapped in the fd table
    fdEntry.mapped = true;
    
    // Update VMA info
    updateVmaInfo();
    
    // Update the munmap UI fields with default values from the latest mapping
    if (DOM.unmapAddrInput) {
        DOM.unmapAddrInput.value = `0x${addr}`;
        DOM.unmapLengthInput.value = `0x${len}`;
    }
    
    // Clear the fd input field for the next mapping
    DOM.fdInputField.value = '';
    
    // Re-render the fd table to reflect changes
    renderFdTable();
    
    // Resize the canvas to accommodate new mapping
    resizeCanvas();
}

// Updated executeUnmap function to clear the checkmark when unmapped
function executeUnmap() {
    if (vmaMappings.length === 0) {
        showError('No mappings to unmap.');
        return;
    }
    
    // Get munmap parameters, removing 0x prefix if present
    const addrInput = DOM.unmapAddrInput.value || "0";
    const addrValueStr = addrInput.startsWith('0x') ? addrInput.substring(2) : addrInput;
    const unmapAddr = parseInt(addrValueStr, 10);
    
    const lengthInput = DOM.unmapLengthInput.value || "0";
    const lenValueStr = lengthInput.startsWith('0x') ? lengthInput.substring(2) : lengthInput;
    let unmapLength = parseInt(lenValueStr, 10);
    
    // Round up length to nearest PGSIZE
    unmapLength = roundToPageSize(unmapLength);
    
    // Update UI to show rounded value with 0x prefix
    DOM.unmapLengthInput.value = `0x${unmapLength}`;
    
    // Validate parameters
    if (unmapAddr <= 0 || unmapLength <= 0) {
        showError('Please enter valid address and length values.');
        return;
    }
    
    // Find the mapping that contains the specified address
    let mappingIndex = -1;
    for (let i = 0; i < vmaMappings.length; i++) {
        const mapping = vmaMappings[i];
        const mappingStart = mapping.address;
        const mappingEnd = mapping.address + mapping.length;
        
        if (unmapAddr >= mappingStart && unmapAddr < mappingEnd) {
            mappingIndex = i;
            break;
        }
    }
    
    if (mappingIndex === -1) {
        showError('No mapping found at the specified address.');
        return;
    }
    
    const mapping = vmaMappings[mappingIndex];
    const mappingStart = mapping.address;
    const mappingEnd = mapping.address + mapping.length;
    const unmapEnd = unmapAddr + unmapLength;
    
    // Store the fd before potentially removing the mapping
    const fdToUpdate = mapping.fd;
    
    // Case 1: Complete unmap
    if (unmapAddr <= mappingStart && unmapEnd >= mappingEnd) {
        // Remove the color index from used colors
        if (mapping.colorIndex !== undefined) {
            const colorIndexPos = usedColorIndices.indexOf(mapping.colorIndex);
            if (colorIndexPos !== -1) {
                usedColorIndices.splice(colorIndexPos, 1);
            }
        }
        
        // Remove the mapping
        vmaMappings.splice(mappingIndex, 1);
        
        // Mark the file descriptor as unmapped in fdTable
        const fdEntry = fdTable.find(entry => entry.fd === fdToUpdate);
        if (fdEntry) {
            fdEntry.mapped = false;
        }
        
        updateVmaInfo();
        renderFdTable();
        resizeCanvas();
        return;
    }
    
    // Case 2: Unmap from start
    if (unmapAddr === mappingStart && unmapEnd < mappingEnd) {
        // Calculate new parameters
        const newAddr = unmapAddr + unmapLength;
        const newLen = mapping.length - unmapLength;
        const newOffset = mapping.offset + unmapLength;
        const newOffsetMultiplier = Math.round(newOffset / PGSIZE);
        
        // Track unmapped length for visualization
        mapping.unmappedStart = unmapLength;
        
        // Update the mapping
        mapping.address = newAddr;
        mapping.length = newLen;
        mapping.offset = newOffset;
        mapping.offsetMultiplier = newOffsetMultiplier;
        
        updateVmaInfo();
        return;
    }
    
    // Case 3: Unmap from end
    if (unmapAddr > mappingStart && unmapEnd >= mappingEnd) {
        // Reduce the mapping length to end at unmapAddr
        const newLen = unmapAddr - mappingStart;
        
        // Track unmapped length for visualization
        mapping.unmappedEnd = mapping.length - newLen;
        
        // Update the mapping length
        mapping.length = newLen;
        
        updateVmaInfo();
        return;
    }
    
    // Case 4: Unmap from middle
    showError('Only complete unmap, unmap from start, or unmap from end are supported.\n\nFor unmapping from the end, set the address within the mapping and make sure the length extends to or beyond the end of the mapping.');
}

// Update VMA info display to show all mappings - optimized with DOM fragment and translation
function updateVmaInfo() {
    if (vmaMappings.length === 0) {
        DOM.vmaInfo.innerHTML = `<div class="vma-title">${translations[currentLanguage].vma.title}</div><div>${translations[currentLanguage].vma.noMappings}</div>`;
        return;
    }
    
    const fragment = document.createDocumentFragment();
    const titleDiv = document.createElement('div');
    titleDiv.className = 'vma-title';
    titleDiv.textContent = translations[currentLanguage].vma.title;
    fragment.appendChild(titleDiv);
    
    // Display each mapping
    vmaMappings.forEach((mapping) => {
        // Format protection string (R/W/X)
        const protStr = `${mapping.protection.includes('READ') ? 'R' : '-'}${mapping.protection.includes('WRITE') ? 'W' : '-'}${mapping.protection.includes('EXEC') ? 'X' : '-'}`;
        
        // Create VMA box
        const vmaBox = document.createElement('div');
        vmaBox.style.borderLeft = `4px solid ${mapping.color}`;
        vmaBox.style.paddingLeft = '8px';
        vmaBox.style.marginBottom = '12px';
        
        // Add VMA details with 0x prefix for addresses and decimal values for other fields
        const details = [
            `${translations[currentLanguage].vma.addr}: 0x${mapping.address}`,
            `${translations[currentLanguage].vma.length}: ${mapping.length/PGSIZE}*PGSIZE`,
            `${translations[currentLanguage].vma.prot}: ${protStr}`,
            `${translations[currentLanguage].vma.flag}: ${mapping.flags}`,
            `${translations[currentLanguage].vma.fd}: ${mapping.fd}`,
            `${translations[currentLanguage].vma.offset}: ${mapping.offsetMultiplier}*PGSIZE`
        ];
        
        details.forEach(detail => {
            const detailDiv = document.createElement('div');
            detailDiv.textContent = detail;
            vmaBox.appendChild(detailDiv);
        });
        
        fragment.appendChild(vmaBox);
    });
    
    // Update DOM in one operation
    DOM.vmaInfo.innerHTML = '';
    DOM.vmaInfo.appendChild(fragment);
}

// Setup p5.js canvas - updated to render multiple mappings with optimized drawing
function setupP5Canvas() {
    const sketch = function(p) {
        // Cache for calculated values to avoid recalculating in every draw() call
        let drawCache = {
            visibleRange: 0,
            roundedStartAddr: 0,
            roundedEndAddr: 0,
            pageWidth: 0,
            leftMargin: 50,
            rightMargin: 50
        };
        
        p.setup = function() {
            // Get container width for responsive canvas
            const containerWidth = DOM.canvasContainer.offsetWidth - 20;
            // Increase canvas height to accommodate stacked fd visualizations - more space now
            const canvasHeight = vmaMappings.length > 0 ? 300 + (vmaMappings.length * 75) : 450;
            const canvas = p.createCanvas(containerWidth, canvasHeight);
            canvas.parent('canvas-container');
        };
        
        p.windowResized = function() {
            // Resize canvas when window size changes
            const containerWidth = DOM.canvasContainer.offsetWidth - 20;
            // Adjust height based on number of mappings
            const canvasHeight = vmaMappings.length > 0 ? 300 + (vmaMappings.length * 75) : 450;
            p.resizeCanvas(containerWidth, canvasHeight);
            
            // Reset cache on resize
            drawCache = {
                visibleRange: 0,
                roundedStartAddr: 0,
                roundedEndAddr: 0,
                pageWidth: 0,
                leftMargin: 50,
                rightMargin: 50
            };
        };
        
        // Helper function to calculate memory range once per frame
        function calculateMemoryRange() {
            if (vmaMappings.length === 0) {
                drawCache.roundedStartAddr = 0;
                drawCache.roundedEndAddr = 10000;
                drawCache.visibleRange = 10000;
                return;
            }
            
            // Calculate the visible memory range with clean decimal addresses
            // Find the min and max addresses across all mappings
            let minAddr = Number.MAX_SAFE_INTEGER;
            let maxAddr = 0;
            
            // First determine the overall memory range needed
            vmaMappings.forEach(mapping => {
                const mappingStart = mapping.address;
                const mappingEnd = mapping.address + mapping.length;
                const fileStart = mappingStart - mapping.offset;
                
                // Consider the full file size for visualization
                const fileStartWithOffset = fileStart - (mapping.offset > 0 ? PGSIZE : 0); // Show one page before if there's an offset
                const fileEndWithRemainder = fileStart + mapping.fileSize;
                
                minAddr = Math.min(minAddr, fileStartWithOffset, mappingStart);
                maxAddr = Math.max(maxAddr, mappingEnd, fileEndWithRemainder);
            });
            
            // Add some padding
            minAddr = Math.max(0, minAddr - PGSIZE);
            maxAddr = maxAddr + PGSIZE;
            
            // Round to nice decimal values divisible by PGSIZE
            drawCache.roundedStartAddr = Math.floor(minAddr / PGSIZE) * PGSIZE;
            drawCache.roundedEndAddr = Math.ceil(maxAddr / PGSIZE) * PGSIZE;
            drawCache.visibleRange = drawCache.roundedEndAddr - drawCache.roundedStartAddr;
        }
        
        p.draw = function() {
            // Get current width for scaling calculations
            const currentWidth = p.width;
            const leftMargin = drawCache.leftMargin;
            const rightMargin = drawCache.rightMargin;
            const availableWidth = currentWidth - leftMargin - rightMargin;
            
            p.background(255);
            
            if (vmaMappings.length > 0) {
                // Calculate the memory range if needed
                calculateMemoryRange();
                
                // Draw memory range 
                p.stroke(150);
                p.strokeWeight(2);
                p.noFill();
                p.rect(leftMargin, 50, availableWidth, 25);
                
                // Draw address markers at start and end with clean decimal values
                p.noStroke();
                p.fill(0);
                p.textSize(14);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(`0x${drawCache.roundedStartAddr}`, leftMargin, 105); 
                
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(`0x${drawCache.roundedEndAddr}`, leftMargin + availableWidth, 105); 
                
                // Draw vertical lines
                p.stroke(220);
                p.line(leftMargin, 80, leftMargin, 90); 
                p.line(leftMargin + availableWidth, 80, leftMargin + availableWidth, 90); 
                
                // Draw page boundaries (PGSIZE)
                p.stroke(200);
                p.strokeWeight(1);
                const numPages = drawCache.visibleRange / PGSIZE;
                const pageWidth = availableWidth / numPages;
                drawCache.pageWidth = pageWidth;
                
                for (let i = 1; i <= numPages; i++) {
                    const x = leftMargin + i * pageWidth;
                    p.line(x, 50, x, 75);
                }
                
                // Draw each mapping
                vmaMappings.forEach((mapping, index) => {
                    // Calculate vertical position for each fd visualization
                    const fdYPosition = 140 + (index * 75);
                    const fdHeight = 20;
                    
                    // Calculate position and width for the memory mapping
                    const startX = leftMargin + ((mapping.address - drawCache.roundedStartAddr) / drawCache.visibleRange) * availableWidth;
                    const width = (mapping.length / drawCache.visibleRange) * availableWidth;
                    const endX = startX + width;
                    
                    // Draw the memory mapping 
                    p.fill(mapping.color);
                    p.stroke(150);
                    p.strokeWeight(1);
                    p.rect(startX, 50, width, 25);
                    
                    // Draw page lines inside the mapping
                    p.stroke(100);
                    const pagesInMapping = mapping.length / PGSIZE;
                    const pageWidthInMapping = width / pagesInMapping;
                    
                    for (let i = 1; i < pagesInMapping; i++) {
                        const x = startX + i * pageWidthInMapping;
                        p.line(x, 50, x, 75);
                    }
                    
                    // Calculate file visualization parameters
                    const totalFileSize = mapping.fileSize;
                    const totalPagesInFile = totalFileSize / PGSIZE;
                    const filePageWidth = (PGSIZE / drawCache.visibleRange) * availableWidth;
                    
                    // Calculate the base address of the file (addr - offset)
                    const fileBaseAddr = mapping.address - mapping.offset;
                    
                    // Start position for the entire file visualization
                    const fileVisStartX = leftMargin + ((fileBaseAddr - PGSIZE - drawCache.roundedStartAddr) / drawCache.visibleRange) * availableWidth;
                    
                    // Total width including the extra page before the file
                    const expandedFileWidth = filePageWidth * (totalPagesInFile + 1);
                    
                    // Draw the full file area (outline) - CHANGED TO GREY COLOR
                    p.stroke(150); // Changed from 80 to 150 (a medium grey)
                    p.strokeWeight(2);
                    p.noFill();
                    p.rect(fileVisStartX, fdYPosition, expandedFileWidth, fdHeight);
                    
                    // Draw the memory address at original file start (fileBaseAddr)
                    p.noStroke();
                    p.textSize(12);
                    p.textAlign(p.CENTER, p.TOP);
                    p.text(`0x${fileBaseAddr - PGSIZE}`, fileVisStartX, fdYPosition + fdHeight + 5);
                    p.text(`0x${fileBaseAddr + totalFileSize}`, fileVisStartX + expandedFileWidth, fdYPosition + fdHeight + 5);
                    
                    // Add file descriptor label
                    p.fill(0);
                    p.noStroke();
                    p.textAlign(p.LEFT, p.CENTER);
                    p.text(`fd: ${mapping.fd}`, fileVisStartX + 5, fdYPosition + fdHeight/2);
                    
                    // 2. Draw grey offset part of the file
                    if (mapping.offsetMultiplier > 0) {
                        // Position: Start from the actual file start position 
                        const offsetStartX = fileVisStartX + filePageWidth; // Skip first "white" page
                        
                        p.fill(200, 200, 200, 180); // Light grey
                        p.noStroke();
                        p.rect(offsetStartX, fdYPosition, mapping.offsetMultiplier * filePageWidth, fdHeight);
                    }
                    
                    // 3. Draw mapped part (colored) aligned with memory mapping
                    const remainingPagesAfter = totalPagesInFile - mapping.offsetMultiplier - pagesInMapping;
                    // The mapped part should start at the same X position as the memory mapping
                    p.fill(mapping.color);
                    p.noStroke();
                    // Calculate the adjusted width based on offset and any unmapped regions
                    let totalUnmappedLength = 0;
                    const unmappedStartLength = mapping.unmappedStart || 0;
                    const unmappedEndLength = mapping.unmappedEnd || 0;
                    totalUnmappedLength = unmappedStartLength + unmappedEndLength;
                    //let offsetAdjustedWidth = width - (mapping.offsetMultiplier * filePageWidth) + (totalUnmappedLength / drawCache.visibleRange) * availableWidth;
                    let offsetAdjustedWidth = (mapping.fd ? (fdTable.find(entry => entry.fd === mapping.fd)?.size || mapping.length) : mapping.length) / drawCache.visibleRange * availableWidth - (mapping.offsetMultiplier * filePageWidth);
                    if (mapping.fileSize < mapping.length){
                        offsetAdjustedWidth = (mapping.fd ? (fdTable.find(entry => entry.fd === mapping.fd)?.size || mapping.length) : mapping.length) / drawCache.visibleRange * availableWidth - (mapping.offsetMultiplier * filePageWidth);
                    }
                    if(remainingPagesAfter > 0) {
                        offsetAdjustedWidth = width;
                    }
                    // if ((mapping.fileSize - mapping.offsetMultiplier) < mapping.length){
                    //     offsetAdjustedWidth = 0;
                    // }
                    
                    // Draw the rectangle with adjusted width to account for offset and unmapping
                    p.rect(startX, fdYPosition, offsetAdjustedWidth, fdHeight);
                    
                    // 4. Draw grey unmapped remainder
                    if (remainingPagesAfter > 0) {
                        const remainderStartX = startX + width;
                        
                        p.fill(200, 200, 200, 180); // Light grey
                        p.noStroke();
                        p.rect(remainderStartX, fdYPosition, remainingPagesAfter * filePageWidth, fdHeight);
                    }
                    
                    // Draw all page boundary lines with consistent styling
                    p.stroke(128); // White color for all page boundaries
                    p.strokeWeight(2); // Consistent stroke weight
                    
                    // Draw vertical lines for all page boundaries in the file
                    for (let i = 0; i <= totalPagesInFile + 1; i++) {
                        const x = fileVisStartX + (i * filePageWidth);
                        p.line(x, fdYPosition, x, fdYPosition + fdHeight);
                    }
                    
                    // Draw straight vertical connection lines between memory mapping and file
                    p.stroke(0, 0, 0, 100);
                    p.strokeWeight(1);
                    
                    // Draw vertical line from start of memory mapping to start of the colored area in file
                    p.line(startX, 75, startX, fdYPosition);
                    
                    // Draw vertical line from end of memory mapping to file, 
                    // with both points offset when there's an offset value and accounting for unmapped regions
                    if (mapping.offsetMultiplier > 0) {
                        // Calculate offset distance in pixels
                        const offsetDistance = mapping.offsetMultiplier * filePageWidth;
                        
                        // Calculate endpoint positions using the same offsetAdjustedWidth used for drawing the rectangle
                        let upperPoint = endX;
                        let lowerPoint = startX + offsetAdjustedWidth;
                        
                        // When file size is higher than mapping and there's an offset, draw perpendicular line
                        if (mapping.fileSize > mapping.length && mapping.offsetMultiplier > 0) {
                            // First draw a vertical line down to the level of the file visualization
                            p.line(lowerPoint, 75, lowerPoint, fdYPosition);
                            
                            // Then draw a horizontal line to the appropriate position in the file
                            p.line(lowerPoint, fdYPosition, lowerPoint, fdYPosition);
                        } else {
                            // For other cases, draw a direct line
                            p.line(lowerPoint, 75, lowerPoint, fdYPosition);
                        }
                    } else {
                        // If no offset, still account for unmapped regions
                        const unmappedStartLength = mapping.unmappedStart || 0;
                        const unmappedEndLength = mapping.unmappedEnd || 0;
                        
                        // Calculate the endpoint using the same logic as for the rectangle
                        let lowerPoint = startX + offsetAdjustedWidth;
                        
                        // When file size is higher than mapping with no offset, also draw perpendicular lines
                        if (mapping.fileSize > mapping.length) {
                            // First draw a vertical line down to the level of the file visualization
                            p.line(endX, 75, endX, fdYPosition);
                            
                            // Then draw a horizontal line to the appropriate position in the file
                            p.line(lowerPoint, fdYPosition, lowerPoint, fdYPosition);
                        } else {
                            // For other cases, draw a direct line
                            p.line(lowerPoint, 75, lowerPoint, fdYPosition);
                        }
                    }
                    
                    // Add address labels for memory mapping start and end
                    p.noStroke();
                    p.fill(0);
                    p.textSize(12);
                    p.textAlign(p.CENTER, p.TOP);
                    // Show address at start of memory mapping with 0x prefix
                    p.text(`0x${mapping.address}`, startX, 30);
                    // Show address at end of memory mapping with 0x prefix
                    p.text(`0x${mapping.address + mapping.length}`, endX, 30);
                });
            } else {
                // Display empty canvas - increased positioning for more space
                p.stroke(150);
                p.strokeWeight(2);
                p.noFill();
                p.rect(leftMargin, 50, availableWidth, 35); // Increased height 
                
                // Changed to grey color for file visualization
                p.stroke(150); // Changed from 80 to 150 (a medium grey)
                p.rect(leftMargin, 160, availableWidth, 20); // Adjusted position and increased height
                
                // Draw address markers
                p.noStroke();
                p.fill(0);
                p.textSize(14);
                p.textAlign(p.LEFT, p.CENTER);
                p.text("0x0", leftMargin, 115); 
                
                p.textAlign(p.RIGHT, p.CENTER);
                p.text("0x10000", leftMargin + availableWidth, 115);
                
                // Draw vertical lines
                p.stroke(220);
                p.line(leftMargin, 90, leftMargin, 100); 
                p.line(leftMargin + availableWidth, 90, leftMargin + availableWidth, 100); 
            }
        };
    };
    
    new p5(sketch);
}

// Helper function to round up to nearest PGSIZE
function roundToPageSize(value) {
    return Math.ceil(value / PGSIZE) * PGSIZE;
}

// Update the munmap function UI
function updateMunmapUI() {
    const unmapSection = document.querySelector('.unmap-section');
    
    if (!translations[currentLanguage]) {
        // If translations aren't loaded yet, try again shortly
        setTimeout(updateMunmapUI, 100);
        return;
    }
    
    unmapSection.innerHTML = `
        <div>munmap(
            <div class="param-box">
                <div class="tooltip-container" style="position: relative;">
                    <div style="position: absolute; top: -30px; width: 100%; text-align: center;">
                        <span class="tooltip-icon" 
                              data-tooltip="${translations[currentLanguage].unmapFunction.addrTooltip}" 
                              data-tooltip-position="bottom"
                              data-tooltip-width="400px" 
                              data-tooltip-max-width="350px">${translations[currentLanguage].unmapFunction.addr} ⓘ</span>
                    </div>
                    <input type="text" id="unmapAddrInput" style="width: 80px; border: none; text-align: center;" placeholder="addr">
                </div>
            </div>,
            <div class="param-box">
                <div class="tooltip-container" style="position: relative;">
                    <div style="position: absolute; top: -30px; width: 100%; text-align: center;">
                        <span class="tooltip-icon" 
                              data-tooltip="${translations[currentLanguage].unmapFunction.lenTooltip}"
                              data-tooltip-position="right"
                              data-tooltip-width="180px">${translations[currentLanguage].unmapFunction.len} ⓘ</span>
                    </div>
                    <input type="text" id="unmapLengthInput" style="width: 80px; border: none; text-align: center;" placeholder="length">
                </div>
            </div>
        );
        <div class="map-button" onclick="executeUnmap()">${translations[currentLanguage].unmapFunction.unmapButton}</div>
        </div>
    `;
    
    // Cache DOM elements
    DOM.unmapAddrInput = document.getElementById('unmapAddrInput');
    DOM.unmapLengthInput = document.getElementById('unmapLengthInput');
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Cache frequently accessed DOM elements
    DOM.fdTableBody = document.getElementById('fdTableBody');
    DOM.fdInput = document.getElementById('fdInput');
    DOM.vmaInfo = document.getElementById('vmaInfo');
    DOM.canvasContainer = document.getElementById('canvas-container');
    
    // Initial language setup
    // Load both language files
    loadLanguage('en');
    loadLanguage('sk');
    
    // Check for saved language preference
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
        currentLanguage = savedLanguage;
        document.getElementById('currentLanguage').textContent = 
            savedLanguage === 'en' ? 'English' : 'Slovenčina';
    }
    
    // Add CSS for tooltips
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .tooltip-icon {
            cursor: help;
            color: #0077cc;
            font-size: 12px;
        }
        
        /* Additional styling for the fd and protection elements */
        #fdInput, #protectionOptions, #flagsOptions {
            position: relative;
            display: inline-block;
        }
        
        .tooltip-container {
            position: relative;
            display: inline-block;
        }
    `;
    document.head.appendChild(styleElement);

    // Convert addrInput to an input field
    updateAddressInputField();
    
    // Convert lengthInput to an input field
    updateLengthInputField();
    
    // Convert fdInput to an input field
    updateFdInputField();
    
    // Set initial offset to 0x1000 and set fixed width
    DOM.offsetInput = document.getElementById('offsetInput');
    DOM.offsetInput.value = "0x1000";
    DOM.offsetInput.style.width = "80px";
    DOM.offsetInput.style.textAlign = "center";
    DOM.offsetInput.type = "text"; // Change to text to better display 0x prefix
    
    // Add event handler to format offset input when it changes
    DOM.offsetInput.addEventListener('blur', formatOffsetInput);
    DOM.offsetInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            formatOffsetInput();
        }
    });
    
    // Add tooltip to the offset input - improved version with custom width
    const offsetContainer = document.createElement('div');
    offsetContainer.className = 'tooltip-container';
    offsetContainer.style.position = 'relative';
    DOM.offsetInput.parentNode.insertBefore(offsetContainer, DOM.offsetInput);
    offsetContainer.appendChild(DOM.offsetInput);
    
    const offsetLabel = document.createElement('div');
    offsetLabel.style.position = 'absolute';
    offsetLabel.style.top = '-30px';
    offsetLabel.style.width = '100%';
    offsetLabel.style.textAlign = 'center';
    offsetLabel.innerHTML = '<span class="tooltip-icon" data-tooltip="int offset; // posunutie mapovanej oblasti od začiatku súboru (B)\n\nOfset od začiatku súboru v jednotkách PGSIZE." data-tooltip-width="250px" data-tooltip-position="top" data-tooltip-align="center">offset ⓘ</span>';
    offsetContainer.insertBefore(offsetLabel, DOM.offsetInput);
    
    const fdContainer = document.createElement('div');
    fdContainer.className = 'tooltip-container';
    fdContainer.style.position = 'relative';
    DOM.fdInput.parentNode.insertBefore(fdContainer, DOM.fdInput);
    fdContainer.appendChild(DOM.fdInput);
    
    const fdLabel = document.createElement('div');
    fdLabel.style.position = 'absolute';
    fdLabel.style.top = '-22px';
    fdLabel.style.width = '100%';
    fdLabel.style.textAlign = 'center';
    fdLabel.innerHTML = '<span class="tooltip-icon" data-tooltip="struct file *file; // mapovaný súbor\n\nDeskriptor súboru, ktorý sa má mapovať." data-tooltip-width="200px" data-tooltip-position="top">fd ⓘ</span>';
    fdContainer.insertBefore(fdLabel, DOM.fdInput);
    
    // Cache protection options
    DOM.protectionOptions = document.getElementById('protectionOptions');
    
    // Add tooltip to the protection dropdown - improved version with custom width
    const protContainer = document.createElement('div');
    protContainer.className = 'tooltip-container';
    protContainer.style.position = 'relative';
    DOM.protectionOptions.parentNode.insertBefore(protContainer, DOM.protectionOptions);
    protContainer.appendChild(DOM.protectionOptions);
    
    const protLabel = document.createElement('div');
    protLabel.style.position = 'absolute';
    protLabel.style.top = '-22px';
    protLabel.style.width = '100%';
    protLabel.style.textAlign = 'center';
    protLabel.innerHTML = '<span class="tooltip-icon" data-tooltip="int prot;\n\nOchrana pre mapovaný región:\nPROT_READ - čítanie\nPROT_WRITE - zápis\nPROT_EXEC - vykonávanie" data-tooltip-width="250px" data-tooltip-position="top">prot ⓘ</span>';
    protContainer.insertBefore(protLabel, DOM.protectionOptions);
    
    // Cache flags options
    DOM.flagsOptions = document.getElementById('flagsOptions');
    
    // Add tooltip to the flags dropdown with custom width
    const flagsContainer = document.createElement('div');
    flagsContainer.className = 'tooltip-container';
    flagsContainer.style.position = 'relative';
    DOM.flagsOptions.parentNode.insertBefore(flagsContainer, DOM.flagsOptions);
    flagsContainer.appendChild(DOM.flagsOptions);
    
    const flagsLabel = document.createElement('div');
    flagsLabel.style.position = 'absolute';
    flagsLabel.style.top = '-22px';
    flagsLabel.style.width = '100%';
    flagsLabel.style.textAlign = 'center';
    flagsLabel.innerHTML = '<span class="tooltip-icon" data-tooltip="int flags; // viditeľnosť úprav mapovanej oblasti\n\nMAP_SHARED - zmeny sú viditeľné pre ostatné procesy\nMAP_PRIVATE - zmeny sú privátne" data-tooltip-width="250px" data-tooltip-max-width="300px" data-tooltip-position="top">flags ⓘ</span>';
    flagsContainer.insertBefore(flagsLabel, DOM.flagsOptions);
    
    // Update the munmap UI
    updateMunmapUI();
    
    // Render the FD table
    renderFdTable();
    
    // Set initial protection and flags to match picture
    DOM.protectionOptions.textContent = 'PROT_READ|PROT_WRITE';
    DOM.flagsOptions.textContent = 'MAP_SHARED';
    
    // Setup p5.js canvas
    setupP5Canvas();
    
    // Apply tooltips after all HTML elements are created
    setTimeout(setupTooltips, 100);
    
    // Use one event listener instead of many
    window.addEventListener('click', function(event) {
        // Use event delegation for tooltips
        if (event.target.closest('.tooltip-icon') || 
            event.target.classList.contains('tooltip-icon') || 
            document.querySelector('.dropdown-content.show')) {
            setTimeout(setupTooltips, 100);
        }
    });
});

// Make functions global so they can be accessed from HTML
window.changeLanguage = changeLanguage;
window.dismissError = dismissError;
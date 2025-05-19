let pointerSize = 4;
let translations = {}; // Object to hold loaded translations
let currentLanguage = 'en'; // Default language is English

// Function to calculate the maximum file size - moved outside document.ready
function calculateMaxFileSize() {
    // Check if the necessary DOM elements exist
    if (!$('#blockSize').length || !$('.file-box').length) {
        return; // Exit if we're on a different page or elements don't exist yet
    }

    let blockSize = parseInt($('#blockSize').val());
    
    if (isNaN(blockSize) || blockSize <= 0) {
        return;
    }

    let maxSize = 0;
    let formulaParts = [];
    
    $(".file-box span").each(function () {
        let type = $(this).text();
        // Match the text regardless of language
        if (type === translations[currentLanguage].priamy) {
            maxSize += blockSize;
            formulaParts.push(`<span class="formula-part priamy-border">(${blockSize})</span>`);
        } else if (type === translations[currentLanguage].nepriamy) {
            let size = (blockSize / pointerSize) * blockSize;
            maxSize += size;
            formulaParts.push(`<span class="formula-part nepriamy-border">($\\frac{${blockSize}}{${pointerSize}} \\times ${blockSize}$)</span>`);
        } else if (type === translations[currentLanguage].dnepriamy) {
            let size = (blockSize / pointerSize) * (blockSize / pointerSize) * blockSize;
            maxSize += size;
            formulaParts.push(`<span class="formula-part dnepriamy-border">($\\frac{${blockSize}}{${pointerSize}} \\times \\frac{${blockSize}}{${pointerSize}} \\times ${blockSize}$)</span>`);
        }
    });

    let formulaText = formulaParts.join(" + ");
    if (formulaText === "") {
        formulaText = "0";
    }
    
    // Update with more readable format
    if (maxSize > 0) {
        // Format the size in KB, MB if appropriate
        let formattedSize = maxSize;
        let unit = translations[currentLanguage].bytesUnit;
        
        if (maxSize >= 1024 * 1024) {
            formattedSize = (maxSize / (1024 * 1024)).toFixed(2);
            unit = translations[currentLanguage].mbUnit;
        } else if (maxSize >= 1024) {
            formattedSize = (maxSize / 1024).toFixed(2);
            unit = translations[currentLanguage].kbUnit;
        }
        
        $("#maxFileSize").html(`
            <div class="card-header bg-light">
                <h5 class="mb-0">${translations[currentLanguage].maxFileSize}</h5>
            </div>
            <div class="card-body">
                <p class="mb-0">${formattedSize} ${unit}</p>
            </div>
        `);
        
        $("#formula").html(`
            <div class="card-header bg-light">
                <h5 class="mb-0">${translations[currentLanguage].formula}</h5>
            </div>
            <div class="card-body">
                <div class="mb-3 small">
                    <span class="color-box priamy-color"></span> ${translations[currentLanguage].priamy}
                    <span class="color-box nepriamy-color ms-3"></span> ${translations[currentLanguage].nepriamy}
                    <span class="color-box dnepriamy-color ms-3"></span> ${translations[currentLanguage].dnepriamy}
                </div>
                <div class="formula-container mb-0">
                    ${formulaText} = ${maxSize} ${translations[currentLanguage].bytesUnit}
                </div>
            </div>
        `);
    } else {
        $("#formula").html(`
            <div class="card-header bg-light">
                <h5 class="mb-0">${translations[currentLanguage].formula}</h5>
            </div>
            <div class="card-body">
                <p class="mb-0">${translations[currentLanguage].addBlocksToSeeFormula}</p>
            </div>
        `);
        
        $("#maxFileSize").html(`
            <div class="card-header bg-light">
                <h5 class="mb-0">${translations[currentLanguage].maxFileSize}</h5>
            </div>
            <div class="card-body">
                <p class="mb-0">0 ${translations[currentLanguage].bytesUnit}</p>
            </div>
        `);
    }
    
    // Trigger MathJax to process the new formula
    if (window.MathJax) {
        MathJax.typeset();
    }
}

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
    
    // Update page title
    document.querySelector('h3.text-primary').textContent = translations[currentLanguage].pageTitle;
    
    // Better selectors for storageBlocks and blockSizeLabel
    $("label[for='blockSize']").text(`${translations[currentLanguage].blockSizeLabel} ${pointerSize}):`);
    
    // The selector for pointer size -
    $(".form-label").each(function() {
        if ($(this).text().includes("Select Pointer Size") || $(this).text().includes("Vyberte") || $(this).text().includes("čísla")) {
            $(this).text(translations[currentLanguage].selectPointerSize);
        }
    });
    
    // Update the input placeholder
    $("#blockSize").attr("placeholder", translations[currentLanguage].enterBlockSize);
    
    // Update button texts
    $(".pointer-size-btn").each(function(index) {
        let size = $(this).data('size');
        if (index === 1) { // Second button (index 1)
            $(this).text(`${size} ${translations[currentLanguage].bytesUnit}`);
        } else {
            $(this).text(`${size} ${translations[currentLanguage].bytes}`);
        }
    });
    
    // Update storageBlocks with better selector
    $(".card-header h5").each(function() {
        if ($(this).text().includes("Storage") || $(this).text().includes("Bloky")) {
            $(this).text(translations[currentLanguage].storageBlocks);
        }
    });
    
    $("#add-box").text(translations[currentLanguage].addBlock);
    $("#formula .card-header h5").text(translations[currentLanguage].formula);
    $("#maxFileSize .card-header h5").text(translations[currentLanguage].maxFileSize);
    
    // Update existing file boxes
    $(".file-box span").each(function() {
        let text = $(this).text();
        if (text === "Select type" || text === "Vyberte typ" || text.includes("Select type") || text.includes("Vyberte typ")) {
            $(this).html(`${translations[currentLanguage].selectType} <i class="bi bi-caret-down-fill text-primary ms-2"></i>`);
        } else if (text === "Priamy" || text === "Direct") {
            $(this).text(translations[currentLanguage].priamy);
        } else if (text === "Nepriamy" || text === "Indirect") {
            $(this).text(translations[currentLanguage].nepriamy);
        } else if (text === "2x nepriamy" || text === "Double Indirect") {
            $(this).text(translations[currentLanguage].dnepriamy);
        }
    });
    
    // Update remove buttons
    $(".remove-box").html(`<i class="bi bi-trash"></i> ${translations[currentLanguage].remove}`);
    
    // Update error messages
    if ($("#error-msg").is(":visible")) {
        let currentText = $("#error-msg").text();
        if (currentText.includes("divisible")) {
            $("#error-msg").text(`${translations[currentLanguage].errorDivisibleBy} ${pointerSize}!`);
        } else if (currentText.includes("valid")) {
            $("#error-msg").text(translations[currentLanguage].errorValidSize);
        } else if (currentText.includes("least")) {
            $("#error-msg").text(`${translations[currentLanguage].errorMinSize} ${pointerSize} ${translations[currentLanguage].errorMinSizeEnd}`);
        }
    }
    $("#error-msg2").text(translations[currentLanguage].errorSelectType);
    
    // Update the formula descriptions
    if ($("#formula .card-body p").text().includes("Add blocks")) {
        $("#formula .card-body p").text(translations[currentLanguage].addBlocksToSeeFormula);
    }
    
    // Update formula legend
    $(".mb-3.small").html(`
        <span class="color-box priamy-color"></span> ${translations[currentLanguage].priamy}
        <span class="color-box nepriamy-color ms-3"></span> ${translations[currentLanguage].nepriamy}
        <span class="color-box dnepriamy-color ms-3"></span> ${translations[currentLanguage].dnepriamy}
    `);
    
    // Update unit in max file size (if it's showing 0 Bytes)
    if ($("#maxFileSize .card-body p").text() === "0 Bytes") {
        $("#maxFileSize .card-body p").text(`0 ${translations[currentLanguage].bytesUnit}`);
    }
    
    // Re-calculate to update any displayed formulas with new language
    // Only call if we're on the file system size page and blockSize element exists
    if ($("#blockSize").length && $("#blockSize").val()) {
        calculateMaxFileSize();
    }
}

$(document).ready(function () {
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
    
    // Validate block size input
    $("#blockSize").on("input", function () {
        let value = parseInt($(this).val());
        let hasError = false;
        
        // Check if value is divisible by the current pointer size
        if (isNaN(value) || value <= 0) {
            $("#error-msg").text(translations[currentLanguage].errorValidSize);
            $("#error-msg").show();
            hasError = true;
        } else if (value % pointerSize !== 0) {
            $("#error-msg").text(`${translations[currentLanguage].errorDivisibleBy} ${pointerSize}!`);
            $("#error-msg").show();
            hasError = true;
        } else if (value < pointerSize) {
            $("#error-msg").text(`${translations[currentLanguage].errorMinSize} ${pointerSize} ${translations[currentLanguage].errorMinSizeEnd}`);
            $("#error-msg").show();
            hasError = true;
        } else {
            $("#error-msg").hide();
            hasError = false;
        }
        
        // Toggle visibility of elements based on error state
        if (hasError) {
            $("#add-box").hide();
            $("#formula").hide();
            $("#maxFileSize").hide();
            $("#box-container").hide();
        } else {
            $("#add-box").show();
            $("#formula").show();
            $("#maxFileSize").show();
            $("#box-container").show();
            calculateMaxFileSize();
        }
    });

    // Add new box - updated for UI and localization
    $("#add-box").on("click", function () {
        // Check if all existing boxes have a selected type
        let allSelected = true;
        $(".file-box span").each(function () {
            if ($(this).text() === translations[currentLanguage].selectType) {
                allSelected = false;
                return false; // Break the loop
            }
        });

        if (allSelected) {
            let boxId = $(".file-box").length + 1;
            $("#box-container").append(`
                <div class="file-box d-flex justify-content-between align-items-center" data-id="${boxId}">
                    <span class="fw-bold">${translations[currentLanguage].selectType} <i class="bi bi-caret-down-fill text-primary ms-2"></i></span>
                    <button class="btn btn-outline-danger btn-sm remove-box">
                        <i class="bi bi-trash"></i> ${translations[currentLanguage].remove}
                    </button>
                </div>
            `);
            $("#error-msg2").hide(); // Hide error message
        } else {
            $("#error-msg2").show(); // Show error message
            // Add animation to make error more noticeable
            $("#error-msg2").fadeIn(100).fadeOut(100).fadeIn(100);
        }
    });

    // Remove a box
    $(document).on("click", ".remove-box", function (e) {
        e.stopPropagation();
        $(this).parent().remove();
        calculateMaxFileSize();
    });

    // Show dropdown on box click with localized options
    $(document).on("click", ".file-box", function () {
        // Create dropdown with localized text
        let dropdown = $(`
            <div class="dropdown-menu show file-box-dropdown p-2">
                <h6 class="dropdown-header">${translations[currentLanguage].selectBlockType}</h6>
                <button class="dropdown-item select-option" data-value="Priamy">${translations[currentLanguage].priamy}</button>
                <button class="dropdown-item select-option" data-value="Nepriamy">${translations[currentLanguage].nepriamy}</button>
                <button class="dropdown-item select-option" data-value="2x nepriamy">${translations[currentLanguage].dnepriamy}</button>
            </div>
        `);
        $(this).append(dropdown);
    });

    // Select an option with proper localized display
    $(document).on("click", ".select-option", function (e) {
        e.stopPropagation();
        let selectedValue = $(this).data("value");
        let box = $(this).closest(".file-box");
        
        // Set the display text based on the current language
        if (selectedValue === "Priamy") {
            box.find("span").text(translations[currentLanguage].priamy);
        } else if (selectedValue === "Nepriamy") {
            box.find("span").text(translations[currentLanguage].nepriamy);
        } else if (selectedValue === "2x nepriamy") {
            box.find("span").text(translations[currentLanguage].dnepriamy);
        }
        
        // Visual feedback based on selection
        box.removeClass("bg-light bg-info bg-warning");
        
        if (selectedValue === "Priamy") {
            box.addClass("bg-light");
        } else if (selectedValue === "Nepriamy") {
            box.addClass("bg-info bg-opacity-25");
        } else if (selectedValue === "2x nepriamy") {
            box.addClass("bg-warning bg-opacity-25");
        }
        
        $(".file-box-dropdown").remove();
        calculateMaxFileSize();
    });

    // Hide dropdown when clicking outside
    $(document).click(function (e) {
        if (!$(e.target).closest(".file-box").length) {
            $(".file-box-dropdown").remove();
        }
    });

    $('.pointer-size-btn').click(function() {
        $('.pointer-size-btn').removeClass('active');
        $(this).addClass('active');
        
        pointerSize = parseInt($(this).data('size'));
        
        // Update label text to reflect current pointer size requirement in current language
        $("label[for='blockSize']").text(`${translations[currentLanguage].blockSizeLabel} ${pointerSize}):`);
        
        // Re-validate the current block size with new pointer size
        $("#blockSize").trigger("input");
    });
});

// Make calculateMaxFileSize and changeLanguage global so they can be accessed from outside
window.calculateMaxFileSize = calculateMaxFileSize;
window.changeLanguage = changeLanguage;
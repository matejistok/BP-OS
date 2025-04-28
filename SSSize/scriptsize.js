let pointerSize = 4;

$(document).ready(function () {
    // Validate block size input
    $("#blockSize").on("input", function () {
        let value = parseInt($(this).val());
        let hasError = false;
        
        // Check if value is divisible by the current pointer size
        if (isNaN(value) || value <= 0) {
            $("#error-msg").text("Please enter a valid block size.");
            $("#error-msg").show();
            hasError = true;
        } else if (value % pointerSize !== 0) {
            $("#error-msg").text(`Error: Block size must be divisible by ${pointerSize}!`);
            $("#error-msg").show();
            hasError = true;
        } else if (value < pointerSize) {
            $("#error-msg").text(`Error: Block size must be at least ${pointerSize} bytes (current pointer size)!`);
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

    // Add new box - updated for better UI
    $("#add-box").on("click", function () {
        // Check if all existing boxes have a selected type
        let allSelected = true;
        $(".file-box span").each(function () {
            if ($(this).text() === "Select type") {
                allSelected = false;
                return false; // Break the loop
            }
        });

        if (allSelected) {
            let boxId = $(".file-box").length + 1;
            $("#box-container").append(`
                <div class="file-box d-flex justify-content-between align-items-center" data-id="${boxId}">
                    <span class="fw-bold">Select type</span>
                    <button class="btn btn-outline-danger btn-sm remove-box">
                        <i class="bi bi-trash"></i> Remove
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

    // Show dropdown on box click - updated with better styling
    $(document).on("click", ".file-box", function () {
        let dropdown = $(`
            <div class="dropdown-menu show file-box-dropdown p-2">
                <h6 class="dropdown-header">Select Block Type</h6>
                <button class="dropdown-item select-option" data-value="Priamy">Priamy</button>
                <button class="dropdown-item select-option" data-value="Nepriamy">Nepriamy</button>
                <button class="dropdown-item select-option" data-value="2x nepriamy">2x Nepriamy</button>
            </div>
        `);
        $(this).append(dropdown);
    });

    // Select an option - updated to show visual feedback
    $(document).on("click", ".select-option", function (e) {
        e.stopPropagation();
        let selectedValue = $(this).data("value");
        let box = $(this).closest(".file-box");
        
        box.find("span").text(selectedValue);
        
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
        
        // Update label text to reflect current pointer size requirement
        $("label[for='blockSize']").text(`Block Size (must be divisible by ${pointerSize}):`);
        
        // Re-validate the current block size with new pointer size
        $("#blockSize").trigger("input");
    });

    // Function to calculate the maximum file size
    function calculateMaxFileSize() {
        let blockSize = parseInt($('#blockSize').val());
        
        if (isNaN(blockSize) || blockSize <= 0) {
            return;
        }

        let maxSize = 0;
        let formulaParts = [];
        
        $(".file-box span").each(function () {
            let type = $(this).text();
            if (type === "Priamy") {
                maxSize += blockSize;
                formulaParts.push(`<span class="formula-part priamy-border">(${blockSize})</span>`);
            } else if (type === "Nepriamy") {
                let size = (blockSize / pointerSize) * blockSize;
                maxSize += size;
                formulaParts.push(`<span class="formula-part nepriamy-border">($\\frac{${blockSize}}{${pointerSize}} \\times ${blockSize}$)</span>`);
            } else if (type === "2x nepriamy") {
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
            let unit = "Bytes";
            
            if (maxSize >= 1024 * 1024) {
                formattedSize = (maxSize / (1024 * 1024)).toFixed(2);
                unit = "MB";
            } else if (maxSize >= 1024) {
                formattedSize = (maxSize / 1024).toFixed(2);
                unit = "KB";
            }
            
            $("#maxFileSize").html(`
                <div class="card-header bg-light">
                    <h5 class="mb-0">Max File System Size</h5>
                </div>
                <div class="card-body">
                    <p class="mb-0">${formattedSize} ${unit}</p>
                </div>
            `);
            
            $("#formula").html(`
                <div class="card-header bg-light">
                    <h5 class="mb-0">Formula</h5>
                </div>
                <div class="card-body">
                    <div class="mb-3 small">
                        <span class="color-box priamy-color"></span> Priamy
                        <span class="color-box nepriamy-color ms-3"></span> Nepriamy
                        <span class="color-box dnepriamy-color ms-3"></span> 2x Nepriamy
                    </div>
                    <div class="formula-container mb-0">
                        ${formulaText} = ${maxSize} Bytes
                    </div>
                </div>
            `);
        } else {
            $("#formula").html(`
                <div class="card-header bg-light">
                    <h5 class="mb-0">Formula</h5>
                </div>
                <div class="card-body">
                    <p class="mb-0">Add blocks to see formula</p>
                </div>
            `);
            
            $("#maxFileSize").html(`
                <div class="card-header bg-light">
                    <h5 class="mb-0">Max File System Size</h5>
                </div>
                <div class="card-body">
                    <p class="mb-0">0 Bytes</p>
                </div>
            `);
        }
        
        // Trigger MathJax to process the new formula
        if (window.MathJax) {
            MathJax.typeset();
        }
    }
});
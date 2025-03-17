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

    // Add new box
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
                <div class="file-box btn btn-light d-flex justify-content-between align-items-center mt-2" data-id="${boxId}">
                    <span>Select type</span>
                    <button class="btn btn-danger btn-sm remove-box">X</button>
                </div>
            `);
            $("#error-msg2").hide(); // Hide error message
        } else {
            $("#error-msg2").show(); // Show error message
        }
    });

    // Remove a box
    $(document).on("click", ".remove-box", function (e) {
        e.stopPropagation();
        $(this).parent().remove();
        calculateMaxFileSize();
    });

    // Show dropdown on box click
    $(document).on("click", ".file-box", function () {
        let dropdown = $(`
            <div class="dropdown-menu show file-box-dropdown">
                <button class="dropdown-item select-option" data-value="Priamy">Priamy</button>
                <button class="dropdown-item select-option" data-value="Nepriamy">Nepriamy</button>
                <button class="dropdown-item select-option" data-value="2x nepriamy">2x Nepriamy</button>
            </div>
        `);
        $(this).append(dropdown);
    });

    // Select an option
    $(document).on("click", ".select-option", function (e) {
        e.stopPropagation();
        let selectedValue = $(this).data("value");
        $(this).closest(".file-box").find("span").text(selectedValue);
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
        let formula = "";
        $(".file-box span").each(function () {
            let type = $(this).text();
            if (type === "Priamy") {
                maxSize += blockSize;
                formula += ` + ${blockSize}`;
            } else if (type === "Nepriamy") {
                let size = (blockSize / pointerSize) * blockSize;
                maxSize += size;
                formula += ` + (${blockSize} / ${pointerSize}) * ${blockSize}`;
            } else if (type === "2x nepriamy") {
                let size = (blockSize / pointerSize) * (blockSize / pointerSize) * blockSize;
                maxSize += size;
                formula += ` + (${blockSize} / ${pointerSize}) * (${blockSize} / ${pointerSize}) * ${blockSize}`;
            }
        });

        formula = formula.replace(" + ", ""); // Remove the leading " + "
        $("#formula").text(`Formula: ${formula}`);
        $("#maxFileSize").text(`Max File System Size: ${maxSize} Bytes`);
    }
});
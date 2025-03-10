$(document).ready(function () {
    // Validate block size input
    $("#blockSize").on("input", function () {
        let value = parseInt($(this).val());
        if (value % 4 !== 0) {
            $("#error-msg").show();
        } else {
            $("#error-msg").hide();
        }
        calculateMaxFileSize();
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
                    <button class="btn btn-danger btn-sm remove-box">✖</button>
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

    // Function to calculate the maximum file size
    function calculateMaxFileSize() {
        let blockSize = parseInt($("#blockSize").val());
        if (isNaN(blockSize) || blockSize % 4 !== 0) {
            $("#maxFileSize").text("Invalid block size");
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
                let size = (blockSize / 4) * blockSize;
                maxSize += size;
                formula += ` + (${blockSize} / 4) * ${blockSize}`;
            } else if (type === "2x nepriamy") {
                let size = (blockSize / 4) * (blockSize / 4) * blockSize;
                maxSize += size;
                formula += ` + (${blockSize} / 4) * (${blockSize} / 4) * ${blockSize}`;
            }
        });

        formula = formula.replace(" + ", ""); // Remove the leading " + "
        $("#formula").text(`Formula: ${formula}`);
        $("#maxFileSize").text(`Max File System Size: ${maxSize} Bytes`);
    }
});
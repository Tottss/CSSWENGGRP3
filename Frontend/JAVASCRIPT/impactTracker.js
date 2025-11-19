document.addEventListener("DOMContentLoaded", () => {
    // --- element refs (single place so it's easy to diagnose) ---
    const projectSelect = document.getElementById("projectSelect");
    const actualValue = document.getElementById("actualValue");
    const targetValue = document.getElementById("targetValue");
    const projectBudget = document.getElementById("projectBudget");
    const expenseToDate = document.getElementById("expenseToDate");
    const progressRange = document.getElementById("progressRange");
    const progressText = document.getElementById("progressText");
    const progressLabel = document.getElementById("progressLabel");
    const advocacyArea = document.getElementById("advocacyArea");
    const sdgAlignment = document.getElementById("sdgAlignment");
    const communityLocation = document.getElementById("communityLocation");
    const narrativeField = document.getElementById("narrativeField");
    const uploadFilesInput = document.querySelector('input[name="uploads"]');
    const displayPhotoInput = document.querySelector('input[name="display_photo"]');
    const saveBtn = document.querySelector(".save-btn");

    // --- helper to show alerts (uses customAlert if present, otherwise alert()) ---
    function showAlert(message, type = "success") {
        const alertBox = document.getElementById("customAlert");
        if (alertBox) {
            alertBox.textContent = message;
            alertBox.className = `alert-box ${type} show`;
            setTimeout(() => alertBox.classList.remove("show"), 3000);
        } else {
            // fallback so user sees something when debugging
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    // --- sanity checks: make sure the important elements exist ---
    const missing = [];
    if (!projectSelect) missing.push("projectSelect");
    if (!actualValue) missing.push("actualValue");
    if (!targetValue) missing.push("targetValue");
    if (!projectBudget) missing.push("projectBudget");
    if (!expenseToDate) missing.push("expenseToDate");
    if (!progressRange) missing.push("progressRange");
    if (!progressText) missing.push("progressText");
    if (!progressLabel) missing.push("progressLabel");
    if (!communityLocation) missing.push("communityLocation");
    if (!narrativeField) missing.push("narrativeField");
    if (!saveBtn) missing.push("save button (.save-btn)");

    // --- project selection handler ---
    if (projectSelect) {
        projectSelect.addEventListener("change", async (e) => {
        const projectId = e.target.value;
        console.log("projectSelect changed:", projectId);
        if (!projectId) {
            // clear fields
            actualValue.value = 0;
            targetValue.value = 0;
            projectBudget.value = "";
            expenseToDate.value = "";
            progressRange.value = 0;
            progressText.textContent = "0%";
            progressLabel.textContent = "0% Progress Reported";
            communityLocation.value = "";
            narrativeField.value = "";
            return;
        }

        try {
            const response = await fetch(`/tracker/get/${projectId}`);
            if (!response.ok) {
                console.warn("tracker/get returned status", response.status);
                showAlert("Failed to fetch tracker data", "error");
                return;
            }

            const data = await response.json();
            console.log("tracker data:", data);

            const t = data.tracker || {};
            const p = data.project || {};

            // populate fields
            if (actualValue) actualValue.value = t.actual_beneficiaries || 0;
            if (targetValue) targetValue.value = t.target_beneficiaries || 0;
            if (projectBudget) projectBudget.value = t.budget || 0;
            if (expenseToDate) expenseToDate.value = t.expenses_to_date || 0;

            // progress
            if (progressRange) progressRange.value = t.progress_percent || 0;
            if (progressText) progressText.textContent = `${t.progress_percent || 0}%`;
            if (progressLabel) progressLabel.textContent = `${t.progress_percent || 0}% Progress Reported`;

            // other fields
            if (advocacyArea) advocacyArea.value = t.advocacyArea || "";
            if (sdgAlignment) sdgAlignment.value = t.sdgAlignment || "";
            if (communityLocation) communityLocation.value = t.location || "";
            if (narrativeField) narrativeField.value = t.narrative || "";

            // display photo preview
            const preview = document.getElementById("displayPhotoPreview");
            if (preview) {
                preview.src = p.project_imageURL || null;
            }

        } catch (err) {
            console.error("Error fetching tracker data:", err);
            showAlert("Error fetching tracker data", "error");
        }
        });
    }

    // --- progress range update ---
    if (progressRange) {
        // keep progress text in sync
        progressRange.addEventListener("input", () => {
            if (progressText) progressText.textContent = `${progressRange.value}%`;
            if (progressLabel) progressLabel.textContent = `${progressRange.value}% Progress Reported`;
        });
    }

    // --- save button ---
    if (saveBtn) {
        saveBtn.addEventListener("click", async (e) => {
        e.preventDefault(); // in case button inside a form

        const project_id = projectSelect ? projectSelect.value : "";
        if (!project_id) {
            showAlert("Please select a project first", "error");
            return;
        }

        const formData = new FormData();
        formData.append("project_id", project_id);
        formData.append("actual_beneficiaries", actualValue ? actualValue.value : 0);
        formData.append("target_beneficiaries", targetValue ? targetValue.value : 0);
        formData.append("budget", projectBudget ? projectBudget.value : 0);
        formData.append("expenses_to_date", expenseToDate ? expenseToDate.value : 0);
        formData.append("progress_percent", progressRange ? progressRange.value : 0);
        formData.append("location", communityLocation ? communityLocation.value : "");
        formData.append("narrative", narrativeField ? narrativeField.value : "");

        // files (if present)
        if (uploadFilesInput?.files?.length) {
            for (const file of uploadFilesInput.files) {
                formData.append("uploads", file);
            }
        }

        // for display photo
        if (displayPhotoInput?.files?.length) {
            formData.append("display_photo", displayPhotoInput.files[0]);
        }

        console.log("Saving tracker for project:", project_id);

        try {
            const response = await fetch("/tracker/save", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            console.log("Save response:", result);

            if (result && result.success) {
                showAlert("Saved!", "success");
            } else {
                showAlert("Error saving tracker.", "error");
            }
        } catch (err) {
            console.error("Error saving tracker:", err);
            showAlert("Error saving tracker", "error");
        }
        });
    }
});
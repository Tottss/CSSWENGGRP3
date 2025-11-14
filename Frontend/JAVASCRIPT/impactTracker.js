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
    const communityLocation = document.getElementById("communityLocation");
    const narrativeField = document.getElementById("narrativeField");
    const fileInput = document.querySelector('input[type="file"]');
    const saveBtn = document.querySelector(".save-btn"); // ok to use class, but id is better

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
    if (missing.length) {
        console.error("impactTracker: missing DOM elements ->", missing.join(", "));
        // Don't return — we keep going so partial features still work, but we warn.
    } else {
        console.log("impactTracker: all required DOM elements found");
    }

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

            actualValue && (actualValue.value = data.actual_beneficiaries || 0);
            targetValue && (targetValue.value = data.target_beneficiaries || 0);
            projectBudget && (projectBudget.value = data.budget || 0);
            expenseToDate && (expenseToDate.value = data.expenses_to_date || 0);
            if (progressRange) progressRange.value = data.progress_percent || 0;
            if (progressText) progressText.textContent = `${data.progress_percent || 0}%`;
            if (progressLabel) progressLabel.textContent = `${data.progress_percent || 0}% Progress Reported`;
            communityLocation && (communityLocation.value = data.location || "");
            narrativeField && (narrativeField.value = data.narrative || "");
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
        if (fileInput && fileInput.files && fileInput.files.length) {
            for (const file of fileInput.files) {
                formData.append("uploads", file);
            }
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
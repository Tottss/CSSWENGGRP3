document.addEventListener("DOMContentLoaded", () => {
    const projectSelect = document.getElementById("projectSelect");
    const deleteBtn = document.getElementById("delete");

    // show button only when project is selected
    projectSelect.addEventListener("change", function () {
        deleteBtn.style.display = this.value ? "block" : "none";
    });

    deleteBtn.addEventListener("click", async () => {
        const projectId = projectSelect.value;
        if (!projectId) return;

        // get project name for confirmation message
        const selectedOption = projectSelect.options[projectSelect.selectedIndex];
        const projectName = selectedOption.text;

        // ask for confirmation
        const confirmDelete = confirm(
            `Are you sure you want to delete "${projectName}"?\n\nThis action cannot be undone.`
        );

        if (!confirmDelete) return;

        try {
            // show loading state
            deleteBtn.disabled = true;
            deleteBtn.textContent = "Deleting...";

            // send DELETE request to server
            const response = await fetch(`/projects/${projectId}/delete`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert("Project deleted successfully!");

                // remove the project from the dropdown
                selectedOption.remove();

                // reset selection and hide button
                projectSelect.value = "";
                deleteBtn.style.display = "none";

            } else {
                alert(`Failed to delete project: ${result.message || "Unknown error"}`);
            }

        } catch (err) {
            console.error("Delete error:", err);
            alert("An error occurred while deleting the project.");

        } finally {
            // reset button state
            deleteBtn.disabled = false;
            deleteBtn.textContent = "Delete Project";
        }
    });
});
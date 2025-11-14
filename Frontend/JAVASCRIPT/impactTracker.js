// event listener for saving tracker data
document.querySelector(".save-btn").addEventListener("click", async () => {
    const data = {
        project_id: document.getElementById("projectSelect").value,
        actual_beneficiaries: document.getElementById("actualValue").value,
        target_beneficiaries: document.getElementById("targetValue").value,
        budget: document.getElementById("projectBudget").value,
        expenses_to_date: document.getElementById("expenseToDate").value,
        progress_percent: document.getElementById("progressRange").value,
        location: document.querySelector("#locationField").value,
        narrative: document.querySelector("#narrativeField").value,
    };

    const response = await fetch("/tracker/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    const result = await response.json();
    if (result.success) alert("Saved!");
});
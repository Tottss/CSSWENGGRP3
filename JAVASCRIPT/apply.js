// Wait until the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const applyForm = document.getElementById("applyForm");

  // Create alert container (same as login.js)
  const alertBox = document.createElement("div");
  alertBox.classList.add("alert-box");
  document.body.appendChild(alertBox);

  // Show alert message (same design as login.js)
  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `alert-box ${type}`; // type = "success" or "error"
    alertBox.classList.add("show");

    // Automatically hide after 3s
    setTimeout(() => {
      alertBox.classList.remove("show");
    }, 3000);
  }

  // Handle form submission
  applyForm.addEventListener("submit", (event) => {
    event.preventDefault();

    // Collect form data
    const orgName = document.getElementById("orgName").value.trim();
    const contactName = document.getElementById("contactName").value.trim();
    const contactPosition = document.getElementById("contactPosition").value.trim();
    const contactNumber = document.getElementById("contactNumber").value.trim();
    const fullAddress = document.getElementById("fullAddress").value.trim();
    const province = document.getElementById("province").value.trim();
    const municipality = document.getElementById("municipality").value.trim();
    const barangay = document.getElementById("barangay").value.trim();
    const partnerType = document.getElementById("partnerType").value;
    const advocacy = document.getElementById("advocacy").value.trim();
    const mouFile = document.getElementById("mou").files[0];

    // Validation
    if (
      !orgName ||
      !contactName ||
      !contactPosition ||
      !contactNumber ||
      !fullAddress ||
      !province ||
      !municipality ||
      !barangay ||
      !partnerType ||
      !advocacy ||
      !mouFile
    ) {
      showAlert("⚠️ Please fill in all required fields.", "error");
      return;
    }

    // Validate file type
    if (mouFile.type !== "application/pdf") {
      showAlert("⚠️ Please upload your MOU in PDF format only.", "error");
      return;
    }

    // --- SAMPLE SUCCESS (for testing) ---
    if (orgName === "Test Org" && contactName === "John Doe") {
      showAlert("✅ Application successful! We will contact you soon.", "success");
      applyForm.reset();
      return;
    }

    // Otherwise (placeholder for backend)
    showAlert("✅ Your application has been successfully submitted!", "success");
    applyForm.reset();
  });
});

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
      setTimeout(() => {
        alertBox.textContent = "";
        alertBox.className = "alert-box";
      }, 400);
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
    const email = document.getElementById("email").value.trim();
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
      !email ||
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

    // Backend for sending the application
    showAlert("Sending Application...", "success");
    const formData = new FormData();
    formData.append("orgName", orgName);
    formData.append("contactName", contactName);
    formData.append("contactPosition", contactPosition);
    formData.append("contactNumber", contactNumber);
    formData.append("email", email);
    formData.append("fullAddress", fullAddress);
    formData.append("province", province);
    formData.append("municipality", municipality);
    formData.append("barangay", barangay);
    formData.append("partnerType", partnerType);
    formData.append("advocacy", advocacy);
    formData.append("mou", mouFile);

    fetch("http://127.0.0.1:3000/request/apply", {
      method: "POST",
      body: formData
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showAlert("Application submitted successfully! We'll email you soon.", "success");
          applyForm.reset();
        } else {
          showAlert("Failed to submit application. Please try again later.", "error");
        }
      })
      .catch((err) => {
        console.error(err);
        showAlert("Network error. Please try again.", "error");
      });
  });
});

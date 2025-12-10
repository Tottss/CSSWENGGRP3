document
  .getElementById("createAdminForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const adminEmail = document.getElementById("adminEmail").value; // Email
    const adminPassword = document.getElementById("adminPassword").value; // Password

    const res = await fetch("/admindashboard/createadminaccount/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminEmail, adminPassword }),
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      window.location.href = "/admindashboard/createadminaccount";
    }
  });
// createAdmin.js

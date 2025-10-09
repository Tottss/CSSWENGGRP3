document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector(".login-grp form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const rememberCheckbox = document.getElementById("remember");
  const applyLink = document.querySelector(".apply");

  if (loginForm && usernameInput && passwordInput && rememberCheckbox && applyLink) {
    // Autofill username/email if previously remembered
    if (localStorage.getItem("rememberedUser")) {
      usernameInput.value = localStorage.getItem("rememberedUser");
      rememberCheckbox.checked = true;
    }

    // Handle form submit
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();

      if (username === "" || password === "") {
        alert("Please fill in both Username/Email and Password.");
        return;
      }

      // Remember username
      if (rememberCheckbox.checked) {
        localStorage.setItem("rememberedUser", username);
      } else {
        localStorage.removeItem("rememberedUser");
      }

      // Demo login check
      if (username === "test@example.com" && password === "123456") {
        alert("Login successful! Redirecting...");
        window.location.href = "dashboard.html";
      } else {
        alert("Invalid username or password.");
      }
    });

    // Aply link click
    applyLink.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Redirecting to registration page...");
      window.location.href = "apply.html";
    });
  }
});

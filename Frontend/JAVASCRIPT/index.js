// index.js

// Wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Select the login form inside login-grp
  const loginForm = document.querySelector(".login-grp form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const rememberCheckbox = document.getElementById("remember");
  const registerLink = document.querySelector(".register");

  // Only run if form exists (safety check)
  if (
    loginForm &&
    usernameInput &&
    passwordInput &&
    rememberCheckbox &&
    registerLink
  ) {
    // Autofill username/email if previously remembered
    if (localStorage.getItem("rememberedUser")) {
      usernameInput.value = localStorage.getItem("rememberedUser");
      rememberCheckbox.checked = true;
    }

    // Handle form submit
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault(); // stop page reload

      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();

      if (username === "" || password === "") {
        alert("Please fill in both Username/Email and Password.");
        return;
      }

      // Save remembered username
      if (rememberCheckbox.checked) {
        localStorage.setItem("rememberedUser", username);
      } else {
        localStorage.removeItem("rememberedUser");
      }

      // Fake login validation (replace with backend later)
      if (username === "test@example.com" && password === "123456") {
        alert("Login successful! Redirecting...");
        window.location.href = "dashboard.html";
      } else {
        alert("Invalid username or password.");
      }
    });

    // Register link click
    registerLink.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Redirecting to registration page...");
      window.location.href = "register.html";
    });
  }
});

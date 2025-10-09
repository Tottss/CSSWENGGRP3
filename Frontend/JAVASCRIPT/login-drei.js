document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  console.log("Login button clicked");
  console.log("Sending request to backend...");

  const user_email = document.getElementById("username").value.trim();
  const user_password = document.getElementById("password").value.trim();

  try {
    const response = await fetch("http://127.0.0.1:3000/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_email, user_password }),
    });

    const data = await response.json();
    console.log(data);

    if (response.ok) {
      if (data.user.is_admin) {
        window.location.href = "./adminView.html";
      } else {
        window.location.href = "./userView.html";
      }
    } else {
      alert(data.message || "Invalid credentials");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Server error. Please try again later.");
  }
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  console.log("Login button clicked");
  console.log("Sending request to backend...");

  const user_email = document.getElementById("username").value.trim();
  const user_password = document.getElementById("password").value.trim();

  try {
    // removed http://127.0.0.1:3000 in path
    const response = await fetch("/user/login", {
      method: "POST",
      credentials: "include", // testing
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_email, user_password }),
    });

    const data = await response.json();
    console.log(data);

    if (response.ok) {
      if (data.user.is_admin) {
        window.location.href = "/admindashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } else {
      alert(data.message || "Invalid credentials");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Server error. Please try again later.");
  }
});

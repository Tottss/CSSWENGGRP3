document.getElementById("changePasswordForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const oldPassword = document.getElementById("oldpass").value;
    const newPassword = document.getElementById("newpass").value;

    const res = await fetch("/editpassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword })
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
        window.location.href = "/editprofile";
    }
});
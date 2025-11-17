const profileForm = document.getElementById("profileForm");

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("Save Edits button was clicked!");

  const formData = new FormData(profileForm);

  try {
    const response = await fetch("/editprofile/save", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    console.log("response: ", response.ok);

    if (!response.ok) {
      alert("Failed to update profile");
    } else {
      alert("Profile updated successfully!");
      window.location.href = "/profileview";
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
});

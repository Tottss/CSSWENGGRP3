const proposalForm = document.getElementById("proposalForm");

proposalForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("Save Edits button was clicked!");

  const formData = new FormData(proposalForm);
  const proposalId = document.getElementById("proposal_id").value;

  try {
    const response = await fetch("/updateproposal/${proposalId}/save", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    console.log("response: ", response.ok);

    if (!response.ok) {
      alert("Failed to update proposal");
    } else {
      alert("Proposal updated successfully!");
      window.location.href = `/viewproposal/${proposalId}`;
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
});

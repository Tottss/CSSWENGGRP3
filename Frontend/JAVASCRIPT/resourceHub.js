document.querySelectorAll("[data-folder]").forEach(folder => {
  folder.addEventListener("click", () => {
    const content = folder.nextElementSibling;

    // Only toggle if next element is a subfolder list
    if (content && content.hasAttribute("data-content")) {
      const isOpen = content.style.display === "block";
      content.style.display = isOpen ? "none" : "block";

      const toggleIcon = folder.querySelector(".folder-toggle");
      if (toggleIcon) toggleIcon.textContent = isOpen ? "▶" : "▼";
    }
  });
});

let currentIndex = 0;

function loadGalleryImage() {
    const gallery = document.getElementById("galleryView");
    gallery.style.backgroundImage = `url('${galleryImages[currentIndex]}')`;
}

function changeSlide(direction) {
    currentIndex += direction;

    if (currentIndex < 0) currentIndex = galleryImages.length - 1;
    if (currentIndex >= galleryImages.length) currentIndex = 0;

    loadGalleryImage();
}

// update progress circle and bars when page loads
function initializeProgressIndicators() {
    // update progress circle
    const progressCircle = document.getElementById('progressCircle');
    const progressText = document.getElementById('progressText');

    if (progressCircle && progressText) {
        const progressPercent = parseInt(progressText.textContent) || 0;
        const circumference = 100;
        const offset = circumference - (progressPercent / 100) * circumference;
        progressCircle.style.strokeDasharray = `${circumference}`;
        progressCircle.style.strokeDashoffset = `${offset}`;
    }

    // update beneficiary bars
    const actualBar = document.getElementById('actualBar');
    const targetBar = document.getElementById('targetBar');

    if (actualBar && targetBar) {
        const actual = parseInt(actualBar.textContent) || 0;
        const target = parseInt(targetBar.textContent) || 0;
        const maxValue = Math.max(actual, target, 1);

        const actualPercent = (actual / maxValue) * 100;
        const targetPercent = (target / maxValue) * 100;

        actualBar.style.width = `${actualPercent}%`;
        targetBar.style.width = `${targetPercent}%`;
    }
}

window.onload = () => {
    loadGalleryImage();
    initializeProgressIndicators();
};

document.getElementById("saveImpact").addEventListener("click", () => {
    const projectId = document.getElementById("saveImpact").dataset.projectId;
    
    // trigger backend PDF route
    window.location.href = `/viewcommunityproject/${projectId}/generate`;
});

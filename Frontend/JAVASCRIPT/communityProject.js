const slides = ['#000000', '#2c3e50', '#c0392b']; 
let currentIndex = 0;

window.changeSlide = function(direction) {
    currentIndex += direction;
    
    // Infinite Loop logic
    if (currentIndex < 0) {
        currentIndex = slides.length - 1;
    } else if (currentIndex >= slides.length) {
        currentIndex = 0;
    }
    
    updateGallery();
};

function updateGallery() {
    const galleryView = document.getElementById('galleryView');
    if (galleryView) {
        // For now, we change background color habang wala pics 
        // To use real images, change this to: galleryView.style.backgroundImage = `url(${slides[currentIndex]})`;
        galleryView.style.backgroundColor = slides[currentIndex];
        console.log("Gallery updated to slide index:", currentIndex);
    } else {
        console.error("Gallery element not found");
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updateGallery();
});
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

window.onload = loadGalleryImage;

document.addEventListener('DOMContentLoaded', function() {
    if (!localStorage.getItem('wishlistSpeakers')) {
        localStorage.setItem('wishlistSpeakers', JSON.stringify([]));
    }
});

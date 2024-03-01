document.addEventListener('DOMContentLoaded', function() {
    if (!localStorage.getItem('wishlistSpeakers')) {
        localStorage.setItem('wishlistSpeakers', JSON.stringify([]));
    }
});
function addToWishlist(speakerId) {
    // Retrieve the wishlist from localStorage and parse it into an array
    let wishlist = JSON.parse(localStorage.getItem('wishlistSpeakers'));
    
    // Check if the speakerId is not already in the wishlist
    if (!wishlist.includes(speakerId)) {
        // Add the speakerId to the wishlist array
        wishlist.push(speakerId);
        // Save the updated array back to localStorage
        localStorage.setItem('wishlistSpeakers', JSON.stringify(wishlist));
        // Optionally, update UI here (will be covered in a later step)
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize wishlist in localStorage if it doesn't exist
    if (!localStorage.getItem('wishlistSpeakers')) {
        localStorage.setItem('wishlistSpeakers', JSON.stringify([]));
    }

    // Function to add a speaker to the wishlist
    function addToWishlist(speakerId) {
        let wishlist = JSON.parse(localStorage.getItem('wishlistSpeakers'));
        if (!wishlist.includes(speakerId)) {
            wishlist.push(speakerId);
            localStorage.setItem('wishlistSpeakers', JSON.stringify(wishlist));
            // Optionally, update UI here
        }
    }

    // Function to remove a speaker from the wishlist
    function removeFromWishlist(speakerId) {
        let wishlist = JSON.parse(localStorage.getItem('wishlistSpeakers'));
        wishlist = wishlist.filter(id => id !== speakerId);
        localStorage.setItem('wishlistSpeakers', JSON.stringify(wishlist));
        // Optionally, update UI here
    }

    // Attach click event listeners to "Add to Wishlist" buttons
    document.querySelectorAll('.div-sp-sl-wrapper-add').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const speakerId = this.getAttribute('data-speaker-id');
            addToWishlist(speakerId);
            // Optional: Update the button's appearance
        });
    });

    // Attach click event listeners to "Remove from Wishlist" buttons
    document.querySelectorAll('.div-sp-sl-wrapper-remove').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const speakerId = this.getAttribute('data-speaker-id');
            removeFromWishlist(speakerId);
            // Optional: Update the button's appearance
        });
    });
});

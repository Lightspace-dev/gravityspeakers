document.addEventListener('DOMContentLoaded', function() {
    console.log('Document loaded and script is running.');

    // Initialize wishlist in localStorage if it doesn't exist
    if (!localStorage.getItem('wishlistSpeakers')) {
        localStorage.setItem('wishlistSpeakers', JSON.stringify([]));
        console.log('Initialized wishlistSpeakers in localStorage.');
    }

    // Update button visibility based on wishlist state
    setButtonVisibility();

    // Function to add a speaker to the wishlist
    function addToWishlist(speakerId) {
        let wishlist = JSON.parse(localStorage.getItem('wishlistSpeakers'));
        if (!wishlist.includes(speakerId)) {
            wishlist.push(speakerId);
            localStorage.setItem('wishlistSpeakers', JSON.stringify(wishlist));
            console.log(`Added speaker ${speakerId} to wishlist.`);
            updateWishlistCount(); // Ensure this function is defined or moved here if you decide to merge scripts
            setButtonVisibility();
        } else {
            console.log(`Speaker ${speakerId} is already in the wishlist.`);
        }
    }

    // Function to remove a speaker from the wishlist
    function removeFromWishlist(speakerId) {
        let wishlist = JSON.parse(localStorage.getItem('wishlistSpeakers'));
        wishlist = wishlist.filter(id => id !== speakerId);
        localStorage.setItem('wishlistSpeakers', JSON.stringify(wishlist));
        console.log(`Removed speaker ${speakerId} from wishlist.`);
        updateWishlistCount(); // Ensure this function is defined or moved here if you decide to merge scripts
        setButtonVisibility();
    }

    // Attach click event listeners to "Add to Wishlist" buttons
    document.querySelectorAll('.div-sp-sl-wrapper-add').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const speakerId = this.getAttribute('data-speaker-id');
            console.log('Add to wishlist clicked:', speakerId);
            addToWishlist(speakerId);
        });
    });

    // Attach click event listeners to "Remove from Wishlist" buttons
    document.querySelectorAll('.div-sp-sl-wrapper-remove').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const speakerId = this.getAttribute('data-speaker-id');
            console.log('Remove from wishlist clicked:', speakerId);
            removeFromWishlist(speakerId);
        });
    });
});

function setButtonVisibility() {
    const wishlist = JSON.parse(localStorage.getItem('wishlistSpeakers')) || [];
    document.querySelectorAll('[data-speaker-id]').forEach(button => {
        const speakerId = button.getAttribute('data-speaker-id');
        if (wishlist.includes(speakerId)) {
            document.querySelector(`.div-sp-sl-wrapper-add[data-speaker-id="${speakerId}"]`).style.display = 'none';
            document.querySelector(`.div-sp-sl-wrapper-remove[data-speaker-id="${speakerId}"]`).style.display = 'block';
        } else {
            document.querySelector(`.div-sp-sl-wrapper-add[data-speaker-id="${speakerId}"]`).style.display = 'block';
            document.querySelector(`.div-sp-sl-wrapper-remove[data-speaker-id="${speakerId}"]`).style.display = 'none';
        }
    });
}

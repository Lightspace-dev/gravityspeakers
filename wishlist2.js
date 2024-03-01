document.addEventListener('DOMContentLoaded', function() {
    console.log('Document loaded and script is running.');

    // Initialize wishlist in localStorage if it doesn't exist
    if (!localStorage.getItem('wishlistSpeakers')) {
        localStorage.setItem('wishlistSpeakers', JSON.stringify([]));
        console.log('Initialized wishlistSpeakers in localStorage.');
    }

    // Function to add a speaker to the wishlist
    function addToWishlist(speakerId) {
        let wishlist = JSON.parse(localStorage.getItem('wishlistSpeakers'));
        if (!wishlist.includes(speakerId)) {
            wishlist.push(speakerId);
            localStorage.setItem('wishlistSpeakers', JSON.stringify(wishlist));
            console.log(`Added speaker ${speakerId} to wishlist.`);
        } else {
            console.log(`Speaker ${speakerId} is already in the wishlist.`);
        }
    }

    // Function to remove a speaker from the wishlist
    function removeFromWishlist(speakerId) {
        let wishlist = JSON.parse(localStorage.getItem('wishlistSpeakers'));
        const initialLength = wishlist.length;
        wishlist = wishlist.filter(id => id !== speakerId);
        if (wishlist.length < initialLength) {
            console.log(`Removed speaker ${speakerId} from wishlist.`);
            localStorage.setItem('wishlistSpeakers', JSON.stringify(wishlist));
        } else {
            console.log(`Speaker ${speakerId} was not found in the wishlist.`);
        }
    }

    // Attach click event listeners to "Add to Wishlist" buttons
    const addButtons = document.querySelectorAll('.div-sp-sl-wrapper-add');
    console.log(`Found ${addButtons.length} 'Add to Wishlist' buttons.`);
    addButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const speakerId = this.getAttribute('data-speaker-id');
            console.log('Add to wishlist clicked:', speakerId);
            addToWishlist(speakerId);
        });
    });

    // Attach click event listeners to "Remove from Wishlist" buttons
    const removeButtons = document.querySelectorAll('.div-sp-sl-wrapper-remove');
    console.log(`Found ${removeButtons.length} 'Remove from Wishlist' buttons.`);
    removeButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const speakerId = this.getAttribute('data-speaker-id');
            console.log('Remove from wishlist clicked:', speakerId);
            removeFromWishlist(speakerId);
        });
    });
});

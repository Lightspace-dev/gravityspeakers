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
document.addEventListener('DOMContentLoaded', function() {
    // Query all "Add to Wishlist" buttons
    const addButtons = document.querySelectorAll('.div-sp-sl-wrapper-add');

    // Attach click event listeners to each button
    addButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent any default action

            // Assuming each button has a data attribute like 'data-speaker-id' that stores the speaker's unique ID
            const speakerId = this.getAttribute('data-speaker-id');

            // Call the addToWishlist function with the speaker's ID
            addToWishlist(speakerId);

            // Optional: Update the button's appearance or disable it to indicate the speaker has been added
        });
    });
});

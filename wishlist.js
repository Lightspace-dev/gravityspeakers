document.addEventListener('DOMContentLoaded', function () {
    const wishAdd = document.querySelectorAll('.speaker-wish-g.add');
    const wishRemove = document.querySelectorAll('.speaker-wish-g.remove');

    // Function to update the wish list count
    function updateWishListCount() {
        // Count only keys that match a specific pattern to ensure they belong to the wish list
        const count = Object.keys(localStorage).filter(key => key.startsWith('wish-name-')).length;
        document.querySelector('.hb-count-speaker').textContent = count;
    }

    // Function to update the display of speakers based on localStorage shortlist
    function updateSpeakerDisplay() {
        const speakers = document.querySelectorAll('.speaker'); // Adjust this selector based on your HTML
        speakers.forEach(speaker => {
            const key = speaker.getAttribute('data-key');
            // Only consider items with the correct key pattern
            if (key && localStorage.getItem(key)) {
                speaker.style.display = 'block'; // Show shortlisted speakers
            } else {
                speaker.style.display = 'none'; // Hide others
            }
        });
    }

    // Initialize wish list count and speaker display on load
    updateWishListCount();
    updateSpeakerDisplay(); // Call this on the speaker shortlist page

    wishAdd.forEach((add, idx) => {
        const key = `wish-name-${idx + 1}`;
        add.setAttribute('data-key', key);

        // Fallback if data attributes are not set
        const name = add.dataset.name || 'Unknown';
        const lastname = add.dataset.lastname || 'Name';
        const fullName = `${name} ${lastname}`;

        const nextRemove = add.nextElementSibling;

        add.addEventListener('click', (e) => {
            e.preventDefault();
            add.style.display = 'none';
            nextRemove.style.display = 'block';

            if (typeof (Storage) !== "undefined") {
                localStorage.setItem(key, fullName);
                updateWishListCount();
                updateSpeakerDisplay(); // Update display after adding a speaker
            } else {
                alert("Sorry, your browser does not support Web Storage...");
            }
        });

        if (localStorage.getItem(key)) {
            add.style.display = 'none';
            nextRemove.style.display = 'block';
        }
    });

    wishRemove.forEach((remove, idx) => {
        const key = `wish-name-${idx + 1}`;
        remove.setAttribute('data-key', key);

        const addPrev = remove.previousElementSibling;

        remove.addEventListener('click', (e) => {
            e.preventDefault();
            remove.style.display = 'none';
            addPrev.style.display = 'block';

            if (typeof (Storage) !== "undefined") {
                localStorage.removeItem(key);
                updateWishListCount();
                updateSpeakerDisplay(); // Update display after removing a speaker
            } else {
                alert("Sorry, your browser does not support Web Storage...");
            }
        });
    });
});

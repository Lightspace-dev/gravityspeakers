 const wishAdd = document.querySelectorAll('.speaker-wish-g.add');
    const wishRemove = document.querySelectorAll('.speaker-wish-g.remove');

    // Function to update the wish list count
    function updateWishListCount() {
        // Count only keys that match a specific pattern to ensure they belong to the wish list
        const count = Object.keys(localStorage).filter(key => key.startsWith('wish-name-')).length;
        document.querySelector('.hb-count-speaker').textContent = count;
    }

    // Initialize wish list count on load
    updateWishListCount();

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
            } else {
                alert("Sorry, your browser does not support Web Storage...");
            }

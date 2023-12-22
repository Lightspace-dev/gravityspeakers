document.addEventListener('DOMContentLoaded', function () {
    const wishAdd = document.querySelectorAll('.speaker-wish-g.add');
    const wishRemove = document.querySelectorAll('.speaker-wish-g.remove');


    wishAdd.forEach((add, idx) => {
        add.setAttribute('data-key', `name-${idx + 1}`)
        const { name, lastname, key } = add.dataset;
        const fullName = `${name}-${lastname}`;
        const nextRemove = add.nextElementSibling;
        add.addEventListener('click', (e) => {
            e.preventDefault();
            add.style.display = 'none';
            nextRemove.style.display = 'block';
            if (typeof (Storage) !== "undefined") {
                localStorage.setItem(key, fullName);
                var count = localStorage.length;
                $('.hb-count-speaker').text(count);
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
        remove.setAttribute('data-key', `name-${idx + 1}`)
        const addPrev = remove.previousElementSibling;
        remove.addEventListener('click', (e) => {
            e.preventDefault();
            remove.style.display = 'none';
            addPrev.style.display = 'block';
            const { key } = remove.dataset;
            if (typeof (Storage) !== "undefined") {
                localStorage.removeItem(key);
                var count = localStorage.length;
                $('.hb-count-speaker').text(count);
            } else {
                alert("Sorry, your browser does not support Web Storage...");
            }
        });
    });
});

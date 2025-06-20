let intervalState;
const selectedFilter = {}; // Still useful for general state tracking if needed
let select = { topic: [], fee: [], location: [], program: [], search: '' };
let resultListFilter = [];
let similarSpeakers = [];
let hiddenTabs;
let inputSearch;

const setHiddenClick = () => {
    hiddenTabs = document.querySelector('.tab-link-select-programa-2');
}

const hidden = () => {
    if (hiddenTabs) {
        hiddenTabs.click();
    } else {
        console.error("Hidden tabs element not found.");
    }
}

const setSimilarSpeakers = (pass, speaker) => {
    if (pass && !similarSpeakers.includes(speaker)) {
        similarSpeakers.push(speaker);
    }
}

const showSimilarSpeakers = () => {
    similarSpeakers.slice(0, 3).forEach((similar) => {
        similar.style.display = 'block';
    });
}

function convertToRange(str) {
    if (!str || str.toLowerCase() === "please inquire" || str.trim() === '') {
        return null;
    }
    const cleanedStr = str.replace(/\$|,|\s+/g, '');
    if (cleanedStr.includes("or above")) {
        const number = parseInt(cleanedStr.replace(/[^0-9]/g, ''), 10);
        return { min: number, max: Infinity };
    } else if (cleanedStr.includes("-")) {
        const numbers = cleanedStr.split('-').map(part => parseInt(part, 10));
        return { min: numbers[0], max: numbers[1] };
    } else {
        const number = parseInt(cleanedStr, 10);
        if (!isNaN(number)) {
            return { min: number, max: number };
        }
    }
    return null;
}

function isPartiallyWithinRange(target, range) {
    if (!target || !range) return false;
    return (target.min >= range.min && target.min <= range.max) ||
           (target.max >= range.min && target.max <= range.max) ||
           (range.min >= target.min && range.max <= target.max);
}

// --- NEW FUNCTION: RENDER FILTER LABELS (moved up) ---
const renderFilterLabels = () => {
    const wrapperResults = document.querySelector('.wrapper-results');
    const filterLabelsContainer = document.querySelector('.filter-results-wrap');

    if (!filterLabelsContainer) {
        console.error("Filter labels container (.filter-results-wrap) not found.");
        return;
    }

    // Clear everything inside the main filter labels container
    filterLabelsContainer.innerHTML = '';

    let anyFiltersActiveForDisplay = false;

    // Process Topic Filter Labels
    if (select.topic.length > 0) {
        anyFiltersActiveForDisplay = true;
        const topicHtml = select.topic.map(element => {
            return `<div class='result-select'>${element}<span class='remove-select-span' data-remove='${element}' data-property='topic'>X</span></div>`;
        }).join(' ');
        filterLabelsContainer.insertAdjacentHTML('beforeend', `
            <div class="div-block-140 is-topic-label">
                <div class="topic-label">${topicHtml}</div>
            </div>
        `);
    }

    // Process Fee Filter Labels
    if (select.fee.length > 0) {
        anyFiltersActiveForDisplay = true;
        const feeHtml = select.fee.map(element => {
            return `<div class='result-select'>${element}<span class='remove-select-span' data-remove='${element}' data-property='fee'>X</span></div>`;
        }).join(' ');
        filterLabelsContainer.insertAdjacentHTML('beforeend', `
            <div class="div-block-140 is-fee-label">
                <div class="fee-label">${feeHtml}</div>
            </div>
        `);
    }

    // Process Location Filter Labels
    if (select.location.length > 0) {
        anyFiltersActiveForDisplay = true;
        const locationHtml = select.location.map(element => {
            return `<div class='result-select'>${element}<span class='remove-select-span' data-remove='${element}' data-property='location'>X</span></div>`;
        }).join(' ');
        filterLabelsContainer.insertAdjacentHTML('beforeend', `
            <div class="div-block-140 is-location-label">
                <div class="location-label">${locationHtml}</div>
            </div>
        `);
    }

    // Process Program Filter Labels
    if (select.program.length > 0) {
        anyFiltersActiveForDisplay = true;
        const programHtml = select.program.map(element => {
            return `<div class='result-select'>${element}<span class='remove-select-span' data-remove='${element}' data-property='program'>X</span></div>`;
        }).join(' ');
        filterLabelsContainer.insertAdjacentHTML('beforeend', `
            <div class="div-block-140 is-program-label">
                <div class="program-label">${programHtml}</div>
            </div>
        `);
    }

    // Handle search input display (if you have a separate label for it)
    if (select.search && select.search.trim() !== '') {
        anyFiltersActiveForDisplay = true;
        // Example if you wanted a search label uncomment and adjust:
        /*
        filterLabelsContainer.insertAdjacentHTML('beforeend', `
            <div class="div-block-140 is-search-label">
                <div class="search-label">Search: ${select.search}<span class='remove-select-span' data-remove='${select.search}' data-property='search'>X</span></div>
            </div>
        `);
        */
    }

    // Show/hide the main wrapper-results based on if any filters are active
    if (anyFiltersActiveForDisplay) {
        wrapperResults.classList.remove('hidden');
    } else {
        wrapperResults.classList.add('hidden');
    }

    // After rendering, re-attach event listeners for "X" buttons
    setCloseFiltersListeners();
    hidden(); // Keep this for closing tabs if needed
};


const renewFilter = () => {
    const { topic, fee, location, program, search } = select;
    // Debugging to see current filter states
    console.log("Current filters:", { topic, fee, location, program, search });

    const allSpeakers = document.querySelectorAll('.collection-list-search .w-dyn-item');
    resultListFilter = []; // Reset the list of filtered speakers

    allSpeakers.forEach((speaker) => {
        let pass = true;

        // Topic Filter
        if (topic.length > 0) {
            const currentTopic = speaker.querySelector('[filter-field="topic"]').innerText;
            const currentSubTopic = speaker.querySelector('[filter-field="subtopic"]').innerText;
            pass = pass && topic.some(t => currentTopic.includes(t) || currentSubTopic.includes(t));
        }

        // Location Filter
        if (location.length > 0 && pass) {
            const currentLocation = speaker.querySelector('[filter-field="location"]').innerText;
            pass = pass && location.includes(currentLocation);
        }

        // Program Filter
        if (program.length > 0 && pass) {
            const currentPrograms = speaker.querySelector('[filter-field="program"]').innerText.split(',').map(p => p.trim());
            pass = pass && program.some(p => currentPrograms.includes(p));
        }

        // Fee Filter
        if (fee.length > 0 && pass) {
            pass = fee.some(feeFilter => {
                if (feeFilter === "Any Fee") return true; // Selects all speakers for "Any Fees"

                const selectedFeeRange = convertToRange(feeFilter);
                const feeRanges = speaker.querySelector('.wrapper-fee').querySelectorAll('.label-fee');
                return Array.from(feeRanges).some(feeRangeElement => {
                    const feeText = feeRangeElement.getAttribute('filter-field').trim();
                    const feeRange = convertToRange(feeText);
                    return isPartiallyWithinRange(feeRange, selectedFeeRange);
                });
            });
        }

        // Text Search Filter - Enhanced
        if (search.trim() !== '' && pass) {
            const searchText = search.trim().toLowerCase(); // Normalize search text
            const name = speaker.querySelector('.item-data .link-11').textContent.toLowerCase(); // Normalize speaker name
            const subtitle = (speaker.querySelector('.item-data .text-block-70')?.textContent || "").toLowerCase();
            const paragraph = (speaker.querySelector('.item-data .paragraph-18')?.textContent || "").toLowerCase();

            // Check if any normalized text includes the normalized search text
            pass = name.includes(searchText) || subtitle.includes(searchText) || paragraph.includes(searchText);
        }

        speaker.style.display = pass ? 'block' : 'none';
        if (pass) resultListFilter.push(speaker);
    });

    // After applying all filters, update UI as necessary
    updateTotalSpeakers();
};

// --- MODIFIED: setSelected ---
const setSelected = (label, option) => {
    const currentOption = select[option];

    if (currentOption && currentOption.length > 0) {
        selectedFilter[option] = { 'label': label, value: [...currentOption] }; // Use spread to copy array
    } else {
        delete selectedFilter[option]; // If select[option] is empty, remove it from selectedFilter
    }

    // Call the dedicated rendering function
    renderFilterLabels();
    hidden(); // Keep this for closing tabs if needed
    saveFilterState(); // Save the updated filter state
};

const setTopicsFilter = () => {
    const topics = document.querySelectorAll('.label-topic');
    const subTopics = document.querySelectorAll('.label-subtopic');

    topics.forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            const value = element.getAttribute('filter-topic');
            const { topic } = select;
            if (!topic.includes(value)) topic.push(value);
            renewFilter();
            setSelected('topic-label', 'topic');
            saveFilterState(); // Save state whenever the search input changes
            updateTotalSpeakers();
        });
    });

    subTopics.forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            const value = element.getAttribute('filter-subtopic');
            const { topic } = select;
            if (!topic.includes(value)) topic.push(value);

            renewFilter();
            setSelected('topic-label', 'topic');
            saveFilterState(); // Save state whenever the search input changes
            updateTotalSpeakers();
        });
    });
}

const setFeeFilter = () => {
    const elements = document.querySelectorAll('.text-range-item');
    elements.forEach((item) => {
        item.addEventListener('click', (e) => {
            const number = item.getAttribute('filter-fee');
            const { fee } = select;
            if (!fee.includes(number)) fee.push(number);
            renewFilter();
            setSelected('fee-label', 'fee');
            saveFilterState(); // Save state whenever the search input changes
            updateTotalSpeakers();
        });
    });
}

const setLocationFilter = () => {
    const locations = [];
    const removeRepeat = () => {
        const labelsLocations = document.querySelectorAll('.label-locations');
        labelsLocations.forEach((location) => {
            if (locations.includes(location.innerText)) {
                location.parentElement.remove();
            } else {
                locations.push(location.innerText)
            }
        })
    }

    const setEventClick = () => {
        const labelsLocations = document.querySelectorAll('.label-locations');
        labelsLocations.forEach((lc) => {
            lc.addEventListener('click', (e) => {
                e.preventDefault();
                const value = lc.getAttribute('filter-location');
                const { location } = select;
                if (!location.includes(value)) location.push(value);
                renewFilter();
                setSelected('location-label', 'location');
                saveFilterState(); // Save state whenever the search input changes
                updateTotalSpeakers();
            });
        })
    }

    removeRepeat();
    setEventClick();
}

const setProgramFilter = () => {
    const programs = document.querySelectorAll('.label-program');

    programs.forEach((pr) => {
        pr.addEventListener('click', (e) => {
            e.preventDefault();
            const value = pr.getAttribute('filter-program');

            const { program } = select;
            if (!program.includes(value)) program.push(value);
            renewFilter();
            setSelected('program-label', 'program');
            saveFilterState(); // Save state whenever the search input changes
            updateTotalSpeakers();
        });
    })
}

// --- MODIFIED: setCloseFiltersListeners and new handleRemoveFilterClick ---

// New handler function to separate logic from listener attachment
const handleRemoveFilterClick = (e) => {
    if (e.target.classList.contains('remove-select-span')) {
        const property = e.target.getAttribute('data-property');
        const removeValue = e.target.getAttribute('data-remove');

        // Update the 'select' object (your true filter state)
        select[property] = select[property].filter(item => item !== removeValue);

        // If it was the search filter, clear the input too (assuming you add a search label)
        if (property === 'search' && inputSearch) {
            inputSearch.value = '';
        }

        saveFilterState(); // Save updated state to sessionStorage
        renewFilter();     // Reapply filters to speakers
        renderFilterLabels(); // Re-render the display of filter labels from scratch
        updateTotalSpeakers(); // Update speaker count
        updateResetButtonVisibility(); // Update reset button visibility
    }
};

// Renamed to explicitly show it sets listeners
const setCloseFiltersListeners = () => {
    // Remove previous listeners to prevent duplicates
    // This is crucial because renderFilterLabels rebuilds elements
    document.querySelectorAll('.remove-select-span').forEach(span => {
        span.removeEventListener('click', handleRemoveFilterClick);
    });

    // We now attach the listener to the parent `.wrapper-results` using event delegation
    // This ensures new 'X' buttons always work without needing to re-query for each one.
    // If a listener on wrapper-results already exists, this will re-add it, which is fine
    // as it just makes sure the new handleRemoveFilterClick is the one that's active.
    document.querySelector('.wrapper-results').removeEventListener('click', handleRemoveFilterClick); // Remove old one first
    document.querySelector('.wrapper-results').addEventListener('click', handleRemoveFilterClick);
};

const setInputSearch = () => {
    inputSearch = document.querySelector('.text-field-7.w-input');
    let timeOut;

    inputSearch.addEventListener('keyup', (e) => {
        clearTimeout(timeOut);

        timeOut = setTimeout(() => {
            select['search'] = inputSearch.value;
            saveFilterState(); // Save state whenever the search input changes
            renewFilter();
            updateTotalSpeakers();
        }, 200);
    });
};

const setEventCloseTab = () => {
    const tabs = document.querySelectorAll('.tab-link-filters');
    let s = 0;
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            if(tab.classList.contains('w--current') && s > 0){
                setTimeout(() => {
                    hiddenTabs.click();
                }, 50)
            }
            s = 1;
        });
    });
}

const updateTotalSpeakers = () => {
    const totalElement = document.querySelector('.total');
    const wrapperSpeakersNotFound = document.querySelector('.wrapper-speaker-not-found');
    // Use resultListFilter.length to get the count of visible speakers after filtering
    if (resultListFilter.length > 0) {
        totalElement.textContent = resultListFilter.length; // Display the count
        wrapperSpeakersNotFound.style.display = 'none';
    } else {
        wrapperSpeakersNotFound.style.display = 'block';
    }
}

const saveFilterState = () => {
    sessionStorage.setItem('searchPrevious', JSON.stringify(select));
    updateResetButtonVisibility();
};

// --- MODIFIED: renewSearchPrevious ---
const renewSearchPrevious = () => {
    const searchPreviousJSON = sessionStorage.getItem("searchPrevious");
    if (searchPreviousJSON) {
        const searchPrevious = JSON.parse(searchPreviousJSON);
        Object.keys(searchPrevious).forEach(key => {
            select[key] = searchPrevious[key];
        });

        renewFilter(); // Apply filters based on loaded 'select' object

        // Restore search input value
        if (select.search && inputSearch) {
            inputSearch.value = select.search;
        }

        // Render the filter labels based on the restored 'select' state
        renderFilterLabels();
        updateTotalSpeakers();
    }
    updateResetButtonVisibility();
};

const updateResetButtonVisibility = () => {
    const resetButton = document.getElementById('resetFilters');
    if (resetButton) {
        const anyFiltersActive = Object.values(select).some(arr => arr.length > 0) || select.search;
        resetButton.style.display = anyFiltersActive ? 'block' : 'none';
    }
};

// --- MODIFIED: resetFilters ---
const resetFilters = () => {
    select = { topic: [], fee: [], location: [], program: [], search: '' };
    // Clear selectedFilter as well
    for (let key in selectedFilter) {
        delete selectedFilter[key];
    }
    inputSearch.value = '';
    sessionStorage.removeItem('searchPrevious');
    renewFilter(); // This will make all speakers visible
    renderFilterLabels(); // <-- ADD THIS to clear the display labels
    updateTotalSpeakers();
    updateResetButtonVisibility();
};

// Consolidated DOMContentLoaded Listener
document.addEventListener('DOMContentLoaded', () => {
    const resetButton = document.getElementById('resetFilters');
    if (resetButton) {
        resetButton.addEventListener('click', resetFilters);
    }

    setHiddenClick();
    setTopicsFilter();
    setFeeFilter();
    setLocationFilter();
    setProgramFilter();
    setInputSearch();
    setEventCloseTab();
    renewSearchPrevious(); // Restore and apply filter states upon page load
    setCloseFiltersListeners(); // Attach listeners initially

    // The existing intervalState and window.initLightspace logic
    intervalState = setInterval(() => {
        if (document.readyState === 'complete') {
            clearInterval(intervalState);
            // These functions are already called above, so no need to call them again here
            // setHiddenClick();
            // setTopicsFilter();
            // setFeeFilter();
            // setLocationFilter();
            // setProgramFilter();
            // setInputSearch();
            // setEventCloseTab();
            // renewSearchPrevious();
            // setCloseFiltersListeners();
            // The purpose of this interval is mainly for window.initLightspace now
        }
    }, 100);

    // Initial call to window.initLightspace
    window.initLightspace && window.initLightspace();
});


function setButtonVisibility() {
    const wishlist = JSON.parse(localStorage.getItem('wishlistSpeakers')) || [];
    document.querySelectorAll('[data-speaker-id]').forEach(button => {
        const speakerId = button.getAttribute('data-speaker-id');
        const addBtn = document.querySelector(`.div-sp-sl-wrapper-add[data-speaker-id="${speakerId}"]`);
        const removeBtn = document.querySelector(`.div-sp-sl-wrapper-remove[data-speaker-id="${speakerId}"]`);
        if (wishlist.includes(speakerId)) {
            if (addBtn) addBtn.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'block';
        } else {
            if (addBtn) addBtn.style.display = 'block';
            if (removeBtn) removeBtn.style.display = 'none';
        }
    });
}

function addToWishlist(speakerId) {
    let wishlist = JSON.parse(localStorage.getItem('wishlistSpeakers'));
    if (!wishlist.includes(speakerId)) {
        wishlist.push(speakerId);
        localStorage.setItem('wishlistSpeakers', JSON.stringify(wishlist));
        updateWishlistCount?.();
        setButtonVisibility();
    }
}

function removeFromWishlist(speakerId) {
    let wishlist = JSON.parse(localStorage.getItem('wishlistSpeakers'));
    wishlist = wishlist.filter(id => id !== speakerId);
    localStorage.setItem('wishlistSpeakers', JSON.stringify(wishlist));
    updateWishlistCount?.();
    setButtonVisibility();
}

window.initLightspace = function () {
    if (!localStorage.getItem('wishlistSpeakers')) {
        localStorage.setItem('wishlistSpeakers', JSON.stringify([]));
    }

    try {
        const searchFilter = new FsLibrary('.select-topic-wrapper');
        searchFilter.nest({
            textList: '.text-select-topic',
            nestSource: '.select-topic-list',
            nestTarget: '.select-topic-content'
        });
    } catch (e) {
        console.warn('FsLibrary nest failed:', e);
    }

    setButtonVisibility();

    document.querySelectorAll('.div-sp-sl-wrapper-add').forEach(button => {
        button.addEventListener('click', function (event) {
            event.preventDefault();
            const speakerId = this.getAttribute('data-speaker-id');
            addToWishlist(speakerId);
        });
    });

    document.querySelectorAll('.div-sp-sl-wrapper-remove').forEach(button => {
        button.addEventListener('click', function (event) {
            event.preventDefault();
            const speakerId = this.getAttribute('data-speaker-id');
            removeFromWishlist(speakerId);
        });
    });

    document.querySelectorAll('.read-more-btn').forEach(button => {
        button.addEventListener('click', function () {
            const paragraph = this.previousElementSibling;
            paragraph.classList.toggle('expanded');
            this.innerText = paragraph.classList.contains('expanded') ? 'Read Less...' : 'Read More...';
        });
    });

    if (window.initCustomSearch) {
        window.initCustomSearch();
    }
};

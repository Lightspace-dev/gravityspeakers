// Global variables
let intervalState;
const selectedFilter = {};
let select = { topic: [], fee: [], location: [], program: [], search: '' };
let resultListFilter = [];
let similarSpeakers = [];
let hiddenTabs; // Will be assigned in setHiddenClick()
let inputSearch; // Will be assigned in setInputSearch()

// Function to find and store the hidden tabs element
const setHiddenClick = () => {
    hiddenTabs = document.querySelector('.tab-link-select-programa-2');
    if (!hiddenTabs) {
        console.warn("Hidden tabs element (.tab-link-select-programa-2) not found.");
    }
}

// Function to simulate a click on the hidden tab (to close filter dropdowns/tabs)
const hidden = () => {
    if (hiddenTabs) {
        hiddenTabs.click();
    } else {
        console.error("Hidden tabs element not found in 'hidden()' function. Call setHiddenClick() first.");
    }
}

// Functions for similar speakers (not directly related to current issue, but kept for completeness)
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

// Fee Range Utility Functions
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

// --- RENDER FILTER LABELS ---
const renderFilterLabels = () => {
    const wrapperResults = document.querySelector('.wrapper-results');

    const topicResultsDiv = document.querySelector('.text-block-75.topic-label');
    const feeResultsDiv = document.querySelector('.text-block-75.fee-label');
    const locationResultsDiv = document.querySelector('.text-block-75.location-label');
    const programResultsDiv = document.querySelector('.text-block-75.program-label');

    const topicWrapper = topicResultsDiv?.closest('.w-layout-hflex.flex-block');
    const feeWrapper = feeResultsDiv?.closest('.w-layout-hflex.flex-block');
    const locationWrapper = locationResultsDiv?.closest('.w-layout-hflex.flex-block');
    const programWrapper = programResultsDiv?.closest('.w-layout-hflex.flex-block');

    let anyFiltersActiveForDisplay = false;

    const updateFilterDisplay = (valuesArray, targetDiv, wrapperDiv, propertyName) => {
        if (targetDiv && wrapperDiv) {
            if (valuesArray.length > 0) {
                anyFiltersActiveForDisplay = true;
                const htmlContent = valuesArray.map(element => {
                    return `<div class='result-select'>${element}<span class='remove-select-span' data-remove='${element}' data-property='${propertyName}'>X</span></div>`;
                }).join(' ');
                targetDiv.innerHTML = htmlContent;
                wrapperDiv.classList.remove('hidden');
            } else {
                targetDiv.innerHTML = '';
                wrapperDiv.classList.add('hidden');
            }
        } else {
            console.warn(`Missing elements for property: ${propertyName}. TargetDiv: ${targetDiv}, WrapperDiv: ${wrapperDiv}`);
        }
    };

    updateFilterDisplay(select.topic, topicResultsDiv, topicWrapper, 'topic');
    updateFilterDisplay(select.fee, feeResultsDiv, feeWrapper, 'fee');
    updateFilterDisplay(select.location, locationResultsDiv, locationWrapper, 'location');
    updateFilterDisplay(select.program, programResultsDiv, programWrapper, 'program');

    if (select.search && select.search.trim() !== '') {
        anyFiltersActiveForDisplay = true;
    }

    if (wrapperResults) {
        if (anyFiltersActiveForDisplay) {
            wrapperResults.classList.remove('hidden');
        } else {
            wrapperResults.classList.add('hidden');
        }
    } else {
        console.error("Main wrapper-results element (.wrapper-results) not found.");
    }

    setCloseFiltersListeners();
    hidden(); // Call hidden to ensure filter tabs are closed if necessary
};

// --- RENEW FILTER ---
const renewFilter = () => {
    const { topic, fee, location, program, search } = select;
    console.log("Current filters for renewal:", { topic, fee, location, program, search }); // Debugging

    const allSpeakers = document.querySelectorAll('.collection-list-search .w-dyn-item');
    resultListFilter = []; // Reset the list of filtered speakers

    allSpeakers.forEach((speaker) => {
        let pass = true;

        // Topic Filter (includes main topics and subtopics)
        if (topic.length > 0) {
            const currentTopicElement = speaker.querySelector('[filter-field="topic"]');
            const currentSubTopicElement = speaker.querySelector('[filter-field="subtopic"]');

            const currentTopic = currentTopicElement ? currentTopicElement.innerText : '';
            const currentSubTopic = currentSubTopicElement ? currentSubTopicElement.innerText : '';

            pass = pass && topic.some(t => {
                // Check if the selected topic/subtopic is included in EITHER the main topic or subtopic field of the speaker
                return currentTopic.includes(t) || currentSubTopic.includes(t);
            });
        }

        // Location Filter
        if (location.length > 0 && pass) {
            const currentLocationElement = speaker.querySelector('[filter-field="location"]');
            const currentLocation = currentLocationElement ? currentLocationElement.innerText : '';
            pass = pass && location.includes(currentLocation);
        }

        // Program Filter
        if (program.length > 0 && pass) {
            const currentProgramElement = speaker.querySelector('[filter-field="program"]');
            const currentProgramsText = currentProgramElement ? currentProgramElement.innerText : '';
            const currentPrograms = currentProgramsText.split(',').map(p => p.trim()).filter(p => p !== ''); // Ensure no empty strings from split
            pass = pass && program.some(p => currentPrograms.includes(p));
        }

        // Fee Filter
        if (fee.length > 0 && pass) {
            pass = fee.some(feeFilter => {
                if (feeFilter === "Any Fee") return true;

                const selectedFeeRange = convertToRange(feeFilter);
                if (!selectedFeeRange) return false; // If conversion failed for selected filter

                const feeRangesElements = speaker.querySelectorAll('.wrapper-fee .label-fee');
                return Array.from(feeRangesElements).some(feeRangeElement => {
                    const feeText = feeRangeElement.getAttribute('filter-field')?.trim();
                    const feeRange = convertToRange(feeText);
                    return isPartiallyWithinRange(feeRange, selectedFeeRange);
                });
            });
        }

        // Text Search Filter
        if (search.trim() !== '' && pass) {
            const searchText = search.trim().toLowerCase();
            const name = (speaker.querySelector('.item-data .link-11')?.textContent || "").toLowerCase();
            const subtitle = (speaker.querySelector('.item-data .text-block-70')?.textContent || "").toLowerCase();
            const paragraph = (speaker.querySelector('.item-data .paragraph-18')?.textContent || "").toLowerCase();

            pass = name.includes(searchText) || subtitle.includes(searchText) || paragraph.includes(searchText);
        }

        speaker.style.display = pass ? 'block' : 'none';
        if (pass) resultListFilter.push(speaker);
    });

    updateTotalSpeakers();
};

// --- SET SELECTED (for displaying active filters) ---
const setSelected = (label, option) => {
    const currentOption = select[option];

    if (currentOption && currentOption.length > 0) {
        selectedFilter[option] = { 'label': label, value: [...currentOption] };
    } else {
        delete selectedFilter[option];
    }

    renderFilterLabels();
    // hidden(); // Called within renderFilterLabels
    saveFilterState();
    updateTotalSpeakers();
};

// --- SET TOPICS FILTER (Main topic and Subtopic click listeners) ---
const setTopicsFilter = () => {
    const topics = document.querySelectorAll('.label-topic'); // Main topics (Text Block 64)
    const subTopics = document.querySelectorAll('.label-subtopic'); // Subtopics (Text Block 66)

    // Listeners for Main Topics
    topics.forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            const value = element.getAttribute('filter-topic');

            // Find the parent 'filter-item' which contains both main topic and its subtopics container
            const filterItemParent = element.closest('.filter-item');
            const subtopicContainerWrapper = filterItemParent?.querySelector('.text-block-67'); // The div wrapping select-topic-content
            const subtopicContent = filterItemParent?.querySelector('.select-topic-content.div-block-56'); // The actual dropdown for subtopics

            element.classList.toggle('active'); // Toggle active class on the main topic

            if (element.classList.contains('active')) {
                if (!select.topic.includes(value)) select.topic.push(value);
                if (subtopicContainerWrapper) subtopicContainerWrapper.classList.remove('hidden');
                if (subtopicContent) subtopicContent.classList.remove('hidden');
            } else {
                select.topic = select.topic.filter(item => item !== value);
                if (subtopicContainerWrapper) subtopicContainerWrapper.classList.add('hidden');
                if (subtopicContent) subtopicContent.classList.add('hidden');

                // Optional: If a main topic is deselected, also deselect all its subtopics
                // This requires iterating over subtopics under this specific main topic
                // and removing them from select.topic and their 'active' class.
                // For simplicity, this part is left out as per previous discussions unless needed.
                // Example (untested):
                // filterItemParent.querySelectorAll('.label-subtopic.active').forEach(sub => {
                //     const subValue = sub.getAttribute('filter-subtopic');
                //     select.topic = select.topic.filter(item => item !== subValue);
                //     sub.classList.remove('active');
                // });
            }

            renewFilter();
            setSelected('topic-label', 'topic');
            saveFilterState();
            updateTotalSpeakers();
        });
    });

    // Listeners for individual Subtopics
    subTopics.forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("Subtopic div was clicked!", element); // Debugging: Confirm click registration
            const value = element.getAttribute('filter-subtopic');
            console.log("Subtopic filter value:", value); // Debugging: Confirm value extraction

            const { topic } = select;

            element.classList.toggle('active');

            if (element.classList.contains('active')) {
                if (!topic.includes(value)) topic.push(value);
            } else {
                select.topic = topic.filter(item => item !== value);
            }

            renewFilter();
            setSelected('topic-label', 'topic');
            saveFilterState();
            updateTotalSpeakers();
        });
    });
};

// --- Other Filter Setters ---
const setFeeFilter = () => {
    const elements = document.querySelectorAll('.text-range-item');
    elements.forEach((item) => {
        item.addEventListener('click', (e) => {
            const number = item.getAttribute('filter-fee');
            const { fee } = select;
            if (!fee.includes(number)) fee.push(number);
            renewFilter();
            setSelected('fee-label', 'fee');
            saveFilterState();
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
                saveFilterState();
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
            saveFilterState();
            updateTotalSpeakers();
        });
    })
}

// --- Filter Removal (X button) ---
const handleRemoveFilterClick = (e) => {
    if (e.target.classList.contains('remove-select-span')) {
        const property = e.target.getAttribute('data-property');
        const removeValue = e.target.getAttribute('data-remove');

        select[property] = select[property].filter(item => item !== removeValue);

        if (property === 'search' && inputSearch) {
            inputSearch.value = '';
        }

        saveFilterState();
        renewFilter();
        renderFilterLabels();
        updateTotalSpeakers();
        updateResetButtonVisibility();
    }
};

const setCloseFiltersListeners = () => {
    // Event delegation: Attach listener to the parent .wrapper-results
    const wrapperResults = document.querySelector('.wrapper-results');
    if (wrapperResults) {
        // Remove existing listener to prevent duplicates if this function is called multiple times
        wrapperResults.removeEventListener('click', handleRemoveFilterClick);
        wrapperResults.addEventListener('click', handleRemoveFilterClick);
    } else {
        console.warn(".wrapper-results element not found for setting close filters listeners.");
    }
};

// --- Search Input ---
const setInputSearch = () => {
    inputSearch = document.querySelector('.text-field-7.w-input');
    if (!inputSearch) {
        console.warn("Search input element (.text-field-7.w-input) not found.");
        return;
    }
    let timeOut;

    inputSearch.addEventListener('keyup', (e) => {
        clearTimeout(timeOut);
        timeOut = setTimeout(() => {
            select['search'] = inputSearch.value;
            saveFilterState();
            renewFilter();
            updateTotalSpeakers();
            renderFilterLabels(); // Re-render labels including search if applicable
        }, 200);
    });
};

// --- Webflow Tab Control ---
const setEventCloseTab = () => {
    const tabs = document.querySelectorAll('.tab-link-filters');
    let s = 0; // This 's' variable might need clearer purpose or reset depending on intent
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            if(tab.classList.contains('w--current') && s > 0){
                setTimeout(() => {
                    hidden(); // Use the named function for clarity
                }, 50)
            }
            s = 1;
        });
    });
}

// --- Speaker Count and No Results Message ---
const updateTotalSpeakers = () => {
    const totalElement = document.querySelector('.total');
    const wrapperSpeakersNotFound = document.querySelector('.wrapper-speaker-not-found');

    if (totalElement && wrapperSpeakersNotFound) {
        if (resultListFilter.length > 0) {
            totalElement.textContent = resultListFilter.length;
            wrapperSpeakersNotFound.style.display = 'none';
        } else {
            totalElement.textContent = '0'; // Display 0 if no speakers found
            wrapperSpeakersNotFound.style.display = 'block';
        }
    } else {
        console.warn("Elements for total speakers or not found message are missing.");
    }
}

// --- Session Storage Management ---
const saveFilterState = () => {
    sessionStorage.setItem('searchPrevious', JSON.stringify(select));
    updateResetButtonVisibility();
};

const renewSearchPrevious = () => {
    const searchPreviousJSON = sessionStorage.getItem("searchPrevious");
    if (searchPreviousJSON) {
        const searchPrevious = JSON.parse(searchPreviousJSON);
        Object.keys(searchPrevious).forEach(key => {
            select[key] = searchPrevious[key];
        });

        // Restore search input value BEFORE calling renewFilter or renderFilterLabels
        // because setInputSearch needs inputSearch to be defined for its initial value.
        // We ensure inputSearch is defined before this function is called in initCustomSearch
        if (select.search && inputSearch) {
            inputSearch.value = select.search;
        }

        renewFilter();
        renderFilterLabels();
        updateTotalSpeakers();
    }
    updateResetButtonVisibility();
};

// --- Reset Button Visibility ---
const updateResetButtonVisibility = () => {
    const resetButton = document.getElementById('resetFilters');
    if (resetButton) {
        // Check if any filter array has elements or if search string is not empty
        const anyFiltersActive = Object.values(select).some(arr => Array.isArray(arr) && arr.length > 0) || (select.search && select.search.trim() !== '');
        resetButton.style.display = anyFiltersActive ? 'block' : 'none';
    }
};

// --- Reset All Filters ---
const resetFilters = () => {
    select = { topic: [], fee: [], location: [], program: [], search: '' };
    for (let key in selectedFilter) {
        delete selectedFilter[key];
    }
    if (inputSearch) inputSearch.value = '';
    sessionStorage.removeItem('searchPrevious');
    renewFilter();
    renderFilterLabels();
    updateTotalSpeakers();
    updateResetButtonVisibility();
};

// --- Wishlist Functions (related to window.initLightspace) ---
function setButtonVisibility() {
    const wishlist = JSON.parse(localStorage.getItem('wishlistSpeakers')) || [];
    document.querySelectorAll('[data-speaker-id]').forEach(button => {
        const speakerId = button.getAttribute('data-speaker-id');
        const addBtn = document.querySelector(`.div-sp-sl-wrapper-add[data-speaker-id="${speakerId}"]`);
        const removeBtn = document.querySelector(`.div-sp-sl-wrapper-remove[data-speaker-id="${speakerId}"]`);
        if (addBtn && removeBtn) {
            if (wishlist.includes(speakerId)) {
                addBtn.style.display = 'none';
                removeBtn.style.display = 'block';
            } else {
                addBtn.style.display = 'block';
                removeBtn.style.display = 'none';
            }
        }
    });
}

function addToWishlist(speakerId) {
    let wishlist = JSON.parse(localStorage.getItem('wishlistSpeakers')) || [];
    if (!wishlist.includes(speakerId)) {
        wishlist.push(speakerId);
        localStorage.setItem('wishlistSpeakers', JSON.stringify(wishlist));
        if (typeof updateWishlistCount === 'function') updateWishlistCount(); // Check if function exists
        setButtonVisibility();
    }
}

function removeFromWishlist(speakerId) {
    let wishlist = JSON.parse(localStorage.getItem('wishlistSpeakers')) || [];
    wishlist = wishlist.filter(id => id !== speakerId);
    localStorage.setItem('wishlistSpeakers', JSON.stringify(wishlist));
    if (typeof updateWishlistCount === 'function') updateWishlistCount(); // Check if function exists
    setButtonVisibility();
}

// --- GLOBAL INITIALIZATION POINT (window.initLightspace) ---
// This function is expected to be called when FsLibrary and other async scripts are ready.
// It will then trigger the core filter logic.
window.initLightspace = function () {
    console.log("window.initLightspace called.");

    // 1. Initialize Wishlist/Speaker Buttons related setup
    if (!localStorage.getItem('wishlistSpeakers')) {
        localStorage.setItem('wishlistSpeakers', JSON.stringify([]));
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

    // 2. Initialize FsLibrary (if present)
    try {
        if (typeof FsLibrary !== 'undefined') {
            const searchFilter = new FsLibrary('.select-topic-wrapper');
            searchFilter.nest({
                textList: '.text-select-topic',
                nestSource: '.select-topic-list',
                nestTarget: '.select-topic-content'
            });
            console.log("FsLibrary initialized successfully.");
        } else {
            console.warn("FsLibrary not found. Skipping FsLibrary initialization.");
        }
    } catch (e) {
        console.warn('FsLibrary nest failed:', e);
    }

    // 3. Trigger the core filter setup AFTER initLightspace (and FsLibrary) has run.
    initializeFilterCoreLogic();
    console.log("initLightspace completed and triggered core filter logic.");

    // If there's another global initialization function for other search parts
    if (window.initCustomSearch) {
        window.initCustomSearch();
    }
};


// --- CORE FILTER LOGIC INITIALIZATION ---
// This function contains all your primary filter setup logic and should only run once.
function initializeFilterCoreLogic() {
    // IMPORTANT: Call setInputSearch() first if renewSearchPrevious() relies on inputSearch being defined.
    setInputSearch(); // Ensures 'inputSearch' global variable is populated early.

    // Now call all other setup functions
    // (setResetButton listener is inside this, not top-level DOMContentLoaded)
    const resetButton = document.getElementById('resetFilters');
    if (resetButton) {
        resetButton.addEventListener('click', resetFilters);
    }

    setHiddenClick(); // Initializes 'hiddenTabs'
    setTopicsFilter();
    setFeeFilter();
    setLocationFilter();
    setProgramFilter();
    setEventCloseTab();

    // Restore previous filter state and apply filters/render labels
    renewSearchPrevious(); // This will call renewFilter() and renderFilterLabels()

    setCloseFiltersListeners(); // Re-attach 'X' button listeners after initial rendering

    console.log("Core filter logic initialized!");
}


// --- MAIN SCRIPT ENTRY POINT ---
// This listener waits for the basic HTML document to be parsed.
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired. Starting initial checks...");

    let initLightspaceIntervalId;
    let attempts = 0;
    const maxAttempts = 100; // Check for up to 10 seconds (100 * 100ms)

    initLightspaceIntervalId = setInterval(() => {
        // Check if window.initLightspace function is defined AND if the document is fully loaded
        if (typeof window.initLightspace === 'function' && document.readyState === 'complete') {
            clearInterval(initLightspaceIntervalId);
            window.initLightspace(); // This will now trigger initializeFilterCoreLogic
            console.log("initLightspace executed via interval from DOMContentLoaded (Success).");
        } else {
            attempts++;
            if (attempts >= maxAttempts) {
                clearInterval(initLightspaceIntervalId);
                console.error("initLightspace function or complete document state not found after multiple attempts. Falling back to direct core filter initialization.");
                // Fallback: If initLightspace never becomes available, try to initialize core filters directly.
                // This is a last resort to ensure *some* filtering works.
                initializeFilterCoreLogic();
            }
        }
    }, 100); // Check every 100 milliseconds
});

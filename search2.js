let intervalState;
const selectedFilter = {};
let select = { topic: [], fee: [], location: [], program: [], search: '' };
let resultListFilter = [];
let similarSpeakers = [];
let hiddenTabs;
let inputSearch;

const setHiddenClick = () => {
    hiddenTabs = document.querySelector('.tab-link-select-programa-2');
}

const hidden = () => {
    hiddenTabs.click();
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
            const currentProgram = speaker.querySelector('[filter-field="program"]').innerText;
            pass = pass && program.includes(currentProgram);
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

        // Text Search Filter
        if (search.trim() !== '' && pass) {
            const name = speaker.querySelector('.item-data .link-11').textContent;
            const subtitle = speaker.querySelector('.item-data .text-block-70')?.textContent || "";
            const paragraph = speaker.querySelector('.item-data .paragraph-18')?.textContent || "";
            pass = pass && (name.includes(search) || subtitle.includes(search) || paragraph.includes(search));
        }

        speaker.style.display = pass ? 'block' : 'none';
        if (pass) resultListFilter.push(speaker);
    });

    // After applying all filters, update UI as necessary
    updateTotalSpeakers();
};


const showOrHiddenLabels = (current, listValue, remove, option) => {
    if (listValue.length > 0){
        current.innerHTML = listValue.map((element) => {
            return `<div class='result-select'>${element}<span class='remove-select-span' data-remove='${element}' data-property='${option}'>X</span></div>`
        }).join(' ');
        setCloseFilters();
    } 
    if (remove) {
        current.parentElement.classList.remove('hidden');
    } else { 
        current.parentElement.classList.add('hidden');
    }
}

const setSelected = (label, option) => {

    const currentOption = select[option];
    selectedFilter[option] = { 'label': label, value: currentOption };
    if (selectedFilter) {
        const wrapperResults = document.querySelector('.wrapper-results');
        wrapperResults.classList.remove('hidden');

        Object.entries(selectedFilter).forEach(([one, two]) => {
            const { label, value } = two;
            const currentLabel = document.querySelector(`.${label}`);
            currentLabel.innerHTML = '';
            showOrHiddenLabels(currentLabel, value, true, one);
        })
        hidden();
    }
}

const setTopicsFilter = () => {
    const topics = document.querySelectorAll('.label-topic');
    const subTopics = document.querySelectorAll('.label-subtopic');

    topics.forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            const value = element.getAttribute('filter-topic');
            const { topic } = select;
            if(!topic.includes(value)) topic.push(value);
            renewFilter();
            setSelected('topic-label', 'topic');
            updateTotalSpeakers();
        });
    });

    subTopics.forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            const value = element.getAttribute('filter-subtopic');
            const { topic } = select;
            if(!topic.includes(value)) topic.push(value);

            renewFilter();
            setSelected('topic-label', 'topic');
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
            if(!fee.includes(number)) fee.push(number);
            renewFilter();
            setSelected('fee-label', 'fee');
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
                if(!location.includes(value)) location.push(value);
                renewFilter();
                setSelected('location-label', 'location');
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
            if(!program.includes(value)) program.push(value);
            renewFilter();
            setSelected('program-label', 'program');
            updateTotalSpeakers();
        });
    })
}

const setCloseFilters = () => {
    const allBtns = document.querySelectorAll('.remove-select-span');

    allBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const { property, remove } = btn.dataset;
            const objectRemove = select[property].filter(( element ) => element != remove );
            select[property] = objectRemove
            selectedFilter[property].value = objectRemove;
            renewFilter();
            updateTotalSpeakers();
            if(objectRemove.length === 0) {
                btn.closest('.w-layout-hflex').classList.add('hidden');
                delete selectedFilter[property]
            }
            btn.parentElement.remove();
        });
    })
}

const setInputSearch = () => {
    inputSearch = document.querySelector('.text-field-7.w-input');
    let timeOut;

    inputSearch?.addEventListener('keyup', (e) => {
        clearTimeout(timeOut);

        timeOut = setTimeout(()=> {
            select['search'] = inputSearch.value;
            renewFilter();
            updateTotalSpeakers();
        }, 200)
    });
}

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
const renewSearchPrevious = () => {
    const searchPreviousJSON = sessionStorage.getItem("searchPrevious");
    if (searchPreviousJSON) {
        const searchPrevious = JSON.parse(searchPreviousJSON);
        // Assume `select` is your filter state object structure
        if (searchPrevious) {
            // Restore each filter state from `searchPrevious` to `select`
            Object.keys(searchPrevious).forEach(key => {
                select[key] = searchPrevious[key];
            });

            // Re-apply filters based on restored states
            renewFilter();

            // Optional: Update UI elements to reflect the restored filter states
            // This could involve setting checkboxes, input fields, etc., to match `select`
        }
    }
};

intervalState = setInterval(() => {
    if (document.readyState === 'complete') {
        clearInterval(intervalState);
        setHiddenClick();
        setTopicsFilter();
        setFeeFilter();
        setLocationFilter();
        setProgramFilter();
        setInputSearch();
        setEventCloseTab();
        renewSearchPrevious(); // Ensure this is called after all setup functions
    }
}, 100);

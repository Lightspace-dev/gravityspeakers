let intervalState;
const selectedFilter = {};
let select = { topic: [], fee: [], location: [], program: [], search: ''};
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
    if(pass && !similarSpeakers.includes(speaker)){
        similarSpeakers.push(speaker);
    }
}

const showSimilarSpeakers = () => {
    similarSpeakers.slice(0, 3).forEach((similar) => {
        similar.style.display = 'block';
    });
}

function convertToRange(str) {
    if (str.toLowerCase() === "please inquire" || str.trim() === '') {
        return null; // Excludes "Please inquire" or empty strings from numeric comparison
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
    sessionStorage.setItem('searchPrevious', JSON.stringify(select));
    const allSpeakers = document.querySelectorAll('.collection-list-search .w-dyn-item');
    resultListFilter = [];
    similarSpeakers = [];

    allSpeakers.forEach((speaker) => {
        let pass = true;
        const currentTopic = speaker.querySelector('[filter-field="topic"]');
        const currentSubTopic = speaker.querySelector('[filter-field="subtopic"]');
        const currentLocation = speaker.querySelector('[filter-field="location"]');
        const currentFee = speaker.querySelector('.wrapper-fee');
        const currentProgram = speaker.querySelector('[filter-field="program"]');
        const currentName = speaker.querySelector('.item-data .link-11').textContent;
        const currentSubtitle = speaker.querySelector('.item-data .text-block-70');
        const currentParagraph = speaker.querySelector('.item-data .paragraph-18');

        if (topic.length > 0) { 
            pass = topic.some(element => currentTopic.innerText.includes(element) || currentSubTopic.innerText.includes(element)); 
        }

        if (fee.length > 0 && pass) {
            pass = fee.some(feeFilter => {
                if (feeFilter === "Any Fee") return true; // Handles "Any Fee" selection
                const selectedFeeRange = convertToRange(feeFilter);
                const feeRanges = currentFee.querySelectorAll('.label-fee');
                return Array.from(feeRanges).some(feeRangeElement => {
                    const feeText = feeRangeElement.getAttribute('filter-field').trim();
                    const feeRange = convertToRange(feeText);
                    return isPartiallyWithinRange(feeRange, selectedFeeRange);
                });
            });
        }

        if (location.length > 0 && pass) { 
            pass = location.some(element => currentLocation.innerText.includes(element));
        }

        if (program.length > 0 && pass) { 
            pass = program.some(element => currentProgram.innerText.includes(element));
        }

        if (search && pass) {
            const expression = new RegExp(search, "i");
            pass = expression.test(currentName) || expression.test(currentSubtitle.innerText) || expression.test(currentParagraph.innerText);
        }

        speaker.style.display = pass ? 'block' : 'none';
        if (pass) resultListFilter.push(speaker);
    });

    // Shows or hides the "no results" message and updates total speakers count
    updateTotalSpeakers();
}

// Rest of the filter setup functions (setTopicsFilter, setFeeFilter, setLocationFilter, setProgramFilter, setCloseFilters, setInputSearch, setEventCloseTab)

const updateTotalSpeakers = () => {
    const visibleSpeakers = resultListFilter;
    const totalElement = document.querySelector('.total');
    const wrapperSpeakersNotFound = document.querySelector('.wrapper-speaker-not-found');
    if (visibleSpeakers.length > 0) {
        totalElement.textContent = visibleSpeakers.length + ' speakers found';
        wrapperSpeakersNotFound.style.display = 'none';
    } else {
        totalElement.textContent = 'No speakers found';
        wrapperSpeakersNotFound.style.display = 'block';
    }
}

const renewSearchPrevious = () => {
    // Code to reload previous search/filter selections from session storage
}

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
        renewSearchPrevious();
    }
}, 100);

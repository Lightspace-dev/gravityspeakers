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
    })
}

function convertToRange(str) {
    if (str.toLowerCase() === "please inquire") {
        return { inquire: true };
    }
    const cleanedStr = str.replace(/\*/g, '');
    if (cleanedStr.includes("or above")) {
        const number = parseInt(cleanedStr.replace(/[^0-9]/g, ''));
        return { min: number, max: Infinity };
    } else if (cleanedStr.includes("or under")) {
        const number = parseInt(cleanedStr.replace(/[^0-9]/g, ''));
        return { min: -Infinity, max: number };
    } else if (cleanedStr.includes("Any Fee")) {
        return { showAny: true };
    } else {
        const numbers = cleanedStr.split('-').map(Number);
        return { min: numbers[0], max: numbers[1] };
    }
}

function isPartiallyWithinRange(target, range) {
    if(target.inquire) {
        return false; // Adjust based on your handling of "Please inquire"
    }
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
        const speakerName = speaker.querySelector('.link-11').textContent; // Assuming this selector gets the speaker name
        const currentTopic = speaker.querySelector('[filter-field="topic"]');
        const currentSubTopic = speaker.querySelector('[filter-field="subtopic"]');
        const currentLocation = speaker.querySelector('[filter-field="location"]');
        const currentFee = speaker.querySelector('.wrapper-fee');
        const currentProgram = speaker.querySelector('[filter-field="program"]');

        if (topic.length > 0) { 
            pass = topic.some(element => currentTopic.innerText.includes(element) || currentSubTopic.innerText.includes(element));
            setSimilarSpeakers(pass, speaker);
        }

        if (fee.length > 0 && pass) {
            pass = fee.some(itemFee => {
                const feeRanges = currentFee.querySelectorAll('.label-fee');
                const speakerFees = Array.from(feeRanges).map(feeRange => feeRange.getAttribute('filter-field'));

                // Improved logging: Log speaker name with their fees for each filter check
                const feeRange = speakerFees.map(fee => convertToRange(fee));
                const selectedFeeRange = convertToRange(itemFee);
                const feePass = feeRange.some(fee => isPartiallyWithinRange(fee, selectedFeeRange));
                if(feePass) {
                    console.log(`Speaker: ${speakerName}, Fees:`, speakerFees, `Passes Filter: ${itemFee}`);
                }
                return feePass;
            });
            setSimilarSpeakers(pass, speaker);
        }

        // Continue with location, program, and search filters...

        if (pass) {
            speaker.style.display = 'block';
            resultListFilter.push(speaker);
        } else {
            speaker.style.display = 'none';
        }
    });

    // Code for updating UI based on filters...
}

// Include the rest of your functions here (setTopicsFilter, setFeeFilter, setLocationFilter, setProgramFilter, setCloseFilters, setInputSearch, setEventCloseTab, updateTotalSpeakers, renewSearchPrevious)

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

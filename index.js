let intervalState;
const selectedFilter = {};
let select = { topic: [], fee: [], location: [], program: [], search: ''};
let resultListFilter = [];
let similarSpeakers = [];
let hiddenTabs;
let inputSearch;

const setHiddenClick = () => {
    hiddenTabs = document.querySelector('.tab-link-select-programa-2')
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
    if (str.includes("or above")) {
        const number = parseInt(str.replace(/[^0-9]/g, ''));
        return { min: number, max: Infinity };
    } else if (str.includes("or under")) {
        const number = parseInt(str.replace(/[^0-9]/g, ''));
        return { min: -Infinity, max: number };
    } else if (str.includes("Any Fee")) {
        return { showAny: true };
    } else {
        const numbers = str.replace(/[^0-9\-]/g, '').split('-').map(Number);
        return {
            min: Math.min(...numbers),
            max: Math.max(...numbers)
        };
    }
}

function isPartiallyWithinRange(target, range) {
    return (target.min >= range.min && target.min <= range.max) || (target.max >= range.min && target.max <= range.max) || (range.min >= target.min && range.max <= target.max);
}

function isWithinAnyOfTheRanges(number, specificRanges) {
    return specificRanges.some(range => {
        const rangeLimits = convertToRange(range);
        return isPartiallyWithinRange(number, rangeLimits);
    });
}

const renewFilter = () => {
    const { topic, fee, location, program, search } = select;
    sessionStorage.setItem('searchPrevious',  JSON.stringify(select));
    const allSpeakers = document.querySelectorAll('.collection-list-search .w-dyn-item');
    resultListFilter = [];
    similarSpeakers = [];

    allSpeakers.forEach((speaker) => {
        let pass = true;
        const currentTopic = speaker.querySelector('[filter-field="topic"]');
        const currentSubTopic = speaker.querySelector('[filter-field="subtopic"]');
        const currentLocation = speaker.querySelector('[filter-field="location"]');
        const currentFee = speaker.querySelector('.wrapper-fee');
        const currentProgram = speaker.querySelector('[filter-field="program"]')
        const currentName = speaker.querySelector('.item-data .link-11')

        if (topic.length > 0) { 
            pass = topic.some((element) => { return currentTopic.innerText.includes(element) || currentSubTopic.innerText.includes(element) }); 
            setSimilarSpeakers(pass, speaker);
        }

        if (fee.length > 0 && pass) {
            pass = fee.some((itemFee) => { 
                const numberRange = convertToRange(itemFee);
                const rangeValues = currentFee.querySelectorAll('[filter-field]:not(.w-dyn-bind-empty)');
                if (!numberRange.hasOwnProperty('showAny')) {
                    const specificRanges = [...rangeValues].map((element) => element.innerText.trim());
                    return isWithinAnyOfTheRanges(numberRange, specificRanges);
                } else {
                    return true;
                }
            })
            setSimilarSpeakers(pass, speaker);
        }

        if (location.length > 0 && pass) { 
            pass = location.some((element) => { return currentLocation.innerText.includes(element) });
            setSimilarSpeakers(pass, speaker);
        }

        if (program.length > 0 && pass) { 
            pass = program.some((element) => { return currentProgram.innerText.includes(element)});
            setSimilarSpeakers(pass, speaker);
        }

        if(search && pass ) { 
            const expresion = new RegExp(`${search}.*`, "i");
            const name = currentName?.innerText;
            pass = expresion.test(name);
            setSimilarSpeakers(pass, speaker);
        }

        if (pass) {
            speaker.style.display = 'block';
            resultListFilter.push(speaker);
        } else {
            speaker.style.display = 'none';
        }
 
    })

    if (topic.length === 0 && fee.length === 0 && location.length === 0 && program.length === 0 && !search ) {
        allSpeakers.forEach((speaker) => {
            speaker.style.display = 'none';
        });

        document.querySelector('.wrapper-results').classList.add('hidden');
    } 
}

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
    const visibleSpeakers = resultListFilter;
    const totalElement = document.querySelector('.total');
    const wrapperSpeakersNotFound = document.querySelector('.wrapper-speaker-not-found');
    if (totalElement) {
        if (visibleSpeakers.length > 0) {
            totalElement.textContent = visibleSpeakers.length;
            totalElement.closest('.flex-block').classList.remove('hidden');
            wrapperSpeakersNotFound.classList.add('hidden');
        } else {
            totalElement.closest('.flex-block').classList.add('hidden');
            wrapperSpeakersNotFound.classList.remove('hidden');
            showSimilarSpeakers();
        }
    }
}

const renewSearchPrevious = () => {
    const getSearchPrevious = sessionStorage.getItem("searchPrevious");
    if(getSearchPrevious){
        select = JSON.parse(getSearchPrevious)
        const { topic, fee, location, program, search } = select;
        if(topic.length > 0) setSelected('topic-label', 'topic');
        if(fee.length > 0) setSelected('fee-label', 'fee');
        if(location.length > 0) setSelected('location-label', 'location');
        if(program.length > 0) setSelected('program-label', 'program');
        if(search != '') inputSearch.value = search
        renewFilter(); 
        updateTotalSpeakers();
    }
}

intervalState = setInterval(() => {
    if (document.readyState === 'complete') {
        clearInterval(intervalState)
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

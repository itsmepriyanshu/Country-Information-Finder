const countryInput = document.getElementById('countryInput');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const countryCard = document.getElementById('countryCard');
const suggestions = document.getElementById('suggestions');

let searchTimeout;
let allCountries = [];

// Helper function to update or create info elements
function updateInfoElement(id, value) {
    let element = document.getElementById(id);
    if (!element) {
        // Create new info item if it doesn't exist
        const infoGrid = document.querySelector('.info-grid');
        if (infoGrid) {
            const infoItem = document.createElement('div');
            infoItem.className = 'info-item';
            infoItem.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span class="info-label">${id.charAt(0).toUpperCase() + id.slice(1)}: </span>
                <span class="info-value" id="${id}">${value}</span>
            `;
            infoGrid.appendChild(infoItem);
        }
    } else {
        element.textContent = value;
    }
}

async function fetchAllCountries() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,capital,region,population,currencies,languages,timezones,area,subregion');
        if (!response.ok) {
            throw new Error('HTTP error status: ' + response.status);
        }
        allCountries = await response.json();
    } catch(err) {
        console.log('Error fetching countries list:', err);
        allCountries = [
            {name: {common: 'United States'}},
            {name: {common: 'United Kingdom'}},
            {name: {common: 'Canada'}},
            {name: {common: 'Australia'}},
            {name: {common: 'Germany'}},
            {name: {common: 'Nepal'}},
            {name: {common: 'India'}},
            {name: {common: 'Japan'}},
            {name: {common: 'China'}},
            {name: {common: 'France'}},
            {name: {common: 'Brazil'}},
            {name: {common: 'Mexico'}},
            {name: {common: 'South Africa'}},
            {name: {common: 'South Korea'}},
            {name: {common: 'Italy'}},
            {name: {common: 'Netherlands'}},
            {name: {common: 'Denmark'}},
            {name: {common: 'Russia'}},
            {name: {common: 'Bhutan'}}
        ];
    }
}

function showSuggestion(input) {
    if (input.length < 2) {
        suggestions.style.display = 'none';
        return;
    }
    const filtered = allCountries.filter(country =>
        country.name.common.toLowerCase().includes(input.toLowerCase()) ||
        (country.name.official && country.name.official.toLowerCase().includes(input.toLowerCase()))
    ).slice(0, 5);
    
    if (filtered.length === 0) {
        suggestions.style.display = 'none';
        return;
    }
    
    suggestions.innerHTML = filtered.map(country => 
        `<div class="suggestion-item" data-country="${country.name.common}">${country.name.common}</div>`
    ).join('');

    suggestions.style.display = 'block';
    
    suggestions.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            countryInput.value = item.dataset.country;
            suggestions.style.display = 'none';
            searchCountry(item.dataset.country);
        });
    });
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        suggestions.style.display = 'none';
    }
});

async function searchCountry(countryName) {
    if (!countryName.trim()) return;
    
    console.log('Searching for:', countryName);
    countryCard.classList.remove('show');
    error.classList.remove('show');
    loading.style.display = 'block';

    try {
        const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=false&fields=name,flags,capital,region,population,currencies,languages,timezones,area,subregion,idd,coatOfArms`;
        console.log('Fetching from:', url);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('HTTP error status: ' + response.status);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        if (!data || data.length === 0) {
            throw new Error('No country found');
        }
        
        const country = data[0];

        document.getElementById('flagImg').src = country.flags.svg || country.flags.png || '';
        document.getElementById('flagImg').alt = `flag of ${country.name.common}`;
        
        // Show both common and official names
        const countryNameElement = document.getElementById('countryName');
        if (country.name.official && country.name.official !== country.name.common) {
            countryNameElement.innerHTML = `${country.name.common}<br><small>(${country.name.official})</small>`;
        } else {
            countryNameElement.textContent = country.name.common;
        }
        document.getElementById('capital').textContent = country.capital ? country.capital[0] : 'Not available';
        document.getElementById('population').textContent = country.population ? country.population.toLocaleString() : 'Not available';
        document.getElementById('region').textContent = country.region || 'Not available';
        
        // Add more country information
        const currency = country.currencies ? Object.values(country.currencies).map(c => c.name).join(', ') : 'Not available';
        const languages = country.languages ? Object.values(country.languages).join(', ') : 'Not available';
        const timezone = country.timezones ? country.timezones[0] : 'Not available';
        const area = country.area ? `${country.area.toLocaleString()} km²` : 'Not available';
        const subregion = country.subregion || 'Not available';
        const callingCode = country.idd && country.idd.root ? `${country.idd.root}${country.idd.suffixes ? country.idd.suffixes[0] : ''}` : 'Not available';
        
        // Update or create additional info elements
        updateInfoElement('currency', currency);
        updateInfoElement('languages', languages);
        updateInfoElement('timezone', timezone);
        updateInfoElement('area', area);
        updateInfoElement('subregion', subregion);
        updateInfoElement('callingCode', callingCode);

        loading.style.display = 'none';
        setTimeout(() => {
            countryCard.classList.add('show');
        }, 100);
    } catch(err) {
        console.log('Error searching country:', err);
        loading.style.display = 'none';

        const errorElement = document.getElementById('error');

        if (err.message.includes('failed to fetch')) {
            errorElement.innerHTML = `
                <h3>Connection Error</h3>
                <p>Unable to connect to country database. Please check your connection and try again.</p>`;
        } else {
            errorElement.innerHTML = `
                <h3>Country Not Found</h3>
                <p>Please check the spelling and try again.</p>`;
        }
        error.classList.add('show');
    }
}

countryInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        showSuggestion(e.target.value);
    }, 300);
});

countryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        clearTimeout(searchTimeout);
        suggestions.style.display = 'none';
        searchCountry(countryInput.value);
    }
});

fetchAllCountries();
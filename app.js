// app.js

// --- Map Initialization ---
const map = L.map('map').setView([62.0, 15.0], 5); // Centered on Sweden

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Initialize heatmap layer (empty at first)
const heatLayer = L.heatLayer([], {
    radius: 15, // Adjust as needed
    blur: 10,   // Adjust as needed
    maxZoom: 12 // Adjust as needed
}).addTo(map);

// --- Data Storage ---
let allPlaces = []; // To store parsed CSV data

// --- UI Elements ---
const endingInput = document.getElementById('endingInput');
const updateMapBtn = document.getElementById('updateMapBtn');
const placeCountSpan = document.getElementById('placeCount');

// --- CSV Loading and Parsing ---
async function loadData() {
    try {
        // **IMPORTANT**: Make sure orter_short.csv is accessible by the web page
        // (e.g., in the same directory or served by a local web server)
        const response = await fetch('orter_full.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        const lines = csvText.trim().split('\n');

        // Skip header line
        for (let i = 1; i < lines.length; i++) {
            const columns = lines[i].split(',');
            // Basic parsing, assumes clean CSV structure as shown
            const name = columns[0]?.trim();
            const latStr = columns[1]?.trim();
            const lonStr = columns[2]?.trim();

            // Only add if we have valid name, lat, lon
            if (name && latStr && lonStr) {
                const lat = parseFloat(latStr);
                const lon = parseFloat(lonStr);
                // Check if parsing was successful (not NaN)
                if (!isNaN(lat) && !isNaN(lon)) {
                     allPlaces.push({ name: name, lat: lat, lon: lon });
                } else {
                    console.warn(`Skipping invalid coordinates for ${name}: ${latStr}, ${lonStr}`);
                }
            } else {
                 console.warn(`Skipping incomplete line ${i+1}: ${lines[i]}`);
            }
        }
        console.log(`Loaded ${allPlaces.length} places.`);
        placeCountSpan.textContent = `Loaded ${allPlaces.length} total places.`;

    } catch (error) {
        console.error('Error loading or parsing CSV:', error);
        placeCountSpan.textContent = 'Error loading data.';
    }
}

// --- Update Map Logic ---
function updateHeatmap() {
    const ending = endingInput.value.trim().toLowerCase();
    if (!ending) {
        // Clear map if input is empty or show all? Your choice.
        heatLayer.setLatLngs([]);
        placeCountSpan.textContent = 'Enter an ending to see heatmap.';
        return;
    }
     if (allPlaces.length === 0) {
         placeCountSpan.textContent = 'Data not loaded yet.';
         return;
     }

    console.log(`Filtering for names ending with: "${ending}"`);

    const filteredCoords = allPlaces
        .filter(place => place.name.toLowerCase().endsWith(ending))
        .map(place => [place.lat, place.lon]); // Leaflet.heat expects [lat, lon]

    console.log(`Found ${filteredCoords.length} places.`);
    placeCountSpan.textContent = `Found ${filteredCoords.length} places ending with "${ending}".`;

    // Update the heatmap layer
    heatLayer.setLatLngs(filteredCoords);
}

// --- Event Listeners ---
updateMapBtn.addEventListener('click', updateHeatmap);
// Optional: Update when pressing Enter in the input field
endingInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        updateHeatmap();
    }
});

// --- Initial Data Load ---
loadData(); // Load data when the script runs
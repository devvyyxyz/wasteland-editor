// Global state
let currentData = null;
let originalData = null;
let currentDweller = null;
let backups = [];

// DOM Elements
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const downloadBtn = document.getElementById('downloadBtn');
const formatBtn = document.getElementById('formatBtn');
const clearBtn = document.getElementById('clearBtn');
const jsonEditor = document.getElementById('jsonEditor');
const fileSizeSpan = document.getElementById('fileSize');
const errorMessage = document.getElementById('errorMessage');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Event Listeners Setup
function initializeEventListeners() {
    document.querySelector('.upload-label').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
    downloadBtn.addEventListener('click', downloadSave);
    formatBtn.addEventListener('click', formatJSON);
    clearBtn.addEventListener('click', clearEditor);
    jsonEditor.addEventListener('input', debounce(handleEditorChange, 500));
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    tabButtons.forEach(btn => btn.addEventListener('click', switchTab));

    // Vault panel listeners
    ['vaultName', 'vaultNumber', 'caps', 'food', 'water', 'power', 'radaway', 'stimpacks', 'nukacola', 'nukaquantum'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.addEventListener('change', updateVaultData);
    });

    ['lunchboxCount', 'handyCount', 'petCarrierCount', 'starterPackCount'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.addEventListener('change', updateItemCounts);
    });

    // Bulk action buttons
    ['unlockRoomsBtn', 'unlockRecipesBtn', 'maxAllStatsBtn', 'maxHappinessBtn', 
     'healAllBtn', 'clearEmergenciesBtn', 'unlockThemesBtn'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            if (id === 'unlockRoomsBtn') elem.addEventListener('click', unlockAllRooms);
            else if (id === 'unlockRecipesBtn') elem.addEventListener('click', unlockAllRecipes);
            else if (id === 'maxAllStatsBtn') elem.addEventListener('click', maxAllDwellerStats);
            else if (id === 'maxHappinessBtn') elem.addEventListener('click', maxAllHappiness);
            else if (id === 'healAllBtn') elem.addEventListener('click', healAllDwellers);
            else if (id === 'clearEmergenciesBtn') elem.addEventListener('click', clearAllEmergencies);
            else if (id === 'unlockThemesBtn') elem.addEventListener('click', unlockAllThemes);
        }
    });

    // Dweller panel listeners
    ['dwellerFirstName', 'dwellerLastName', 'dwellerGender', 'dwellerLevel', 'dwellerExp',
     'dwellerHealth', 'dwellerHappiness', 'dwellerSkinColor', 'dwellerHairColor',
     'dwellerOutfit', 'dwellerWeapon'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.addEventListener('change', updateDwellerData);
    });

    document.getElementById('dwellerSearch')?.addEventListener('input', debounce(filterDwellers, 300));
    document.getElementById('maxStatsBtn')?.addEventListener('click', maxDwellerStats);
    document.getElementById('saveDwellerBtn')?.addEventListener('click', saveDwellerChanges);

    document.querySelectorAll('.stat-item input').forEach(input => {
        input.addEventListener('change', updateDwellerData);
    });

    // Back link
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('back-link')) {
            e.preventDefault();
            const dwellersList = document.getElementById('dwellersList');
            const dwellerDetails = document.getElementById('dwellerDetails');
            if (dwellersList) dwellersList.style.display = 'block';
            if (dwellerDetails) dwellerDetails.style.display = 'none';
            currentDweller = null;
        }
    });
}

// File Upload Handler
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const text = event.target.result;
            let result;
            
            // Try to parse as JSON first
            try {
                const data = JSON.parse(text);
                result = { success: true, data: data };
            } catch (e) {
                // Not plain JSON, try decryption for .sav/.dat files
                if (fileName.endsWith('.sav') || fileName.endsWith('.dat')) {
                    result = SaveDecryptor.decrypt(text, file.name);
                } else {
                    result = { 
                        success: false, 
                        error: `Invalid file format. Expected JSON or encrypted .sav/.dat. Got: ${e.message}` 
                    };
                }
            }
            
            if (result.success && result.data) {
                currentData = result.data;
                originalData = JSON.parse(JSON.stringify(currentData));
                
                fileInfo.textContent = `📄 Loaded: ${file.name} (${formatFileSize(file.size)})`;
                errorMessage.textContent = '';
                downloadBtn.disabled = false;
                formatBtn.disabled = false;
                clearBtn.disabled = false;
                
                // Populate selects with weapons and outfits
                populateSelects();
                
                jsonEditor.value = JSON.stringify(currentData, null, 2);
                updateFileSize();
                populateVaultData();
                populateDwellersList();
                populateRoomsList();
                
                // Create initial backup
                createBackup('Initial Load');
            } else {
                const errorMsg = result.error || 'Unknown error parsing file';
                errorMessage.textContent = errorMsg;
                currentData = null;
            }
            
        } catch (error) {
            errorMessage.textContent = `Error: ${error.message}`;
            currentData = null;
            console.error('File upload error:', error);
        }
    };
    
    reader.readAsText(file);
}

// Populate select dropdowns
function populateSelects() {
    const weaponSelect = document.getElementById('dwellerWeapon');
    const outfitSelect = document.getElementById('dwellerOutfit');
    
    if (weaponSelect) {
        weaponSelect.innerHTML = '<option value="">No Weapon</option>';
        Object.entries(WEAPONS).forEach(([key, name]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = name;
            weaponSelect.appendChild(option);
        });
    }
    
    if (outfitSelect) {
        outfitSelect.innerHTML = '<option value="">No Outfit</option>';
        Object.entries(OUTFITS).forEach(([key, name]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = name;
            outfitSelect.appendChild(option);
        });
    }
}

// Backup Management
function createBackup(label = 'Backup') {
    if (!currentData) return;
    
    const backup = {
        label: label || `Backup ${new Date().toLocaleTimeString()}`,
        timestamp: Date.now(),
        data: JSON.parse(JSON.stringify(currentData))
    };
    
    backups.push(backup);
    if (backups.length > 10) backups.shift(); // Keep only 10 backups
    
    showToast(`Backup created: ${backup.label}`);
}

function restoreBackup(index) {
    if (!backups[index]) return;
    
    currentData = JSON.parse(JSON.stringify(backups[index].data));
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    populateVaultData();
    populateDwellersList();
    
    showToast(`Restored: ${backups[index].label}`);
}

// Toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #8B4513;
        color: #F5DEB3;
        padding: 15px 20px;
        border-radius: 5px;
        font-family: Georgia, serif;
        z-index: 10000;
        border: 2px solid #654321;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
    `;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Populate Vault Data
function populateVaultData() {
    if (!currentData || !currentData.vault) return;
    
    const vault = currentData.vault;
    const vaultNameElem = document.getElementById('vaultName');
    if (vaultNameElem) vaultNameElem.value = vault.VaultName || '';
    
    const storage = vault.storage?.resources || {};
    
    const fields = {
        'caps': 'Caps',
        'food': 'Food',
        'water': 'Water',
        'power': 'Energy',
        'radaway': 'RadAway',
        'stimpacks': 'StimPack',
        'nukacola': 'NukaColaQuantum',
        'nukaquantum': 'NukaColaQuantum'
    };
    
    Object.entries(fields).forEach(([elemId, storageProp]) => {
        const elem = document.getElementById(elemId);
        if (elem) elem.value = storage[storageProp] || 0;
    });
}

// Populate Dwellers List
function populateDwellersList() {
    if (!currentData || !currentData.dwellers) return;
    
    const dwellersList = document.getElementById('dwellersList');
    if (!dwellersList) return;
    
    dwellersList.innerHTML = '';
    
    const dwellers = currentData.dwellers.dwellers || [];
    dwellers.forEach((dweller, index) => {
        const item = document.createElement('div');
        item.className = 'dweller-item';
        const level = dweller.level || 1;
        const health = dweller.health?.current || 0;
        item.textContent = `${dweller.name} (Lvl ${level} • HP: ${health})`;
        item.addEventListener('click', () => selectDweller(dweller, index));
        dwellersList.appendChild(item);
    });
}

// Filter Dwellers
function filterDwellers() {
    const searchElem = document.getElementById('dwellerSearch');
    if (!searchElem) return;
    
    const query = searchElem.value.toLowerCase();
    const items = document.querySelectorAll('.dweller-item');
    
    items.forEach(item => {
        if (item.textContent.toLowerCase().includes(query)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// Select Dweller
function selectDweller(dweller, index) {
    currentDweller = { data: dweller, index: index };
    
    document.querySelectorAll('.dweller-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.dweller-item').classList.add('active');
    
    const dwellerDetails = document.getElementById('dwellerDetails');
    
    if (dwellerDetails) dwellerDetails.style.display = 'block';
    
    const nameElem = document.getElementById('dwellerName');
    if (nameElem) nameElem.textContent = dweller.name || 'Unknown';
    
    const nameparts = (dweller.name || '').split(' ');
    const firstElem = document.getElementById('dwellerFirstName');
    const lastElem = document.getElementById('dwellerLastName');
    
    if (firstElem) firstElem.value = nameparts[0] || '';
    if (lastElem) lastElem.value = nameparts[1] || '';
    
    const fields = {
        'dwellerGender': dweller.gender || 1,
        'dwellerLevel': dweller.level || 1,
        'dwellerExp': dweller.experience || 0,
        'dwellerHealth': dweller.health?.current || 0,
        'dwellerHappiness': dweller.happiness || 50,
    };
    
    Object.entries(fields).forEach(([elemId, value]) => {
        const elem = document.getElementById(elemId);
        if (elem) elem.value = value;
    });
    
    // Update SPECIAL stats
    const stats = dweller.stats || {};
    const statMap = { s: 'strength', p: 'perception', e: 'endurance', c: 'charisma', i: 'intelligence', a: 'agility', l: 'luck' };
    
    Object.entries(statMap).forEach(([abbr, full]) => {
        const elem = document.getElementById(`stat-${abbr}`);
        if (elem) elem.value = stats[full] || 1;
    });
}

// Update Dweller Data
function updateDwellerData() {
    if (!currentDweller || !currentData) return;
    
    const dweller = currentDweller.data;
    const firstName = document.getElementById('dwellerFirstName')?.value || '';
    const lastName = document.getElementById('dwellerLastName')?.value || '';
    
    dweller.name = `${firstName} ${lastName}`.trim();
    
    const fields = {
        'dwellerGender': 'gender',
        'dwellerLevel': 'level',
        'dwellerExp': 'experience',
        'dwellerHealth': (elem) => {
            if (!dweller.health) dweller.health = {};
            dweller.health.current = parseInt(elem.value) || 0;
        },
        'dwellerHappiness': 'happiness',
        'dwellerOutfit': 'equipped_outfit',
        'dwellerWeapon': 'equipped_weapon'
    };
    
    Object.entries(fields).forEach(([elemId, prop]) => {
        const elem = document.getElementById(elemId);
        if (!elem) return;
        
        if (typeof prop === 'function') {
            prop(elem);
        } else {
            dweller[prop] = parseInt(elem.value) || elem.value;
        }
    });
    
    if (!dweller.stats) dweller.stats = {};
    const statMap = { s: 'strength', p: 'perception', e: 'endurance', c: 'charisma', i: 'intelligence', a: 'agility', l: 'luck' };
    
    Object.entries(statMap).forEach(([abbr, full]) => {
        const elem = document.getElementById(`stat-${abbr}`);
        if (elem) dweller.stats[full] = parseInt(elem.value) || 1;
    });
    
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
}

// Max Dweller Stats
function maxDwellerStats() {
    if (!currentDweller) return;
    
    const stats = ['stat-s', 'stat-p', 'stat-e', 'stat-c', 'stat-i', 'stat-a', 'stat-l'];
    stats.forEach(stat => {
        const elem = document.getElementById(stat);
        if (elem) elem.value = 10;
    });
    updateDwellerData();
    showToast('Dweller stats maximized!');
}

function saveDwellerChanges() {
    updateDwellerData();
    showToast('Dweller changes saved!');
}

// Populate Rooms List
function populateRoomsList() {
    if (!currentData || !currentData.vault) return;
    
    const roomsList = document.getElementById('roomsList');
    if (!roomsList) return;
    
    roomsList.innerHTML = '';
    
    const rooms = currentData.vault.rooms || [];
    rooms.forEach((room, index) => {
        const item = document.createElement('div');
        item.className = 'dweller-item room-item';
        item.textContent = `${room.type || 'Unknown'} - Lvl ${room.level || 1}`;
        item.addEventListener('click', () => editRoom(index, room));
        roomsList.appendChild(item);
    });
}

// Update Vault Data
function updateVaultData() {
    if (!currentData || !currentData.vault) return;
    
    const vault = currentData.vault;
    vault.VaultName = document.getElementById('vaultName')?.value || '';
    
    if (!vault.storage) vault.storage = {};
    if (!vault.storage.resources) vault.storage.resources = {};
    
    const fields = {
        'caps': 'Caps',
        'food': 'Food',
        'water': 'Water',
        'power': 'Energy',
        'radaway': 'RadAway',
        'stimpacks': 'StimPack',
        'nukacola': 'NukaColaQuantum',
        'nukaquantum': 'NukaColaQuantum'
    };
    
    Object.entries(fields).forEach(([elemId, storageProp]) => {
        const elem = document.getElementById(elemId);
        if (elem) vault.storage.resources[storageProp] = parseInt(elem.value) || 0;
    });
    
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
}

// Populate Item Data
function populateItemData() {
    if (!currentData) return;
    
    const items = currentData.items || [];
    let lunchboxes = 0, handies = 0, pets = 0, starter = 0;
    
    items.forEach(item => {
        const id = item.id || '';
        if (id.includes('Lunchbox')) lunchboxes += item.quantity || 1;
        if (id.includes('Handy')) handies += item.quantity || 1;
        if (id.includes('Pet')) pets += item.quantity || 1;
        if (id.includes('Starter')) starter += item.quantity || 1;
    });
    
    const counts = {
        'lunchboxCount': lunchboxes,
        'handyCount': handies,
        'petCarrierCount': pets,
        'starterPackCount': starter
    };
    
    Object.entries(counts).forEach(([elemId, count]) => {
        const elem = document.getElementById(elemId);
        if (elem) elem.value = count;
    });
}

// Update Item Counts
function updateItemCounts() {
    if (!currentData || !currentData.items) return;
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
}

// Batch Operations - Max All Dweller Stats
function maxAllDwellerStats() {
    if (!currentData || !currentData.dwellers) {
        showToast('No dwellers data found');
        return;
    }
    
    const dwellers = currentData.dwellers.dwellers || [];
    const maxStats = { strength: 10, perception: 10, endurance: 10, charisma: 10, intelligence: 10, agility: 10, luck: 10 };
    
    dwellers.forEach(dweller => {
        dweller.level = 50;
        if (!dweller.stats) dweller.stats = {};
        Object.assign(dweller.stats, maxStats);
    });
    
    createBackup('Max All Stats');
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    populateDwellersList();
    showToast('All dweller stats maximized!');
}

// Max All Happiness
function maxAllHappiness() {
    if (!currentData || !currentData.dwellers) {
        showToast('No dwellers data found');
        return;
    }
    
    const dwellers = currentData.dwellers.dwellers || [];
    dwellers.forEach(dweller => {
        dweller.happiness = 100;
    });
    
    createBackup('Max Happiness');
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    populateDwellersList();
    showToast('All dwellers at maximum happiness!');
}

// Heal All Dwellers
function healAllDwellers() {
    if (!currentData || !currentData.dwellers) {
        showToast('No dwellers data found');
        return;
    }
    
    const dwellers = currentData.dwellers.dwellers || [];
    dwellers.forEach(dweller => {
        if (dweller.health) {
            const maxHealth = dweller.health.maxHealth || 999;
            dweller.health.current = maxHealth;
        }
    });
    
    createBackup('Heal All');
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    populateDwellersList();
    showToast('All dwellers healed!');
}

// Unlock All Rooms
function unlockAllRooms() {
    if (!currentData || !currentData.vault) {
        showToast('No vault data found');
        return;
    }
    
    const rooms = currentData.vault.rooms || [];
    rooms.forEach(room => {
        room.state = 'Buildable';
        room.level = 1;
    });
    
    createBackup('Unlock Rooms');
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    populateRoomsList();
    showToast('All rooms unlocked!');
}

// Unlock All Recipes
function unlockAllRecipes() {
    if (!currentData) {
        showToast('No data found');
        return;
    }
    
    if (currentData.recipes) {
        currentData.recipes.forEach(recipe => {
            recipe.locked = false;
        });
    }
    
    createBackup('Unlock Recipes');
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    showToast('All recipes unlocked!');
}

// Clear All Emergencies
function clearAllEmergencies() {
    if (!currentData || !currentData.vault) {
        showToast('No vault data found');
        return;
    }
    
    const rooms = currentData.vault.rooms || [];
    rooms.forEach(room => {
        room.emergencyDone = true;
    });
    
    createBackup('Clear Emergencies');
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    showToast('All room emergencies cleared!');
}

// Unlock All Themes
function unlockAllThemes() {
    if (!currentData) {
        showToast('No data found');
        return;
    }
    
    if (currentData.specialTheme) {
        Object.keys(currentData.specialTheme).forEach(key => {
            if (typeof currentData.specialTheme[key] === 'boolean') {
                currentData.specialTheme[key] = true;
            }
        });
    }
    
    createBackup('Unlock Themes');
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    showToast('All themes unlocked!');
}

// Search Handler
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    searchResults.innerHTML = '';
    
    if (!query || !currentData) return;
    
    const results = [];
    searchInObject(currentData, query, [], results);
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div style="padding: 15px; color: #999;">No results found</div>';
        return;
    }
    
    results.slice(0, 20).forEach(result => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        
        const path = document.createElement('div');
        path.className = 'search-result-path';
        path.textContent = result.path || 'root';
        item.appendChild(path);
        
        const value = document.createElement('div');
        value.className = 'search-result-value';
        value.textContent = JSON.stringify(result.value).substring(0, 100);
        item.appendChild(value);
        
        searchResults.appendChild(item);
    });
}

function searchInObject(obj, query, path, results) {
    if (!obj || results.length > 50) return;
    
    if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
            const newPath = [...path, `[${index}]`];
            if (JSON.stringify(item).toLowerCase().includes(query)) {
                results.push({ path: newPath.join('.'), value: item });
            }
            searchInObject(item, query, newPath, results);
        });
    } else if (typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
            const newPath = [...path, key];
            if (JSON.stringify(value).toLowerCase().includes(query)) {
                results.push({ path: newPath.join('.'), value });
            }
            searchInObject(value, query, newPath, results);
        });
    }
}

// Editor Change Handler
function handleEditorChange() {
    try {
        const parsed = JSON.parse(jsonEditor.value);
        currentData = parsed;
        errorMessage.textContent = '';
        updateFileSize();
    } catch (error) {
        errorMessage.textContent = `JSON Error: ${error.message}`;
    }
}

// Download Save
function downloadSave() {
    if (!currentData) return;
    
    // Ask user format preference
    const format = prompt('Download as:\n1. .sav (encrypted - use in game)\n2. .json (plain text - editable)\n\nEnter 1 or 2:', '1');
    
    if (format === '1') {
        // Encrypt and download as .sav
        const result = SaveDecryptor.encrypt(currentData);
        if (result.success) {
            const dataBlob = new Blob([result.data], { type: 'text/plain' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Vault${Math.floor(Math.random() * 1000)}.sav`;
            link.click();
            URL.revokeObjectURL(url);
            showToast('Save file downloaded as .sav!');
        } else {
            errorMessage.textContent = `Encryption error: ${result.error}`;
        }
    } else if (format === '2') {
        // Download as plain JSON
        const dataStr = JSON.stringify(currentData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fallout-shelter-save-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        showToast('Save file downloaded as .json!');
    }
}

// Format JSON
function formatJSON() {
    try {
        const parsed = JSON.parse(jsonEditor.value);
        jsonEditor.value = JSON.stringify(parsed, null, 2);
        errorMessage.textContent = '';
        updateFileSize();
        showToast('JSON formatted!');
    } catch (error) {
        errorMessage.textContent = `Format Error: ${error.message}`;
    }
}

// Clear Editor
function clearEditor() {
    if (confirm('Are you sure you want to clear the editor?')) {
        currentData = null;
        originalData = null;
        currentDweller = null;
        backups = [];
        jsonEditor.value = '';
        fileInfo.textContent = '';
        errorMessage.textContent = '';
        searchResults.innerHTML = '';
        downloadBtn.disabled = true;
        formatBtn.disabled = true;
        clearBtn.disabled = true;
        updateFileSize();
        
        // Reset all panels
        const resetIds = ['vaultName', 'caps', 'food', 'water', 'power', 'radaway', 'stimpacks', 'nukacola',
                         'dwellersList', 'dwellerSearch', 'lunchboxCount', 'handyCount', 'petCarrierCount'];
        resetIds.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) elem.value = '';
        });
        
        const dwellersList = document.getElementById('dwellersList');
        if (dwellersList) dwellersList.innerHTML = '';
        
        showToast('Editor cleared!');
    }
}

// Tab Switching
function switchTab(e) {
    const tabName = e.target.dataset.tab;
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    e.target.classList.add('active');
    const tabContent = document.getElementById(tabName);
    if (tabContent) tabContent.classList.add('active');
}

// Utility Functions
function updateFileSize() {
    if (!currentData) {
        fileSizeSpan.textContent = 'Size: 0 B';
        return;
    }
    
    const jsonStr = JSON.stringify(currentData);
    fileSizeSpan.textContent = `Size: ${formatFileSize(new Blob([jsonStr]).size)}`;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Room Editing Functions
let currentRoomIndex = null;

function editRoom(index, room) {
    currentRoomIndex = index;
    
    // Populate form fields
    document.getElementById('roomName').value = room.name || '';
    document.getElementById('roomType').value = room.type || '';
    document.getElementById('roomLevel').value = room.level || 1;
    document.getElementById('roomState').value = room.state || 'built';
    
    // Numeric fields with defaults
    document.getElementById('roomPower').value = room.power || 0;
    document.getElementById('roomFood').value = room.food || 0;
    document.getElementById('roomWater').value = room.water || 0;
    document.getElementById('roomRadiation').value = room.radiation || 0;
    
    // Show the form
    const roomDetails = document.getElementById('roomDetails');
    if (roomDetails) {
        roomDetails.style.display = 'block';
        roomDetails.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Highlight selected room
    document.querySelectorAll('.room-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

function saveRoom() {
    if (currentRoomIndex === null || !currentData.vault.rooms[currentRoomIndex]) return;
    
    const room = currentData.vault.rooms[currentRoomIndex];
    
    // Update room properties
    room.name = document.getElementById('roomName').value;
    room.type = document.getElementById('roomType').value;
    room.level = parseInt(document.getElementById('roomLevel').value) || 1;
    room.state = document.getElementById('roomState').value;
    room.power = parseInt(document.getElementById('roomPower').value) || 0;
    room.food = parseInt(document.getElementById('roomFood').value) || 0;
    room.water = parseInt(document.getElementById('roomWater').value) || 0;
    room.radiation = parseInt(document.getElementById('roomRadiation').value) || 0;
    
    // Refresh list to show updates
    populateRoomsList();
    closeRoomEditor();
    
    // Mark as modified
    showToast('Room updated');
    handleEditorChange();
}

function closeRoomEditor() {
    currentRoomIndex = null;
    const roomDetails = document.getElementById('roomDetails');
    if (roomDetails) {
        roomDetails.style.display = 'none';
    }
    document.querySelectorAll('.room-item').forEach(item => {
        item.classList.remove('active');
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    
    // Add room editor listeners
    const saveRoomBtn = document.getElementById('saveRoomBtn');
    const closeRoomBtn = document.getElementById('closeRoomBtn');
    if (saveRoomBtn) saveRoomBtn.addEventListener('click', saveRoom);
    if (closeRoomBtn) closeRoomBtn.addEventListener('click', closeRoomEditor);
    
    console.log('Wasteland Editor Enhanced - Rustic Paper Edition loaded successfully');
    showToast('Wasteland Editor Ready');
});

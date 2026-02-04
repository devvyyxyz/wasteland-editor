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
    ['unlockRoomsBtn', 'maxAllStatsBtn', 'maxHappinessBtn', 
     'healAllBtn', 'clearEmergenciesBtn', 'unlockThemesBtn', 'showRecipesEditorBtn'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            if (id === 'unlockRoomsBtn') elem.addEventListener('click', unlockAllRooms);
            else if (id === 'maxAllStatsBtn') elem.addEventListener('click', maxAllDwellerStats);
            else if (id === 'maxHappinessBtn') elem.addEventListener('click', maxAllHappiness);
            else if (id === 'healAllBtn') elem.addEventListener('click', healAllDwellers);
            else if (id === 'clearEmergenciesBtn') elem.addEventListener('click', clearAllEmergencies);
            else if (id === 'unlockThemesBtn') elem.addEventListener('click', unlockAllThemes);
            else if (id === 'showRecipesEditorBtn') elem.addEventListener('click', showRecipesEditor);
        }
    });

    // Recipes editor listeners
    const saveRecipesBtn = document.getElementById('saveRecipesBtn');
    const closeRecipesBtn = document.getElementById('closeRecipesEditorBtn');
    const recipeSelectAllBtn = document.getElementById('recipeSelectAllBtn');
    const recipeDeselectAllBtn = document.getElementById('recipeDeselectAllBtn');
    const recipeSearchInput = document.getElementById('recipeSearchInput');
    
    if (saveRecipesBtn) saveRecipesBtn.addEventListener('click', saveRecipesChanges);
    if (closeRecipesBtn) closeRecipesBtn.addEventListener('click', closeRecipesEditor);
    if (recipeSelectAllBtn) recipeSelectAllBtn.addEventListener('click', recipeSelectAll);
    if (recipeDeselectAllBtn) recipeDeselectAllBtn.addEventListener('click', recipeDeselectAll);
    if (recipeSearchInput) recipeSearchInput.addEventListener('input', (e) => filterRecipes(e.target.value));

    // Season pass listeners
    ['seasonId', 'seasonLevel', 'seasonXP', 'seasonPremium'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.addEventListener('change', updateSeasonPassData);
    });
    
    const maxSeasonLevelBtn = document.getElementById('maxSeasonLevelBtn');
    const unlockAllRewardsBtn = document.getElementById('unlockAllRewardsBtn');
    const enablePremiumBtn = document.getElementById('enablePremiumBtn');
    
    if (maxSeasonLevelBtn) maxSeasonLevelBtn.addEventListener('click', maxSeasonLevel);
    if (unlockAllRewardsBtn) unlockAllRewardsBtn.addEventListener('click', unlockAllSeasonRewards);
    if (enablePremiumBtn) enablePremiumBtn.addEventListener('click', enablePremiumPass);

    // Wasteland listeners
    const wastelandSearch = document.getElementById('wastelandSearch');
    const saveTeamBtn = document.getElementById('saveTeamBtn');
    const recallTeamBtn = document.getElementById('recallTeamBtn');
    const maxTeamResourcesBtn = document.getElementById('maxTeamResourcesBtn');
    const wastelandBackBtn = document.getElementById('wastelandBackBtn');
    
    if (wastelandSearch) wastelandSearch.addEventListener('input', (e) => filterWastelandTeams(e.target.value));
    if (saveTeamBtn) saveTeamBtn.addEventListener('click', updateWastelandTeam);
    if (recallTeamBtn) recallTeamBtn.addEventListener('click', recallTeam);
    if (maxTeamResourcesBtn) maxTeamResourcesBtn.addEventListener('click', maxTeamResources);
    if (wastelandBackBtn) wastelandBackBtn.addEventListener('click', () => {
        document.getElementById('wastelandTeamDetails').style.display = 'none';
        document.querySelectorAll('.wasteland-team-item').forEach(item => item.classList.remove('active'));
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
                enableEditorUI();
                populateVaultData();
                populateDwellersList();
                populateRoomsList();
                populateWastelandTeams();
                populateSeasonPassData();
                
                // Create initial backup
                createBackup('Initial Load');
            } else {
                const errorMsg = result.error || 'Unknown error parsing file';
                errorMessage.textContent = errorMsg;
                currentData = null;
                disableEditorUI();
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
// Enable/Disable Editor UI
function enableEditorUI() {
    const inputs = document.querySelectorAll('.tab-content input, .tab-content select, .tab-content button');
    inputs.forEach(input => input.disabled = false);
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('editor-disabled'));
}

function disableEditorUI() {
    const inputs = document.querySelectorAll('.tab-content input, .tab-content select, .tab-content button');
    inputs.forEach(input => input.disabled = true);
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('editor-disabled'));
}

function showToast(message) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column-reverse;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.style.cssText = `
        background: #8B4513;
        color: #F5DEB3;
        padding: 15px 20px;
        border-radius: 5px;
        font-family: Georgia, serif;
        border: 2px solid #654321;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
        pointer-events: auto;
        max-width: 300px;
    `;
    
    toast.textContent = message;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            toast.remove();
            // Remove container if no toasts left
            if (toastContainer.children.length === 0) {
                toastContainer.remove();
            }
        }, 300);
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
    const dwellersList = document.getElementById('dwellersList');
    if (!dwellersList) return;
    
    if (!currentData || !currentData.dwellers) {
        dwellersList.innerHTML = '<div class="empty-state">📂 No vault loaded yet!<br><small>Upload a save file to get started</small></div>';
        return;
    }
    
    dwellersList.innerHTML = '';
    
    const dwellers = currentData.dwellers.dwellers || [];
    
    if (dwellers.length === 0) {
        dwellersList.innerHTML = '<div class="empty-state">😔 No dwellers found in this vault</div>';
        return;
    }
    
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
    const roomsList = document.getElementById('roomsList');
    if (!roomsList) return;
    
    if (!currentData || !currentData.vault) {
        roomsList.innerHTML = '<div class="empty-state">📂 No vault loaded yet!<br><small>Upload a save file to get started</small></div>';
        return;
    }
    
    roomsList.innerHTML = '';
    
    const rooms = currentData.vault.rooms || [];
    
    if (rooms.length === 0) {
        roomsList.innerHTML = '<div class="empty-state">🏗️ No rooms listed here :(<br><small>Your vault appears to be empty</small></div>';
        return;
    }
    
    rooms.forEach((room, index) => {
        const item = document.createElement('div');
        item.className = 'dweller-item room-item';
        item.textContent = `${room.type || 'Unknown'} - Lvl ${room.level || 1}`;
        item.addEventListener('click', () => editRoom(index, room));
        roomsList.appendChild(item);
    });
}

// Wasteland Teams Functions
let currentWastelandTeam = null;

function populateWastelandTeams() {
    const teamsList = document.getElementById('wastelandTeamsList');
    if (!teamsList) return;
    
    if (!currentData || !currentData.wasteland) {
        teamsList.innerHTML = '<div class="empty-state">📂 No vault loaded yet!<br><small>Upload a save file to get started</small></div>';
        return;
    }
    
    teamsList.innerHTML = '';
    
    const teams = currentData.wasteland.teams || currentData.wasteland || [];
    
    if (teams.length === 0) {
        teamsList.innerHTML = '<div class="empty-state">🏜️ No teams in the wasteland<br><small>Send dwellers on quests to see them here</small></div>';
        return;
    }
    
    teams.forEach((team, index) => {
        const item = document.createElement('div');
        item.className = 'wasteland-team-item';
        
        const teamName = team.name || team.id || `Team ${index + 1}`;
        const status = team.status || team.state || 'exploring';
        
        item.textContent = `${teamName} - ${status}`;
        item.addEventListener('click', () => selectWastelandTeam(team, index));
        teamsList.appendChild(item);
    });
}

function selectWastelandTeam(team, index) {
    currentWastelandTeam = { data: team, index: index };
    
    document.querySelectorAll('.wasteland-team-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.wasteland-team-item').classList.add('active');
    
    const teamDetails = document.getElementById('wastelandTeamDetails');
    if (teamDetails) teamDetails.style.display = 'block';
    
    // Populate form
    const teamName = document.getElementById('wastelandTeamName');
    if (teamName) teamName.textContent = team.name || team.id || `Team ${index + 1}`;
    
    const teamId = document.getElementById('teamId');
    const teamStatus = document.getElementById('teamStatus');
    const teamQuestId = document.getElementById('teamQuestId');
    const teamQuestProgress = document.getElementById('teamQuestProgress');
    const teamCaps = document.getElementById('teamCaps');
    const teamItems = document.getElementById('teamItems');
    
    if (teamId) teamId.value = team.id || '';
    if (teamStatus) teamStatus.value = team.status || team.state || 'exploring';
    if (teamQuestId) teamQuestId.value = team.questId || team.quest?.id || '';
    if (teamQuestProgress) teamQuestProgress.value = team.progress || team.quest?.progress || 0;
    if (teamCaps) teamCaps.value = team.caps || team.resources?.caps || 0;
    if (teamItems) teamItems.value = team.items?.length || team.itemCount || 0;
}

function updateWastelandTeam() {
    if (!currentWastelandTeam || !currentData.wasteland) return;
    
    const team = currentWastelandTeam.data;
    
    const teamStatus = document.getElementById('teamStatus')?.value;
    const teamQuestId = document.getElementById('teamQuestId')?.value;
    const teamQuestProgress = parseInt(document.getElementById('teamQuestProgress')?.value) || 0;
    const teamCaps = parseInt(document.getElementById('teamCaps')?.value) || 0;
    const teamItems = parseInt(document.getElementById('teamItems')?.value) || 0;
    
    if (team.status !== undefined) team.status = teamStatus;
    else if (team.state !== undefined) team.state = teamStatus;
    
    if (team.questId !== undefined) team.questId = teamQuestId;
    else if (team.quest?.id !== undefined) team.quest.id = teamQuestId;
    
    if (team.progress !== undefined) team.progress = teamQuestProgress;
    else if (team.quest?.progress !== undefined) team.quest.progress = teamQuestProgress;
    
    if (team.caps !== undefined) team.caps = teamCaps;
    else if (team.resources?.caps !== undefined) team.resources.caps = teamCaps;
    
    if (team.itemCount !== undefined) team.itemCount = teamItems;
    
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    populateWastelandTeams();
    showToast('Team updated!');
}

function recallTeam() {
    if (!currentWastelandTeam) return;
    
    const team = currentWastelandTeam.data;
    
    if (team.status !== undefined) team.status = 'returning';
    else if (team.state !== undefined) team.state = 'returning';
    
    if (team.progress !== undefined) team.progress = 100;
    else if (team.quest?.progress !== undefined) team.quest.progress = 100;
    
    updateWastelandTeam();
    showToast('Team recalled!');
}

function maxTeamResources() {
    if (!currentWastelandTeam) return;
    
    const team = currentWastelandTeam.data;
    
    if (team.caps !== undefined) team.caps = 999999;
    else if (team.resources?.caps !== undefined) team.resources.caps = 999999;
    else if (!team.resources) team.resources = { caps: 999999 };
    else team.caps = 999999;
    
    if (team.itemCount !== undefined) team.itemCount = 999;
    
    selectWastelandTeam(team, currentWastelandTeam.index);
    updateWastelandTeam();
    showToast('Team resources maximized!');
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

// Recipes Editor Functions
function populateRecipesList() {
    if (!currentData || !currentData.recipes) {
        showToast('No recipes found in save file');
        return;
    }
    
    const recipesList = document.getElementById('recipesList');
    if (!recipesList) return;
    
    recipesList.innerHTML = '';
    
    const recipes = currentData.recipes || [];
    
    if (recipes.length === 0) {
        recipesList.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">No recipes found</p>';
        return;
    }
    
    recipes.forEach((recipe, index) => {
        // Check if recipe is locked (missing locked property or explicitly set to true)
        const isLocked = recipe.locked !== false;
        
        // Try multiple property names for recipe identifier
        let recipeName = recipe.name || recipe.Name || recipe.title || recipe.Title || recipe.recipeId || recipe.id || `Recipe ${index + 1}`;
        
        // Make sure it's a string
        recipeName = String(recipeName).trim() || `Recipe ${index + 1}`;
        
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'recipe-checkbox';
        checkboxDiv.innerHTML = `
            <input type="checkbox" id="recipe-${index}" ${!isLocked ? 'checked' : ''} data-recipe-index="${index}">
            <label for="recipe-${index}">${recipeName}</label>
        `;
        
        checkboxDiv.querySelector('input').addEventListener('change', () => {
            // Just track changes, save happens on Save button
        });
        
        recipesList.appendChild(checkboxDiv);
    });
}

function showRecipesEditor() {
    populateRecipesList();
    const panel = document.getElementById('recipesEditorPanel');
    if (panel) {
        panel.style.display = 'block';
        panel.scrollIntoView({ behavior: 'smooth' });
    }
}

function closeRecipesEditor() {
    const panel = document.getElementById('recipesEditorPanel');
    if (panel) {
        panel.style.display = 'none';
    }
}

function saveRecipesChanges() {
    if (!currentData || !currentData.recipes) return;
    
    const checkboxes = document.querySelectorAll('#recipesList input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const index = parseInt(checkbox.dataset.recipeIndex);
        if (currentData.recipes[index]) {
            currentData.recipes[index].locked = !checkbox.checked;
        }
    });
    
    createBackup('Edit Recipes');
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    closeRecipesEditor();
    showToast('Recipe changes saved!');
}

function recipeSelectAll() {
    document.querySelectorAll('#recipesList input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
    });
}

function recipeDeselectAll() {
    document.querySelectorAll('#recipesList input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
}

function filterRecipes(searchTerm) {
    const items = document.querySelectorAll('.recipe-checkbox');
    const term = searchTerm.toLowerCase();
    
    items.forEach(item => {
        const label = item.querySelector('label').textContent.toLowerCase();
        item.style.display = label.includes(term) ? 'flex' : 'none';
    });
}

function filterWastelandTeams(searchTerm) {
    const items = document.querySelectorAll('.wasteland-team-item');
    const term = searchTerm.toLowerCase();
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(term) ? 'flex' : 'none';
    });
}

// Season Pass Functions
function populateSeasonPassData() {
    if (!currentData) return;
    
    // Season pass data might be at root level or in a nested object
    const seasonData = currentData.seasonPass || currentData.season || currentData;
    
    // Populate form fields
    const seasonId = document.getElementById('seasonId');
    const seasonLevel = document.getElementById('seasonLevel');
    const seasonXP = document.getElementById('seasonXP');
    const seasonPremium = document.getElementById('seasonPremium');
    
    if (seasonId) seasonId.value = seasonData.seasonId || seasonData.id || '';
    if (seasonLevel) seasonLevel.value = seasonData.level || seasonData.seasonLevel || 0;
    if (seasonXP) seasonXP.value = seasonData.xp || seasonData.experience || seasonData.seasonXP || 0;
    if (seasonPremium) seasonPremium.value = (seasonData.premium || seasonData.isPremium || false).toString();
    
    // Populate rewards list
    populateSeasonRewards();
}

function populateSeasonRewards() {
    const rewardsList = document.getElementById('seasonRewardsList');
    if (!rewardsList || !currentData) return;
    
    const seasonData = currentData.seasonPass || currentData.season || currentData;
    const rewards = seasonData.rewards || seasonData.tiers || [];
    
    if (rewards.length === 0) {
        rewardsList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No rewards found in this file</p>';
        return;
    }
    
    rewardsList.innerHTML = '';
    
    rewards.forEach((reward, index) => {
        const isUnlocked = reward.unlocked !== false;
        const rewardDiv = document.createElement('div');
        rewardDiv.className = `season-reward-item ${isUnlocked ? 'unlocked' : 'locked'}`;
        
        const title = reward.name || reward.title || `Reward ${index + 1}`;
        const description = reward.description || reward.desc || '';
        const tier = reward.tier || reward.level || index + 1;
        
        rewardDiv.innerHTML = `
            <div class="reward-title">Tier ${tier}: ${title}</div>
            ${description ? `<div class="reward-description">${description}</div>` : ''}
            <div class="reward-status ${isUnlocked ? 'unlocked' : 'locked'}">
                ${isUnlocked ? '✓ Unlocked' : '🔒 Locked'}
            </div>
        `;
        
        rewardsList.appendChild(rewardDiv);
    });
}

function updateSeasonPassData() {
    if (!currentData) return;
    
    const seasonData = currentData.seasonPass || currentData.season || currentData;
    
    const seasonId = document.getElementById('seasonId')?.value;
    const seasonLevel = parseInt(document.getElementById('seasonLevel')?.value) || 0;
    const seasonXP = parseInt(document.getElementById('seasonXP')?.value) || 0;
    const seasonPremium = document.getElementById('seasonPremium')?.value === 'true';
    
    if (seasonId !== undefined) {
        if (seasonData.seasonId !== undefined) seasonData.seasonId = seasonId;
        else if (seasonData.id !== undefined) seasonData.id = seasonId;
    }
    
    if (seasonData.level !== undefined) seasonData.level = seasonLevel;
    else if (seasonData.seasonLevel !== undefined) seasonData.seasonLevel = seasonLevel;
    
    if (seasonData.xp !== undefined) seasonData.xp = seasonXP;
    else if (seasonData.experience !== undefined) seasonData.experience = seasonXP;
    else if (seasonData.seasonXP !== undefined) seasonData.seasonXP = seasonXP;
    
    if (seasonData.premium !== undefined) seasonData.premium = seasonPremium;
    else if (seasonData.isPremium !== undefined) seasonData.isPremium = seasonPremium;
    
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
}

function maxSeasonLevel() {
    if (!currentData) {
        showToast('No season pass data found');
        return;
    }
    
    const seasonData = currentData.seasonPass || currentData.season || currentData;
    
    // Set to max level (usually 100)
    if (seasonData.level !== undefined) seasonData.level = 100;
    else if (seasonData.seasonLevel !== undefined) seasonData.seasonLevel = 100;
    else seasonData.level = 100;
    
    // Max out XP
    if (seasonData.xp !== undefined) seasonData.xp = 999999;
    else if (seasonData.experience !== undefined) seasonData.experience = 999999;
    else if (seasonData.seasonXP !== undefined) seasonData.seasonXP = 999999;
    
    createBackup('Max Season Level');
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    populateSeasonPassData();
    showToast('Season level maximized!');
}

function unlockAllSeasonRewards() {
    if (!currentData) {
        showToast('No season pass data found');
        return;
    }
    
    const seasonData = currentData.seasonPass || currentData.season || currentData;
    const rewards = seasonData.rewards || seasonData.tiers || [];
    
    rewards.forEach(reward => {
        reward.unlocked = true;
        if (reward.claimed !== undefined) reward.claimed = true;
    });
    
    createBackup('Unlock All Season Rewards');
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    populateSeasonRewards();
    showToast('All season rewards unlocked!');
}

function enablePremiumPass() {
    if (!currentData) {
        showToast('No season pass data found');
        return;
    }
    
    const seasonData = currentData.seasonPass || currentData.season || currentData;
    
    if (seasonData.premium !== undefined) seasonData.premium = true;
    else if (seasonData.isPremium !== undefined) seasonData.isPremium = true;
    else seasonData.premium = true;
    
    createBackup('Enable Premium Pass');
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    populateSeasonPassData();
    showToast('Premium pass enabled!');
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
    
    // Map field IDs to actual room property names (handle variations)
    const fieldMappings = {
        'roomName': ['name', 'Name'],
        'roomType': ['type', 'Type', 'roomType'],
        'roomLevel': ['level', 'Level', 'roomLevel'],
        'roomState': ['state', 'State', 'roomState'],
        'roomPower': ['power', 'Power', 'powerGeneration', 'power_generation'],
        'roomFood': ['food', 'Food', 'foodProduction', 'food_production'],
        'roomWater': ['water', 'Water', 'waterProduction', 'water_production'],
        'roomRadiation': ['radiation', 'Radiation', 'radiationLevel']
    };
    
    // Update title
    const roomTitle = document.getElementById('roomTitle');
    if (roomTitle) roomTitle.textContent = room.name || 'Room';
    
    // Populate form fields and enable/disable based on availability
    Object.entries(fieldMappings).forEach(([fieldId, propertyNames]) => {
        const input = document.getElementById(fieldId);
        if (!input) return;
        
        // Find which property name exists in the room object
        let foundValue = null;
        let hasProperty = false;
        
        for (const propName of propertyNames) {
            if (propName in room) {
                foundValue = room[propName];
                hasProperty = true;
                break;
            }
        }
        
        // Set value
        if (hasProperty && foundValue !== null && foundValue !== undefined) {
            input.value = foundValue;
        } else if (fieldId === 'roomLevel') {
            input.value = 1;
        } else if (fieldId === 'roomState') {
            input.value = 'built';
        } else {
            input.value = 0;
        }
        
        // Enable/disable based on field existence
        if (hasProperty) {
            input.disabled = false;
            input.classList.remove('field-unavailable');
            input.title = '';
        } else {
            input.disabled = true;
            input.classList.add('field-unavailable');
            input.title = 'This room does not have this property';
        }
    });
    
    // Show the form
    const roomDetails = document.getElementById('roomDetails');
    if (roomDetails) {
        roomDetails.style.display = 'block';
    }
    
    // Highlight selected room
    document.querySelectorAll('.room-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

function saveRoom() {
    if (currentRoomIndex === null || !currentData.vault.rooms[currentRoomIndex]) return;
    
    const room = currentData.vault.rooms[currentRoomIndex];
    
    // Update room properties - use the property names that exist in the room
    const updates = {
        name: document.getElementById('roomName').value,
        type: document.getElementById('roomType').value,
        level: parseInt(document.getElementById('roomLevel').value) || 1,
        state: document.getElementById('roomState').value,
        power: parseInt(document.getElementById('roomPower').value) || 0,
        food: parseInt(document.getElementById('roomFood').value) || 0,
        water: parseInt(document.getElementById('roomWater').value) || 0,
        radiation: parseInt(document.getElementById('roomRadiation').value) || 0
    };
    
    // Apply updates, preserving existing property names
    Object.entries(updates).forEach(([key, value]) => {
        // Update the property if it already exists, or add it
        if (key in room || key === 'name' || key === 'type' || key === 'level' || key === 'state') {
            room[key] = value;
        } else {
            // For production values, check if alternate property names exist
            const altNames = {
                'power': ['powerGeneration', 'power_generation'],
                'food': ['foodProduction', 'food_production'],
                'water': ['waterProduction', 'water_production'],
                'radiation': ['radiationLevel']
            };
            
            let updated = false;
            if (altNames[key]) {
                for (const altName of altNames[key]) {
                    if (altName in room) {
                        room[altName] = value;
                        updated = true;
                        break;
                    }
                }
            }
            if (!updated) {
                room[key] = value;
            }
        }
    });
    
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
    if (saveRoomBtn) saveRoomBtn.addEventListener('click', saveRoom);
    
    // Add back link listener for rooms
    document.addEventListener('click', (e) => {
        if (e.target.closest('#roomDetails .back-link')) {
            e.preventDefault();
            closeRoomEditor();
        }
    });
    
    // Initialize UI in disabled state
    disableEditorUI();
    populateDwellersList();
    populateRoomsList();
    
    console.log('Wasteland Editor Enhanced - Rustic Paper Edition loaded successfully');
    showToast('Wasteland Editor Ready');
});

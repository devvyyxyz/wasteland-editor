// Global state
let currentData = null;
let originalData = null;
let currentDweller = null;
let backups = [];
let changeHistory = [];
let originalFileName = null;

// DOM Elements
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const downloadBtn = document.getElementById('downloadBtn');
const formatBtn = document.getElementById('formatBtn');
const historyBtn = document.getElementById('historyBtn');
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
    historyBtn.addEventListener('click', showHistoryModal);
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

    // Inventory subtab listeners
    document.querySelectorAll('.inventory-subtab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchInventorySubtab(btn.dataset.subtab));
    });

    // Inventory search listeners
    const weaponSearch = document.getElementById('weaponSearch');
    const outfitSearch = document.getElementById('outfitSearch');
    const junkSearch = document.getElementById('junkSearch');
    
    if (weaponSearch) weaponSearch.addEventListener('input', (e) => filterInventory('weapons', e.target.value));
    if (outfitSearch) outfitSearch.addEventListener('input', (e) => filterInventory('outfits', e.target.value));
    if (junkSearch) junkSearch.addEventListener('input', (e) => filterInventory('junk', e.target.value));

    // Inventory add buttons
    const addWeaponBtn = document.getElementById('addWeaponBtn');
    const addOutfitBtn = document.getElementById('addOutfitBtn');
    const addJunkBtn = document.getElementById('addJunkBtn');
    
    if (addWeaponBtn) addWeaponBtn.addEventListener('click', () => addInventoryItem('weapon'));
    if (addOutfitBtn) addOutfitBtn.addEventListener('click', () => addInventoryItem('outfit'));
    if (addJunkBtn) addJunkBtn.addEventListener('click', () => addInventoryItem('junk'));

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
            // Store original filename
            originalFileName = file.name;
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
                historyBtn.disabled = false;
                clearBtn.disabled = false;
                
                // Track file load in history
                addToHistory('File Loaded', `Loaded ${file.name} (${formatFileSize(file.size)})`);
                
                // Populate selects with weapons and outfits
                populateSelects();
                
                jsonEditor.value = JSON.stringify(currentData, null, 2);
                updateFileSize();
                enableEditorUI();
                populateVaultData();
                populateItemData();
                populateDwellersList();
                populateRoomsList();
                populateWastelandTeams();
                populateInventory();
                populateSeasonPassData();
                populateVaultStats();
                
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
    
    // Reset all fields to defaults
    resetEditorFields();
}

function resetEditorFields() {
    // Reset vault fields
    const vaultFields = ['vaultName', 'caps', 'food', 'water', 'power', 'radaway', 'stimpacks', 'nukacola', 'nukaquantum',
                         'lunchboxCount', 'handyCount', 'petCarrierCount', 'starterPackCount'];
    vaultFields.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.value = id === 'vaultName' ? '' : '0';
    });
    
    // Reset dweller fields
    const dwellerFields = ['dwellerFirstName', 'dwellerLastName', 'dwellerLevel', 'dwellerExp',
                          'dwellerHealth', 'dwellerMaxHealth', 'dwellerHappiness', 'dwellerRadiation'];
    dwellerFields.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.value = '';
    });
    
    // Reset SPECIAL stats
    ['S', 'P', 'E', 'C', 'I', 'A', 'L'].forEach(stat => {
        const elem = document.getElementById(`stat-${stat.toLowerCase()}`);
        if (elem) elem.value = '1';
    });
    
    // Clear lists
    const dwellersList = document.getElementById('dwellersList');
    if (dwellersList) dwellersList.innerHTML = '';
    
    const roomsList = document.getElementById('roomsList');
    if (roomsList) roomsList.innerHTML = '';
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
    
    // Resources are stored at vault.storage.resources
    const storage = vault.storage?.resources || {};
    
    // Caps - stored as "Nuka" in the save file
    const capsElem = document.getElementById('caps');
    if (capsElem) capsElem.value = storage.Nuka || 0;
    
    const fields = {
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
    
    // Get dweller IDs that are exploring in wasteland teams
    const exploringDwellerIds = new Set();
    const wastelandTeams = currentData.wasteland?.teams || currentData.wasteland || [];
    wastelandTeams.forEach(team => {
        if (team.members && Array.isArray(team.members)) {
            team.members.forEach(member => {
                if (member && (member.id || member.dwellerId)) {
                    exploringDwellerIds.add(member.id || member.dwellerId);
                }
            });
        }
    });
    
    // Separate dwellers into in-vault and exploring
    const inVaultDwellers = [];
    const exploringDwellers = [];
    
    dwellers.forEach((dweller, index) => {
        if (exploringDwellerIds.has(dweller.id)) {
            exploringDwellers.push({ dweller, index });
        } else {
            inVaultDwellers.push({ dweller, index });
        }
    });
    
    // Add in-vault dwellers section
    if (inVaultDwellers.length > 0) {
        const inVaultHeader = document.createElement('div');
        inVaultHeader.className = 'dweller-section-header';
        inVaultHeader.textContent = `🏛️ IN VAULT (${inVaultDwellers.length})`;
        dwellersList.appendChild(inVaultHeader);
        
        inVaultDwellers.forEach(({ dweller, index }) => {
            const item = document.createElement('div');
            item.className = 'dweller-item in-vault';
            const level = dweller.experience?.currentLevel || 1;
            const health = dweller.health?.healthValue || dweller.health?.maxHealth || 100;
            item.textContent = `${dweller.name} (Lvl ${level} • HP: ${health})`;
            item.addEventListener('click', () => selectDweller(dweller, index));
            dwellersList.appendChild(item);
        });
    }
    
    // Add exploring dwellers section
    if (exploringDwellers.length > 0) {
        const exploringHeader = document.createElement('div');
        exploringHeader.className = 'dweller-section-header exploring';
        exploringHeader.textContent = `🌍 EXPLORING (${exploringDwellers.length})`;
        dwellersList.appendChild(exploringHeader);
        
        exploringDwellers.forEach(({ dweller, index }) => {
            const item = document.createElement('div');
            item.className = 'dweller-item exploring';
            const level = dweller.experience?.currentLevel || 1;
            const health = dweller.health?.healthValue || dweller.health?.maxHealth || 100;
            item.textContent = `${dweller.name} (Lvl ${level} • HP: ${health})`;
            item.addEventListener('click', () => selectDweller(dweller, index));
            dwellersList.appendChild(item);
        });
    }
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
    if (lastElem) lastElem.value = nameparts.slice(1).join(' ') || '';
    
    // Gender
    const genderElem = document.getElementById('dwellerGender');
    if (genderElem) genderElem.value = dweller.gender || 1;
    
    // Level and Experience (stored in experience object)
    const levelElem = document.getElementById('dwellerLevel');
    const expElem = document.getElementById('dwellerExp');
    if (levelElem) levelElem.value = dweller.experience?.currentLevel || 1;
    if (expElem) expElem.value = dweller.experience?.experienceValue || 0;
    
    // Health (stored in health object)
    const healthElem = document.getElementById('dwellerHealth');
    const maxHealthElem = document.getElementById('dwellerMaxHealth');
    const radiationElem = document.getElementById('dwellerRadiation');
    if (healthElem) healthElem.value = dweller.health?.healthValue || dweller.health?.maxHealth || 100;
    if (maxHealthElem) maxHealthElem.value = dweller.health?.maxHealth || 100;
    if (radiationElem) radiationElem.value = dweller.health?.radiationValue || 0;
    
    // Happiness (stored in happiness object)
    const happinessElem = document.getElementById('dwellerHappiness');
    if (happinessElem) happinessElem.value = Math.round((dweller.happiness?.happinessValue || 50));
    
    // Appearance
    const skinColorElem = document.getElementById('dwellerSkinColor');
    const hairColorElem = document.getElementById('dwellerHairColor');
    if (skinColorElem && dweller.skinColor) skinColorElem.value = dweller.skinColor;
    if (hairColorElem && dweller.hairColor) hairColorElem.value = dweller.hairColor;
    
    // Update SPECIAL stats - array of objects with {value, mod, exp}
    const statsArray = dweller.stats?.stats || [];
    const statIds = ['stat-s', 'stat-p', 'stat-e', 'stat-c', 'stat-i', 'stat-a', 'stat-l'];
    
    statIds.forEach((id, i) => {
        const elem = document.getElementById(id);
        if (elem) elem.value = statsArray[i]?.value || 1;
    });
    
    // Equipment
    const weaponElem = document.getElementById('dwellerWeapon');
    const outfitElem = document.getElementById('dwellerOutfit');
    if (weaponElem) weaponElem.value = dweller.equipedWeapon?.id || dweller.equippedWeapon?.id || '';
    if (outfitElem) outfitElem.value = dweller.equipedOutfit?.id || dweller.equippedOutfit?.id || '';
}

// Update Dweller Data
function updateDwellerData() {
    if (!currentDweller || !currentData) return;
    
    const dweller = currentDweller.data;
    const firstName = document.getElementById('dwellerFirstName')?.value || '';
    const lastName = document.getElementById('dwellerLastName')?.value || '';
    
    dweller.name = `${firstName} ${lastName}`.trim();
    
    // Gender
    const genderElem = document.getElementById('dwellerGender');
    if (genderElem) dweller.gender = parseInt(genderElem.value) || 1;
    
    // Level and Experience
    if (!dweller.experience) dweller.experience = {};
    const levelElem = document.getElementById('dwellerLevel');
    const expElem = document.getElementById('dwellerExp');
    if (levelElem) dweller.experience.currentLevel = parseInt(levelElem.value) || 1;
    if (expElem) dweller.experience.experienceValue = parseInt(expElem.value) || 0;
    
    // Health
    if (!dweller.health) dweller.health = {};
    const healthElem = document.getElementById('dwellerHealth');
    const maxHealthElem = document.getElementById('dwellerMaxHealth');
    const radiationElem = document.getElementById('dwellerRadiation');
    if (healthElem) dweller.health.healthValue = parseInt(healthElem.value) || 100;
    if (maxHealthElem) dweller.health.maxHealth = parseInt(maxHealthElem.value) || 100;
    if (radiationElem) dweller.health.radiationValue = parseInt(radiationElem.value) || 0;
    
    // Happiness
    if (!dweller.happiness) dweller.happiness = {};
    const happinessElem = document.getElementById('dwellerHappiness');
    if (happinessElem) dweller.happiness.happinessValue = parseInt(happinessElem.value) || 50;
    
    // Appearance
    const skinColorElem = document.getElementById('dwellerSkinColor');
    const hairColorElem = document.getElementById('dwellerHairColor');
    if (skinColorElem) dweller.skinColor = skinColorElem.value;
    if (hairColorElem) dweller.hairColor = hairColorElem.value;
    
    // SPECIAL stats - array of objects with {value, mod, exp}
    if (!dweller.stats) dweller.stats = {};
    if (!dweller.stats.stats) dweller.stats.stats = [];
    
    // Ensure we have at least 7 stat objects
    while (dweller.stats.stats.length < 7) {
        dweller.stats.stats.push({ value: 1, mod: 0, exp: 0 });
    }
    
    const statIds = ['stat-s', 'stat-p', 'stat-e', 'stat-c', 'stat-i', 'stat-a', 'stat-l'];
    statIds.forEach((id, i) => {
        const elem = document.getElementById(id);
        if (elem) {
            if (!dweller.stats.stats[i]) dweller.stats.stats[i] = { value: 1, mod: 0, exp: 0 };
            dweller.stats.stats[i].value = parseInt(elem.value) || 1;
        }
    });
    
    // Equipment (check both spellings: equiped and equipped)
    const weaponElem = document.getElementById('dwellerWeapon');
    const outfitElem = document.getElementById('dwellerOutfit');
    
    if (weaponElem && weaponElem.value) {
        if (!dweller.equipedWeapon) dweller.equipedWeapon = {};
        dweller.equipedWeapon.id = weaponElem.value;
        dweller.equipedWeapon.type = 'Weapon';
        // Also update if spelled correctly
        if (dweller.equippedWeapon) dweller.equippedWeapon.id = weaponElem.value;
    }
    
    if (outfitElem && outfitElem.value) {
        if (!dweller.equipedOutfit) dweller.equipedOutfit = {};
        dweller.equipedOutfit.id = outfitElem.value;
        dweller.equipedOutfit.type = 'Outfit';
        // Also update if spelled correctly
        if (dweller.equippedOutfit) dweller.equippedOutfit.id = outfitElem.value;
    }
    
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    const dwellerName = `${currentDweller.name || 'Unknown'}`;
    addToHistory('Dweller Updated', `Modified ${dwellerName}`);
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

// Inventory Functions
function switchInventorySubtab(subtab) {
    // Update subtab buttons
    document.querySelectorAll('.inventory-subtab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.subtab === subtab) btn.classList.add('active');
    });
    
    // Update subtab content
    document.querySelectorAll('.inventory-subtab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${subtab}-inventory`)?.classList.add('active');
}

function populateInventory() {
    if (!currentData) return;
    
    // Populate weapons
    populateWeapons();
    // Populate outfits
    populateOutfits();
    // Populate junk
    populateJunk();
}

function populateWeapons() {
    const weaponsList = document.getElementById('weaponsList');
    if (!weaponsList) return;
    
    weaponsList.innerHTML = '';
    
    const weapons = currentData.vault?.inventory?.items?.filter(item => item.type === 'Weapon') 
                    || currentData.inventory?.weapons 
                    || currentData.weapons 
                    || [];
    
    if (weapons.length === 0) {
        weaponsList.innerHTML = '<div class="empty-state">🔫 No weapons in storage<br><small>Add weapons to see them here</small></div>';
        return;
    }
    
    weapons.forEach((weapon, index) => {
        const item = createInventoryItem(weapon, index, 'weapon');
        weaponsList.appendChild(item);
    });
}

function populateOutfits() {
    const outfitsList = document.getElementById('outfitsList');
    if (!outfitsList) return;
    
    outfitsList.innerHTML = '';
    
    const outfits = currentData.vault?.inventory?.items?.filter(item => item.type === 'Outfit') 
                    || currentData.inventory?.outfits 
                    || currentData.outfits 
                    || [];
    
    if (outfits.length === 0) {
        outfitsList.innerHTML = '<div class="empty-state">👔 No outfits in storage<br><small>Add outfits to see them here</small></div>';
        return;
    }
    
    outfits.forEach((outfit, index) => {
        const item = createInventoryItem(outfit, index, 'outfit');
        outfitsList.appendChild(item);
    });
}

function populateJunk() {
    const junkList = document.getElementById('junkList');
    if (!junkList) return;
    
    junkList.innerHTML = '';
    
    const junk = currentData.vault?.inventory?.items?.filter(item => item.type === 'Junk') 
                || currentData.inventory?.junk 
                || currentData.junk 
                || [];
    
    if (junk.length === 0) {
        junkList.innerHTML = '<div class="empty-state">🔧 No junk in storage<br><small>Add junk items to see them here</small></div>';
        return;
    }
    
    junk.forEach((junkItem, index) => {
        const item = createInventoryItem(junkItem, index, 'junk');
        junkList.appendChild(item);
    });
}

function createInventoryItem(item, index, type) {
    const div = document.createElement('div');
    div.className = 'inventory-item';
    
    const itemName = item.name || item.id || `${type} ${index + 1}`;
    const itemType = item.type || type;
    const quantity = item.quantity || item.count || 1;
    
    let detailsHTML = '';
    
    if (type === 'weapon') {
        const damage = item.damage || item.damageValue || 0;
        const damageType = item.damageType || 'Normal';
        detailsHTML = `
            <div class="inventory-item-stat">
                <span>Damage:</span>
                <strong>${damage}</strong>
            </div>
            <div class="inventory-item-stat">
                <span>Type:</span>
                <strong>${damageType}</strong>
            </div>
        `;
    } else if (type === 'outfit') {
        const stats = item.stats || {};
        const bonusText = Object.entries(stats).map(([key, val]) => `${key}: +${val}`).join(', ') || 'No bonuses';
        detailsHTML = `
            <div class="inventory-item-stat">
                <span>Bonuses:</span>
                <strong>${bonusText}</strong>
            </div>
        `;
    } else if (type === 'junk') {
        const rarity = item.rarity || 'Common';
        detailsHTML = `
            <div class="inventory-item-stat">
                <span>Rarity:</span>
                <strong>${rarity}</strong>
            </div>
        `;
    }
    
    div.innerHTML = `
        <div class="inventory-item-header">
            <div class="inventory-item-name">${itemName}</div>
            <div class="inventory-item-type">${itemType}</div>
        </div>
        <div class="inventory-item-details">
            <div class="inventory-item-stat">
                <span>Quantity:</span>
                <strong>${quantity}</strong>
            </div>
            ${detailsHTML}
        </div>
        <div class="inventory-item-actions">
            <button class="btn btn-secondary" onclick="editInventoryItem(${index}, '${type}')">✏️ Edit</button>
            <button class="btn btn-secondary" onclick="deleteInventoryItem(${index}, '${type}')">🗑️ Delete</button>
        </div>
    `;
    
    return div;
}

function editInventoryItem(index, type) {
    let item;
    
    if (type === 'weapon') {
        const weapons = currentData.vault?.inventory?.items?.filter(i => i.type === 'Weapon') || currentData.inventory?.weapons || currentData.weapons || [];
        item = weapons[index];
    } else if (type === 'outfit') {
        const outfits = currentData.vault?.inventory?.items?.filter(i => i.type === 'Outfit') || currentData.inventory?.outfits || currentData.outfits || [];
        item = outfits[index];
    } else if (type === 'junk') {
        const junk = currentData.vault?.inventory?.items?.filter(i => i.type === 'Junk') || currentData.inventory?.junk || currentData.junk || [];
        item = junk[index];
    }
    
    if (!item) return;
    
    const newQuantity = prompt(`Enter new quantity for ${item.name || item.id || 'this item'}:`, item.quantity || item.count || 1);
    if (newQuantity === null) return;
    
    const qty = parseInt(newQuantity);
    if (isNaN(qty) || qty < 0) {
        showToast('Invalid quantity!');
        return;
    }
    
    if (item.quantity !== undefined) item.quantity = qty;
    else if (item.count !== undefined) item.count = qty;
    else item.quantity = qty;
    
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    populateInventory();
    showToast('Item updated!');
}

function deleteInventoryItem(index, type) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    if (type === 'weapon') {
        if (currentData.vault?.inventory?.items) {
            const weapons = currentData.vault.inventory.items.filter(i => i.type === 'Weapon');
            const item = weapons[index];
            const itemIndex = currentData.vault.inventory.items.indexOf(item);
            currentData.vault.inventory.items.splice(itemIndex, 1);
        } else if (currentData.inventory?.weapons) {
            currentData.inventory.weapons.splice(index, 1);
        } else if (currentData.weapons) {
            currentData.weapons.splice(index, 1);
        }
    } else if (type === 'outfit') {
        if (currentData.vault?.inventory?.items) {
            const outfits = currentData.vault.inventory.items.filter(i => i.type === 'Outfit');
            const item = outfits[index];
            const itemIndex = currentData.vault.inventory.items.indexOf(item);
            currentData.vault.inventory.items.splice(itemIndex, 1);
        } else if (currentData.inventory?.outfits) {
            currentData.inventory.outfits.splice(index, 1);
        } else if (currentData.outfits) {
            currentData.outfits.splice(index, 1);
        }
    } else if (type === 'junk') {
        if (currentData.vault?.inventory?.items) {
            const junk = currentData.vault.inventory.items.filter(i => i.type === 'Junk');
            const item = junk[index];
            const itemIndex = currentData.vault.inventory.items.indexOf(item);
            currentData.vault.inventory.items.splice(itemIndex, 1);
        } else if (currentData.inventory?.junk) {
            currentData.inventory.junk.splice(index, 1);
        } else if (currentData.junk) {
            currentData.junk.splice(index, 1);
        }
    }
    
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    populateInventory();
    showToast('Item deleted!');
}

let currentModalType = '';

function addInventoryItem(type) {
    currentModalType = type;
    const modal = document.getElementById('addInventoryModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalSelect = document.getElementById('modalItemSelect');
    const modalDamageRow = document.getElementById('modalDamageRow');
    
    // Set modal title
    modalTitle.textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    
    // Clear and populate select dropdown
    modalSelect.innerHTML = '<option value="">Choose...</option>';
    
    let items = {};
    if (type === 'weapon') {
        items = WEAPONS;
        modalDamageRow.style.display = 'none'; // Damage is predefined in weapon data
    } else if (type === 'outfit') {
        items = OUTFITS;
        modalDamageRow.style.display = 'none';
    } else if (type === 'junk') {
        items = JUNK;
        modalDamageRow.style.display = 'none';
    }
    
    // Populate dropdown with sorted items
    Object.entries(items).sort((a, b) => a[1].localeCompare(b[1])).forEach(([key, value]) => {
        if (key !== 'None' && key !== 'Fist') { // Skip "None" options
            const option = document.createElement('option');
            option.value = key;
            option.textContent = value;
            modalSelect.appendChild(option);
        }
    });
    
    // Reset quantity
    document.getElementById('modalQuantity').value = 1;
    
    // Show modal
    modal.classList.add('active');
}

function closeInventoryModal() {
    const modal = document.getElementById('addInventoryModal');
    modal.classList.remove('active');
    currentModalType = '';
}

function confirmAddInventoryItem() {
    const modalSelect = document.getElementById('modalItemSelect');
    const quantity = parseInt(document.getElementById('modalQuantity').value) || 1;
    
    if (!modalSelect.value) {
        showToast('Please select an item!');
        return;
    }
    
    if (quantity < 1) {
        showToast('Invalid quantity!');
        return;
    }
    
    const itemId = modalSelect.value;
    const itemName = modalSelect.options[modalSelect.selectedIndex].text;
    
    const newItem = {
        id: itemId,
        name: itemName,
        type: currentModalType === 'weapon' ? 'Weapon' : currentModalType === 'outfit' ? 'Outfit' : 'Junk',
        quantity: quantity
    };
    
    if (currentModalType === 'weapon') {
        // Set default damage based on weapon type
        newItem.damage = 10;
        newItem.damageType = 'Normal';
    } else if (currentModalType === 'outfit') {
        newItem.stats = {};
    }
    
    // Add to appropriate array
    if (!currentData.vault) currentData.vault = {};
    if (!currentData.vault.inventory) currentData.vault.inventory = {};
    if (!currentData.vault.inventory.items) currentData.vault.inventory.items = [];
    
    currentData.vault.inventory.items.push(newItem);
    
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    populateInventory();
    showToast(`${itemName} added!`);
    
    closeInventoryModal();
}

function filterInventory(type, searchTerm) {
    const items = document.querySelectorAll(`#${type}-inventory .inventory-item`);
    const term = searchTerm.toLowerCase();
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(term) ? 'flex' : 'none';
    });
}

// Update Vault Data
function updateVaultData() {
    if (!currentData || !currentData.vault) return;
    
    const vault = currentData.vault;
    vault.VaultName = document.getElementById('vaultName')?.value || '';
    
    if (!vault.storage) vault.storage = {};
    if (!vault.storage.resources) vault.storage.resources = {};
    
    // Caps - save as "Nuka"
    const capsElem = document.getElementById('caps');
    if (capsElem) vault.storage.resources.Nuka = parseInt(capsElem.value) || 0;
    
    const fields = {
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
    addToHistory('Vault Updated', 'Modified vault settings and resources');
}

// Populate Item Data
function populateItemData() {
    if (!currentData || !currentData.vault) {
        // Reset to zero if no data
        ['lunchboxCount', 'handyCount', 'petCarrierCount', 'starterPackCount'].forEach(id => {
            const elem = document.getElementById(id);
            if (elem) elem.value = '0';
        });
        return;
    }
    
    const items = currentData.vault.inventory?.items || [];
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
    if (!currentData || !currentData.vault) return;
    
    // Ensure vault.inventory.items array exists
    if (!currentData.vault.inventory) currentData.vault.inventory = {};
    if (!currentData.vault.inventory.items) currentData.vault.inventory.items = [];
    
    // Get new values from inputs
    const lunchboxCount = parseInt(document.getElementById('lunchboxCount')?.value) || 0;
    const handyCount = parseInt(document.getElementById('handyCount')?.value) || 0;
    const petCarrierCount = parseInt(document.getElementById('petCarrierCount')?.value) || 0;
    const starterPackCount = parseInt(document.getElementById('starterPackCount')?.value) || 0;
    
    // Remove existing special items
    currentData.vault.inventory.items = currentData.vault.inventory.items.filter(item => {
        const id = item.id || '';
        return !id.includes('Lunchbox') && !id.includes('Handy') && !id.includes('Pet') && !id.includes('Starter');
    });
    
    // Add lunchboxes
    if (lunchboxCount > 0) {
        currentData.vault.inventory.items.push({
            id: 'Lunchbox',
            type: 'Lunchbox',
            quantity: lunchboxCount
        });
    }
    
    // Add Mr. Handies
    if (handyCount > 0) {
        currentData.vault.inventory.items.push({
            id: 'HandyMan',
            type: 'HandyMan',
            quantity: handyCount
        });
    }
    
    // Add Pet Carriers
    if (petCarrierCount > 0) {
        currentData.vault.inventory.items.push({
            id: 'PetCarrier',
            type: 'PetCarrier',
            quantity: petCarrierCount
        });
    }
    
    // Add Starter Packs
    if (starterPackCount > 0) {
        currentData.vault.inventory.items.push({
            id: 'StarterPack',
            type: 'StarterPack',
            quantity: starterPackCount
        });
    }
    
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    addToHistory('Items Updated', 'Modified special item counts');
}

// Batch Operations - Max All Dweller Stats
function maxAllDwellerStats() {
    if (!currentData || !currentData.dwellers) {
        showToast('No dwellers data found');
        return;
    }
    
    const dwellers = currentData.dwellers.dwellers || [];
    if (dwellers.length === 0) {
        showToast('No dwellers in vault');
        return;
    }
    
    let count = 0;
    dwellers.forEach(dweller => {
        // Update level
        if (!dweller.experience) dweller.experience = {};
        dweller.experience.currentLevel = 50;
        dweller.experience.experienceValue = 999999;
        
        // Update SPECIAL stats - array of 7 stat objects
        if (!dweller.stats) dweller.stats = {};
        if (!dweller.stats.stats) dweller.stats.stats = [];
        
        // Ensure we have 7 stats
        for (let i = 0; i < 7; i++) {
            if (!dweller.stats.stats[i]) {
                dweller.stats.stats[i] = { value: 10, mod: 0, exp: 999999 };
            } else {
                dweller.stats.stats[i].value = 10;
                dweller.stats.stats[i].exp = 999999;
            }
        }
        count++;
    });
    
    createBackup('Max All Stats');
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    populateDwellersList();
    showToast(`Maxed stats for ${count} dwellers!`);
}

// Max All Happiness
function maxAllHappiness() {
    if (!currentData || !currentData.dwellers) {
        showToast('No dwellers data found');
        return;
    }
    
    const dwellers = currentData.dwellers.dwellers || [];
    if (dwellers.length === 0) {
        showToast('No dwellers in vault');
        return;
    }
    
    let count = 0;
    dwellers.forEach(dweller => {
        if (!dweller.happiness) dweller.happiness = {};
        dweller.happiness.happinessValue = 100;
        count++;
    });
    
    createBackup('Max Happiness');
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    populateDwellersList();
    showToast(`Maxed happiness for ${count} dwellers!`);
}

// Heal All Dwellers
function healAllDwellers() {
    if (!currentData || !currentData.dwellers) {
        showToast('No dwellers data found');
        return;
    }
    
    const dwellers = currentData.dwellers.dwellers || [];
    if (dwellers.length === 0) {
        showToast('No dwellers in vault');
        return;
    }
    
    let count = 0;
    dwellers.forEach(dweller => {
        if (!dweller.health) dweller.health = {};
        const maxHealth = dweller.health.maxHealth || 105;
        dweller.health.healthValue = maxHealth;
        dweller.health.radiationValue = 0;
        count++;
    });
    
    createBackup('Heal All');
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    populateDwellersList();
    showToast(`Healed ${count} dwellers!`);
}

// Unlock All Rooms
function unlockAllRooms() {
    if (!currentData || !currentData.vault) {
        showToast('No vault data found');
        return;
    }
    
    const rooms = currentData.vault.rooms || [];
    if (rooms.length === 0) {
        showToast('No rooms in vault');
        return;
    }
    
    let count = 0;
    rooms.forEach(room => {
        if (room.currentStateName) room.currentStateName = 'Idle';
        if (room.rushTask !== undefined) room.rushTask = -1;
        if (room.level && room.level < 3) {
            room.level = 3;
            count++;
        }
    });
    
    createBackup('Unlock Rooms');
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    populateRoomsList();
    showToast(`Upgraded ${count} rooms to level 3!`);
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
    if (rooms.length === 0) {
        showToast('No rooms in vault');
        return;
    }
    
    let count = 0;
    rooms.forEach(room => {
        if (room.emergencyDone === false) {
            room.emergencyDone = true;
            count++;
        }
        // Also reset to Idle state
        if (room.currentStateName && room.currentStateName !== 'Idle') {
            room.currentStateName = 'Idle';
        }
    });
    
    createBackup('Clear Emergencies');
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    populateRoomsList();
    showToast(count > 0 ? `Cleared ${count} emergencies!` : 'No emergencies found');
}

// Unlock All Themes
function unlockAllThemes() {
    if (!currentData) {
        showToast('No data found');
        return;
    }
    
    let count = 0;
    if (currentData.specialTheme) {
        Object.keys(currentData.specialTheme).forEach(key => {
            if (typeof currentData.specialTheme[key] === 'boolean' && !currentData.specialTheme[key]) {
                currentData.specialTheme[key] = true;
                count++;
            }
        });
    }
    
    createBackup('Unlock Themes');
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    showToast(count > 0 ? `Unlocked ${count} themes!` : 'All themes already unlocked!');
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
    
    // Validate save file integrity
    const validation = validateSaveFile(currentData);
    if (!validation.valid) {
        const proceed = confirm(`⚠️ Save file validation warnings:\n\n${validation.warnings.join('\n')}\n\nDo you want to download anyway?`);
        if (!proceed) return;
    }
    
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
            // Use original filename with .sav extension
            const baseName = originalFileName?.replace(/\.[^/.]+$/, '') || `Vault${Math.floor(Math.random() * 1000)}`;
            link.download = `${baseName}.sav`;
            link.click();
            URL.revokeObjectURL(url);
            addToHistory('Download', 'Downloaded encrypted .sav file');
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
        // Use original filename with .json extension
        const baseName = originalFileName?.replace(/\.[^/.]+$/, '') || `fallout-shelter-save-${Date.now()}`;
        link.download = `${baseName}.json`;
        link.click();
        URL.revokeObjectURL(url);
        addToHistory('Download', 'Downloaded plain .json file');
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
        originalFileName = null;
        currentDweller = null;
        backups = [];
        changeHistory = [];
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
        radiation: parseInt(document.getElementById('roomRadiation').value) || 0,
        rushTimer: parseInt(document.getElementById('roomRushTimer').value) || 0,
        mergeSize: parseInt(document.getElementById('roomMergeSize').value) || 1
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
                'radiation': ['radiationLevel'],
                'rushTimer': ['rushCooldown', 'rush_timer'],
                'mergeSize': ['merge', 'mergedRooms']
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

// Fix Invalid Dweller Stats
function fixInvalidDwellerStats() {
    if (!currentData || !currentData.dwellers?.dwellers) return;
    
    let fixed = 0;
    currentData.dwellers.dwellers.forEach(dweller => {
        // Ensure stats object exists
        if (!dweller.stats) dweller.stats = {};
        
        // Ensure stats.stats array exists and has 7 elements
        if (!dweller.stats.stats || !Array.isArray(dweller.stats.stats)) {
            dweller.stats.stats = [];
        }
        
        // Ensure we have exactly 7 stats
        while (dweller.stats.stats.length < 7) {
            dweller.stats.stats.push({ value: 1, mod: 0, exp: 0 });
            fixed++;
        }
        
        // Trim if somehow we have more than 7
        if (dweller.stats.stats.length > 7) {
            dweller.stats.stats = dweller.stats.stats.slice(0, 7);
            fixed++;
        }
        
        // Ensure each stat has proper structure
        dweller.stats.stats.forEach((stat, idx) => {
            if (!stat || typeof stat !== 'object') {
                dweller.stats.stats[idx] = { value: 1, mod: 0, exp: 0 };
                fixed++;
            } else {
                if (typeof stat.value !== 'number' || stat.value < 1 || stat.value > 10) {
                    stat.value = Math.max(1, Math.min(10, stat.value || 1));
                    fixed++;
                }
                if (typeof stat.mod !== 'number') stat.mod = 0;
                if (typeof stat.exp !== 'number') stat.exp = 0;
            }
        });
    });
    
    if (fixed > 0) {
        addToHistory('Auto-Fix', `Fixed ${fixed} invalid SPECIAL stats`);
        showToast(`⚙️ Fixed ${fixed} invalid SPECIAL stats`);
    }
}

// Populate Vault Statistics
function populateVaultStats() {
    const statsNoData = document.getElementById('statsNoData');
    const statsGrid = document.getElementById('statsGridContainer');
    
    if (!currentData) {
        if (statsNoData) statsNoData.style.display = 'flex';
        if (statsGrid) statsGrid.style.display = 'none';
        return;
    }
    
    // Hide no-data message and show stats
    if (statsNoData) statsNoData.style.display = 'none';
    if (statsGrid) statsGrid.style.display = 'grid';

    const vault = currentData.vault || {};
    const dwellers = currentData.dwellers?.dwellers || [];
    const rooms = vault.rooms || [];
    const inventory = vault.inventory || {};

    // Population Stats
    const totalDwellers = dwellers.length;
    const avgLevel = totalDwellers > 0 ? (dwellers.reduce((sum, d) => sum + (d.experience?.currentLevel || 1), 0) / totalDwellers).toFixed(1) : 0;
    const maxLevelDwellers = dwellers.filter(d => (d.experience?.currentLevel || 1) >= 50).length;
    const avgHappiness = totalDwellers > 0 ? (dwellers.reduce((sum, d) => sum + (d.happiness?.happinessValue || 100), 0) / totalDwellers).toFixed(1) : 0;

    document.getElementById('statTotalDwellers').textContent = totalDwellers;
    document.getElementById('statAvgLevel').textContent = avgLevel;
    document.getElementById('statMaxLevelDwellers').textContent = maxLevelDwellers;
    document.getElementById('statAvgHappiness').textContent = avgHappiness + '%';

    // Resource Stats
    const resources = vault.storage?.resources || {};
    document.getElementById('statTotalCaps').textContent = (resources.Nuka || 0).toLocaleString();
    document.getElementById('statFood').textContent = (resources.Food || 0).toLocaleString();
    document.getElementById('statWater').textContent = (resources.Water || 0).toLocaleString();
    document.getElementById('statPower').textContent = (resources.Energy || 0).toLocaleString();
    document.getElementById('statTotalRooms').textContent = rooms.length;

    // Equipment Stats
    const weapons = inventory.items?.filter(i => i.type === 'Weapon') || [];
    const outfits = inventory.items?.filter(i => i.type === 'Outfit') || [];
    const junk = inventory.items?.filter(i => i.type === 'Junk') || [];
    const equippedDwellers = dwellers.filter(d => d.equipedWeapon?.id || d.equipedOutfit?.id).length;

    document.getElementById('statTotalWeapons').textContent = weapons.reduce((sum, w) => sum + (w.quantity || 1), 0);
    document.getElementById('statTotalOutfits').textContent = outfits.reduce((sum, o) => sum + (o.quantity || 1), 0);
    document.getElementById('statTotalJunk').textContent = junk.reduce((sum, j) => sum + (j.quantity || 1), 0);
    document.getElementById('statEquippedDwellers').textContent = equippedDwellers;

    // SPECIAL Stats
    const specialStats = { S: 0, P: 0, E: 0, C: 0, I: 0, A: 0, L: 0 };
    if (totalDwellers > 0) {
        dwellers.forEach(dweller => {
            const stats = dweller.stats?.stats || [];
            if (stats.length >= 7) {
                specialStats.S += stats[0]?.value || 1;
                specialStats.P += stats[1]?.value || 1;
                specialStats.E += stats[2]?.value || 1;
                specialStats.C += stats[3]?.value || 1;
                specialStats.I += stats[4]?.value || 1;
                specialStats.A += stats[5]?.value || 1;
                specialStats.L += stats[6]?.value || 1;
            }
        });
        Object.keys(specialStats).forEach(key => {
            specialStats[key] = (specialStats[key] / totalDwellers).toFixed(1);
        });
    }

    document.getElementById('statAvgS').textContent = specialStats.S;
    document.getElementById('statAvgP').textContent = specialStats.P;
    document.getElementById('statAvgE').textContent = specialStats.E;
    document.getElementById('statAvgC').textContent = specialStats.C;
    document.getElementById('statAvgI').textContent = specialStats.I;
    document.getElementById('statAvgA').textContent = specialStats.A;
    document.getElementById('statAvgL').textContent = specialStats.L;

    // Health Stats
    const avgHealth = totalDwellers > 0 ? (dwellers.reduce((sum, d) => sum + (d.health?.healthValue || 0), 0) / totalDwellers).toFixed(1) : 0;
    const totalRadiation = dwellers.reduce((sum, d) => sum + (d.health?.radiationValue || 0), 0);
    const irradiatedDwellers = dwellers.filter(d => (d.health?.radiationValue || 0) > 0).length;
    const injuredDwellers = dwellers.filter(d => (d.health?.healthValue || 0) < (d.health?.maxHealth || 100)).length;

    document.getElementById('statAvgHealth').textContent = avgHealth;
    document.getElementById('statTotalRadiation').textContent = totalRadiation.toFixed(1);
    document.getElementById('statIrradiatedDwellers').textContent = irradiatedDwellers;
    document.getElementById('statInjuredDwellers').textContent = injuredDwellers;

    // Vault Info
    document.getElementById('statVaultName').textContent = vault.VaultName || '-';
    document.getElementById('statVaultNumber').textContent = vault.VaultMode || '-';
    
    const unlockedThemes = vault.LunchBoxesByType?.filter(t => t.IsPurchased)?.length || 0;
    const unlockedRecipes = vault.UnlockedRecipes?.length || 0;
    
    document.getElementById('statUnlockedThemes').textContent = unlockedThemes;
    document.getElementById('statUnlockedRecipes').textContent = unlockedRecipes;
}

// Validate Save File
function validateSaveFile(data) {
    const warnings = [];
    let valid = true;
    
    // Check basic structure
    if (!data.vault) {
        warnings.push('Missing vault object');
        valid = false;
    }
    if (!data.dwellers) {
        warnings.push('Missing dwellers object');
        valid = false;
    }
    
    // Check vault structure
    if (data.vault) {
        if (!data.vault.storage?.resources) {
            warnings.push('Missing vault.storage.resources');
        }
        if (!data.vault.rooms) {
            warnings.push('Missing vault.rooms array');
        }
    }
    
    // Check dwellers structure (without auto-fixing)
    if (data.dwellers?.dwellers) {
        const dwellers = data.dwellers.dwellers;
        const invalidDwellers = dwellers.filter(d => !d.stats?.stats || d.stats.stats.length !== 7);
        if (invalidDwellers.length > 0) {
            warnings.push(`${invalidDwellers.length} dwellers have invalid SPECIAL stats`);
        }
    }
    
    return { valid: warnings.length === 0, warnings };
}

// Add to Change History
function addToHistory(action, details) {
    const entry = {
        action,
        details,
        timestamp: new Date().toLocaleString()
    };
    changeHistory.unshift(entry); // Add to beginning
    if (changeHistory.length > 100) changeHistory.pop(); // Keep last 100
}

// Show History Modal
function showHistoryModal() {
    const modal = document.getElementById('historyModal');
    const historyList = document.getElementById('historyList');
    
    if (!modal || !historyList) return;
    
    if (changeHistory.length === 0) {
        historyList.innerHTML = '<div class="no-data-message"><p>No changes recorded yet</p></div>';
    } else {
        historyList.innerHTML = changeHistory.map(entry => `
            <div class="history-item">
                <div class="history-item-header">
                    <span class="history-item-action">${entry.action}</span>
                    <span class="history-item-time">${entry.timestamp}</span>
                </div>
                <div class="history-item-details">${entry.details}</div>
            </div>
        `).join('');
    }
    
    modal.style.display = 'flex';
}

// Close History Modal
function closeHistoryModal() {
    const modal = document.getElementById('historyModal');
    if (modal) modal.style.display = 'none';
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

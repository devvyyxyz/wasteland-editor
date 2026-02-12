// Global state
let currentData = null;
let originalData = null;
let currentDweller = null;
let backups = [];
let changeHistory = [];
let originalFileName = null;
let seasonPassFileName = null;
let originalFieldValues = {}; // Track original values from save file

// Guides organized into sections. Each section has `id`, `title`, and `guides` array.
const GUIDE_SECTIONS = [
    {
        id: 'getting-started',
        title: 'Getting Started',
        guides: [
            {
                id: 'intro',
                title: 'Introduction & UI Overview',
                videoUrl: '',
                content: `
                    <p>Welcome to Wasteland Editor. This walkthrough explains the main UI areas: file upload, tabs for Vault/Dwellers/Rooms, and the Raw JSON editor. Start by uploading a save file using the <strong>Upload Save File</strong> control.</p>
                    <ul>
                        <li><strong>Upload</strong>: Supports .sav, .dat, .json files.</li>
                        <li><strong>Tabs</strong>: Switch between Vault, Dwellers, Rooms, Inventory and more.</li>
                        <li><strong>Backups</strong>: The editor creates automatic backups—use them if you need to revert changes.</li>
                    </ul>
                `
            },
            {
                id: 'backup-restore',
                title: 'Backup & Restore Best Practices',
                videoUrl: '',
                content: `
                    <p>Before making any edits, create a copy of your original save file and use the editor's backup functionality. This guide explains how to create and restore backups safely.</p>
                    <ol>
                        <li>Download a local copy of your save file.</li>
                        <li>Use the editor's <em>Create Backup</em> or rely on automatic snapshots.</li>
                        <li>If something goes wrong, use <em>Restore Backup</em> to revert.</li>
                    </ol>
                `
            }
        ]
    },
    {
        id: 'dwellers',
        title: 'Dwellers',
        guides: [
            {
                id: 'edit-dwellers',
                title: 'Edit Names, Stats & Level',
                videoUrl: '',
                content: `
                    <p>This guide covers safely changing dweller attributes: first/last name, S.P.E.C.I.A.L. stats, level and experience. Always check the <strong>Serialize ID</strong> field before creating new dwellers.</p>
                    <p>Tip: Use <strong>Max All Stats</strong> sparingly—it changes gameplay progression.</p>
                `
            },
            {
                id: 'equipment-outfits',
                title: 'Weapons, Outfits & Inventory',
                videoUrl: '',
                content: `
                    <p>Assign weapons and outfits via the dweller panel or the inventory tab. Removing or adding items directly modifies the vault inventory array.</p>
                    <p>Note: The game stores items as individual entries—there is no quantity field.</p>
                `
            },
            {
                id: 'relationships',
                title: 'Relationships & Babies',
                videoUrl: '',
                content: `
                    <p>Manage relationships by editing partner IDs and pregnancy flags. Incorrect values may produce unexpected game behavior—always back up first.</p>
                `
            }
        ]
    },
    {
        id: 'rooms',
        title: 'Rooms & Vault Layout',
        guides: [
            {
                id: 'upgrade-rooms',
                title: 'Upgrading and Unlocking Rooms',
                videoUrl: '',
                content: `
                    <p>This guide explains how room tiers and unlock flags are represented in the save file. Use the <strong>Unlock All Rooms</strong> bulk action to set unlock flags across your vault.</p>
                `
            },
            {
                id: 'bulk-actions',
                title: 'Bulk Actions & Safety',
                videoUrl: '',
                content: `
                    <p>Bulk actions can corrupt saves if used without care. Always keep a backup and apply one action at a time to verify results.</p>
                `
            }
        ]
    },
    {
        id: 'inventory',
        title: 'Inventory',
        guides: [
            {
                id: 'add-remove-items',
                title: 'Add / Remove Items Safely',
                videoUrl: '',
                content: `
                    <p>Use the Add Item modal to append new items. When removing items, verify the correct item instance is removed to avoid unintended deletions.</p>
                `
            },
            {
                id: 'equip-weapons',
                title: 'Equip Items to Dwellers',
                videoUrl: '',
                content: `
                    <p>Assign equipment via the dweller panel to ensure references and indices remain consistent. For large-scale changes, prefer exporting, editing, and re-importing as JSON.</p>
                `
            }
        ]
    },
    {
        id: 'wasteland',
        title: 'Wasteland',
        guides: [
            {
                id: 'teams',
                title: 'Managing Wasteland Teams',
                videoUrl: '',
                content: `
                    <p>This guide explains how to create, save, and recall wasteland teams. You can max team resources or recall teams back to the vault safely.</p>
                `
            },
            {
                id: 'resources',
                title: 'Maximizing Team Resources',
                videoUrl: '',
                content: `
                    <p>Optimize team compositions to increase resource yields. The editor allows you to tweak team stats and carried resources directly.</p>
                `
            }
        ]
    },
    {
        id: 'season-pass',
        title: 'Season Pass',
        guides: [
            {
                id: 'season-overview',
                title: 'Season Pass Editor Overview',
                videoUrl: '',
                content: `
                    <p>The season pass contains level, tokens, and reward unlock flags. Modifying these values can violate service terms—use the download warning modal before exporting.</p>
                `
            }
        ]
    },
    {
        id: 'advanced',
        title: 'Advanced / Raw JSON',
        guides: [
            {
                id: 'raw-json',
                title: 'Using the Raw JSON Editor',
                videoUrl: '',
                content: `
                    <p>The Raw JSON editor exposes the entire save file. Make minimal changes and validate JSON syntax before saving. Use the Format JSON button to pretty-print content.</p>
                `
            },
            {
                id: 'history',
                title: 'Change History & Backups',
                videoUrl: '',
                content: `
                    <p>Review the change history panel to inspect edits and restore previous backups if needed. The editor maintains up to 10 backups automatically.</p>
                `
            }
        ]
    },
    {
        id: 'safety',
        title: 'Safety & Legal',
        guides: [
            {
                id: 'legal',
                title: 'Legal Disclaimer & Best Practices',
                videoUrl: '',
                content: `
                    <p>Modifying save files can violate Terms of Service. This tool is for educational purposes. Always keep backups and do not use modified files in competitive or online contexts.</p>
                `
            }
        ]
    }
];

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
        if (elem) {
            elem.addEventListener('change', updateVaultData);
            elem.addEventListener('input', () => trackFieldChange(id));
        }
    });

    ['lunchboxCount', 'handyCount', 'petCarrierCount', 'starterPackCount'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.addEventListener('change', updateItemCounts);
            elem.addEventListener('input', () => trackFieldChange(id));
        }
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
    ['currentLevel', 'currentTokens', 'schemaVersion', 'isPremium', 'isPremiumPlus', 'maxRankAchieved', 'battlepassWindowLevel'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.addEventListener('change', updateSeasonPassData);
    });
    
    // Special listener for currentSeason to switch seasons and refresh form
    const currentSeasonElem = document.getElementById('currentSeason');
    if (currentSeasonElem) {
        currentSeasonElem.addEventListener('change', (e) => {
            if (currentData) {
                currentData.currentSeason = e.target.value;
                populateSeasonPassData(); // Refresh all season-specific fields
                updateSeasonPassData(); // Update JSON
            }
        });
    }
    
    const maxSeasonLevelBtn = document.getElementById('maxSeasonLevelBtn');
    const unlockAllRewardsBtn = document.getElementById('unlockAllRewardsBtn');
    const enablePremiumBtn = document.getElementById('enablePremiumBtn');
    const downloadSeasonPassBtn = document.getElementById('downloadSeasonPassBtn');
    
    if (maxSeasonLevelBtn) maxSeasonLevelBtn.addEventListener('click', maxSeasonLevel);
    if (unlockAllRewardsBtn) unlockAllRewardsBtn.addEventListener('click', unlockAllSeasonRewards);
    if (enablePremiumBtn) enablePremiumBtn.addEventListener('click', enablePremiumPass);
    if (downloadSeasonPassBtn) downloadSeasonPassBtn.addEventListener('click', downloadSeasonPass);

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

    // Guides search listener
    const guideSearch = document.getElementById('guideSearch');
    if (guideSearch) guideSearch.addEventListener('input', debounce((e) => filterGuides(e.target.value), 200));

    // Inventory add buttons
    const addWeaponBtn = document.getElementById('addWeaponBtn');
    const addOutfitBtn = document.getElementById('addOutfitBtn');
    const addJunkBtn = document.getElementById('addJunkBtn');
    
    if (addWeaponBtn) addWeaponBtn.addEventListener('click', () => addInventoryItem('weapon'));
    if (addOutfitBtn) addOutfitBtn.addEventListener('click', () => addInventoryItem('outfit'));
    if (addJunkBtn) addJunkBtn.addEventListener('click', () => addInventoryItem('junk'));

    // Dweller panel listeners
    ['dwellerFirstName', 'dwellerLastName', 'dwellerGender', 'dwellerLevel', 'dwellerExp',
     'dwellerHealth', 'dwellerHappiness', 'dwellerSkinColor', 'dwellerHairColor', 'dwellerHairStyle',
     'dwellerOutfit', 'dwellerWeapon', 'dwellerMaxHealth', 'dwellerRadiation', 'dwellerRarity',
     'dwellerSavedRoom', 'dwellerPregnant', 'dwellerBabyReady', 'dwellerPartner'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.addEventListener('change', updateDwellerData);
            elem.addEventListener('input', () => trackFieldChange(id));
        }
    });

    document.getElementById('dwellerSearch')?.addEventListener('input', debounce(filterDwellers, 300));
    document.getElementById('dwellerSort')?.addEventListener('change', populateDwellersList);
    document.getElementById('dwellerSortOrder')?.addEventListener('click', toggleDwellerSortOrder);
    document.getElementById('maxStatsBtn')?.addEventListener('click', maxDwellerStats);
    document.getElementById('saveDwellerBtn')?.addEventListener('click', saveDwellerChanges);

    document.querySelectorAll('.stat-item input').forEach(input => {
        input.addEventListener('change', updateDwellerData);
        input.addEventListener('input', (e) => trackFieldChange(e.target.id));
    });

    // Back link
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('back-link')) {
            e.preventDefault();
            const dwellersList = document.getElementById('dwellersList');
            const dwellerDetailsEmptyState = document.getElementById('dwellerDetailsEmptyState');
            const dwellerDetailsContent = document.getElementById('dwellerDetailsContent');
            if (dwellersList) dwellersList.style.display = 'block';
            if (dwellerDetailsEmptyState) dwellerDetailsEmptyState.style.display = 'flex';
            if (dwellerDetailsContent) dwellerDetailsContent.style.display = 'none';
            currentDweller = null;
        }
    });
    // Also handle generic guide back-links
    document.addEventListener('click', (e) => {
        if (e.target.classList && e.target.classList.contains('back-link')) {
            const guideDetailsContent = document.getElementById('guideDetailsContent');
            const guideDetailsEmptyState = document.getElementById('guideDetailsEmptyState');
            if (guideDetailsContent) guideDetailsContent.style.display = 'none';
            if (guideDetailsEmptyState) guideDetailsEmptyState.style.display = 'flex';
        }
    });
    // Render guides list (populates Guides tab)
    renderGuidesList();
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
            
            // Check if this is a season pass file (spd.dat or has seasonPassData structure)
            const isSPDFile = fileName.includes('spd');
            
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
                
                fileInfo.textContent = `Loaded: ${file.name} (${formatFileSize(file.size)})`;
                errorMessage.textContent = '';
                downloadBtn.disabled = false;
                formatBtn.disabled = false;
                historyBtn.disabled = false;
                clearBtn.disabled = false;
                
                // Track file load in history
                addToHistory('File Loaded', `Loaded ${file.name} (${formatFileSize(file.size)})`);
                
                populateSelects();
                populateSeasonSelector();
                
                // Set seasonPassFileName if this is a season pass file
                if (isSPDFile && currentData.seasonsData) {
                    seasonPassFileName = file.name;
                }
                
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
                
                // Show content, hide empty states
                showWastelandContent();
                showInventoryContent();
                showDwellersContent();
                showRoomsContent();
                
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

// Populate season selector dropdown
function populateSeasonSelector() {
    const seasonSelect = document.getElementById('currentSeason');
    if (!seasonSelect || !currentData || !currentData.seasonsData) return;
    
    // Store current selection
    const currentSelection = seasonSelect.value;
    
    // Clear and rebuild options
    seasonSelect.innerHTML = '';
    
    const seasons = Object.keys(currentData.seasonsData || {});
    if (seasons.length === 0) {
        seasonSelect.innerHTML = '<option value="">No seasons found</option>';
        return;
    }
    
    seasons.forEach(season => {
        const option = document.createElement('option');
        option.value = season;
        option.textContent = season;
        seasonSelect.appendChild(option);
    });
    
    // Set to current season or first season
    const defaultSeason = currentData.currentSeason || seasons[0];
    seasonSelect.value = defaultSeason;
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
    
    // Hide wasteland and inventory content
    const wastelandContent = document.getElementById('wastelandContent');
    const inventoryContent = document.getElementById('inventoryContent');
    const dwellersList = document.getElementById('dwellersList');
    const roomsList = document.getElementById('roomsList');
    
    const wastelandEmptyState = document.getElementById('wastelandEmptyState');
    const inventoryEmptyState = document.getElementById('inventoryEmptyState');
    const dwellersEmptyState = document.getElementById('dwellersEmptyState');
    const roomsEmptyState = document.getElementById('roomsEmptyState');
    
    if (wastelandContent) wastelandContent.style.display = 'none';
    if (inventoryContent) inventoryContent.style.display = 'none';
    if (dwellersList) dwellersList.style.display = 'none';
    if (roomsList) roomsList.style.display = 'none';
    
    if (wastelandEmptyState) wastelandEmptyState.style.display = 'block';
    if (inventoryEmptyState) inventoryEmptyState.style.display = 'block';
    if (dwellersEmptyState) dwellersEmptyState.style.display = 'block';
    if (roomsEmptyState) roomsEmptyState.style.display = 'block';
    
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
    
    // Clear original values tracking
    originalFieldValues = {};
    clearAllFieldIndicators();
}

// Track field changes and show visual indicators
function trackFieldChange(fieldId) {
    const elem = document.getElementById(fieldId);
    if (!elem) return;
    
    const currentValue = elem.value;
    const originalValue = originalFieldValues[fieldId];
    
    // Remove existing indicator
    const existingIndicator = elem.parentElement.querySelector('.field-indicator');
    if (existingIndicator) existingIndicator.remove();
    
    if (originalValue === undefined) {
        // No original value tracked (field not from save file)
        elem.classList.remove('field-modified', 'field-original');
        return;
    }
    
    // Compare current to original
    const isModified = currentValue !== originalValue;
    
    if (isModified) {
        elem.classList.add('field-modified');
        elem.classList.remove('field-original');
        
        // Add modified indicator
        const indicator = document.createElement('span');
        indicator.className = 'field-indicator field-indicator-modified';
        indicator.innerHTML = '<i class="fas fa-circle"></i>';
        indicator.title = `Modified (Original: ${originalValue})`;
        elem.parentElement.appendChild(indicator);
    } else {
        elem.classList.remove('field-modified');
        elem.classList.add('field-original');
        
        // Add original indicator
        const indicator = document.createElement('span');
        indicator.className = 'field-indicator field-indicator-original';
        indicator.innerHTML = '<i class="fas fa-check"></i>';
        indicator.title = 'Original value from save file';
        elem.parentElement.appendChild(indicator);
    }
}

// Store original value when loading from save file
function storeOriginalValue(fieldId, value) {
    originalFieldValues[fieldId] = String(value);
}

// Clear all field indicators
function clearAllFieldIndicators() {
    document.querySelectorAll('.field-indicator').forEach(el => el.remove());
    document.querySelectorAll('.field-modified, .field-original').forEach(el => {
        el.classList.remove('field-modified', 'field-original');
    });
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
    
    // Vault name
    const vaultName = vault.VaultName || '';
    const vaultNameElem = document.getElementById('vaultName');
    if (vaultNameElem) {
        vaultNameElem.value = vaultName;
        storeOriginalValue('vaultName', vaultName);
        trackFieldChange('vaultName');
    }
    
    // Vault number
    const vaultNumber = vault.VaultMode || 0;
    const vaultNumberElem = document.getElementById('vaultNumber');
    if (vaultNumberElem) {
        vaultNumberElem.value = vaultNumber;
        storeOriginalValue('vaultNumber', vaultNumber);
        trackFieldChange('vaultNumber');
    }
    
    // Resources are stored at vault.storage.resources
    const storage = vault.storage?.resources || {};
    
    // Caps - stored as "Nuka" in the save file
    const capsValue = Math.floor(storage.Nuka || 0);
    const capsElem = document.getElementById('caps');
    if (capsElem) {
        capsElem.value = capsValue;
        storeOriginalValue('caps', capsValue);
        trackFieldChange('caps');
    }
    
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
        if (elem) {
            const value = Math.floor(storage[storageProp] || 0);
            elem.value = value;
            storeOriginalValue(elemId, value);
            trackFieldChange(elemId);
        }
    });
}

let dwellerSortAscending = true;

function toggleDwellerSortOrder() {
    dwellerSortAscending = !dwellerSortAscending;
    const btn = document.getElementById('dwellerSortOrder');
    if (btn) {
        btn.innerHTML = dwellerSortAscending 
            ? '<i class="fas fa-arrow-down-a-z"></i>' 
            : '<i class="fas fa-arrow-up-z-a"></i>';
        btn.title = dwellerSortAscending ? 'Ascending order' : 'Descending order';
    }
    populateDwellersList();
}

// Populate Dwellers List
function populateDwellersList() {
    const dwellersList = document.getElementById('dwellersList');
    if (!dwellersList) return;
    
    if (!currentData || !currentData.dwellers) {
        dwellersList.innerHTML = '<div class="empty-state"><i class="fas fa-folder"></i> No vault loaded yet!<br><small>Upload a save file to get started</small></div>';
        return;
    }
    
    dwellersList.innerHTML = '';
    
    const dwellers = currentData.dwellers.dwellers || [];
    
    if (dwellers.length === 0) {
        dwellersList.innerHTML = '<div class="empty-state"><i class="fas fa-frown"></i> No dwellers found in this vault</div>';
        return;
    }
    
    // Get sort option
    const sortElem = document.getElementById('dwellerSort');
    const sortBy = sortElem ? sortElem.value : 'name';
    
    // Get dweller IDs that are exploring in wasteland teams
    const exploringDwellerIds = new Set();
    const wastelandTeams = currentData.vault?.wasteland?.teams || [];
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
    
    // Sort function
    const sortDwellers = (a, b) => {
        let result = 0;
        switch(sortBy) {
            case 'level':
                result = (b.dweller.experience?.currentLevel || 1) - (a.dweller.experience?.currentLevel || 1);
                break;
            case 'health':
                result = (b.dweller.health?.healthValue || 0) - (a.dweller.health?.healthValue || 0);
                break;
            case 'gender':
                result = (a.dweller.gender || 1) - (b.dweller.gender || 1);
                break;
            case 'happiness':
                result = (b.dweller.happiness?.happinessValue || 0) - (a.dweller.happiness?.happinessValue || 0);
                break;
            case 'name':
            default:
                const nameA = `${a.dweller.name || ''} ${a.dweller.lastName || ''}`.trim().toLowerCase();
                const nameB = `${b.dweller.name || ''} ${b.dweller.lastName || ''}`.trim().toLowerCase();
                result = nameA.localeCompare(nameB);
                break;
        }
        return dwellerSortAscending ? result : -result;
    };
    
    // Sort both lists
    inVaultDwellers.sort(sortDwellers);
    exploringDwellers.sort(sortDwellers);
    
    // Add in-vault dwellers section
    if (inVaultDwellers.length > 0) {
        const inVaultHeader = document.createElement('div');
        inVaultHeader.className = 'dweller-section-header';
        inVaultHeader.innerHTML = `<i class="fas fa-home"></i> IN VAULT (${inVaultDwellers.length})`;
        dwellersList.appendChild(inVaultHeader);
        
        inVaultDwellers.forEach(({ dweller, index }) => {
            const item = document.createElement('div');
            item.className = 'dweller-item in-vault';
            const level = dweller.experience?.currentLevel || 1;
            const health = dweller.health?.healthValue || dweller.health?.maxHealth || 100;
            const fullName = `${dweller.name || ''} ${dweller.lastName || ''}`.trim() || 'Unknown';
            const genderIcon = dweller.gender === 2 ? '<i class="fas fa-mars" style="color: #4A90E2;"></i>' : '<i class="fas fa-venus" style="color: #E91E63;"></i>';
            item.innerHTML = `${genderIcon} ${fullName} (Lvl ${level} • HP: ${health})`;
            item.addEventListener('click', () => selectDweller(dweller, index));
            dwellersList.appendChild(item);
        });
    }
    
    // Add exploring dwellers section
    if (exploringDwellers.length > 0) {
        const exploringHeader = document.createElement('div');
        exploringHeader.className = 'dweller-section-header exploring';
        exploringHeader.innerHTML = `<i class="fas fa-globe"></i> EXPLORING (${exploringDwellers.length})`;
        dwellersList.appendChild(exploringHeader);
        
        exploringDwellers.forEach(({ dweller, index }) => {
            const item = document.createElement('div');
            item.className = 'dweller-item exploring';
            const level = dweller.experience?.currentLevel || 1;
            const health = dweller.health?.healthValue || dweller.health?.maxHealth || 100;
            const fullName = `${dweller.name || ''} ${dweller.lastName || ''}`.trim() || 'Unknown';
            const genderIcon = dweller.gender === 2 ? '<i class="fas fa-mars" style="color: #4A90E2;"></i>' : '<i class="fas fa-venus" style="color: #E91E63;"></i>';
            item.innerHTML = `${genderIcon} ${fullName} (Lvl ${level} • HP: ${health})`;
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
    
    const dwellerDetailsEmptyState = document.getElementById('dwellerDetailsEmptyState');
    const dwellerDetailsContent = document.getElementById('dwellerDetailsContent');
    
    if (dwellerDetailsEmptyState) dwellerDetailsEmptyState.style.display = 'none';
    if (dwellerDetailsContent) dwellerDetailsContent.style.display = 'block';
    
    const nameElem = document.getElementById('dwellerName');
    const fullName = `${dweller.name || ''} ${dweller.lastName || ''}`.trim() || 'Unknown';
    if (nameElem) nameElem.textContent = fullName;
    
    // Load first and last name from separate fields
    const firstElem = document.getElementById('dwellerFirstName');
    const lastElem = document.getElementById('dwellerLastName');
    
    if (firstElem) {
        const firstName = dweller.name || '';
        firstElem.value = firstName;
        storeOriginalValue('dwellerFirstName', firstName);
        trackFieldChange('dwellerFirstName');
    }
    if (lastElem) {
        const lastName = dweller.lastName || '';
        lastElem.value = lastName;
        storeOriginalValue('dwellerLastName', lastName);
        trackFieldChange('dwellerLastName');
    }
    
    // Gender
    const genderElem = document.getElementById('dwellerGender');
    if (genderElem) {
        const gender = dweller.gender || 1;
        genderElem.value = gender;
        storeOriginalValue('dwellerGender', gender);
    }
    
    // Level and Experience (stored in experience object)
    const levelElem = document.getElementById('dwellerLevel');
    const expElem = document.getElementById('dwellerExp');
    if (levelElem) {
        const level = dweller.experience?.currentLevel || 1;
        levelElem.value = level;
        storeOriginalValue('dwellerLevel', level);
        trackFieldChange('dwellerLevel');
    }
    if (expElem) {
        const exp = dweller.experience?.experienceValue || 0;
        expElem.value = exp;
        storeOriginalValue('dwellerExp', exp);
        trackFieldChange('dwellerExp');
    }
    
    // Health (stored in health object)
    const healthElem = document.getElementById('dwellerHealth');
    const maxHealthElem = document.getElementById('dwellerMaxHealth');
    const radiationElem = document.getElementById('dwellerRadiation');
    if (healthElem) {
        const health = dweller.health?.healthValue || dweller.health?.maxHealth || 100;
        healthElem.value = health;
        storeOriginalValue('dwellerHealth', health);
        trackFieldChange('dwellerHealth');
    }
    if (maxHealthElem) {
        const maxHealth = dweller.health?.maxHealth || 100;
        maxHealthElem.value = maxHealth;
        storeOriginalValue('dwellerMaxHealth', maxHealth);
        trackFieldChange('dwellerMaxHealth');
    }
    if (radiationElem) {
        const radiation = dweller.health?.radiationValue || 0;
        radiationElem.value = radiation;
        storeOriginalValue('dwellerRadiation', radiation);
        trackFieldChange('dwellerRadiation');
    }
    
    // Happiness (stored in happiness object)
    const happinessElem = document.getElementById('dwellerHappiness');
    if (happinessElem) {
        const happiness = Math.round((dweller.happiness?.happinessValue || 50));
        happinessElem.value = happiness;
        storeOriginalValue('dwellerHappiness', happiness);
        trackFieldChange('dwellerHappiness');
    }
    
    // Appearance - Convert integer color values to hex
    const skinColorElem = document.getElementById('dwellerSkinColor');
    const hairColorElem = document.getElementById('dwellerHairColor');
    
    if (skinColorElem && dweller.skinColor !== undefined) {
        // Convert integer (ARGB format) to hex color
        // Example: 4290152550 → 0xFFE5A676 → #e5a676
        const hexColor = '#' + (dweller.skinColor & 0xFFFFFF).toString(16).padStart(6, '0');
        skinColorElem.value = hexColor;
        storeOriginalValue('dwellerSkinColor', hexColor);
    }
    
    if (hairColorElem && dweller.hairColor !== undefined) {
        // Convert integer (ARGB format) to hex color
        // Example: 4285094227 → 0xFFAB8D53 → #ab8d53
        const hexColor = '#' + (dweller.hairColor & 0xFFFFFF).toString(16).padStart(6, '0');
        hairColorElem.value = hexColor;
        storeOriginalValue('dwellerHairColor', hexColor);
    }
    
    trackFieldChange('dwellerSkinColor');
    trackFieldChange('dwellerHairColor');
    
    // Hair style
    const hairStyleElem = document.getElementById('dwellerHairStyle');
    if (hairStyleElem) {
        const hairStyle = dweller.hair || '10';
        hairStyleElem.value = hairStyle;
        storeOriginalValue('dwellerHairStyle', hairStyle);
        trackFieldChange('dwellerHairStyle');
    }
    
    // Dweller info
    const serializeIdElem = document.getElementById('dwellerSerializeId');
    if (serializeIdElem) {
        serializeIdElem.value = dweller.serializeId || 1;
    }
    
    const rarityElem = document.getElementById('dwellerRarity');
    if (rarityElem) {
        const rarity = dweller.rarity || 'Common';
        rarityElem.value = rarity;
        storeOriginalValue('dwellerRarity', rarity);
        trackFieldChange('dwellerRarity');
    }
    
    const savedRoomElem = document.getElementById('dwellerSavedRoom');
    if (savedRoomElem) {
        const savedRoom = dweller.savedRoom !== undefined ? dweller.savedRoom : -1;
        savedRoomElem.value = savedRoom;
        storeOriginalValue('dwellerSavedRoom', savedRoom);
        trackFieldChange('dwellerSavedRoom');
    }
    
    // Relationships
    const pregnantElem = document.getElementById('dwellerPregnant');
    if (pregnantElem) {
        const pregnant = dweller.pregnant || false;
        pregnantElem.value = pregnant.toString();
        storeOriginalValue('dwellerPregnant', pregnant.toString());
        trackFieldChange('dwellerPregnant');
    }
    
    const babyReadyElem = document.getElementById('dwellerBabyReady');
    if (babyReadyElem) {
        const babyReady = dweller.babyReady || false;
        babyReadyElem.value = babyReady.toString();
        storeOriginalValue('dwellerBabyReady', babyReady.toString());
        trackFieldChange('dwellerBabyReady');
    }
    
    const partnerElem = document.getElementById('dwellerPartner');
    if (partnerElem) {
        const partner = dweller.relations?.partner !== undefined ? dweller.relations.partner : -1;
        partnerElem.value = partner;
        storeOriginalValue('dwellerPartner', partner);
        trackFieldChange('dwellerPartner');
    }
    
    // Update SPECIAL stats - array of objects with {value, mod, exp}
    const statsArray = dweller.stats?.stats || [];
    const statIds = ['stat-s', 'stat-p', 'stat-e', 'stat-c', 'stat-i', 'stat-a', 'stat-l'];
    
    statIds.forEach((id, i) => {
        const elem = document.getElementById(id);
        if (elem) {
            const value = statsArray[i]?.value || 1;
            elem.value = value;
            storeOriginalValue(id, value);
            trackFieldChange(id);
        }
    });
    
    // Equipment
    const weaponElem = document.getElementById('dwellerWeapon');
    const outfitElem = document.getElementById('dwellerOutfit');
    
    if (weaponElem) {
        const weaponId = dweller.equipedWeapon?.id || dweller.equippedWeapon?.id || '';
        weaponElem.value = weaponId;
        storeOriginalValue('dwellerWeapon', weaponId);
        trackFieldChange('dwellerWeapon');
    }
    
    if (outfitElem) {
        const outfitId = dweller.equipedOutfit?.id || dweller.equippedOutfit?.id || '';
        outfitElem.value = outfitId;
        storeOriginalValue('dwellerOutfit', outfitId);
        trackFieldChange('dwellerOutfit');
    }
}

// Update Dweller Data
function updateDwellerData() {
    if (!currentDweller || !currentData) return;
    
    const dweller = currentDweller.data;
    const firstName = document.getElementById('dwellerFirstName')?.value || '';
    const lastName = document.getElementById('dwellerLastName')?.value || '';
    
    // Update both name (first name) and lastName fields separately
    dweller.name = firstName;
    dweller.lastName = lastName;
    
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
    
    // Appearance - Convert hex colors back to integer (ARGB format)
    const skinColorElem = document.getElementById('dwellerSkinColor');
    const hairColorElem = document.getElementById('dwellerHairColor');
    
    if (skinColorElem && skinColorElem.value) {
        // Convert hex color (#RRGGBB) to integer with full alpha channel
        // Example: #3498db → 0xFF3498DB → 4283215067
        const rgb = parseInt(skinColorElem.value.replace('#', ''), 16);
        dweller.skinColor = (0xFF000000 | rgb) >>> 0; // >>> 0 converts to unsigned 32-bit integer
    }
    
    if (hairColorElem && hairColorElem.value) {
        // Convert hex color (#RRGGBB) to integer with full alpha channel
        // Example: #2c1810 → 0xFF2C1810 → 4283215887
        const rgb = parseInt(hairColorElem.value.replace('#', ''), 16);
        dweller.hairColor = (0xFF000000 | rgb) >>> 0; // >>> 0 converts to unsigned 32-bit integer
    }
    
    // Hair style
    const hairStyleElem = document.getElementById('dwellerHairStyle');
    if (hairStyleElem) dweller.hair = hairStyleElem.value || '10';
    
    // Dweller info
    const rarityElem = document.getElementById('dwellerRarity');
    if (rarityElem) dweller.rarity = rarityElem.value || 'Common';
    
    const savedRoomElem = document.getElementById('dwellerSavedRoom');
    if (savedRoomElem) dweller.savedRoom = parseInt(savedRoomElem.value) || -1;
    
    // Relationships
    const pregnantElem = document.getElementById('dwellerPregnant');
    if (pregnantElem) dweller.pregnant = pregnantElem.value === 'true';
    
    const babyReadyElem = document.getElementById('dwellerBabyReady');
    if (babyReadyElem) dweller.babyReady = babyReadyElem.value === 'true';
    
    const partnerElem = document.getElementById('dwellerPartner');
    if (partnerElem) {
        if (!dweller.relations) dweller.relations = { relations: [], partner: -1, lastPartner: -1, ascendants: [-1, -1, -1, -1, -1, -1] };
        dweller.relations.partner = parseInt(partnerElem.value) || -1;
    }
    
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
    
    if (weaponElem) {
        if (weaponElem.value) {
            if (!dweller.equipedWeapon) dweller.equipedWeapon = {};
            dweller.equipedWeapon.id = weaponElem.value;
            dweller.equipedWeapon.type = 'Weapon';
            dweller.equipedWeapon.hasBeenAssigned = false;
            dweller.equipedWeapon.hasRandonWeaponBeenAssigned = false;
        } else {
            // If no weapon selected, set to default fist/none
            if (!dweller.equipedWeapon) dweller.equipedWeapon = {};
            dweller.equipedWeapon.id = 'Fist';
            dweller.equipedWeapon.type = 'Weapon';
            dweller.equipedWeapon.hasBeenAssigned = false;
            dweller.equipedWeapon.hasRandonWeaponBeenAssigned = false;
        }
    }
    
    if (outfitElem) {
        if (outfitElem.value) {
            if (!dweller.equipedOutfit) dweller.equipedOutfit = {};
            dweller.equipedOutfit.id = outfitElem.value;
            dweller.equipedOutfit.type = 'Outfit';
            dweller.equipedOutfit.hasBeenAssigned = false;
            dweller.equipedOutfit.hasRandonWeaponBeenAssigned = false;
        } else {
            // If no outfit selected, set to default jumpsuit
            if (!dweller.equipedOutfit) dweller.equipedOutfit = {};
            dweller.equipedOutfit.id = 'jumpsuit';
            dweller.equipedOutfit.type = 'Outfit';
            dweller.equipedOutfit.hasBeenAssigned = false;
            dweller.equipedOutfit.hasRandonWeaponBeenAssigned = false;
        }
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
        roomsList.innerHTML = '<div class="empty-state"><i class="fas fa-folder"></i> No vault loaded yet!<br><small>Upload a save file to get started</small></div>';
        return;
    }
    
    roomsList.innerHTML = '';
    
    const rooms = currentData.vault.rooms || [];
    
    if (rooms.length === 0) {
        roomsList.innerHTML = '<div class="empty-state"><i class="fas fa-person-digging"></i> No rooms listed here :(<br><small>Your vault appears to be empty</small></div>';
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
    
    if (!currentData || !currentData.vault || !currentData.vault.wasteland) {
        teamsList.innerHTML = '<div class="empty-state"><i class="fas fa-folder"></i> No vault loaded yet!<br><small>Upload a save file to get started</small></div>';
        return;
    }
    
    teamsList.innerHTML = '';
    
    const teams = currentData.vault.wasteland.teams || [];
    
    if (teams.length === 0) {
        teamsList.innerHTML = '<div class="empty-state"><i class="fas fa-mountain-sun"></i> No teams in the wasteland<br><small>Send dwellers on quests to see them here</small></div>';
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
    if (!currentWastelandTeam || !currentData.vault.wasteland) return;
    
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

function showWastelandContent() {
    const emptyState = document.getElementById('wastelandEmptyState');
    const content = document.getElementById('wastelandContent');
    if (emptyState && content && currentData) {
        emptyState.style.display = 'none';
        content.style.display = 'block';
    }
}

function showInventoryContent() {
    const emptyState = document.getElementById('inventoryEmptyState');
    const content = document.getElementById('inventoryContent');
    if (emptyState && content && currentData) {
        emptyState.style.display = 'none';
        content.style.display = 'block';
    }
}

function showDwellersContent() {
    const emptyState = document.getElementById('dwellersEmptyState');
    const list = document.getElementById('dwellersList');
    if (emptyState && list && currentData) {
        emptyState.style.display = 'none';
        list.style.display = 'block';
    }
}

function showRoomsContent() {
    const emptyState = document.getElementById('roomsEmptyState');
    const list = document.getElementById('roomsList');
    if (emptyState && list && currentData) {
        emptyState.style.display = 'none';
        list.style.display = 'block';
    }
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
        weaponsList.innerHTML = '<div class="empty-state"><i class="fas fa-gun"></i> No weapons in storage<br><small>Add weapons to see them here</small></div>';
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
        outfitsList.innerHTML = '<div class="empty-state"><i class="fas fa-vest"></i> No outfits in storage<br><small>Add outfits to see them here</small></div>';
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
        junkList.innerHTML = '<div class="empty-state"><i class="fas fa-wrench"></i> No junk in storage<br><small>Add junk items to see them here</small></div>';
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
    
    const itemName = item.id || `${type} ${index + 1}`;
    const itemType = item.type || type;
    
    let detailsHTML = '';
    
    if (type === 'weapon') {
        const damage = item.damage || item.damageValue || 0;
        detailsHTML = `<span class="inventory-item-stat"><strong>DMG ${damage}</strong></span>`;
    } else if (type === 'outfit') {
        const stats = item.stats || {};
        const bonus = Object.keys(stats).length > 0 ? '<i class=\"fas fa-check\" style=\"color: green;\"></i>' : '—';
        detailsHTML = `<span class="inventory-item-stat"><strong>${bonus}</strong></span>`;
    } else if (type === 'junk') {
        detailsHTML = `<span class="inventory-item-stat"><strong>Item</strong></span>`;
    }
    
    div.innerHTML = `
        <div class="inventory-item-header">
            <div class="inventory-item-name" title="${itemName}">${itemName}</div>
            <div class="inventory-item-type">${itemType}</div>
        </div>
        <div class="inventory-item-details">
            ${detailsHTML}
        </div>
        <div class="inventory-item-actions">
            <button class="btn btn-secondary" onclick="editInventoryItem(${index}, '${type}')" title="View">ℹ️</button>
            <button class="btn btn-secondary" onclick="deleteInventoryItem(${index}, '${type}')" title="Delete">🗑️</button>
        </div>
    `;
    
    return div;
}

function editInventoryItem(index, type) {
    // Get the actual item from the vault.inventory.items array
    if (!currentData.vault?.inventory?.items) return;
    
    let itemTypeFilter = type === 'weapon' ? 'Weapon' : type === 'outfit' ? 'Outfit' : 'Junk';
    const filteredItems = currentData.vault.inventory.items.filter(i => i.type === itemTypeFilter);
    
    if (index >= filteredItems.length) return;
    const item = filteredItems[index];
    
    // Game doesn't use quantity field - items are stored individually
    // Show only read-only info about the item
    const itemInfo = `Item: ${item.id}\nType: ${item.type}\nAssigned: ${item.hasBeenAssigned ? 'Yes' : 'No'}`;
    alert(itemInfo + '\n\nNote: To add more of this item, use the Add button. To remove, use Delete.');
}

function deleteInventoryItem(index, type) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    if (!currentData.vault?.inventory?.items) return;
    
    let itemTypeFilter = type === 'weapon' ? 'Weapon' : type === 'outfit' ? 'Outfit' : 'Junk';
    const filteredItems = currentData.vault.inventory.items.filter(i => i.type === itemTypeFilter);
    
    if (index >= filteredItems.length) return;
    
    const item = filteredItems[index];
    const actualItemIndex = currentData.vault.inventory.items.indexOf(item);
    currentData.vault.inventory.items.splice(actualItemIndex, 1);
    
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
    
    // Ensure vault structure exists
    if (!currentData.vault) currentData.vault = {};
    if (!currentData.vault.inventory) currentData.vault.inventory = {};
    if (!currentData.vault.inventory.items) currentData.vault.inventory.items = [];
    
    // Game stores individual items, NOT quantity field
    // Add 'quantity' number of items to the array
    for (let i = 0; i < quantity; i++) {
        const newItem = {
            id: itemId,
            type: currentModalType === 'weapon' ? 'Weapon' : currentModalType === 'outfit' ? 'Outfit' : 'Junk',
            hasBeenAssigned: false,
            hasRandonWeaponBeenAssigned: false
        };
        
        currentData.vault.inventory.items.push(newItem);
    }
    
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    populateInventory();
    showToast(`${quantity}x ${itemName} added!`);
    
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

// --- Guides / Tutorials ---
function renderGuidesList() {
    const container = document.getElementById('guidesList');
    if (!container) return;
    container.innerHTML = '';
    // Render sections as left-sidebar items
    GUIDE_SECTIONS.forEach(section => {
        const item = document.createElement('div');
        item.className = 'dweller-item guide-section-item';
        item.dataset.sectionId = section.id;
        item.innerHTML = `
            <div>
                <strong>${section.title}</strong>
            </div>
        `;
        item.addEventListener('click', () => selectGuideSection(section.id));
        container.appendChild(item);
    });
}

function findGuideById(id) {
    for (const s of GUIDE_SECTIONS) {
        for (const g of s.guides) {
            if (g.id === id) return g;
        }
    }
    return null;
}

function showGuideDetails(id) {
    const guide = findGuideById(id);
    if (!guide) return;
    document.getElementById('guideDetailsEmptyState').style.display = 'none';
    const content = document.getElementById('guideDetailsContent');
    content.style.display = 'block';
    content.innerHTML = `
        <a href="#" class="back-link">← Back</a>
        <div class="panel-section">
            <h3>${guide.title}</h3>
            <div id="guideDetailBody">${guide.content || '<p>No content yet.</p>'}</div>
            <div style="margin-top:12px;">
                <button class="btn btn-primary" id="openGuideBtnInner">Open Guide</button>
            </div>
        </div>
    `;
    document.getElementById('openGuideBtnInner').onclick = () => openGuideModal(guide.id);
}

function filterGuides(term) {
    const t = (term || '').toLowerCase();
    document.querySelectorAll('#guidesList .guide-section-item').forEach(item => {
        const sectionId = item.dataset.sectionId;
        const section = GUIDE_SECTIONS.find(s => s.id === sectionId);
        if (!section) return;
        const matchesSection = section.title.toLowerCase().includes(t);
        const matchesGuide = section.guides.some(g => (g.title + ' ' + (g.content||'')).toLowerCase().includes(t));
        item.style.display = (matchesSection || matchesGuide) ? 'flex' : 'none';
    });
}

function selectGuideSection(sectionId) {
    const section = GUIDE_SECTIONS.find(s => s.id === sectionId);
    if (!section) return;
    // highlight selected
    document.querySelectorAll('#guidesList .guide-section-item').forEach(i => i.classList.remove('active'));
    const el = document.querySelector(`#guidesList .guide-section-item[data-section-id="${sectionId}"]`);
    if (el) el.classList.add('active');

    document.getElementById('guideDetailsEmptyState').style.display = 'none';
    const content = document.getElementById('guideDetailsContent');
    content.style.display = 'block';
    const guidesHtml = section.guides.map(g => `
        <div class="guide-card" data-guide-id="${g.id}">
            <h4>${g.title}</h4>
            <div class="guide-excerpt">${(g.content||'').replace(/(<([^>]+)>)/gi, '').slice(0,180)}${(g.content||'').length>180? '…':''}</div>
            <div style="margin-top:10px; display:flex; gap:8px;">
                <button class="btn btn-secondary" data-action="view" data-id="${g.id}">View</button>
                <button class="btn btn-primary" data-action="open" data-id="${g.id}">Open</button>
            </div>
        </div>
    `).join('');

    content.innerHTML = `<a href="#" class="back-link">← Back</a><div class="panel-section"><h3>${section.title}</h3>${guidesHtml}</div>`;

    content.querySelectorAll('button[data-action="view"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            showGuideDetails(id);
        });
    });
    content.querySelectorAll('button[data-action="open"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            openGuideModal(id);
        });
    });
}

function openGuideModal(id) {
    const guide = findGuideById(id);
    if (!guide) return;
    const modal = document.getElementById('guideModal');
    const title = document.getElementById('guideModalTitle');
    const videoContainer = document.getElementById('guideVideoContainer');
    const content = document.getElementById('guideContent');

    title.textContent = guide.title || 'Guide';
    // Video or placeholder
    if (guide.videoUrl) {
        videoContainer.innerHTML = `<div class="video-wrapper"><iframe src="${guide.videoUrl}" frameborder="0" allowfullscreen></iframe></div>`;
    } else {
        videoContainer.innerHTML = `<div class="video-placeholder">Video coming soon</div>`;
    }

    content.innerHTML = guide.content || '<p>No content yet.</p>';
    modal.classList.add('active');
}

function closeGuideModal() {
    const modal = document.getElementById('guideModal');
    const videoContainer = document.getElementById('guideVideoContainer');
    modal.classList.remove('active');
    if (videoContainer) videoContainer.innerHTML = '';
}


// Update Vault Data
function updateVaultData() {
    if (!currentData || !currentData.vault) return;
    
    const vault = currentData.vault;
    vault.VaultName = document.getElementById('vaultName')?.value || '';
    
    // Save vault number as VaultMode
    const vaultNumberElem = document.getElementById('vaultNumber');
    if (vaultNumberElem) {
        vault.VaultMode = vaultNumberElem.value || '0';
    }
    
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
            if (elem) {
                elem.value = '0';
                storeOriginalValue(id, '0');
                trackFieldChange(id);
            }
        });
        return;
    }
    
    const vault = currentData.vault;
    
    // Extract counts from LunchBoxesByType array
    // Array of type codes: 0=Lunchbox, 1=MrHandy, 2=PetCarrier, 3=StarterPack
    let lunchboxCount = 0;
    let handyCount = 0;
    let petCount = 0;
    let starterCount = 0;
    
    if (vault.LunchBoxesByType && Array.isArray(vault.LunchBoxesByType)) {
        for (const typeCode of vault.LunchBoxesByType) {
            if (typeCode === 0) lunchboxCount++;
            else if (typeCode === 1) handyCount++;
            else if (typeCode === 2) petCount++;
            else if (typeCode === 3) starterCount++;
        }
    }
    
    // Set UI values
    const lunchboxElem = document.getElementById('lunchboxCount');
    if (lunchboxElem) {
        lunchboxElem.value = lunchboxCount;
        storeOriginalValue('lunchboxCount', lunchboxCount);
        trackFieldChange('lunchboxCount');
    }
    
    const handyElem = document.getElementById('handyCount');
    if (handyElem) {
        handyElem.value = handyCount;
        storeOriginalValue('handyCount', handyCount);
        trackFieldChange('handyCount');
    }
    
    const petElem = document.getElementById('petCarrierCount');
    if (petElem) {
        petElem.value = petCount;
        storeOriginalValue('petCarrierCount', petCount);
        trackFieldChange('petCarrierCount');
    }
    
    const starterElem = document.getElementById('starterPackCount');
    if (starterElem) {
        starterElem.value = starterCount;
        storeOriginalValue('starterPackCount', starterCount);
        trackFieldChange('starterPackCount');
    }
}

// Update Item Counts
function updateItemCounts() {
    if (!currentData || !currentData.vault) return;
    
    const vault = currentData.vault;
    
    // Get new values from inputs
    const lunchboxCount = parseInt(document.getElementById('lunchboxCount')?.value) || 0;
    const handyCount = parseInt(document.getElementById('handyCount')?.value) || 0;
    const petCarrierCount = parseInt(document.getElementById('petCarrierCount')?.value) || 0;
    const starterPackCount = parseInt(document.getElementById('starterPackCount')?.value) || 0;
    
    // Update LunchBoxesCount - total of all special items
    vault.LunchBoxesCount = lunchboxCount + handyCount + petCarrierCount + starterPackCount;
    
    // Rebuild LunchBoxesByType array - critical for game to recognize items!
    // Array of type codes: 0=Lunchbox, 1=MrHandy, 2=PetCarrier, 3=StarterPack
    vault.LunchBoxesByType = [];
    
    for (let i = 0; i < lunchboxCount; i++) {
        vault.LunchBoxesByType.push(0);
    }
    for (let i = 0; i < handyCount; i++) {
        vault.LunchBoxesByType.push(1);
    }
    for (let i = 0; i < petCarrierCount; i++) {
        vault.LunchBoxesByType.push(2);
    }
    for (let i = 0; i < starterPackCount; i++) {
        vault.LunchBoxesByType.push(3);
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
    
    // Populate root-level fields
    const currentSeason = document.getElementById('currentSeason');
    const currentLevel = document.getElementById('currentLevel');
    const currentTokens = document.getElementById('currentTokens');
    const schemaVersion = document.getElementById('schemaVersion');
    const battlepassWindowLevel = document.getElementById('battlepassWindowLevel');
    
    if (currentSeason) currentSeason.value = currentData.currentSeason || '';
    if (currentLevel) currentLevel.value = parseInt(currentData.currentLevel) || 0;
    if (currentTokens) currentTokens.value = parseInt(currentData.currentTokens) || 0;
    if (schemaVersion) schemaVersion.value = parseInt(currentData.schemaVersion) || 0;
    if (battlepassWindowLevel) battlepassWindowLevel.value = parseInt(currentData.battlepassWindowLastObservedLevel) || 0;
    
    // Get current season data from seasonsData object
    const seasonKey = currentData.currentSeason || Object.keys(currentData.seasonsData || {})[0];
    const seasonData = (currentData.seasonsData && currentData.seasonsData[seasonKey]) || {};
    
    // Populate season-specific fields
    const isPremium = document.getElementById('isPremium');
    const isPremiumPlus = document.getElementById('isPremiumPlus');
    const maxRankAchieved = document.getElementById('maxRankAchieved');
    
    if (isPremium) {
        const premiumVal = seasonData.isPremium || false;
        isPremium.value = (premiumVal === true || premiumVal === 'true' || premiumVal === 1).toString();
    }
    
    if (isPremiumPlus) {
        const premiumPlusVal = seasonData.isPremiumPlus || false;
        isPremiumPlus.value = (premiumPlusVal === true || premiumPlusVal === 'true' || premiumPlusVal === 1).toString();
    }
    
    if (maxRankAchieved) {
        maxRankAchieved.value = parseInt(seasonData.maxRankAchieved) || 0;
    }
    
    // Enable download button
    const downloadBtn = document.getElementById('downloadSeasonPassBtn');
    if (downloadBtn) downloadBtn.disabled = false;
    
    // Populate rewards list
    populateSeasonRewards(seasonData);
}

function populateSeasonRewards(seasonData = null) {
    const rewardsList = document.getElementById('seasonRewardsList');
    if (!rewardsList || !currentData) return;
    
    if (!seasonData) {
        const seasonKey = currentData.currentSeason || Object.keys(currentData.seasonsData || {})[0];
        seasonData = (currentData.seasonsData && currentData.seasonsData[seasonKey]) || {};
    }
    
    // Combine free and premium rewards
    const freeRewards = seasonData.freeRewardsList || [];
    const premiumRewards = seasonData.premiumRewardsList || [];
    
    if (freeRewards.length === 0 && premiumRewards.length === 0) {
        rewardsList.innerHTML = `<div class="no-data-message">
            <span class="no-data-icon"><i class="fas fa-gift"></i></span>
            <p>No season pass data loaded</p>
            <small>Load a season pass file (.dat) to view rewards</small>
        </div>`;
        return;
    }
    
    rewardsList.innerHTML = '';
    
    // Display free tier rewards
    if (freeRewards.length > 0) {
        const freeSection = document.createElement('div');
        freeSection.innerHTML = '<h4 style="margin: 0 0 10px 0; color: #8B4513;"><i class="fas fa-star"></i> Free Tier Rewards</h4>';
        rewardsList.appendChild(freeSection);
        
        freeRewards.forEach((reward) => {
            const rewardDiv = document.createElement('div');
            rewardDiv.className = 'season-reward-item';
            
            const rewardType = reward.rewardType || 'unknown';
            const levelRequired = reward.levelRequired || 1;
            const icon = reward.icon || 'BP_Lunchbox';
            const dataVal = reward.dataValString || reward.dataValInt || '';
            
            rewardDiv.innerHTML = `
                <div class="reward-info">
                    <div class="reward-level">Level ${levelRequired}</div>
                    <div class="reward-type">${rewardType}</div>
                    ${dataVal ? `<div class="reward-value">${dataVal}</div>` : ''}
                </div>
            `;
            rewardsList.appendChild(rewardDiv);
        });
    }
    
    // Display premium tier rewards
    if (premiumRewards.length > 0) {
        const premiumSection = document.createElement('div');
        premiumSection.style.marginTop = '20px';
        premiumSection.innerHTML = '<h4 style="margin: 0 0 10px 0; color: #D4AF37;"><i class="fas fa-crown"></i> Premium Tier Rewards</h4>';
        rewardsList.appendChild(premiumSection);
        
        premiumRewards.forEach((reward) => {
            const rewardDiv = document.createElement('div');
            rewardDiv.className = 'season-reward-item premium';
            
            const rewardType = reward.rewardType || 'unknown';
            const levelRequired = reward.levelRequired || 1;
            const icon = reward.icon || 'BP_Lunchbox';
            const dataVal = reward.dataValString || reward.dataValInt || '';
            
            rewardDiv.innerHTML = `
                <div class="reward-info">
                    <div class="reward-level">Level ${levelRequired}</div>
                    <div class="reward-type">${rewardType}</div>
                    ${dataVal ? `<div class="reward-value">${dataVal}</div>` : ''}
                </div>
            `;
            rewardsList.appendChild(rewardDiv);
        });
    }
}

function updateSeasonPassData() {
    if (!currentData) return;
    
    // Update root-level fields
    const currentSeasonVal = document.getElementById('currentSeason')?.value;
    const currentLevelVal = parseInt(document.getElementById('currentLevel')?.value) || 0;
    const currentTokensVal = parseInt(document.getElementById('currentTokens')?.value) || 0;
    const schemaVersionVal = parseInt(document.getElementById('schemaVersion')?.value) || 0;
    const battlepassWindowLevelVal = parseInt(document.getElementById('battlepassWindowLevel')?.value) || 0;
    
    if (currentSeasonVal) currentData.currentSeason = currentSeasonVal;
    if (currentLevelVal) currentData.currentLevel = currentLevelVal;
    if (currentTokensVal) currentData.currentTokens = currentTokensVal;
    if (schemaVersionVal) currentData.schemaVersion = schemaVersionVal;
    if (battlepassWindowLevelVal) currentData.battlepassWindowLastObservedLevel = battlepassWindowLevelVal;
    
    // Update season-specific fields
    const seasonKey = currentData.currentSeason || Object.keys(currentData.seasonsData || {})[0];
    if (seasonKey && currentData.seasonsData && currentData.seasonsData[seasonKey]) {
        const seasonData = currentData.seasonsData[seasonKey];
        
        const isPremiumVal = document.getElementById('isPremium')?.value === 'true';
        const isPremiumPlusVal = document.getElementById('isPremiumPlus')?.value === 'true';
        const maxRankVal = parseInt(document.getElementById('maxRankAchieved')?.value) || 0;
        
        seasonData.isPremium = isPremiumVal;
        seasonData.isPremiumPlus = isPremiumPlusVal;
        if (maxRankVal) seasonData.maxRankAchieved = maxRankVal;
    }
    
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
}

function maxSeasonLevel() {
    if (!currentData) {
        showToast('No season pass data found');
        return;
    }
    
    // Update root-level fields
    currentData.currentLevel = 100;
    currentData.currentTokens = 999999;
    
    // Update season-specific data
    const seasonKey = currentData.currentSeason || Object.keys(currentData.seasonsData || {})[0];
    if (seasonKey && currentData.seasonsData && currentData.seasonsData[seasonKey]) {
        const seasonData = currentData.seasonsData[seasonKey];
        seasonData.maxRankAchieved = 100;
    }
    
    createBackup('Max Season Level');
    populateSeasonPassData();
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    showToast('Season level maximized!');
}

function unlockAllSeasonRewards() {
    if (!currentData) {
        showToast('No season pass data found');
        return;
    }
    
    const seasonKey = currentData.currentSeason || Object.keys(currentData.seasonsData || {})[0];
    if (!seasonKey || !currentData.seasonsData || !currentData.seasonsData[seasonKey]) {
        showToast('No season data found');
        return;
    }
    
    const seasonData = currentData.seasonsData[seasonKey];
    
    // Unlock all free rewards
    if (seasonData.freeRewardsList) {
        seasonData.freeRewardsList.forEach(reward => {
            reward.claimedList = reward.claimedList || [];
            if (reward.claimedList.length === 0) {
                reward.claimedList.push(true);
            }
        });
    }
    
    // Unlock all premium rewards
    if (seasonData.premiumRewardsList) {
        seasonData.premiumRewardsList.forEach(reward => {
            reward.claimedList = reward.claimedList || [];
            if (reward.claimedList.length === 0) {
                reward.claimedList.push(true);
            }
        });
    }
    
    createBackup('Unlock All Season Rewards');
    populateSeasonPassData();
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
    showToast('All season rewards unlocked!');
}

function enablePremiumPass() {
    if (!currentData) {
        showToast('No season pass data found');
        return;
    }
    
    const seasonKey = currentData.currentSeason || Object.keys(currentData.seasonsData || {})[0];
    if (seasonKey && currentData.seasonsData && currentData.seasonsData[seasonKey]) {
        currentData.seasonsData[seasonKey].isPremium = true;
        currentData.seasonsData[seasonKey].isPremiumPlus = true;
    }
    
    createBackup('Enable Premium Pass');
    populateSeasonPassData();
    jsonEditor.value = JSON.stringify(currentData, null, 2);
    updateFileSize();
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
    const roomDetailsEmptyState = document.getElementById('roomDetailsEmptyState');
    const roomDetailsContent = document.getElementById('roomDetailsContent');
    if (roomDetailsEmptyState) roomDetailsEmptyState.style.display = 'none';
    if (roomDetailsContent) roomDetailsContent.style.display = 'block';
    
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
    const roomDetailsEmptyState = document.getElementById('roomDetailsEmptyState');
    const roomDetailsContent = document.getElementById('roomDetailsContent');
    if (roomDetailsEmptyState) roomDetailsEmptyState.style.display = 'flex';
    if (roomDetailsContent) roomDetailsContent.style.display = 'none';
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
    
    // Populate vault layout
    populateVaultLayout();
}

// Vault Layout Visualizer
function populateVaultLayout() {
    const layoutNoData = document.getElementById('layoutNoData');
    const gridContainer = document.getElementById('vaultGridContainer');
    const vaultGrid = document.getElementById('vaultGrid');
    
    if (!currentData || !currentData.vault) {
        if (layoutNoData) layoutNoData.style.display = 'flex';
        if (gridContainer) gridContainer.style.display = 'none';
        return;
    }
    
    // Hide no-data message and show grid
    if (layoutNoData) layoutNoData.style.display = 'none';
    if (gridContainer) gridContainer.style.display = 'block';
    
    const rooms = currentData.vault.rooms || [];
    const dwellers = currentData.dwellers?.dwellers || [];
    
    vaultGrid.innerHTML = '';
    
    // Create 3-column grid of rooms (typical Fallout Shelter layout)
    const maxRooms = Math.max(9, rooms.length); // Show at least 3x3 grid
    
    // Room type to icon mapping
    const roomIcons = {
        'Vault Door': '🚪',
        'Vault': '🏠',
        'Entrance': '🚪',
        'Residential': '🏠',
        'Diner': '🍽️',
        'Water': '💧',
        'Power': '⚡',
        'Food': '🌾',
        'Garden': '🌱',
        'Barracks': '🪖',
        'Training': '💪',
        'Laboratory': '🔬',
        'Infirmary': '⚕️',
        'Game': '🎮',
        'Recreational': '🎉',
        'Armor': '🛡️',
        'Weapon': '🔫',
        'Vault Suit': '👔',
        'Overseer': '👨‍💼',
        'Storage': '📦',
        'Athletics': '🏃',
        'Strength': '💪',
        'Perception': '👁️',
        'Endurance': '❤️',
        'Charisma': '💬',
        'Intelligence': '🧠',
        'Agility': '⚡',
        'Luck': '🍀',
        'Nuka': '🥤',
        'Radio': '📻',
        'Medbay': '⚕️',
        'Classroom': '📚'
    };
    
    rooms.forEach((room, index) => {
        const tile = document.createElement('div');
        tile.className = `room-tile tier-${Math.max(0, (room.level || 1) - 1)}`;
        
        // Find icon for this room type
        let icon = '🏗️'; // Default icon
        for (const [key, value] of Object.entries(roomIcons)) {
            if ((room.type || '').includes(key) || (room.template || '').includes(key)) {
                icon = value;
                break;
            }
        }
        
        // Get dwellers assigned to this room
        const assignedDwellers = dwellers.filter(d => d.assignment?.roomId === room.id).length;
        const roomName = (room.type || 'Room').replace(/room/i, '').trim() || 'Room';
        
        tile.innerHTML = `
            <div class="room-tile-icon">${icon}</div>
            <div class="room-tile-name">${roomName}</div>
            <div class="room-tile-level">Lvl ${room.level || 1}</div>
        `;
        
        // Add hover tooltip
        tile.title = `${roomName}\nLevel: ${room.level || 1}\nDwellers: ${assignedDwellers}`;
        
        // Click to edit room
        tile.addEventListener('click', () => {
            const roomsList = document.getElementById('roomsList');
            if (roomsList) {
                // Scroll to rooms tab and find the room in the list
                document.getElementById('roomsBtn')?.click();
                setTimeout(() => {
                    const roomItems = document.querySelectorAll('.room-item');
                    if (roomItems[index]) {
                        roomItems[index].click();
                        roomItems[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }
        });
        
        vaultGrid.appendChild(tile);
    });
    
    // Add empty slots if needed (up to 12 rooms max display)
    const displayLimit = 12;
    for (let i = rooms.length; i < displayLimit; i++) {
        const emptyTile = document.createElement('div');
        emptyTile.className = 'room-tile empty';
        emptyTile.innerHTML = '<div class="room-tile-icon">+</div>';
        emptyTile.title = 'Empty slot';
        vaultGrid.appendChild(emptyTile);
    }
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

// Season Pass Download Functions
function downloadSeasonPass() {
    const modal = document.getElementById('seasonPassWarningModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeSeasonPassWarning() {
    const modals = ['seasonPassWarningModal', 'seasonPassConfirmModal2', 'seasonPassConfirmModal3'];
    modals.forEach(id => {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    });
    // Clear the confirmation input
    const input = document.getElementById('seasonPassRiskConfirmation');
    if (input) input.value = '';
}

function seasonPassStep2() {
    const modal1 = document.getElementById('seasonPassWarningModal');
    const modal2 = document.getElementById('seasonPassConfirmModal2');
    if (modal1) modal1.style.display = 'none';
    if (modal2) modal2.style.display = 'flex';
}

function seasonPassStep3() {
    const modal2 = document.getElementById('seasonPassConfirmModal2');
    const modal3 = document.getElementById('seasonPassConfirmModal3');
    if (modal2) modal2.style.display = 'none';
    if (modal3) modal3.style.display = 'flex';
    
    // Add event listener to enable button only when correct text is typed
    const input = document.getElementById('seasonPassRiskConfirmation');
    const btn = document.getElementById('finalDownloadBtn');
    if (input) {
        input.addEventListener('input', () => {
            if (btn) {
                btn.disabled = input.value !== 'I ACCEPT THE RISK';
            }
        });
    }
}

function proceedWithSeasonPassDownload() {
    if (!currentData) {
        showToast('No save data loaded');
        return;
    }
    
    // Update season pass data from form inputs first
    updateSeasonPassData();
    
    // Ask user format preference
    const format = prompt('Download as:\n1. .dat (encrypted - use in game)\n2. .json (plain text - editable)\n\nEnter 1 or 2:', '1');
    
    if (!format) return; // User cancelled
    
    const baseName = seasonPassFileName?.replace(/\.[^/.]+$/, '') || `season-pass-${currentData.currentSeason}`;
    
    if (format === '1') {
        // Encrypt entire currentData (the full spd.dat file) and download as .dat for in-game use
        const result = SaveDecryptor.encrypt(currentData);
        if (result.success) {
            const dataBlob = new Blob([result.data], { type: 'text/plain' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${baseName}.dat`;
            link.click();
            URL.revokeObjectURL(url);
            addToHistory('Season Pass Download', 'Downloaded encrypted .dat file');
            showToast('Season pass file downloaded as encrypted .dat!');
        } else {
            showToast(`Encryption error: ${result.error}`);
            return;
        }
    } else if (format === '2') {
        // Download as plain JSON
        const dataStr = JSON.stringify(currentData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${baseName}.json`;
        link.click();
        URL.revokeObjectURL(url);
        addToHistory('Season Pass Download', 'Downloaded plain .json file');
        showToast('Season pass file downloaded as .json!');
    } else {
        showToast('Invalid format selection');
        return;
    }
    
    // Close modal
    closeSeasonPassWarning();
    
    addToHistory('Season Pass Download', 'Downloaded modified season pass file');
    showToast('Season pass file downloaded! ⚠️ Use at your own risk!');
    handleEditorChange();
}

// Font Awesome Icon Mapping for Fallout Shelter Resources
// Using Font Awesome 6 icons

const RESOURCE_ICONS = {
    // Resources - Font Awesome icons
    'caps': 'fa-coins',
    'nuka': 'fa-flask',
    'food': 'fa-utensils',
    'water': 'fa-droplet',
    'energy': 'fa-bolt',
    'power': 'fa-bolt',
    'stimpack': 'fa-heart-pulse',
    'radaway': 'fa-flask-vial',
    
    // Special Items
    'lunchbox': 'fa-box',
    'mrhandy': 'fa-robot',
    'petcarrier': 'fa-dog',
    'starter': 'fa-gift',
    
    // Default fallback
    'default': 'fa-cube'
};

// Map resource field names to icon keys
const RESOURCE_FIELD_ICONS = {
    'Caps': 'caps',
    'NukaColaQuantum': 'nuka',
    'Food': 'food',
    'Water': 'water',
    'Energy': 'energy',
    'Power': 'power',
    'StimPack': 'stimpack',
    'RadAway': 'radaway',
    'MrHandy': 'mrhandy',
    'PetCarrier': 'petcarrier',
    'Lunchboxes': 'lunchbox',
    'LunchBoxesCount': 'lunchbox'
};

function getResourceIcon(fieldName) {
    const iconKey = RESOURCE_FIELD_ICONS[fieldName] || fieldName.toLowerCase();
    return RESOURCE_ICONS[iconKey] || RESOURCE_ICONS['default'];
}

function getIconHtml(fieldName, className = '') {
    const iconClass = getResourceIcon(fieldName);
    return `<i class="fas ${iconClass} ${className}" title="${fieldName}"></i>`;
}

function getIcon(fieldName) {
    return getResourceIcon(fieldName);
}

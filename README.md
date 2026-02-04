# Wasteland Editor 🎮

A comprehensive Fallout Shelter save file editor with built-in save file analysis tools.

## Features

### 📝 Save Editor
- **Vault Management**: Edit vault name, number, and resources (Caps, Food, Water, Power, etc.)
- **Dweller Management**: Manage dweller stats, equipment, appearance, and skills
- **Room Editor**: Manage vault rooms and configurations
- **Wasteland Teams**: Edit quests and exploration teams
- **Bulk Actions**: Quick commands to unlock rooms, max stats, heal dwellers, and more
- **Raw JSON Editor**: Direct JSON editing for advanced users
- **File Management**: Upload, download, and format save files

### 🔍 Save File Inspector
- **Read-Only Analysis**: Inspect save file structure without modifications
- **Format Detection**: Automatically detect file encoding and format
- **Entropy Analysis**: Measure data compression and encryption
- **String Extraction**: Extract readable ASCII strings from binary files
- **Export Reports**: Generate JSON or HTML analysis reports
- **Educational**: Learn about file structures responsibly

## Project Structure

```
wasteland-editor/
├── index.html              # Main editor page
├── pages/
│   └── inspector.html      # File analysis tool
├── css/
│   ├── main.css           # Editor styling
│   └── inspector.css      # Inspector styling
├── js/
│   ├── app.js             # Editor functionality
│   ├── data.js            # Game data constants
│   └── save-inspector.js  # File analysis engine
├── example-sav-files/     # Sample save files for testing
└── README.md              # This file
```

## Getting Started

### Running Locally

1. **Simple Method**: Open `index.html` in your web browser
   - Double-click `index.html`
   - Or drag it onto your browser window

2. **With Local Server** (Recommended):
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js http-server
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```
   Then open: `http://localhost:8000`

### Using the Editor

1. **Load a Save File**
   - Click "Upload Save File"
   - Select your Fallout Shelter save file (.json, .sav, or .dat)

2. **Edit Your Save**
   - Click tabs to switch between different editors
   - Make your changes in each section
   - Click "Download Save" to save your modifications

3. **Analyze a Save File**
   - Click "File Inspector" in the navigation
   - Upload your save file
   - View detailed analysis and export reports

## Tabs Overview

### Vault Tab
- Vault settings (name, number)
- Resources (Caps, Food, Water, Power, etc.)
- Inventory items (Lunchboxes, Handy Frames, etc.)
- Bulk actions (Unlock Rooms, Max Stats, etc.)

### Dwellers Tab
- List of all dwellers in your vault
- Edit individual dweller details:
  - Name, gender, appearance
  - SPECIAL stats (S.P.E.C.I.A.L.)
  - Level, experience, health, happiness
  - Equipment and weapons

### Rooms Tab
- View and manage vault rooms
- Room assignments and configurations

### Wasteland Tab
- Manage exploration teams
- Quest and mission settings

### Others Tab
- Additional vault data
- Secondary characters and NPCs

### Raw JSON Tab
- Direct JSON editing
- For advanced users and debugging

## File Inspector Features

### Analysis Capabilities
- ✅ File encoding detection (Base64, binary, text)
- ✅ Magic byte identification
- ✅ Encryption detection (via entropy analysis)
- ✅ Compression detection (gzip, zlib, etc.)
- ✅ ASCII string extraction
- ✅ Shannon entropy calculation

### Reports
- Export analysis as JSON
- Export analysis as HTML
- View statistics and data metrics

### Educational Purpose
- Understand save file structures
- Learn about binary formats
- Research game data organization
- **Does NOT modify files** (read-only)

## Important Notes

### ⚠️ Disclaimer
- **Legal**: This tool respects game licenses and intellectual property rights
- **Read-Only Inspector**: The file inspector performs read-only analysis only
- **Ethical Use**: Use for your own saves and for educational purposes
- **Terms of Service**: Always respect Bethesda's Terms of Service

### ✅ What You CAN Do
- Edit your own save files
- Analyze file structures
- Create backups
- Learn about game data formats
- Share analysis reports (not modified saves)

### ❌ What You CANNOT Do
- Bypass paid/premium content restrictions
- Modify entitlement or monetization flags
- Distribute modified saves with locked content
- Violate game licensing or EULA
- Circumvent anti-cheat systems

## Browser Compatibility

- ✅ Chrome/Edge (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ✅ Mobile browsers (Responsive design)

## Data Constants

The editor includes comprehensive data constants:
- **150+ Weapons** with stats and descriptions
- **180+ Outfits** with SPECIAL bonuses
- **40+ Pets** with abilities
- **All Room Types** with production values
- **Quest Data** for wasteland exploration

## Features in Detail

### Backup System
- Automatic backups on file load
- Recovery system for mistakes
- Multiple backup slots

### Search Functionality
- Search through JSON data
- Find specific values or items
- Quick navigation

### Bulk Operations
- Max all dweller stats
- Heal all dwellers
- Max happiness
- Unlock all recipes
- Unlock all themes
- Clear emergencies

## Troubleshooting

### File Won't Load
- Ensure file is valid JSON or Fallout Shelter format
- Try a different file format (.sav, .dat, .json)
- Check browser console for errors

### Changes Not Saving
- Click "Download Save" to save changes
- Browser won't modify files directly
- Use the download button to get your modified file

### Inspector Shows Encrypted Data
- Some save formats are encrypted or compressed
- The inspector will show entropy levels
- Read-only analysis is still available

## Support & Contribution

### Community Resources
- [Fallout Wiki](https://fallout.fandom.com/) - Game mechanics
- r/falloutshelter - Player community
- shelter-editor - Community research

### Development
This project uses:
- Vanilla JavaScript (no frameworks)
- HTML5 & CSS3
- No external dependencies

## License & Attribution

Fallout and Fallout Shelter are trademarks of Bethesda Softworks.
This tool is provided as-is for educational purposes.

---

**Version**: 1.0  
**Last Updated**: February 2026  
**Status**: Full Featured & Tested

Made with ⚡ for Vault-Tec Fans# 🎮 Wasteland Editor - Enhanced Edition

**A comprehensive web-based editor for Fallout Shelter save files**

Built with pure HTML,re
**A comprehensive web-based editor for Fver
Built with pure HTML, CSS, and JavaScript featuring a rustic pape Re
---

## ✨ Key Features

### 🏠 Vault Management
- Edit vault name and customization
- Manage all resources: Caps, Food, Watetic
#ape
### 🏠 Vault Maged- Edit vault name and cuza- Manage all resources: Caps, Foodel- Track special items: Lunchboxes, Mr. Handies, Pet Carriers, Starter Packs

#ns
### 👥 Advanced Dweller Editing
- Search & Filter dwellers quickly
- Edoad- Search & Filter dwellers quickou- Edit all 7 SPECIAL stats (0-10 at- Customize appearance (gender, skin cSy- Choose from 150+ weapons and 180+ outfits
- Track he**- Track health, happiness, level, and expe-

### ⚡ Batch Operations
- Manage vault settings,- Max All Stats (Level er- Max Happiness (100 for all dwellers)
- Heat individual dwellers
- **Rooms**: View v
**A comprehensive web-based editor for Fallout Shelter save files**

s**
Built with pure HTML,re
**A comprehensive web-based editor for Fvng
**A comprehensive web-olBuilt with pure HTML, CSS, and JavaScranilla---

## ✨ Key Features

### 🏠 Vault Management
- Edit vault na80+ out
its database

---

#- Edit vault name and cu? Manage all resources: CapEdge (all#ape
### 🏠 Vault Maged- Edit vault name Based 
#ns
### 👥 Advanced Dweller Editing
- Search & Filter dwellers quickly
- Edoad- Search & Filter dwellers quickou- Edit all 7 SPECIAL stats (0-10 at- Cust---##**- Search & Filter dwellers quick| - Edoad- S*: MIT

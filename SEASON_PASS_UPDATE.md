# Season Pass Editor - Complete Update

## Overview
The season pass editor has been completely rewritten to support the full Fallout Shelter season pass file structure (spd.dat files) with all available fields and options for comprehensive editing.

## Key Changes

### 1. **New Form Fields Added**
The season pass editor now includes all major fields found in spd.dat files:

**Root-Level Fields:**
- `currentSeason` - Current season identifier (e.g., "NewVegasB")
- `currentLevel` - Current season level (1-100+)
- `currentTokens` - Current XP/tokens in season
- `schemaVersion` - Season pass data schema version
- `battlepassWindowLevel` - Last observed battle pass window level

**Season-Specific Fields:**
- `isPremium` - Whether premium tier is unlocked
- `isPremiumPlus` - Whether premium plus tier is unlocked
- `maxRankAchieved` - Highest rank reached in current season

### 2. **Reward Display System**
The rewards section now properly displays:
- **Free Tier Rewards** - Rewards available to all players
- **Premium Tier Rewards** - Exclusive rewards for premium pass holders
- Each reward shows:
  - Required level to unlock
  - Reward type (lunchbox, caps, outfit, weapon, theme, etc.)
  - Reward value/identifier

### 3. **Encryption/Decryption**
The system uses the same AES-128 CBC encryption as Fallout Shelter:
- **Decryption on Upload:** .dat files are automatically decrypted using SaveDecryptor
- **Encryption on Download:** When downloading as .dat format, the entire file is encrypted using SaveDecryptor.encrypt()
- **JSON Option:** Plain .json format available for manual editing (no encryption)

### 4. **Enhanced Functions**

#### `populateSeasonPassData()`
- Now reads from the complete spd.dat structure with proper nested object handling
- Populates all 8 new form fields
- Automatically finds the current season data from `seasonsData[currentSeason]`

#### `updateSeasonPassData()`
- Synchronizes all form inputs to currentData structure
- Properly handles root-level fields vs. season-specific fields
- Maintains the proper JSON structure for in-game compatibility

#### `populateSeasonRewards(seasonData)`
- Displays both free and premium reward tiers
- Shows reward details: level required, type, value/identifier
- Premium tier rewards highlighted with gold color (#D4AF37)

#### `maxSeasonLevel()`
- Sets currentLevel to 100
- Sets currentTokens to 999,999
- Sets maxRankAchieved to 100 for current season

#### `unlockAllSeasonRewards()`
- Marks all free tier rewards as claimed
- Marks all premium tier rewards as claimed
- Properly handles the claimedList array for each reward

#### `enablePremiumPass()`
- Sets isPremium to true for current season
- Sets isPremiumPlus to true for current season

#### `proceedWithSeasonPassDownload()`
- Calls updateSeasonPassData() to sync form data first
- Encrypts entire currentData object for .dat downloads
- Saves as plain JSON for .json downloads
- Preserves or generates filename based on seasonPassFileName or currentSeason

### 5. **CSS Styling**
New styles for reward display:
- `.season-reward-item` - Standard reward styling
- `.season-reward-item.premium` - Gold-highlighted premium rewards
- `.reward-level`, `.reward-type`, `.reward-value` - Individual reward detail styling
- List layout changed from grid to flex column for better vertical scrolling

### 6. **Event Listeners**
Updated to include all new form fields:
```javascript
['currentSeason', 'currentLevel', 'currentTokens', 'schemaVersion', 'isPremium', 'isPremiumPlus', 'maxRankAchieved', 'battlepassWindowLevel']
```

## File Structure Support

The system now properly supports the complete spd.dat file structure:
```json
{
  "currentSeason": "NewVegasB",
  "currentLevel": 1,
  "currentTokens": 0,
  "schemaVersion": 2,
  "battlepassWindowLastObservedLevel": 0,
  "seasonsData": {
    "NewVegasA": {
      "isPremium": false,
      "isPremiumPlus": false,
      "maxRankAchieved": 1,
      "freeRewardsList": [...],
      "premiumRewardsList": [...]
    },
    "NewVegasB": {
      "isPremium": false,
      "isPremiumPlus": false,
      "maxRankAchieved": 1,
      "freeRewardsList": [...],
      "premiumRewardsList": [...]
    }
  },
  // ... other fields
}
```

## Download Formats

### .dat Format (Encrypted)
- Uses SaveDecryptor.encrypt() for AES-128 CBC encryption
- Compatible with in-game Fallout Shelter validation
- Secure encrypted format matching original files

### .json Format (Plain Text)
- Readable and editable with any text editor
- Can be imported back into the editor
- No encryption, useful for manual inspection

## Usage Flow

1. **Load Season Pass File** - Upload spd.dat or .json file
2. **View Data** - All fields populate automatically
3. **Edit Fields** - Modify any season pass parameters
4. **View Rewards** - See all free and premium tier rewards
5. **Quick Actions** - Max level, unlock rewards, enable premium
6. **Download** - Choose format (.dat encrypted or .json plain)
7. **Three-Step Warning** - Confirm understanding of TOS violations

## Compatibility

✅ Works with current Fallout Shelter season pass files
✅ Handles multiple season data (NewVegasA, NewVegasB, etc.)
✅ Proper encryption/decryption using SJCL library
✅ No dependencies on external sites or tools
✅ Uses same encryption key and IV as official game

## Notes

- All modifications preserve the complete spd.dat structure
- Files downloaded as .dat are re-encrypted for in-game use
- Complete backup system available for all changes
- Warning messages emphasize TOS violations
- Files are encrypted with same key/IV as Fallout Shelter

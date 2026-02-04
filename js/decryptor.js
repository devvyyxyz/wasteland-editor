/**
 * Fallout Shelter Save File Decryption/Encryption
 * Based on https://github.com/rakion99/shelter-editor
 * Uses AES-CBC encryption with SJCL library
 */

// Encryption key and IV (from shelter-editor)
const SHELTER_KEY = [2815074099, 1725469378, 4039046167, 874293617, 3063605751, 3133984764, 4097598161, 3620741625];
const SHELTER_IV = sjcl.codec.hex.toBits("7475383967656A693334307438397532");

// Enable CBC mode warning suppression
sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();

class SaveDecryptor {
    /**
     * Decrypt a Fallout Shelter save file
     * @param {string} base64String - Base64 encoded encrypted data
     * @param {string} fileName - Original filename
     * @returns {object} { success: boolean, data: object|null, error: string|null }
     */
    static decrypt(base64String, fileName) {
        try {
            // Decode base64 to cipher bits
            const cipherBits = sjcl.codec.base64.toBits(base64String);
            
            // Create AES cipher with the key
            const cipher = new sjcl.cipher.aes(SHELTER_KEY);
            
            // Decrypt using CBC mode
            const plainBits = sjcl.mode.cbc.decrypt(cipher, cipherBits, SHELTER_IV);
            
            // Convert bits to UTF-8 string
            const jsonStr = sjcl.codec.utf8String.fromBits(plainBits);
            
            // Try to parse as JSON
            const data = JSON.parse(jsonStr);
            
            return {
                success: true,
                data: data,
                error: null
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                error: `Decryption failed: ${error.message}`
            };
        }
    }

    /**
     * Encrypt data back to Fallout Shelter save file format
     * @param {object} jsonData - The save file data as object
     * @returns {object} { success: boolean, data: string|null, error: string|null }
     */
    static encrypt(jsonData) {
        try {
            // Convert object to compact JSON string
            const jsonStr = JSON.stringify(jsonData);
            
            // Convert string to bits
            const plainBits = sjcl.codec.utf8String.toBits(jsonStr);
            
            // Create cipher
            const cipher = new sjcl.cipher.aes(SHELTER_KEY);
            
            // Encrypt using CBC mode
            const cipherBits = sjcl.mode.cbc.encrypt(cipher, plainBits, SHELTER_IV);
            
            // Convert to base64
            const base64Str = sjcl.codec.base64.fromBits(cipherBits);
            
            return {
                success: true,
                data: base64Str,
                error: null
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                error: `Encryption failed: ${error.message}`
            };
        }
    }

    /**
     * Instance method for compatibility
     */
    attemptDecrypt(buffer, fileName) {
        try {
            let base64Str;
            if (buffer instanceof ArrayBuffer) {
                const textDecoder = new TextDecoder();
                base64Str = textDecoder.decode(buffer);
            } else {
                base64Str = buffer;
            }

            return SaveDecryptor.decrypt(base64Str, fileName);
        } catch (error) {
            return {
                success: false,
                data: null,
                error: `Error: ${error.message}`
            };
        }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaveDecryptor;
}

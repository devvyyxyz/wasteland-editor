/**
 * Fallout Shelter Save File Inspector
 * READ-ONLY ANALYSIS & INSPECTION TOOL
 * 
 * EDUCATIONAL & RESEARCH PURPOSES ONLY
 * 
 * CONSTRAINTS:
 * - No modification of game files
 * - No bypass of premium/paid content
 * - No encryption breaking or license circumvention
 * - Read-only inspection only
 * - Respects Terms of Service
 */

class SaveFileInspector {
    constructor() {
        this.fileData = null;
        this.fileName = null;
        this.fileSize = 0;
        this.isDecoded = false;
        this.encodingType = null;
        this.analysisResults = {};
    }

    /**
     * Load and decode a base64-encoded save file
     */
    loadEncodedFile(arrayBuffer, fileName) {
        this.fileName = fileName;
        this.fileSize = arrayBuffer.byteLength;
        
        try {
            // Try to decode as UTF-8 first (may be text)
            const decoder = new TextDecoder('utf-8', { fatal: false });
            const text = decoder.decode(arrayBuffer);
            
            // Check if it's base64
            if (this.isBase64(text)) {
                this.encodingType = 'base64';
                this.fileData = this.decodeBase64(text);
                this.isDecoded = true;
                return true;
            }
            
            // Otherwise treat as raw binary
            this.fileData = arrayBuffer;
            this.encodingType = 'binary';
            this.isDecoded = true;
            return true;
        } catch (error) {
            console.error('Error loading file:', error);
            return false;
        }
    }

    /**
     * Check if string is valid base64
     */
    isBase64(str) {
        try {
            return /^[A-Za-z0-9+/=\s]*$/.test(str) && 
                   (str.length % 4 === 0 || str.replace(/\s/g, '').length % 4 === 0);
        } catch (err) {
            return false;
        }
    }

    /**
     * Decode base64 string to binary
     */
    decodeBase64(str) {
        const binaryString = atob(str.replace(/\s/g, ''));
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Analyze file header and structure
     */
    analyzeHeader() {
        if (!this.fileData) return null;

        const header = {
            fileSize: this.fileSize,
            encoding: this.encodingType,
            firstBytes: this.bytesToHex(this.fileData.slice(0, 16)),
            lastBytes: this.bytesToHex(this.fileData.slice(-16)),
            magicBytes: this.identifyMagic(),
            isCompressed: this.checkCompression(),
            isLikelyEncrypted: this.checkEncryption(),
        };

        return header;
    }

    /**
     * Convert bytes to hex string
     */
    bytesToHex(bytes) {
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join(' ');
    }

    /**
     * Identify magic bytes / file signatures
     */
    identifyMagic() {
        const signatures = {
            'gzip': [0x1f, 0x8b],
            'zlib': [0x78, 0x9c],
            'zip': [0x50, 0x4b],
            'json': [0x7b, 0x22], // {" 
            'json-array': [0x5b], // [
            'png': [0x89, 0x50, 0x4e, 0x47],
        };

        for (const [type, sig] of Object.entries(signatures)) {
            if (this.bytesMatch(sig)) {
                return type;
            }
        }
        return 'unknown';
    }

    /**
     * Check if file bytes match signature
     */
    bytesMatch(signature) {
        if (this.fileData.length < signature.length) return false;
        for (let i = 0; i < signature.length; i++) {
            if (this.fileData[i] !== signature[i]) return false;
        }
        return true;
    }

    /**
     * Check if file is likely compressed
     */
    checkCompression() {
        const magic = this.identifyMagic();
        return ['gzip', 'zlib', 'zip'].includes(magic);
    }

    /**
     * Check if file is likely encrypted
     * (Heuristic: high entropy, no clear patterns)
     */
    checkEncryption() {
        const sample = this.fileData.slice(0, Math.min(1000, this.fileData.length));
        const entropy = this.calculateEntropy(sample);
        
        // High entropy suggests encryption or compression
        return entropy > 7.0;
    }

    /**
     * Calculate Shannon entropy of byte sample
     */
    calculateEntropy(bytes) {
        const frequencies = new Map();
        
        for (let i = 0; i < bytes.length; i++) {
            const byte = bytes[i];
            frequencies.set(byte, (frequencies.get(byte) || 0) + 1);
        }

        let entropy = 0;
        for (const count of frequencies.values()) {
            const p = count / bytes.length;
            entropy -= p * Math.log2(p);
        }

        return entropy;
    }

    /**
     * Extract readable ASCII strings from binary
     */
    extractStrings(minLength = 4) {
        if (!this.fileData) return [];

        const strings = [];
        let currentString = '';
        let startOffset = 0;

        for (let i = 0; i < this.fileData.length; i++) {
            const byte = this.fileData[i];
            
            // Check if byte is printable ASCII
            if (byte >= 32 && byte <= 126) {
                if (currentString === '') startOffset = i;
                currentString += String.fromCharCode(byte);
            } else {
                if (currentString.length >= minLength) {
                    strings.push({
                        string: currentString,
                        offset: startOffset,
                        length: currentString.length
                    });
                }
                currentString = '';
            }
        }

        if (currentString.length >= minLength) {
            strings.push({
                string: currentString,
                offset: startOffset,
                length: currentString.length
            });
        }

        return strings;
    }

    /**
     * Generate comprehensive analysis report
     */
    generateReport() {
        const header = this.analyzeHeader();
        const strings = this.extractStrings();

        const report = {
            fileName: this.fileName,
            fileSize: this.fileSize,
            encoding: this.encodingType,
            analysis: header,
            readableStrings: strings.length > 0 ? strings.slice(0, 50) : [],
            statistics: {
                totalStrings: strings.length,
                largestString: strings.length > 0 ? 
                    Math.max(...strings.map(s => s.length)) : 0,
                entropy: this.calculateEntropy(
                    this.fileData.slice(0, Math.min(10000, this.fileData.length))
                ),
            },
            warnings: this.generateWarnings(header),
            dataTypes: this.identifyDataTypes(),
        };

        return report;
    }

    /**
     * Generate warnings about file characteristics
     */
    generateWarnings(header) {
        const warnings = [];

        if (header.isLikelyEncrypted) {
            warnings.push('⚠️  File appears to be encrypted or heavily compressed');
            warnings.push('   → Cannot safely analyze internal structure');
            warnings.push('   → Format may be proprietary');
        }

        if (header.magicBytes === 'unknown') {
            warnings.push('⚠️  Unknown file format signature');
            warnings.push('   → Not standard gzip, zlib, JSON, or ZIP');
            warnings.push('   → Likely custom or proprietary format');
        }

        warnings.push('⚠️  This is a READ-ONLY analysis tool');
        warnings.push('   → No modifications are performed');
        warnings.push('   → No paid content can be unlocked');
        warnings.push('   → Educational purposes only');

        return warnings;
    }

    /**
     * Identify likely data types within the file
     */
    identifyDataTypes() {
        const types = {
            likelyNumbers: this.countLikelyNumbers(),
            likelyStrings: this.extractStrings().length,
            compressedBlocks: this.countPossibleCompressedBlocks(),
        };

        return types;
    }

    /**
     * Estimate count of numeric data
     */
    countLikelyNumbers() {
        if (!this.fileData) return 0;

        let numberCount = 0;
        const sample = this.fileData.slice(0, Math.min(5000, this.fileData.length));

        // Look for sequences that might be 32-bit integers
        for (let i = 0; i < sample.length - 3; i++) {
            const byte1 = sample[i];
            const byte2 = sample[i + 1];
            const byte3 = sample[i + 2];
            const byte4 = sample[i + 3];

            // If bytes are in reasonable range, might be number
            if (byte1 < 100 && byte2 < 100) {
                numberCount++;
            }
        }

        return Math.floor(numberCount / 10);
    }

    /**
     * Count possible compressed data blocks
     */
    countPossibleCompressedBlocks() {
        let blockCount = 0;
        const sample = this.fileData.slice(0, Math.min(10000, this.fileData.length));

        // Look for repeated patterns or high-entropy clusters
        for (let i = 0; i < sample.length - 10; i++) {
            const entropy = this.calculateEntropy(sample.slice(i, i + 32));
            if (entropy > 6.5) {
                blockCount++;
            }
        }

        return blockCount;
    }

    /**
     * Export report as JSON
     */
    exportJSON() {
        return JSON.stringify(this.generateReport(), null, 2);
    }

    /**
     * Export report as HTML for viewing
     */
    exportHTML() {
        const report = this.generateReport();
        let html = `
<html>
<head>
    <title>Fallout Shelter Save File Analysis</title>
    <style>
        body { font-family: monospace; margin: 20px; background: #1e1e1e; color: #d4d4d4; }
        .header { background: #0e639c; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        .section { background: #252526; padding: 15px; margin: 15px 0; border-left: 4px solid #0e639c; }
        .warning { color: #ff9800; font-weight: bold; }
        .info { color: #4fc3f7; }
        .stat { color: #81c784; }
        table { border-collapse: collapse; width: 100%; }
        td, th { padding: 8px; border: 1px solid #404040; text-align: left; }
        code { background: #1e1e1e; padding: 2px 6px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Fallout Shelter Save File Analysis</h1>
        <p class="info">READ-ONLY EDUCATIONAL INSPECTION</p>
    </div>

    <div class="section">
        <h2>File Information</h2>
        <p><strong>File Name:</strong> ${report.fileName}</p>
        <p><strong>File Size:</strong> ${(report.fileSize / 1024).toFixed(2)} KB</p>
        <p><strong>Encoding:</strong> ${report.encoding}</p>
    </div>

    <div class="section">
        <h2>Analysis Results</h2>
        <table>
            <tr>
                <th>Property</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Magic Bytes</td>
                <td><code>${report.analysis.magicBytes}</code></td>
            </tr>
            <tr>
                <td>Likely Encrypted</td>
                <td class="stat">${report.analysis.isLikelyEncrypted ? '✓ YES' : '✗ NO'}</td>
            </tr>
            <tr>
                <td>Likely Compressed</td>
                <td class="stat">${report.analysis.isCompressed ? '✓ YES' : '✗ NO'}</td>
            </tr>
            <tr>
                <td>Entropy (0-8)</td>
                <td class="stat">${report.statistics.entropy.toFixed(2)}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>Warnings & Notes</h2>
        <ul>
${report.warnings.map(w => `            <li class="warning">${w}</li>`).join('\n')}
        </ul>
    </div>

    <div class="section">
        <h2>Readable Strings Found (First 50)</h2>
        <table>
            <tr>
                <th>Offset</th>
                <th>Length</th>
                <th>String</th>
            </tr>
${report.readableStrings.slice(0, 50).map(s => `
            <tr>
                <td>0x${s.offset.toString(16).toUpperCase().padStart(8, '0')}</td>
                <td>${s.length}</td>
                <td><code>${s.string}</code></td>
            </tr>
`).join('')}
        </table>
    </div>

    <div class="section">
        <h2>Statistics</h2>
        <p class="info">Total Readable Strings: ${report.statistics.totalStrings}</p>
        <p class="info">Largest String: ${report.statistics.largestString} characters</p>
        <p class="info">Estimated Numeric Blocks: ${report.dataTypes.likelyNumbers}</p>
    </div>

    <div class="section" style="background: #3f3f00; border-left-color: #ff9800;">
        <h2>⚠️ IMPORTANT NOTICE</h2>
        <p>This analysis is for <strong>EDUCATIONAL PURPOSES ONLY</strong>.</p>
        <ul>
            <li>✅ Read-only inspection tool</li>
            <li>✅ Understanding game file structures</li>
            <li>❌ Do NOT modify paid content</li>
            <li>❌ Do NOT bypass license restrictions</li>
            <li>❌ Respect Terms of Service</li>
        </ul>
    </div>
</body>
</html>
        `;
        return html;
    }
}

// Export for Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaveFileInspector;
}

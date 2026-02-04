/**
 * Version Info Module
 * Dynamically pulls version and last updated info from repository
 */

async function loadVersionInfo() {
    try {
        // Load version from config.json
        const configResponse = await fetch('config.json');
        const config = await configResponse.json();
        
        let version = config.version || '1.0.1';
        let lastUpdated = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        let lastUpdatedTime = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        // Try to get last commit info from GitHub API
        try {
            const githubResponse = await fetch('https://api.github.com/repos/devvyyxyz/wasteland-editor/commits?per_page=1');
            if (githubResponse.ok) {
                const commits = await githubResponse.json();
                
                // If we got commit data from GitHub, use that date instead
                if (commits && commits.length > 0 && commits[0].commit && commits[0].commit.committer) {
                    const commitDate = new Date(commits[0].commit.committer.date);
                    lastUpdated = commitDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    lastUpdatedTime = commitDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                    });
                }
            }
        } catch (githubError) {
            console.info('GitHub API unavailable, using local time');
        }
        
        // Update version and last updated in footer
        const versionElement = document.getElementById('app-version');
        const lastUpdatedElement = document.getElementById('app-last-updated');
        
        if (versionElement) {
            versionElement.textContent = version;
        }
        
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = `${lastUpdated} at ${lastUpdatedTime}`;
        }
        
    } catch (error) {
        console.warn('Could not load version info:', error);
        // Fallback to displaying current date/time
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        const versionElement = document.getElementById('app-version');
        const lastUpdatedElement = document.getElementById('app-last-updated');
        
        if (versionElement) {
            versionElement.textContent = '1.0.1';
        }
        
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = `${dateStr} at ${timeStr}`;
        }
    }
}

// Load version info when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadVersionInfo);
} else {
    loadVersionInfo();
}

// Background script to update badge based on active filters

// Update badge when settings change
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        updateBadge();
    }
});

// Update badge on installation
chrome.runtime.onInstalled.addListener(() => {
    updateBadge();
});

// Update badge on startup
chrome.runtime.onStartup.addListener(() => {
    updateBadge();
});

function updateBadge() {
    chrome.storage.sync.get({
        mode: 'clean',
        hideShortText: true,
        showOnlyImage: false,
        showOnlyVideo: false,
        showImageVideo: false,
        languageFilter: 'all'
    }, (settings) => {
        // Safety check
        if (!settings) {
            console.log('X Cleaner: No settings found');
            return;
        }

        const mode = settings.mode || 'clean';
        console.log('X Cleaner: Updating badge, mode =', mode);

        // If in clean mode, show "ON" badge
        if (mode === 'clean' || mode === 'refined') {
            chrome.action.setBadgeText({ text: 'ON' });
            chrome.action.setBadgeBackgroundColor({ color: '#1d9bf0' }); // Twitter blue
            console.log('X Cleaner: Badge set to ON');
        } else {
            // Original mode: no badge
            chrome.action.setBadgeText({ text: '' });
            console.log('X Cleaner: Badge cleared');
        }
    });
}

// Initial update - run immediately
updateBadge();

// Also update after a short delay to ensure storage is ready
setTimeout(updateBadge, 500);

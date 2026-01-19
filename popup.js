document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const modeToggle = document.getElementById('modeToggle');
  const modeText = document.getElementById('modeText');

  // New elements
  const whitelistInput = document.getElementById('whitelist');
  const whitelistCount = document.getElementById('whitelistCount');
  const showOnlyVerified = document.getElementById('showOnlyVerified');

  // Existing elements
  const hideShortText = document.getElementById('hideShortText');
  const showOnlyImage = document.getElementById('showOnlyImage');
  const showOnlyVideo = document.getElementById('showOnlyVideo');
  const showImageVideo = document.getElementById('showImageVideo');
  const languageFilter = document.getElementById('languageFilter');
  const minViews = document.getElementById('minViews');
  const maxViews = document.getElementById('maxViews');
  const minLikes = document.getElementById('minLikes');
  const maxLikes = document.getElementById('maxLikes');
  const minRetweets = document.getElementById('minRetweets');
  const maxRetweets = document.getElementById('maxRetweets');

  const saveBtn = document.getElementById('saveBtn');
  const saveStatus = document.getElementById('saveStatus');

  // Default Settings
  const defaultSettings = {
    mode: 'refined',
    hideShortText: true,
    showOnlyImage: false,
    showOnlyVideo: false,
    showImageVideo: false,
    languageFilter: 'all',
    minViews: 0,
    maxViews: 0,
    minLikes: 0,
    maxLikes: 0,
    minRetweets: 0,
    maxRetweets: 0,
    whitelist: [],
    showOnlyVerified: false
  };

  // Load Settings
  chrome.storage.sync.get(defaultSettings, (items) => {
    // Set Mode Toggle
    modeToggle.checked = items.mode === 'refined';
    updateUIState(items.mode);

    // Set whitelist
    if (items.whitelist && items.whitelist.length > 0) {
      whitelistInput.value = items.whitelist.join(', ');
      updateWhitelistCount(items.whitelist.length);
    }

    // Set verification filter
    showOnlyVerified.checked = items.showOnlyVerified || false;

    // Set Filters
    hideShortText.checked = items.hideShortText;
    showOnlyImage.checked = items.showOnlyImage;
    showOnlyVideo.checked = items.showOnlyVideo;
    showImageVideo.checked = items.showImageVideo;
    languageFilter.value = items.languageFilter;

    // Set engagement filters
    minViews.value = items.minViews || '';
    maxViews.value = items.maxViews || '';
    minLikes.value = items.minLikes || '';
    maxLikes.value = items.maxLikes || '';
    minRetweets.value = items.minRetweets || '';
    maxRetweets.value = items.maxRetweets || '';
  });

  // Parse whitelist input
  function parseWhitelist(input) {
    if (!input || input.trim() === '') return [];

    // Split by comma, remove @ symbols, trim spaces, convert to lowercase, remove empty strings
    const accounts = input
      .split(',')
      .map(acc => acc.trim().replace(/^@/, '').toLowerCase())
      .filter(acc => acc.length > 0);

    // Remove duplicates using Set
    return [...new Set(accounts)];
  }

  // Update whitelist count display
  function updateWhitelistCount(count) {
    whitelistCount.textContent = count > 0 ? `当前 ${count} 个账号` : '';
  }

  // Update count when whitelist input changes
  whitelistInput.addEventListener('blur', () => {
    const accounts = parseWhitelist(whitelistInput.value);
    updateWhitelistCount(accounts.length);
    if (accounts.length > 0) {
      whitelistInput.value = accounts.join(', ');
    }
  });

  // Event Listener for Mode Toggle
  modeToggle.addEventListener('change', (e) => {
    const newMode = e.target.checked ? 'refined' : 'original';
    updateUIState(newMode);

    // Auto-save mode change immediately
    chrome.storage.sync.get(defaultSettings, (currentSettings) => {
      const updatedSettings = {
        ...currentSettings,
        mode: newMode
      };

      chrome.storage.sync.set(updatedSettings, () => {
        showStatus('模式已切换');
      });
    });
  });

  // Save Button
  saveBtn.addEventListener('click', () => {
    const whitelistAccounts = parseWhitelist(whitelistInput.value);

    const settings = {
      mode: modeToggle.checked ? 'refined' : 'original',
      whitelist: whitelistAccounts,
      showOnlyVerified: showOnlyVerified.checked,
      hideShortText: hideShortText.checked,
      showOnlyImage: showOnlyImage.checked,
      showOnlyVideo: showOnlyVideo.checked,
      showImageVideo: showImageVideo.checked,
      languageFilter: languageFilter.value,
      minViews: parseInt(minViews.value) || 0,
      maxViews: parseInt(maxViews.value) || 0,
      minLikes: parseInt(minLikes.value) || 0,
      maxLikes: parseInt(maxLikes.value) || 0,
      minRetweets: parseInt(minRetweets.value) || 0,
      maxRetweets: parseInt(maxRetweets.value) || 0
    };

    chrome.storage.sync.set(settings, () => {
      showStatus('✅ 设置已保存');
      updateWhitelistCount(whitelistAccounts.length);

      // **FIX #1: Reload X/Twitter tab to apply filters**
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            console.log('PureFeed: Tab query error:', chrome.runtime.lastError);
            return;
          }
          if (tabs && tabs[0] && tabs[0].url && tabs[0].url.includes('x.com')) {
            chrome.tabs.reload(tabs[0].id, () => {
              if (chrome.runtime.lastError) {
                console.log('PureFeed: Reload error:', chrome.runtime.lastError);
              }
            });
          }
        });
      } catch (err) {
        console.log('PureFeed: Error reloading tab:', err);
      }
    });
  });

  function updateUIState(mode) {
    const whitelistSection = document.querySelector('.whitelist-section');
    const accountSection = document.querySelector('.account-section');
    const contentSection = document.querySelector('.content-section');

    if (mode === 'original') {
      whitelistSection?.classList.add('disabled');
      accountSection?.classList.add('disabled');
      contentSection?.classList.add('disabled');
      modeText.textContent = '原始模式';
      modeText.style.color = '#536471';
      saveBtn.disabled = true;
    } else {
      whitelistSection?.classList.remove('disabled');
      accountSection?.classList.remove('disabled');
      contentSection?.classList.remove('disabled');
      modeText.textContent = '精简模式';
      modeText.style.color = 'var(--primary-color)';
      saveBtn.disabled = false;
    }
  }

  function showStatus(msg) {
    saveStatus.textContent = msg;
    saveStatus.classList.add('show');
    setTimeout(() => {
      saveStatus.classList.remove('show');
    }, 2000);
  }
});

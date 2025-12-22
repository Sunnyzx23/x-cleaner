document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const modeToggle = document.getElementById('modeToggle');
  const modeText = document.getElementById('modeText');
  const filterSection = document.getElementById('filterSection');

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
    mode: 'clean',
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
    maxRetweets: 0
  };

  // Load Settings
  chrome.storage.sync.get(defaultSettings, (items) => {
    // Set Mode Toggle
    modeToggle.checked = items.mode === 'clean';
    updateUIState(items.mode);

    // Set Filters
    hideShortText.checked = items.hideShortText;
    showOnlyImage.checked = items.showOnlyImage;
    showOnlyVideo.checked = items.showOnlyVideo;
    showImageVideo.checked = items.showImageVideo;
    languageFilter.value = items.languageFilter;

    // Set engagement filters (both min and max)
    minViews.value = items.minViews || '';
    maxViews.value = items.maxViews || '';
    minLikes.value = items.minLikes || '';
    maxLikes.value = items.maxLikes || '';
    minRetweets.value = items.minRetweets || '';
    maxRetweets.value = items.maxRetweets || '';
  });

  // Event Listener for Mode Toggle
  modeToggle.addEventListener('change', (e) => {
    const newMode = e.target.checked ? 'clean' : 'original';
    updateUIState(newMode);

    // Auto-save mode change immediately
    chrome.storage.sync.get(defaultSettings, (currentSettings) => {
      const updatedSettings = {
        ...currentSettings,
        mode: newMode
      };

      chrome.storage.sync.set(updatedSettings, () => {
        showStatus('模式已切换');
        // Reload the page to apply mode change
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
          console.log('PureFeed: Error in mode toggle:', err);
        }
      });
    });
  });

  // Save Button
  saveBtn.addEventListener('click', () => {
    const settings = {
      mode: modeToggle.checked ? 'clean' : 'original',
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
      showStatus('设置已保存');
      // Notify content script and reload the page to apply new filters
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
        console.log('PureFeed: Error in save:', err);
      }
      // Badge will be updated automatically via storage.onChanged in background.js
    });
  });

  function updateUIState(mode) {
    const filterSection = document.getElementById('filterSection');
    const languageSection = document.querySelector('.language-section');
    const engagementSection = document.querySelector('.engagement-section');

    if (mode === 'original') {
      filterSection.classList.add('disabled');
      languageSection?.classList.add('disabled');
      engagementSection?.classList.add('disabled');
      modeText.textContent = '原始模式';
      modeText.style.color = '#536471';
      // Disable save button in original mode
      saveBtn.disabled = true;

      // Add click handler to switch mode
      filterSection.onclick = handleOverlayClick;
    } else {
      filterSection.classList.remove('disabled');
      languageSection?.classList.remove('disabled');
      engagementSection?.classList.remove('disabled');
      modeText.textContent = '精简模式';
      modeText.style.color = 'var(--primary-color)';
      // Enable save button in clean mode
      saveBtn.disabled = false;

      // Remove click handler
      filterSection.onclick = null;
    }
  }

  function handleOverlayClick() {
    // Switch to clean mode
    modeToggle.checked = true;
    modeToggle.dispatchEvent(new Event('change'));
  }

  function showStatus(msg) {
    saveStatus.textContent = msg;
    saveStatus.classList.add('show');
    setTimeout(() => {
      saveStatus.classList.remove('show');
    }, 2000);
  }
});

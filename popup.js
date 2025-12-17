document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const modeRadios = document.getElementsByName('mode');
  const filterSection = document.getElementById('filterSection');
  const statusBadge = document.getElementById('statusBadge');

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
    // Set Mode
    for (const radio of modeRadios) {
      if (radio.value === items.mode) {
        radio.checked = true;
      }
    }
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

  // Event Listeners for Mode
  for (const radio of modeRadios) {
    radio.addEventListener('change', (e) => {
      const newMode = e.target.value;
      updateUIState(newMode);

      // Auto-save mode change immediately
      chrome.storage.sync.get(defaultSettings, (currentSettings) => {
        const updatedSettings = {
          ...currentSettings,
          mode: newMode
        };

        chrome.storage.sync.set(updatedSettings, () => {
          showStatus('模式已切换');
          // Notify content script immediately
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.url?.includes('x.com')) {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: 'updateSettings',
                settings: updatedSettings
              });
            }
          });
        });
      });
    });
  }

  // Save Button
  saveBtn.addEventListener('click', () => {
    const settings = {
      mode: document.querySelector('input[name="mode"]:checked').value,
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
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url?.includes('x.com')) {
          // Reload the page to apply new filter settings
          chrome.tabs.reload(tabs[0].id);
        }
      });
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
      statusBadge.textContent = '原始模式';
      statusBadge.classList.add('original');

      // Add click handler to overlay to switch to clean mode
      filterSection.addEventListener('click', switchToCleanMode);
    } else {
      filterSection.classList.remove('disabled');
      languageSection?.classList.remove('disabled');
      engagementSection?.classList.remove('disabled');
      statusBadge.textContent = '精简模式';
      statusBadge.classList.remove('original');

      // Remove click handler
      filterSection.removeEventListener('click', switchToCleanMode);
    }
  }

  function switchToCleanMode() {
    // Find and click the clean mode radio button
    const cleanRadio = document.querySelector('input[name="mode"][value="clean"]');
    if (cleanRadio && !cleanRadio.checked) {
      cleanRadio.checked = true;
      // Trigger change event to auto-save
      cleanRadio.dispatchEvent(new Event('change'));
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

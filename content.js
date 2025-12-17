// X Cleaner - Content Script
// Architecture v2 - Stable and reliable

console.log('X Cleaner: Content script loaded v2');

// Settings
let settings = {
    mode: 'refined',
    hideShortText: false,
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

// Cache for tweet data (prevents re-extraction)
const tweetDataCache = new WeakMap();

// Debounce timer for notifications
let notificationDebounce = null;

// Initialize
function init() {
    loadSettings();
    observeNewTweets();
}

// Load settings from storage
function loadSettings() {
    chrome.storage.sync.get([
        'mode',
        'hideShortText',
        'showOnlyImage',
        'showOnlyVideo',
        'showImageVideo',
        'languageFilter',
        'minViews', 'maxViews',
        'minLikes', 'maxLikes',
        'minRetweets', 'maxRetweets'
    ], (items) => {
        settings = { ...settings, ...items };
        console.log('X Cleaner: Settings loaded', settings);

        // Update visibility of already-processed tweets (don't reprocess)
        updateAllTweetVisibility();
    });
}

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
        loadSettings();
    }
});

// Update visibility of all processed tweets without re-extracting data
function updateAllTweetVisibility() {
    const tweets = document.querySelectorAll('article[data-x-processed="done"]');

    tweets.forEach(tweet => {
        const cachedData = tweetDataCache.get(tweet);
        if (cachedData) {
            applyVisibility(tweet, cachedData);
        }
    });

    scheduleNotificationUpdate();
}

// Observe new tweets
function observeNewTweets() {
    const observer = new MutationObserver((mutations) => {
        let hasNewTweets = false;

        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    if (node.matches && node.matches('article[data-testid="tweet"]')) {
                        if (processTweet(node)) hasNewTweets = true;
                    } else if (node.querySelectorAll) {
                        const tweets = node.querySelectorAll('article[data-testid="tweet"]');
                        tweets.forEach(t => {
                            if (processTweet(t)) hasNewTweets = true;
                        });
                    }
                }
            });
        });

        if (hasNewTweets) {
            scheduleNotificationUpdate();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Process existing tweets on page
    setTimeout(() => {
        document.querySelectorAll('article[data-testid="tweet"]').forEach(processTweet);
        scheduleNotificationUpdate();
    }, 500);
}

// Process a single tweet - returns true if newly processed
function processTweet(tweet) {
    // Skip if already processed or pending
    const status = tweet.getAttribute('data-x-processed');
    if (status) {
        return false;
    }

    // Mark as pending
    tweet.setAttribute('data-x-processed', 'pending');

    // Skip in original mode
    if (settings.mode === 'original') {
        tweet.setAttribute('data-x-processed', 'done');
        return true;
    }

    // Skip on single tweet pages
    if (window.location.pathname.includes('/status/')) {
        tweet.setAttribute('data-x-processed', 'done');
        return true;
    }

    // Wait for lazy-loaded media, then process
    setTimeout(() => {
        finalizeTweet(tweet);
    }, 300);

    return true;
}

// Finalize tweet processing after media loads
function finalizeTweet(tweet) {
    // Extract and cache data
    const data = extractTweetData(tweet);
    tweetDataCache.set(tweet, data);

    // Apply visibility
    applyVisibility(tweet, data);

    // Mark as done
    tweet.setAttribute('data-x-processed', 'done');
}

// Apply visibility based on filter results
function applyVisibility(tweet, data) {
    const shouldHide = applyFilters(data);

    if (shouldHide) {
        tweet.style.visibility = 'hidden';
        tweet.style.height = '0';
        tweet.style.overflow = 'hidden';
        tweet.style.margin = '0';
        tweet.style.padding = '0';
    } else {
        tweet.style.visibility = 'visible';
        tweet.style.height = '';
        tweet.style.overflow = '';
        tweet.style.margin = '';
        tweet.style.padding = '';
    }
}

// Extract tweet data
function extractTweetData(tweet) {
    // Text
    const textNode = tweet.querySelector('[data-testid="tweetText"]');
    const text = textNode ? textNode.innerText : '';

    // Media detection
    const videoElement = tweet.querySelector('video');
    const tweetPhoto = tweet.querySelector('[data-testid="tweetPhoto"]');
    const videoPlayer = tweet.querySelector('[data-testid="videoPlayer"]');

    const hasVideo = !!videoPlayer || !!videoElement;
    const hasImage = !!tweetPhoto && !hasVideo;

    // Language detection
    const zhChars = text.match(/[\u4e00-\u9fff]/g) || [];
    const zhCount = zhChars.length;
    const isChinese = zhCount > 10 || (zhCount > 0 && zhCount / text.length > 0.4);

    // Word count for English
    const enWords = text.replace(/https?:\/\/\S+/g, '').replace(/@\w+/g, '').split(/\s+/).filter(w => w.length > 0 && !/[\u4e00-\u9fff]/.test(w));
    const enWordCount = enWords.length;

    // Engagement metrics
    const metrics = extractEngagement(tweet);

    return {
        text,
        hasImage,
        hasVideo,
        isChinese,
        zhCount,
        enWordCount,
        views: metrics.views,
        likes: metrics.likes,
        retweets: metrics.retweets
    };
}

// Extract engagement metrics
function extractEngagement(tweet) {
    const metrics = { views: 0, likes: 0, retweets: 0 };

    try {
        const buttons = tweet.querySelectorAll('[role="group"] [role="button"]');

        buttons.forEach(btn => {
            const label = (btn.getAttribute('aria-label') || '').toLowerCase();
            const text = btn.textContent || '';

            if (label.includes('view') || label.includes('浏览')) {
                metrics.views = parseNumber(text);
            } else if (label.includes('like')) {
                metrics.likes = parseNumber(text);
            } else if (label.includes('repost') || label.includes('retweet')) {
                metrics.retweets = parseNumber(text);
            }
        });
    } catch (e) {
        // Silent fail
    }

    return metrics;
}

// Parse engagement number
function parseNumber(str) {
    if (!str) return 0;

    str = str.trim();
    const match = str.match(/([\d,.]+)([KMB]?)/i);
    if (!match) return 0;

    let num = parseFloat(match[1].replace(/,/g, ''));
    const suffix = match[2].toUpperCase();

    if (suffix === 'K') num *= 1000;
    else if (suffix === 'M') num *= 1000000;
    else if (suffix === 'B') num *= 1000000000;

    return Math.floor(num);
}

// Apply all filters
function applyFilters(data) {
    // Short text filter
    if (settings.hideShortText) {
        if (data.isChinese && data.zhCount < 45) return true;
        if (!data.isChinese && data.enWordCount < 30) return true;
    }

    // Language filter
    if (settings.languageFilter === 'zh' && !data.isChinese) return true;
    if (settings.languageFilter === 'non-zh' && data.isChinese) return true;

    // Media filter
    if (settings.showOnlyImage || settings.showOnlyVideo || settings.showImageVideo) {
        let match = false;

        if (settings.showOnlyImage && data.hasImage) match = true;
        if (settings.showOnlyVideo && data.hasVideo) match = true;
        if (settings.showImageVideo && (data.hasImage || data.hasVideo)) match = true;

        if (!match) return true;
    }

    // Engagement filters (only if data exists)
    if (settings.minViews > 0 && data.views > 0 && data.views < settings.minViews) return true;
    if (settings.maxViews > 0 && data.views > 0 && data.views > settings.maxViews) return true;

    if (settings.minLikes > 0 && data.likes > 0 && data.likes < settings.minLikes) return true;
    if (settings.maxLikes > 0 && data.likes > 0 && data.likes > settings.maxLikes) return true;

    if (settings.minRetweets > 0 && data.retweets > 0 && data.retweets < settings.minRetweets) return true;
    if (settings.maxRetweets > 0 && data.retweets > 0 && data.retweets > settings.maxRetweets) return true;

    return false;
}

// Schedule notification update with debounce
function scheduleNotificationUpdate() {
    if (notificationDebounce) {
        clearTimeout(notificationDebounce);
    }
    notificationDebounce = setTimeout(() => {
        updateNotification();
    }, 1000);
}

// Update notification
function updateNotification() {
    const allTweets = document.querySelectorAll('article[data-x-processed="done"]');
    let shown = 0;
    let filtered = 0;

    allTweets.forEach(tweet => {
        if (tweet.style.visibility === 'hidden') {
            filtered++;
        } else {
            shown++;
        }
    });

    // Only show if many filtered and none shown
    if (allTweets.length > 20 && shown === 0) {
        showNotification();
    } else {
        hideNotification();
    }
}

// Show notification
function showNotification() {
    if (document.getElementById('x-cleaner-notification')) return;

    const banner = document.createElement('div');
    banner.id = 'x-cleaner-notification';
    banner.style.cssText = `
        position: fixed;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        background: linear-gradient(135deg, #1d9bf0 0%, #1a8cd8 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 500px;
    `;

    const container = document.createElement('div');
    container.style.cssText = 'display: flex; align-items: center; gap: 12px;';

    const icon = document.createElement('div');
    icon.style.fontSize = '24px';
    icon.textContent = '⚠️';

    const content = document.createElement('div');
    content.style.flex = '1';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight: 600; margin-bottom: 4px;';
    title.textContent = '过滤条件过于严格';

    const message = document.createElement('div');
    message.style.cssText = 'font-size: 13px; opacity: 0.9;';
    message.textContent = '当前筛选出的推文不足，建议适当放宽过滤条件。';

    content.appendChild(title);
    content.appendChild(message);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
        background: rgba(255,255,255,0.3);
        border: 2px solid rgba(255,255,255,0.5);
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        line-height: 24px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
    `;
    closeBtn.onmouseover = () => {
        closeBtn.style.background = 'rgba(255,255,255,0.5)';
        closeBtn.style.transform = 'scale(1.1)';
    };
    closeBtn.onmouseout = () => {
        closeBtn.style.background = 'rgba(255,255,255,0.3)';
        closeBtn.style.transform = 'scale(1)';
    };
    closeBtn.onclick = () => banner.remove();

    container.appendChild(icon);
    container.appendChild(content);
    container.appendChild(closeBtn);
    banner.appendChild(container);

    document.body.appendChild(banner);
}

// Hide notification
function hideNotification() {
    const banner = document.getElementById('x-cleaner-notification');
    if (banner) banner.remove();
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

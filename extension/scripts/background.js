/**
 * SentinelVault Extension Manifest V3 Background Service Worker
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('🛡️ SentinelVault Chrome Extension installed successfully.');
});

// In-memory unlocked session state
let activeUnlockedState = null;

// Listen for background extension messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SENTINEL_WEB_SESSION' && message.session) {
    chrome.storage.local.set({
      userSession: message.session,
      lastEmail: message.session.email
    });
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'STORE_UNLOCKED_SESSION') {
    const { email, vaultItems, autoLockMinutes } = message;
    activeUnlockedState = {
      email,
      vaultItems,
      unlockedAt: Date.now(),
      autoLockMinutes: autoLockMinutes || 15
    };
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
        chrome.storage.session.set({ unlockedState: activeUnlockedState });
      }
    } catch (e) {
      console.warn('chrome.storage.session not supported:', e);
    }
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'GET_UNLOCKED_SESSION') {
    const processCheck = (state) => {
      if (!state || !state.unlockedAt) {
        sendResponse({ isUnlocked: false });
        return;
      }

      if (state.autoLockMinutes === 'never') {
        sendResponse({
          isUnlocked: true,
          email: state.email,
          vaultItems: state.vaultItems
        });
        return;
      }

      const autoLockMs = (parseInt(state.autoLockMinutes, 10) || 15) * 60 * 1000;
      const elapsed = Date.now() - state.unlockedAt;

      if (elapsed > autoLockMs) {
        activeUnlockedState = null;
        try {
          if (chrome.storage && chrome.storage.session) chrome.storage.session.remove('unlockedState');
        } catch (e) {}
        sendResponse({ isUnlocked: false, reason: 'timeout' });
      } else {
        sendResponse({
          isUnlocked: true,
          email: state.email,
          vaultItems: state.vaultItems
        });
      }
    };

    if (activeUnlockedState) {
      processCheck(activeUnlockedState);
    } else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
      try {
        chrome.storage.session.get(['unlockedState'], (res) => {
          activeUnlockedState = (res && res.unlockedState) || null;
          processCheck(activeUnlockedState);
        });
      } catch (e) {
        sendResponse({ isUnlocked: false });
      }
    } else {
      sendResponse({ isUnlocked: false });
    }
    return true;
  }

  if (message.type === 'UPDATE_AUTOLOCK') {
    if (activeUnlockedState) {
      activeUnlockedState.autoLockMinutes = message.autoLockMinutes || '15';
      try {
        if (chrome.storage && chrome.storage.session) {
          chrome.storage.session.set({ unlockedState: activeUnlockedState });
        }
      } catch (e) {}
    }
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'LOCK_VAULT') {
    activeUnlockedState = null;
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
        chrome.storage.session.remove('unlockedState');
      }
    } catch (e) {}
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'GET_CONFIG') {
    chrome.storage.local.get(['serverUrl', 'userSession', 'lastEmail'], (res) => {
      sendResponse(res);
    });
    return true;
  }
});

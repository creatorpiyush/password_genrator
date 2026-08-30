/**
 * SentinelVault Chrome Extension Popup Script
 */

let activeSession = null;
let masterKey = null;
let currentVaultItems = [];
let activeTabDomain = '';

// DOM Elements
const lockedView = document.getElementById('lockedView');
const unlockedView = document.getElementById('unlockedView');
const lockBtn = document.getElementById('lockBtn');
const unlockForm = document.getElementById('unlockForm');
const userEmailInput = document.getElementById('userEmail');
const emailInputGroup = document.getElementById('emailInputGroup');
const accountDetectedBadge = document.getElementById('accountDetectedBadge');
const detectedAccountText = document.getElementById('detectedAccountText');
const masterPasswordInput = document.getElementById('masterPassword');
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const unlockError = document.getElementById('unlockError');

const searchInput = document.getElementById('searchInput');
const vaultList = document.getElementById('vaultList');
const emptyVault = document.getElementById('emptyVault');
const currentTabBadge = document.getElementById('currentTabBadge');
const currentDomainSpan = document.getElementById('currentDomain');

const genResult = document.getElementById('genResult');
const copyGenBtn = document.getElementById('copyGenBtn');
const lengthRange = document.getElementById('lengthRange');
const lengthVal = document.getElementById('lengthVal');
const incUpper = document.getElementById('incUpper');
const incLower = document.getElementById('incLower');
const incNum = document.getElementById('incNum');
const incSym = document.getElementById('incSym');
const regenBtn = document.getElementById('regenBtn');

// Server URL helper
let activeServerUrl = 'https://sentinel-vault-hdmo.onrender.com';

async function getStoredServerUrl() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const res = await chrome.storage.local.get(['serverUrl']);
    if (res.serverUrl) activeServerUrl = res.serverUrl;
  }
  return activeServerUrl;
}

const syncNowBtn = document.getElementById('syncNowBtn');
const autoLockSelect = document.getElementById('autoLockSelect');
const autoFillToggle = document.getElementById('autoFillToggle');
const clearClipboardToggle = document.getElementById('clearClipboardToggle');

const settingsUsername = document.getElementById('settingsUsername');
const settingsEmail = document.getElementById('settingsEmail');
const settingsProvider = document.getElementById('settingsProvider');
const settingsAvatar = document.getElementById('settingsAvatar');
const lockVaultSettingBtn = document.getElementById('lockVaultSettingBtn');

function updateSettingsProfile(session) {
  if (!session) return;
  const username = session.username || session.email?.split('@')[0] || 'Vault User';
  const email = session.email || 'user@sentinel.io';
  const provider = session.provider === 'github' ? '🛡️ GitHub Account' : session.provider === 'google' ? '🌐 Google Account' : '🔒 Zero-Knowledge Account';

  if (settingsUsername) settingsUsername.textContent = username;
  if (settingsEmail) settingsEmail.textContent = email;
  if (settingsProvider) settingsProvider.textContent = provider;
  if (settingsAvatar) settingsAvatar.textContent = username.charAt(0).toUpperCase();
}

// Crypto Helpers: PBKDF2 Key Derivation
async function deriveMasterKey(password, salt) {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

// Crypto Helpers: AES-256-GCM Decryption
async function decryptText(ciphertextHex, ivHex, key) {
  try {
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const ciphertext = new Uint8Array(ciphertextHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    return '*** Decryption Failed ***';
  }
}

// Helper: Get active tab domain
async function getActiveTabDomain() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].url) {
          try {
            const url = new URL(tabs[0].url);
            const host = url.hostname.replace(/^www\./, '');
            if (host && !host.includes('extension') && !host.startsWith('chrome')) {
              resolve(host);
            } else {
              resolve('');
            }
          } catch (e) {
            resolve('');
          }
        } else {
          resolve('');
        }
      });
    } else {
      resolve('');
    }
  });
}

// CSPRNG Password Generator
function generatePassword() {
  const length = parseInt(lengthRange.value, 10);
  const u = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const l = 'abcdefghijklmnopqrstuvwxyz';
  const n = '0123456789';
  const s = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charset = '';
  if (incUpper.checked) charset += u;
  if (incLower.checked) charset += l;
  if (incNum.checked) charset += n;
  if (incSym.checked) charset += s;

  if (!charset) charset = l + n;

  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }

  genResult.value = result;

  const strengthBar = document.getElementById('strengthBar');
  if (strengthBar) {
    strengthBar.className = 'strength-bar';
    if (length < 12) {
      strengthBar.classList.add('weak');
    } else if (length < 16) {
      strengthBar.classList.add('medium');
    } else {
      strengthBar.classList.add('strong');
    }
  }
}

// Initial Load
document.addEventListener('DOMContentLoaded', async () => {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Toggle password visibility
  togglePasswordBtn.addEventListener('click', () => {
    const type = masterPasswordInput.type === 'password' ? 'text' : 'password';
    masterPasswordInput.type = type;
    togglePasswordBtn.textContent = type === 'password' ? '👁️' : '🙈';
  });

  // Generator Events
  lengthRange.addEventListener('input', () => {
    lengthVal.textContent = lengthRange.value;
    generatePassword();
  });
  [incUpper, incLower, incNum, incSym].forEach(cb => cb.addEventListener('change', generatePassword));
  regenBtn.addEventListener('click', generatePassword);
  copyGenBtn.addEventListener('click', () => {
    copyToClipboardWithAutoClear(genResult.value);
    const copyText = document.getElementById('copyText');
    const copyIcon = document.getElementById('copyIcon');
    if (copyText) copyText.textContent = 'Copied!';
    if (copyIcon) copyIcon.textContent = '✓';
    setTimeout(() => {
      if (copyText) copyText.textContent = 'Copy';
      if (copyIcon) copyIcon.textContent = '📋';
    }, 1500);
  });
  generatePassword();

  // Load active tab domain (Do NOT pre-fill search input so all items show by default)
  activeTabDomain = await getActiveTabDomain();
  if (activeTabDomain) {
    currentTabBadge.style.display = 'block';
    currentDomainSpan.textContent = activeTabDomain;
    currentTabBadge.addEventListener('click', () => {
      if (searchInput.value === activeTabDomain) {
        searchInput.value = '';
      } else {
        searchInput.value = activeTabDomain;
      }
      renderVaultItems();
    });
  }

  // Check stored session in chrome.storage & auto-detect server session via /api/v1/auth/me
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ type: 'GET_UNLOCKED_SESSION' }, (unlockedRes) => {
      if (chrome.runtime.lastError) return;
      if (unlockedRes && unlockedRes.isUnlocked) {
        currentVaultItems = unlockedRes.vaultItems || [];
        lockedView.classList.remove('active');
        unlockedView.classList.add('active');
        lockBtn.style.display = 'block';
        renderVaultItems();
      }
    });
  }

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['lastEmail', 'userSession', 'autoLockMinutes', 'autoFillEnabled', 'clearClipboardEnabled'], async (res) => {
      if (res.lastEmail && userEmailInput) userEmailInput.value = res.lastEmail;
      if (res.autoLockMinutes && autoLockSelect) autoLockSelect.value = res.autoLockMinutes;
      if (typeof res.autoFillEnabled === 'boolean' && autoFillToggle) autoFillToggle.checked = res.autoFillEnabled;
      if (typeof res.clearClipboardEnabled === 'boolean' && clearClipboardToggle) clearClipboardToggle.checked = res.clearClipboardEnabled;

      if (res.userSession && res.userSession.email) {
        activeSession = res.userSession;
        userEmailInput.value = res.userSession.email;
        updateSettingsProfile(activeSession);
        if (emailInputGroup && accountDetectedBadge && detectedAccountText) {
          emailInputGroup.style.display = 'none';
          const providerName = res.userSession.provider === 'github' ? 'GitHub' : res.userSession.provider === 'google' ? 'Google' : 'Zero-Knowledge Account';
          detectedAccountText.textContent = `👤 Logged in as ${res.userSession.username || res.userSession.email} (${providerName})`;
          accountDetectedBadge.style.display = 'block';
        }
        masterPasswordInput.focus();
      }

      // Check active server session (/api/v1/auth/me)
      const serverUrl = await getStoredServerUrl();
      try {
        const meRes = await fetch(`${serverUrl}/api/v1/auth/me`, { credentials: 'include' });
        const meData = await meRes.json();
        if (meData.success && meData.email) {
          activeSession = meData;
          userEmailInput.value = meData.email;
          updateSettingsProfile(activeSession);
          if (emailInputGroup && accountDetectedBadge && detectedAccountText) {
            emailInputGroup.style.display = 'none';
            const providerName = meData.provider === 'github' ? 'GitHub' : meData.provider === 'google' ? 'Google' : 'Zero-Knowledge Account';
            detectedAccountText.textContent = `👤 Logged in as ${meData.username || meData.email} (${providerName})`;
            accountDetectedBadge.style.display = 'block';
          }
          masterPasswordInput.focus();
        }
      } catch (err) {
        // Fallback: leave email field visible if not authenticated on server
      }
    });
  }

  if (lockVaultSettingBtn) {
    lockVaultSettingBtn.addEventListener('click', () => lockBtn.click());
  }

  // Settings: Auto-Lock Change Listener
  if (autoLockSelect) {
    autoLockSelect.addEventListener('change', () => {
      const autoLockMinutes = autoLockSelect.value;
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ autoLockMinutes });
      }
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'UPDATE_AUTOLOCK', autoLockMinutes });
      }
    });
  }

  // Settings: Preference Toggles
  if (autoFillToggle) {
    autoFillToggle.addEventListener('change', () => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ autoFillEnabled: autoFillToggle.checked });
      }
    });
  }

  if (clearClipboardToggle) {
    clearClipboardToggle.addEventListener('change', () => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ clearClipboardEnabled: clearClipboardToggle.checked });
      }
    });
  }

  // Settings: Manual Sync Handler
  if (syncNowBtn) {
    syncNowBtn.addEventListener('click', async () => {
      const email = userEmailInput ? userEmailInput.value.trim().toLowerCase() : '';
      if (!email || !masterKey) {
        alert('Vault must be unlocked to sync.');
        return;
      }
      syncNowBtn.textContent = '🔄 Syncing...';
      try {
        const serverUrl = await getStoredServerUrl();
        const res = await fetch(`${serverUrl}/api/v1/vault/pull?email=${encodeURIComponent(email)}`, {
          headers: activeSession?.token ? { 'Authorization': `Bearer ${activeSession.token}` } : {}
        });
        const data = await res.json();
        let encryptedItems = [];
        if (data.items && Array.isArray(data.items)) {
          encryptedItems = data.items;
        } else if (data.encryptedItems && Array.isArray(data.encryptedItems)) {
          encryptedItems = data.encryptedItems;
        }
        
        const decryptedList = await Promise.all(encryptedItems.map(async (item) => {
          let decPass = '*** Encrypted ***';
          if (item.encryptedPassword && item.encryptedPassword.ciphertext) {
            decPass = await decryptText(item.encryptedPassword.ciphertext, item.encryptedPassword.iv, masterKey);
          } else if (item.password) {
            decPass = item.password;
          }
          return {
            id: item.id || (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
            applicationName: item.applicationName || 'App',
            applicationUsername: item.applicationUsername || 'User',
            password: decPass,
          };
        }));

        const seen = new Set();
        currentVaultItems = decryptedList.filter(item => {
          if (item.password === '*** Decryption Failed ***') return false;
          const key = `${item.applicationName.toLowerCase()}_${item.applicationUsername.toLowerCase()}_${item.password}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        renderVaultItems();
        syncNowBtn.textContent = '✓ Synced!';
        setTimeout(() => syncNowBtn.textContent = '🔄 Sync Cloud Vault', 1500);
      } catch (err) {
        syncNowBtn.textContent = '❌ Sync Failed';
        setTimeout(() => syncNowBtn.textContent = '🔄 Sync Cloud Vault', 1500);
      }
    });
  }

  // Unlock Handler
  unlockForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    unlockError.style.display = 'none';
    const email = userEmailInput ? userEmailInput.value.trim().toLowerCase() : '';
    const password = masterPasswordInput.value;
    const serverUrl = await getStoredServerUrl();

    if (!email || !password) {
      unlockError.textContent = 'Please enter both Email and Master Password';
      unlockError.style.display = 'block';
      return;
    }

    try {
      // Save last email to storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ lastEmail: email });
      }

      // 1. Fetch user salt from server
      let salt = null;
      try {
        const res = await fetch(`${serverUrl}/api/v1/auth/user-info?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.salt) {
          salt = data.salt;
        } else {
          throw new Error(data.error || 'User account not found on server');
        }
      } catch (err) {
        if (activeSession && activeSession.salt) {
          salt = activeSession.salt;
        } else {
          throw new Error('Could not retrieve security salt from server or local session: ' + err.message);
        }
      }

      // 2. Derive key
      masterKey = await deriveMasterKey(password, salt);

      // 3. Fetch encrypted vault items from server or storage
      let encryptedItems = [];
      try {
        const res = await fetch(`${serverUrl}/api/v1/vault/pull?email=${encodeURIComponent(email)}`, {
          headers: activeSession?.token ? { 'Authorization': `Bearer ${activeSession.token}` } : {}
        });
        const data = await res.json();
        if (data.items && Array.isArray(data.items)) {
          encryptedItems = data.items;
        } else if (data.encryptedItems && Array.isArray(data.encryptedItems)) {
          encryptedItems = data.encryptedItems;
        }
      } catch (err) {
        // Fallback to local Chrome storage if offline
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const stored = await chrome.storage.local.get(['vaultCache']);
          encryptedItems = stored.vaultCache || [];
        }
      }

      // 4. Decrypt items & filter out failed decryptions or duplicate entries
      const decryptedList = await Promise.all(encryptedItems.map(async (item) => {
        let decPass = '*** Encrypted ***';
        if (item.encryptedPassword && item.encryptedPassword.ciphertext) {
          decPass = await decryptText(item.encryptedPassword.ciphertext, item.encryptedPassword.iv, masterKey);
        } else if (item.password) {
          decPass = item.password;
        }
        return {
          id: item.id || (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
          applicationName: item.applicationName || 'App',
          applicationUsername: item.applicationUsername || 'User',
          password: decPass,
        };
      }));

      // Filter valid items & deduplicate
      const seen = new Set();
      currentVaultItems = decryptedList.filter(item => {
        if (item.password === '*** Decryption Failed ***') return false;
        const key = `${item.applicationName.toLowerCase()}_${item.applicationUsername.toLowerCase()}_${item.password}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Store unlocked session in background service worker
      const autoLockMinutes = autoLockSelect ? autoLockSelect.value : '15';
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'STORE_UNLOCKED_SESSION',
          email,
          vaultItems: currentVaultItems,
          autoLockMinutes
        });
      }

      // Switch view
      lockedView.classList.remove('active');
      unlockedView.classList.add('active');
      lockBtn.style.display = 'block';

      renderVaultItems();
    } catch (err) {
      unlockError.textContent = err.message || 'Failed to unlock vault';
      unlockError.style.display = 'block';
    }
  });

  // Lock Handler
  lockBtn.addEventListener('click', () => {
    masterKey = null;
    currentVaultItems = [];
    masterPasswordInput.value = '';
    unlockedView.classList.remove('active');
    lockedView.classList.add('active');
    lockBtn.style.display = 'none';

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'LOCK_VAULT' });
    }
  });

  // Search Filter
  searchInput.addEventListener('input', () => {
    renderVaultItems();
  });
});

// Render Vault Items
function renderVaultItems() {
  const query = searchInput.value.toLowerCase().trim();
  vaultList.innerHTML = '';

  const filtered = currentVaultItems.filter(item =>
    item.applicationName.toLowerCase().includes(query) ||
    item.applicationUsername.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    emptyVault.style.display = 'block';
    return;
  }

  emptyVault.style.display = 'none';

  filtered.forEach(item => {
    const el = document.createElement('div');
    el.className = 'vault-item';
    el.innerHTML = `
      <div class="item-info">
        <span class="item-name">${escapeHtml(item.applicationName)}</span>
        <span class="item-user">${escapeHtml(item.applicationUsername)}</span>
      </div>
      <div class="item-actions">
        <button class="btn-sm fill-btn" data-user="${escapeAttr(item.applicationUsername)}" data-pass="${escapeAttr(item.password)}">⚡ Fill</button>
        <button class="btn-sm copy-btn" data-pass="${escapeAttr(item.password)}">📋 Copy</button>
      </div>
    `;

    // 1-Click AutoFill Action
    el.querySelector('.fill-btn').addEventListener('click', (e) => {
      const username = item.applicationUsername;
      const password = item.password;
      const fillBtn = e.target;

      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0] && tabs[0].id) {
            const sendFillMessage = () => {
              chrome.tabs.sendMessage(
                tabs[0].id,
                { type: 'FILL_CREDENTIALS', username, password },
                (res) => {
                  const err = chrome.runtime.lastError;
                  if (!err && res && res.success) {
                    fillBtn.textContent = '⚡ Filled!';
                    setTimeout(() => fillBtn.textContent = '⚡ Fill', 1500);
                  } else if (err) {
                    // Try dynamic script injection if content script was not loaded on tab
                    if (chrome.scripting && chrome.scripting.executeScript) {
                      chrome.scripting.executeScript(
                        { target: { tabId: tabs[0].id }, files: ['scripts/content.js'] },
                        () => {
                          if (!chrome.runtime.lastError) {
                            chrome.tabs.sendMessage(
                              tabs[0].id,
                              { type: 'FILL_CREDENTIALS', username, password },
                              (res2) => {
                                const err2 = chrome.runtime.lastError;
                                if (!err2 && res2 && res2.success) {
                                  fillBtn.textContent = '⚡ Filled!';
                                  setTimeout(() => fillBtn.textContent = '⚡ Fill', 1500);
                                }
                              }
                            );
                          }
                        }
                      );
                    }
                  }
                }
              );
            };

            sendFillMessage();
          }
        });
      }
    });

    // Copy Password Action
    el.querySelector('.copy-btn').addEventListener('click', (e) => {
      copyToClipboardWithAutoClear(item.password);
      e.target.textContent = 'Copied!';
      setTimeout(() => e.target.textContent = '📋 Copy', 1500);
    });

    vaultList.appendChild(el);
  });
}

function copyToClipboardWithAutoClear(text) {
  navigator.clipboard.writeText(text);
  if (clearClipboardToggle && clearClipboardToggle.checked) {
    setTimeout(async () => {
      try {
        const current = await navigator.clipboard.readText();
        if (current === text) {
          await navigator.clipboard.writeText('');
        }
      } catch (e) {}
    }, 30000);
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return String(str || '').replace(/"/g, '&quot;');
}

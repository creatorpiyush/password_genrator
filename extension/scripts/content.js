/**
 * SentinelVault Content Script
 * Scans active web pages for username and password fields and performs 1-click auto-fill.
 */

// Listen for messages from extension popup
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FILL_CREDENTIALS') {
      const { username, password } = request;
      const success = fillLoginForm(username, password);
      sendResponse({ success });
    }
  });
}

/**
 * Finds and fills username and password inputs on the current web page.
 */
function fillLoginForm(username, password) {
  const passwordInputs = Array.from(document.querySelectorAll('input[type="password"]'));

  if (passwordInputs.length === 0) {
    return false;
  }

  // Target the first visible password field
  const passwordInput = passwordInputs.find(input => isElementVisible(input)) || passwordInputs[0];

  // Find corresponding username input (preceding text/email input in form or document)
  const usernameInput = findUsernameInput(passwordInput);

  // Fill Password
  if (passwordInput && password) {
    setInputValue(passwordInput, password);
  }

  // Fill Username
  if (usernameInput && username) {
    setInputValue(usernameInput, username);
  }

  return true;
}

/**
 * Finds preceding username or email input field for a given password field.
 */
function findUsernameInput(passwordInput) {
  if (!passwordInput) return null;

  // Check same parent form first
  const form = passwordInput.form;
  if (form) {
    const formInputs = Array.from(form.querySelectorAll('input[type="text"], input[type="email"], input[name*="user"], input[name*="email"], input[id*="user"], input[id*="email"]'));
    const visible = formInputs.find(i => isElementVisible(i));
    if (visible) return visible;
  }

  // Global search for closest preceding visible input
  const allInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"]'));
  return allInputs.find(i => isElementVisible(i)) || null;
}

/**
 * Sets input value and dispatches synthetic events for React/Angular/Vue compatibility.
 */
function setInputValue(input, value) {
  input.focus();

  // Handle React input setter override
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(input, value);
  } else {
    input.value = value;
  }

  // Trigger DOM events
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.blur();
}

/**
 * Helper to verify if an element is visible in the viewport.
 */
function isElementVisible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0 && el.offsetHeight > 0;
}

// Inject SentinelVault visual icon badge inside password fields on load
function injectSentinelIcons() {
  const passwordFields = document.querySelectorAll('input[type="password"]');
  passwordFields.forEach(field => {
    if (field.dataset.sentinelInjected) return;
    field.dataset.sentinelInjected = 'true';

    // Highlight container subtle ring
    field.addEventListener('focus', () => {
      field.style.boxShadow = '0 0 0 2px rgba(6, 182, 212, 0.4)';
    });
  });
}

// Detect if running on SentinelVault Web Application (localhost:5173 or Render)
function detectSentinelWebAppSession() {
  try {
    const rawSession = window.sessionStorage.getItem('sentinel_active_session');
    if (rawSession && typeof chrome !== 'undefined' && chrome.runtime) {
      const sessionObj = JSON.parse(rawSession);
      if (sessionObj && sessionObj.email) {
        chrome.runtime.sendMessage({
          type: 'SENTINEL_WEB_SESSION',
          session: sessionObj
        });
      }
    }
  } catch (err) {
    // Ignore cross-origin storage errors
  }
}

// Run session check on load and observe DOM changes
detectSentinelWebAppSession();
injectSentinelIcons();
const observer = new MutationObserver(injectSentinelIcons);
observer.observe(document.body, { childList: true, subtree: true });

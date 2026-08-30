# 🛡️ SentinelVault Chrome Extension (Manifest V3)

The **SentinelVault Chrome Extension** brings zero-knowledge password management, instant domain search, CSPRNG password generation, and **1-Click Web Form Auto-Fill** directly into your Google Chrome browser!

---

## 🌟 Key Features

1. **⚡ 1-Click Form Auto-Fill**: Detects username and password fields on any website (e.g., GitHub, Google, Twitter) and auto-fills your stored credentials in 1 click.
2. **🔍 Domain-Matched Instant Search**: Automatically detects your active tab domain (e.g. `github.com`) and displays matching credentials.
3. **🔑 Built-in CSPRNG Password Generator**: Generate cryptographically secure passwords on the fly with custom length and character set sliders.
4. **🔒 Zero-Knowledge Security**: Your Master Password and decryption keys are processed locally in your browser using WebCrypto (`PBKDF2-HMAC-SHA256` 100k rounds + `AES-256-GCM`). Plaintext credentials are **never** sent to the server.
5. **☁️ Seamless Server Sync**: Syncs with your SentinelVault backend server (Local `http://localhost:3001` or Cloud Render URL).

---

## 🛠️ How to Load into Chrome (Step-by-Step)

1. Open **Google Chrome**.
2. Navigate to `chrome://extensions` in your address bar (or go to **Menu** ➔ **Extensions** ➔ **Manage Extensions**).
3. Toggle on **Developer mode** in the top-right corner.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the `extension/` folder inside your `password_genrator` repository:
   ```
   /Users/piyush.anand/self_code/password_genrator/extension
   ```
6. The **SentinelVault Extension** icon 🛡️ will now appear in your Chrome toolbar!

---

## 🚀 How to Use

1. **Unlock Vault**: Click the 🛡️ extension icon in your Chrome toolbar and enter your Master Password.
2. **Auto-Fill Login Credentials**:
   - Navigate to any login page.
   - Click the 🛡️ extension icon ➔ Click **⚡ Fill** next to the credential matching the website.
3. **Generate Passwords**: Click the **🔑 Generator** tab in the extension popup to generate passwords for new signups.

---

*SentinelVault Extension v2.0.0 (Manifest V3)*

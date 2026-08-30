# 🔐 SentinelVault: Zero-Knowledge Password Manager & Generator

> **Vault Computational Engines & System Design Showcase Project**  
> A high-performance, zero-knowledge password vault and cryptographically secure generator built with **Vite, React, TypeScript, Node.js, Express, and MongoDB**.  

---

## 🌟 Key System Highlights

- **🔒 Zero-Knowledge Security Architecture**: Master Passwords and Encryption Keys **NEVER** leave the client browser. Plaintext credentials never touch the network or database.
- **🎟️ Dual-Token JWT Authentication (Access + Refresh Tokens)**: Short-lived JWT Access Tokens (`15m`) and long-lived Refresh Tokens (`7d`) with automatic renewal via `/api/v1/auth/refresh`.
- **🔐 Passport OAuth 2.0 & Immutable `providerId` Indexing**: Google & GitHub OAuth 2.0 integration indexed by immutable provider account IDs (`providerId`), automatically syncing user email updates without account duplication.
- **🛡️ Role-Based Access Control (RBAC)**: Backend `requireAdmin` middleware guarding telemetry endpoints (`/api/v1/admin/stats`) and conditionally rendering Admin Console tools for `role === 'admin'`.
- **🍃 MongoDB Mongoose ODM & Persistent Fallback**: Persists user accounts and encrypted vault blobs directly to MongoDB Atlas. Includes an automatic **Persistent File Database Fallback** (`server/data/db.json`) if running offline without a local MongoDB daemon.
- **📊 System Admin Console Dashboard**: Live zero-knowledge telemetry dashboard (`/api/v1/admin/stats`) monitoring registered account counts, encrypted blob volume, identity provider breakdown, and database health.
- **📈 Advanced Multi-Factor Password Strength Engine**: Multi-metric strength evaluation integrating Shannon Entropy ($H = L \log_2 R$), keyboard walk detection (`qwerty`, `12345`), repeating pattern detection (`aaaa`), dictionary breach lookup, and interactive visual risk audit tags.
- **🔒 Secure Session Restoration (`GET /api/v1/auth/me`)**: Eliminates identity leaks in URL query strings by using secure session cookies and clean OAuth return URLs (`/?oauth=success`).
- **🚀 Production Computational Engines (`src/engines/`)**:
  - **Trie Engine** for $O(K)$ instant search and auto-complete over thousands of vault entries.
  - **Bloom Filter Engine** for zero-latency, offline password breach & weakness checking ($m = 958,505$ bits, $k = 7$ MurmurHash3-lite).
  - **Fisher-Yates & CSPRNG Rejection Sampler Engine** for unbiased password generation.
  - **LRU Cache Engine** with automatic TTL eviction and V8 memory sanitation.
  - **Levenshtein Distance Engine** for vault password reuse & similarity auditing.
- **🌐 Offline-First Synchronization**: Locally persistent encrypted IndexedDB vault with automatic Last-Write-Wins (LWW) CRDT conflict resolution when reconnecting.
- **🛠️ System Design & Engine Live Inspector**: Built-in interactive visualizer panel allowing reviewers and interviewers to inspect algorithm execution and key derivation pipelines live!

---

## 📐 System Architecture Overview

```
                                  CLIENT BROWSER
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                                                                         │
    │   ┌────────────────────┐    (Async)    ┌─────────────────────────────┐  │
    │   │  React + TS Dashboard  ├──────────────►│ Web Worker Crypto Engine│  │
    │   └─────────┬──────────┘               │ (PBKDF2 + AES-256-GCM)      │  │
    │             │                          └──────────────┬──────────────┘  │
    │             ▼                                         │                 │
    │   ┌──────────────────────────────────────────┐        │ Encrypted       │
    │   │         Vault Computational Engines      │        │ Vault Blobs     │
    │   │ ├─ Trie Engine (O-K Search)              │        ▼                 │
    │   │ ├─ Bloom Filter Engine (Breach Check)    │ ┌──────────────┐         │
    │   │ ├─ Strength Engine (Entropy & Walks)     │ │ Encrypted    │         │
    │   │ ├─ LRU Cache Engine (Memory Hygiene)     │ │ IndexedDB    │         │
    │   │ ├─ CSPRNG Rejection Sampler Engine       │ └──────────────┘         │
    │   │ └─ Levenshtein DP Engine (Audit)         │                          │
    │   └──────────────────────────────────────────┘                          │
    └─────────────────────────────────────┬───────────────────────────────────┘
                                          │ Bearer JWT (Auth Hash & Ciphertext ONLY)
                                          ▼
                                      Cloud Tier
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  ┌─────────────────────────────────┐      ┌──────────────────────────┐  │
    │  │ Express Layered Backend Service │◄────►│ MongoDB Atlas / File DB  │  │
    │  │  ├─ JWT Access & Refresh Tokens │      │  (Encrypted Blobs Only)  │  │
    │  │  ├─ Passport Google/GitHub OAuth│      └──────────────────────────┘  │
    │  │  ├─ RBAC requireAdmin Guard     │                                    │
    │  │  ├─ Token Bucket Rate Limiter   │                                    │
    │  │  └─ Serves Vite Static Build    │                                    │
    │  └─────────────────────────────────┘                                    │
    └─────────────────────────────────────────────────────────────────────────┘
```

For comprehensive architectural specifications, view the full [`architecture.md`](architecture.md).

---

## 🧮 High-Performance Computational Engines (`src/engines/`)

| Engine Module | Use Case in Project | Complexity / Parameters |
| :--- | :--- | :--- |
| **`trie.ts` (Trie Engine)** | $O(K)$ Vault search & domain matching | **Search**: $O(K)$, **Space**: $O(N \cdot L)$ |
| **`bloomFilter.ts` (Bloom Filter)** | Offline breach & weak password check | **Size**: $m = 958,505$ bits ($117$ KB), **Hashes**: $k=7$, **False Positive Rate**: $<1\%$ |
| **`strengthEngine.ts` (Strength Engine)** | Shannon Entropy & pattern analysis | Multi-metric: $H = L \log_2 R$, keyboard walks (`qwerty`, `12345`), repeating sequences (`aaaa`) |
| **`generator.ts` (CSPRNG Sampler)** | Unbiased random byte selection | Eliminates modulo bias over `crypto.getRandomValues` |
| **`lruCache.ts` (LRU Cache)** | Secure decrypted vault memory cache | **Lookup/Eviction**: $O(1)$, **Security**: String reference clearing for V8 GC sweep |
| **`levenshtein.ts` (Levenshtein DP)** | Password similarity & reuse detection | **Time**: $O(\|S_1\| \cdot \|S_2\|)$, **Space**: $O(\|S_1\| \cdot \|S_2\|)$ |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB** (Optional): MongoDB Atlas URI or local MongoDB daemon *(Falls back automatically to persistent local file DB `server/data/db.json` if MongoDB is offline)*

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/creatorpiyush/password_genrator.git
   cd password_genrator
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Configured parameters in `.env`:
   ```env
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   SESSION_SECRET=sentinel_vault_session_secret_2026
   JWT_ACCESS_SECRET=sentinel_jwt_access_secret_2026_super_secure
   JWT_REFRESH_SECRET=sentinel_jwt_refresh_secret_2026_super_secure

   # Optional Google OAuth 2.0 Credentials
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback

   # Optional GitHub OAuth 2.0 Credentials
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GITHUB_CALLBACK_URL=http://localhost:3001/api/v1/auth/github/callback
   ```

4. **Run both Frontend & Server concurrently**:
   ```bash
   npm run dev:all
   ```
   Open `http://localhost:5173` in your browser.

5. **Run Test Suite**:
   ```bash
   npm test
   ```

6. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

---

## 📄 License & Author

- **Author**: Piyush Anand ([@creatorpiyush](https://github.com/creatorpiyush))
- **Website**: [piyushanand.in](https://piyushanand.in)
- **License**: MIT License

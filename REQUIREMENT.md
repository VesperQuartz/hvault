Build a Chrome Extension Password Manager with the following specifications:

## Tech Stack
- Chrome Extension: React + Vite + TypeScript (Manifest V3)
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL with Drizzle ORM
- Key Management: AWS KMS
- Audit Logging: Hedera HCS using @hashgraph/sdk
- Auth: JWT + bcrypt

## Code Style Rules
- Always use arrow functions everywhere
- TypeScript everywhere

## What to Build

### Backend
- Drizzle schema with users, vault_items and audit_logs tables
- Hedera HCS helper that creates a unique topic per user on signup and logs every vault action (SAVE, READ, UPDATE, DELETE) to that topic
- AWS KMS helper that creates a unique key per user on signup, used to protect the master encryption key
- Auth routes for register and login using JWT and bcrypt
- Vault CRUD routes that are all protected, all log to Hedera HCS after every action
- An audit route that returns the user's full action history

### Chrome Extension
- Manifest V3 setup with popup, content script and background service worker
- Client side AES-256-GCM encryption using Web Crypto API so passwords are encrypted in the browser before ever reaching the server
- The master password used for encryption never leaves the browser and is never sent to the server
- Popup UI with login/register screen and a vault screen showing passwords for the current site
- Ability to save a new password for the current site
- One click autofill that fills in username and password fields on the current page
- Background service worker handles auth token storage in chrome.storage.local
- Master password lives in React memory only, cleared on logout

## Key Behaviours
- On register: create Hedera topic, create KMS key, hash password, store user
- On save password: encrypt in browser, send blob to server, server logs to HCS
- On retrieve password: server returns blob, browser decrypts it
- Every action on the vault must be logged to the user's personal Hedera HCS topic

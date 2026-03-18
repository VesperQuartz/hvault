[![MediVault](https://img.youtube.com/vi/m6Ow-rSQMbI/0.jpg)](https://www.youtube.com/watch?v=m6Ow-rSQMbI)
# hvault: Secure Medical Records Locker

## 1. Solution
**hvault** is a high-security medical records locker that empowers patients to own, manage, and share their health data with total privacy. The solution addresses the inherent risks of centralized medical databases by implementing a multi-layered security architecture.

At its core, hvault provides:
- **Encrypted Storage**: Every document is encrypted using per-user keys before reaching the cloud.
- **Blockchain Verification**: File fingerprints are stored on the **Hedera Hashgraph** to detect any unauthorized tampering.
- **Immutable Audit Trail**: A permanent, verifiable history of every action (view, share, or delete) is recorded on the **Hedera Consensus Service (HCS)**.
- **Secure Sharing**: Time-limited links and QR codes allow patients to share records with doctors without compromising the long-term security of their vault.

## 2. How it uses AWS KMS
hvault leverages **AWS Key Management Service (KMS)** as the foundation of its security model, implementing an industry-standard **Envelope Encryption** workflow.

- **Identity-Linked Key Management**: Upon registration, hvault automatically provisions a unique AWS KMS Customer Master Key for each user, ensuring that one user's data security is completely isolated from another's.
- **Dynamic Data Key Generation**: When a user uploads a record, hvault calls the `GenerateDataKey` API. AWS KMS returns a plaintext data key for immediate encryption and an encrypted version of that same key.
- **Zero-Persistence Plaintext**: The plaintext key is used to encrypt the file in the Cloudflare Worker's memory and is discarded immediately after; it is never stored in a database or written to disk.
- **Secure Retrieval**: To view or download a record, hvault uses the `Decrypt` API. AWS KMS validates the request and decrypts the stored data key, which is then used to unlock the medical record for the user.
- **Hardware-Level Security**: By using AWS KMS, hvault ensures that the master keys never leave AWS’s FIPS 140-2 Level 3 validated Hardware Security Modules.

## 3. Why does it matter?
Health data is the most sensitive information an individual possesses. hvault matters because:
- **Patient Sovereignty**: It shifts the power dynamic from hospital-owned silos to patient-owned vaults.
- **Protection Against Data Breaches**: Even if the primary storage or database is compromised, the data remains unreadable since the decryption keys are protected by AWS KMS and linked to the user's specific session.
- **Tamper Detection**: In an era of digital misinformation, the ability to prove a medical record hasn't been altered since the day it was uploaded via Hedera blockchain hashes is essential for medical trust.
- **Operational Efficiency**: It eliminates the friction of physical document handling while providing a digital-first experience that is more secure than traditional methods.

## 4. Setup instructions for demo access

To explore the **hvault** ecosystem locally, you will need:
- **Node.js** (v20+) and **PNPM**
- **AWS IAM credentials** with KMS permissions
- **Hedera Testnet account** (Account ID & Private Key)
- **Cloudflare account** (D1, R2, and KV bindings)

### Quick Start

1.  **Clone and Install**:
    ```bash
    git clone <repository-url>
    pnpm install
    ```

2.  **Configure Environment**:
    - In `apps/server`, create a `.dev.vars` file with your `AWS_KMS_ACCESS_KEY`, `AWS_KMS_ACCESS_SECRET`, and Hedera credentials.
    - In `apps/web`, create a `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8787`.

3.  **Initialize Database**:
    ```bash
    cd apps/server
    pnpm run db:local
    ```

4.  **Start the Services**:
    - **Hedera Microservice**: `cd apps/hedera-api && npm run dev` (Port 8000)
    - **Backend**: `cd apps/server && pnpm run dev` (Port 8787)
    - **Frontend**: `cd apps/web && pnpm run dev` (Port 3000)

5.  **Access the Demo**:
    Open [http://localhost:3000](http://localhost:3000) in your browser. Create an account to trigger the automatic AWS KMS key provisioning and Hedera topic creation.

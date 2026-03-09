hvault: Secure Medical Records Locker

1. Solution
hvault is a high-security medical records locker that empowers patients to own, manage, and share their health data with total privacy. The solution addresses the inherent risks of centralized medical databases by implementing a multi-layered security architecture.

At its core, hvault provides encrypted storage where every document is encrypted using per-user keys before reaching the cloud. It also includes blockchain verification where file fingerprints are stored on the Hedera Hashgraph to detect any unauthorized tampering. An immutable audit trail provides a permanent, verifiable history of every action like view, share, or delete, recorded on the Hedera Consensus Service. Secure sharing is enabled through time-limited links and QR codes that allow patients to share records with doctors without compromising the long-term security of their vault.

2. How it uses AWS KMS
hvault leverages AWS Key Management Service (KMS) as the foundation of its security model, implementing an industry-standard Envelope Encryption workflow.

Upon registration, hvault automatically provisions a unique AWS KMS Customer Master Key for each user, ensuring that one user's data security is completely isolated from another's. When a user uploads a record, hvault calls the GenerateDataKey API. AWS KMS returns a plaintext data key for immediate encryption and an encrypted version of that same key. The plaintext key is used to encrypt the file in the Cloudflare Worker's memory and is discarded immediately after; it is never stored in a database or written to disk. To view or download a record, hvault uses the Decrypt API. AWS KMS validates the request and decrypts the stored data key, which is then used to unlock the medical record for the user. By using AWS KMS, hvault ensures that the master keys never leave AWS’s FIPS 140-2 Level 3 validated Hardware Security Modules.

3. Why does it matter?
Health data is the most sensitive information an individual possesses. hvault matters because it shifts the power dynamic from hospital-owned silos to patient-owned vaults, providing patient sovereignty. It offers protection against data breaches because even if the primary storage or database is compromised, the data remains unreadable since the decryption keys are protected by AWS KMS and linked to the user's specific session. Tamper detection is another critical factor; in an era of digital misinformation, the ability to prove a medical record hasn't been altered since the day it was uploaded via Hedera blockchain hashes is essential for medical trust. Finally, it improves operational efficiency by eliminating the friction of physical document handling while providing a digital-first experience that is more secure than traditional methods.

4. Setup instructions for demo access

To explore the hvault ecosystem locally, you will need Node.js version 20 or higher and PNPM. You also need AWS IAM credentials with KMS permissions, a Hedera Testnet account, and a Cloudflare account with D1, R2, and KV bindings.

First, clone the repository and run pnpm install.

Second, configure the environment. In the apps/server directory, create a .dev.vars file with your AWS_KMS_ACCESS_KEY, AWS_KMS_ACCESS_SECRET, and Hedera credentials. In the apps/web directory, create a .env.local file with NEXT_PUBLIC_API_URL set to http://localhost:8787.

Third, initialize the database by going to the apps/server directory and running pnpm run db:local.

Fourth, start the services. Launch the Hedera Microservice in apps/hedera-api with npm run dev on port 8000. Start the backend in apps/server with pnpm run dev on port 8787. Finally, start the frontend in apps/web with pnpm run dev on port 3000.

Fifth, access the demo by opening http://localhost:3000 in your browser. Create an account to trigger the automatic AWS KMS key provisioning and Hedera topic creation.

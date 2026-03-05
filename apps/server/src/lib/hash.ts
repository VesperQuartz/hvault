import crypto from "node:crypto";

/**
 * File Hash Service
 * Provides SHA-256 hashing for Hedera fingerprinting
 */

/**
 * Hash a file buffer using SHA-256
 * Used for creating tamper-proof fingerprints on Hedera
 */
export function hashFile(fileBuffer: Buffer | ArrayBuffer | Uint8Array): string {
	let buffer: Buffer;
	if (Buffer.isBuffer(fileBuffer)) {
		buffer = fileBuffer;
	} else if (fileBuffer instanceof Uint8Array) {
		buffer = Buffer.from(fileBuffer.buffer, fileBuffer.byteOffset, fileBuffer.byteLength);
	} else {
		buffer = Buffer.from(fileBuffer);
	}

	const hash = crypto.createHash("sha256");
	hash.update(buffer);
	return hash.digest("hex");
}

/**
 * Verify a file matches its stored hash
 * Returns true if hash matches, false otherwise
 */
export function verifyFileHash(
	fileBuffer: Buffer | ArrayBuffer,
	expectedHash: string,
): boolean {
	const actualHash = hashFile(fileBuffer);
	return actualHash === expectedHash;
}

/**
 * Encrypt data using AES-256-GCM with a data key
 * Used for envelope encryption of files
 */
export function encryptWithDataKey(
	data: Buffer,
	dataKey: Buffer,
): {
	encrypted: Buffer;
	iv: Buffer;
	authTag: Buffer;
} {
	// Generate a random initialization vector
	const iv = crypto.randomBytes(16);

	// Create cipher
	const cipher = crypto.createCipheriv("aes-256-gcm", dataKey, iv);

	// Encrypt data
	const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

	// Get authentication tag
	const authTag = cipher.getAuthTag();

	return {
		encrypted,
		iv,
		authTag,
	};
}

/**
 * Decrypt data using AES-256-GCM with a data key
 * Used for envelope decryption of files
 */
export function decryptWithDataKey(
	encrypted: Buffer,
	dataKey: Buffer,
	iv: Buffer,
	authTag: Buffer,
): Buffer {
	// Create decipher
	const decipher = crypto.createDecipheriv("aes-256-gcm", dataKey, iv);

	// Set authentication tag
	decipher.setAuthTag(authTag);

	// Decrypt data
	const decrypted = Buffer.concat([
		decipher.update(encrypted),
		decipher.final(),
	]);

	return decrypted;
}

/**
 * Combine encrypted data, IV, and auth tag into a single buffer for storage
 * Format: [iv (16 bytes)][authTag (16 bytes)][encrypted data]
 */
export function packEncryptedData(
	encrypted: Buffer,
	iv: Buffer,
	authTag: Buffer,
): Buffer {
	return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Extract IV, auth tag, and encrypted data from a packed buffer
 */
export function unpackEncryptedData(packed: Buffer): {
	encrypted: Buffer;
	iv: Buffer;
	authTag: Buffer;
} {
	const iv = packed.subarray(0, 16);
	const authTag = packed.subarray(16, 32);
	const encrypted = packed.subarray(32);

	return {
		encrypted,
		iv,
		authTag,
	};
}

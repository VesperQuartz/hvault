import {
	CreateKeyCommand,
	DecryptCommand,
	EncryptCommand,
	GenerateDataKeyCommand,
	KMSClient,
} from "@aws-sdk/client-kms";

/**
 * AWS KMS Helper
 * Creates per-user encryption keys and handles encrypt/decrypt operations
 */

export interface KMSConfig {
	accessKeyId: string;
	secretAccessKey: string;
	region?: string;
}

export class KMSService {
	private client: KMSClient;

	constructor(config: KMSConfig) {
		this.client = new KMSClient({
			region: config.region || "us-east-1",
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
		});
	}

	/**
	 * Create a new KMS key for a user
	 * Returns the KeyId (ARN)
	 */
	async createUserKey(userId: string): Promise<string> {
		const command = new CreateKeyCommand({
			Description: `hvault-user-${userId}`,
			KeyUsage: "ENCRYPT_DECRYPT",
			Origin: "AWS_KMS",
			Tags: [
				{
					TagKey: "Application",
					TagValue: "hvault",
				},
				{
					TagKey: "UserId",
					TagValue: userId,
				},
			],
		});

		const response = await this.client.send(command);

		if (!response.KeyMetadata?.KeyId) {
			throw new Error("Failed to create KMS key");
		}

		return response.KeyMetadata.KeyId;
	}

	/**
	 * Encrypt data using a KMS key
	 * Used to protect the master key derivation material
	 */
	async encrypt(keyId: string, plaintext: string): Promise<string> {
		const command = new EncryptCommand({
			KeyId: keyId,
			Plaintext: Buffer.from(plaintext, "utf-8"),
		});

		const response = await this.client.send(command);

		if (!response.CiphertextBlob) {
			throw new Error("Failed to encrypt with KMS");
		}

		// Return base64 encoded ciphertext
		return Buffer.from(response.CiphertextBlob).toString("base64");
	}

	/**
	 * Decrypt data using KMS
	 */
	async decrypt(keyId: string, ciphertext: string): Promise<string> {
		const command = new DecryptCommand({
			KeyId: keyId,
			CiphertextBlob: Buffer.from(ciphertext, "base64"),
		});

		const response = await this.client.send(command);

		if (!response.Plaintext) {
			throw new Error("Failed to decrypt with KMS");
		}

		return Buffer.from(response.Plaintext).toString("utf-8");
	}

	/**
	 * Generate a data key for envelope encryption
	 * Returns both plaintext and encrypted versions of the key
	 * Use plaintext to encrypt file (then discard), store encrypted version
	 */
	async generateDataKey(keyId: string): Promise<{
		plaintextKey: Buffer;
		encryptedKey: string;
	}> {
		const command = new GenerateDataKeyCommand({
			KeyId: keyId,
			KeySpec: "AES_256",
		});

		const response = await this.client.send(command);

		if (!response.Plaintext || !response.CiphertextBlob) {
			throw new Error("Failed to generate data key");
		}

		return {
			plaintextKey: Buffer.from(response.Plaintext),
			encryptedKey: Buffer.from(response.CiphertextBlob).toString("base64"),
		};
	}

	/**
	 * Decrypt a data key using KMS
	 * Returns the plaintext key to decrypt file data
	 */
	async decryptDataKey(encryptedKey: string): Promise<Buffer> {
		const command = new DecryptCommand({
			CiphertextBlob: Buffer.from(encryptedKey, "base64"),
		});

		const response = await this.client.send(command);

		if (!response.Plaintext) {
			throw new Error("Failed to decrypt data key");
		}

		return Buffer.from(response.Plaintext);
	}
}

/**
 * Factory function to create KMSService from env
 */
export function createKMSService(env: {
	AWS_ACCESS_KEY?: string;
	AWS_ACCESS_SECRET?: string;
	AWS_REGION?: string;
}): KMSService {
	if (!env.AWS_ACCESS_KEY || !env.AWS_ACCESS_SECRET) {
		throw new Error("Missing AWS credentials in environment");
	}

	return new KMSService({
		accessKeyId: env.AWS_ACCESS_KEY,
		secretAccessKey: env.AWS_ACCESS_SECRET,
		region: env.AWS_REGION || "us-east-1",
	});
}

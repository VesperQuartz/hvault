import {
	AccountId,
	Client,
	PrivateKey,
	PublicKey,
	TopicCreateTransaction,
	TopicId,
	TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";
import {
	GetPublicKeyCommand,
	KMSClient,
	SignCommand,
} from "@aws-sdk/client-kms";
// @ts-ignore
import asn1 from "asn1.js";
import * as elliptic from "elliptic";
import keccak256 from "keccak256";

/**
 * Hedera HCS Helper with AWS KMS Signing
 * Provides file fingerprinting and audit logging using KMS-backed identity
 */

// ASN.1 parser for ECDSA signatures (KMS returns DER-encoded signatures)
const EcdsaSigAsnParse = asn1.define("EcdsaSig", function () {
	// @ts-ignore
	this.seq().obj(this.key("r").int(), this.key("s").int());
});

export interface HederaConfig {
	accountId: string;
	privateKey?: string;
	kmsKeyId?: string;
	awsConfig?: {
		accessKeyId: string;
		secretAccessKey: string;
		region: string;
	};
}

export interface AuditMessage {
	userId: string;
	action:
		| "UPLOAD"
		| "ACCESS"
		| "SHARE"
		| "DELETE"
		| "VERIFY"
		| "TAMPER_DETECTED"
		| "SAVE"
		| "READ"
		| "UPDATE"
		| "READ_ALL";
	recordId?: string;
	vaultItemId?: string;
	domain?: string;
	metadata?: Record<string, unknown>;
	timestamp: string;
}

export interface FileFingerprint {
	recordId: string;
	fileName: string;
	fileHash: string;
	fileSize: number;
	userId: string;
	timestamp: string;
}

export class HederaService {
	private client: Client | null = null;
	private kmsClient: KMSClient | null = null;
	private config: HederaConfig;

	constructor(config: HederaConfig) {
		this.config = config;
		// Initialize KMS client only if we have both key and config
		if (
			config.kmsKeyId &&
			config.awsConfig?.accessKeyId &&
			config.awsConfig?.secretAccessKey
		) {
			this.kmsClient = new KMSClient({
				credentials: {
					accessKeyId: config.awsConfig.accessKeyId,
					secretAccessKey: config.awsConfig.secretAccessKey,
				},
				region: config.awsConfig.region,
			});
		}
	}

	/**
	 * Initialize the Hedera client
	 * Handles both PrivateKey and KMS-based signing
	 */
	private async getClient(): Promise<Client> {
		if (this.client) return this.client;

		const accountId = AccountId.fromString(this.config.accountId);

		// KMS Flow: Only if kmsKeyId AND successfully initialized kmsClient exist
		if (this.config.kmsKeyId && this.kmsClient) {
			try {
				const keyId = this.config.kmsKeyId;

				// 1. Get public key from KMS
				const response = await this.kmsClient.send(
					new GetPublicKeyCommand({ KeyId: keyId }),
				);

				if (!response.PublicKey)
					throw new Error("Failed to get public key from KMS");

				// 2. Parse the public key (secp256k1)
				const ec = new elliptic.ec("secp256k1");
				let hexKey = Buffer.from(response.PublicKey).toString("hex");
				hexKey = hexKey.replace(
					"3056301006072a8648ce3d020106052b8104000a034200",
					"",
				);

				const ecKey = ec.keyFromPublic(hexKey, "hex");
				const publicKey = PublicKey.fromBytesECDSA(
					Buffer.from(ecKey.getPublic().encodeCompressed("hex"), "hex"),
				);

				// 3. Create the signer function
				const signer = async (message: Uint8Array) => {
					const hash = keccak256(Buffer.from(message));
					const signResponse = await this.kmsClient!.send(
						new SignCommand({
							KeyId: keyId,
							Message: hash,
							MessageType: "DIGEST",
							SigningAlgorithm: "ECDSA_SHA_256",
						}),
					);

					if (!signResponse.Signature) throw new Error("KMS signing failed");

					const decoded = EcdsaSigAsnParse.decode(
						Buffer.from(signResponse.Signature),
						"der",
					);
					const signature = new Uint8Array(64);
					signature.set(decoded.r.toArray("be", 32), 0);
					signature.set(decoded.s.toArray("be", 32), 32);

					return signature;
				};

				this.client = Client.forTestnet().setOperatorWith(
					accountId,
					publicKey,
					signer,
				);
				return this.client;
			} catch (e) {
				console.error(
					"[HederaService] KMS initialization failed, attempting fallback to private key:",
					e,
				);
				// If KMS fails, we fall through to the private key branch
			}
		}

		// Private Key Fallback
		if (this.config.privateKey) {
			const privateKey = PrivateKey.fromStringECDSA(this.config.privateKey);
			this.client = Client.forTestnet().setOperator(accountId, privateKey);
			return this.client;
		}

		throw new Error("No valid signing method found (AWS KMS or Private Key)");
	}

	/**
	 * Create a new topic for a user
	 */
	async createUserTopic(userId: string): Promise<string> {
		const client = await this.getClient();
		const transaction = await new TopicCreateTransaction()
			.setTopicMemo(`hvault-audit-${userId}`)
			.execute(client);

		const receipt = await transaction.getReceipt(client);
		if (!receipt.topicId) throw new Error("Failed to create Hedera topic");

		return receipt.topicId.toString();
	}

	/**
	 * Submit an audit message to user's topic
	 * Returns the transactionId and sequence number
	 */
	async submitAuditLog(
		topicId: string,
		message: AuditMessage,
	): Promise<{ transactionId: string; sequenceNumber: string }> {
		const client = await this.getClient();
		const topicIdObj = TopicId.fromString(topicId);
		const messageJson = JSON.stringify(message);

		const transaction = new TopicMessageSubmitTransaction()
			.setTopicId(topicIdObj)
			.setMessage(messageJson);

		const txResponse = await transaction.execute(client);
		const receipt = await txResponse.getReceipt(client);

		return {
			transactionId: txResponse.transactionId.toString(),
			sequenceNumber: receipt.topicSequenceNumber?.toString() || "0",
		};
	}

	/**
	 * Submit a file fingerprint to Hedera
	 */
	async submitFileFingerprint(
		topicId: string,
		fingerprint: FileFingerprint,
	): Promise<{ transactionId: string; sequenceNumber: string }> {
		const client = await this.getClient();
		const topicIdObj = TopicId.fromString(topicId);
		const messageJson = JSON.stringify({
			type: "FILE_FINGERPRINT",
			...fingerprint,
		});

		const transaction = new TopicMessageSubmitTransaction()
			.setTopicId(topicIdObj)
			.setMessage(messageJson);

		const txResponse = await transaction.execute(client);
		const receipt = await txResponse.getReceipt(client);

		return {
			transactionId: txResponse.transactionId.toString(),
			sequenceNumber: receipt.topicSequenceNumber?.toString() || "0",
		};
	}

	/**
	 * Submit an audit event for medical records
	 */
	async submitRecordAudit(
		topicId: string,
		action: AuditMessage["action"],
		userId: string,
		recordId?: string,
		metadata?: Record<string, unknown>,
	): Promise<{ transactionId: string; sequenceNumber: string }> {
		const message: AuditMessage = {
			userId,
			action,
			recordId,
			metadata,
			timestamp: new Date().toISOString(),
		};

		return this.submitAuditLog(topicId, message);
	}

	close() {
		if (this.client) {
			this.client.close();
		}
	}
}

/**
 * Factory function to create HederaService from env
 */
export function createHederaService(env: any): HederaService {
	// Standardize on the server's naming convention for consistency
	const config: HederaConfig = {
		accountId: env.HEDERA_ACCOUNT_ID,
		privateKey: env.HEDERA_PRIVATE_KEY,
		kmsKeyId: env.AWS_KMS_KEY_ID,
		awsConfig: {
			accessKeyId: env.AWS_ACCESS_KEY || env.AWS_KMS_ACCESS_KEY_ID,
			secretAccessKey:
				env.AWS_ACCESS_SECRET ||
				env.AWS_SECRET_KEY ||
				env.AWS_KMS_SECRET_ACCESS_KEY,
			region: env.AWS_REGION || env.AWS_KMS_REGION || "us-east-1",
		},
	};

	if (!config.accountId) {
		throw new Error("Missing HEDERA_ACCOUNT_ID in environment");
	}

	return new HederaService(config);
}

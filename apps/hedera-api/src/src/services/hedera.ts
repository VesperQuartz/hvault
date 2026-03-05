import {
	AccountId,
	Client,
	PrivateKey,
	TopicCreateTransaction,
	TopicId,
	TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";

/**
 * Hedera HCS Helper
 * Creates topics and submits audit messages to Hedera Consensus Service
 */

export interface HederaConfig {
	accountId: string;
	privateKey: string;
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
	private client: Client;

	constructor(config: HederaConfig) {
		const accountId = AccountId.fromString(config.accountId);
		const privateKey = PrivateKey.fromStringECDSA(config.privateKey);
		this.client = Client.forTestnet().setOperator(accountId, privateKey);
	}

	/**
	 * Create a new topic for a user
	 * Each user gets their own private audit log topic
	 */
	async createUserTopic(userId: string): Promise<string> {
		const transaction = await new TopicCreateTransaction()
			.setTopicMemo(`hvault-audit-${userId}`)
			.execute(this.client);

		try {
			const receipt = await transaction.getReceipt(this.client);

			if (!receipt.topicId) {
				throw new Error("Failed to create Hedera topic");
			}

			return receipt.topicId.toString();
		} catch (e) {
			console.error("POINT_ERROR", e);
			throw e;
		}
	}

	/**
	 * Submit an audit message to user's topic
	 * Returns the sequence number for verification
	 */
	async submitAuditLog(
		topicId: string,
		message: AuditMessage,
	): Promise<{ messageId: string; sequenceNumber: string }> {
		const topicIdObj = TopicId.fromString(topicId);
		const messageJson = JSON.stringify(message);

		const transaction = new TopicMessageSubmitTransaction()
			.setTopicId(topicIdObj)
			.setMessage(messageJson);

		const txResponse = await transaction.execute(this.client);
		const receipt = await txResponse.getReceipt(this.client);

		// Get transaction ID and sequence number
		const transactionId = txResponse.transactionId.toString();
		const sequenceNumber = receipt.topicSequenceNumber?.toString() || "0";

		return {
			messageId: transactionId,
			sequenceNumber,
		};
	}

	/**
	 * Submit a file fingerprint to Hedera
	 * Creates a permanent, tamper-proof record of the file's hash
	 */
	async submitFileFingerprint(
		topicId: string,
		fingerprint: FileFingerprint,
	): Promise<{ transactionId: string; sequenceNumber: string }> {
		const topicIdObj = TopicId.fromString(topicId);
		const messageJson = JSON.stringify({
			type: "FILE_FINGERPRINT",
			...fingerprint,
		});

		const transaction = new TopicMessageSubmitTransaction()
			.setTopicId(topicIdObj)
			.setMessage(messageJson);

		try {
			const txResponse = await transaction.execute(this.client);
			const receipt = await txResponse.getReceipt(this.client);
			const transactionId = txResponse.transactionId.toString();
			const sequenceNumber = receipt.topicSequenceNumber?.toString() || "0";

			return {
				transactionId,
				sequenceNumber,
			};
		} catch (e) {
			console.error("POINT_ERROR", e);
			throw e;
		}
	}

	/**
	 * Submit an audit event for medical records
	 * Specialized wrapper for common audit actions
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

		const result = await this.submitAuditLog(topicId, message);
		return {
			transactionId: result.messageId,
			sequenceNumber: result.sequenceNumber,
		};
	}

	/**
	 * Close the client connection
	 */
	close() {}
}

/**
 * Factory function to create HederaService from env
 */
export function createHederaService(env: {
	HEDERA_ACCOUNT_ID?: string;
	HEDERA_PRIVATE_KEY?: string;
}): HederaService {
	if (!env.HEDERA_ACCOUNT_ID || !env.HEDERA_PRIVATE_KEY) {
		throw new Error("Missing Hedera credentials in environment");
	}

	return new HederaService({
		accountId: env.HEDERA_ACCOUNT_ID,
		privateKey: env.HEDERA_PRIVATE_KEY,
	});
}

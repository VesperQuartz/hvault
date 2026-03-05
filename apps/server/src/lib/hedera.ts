import ky from "ky";

/**
 * Hedera HCS Proxy - Client Version
 * This file no longer uses the Hedera SDK directly.
 * Instead, it proxies all requests to the hedera-api microservice.
 */

export interface HederaConfig {
	api_url: string;
}

export const STATE = [
	"UPLOAD",
	"ACCESS",
	"SHARE",
	"DELETE",
	"VERIFY",
	"TAMPER_DETECTED",
	"SAVE",
	"READ",
	"UPDATE",
	"READ_ALL",
] as const;

export type StateItem = (typeof STATE)[number];

export interface AuditMessage {
	userId: string;
	action: StateItem;
	recordId?: string;
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

/**
 * HederaService Proxy
 * Maintains the same interface as the SDK version but routes to the API
 */
export class HederaService {
	private client: typeof ky;

	constructor(config: HederaConfig) {
		this.client = ky.create({
			prefixUrl: `${config.api_url}/api`,
		});
	}

	/**
	 * Create a new topic for a user
	 */
	async createUserTopic(userId: string): Promise<string> {
		const result = await this.client
			.post("hedera/topic", {
				json: { userId },
			})
			.json<string>();
		return result;
	}

	/**
	 * Submit an audit message to user's topic
	 */
	async submitAuditLog(
		topicId: string,
		message: AuditMessage,
	): Promise<{ messageId: string; sequenceNumber: string }> {
		const result = await this.client
			.post("hedera/audit", {
				json: {
					topicId,
					...message,
				},
			})
			.json<any>();

		return {
			messageId: result.transactionId,
			sequenceNumber: result.sequenceNumber,
		};
	}

	/**
	 * Submit a file fingerprint to Hedera
	 */
	async submitFileFingerprint(
		topicId: string,
		fingerprint: FileFingerprint,
	): Promise<{ transactionId: string; sequenceNumber: string }> {
		const result = await this.client
			.post("hedera/fingerprint", {
				json: {
					topicId,
					...fingerprint,
				},
			})
			.json<any>();

		return result;
	}

	/**
	 * Submit an audit event for medical records
	 */
	async submitRecordAudit(
		topicId: string,
		action: StateItem,
		userId: string,
		recordId?: string,
		metadata?: Record<string, unknown>,
	): Promise<{ transactionId: string; sequenceNumber: string }> {
		const result = await this.client
			.post("hedera/audit", {
				json: {
					topicId,
					action,
					userId,
					recordId,
					metadata,
				},
			})
			.json<any>();

		return result;
	}

	close() {
		// No-op for the proxy version
	}
}

/**
 * Factory function to create HederaService from env
 */
export function createHederaService(env: any): HederaService {
	// Use the HEDERA_API_URL from the environment bindings
	return new HederaService({
		api_url: env.HEDERA_API_URL || "http://localhost:8000",
	});
}

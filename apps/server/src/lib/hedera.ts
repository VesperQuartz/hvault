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
		console.log(`[HederaService] Initializing with API URL: ${config.api_url}/api`);
		this.client = ky.create({
			prefixUrl: `${config.api_url}/api`,
			timeout: 60000, // 60 second timeout for slow blockchain transactions
			hooks: {
				beforeError: [
					async (error) => {
						const { response } = error;
						if (response) {
							try {
								const body = await response.json();
								console.error("[HederaService] API Error Response:", body);
							} catch (e) {
								console.error("[HederaService] Could not parse error response");
							}
						}
						return error;
					},
				],
			},
		});
	}

	/**
	 * Create a new topic for a user
	 */
	async createUserTopic(userId: string): Promise<string> {
		try {
			// Pre-flight check to ensure API is reachable
			await this.client.get("health").catch(() => {
				console.warn("[HederaService] API health check failed, but proceeding...");
			});

			const result = await this.client
				.post("hedera/topic", {
					json: { userId },
				})
				.json<string>();
			return result;
		} catch (e) {
			console.error("[HederaService] createUserTopic failed:", e);
			throw e;
		}
	}

	/**
	 * Submit an audit message to user's topic
	 */
	async submitAuditLog(
		topicId: string,
		message: AuditMessage,
	): Promise<{ messageId: string; sequenceNumber: string }> {
		try {
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
		} catch (e) {
			console.error("[HederaService] submitAuditLog failed:", e);
			throw e;
		}
	}

	/**
	 * Submit a file fingerprint to Hedera
	 */
	async submitFileFingerprint(
		topicId: string,
		fingerprint: FileFingerprint,
	): Promise<{ transactionId: string; sequenceNumber: string }> {
		try {
			const result = await this.client
				.post("hedera/fingerprint", {
					json: {
						topicId,
						...fingerprint,
					},
				})
				.json<any>();

			return result;
		} catch (e) {
			console.error("[HederaService] submitFileFingerprint failed:", e);
			throw e;
		}
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
		try {
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
		} catch (e) {
			console.error("[HederaService] submitRecordAudit failed:", e);
			throw e;
		}
	}

	close() {
		// No-op for the proxy version
	}
}

/**
 * Factory function to create HederaService from env
 */
export function createHederaService(env: any): HederaService {
	// Prefer env binding, then fallback to common local dev URLs
	let api_url = env.HEDERA_API_URL || "http://127.0.0.1:8000";
	
	// CRITICAL: In many local environments, 'localhost' resolves to IPv6 [::1] 
	// while the server is listening on IPv4 127.0.0.1.
	// Forcing 127.0.0.1 fixes most "Network connection lost" errors.
	api_url = api_url.replace("localhost", "127.0.0.1");
	
	return new HederaService({ api_url });
}
